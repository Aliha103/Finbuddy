import type { Insight, InsightSeverity } from '@finbuddy/shared';

import { categoryLabel, valueText, type Formatter, type Spoken } from './format';

/** PREVIEW COPY for insights: fills the engine's placeholder templates with formatted values. */

export function severityLabel(severity: InsightSeverity): string {
  return severity === 'warning' ? 'Warning' : severity === 'notice' ? 'Worth a look' : 'For your information';
}

/** Fills "{key}" placeholders. A category in mid-sentence is lower-cased ("your typical food & dining expense"). */
function fill(f: Formatter, template: string, data: Insight['body']['data']): Spoken {
  const parts: (string | Spoken)[] = [];
  let last = 0;
  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    const key = match[1] ?? '';
    const at = match.index ?? 0;
    parts.push(template.slice(last, at));
    let value = valueText(f, data[key], key);
    if (key === 'category' && at > 0) value = { text: value.text.toLowerCase(), spoken: value.spoken.toLowerCase() };
    parts.push(value);
    last = at + match[0].length;
  }
  parts.push(template.slice(last));
  return f.say(...parts);
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
    context.push(f.say(`Budget: ${categoryLabel(typeof data.category === 'string' ? data.category : null)}, monthly`));
    if (typeof data.excludedCurrencies === 'string' && data.excludedCurrencies) {
      context.push(f.say(`Spending in ${data.excludedCurrencies} is not counted in this budget, because currencies are never mixed.`));
    }
  }
  if ((insight.kind === 'settlement_overdue' || insight.kind === 'settlement_upcoming') && typeof data.counterpartyId === 'string') {
    context.push(f.say(data.direction === 'you_pay' ? `To ${f.name(data.counterpartyId)}` : `From ${f.name(data.counterpartyId)}`));
  }
  if (insight.kind === 'category_spike' || insight.kind === 'unusual_expense') {
    context.push(f.say(`Category: ${categoryLabel(insight.subject.categoryId)}`));
  }
  return { title: insight.title, body: fill(f, insight.body.template, data), context };
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

/** The numbers an insight was based on, as label and formatted value. */
export function basisRows(f: Formatter, insight: Insight): { label: string; value: Spoken }[] {
  return insight.basis.map((b) => ({ label: BASIS_LABELS[b.label] ?? humanise(b.label), value: valueText(f, b.value, b.label) }));
}
