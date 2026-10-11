// apps/mobile/src/features/insights/Basis.tsx
// "Why am I seeing this": the numbers an insight was based on, each labelled, amounts as readoutS
// readouts that roll from zero when the rows open. The rows expand with a 240 ms layout transition.
// Reduce Motion: the rows crossfade in and the values are static.
import { isMoney, zero, type Insight, type Money } from '@finbuddy/shared';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { DURATION, Readout, SPACE, Text, useLayoutTransition, useTheme } from '@/design';
import type { Formatter } from '@/features/common/format';

import { basisRows } from './copy';

/** A readout that starts at zero and rolls to its value on mount; static under Reduce Motion. */
export function RollingReadout({ money, locale, testID }: { money: Money; locale: string; testID?: string }) {
  const { reduceMotion } = useTheme();
  // One frame at zero, then the roll: the proof itself is a small readout. Static under Reduce Motion.
  const [rolled, setRolled] = useState(false);
  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => setRolled(true), 40);
    return () => clearTimeout(t);
  }, [reduceMotion]);
  const shown: Money = reduceMotion || rolled ? money : zero(money.currency);
  return <Readout money={shown} locale={locale} role="readoutS" inline testID={testID} />;
}

/** The expand/collapse transitions: layout travels (native) unless Reduce Motion, when only opacity moves. */
export function useBasisMotion() {
  const { reduceMotion } = useTheme();
  const fade = reduceMotion ? FadeIn.duration(DURATION.standard).reduceMotion(ReduceMotion.Never) : FadeIn.duration(DURATION.standard);
  const fadeOut = reduceMotion ? FadeOut.duration(DURATION.quick).reduceMotion(ReduceMotion.Never) : FadeOut.duration(DURATION.quick);
  const layout = useLayoutTransition();
  return { fade, fadeOut, layout };
}

export function BasisRows({ insight, f, testID }: { insight: Insight; f: Formatter; testID?: string }) {
  const { colors } = useTheme();
  const { fade } = useBasisMotion();
  const rows = basisRows(f, insight);
  return (
    <View testID={testID}>
      {rows.map((row, i) => {
        const raw = insight.basis[i]?.value;
        return (
          <Animated.View key={row.label} entering={fade.delay(i * 40)} style={[styles.row, i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator } : null]}>
            <Text role="subhead" color="labelSecondary" style={styles.label}>
              {row.label}
            </Text>
            {isMoney(raw) ? (
              <RollingReadout money={raw} locale={f.locale} testID={`basis-${insight.basis[i]?.label ?? i}`} />
            ) : typeof raw === 'number' || (typeof raw === 'string' && /^\d+(\.\d+)?$/.test(raw)) ? (
              <Text role="readoutS" tabular accessibilityLabel={row.value.spoken}>
                {row.value.text}
              </Text>
            ) : (
              <Text role="body" accessibilityLabel={row.value.spoken} style={styles.word}>
                {row.value.text}
              </Text>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.m, paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, minHeight: 44 },
  label: { flex: 1 },
  word: { flexShrink: 1, textAlign: 'right' },
});
