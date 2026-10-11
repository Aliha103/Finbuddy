import {
  divRoundHalfEven,
  invertRational,
  mulRational,
  rationalToDecimalString,
  reduce,
  toRational,
  toSafeNumber,
  compareCodeUnits,
  type Rational,
} from '../internal/decimal';
import { isCurrencyCode, minorUnits, type CurrencyCode } from '../money/currencies';
import { add, zero, type Money } from '../money/money';
import { isLocalDate, type LocalDate } from '../model/dates';

/** An exact rate written as a fraction of two integer strings, e.g. { numerator: "1", denominator: "3" }. */
export interface RationalRate {
  readonly numerator: string;
  readonly denominator: string;
}

/**
 * 1 unit (major) of `base` = `rate` units (major) of `quote`, as published by `source` for `asOf`.
 * The rate is a decimal string ("149.8312") or an exact fraction, never a float.
 */
export interface ExchangeRate {
  readonly base: CurrencyCode;
  readonly quote: CurrencyCode;
  readonly rate: string | RationalRate;
  /** Calendar date the rate applies to (YYYY-MM-DD). */
  readonly asOf: LocalDate;
  /** Who published the rate, e.g. "ECB reference rate" or "manual: entered by user". */
  readonly source: string;
  /** True for illustrative fixture data that must never be presented as market rates. */
  readonly isSample?: boolean;
}

/** One rate used in a conversion; `inverted` means quote->base was used as 1/rate. */
export interface ConversionLeg {
  readonly rate: ExchangeRate;
  readonly inverted: boolean;
}

/** The full audit trail of a conversion. */
export interface Conversion {
  readonly from: Money;
  readonly to: Money;
  /** Effective major-unit rate from -> to, as a decimal string rounded to 12 places (display only). */
  readonly effectiveRate: string;
  /** Rates applied in order. Empty when from and to share a currency. */
  readonly legs: readonly ConversionLeg[];
  readonly rounding: 'half-even';
}

export class MissingRateError extends Error {
  readonly from: CurrencyCode;
  readonly to: CurrencyCode;
  constructor(from: CurrencyCode, to: CurrencyCode) {
    super(`No exchange rate available for ${from} -> ${to}`);
    this.name = 'MissingRateError';
    this.from = from;
    this.to = to;
  }
}

/** Reads an ExchangeRate's rate as an exact positive fraction. Throws on invalid or non-positive rates. */
export function rateToRational(rate: ExchangeRate['rate']): Rational {
  let r: Rational;
  if (typeof rate === 'string') {
    if (!/^\d+(\.\d+)?$/.test(rate.trim())) throw new RangeError(`Invalid rate: ${JSON.stringify(rate)}`);
    r = toRational(rate);
  } else {
    if (!/^\d+$/.test(rate.numerator) || !/^\d+$/.test(rate.denominator)) {
      throw new RangeError(`Invalid rational rate: ${JSON.stringify(rate)}`);
    }
    r = reduce({ num: BigInt(rate.numerator), den: BigInt(rate.denominator) });
  }
  if (r.num <= 0n) throw new RangeError(`Rate must be positive: ${JSON.stringify(rate)}`);
  return r;
}

/** Validates an ExchangeRate's shape; returns a list of problems (empty when valid). */
export function validateExchangeRate(rate: ExchangeRate): string[] {
  const problems: string[] = [];
  if (!isCurrencyCode(rate.base)) problems.push('base is not a supported currency');
  if (!isCurrencyCode(rate.quote)) problems.push('quote is not a supported currency');
  if (rate.base === rate.quote) problems.push('base and quote are the same');
  if (!isLocalDate(rate.asOf)) problems.push('asOf is not a YYYY-MM-DD date');
  if (!rate.source) problems.push('source is empty');
  try {
    rateToRational(rate.rate);
  } catch {
    problems.push('rate is not a positive decimal or fraction');
  }
  return problems;
}

export interface FindRateOptions {
  /** Use the newest rate on or before this date. Default: the newest rate available. */
  readonly asOf?: LocalDate;
  /**
   * Allow a two-leg conversion through this pivot currency (e.g. 'USD' or 'EUR') when no
   * direct or inverse rate exists. Off by default so cross rates are always a deliberate choice.
   */
  readonly via?: CurrencyCode;
}

function pickRate(rates: readonly ExchangeRate[], from: CurrencyCode, to: CurrencyCode, asOf?: LocalDate): ConversionLeg | undefined {
  let best: ConversionLeg | undefined;
  for (const rate of rates) {
    const direct = rate.base === from && rate.quote === to;
    const inverse = rate.base === to && rate.quote === from;
    if (!direct && !inverse) continue;
    if (asOf !== undefined && rate.asOf > asOf) continue;
    // Prefer newer dates; on the same date prefer a direct rate, then the first listed.
    if (!best || rate.asOf > best.rate.asOf || (rate.asOf === best.rate.asOf && direct && best.inverted)) {
      best = { rate, inverted: inverse };
    }
  }
  return best;
}

/** Finds the rate path from -> to. Throws MissingRateError when none exists. */
export function findRatePath(from: CurrencyCode, to: CurrencyCode, rates: readonly ExchangeRate[], options: FindRateOptions = {}): ConversionLeg[] {
  if (from === to) return [];
  const direct = pickRate(rates, from, to, options.asOf);
  if (direct) return [direct];
  const via = options.via;
  if (via !== undefined && via !== from && via !== to) {
    const first = pickRate(rates, from, via, options.asOf);
    const second = pickRate(rates, via, to, options.asOf);
    if (first && second) return [first, second];
  }
  throw new MissingRateError(from, to);
}

function legsToRational(legs: readonly ConversionLeg[]): Rational {
  let r: Rational = { num: 1n, den: 1n };
  for (const leg of legs) {
    const legRate = rateToRational(leg.rate.rate);
    r = mulRational(r, leg.inverted ? invertRational(legRate) : legRate);
  }
  return r;
}

/**
 * Converts money into another currency with an explicit, auditable rate.
 *
 * Math (exact, BigInt): toMinor = fromMinor * rate * 10^toDigits / 10^fromDigits, where rate is
 * the product of the legs (inverted legs use 1/rate). Rounding happens exactly once, at the end,
 * to the nearest minor unit with ties to even (banker's rounding), so 0.5 cent rounds to the even
 * neighbour and repeated conversions do not drift in one direction.
 *
 * No network calls: pass rates from a RatesProvider.
 */
export function convert(from: Money, toCurrency: CurrencyCode, rates: readonly ExchangeRate[], options: FindRateOptions = {}): Conversion {
  const legs = findRatePath(from.currency, toCurrency, rates, options);
  const rate = legsToRational(legs);
  const fromDigits = minorUnits(from.currency);
  const toDigits = minorUnits(toCurrency);
  const num = BigInt(from.amountMinor) * rate.num * 10n ** BigInt(toDigits);
  const den = rate.den * 10n ** BigInt(fromDigits);
  const amountMinor = toSafeNumber(divRoundHalfEven(num, den), 'converted amount');
  return {
    from,
    to: { amountMinor: amountMinor === 0 ? 0 : amountMinor, currency: toCurrency },
    effectiveRate: rationalToDecimalString(rate, 12),
    legs,
    rounding: 'half-even',
  };
}

export interface ConvertedTotal {
  readonly total: Money;
  /** One entry per input amount, in input order, so the UI can show how the total was built. */
  readonly conversions: readonly Conversion[];
}

/**
 * The only sanctioned way to add up amounts in different currencies: each amount is
 * converted (and rounded) individually, then the results are summed.
 */
export function sumConverted(amounts: readonly Money[], toCurrency: CurrencyCode, rates: readonly ExchangeRate[], options: FindRateOptions = {}): ConvertedTotal {
  const conversions = amounts.map((m) => convert(m, toCurrency, rates, options));
  const total = conversions.reduce((acc, c) => add(acc, c.to), zero(toCurrency));
  return { total, conversions };
}

/** Where rates come from. A future backend implements this; the app never fetches rates itself. */
export interface RatesProvider {
  getRates(request?: { readonly base?: CurrencyCode; readonly asOf?: LocalDate }): Promise<readonly ExchangeRate[]>;
}

/** A RatesProvider over a fixed list (tests, manual rates, cached rates). */
export class StaticRatesProvider implements RatesProvider {
  private readonly rates: readonly ExchangeRate[];
  constructor(rates: readonly ExchangeRate[]) {
    for (const rate of rates) {
      const problems = validateExchangeRate(rate);
      if (problems.length) throw new RangeError(`Invalid rate ${rate.base}/${rate.quote}: ${problems.join(', ')}`);
    }
    this.rates = [...rates];
  }
  getRates(request: { readonly base?: CurrencyCode; readonly asOf?: LocalDate } = {}): Promise<readonly ExchangeRate[]> {
    const { base, asOf } = request;
    return Promise.resolve(
      this.rates
        .filter((r) => (base === undefined || r.base === base || r.quote === base) && (asOf === undefined || r.asOf <= asOf))
        .sort((a, b) => compareCodeUnits(a.base + a.quote, b.base + b.quote) || compareCodeUnits(a.asOf, b.asOf)),
    );
  }
}

/**
 * SAMPLE RATES - ILLUSTRATIVE ONLY, NOT MARKET DATA.
 * Round numbers chosen for demos and tests. Never show them as real rates.
 */
export const SAMPLE_RATES: readonly ExchangeRate[] = Object.freeze(
  (
    [
      ['USD', 'EUR', '0.9'],
      ['USD', 'GBP', '0.8'],
      ['USD', 'JPY', '150'],
      ['USD', 'CAD', '1.35'],
      ['USD', 'AUD', '1.5'],
      ['USD', 'CHF', '0.9'],
      ['USD', 'INR', '83'],
      ['USD', 'KWD', '0.3'],
      ['USD', 'KRW', '1350'],
      ['EUR', 'GBP', '0.85'],
    ] as const
  ).map(([base, quote, rate]) => ({
    base,
    quote,
    rate,
    asOf: '2026-01-01',
    source: 'SAMPLE - illustrative fixture, not market data',
    isSample: true,
  })),
);
