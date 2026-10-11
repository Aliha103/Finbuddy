// apps/mobile/src/features/groups/SettleArcsSkia.tsx
// The drawn part of the SettleMap: the rail, one arc per slot (a cubic from payer to payee, built
// on the UI thread from the shared progress value, with an arrowhead at the payee), and a ring per
// member, all in the group's line colour on the white card. Everything written on the map (names,
// amounts) is real text in SettleMap.tsx, not Skia.
//
// Native imports this directly. The web preview must not evaluate this module before CanvasKit is
// loaded (Skia's web entry captures the global at import time), so SettleArcs.web.tsx requires it
// lazily once useSkiaReady() is true.
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { ARC_STROKE, RAIL_INSET, RING_R, blend, type ArcSlot, type Station } from './settleMapGeometry';

export interface SettleArcsProps {
  width: number;
  height: number;
  railY: number;
  stations: readonly Station[];
  /** The member who is the profile owner: a filled ring. */
  meId: string | null;
  slots: readonly ArcSlot[];
  /** 0 = all debts, 1 = fewest payments. */
  progress: SharedValue<number>;
  lineColor: string;
  surfaceColor: string;
  railColor: string;
}

const ARROW = 9;

export function SettleArcsSkia({ width, height, railY, stations, meId, slots, progress, lineColor, surfaceColor, railColor }: SettleArcsProps) {
  const first = stations[0]?.x ?? RAIL_INSET;
  const last = stations[stations.length - 1]?.x ?? width - RAIL_INSET;
  return (
    // A flat style object: Skia's web Canvas spreads `style` into a plain div, which cannot take an array.
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width, height, pointerEvents: 'none' }} pointerEvents="none">
      <Path path={`M ${first} ${railY} H ${last}`} color={railColor} style="stroke" strokeWidth={1.5} />
      {slots.map((slot) => (
        <Arc key={slot.key} slot={slot} progress={progress} railY={railY} color={lineColor} />
      ))}
      {stations.map((s) => (
        <Circle key={s.id} cx={s.x} cy={railY} r={RING_R} color={s.id === meId ? lineColor : surfaceColor} style="fill" />
      ))}
      {stations.map((s) => (
        <Circle key={`${s.id}-ring`} cx={s.x} cy={railY} r={RING_R} color={lineColor} style="stroke" strokeWidth={3} />
      ))}
    </Canvas>
  );
}

function Arc({ slot, progress, railY, color }: { slot: ArcSlot; progress: SharedValue<number>; railY: number; color: string }) {
  const top = railY - RING_R - 1;
  const arc = useDerivedValue(() => {
    const g = blend(slot, progress.value);
    return Skia.PathBuilder.Make()
      .moveTo(g.x0, top)
      .cubicTo(g.x0, railY - g.h, g.x1, railY - g.h, g.x1, top)
      .build();
  }, [slot, railY, top]);
  const head = useDerivedValue(() => {
    const g = blend(slot, progress.value);
    // The arrowhead points down into the payee's ring; its size follows the arc's presence so a
    // collapsing arc takes its arrow with it.
    const size = ARROW * Math.min(1, Math.max(0, g.present));
    return Skia.PathBuilder.Make()
      .moveTo(g.x1, top)
      .lineTo(g.x1 - size * 0.55, top - size)
      .lineTo(g.x1 + size * 0.55, top - size)
      .close()
      .build();
  }, [slot, top]);
  const opacity = useDerivedValue(() => Math.min(1, Math.max(0, blend(slot, progress.value).present)), [slot]);
  return (
    <>
      <Path path={arc} color={color} style="stroke" strokeWidth={ARC_STROKE} strokeCap="round" opacity={opacity} />
      <Path path={head} color={color} style="fill" opacity={opacity} />
    </>
  );
}
