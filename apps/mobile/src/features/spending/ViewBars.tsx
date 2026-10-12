// apps/mobile/src/features/spending/ViewBars.tsx
// The month chart drawn with plain Views: the web preview shows this until CanvasKit has loaded,
// and it is the same geometry as the Skia drawing, so the team reviews the same chart. Only the web
// preview draws it, so the partial month's hatch is a CSS stripe pattern inside the same outline.
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { HATCH, type BarsDrawingProps } from './barGeometry';

/** The stripes as CSS: the same stroke and spacing as the Skia hatch, measured across the stripes. */
function hatchStyle(color: string): ViewStyle {
  const period = HATCH.gap / Math.SQRT2;
  // react-native-web passes the property through to the element's style.
  return { backgroundImage: `repeating-linear-gradient(-45deg, ${color} 0 ${HATCH.stroke}px, transparent ${HATCH.stroke}px ${period}px)` } as ViewStyle;
}

export function ViewBars({ layout, width, height, selectedIndex, barColor, selectedColor, baselineColor, markerColor, radius = 3 }: BarsDrawingProps) {
  return (
    <View style={{ width, height }} pointerEvents="none">
      {layout.bars.map((bar, i) => {
        const color = i === selectedIndex ? selectedColor : barColor;
        return (
          <View
            key={i}
            style={[
              {
                position: 'absolute',
                left: bar.x,
                top: bar.y,
                width: bar.width,
                height: bar.height,
                borderTopLeftRadius: bar.zero ? 0 : radius,
                borderTopRightRadius: bar.zero ? 0 : radius,
              },
              bar.partial ? [{ borderWidth: HATCH.outline, borderBottomWidth: 0, borderColor: color }, bar.hatched ? hatchStyle(color) : null] : { backgroundColor: color },
            ]}
          />
        );
      })}
      {layout.bars.map((bar, i) =>
        bar.spike ? (
          <View
            key={`m${i}`}
            style={[
              styles.marker,
              {
                left: bar.spike.cx - bar.spike.halfWidth,
                top: bar.spike.top,
                borderLeftWidth: bar.spike.halfWidth,
                borderRightWidth: bar.spike.halfWidth,
                borderBottomWidth: bar.spike.bottom - bar.spike.top,
                borderBottomColor: markerColor,
              },
            ]}
          />
        ) : null,
      )}
      <View style={[styles.baseline, { top: layout.baseline - StyleSheet.hairlineWidth, width, backgroundColor: baselineColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  baseline: { position: 'absolute', left: 0, height: StyleSheet.hairlineWidth },
  // A triangle from borders: transparent sides over a coloured bottom edge.
  marker: { position: 'absolute', width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
});
