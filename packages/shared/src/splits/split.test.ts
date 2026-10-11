import { describe, expect, it } from 'vitest';

import { money } from '../money/money';
import { createSeededRandom } from '../model/ids';
import { PERCENT_SUM_TOLERANCE, SplitValidationError, participantsOf, resolveSplit, singlePayer, validatePayers, validateSplit, type SplitSpec } from './index';

const usd = (n: number) => money(n, 'USD');
const codes = (spec: SplitSpec, total = usd(1000), memberIds?: string[]) => {
  const r = validateSplit(spec, total, memberIds ? { memberIds } : {});
  return r.ok ? [] : r.issues.map((i) => i.code);
};
const amounts = (spec: SplitSpec, total = usd(1000)) => resolveSplit(spec, total).map((s) => s.amount.amountMinor);

describe('equal', () => {
  it('splits exactly with leftover to the first listed', () => {
    expect(amounts({ type: 'equal', participants: ['a', 'b', 'c'] })).toEqual([334, 333, 333]);
    expect(amounts({ type: 'equal', participants: ['a', 'b', 'c'] }, money(100, 'JPY'))).toEqual([34, 33, 33]);
    expect(amounts({ type: 'equal', participants: ['c', 'a', 'b'] })).toEqual([334, 333, 333]);
    expect(resolveSplit({ type: 'equal', participants: ['a'] }, money(1001, 'KWD'))).toEqual([{ personId: 'a', amount: money(1001, 'KWD') }]);
  });

  it('validates participants', () => {
    expect(codes({ type: 'equal', participants: [] })).toEqual(['no_participants']);
    expect(codes({ type: 'equal', participants: ['a', 'a'] })).toEqual(['duplicate_participant']);
    expect(codes({ type: 'equal', participants: ['a', 'x'] }, usd(1000), ['a', 'b'])).toEqual(['not_a_member']);
    expect(codes({ type: 'equal', participants: ['a'] }, usd(0))).toEqual(['non_positive_total']);
    expect(codes({ type: 'equal', participants: ['a'] }, usd(-5))).toEqual(['non_positive_total']);
  });
});

describe('exact', () => {
  it('uses the amounts as given', () => {
    expect(amounts({ type: 'exact', amounts: [{ personId: 'a', amountMinor: 700 }, { personId: 'b', amountMinor: 300 }] })).toEqual([700, 300]);
    expect(amounts({ type: 'exact', amounts: [{ personId: 'a', amountMinor: 1000 }, { personId: 'b', amountMinor: 0 }] })).toEqual([1000, 0]);
  });

  it('must sum to the total', () => {
    const r = validateSplit({ type: 'exact', amounts: [{ personId: 'a', amountMinor: 700 }, { personId: 'b', amountMinor: 299 }] }, usd(1000));
    expect(r).toEqual({ ok: false, issues: [{ code: 'exact_sum_mismatch', expected: 1000, actual: 999 }] });
    expect(codes({ type: 'exact', amounts: [{ personId: 'a', amountMinor: 1001 }] })).toEqual(['exact_sum_mismatch']);
    expect(codes({ type: 'exact', amounts: [{ personId: 'a', amountMinor: 1100 }, { personId: 'b', amountMinor: -100 }] })).toEqual(['negative_amount']);
    expect(codes({ type: 'exact', amounts: [{ personId: 'a', amountMinor: 999.5 }, { personId: 'b', amountMinor: 0.5 }] })).toEqual(['invalid_amount', 'invalid_amount']);
  });

  it('rejects amounts whose sum overflows the safe integer range', () => {
    const big = Number.MAX_SAFE_INTEGER;
    const spec: SplitSpec = { type: 'exact', amounts: [{ personId: 'a', amountMinor: big }, { personId: 'b', amountMinor: big }] };
    expect(codes(spec, usd(100))).toEqual(['exact_sum_mismatch']);
    expect(() => resolveSplit(spec, usd(100))).toThrow(SplitValidationError);
  });
});

describe('percentage', () => {
  it('resolves percentages exactly', () => {
    expect(amounts({ type: 'percentage', percentages: [{ personId: 'a', percent: 50 }, { personId: 'b', percent: '50' }] })).toEqual([500, 500]);
    expect(amounts({ type: 'percentage', percentages: [{ personId: 'a', percent: 12.5 }, { personId: 'b', percent: 87.5 }] }, usd(999))).toEqual([125, 874]);
    expect(amounts({ type: 'percentage', percentages: [{ personId: 'a', percent: 0 }, { personId: 'b', percent: 100 }] })).toEqual([0, 1000]);
  });

  it('accepts sums within the documented tolerance and still distributes the whole total', () => {
    expect(PERCENT_SUM_TOLERANCE).toBe('0.01');
    const thirds: SplitSpec = { type: 'percentage', percentages: ['a', 'b', 'c'].map((personId) => ({ personId, percent: 33.33 })) };
    expect(codes(thirds)).toEqual([]); // 99.99
    expect(amounts(thirds)).toEqual([334, 333, 333]);
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: 50.01 }, { personId: 'b', percent: 50 }] })).toEqual([]); // 100.01
  });

  it('rejects sums outside the tolerance, bad numbers and too many decimals', () => {
    const r = validateSplit({ type: 'percentage', percentages: [{ personId: 'a', percent: 50 }, { personId: 'b', percent: 49.98 }] }, usd(1000));
    expect(r).toEqual({ ok: false, issues: [{ code: 'percent_sum_out_of_tolerance', expected: '100', actual: '99.98' }] });
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: 60 }, { personId: 'b', percent: 50 }] })).toEqual(['percent_sum_out_of_tolerance']);
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: -10 }, { personId: 'b', percent: 110 }] })).toEqual(['invalid_percent']);
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: Number.NaN }] })).toEqual(['invalid_percent']);
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: '100.00001' }] })).toEqual(['invalid_percent']);
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: 'abc' }] })).toEqual(['invalid_percent']);
    expect(codes({ type: 'percentage', percentages: [{ personId: 'a', percent: 0 }] })).toEqual(['percent_sum_out_of_tolerance']);
  });
});

describe('shares', () => {
  it('resolves proportionally', () => {
    expect(amounts({ type: 'shares', shares: [{ personId: 'a', shares: 2 }, { personId: 'b', shares: 1 }, { personId: 'c', shares: 1 }] })).toEqual([500, 250, 250]);
    expect(amounts({ type: 'shares', shares: [{ personId: 'a', shares: 1.5 }, { personId: 'b', shares: '0.5' }] }, money(1001, 'JPY'))).toEqual([751, 250]);
  });

  it('requires every share > 0', () => {
    expect(codes({ type: 'shares', shares: [{ personId: 'a', shares: 0 }, { personId: 'b', shares: 1 }] })).toEqual(['invalid_shares']);
    expect(codes({ type: 'shares', shares: [{ personId: 'a', shares: -1 }, { personId: 'b', shares: 1 }] })).toEqual(['invalid_shares']);
    expect(codes({ type: 'shares', shares: [{ personId: 'a', shares: Number.POSITIVE_INFINITY }] })).toEqual(['invalid_shares']);
  });
});

describe('adjustment', () => {
  it('splits the rest equally and adds adjustments', () => {
    // 1000 - 100 = 900 split 3 ways = 300 each; a gets +100.
    expect(amounts({ type: 'adjustment', adjustments: [{ personId: 'a', adjustmentMinor: 100 }, { personId: 'b', adjustmentMinor: 0 }, { personId: 'c', adjustmentMinor: 0 }] })).toEqual([400, 300, 300]);
    expect(amounts({ type: 'adjustment', adjustments: [{ personId: 'a', adjustmentMinor: -100 }, { personId: 'b', adjustmentMinor: 0 }] })).toEqual([450, 550]);
  });

  it('reports adjustments that overflow instead of throwing', () => {
    const spec = {
      type: 'adjustment' as const,
      adjustments: [
        { personId: 'a', adjustmentMinor: Number.MAX_SAFE_INTEGER },
        { personId: 'b', adjustmentMinor: Number.MAX_SAFE_INTEGER },
      ],
    };
    expect(validateSplit(spec, money(100, 'USD'))).toEqual({ ok: false, issues: [{ code: 'invalid_amount' }] });
  });

  it('rejects adjustments that make a share negative', () => {
    // rest = 1000 + 900 = 1900 -> 634/633/633; a gets 634 - 900 < 0.
    expect(codes({ type: 'adjustment', adjustments: [{ personId: 'a', adjustmentMinor: -900 }, { personId: 'b', adjustmentMinor: 0 }, { personId: 'c', adjustmentMinor: 0 }] })).toEqual(['negative_share']);
    expect(codes({ type: 'adjustment', adjustments: [{ personId: 'a', adjustmentMinor: 1200 }, { personId: 'b', adjustmentMinor: 0 }] })).toEqual(['negative_share']);
    expect(codes({ type: 'adjustment', adjustments: [{ personId: 'a', adjustmentMinor: 1.5 }] })).toEqual(['invalid_amount']);
  });
});

describe('resolveSplit', () => {
  it('throws SplitValidationError with issues', () => {
    expect(() => resolveSplit({ type: 'equal', participants: [] }, usd(100))).toThrow(SplitValidationError);
  });

  it('lists participants in spec order', () => {
    expect(participantsOf({ type: 'shares', shares: [{ personId: 'b', shares: 1 }, { personId: 'a', shares: 1 }] })).toEqual(['b', 'a']);
  });

  it('property: every valid spec resolves to shares summing exactly to the total', () => {
    const rand = createSeededRandom(2026);
    const people = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
    for (let run = 0; run < 1500; run++) {
      const currency = (['USD', 'JPY', 'KWD'] as const)[run % 3]!;
      const total = money(1 + Math.floor(rand() * 10 ** (1 + Math.floor(rand() * 9))), currency);
      const who = people.slice(0, 1 + Math.floor(rand() * people.length));
      const kind = run % 4;
      let spec: SplitSpec;
      if (kind === 0) spec = { type: 'equal', participants: who };
      else if (kind === 1) spec = { type: 'shares', shares: who.map((personId) => ({ personId, shares: 1 + Math.floor(rand() * 5) })) };
      else if (kind === 2) {
        const parts = who.map(() => Math.floor(rand() * 10000));
        const s = parts.reduce((a, b) => a + b, 0) || 1;
        const pct = parts.map((p) => Math.floor((p * 1_000_000) / s)); // 4 decimals
        pct[0] = (pct[0] ?? 0) + (1_000_000 - pct.reduce((a, b) => a + b, 0));
        spec = { type: 'percentage', percentages: who.map((personId, i) => ({ personId, percent: ((pct[i] ?? 0) / 10000).toFixed(4) })) };
      } else {
        spec = { type: 'adjustment', adjustments: who.map((personId) => ({ personId, adjustmentMinor: Math.floor(rand() * (total.amountMinor / who.length / 2)) })) };
      }
      const splits = resolveSplit(spec, total);
      expect(splits.reduce((a, s) => a + s.amount.amountMinor, 0)).toBe(total.amountMinor);
      expect(splits.every((s) => s.amount.currency === currency && s.amount.amountMinor >= 0)).toBe(true);
    }
  });
});

describe('payers', () => {
  it('accepts one or many payers summing to the total', () => {
    expect(validatePayers(singlePayer('a', usd(1000)), usd(1000))).toEqual({ ok: true });
    expect(validatePayers([{ personId: 'a', amount: usd(600) }, { personId: 'b', amount: usd(400) }], usd(1000))).toEqual({ ok: true });
  });

  it('rejects bad payer lists', () => {
    const c = (payers: Parameters<typeof validatePayers>[0], memberIds?: string[]) => {
      const r = validatePayers(payers, usd(1000), memberIds ? { memberIds } : {});
      return r.ok ? [] : r.issues.map((i) => i.code);
    };
    expect(c([])).toEqual(['no_payers']);
    expect(c([{ personId: 'a', amount: usd(500) }, { personId: 'a', amount: usd(500) }])).toEqual(['duplicate_payer']);
    expect(c([{ personId: 'a', amount: money(1000, 'EUR') }])).toEqual(['payer_currency_mismatch']);
    expect(c([{ personId: 'a', amount: usd(1100) }, { personId: 'b', amount: usd(-100) }])).toEqual(['non_positive_payer_amount']);
    expect(c([{ personId: 'a', amount: usd(999) }])).toEqual(['payer_sum_mismatch']);
    expect(c([{ personId: 'z', amount: usd(1000) }], ['a'])).toEqual(['not_a_member']);
  });
});
