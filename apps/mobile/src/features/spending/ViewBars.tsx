// apps/mobile/src/features/spending/ViewBars.tsx
// The month chart drawn with plain Views: the web preview shows this until CanvasKit has loaded,
// and it is the same geometry as the Skia drawing, so the team reviews the same chart.
import { StyleSheet, View } from 'react-native';

import type { BarsDrawingProps } from './barGeometry';

export function ViewBars({ layout, width, height, selectedIndex, barColor, mutedOpacity, baselineColor, radius = 3 }: BarsDrawingProps) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      {layout.bars.map((bar, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: bar.x,
            top: bar.y,
            width: bar.width,
            height: bar.height,
            borderTopLeftRadius: bar.zero ? 0 : radius,
            borderTopRightRadius: bar.zero ? 0 : radius,
            backgroundColor: barColor,
            opacity: i === selectedIndex ? 1 : mutedOpacity,
          }}
        />
      ))}
      <View style={[styles.baseline, { top: layout.baseline - StyleSheet.hairlineWidth, width, backgroundColor: baselineColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  baseline: { position: 'absolute', left: 0, height: StyleSheet.hairlineWidth },
});
