// apps/mobile/src/features/spending/BudgetRow.tsx
// One monthly budget: its category (or "All spending"), the pace in words from the engine's
// budget_pace insight ("£159.50 of £200.00, 20 days left, ahead of pace") and a bar of spent against
// the limit with a tick where an even pace would be today. The words carry the state; the bar adds
// attention amber when ahead of pace and red only once the budget is exceeded.
import type { Budget } from '@finbuddy/shared';

import { BarRow } from '@/design';
import { categoryLabel, paceSentence, type BudgetPace, type Formatter } from '@/features/common/format';

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
  const label = budgetLabel(budget);
  const sentence = pace ? paceSentence(f, pace) : f.say(budget.amount, ' a month. Pace shows once this month has spending');
  const fraction = pace && pace.budget.amountMinor > 0 ? pace.spent.amountMinor / pace.budget.amountMinor : 0;
  const marker = pace && pace.budget.amountMinor > 0 ? pace.expectedToDate.amountMinor / pace.budget.amountMinor : null;
  return (
    <BarRow
      title={label}
      subtitle={sentence.text}
      sample={budget.isSample === true}
      bar={pace ? { fraction, marker, tone: pace.status === 'over' ? 'danger' : pace.status === 'ahead' ? 'attention' : 'tint' } : null}
      onPress={onPress}
      accessibilityLabel={`${label} budget, ${sentence.spoken}`}
      accessibilityHint={accessibilityHint}
      highlighted={highlighted}
      testID={testID}
    />
  );
}
