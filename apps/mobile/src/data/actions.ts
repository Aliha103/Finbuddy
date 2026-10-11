import {
  DataValidationError,
  ExpenseValidationError,
  buildExpense,
  createSettlement,
  todayLocal,
  type Expense,
  type ExpenseDraft,
  type ExpenseIssue,
  type GroupId,
  type LocalDate,
  type Money,
  type PersonId,
  type Settlement,
  type SettlementId,
  type SettlementMethod,
  type Transfer,
} from '@finbuddy/shared';

import { newId } from './ids';
import { useDataStore } from './store';

/**
 * Write actions. Everything goes through the Repository, which validates and notifies the
 * store; screens never mutate data directly.
 */
function repo() {
  return useDataStore.getState().repository;
}

export type AddExpenseResult =
  | { readonly ok: true; readonly expense: Expense }
  /** `issues` are field-level problems (map `code` to copy); `problems` are data-integrity messages. */
  | { readonly ok: false; readonly issues: readonly ExpenseIssue[]; readonly problems: readonly string[] };

/**
 * Builds (resolving the split to exact shares), validates and saves an expense. For a group
 * expense every payer and participant must be a member of the group.
 */
export async function addExpense(draft: ExpenseDraft): Promise<AddExpenseResult> {
  const repository = repo();
  let memberIds: readonly PersonId[] | undefined;
  if (draft.groupId) {
    const group = await repository.groups.get(draft.groupId);
    if (!group) return { ok: false, issues: [], problems: ['That group no longer exists.'] };
    memberIds = group.memberIds;
  }
  try {
    const expense = buildExpense(draft, { ids: newId, ...(memberIds ? { memberIds } : {}) });
    return { ok: true, expense: await repository.expenses.put(expense) };
  } catch (error) {
    if (error instanceof ExpenseValidationError) return { ok: false, issues: error.issues, problems: [] };
    if (error instanceof DataValidationError) return { ok: false, issues: [], problems: error.issues.map((i) => i.problem) };
    throw error;
  }
}

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
  const now = new Date().toISOString();
  return repository.settlements.put({ ...settlement, status: 'confirmed', confirmedAt: now, updatedAt: now });
}

/** Records and confirms a payment for exactly one step of a settle-up plan. */
export async function settleTransfer(groupId: GroupId | null, transfer: Transfer): Promise<Settlement> {
  const pending = await recordSettlement({ groupId, fromPersonId: transfer.from, toPersonId: transfer.to, amount: transfer.amount });
  return confirmSettlement(pending.id);
}
