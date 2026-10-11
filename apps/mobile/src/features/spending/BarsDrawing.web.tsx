// apps/mobile/src/features/spending/BarsDrawing.web.tsx
// On the web preview Skia needs CanvasKit, which the root layout starts loading after the first
// paint (features/common/skiaWeb). Until it is ready the chart is plain Views; once it is, the Skia
// module is required (Metro runs a module the first time it is required, and @shopify/react-native-skia
// reads the CanvasKit global when it loads, so it must not load earlier).
import { useSkiaReady } from '@/features/common/skiaWeb';

import type { BarsDrawingProps } from './barGeometry';
import { ViewBars } from './ViewBars';

type SkiaBarsModule = typeof import('./SkiaBars');

let skiaBars: SkiaBarsModule | null = null;

function loadSkiaBars(): SkiaBarsModule | null {
  if (skiaBars) return skiaBars;
  try {
    // A lazy require on purpose: an import would load Skia before CanvasKit exists (see above).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    skiaBars = require('./SkiaBars') as SkiaBarsModule;
  } catch (error) {
    console.warn('Skia chart unavailable on this browser; keeping the plain bars.', error);
  }
  return skiaBars;
}

export function BarsDrawing(props: BarsDrawingProps) {
  const ready = useSkiaReady();
  const skia = ready ? loadSkiaBars() : null;
  if (!skia) return <ViewBars {...props} />;
  const { SkiaBars } = skia;
  return <SkiaBars {...props} />;
}
