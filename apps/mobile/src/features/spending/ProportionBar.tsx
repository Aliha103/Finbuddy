// apps/mobile/src/features/spending/ProportionBar.tsx
// A flat horizontal bar: a track in the fill colour and a portion in the tint (or the danger role
// when a budget is exceeded), with an optional tick for a reference point ("where an even pace
// would be today"). Decorative: the row's words carry the figures and the state.
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design';

export interface ProportionBarProps {
  /** 0..1 of the track; clamped. */
  fraction: number;
  /** 0..1 position of a reference tick; omitted for none. */
  marker?: number | null;
  tone?: 'tint' | 'danger';
  height?: number;
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

export function ProportionBar({ fraction, marker, tone = 'tint', height = 6 }: ProportionBarProps) {
  const { colors } = useTheme();
  const pct = clamp(fraction);
  const tick = marker === undefined || marker === null ? null : clamp(marker);
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.fill }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.fill, { width: `${pct * 100}%`, minWidth: pct > 0 ? 2 : 0, borderRadius: height / 2, backgroundColor: tone === 'danger' ? colors.danger : colors.tint }]} />
      {tick !== null ? <View style={[styles.tick, { left: `${tick * 100}%`, height: height + 4, backgroundColor: colors.label }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { alignSelf: 'stretch', overflow: 'visible', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  tick: { position: 'absolute', width: 2, marginLeft: -1, borderRadius: 1 },
});
