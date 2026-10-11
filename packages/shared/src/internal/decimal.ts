// Exact decimal helpers built on BigInt. Internal: not exported from the package.

/** An exact non-negative or negative rational number: num / den with den > 0. */
export interface Rational {
  readonly num: bigint;
  readonly den: bigint;
}

const DECIMAL_RE = /^([+-])?(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;

/**
 * Converts a finite number or a decimal string to an exact rational.
 * Numbers are read through their shortest round-trip string (String(0.1) === "0.1"),
 * which is the value a person typed, not the binary approximation.
 */
export function toRational(value: number | string): Rational {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new RangeError(`Expected a finite number, got ${value}`);
  }
  const text = typeof value === 'number' ? String(value) : value.trim();
  const match = DECIMAL_RE.exec(text);
  if (!match) throw new RangeError(`Not a decimal number: ${JSON.stringify(value)}`);
  const [, sign, intPart = '0', fracPart = '', expPart] = match;
  let num = BigInt(intPart + fracPart);
  let den = 10n ** BigInt(fracPart.length);
  const exp = expPart === undefined ? 0 : Number(expPart);
  if (!Number.isSafeInteger(exp) || Math.abs(exp) > 400) {
    throw new RangeError(`Exponent out of range: ${JSON.stringify(value)}`);
  }
  if (exp > 0) num *= 10n ** BigInt(exp);
  if (exp < 0) den *= 10n ** BigInt(-exp);
  if (sign === '-') num = -num;
  return reduce({ num, den });
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

export function reduce(r: Rational): Rational {
  if (r.den === 0n) throw new RangeError('Division by zero');
  const sign = r.den < 0n ? -1n : 1n;
  const g = gcd(r.num, r.den) || 1n;
  return { num: (sign * r.num) / g, den: (sign * r.den) / g };
}

export function mulRational(a: Rational, b: Rational): Rational {
  return reduce({ num: a.num * b.num, den: a.den * b.den });
}

export function invertRational(a: Rational): Rational {
  if (a.num === 0n) throw new RangeError('Cannot invert zero');
  return reduce({ num: a.den, den: a.num });
}

/**
 * Divides num by den (den != 0) and rounds to the nearest integer, ties to even
 * ("banker's rounding"). Exact for any size of input.
 */
export function divRoundHalfEven(num: bigint, den: bigint): bigint {
  if (den === 0n) throw new RangeError('Division by zero');
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const negative = num < 0n;
  const absNum = negative ? -num : num;
  let q = absNum / den;
  const twiceRem = (absNum % den) * 2n;
  if (twiceRem > den || (twiceRem === den && q % 2n === 1n)) q += 1n;
  return negative ? -q : q;
}

/** Converts a bigint to a number, throwing when it is outside the safe-integer range. */
export function toSafeNumber(value: bigint, what = 'value'): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError(`${what} exceeds Number.MAX_SAFE_INTEGER`);
  }
  return Number(value);
}

/** Formats a rational as a decimal string with up to `maxDigits` fraction digits (half-even). */
export function rationalToDecimalString(r: Rational, maxDigits = 12): string {
  const scale = 10n ** BigInt(maxDigits);
  const scaled = divRoundHalfEven(r.num * scale, r.den);
  const negative = scaled < 0n;
  const digits = (negative ? -scaled : scaled).toString().padStart(maxDigits + 1, '0');
  const intPart = digits.slice(0, digits.length - maxDigits);
  const fracPart = digits.slice(digits.length - maxDigits).replace(/0+$/, '');
  return `${negative ? '-' : ''}${intPart}${fracPart ? `.${fracPart}` : ''}`;
}

/** Locale-independent, deterministic string comparison (code-unit order). */
export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
