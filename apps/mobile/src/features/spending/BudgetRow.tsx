// apps/mobile/src/features/spending/BudgetRow.tsx
// One monthly budget: its category (or "All spending"), the pace in words from the engine's
// budget_pace insight ("£159.50 of £200.00, 20 days left, ahead of pace") and a bar of spent against
// the limit with a tick where an even pace would be today. The words carry the state; red appears
// only when the budget is exceeded. Built here because the design system's Row has no bar.
import type { Budget } from '@finbuddy/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SPACE, SampleChip, Text, useHaptic, useTheme } from '@/design';
import { categoryLabel, type Formatter } from '@/features/common/format';

import { paceSentence, type BudgetPace } from './copy';
import { ProportionBar } from './ProportionBar';

export interface BudgetRowProps {
  budget: Budget;
  pace: BudgetPace | null;
  f: Formatter;
  onPress: () => void;
  accessibilityHint?: string;
  /** Draws the row on the alternate surface (the budget being edited). */
  highlighted?: boolean;
  testID?: string;
}

export function budgetLabel(budget: Pick<Budget, 'categoryId'>): string {
  return budget.categoryId === null ? 'All spending' : categoryLabel(budget.categoryId);
}

export function BudgetRow({ budget, pace, f, onPress, accessibilityHint, highlighted, testID }: BudgetRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const label = budgetLabel(budget);
  const sentence = pace ? paceSentence(f, pace) : f.say(budget.amount, ' a month. Pace shows once this month has spending');
  const fraction = pace && pace.budget.amountMinor > 0 ? pace.spent.amountMinor / pace.budget.amountMinor : 0;
  const marker = pace && pace.budget.amountMinor > 0 ? pace.expectedToDate.amountMinor / pace.budget.amountMinor : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} budget, ${sentence.spoken}`}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [styles.row, { minHeight: theme.minTouch }, highlighted && { backgroundColor: c.surfaceAlt }, pressed && { backgroundColor: c.pressed }]}
    >
      <View style={styles.line}>
        <View style={styles.text}>
          <View style={styles.titleLine}>
            <Text role="body" numberOfLines={2}>
              {label}
            </Text>
            {budget.isSample ? <SampleChip /> : null}
          </View>
          <Text role="subhead" color="labelSecondary">
            {sentence.text}
          </Text>
        </View>
        {theme.platform === 'ios' ? <Icon name="chevronRight" size={16} color={c.labelTertiary} /> : null}
      </View>
      {pace ? <ProportionBar fraction={fraction} marker={marker} tone={pace.status === 'over' ? 'danger' : 'tint'} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, gap: SPACE.s + 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexWrap: 'wrap' },
});
