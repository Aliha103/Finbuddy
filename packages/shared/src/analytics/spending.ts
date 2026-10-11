import { compareCodeUnits, divRoundHalfEven } from '../internal/decimal';
import type { CurrencyCode } from '../money/currencies';
import type { Money } from '../money/money';
import type { CategoryId } from '../model/categories';
import { addMonths, monthOf, monthRange, type LocalDate, type MonthKey } from '../model/dates';
import type { Expense } from '../model/types';
import type { PersonId } from '../splits/types';

/**
 * "Spending" means a person's own share of expenses: their split of every expense they took
 * part in, personal or group. Paying for others is not spending; consuming is. This is what
 * makes personal and group money one picture. All results are per currency.
 *
 * Dates: expenses are bucketed by their stored calendar date (occurredOn, "YYYY-MM-DD").
 * Months are the first 7 characters of that string, so no time zone can move an expense.
 */
export interface SpendingRecord {
  readonly expense: Expense;
  readonly share: Money;
}

export interface SpendingFilter {
  readonly personId: PersonId;
  /** Inclusive calendar date bounds. */
  readonly from?: LocalDate;
  readonly to?: LocalDate;
  readonly categoryId?: CategoryId;
  readonly currency?: CurrencyCode;
}

/** The person's non-zero shares, filtered, ordered by date then expense id. */
export function spendingRecords(expenses: readonly Expense[], filter: SpendingFilter): SpendingRecord[] {
  const out: SpendingRecord[] = [];
  for (const expense of expenses) {
    if (filter.from !== undefined && expense.occurredOn < filter.from) continue;
    if (filter.to !== undefined && expense.occurredOn > filter.to) continue;
    if (filter.categoryId !== undefined && expense.categoryId !== filter.categoryId) continue;
    if (filter.currency !== undefined && expense.total.currency !== filter.currency) continue;
    let shareMinor = 0;
    for (const s of expense.splits) if (s.personId === filter.personId) shareMinor += s.amount.amountMinor;
    if (shareMinor !== 0) out.push({ expense, share: { amountMinor: shareMinor, currency: expense.total.currency } });
  }
  return out.sort((a, b) => compareCodeUnits(a.expense.occurredOn, b.expense.occurredOn) || compareCodeUnits(a.expense.id, b.expense.id));
}

export interface CategorySpending {
  readonly categoryId: CategoryId;
  readonly total: Money;
  readonly count: number;
}

/** Spending per category and currency, sorted by currency, then largest total, then category id. */
export function spendingByCategory(expenses: readonly Expense[], filter: SpendingFilter): CategorySpending[] {
  const buckets = new Map<string, { categoryId: CategoryId; currency: CurrencyCode; minor: number; count: number }>();
  for (const { expense, share } of spendingRecords(expenses, filter)) {
    const key = JSON.stringify([share.currency, expense.categoryId]);
    const b = buckets.get(key) ?? { categoryId: expense.categoryId, currency: share.currency, minor: 0, count: 0 };
    b.minor += share.amountMinor;
    b.count += 1;
    buckets.set(key, b);
  }
  return [...buckets.values()]
    .sort((a, b) => compareCodeUnits(a.currency, b.currency) || b.minor - a.minor || compareCodeUnits(a.categoryId, b.categoryId))
    .map((b) => ({ categoryId: b.categoryId, total: { amountMinor: b.minor, currency: b.currency }, count: b.count }));
}

export interface MonthlySpending {
  readonly month: MonthKey;
  readonly total: Money;
  readonly count: number;
}

export interface MonthlyFilter extends Omit<SpendingFilter, 'from' | 'to'> {
  /** Inclusive month range. When both are set, months without spending appear as zero. */
  readonly fromMonth?: MonthKey;
  readonly toMonth?: MonthKey;
}

/** Spending per calendar month and currency, sorted by currency then month. */
export function spendingByMonth(expenses: readonly Expense[], filter: MonthlyFilter): MonthlySpending[] {
  const { fromMonth, toMonth, ...rest } = filter;
  const records = spendingRecords(expenses, {
    ...rest,
    ...(fromMonth !== undefined ? { from: `${fromMonth}-01` } : {}),
    ...(toMonth !== undefined ? { to: `${toMonth}-31` } : {}),
  });
  const buckets = new Map<string, { month: MonthKey; currency: CurrencyCode; minor: number; count: number }>();
  const currencies = new Set<CurrencyCode>(filter.currency !== undefined ? [filter.currency] : []);
  for (const { expense, share } of records) {
    const month = monthOf(expense.occurredOn);
    currencies.add(share.currency);
    const key = JSON.stringify([share.currency, month]);
    const b = buckets.get(key) ?? { month, currency: share.currency, minor: 0, count: 0 };
    b.minor += share.amountMinor;
    b.count += 1;
    buckets.set(key, b);
  }
  if (fromMonth !== undefined && toMonth !== undefined) {
    for (const currency of currencies) {
      for (const month of monthRange(fromMonth, toMonth)) {
        const key = JSON.stringify([currency, month]);
        if (!buckets.has(key)) buckets.set(key, { month, currency, minor: 0, count: 0 });
      }
    }
  }
  return [...buckets.values()]
    .sort((a, b) => compareCodeUnits(a.currency, b.currency) || compareCodeUnits(a.month, b.month))
    .map((b) => ({ month: b.month, total: { amountMinor: b.minor, currency: b.currency }, count: b.count }));
}

export interface MonthChange {
  readonly month: MonthKey;
  readonly current: Money;
  /** null when the previous month is not in the series. */
  readonly previous: Money | null;
  readonly change: Money | null;
  /** (current - previous) / previous as a plain number for display; null when previous is missing or zero. */
  readonly changeRatio: number | null;
}

/** Month-over-month change for each month of a spendingByMonth() series (per currency). */
export function monthOverMonth(series: readonly MonthlySpending[]): MonthChange[] {
  const index = new Map(series.map((m) => [JSON.stringify([m.total.currency, m.month]), m]));
  return series.map((m) => {
    const prev = index.get(JSON.stringify([m.total.currency, addMonths(m.month, -1)]));
    if (!prev) return { month: m.month, current: m.total, previous: null, change: null, changeRatio: null };
    const diff = m.total.amountMinor - prev.total.amountMinor;
    return {
      month: m.month,
      current: m.total,
      previous: prev.total,
      change: { amountMinor: diff, currency: m.total.currency },
      changeRatio: prev.total.amountMinor === 0 ? null : diff / prev.total.amountMinor,
    };
  });
}

export interface RollingAverage {
  readonly month: MonthKey;
  /** Mean of the window, rounded to the minor unit (half-even). */
  readonly average: Money;
  /** Months of the window present in the series (fewer at the start). */
  readonly monthsUsed: number;
}

/**
 * Trailing average over `window` calendar months ending at each month (inclusive), per currency.
 * Months missing from the series are skipped, so fill zeros first (spendingByMonth with
 * fromMonth/toMonth) if empty months should count.
 */
export function rollingAverage(series: readonly MonthlySpending[], window: number): RollingAverage[] {
  if (!Number.isInteger(window) || window < 1) throw new RangeError('window must be a positive integer');
  const index = new Map(series.map((m) => [JSON.stringify([m.total.currency, m.month]), m]));
  return series.map((m) => {
    let total = 0n;
    let used = 0;
    for (let i = 0; i < window; i++) {
      const hit = index.get(JSON.stringify([m.total.currency, addMonths(m.month, -i)]));
      if (hit) {
        total += BigInt(hit.total.amountMinor);
        used += 1;
      }
    }
    return { month: m.month, average: { amountMinor: Number(divRoundHalfEven(total, BigInt(used))), currency: m.total.currency }, monthsUsed: used };
  });
}
