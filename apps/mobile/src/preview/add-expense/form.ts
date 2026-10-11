import {
  FALLBACK_CATEGORY_ID,
  allocateMinor,
  formatMoneyForInput,
  getNumberSeparators,
  parseMoneyInput,
  resolveSplit,
  validatePayers,
  validateSplit,
  type CategoryId,
  type CurrencyCode,
  type ExpenseDraft,
  type ExpenseIssue,
  type LocalDate,
  type Money,
  type Payer,
  type PersonId,
  type SplitIssue,
  type SplitSpec,
} from '@finbuddy/shared';

import { categoryLabel, parseErrorMessage, type Formatter, type Spoken } from '../format';

/**
 * The add-expense form as plain data plus one pure evaluate() that turns it into either a
 * ready ExpenseDraft or per-field messages, using the engine's own parser and validators.
 * Kept free of React so the designed form can reuse it.
 */
export type SplitMethod = 'equal' | 'exact' | 'percentage' | 'shares';

export const SPLIT_METHODS: readonly { id: SplitMethod; label: string }[] = [
  { id: 'equal', label: 'Equally' },
  { id: 'exact', label: 'Exact amounts' },
  { id: 'percentage', label: 'Percentages' },
  { id: 'shares', label: 'Shares' },
];

type PerPerson<T> = Readonly<Record<PersonId, T>>;

export interface FormState {
  readonly description: string;
  readonly amountText: string;
  readonly currency: CurrencyCode;
  /** null = a personal expense (only the profile owner). */
  readonly groupId: string | null;
  readonly payerMode: 'single' | 'multiple';
  readonly payerId: PersonId;
  readonly payerAmounts: PerPerson<string>;
  readonly method: SplitMethod;
  /** Equal split: who takes part (missing = included). */
  readonly included: PerPerson<boolean>;
  readonly exact: PerPerson<string>;
  readonly percent: PerPerson<string>;
  readonly shares: PerPerson<string>;
  readonly categoryId: CategoryId;
  readonly date: LocalDate;
}

export function initialForm(input: { groupId: string | null; currency: CurrencyCode; me: PersonId; today: LocalDate }): FormState {
  return {
    description: '',
    amountText: '',
    currency: input.currency,
    groupId: input.groupId,
    payerMode: 'single',
    payerId: input.me,
    payerAmounts: {},
    method: 'equal',
    included: {},
    exact: {},
    percent: {},
    shares: {},
    categoryId: FALLBACK_CATEGORY_ID,
    date: input.today,
  };
}

/** Switching personal/group resets everything that depends on who is involved. */
export function withGroup(state: FormState, groupId: string | null, currency: CurrencyCode, me: PersonId): FormState {
  return { ...state, groupId, currency, payerMode: 'single', payerId: me, payerAmounts: {}, method: 'equal', included: {}, exact: {}, percent: {}, shares: {} };
}

const blank = (values: PerPerson<string>, members: readonly PersonId[]) => members.every((id) => !(values[id] ?? '').trim());

function decimalText(hundredths: number, locale: string): string {
  const whole = Math.floor(hundredths / 100);
  const frac = String(hundredths % 100).padStart(2, '0').replace(/0+$/, '');
  return frac ? `${whole}${getNumberSeparators(locale).decimal}${frac}` : String(whole);
}

/** Switching method pre-fills an even split so the person only adjusts what differs. */
export function withMethod(state: FormState, method: SplitMethod, members: readonly PersonId[], total: Money | null, locale: string): FormState {
  const next = { ...state, method };
  if (method === 'percentage' && blank(state.percent, members) && members.length) {
    const each = allocateMinor(10_000, members.map(() => 1));
    return { ...next, percent: Object.fromEntries(members.map((id, i) => [id, decimalText(each[i] ?? 0, locale)])) };
  }
  if (method === 'shares' && blank(state.shares, members)) {
    return { ...next, shares: Object.fromEntries(members.map((id) => [id, '1'])) };
  }
  if (method === 'exact' && blank(state.exact, members) && total && members.length) {
    const parts = allocateMinor(total.amountMinor, members.map(() => 1));
    return { ...next, exact: Object.fromEntries(members.map((id, i) => [id, formatMoneyForInput({ amountMinor: parts[i] ?? 0, currency: total.currency }, locale)])) };
  }
  return next;
}

/** Switching to several payers starts with the current payer covering the whole total. */
export function withPayerMode(state: FormState, mode: 'single' | 'multiple', members: readonly PersonId[], total: Money | null, locale: string): FormState {
  if (mode === 'multiple' && blank(state.payerAmounts, members) && total) {
    return { ...state, payerMode: mode, payerAmounts: { [state.payerId]: formatMoneyForInput(total, locale) } };
  }
  return { ...state, payerMode: mode };
}

/** "33,5" -> "33.5" in a comma-decimal locale; null when it is not a plain non-negative number. */
export function normaliseNumber(text: string, locale: string): string | null {
  const { decimal } = getNumberSeparators(locale);
  let s = text.trim().replace(/\s/g, '');
  if (decimal !== '.') s = s.split(decimal).join('.');
  return /^\d+(\.\d+)?$/.test(s) || /^\.\d+$/.test(s) ? (s.startsWith('.') ? `0${s}` : s) : null;
}

export interface FormContext {
  readonly f: Formatter;
  readonly me: PersonId;
  /** Everyone who can pay or share: the group's members, or just the profile owner. */
  readonly members: readonly PersonId[];
}

export interface Evaluation {
  readonly total: Money | null;
  /** Includes "Enter an amount." for an empty field; the form decides when to show it. */
  readonly amountError: string | null;
  readonly amountEmpty: boolean;
  readonly payerErrors: PerPerson<string>;
  readonly payerGeneral: readonly string[];
  /** "£70.00 of £120.00 assigned" while entering several payers. */
  readonly payerProgress: Spoken | null;
  readonly splitErrors: PerPerson<string>;
  readonly splitGeneral: readonly string[];
  /** Running sum for exact / percentage / shares. */
  readonly splitProgress: Spoken | null;
  /** Each person's resolved share (live preview), when the total and split are valid. */
  readonly resolved: PerPerson<Money> | null;
  readonly draft: ExpenseDraft | null;
}

/** Human message for an engine issue code (split, payer or whole-expense validation). */
export function issueMessage(f: Formatter, issue: SplitIssue | ExpenseIssue, currency: CurrencyCode): string {
  const who = issue.personId ? f.name(issue.personId) : 'Someone';
  const amount = (minor: number | string | undefined) => f.money({ amountMinor: Number(minor ?? 0), currency });
  switch (issue.code) {
    case 'non_positive_total':
    case 'invalid_total':
      return 'Enter a total above zero first.';
    case 'no_participants':
      return 'Choose at least one person to share this expense.';
    case 'duplicate_participant':
    case 'duplicate_payer':
      return `${who} is listed twice.`;
    case 'not_a_member':
      return `${who} is not a member of this group.`;
    case 'invalid_amount':
      return `${who}: enter a valid amount.`;
    case 'negative_amount':
    case 'negative_share':
      return `${who}: amounts can't be negative.`;
    case 'exact_sum_mismatch': {
      const diff = Number(issue.expected ?? 0) - Number(issue.actual ?? 0);
      return diff > 0
        ? `The amounts add up to ${amount(issue.actual)}: ${amount(diff)} short of the ${amount(issue.expected)} total.`
        : `The amounts add up to ${amount(issue.actual)}: ${amount(-diff)} more than the ${amount(issue.expected)} total.`;
    }
    case 'invalid_percent':
      return `${who}: enter a percentage such as 25 or 33.33 (up to 4 decimal places).`;
    case 'percent_sum_out_of_tolerance':
      return `The percentages add up to ${f.number(Number(issue.actual ?? 0), 4)}%. They need to add up to 100%.`;
    case 'invalid_shares':
      return `${who}: shares must be a number above zero. Leave it empty to leave them out.`;
    case 'no_payers':
      return 'Enter how much each person paid.';
    case 'payer_currency_mismatch':
      return `${who} paid in a different currency from the total.`;
    case 'non_positive_payer_amount':
      return `${who}: a payment must be above zero. Leave it empty if they didn't pay.`;
    case 'payer_sum_mismatch': {
      const diff = Number(issue.expected ?? 0) - Number(issue.actual ?? 0);
      return diff > 0
        ? `Payments add up to ${amount(issue.actual)}: ${amount(diff)} short of the ${amount(issue.expected)} total.`
        : `Payments add up to ${amount(issue.actual)}: ${amount(-diff)} more than the ${amount(issue.expected)} total.`;
    }
    case 'invalid_description':
      return 'The description could not be read.';
    case 'invalid_date':
      return 'Choose a valid date.';
    case 'invalid_timestamp':
      return 'The time could not be read.';
    case 'splits_mismatch':
      return "The shares don't match the split. Try again.";
  }
}

export function evaluate(state: FormState, ctx: FormContext): Evaluation {
  const { f, me, members } = ctx;
  const locale = f.locale;
  const currency = state.currency;
  const isGroup = state.groupId !== null;
  const people = isGroup ? members : [me];

  const parsed = parseMoneyInput(state.amountText, currency, { locale, allowZero: false });
  const total = parsed.ok ? parsed.value : null;
  const amountError = parsed.ok ? null : parseErrorMessage(f, parsed.error, currency, parsed.maxDecimals);

  // Payers.
  const payerErrors: Record<PersonId, string> = {};
  const payerGeneral: string[] = [];
  let payerProgress: Spoken | null = null;
  let paidBy: PersonId | Payer[] = isGroup ? state.payerId : me;
  if (isGroup && state.payerMode === 'multiple') {
    const payers: Payer[] = [];
    let sum = 0;
    for (const id of people) {
      const text = (state.payerAmounts[id] ?? '').trim();
      if (!text) continue;
      const r = parseMoneyInput(text, currency, { locale, allowZero: true });
      if (!r.ok) payerErrors[id] = parseErrorMessage(f, r.error, currency, r.maxDecimals);
      else {
        payers.push({ personId: id, amount: r.value });
        sum += r.value.amountMinor;
      }
    }
    paidBy = payers;
    if (total) payerProgress = f.say({ amountMinor: sum, currency }, ' of ', total, ' assigned');
    if (Object.keys(payerErrors).length === 0) {
      if (payers.length === 0) payerGeneral.push('Enter how much each person paid.');
      else if (total) {
        const check = validatePayers(payers, total, { memberIds: people });
        if (!check.ok) {
          for (const issue of check.issues) {
            if (issue.personId && issue.code !== 'payer_sum_mismatch') payerErrors[issue.personId] = issueMessage(f, issue, currency);
            else payerGeneral.push(issueMessage(f, issue, currency));
          }
        }
      }
    }
  }

  // Split.
  const splitErrors: Record<PersonId, string> = {};
  const splitGeneral: string[] = [];
  let splitProgress: Spoken | null = null;
  let spec: SplitSpec;
  if (!isGroup) {
    spec = { type: 'equal', participants: [me] };
  } else if (state.method === 'equal') {
    spec = { type: 'equal', participants: people.filter((id) => state.included[id] !== false) };
  } else if (state.method === 'exact') {
    const amounts: { personId: PersonId; amountMinor: number }[] = [];
    let sum = 0;
    for (const id of people) {
      const text = (state.exact[id] ?? '').trim();
      if (!text) continue;
      const r = parseMoneyInput(text, currency, { locale, allowZero: true });
      if (!r.ok) splitErrors[id] = parseErrorMessage(f, r.error, currency, r.maxDecimals);
      else {
        amounts.push({ personId: id, amountMinor: r.value.amountMinor });
        sum += r.value.amountMinor;
      }
    }
    spec = { type: 'exact', amounts };
    if (total) {
      const left = total.amountMinor - sum;
      splitProgress =
        left === 0
          ? f.say('Adds up to the total of ', total)
          : left > 0
            ? f.say({ amountMinor: sum, currency }, ' of ', total, ' assigned: ', { amountMinor: left, currency }, ' left')
            : f.say({ amountMinor: sum, currency }, ' assigned: ', { amountMinor: -left, currency }, ' more than the total');
    }
  } else if (state.method === 'percentage') {
    const percentages: { personId: PersonId; percent: string }[] = [];
    for (const id of people) {
      const text = (state.percent[id] ?? '').trim();
      if (!text) continue;
      const n = normaliseNumber(text, locale);
      if (n === null) splitErrors[id] = `Enter a percentage such as 25 or ${decimalText(3333, locale)}.`;
      else percentages.push({ personId: id, percent: n });
    }
    spec = { type: 'percentage', percentages };
    const sum = percentages.reduce((acc, p) => acc + Number(p.percent), 0);
    splitProgress = f.say(`Adds up to ${f.number(sum, 4)}% of 100%`);
  } else {
    const shares: { personId: PersonId; shares: string }[] = [];
    for (const id of people) {
      const text = (state.shares[id] ?? '').trim();
      if (!text) continue;
      const n = normaliseNumber(text, locale);
      if (n === null) splitErrors[id] = 'Enter a number of shares, such as 1 or 2.';
      else shares.push({ personId: id, shares: n });
    }
    spec = { type: 'shares', shares };
    const sum = shares.reduce((acc, s) => acc + Number(s.shares), 0);
    splitProgress = f.say(`${f.number(sum, 4)} shares in total`);
  }

  let resolved: Record<PersonId, Money> | null = null;
  if (Object.keys(splitErrors).length === 0) {
    // Without a valid total, check everything that does not depend on it (a placeholder of one unit).
    const check = validateSplit(spec, total ?? { amountMinor: 1, currency }, { memberIds: people });
    if (!check.ok) {
      for (const issue of check.issues) {
        if (!total && (issue.code === 'exact_sum_mismatch' || issue.code === 'non_positive_total')) continue;
        if (issue.personId && issue.code !== 'exact_sum_mismatch' && issue.code !== 'percent_sum_out_of_tolerance') splitErrors[issue.personId] = issueMessage(f, issue, currency);
        else splitGeneral.push(issueMessage(f, issue, currency));
      }
    } else if (total) {
      resolved = Object.fromEntries(resolveSplit(spec, total).map((s) => [s.personId, s.amount]));
    }
  }

  const payersOk = Object.keys(payerErrors).length === 0 && payerGeneral.length === 0;
  const draft: ExpenseDraft | null =
    total && resolved && payersOk
      ? {
          groupId: state.groupId,
          description: state.description.trim() || categoryLabel(state.categoryId),
          categoryId: state.categoryId,
          total,
          paidBy,
          split: spec,
          occurredOn: state.date,
          createdBy: me,
        }
      : null;

  return {
    total,
    amountError,
    amountEmpty: !parsed.ok && parsed.error === 'empty',
    payerErrors,
    payerGeneral,
    payerProgress,
    splitErrors,
    splitGeneral,
    splitProgress,
    resolved,
    draft,
  };
}
