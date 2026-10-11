// apps/mobile/src/features/expense/components/HatchSkia.tsx
// The split bar's unassigned remainder, drawn in Skia: a flat ground with 45-degree hairline
// stripes, the way a ticket marks the part of a fare not yet paid. One canvas the width of the bar;
// the segment that shows it clips it to the remainder's width, so the canvas never resizes in a drag.
import { Canvas, Path, Rect, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { HatchProps } from './hatchTypes';

export function HatchSkia({ width, height, stripe, ground, gap = 6 }: HatchProps) {
  const path = useMemo(() => {
    const builder = Skia.PathBuilder.Make();
    for (let x = -height; x < width + height; x += gap) builder.moveTo(x, height).lineTo(x + height, 0);
    return builder.detach();
  }, [width, height, gap]);
  if (width <= 0 || height <= 0) return null;
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height} color={ground} />
      <Path path={path} color={stripe} style="stroke" strokeWidth={1.5} />
    </Canvas>
  );
}
