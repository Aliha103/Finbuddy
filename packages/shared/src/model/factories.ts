import { isCurrencyCode, type CurrencyCode } from '../money/currencies';
import { equals, isMoney, type Money } from '../money/money';
import { resolveSplit, singlePayer, validatePayers, validateSplit, type SplitIssue } from '../splits/split';
import type { Payer, PersonId, SplitSpec } from '../splits/types';
import { FALLBACK_CATEGORY_ID, type CategoryId } from './categories';
import { isInstant, isLocalDate, systemClock, type Clock, type Instant, type LocalDate } from './dates';
import { createIdGenerator, type IdGenerator } from './ids';
import type { Budget, Expense, Group, GroupId, Person, Profile, ReceiptRef, Settlement, SettlementMethod, SettlementStatus } from './types';

/** Injected id generator and clock, so record creation is deterministic in tests. */
export interface FactoryDeps {
  readonly ids?: IdGenerator;
  readonly clock?: Clock;
}

let defaultIds: IdGenerator | undefined;
function deps(d: FactoryDeps): { ids: IdGenerator; now: Instant } {
  const ids = d.ids ?? (defaultIds ??= createIdGenerator());
  return { ids, now: (d.clock ?? systemClock)().toISOString() };
}

export type ExpenseIssueCode = SplitIssue['code'] | 'invalid_description' | 'invalid_date' | 'invalid_timestamp' | 'invalid_total' | 'splits_mismatch';
export interface ExpenseIssue {
  readonly code: ExpenseIssueCode;
  readonly personId?: PersonId;
  readonly expected?: number | string;
  readonly actual?: number | string;
}

export class ExpenseValidationError extends Error {
  readonly issues: readonly ExpenseIssue[];
  constructor(issues: readonly ExpenseIssue[]) {
    super(`Invalid expense: ${issues.map((i) => i.code).join(', ')}`);
    this.name = 'ExpenseValidationError';
    this.issues = issues;
  }
}

/**
 * Full integrity check of a stored expense: valid total, date, payers summing to the total,
 * a valid split spec, and stored `splits` equal to what the spec resolves to.
 * Pass the group's member ids to also require that everyone involved is a member.
 */
export function validateExpense(expense: Expense, options: { memberIds?: readonly PersonId[] } = {}): ExpenseIssue[] {
  const issues: ExpenseIssue[] = [];
  if (typeof expense.description !== 'string') issues.push({ code: 'invalid_description' });
  if (!isLocalDate(expense.occurredOn)) issues.push({ code: 'invalid_date' });
  if (expense.occurredAt !== null && !isInstant(expense.occurredAt)) issues.push({ code: 'invalid_timestamp' });
  if (!isMoney(expense.total) || expense.total.amountMinor <= 0) {
    issues.push({ code: 'invalid_total' });
    return issues;
  }
  const payers = validatePayers(expense.paidBy, expense.total, options);
  if (!payers.ok) issues.push(...payers.issues);
  const split = validateSplit(expense.split, expense.total, options);
  if (!split.ok) {
    issues.push(...split.issues);
    return issues;
  }
  const expected = resolveSplit(expense.split, expense.total);
  const matches =
    expected.length === expense.splits.length &&
    expected.every((s, i) => s.personId === expense.splits[i]?.personId && isMoney(expense.splits[i]?.amount) && equals(s.amount, expense.splits[i]!.amount));
  if (!matches) issues.push({ code: 'splits_mismatch' });
  return issues;
}

export interface ExpenseDraft {
  readonly groupId?: GroupId | null;
  readonly description: string;
  readonly categoryId?: CategoryId;
  readonly total: Money;
  /** One payer's id (pays the full total) or the full list of payers. */
  readonly paidBy: PersonId | readonly Payer[];
  /** Defaults to the payer alone (a personal expense). */
  readonly split?: SplitSpec;
  readonly occurredOn: LocalDate;
  readonly occurredAt?: Instant | null;
  readonly createdBy: PersonId;
  readonly notes?: string;
  readonly receipt?: ReceiptRef | null;
  readonly isSample?: true;
}

/**
 * Builds a complete, validated Expense from what the person entered: resolves the split to
 * exact shares and stamps id and timestamps. Throws ExpenseValidationError when invalid.
 */
export function buildExpense(draft: ExpenseDraft, options: FactoryDeps & { memberIds?: readonly PersonId[] } = {}): Expense {
  const { ids, now } = deps(options);
  const paidBy = typeof draft.paidBy === 'string' ? singlePayer(draft.paidBy, draft.total) : [...draft.paidBy];
  const split: SplitSpec = draft.split ?? { type: 'equal', participants: [paidBy[0]?.personId ?? draft.createdBy] };
  const splitCheck = validateSplit(split, draft.total, options);
  const base = {
    id: ids(),
    groupId: draft.groupId ?? null,
    description: draft.description.trim(),
    categoryId: draft.categoryId ?? FALLBACK_CATEGORY_ID,
    total: draft.total,
    paidBy,
    split,
    splits: splitCheck.ok ? resolveSplit(split, draft.total) : [],
    occurredOn: draft.occurredOn,
    occurredAt: draft.occurredAt ?? null,
    createdBy: draft.createdBy,
    createdAt: now,
    updatedAt: now,
    ...(draft.notes !== undefined ? { notes: draft.notes } : {}),
    ...(draft.receipt !== undefined ? { receipt: draft.receipt } : {}),
    ...(draft.isSample ? { isSample: true as const } : {}),
  };
  const issues = validateExpense(base, options);
  if (issues.length) throw new ExpenseValidationError(issues);
  return base;
}

function requireCurrency(currency: CurrencyCode): CurrencyCode {
  if (!isCurrencyCode(currency)) throw new RangeError(`Unsupported currency code: ${JSON.stringify(currency)}`);
  return currency;
}

function requireName(name: string, what: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new RangeError(`${what} must not be empty`);
  return trimmed;
}

export function createPerson(input: { displayName: string; email?: string; phone?: string; linkedUserId?: string | null; isSample?: true }, options: FactoryDeps = {}): Person {
  const { ids, now } = deps(options);
  return {
    id: ids(),
    displayName: requireName(input.displayName, 'displayName'),
    linkedUserId: input.linkedUserId ?? null,
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    createdAt: now,
    updatedAt: now,
    ...(input.isSample ? { isSample: true as const } : {}),
  };
}

export function createProfile(input: { personId: PersonId; displayName: string; defaultCurrency: CurrencyCode; locale: string; isSample?: true }, options: FactoryDeps = {}): Profile {
  const { ids, now } = deps(options);
  return {
    id: ids(),
    personId: input.personId,
    displayName: requireName(input.displayName, 'displayName'),
    defaultCurrency: requireCurrency(input.defaultCurrency),
    locale: input.locale,
    createdAt: now,
    updatedAt: now,
    ...(input.isSample ? { isSample: true as const } : {}),
  };
}

/** Creates a group; the creator is always a member (added first if missing). */
export function createGroup(input: { name: string; currency: CurrencyCode; createdBy: PersonId; memberIds?: readonly PersonId[]; isSample?: true }, options: FactoryDeps = {}): Group {
  const { ids, now } = deps(options);
  const members = [input.createdBy, ...(input.memberIds ?? []).filter((id) => id !== input.createdBy)];
  return {
    id: ids(),
    name: requireName(input.name, 'Group name'),
    currency: requireCurrency(input.currency),
    memberIds: [...new Set(members)],
    createdBy: input.createdBy,
    archived: false,
    createdAt: now,
    updatedAt: now,
    ...(input.isSample ? { isSample: true as const } : {}),
  };
}

export function createSettlement(
  input: {
    groupId?: GroupId | null;
    fromPersonId: PersonId;
    toPersonId: PersonId;
    amount: Money;
    status?: SettlementStatus;
    method?: SettlementMethod;
    occurredOn: LocalDate;
    dueOn?: LocalDate | null;
    note?: string;
    isSample?: true;
  },
  options: FactoryDeps = {},
): Settlement {
  const { ids, now } = deps(options);
  if (input.fromPersonId === input.toPersonId) throw new RangeError('A settlement needs two different people');
  if (!isMoney(input.amount) || input.amount.amountMinor <= 0) throw new RangeError('Settlement amount must be positive');
  if (!isLocalDate(input.occurredOn)) throw new RangeError('occurredOn must be YYYY-MM-DD');
  const status = input.status ?? 'pending';
  return {
    id: ids(),
    groupId: input.groupId ?? null,
    fromPersonId: input.fromPersonId,
    toPersonId: input.toPersonId,
    amount: input.amount,
    status,
    method: input.method ?? 'other',
    occurredOn: input.occurredOn,
    dueOn: input.dueOn ?? null,
    confirmedAt: status === 'confirmed' ? now : null,
    ...(input.note ? { note: input.note } : {}),
    createdAt: now,
    updatedAt: now,
    ...(input.isSample ? { isSample: true as const } : {}),
  };
}

export function createBudget(input: { categoryId: CategoryId | null; amount: Money; isSample?: true }, options: FactoryDeps = {}): Budget {
  const { ids, now } = deps(options);
  if (!isMoney(input.amount) || input.amount.amountMinor <= 0) throw new RangeError('Budget amount must be positive');
  return {
    id: ids(),
    categoryId: input.categoryId,
    amount: input.amount,
    period: 'monthly',
    createdAt: now,
    updatedAt: now,
    ...(input.isSample ? { isSample: true as const } : {}),
  };
}
