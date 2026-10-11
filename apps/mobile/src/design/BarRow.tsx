// apps/mobile/src/design/BarRow.tsx
// A list row with a proportional bar under its text: a category's share of the month, a budget's
// spend against its limit. The title and a secondary line on the leading side, an optional value
// (a readout) on the trailing side, and the bar across the row's width beneath them. The words
// carry the figures and the state; the bar is decorative. At large text sizes the value drops under
// the words instead of squeezing them.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useHaptic } from './haptics';
import { Icon } from './Icon';
import { ProportionBar, type ProportionBarProps } from './ProportionBar';
import { SampleChip } from './SampleChip';
import { Text } from './Text';
import { useTheme } from './theme';
import { SPACE } from './tokens';

export interface BarRowProps {
  title: string;
  /** The secondary line under the title ("3 expenses", the budget's pace in words). */
  subtitle?: string;
  /** The trailing value, usually a Readout. */
  detail?: ReactNode;
  sample?: boolean;
  /** The bar under the text; null draws none. */
  bar: ProportionBarProps | null;
  onPress: () => void;
  /** The whole row is one button: its label says everything the row shows, amounts with currency names. */
  accessibilityLabel: string;
  accessibilityHint?: string;
  /** Draws the row on the alternate surface (the item being edited). */
  highlighted?: boolean;
  testID?: string;
}

export function BarRow({ title, subtitle, detail, sample, bar, onPress, accessibilityLabel, accessibilityHint, highlighted, testID }: BarRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const chevron = theme.platform === 'ios' ? <Icon name="chevronRight" size={16} color={c.labelTertiary} /> : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [styles.row, { minHeight: theme.minTouch }, highlighted && { backgroundColor: c.surfaceAlt }, pressed && { backgroundColor: c.pressed }]}
    >
      <View style={[styles.line, theme.largeText && detail !== undefined && styles.stacked]}>
        <View style={styles.text}>
          <View style={styles.titleLine}>
            <Text role="body" numberOfLines={2} style={styles.title}>
              {title}
            </Text>
            {sample ? <SampleChip /> : null}
          </View>
          {subtitle ? (
            <Text role="subhead" color="labelSecondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {detail !== undefined ? (
          <View style={styles.trailing}>
            {detail}
            {chevron}
          </View>
        ) : (
          chevron
        )}
      </View>
      {bar ? <ProportionBar {...bar} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, gap: SPACE.s + 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: SPACE.xs },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexWrap: 'wrap' },
  title: { flexShrink: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
});
