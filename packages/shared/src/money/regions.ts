/**
 * Region -> currency: the currency a person in a region most likely spends, for a default when
 * nothing better is known (the web gives no regional currency, only a language tag like "en-GB").
 *
 * Keys are ISO 3166-1 alpha-2 codes; values are the region's current ISO 4217 legal tender, taken
 * from Unicode CLDR 48 (supplemental currencyData, the first current tender it lists for the
 * region, which is CLDR's default for it). Every officially assigned code is here except
 * Antarctica (AQ), which has no currency. Where a region uses two (Bhutan, Haiti, Lesotho,
 * Namibia, Panama, Palestine, Zimbabwe) the value is CLDR's default. Bulgaria is EUR from 2026.
 *
 * Six more codes that locales use are included: AC, DG, EA, IC and TA (reserved in ISO 3166-1 for
 * Ascension, Diego Garcia, Ceuta and Melilla, the Canary Islands, Tristan da Cunha) and XK (Kosovo,
 * the code CLDR and the platforms use). Every value is typed as a CurrencyCode, so a currency the
 * engine cannot store does not compile.
 */
import type { CurrencyCode } from './currencies';

export const REGION_CURRENCIES: Readonly<Record<string, CurrencyCode>> = Object.freeze({
  AD: 'EUR', AE: 'AED', AF: 'AFN', AG: 'XCD', AI: 'XCD', AL: 'ALL', AM: 'AMD', AO: 'AOA', AR: 'ARS', AS: 'USD',
  AT: 'EUR', AU: 'AUD', AW: 'AWG', AX: 'EUR', AZ: 'AZN',
  BA: 'BAM', BB: 'BBD', BD: 'BDT', BE: 'EUR', BF: 'XOF', BG: 'EUR', BH: 'BHD', BI: 'BIF', BJ: 'XOF', BL: 'EUR',
  BM: 'BMD', BN: 'BND', BO: 'BOB', BQ: 'USD', BR: 'BRL', BS: 'BSD', BT: 'BTN', BV: 'NOK', BW: 'BWP', BY: 'BYN',
  BZ: 'BZD',
  CA: 'CAD', CC: 'AUD', CD: 'CDF', CF: 'XAF', CG: 'XAF', CH: 'CHF', CI: 'XOF', CK: 'NZD', CL: 'CLP', CM: 'XAF',
  CN: 'CNY', CO: 'COP', CR: 'CRC', CU: 'CUP', CV: 'CVE', CW: 'XCG', CX: 'AUD', CY: 'EUR', CZ: 'CZK',
  DE: 'EUR', DJ: 'DJF', DK: 'DKK', DM: 'XCD', DO: 'DOP', DZ: 'DZD',
  EC: 'USD', EE: 'EUR', EG: 'EGP', EH: 'MAD', ER: 'ERN', ES: 'EUR', ET: 'ETB',
  FI: 'EUR', FJ: 'FJD', FK: 'FKP', FM: 'USD', FO: 'DKK', FR: 'EUR',
  GA: 'XAF', GB: 'GBP', GD: 'XCD', GE: 'GEL', GF: 'EUR', GG: 'GBP', GH: 'GHS', GI: 'GIP', GL: 'DKK', GM: 'GMD',
  GN: 'GNF', GP: 'EUR', GQ: 'XAF', GR: 'EUR', GS: 'GBP', GT: 'GTQ', GU: 'USD', GW: 'XOF', GY: 'GYD',
  HK: 'HKD', HM: 'AUD', HN: 'HNL', HR: 'EUR', HT: 'HTG', HU: 'HUF',
  ID: 'IDR', IE: 'EUR', IL: 'ILS', IM: 'GBP', IN: 'INR', IO: 'USD', IQ: 'IQD', IR: 'IRR', IS: 'ISK', IT: 'EUR',
  JE: 'GBP', JM: 'JMD', JO: 'JOD', JP: 'JPY',
  KE: 'KES', KG: 'KGS', KH: 'KHR', KI: 'AUD', KM: 'KMF', KN: 'XCD', KP: 'KPW', KR: 'KRW', KW: 'KWD', KY: 'KYD',
  KZ: 'KZT',
  LA: 'LAK', LB: 'LBP', LC: 'XCD', LI: 'CHF', LK: 'LKR', LR: 'LRD', LS: 'ZAR', LT: 'EUR', LU: 'EUR', LV: 'EUR',
  LY: 'LYD',
  MA: 'MAD', MC: 'EUR', MD: 'MDL', ME: 'EUR', MF: 'EUR', MG: 'MGA', MH: 'USD', MK: 'MKD', ML: 'XOF', MM: 'MMK',
  MN: 'MNT', MO: 'MOP', MP: 'USD', MQ: 'EUR', MR: 'MRU', MS: 'XCD', MT: 'EUR', MU: 'MUR', MV: 'MVR', MW: 'MWK',
  MX: 'MXN', MY: 'MYR', MZ: 'MZN',
  NA: 'NAD', NC: 'XPF', NE: 'XOF', NF: 'AUD', NG: 'NGN', NI: 'NIO', NL: 'EUR', NO: 'NOK', NP: 'NPR', NR: 'AUD',
  NU: 'NZD', NZ: 'NZD',
  OM: 'OMR',
  PA: 'PAB', PE: 'PEN', PF: 'XPF', PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN', PM: 'EUR', PN: 'NZD', PR: 'USD',
  PS: 'ILS', PT: 'EUR', PW: 'USD', PY: 'PYG',
  QA: 'QAR',
  RE: 'EUR', RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF',
  SA: 'SAR', SB: 'SBD', SC: 'SCR', SD: 'SDG', SE: 'SEK', SG: 'SGD', SH: 'SHP', SI: 'EUR', SJ: 'NOK', SK: 'EUR',
  SL: 'SLE', SM: 'EUR', SN: 'XOF', SO: 'SOS', SR: 'SRD', SS: 'SSP', ST: 'STN', SV: 'USD', SX: 'XCG', SY: 'SYP',
  SZ: 'SZL',
  TC: 'USD', TD: 'XAF', TF: 'EUR', TG: 'XOF', TH: 'THB', TJ: 'TJS', TK: 'NZD', TL: 'USD', TM: 'TMT', TN: 'TND',
  TO: 'TOP', TR: 'TRY', TT: 'TTD', TV: 'AUD', TW: 'TWD', TZ: 'TZS',
  UA: 'UAH', UG: 'UGX', UM: 'USD', US: 'USD', UY: 'UYU', UZ: 'UZS',
  VA: 'EUR', VC: 'XCD', VE: 'VES', VG: 'USD', VI: 'USD', VN: 'VND', VU: 'VUV',
  WF: 'XPF', WS: 'WST',
  YE: 'YER', YT: 'EUR',
  ZA: 'ZAR', ZM: 'ZMW', ZW: 'ZWG',
  // Not officially assigned, but used by locales (es-IC, es-EA, en-DG, sq-XK, ...).
  AC: 'SHP', DG: 'USD', EA: 'EUR', IC: 'EUR', TA: 'GBP', XK: 'EUR',
} satisfies Record<string, CurrencyCode>);

/** The currency of a two-letter region ("GB" -> GBP, "jp" -> JPY); null for no region or one without a currency. */
export function currencyForRegion(region: string | null | undefined): CurrencyCode | null {
  if (!region) return null;
  const code = region.trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(REGION_CURRENCIES, code) ? (REGION_CURRENCIES[code] ?? null) : null;
}

/**
 * The region subtag of a BCP 47 language tag ("en-GB" -> "GB", "zh-Hant-TW" -> "TW",
 * "es-419" -> "419"), or null when the tag names none ("de", "fr-Latn"). Never guesses a region
 * from the language. Accepts "_" as a separator too ("en_GB").
 */
export function regionOfLanguageTag(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const subtags = tag.trim().split(/[-_]/);
  // language, up to three 3-letter extended language subtags, an optional 4-letter script, then the region.
  let i = 1;
  while (i <= 3 && /^[A-Za-z]{3}$/.test(subtags[i] ?? '')) i++;
  if (/^[A-Za-z]{4}$/.test(subtags[i] ?? '')) i++;
  const region = subtags[i] ?? '';
  return /^(?:[A-Za-z]{2}|\d{3})$/.test(region) ? region.toUpperCase() : null;
}
