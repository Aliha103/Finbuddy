import { compareCodeUnits, divRoundHalfEven, rationalToDecimalString, reduce } from '../internal/decimal';
import type { CurrencyCode } from '../money/currencies';
import type { Money } from '../money/money';
import type { CategoryId } from '../model/categories';
import { addDays, addMonths, daysBetween, daysInMonth, makeLocalDate, monthOf, parseLocalDate, type LocalDate } from '../model/dates';
import type { Budget, Expense, Settlement } from '../model/types';
import type { PersonId } from '../splits/types';
import { spendingRecords, type SpendingRecord } from './spending';

/**
 * On-device, deterministic insights. No model, no network: every insight is a rule over the
 * person's own data, carries the numbers it was based on, and has a stable id so the UI can
 * remember dismissals. Same input, same output.
 *
 * Copy: `title` and `body.template` are minimal English placeholders. The design team writes
 * final copy keyed by `kind` (and `data.status` where present) and fills it from `body.data`.
 */
export type InsightKind =
  | 'category_spike'
  | 'unusual_expense'
  | 'recurring_expense'
  | 'settlement_overdue'
  | 'settlement_upcoming'
  | 'budget_pace';

export type InsightSeverity = 'info' | 'notice' | 'warning';

export type InsightValue = string | number | boolean | null | Money;

/** One number an insight is based on, so the UI can show "why am I seeing this". */
export interface InsightBasis {
  readonly label: string;
  readonly value: InsightValue;
}

export interface Insight {
  /** Stable across runs for the same subject and period, e.g. "category_spike:2026-03:GBP:food". */
  readonly id: string;
  readonly kind: InsightKind;
  readonly severity: InsightSeverity;
  readonly title: string;
  readonly body: { readonly template: string; readonly data: Readonly<Record<string, InsightValue>> };
  readonly basis: readonly InsightBasis[];
  readonly subject: {
    readonly categoryId?: CategoryId;
    readonly expenseIds?: readonly string[];
    readonly settlementId?: string;
    readonly budgetId?: string;
    readonly personId?: PersonId;
  };
  /** The date the insight was computed for. */
  readonly asOf: LocalDate;
}

export interface InsightsConfig {
  /** Category spike: compare this month with the average of this many previous months. */
  readonly spikeLookbackMonths: number;
  /** ...and require spending in at least this many of them (avoids flagging new categories). */
  readonly spikeMinMonthsWithData: number;
  /** Flag when this month >= average * ratio (decimal string). */
  readonly spikeRatio: string;
  /** Severity becomes 'warning' at this ratio. */
  readonly spikeWarningRatio: string;
  /** Unusual expense: only expenses in the last N days are flagged. */
  readonly unusualRecentDays: number;
  /** ...compared with same-category, same-currency shares in the N days before each one. */
  readonly unusualLookbackDays: number;
  readonly unusualMinSamples: number;
  /** Flag when share >= median * multiplier (decimal string). */
  readonly unusualMultiplier: string;
  /** Recurring: look back this many days and require this many occurrences. */
  readonly recurringLookbackDays: number;
  readonly recurringMinOccurrences: number;
  /** Every amount must be within this fraction of the median (decimal string, "0.1" = 10%). */
  readonly recurringAmountTolerance: string;
  /** ...and the latest occurrence must be at most one period plus this many days before today. */
  readonly recurringGraceDays: number;
  /** Settlement reminders: "upcoming" when due within this many days. */
  readonly reminderUpcomingDays: number;
  /** Budget: "ahead of pace" when spent > expected-to-date * (1 + tolerance). */
  readonly budgetPaceTolerance: string;
}

export const DEFAULT_INSIGHTS_CONFIG: InsightsConfig = Object.freeze({
  spikeLookbackMonths: 3,
  spikeMinMonthsWithData: 2,
  spikeRatio: '1.5',
  spikeWarningRatio: '2',
  unusualRecentDays: 14,
  unusualLookbackDays: 90,
  unusualMinSamples: 5,
  unusualMultiplier: '3',
  recurringLookbackDays: 180,
  recurringMinOccurrences: 3,
  recurringAmountTolerance: '0.1',
  recurringGraceDays: 5,
  reminderUpcomingDays: 3,
  budgetPaceTolerance: '0.1',
});

export interface InsightsInput {
  readonly today: LocalDate;
  /** Whose insights these are (the Person id of the profile). */
  readonly personId: PersonId;
  readonly expenses: readonly Expense[];
  readonly settlements?: readonly Settlement[];
  readonly budgets?: readonly Budget[];
  readonly config?: Partial<InsightsConfig>;
}

// Small exact-ratio helpers on decimal strings, so thresholds never depend on float rounding.
function ratio(value: string): { num: bigint; den: bigint } {
  const [i = '0', f = ''] = value.split('.');
  return reduce({ num: BigInt(i + f), den: 10n ** BigInt(f.length) });
}
/** a >= b * r */
function atLeast(a: number, b: number, r: string): boolean {
  const q = ratio(r);
  return BigInt(a) * q.den >= BigInt(b) * q.num;
}
function ratioString(a: number, b: number): string {
  return rationalToDecimalString(reduce({ num: BigInt(a), den: BigInt(b) }), 2);
}
function median(values: readonly number[]): number {
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid] ?? 0;
  return Number(divRoundHalfEven(BigInt(sorted[mid - 1] ?? 0) + BigInt(sorted[mid] ?? 0), 2n));
}
const m = (amountMinor: number, currency: CurrencyCode): Money => ({ amountMinor, currency });

function categorySpikes(input: InsightsInput, cfg: InsightsConfig, records: readonly SpendingRecord[]): Insight[] {
  const month = monthOf(input.today);
  const totals = new Map<string, number>(); // [currency, category, month] -> minor
  for (const r of records) {
    const key = JSON.stringify([r.share.currency, r.expense.categoryId, monthOf(r.expense.occurredOn)]);
    totals.set(key, (totals.get(key) ?? 0) + r.share.amountMinor);
  }
  const out: Insight[] = [];
  const seen = new Set<string>();
  for (const r of records) {
    const currency = r.share.currency;
    const categoryId = r.expense.categoryId;
    const pairKey = JSON.stringify([currency, categoryId]);
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);
    const current = totals.get(JSON.stringify([currency, categoryId, month])) ?? 0;
    if (current <= 0) continue;
    let prevSum = 0;
    let monthsWithData = 0;
    for (let i = 1; i <= cfg.spikeLookbackMonths; i++) {
      const v = totals.get(JSON.stringify([currency, categoryId, addMonths(month, -i)])) ?? 0;
      prevSum += v;
      if (v > 0) monthsWithData++;
    }
    if (monthsWithData < cfg.spikeMinMonthsWithData || prevSum <= 0) continue;
    // current >= (prevSum / N) * ratio  <=>  current * N >= prevSum * ratio
    if (!atLeast(current * cfg.spikeLookbackMonths, prevSum, cfg.spikeRatio)) continue;
    const average = Number(divRoundHalfEven(BigInt(prevSum), BigInt(cfg.spikeLookbackMonths)));
    const times = ratioString(current * cfg.spikeLookbackMonths, prevSum);
    const severity: InsightSeverity = atLeast(current * cfg.spikeLookbackMonths, prevSum, cfg.spikeWarningRatio) ? 'warning' : 'notice';
    out.push({
      id: `category_spike:${month}:${currency}:${categoryId}`,
      kind: 'category_spike',
      severity,
      title: 'Category spending is up',
      body: {
        template: '{category} spending this month is {ratio}x your {months}-month average.',
        data: { category: categoryId, ratio: times, months: cfg.spikeLookbackMonths, current: m(current, currency), average: m(average, currency), month },
      },
      basis: [
        { label: 'thisMonth', value: m(current, currency) },
        { label: 'averagePreviousMonths', value: m(average, currency) },
        { label: 'monthsCompared', value: cfg.spikeLookbackMonths },
        { label: 'ratio', value: times },
      ],
      subject: { categoryId },
      asOf: input.today,
    });
  }
  return out;
}

function unusualExpenses(input: InsightsInput, cfg: InsightsConfig, records: readonly SpendingRecord[]): Insight[] {
  const out: Insight[] = [];
  const recentFrom = addDays(input.today, -(cfg.unusualRecentDays - 1));
  for (const r of records) {
    const date = r.expense.occurredOn;
    if (date < recentFrom || date > input.today) continue;
    const windowFrom = addDays(date, -cfg.unusualLookbackDays);
    const samples = records
      .filter(
        (o) =>
          o !== r &&
          o.share.currency === r.share.currency &&
          o.expense.categoryId === r.expense.categoryId &&
          o.expense.occurredOn >= windowFrom &&
          o.expense.occurredOn < date,
      )
      .map((o) => o.share.amountMinor);
    if (samples.length < cfg.unusualMinSamples) continue;
    const med = median(samples);
    if (med <= 0 || !atLeast(r.share.amountMinor, med, cfg.unusualMultiplier)) continue;
    const currency = r.share.currency;
    out.push({
      id: `unusual_expense:${r.expense.id}`,
      kind: 'unusual_expense',
      severity: 'notice',
      title: 'Unusually large expense',
      body: {
        template: '{description} is {ratio}x your typical {category} expense.',
        data: { description: r.expense.description, category: r.expense.categoryId, ratio: ratioString(r.share.amountMinor, med), amount: r.share, typical: m(med, currency) },
      },
      basis: [
        { label: 'amount', value: r.share },
        { label: 'median', value: m(med, currency) },
        { label: 'samples', value: samples.length },
        { label: 'lookbackDays', value: cfg.unusualLookbackDays },
      ],
      subject: { categoryId: r.expense.categoryId, expenseIds: [r.expense.id] },
      asOf: input.today,
    });
  }
  return out;
}

/** Lower-cases, trims and collapses whitespace so "Netflix " and "netflix" group together. */
export function normalizeDescription(description: string): string {
  return description.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

function addOneMonthClamped(date: LocalDate): LocalDate {
  const { year, month, day } = parseLocalDate(date);
  const next = addMonths(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`, 1);
  const [ny, nm] = next.split('-').map(Number) as [number, number];
  return makeLocalDate(ny, nm, Math.min(day, daysInMonth(next)));
}

function recurringExpenses(input: InsightsInput, cfg: InsightsConfig, records: readonly SpendingRecord[]): Insight[] {
  const from = addDays(input.today, -cfg.recurringLookbackDays);
  const groups = new Map<string, SpendingRecord[]>();
  for (const r of records) {
    if (r.expense.occurredOn < from || r.expense.occurredOn > input.today) continue;
    const key = JSON.stringify([normalizeDescription(r.expense.description), r.share.currency]);
    if (!normalizeDescription(r.expense.description)) continue;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const tol = ratio(cfg.recurringAmountTolerance);
  const out: Insight[] = [];
  for (const [key, list] of [...groups.entries()].sort(([a], [b]) => compareCodeUnits(a, b))) {
    if (list.length < cfg.recurringMinOccurrences) continue;
    const gaps = list.slice(1).map((r, i) => daysBetween(list[i]!.expense.occurredOn, r.expense.occurredOn));
    const cadence = gaps.every((g) => g >= 6 && g <= 8) ? 'weekly' : gaps.every((g) => g >= 27 && g <= 33) ? 'monthly' : undefined;
    if (!cadence) continue;
    // A series that stopped (cancelled subscription) is not reported: the last occurrence must be
    // within one cadence plus a few days' grace of today.
    if (daysBetween(list[list.length - 1]!.expense.occurredOn, input.today) > (cadence === 'weekly' ? 7 : 31) + cfg.recurringGraceDays) continue;
    const amounts = list.map((r) => r.share.amountMinor);
    const med = median(amounts);
    // |a - med| <= med * tol  <=>  |a - med| * den <= med * num
    if (!amounts.every((a) => BigInt(Math.abs(a - med)) * tol.den <= BigInt(med) * tol.num)) continue;
    const last = list[list.length - 1]!;
    const nextExpectedOn = cadence === 'weekly' ? addDays(last.expense.occurredOn, 7) : addOneMonthClamped(last.expense.occurredOn);
    const currency = last.share.currency;
    const [description] = JSON.parse(key) as [string];
    out.push({
      id: `recurring_expense:${currency}:${description}`,
      kind: 'recurring_expense',
      severity: 'info',
      title: 'Recurring expense',
      body: {
        template: '{description} looks {cadence}, about {amount}. Next expected around {nextExpectedOn}.',
        data: { description: last.expense.description, cadence, amount: m(med, currency), nextExpectedOn, occurrences: list.length },
      },
      basis: [
        { label: 'occurrences', value: list.length },
        { label: 'typicalAmount', value: m(med, currency) },
        { label: 'lastOn', value: last.expense.occurredOn },
        { label: 'cadence', value: cadence },
      ],
      subject: { categoryId: last.expense.categoryId, expenseIds: list.map((r) => r.expense.id) },
      asOf: input.today,
    });
  }
  return out;
}

function settlementReminders(input: InsightsInput, cfg: InsightsConfig): Insight[] {
  const out: Insight[] = [];
  for (const s of input.settlements ?? []) {
    if (s.status !== 'pending' || !s.dueOn) continue;
    if (s.fromPersonId !== input.personId && s.toPersonId !== input.personId) continue;
    const youPay = s.fromPersonId === input.personId;
    const counterparty = youPay ? s.toPersonId : s.fromPersonId;
    const days = daysBetween(input.today, s.dueOn);
    const data = { direction: youPay ? 'you_pay' : 'you_receive', counterpartyId: counterparty, amount: s.amount, dueOn: s.dueOn };
    if (days < 0) {
      out.push({
        id: `settlement_overdue:${s.id}`,
        kind: 'settlement_overdue',
        severity: youPay ? 'warning' : 'notice',
        title: youPay ? 'Payment overdue' : 'Payment to you is overdue',
        body: { template: youPay ? 'Your {amount} payment was due {daysOverdue} days ago.' : 'A {amount} payment to you was due {daysOverdue} days ago.', data: { ...data, daysOverdue: -days } },
        basis: [
          { label: 'amount', value: s.amount },
          { label: 'dueOn', value: s.dueOn },
          { label: 'daysOverdue', value: -days },
        ],
        subject: { settlementId: s.id, personId: counterparty },
        asOf: input.today,
      });
    } else if (days <= cfg.reminderUpcomingDays) {
      out.push({
        id: `settlement_upcoming:${s.id}`,
        kind: 'settlement_upcoming',
        severity: 'info',
        title: youPay ? 'Payment due soon' : 'Payment to you due soon',
        body: { template: youPay ? 'Your {amount} payment is due in {daysUntil} days.' : 'A {amount} payment to you is due in {daysUntil} days.', data: { ...data, daysUntil: days } },
        basis: [
          { label: 'amount', value: s.amount },
          { label: 'dueOn', value: s.dueOn },
          { label: 'daysUntil', value: days },
        ],
        subject: { settlementId: s.id, personId: counterparty },
        asOf: input.today,
      });
    }
  }
  return out;
}

function budgetPace(input: InsightsInput, cfg: InsightsConfig, records: readonly SpendingRecord[]): Insight[] {
  const month = monthOf(input.today);
  const day = parseLocalDate(input.today).day;
  const dim = daysInMonth(month);
  const tol = ratio(cfg.budgetPaceTolerance);
  const out: Insight[] = [];
  for (const b of input.budgets ?? []) {
    const currency = b.amount.currency;
    let spent = 0;
    const excluded = new Set<CurrencyCode>();
    for (const r of records) {
      if (monthOf(r.expense.occurredOn) !== month || r.expense.occurredOn > input.today) continue;
      if (b.categoryId !== null && r.expense.categoryId !== b.categoryId) continue;
      if (r.share.currency !== currency) {
        excluded.add(r.share.currency);
        continue;
      }
      spent += r.share.amountMinor;
    }
    const expectedToDate = Number(divRoundHalfEven(BigInt(b.amount.amountMinor) * BigInt(day), BigInt(dim)));
    const projected = Number(divRoundHalfEven(BigInt(spent) * BigInt(dim), BigInt(day)));
    // ahead when spent * den > expected * (den + num)
    const status =
      spent > b.amount.amountMinor
        ? 'over'
        : BigInt(spent) * tol.den > BigInt(expectedToDate) * (tol.den + tol.num)
          ? 'ahead'
          : 'on_track';
    out.push({
      id: `budget_pace:${month}:${b.id}`,
      kind: 'budget_pace',
      severity: status === 'over' ? 'warning' : status === 'ahead' ? 'notice' : 'info',
      title: status === 'over' ? 'Budget exceeded' : status === 'ahead' ? 'Spending ahead of budget pace' : 'Budget on track',
      body: {
        template: 'You have spent {spent} of {budget} with {daysLeft} days left in the month.',
        data: {
          status,
          category: b.categoryId,
          spent: m(spent, currency),
          budget: b.amount,
          expectedToDate: m(expectedToDate, currency),
          projected: m(projected, currency),
          daysLeft: dim - day,
          excludedCurrencies: [...excluded].sort(compareCodeUnits).join(','),
        },
      },
      basis: [
        { label: 'spent', value: m(spent, currency) },
        { label: 'budget', value: b.amount },
        { label: 'expectedToDate', value: m(expectedToDate, currency) },
        { label: 'projectedMonthEnd', value: m(projected, currency) },
        { label: 'dayOfMonth', value: day },
        { label: 'daysInMonth', value: dim },
      ],
      subject: { budgetId: b.id, ...(b.categoryId !== null ? { categoryId: b.categoryId } : {}) },
      asOf: input.today,
    });
  }
  return out;
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = { warning: 0, notice: 1, info: 2 };

/** Runs every rule and returns insights sorted by severity (warning first), then kind, then id. */
export function generateInsights(input: InsightsInput): Insight[] {
  const cfg: InsightsConfig = { ...DEFAULT_INSIGHTS_CONFIG, ...input.config };
  const records = spendingRecords(input.expenses, { personId: input.personId, to: input.today });
  return [
    ...categorySpikes(input, cfg, records),
    ...unusualExpenses(input, cfg, records),
    ...recurringExpenses(input, cfg, records),
    ...settlementReminders(input, cfg),
    ...budgetPace(input, cfg, records),
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || compareCodeUnits(a.kind, b.kind) || compareCodeUnits(a.id, b.id));
}
