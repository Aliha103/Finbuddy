import { useLocalSearchParams } from 'expo-router';

import { ExpenseDetailScreen } from '@/features/expense/ExpenseDetailScreen';

export default function ExpenseRoute() {
  const { expenseId = '' } = useLocalSearchParams<{ expenseId: string }>();
  return <ExpenseDetailScreen expenseId={expenseId} />;
}
