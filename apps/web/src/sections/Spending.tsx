// "One picture of your money": asymmetric columns. Left, six months of the sample person's own
// share of spending (spendingByMonth), the current month emphasised; right, the insight the
// engine raised for that month (generateInsights) with the numbers it was based on.
import { daysInMonth, formatMoney, type InsightValue, type Money } from '@finbuddy/shared';
import { useEffect, useRef, useState } from 'react';

import { SampleChip } from '../components/Chip';
import { cn } from '../lib/cn';
import { APP_URL } from '../lib/links';
import { CURRENT_MONTH, SAMPLE_ANCHOR, SAMPLE_LOCALE, SPENDING, SPENDING_CHANGE, SPIKE, categoryLabel } from '../lib/sample';
import { MOTION, NO_PREFERENCE, ScrollTrigger, gsap, useGSAP } from '../motion';

const fmt = (m: Money) => formatMoney(m, { locale: SAMPLE_LOCALE });
const monthLabel = (month: string, style: 'short' | 'long') =>
  new Intl.DateTimeFormat(SAMPLE_LOCALE, { month: style, timeZone: 'UTC', ...(style === 'long' ? { year: 'numeric' } : {}) }).format(new Date(`${month}-01T00:00:00Z`));
const daysToGo = daysInMonth(CURRENT_MONTH) - Number(SAMPLE_ANCHOR.slice(8, 10));
const dayLabel = new Intl.DateTimeFormat(SAMPLE_LOCALE, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${SAMPLE_ANCHOR}T00:00:00Z`));

const BASIS_LABELS: Record<string, string> = {
  thisMonth: 'This month so far',
  averagePreviousMonths: 'Average of the months before',
  monthsCompared: 'Months compared',
  ratio: 'Times the usual amount',
};

function basisValue(value: InsightValue): string {
  if (value && typeof value === 'object' && 'amountMinor' in value) return fmt(value);
  if (typeof value === 'number') return new Intl.NumberFormat(SAMPLE_LOCALE).format(value);
  return String(value ?? '');
}

/** A clean axis step: 1, 2 or 5 times a power of ten, giving about four gridlines. */
function niceStep(max: number): number {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw) as number;
}

const PLOT = { left: 48, right: 8, top: 40, bottom: 34 };
const BAR = 24;

function Chart() {
  const [active, setActive] = useState<number | null>(null);
  // Drawn at the container's own pixel size, so labels stay 12 to 14 px on a phone too.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 480 ? 240 : 300;
  const currency = SPENDING[0]?.total.currency ?? 'GBP';
  const max = Math.max(1, ...SPENDING.map((s) => s.total.amountMinor));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const plotW = W - PLOT.left - PLOT.right;
  const plotH = H - PLOT.top - PLOT.bottom;
  const slot = plotW / SPENDING.length;
  const y = (minor: number) => PLOT.top + plotH - (minor / top) * plotH;
  const last = SPENDING.length - 1;
  const tick = (minor: number) => formatMoney({ amountMinor: minor, currency }, { locale: SAMPLE_LOCALE, notation: 'compact' });
  const current = SPENDING[last];
  const hovered = active === null ? null : SPENDING[active];

  return (
    <div ref={box} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="group" aria-label="Your share of spending by month, sample data">
        {ticks.map((t) => (
          <g key={t} aria-hidden="true">
            <line className="stroke-separator" x1={PLOT.left} x2={W - PLOT.right} y1={y(t)} y2={y(t)} strokeWidth={1} />
            <text className="fill-label-2" x={PLOT.left - 10} y={y(t) + 4} textAnchor="end" fontSize={12}>
              {tick(t)}
            </text>
          </g>
        ))}
        {SPENDING.map((s, i) => {
          const cx = PLOT.left + slot * i + slot / 2;
          const h = Math.max(0, y(0) - y(s.total.amountMinor));
          const x = cx - BAR / 2;
          const r = Math.min(4, h);
          const d = `M${x} ${y(0)} V${y(0) - h + r} Q${x} ${y(0) - h} ${x + r} ${y(0) - h} H${x + BAR - r} Q${x + BAR} ${y(0) - h} ${x + BAR} ${y(0) - h + r} V${y(0)} Z`;
          const emphasis = i === last;
          return (
            <g
              key={s.month}
              tabIndex={0}
              role="img"
              aria-label={`${monthLabel(s.month, 'long')}${emphasis ? `, to ${dayLabel}` : ''}: ${fmt(s.total)} across ${s.count} expenses`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="outline-none [&:focus-visible>rect]:stroke-tint"
            >
              <rect x={cx - slot / 2 + 2} y={PLOT.top - 8} width={slot - 4} height={plotH + 8} rx={6} fill="transparent" stroke="transparent" strokeWidth={2} />
              <path data-bar d={d} className={emphasis ? 'fill-tint' : 'fill-chart-muted'} opacity={active === null || active === i ? 1 : 0.55} />
              <text x={cx} y={H - PLOT.bottom + 22} textAnchor="middle" fontSize={13} fontWeight={emphasis ? 600 : 400} className={emphasis ? 'fill-label' : 'fill-label-2'} aria-hidden="true">
                {monthLabel(s.month, 'short')}
              </text>
            </g>
          );
        })}
        {current ? (
          <text className="fill-label" x={PLOT.left + slot * last + slot / 2} y={y(current.total.amountMinor) - 12} textAnchor="end" dx={BAR / 2} fontSize={14} fontWeight={700} aria-hidden="true">
            {fmt(current.total)}
          </text>
        ) : null}
        <line className="stroke-label-3" x1={PLOT.left} x2={W - PLOT.right} y1={y(0)} y2={y(0)} strokeWidth={1} aria-hidden="true" />
      </svg>
      {hovered && active !== null ? (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-[10px] bg-surface-raised px-3 py-2 text-[13px] shadow-card ring-1 ring-separator"
          style={{ left: `${((PLOT.left + slot * active + slot / 2) / W) * 100}%`, top: `${((PLOT.top - 6) / H) * 100}%` }}
        >
          <div className="font-semibold whitespace-nowrap">{monthLabel(hovered.month, 'long')}</div>
          <div className="whitespace-nowrap text-label-2">
            <span className="font-semibold text-label">{fmt(hovered.total)}</span>, {hovered.count} expenses
          </div>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>Your share of spending by month, sample data</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Your share</th>
            <th scope="col">Expenses</th>
          </tr>
        </thead>
        <tbody>
          {SPENDING.map((s) => (
            <tr key={s.month}>
              <th scope="row">{monthLabel(s.month, 'long')}</th>
              <td>{fmt(s.total)}</td>
              <td>{s.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Spending() {
  const scope = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_PREFERENCE, () => {
        ScrollTrigger.batch(gsap.utils.toArray<SVGPathElement>('[data-bar]'), {
          start: 'top 92%',
          once: true,
          onEnter: (bars) => gsap.from(bars, { scaleY: 0, transformOrigin: '50% 100%', duration: MOTION.readout, ease: 'gate', stagger: 0.06 }),
        });
      });
      return () => mm.revert();
    },
    { scope },
  );

  const change = SPENDING_CHANGE;
  const pct = change?.changeRatio != null ? new Intl.NumberFormat(SAMPLE_LOCALE, { style: 'percent', maximumFractionDigits: 0 }).format(Math.abs(change.changeRatio)) : null;
  const previousName = change?.previous ? monthLabel(SPENDING.at(-2)?.month ?? CURRENT_MONTH, 'long').split(' ')[0] : null;
  const ratio = SPIKE ? Number(SPIKE.body.data.ratio ?? 0) : 0;
  const times = new Intl.NumberFormat(SAMPLE_LOCALE, { maximumFractionDigits: 1 }).format(ratio);
  const category = SPIKE ? categoryLabel(SPIKE.subject.categoryId) : '';

  return (
    <section ref={scope} id="spending" aria-labelledby="spending-title" className="py-20 lg:py-28">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <h2 id="spending-title" className="display text-[2.25rem] lg:text-[3rem]">
          One picture of your money.
        </h2>
        <p className="measure mt-5 text-[18px] leading-relaxed text-label-2">
          Your share of every group expense lands in your own spending, next to what you paid for alone. Insights are rules run over those numbers, and each one shows what it was based on.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="rounded-[12px] bg-surface p-5 ring-1 ring-separator sm:p-7 lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold">Your share, month by month</h3>
                <p className="mt-1 text-[14px] text-label-2">
                  {monthLabel(SPENDING[0]?.month ?? CURRENT_MONTH, 'short')} to {dayLabel}, in {SPENDING[0]?.total.currency}
                </p>
              </div>
              <SampleChip />
            </div>
            {change && pct && change.change ? (
              <p className="mt-5 text-[16px]">
                <span className="readout text-[32px]">{fmt(change.current)}</span>
                <span className="mt-1 block text-label-2">
                  {change.change.amountMinor >= 0 ? 'Up' : 'Down'} {pct} on {previousName}, {fmt({ ...change.change, amountMinor: Math.abs(change.change.amountMinor) })} {change.change.amountMinor >= 0 ? 'more' : 'less'}, with {daysToGo} days of the month to go
                </span>
              </p>
            ) : null}
            <div className="mt-6">
              <Chart />
            </div>
          </div>

          {SPIKE ? (
            <aside aria-labelledby="insight-title" className="flex flex-col rounded-[12px] bg-surface p-5 ring-1 ring-separator sm:p-7 lg:col-span-5">
              <div className="flex items-center justify-between gap-3">
                <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold', SPIKE.severity === 'warning' ? 'bg-attention-wash text-attention' : 'bg-fill text-label-2')}>
                  {SPIKE.severity === 'warning' ? 'Warning' : SPIKE.severity === 'notice' ? 'Worth a look' : 'For your information'}
                </span>
                <SampleChip />
              </div>
              <h3 id="insight-title" className="title mt-4 text-[22px]">
                {SPIKE.severity === 'warning' ? 'Spending spike' : 'Spending is up'}
              </h3>
              <p className="mt-2 text-[17px] leading-relaxed">
                {category} is {times} times your usual this month.
              </p>
              <h4 className="mt-6 text-[13px] font-semibold text-label-2">Why you are seeing this</h4>
              <dl className="mt-2 divide-y divide-separator">
                {SPIKE.basis.map((b) => (
                  <div key={b.label} className="flex items-baseline justify-between gap-4 py-2.5 text-[15px]">
                    <dt className="text-label-2">{BASIS_LABELS[b.label] ?? b.label}</dt>
                    <dd className="font-semibold">{basisValue(b.value)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-auto pt-6 text-[15px] font-medium">{APP_URL ? 'Worked out on your phone, or in your browser. Nothing is sent anywhere.' : 'Worked out on the phone. Nothing is sent anywhere.'}</p>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}

