import { minorUnits, type CurrencyCode } from './currencies';
import { toDecimalString, type Money } from './money';

export type Locales = string | readonly string[];

export interface FormatMoneyOptions {
  /** BCP 47 locale(s). Defaults to the runtime's locale. */
  readonly locale?: Locales;
  /** How the currency is shown. 'name' reads well for screen readers ("12.50 US dollars"). Default 'symbol'. */
  readonly currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  /** 'compact' gives "$1.2K"-style output; it rounds, so never use it where exactness matters. */
  readonly notation?: 'standard' | 'compact';
  /** Intl signDisplay. 'always' / 'exceptZero' are useful for balances (+12.00 / -12.00). */
  readonly signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';
  /** Accounting style: negatives in parentheses where the locale does that. */
  readonly accounting?: boolean;
  /** Drop the fraction when it is all zeros ("$12" instead of "$12.00"). Standard notation only. */
  readonly hideZeroFraction?: boolean;
}

interface NumberFormatLike {
  format(value: number | string): string;
  formatToParts(value: number | string): { type: string; value: string }[];
}

const cache = new Map<string, NumberFormatLike>();

function getFormatter(currency: CurrencyCode, digits: number | undefined, options: FormatMoneyOptions): NumberFormatLike {
  const key = JSON.stringify([currency, digits, options.locale ?? null, options.currencyDisplay, options.notation, options.signDisplay, options.accounting]);
  let formatter = cache.get(key);
  if (!formatter) {
    const intlOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency,
      currencyDisplay: options.currencyDisplay ?? 'symbol',
      notation: options.notation ?? 'standard',
      signDisplay: options.signDisplay ?? 'auto',
      currencySign: options.accounting ? 'accounting' : 'standard',
    };
    if (digits !== undefined) {
      intlOptions.minimumFractionDigits = digits;
      intlOptions.maximumFractionDigits = digits;
    }
    // Intl accepts decimal strings and formats them exactly (Intl.NumberFormat v3). Runtimes
    // without that support coerce the string to a double, which is still exact to the minor
    // unit for any amount below 10^11 major units (100 billion) in every supported currency.
    formatter = new Intl.NumberFormat(options.locale as string | string[] | undefined, intlOptions) as unknown as NumberFormatLike;
    cache.set(key, formatter);
  }
  return formatter;
}

function formatterAndValue(m: Money, options: FormatMoneyOptions): [NumberFormatLike, number | string] {
  if (!Number.isSafeInteger(m.amountMinor)) {
    throw new RangeError(`amountMinor must be a safe integer, got ${m.amountMinor}`);
  }
  const digits = minorUnits(m.currency);
  if (options.notation === 'compact') {
    return [getFormatter(m.currency, undefined, options), m.amountMinor / 10 ** digits];
  }
  const shownDigits = options.hideZeroFraction && m.amountMinor % 10 ** digits === 0 ? 0 : digits;
  let value = toDecimalString(m);
  if (shownDigits === 0 && digits > 0) value = value.slice(0, value.indexOf('.'));
  return [getFormatter(m.currency, shownDigits, options), value];
}

function toOptions(options: FormatMoneyOptions | Locales): FormatMoneyOptions {
  return typeof options === 'string' || Array.isArray(options) ? { locale: options as Locales } : (options as FormatMoneyOptions);
}

/**
 * Formats Money for people with Intl.NumberFormat, always showing the currency.
 * The second argument is options or just a locale ("en-GB").
 * Fraction digits come from the ISO 4217 table, so KWD shows 3 decimals and JPY none.
 */
export function formatMoney(m: Money, options: FormatMoneyOptions | Locales = {}): string {
  const [formatter, value] = formatterAndValue(m, toOptions(options));
  return formatter.format(value);
}

/** Same as formatMoney() but returns Intl parts, so a design can style the symbol, sign or fraction separately. */
export function formatMoneyToParts(m: Money, options: FormatMoneyOptions | Locales = {}): { type: string; value: string }[] {
  const [formatter, value] = formatterAndValue(m, toOptions(options));
  return formatter.formatToParts(value);
}

export interface NumberSeparators {
  readonly decimal: string;
  readonly group: string;
}

const separatorCache = new Map<string, NumberSeparators>();

/** The decimal and grouping separators a locale uses ("." and "," for en-US; "," and "." for de-DE). */
export function getNumberSeparators(locale?: Locales): NumberSeparators {
  const key = JSON.stringify(locale ?? null);
  let result = separatorCache.get(key);
  if (!result) {
    let decimal = '.';
    let group = ',';
    try {
      const parts = (new Intl.NumberFormat(locale as string | string[] | undefined) as unknown as NumberFormatLike).formatToParts(12345.6);
      decimal = parts.find((p) => p.type === 'decimal')?.value ?? decimal;
      group = parts.find((p) => p.type === 'group')?.value ?? group;
    } catch {
      // Keep the defaults when the runtime lacks formatToParts.
    }
    result = { decimal, group };
    separatorCache.set(key, result);
  }
  return result;
}

/**
 * Plain editable text for an amount input: locale decimal separator, ASCII digits,
 * no grouping, no currency ("1234,50" in de-DE). Round-trips through parseMoneyInput().
 */
export function formatMoneyForInput(m: Money, locale?: Locales): string {
  const { decimal } = getNumberSeparators(locale);
  return toDecimalString(m).replace('.', decimal);
}
