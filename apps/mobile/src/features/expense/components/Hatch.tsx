// apps/mobile/src/features/expense/components/Hatch.tsx (native)
// Skia is native on iOS and Android, so the hatch draws at once. The web preview resolves
// Hatch.web.tsx, which waits for CanvasKit.
import type { HatchProps } from './hatchTypes';
import { HatchSkia } from './HatchSkia';

export function Hatch(props: HatchProps) {
  return <HatchSkia {...props} />;
}
