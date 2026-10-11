// apps/mobile/src/design/HoldRing.tsx (native)
// The Gate's ring, drawn in Skia: a faint full track and a stroked arc whose `end` is the hold
// progress, read straight from the shared value on the UI thread. Redrawn only while the hold runs.
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

export interface HoldRingProps {
  /** 0 at rest, 1 at the gate. */
  progress: SharedValue<number>;
  size: number;
  stroke: number;
  color: string;
  trackOpacity?: number;
}

export function HoldRing({ progress, size, stroke, color, trackOpacity = 0.3 }: HoldRingProps) {
  const ring = useMemo(() => {
    const p = Skia.Path.Make();
    const r = size / 2 - stroke / 2;
    // Starts at 12 o'clock and runs clockwise; `end` is driven by the hold progress.
    p.addArc({ x: stroke / 2, y: stroke / 2, width: r * 2, height: r * 2 }, -90, 359.9);
    return p;
  }, [size, stroke]);
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - stroke / 2} color={color} opacity={trackOpacity} style="stroke" strokeWidth={stroke} />
      <Path path={ring} color={color} style="stroke" strokeWidth={stroke} strokeCap="round" start={0} end={progress} />
    </Canvas>
  );
}
