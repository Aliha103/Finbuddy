// "Settle without the awkward bit": the sample dinner club's debts, drawn as the engine reports
// them. pairwiseDebts gives every pair's netted debt; simplifyDebts gives the fewest payments that
// settle everyone. When the diagram is 60% in view it collapses once: the pairwise arrows fade,
// Flip moves the people into payers and receivers, DrawSVG draws the plan and MotionPath carries a
// token along each payment. The toggle replays it either way; under Reduce Motion it crossfades.
import { formatMoney, type Transfer } from '@finbuddy/shared';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { SampleChip } from '../components/Chip';
import { cn } from '../lib/cn';
import { initials } from '../lib/colors';
import { useMediaQuery, useReducedMotion } from '../lib/media';
import { ME, SAMPLE_LOCALE, SETTLE } from '../lib/sample';
import { MOTION, NO_PREFERENCE, ScrollTrigger, gsap, loadSettlePlugins, useGSAP } from '../motion';

type Mode = 'all' | 'fewest';
type Point = { x: number; y: number };
type Plugins = Awaited<ReturnType<typeof loadSettlePlugins>>;

const fmt = (t: Transfer) => formatMoney(t.amount, { locale: SAMPLE_LOCALE });
const who = (id: string) => SETTLE.members.find((m) => m.id === id)?.name ?? 'Someone';
const whoObject = (id: string) => (id === ME ? 'you' : who(id));

function layouts(wide: boolean) {
  const W = wide ? 720 : 360;
  const H = wide ? 380 : 440;
  const left = wide ? 130 : 64;
  const right = W - left;
  const top = wide ? 70 : 76;
  const bottom = H - top;
  const ids = SETTLE.members.map((m) => m.id);
  // All debts: the members around a square, in the group's order.
  const corners: Point[] = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
  const all = new Map<string, Point>(
    ids.map((id, i) => {
      const c = corners[i];
      if (c && ids.length <= 4) return [id, c];
      const a = (i / ids.length) * Math.PI * 2 - Math.PI / 2;
      return [id, { x: W / 2 + Math.cos(a) * (W / 2 - left), y: H / 2 + Math.sin(a) * (H / 2 - top) }];
    }),
  );
  // Fewest payments: payers on the left, receivers on the right, anyone settled in the middle.
  const payers = ids.filter((id) => SETTLE.plan.some((t) => t.from === id));
  const receivers = ids.filter((id) => SETTLE.plan.some((t) => t.to === id) && !payers.includes(id));
  const rest = ids.filter((id) => !payers.includes(id) && !receivers.includes(id));
  const column = (list: string[], x: number) => list.map((id, i): [string, Point] => [id, { x, y: list.length === 1 ? H / 2 : top + ((bottom - top) * i) / (list.length - 1) }]);
  const fewest = new Map<string, Point>([...column(payers, left), ...column(receivers, right), ...column(rest, W / 2)]);
  return { W, H, all, fewest };
}

/** A quadratic arrow between two nodes, shortened by the node radius at both ends. */
function arrow(a: Point, b: Point, bend: number, r: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const n = { x: dy / len, y: -dx / len };
  const c = { x: (a.x + b.x) / 2 + n.x * bend * len, y: (a.y + b.y) / 2 + n.y * bend * len };
  const toward = (p: Point, q: Point, d: number) => {
    const l = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    return { x: p.x + ((q.x - p.x) / l) * d, y: p.y + ((q.y - p.y) / l) * d };
  };
  const s = toward(a, c, r);
  const e = toward(b, c, r + 3);
  const mid = { x: 0.25 * s.x + 0.5 * c.x + 0.25 * e.x, y: 0.25 * s.y + 0.5 * c.y + 0.25 * e.y };
  // Arrowhead along the tangent at the end.
  const tl = Math.hypot(e.x - c.x, e.y - c.y) || 1;
  const t = { x: (e.x - c.x) / tl, y: (e.y - c.y) / tl };
  const head = 9;
  const tip = { x: e.x + t.x * 3, y: e.y + t.y * 3 };
  const p1 = { x: tip.x - t.x * head + t.y * head * 0.55, y: tip.y - t.y * head - t.x * head * 0.55 };
  const p2 = { x: tip.x - t.x * head - t.y * head * 0.55, y: tip.y - t.y * head + t.x * head * 0.55 };
  return {
    d: `M${s.x.toFixed(1)} ${s.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`,
    head: `M${tip.x.toFixed(1)} ${tip.y.toFixed(1)} L${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`,
    mid,
  };
}

export function Settle() {
  const reduce = useReducedMotion();
  const wide = useMediaQuery('(min-width: 640px)');
  const [mode, setMode] = useState<Mode>(() => (reduce ? 'fewest' : 'all'));
  const section = useRef<HTMLElement>(null);
  const diagram = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const plugins = useRef<Plugins | null>(null);
  const pending = useRef<{ state: ReturnType<Plugins['Flip']['getState']> | null; animate: boolean } | null>(null);

  const { W, H, all, fewest } = layouts(wide);
  const positions = mode === 'all' ? all : fewest;
  // Node radius in diagram units: half the 52 px node plus a gap, at the diagram's current scale.
  const r = (34 * W) / Math.max(1, width);

  useEffect(() => {
    const el = diagram.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reduce Motion starts on the result; otherwise the collapse is the section's one moment.
  useEffect(() => {
    if (reduce) setMode('fewest');
  }, [reduce]);

  const go = (next: Mode, animate: boolean) => {
    if (next === mode) return;
    const Flip = plugins.current?.Flip;
    const nodes = section.current?.querySelectorAll('[data-node]');
    pending.current = { state: animate && Flip && nodes ? Flip.getState(nodes) : null, animate };
    setMode(next);
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_PREFERENCE, () => {
        void loadSettlePlugins().then((p) => {
          plugins.current = p;
        });
        ScrollTrigger.create({
          trigger: diagram.current,
          start: '60% bottom',
          once: true,
          onEnter: () => {
            void loadSettlePlugins().then((p) => {
              plugins.current = p;
              const nodes = section.current?.querySelectorAll('[data-node]');
              pending.current = { state: nodes ? p.Flip.getState(nodes) : null, animate: true };
              setMode('fewest');
            });
          },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  // After React has moved the nodes, play the transition from where they were.
  useLayoutEffect(() => {
    const root = section.current;
    if (!root) return;
    const job = pending.current;
    pending.current = null;
    const pairG = root.querySelectorAll('[data-set="all"]');
    const planG = root.querySelectorAll('[data-set="fewest"]');
    const show = mode === 'all' ? pairG : planG;
    const hide = mode === 'all' ? planG : pairG;
    const p = plugins.current;
    if (!job) {
      gsap.set(hide, { autoAlpha: 0 });
      gsap.set(show, { autoAlpha: 1 });
      gsap.set(root.querySelectorAll('[data-token]'), { autoAlpha: 0 });
      return;
    }
    if (!job.animate || !p || reduce) {
      // Reduce Motion keeps only opacity: a crossfade between the two pictures.
      gsap.to(hide, { autoAlpha: 0, duration: MOTION.standard, overwrite: true });
      gsap.to(show, { autoAlpha: 1, duration: MOTION.standard, overwrite: true });
      gsap.set(root.querySelectorAll('[data-draw]'), { strokeDasharray: 'none', strokeDashoffset: 0 });
      gsap.set(root.querySelectorAll('[data-token]'), { autoAlpha: 0 });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'gate' } });
    tl.to(hide, { autoAlpha: 0, duration: MOTION.standard, overwrite: true }, 0);
    if (job.state) tl.add(p.Flip.from(job.state, { duration: MOTION.focal, ease: 'gate' }), 0.1);
    if (mode === 'fewest') {
      const lines = root.querySelectorAll<SVGPathElement>('[data-set="fewest"] [data-draw]');
      const heads = root.querySelectorAll('[data-set="fewest"] [data-head]');
      const labels = root.querySelectorAll('[data-set="fewest"][data-label]');
      tl.set(heads, { autoAlpha: 0 }, 0);
      tl.set(root.querySelectorAll('svg [data-set="fewest"]'), { autoAlpha: 1 }, 0.55);
      tl.fromTo(lines, { drawSVG: '0%' }, { drawSVG: '100%', duration: MOTION.focal, stagger: 0.12 }, 0.55);
      tl.to(heads, { autoAlpha: 1, duration: MOTION.quick, stagger: 0.12 }, 1.25);
      tl.fromTo(labels, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: MOTION.standard, stagger: 0.12 }, 1.3);
      lines.forEach((path, i) => {
        const token = root.querySelector(`[data-token="${i}"]`);
        if (!token) return;
        tl.fromTo(token, { autoAlpha: 1 }, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 1, ease: 'gate' }, 1.35 + i * 0.12);
        tl.to(token, { autoAlpha: 0, duration: MOTION.quick }, `>-0.05`);
      });
    } else {
      tl.to(show, { autoAlpha: 1, duration: MOTION.slow, overwrite: true }, 0.6);
    }
  }, [mode, reduce]);

  const transfers = mode === 'all' ? SETTLE.pairwise : SETTLE.plan;
  const at = (id: string) => positions.get(id) ?? { x: W / 2, y: H / 2 };
  const pairArrows = SETTLE.pairwise.map((t) => ({ t, ...arrow(all.get(t.from) ?? { x: 0, y: 0 }, all.get(t.to) ?? { x: 0, y: 0 }, 0.12, r) }));
  const planArrows = SETTLE.plan.map((t) => ({ t, ...arrow(fewest.get(t.from) ?? { x: 0, y: 0 }, fewest.get(t.to) ?? { x: 0, y: 0 }, 0, r) }));
  const pct = (p: Point) => ({ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` });

  return (
    <section ref={section} id="settle" aria-labelledby="settle-title" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[44rem] text-center">
          <h2 id="settle-title" className="display text-[2.25rem] lg:text-[3rem]">
            Settle without the awkward bit.
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-[18px] leading-relaxed text-label-2">
            In the sample {SETTLE.name.toLowerCase()}, {SETTLE.members.length} people owe each other in {SETTLE.pairwise.length} directions. FinBuddy nets everyone's balance, then pairs the largest debt with the largest credit
            until everyone is square: {SETTLE.plan.length} payments instead of {SETTLE.pairwise.length}.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div role="group" aria-label="Show" className="inline-flex rounded-full bg-fill p-1">
            {(
              [
                ['all', `All debts, ${SETTLE.pairwise.length}`],
                ['fewest', `Fewest payments, ${SETTLE.plan.length}`],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => go(value, !reduce)}
                className={cn(
                  'h-10 rounded-full px-4 text-[15px] font-medium transition-colors duration-[160ms]',
                  mode === value ? 'bg-surface text-label shadow-[0_1px_2px_rgba(26,20,32,0.14)] ring-1 ring-separator' : 'text-label-2 hover:text-label',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div ref={diagram} data-mode={mode} className="relative mx-auto mt-8 w-full max-w-[45rem]" style={{ aspectRatio: `${W} / ${H}` }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
            <g data-set="all">
              {pairArrows.map((a) => (
                <g key={`${a.t.from}-${a.t.to}`}>
                  <path className="stroke-label-3" d={a.d} fill="none" strokeWidth={1.5} strokeLinecap="round" />
                  <path className="fill-label-3" d={a.head} />
                </g>
              ))}
            </g>
            <g data-set="fewest">
              {planArrows.map((a) => (
                <g key={`${a.t.from}-${a.t.to}`}>
                  <path className="stroke-tint" data-draw d={a.d} fill="none" strokeWidth={2.5} strokeLinecap="round" />
                  <path className="fill-tint" data-head d={a.head} />
                </g>
              ))}
              {planArrows.map((a, i) => (
                <circle className="fill-tint stroke-surface" key={`token-${a.t.from}-${a.t.to}`} data-token={i} r={6} cx={0} cy={0} strokeWidth={2} visibility="hidden" />
              ))}
            </g>
          </svg>

          {pairArrows.map((a) => (
            <span
              key={`l-${a.t.from}-${a.t.to}`}
              data-set="all"
              data-label
              aria-hidden="true"
              style={pct(a.mid)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface px-2 py-0.5 text-[12px] font-semibold text-label-2 sm:text-[13px]"
            >
              {fmt(a.t)}
            </span>
          ))}
          {planArrows.map((a) => (
            <span
              key={`l-${a.t.from}-${a.t.to}`}
              data-set="fewest"
              data-label
              aria-hidden="true"
              style={pct(a.mid)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-tint px-2.5 py-1 text-[13px] font-semibold text-on-tint sm:text-[14px]"
            >
              {fmt(a.t)}
            </span>
          ))}

          {SETTLE.members.map((m) => (
            <div key={m.id} data-node data-flip-id={m.id} className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={pct(at(m.id))} aria-hidden="true">
              <span className={cn('inline-flex size-[52px] items-center justify-center rounded-full text-[16px] font-semibold ring-4 ring-surface', m.id === ME ? 'bg-tint text-on-tint' : 'bg-ground text-label outline outline-1 outline-separator')}>
                {initials(m.name)}
              </span>
              <span className="text-[14px] font-medium">{m.name}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-[45rem] gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h3 className="text-[15px] font-semibold">{mode === 'all' ? 'Who owes whom, pair by pair' : 'The plan that settles everyone'}</h3>
            <ol className="mt-3 space-y-1.5 text-[16px] text-label-2" aria-live="polite">
              {transfers.map((t) => (
                <li key={`${t.from}-${t.to}`}>
                  {who(t.from)} {mode === 'all' ? (t.from === ME ? 'owe' : 'owes') : t.from === ME ? 'pay' : 'pays'} {whoObject(t.to)}{' '}
                  <span className="font-semibold text-label">{fmt(t)}</span>
                </li>
              ))}
            </ol>
          </div>
          <SampleChip className="justify-self-start" />
        </div>
        <p className="mx-auto mt-8 max-w-[45rem] border-t border-separator pt-6 text-[16px] leading-relaxed text-label-2">
          <strong className="font-semibold text-label">Pending stays pending.</strong> A payment you record as pending changes no balance until the person receiving it confirms it, so nobody is marked as paid on a promise.
        </p>
      </div>
    </section>
  );
}
