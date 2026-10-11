// One registration, one brand ease, one Reduce Motion gate for the whole site.
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase);
// The gate ease: Material's emphasized-decelerate, so the site and the app settle the same way.
CustomEase.create('gate', 'M0,0 C0.05,0.7 0.1,1 1,1');

export const MOTION = { quick: 0.16, standard: 0.24, slow: 0.32, readout: 0.56, hold: 0.6, focal: 0.8 } as const;

export const NO_PREFERENCE = '(prefers-reduced-motion: no-preference)';
export const REDUCE = '(prefers-reduced-motion: reduce)';
export const DESKTOP = '(min-width: 768px)';

/**
 * The live Reduce Motion answer for code that animates on demand (a readout rolling, the Gate
 * filling). Kept by one gsap.matchMedia for the life of the page.
 */
export const motionPrefs = { reduce: false };
if (typeof window !== 'undefined') {
  gsap.matchMedia().add({ reduce: REDUCE, motion: NO_PREFERENCE }, (ctx) => {
    motionPrefs.reduce = Boolean(ctx.conditions?.reduce);
  });
}

/** Everything authored for motion lives inside this; the reduce branch only sets final states. */
export function withMotion(build: (ctx: gsap.Context) => void | (() => void), still: (ctx: gsap.Context) => void | (() => void) = () => {}) {
  const mm = gsap.matchMedia();
  mm.add(NO_PREFERENCE, build);
  mm.add(REDUCE, still);
  return () => mm.revert();
}

type SettlePlugins = {
  Flip: typeof import('gsap/Flip').Flip;
  DrawSVGPlugin: typeof import('gsap/DrawSVGPlugin').DrawSVGPlugin;
  MotionPathPlugin: typeof import('gsap/MotionPathPlugin').MotionPathPlugin;
};

let settlePlugins: Promise<SettlePlugins> | null = null;

/** Flip, DrawSVG and MotionPath are used by one section, so they load with it, not with the page. */
export function loadSettlePlugins(): Promise<SettlePlugins> {
  settlePlugins ??= Promise.all([import('gsap/Flip'), import('gsap/DrawSVGPlugin'), import('gsap/MotionPathPlugin')]).then(([flip, draw, path]) => {
    gsap.registerPlugin(flip.Flip, draw.DrawSVGPlugin, path.MotionPathPlugin);
    return { Flip: flip.Flip, DrawSVGPlugin: draw.DrawSVGPlugin, MotionPathPlugin: path.MotionPathPlugin };
  });
  return settlePlugins;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
