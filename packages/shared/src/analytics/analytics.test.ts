import { describe, expect, it } from 'vitest';

import { money, type Money } from '../money/money';
import { buildExpense, createBudget, createSettlement } from '../model/factories';
import { localDateFromDate } from '../model/dates';
import type { Expense } from '../model/types';
import type { SplitSpec } from '../splits/types';
import { createSampleData } from '../store/sample';
import { testDeps, withTimeZone } from '../test/helpers';
import {
  DEFAULT_INSIGHTS_CONFIG,
  generateInsights,
  monthOverMonth,
  normalizeDescription,
  rollingAverage,
  spendingByCategory,
  spendingByMonth,
  spendingRecords,
  type Insight,
} from './index';

const gbp = (n: number) => money(n, 'GBP');
let deps = testDeps(11);
const mine = (occurredOn: string, amount: Money, categoryId = 'food', description = 'x'): Expense =>
  buildExpense({ description, categoryId, total: amount, paidBy: 'me', occurredOn, createdBy: 'me' }, deps);
const shared = (occurredOn: string, amount: Money, split: SplitSpec, paidBy = 'friend', categoryId = 'food'): Expense =>
  buildExpense({ groupId: 'g', description: 'shared', categoryId, total: amount, paidBy, split, occurredOn, createdBy: 'me' }, deps);

describe('spending', () => {
  it('counts only my share, per currency', () => {
    const list = [
      mine('2026-03-01', gbp(1000)),
      shared('2026-03-02', gbp(3000), { type: 'equal', participants: ['me', 'friend', 'other'] }),
      shared('2026-03-03', gbp(3000), { type: 'equal', participants: ['friend', 'other'] }, 'me'), // I paid but consumed nothing
      mine('2026-03-04', money(5000, 'JPY'), 'travel'),
    ];
    expect(spendingRecords(list, { personId: 'me' }).map((r) => r.share.amountMinor)).toEqual([1000, 1000, 5000]);
    expect(spendingByCategory(list, { personId: 'me' })).toEqual([
      { categoryId: 'food', total: gbp(2000), count: 2 },
      { categoryId: 'travel', total: money(5000, 'JPY'), count: 1 },
    ]);
    expect(spendingByCategory(list, { personId: 'me', currency: 'JPY' })).toHaveLength(1);
    expect(spendingByCategory(list, { personId: 'me', from: '2026-03-02', to: '2026-03-03' })).toEqual([{ categoryId: 'food', total: gbp(1000), count: 1 }]);
  });

  it('buckets by the stored calendar date, even west of UTC', () => {
    withTimeZone('America/Los_Angeles', () => {
      // Logged at 8pm on Jan 31 in Los Angeles (Feb 1 in UTC): the stored date is Jan 31.
      const occurredOn = localDateFromDate(new Date('2026-02-01T04:00:00.000Z'));
      expect(occurredOn).toBe('2026-01-31');
      const list = [mine(occurredOn, gbp(500)), mine('2026-02-01', gbp(700)), mine('2026-02-28', gbp(100)), mine('2026-03-01', gbp(1))];
      expect(spendingByMonth(list, { personId: 'me' }).map((m) => [m.month, m.total.amountMinor])).toEqual([
        ['2026-01', 500],
        ['2026-02', 800],
        ['2026-03', 1],
      ]);
    });
    withTimeZone('Pacific/Kiritimati', () => {
      const list = [mine('2026-01-31', gbp(500))];
      expect(spendingByMonth(list, { personId: 'me' })[0]?.month).toBe('2026-01');
    });
  });

  it('fills empty months when a range is given, and computes changes and averages', () => {
    const list = [mine('2026-01-10', gbp(1000)), mine('2026-03-10', gbp(3000)), mine('2026-04-10', gbp(1500))];
    const series = spendingByMonth(list, { personId: 'me', fromMonth: '2025-12', toMonth: '2026-04' });
    expect(series.map((m) => [m.month, m.total.amountMinor])).toEqual([
      ['2025-12', 0],
      ['2026-01', 1000],
      ['2026-02', 0],
      ['2026-03', 3000],
      ['2026-04', 1500],
    ]);
    const mom = monthOverMonth(series);
    expect(mom[0]).toEqual({ month: '2025-12', current: gbp(0), previous: null, change: null, changeRatio: null });
    expect(mom[2]).toMatchObject({ month: '2026-02', change: gbp(-1000), changeRatio: -1 });
    expect(mom[3]).toMatchObject({ month: '2026-03', change: gbp(3000), changeRatio: null }); // previous was 0
    expect(mom[4]).toMatchObject({ month: '2026-04', change: gbp(-1500), changeRatio: -0.5 });
    const avg = rollingAverage(series, 3);
    expect(avg.map((a) => [a.month, a.average.amountMinor, a.monthsUsed])).toEqual([
      ['2025-12', 0, 1],
      ['2026-01', 500, 2],
      ['2026-02', 333, 3],
      ['2026-03', 1333, 3],
      ['2026-04', 1500, 3],
    ]);
    // Half-even rounding of the mean: (1 + 2) / 2 = 1.5 -> 2, (1 + 0) / 2 = 0.5 -> 0.
    expect(rollingAverage([{ month: '2026-01', total: gbp(1), count: 1 }, { month: '2026-02', total: gbp(2), count: 1 }], 2)[1]?.average.amountMinor).toBe(2);
    expect(rollingAverage([{ month: '2026-01', total: gbp(1), count: 1 }, { month: '2026-02', total: gbp(0), count: 0 }], 2)[1]?.average.amountMinor).toBe(0);
    expect(() => rollingAverage(series, 0)).toThrow(RangeError);
  });
});

describe('insights', () => {
  const kinds = (list: Insight[]) => list.map((i) => i.kind);

  it('flags a category spike against the previous months', () => {
    deps = testDeps(12);
    const list = [mine('2026-01-05', gbp(10000)), mine('2026-02-05', gbp(10000)), mine('2026-03-05', gbp(10000)), mine('2026-04-05', gbp(16000))];
    const out = generateInsights({ today: '2026-04-20', personId: 'me', expenses: list });
    const spike = out.find((i) => i.kind === 'category_spike');
    expect(spike).toMatchObject({ id: 'category_spike:2026-04:GBP:food', severity: 'notice', subject: { categoryId: 'food' } });
    expect(spike?.basis).toEqual([
      { label: 'thisMonth', value: gbp(16000) },
      { label: 'averagePreviousMonths', value: gbp(10000) },
      { label: 'monthsCompared', value: 3 },
      { label: 'ratio', value: '1.6' },
    ]);
    const warn = generateInsights({ today: '2026-04-20', personId: 'me', expenses: [...list, mine('2026-04-06', gbp(5000))] });
    expect(warn.find((i) => i.kind === 'category_spike')?.severity).toBe('warning');
    // Just under 1.5x: nothing.
    const calm = generateInsights({ today: '2026-04-20', personId: 'me', expenses: [...list.slice(0, 3), mine('2026-04-05', gbp(14999))] });
    expect(kinds(calm)).not.toContain('category_spike');
    // A brand-new category is not a spike.
    expect(kinds(generateInsights({ today: '2026-04-20', personId: 'me', expenses: [mine('2026-04-05', gbp(50000), 'travel')] }))).toEqual([]);
  });

  it('flags an unusual single expense', () => {
    const base = ['2026-02-01', '2026-02-08', '2026-02-15', '2026-02-22', '2026-03-01'].map((d) => mine(d, gbp(1000), 'groceries'));
    const big = mine('2026-03-10', gbp(3500), 'groceries', 'Big shop');
    const out = generateInsights({ today: '2026-03-12', personId: 'me', expenses: [...base, big] });
    const u = out.find((i) => i.kind === 'unusual_expense');
    expect(u?.id).toBe(`unusual_expense:${big.id}`);
    expect(u?.body.data.typical).toEqual(gbp(1000));
    expect(u?.subject.expenseIds).toEqual([big.id]);
    // Too few samples: nothing.
    expect(kinds(generateInsights({ today: '2026-03-12', personId: 'me', expenses: [...base.slice(1), big] }))).not.toContain('unusual_expense');
    // Older than the recent window: nothing.
    expect(kinds(generateInsights({ today: '2026-04-30', personId: 'me', expenses: [...base, big] }))).not.toContain('unusual_expense');
  });

  it('detects monthly and weekly recurring expenses', () => {
    const monthly = ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'].map((d, i) => mine(d, gbp(1099 + i), 'subscriptions', i % 2 ? 'Streaming  Plan' : 'streaming plan'));
    const weekly = ['2026-04-02', '2026-04-09', '2026-04-16', '2026-04-23'].map((d) => mine(d, gbp(500), 'transport', 'Bus pass'));
    const irregular = ['2026-04-01', '2026-04-03', '2026-04-20'].map((d) => mine(d, gbp(500), 'food', 'Bakery'));
    const out = generateInsights({ today: '2026-05-01', personId: 'me', expenses: [...monthly, ...weekly, ...irregular] }).filter((i) => i.kind === 'recurring_expense');
    expect(out.map((i) => [i.id, i.body.data.cadence, i.body.data.nextExpectedOn])).toEqual([
      ['recurring_expense:GBP:bus pass', 'weekly', '2026-04-30'],
      ['recurring_expense:GBP:streaming plan', 'monthly', '2026-05-30'],
    ]);
    // Amounts that vary too much are not "the same" expense.
    const varied = ['2026-01-05', '2026-02-05', '2026-03-05'].map((d, i) => mine(d, gbp(1000 * (i + 1)), 'utilities', 'Bill'));
    expect(kinds(generateInsights({ today: '2026-03-10', personId: 'me', expenses: varied }))).not.toContain('recurring_expense');
    // A series that stopped months ago is not reported as recurring.
    const lapsed = ['2026-01-10', '2026-02-10', '2026-03-10'].map((d) => mine(d, gbp(999), 'subscriptions', 'Old app'));
    const kindsAt = (today: string) => kinds(generateInsights({ today, personId: 'me', expenses: lapsed }));
    expect(kindsAt('2026-04-12')).toContain('recurring_expense');
    expect(kindsAt('2026-06-01')).not.toContain('recurring_expense');
    expect(normalizeDescription('  Netflix  Premium ')).toBe('netflix premium');
  });

  it('reminds about overdue and upcoming settlements', () => {
    const s = (from: string, to: string, dueOn: string | null, status: 'pending' | 'confirmed' = 'pending') =>
      createSettlement({ fromPersonId: from, toPersonId: to, amount: gbp(2000), occurredOn: '2026-03-01', dueOn, status }, deps);
    const list = [s('me', 'a', '2026-03-05'), s('b', 'me', '2026-03-08'), s('me', 'c', '2026-03-20'), s('me', 'd', null), s('me', 'e', '2026-03-01', 'confirmed'), s('x', 'y', '2026-03-01')];
    const out = generateInsights({ today: '2026-03-06', personId: 'me', expenses: [], settlements: list });
    expect(out.map((i) => [i.kind, i.severity, i.body.data.direction])).toEqual([
      ['settlement_overdue', 'warning', 'you_pay'],
      ['settlement_upcoming', 'info', 'you_receive'],
    ]);
    expect(out[0]?.body.data.daysOverdue).toBe(1);
    expect(out[1]?.body.data.daysUntil).toBe(2);
  });

  it('tracks budget pace in the budget currency only', () => {
    const budget = createBudget({ categoryId: 'food', amount: gbp(30000) }, deps);
    const total = createBudget({ categoryId: null, amount: gbp(100000) }, deps);
    const list = [mine('2026-04-02', gbp(9001)), mine('2026-04-05', gbp(2000)), mine('2026-04-06', money(99999, 'USD')), mine('2026-03-30', gbp(50000))];
    const out = generateInsights({ today: '2026-04-10', personId: 'me', expenses: list, budgets: [budget, total] }).filter((i) => i.kind === 'budget_pace');
    const food = out.find((i) => i.subject.budgetId === budget.id)!;
    // Exactly 10% over pace (11000 vs 10000) still counts as on track; 11001 is ahead.
    expect(food.body.data).toMatchObject({ status: 'ahead', spent: gbp(11001), expectedToDate: gbp(10000), projected: gbp(33003), daysLeft: 20, excludedCurrencies: 'USD' });
    expect(food.severity).toBe('notice');
    expect(out.find((i) => i.subject.budgetId === total.id)?.body.data.status).toBe('on_track');
    const over = generateInsights({ today: '2026-04-10', personId: 'me', expenses: [...list, mine('2026-04-09', gbp(20000))], budgets: [budget] });
    expect(over[0]).toMatchObject({ kind: 'budget_pace', severity: 'warning', body: { data: { status: 'over' } } });
  });

  it('is deterministic and sorted by severity', () => {
    const data = createSampleData();
    const input = { today: '2026-10-15', personId: data.profiles[0]!.personId, expenses: data.expenses, settlements: data.settlements, budgets: data.budgets };
    const a = generateInsights(input);
    const b = generateInsights({ ...input, expenses: [...input.expenses].reverse(), settlements: [...input.settlements].reverse() });
    expect(b).toEqual(a);
    expect(new Set(a.map((i) => i.id)).size).toBe(a.length);
    const order = { warning: 0, notice: 1, info: 2 };
    for (let i = 1; i < a.length; i++) expect(order[a[i]!.severity]).toBeGreaterThanOrEqual(order[a[i - 1]!.severity]);
    for (const kind of ['category_spike', 'unusual_expense', 'recurring_expense', 'settlement_overdue', 'settlement_upcoming', 'budget_pace']) {
      expect(kinds(a)).toContain(kind);
    }
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });

  it('accepts config overrides', () => {
    const list = [mine('2026-01-05', gbp(10000)), mine('2026-02-05', gbp(10000)), mine('2026-03-05', gbp(10000)), mine('2026-04-05', gbp(12000))];
    expect(kinds(generateInsights({ today: '2026-04-20', personId: 'me', expenses: list }))).not.toContain('category_spike');
    expect(kinds(generateInsights({ today: '2026-04-20', personId: 'me', expenses: list, config: { spikeRatio: '1.2' } }))).toContain('category_spike');
    expect(DEFAULT_INSIGHTS_CONFIG.spikeRatio).toBe('1.5');
  });
});
