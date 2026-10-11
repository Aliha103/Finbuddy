// apps/mobile/src/features/spending/BarsDrawing.tsx (native)
// Skia is native on iOS and Android, so the chart draws in Skia at once. The web preview resolves
// BarsDrawing.web.tsx instead, which waits for CanvasKit.
import type { BarsDrawingProps } from './barGeometry';
import { SkiaBars } from './SkiaBars';

export function BarsDrawing(props: BarsDrawingProps) {
  return <SkiaBars {...props} />;
}
