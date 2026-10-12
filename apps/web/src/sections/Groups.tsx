// "Every group is its own card": a pinned split. Copy on the left; on the right the five cards fan
// out as the visitor scrolls. The fan is three.js (lazy, near the viewport, WebGL only); the SVG
// below draws the same cards from the same poses, so it is both the placeholder while three.js
// loads and the fallback without WebGL. Under Reduce Motion the fan is simply open and nothing
// pins, scrubs or loads.
import { formatMoney } from '@finbuddy/shared';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { SampleChip } from '../components/Chip';
import { cn } from '../lib/cn';
import { CARD_UNITS, FAN_CARDS, fanLayout, pose, type CardTheme, type FanCard, type FanLayout } from '../lib/fan';
import { useMediaQuery, useReducedMotion } from '../lib/media';
import { OVERVIEW, SAMPLE_LOCALE } from '../lib/sample';
import { useTheme } from '../lib/theme';
import { DESKTOP, NO_PREFERENCE, REDUCE, gsap, useGSAP } from '../motion';

const CardFan = lazy(() => import('../three/CardFan'));

// The SVG fallback projects the scene's world units onto a viewBox of the stage's aspect.
const VIEW_W = 800;
// The fallback's colours follow the page theme through CSS variables (styles.css, --fan-*).
const SVG_THEME: CardTheme = {
  surface: 'var(--fan-card)',
  label: 'var(--label)',
  label2: 'var(--label-2)',
  separator: 'var(--fan-separator)',
  tint: 'var(--tint)',
  onTint: 'var(--on-tint)',
  fill: 'var(--fan-fill)',
};
// Painter's order: back to front, as in the scene.
const PAINT = FAN_CARDS.map((_, i) => i);

function projection(layout: FanLayout) {
  const viewH = VIEW_W / layout.aspect;
  const px = viewH / (2 * layout.cameraZ * Math.tan(((layout.fov / 2) * Math.PI) / 180));
  return { viewH, px, scale: (layout.cardW * px) / CARD_UNITS.w };
}

function transformFor(i: number, p: number, layout: FanLayout): string {
  const { viewH, px, scale } = projection(layout);
  const q = pose(i, FAN_CARDS.length, p, layout);
  const x = VIEW_W / 2 + q.x * px;
  const y = viewH / 2 - q.y * px;
  const deg = (-q.rotZ * 180) / Math.PI;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${deg.toFixed(3)}) scale(${scale.toFixed(4)}) translate(${-CARD_UNITS.w / 2} ${-CARD_UNITS.h / 2})`;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') ?? canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

/** The same card drawCard paints into the three.js textures, as SVG. */
function SvgCard({ card, theme }: { card: FanCard; theme: CardTheme }) {
  const { w, h, radius, band, pad } = CARD_UNITS;
  const home = card.kind === 'home';
  const ink = home ? theme.onTint : theme.label;
  const soft = home ? theme.onTint : theme.label2;
  const left = pad + (card.line ? band : 0);
  const clip = `fan-clip-${card.key}`;
  const big = Math.max(0, ...card.lines.map((l) => l.amounts.length)) <= 1 ? 30 : 22;
  const colW = (w - left - pad) / Math.max(1, card.lines.length);
  const first = card.lines[0];
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <rect width={w} height={h} rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect style={{ fill: home ? theme.tint : theme.surface }} width={w} height={h} />
        {card.line ? <rect style={{ fill: card.line.fill }} width={band} height={h} /> : null}
      </g>
      {!home ? <rect style={{ stroke: theme.separator }} x={0.5} y={0.5} width={w - 1} height={h - 1} rx={radius} fill="none" /> : null}
      {card.line ? (
        <>
          <rect style={{ fill: card.line.fill }} x={left} y={pad} width={card.name.length * 7.4 + 20} height={24} rx={12} />
          <text style={{ fill: card.line.on }} x={left + 10} y={pad + 16.5} fontSize={13} fontWeight={600}>
            {card.name}
          </text>
        </>
      ) : (
        <>
          <rect style={{ fill: ink }} x={left} y={pad + 4} width={22} height={5} rx={2.5} />
          <rect style={{ fill: ink }} x={left} y={pad + 13} width={9.8} height={5} rx={2.5} />
          <rect style={{ fill: ink }} x={left + 12.2} y={pad + 13} width={9.8} height={5} rx={2.5} />
          <text style={{ fill: ink }} x={left + 30} y={pad + 16.5} fontSize={15} fontWeight={700}>
            {card.name}
          </text>
        </>
      )}
      {!home ? (
        <>
          {first ? (
            <>
              <text style={{ fill: soft }} x={w - pad} y={pad + 10} fontSize={12} fontWeight={500} textAnchor="end">
                {first.label}
              </text>
              <text style={{ fill: ink }} x={w - pad} y={pad + 40} fontSize={26} fontWeight={700} textAnchor="end">
                {first.amounts[0] ?? ''}
              </text>
            </>
          ) : null}
          <text style={{ fill: soft }} x={w - pad} y={h - pad} fontSize={12} fontWeight={600} textAnchor="end">
            {`${card.meta}  ·  Sample`}
          </text>
          {card.members.slice(0, 4).map((m, i) => (
            <g key={`${m}-${i}`}>
              <circle style={{ fill: theme.fill, stroke: theme.surface }} cx={left + 11 + i * 18} cy={h - pad - 7} r={11} strokeWidth={2} />
              <text style={{ fill: theme.label }} x={left + 11 + i * 18} y={h - pad - 3} fontSize={10} fontWeight={600} textAnchor="middle">
                {m.slice(0, 1).toUpperCase()}
              </text>
            </g>
          ))}
        </>
      ) : (
        <>
          <text style={{ fill: soft }} x={w - pad} y={pad + 20} fontSize={12} fontWeight={600} textAnchor="end">
            {card.meta}
          </text>
          {card.lines.map((line, c) => {
            const x = left + c * colW;
            const base = h - pad - (line.amounts.length - 1) * (big + 4);
            return (
              <g key={line.label}>
                <text style={{ fill: soft }} x={x} y={base - big - 6} fontSize={12} fontWeight={500}>
                  {line.label}
                </text>
                {line.amounts.map((a, j) => (
                  <text style={{ fill: ink }} key={a} x={x} y={base + j * (big + 4)} fontSize={big} fontWeight={700}>
                    {a}
                  </text>
                ))}
              </g>
            );
          })}
        </>
      )}
    </>
  );
}

export function Groups() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const progress = useRef({ value: 0 }).current;
  const invalidateRef = useRef<(() => void) | null>(null);
  const reduce = useReducedMotion();
  const { resolved } = useTheme();
  const [webgl, setWebgl] = useState(false);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const wide = useMediaQuery(DESKTOP);
  const layout = fanLayout(wide);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const { viewH } = projection(layout);

  useEffect(() => setWebgl(hasWebGL()), []);

  // Load three.js only when the section is within one viewport of the screen, and never before
  // the page itself has finished loading, so it cannot compete with the first paint.
  const [pageLoaded, setPageLoaded] = useState(false);
  useEffect(() => {
    const idle = () => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) ric(() => setPageLoaded(true), { timeout: 1500 });
      else window.setTimeout(() => setPageLoaded(true), 200);
    };
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
    return () => window.removeEventListener('load', idle);
  }, []);
  useEffect(() => {
    const el = section.current;
    if (!el || near) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '100% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  useGSAP(
    () => {
      const draw = () => {
        svg.current?.querySelectorAll<SVGGElement>('[data-card]').forEach((g) => g.setAttribute('transform', transformFor(Number(g.dataset.card), progress.value, layoutRef.current)));
        invalidateRef.current?.();
      };
      const mm = gsap.matchMedia();
      mm.add({ motion: NO_PREFERENCE, reduce: REDUCE, desktop: DESKTOP }, (ctx) => {
        const { motion, desktop } = ctx.conditions ?? {};
        if (!motion) {
          // The open fan is the resting state; nothing moves on scroll.
          progress.value = 1;
          draw();
          return;
        }
        progress.value = 0;
        draw();
        gsap.to(progress, {
          value: 1,
          ease: 'none',
          onUpdate: draw,
          scrollTrigger: desktop
            ? { trigger: section.current, start: 'top top', end: '+=120%', pin: true, scrub: 0.4, anticipatePin: 1 }
            : { trigger: stage.current, start: 'top 85%', end: 'bottom 50%', scrub: 0.4 },
        });
        return () => {
          progress.value = 1;
          draw();
        };
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  const showThree = webgl && near && pageLoaded && !reduce;
  const home = FAN_CARDS.find((c) => c.kind === 'home');
  const fmt = (m: (typeof OVERVIEW.owe)[number]) => formatMoney(m, { locale: SAMPLE_LOCALE });

  return (
    <section ref={section} id="groups" aria-labelledby="groups-title" className="border-t border-separator md:flex md:min-h-[100svh] md:items-center">
      <div className="mx-auto grid w-full max-w-[80rem] grid-cols-1 items-center gap-x-8 gap-y-10 px-4 py-20 sm:px-6 md:grid-cols-12 md:py-16 lg:px-8">
        <div className="md:col-span-5">
          <h2 id="groups-title" className="display text-[2.25rem] lg:text-[3rem]">
            Every group is its own card.
          </h2>
          <p className="measure mt-5 text-[18px] leading-relaxed text-label-2">
            A trip, a flat, a dinner club: each group keeps its own people, its own currency and its own balance. The people in it don't need the app for you to split with them.
          </p>
          <ul className="mt-8 space-y-5 text-[16px] leading-relaxed">
            <li className="border-l border-separator pl-4">
              <strong className="font-semibold">Balances stay in their currency.</strong>{' '}
              <span className="text-label-2">
                {home && OVERVIEW.owe.length > 1
                  ? `Across these groups you owe ${OVERVIEW.owe.map(fmt).join(' and ')}, shown as ${OVERVIEW.owe.length} figures, because adding them would need a rate nobody agreed on.`
                  : 'Amounts in different currencies are listed side by side and never added together.'}
              </span>
            </li>
            <li className="border-l border-separator pl-4">
              <strong className="font-semibold">Members without the app still count.</strong> <span className="text-label-2">They are names you add. You record what they paid and what they owe.</span>
            </li>
            <li className="border-l border-separator pl-4">
              <strong className="font-semibold">Your share joins your own spending.</strong> <span className="text-label-2">Your part of the rent shows up in your month next to your groceries, so the picture is whole.</span>
            </li>
          </ul>
        </div>
        <figure className="md:col-span-7">
          <div ref={stage} className="relative aspect-[4/5] w-full md:aspect-[5/4]">
            <svg
              ref={svg}
              viewBox={`0 0 ${VIEW_W} ${viewH.toFixed(1)}`}
              aria-hidden="true"
              className={cn('absolute inset-0 size-full overflow-visible font-sans transition-opacity duration-[240ms]', showThree && ready && 'opacity-0')}
            >
              {PAINT.map((i) => {
                const card = FAN_CARDS[i];
                return card ? (
                  <g key={card.key} data-card={i} transform={transformFor(i, reduce ? 1 : progress.value, layout)}>
                    <SvgCard card={card} theme={SVG_THEME} />
                  </g>
                ) : null;
              })}
            </svg>
            {showThree ? (
              <div className={cn('absolute inset-0 transition-opacity duration-[240ms]', ready ? 'opacity-100' : 'opacity-0')}>
                <Suspense fallback={null}>
                  <CardFan cards={FAN_CARDS} theme={resolved} layout={layout} progress={progress} invalidateRef={invalidateRef} onReady={() => setReady(true)} />
                </Suspense>
              </div>
            ) : null}
          </div>
          <figcaption className="mt-4 flex items-center gap-3 text-[14px] text-label-2">
            <SampleChip />
            <span>Balances from the app's sample data, worked out by the same engine.</span>
          </figcaption>
          <ul className="sr-only">
            {FAN_CARDS.map((c) => (
              <li key={c.key}>
                {c.name}
                {c.kind === 'group' ? `, ${c.meta}, ${c.members.length} members` : ''}: {c.lines.map((l) => `${l.label} ${l.amounts.join(' and ')}`).join('; ')}.
              </li>
            ))}
          </ul>
        </figure>
      </div>
    </section>
  );
}
