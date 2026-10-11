// apps/mobile/src/features/expense/edit.ts
// Edit opens the sheet exactly as the person entered the expense: the stored split spec (method
// and every value) and the payers go back into the form's text fields, in the device's locale.
import { formatMoneyForInput, getNumberSeparators, participantsOf, type Expense, type PersonId } from '@finbuddy/shared';

import type { FormState } from './form';

/** The form for an existing expense, so Edit opens the sheet exactly as the person entered it. */
export function formFromExpense(expense: Expense, locale: string, me: PersonId, memberIds: readonly PersonId[]): FormState {
  const { total, split } = expense;
  const currency = total.currency;
  const decimal = getNumberSeparators(locale).decimal;
  const asText = (value: number | string) => String(value).replace('.', decimal);
  const multiple = expense.paidBy.length > 1;
  const included: Record<PersonId, boolean> = {};
  if (split.type === 'equal' || split.type === 'adjustment') {
    const participants = new Set(participantsOf(split));
    for (const id of memberIds) included[id] = participants.has(id);
  }
  return {
    description: expense.description,
    amountText: formatMoneyForInput(total, locale),
    currency,
    groupId: expense.groupId,
    payerMode: multiple ? 'multiple' : 'single',
    payerId: expense.paidBy[0]?.personId ?? me,
    payerAmounts: multiple ? Object.fromEntries(expense.paidBy.map((p) => [p.personId, formatMoneyForInput(p.amount, locale)])) : {},
    method: split.type,
    included,
    exact: split.type === 'exact' ? Object.fromEntries(split.amounts.map((a) => [a.personId, formatMoneyForInput({ amountMinor: a.amountMinor, currency }, locale)])) : {},
    percent: split.type === 'percentage' ? Object.fromEntries(split.percentages.map((p) => [p.personId, asText(p.percent)])) : {},
    shares: split.type === 'shares' ? Object.fromEntries(split.shares.map((s) => [s.personId, asText(s.shares)])) : {},
    adjustment:
      split.type === 'adjustment'
        ? Object.fromEntries(
            split.adjustments
              .filter((a) => a.adjustmentMinor !== 0)
              .map((a) => [a.personId, `${a.adjustmentMinor < 0 ? '-' : '+'}${formatMoneyForInput({ amountMinor: Math.abs(a.adjustmentMinor), currency }, locale)}`]),
          )
        : {},
    categoryId: expense.categoryId,
    date: expense.occurredOn,
  };
}
