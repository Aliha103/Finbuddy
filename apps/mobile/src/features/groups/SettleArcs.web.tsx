// apps/mobile/src/features/groups/SettleArcs.web.tsx
// The web preview draws the arcs with Skia on CanvasKit, loaded after the first paint. Until it is
// ready the map shows its plain stations (SettleMap.tsx) and this renders nothing; then the Skia
// module loads (deferSkiaModule in features/common/skiaWeb explains why it must not load earlier).
import { deferSkiaModule } from '../common/skiaWeb';
import type { SettleArcsProps } from './SettleArcsSkia';

export type { SettleArcsProps };

const useSkiaArcs = deferSkiaModule(
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  () => require('./SettleArcsSkia') as typeof import('./SettleArcsSkia'),
  'Skia is unavailable in this browser; the settle map keeps its plain stations.',
);

export function SettleArcs(props: SettleArcsProps) {
  const skia = useSkiaArcs();
  if (!skia) return null;
  const { SettleArcsSkia } = skia;
  return <SettleArcsSkia {...props} />;
}
