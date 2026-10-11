import { minorUnits, type CurrencyCode } from './currencies';
import { getNumberSeparators, type Locales } from './format';
import type { Money } from './money';

export type ParseMoneyErrorCode =
  | 'empty'
  | 'invalid'
  | 'negative'
  | 'exponent'
  | 'too_many_decimals'
  | 'too_large'
  | 'zero';

export type ParseMoneyResult =
  | { readonly ok: true; readonly value: Money }
  | { readonly ok: false; readonly error: ParseMoneyErrorCode; readonly maxDecimals: number };

export interface ParseMoneyOptions {
  /** Locale whose separators the person is typing with. Defaults to the runtime locale. */
  readonly locale?: Locales;
  /** Accept "0". Default true; set false for an expense total. */
  readonly allowZero?: boolean;
}

// Zero code points of Unicode decimal digit runs commonly used for numbers.
const DIGIT_ZEROS = [0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66, 0x0e50, 0x0ed0, 0x0f20, 0x1040, 0x17e0, 0x1810, 0xff10];

function normaliseDigits(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const zero = DIGIT_ZEROS.find((z) => code >= z && code <= z + 9);
    out += zero === undefined ? ch : String(code - zero);
  }
  return out;
}

const SPACES = /[\s   ]/g;
const MINUS = /[-−‒–—﹣－]/;

function currencyAffixes(currency: CurrencyCode, locale?: Locales): string[] {
  const affixes = new Set<string>([currency]);
  for (const display of ['symbol', 'narrowSymbol'] as const) {
    try {
      const parts = (new Intl.NumberFormat(locale as string | string[] | undefined, { style: 'currency', currency, currencyDisplay: display }) as unknown as {
        formatToParts(v: number): { type: string; value: string }[];
      }).formatToParts(1);
      for (const p of parts) if (p.type === 'currency') affixes.add(p.value);
    } catch {
      // Runtime without formatToParts: only the ISO code is stripped.
    }
  }
  // Longest first so "US$" is removed before "$".
  return [...affixes].sort((a, b) => b.length - a.length);
}

function stripAffixes(text: string, affixes: readonly string[]): string {
  let s = text.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const affix of affixes) {
      if (!affix) continue;
      if (s.toUpperCase().startsWith(affix.toUpperCase())) {
        s = s.slice(affix.length).trim();
        changed = true;
      }
      if (s.toUpperCase().endsWith(affix.toUpperCase())) {
        s = s.slice(0, s.length - affix.length).trim();
        changed = true;
      }
    }
  }
  return s;
}

function count(haystack: string, needle: string): number {
  return needle ? haystack.split(needle).length - 1 : 0;
}

/**
 * Parses what a person typed into an exact Money value. Never returns a float.
 *
 * Rules:
 * - Digits from other numbering systems (Arabic-Indic, Devanagari, full-width...) are accepted.
 * - The locale's decimal separator is the decimal point. If it is absent, a single '.' or ','
 *   is read as the decimal point unless it is the locale's grouping separator followed by
 *   exactly three digits ("1.500" in de-DE is 1500; "1.50" in de-DE is 1.50).
 * - Grouping separators, spaces and apostrophes in the integer part are ignored.
 * - The currency's own code or symbol before or after the number is ignored.
 * - Rejects: empty input, negatives (leading/trailing minus or parentheses), exponent notation,
 *   NaN/Infinity and other text, more decimals than the currency allows (trailing zeros are fine:
 *   "100.00" JPY is 100), and anything above Number.MAX_SAFE_INTEGER minor units.
 */
export function parseMoneyInput(input: string, currency: CurrencyCode, options: ParseMoneyOptions = {}): ParseMoneyResult {
  const maxDecimals = minorUnits(currency);
  const fail = (error: ParseMoneyErrorCode): ParseMoneyResult => ({ ok: false, error, maxDecimals });

  let s = normaliseDigits(input).replace(SPACES, ' ').trim();
  if (s === '') return fail('empty');
  s = stripAffixes(s, currencyAffixes(currency, options.locale));
  if (s === '') return fail('invalid');
  if (MINUS.test(s.charAt(0)) || MINUS.test(s.charAt(s.length - 1)) || (s.startsWith('(') && s.endsWith(')'))) {
    return fail('negative');
  }
  s = stripAffixes(s, currencyAffixes(currency, options.locale));
  if (/^[\d.,' ’]*\d[eE][+-]?\d+$/.test(s)) return fail('exponent');

  const { decimal, group } = getNumberSeparators(options.locale);
  s = s.replace(SPACES, '').replace(/['’]/g, '');
  const allowed = new Set(['.', ',', decimal, group]);
  for (const ch of s) {
    if (!(ch >= '0' && ch <= '9') && !allowed.has(ch)) return fail('invalid');
  }

  let intPart: string;
  let fracPart = '';
  let decimalChar: string | undefined;
  if (count(s, decimal) === 1) {
    decimalChar = decimal;
  } else if (count(s, decimal) === 0) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    const candidate = lastDot > lastComma ? '.' : lastComma > lastDot ? ',' : undefined;
    if (candidate !== undefined && count(s, candidate) === 1) {
      const digitsAfter = s.length - s.lastIndexOf(candidate) - 1;
      const looksLikeGrouping = candidate === group && digitsAfter === 3;
      if (!looksLikeGrouping) decimalChar = candidate;
    }
  } else {
    return fail('invalid');
  }

  if (decimalChar !== undefined) {
    const at = s.lastIndexOf(decimalChar);
    intPart = s.slice(0, at);
    fracPart = s.slice(at + decimalChar.length);
  } else {
    intPart = s;
  }
  intPart = intPart.replace(/[.,]/g, '').split(group).join('');
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) return fail('invalid');
  if (intPart === '' && fracPart === '') return fail('invalid');

  const significantFraction = fracPart.replace(/0+$/, '');
  if (significantFraction.length > maxDecimals) return fail('too_many_decimals');

  const minor = BigInt((intPart || '0') + significantFraction.padEnd(maxDecimals, '0'));
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) return fail('too_large');
  if (minor === 0n && options.allowZero === false) return fail('zero');
  return { ok: true, value: { amountMinor: Number(minor), currency } };
}
