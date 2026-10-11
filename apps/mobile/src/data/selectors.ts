import {
  addMonths,
  balancesByGroup,
  compareLocalDate,
  firstDayOfMonth,
  generateInsights,
  lastDayOfMonth,
  monthOf,
  monthOverMonth,
  monthRange,
  personalOverview,
  simplifyDebts,
  spendingByCategory,
  spendingByMonth,
  spendingRecords,
  type Budget,
  type CategoryId,
  type CategorySpending,
  type CurrencyBalances,
  type CurrencyCode,
  type DataSnapshot,
  type Expense,
  type Group,
  type GroupBalances,
  type GroupId,
  type Insight,
  type LocalDate,
  type Money,
  type MonthChange,
  type MonthKey,
  type Person,
  type PersonId,
  type PersonalOverview,
  type Profile,
  type Settlement,
  type SpendingRecord,
  type Transfer,
} from '@finbuddy/shared';

/**
 * Pure, framework-free views over a DataSnapshot. Each result is cached per snapshot (and per
 * argument), so many components can ask for the same view without recomputing it.
 */
const cache = new WeakMap<DataSnapshot, Map<string, unknown>>();
function cached<T>(snapshot: DataSnapshot, key: string, compute: () => T): T {
  let entry = cache.get(snapshot);
  if (!entry) cache.set(snapshot, (entry = new Map()));
  if (!entry.has(key)) entry.set(key, compute());
  return entry.get(key) as T;
}

/** Newest first: by calendar date, then creation time, then id. */
function newestFirst<T extends { occurredOn: LocalDate; createdAt: string; id: string }>(a: T, b: T): number {
  return compareLocalDate(b.occurredOn, a.occurredOn) || (b.createdAt < a.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0) || (b.id < a.id ? -1 : b.id > a.id ? 1 : 0);
}

export function selectProfile(snapshot: DataSnapshot): Profile | null {
  return snapshot.profiles[0] ?? null;
}

export function selectPeople(snapshot: DataSnapshot): ReadonlyMap<PersonId, Person> {
  return cached(snapshot, 'people', () => new Map(snapshot.people.map((p) => [p.id, p])));
}

export function selectExpense(snapshot: DataSnapshot, expenseId: string): Expense | null {
  return cached(snapshot, `expense:${expenseId}`, () => snapshot.expenses.find((e) => e.id === expenseId) ?? null);
}

export function selectOverview(snapshot: DataSnapshot): PersonalOverview | null {
  const profile = selectProfile(snapshot);
  if (!profile) return null;
  return cached(snapshot, 'overview', () => personalOverview(profile.personId, snapshot.expenses, snapshot.settlements));
}

export function selectBalancesByGroup(snapshot: DataSnapshot): readonly GroupBalances[] {
  return cached(snapshot, 'balancesByGroup', () => balancesByGroup(snapshot.expenses, snapshot.settlements));
}

export interface GroupSummary {
  readonly group: Group;
  /** Per currency, every member listed (zero when settled), sorted by currency then person id. */
  readonly balances: readonly CurrencyBalances[];
  /** The profile owner's non-zero net per currency in this group (positive = owed to them). */
  readonly myNet: readonly Money[];
  /** The simplifyDebts settle-up plan for the whole group. */
  readonly plan: readonly Transfer[];
}

function summarise(group: Group, balances: GroupBalances | undefined, me: PersonId | null): GroupSummary {
  const byCurrency = (balances?.byCurrency ?? []).map((cb) => {
    const listed = new Set(cb.balances.map((b) => b.personId));
    const missing = group.memberIds.filter((id) => !listed.has(id)).map((personId) => ({ personId, net: { amountMinor: 0, currency: cb.currency } }));
    return { currency: cb.currency, balances: [...cb.balances, ...missing].sort((a, b) => (a.personId < b.personId ? -1 : a.personId > b.personId ? 1 : 0)) };
  });
  const myNet = byCurrency.flatMap((cb) => cb.balances.filter((b) => b.personId === me && b.net.amountMinor !== 0).map((b) => b.net));
  return { group, balances: byCurrency, myNet, plan: simplifyDebts(byCurrency) };
}

/** Every group (archived last), with balances and its settle-up plan. */
export function selectGroups(snapshot: DataSnapshot): readonly GroupSummary[] {
  return cached(snapshot, 'groups', () => {
    const me = selectProfile(snapshot)?.personId ?? null;
    const balances = selectBalancesByGroup(snapshot);
    return [...snapshot.groups]
      .sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name))
      .map((group) => summarise(group, balances.find((g) => g.groupId === group.id), me));
  });
}

export interface GroupDetail extends GroupSummary {
  /** Members in the group's order. */
  readonly members: readonly Person[];
  readonly expenses: readonly Expense[];
  /** Every settlement in the group, newest first. */
  readonly settlements: readonly Settlement[];
  /** Pending settlements: recorded but not confirmed, so not yet in the balances. */
  readonly pending: readonly Settlement[];
}

export function selectGroup(snapshot: DataSnapshot, groupId: GroupId): GroupDetail | null {
  return cached(snapshot, `group:${groupId}`, () => {
    const summary = selectGroups(snapshot).find((g) => g.group.id === groupId);
    if (!summary) return null;
    const people = selectPeople(snapshot);
    const settlements = snapshot.settlements.filter((s) => s.groupId === groupId).sort(newestFirst);
    return {
      ...summary,
      members: summary.group.memberIds.map((id) => people.get(id)).filter((p): p is Person => p !== undefined),
      expenses: snapshot.expenses.filter((e) => e.groupId === groupId).sort(newestFirst),
      settlements,
      pending: settlements.filter((s) => s.status === 'pending'),
    };
  });
}

export interface SettleUpItem {
  readonly groupId: GroupId;
  readonly transfer: Transfer;
}

/** Steps of every group's settle-up plan that involve the profile owner. */
export function selectMySettleUps(snapshot: DataSnapshot): readonly SettleUpItem[] {
  return cached(snapshot, 'mySettleUps', () => {
    const me = selectProfile(snapshot)?.personId;
    if (!me) return [];
    return selectGroups(snapshot)
      .filter((g) => !g.group.archived)
      .flatMap((g) => g.plan.filter((t) => t.from === me || t.to === me).map((transfer) => ({ groupId: g.group.id, transfer })));
  });
}

/** Pending settlements the profile owner pays or receives, newest first. */
export function selectMyPending(snapshot: DataSnapshot): readonly Settlement[] {
  return cached(snapshot, 'myPending', () => {
    const me = selectProfile(snapshot)?.personId;
    return snapshot.settlements.filter((s) => s.status === 'pending' && (s.fromPersonId === me || s.toPersonId === me)).sort(newestFirst);
  });
}

export type ActivityItem =
  | { readonly kind: 'expense'; readonly id: string; readonly date: LocalDate; readonly expense: Expense }
  | { readonly kind: 'settlement'; readonly id: string; readonly date: LocalDate; readonly settlement: Settlement };

/** Expenses and settlements together, newest first. */
export function selectActivity(snapshot: DataSnapshot): readonly ActivityItem[] {
  return cached(snapshot, 'activity', () => {
    const items: (ActivityItem & { createdAt: string; occurredOn: LocalDate })[] = [
      ...snapshot.expenses.map((expense) => ({ kind: 'expense' as const, id: expense.id, date: expense.occurredOn, occurredOn: expense.occurredOn, createdAt: expense.createdAt, expense })),
      ...snapshot.settlements.map((settlement) => ({
        kind: 'settlement' as const,
        id: settlement.id,
        date: settlement.occurredOn,
        occurredOn: settlement.occurredOn,
        createdAt: settlement.createdAt,
        settlement,
      })),
    ];
    return items.sort(newestFirst);
  });
}

export function selectInsights(snapshot: DataSnapshot, today: LocalDate): readonly Insight[] {
  const profile = selectProfile(snapshot);
  if (!profile) return [];
  return cached(snapshot, `insights:${today}`, () =>
    generateInsights({ today, personId: profile.personId, expenses: snapshot.expenses, settlements: snapshot.settlements, budgets: snapshot.budgets }),
  );
}

export interface CurrencySpending {
  readonly currency: CurrencyCode;
  /** This month up to today, by category, largest first. */
  readonly thisMonth: readonly CategorySpending[];
  /** The whole of last month, by category, largest first. */
  readonly lastMonth: readonly CategorySpending[];
  /** One entry per month of the window, oldest first, with the change from the month before. */
  readonly monthly: readonly MonthChange[];
}

export interface SpendingSummary {
  readonly today: LocalDate;
  readonly thisMonth: MonthKey;
  readonly lastMonth: MonthKey;
  readonly months: readonly MonthKey[];
  /** Currencies with any spending in the window; the profile's default currency first. */
  readonly byCurrency: readonly CurrencySpending[];
}

/** The profile owner's own share of spending (personal and group) for the last `monthCount` months. */
export function selectSpending(snapshot: DataSnapshot, today: LocalDate, monthCount = 6): SpendingSummary | null {
  const profile = selectProfile(snapshot);
  if (!profile) return null;
  return cached(snapshot, `spending:${today}:${monthCount}`, () => {
    const personId = profile.personId;
    const thisMonth = monthOf(today);
    const lastMonth = addMonths(thisMonth, -1);
    const firstMonth = addMonths(thisMonth, -(monthCount - 1));
    const series = spendingByMonth(snapshot.expenses, { personId, fromMonth: firstMonth, toMonth: thisMonth });
    const currencies = [...new Set(series.filter((m) => m.total.amountMinor !== 0).map((m) => m.total.currency))].sort((a, b) =>
      a === profile.defaultCurrency ? -1 : b === profile.defaultCurrency ? 1 : a < b ? -1 : a > b ? 1 : 0,
    );
    return {
      today,
      thisMonth,
      lastMonth,
      months: monthRange(firstMonth, thisMonth),
      byCurrency: currencies.map((currency) => ({
        currency,
        thisMonth: spendingByCategory(snapshot.expenses, { personId, currency, from: firstDayOfMonth(thisMonth), to: today }),
        lastMonth: spendingByCategory(snapshot.expenses, { personId, currency, from: firstDayOfMonth(lastMonth), to: lastDayOfMonth(lastMonth) }),
        monthly: monthOverMonth(series.filter((m) => m.total.currency === currency)),
      })),
    };
  });
}

/** Budgets, the all-spending budget first, then by category id. */
export function selectBudgets(snapshot: DataSnapshot): readonly Budget[] {
  return cached(snapshot, 'budgets', () =>
    [...snapshot.budgets].sort((a, b) => (a.categoryId === null ? -1 : b.categoryId === null ? 1 : a.categoryId < b.categoryId ? -1 : a.categoryId > b.categoryId ? 1 : 0)),
  );
}

/**
 * The profile owner's own share of every expense in one category and currency, newest first
 * (the category screen). `categoryId` null means every category.
 */
export function selectCategoryRecords(snapshot: DataSnapshot, categoryId: CategoryId | null, currency: CurrencyCode): readonly SpendingRecord[] {
  const profile = selectProfile(snapshot);
  if (!profile) return [];
  return cached(snapshot, `categoryRecords:${categoryId ?? '*'}:${currency}`, () =>
    spendingRecords(snapshot.expenses, { personId: profile.personId, currency, ...(categoryId === null ? {} : { categoryId }) })
      .slice()
      .sort((a, b) => newestFirst(a.expense, b.expense)),
  );
}
