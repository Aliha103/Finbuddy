// apps/mobile/src/app/add/_layout.tsx
// Add expense: a stack inside the iOS form sheet or the Android full-screen dialog (the root layout
// presents it). It holds the one add-expense session every screen in it shares, started from the
// params the sheet was opened with (?groupId= or ?expenseId= for editing). The sheet's own screen
// sets Cancel/Close and Save; the split editor, payers, currency and category push inside it.
import { Stack, useGlobalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { useStackOptions } from '@/features/common/navigation';
import { ExpenseSessionProvider, type SessionParams } from '@/features/expense/session';

const one = (value: string | string[] | undefined) => (typeof value === 'string' && value ? value : undefined);

export default function AddLayout() {
  const options = useStackOptions();
  const params = useGlobalSearchParams<{ groupId?: string; expenseId?: string }>();
  // The params the sheet opened with; pushing the split editor later changes the URL, not the session.
  const [initial] = useState<SessionParams>(() => ({ groupId: one(params.groupId), expenseId: one(params.expenseId) }));
  const ios = Platform.OS === 'ios';
  return (
    <ExpenseSessionProvider params={initial}>
      <Stack screenOptions={{ ...options, ...(ios ? { headerStyle: undefined, headerLargeStyle: undefined } : null) }}>
        <Stack.Screen name="index" options={{ title: initial.expenseId ? 'Edit expense' : 'Add expense' }} />
        <Stack.Screen name="split" options={{ title: 'Split' }} />
        <Stack.Screen name="payers" options={{ title: 'Paid by' }} />
        <Stack.Screen name="currency" options={{ title: 'Currency' }} />
        <Stack.Screen name="category" options={{ title: 'Category' }} />
      </Stack>
    </ExpenseSessionProvider>
  );
}
