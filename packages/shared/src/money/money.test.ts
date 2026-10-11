import { describe, expect, it } from 'vitest';

import { createSeededRandom } from '../model/ids';
import {
  CURRENCY_CODES,
  CURRENCY_MINOR_UNITS,
  CurrencyMismatchError,
  abs,
  add,
  allocate,
  allocateMinor,
  compare,
  equals,
  formatMoney,
  formatMoneyForInput,
  formatMoneyToParts,
  fromDecimalString,
  getNumberSeparators,
  isCurrencyCode,
  isMoney,
  isNegative,
  isPositive,
  isZero,
  max,
  min,
  minorUnits,
  money,
  negate,
  parseMoneyInput,
  subtract,
  sum,
  toCurrencyCode,
  toDecimalString,
  zero,
  type CurrencyCode,
  type Money,
} from './index';

const usd = (n: number) => money(n, 'USD');

describe('currency table', () => {
  it('uses ISO 4217 minor units', () => {
    expect(minorUnits('USD')).toBe(2);
    for (const code of ['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'UGX', 'XAF', 'XOF', 'PYG'] as const) expect(minorUnits(code)).toBe(0);
    for (const code of ['KWD', 'BHD', 'OMR', 'JOD', 'TND', 'LYD', 'IQD'] as const) expect(minorUnits(code)).toBe(3);
    expect(minorUnits('HUF')).toBe(2); // ISO says 2, even though cash is whole forints
    expect(minorUnits('CLF')).toBe(4);
  });

  it('covers every currency Intl supports that has a minor unit', () => {
    const supportedValuesOf = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (!supportedValuesOf) return;
    const missing = supportedValuesOf('currency').filter((c) => !isCurrencyCode(c) && !['XDR', 'XSU'].includes(c));
    expect(missing).toEqual([]);
  });

  it('every table entry is accepted by Intl.NumberFormat', () => {
    for (const code of CURRENCY_CODES) {
      expect(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: code })).not.toThrow();
    }
    expect(CURRENCY_CODES.length).toBe(Object.keys(CURRENCY_MINOR_UNITS).length);
    expect(CURRENCY_CODES.length).toBeGreaterThan(150);
  });

  it('validates codes', () => {
    expect(isCurrencyCode('EUR')).toBe(true);
    expect(isCurrencyCode('eur')).toBe(false);
    expect(isCurrencyCode('XXX')).toBe(false);
    expect(isCurrencyCode('toString')).toBe(false);
    expect(toCurrencyCode(' eur ')).toBe('EUR');
    expect(() => toCurrencyCode('ABC')).toThrow(RangeError);
    expect(() => minorUnits('ABC' as CurrencyCode)).toThrow(RangeError);
  });
});

describe('Money arithmetic', () => {
  it('creates validated values', () => {
    expect(money(-0, 'USD').amountMinor).toBe(0);
    expect(Object.is(money(-0, 'USD').amountMinor, 0)).toBe(true);
    expect(() => money(1.5, 'USD')).toThrow(RangeError);
    expect(() => money(Number.NaN, 'USD')).toThrow(RangeError);
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, 'USD')).toThrow(RangeError);
    expect(() => money(1, 'XYZ' as CurrencyCode)).toThrow(RangeError);
    expect(isMoney(usd(5))).toBe(true);
    expect(isMoney({ amountMinor: 1.2, currency: 'USD' })).toBe(false);
    expect(isMoney({ amountMinor: 1, currency: 'usd' })).toBe(false);
    expect(isMoney(null)).toBe(false);
  });

  it('adds, subtracts, negates and compares', () => {
    expect(add(usd(150), usd(275))).toEqual(usd(425));
    expect(subtract(usd(150), usd(275))).toEqual(usd(-125));
    expect(negate(usd(5))).toEqual(usd(-5));
    expect(negate(usd(0)).amountMinor).toBe(0);
    expect(abs(usd(-7))).toEqual(usd(7));
    expect(compare(usd(1), usd(2))).toBe(-1);
    expect(compare(usd(2), usd(2))).toBe(0);
    expect(compare(usd(3), usd(2))).toBe(1);
    expect(equals(usd(1), money(1, 'EUR'))).toBe(false);
    expect(isZero(zero('JPY'))).toBe(true);
    expect(isPositive(usd(1))).toBe(true);
    expect(isNegative(usd(-1))).toBe(true);
    expect(min(usd(1), usd(2))).toEqual(usd(1));
    expect(max(usd(1), usd(2))).toEqual(usd(2));
    expect(sum([usd(1), usd(2), usd(3)])).toEqual(usd(6));
    expect(sum([], 'KWD')).toEqual(money(0, 'KWD'));
    expect(() => sum([])).toThrow(RangeError);
  });

  it('throws on currency mismatch', () => {
    const eur = money(100, 'EUR');
    expect(() => add(usd(1), eur)).toThrow(CurrencyMismatchError);
    expect(() => subtract(usd(1), eur)).toThrow(CurrencyMismatchError);
    expect(() => compare(usd(1), eur)).toThrow(CurrencyMismatchError);
    expect(() => sum([usd(1), eur])).toThrow(CurrencyMismatchError);
    expect(() => min(usd(1), eur)).toThrow(CurrencyMismatchError);
  });

  it('guards the safe integer range', () => {
    expect(() => add(usd(Number.MAX_SAFE_INTEGER), usd(1))).toThrow(RangeError);
    expect(() => subtract(usd(Number.MIN_SAFE_INTEGER), usd(1))).toThrow(RangeError);
  });
});

describe('decimal strings', () => {
  it('round-trips canonical strings for 0, 2, 3 and 4 decimal currencies', () => {
    expect(toDecimalString(usd(123456))).toBe('1234.56');
    expect(toDecimalString(usd(-5))).toBe('-0.05');
    expect(toDecimalString(money(1234, 'JPY'))).toBe('1234');
    expect(toDecimalString(money(1250, 'KWD'))).toBe('1.250');
    expect(toDecimalString(money(1, 'CLF'))).toBe('0.0001');
    expect(fromDecimalString('1234.56', 'USD')).toEqual(usd(123456));
    expect(fromDecimalString('-0.05', 'USD')).toEqual(usd(-5));
    expect(fromDecimalString('1.25', 'KWD')).toEqual(money(1250, 'KWD'));
    expect(fromDecimalString('100.00', 'JPY')).toEqual(money(100, 'JPY'));
    expect(() => fromDecimalString('1.234', 'USD')).toThrow(RangeError);
    expect(() => fromDecimalString('1,00', 'USD')).toThrow(RangeError);
    expect(() => fromDecimalString('99999999999999999', 'USD')).toThrow(RangeError);
  });
});

describe('formatMoney', () => {
  it('formats with currency and ISO digits', () => {
    expect(formatMoney(usd(123456), 'en-US')).toBe('$1,234.56');
    expect(formatMoney(money(1234, 'JPY'), { locale: 'en-US' })).toBe('¥1,234');
    expect(formatMoney(money(1234, 'KWD'), { locale: 'en-US', currencyDisplay: 'code' })).toMatch(/^KWD\s1\.234$/);
    // CLDR would show IQD with 0 decimals; we keep ISO's 3 so stored units keep their meaning.
    expect(formatMoney(money(1500, 'IQD'), { locale: 'en-US', currencyDisplay: 'code' })).toMatch(/1\.500/);
    expect(formatMoney(money(123456, 'EUR'), 'de-DE')).toBe('1.234,56 €');
  });

  it('is exact near Number.MAX_SAFE_INTEGER', () => {
    expect(formatMoney(usd(Number.MAX_SAFE_INTEGER), 'en-US')).toBe('$90,071,992,547,409.91');
  });

  it('supports name, sign, accounting, compact and hidden zero fraction', () => {
    expect(formatMoney(usd(1250), { locale: 'en-US', currencyDisplay: 'name' })).toBe('12.50 US dollars');
    expect(formatMoney(usd(1250), { locale: 'en-US', signDisplay: 'always' })).toBe('+$12.50');
    expect(formatMoney(usd(0), { locale: 'en-US', signDisplay: 'exceptZero' })).toBe('$0.00');
    expect(formatMoney(usd(-1250), { locale: 'en-US', accounting: true })).toBe('($12.50)');
    expect(formatMoney(usd(-1250), { locale: 'en-US' })).toBe('-$12.50');
    expect(formatMoney(usd(123456789), { locale: 'en-US', notation: 'compact' })).toBe('$1.2M');
    expect(formatMoney(usd(1200), { locale: 'en-US', hideZeroFraction: true })).toBe('$12');
    expect(formatMoney(usd(1250), { locale: 'en-US', hideZeroFraction: true })).toBe('$12.50');
    expect(formatMoneyToParts(usd(1250), 'en-US').map((p) => p.type)).toEqual(['currency', 'integer', 'decimal', 'fraction']);
  });

  it('rejects invalid amounts', () => {
    expect(() => formatMoney({ amountMinor: 1.5, currency: 'USD' })).toThrow(RangeError);
  });

  it('formats for input and round-trips through the parser', () => {
    expect(formatMoneyForInput(usd(123456), 'de-DE')).toBe('1234,56');
    expect(formatMoneyForInput(money(1234, 'JPY'), 'de-DE')).toBe('1234');
    for (const locale of ['en-US', 'de-DE', 'fr-FR', 'de-CH', 'hi-IN']) {
      for (const m of [usd(123456), money(1250, 'KWD'), money(99, 'JPY')]) {
        const parsed = parseMoneyInput(formatMoneyForInput(m, locale), m.currency, { locale });
        expect(parsed).toEqual({ ok: true, value: m });
      }
    }
  });
});

describe('parseMoneyInput', () => {
  const ok = (input: string, currency: CurrencyCode, locale = 'en-US') => {
    const r = parseMoneyInput(input, currency, { locale });
    if (!r.ok) throw new Error(`expected ok for ${input}, got ${r.error}`);
    return r.value.amountMinor;
  };
  const err = (input: string, currency: CurrencyCode = 'USD', locale = 'en-US', allowZero = true) => {
    const r = parseMoneyInput(input, currency, { locale, allowZero });
    return r.ok ? 'ok' : r.error;
  };

  it('parses plain and grouped input', () => {
    expect(ok('12', 'USD')).toBe(1200);
    expect(ok('12.5', 'USD')).toBe(1250);
    expect(ok('.5', 'USD')).toBe(50);
    expect(ok('12.', 'USD')).toBe(1200);
    expect(ok('1,234.56', 'USD')).toBe(123456);
    expect(ok('  1 234.56 ', 'USD')).toBe(123456);
    expect(ok('0', 'USD')).toBe(0);
  });

  it('respects locale separators', () => {
    expect(ok('1.234,56', 'EUR', 'de-DE')).toBe(123456);
    expect(ok('12,5', 'EUR', 'de-DE')).toBe(1250);
    expect(ok('1.500', 'EUR', 'de-DE')).toBe(150000); // grouping, not 1.5
    expect(ok('1.50', 'EUR', 'de-DE')).toBe(150); // a typed dot still works as the decimal point
    expect(ok('1 234,56', 'EUR', 'fr-FR')).toBe(123456);
    expect(ok("1'234.56", 'CHF', 'de-CH')).toBe(123456);
    expect(ok('1’234.56', 'CHF', 'de-CH')).toBe(123456);
    expect(ok('12,5', 'USD', 'en-US')).toBe(1250); // lone comma not followed by 3 digits
    expect(ok('1,500', 'USD', 'en-US')).toBe(150000);
    expect(ok('1,23,456.78', 'INR', 'hi-IN')).toBe(12345678);
  });

  it('accepts non-ASCII digits and the currency symbol or code', () => {
    expect(ok('١٢٫٥', 'EGP', 'ar-EG')).toBe(1250);
    expect(ok('１２３', 'JPY', 'ja-JP')).toBe(123);
    expect(ok('$12.50', 'USD')).toBe(1250);
    expect(ok('12.50 USD', 'USD')).toBe(1250);
    expect(ok('usd 12.50', 'USD')).toBe(1250);
    expect(ok('12,50 €', 'EUR', 'de-DE')).toBe(1250);
  });

  it('handles 0 and 3 decimal currencies', () => {
    expect(ok('1234', 'JPY')).toBe(1234);
    expect(ok('1,234', 'JPY')).toBe(1234);
    expect(ok('100.00', 'JPY')).toBe(100);
    expect(err('100.5', 'JPY')).toBe('too_many_decimals');
    expect(ok('1.234', 'KWD')).toBe(1234);
    expect(ok('1.2', 'KWD')).toBe(1200);
    expect(err('1.2345', 'KWD')).toBe('too_many_decimals');
    expect(ok('1.2340', 'KWD')).toBe(1234);
  });

  it('rejects bad input with a reason', () => {
    expect(err('')).toBe('empty');
    expect(err('   ')).toBe('empty');
    expect(err('-5')).toBe('negative');
    expect(err('−5')).toBe('negative');
    expect(err('5-')).toBe('negative');
    expect(err('(5)')).toBe('negative');
    expect(err('$-5')).toBe('negative');
    expect(err('1e5')).toBe('exponent');
    expect(err('1.5E-3')).toBe('exponent');
    expect(err('NaN')).toBe('invalid');
    expect(err('Infinity')).toBe('invalid');
    expect(err('abc')).toBe('invalid');
    expect(err('1.2.3')).toBe('invalid');
    expect(err('12.3,4')).toBe('invalid');
    expect(err('+5')).toBe('invalid');
    expect(err('.')).toBe('invalid');
    expect(err('$')).toBe('invalid');
    expect(err('1.234')).toBe('too_many_decimals');
    expect(err('0', 'USD', 'en-US', false)).toBe('zero');
    expect(err('0.00', 'USD', 'en-US', false)).toBe('zero');
  });

  it('guards Number.MAX_SAFE_INTEGER', () => {
    expect(ok('90071992547409.91', 'USD')).toBe(Number.MAX_SAFE_INTEGER);
    expect(err('90071992547409.92')).toBe('too_large');
    expect(err('9007199254740992', 'JPY')).toBe('too_large');
    expect(err('99999999999999999999999')).toBe('too_large');
  });

  it('reports the allowed decimals on failure', () => {
    const r = parseMoneyInput('1.2345', 'KWD', { locale: 'en-US' });
    expect(r).toEqual({ ok: false, error: 'too_many_decimals', maxDecimals: 3 });
  });

  it('knows locale separators', () => {
    expect(getNumberSeparators('en-US')).toEqual({ decimal: '.', group: ',' });
    expect(getNumberSeparators('de-DE')).toEqual({ decimal: ',', group: '.' });
  });
});

describe('allocate', () => {
  it('splits evenly with the remainder to the earliest parts', () => {
    expect(allocateMinor(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocateMinor(101, [1, 1, 1])).toEqual([34, 34, 33]);
    expect(allocateMinor(5, [1, 1, 1, 1, 1, 1, 1])).toEqual([1, 1, 1, 1, 1, 0, 0]);
    expect(allocateMinor(0, [1, 2])).toEqual([0, 0]);
  });

  it('uses the largest remainder, not the first index', () => {
    // 100 * [0.2, 0.3, 0.5] over 7 units: exact 1.4, 2.1, 3.5 -> floors 1,2,3, leftover 1 to the 0.5 remainder.
    expect(allocateMinor(7, [2, 3, 5])).toEqual([1, 2, 4]);
    expect(allocateMinor(10, ['33.33', '33.33', '33.34'])).toEqual([3, 3, 4]);
  });

  it('treats decimal weights exactly', () => {
    expect(allocateMinor(100, [0.1, 0.2, 0.7])).toEqual([10, 20, 70]);
    expect(allocateMinor(3, [1e-7, 2e-7])).toEqual([1, 2]);
  });

  it('mirrors negative totals', () => {
    expect(allocateMinor(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
    const parts = allocate(usd(-101), [1, 1, 1]);
    expect(parts.reduce((a, p) => a + p.amountMinor, 0)).toBe(-101);
  });

  it('gives zero-weight parts exactly zero', () => {
    expect(allocateMinor(10, [0, 1, 0, 1])).toEqual([0, 5, 0, 5]);
    expect(allocateMinor(11, [0, 1, 0, 1])).toEqual([0, 6, 0, 5]);
  });

  it('rejects bad weights', () => {
    expect(() => allocateMinor(10, [])).toThrow(RangeError);
    expect(() => allocateMinor(10, [0, 0])).toThrow(RangeError);
    expect(() => allocateMinor(10, [-1, 2])).toThrow(RangeError);
    expect(() => allocateMinor(10, [Number.NaN])).toThrow(RangeError);
    expect(() => allocateMinor(10, [Number.POSITIVE_INFINITY])).toThrow(RangeError);
    expect(() => allocateMinor(1.5, [1])).toThrow(RangeError);
  });

  it('keeps the currency', () => {
    expect(allocate(money(1000, 'JPY'), [1, 2]).map((m: Money) => m.currency)).toEqual(['JPY', 'JPY']);
  });

  it('property: parts always sum to the total, stay within 1 unit of the exact share, and are deterministic', () => {
    const rand = createSeededRandom(42);
    for (let run = 0; run < 2000; run++) {
      const n = 1 + Math.floor(rand() * 12);
      const weights: number[] = Array.from({ length: n }, (): number => (rand() < 0.15 ? 0 : Math.floor(rand() * 1000) / (rand() < 0.5 ? 1 : 100)));
      if (!weights.some((w) => w > 0)) weights[0] = 1;
      const magnitude = rand() < 0.1 ? Number.MAX_SAFE_INTEGER : 10 ** Math.floor(rand() * 9);
      const total = Math.floor(rand() * magnitude) * (rand() < 0.2 ? -1 : 1) || 0;
      const parts = allocateMinor(total, weights);
      expect(parts).toHaveLength(n);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts.every(Number.isSafeInteger)).toBe(true);
      const wSum = weights.reduce((a, b) => a + b, 0);
      parts.forEach((p, i) => {
        const exact = (total * (weights[i] ?? 0)) / wSum;
        expect(Math.abs(p - exact)).toBeLessThanOrEqual(1 + Math.abs(exact) * 1e-12);
        if (weights[i] === 0) expect(p).toBe(0);
      });
      expect(allocateMinor(total, weights)).toEqual(parts);
    }
  });
});
