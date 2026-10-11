import type { Money } from '../money/money';

export type PersonId = string;

/**
 * How an expense is divided. Every spec resolves to exact per-person Money that sums to
 * the total (see resolveSplit). Leftover minor units from rounding go to people in the
 * order they are listed in the spec.
 */
export type SplitSpec = EqualSplit | ExactSplit | PercentageSplit | SharesSplit | AdjustmentSplit;

export type SplitType = SplitSpec['type'];

/** Divide equally between the participants. */
export interface EqualSplit {
  readonly type: 'equal';
  readonly participants: readonly PersonId[];
}

/** Each person's exact amount in minor units of the expense currency; must sum to the total. */
export interface ExactSplit {
  readonly type: 'exact';
  readonly amounts: readonly { readonly personId: PersonId; readonly amountMinor: number }[];
}

/**
 * Percentages as decimal strings or numbers ("33.33", 12.5), at most 4 decimal places.
 * They must sum to 100 within PERCENT_SUM_TOLERANCE; see validateSplit.
 */
export interface PercentageSplit {
  readonly type: 'percentage';
  readonly percentages: readonly { readonly personId: PersonId; readonly percent: number | string }[];
}

/** Proportional shares ("2 nights" vs "3 nights"); every share must be > 0. */
export interface SharesSplit {
  readonly type: 'shares';
  readonly shares: readonly { readonly personId: PersonId; readonly shares: number | string }[];
}

/**
 * Equal split plus per-person adjustments in minor units ("Avery had the extra dessert: +500").
 * share = equal part of (total - sum of adjustments) + own adjustment. Adjustments may be
 * negative, but every resulting share must be >= 0.
 */
export interface AdjustmentSplit {
  readonly type: 'adjustment';
  readonly adjustments: readonly { readonly personId: PersonId; readonly adjustmentMinor: number }[];
}

/** A resolved share: what one person consumed of an expense. */
export interface Split {
  readonly personId: PersonId;
  readonly amount: Money;
}

/** Who paid and how much. Multiple payers are allowed; amounts sum to the expense total. */
export interface Payer {
  readonly personId: PersonId;
  readonly amount: Money;
}
