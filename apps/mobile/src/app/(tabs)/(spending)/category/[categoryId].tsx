import { isCurrencyCode } from '@finbuddy/shared';
import { Stack, useLocalSearchParams } from 'expo-router';

import { useProfile } from '@/data';
import { categoryLabel } from '@/features/common/format';
import { CategoryScreen } from '@/features/spending/CategoryScreen';

export default function CategoryRoute() {
  const { categoryId = 'other', currency } = useLocalSearchParams<{ categoryId: string; currency?: string }>();
  const profile = useProfile();
  // Spending is per currency: the row that opened this screen names it; a stale link falls back to yours.
  const code = typeof currency === 'string' && isCurrencyCode(currency) ? currency : (profile?.defaultCurrency ?? 'USD');
  return (
    <>
      <Stack.Screen options={{ title: categoryLabel(categoryId) }} />
      <CategoryScreen categoryId={categoryId} currency={code} />
    </>
  );
}
