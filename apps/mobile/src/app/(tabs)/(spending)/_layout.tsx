// apps/mobile/src/app/(tabs)/(spending)/_layout.tsx
import { Stack } from 'expo-router';

import { largeTitle, useStackOptions } from '@/features/common/navigation';

export default function SpendingStack() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={largeTitle('Spending')} />
      <Stack.Screen name="category/[categoryId]" options={{ title: 'Category' }} />
      <Stack.Screen name="budgets" options={{ title: 'Budgets' }} />
    </Stack>
  );
}
