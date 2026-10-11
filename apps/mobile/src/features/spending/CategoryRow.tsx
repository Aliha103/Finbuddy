// apps/mobile/src/features/spending/CategoryRow.tsx
// One category in the "By category" list: name, count and total (a readout), with a proportional
// bar under them scaled to the largest category. Opens the category screen. Built here because the
// design system's Row has no room for a bar under its text; a candidate for src/design later.
import type { Money } from '@finbuddy/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Readout, SPACE, Text, useHaptic, useTheme } from '@/design';

import { expenseCount } from './copy';
import { ProportionBar } from './ProportionBar';

export interface CategoryRowProps {
  label: string;
  count: number;
  total: Money;
  /** The spoken total (currency name) for the row's accessibility label. */
  spokenTotal: string;
  /** 0..1 of the largest category in the list. */
  fraction: number;
  locale: string;
  onPress: () => void;
  testID?: string;
}

export function CategoryRow({ label, count, total, spokenTotal, fraction, locale, onPress, testID }: CategoryRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${spokenTotal}, ${expenseCount(count)}`}
      accessibilityHint="Opens this category"
      onPress={() => {
        haptic('select');
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [styles.row, { minHeight: theme.minTouch }, pressed && { backgroundColor: c.pressed }]}
    >
      <View style={[styles.line, theme.largeText && styles.stacked]}>
        <View style={styles.text}>
          <Text role="body" numberOfLines={2}>
            {label}
          </Text>
          <Text role="subhead" color="labelSecondary">
            {expenseCount(count)}
          </Text>
        </View>
        <View style={styles.trailing}>
          <Readout money={total} locale={locale} role="readoutS" inline />
          {theme.platform === 'ios' ? <Icon name="chevronRight" size={16} color={c.labelTertiary} /> : null}
        </View>
      </View>
      <ProportionBar fraction={fraction} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, gap: SPACE.s + 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: SPACE.xs },
  text: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
});
