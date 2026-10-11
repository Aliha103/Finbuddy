// apps/mobile/src/features/expense/components/Hatch.web.tsx
// On the web preview Skia needs CanvasKit, which the root layout loads after the first paint
// (features/common/skiaWeb). Until it is ready the remainder is a plain View; then the Skia module
// is required. It must not load earlier: @shopify/react-native-skia reads the CanvasKit global
// when its module first runs (the same pattern as features/spending/BarsDrawing.web.tsx).
import { useSkiaReady } from '@/features/common/skiaWeb';

import type { HatchProps } from './hatchTypes';
import { HatchView } from './HatchView';

type HatchSkiaModule = typeof import('./HatchSkia');

let hatchSkia: HatchSkiaModule | null = null;

function loadHatchSkia(): HatchSkiaModule | null {
  if (hatchSkia) return hatchSkia;
  try {
    hatchSkia = require('./HatchSkia') as HatchSkiaModule;
  } catch (error) {
    console.warn('Skia hatch unavailable on this browser; keeping the plain remainder.', error);
  }
  return hatchSkia;
}

export function Hatch(props: HatchProps) {
  const ready = useSkiaReady();
  const skia = ready ? loadHatchSkia() : null;
  if (!skia) return <HatchView {...props} />;
  const { HatchSkia } = skia;
  return <HatchSkia {...props} />;
}
