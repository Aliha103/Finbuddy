// apps/mobile/src/features/spending/BarsDrawing.web.tsx
// On the web preview Skia needs CanvasKit, which the root layout starts loading after the first
// paint. Until it is ready the chart is plain Views; then the Skia module loads (deferSkiaModule in
// features/common/skiaWeb explains why it must not load earlier).
import { deferSkiaModule } from '@/features/common/skiaWeb';

import type { BarsDrawingProps } from './barGeometry';
import { ViewBars } from './ViewBars';

const useSkiaBars = deferSkiaModule(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('./SkiaBars') as typeof import('./SkiaBars'),
  'Skia chart unavailable on this browser; keeping the plain bars.',
);

export function BarsDrawing(props: BarsDrawingProps) {
  const skia = useSkiaBars();
  if (!skia) return <ViewBars {...props} />;
  const { SkiaBars } = skia;
  return <SkiaBars {...props} />;
}
