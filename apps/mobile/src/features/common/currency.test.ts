// The default currency from the locales a device or a browser reports.
import { describe, expect, it } from 'vitest';

import { regionCurrencyOf } from './currency';

/** A locale as the web build sees it: a language tag and its region, never a currency. */
const web = (languageTag: string) => ({ languageTag, regionCode: new Intl.Locale(languageTag).region ?? null, currencyCode: null });

describe('regionCurrencyOf', () => {
  it('takes the currency a device reports', () => {
    expect(regionCurrencyOf([{ languageTag: 'en-US', regionCode: 'CH', currencyCode: 'CHF' }])).toBe('CHF');
  });

  it("derives a browser's currency from the region in its language tag", () => {
    expect(regionCurrencyOf([web('en-GB')])).toBe('GBP');
    expect(regionCurrencyOf([web('de-DE')])).toBe('EUR');
    expect(regionCurrencyOf([web('ja-JP')])).toBe('JPY');
    expect(regionCurrencyOf([web('en-IN')])).toBe('INR');
    expect(regionCurrencyOf([web('ar-KW')])).toBe('KWD');
    expect(regionCurrencyOf([web('zh-Hant-TW')])).toBe('TWD');
    expect(regionCurrencyOf([web('en-US')])).toBe('USD');
    // A tag the runtime could not parse still has its region read from the text.
    expect(regionCurrencyOf([{ languageTag: 'en-GB-oed', regionCode: null, currencyCode: null }])).toBe('GBP');
  });

  it('looks past locales without a region before falling back to USD', () => {
    expect(regionCurrencyOf([web('de'), web('de-AT')])).toBe('EUR');
    expect(regionCurrencyOf([web('es-419'), web('es-MX')])).toBe('MXN');
    expect(regionCurrencyOf([web('fr-CA'), web('en-GB')])).toBe('CAD');
    expect(regionCurrencyOf([web('de')])).toBe('USD');
    expect(regionCurrencyOf([web('es-419')])).toBe('USD');
    expect(regionCurrencyOf([])).toBe('USD');
  });

  it('ignores a reported currency the engine cannot store', () => {
    expect(regionCurrencyOf([{ languageTag: 'en-GB', regionCode: 'GB', currencyCode: 'XXX' }])).toBe('GBP');
  });
});
