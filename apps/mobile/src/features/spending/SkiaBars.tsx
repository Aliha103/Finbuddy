// apps/mobile/src/features/spending/SkiaBars.tsx
// The month chart drawn in Skia: flat bars in the data-mark neutral, the selected month in the tint,
// standing on a hairline baseline. The month still running is drawn open: an outline in the bar's
// colour, with 45-degree stripes inside when the bar is tall enough (the way the split bar marks what
// is not yet settled). A month the engine flagged with a spike carries a small attention triangle
// above its bar. No gradients, no shadows; the labels are real Text outside the canvas. The web
// preview requires this module only once CanvasKit is loaded.
import { Canvas, Group, Line, Path, RoundedRect, Skia, rect, rrect, vec, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { HATCH, type Bar, type BarsDrawingProps } from './barGeometry';

/** 45-degree stripes across a bar's box, clipped by the caller. */
function stripes(bar: Bar): SkPath {
  const builder = Skia.PathBuilder.Make();
  const top = bar.y;
  const bottom = bar.y + bar.height;
  const h = bar.height;
  for (let x = bar.x - h; x < bar.x + bar.width; x += HATCH.gap) builder.moveTo(x, bottom).lineTo(x + h, top);
  return builder.detach();
}

function triangle(bar: Bar): SkPath | null {
  const s = bar.spike;
  if (!s) return null;
  return Skia.PathBuilder.Make().moveTo(s.cx, s.top).lineTo(s.cx + s.halfWidth, s.bottom).lineTo(s.cx - s.halfWidth, s.bottom).close().detach();
}

export function SkiaBars({ layout, width, height, selectedIndex, barColor, selectedColor, baselineColor, markerColor, radius = 3 }: BarsDrawingProps) {
  const hair = StyleSheet.hairlineWidth;
  const paths = useMemo(() => layout.bars.map((bar) => ({ hatch: bar.hatched ? stripes(bar) : null, marker: triangle(bar) })), [layout]);
  const o = HATCH.outline;
  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      {/* Bars are drawn `radius` taller than they are and clipped at the baseline, so only the top corners round. */}
      <Group clip={rect(0, 0, width, layout.baseline)}>
        {layout.bars.map((bar, i) => {
          const color = i === selectedIndex ? selectedColor : barColor;
          if (!bar.partial) return <RoundedRect key={i} x={bar.x} y={bar.y} width={bar.width} height={bar.height + (bar.zero ? 0 : radius)} r={bar.zero ? 0 : radius} color={color} />;
          const hatch = paths[i]?.hatch;
          return (
            <Group key={i}>
              {hatch ? (
                <Group clip={rrect(rect(bar.x, bar.y, bar.width, bar.height + radius), radius, radius)}>
                  <Path path={hatch} color={color} style="stroke" strokeWidth={HATCH.stroke} />
                </Group>
              ) : null}
              <RoundedRect x={bar.x + o / 2} y={bar.y + o / 2} width={bar.width - o} height={bar.height + radius} r={Math.max(0, radius - o / 2)} color={color} style="stroke" strokeWidth={o} />
            </Group>
          );
        })}
      </Group>
      {paths.map((p, i) => (p.marker ? <Path key={`m${i}`} path={p.marker} color={markerColor} /> : null))}
      <Line p1={vec(0, layout.baseline - hair / 2)} p2={vec(width, layout.baseline - hair / 2)} color={baselineColor} strokeWidth={hair} />
    </Canvas>
  );
}
