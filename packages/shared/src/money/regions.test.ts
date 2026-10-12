// The region -> currency table: spot checks against ISO 4217 and CLDR, every value storable by the
// engine, and completeness against the regions this runtime's ICU can name.
import { describe, expect, it } from 'vitest';

import { REGION_CURRENCIES, currencyForRegion, isCurrencyCode, regionOfLanguageTag } from './index';

describe('currencyForRegion', () => {
  it('gives the region its own currency', () => {
    const cases: Record<string, string> = {
      GB: 'GBP', DE: 'EUR', JP: 'JPY', IN: 'INR', KW: 'KWD', US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD',
      CH: 'CHF', LI: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON',
      BG: 'EUR', HR: 'EUR', IE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', AT: 'EUR', FI: 'EUR',
      CN: 'CNY', HK: 'HKD', MO: 'MOP', TW: 'TWD', KR: 'KRW', SG: 'SGD', MY: 'MYR', TH: 'THB', VN: 'VND',
      ID: 'IDR', PH: 'PHP', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR', AE: 'AED', SA: 'SAR', QA: 'QAR',
      BH: 'BHD', OM: 'OMR', JO: 'JOD', IQ: 'IQD', IL: 'ILS', TR: 'TRY', EG: 'EGP', MA: 'MAD', TN: 'TND',
      ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP',
      PE: 'PEN', UY: 'UYU', VE: 'VES', IS: 'ISK', UA: 'UAH', RU: 'RUB',
      // Places that use another country's currency, or a shared one.
      PR: 'USD', EC: 'USD', SV: 'USD', TL: 'USD', FM: 'USD', MC: 'EUR', ME: 'EUR', VA: 'EUR', GL: 'DKK',
      GG: 'GBP', JE: 'GBP', IM: 'GBP', KI: 'AUD', CK: 'NZD', SN: 'XOF', CM: 'XAF', NC: 'XPF', AG: 'XCD',
      // Recent changes: the Caribbean guilder (2025), Zimbabwe Gold (2024), the new leone (2022).
      CW: 'XCG', SX: 'XCG', ZW: 'ZWG', SL: 'SLE',
    };
    for (const [region, currency] of Object.entries(cases)) expect([region, currencyForRegion(region)]).toEqual([region, currency]);
  });

  it('reads any case and spacing, and has no answer without a region', () => {
    expect(currencyForRegion('gb')).toBe('GBP');
    expect(currencyForRegion(' jp ')).toBe('JPY');
    expect(currencyForRegion(null)).toBeNull();
    expect(currencyForRegion(undefined)).toBeNull();
    expect(currencyForRegion('')).toBeNull();
    expect(currencyForRegion('419')).toBeNull(); // Latin America: a region, not a country
    expect(currencyForRegion('AQ')).toBeNull(); // Antarctica has no currency
    expect(currencyForRegion('toString')).toBeNull();
    expect(currencyForRegion('__proto__')).toBeNull();
  });

  it('only names currencies the engine can store', () => {
    for (const [region, currency] of Object.entries(REGION_CURRENCIES)) {
      expect(region).toMatch(/^[A-Z]{2}$/);
      expect([region, isCurrencyCode(currency)]).toEqual([region, true]);
    }
  });

  it('covers every country and territory', () => {
    // Codes ICU names that are not places with a currency of their own: Antarctica, Clipperton and
    // Sark (no locale uses them), groupings (EU, EZ, QO, UN), pseudo-locales (XA, XB) and unknown (ZZ).
    const WITHOUT = new Set(['AQ', 'CP', 'CQ', 'EU', 'EZ', 'QO', 'UN', 'XA', 'XB', 'ZZ']);
    const names = new Intl.DisplayNames('en', { type: 'region' });
    const known: string[] = [];
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        // A withdrawn code (SU, YU, ...) canonicalises to its successor: skip it.
        if (new Intl.Locale(`und-${code}`).region !== code) continue;
        const name = names.of(code);
        if (name && name !== code) known.push(code);
      }
    }
    expect(known.filter((code) => !WITHOUT.has(code) && !(code in REGION_CURRENCIES))).toEqual([]);
    expect(Object.keys(REGION_CURRENCIES).filter((code) => !known.includes(code))).toEqual([]);
    // 248 of ISO 3166-1's 249 officially assigned codes (all but AQ), plus AC, DG, EA, IC, TA and XK.
    expect(Object.keys(REGION_CURRENCIES)).toHaveLength(254);
  });
});

describe('regionOfLanguageTag', () => {
  it('finds the region subtag', () => {
    expect(regionOfLanguageTag('en-GB')).toBe('GB');
    expect(regionOfLanguageTag('en_GB')).toBe('GB');
    expect(regionOfLanguageTag('de-de')).toBe('DE');
    expect(regionOfLanguageTag('zh-Hant-TW')).toBe('TW');
    expect(regionOfLanguageTag('zh-yue-HK')).toBe('HK');
    expect(regionOfLanguageTag('en-GB-oed')).toBe('GB');
    expect(regionOfLanguageTag('ja-JP-u-ca-japanese')).toBe('JP');
    expect(regionOfLanguageTag('es-419')).toBe('419');
  });

  it('never guesses a region from the language', () => {
    expect(regionOfLanguageTag('de')).toBeNull();
    expect(regionOfLanguageTag('sr-Latn')).toBeNull();
    expect(regionOfLanguageTag('x-private')).toBeNull();
    expect(regionOfLanguageTag('')).toBeNull();
    expect(regionOfLanguageTag(null)).toBeNull();
  });
});
