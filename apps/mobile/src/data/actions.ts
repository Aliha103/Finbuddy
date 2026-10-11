import {
  DataValidationError,
  ExpenseValidationError,
  buildExpense,
  createBudget as makeBudget,
  createGroup as makeGroup,
  createPerson as makePerson,
  createProfile as makeProfile,
  createSettlement,
  deletionIssues,
  emptySnapshot,
  groupUpdateIssues,
  isCurrencyCode,
  peopleInExpense,
  serializeSnapshot,
  todayLocal,
  type Budget,
  type BudgetId,
  type CategoryId,
  type CurrencyCode,
  type DataSnapshot,
  type Expense,
  type ExpenseDraft,
  type ExpenseId,
  type ExpenseIssue,
  type Group,
  type GroupId,
  type LocalDate,
  type Money,
  type Person,
  type PersonId,
  type Profile,
  type Settlement,
  type SettlementId,
  type SettlementMethod,
  type Transfer,
} from '@finbuddy/shared';

import { newId } from './ids';
import { applySnapshot, freshSampleData, useDataStore } from './store';

/**
 * Write actions. Everything goes through the Repository, which validates and notifies the
 * store; screens never mutate data directly.
 */
function repo() {
  return useDataStore.getState().repository;
}

const now = () => new Date().toISOString();

async function currentProfile(): Promise<Profile | null> {
  const [profile] = await repo().profiles.list();
  return profile ?? null;
}

async function requireProfile(): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) throw new Error('No profile on this device yet. Finish onboarding first.');
  return profile;
}

// ---------------------------------------------------------------------------------------------
// Onboarding and starting over

export interface StartFreshInput {
  readonly displayName: string;
  readonly defaultCurrency: CurrencyCode;
  /** BCP 47 tag the device formats with, e.g. "en-GB". */
  readonly locale: string;
}

/**
 * "Start with your own money": a person record for the owner and a profile, on an otherwise
 * empty snapshot. Replaces whatever was there (including sample data), so it is also the way
 * from the sample set to a real one. Throws RangeError on an empty name or unknown currency.
 */
export async function startFresh(input: StartFreshInput): Promise<Profile> {
  const person = makePerson({ displayName: input.displayName }, { ids: newId });
  const profile = makeProfile({ personId: person.id, displayName: input.displayName, defaultCurrency: input.defaultCurrency, locale: input.locale }, { ids: newId });
  await applySnapshot({ ...emptySnapshot(), people: [person], profiles: [profile] });
  return profile;
}

/**
 * "Look around with sample data": seeds the labelled sample set when this device has no data.
 * The store never seeds on its own (boot leaves an empty device empty), so this is the one
 * place a first launch gets sample data. A device that already has data is left untouched.
 */
export async function keepSampleData(): Promise<void> {
  if (await currentProfile()) return;
  await applySnapshot(freshSampleData());
}

/** Removes every record on this device. The index route then returns to onboarding. */
export function deleteAllData(): Promise<void> {
  return applySnapshot(emptySnapshot());
}

/**
 * "Remove sample data": drops every record marked isSample. When the profile itself is sample the
 * whole set goes, which lands on onboarding; otherwise only labelled records disappear.
 */
export async function removeSampleData(): Promise<void> {
  const snapshot = await repo().snapshot();
  const keep = <T extends { readonly isSample?: true }>(records: readonly T[]) => records.filter((r) => !r.isSample);
  await applySnapshot({
    profiles: keep(snapshot.profiles),
    people: keep(snapshot.people),
    groups: keep(snapshot.groups),
    expenses: keep(snapshot.expenses),
    settlements: keep(snapshot.settlements),
    budgets: keep(snapshot.budgets),
  });
}

/** The whole snapshot as the versioned JSON envelope (`serializeSnapshot`), for the share sheet. */
export async function exportData(): Promise<string> {
  return serializeSnapshot(await repo().snapshot());
}

// ---------------------------------------------------------------------------------------------
// Profile

export type ProfilePatch = Partial<Pick<Profile, 'displayName' | 'defaultCurrency' | 'locale'>>;

/** Updates the profile; a new display name is written to the owner's person record too, so groups show it. */
export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  const repository = repo();
  const profile = await requireProfile();
  const displayName = patch.displayName === undefined ? profile.displayName : patch.displayName.trim();
  if (!displayName) throw new RangeError('displayName must not be empty');
  if (patch.defaultCurrency !== undefined && !isCurrencyCode(patch.defaultCurrency)) throw new RangeError(`Unsupported currency code: ${String(patch.defaultCurrency)}`);
  const stamp = now();
  if (displayName !== profile.displayName) {
    const person = await repository.people.get(profile.personId);
    if (person) await repository.people.put({ ...person, displayName, updatedAt: stamp });
  }
  return repository.profiles.put({ ...profile, ...patch, displayName, updatedAt: stamp });
}

// ---------------------------------------------------------------------------------------------
// People and groups

export interface AddPersonInput {
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
}

/** Someone money is shared with who does not have the app (yet). */
export function addPerson(input: AddPersonInput): Promise<Person> {
  return repo().people.put(makePerson(input, { ids: newId }));
}

export interface CreateGroupInput {
  readonly name: string;
  readonly currency: CurrencyCode;
  /** Existing people to add; the profile owner is always a member and goes first. */
  readonly memberIds?: readonly PersonId[];
  /** Names of people without the app, created as person records before the group. */
  readonly newMemberNames?: readonly string[];
}

/** Creates a group (the factory plus `addPerson` for each new member). */
export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const repository = repo();
  const profile = await requireProfile();
  const created: Person[] = [];
  for (const name of input.newMemberNames ?? []) created.push(await addPerson({ displayName: name }));
  const group = makeGroup(
    { name: input.name, currency: input.currency, createdBy: profile.personId, memberIds: [...(input.memberIds ?? []), ...created.map((p) => p.id)] },
    { ids: newId },
  );
  return repository.groups.put(group);
}

export type GroupPatch = Partial<Pick<Group, 'name' | 'currency' | 'memberIds' | 'archived'>>;

export type GroupUpdateResult =
  | { readonly ok: true; readonly group: Group }
  /** `problems` are the engine's messages; `blockedMemberIds` are members who cannot leave because they are still in expenses. */
  | { readonly ok: false; readonly problems: readonly string[]; readonly blockedMemberIds: readonly PersonId[] };

/** Renames, re-currencies, changes members or archives a group, refusing to drop a member who still appears in its expenses. */
export async function updateGroup(id: GroupId, patch: GroupPatch): Promise<GroupUpdateResult> {
  const repository = repo();
  const group = await repository.groups.get(id);
  if (!group) return { ok: false, problems: ['That group no longer exists.'], blockedMemberIds: [] };
  const name = patch.name === undefined ? group.name : patch.name.trim();
  if (!name) return { ok: false, problems: ['Give the group a name.'], blockedMemberIds: [] };
  if (patch.currency !== undefined && !isCurrencyCode(patch.currency)) return { ok: false, problems: ['Choose a currency from the list.'], blockedMemberIds: [] };
  const memberIds = patch.memberIds ? [...new Set([group.createdBy, ...patch.memberIds])] : group.memberIds;
  const next: Group = { ...group, ...patch, name, memberIds, updatedAt: now() };
  const expenses = await repository.expenses.list((e) => e.groupId === id);
  const problems = groupUpdateIssues(next, expenses);
  if (problems.length) {
    const removed = group.memberIds.filter((m) => !memberIds.includes(m));
    const blockedMemberIds = removed.filter((m) => expenses.some((e) => peopleInExpense(e).includes(m)));
    return { ok: false, problems, blockedMemberIds };
  }
  try {
    return { ok: true, group: await repository.groups.put(next) };
  } catch (error) {
    if (error instanceof DataValidationError) return { ok: false, problems: error.issues.map((i) => i.problem), blockedMemberIds: [] };
    throw error;
  }
}

/** Archives (or restores) a group; archived groups keep their history and sort last. */
export function archiveGroup(id: GroupId, archived = true): Promise<GroupUpdateResult> {
  return updateGroup(id, { archived });
}

// ---------------------------------------------------------------------------------------------
// Expenses

export type AddExpenseResult =
  | { readonly ok: true; readonly expense: Expense }
  /** `issues` are field-level problems (map `code` to copy); `problems` are data-integrity messages. */
  | { readonly ok: false; readonly issues: readonly ExpenseIssue[]; readonly problems: readonly string[] };

async function memberIdsFor(groupId: GroupId | null | undefined): Promise<{ memberIds?: readonly PersonId[] } | null> {
  if (!groupId) return {};
  const group = await repo().groups.get(groupId);
  return group ? { memberIds: group.memberIds } : null;
}

function expenseFailure(error: unknown): AddExpenseResult {
  if (error instanceof ExpenseValidationError) return { ok: false, issues: error.issues, problems: [] };
  if (error instanceof DataValidationError) return { ok: false, issues: [], problems: error.issues.map((i) => i.problem) };
  throw error;
}

/**
 * Builds (resolving the split to exact shares), validates and saves an expense. For a group
 * expense every payer and participant must be a member of the group.
 */
export async function addExpense(draft: ExpenseDraft): Promise<AddExpenseResult> {
  const scope = await memberIdsFor(draft.groupId);
  if (!scope) return { ok: false, issues: [], problems: ['That group no longer exists.'] };
  try {
    const expense = buildExpense(draft, { ids: newId, ...scope });
    return { ok: true, expense: await repo().expenses.put(expense) };
  } catch (error) {
    return expenseFailure(error);
  }
}

/** Rebuilds an expense from an edited draft and saves it under the original id and creation time. */
export async function updateExpense(id: ExpenseId, draft: ExpenseDraft): Promise<AddExpenseResult> {
  const repository = repo();
  const existing = await repository.expenses.get(id);
  if (!existing) return { ok: false, issues: [], problems: ['That expense no longer exists.'] };
  const scope = await memberIdsFor(draft.groupId);
  if (!scope) return { ok: false, issues: [], problems: ['That group no longer exists.'] };
  try {
    const rebuilt = buildExpense(draft, { ids: newId, ...scope });
    const expense: Expense = { ...rebuilt, id: existing.id, createdAt: existing.createdAt, ...(existing.isSample ? { isSample: true } : {}) };
    return { ok: true, expense: await repository.expenses.put(expense) };
  } catch (error) {
    return expenseFailure(error);
  }
}

export type DeleteResult = { readonly ok: true } | { readonly ok: false; readonly problems: readonly string[] };

/** Deletes an expense after the engine confirms nothing else still points at it. */
export async function deleteExpense(id: ExpenseId): Promise<DeleteResult> {
  const repository = repo();
  const snapshot = await repository.snapshot();
  const problems = deletionIssues('expenses', id, snapshot);
  if (problems.length) return { ok: false, problems };
  const deleted = await repository.expenses.delete(id);
  return deleted ? { ok: true } : { ok: false, problems: ['That expense no longer exists.'] };
}

// ---------------------------------------------------------------------------------------------
// Settlements

export interface SettlementInput {
  readonly groupId: GroupId | null;
  readonly fromPersonId: PersonId;
  readonly toPersonId: PersonId;
  readonly amount: Money;
  readonly method?: SettlementMethod;
  readonly occurredOn?: LocalDate;
  readonly dueOn?: LocalDate | null;
  readonly note?: string;
}

/** Records a payment as pending. Pending payments do not change balances until confirmed. */
export async function recordSettlement(input: SettlementInput): Promise<Settlement> {
  const settlement = createSettlement(
    {
      groupId: input.groupId,
      fromPersonId: input.fromPersonId,
      toPersonId: input.toPersonId,
      amount: input.amount,
      status: 'pending',
      method: input.method ?? 'other',
      occurredOn: input.occurredOn ?? todayLocal(),
      dueOn: input.dueOn ?? null,
      ...(input.note ? { note: input.note } : {}),
    },
    { ids: newId },
  );
  return repo().settlements.put(settlement);
}

/** Confirms a pending settlement so it counts in balances. Confirming twice is a no-op. */
export async function confirmSettlement(id: SettlementId): Promise<Settlement> {
  const repository = repo();
  const settlement = await repository.settlements.get(id);
  if (!settlement) throw new Error(`Unknown settlement ${id}`);
  if (settlement.status === 'confirmed') return settlement;
  const stamp = now();
  return repository.settlements.put({ ...settlement, status: 'confirmed', confirmedAt: stamp, updatedAt: stamp });
}

/** Records and confirms a payment for exactly one step of a settle-up plan. */
export async function settleTransfer(groupId: GroupId | null, transfer: Transfer): Promise<Settlement> {
  const pending = await recordSettlement({ groupId, fromPersonId: transfer.from, toPersonId: transfer.to, amount: transfer.amount });
  return confirmSettlement(pending.id);
}

// ---------------------------------------------------------------------------------------------
// Budgets

export interface SetBudgetInput {
  /** An existing budget to change; omitted to create one. */
  readonly id?: BudgetId;
  /** null = all spending. */
  readonly categoryId: CategoryId | null;
  readonly amount: Money;
}

/** Creates a monthly budget, or changes an existing one's category or amount. */
export async function setBudget(input: SetBudgetInput): Promise<Budget> {
  const repository = repo();
  if (input.id) {
    const existing = await repository.budgets.get(input.id);
    if (existing) {
      if (input.amount.amountMinor <= 0) throw new RangeError('Budget amount must be positive');
      return repository.budgets.put({ ...existing, categoryId: input.categoryId, amount: input.amount, updatedAt: now() });
    }
  }
  return repository.budgets.put(makeBudget({ categoryId: input.categoryId, amount: input.amount }, { ids: newId }));
}

/** Removes a budget. Returns false when it was already gone. */
export function removeBudget(id: BudgetId): Promise<boolean> {
  return repo().budgets.delete(id);
}

export type { DataSnapshot };
