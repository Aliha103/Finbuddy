// apps/mobile/src/design/ProportionBar.tsx
// A flat horizontal bar: a track in the fill colour and a portion in the data-mark neutral (the
// tint is for action, not data; attention when a budget runs ahead of pace, danger once it is
// exceeded), with an optional tick for a reference point ("where an even pace would be today") set
// off from the fill by a hairline of the surface colour. Decorative: the row's words carry the
// figures and the state.
import { StyleSheet, View } from 'react-native';

import { useTheme } from './theme';

export interface ProportionBarProps {
  /** 0..1 of the track; clamped. */
  fraction: number;
  /** 0..1 position of a reference tick; omitted for none. */
  marker?: number | null;
  tone?: 'dataMark' | 'attention' | 'danger';
  height?: number;
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

export function ProportionBar({ fraction, marker, tone = 'dataMark', height = 6 }: ProportionBarProps) {
  const { colors } = useTheme();
  const pct = clamp(fraction);
  const tick = marker === undefined || marker === null ? null : clamp(marker);
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.fill }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.fill, { width: `${pct * 100}%`, minWidth: pct > 0 ? 2 : 0, borderRadius: height / 2, backgroundColor: colors[tone] }]} />
      {tick !== null ? <View style={[styles.tick, { left: `${tick * 100}%`, height: height + 6, backgroundColor: colors.label, borderColor: colors.surface }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { alignSelf: 'stretch', overflow: 'visible', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  tick: { position: 'absolute', width: 5, marginLeft: -2.5, borderLeftWidth: 1.5, borderRightWidth: 1.5 },
});
