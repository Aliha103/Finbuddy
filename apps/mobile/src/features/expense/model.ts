// apps/mobile/src/features/expense/model.ts
// Everything the add-expense screens derive from the session and the store: the formatter, who is
// involved, the engine's evaluation of the form, and the words for a split and its payers. The
// screens stay thin; the maths stays in form.ts and the engine.
import { participantsOf, type CurrencyCode, type Expense, type ExpenseId, type LocalDate, type PersonId, type SplitSpec } from '@finbuddy/shared';

import { useDeviceLocale, useGroups, useProfile, useToday, type GroupSummary } from '@/data';
import { useFormat, type Formatter, type Spoken } from '@/features/common/format';

import { SPLIT_METHODS, evaluate, type Evaluation, type FormState, type SplitMethod } from './form';
import { useExpenseSession } from './session';

/** Sample people and groups carry "(sample)" in their names; the Sample chip says it instead. */
export const plainName = (name: string): string => name.replace(/ \(sample\)$/, '');

export function personName(f: Formatter, id: PersonId): string {
  return plainName(f.name(id));
}

/** "Your amount", never "You's amount". */
export function possessive(f: Formatter, id: PersonId): string {
  return f.isMe(id) ? 'Your' : `${personName(f, id)}'s`;
}

export interface ExpenseModel {
  readonly f: Formatter;
  readonly locale: string;
  readonly me: PersonId;
  readonly today: LocalDate;
  readonly form: FormState;
  readonly initial: FormState;
  readonly editingId: ExpenseId | null;
  readonly showAll: boolean;
  /** ?expenseId= named an expense that no longer exists. */
  readonly missing: boolean;
  /** Active groups, plus the form's own group when it is archived (editing an old expense). */
  readonly groups: readonly GroupSummary[];
  readonly group: GroupSummary | null;
  /** Everyone who can pay or share: the group's members, or the profile owner alone. */
  readonly members: readonly PersonId[];
  readonly defaultCurrency: CurrencyCode;
  readonly result: Evaluation;
  /** The expense is in a currency other than the group's: balances show it separately. */
  readonly currencyMismatch: boolean;
  groupCurrency(groupId: string | null): CurrencyCode;
}

/** The current session evaluated against the store. Null until the sheet has started the session. */
export function useExpenseModel(): ExpenseModel | null {
  const { session } = useExpenseSession();
  const f = useFormat();
  const locale = useDeviceLocale();
  const profile = useProfile();
  const allGroups = useGroups();
  const today = useToday();
  if (!session || !profile) return null;
  const { form } = session;
  const me = profile.personId;
  const defaultCurrency = profile.defaultCurrency;
  const groups = allGroups.filter((g) => !g.group.archived || g.group.id === form.groupId);
  const group = groups.find((g) => g.group.id === form.groupId) ?? null;
  const members = group ? group.group.memberIds : [me];
  const result = evaluate(form, { f, me, members });
  return {
    f,
    locale,
    me,
    today,
    form,
    initial: session.initial,
    editingId: session.editingId,
    showAll: session.showAll,
    missing: session.missing,
    groups,
    group,
    members,
    defaultCurrency,
    result,
    currencyMismatch: group !== null && form.currency !== group.group.currency,
    groupCurrency: (groupId) => allGroups.find((g) => g.group.id === groupId)?.group.currency ?? defaultCurrency,
  };
}

export function methodLabel(method: SplitMethod): string {
  return SPLIT_METHODS.find((m) => m.id === method)?.label ?? method;
}

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;

/** "Equally · 3 people · your share £40.00" for the sheet's split row. */
export function splitSummary(model: ExpenseModel): Spoken {
  const { f, me, result, form } = model;
  const n = participantsOf(result.spec).length;
  const mine = result.resolved?.[me];
  const head = `${methodLabel(form.method)} · ${people(n)}`;
  if (!mine) return f.say(head);
  if (n === 1 && participantsOf(result.spec)[0] === me) return f.say(head, ' · all yours, ', mine);
  return f.say(head, ' · your share ', mine);
}

/** "You", "Blake", "Several people": who paid, for the sheet's row and the detail. */
export function payerSummary(f: Formatter, payers: readonly PersonId[]): string {
  if (payers.length > 1) return 'Several people';
  const id = payers[0];
  return id ? personName(f, id) : 'Nobody yet';
}

/** The stored split in words: "Split equally between 3 people", "Split by percentage: 40, 30, 30". */
export function splitSentence(f: Formatter, spec: SplitSpec): string {
  switch (spec.type) {
    case 'equal':
      return `Split equally between ${people(spec.participants.length)}`;
    case 'exact':
      return 'Split by exact amounts';
    case 'percentage':
      return `Split by percentage: ${spec.percentages.map((p) => f.number(Number(p.percent), 4)).join(', ')}`;
    case 'shares':
      return `Split by shares: ${spec.shares.map((s) => f.number(Number(s.shares), 4)).join(', ')}`;
    case 'adjustment':
      return `Split equally between ${people(spec.adjustments.length)}, with adjustments`;
  }
}

/** What one person entered for a stored split, beside their resolved share: "40%", "2 shares", "plus £5.00". */
export function enteredValue(f: Formatter, expense: Expense, personId: PersonId): string | null {
  const spec = expense.split;
  const currency = expense.total.currency;
  switch (spec.type) {
    case 'percentage': {
      const p = spec.percentages.find((x) => x.personId === personId);
      return p ? `${f.number(Number(p.percent), 4)}%` : null;
    }
    case 'shares': {
      const s = spec.shares.find((x) => x.personId === personId);
      if (!s) return null;
      const n = Number(s.shares);
      return `${f.number(n, 4)} ${n === 1 ? 'share' : 'shares'}`;
    }
    case 'adjustment': {
      const a = spec.adjustments.find((x) => x.personId === personId);
      if (!a || a.adjustmentMinor === 0) return 'equal share';
      return `${a.adjustmentMinor > 0 ? 'plus' : 'minus'} ${f.money({ amountMinor: Math.abs(a.adjustmentMinor), currency })}`;
    }
    case 'exact':
    case 'equal':
      return null;
  }
}
