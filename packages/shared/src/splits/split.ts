import { toRational } from '../internal/decimal';
import { allocateMinor, type Money } from '../money/money';
import type { Payer, PersonId, Split, SplitSpec } from './types';

/**
 * Percentages must add up to 100 within this many percentage points (inclusive).
 * 0.01 lets people type 33.33 / 33.33 / 33.33 (= 99.99) for thirds. Resolution then uses
 * the percentages as relative weights, so the shares still sum exactly to the total.
 */
export const PERCENT_SUM_TOLERANCE = '0.01';
/** Percentages may have at most this many decimal places. */
export const PERCENT_MAX_DECIMALS = 4;

export type SplitIssueCode =
  | 'non_positive_total'
  | 'no_participants'
  | 'duplicate_participant'
  | 'not_a_member'
  | 'invalid_amount'
  | 'negative_amount'
  | 'exact_sum_mismatch'
  | 'invalid_percent'
  | 'percent_sum_out_of_tolerance'
  | 'invalid_shares'
  | 'negative_share'
  | 'no_payers'
  | 'duplicate_payer'
  | 'payer_currency_mismatch'
  | 'non_positive_payer_amount'
  | 'payer_sum_mismatch';

/** A machine-readable validation problem; the UI maps `code` to copy. */
export interface SplitIssue {
  readonly code: SplitIssueCode;
  readonly personId?: PersonId;
  /** For sum mismatches: the expected and actual totals (minor units, or percent as a string). */
  readonly expected?: number | string;
  readonly actual?: number | string;
}

export type SplitValidation = { readonly ok: true } | { readonly ok: false; readonly issues: readonly SplitIssue[] };

export class SplitValidationError extends Error {
  readonly issues: readonly SplitIssue[];
  constructor(issues: readonly SplitIssue[]) {
    super(`Invalid split: ${issues.map((i) => i.code + (i.personId ? `(${i.personId})` : '')).join(', ')}`);
    this.name = 'SplitValidationError';
    this.issues = issues;
  }
}

export interface SplitValidationOptions {
  /** When given, every participant must be one of these people (the group's members). */
  readonly memberIds?: readonly PersonId[];
}

/** The people a spec mentions, in spec order. */
export function participantsOf(spec: SplitSpec): PersonId[] {
  switch (spec.type) {
    case 'equal':
      return [...spec.participants];
    case 'exact':
      return spec.amounts.map((a) => a.personId);
    case 'percentage':
      return spec.percentages.map((p) => p.personId);
    case 'shares':
      return spec.shares.map((s) => s.personId);
    case 'adjustment':
      return spec.adjustments.map((a) => a.personId);
  }
}

function checkPeople(ids: readonly PersonId[], options: SplitValidationOptions, issues: SplitIssue[], duplicateCode: SplitIssueCode) {
  const seen = new Set<PersonId>();
  for (const personId of ids) {
    if (seen.has(personId)) issues.push({ code: duplicateCode, personId });
    seen.add(personId);
    if (options.memberIds && !options.memberIds.includes(personId)) issues.push({ code: 'not_a_member', personId });
  }
}

function decimalPlaces(value: number | string): number {
  const text = typeof value === 'number' ? String(value) : value.trim();
  const [mantissa = '', exp] = text.toLowerCase().split('e');
  const frac = mantissa.split('.')[1]?.length ?? 0;
  return Math.max(0, frac - Number(exp ?? 0));
}

function tryRational(value: number | string) {
  try {
    return toRational(value);
  } catch {
    return undefined;
  }
}

function adjustmentShares(totalMinor: number, adjustments: readonly { adjustmentMinor: number }[]): number[] {
  const adjSum = adjustments.reduce((acc, a) => acc + a.adjustmentMinor, 0);
  const rest = totalMinor - adjSum;
  if (!Number.isSafeInteger(adjSum) || !Number.isSafeInteger(rest)) throw new RangeError('Adjustments exceed the safe integer range');
  const equal = allocateMinor(rest, adjustments.map(() => 1));
  return adjustments.map((a, i) => {
    const share = (equal[i] ?? 0) + a.adjustmentMinor;
    if (!Number.isSafeInteger(share)) throw new RangeError('Adjustments exceed the safe integer range');
    return share;
  });
}

/**
 * Checks a split spec against an expense total. Returns every problem found, not just the first.
 * Rules: the total must be positive; at least one participant; no duplicates; exact amounts are
 * non-negative integers summing to the total; percentages are >= 0 with at most 4 decimals and
 * sum to 100 +/- PERCENT_SUM_TOLERANCE; shares are > 0; adjustments are integers and leave every
 * share >= 0.
 */
export function validateSplit(spec: SplitSpec, total: Money, options: SplitValidationOptions = {}): SplitValidation {
  const issues: SplitIssue[] = [];
  if (!Number.isSafeInteger(total.amountMinor) || total.amountMinor <= 0) issues.push({ code: 'non_positive_total' });
  const people = participantsOf(spec);
  if (people.length === 0) issues.push({ code: 'no_participants' });
  checkPeople(people, options, issues, 'duplicate_participant');

  switch (spec.type) {
    case 'equal':
      break;
    case 'exact': {
      let sumMinor = 0;
      for (const { personId, amountMinor } of spec.amounts) {
        if (!Number.isSafeInteger(amountMinor)) issues.push({ code: 'invalid_amount', personId });
        else if (amountMinor < 0) issues.push({ code: 'negative_amount', personId });
        else sumMinor += amountMinor;
      }
      // A sum beyond MAX_SAFE_INTEGER is inexact but always larger than any valid total, so it is a mismatch too.
      if (people.length > 0 && sumMinor !== total.amountMinor && !issues.some((i) => i.code === 'invalid_amount' || i.code === 'negative_amount')) {
        issues.push({ code: 'exact_sum_mismatch', expected: total.amountMinor, actual: sumMinor });
      }
      break;
    }
    case 'percentage': {
      let num = 0n; // sum in units of 10^-PERCENT_MAX_DECIMALS percent
      let valid = true;
      const scale = 10n ** BigInt(PERCENT_MAX_DECIMALS);
      for (const { personId, percent } of spec.percentages) {
        const r = tryRational(percent);
        if (!r || r.num < 0n || decimalPlaces(percent) > PERCENT_MAX_DECIMALS) {
          issues.push({ code: 'invalid_percent', personId });
          valid = false;
          continue;
        }
        num += (r.num * scale) / r.den;
      }
      if (valid && people.length > 0) {
        const tolerance = toRational(PERCENT_SUM_TOLERANCE);
        const tol = (tolerance.num * scale) / tolerance.den;
        const target = 100n * scale;
        const diff = num > target ? num - target : target - num;
        if (diff > tol || num === 0n) {
          const whole = num / scale;
          const frac = (num % scale).toString().padStart(PERCENT_MAX_DECIMALS, '0').replace(/0+$/, '');
          issues.push({ code: 'percent_sum_out_of_tolerance', expected: '100', actual: frac ? `${whole}.${frac}` : `${whole}` });
        }
      }
      break;
    }
    case 'shares':
      for (const { personId, shares } of spec.shares) {
        const r = tryRational(shares);
        if (!r || r.num <= 0n) issues.push({ code: 'invalid_shares', personId });
      }
      break;
    case 'adjustment': {
      let ok = true;
      for (const { personId, adjustmentMinor } of spec.adjustments) {
        if (!Number.isSafeInteger(adjustmentMinor)) {
          issues.push({ code: 'invalid_amount', personId });
          ok = false;
        }
      }
      if (ok && people.length > 0 && Number.isSafeInteger(total.amountMinor)) {
        let shares: number[] | undefined;
        try {
          shares = adjustmentShares(total.amountMinor, spec.adjustments);
        } catch {
          issues.push({ code: 'invalid_amount' }); // adjustments overflow the safe integer range
        }
        shares?.forEach((share, i) => {
          if (share < 0) issues.push({ code: 'negative_share', personId: spec.adjustments[i]?.personId });
        });
      }
      break;
    }
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

/**
 * Resolves a spec to exact per-person Money in the total's currency, in spec order.
 * The shares always sum exactly to `total` (largest-remainder allocation; leftover minor
 * units go to people in spec order). Throws SplitValidationError when the spec is invalid.
 */
export function resolveSplit(spec: SplitSpec, total: Money, options: SplitValidationOptions = {}): Split[] {
  const validation = validateSplit(spec, total, options);
  if (!validation.ok) throw new SplitValidationError(validation.issues);
  const currency = total.currency;
  let parts: number[];
  switch (spec.type) {
    case 'equal':
      parts = allocateMinor(total.amountMinor, spec.participants.map(() => 1));
      break;
    case 'exact':
      parts = spec.amounts.map((a) => a.amountMinor);
      break;
    case 'percentage':
      parts = allocateMinor(total.amountMinor, spec.percentages.map((p) => p.percent));
      break;
    case 'shares':
      parts = allocateMinor(total.amountMinor, spec.shares.map((s) => s.shares));
      break;
    case 'adjustment':
      parts = adjustmentShares(total.amountMinor, spec.adjustments);
      break;
  }
  const people = participantsOf(spec);
  return people.map((personId, i) => ({ personId, amount: { amountMinor: parts[i] ?? 0, currency } }));
}

/** Checks payers against a total: at least one, unique, same currency, positive, summing to the total. */
export function validatePayers(payers: readonly Payer[], total: Money, options: SplitValidationOptions = {}): SplitValidation {
  const issues: SplitIssue[] = [];
  if (payers.length === 0) issues.push({ code: 'no_payers' });
  checkPeople(payers.map((p) => p.personId), options, issues, 'duplicate_payer');
  let sumMinor = 0;
  let comparable = true;
  for (const { personId, amount } of payers) {
    if (amount.currency !== total.currency) {
      issues.push({ code: 'payer_currency_mismatch', personId });
      comparable = false;
    } else if (!Number.isSafeInteger(amount.amountMinor)) {
      issues.push({ code: 'invalid_amount', personId });
      comparable = false;
    } else if (amount.amountMinor <= 0) {
      issues.push({ code: 'non_positive_payer_amount', personId });
      comparable = false;
    } else {
      sumMinor += amount.amountMinor;
    }
  }
  if (payers.length > 0 && comparable && sumMinor !== total.amountMinor) {
    issues.push({ code: 'payer_sum_mismatch', expected: total.amountMinor, actual: sumMinor });
  }
  return issues.length ? { ok: false, issues } : { ok: true };
}

/** One person paid everything. */
export function singlePayer(personId: PersonId, total: Money): Payer[] {
  return [{ personId, amount: total }];
}
