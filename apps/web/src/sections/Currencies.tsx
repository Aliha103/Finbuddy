// "Exact in every currency": a full-bleed graphite band with a horizontal rail. On wide screens
// the rail is scrubbed sideways by ScrollTrigger as the band passes; on phones and under Reduce
// Motion it is a plain horizontal scroller. Every amount is parsed and split by the engine on
// this page from the text a person would type in that locale.
import {
  formatMoney,
  formatMoneyToParts,
  getNumberSeparators,
  minorUnits,
  parseMoneyInput,
  resolveSplit,
  sum,
  type CurrencyCode,
  type Money,
  type SplitSpec,
} from '@finbuddy/shared';
import { useRef } from 'react';

import { currencyName } from '../lib/locale';
import { PEOPLE } from '../lib/sample';
import { DESKTOP, NO_PREFERENCE, gsap, useGSAP } from '../motion';

interface Example {
  readonly currency: CurrencyCode;
  readonly locale: string;
  /** What a person in that locale would type. */
  readonly typed: string;
  readonly method: string;
  readonly spec: (ids: readonly string[]) => SplitSpec;
}

const three = PEOPLE.slice(0, 3);
const EXAMPLES: readonly Example[] = [
  {
    currency: 'JPY',
    locale: 'en-US',
    typed: '12345',
    method: 'Shares 1 : 1 : 2',
    spec: (ids) => ({ type: 'shares', shares: ids.map((personId, i) => ({ personId, shares: i === 2 ? 2 : 1 })) }),
  },
  { currency: 'KWD', locale: 'en-GB', typed: '10', method: 'Equally, three ways', spec: (ids) => ({ type: 'equal', participants: [...ids] }) },
  {
    currency: 'EUR',
    locale: 'de-DE',
    typed: '1.234,56',
    method: 'Percent 40 / 30 / 30',
    spec: (ids) => ({ type: 'percentage', percentages: ids.map((personId, i) => ({ personId, percent: i === 0 ? '40' : '30' })) }),
  },
  { currency: 'INR', locale: 'en-IN', typed: '123456', method: 'Equally, three ways', spec: (ids) => ({ type: 'equal', participants: [...ids] }) },
];

/** A separator in words, so "1.234,56" can be explained without squinting at punctuation. */
function mark(separator: string): string {
  if (separator === ',') return 'a comma';
  if (separator === '.') return 'a point';
  if (separator === "'" || separator === '’') return 'an apostrophe';
  if (/\s/.test(separator)) return 'a space';
  return `“${separator}”`;
}

function note(total: Money, shares: readonly Money[], locale: string): string {
  const fmt = (m: Money) => formatMoney(m, { locale });
  const digits = minorUnits(total.currency);
  const parts = formatMoneyToParts(total, { locale });
  const symbolAfter = parts.findIndex((p) => p.type === 'currency') > parts.findIndex((p) => p.type === 'integer');
  const { decimal, group } = getNumberSeparators(locale);
  const formatted = fmt(total);
  if (digits === 0) return `No decimals in ${total.currency}, so every share is a whole number.`;
  if (digits === 3) {
    const leftover = total.amountMinor % shares.length;
    return leftover
      ? `Three decimals in ${total.currency}. The extra ${fmt({ amountMinor: leftover, currency: total.currency })} goes to the first person.`
      : `Three decimals in ${total.currency}, kept to the last fils.`;
  }
  if (symbolAfter) {
    const language = new Intl.DisplayNames('en', { type: 'language' }).of(locale.split('-')[0] ?? locale) ?? locale;
    return `Written the ${language} way: ${mark(decimal)} for decimals, ${mark(group)} for thousands, symbol after.`;
  }
  if (/\d,\d\d,\d{3}/.test(formatted)) return `Grouped the Indian way, in lakhs: ${formatted}.`;
  return `Shown the way ${locale} writes ${total.currency}.`;
}

function Panel({ example }: { example: Example }) {
  const parsed = parseMoneyInput(example.typed, example.currency, { locale: example.locale, allowZero: false });
  if (!parsed.ok) return null;
  const total = parsed.value;
  const shares = resolveSplit(example.spec(three.map((p) => p.id)), total);
  const fmt = (m: Money) => formatMoney(m, { locale: example.locale });
  const back = sum(shares.map((s) => s.amount));
  return (
    <article className="flex w-[19rem] shrink-0 flex-col rounded-[12px] bg-[#2A252F] p-6 text-[#F6F2F7] ring-1 ring-[#3A3340] sm:w-[24rem]">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="text-[15px] font-semibold tracking-[0.02em]">{example.currency}</h3>
        <span className="truncate text-[14px] text-[#B9AFBE]">{currencyName(example.currency, 'en-GB')}</span>
      </header>
      <p className="readout mt-5 text-[36px] sm:text-[40px]" lang={example.locale}>
        {fmt(total)}
      </p>
      <p className="mt-2 text-[14px] text-[#B9AFBE]">
        Typed as <span lang={example.locale} className="font-semibold text-[#F6F2F7]">{example.typed}</span>, split {example.method.toLowerCase()}
      </p>
      <ul className="mt-5 divide-y divide-[#3A3340] border-y border-[#3A3340]">
        {shares.map((s) => (
          <li key={s.personId} className="flex items-baseline justify-between py-2.5 text-[16px]">
            <span className="text-[#E4DEE6]">{three.find((p) => p.id === s.personId)?.name}</span>
            <span className="font-semibold" lang={example.locale}>
              {fmt(s.amount)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[14px] leading-relaxed text-[#B9AFBE]">{note(total, shares.map((s) => s.amount), example.locale)}</p>
      <p className="mt-auto pt-4 text-[14px] text-[#B9AFBE]">
        Adds back to <span className="font-semibold text-[#F6F2F7]">{fmt(back)}</span>
      </p>
    </article>
  );
}

export function Currencies() {
  const band = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${NO_PREFERENCE} and ${DESKTOP}`, () => {
        const wrap = viewport.current;
        const row = track.current;
        if (!wrap || !row) return;
        wrap.setAttribute('data-pan', '');
        const distance = () => Math.max(0, row.scrollWidth - wrap.clientWidth);
        gsap.to(row, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: { trigger: band.current, start: 'top 75%', end: 'bottom 25%', scrub: true, invalidateOnRefresh: true },
        });
        return () => wrap.removeAttribute('data-pan');
      });
      return () => mm.revert();
    },
    { scope: band },
  );

  return (
    <section ref={band} id="currencies" aria-labelledby="currencies-title" className="overflow-x-clip border-y border-[#332C3A] bg-[#1C1922] py-20 text-[#F6F2F7] lg:py-28">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <h2 id="currencies-title" className="display text-[2.25rem] lg:text-[3rem]">
          Exact in every currency.
        </h2>
        <p className="measure mt-5 text-[18px] leading-relaxed text-[#B9AFBE]">
          Each currency keeps its own decimals and each locale its own way of writing numbers. The examples below are typed, parsed and split by the engine as this page loads, so nothing here was copied in by hand.
        </p>
      </div>
      <div ref={viewport} className="mx-auto mt-12 max-w-[80rem]">
        <div className="rail px-4 pb-4 sm:px-6 lg:px-8" role="region" aria-label="Worked examples, one per currency" tabIndex={0}>
          <div ref={track} className="flex w-max gap-4">
            {EXAMPLES.map((e) => (
              <Panel key={e.currency} example={e} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
