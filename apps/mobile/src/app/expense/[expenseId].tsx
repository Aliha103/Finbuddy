import { Stack, router, useLocalSearchParams } from 'expo-router';

import { useExpense } from '@/data';
import { RoutePlaceholder } from '@/features/common/Placeholders';

export default function ExpenseRoute() {
  const { expenseId = '' } = useLocalSearchParams<{ expenseId: string }>();
  const expense = useExpense(expenseId);
  return (
    <>
      <Stack.Screen options={{ title: expense?.description ?? 'Expense' }} />
      <RoutePlaceholder
        title={expense?.description ?? 'This expense no longer exists'}
        message={expense ? 'The total, the payers, every resolved share and the split in words, with Edit and Delete.' : 'It may have been deleted, or the data on this phone was reset.'}
        icon="receipt"
        action={{ label: 'Back', onPress: () => (router.canGoBack() ? router.back() : router.replace('/')) }}
        testID="expense-detail"
      />
    </>
  );
}
