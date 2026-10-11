// apps/mobile/src/app/(tabs)/(home)/_layout.tsx
// Home's stack: the large title with the avatar at the leading edge (iOS) or in the top app bar
// (Android), the "+" on iOS versions without the bottom accessory, and Insights one level down.
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack, router } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderAvatar } from '@/features/common/HeaderAvatar';
import { HeaderButton } from '@/features/common/HeaderButton';
import { largeTitle, useStackOptions } from '@/features/common/navigation';

export default function HomeStack() {
  const options = useStackOptions();
  const ios = Platform.OS === 'ios';
  const accessory = ios && isLiquidGlassAvailable();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{
          ...largeTitle('Home'),
          headerLeft: ios ? () => <HeaderAvatar /> : undefined,
          headerRight: ios ? (accessory ? undefined : () => <HeaderButton label="Add expense" icon="add" onPress={() => router.push('/add')} testID="header-add" />) : () => <HeaderAvatar />,
        }}
      />
      <Stack.Screen name="insights/index" options={{ title: 'Insights' }} />
      <Stack.Screen name="insights/[insightId]" options={{ title: 'Why am I seeing this' }} />
    </Stack>
  );
}
