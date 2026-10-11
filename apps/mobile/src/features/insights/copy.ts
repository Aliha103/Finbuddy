// apps/mobile/src/features/insights/copy.ts
// FinBuddy's words for the engine's insights (DIRECTION.md section 4, Insights). The engine supplies
// the facts (kind, data, basis); this file supplies the sentence, with every amount formatted in the
// device locale and spoken with its currency name. Nothing here invents a number: a value that the
// engine did not compute never appears.
import type { Insight, InsightSeverity } from '@finbuddy/shared';

import { categoryLabel, valueText, type Formatter, type Spoken } from '@/features/common/format';

/** The footer under every insights list: the truth about where insights come from. */
export const INSIGHTS_FOOTER = 'Worked out on your phone from your own entries. Nothing is sent anywhere.';
/** The empty state. */
export const INSIGHTS_EMPTY = 'Nothing to flag. Keep logging and this fills in';

export function severityLabel(severity: InsightSeverity): string {
  return severity === 'warning' ? 'Warning' : severity === 'notice' ? 'Worth a look' : 'For your information';
}

type Data = Insight['body']['data'];

const str = (data: Data, key: string): string | null => (typeof data[key] === 'string' ? (data[key] as string) : null);
const num = (data: Data, key: string): number | null => (typeof data[key] === 'number' ? (data[key] as number) : null);
const lower = (s: Spoken): Spoken => ({ text: s.text.toLowerCase(), spoken: s.spoken.toLowerCase() });
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

/** "2.6" -> "2.6", "18.00" -> "18": the ratio with at most one decimal, in the locale's digits. */
function times(f: Formatter, ratio: string | null): string {
  const n = Number(ratio ?? 0);
  return Number.isFinite(n) ? f.number(n, 1) : (ratio ?? '');
}

/** "1 Nov": day and short month, without the year (the insight is about the coming weeks). */
function nearDate(f: Formatter, date: string | null): Spoken {
  if (!date) return f.say('soon');
  try {
    return f.say(new Intl.DateTimeFormat(f.locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`)));
  } catch {
    return f.say(f.date(date));
  }
}

/** Fills "{key}" placeholders of an engine template: the fallback for a kind this file does not know. */
function fill(f: Formatter, template: string, data: Data): Spoken {
  const parts: (string | Spoken)[] = [];
  let last = 0;
  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    const key = match[1] ?? '';
    const at = match.index ?? 0;
    parts.push(template.slice(last, at));
    let value = valueText(f, data[key], key);
    if (key === 'category' && at > 0) value = lower(value);
    parts.push(value);
    last = at + match[0].length;
  }
  parts.push(template.slice(last));
  return f.say(...parts);
}

/** The short title above the body. */
export function insightTitle(insight: Insight): string {
  const data = insight.body.data;
  switch (insight.kind) {
    case 'category_spike':
      return insight.severity === 'warning' ? 'Spending spike' : 'Spending is up';
    case 'unusual_expense':
      return 'Unusually large expense';
    case 'recurring_expense':
      return 'Looks like a regular expense';
    case 'settlement_overdue':
      return data.direction === 'you_pay' ? 'Payment overdue' : 'Payment to you is overdue';
    case 'settlement_upcoming':
      return data.direction === 'you_pay' ? 'Payment due soon' : 'Payment to you due soon';
    case 'budget_pace':
      return data.status === 'over' ? 'Over budget' : data.status === 'ahead' ? 'Ahead of budget pace' : 'Budget on track';
  }
  return insight.title;
}

/** The one-sentence body, e.g. "Food & dining is 2.6 times your usual this month". */
export function insightBody(f: Formatter, insight: Insight): Spoken {
  const data = insight.body.data;
  const amount = (key: string): Spoken => valueText(f, data[key], key);
  switch (insight.kind) {
    case 'category_spike':
      return f.say(categoryLabel(str(data, 'category')), ` is ${times(f, str(data, 'ratio'))} times your usual this month`);
    case 'unusual_expense':
      return f.say(str(data, 'description') ?? 'This expense', ` is ${times(f, str(data, 'ratio'))} times your typical `, lower(f.say(categoryLabel(str(data, 'category')))), ' expense');
    case 'recurring_expense':
      return f.say(str(data, 'description') ?? 'This expense', ` looks ${str(data, 'cadence') ?? 'regular'}, about `, amount('amount'), ', next around ', nearDate(f, str(data, 'nextExpectedOn')));
    case 'settlement_overdue': {
      const who = str(data, 'counterpartyId');
      const ago = days(num(data, 'daysOverdue') ?? 0);
      return data.direction === 'you_pay'
        ? f.say('Your ', amount('amount'), who ? ` to ${f.name(who)}` : '', ` was due ${ago} ago`)
        : f.say(amount('amount'), who ? ` from ${f.name(who)}` : ' to you', ` was due ${ago} ago`);
    }
    case 'settlement_upcoming': {
      const who = str(data, 'counterpartyId');
      const until = num(data, 'daysUntil') ?? 0;
      const when = until === 0 ? 'is due today' : `is due in ${days(until)}`;
      return data.direction === 'you_pay' ? f.say('Your ', amount('amount'), who ? ` to ${f.name(who)}` : '', ` ${when}`) : f.say(amount('amount'), who ? ` from ${f.name(who)}` : ' to you', ` ${when}`);
    }
    case 'budget_pace': {
      const category = str(data, 'category');
      const left = num(data, 'daysLeft') ?? 0;
      return f.say(amount('spent'), ' of your ', amount('budget'), category ? ` ${categoryLabel(category).toLowerCase()} budget` : ' budget', `, ${days(left)} left`);
    }
  }
  return fill(f, insight.body.template, data);
}

export interface InsightCopy {
  readonly title: string;
  readonly body: Spoken;
  /** Extra context lines: which budget, who the payment is with, currencies left out. */
  readonly context: readonly Spoken[];
}

export function insightCopy(f: Formatter, insight: Insight): InsightCopy {
  const data = insight.body.data;
  const context: Spoken[] = [];
  if (insight.kind === 'budget_pace') {
    const excluded = str(data, 'excludedCurrencies');
    if (excluded) context.push(f.say(`Spending in ${excluded.split(',').join(' and ')} is not counted, currencies are never mixed`));
  }
  if (insight.kind === 'category_spike' || insight.kind === 'unusual_expense') {
    context.push(f.say(`Category: ${categoryLabel(insight.subject.categoryId)}`));
  }
  return { title: insightTitle(insight), body: insightBody(f, insight), context };
}

const BASIS_LABELS: Record<string, string> = {
  thisMonth: 'This month so far',
  averagePreviousMonths: 'Average of the months before',
  monthsCompared: 'Months compared',
  ratio: 'Times the usual amount',
  amount: 'Amount',
  median: 'Typical (median) amount',
  samples: 'Similar expenses compared',
  lookbackDays: 'Days looked back',
  occurrences: 'Times seen',
  typicalAmount: 'Typical amount',
  lastOn: 'Last seen',
  cadence: 'Repeats',
  dueOn: 'Due date',
  daysOverdue: 'Days overdue',
  daysUntil: 'Days until due',
  spent: 'Spent so far this month',
  budget: 'Monthly budget',
  expectedToDate: 'Expected by today at an even pace',
  projectedMonthEnd: 'Projected by month end at this pace',
  dayOfMonth: 'Day of the month',
  daysInMonth: 'Days in the month',
};

function humanise(label: string): string {
  const words = label.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "Why am I seeing this": the numbers an insight was based on, as label and formatted value. */
export function basisRows(f: Formatter, insight: Insight): { label: string; value: Spoken }[] {
  return insight.basis.map((b) => ({ label: BASIS_LABELS[b.label] ?? humanise(b.label), value: valueText(f, b.value, b.label) }));
}
