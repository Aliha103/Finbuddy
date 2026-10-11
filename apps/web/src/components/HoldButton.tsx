// The Gate on the web: press and hold for 600 ms while a stroked ring closes, then the action
// runs. Releasing early rewinds the ring in 160 ms. Enter and Space held for 600 ms work the same
// way. A press that ends early (or a click from assistive technology, which cannot hold) reports
// itself through onShortPress, so the page can offer a plain confirmation instead. The hold is
// progress, not decoration, so it runs under Reduce Motion too; the caller swaps in a plain
// two-step button there.
import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';

import { cn } from '../lib/cn';
import { MOTION, gsap } from '../motion';

const RING = 22;
const STROKE = 2.5;
const R = RING / 2 - STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export interface HoldButtonProps {
  label: string;
  onConfirm: () => void;
  onShortPress?: () => void;
  disabled?: boolean;
  className?: string;
  describedBy?: string;
}

export function HoldButton({ label, onConfirm, onShortPress, disabled, className, describedBy }: HoldButtonProps) {
  const ring = useRef<SVGCircleElement>(null);
  const progress = useRef({ value: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const holding = useRef<'pointer' | 'key' | null>(null);
  const done = useRef(false);

  const draw = () => {
    if (ring.current) ring.current.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress.current.value));
  };

  useEffect(() => () => void tween.current?.kill(), []);

  const start = (how: 'pointer' | 'key') => {
    if (disabled || holding.current) return;
    holding.current = how;
    done.current = false;
    tween.current?.kill();
    tween.current = gsap.to(progress.current, {
      value: 1,
      duration: MOTION.hold * (1 - progress.current.value),
      ease: 'none',
      onUpdate: draw,
      onComplete: () => {
        done.current = true;
        holding.current = null;
        onConfirm();
        gsap.to(progress.current, { value: 0, duration: MOTION.standard, delay: 0.2, ease: 'gate', onUpdate: draw });
      },
    });
  };

  const release = () => {
    if (!holding.current) return;
    holding.current = null;
    if (done.current) return;
    const early = progress.current.value < 1;
    tween.current?.kill();
    tween.current = gsap.to(progress.current, { value: 0, duration: MOTION.quick, ease: 'gate', onUpdate: draw });
    if (early) onShortPress?.();
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start('pointer');
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      start('key');
    }
  };
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (holding.current === 'key') release();
    }
  };
  // A click with no hold behind it comes from assistive technology (or a synthetic activation).
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0 && !holding.current && !done.current) onShortPress?.();
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-describedby={describedBy}
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={release}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'inline-flex h-12 touch-manipulation items-center gap-3 rounded-full bg-tint pr-6 pl-3 text-[17px] font-semibold text-on-tint select-none [-webkit-touch-callout:none] transition-transform duration-[160ms] active:scale-[0.98] disabled:opacity-45',
        className,
      )}
    >
      <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden="true" className="-rotate-90">
        <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={STROKE} />
        <circle
          ref={ring}
          cx={RING / 2}
          cy={RING / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE}
        />
      </svg>
      {label}
    </button>
  );
}
