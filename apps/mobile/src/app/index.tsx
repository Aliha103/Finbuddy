import { formatMoney } from '@finbuddy/shared';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

// Placeholder screen: proves the Expo Router + @finbuddy/shared wiring.
// The real UI replaces this once the design direction is chosen.
export default function Index() {
  return (
    <View>
      <Stack.Screen options={{ title: 'FinBuddy' }} />
      <Text>{formatMoney({ amountMinor: 123456, currency: 'EUR' })}</Text>
    </View>
  );
}
