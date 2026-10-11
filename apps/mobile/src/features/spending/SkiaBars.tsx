// apps/mobile/src/features/spending/SkiaBars.tsx
// The month chart drawn in Skia: flat bars in the tint, the selected month at full strength and the
// others muted, standing on a hairline baseline. No gradients, no shadows; the labels are real Text
// outside the canvas. The web preview requires this module only once CanvasKit is loaded.
import { Canvas, Group, Line, RoundedRect, rect, vec } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

import type { BarsDrawingProps } from './barGeometry';

export function SkiaBars({ layout, width, height, selectedIndex, barColor, mutedOpacity, baselineColor, radius = 3 }: BarsDrawingProps) {
  const hair = StyleSheet.hairlineWidth;
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {/* Bars are drawn `radius` taller than they are and clipped at the baseline, so only the top corners round. */}
      <Group clip={rect(0, 0, width, layout.baseline)}>
        {layout.bars.map((bar, i) => (
          <RoundedRect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height + (bar.zero ? 0 : radius)} r={bar.zero ? 0 : radius} color={barColor} opacity={i === selectedIndex ? 1 : mutedOpacity} />
        ))}
      </Group>
      <Line p1={vec(0, layout.baseline - hair / 2)} p2={vec(width, layout.baseline - hair / 2)} color={baselineColor} strokeWidth={hair} />
    </Canvas>
  );
}
