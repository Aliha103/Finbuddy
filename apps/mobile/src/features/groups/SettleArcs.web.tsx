// apps/mobile/src/features/groups/SettleArcs.web.tsx
// The web preview draws the arcs with Skia on CanvasKit. Skia's web entry builds its API from
// global.CanvasKit when the module is evaluated, so the drawing module is required only after
// useSkiaReady() says the runtime is loaded; until then the map shows its plain list
// (SettleMap.tsx) and this renders nothing. A synchronous require keeps the module inside the one
// web bundle (no split chunk to resolve from a sub-path) while deferring its evaluation.
import { useSkiaReady } from '../common/skiaWeb';
import type { SettleArcsProps } from './SettleArcsSkia';

export type { SettleArcsProps };

type SkiaArcsModule = typeof import('./SettleArcsSkia');

let skiaArcs: SkiaArcsModule | null = null;

function loadSkiaArcs(): SkiaArcsModule | null {
  if (skiaArcs) return skiaArcs;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    skiaArcs = require('./SettleArcsSkia') as SkiaArcsModule;
  } catch (error) {
    console.warn('Skia is unavailable in this browser; the settle map keeps its plain stations.', error);
  }
  return skiaArcs;
}

export function SettleArcs(props: SettleArcsProps) {
  const ready = useSkiaReady();
  const skia = ready ? loadSkiaArcs() : null;
  if (!skia) return null;
  const { SettleArcsSkia } = skia;
  return <SettleArcsSkia {...props} />;
}
