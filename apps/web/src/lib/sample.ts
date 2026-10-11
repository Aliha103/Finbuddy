// Every sample figure on the page comes from here, and everything here comes from the engine:
// createSampleData builds the same deterministic records the app's "Look around with sample data"
// uses, and the engine's own functions turn them into balances, plans, spending and insights.
// Nothing below types a number in.
import {
  CURRENCY_CODES,
  DEFAULT_CATEGORIES,
  SAMPLE_DATA_ANCHOR,
  addMonths,
  balancesByGroup,
  createSampleData,
  generateInsights,
  monthOf,
  monthOverMonth,
  pairwiseDebts,
  personalOverview,
  simplifyDebts,
  spendingByMonth,
  type CurrencyCode,
  type Insight,
  type Money,
  type MonthChange,
  type MonthlySpending,
  type PersonId,
  type Transfer,
} from '@finbuddy/shared';

import { lineColorFor, type LineColor } from './colors';

const snapshot = createSampleData();
const profile = snapshot.profiles[0];
if (!profile) throw new Error('Sample data has no profile');

/** The date the sample is built around, and the locale of the sample person's phone. */
export const SAMPLE_ANCHOR = SAMPLE_DATA_ANCHOR;
export const SAMPLE_LOCALE = profile.locale;
export const SAMPLE_CURRENCY: CurrencyCode = profile.defaultCurrency;
export const ME: PersonId = profile.personId;

/** Sample names end in "(sample)"; the page shows a Sample chip instead. */
export const plain = (name: string) => name.replace(/\s*\(sample\)\s*$/i, '');

export interface SamplePerson {
  readonly id: PersonId;
  readonly name: string;
}
export const PEOPLE: readonly SamplePerson[] = snapshot.people.map((p) => ({ id: p.id, name: plain(p.displayName) }));
const names = new Map(PEOPLE.map((p) => [p.id, p.name]));
export const nameOf = (id: PersonId): string => names.get(id) ?? 'Someone';

export interface GroupCard {
  readonly id: string;
  readonly name: string;
  readonly currency: CurrencyCode;
  readonly members: readonly string[];
  readonly line: LineColor;
  /** My net in the group's currency: negative means I owe. */
  readonly myNet: Money;
}

const groupBalances = balancesByGroup(snapshot.expenses, snapshot.settlements);

export const GROUPS: readonly GroupCard[] = snapshot.groups.map((g) => {
  const balances = groupBalances.find((b) => b.groupId === g.id);
  const mine = balances?.byCurrency.find((c) => c.currency === g.currency)?.balances.find((b) => b.personId === ME);
  return {
    id: g.id,
    name: plain(g.name),
    currency: g.currency,
    members: g.memberIds.map(nameOf),
    line: lineColorFor(g.id),
    myNet: mine?.net ?? { amountMinor: 0, currency: g.currency },
  };
});

/** What I owe and am owed, per currency, never summed: the Home card. */
export const OVERVIEW = personalOverview(ME, snapshot.expenses, snapshot.settlements);

/** My own share of spending per month in my default currency, six months to the anchor. */
const thisMonth = monthOf(SAMPLE_ANCHOR);
export const SPENDING: readonly MonthlySpending[] = spendingByMonth(snapshot.expenses, {
  personId: ME,
  currency: SAMPLE_CURRENCY,
  fromMonth: addMonths(thisMonth, -5),
  toMonth: thisMonth,
});
export const SPENDING_CHANGE: MonthChange | undefined = monthOverMonth(SPENDING).at(-1);
export const CURRENT_MONTH = thisMonth;

/** The settle-up diagram: the group whose debts simplify the most. */
function settleCase() {
  const candidates = snapshot.groups.map((g) => {
    const balances = groupBalances.find((b) => b.groupId === g.id);
    const pairwise = pairwiseDebts(snapshot.expenses, snapshot.settlements, { groupId: g.id });
    const plan = balances ? simplifyDebts(balances) : [];
    return { group: g, pairwise, plan };
  });
  candidates.sort((a, b) => b.pairwise.length - b.plan.length - (a.pairwise.length - a.plan.length));
  const best = candidates[0];
  if (!best) throw new Error('Sample data has no groups');
  return {
    name: plain(best.group.name),
    currency: best.group.currency,
    members: best.group.memberIds.map((id) => ({ id, name: nameOf(id) })),
    pairwise: best.pairwise as readonly Transfer[],
    plan: best.plan as readonly Transfer[],
  };
}
export const SETTLE = settleCase();

/** The insight that explains the month's jump: the category spike with the most spent this month. */
const insights = generateInsights({
  today: SAMPLE_ANCHOR,
  personId: ME,
  expenses: snapshot.expenses,
  settlements: snapshot.settlements,
  budgets: snapshot.budgets,
});
const amountOf = (insight: Insight, label: string): number => {
  const v = insight.basis.find((b) => b.label === label)?.value;
  return v && typeof v === 'object' && 'amountMinor' in v ? v.amountMinor : 0;
};
export const SPIKE: Insight | undefined = insights
  .filter((i) => i.kind === 'category_spike')
  .sort((a, b) => amountOf(b, 'thisMonth') - amountOf(a, 'thisMonth'))[0];

const categoryLabels = new Map<string, string>(DEFAULT_CATEGORIES.map((c) => [c.id, c.defaultLabel]));
export const categoryLabel = (id: string | null | undefined): string => (id ? (categoryLabels.get(id) ?? id.replace(/_/g, ' ')) : 'All spending');

export const CURRENCY_COUNT = CURRENCY_CODES.length;
