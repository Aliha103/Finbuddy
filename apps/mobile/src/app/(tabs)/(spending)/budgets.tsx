import { isCurrencyCode } from '@finbuddy/shared';
import { useLocalSearchParams } from 'expo-router';

import { BudgetsScreen } from '@/features/spending/BudgetsScreen';

export default function BudgetsRoute() {
  const { currency } = useLocalSearchParams<{ currency?: string }>();
  return <BudgetsScreen initialCurrency={typeof currency === 'string' && isCurrencyCode(currency) ? currency : undefined} />;
}
