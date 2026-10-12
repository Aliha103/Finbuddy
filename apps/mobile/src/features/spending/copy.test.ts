// The spending sentences, checked against figures the engine computes for the sample data.
import { addMonths, createSampleData, formatMoney, generateInsights, monthOf, monthOverMonth, spendingByMonth, type Money, type PersonId } from '@finbuddy/shared';
import { describe, expect, test } from 'vitest';

import { changeInWords, monthName, paceSentence, type Formatter } from '@/features/common/format';

import { findPace } from './budgetPace';
import { excludedNote, expenseCount } from './copy';
import { HATCH, SPIKE_MARKER, indexAtX, layoutBars, monthCues, partialHatched, spikeMonths } from './barGeometry';

/** A Formatter for en-GB without the data layer (the real one is a hook). */
function formatter(locale = 'en-GB'): Formatter {
  const money = (m: Money) => formatMoney(m, { locale });
  const spokenMoney = (m: Money) => formatMoney(m, { locale, currencyDisplay: 'name' });
  const isMoney = (p: unknown): p is Money => typeof p === 'object' && p !== null && 'amountMinor' in p;
  return {
    locale,
    money,
    spokenMoney,
    say: (...parts) => ({
      text: parts.map((p) => (typeof p === 'string' ? p : isMoney(p) ? money(p) : p.text)).join(''),
      spoken: parts.map((p) => (typeof p === 'string' ? p : isMoney(p) ? spokenMoney(p) : p.spoken)).join(''),
    }),
    date: (d) => d,
    month: (m) => m,
    number: (n) => String(n),
    percent: (ratio) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio),
    currencyName: (c) => c,
    category: (id) => id ?? 'All spending',
    name: () => 'You',
    isMe: () => true,
  };
}

const TODAY = '2026-10-11';
const sample = createSampleData({ anchor: TODAY });
const me: PersonId = sample.profiles[0]!.personId;
const thisMonth = monthOf(TODAY);
const series = (currency: string) => monthOverMonth(spendingByMonth(sample.expenses, { personId: me, fromMonth: addMonths(thisMonth, -5), toMonth: thisMonth }).filter((m) => m.total.currency === currency));

describe('changeInWords', () => {
  const f = formatter();
  test('this month in GBP against September, from the engine', () => {
    const october = series('GBP').find((m) => m.month === thisMonth)!;
    const words = changeInWords(f, october);
    expect(words.text).toBe('Up 68% (£829.50) from September');
    expect(words.spoken).toBe('Up 68% (829.50 British pounds) from September');
  });
  test('the first month of the window has nothing to compare with', () => {
    expect(changeInWords(f, series('GBP')[0]!).text).toBe('No April figures to compare with');
  });
  test('two empty months in a row', () => {
    const october = series('JPY').find((m) => m.month === thisMonth)!;
    expect(changeInWords(f, october).text).toBe('Nothing in September either');
  });
  test('a month after nothing', () => {
    const august = series('JPY').find((m) => m.month === '2026-08')!;
    expect(changeInWords(f, august).text).toBe('Up JP¥72,286 from nothing in July');
  });
  test('a tiny change reads as about the same', () => {
    const june = series('GBP').find((m) => m.month === '2026-06')!;
    expect(changeInWords(f, june).text).toBe('About the same as May (up £2.21)');
  });
  test('a fall', () => {
    const august = series('USD').find((m) => m.month === '2026-08')!;
    expect(changeInWords(f, august).text).toBe('Down 18% (US$13.09) from July');
  });
});

describe('spike markers', () => {
  const insights = generateInsights({ today: TODAY, personId: me, expenses: sample.expenses, settlements: sample.settlements, budgets: sample.budgets });
  const spikes = insights.filter((i) => i.kind === 'category_spike');
  test('come from the engine\'s category_spike insights, per currency', () => {
    expect(spikes.length).toBeGreaterThan(0);
    for (const spike of spikes) {
      const current = spike.body.data.current as Money;
      expect(spikeMonths(insights, current.currency).has(thisMonth)).toBe(true);
      expect(spikeMonths(insights, current.currency, spike.subject.categoryId).has(thisMonth)).toBe(true);
    }
  });
  test('stay off a currency or a category the engine did not flag', () => {
    const flagged = new Set<string>(spikes.map((s) => (s.body.data.current as Money).currency));
    for (const currency of ['GBP', 'USD', 'JPY', 'EUR'].filter((c) => !flagged.has(c))) expect(spikeMonths(insights, currency).size).toBe(0);
    expect(spikeMonths(insights, 'GBP', 'not-a-category').size).toBe(0);
  });
});

describe('budget pace', () => {
  const f = formatter();
  const insights = generateInsights({ today: TODAY, personId: me, expenses: sample.expenses, settlements: sample.settlements, budgets: sample.budgets });
  test('the food budget, from the budget_pace insight', () => {
    const food = sample.budgets.find((b) => b.categoryId === 'food')!;
    const pace = findPace(insights, food.id)!;
    expect(pace).not.toBeNull();
    expect(paceSentence(f, pace).text).toBe('£159.50 of £200.00, 20 days left, ahead of pace');
    expect(excludedNote(pace.excluded)).toBe('Spending in USD is not counted, currencies are never mixed');
  });
  test('no note when nothing was excluded', () => {
    expect(excludedNote([])).toBeNull();
    expect(excludedNote(['JPY', 'USD'])).toBe('Spending in JPY and USD is not counted, currencies are never mixed');
  });
});

describe('chart geometry', () => {
  test('bars scale to the largest month and a month with nothing keeps a stub', () => {
    const { bars, baseline, column } = layoutBars([0, 50, 100], 300, 120);
    expect(column).toBe(100);
    expect(baseline).toBe(120);
    expect(bars.map((b) => b.height)).toEqual([2, 59, 118]);
    expect(bars.map((b) => b.zero)).toEqual([true, false, false]);
    expect(bars.every((b) => b.y + b.height === 120)).toBe(true);
  });
  test('the month still running is partial and a spike leaves room for its marker', () => {
    const { bars } = layoutBars([50, 100, 80], 300, 120, { partialIndex: 2, spikes: [false, true, false] });
    expect(bars.map((b) => b.partial)).toEqual([false, false, true]);
    const tallest = bars[1]!;
    expect(tallest.spike).not.toBeNull();
    expect(tallest.spike!.bottom).toBe(tallest.y - SPIKE_MARKER.gap);
    expect(tallest.spike!.top).toBeGreaterThanOrEqual(0);
    expect(tallest.spike!.cx).toBe(tallest.x + tallest.width / 2);
    expect(bars[0]!.spike).toBeNull();
  });
  test('a partial month too short to show stripes is drawn plain, and the key leaves the hatch out', () => {
    const { bars } = layoutBars([10_000, 5], 300, 120, { partialIndex: 1 });
    expect(bars[1]!.height).toBeLessThan(HATCH.minHeight);
    expect(bars[1]!.partial).toBe(false);
    expect(partialHatched([10_000, 5], 1, 120)).toBe(false);
    expect(partialHatched([10_000, 8_000], 1, 120)).toBe(true);
    expect(partialHatched([10_000, 0], 1, 120)).toBe(false);
  });
  test('without a spike the bars keep the full height', () => {
    expect(layoutBars([100], 100, 120).bars[0]!.y).toBe(2);
  });
  test('the selected month carries a cue beyond its colour, on exactly one column', () => {
    const months = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];
    const cues = monthCues(months, '2026-09', '2026-10', new Set(['2026-10']));
    expect(cues.filter((c) => c.selected).map((c) => c.month)).toEqual(['2026-09']);
    expect(cues.filter((c) => c.partial).map((c) => c.month)).toEqual(['2026-10']);
    expect(cues.filter((c) => c.spike).map((c) => c.month)).toEqual(['2026-10']);
  });
  test('index under a finger is clamped to the columns', () => {
    expect(indexAtX(-10, 300, 6)).toBe(0);
    expect(indexAtX(149, 300, 6)).toBe(2);
    expect(indexAtX(299, 300, 6)).toBe(5);
    expect(indexAtX(400, 300, 6)).toBe(5);
  });
});

describe('small words', () => {
  test('month names follow the locale', () => {
    expect(monthName('en-GB', '2026-10')).toBe('October');
    expect(monthName('en-GB', '2026-10', 'short')).toBe('Oct');
    expect(monthName('de-DE', '2026-03')).toBe('März');
  });
  test('counts', () => {
    expect(expenseCount(1)).toBe('1 expense');
    expect(expenseCount(4)).toBe('4 expenses');
  });
});
