// apps/mobile/src/features/insights/SubjectLinks.tsx
// What an insight is about, as rows that open it: a category in Spending, each expense it counted,
// the settlement it reminds about (Settle up when you pay, the group when you are paid), a budget.
import type { Insight } from '@finbuddy/shared';
import { router } from 'expo-router';

import { useDataStore, useExpense, useGroups } from '@/data';
import { Icon, ListSection, Readout, Row, useTheme } from '@/design';
import { openExpense, openGroup } from '@/features/activity/ActivityRow';
import { categoryLabel, cleanName, type Formatter } from '@/features/common/format';

const MAX_EXPENSES = 6;

function ExpenseLink({ expenseId, f }: { expenseId: string; f: Formatter }) {
  const { colors } = useTheme();
  const expense = useExpense(expenseId);
  if (!expense) return null;
  return (
    <Row
      title={expense.description || f.category(expense.categoryId)}
      subtitle={f.date(expense.occurredOn)}
      detail={<Readout money={expense.total} locale={f.locale} role="readoutS" inline />}
      leading={<Icon name="receipt" size={22} color={colors.labelSecondary} />}
      sample={expense.isSample === true}
      onPress={() => openExpense(expense.id)}
      accessibilityHint="Opens the expense"
      chevron
    />
  );
}

export function SubjectLinks({ insight, f }: { insight: Insight; f: Formatter }) {
  const { colors } = useTheme();
  const groups = useGroups();
  const settlements = useDataStore((s) => s.snapshot.settlements);
  const { categoryId, expenseIds = [], settlementId, budgetId } = insight.subject;
  const settlement = settlementId ? settlements.find((s) => s.id === settlementId) : undefined;
  const rows: React.ReactNode[] = [];

  if (categoryId) {
    rows.push(
      <Row
        key="category"
        title={`${categoryLabel(categoryId)} in Spending`}
        subtitle="Your own share, this month and the months before"
        leading={<Icon name="spending" size={22} color={colors.labelSecondary} />}
        onPress={() => router.push({ pathname: '/(tabs)/(spending)/category/[categoryId]', params: { categoryId } })}
        chevron
        testID="subject-category"
      />,
    );
  }
  if (settlement) {
    const iPay = f.isMe(settlement.fromPersonId);
    const other = f.name(iPay ? settlement.toPersonId : settlement.fromPersonId);
    const groupName = settlement.groupId ? cleanName(groups.find((g) => g.group.id === settlement.groupId)?.group.name ?? 'the group') : null;
    rows.push(
      <Row
        key="settlement"
        title={iPay ? `Settle up with ${other}` : groupName ? `Open ${groupName}` : `Payment from ${other}`}
        subtitle={iPay ? 'Record the payment and clear it from your balance' : 'Confirm the payment once it arrives'}
        detail={<Readout money={settlement.amount} locale={f.locale} role="readoutS" inline />}
        leading={<Icon name="settle" size={22} color={colors.labelSecondary} />}
        sample={settlement.isSample === true}
        onPress={
          iPay
            ? () => router.push({ pathname: '/settle', params: { groupId: settlement.groupId ?? '', from: settlement.fromPersonId, to: settlement.toPersonId, currency: settlement.amount.currency } })
            : settlement.groupId
              ? () => openGroup(settlement.groupId as string)
              : undefined
        }
        chevron
        testID="subject-settlement"
      />,
    );
  }
  if (budgetId) {
    rows.push(
      <Row
        key="budget"
        title="Budgets"
        subtitle="Monthly limits and how fast you are spending them"
        leading={<Icon name="spending" size={22} color={colors.labelSecondary} />}
        onPress={() => router.push('/(tabs)/(spending)/budgets')}
        chevron
        testID="subject-budget"
      />,
    );
  }
  for (const id of expenseIds.slice(0, MAX_EXPENSES)) rows.push(<ExpenseLink key={id} expenseId={id} f={f} />);

  if (rows.length === 0) return null;
  const more = expenseIds.length - MAX_EXPENSES;
  return (
    <ListSection header="About" footer={more > 0 ? `${more} more expense${more === 1 ? '' : 's'} counted. See them in Activity.` : undefined}>
      {rows}
    </ListSection>
  );
}
