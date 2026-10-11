// apps/mobile/src/features/common/currency.ts
// Currency names, the device region's currency, and the example readout a person sees before
// typing an amount. Names come from Intl.DisplayNames where the runtime has it; the code stands
// alone otherwise.
import { CURRENCY_CODES, isCurrencyCode, minorUnits, type CurrencyCode, type Money } from '@finbuddy/shared';
import { useLocales } from 'expo-localization';
import { useMemo } from 'react';

type DisplayNames = { of(code: string): string | undefined };

export function currencyNames(locale: string): (code: CurrencyCode) => string {
  let names: DisplayNames | null = null;
  try {
    const Ctor = (Intl as unknown as { DisplayNames?: new (l: string, o: { type: string; fallback?: string }) => DisplayNames }).DisplayNames;
    names = Ctor ? new Ctor(locale, { type: 'currency', fallback: 'none' }) : null;
  } catch {
    names = null;
  }
  return (code) => {
    const name = names?.of(code);
    return name && name !== code ? name : code;
  };
}

/** "no decimals", "2 decimals", "3 decimals": so JPY and KWD are not surprises. */
export function minorUnitsLabel(code: CurrencyCode): string {
  const digits = minorUnits(code);
  return digits === 0 ? 'no decimals' : `${digits} decimal${digits === 1 ? '' : 's'}`;
}

/** 1,234.56 (or 1,235 / 1,234.567) in a currency: the preview figure for a format. */
export function exampleMoney(code: CurrencyCode): Money {
  const digits = minorUnits(code);
  const whole = 1234;
  const frac = digits === 0 ? 0 : Math.round(0.56 * 10 ** digits);
  return { amountMinor: whole * 10 ** digits + frac, currency: code };
}

/** The device region's currency when the engine knows it, else USD. */
export function useRegionCurrency(): CurrencyCode {
  const locales = useLocales();
  const code = locales[0]?.currencyCode;
  return code && isCurrencyCode(code) ? code : 'USD';
}

export interface CurrencyOption {
  readonly code: CurrencyCode;
  readonly name: string;
  readonly decimals: string;
}

/**
 * The currency list for a picker: `suggested` first (the device region's, the person's, a group's),
 * then every code the engine knows, filtered by a search over code and name.
 */
export function useCurrencyOptions(locale: string, suggested: readonly CurrencyCode[], query: string): { suggested: CurrencyOption[]; rest: CurrencyOption[] } {
  return useMemo(() => {
    const nameOf = currencyNames(locale);
    const option = (code: CurrencyCode): CurrencyOption => ({ code, name: nameOf(code), decimals: minorUnitsLabel(code) });
    const q = query.trim().toLowerCase();
    const matches = (o: CurrencyOption) => !q || o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q);
    const top = [...new Set(suggested)].map(option).filter(matches);
    const topSet = new Set(top.map((o) => o.code));
    const rest = CURRENCY_CODES.filter((c) => !topSet.has(c))
      .map(option)
      .filter(matches)
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    return { suggested: top, rest };
  }, [locale, suggested, query]);
}
