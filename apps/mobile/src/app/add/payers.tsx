import { router } from 'expo-router';

import { RoutePlaceholder } from '@/features/common/Placeholders';

export default function PayersRoute() {
  return <RoutePlaceholder title="Paid by" message="One person, or several people with the amount each of them paid; the payments have to add up to the total." icon="payment" action={{ label: 'Back', onPress: () => router.back() }} testID="payers" />;
}
