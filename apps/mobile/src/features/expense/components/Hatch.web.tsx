// apps/mobile/src/features/expense/components/Hatch.web.tsx
// On the web preview Skia needs CanvasKit, which the root layout loads after the first paint.
// Until it is ready the remainder is a plain View; then the Skia module loads (deferSkiaModule in
// features/common/skiaWeb explains why it must not load earlier).
import { deferSkiaModule } from '@/features/common/skiaWeb';

import type { HatchProps } from './hatchTypes';
import { HatchView } from './HatchView';

const useHatchSkia = deferSkiaModule(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('./HatchSkia') as typeof import('./HatchSkia'),
  'Skia hatch unavailable on this browser; keeping the plain remainder.',
);

export function Hatch(props: HatchProps) {
  const skia = useHatchSkia();
  if (!skia) return <HatchView {...props} />;
  const { HatchSkia } = skia;
  return <HatchSkia {...props} />;
}
