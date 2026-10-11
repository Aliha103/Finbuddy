import { router } from 'expo-router';

import { RoutePlaceholder } from '@/features/common/Placeholders';

export default function AddCurrencyRoute() {
  return (
    <RoutePlaceholder
      title="Currency"
      message="Search by code or name. The group's, yours and recently used come first; each shows its minor units, so JPY and KWD are not surprises."
      icon="search"
      action={{ label: 'Back', onPress: () => router.back() }}
      testID="add-currency-screen"
    />
  );
}
