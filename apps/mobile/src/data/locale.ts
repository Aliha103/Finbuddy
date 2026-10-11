import { useLocales } from 'expo-localization';

const FALLBACK_LOCALE = 'en-US';

/** The tag when this runtime's Intl can format with it, otherwise null. */
function usable(tag: string | null | undefined): string | null {
  if (!tag) return null;
  try {
    return new Intl.NumberFormat(tag).resolvedOptions().locale ? tag : null;
  } catch {
    return null;
  }
}

/**
 * The device's preferred locale as a BCP 47 tag that Intl accepts (e.g. "en-GB"). Every amount,
 * number and date on screen is formatted with it. Re-renders when the person changes language.
 */
export function useDeviceLocale(): string {
  const locales = useLocales();
  for (const locale of locales) {
    const tag = usable(locale.languageTag);
    if (tag) return tag;
  }
  return FALLBACK_LOCALE;
}
