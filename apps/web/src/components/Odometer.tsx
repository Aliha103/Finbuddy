// The Readout on the web: formatMoneyToParts gives the characters, so symbol position, grouping
// and minor units are the engine's; each digit is a clipped, fixed-width column of ten glyphs (the
// width of the widest figure, so nothing shifts as it rolls) that GSAP rolls
// to the new digit with the gate ease. Columns are keyed from the right, so when £33.34 becomes
// £0.00 the surviving columns roll in place. Reduce Motion: the digits change in place and the
// column dips in opacity instead (a crossfade, no travel). Screen readers hear the value once,
// with the currency's name.
import { formatMoney, formatMoneyToParts, type Money } from '@finbuddy/shared';
import { useLayoutEffect, useRef } from 'react';

import { cn } from '../lib/cn';
import { MOTION, gsap, motionPrefs } from '../motion';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface Token {
  readonly digit: boolean;
  readonly ch: string;
}

export function Odometer({ money, locale, className, live = false }: { money: Money; locale: string; className?: string; live?: boolean }) {
  const root = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);
  const parts = formatMoneyToParts(money, { locale });
  const tokens: Token[] = parts.flatMap((p) =>
    p.type === 'integer' || p.type === 'fraction' ? [...p.value].map((ch) => ({ digit: DIGITS.includes(ch), ch })) : [{ digit: false, ch: p.value }],
  );
  const spoken = formatMoney(money, { locale, currencyDisplay: 'name' });

  useLayoutEffect(() => {
    const columns = root.current?.querySelectorAll<HTMLElement>('[data-col]');
    if (!columns) return;
    columns.forEach((col) => {
      const strip = col.firstElementChild;
      const target = -Number(col.dataset.col) * 10;
      if (!mounted.current) {
        // Before the first paint every column sits on its digit, so nothing rolls in on load.
        gsap.set(strip, { yPercent: target });
      } else if (motionPrefs.reduce) {
        gsap.set(strip, { yPercent: target });
        gsap.fromTo(col, { opacity: 0.25 }, { opacity: 1, duration: MOTION.standard, overwrite: true });
      } else {
        gsap.to(strip, { yPercent: target, duration: MOTION.readout, ease: 'gate', overwrite: true });
      }
    });
    mounted.current = true;
  }, [money.amountMinor, money.currency, locale]);

  return (
    <span ref={root} className={cn('readout inline-flex items-baseline whitespace-nowrap', className)}>
      <span className="sr-only" aria-live={live ? 'polite' : undefined}>
        {spoken}
      </span>
      {tokens.map((t, i) => {
        const key = `${t.digit ? 'd' : 't'}-${tokens.length - i}`;
        return t.digit ? (
          <span key={key} data-col={t.ch} aria-hidden="true" className="inline-block h-[1em] w-[0.65em] overflow-hidden text-center">
            <span className="flex flex-col will-change-transform">
              {DIGITS.map((d) => (
                <span key={d} className="block h-[1em] leading-none">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={key} aria-hidden="true" className="whitespace-pre">
            {t.ch}
          </span>
        );
      })}
    </span>
  );
}
