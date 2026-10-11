// The first viewport: the headline, one sentence, the two honest store buttons, and the Split Card,
// which is the primary object. One rehearsed sequence (masked lines, the card rising, the buttons)
// under 1.4 s; under Reduce Motion nothing is tweened and the content is simply there.
import { useRef } from 'react';

import { SplitCard } from '../components/SplitCard';
import { StoreButtons } from '../components/StoreButtons';
import { MOTION, SplitText, gsap, useGSAP, withMotion } from '../motion';

/** index.html's CSS shows the hero at 700 ms whatever happens; start the sequence before that. */
const INTRO_WINDOW_MS = 640;

export function Hero() {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const headline = scope.current?.querySelector<HTMLElement>('h1');
      const html = document.documentElement;
      const release = () => html.classList.remove('intro');
      // The prerendered hero is already on screen. The sequence only plays if it can start inside
      // the short window index.html holds the hero for; otherwise the page stays as it painted.
      if (!headline || !html.classList.contains('intro') || performance.now() > INTRO_WINDOW_MS) {
        release();
        return;
      }
      return withMotion(() => {
        release();
        // Content is visible by default; the from() states exist only while this sequence runs.
        // autoSplit re-splits if Mona Sans arrives after the first split and moves a line break.
        const split = SplitText.create(headline, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'line',
          autoSplit: true,
          onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: MOTION.focal, stagger: 0.08, ease: 'gate' }),
        });
        const tl = gsap.timeline({ defaults: { ease: 'gate' }, delay: 0.25 });
        tl.from('[data-hero-copy]', { y: 16, autoAlpha: 0, duration: MOTION.slow })
          .from('[data-hero-card]', { y: 40, rotateX: -8, autoAlpha: 0, duration: MOTION.focal, transformPerspective: 1200, transformOrigin: '50% 100%' }, 0.05)
          .from('[data-hero-cta] button', { y: 12, autoAlpha: 0, duration: MOTION.standard, stagger: 0.06 }, 0.3);
        return () => split.revert();
      }, release);
    },
    { scope },
  );

  return (
    <section ref={scope} id="top" aria-labelledby="hero-title" className="scroll-mt-4">
      <div className="mx-auto grid max-w-[80rem] grid-cols-1 gap-x-8 gap-y-6 px-4 pt-6 pb-16 sm:px-6 md:grid-cols-12 md:gap-y-8 md:pt-8 lg:px-8 lg:pb-24">
        <h1 id="hero-title" data-intro className="display text-[2.5rem] sm:text-[3rem] md:col-span-12 lg:text-[3.5rem] xl:text-[3.875rem]">
          <span className="block">Split the bill.</span>
          <span className="block">Keep one picture of your money.</span>
        </h1>
        <div className="md:col-span-5 lg:col-span-4">
          <p data-hero-copy data-intro className="max-w-[34ch] text-[19px] leading-[1.45] text-label-2 md:text-[20px]">
            Shared costs and your own spending in one exact ledger, in every currency you use.
          </p>
          <div data-hero-cta data-intro className="mt-7">
            <StoreButtons />
          </div>
        </div>
        <div data-hero-card data-intro className="md:col-span-7 md:col-start-6 lg:col-start-6">
          <SplitCard />
        </div>
      </div>
    </section>
  );
}
