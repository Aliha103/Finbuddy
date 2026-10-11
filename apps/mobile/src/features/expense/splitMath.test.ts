import { formatMoney, resolveSplit } from '@finbuddy/shared';
import { describe, expect, it } from 'vitest';

import { adjustShare, bestOn, contrast, dragStep, formatMinorWorklet, mixHex, moneyFormatSpec, moveBoundary, remainderCarriers, snapBoundary } from './splitMath';

describe('moveBoundary', () => {
  it('moves whole minor units between two neighbours and keeps the sum', () => {
    expect(moveBoundary([3334, 3333, 3333], 0, 100)).toEqual([3434, 3233, 3333]);
    expect(moveBoundary([3334, 3333, 3333], 1, -250)).toEqual([3334, 3083, 3583]);
    const moved = moveBoundary([3334, 3333, 3333], 0, 7.4);
    expect(moved.reduce((a, b) => a + b, 0)).toBe(10_000);
    expect(moved).toEqual([3341, 3326, 3333]);
  });

  it('clamps both neighbours at zero', () => {
    expect(moveBoundary([3334, 3333, 3333], 0, 99_999)).toEqual([6667, 0, 3333]);
    expect(moveBoundary([3334, 3333, 3333], 0, -99_999)).toEqual([0, 6667, 3333]);
  });

  it('ignores an index with no right-hand neighbour', () => {
    expect(moveBoundary([100, 200], 1, 50)).toEqual([100, 200]);
    expect(moveBoundary([100, 200], -1, 50)).toEqual([100, 200]);
  });
});

describe('adjustShare', () => {
  it('takes from the next person, or the previous one for the last segment', () => {
    expect(adjustShare([3334, 3333, 3333], 0, 100)).toEqual([3434, 3233, 3333]);
    expect(adjustShare([3334, 3333, 3333], 2, 100)).toEqual([3334, 3233, 3433]);
    expect(adjustShare([3334, 3333, 3333], 2, -5000)).toEqual([3334, 6666, 0]);
  });
});

describe('moneyFormatSpec and formatMinorWorklet', () => {
  it('prints GBP in en-GB like formatMoney', () => {
    const spec = moneyFormatSpec('GBP', 'en-GB');
    expect(spec).toMatchObject({ decimals: 2, decimal: '.', group: ',', prefix: '£', suffix: '' });
    expect(formatMinorWorklet(3334, spec)).toBe('£33.34');
    expect(formatMinorWorklet(123456789, spec)).toBe('£1,234,567.89');
    expect(formatMinorWorklet(5, spec)).toBe('£0.05');
    expect(formatMinorWorklet(0, spec)).toBe('£0.00');
  });

  it('prints zero-decimal and three-decimal currencies', () => {
    const jpy = moneyFormatSpec('JPY', 'en-GB');
    expect(jpy.decimals).toBe(0);
    expect(formatMinorWorklet(1000, jpy)).toBe(formatMoney({ amountMinor: 1000, currency: 'JPY' }, { locale: 'en-GB' }));
    const kwd = moneyFormatSpec('KWD', 'en-GB');
    expect(kwd.decimals).toBe(3);
    expect(formatMinorWorklet(10_000, kwd)).toBe(formatMoney({ amountMinor: 10_000, currency: 'KWD' }, { locale: 'en-GB' }));
  });

  it('puts a trailing symbol after the digits in de-DE', () => {
    const spec = moneyFormatSpec('EUR', 'de-DE');
    expect(spec.decimal).toBe(',');
    expect(spec.prefix).toBe('');
    expect(spec.suffix.trim()).toBe('€');
    expect(formatMinorWorklet(123456, spec).replace(/ /g, ' ')).toBe('1.234,56 €');
  });
});

describe('remainderCarriers', () => {
  it('marks the first person for £100 split three ways equally', () => {
    const spec = { type: 'equal', participants: ['a', 'b', 'c'] } as const;
    const resolved = resolveSplit(spec, { amountMinor: 10_000, currency: 'GBP' });
    expect(resolved.map((s) => s.amount.amountMinor)).toEqual([3334, 3333, 3333]);
    expect([...remainderCarriers(spec, resolved, 10_000)]).toEqual(['a']);
  });

  it('marks nobody when the split is even or exact', () => {
    const even = { type: 'equal', participants: ['a', 'b', 'c'] } as const;
    expect(remainderCarriers(even, resolveSplit(even, { amountMinor: 3000, currency: 'JPY' }), 3000).size).toBe(0);
    const exact = { type: 'exact', amounts: [{ personId: 'a', amountMinor: 3334 }, { personId: 'b', amountMinor: 6666 }] } as const;
    expect(remainderCarriers(exact, resolveSplit(exact, { amountMinor: 10_000, currency: 'GBP' }), 10_000).size).toBe(0);
  });

  it('follows the engine for percentages, shares and adjustments', () => {
    const pct = { type: 'percentage', percentages: [{ personId: 'a', percent: '33.33' }, { personId: 'b', percent: '33.33' }, { personId: 'c', percent: '33.34' }] } as const;
    const pctResolved = resolveSplit(pct, { amountMinor: 10_000, currency: 'GBP' });
    const pctCarriers = remainderCarriers(pct, pctResolved, 10_000);
    for (const s of pctResolved) expect(pctCarriers.has(s.personId)).toBe(s.amount.amountMinor > Math.floor((10_000 * Number(pct.percentages.find((p) => p.personId === s.personId)!.percent)) / 100));

    const shares = { type: 'shares', shares: [{ personId: 'a', shares: 1 }, { personId: 'b', shares: 1 }, { personId: 'c', shares: 2 }] } as const;
    const sharesResolved = resolveSplit(shares, { amountMinor: 9_801, currency: 'JPY' });
    expect(sharesResolved.map((s) => s.amount.amountMinor)).toEqual([2450, 2450, 4901]);
    expect([...remainderCarriers(shares, sharesResolved, 9_801)]).toEqual(['c']);

    const adj = { type: 'adjustment', adjustments: [{ personId: 'a', adjustmentMinor: 500 }, { personId: 'b', adjustmentMinor: 0 }, { personId: 'c', adjustmentMinor: 0 }] } as const;
    const adjResolved = resolveSplit(adj, { amountMinor: 10_000, currency: 'GBP' });
    const base = Math.floor(9_500 / 3);
    const expected = adj.adjustments.filter((a) => adjResolved.find((s) => s.personId === a.personId)!.amount.amountMinor > base + a.adjustmentMinor).map((a) => a.personId);
    expect([...remainderCarriers(adj, adjResolved, 10_000)]).toEqual(expected);
    expect(expected.length).toBe(2);
  });
});

describe('snapBoundary and dragStep', () => {
  it('snaps the moved share to whole major units and lets the neighbour take the pennies', () => {
    expect(snapBoundary([4012, 2655, 3333], 0, 100)).toEqual([4000, 2667, 3333]);
    expect(snapBoundary([0, 6667, 3333], 0, 100)).toEqual([0, 6667, 3333]);
    expect(snapBoundary([6667, 0, 3333], 0, 100)).toEqual([6667, 0, 3333]);
    expect(snapBoundary([1234, 766], 0, 1)).toEqual([1234, 766]);
  });

  it('uses one major unit when that is enough travel, coarser 1-2-5 steps otherwise', () => {
    // £100 on a 358-point bar: £1 is 3.6 points, so the step is £2 (7.2 points).
    expect(dragStep(2, 10_000, 358)).toBe(200);
    // ¥3,000 on 358 points: ¥1 is 0.12 points; ¥50 is 5.97 (under 6), so ¥100.
    expect(dragStep(0, 3000, 358)).toBe(100);
    // £10 on 358 points: £1 is 35.8 points.
    expect(dragStep(2, 1000, 358)).toBe(100);
  });
});

describe('colour helpers', () => {
  it('mixes and picks the readable label', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixHex('#1F4FD8', '#FFFFFF', 1)).toBe('#1F4FD8');
    expect(contrast('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    expect(bestOn('#F2B705', ['#FFFFFF', '#1A1420'])).toBe('#1A1420');
    expect(bestOn('#1F4FD8', ['#FFFFFF', '#1A1420'])).toBe('#FFFFFF');
  });
});
