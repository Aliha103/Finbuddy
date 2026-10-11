import { CURRENCY_CODES, type CurrencyCode } from '@finbuddy/shared';

/** The visitor's locale, so every amount reads the way their own phone would show it. */
export function visitorLocale(): string {
  if (typeof navigator === 'undefined') return 'en-GB';
  const candidate = navigator.languages?.[0] ?? navigator.language;
  if (!candidate) return 'en-GB';
  try {
    return new Intl.NumberFormat(candidate).resolvedOptions().locale;
  } catch {
    return 'en-GB';
  }
}

let names: { of(code: string): string | undefined } | null | undefined;

/** "British pound" for GBP in the visitor's language, or the code when the runtime has no names. */
export function currencyName(code: CurrencyCode, locale: string): string {
  if (names === undefined) {
    try {
      const DisplayNames = (Intl as unknown as { DisplayNames?: new (l: string, o: { type: string }) => { of(code: string): string | undefined } }).DisplayNames;
      names = DisplayNames ? new DisplayNames(locale, { type: 'currency' }) : null;
    } catch {
      names = null;
    }
  }
  const name = names?.of(code);
  return name && name !== code ? name : code;
}

export const CURRENCIES: readonly CurrencyCode[] = CURRENCY_CODES;
