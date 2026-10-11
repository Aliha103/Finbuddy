import { describe, expect, it } from 'vitest';

import { money } from '../money/money';
import {
  MissingRateError,
  SAMPLE_RATES,
  StaticRatesProvider,
  convert,
  findRatePath,
  rateToRational,
  sumConverted,
  validateExchangeRate,
  type ExchangeRate,
} from './fx';

const rate = (base: ExchangeRate['base'], quote: ExchangeRate['quote'], r: ExchangeRate['rate'], asOf = '2026-01-01'): ExchangeRate => ({
  base,
  quote,
  rate: r,
  asOf,
  source: 'test',
});

describe('convert', () => {
  it('returns the same money for the same currency', () => {
    const c = convert(money(1234, 'USD'), 'USD', []);
    expect(c.to).toEqual(money(1234, 'USD'));
    expect(c.legs).toEqual([]);
    expect(c.effectiveRate).toBe('1');
  });

  it('rescales minor units between 2, 0 and 3 decimal currencies', () => {
    const rates = [rate('USD', 'JPY', '150'), rate('USD', 'KWD', '0.3')];
    expect(convert(money(1000, 'USD'), 'JPY', rates).to).toEqual(money(1500, 'JPY')); // $10 -> ¥1,500
    expect(convert(money(1500, 'JPY'), 'USD', rates).to).toEqual(money(1000, 'USD')); // inverse
    expect(convert(money(1000, 'USD'), 'KWD', rates).to).toEqual(money(3000, 'KWD')); // $10 -> 3.000 KWD
    expect(convert(money(3000, 'KWD'), 'USD', rates).to).toEqual(money(1000, 'USD'));
  });

  it('rounds half to even, exactly once', () => {
    const rates = [rate('USD', 'EUR', '0.5')];
    // 0.01 USD * 0.5 = 0.005 EUR -> tie -> 0 (even); 0.03 * 0.5 = 0.015 -> 0.02 (even); 0.05 -> 0.025 -> 0.02.
    expect(convert(money(1, 'USD'), 'EUR', rates).to.amountMinor).toBe(0);
    expect(convert(money(3, 'USD'), 'EUR', rates).to.amountMinor).toBe(2);
    expect(convert(money(5, 'USD'), 'EUR', rates).to.amountMinor).toBe(2);
    expect(convert(money(7, 'USD'), 'EUR', rates).to.amountMinor).toBe(4);
    expect(convert(money(-3, 'USD'), 'EUR', rates).to.amountMinor).toBe(-2);
    expect(Object.is(convert(money(-1, 'USD'), 'EUR', rates).to.amountMinor, 0)).toBe(true);
    // Non-ties round to nearest: 0.01 * 0.6 = 0.006 -> 0.01.
    expect(convert(money(1, 'USD'), 'EUR', [rate('USD', 'EUR', '0.6')]).to.amountMinor).toBe(1);
  });

  it('uses exact rational rates and inversions without float error', () => {
    const third = [rate('EUR', 'XAF', { numerator: '655957', denominator: '1000' })];
    expect(convert(money(100, 'EUR'), 'XAF', third).to).toEqual(money(656, 'XAF')); // 655.957 -> 656
    // Inverse of 0.1: 1 GBP = 0.1 X -> 1 X = 10 GBP. A float would give 9.999999...
    expect(convert(money(100, 'CHF'), 'GBP', [rate('GBP', 'CHF', '0.1')]).to).toEqual(money(1000, 'GBP'));
    expect(rateToRational('149.8312')).toEqual({ num: 187289n, den: 1250n }); // 1498312/10000 reduced
  });

  it('picks the newest rate on or before asOf and prefers direct rates', () => {
    const rates = [rate('USD', 'EUR', '0.8', '2026-01-01'), rate('USD', 'EUR', '0.9', '2026-02-01'), rate('EUR', 'USD', '2', '2026-02-01')];
    expect(convert(money(1000, 'USD'), 'EUR', rates).to.amountMinor).toBe(900);
    expect(convert(money(1000, 'USD'), 'EUR', rates, { asOf: '2026-01-15' }).to.amountMinor).toBe(800);
    expect(() => convert(money(1000, 'USD'), 'EUR', rates, { asOf: '2025-12-31' })).toThrow(MissingRateError);
    const c = convert(money(1000, 'USD'), 'EUR', rates);
    expect(c.legs).toHaveLength(1);
    expect(c.legs[0]?.inverted).toBe(false);
    expect(c.rounding).toBe('half-even');
  });

  it('only crosses through a pivot when asked', () => {
    const rates = [rate('USD', 'JPY', '150'), rate('USD', 'GBP', '0.75')];
    expect(() => convert(money(1000, 'GBP'), 'JPY', rates)).toThrow(MissingRateError);
    const c = convert(money(1000, 'GBP'), 'JPY', rates, { via: 'USD' });
    expect(c.to).toEqual(money(2000, 'JPY')); // £10 -> $13.33.. -> ¥2,000
    expect(c.legs.map((l) => l.inverted)).toEqual([true, false]);
    expect(c.effectiveRate).toBe('200');
  });

  it('guards overflow', () => {
    expect(() => convert(money(Number.MAX_SAFE_INTEGER, 'USD'), 'JPY', [rate('USD', 'JPY', '150')])).toThrow(RangeError);
  });

  it('sums mixed currencies only through explicit conversion', () => {
    const r = sumConverted([money(1000, 'USD'), money(1500, 'JPY'), money(500, 'GBP')], 'USD', SAMPLE_RATES);
    expect(r.total).toEqual(money(1000 + 1000 + 625, 'USD'));
    expect(r.conversions).toHaveLength(3);
  });
});

describe('rates', () => {
  it('validates rates', () => {
    expect(validateExchangeRate(rate('USD', 'EUR', '0.9'))).toEqual([]);
    expect(validateExchangeRate(rate('USD', 'USD', '1'))).toContain('base and quote are the same');
    expect(validateExchangeRate(rate('USD', 'EUR', '-1')).length).toBeGreaterThan(0);
    expect(validateExchangeRate(rate('USD', 'EUR', '0')).length).toBeGreaterThan(0);
    expect(validateExchangeRate(rate('USD', 'EUR', '1e3')).length).toBeGreaterThan(0);
    expect(validateExchangeRate(rate('USD', 'EUR', { numerator: '1', denominator: '0' })).length).toBeGreaterThan(0);
    expect(validateExchangeRate({ ...rate('USD', 'EUR', '1'), asOf: '2026-13-01' })).toContain('asOf is not a YYYY-MM-DD date');
  });

  it('labels the sample fixture', () => {
    expect(SAMPLE_RATES.length).toBeGreaterThan(5);
    for (const r of SAMPLE_RATES) {
      expect(r.isSample).toBe(true);
      expect(r.source).toMatch(/SAMPLE/);
      expect(validateExchangeRate(r)).toEqual([]);
    }
  });

  it('serves rates from a static provider', async () => {
    const provider = new StaticRatesProvider([rate('USD', 'EUR', '0.9', '2026-01-01'), rate('GBP', 'JPY', '190', '2026-03-01')]);
    expect(await provider.getRates()).toHaveLength(2);
    expect(await provider.getRates({ base: 'EUR' })).toHaveLength(1);
    expect(await provider.getRates({ asOf: '2026-02-01' })).toHaveLength(1);
    expect(() => new StaticRatesProvider([rate('USD', 'EUR', 'abc')])).toThrow(RangeError);
  });

  it('finds no path when no rates exist', () => {
    expect(() => findRatePath('USD', 'EUR', [])).toThrow(MissingRateError);
  });
});
