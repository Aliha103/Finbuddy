import { compareCodeUnits, toRational } from '../internal/decimal';
import { isCurrencyCode, minorUnits, type CurrencyCode } from './currencies';

/**
 * An exact amount of money: integer minor units plus an ISO 4217 code.
 * 12.34 USD is { amountMinor: 1234, currency: 'USD' }; 1,234 JPY is { amountMinor: 1234, currency: 'JPY' }.
 * amountMinor is always a safe integer and may be negative (balances, refunds).
 */
export interface Money {
  readonly amountMinor: number;
  readonly currency: CurrencyCode;
}

/** Thrown when two amounts in different currencies meet without an explicit conversion. */
export class CurrencyMismatchError extends Error {
  readonly left: CurrencyCode;
  readonly right: CurrencyCode;
  constructor(left: CurrencyCode, right: CurrencyCode) {
    super(`Currency mismatch: ${left} vs ${right}. Convert explicitly first.`);
    this.name = 'CurrencyMismatchError';
    this.left = left;
    this.right = right;
  }
}

function assertSafe(amountMinor: number, what = 'amountMinor'): number {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(`${what} must be a safe integer, got ${amountMinor}`);
  }
  // Normalise -0 so equality and serialisation are stable.
  return amountMinor === 0 ? 0 : amountMinor;
}

/** Creates a Money value, validating the integer amount and the currency code. */
export function money(amountMinor: number, currency: CurrencyCode): Money {
  if (!isCurrencyCode(currency)) {
    throw new RangeError(`Unsupported currency code: ${JSON.stringify(currency)}`);
  }
  return { amountMinor: assertSafe(amountMinor), currency };
}

/** Zero in the given currency. */
export function zero(currency: CurrencyCode): Money {
  return money(0, currency);
}

/** True when `value` is a structurally valid Money object. */
export function isMoney(value: unknown): value is Money {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.amountMinor === 'number' && Number.isSafeInteger(v.amountMinor) && isCurrencyCode(v.currency);
}

/** Throws CurrencyMismatchError unless every amount shares the first one's currency. */
export function assertSameCurrency(first: Money, ...rest: readonly Money[]): CurrencyCode {
  for (const m of rest) {
    if (m.currency !== first.currency) throw new CurrencyMismatchError(first.currency, m.currency);
  }
  return first.currency;
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: assertSafe(a.amountMinor + b.amountMinor, 'sum'), currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: assertSafe(a.amountMinor - b.amountMinor, 'difference'), currency: a.currency };
}

export function negate(a: Money): Money {
  return { amountMinor: assertSafe(-a.amountMinor), currency: a.currency };
}

export function abs(a: Money): Money {
  return a.amountMinor < 0 ? negate(a) : a;
}

/** Sums amounts of one currency. An empty list needs `currency` to know what zero means. */
export function sum(amounts: readonly Money[], currency?: CurrencyCode): Money {
  const first = amounts[0];
  const code = currency ?? first?.currency;
  if (code === undefined) throw new RangeError('sum() of an empty list needs a currency');
  let total = zero(code);
  for (const m of amounts) total = add(total, m);
  return total;
}

/** -1, 0 or 1. Throws on currency mismatch. */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  return a.amountMinor < b.amountMinor ? -1 : a.amountMinor > b.amountMinor ? 1 : 0;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountMinor === b.amountMinor;
}

export function isZero(a: Money): boolean {
  return a.amountMinor === 0;
}

export function isPositive(a: Money): boolean {
  return a.amountMinor > 0;
}

export function isNegative(a: Money): boolean {
  return a.amountMinor < 0;
}

export function min(a: Money, b: Money): Money {
  return compare(a, b) <= 0 ? a : b;
}

export function max(a: Money, b: Money): Money {
  return compare(a, b) >= 0 ? a : b;
}

/**
 * Splits `total` into parts proportional to `weights` using the largest-remainder
 * (Hamilton) method. The parts always sum exactly to `total`.
 *
 * - Weights are non-negative finite numbers or decimal strings, read exactly
 *   (0.1 means one tenth, not its binary approximation). At least one must be > 0.
 * - Each part is floor(total * w / sum(w)); the leftover minor units go one each to
 *   the parts with the largest remainders. Ties go to the lower index, so the result
 *   is deterministic: order the weights to choose who receives leftover units.
 * - A negative total is allocated as its absolute value and negated, so parts of a
 *   refund mirror the parts of the matching charge.
 * - A part with weight 0 is always exactly 0.
 */
export function allocate(total: Money, weights: readonly (number | string)[]): Money[] {
  return allocateMinor(total.amountMinor, weights).map((amountMinor) => ({ amountMinor, currency: total.currency }));
}

/** allocate() on a bare integer amount. Returns integer parts summing to `totalMinor`. */
export function allocateMinor(totalMinor: number, weights: readonly (number | string)[]): number[] {
  assertSafe(totalMinor, 'total');
  if (weights.length === 0) throw new RangeError('allocate() needs at least one weight');
  const rationals = weights.map((w) => {
    const r = toRational(w);
    if (r.num < 0n) throw new RangeError(`Weights must be non-negative, got ${String(w)}`);
    return r;
  });
  // Bring every weight to a common denominator so they become integers.
  let commonDen = 1n;
  for (const r of rationals) commonDen = lcm(commonDen, r.den);
  const ints = rationals.map((r) => (r.num * commonDen) / r.den);
  const weightSum = ints.reduce((acc, w) => acc + w, 0n);
  if (weightSum === 0n) throw new RangeError('allocate() needs at least one positive weight');

  const negative = totalMinor < 0;
  const absTotal = BigInt(negative ? -totalMinor : totalMinor);
  const parts = ints.map((w) => (absTotal * w) / weightSum);
  const remainders = ints.map((w, index) => ({ index, rem: (absTotal * w) % weightSum }));
  let leftover = absTotal - parts.reduce((acc, p) => acc + p, 0n);
  remainders.sort((a, b) => (a.rem === b.rem ? a.index - b.index : a.rem > b.rem ? -1 : 1));
  for (const { index } of remainders) {
    if (leftover === 0n) break;
    parts[index] = (parts[index] ?? 0n) + 1n;
    leftover -= 1n;
  }
  return parts.map((p) => {
    const n = Number(p);
    return negative && n !== 0 ? -n : n;
  });
}

function lcm(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) [x, y] = [y, x % y];
  return (a / x) * b;
}

/**
 * Canonical, locale-independent decimal string: "1234.50", "-0.05", "1234" (JPY), "1.250" (KWD).
 * Use it for storage, logs and APIs; use formatMoney() for people.
 */
export function toDecimalString(m: Money): string {
  const digits = minorUnits(m.currency);
  const negative = m.amountMinor < 0;
  const raw = String(Math.abs(m.amountMinor)).padStart(digits + 1, '0');
  const intPart = raw.slice(0, raw.length - digits);
  const fracPart = digits > 0 ? `.${raw.slice(raw.length - digits)}` : '';
  return `${negative ? '-' : ''}${intPart}${fracPart}`;
}

/**
 * Parses a canonical decimal string ("12.5", "-3.250") into Money. Strict: '.' separator,
 * no grouping, at most the currency's minor digits. For user input use parseMoneyInput().
 */
export function fromDecimalString(value: string, currency: CurrencyCode): Money {
  const digits = minorUnits(currency);
  const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) throw new RangeError(`Not a decimal amount: ${JSON.stringify(value)}`);
  const [, sign, intPart = '0', fracPart = ''] = match;
  if (fracPart.replace(/0+$/, '').length > digits) {
    throw new RangeError(`${currency} allows at most ${digits} decimal places: ${JSON.stringify(value)}`);
  }
  const minor = BigInt(intPart + fracPart.padEnd(digits, '0').slice(0, digits));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Amount exceeds Number.MAX_SAFE_INTEGER');
  return money(sign ? -Number(minor) : Number(minor), currency);
}

/** Orders Money values for display: by currency code, then amount. Never compares across currencies by value. */
export function compareByCurrencyThenAmount(a: Money, b: Money): number {
  return compareCodeUnits(a.currency, b.currency) || a.amountMinor - b.amountMinor;
}
