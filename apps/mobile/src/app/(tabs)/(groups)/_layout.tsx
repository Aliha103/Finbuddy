// apps/mobile/src/app/(tabs)/(groups)/_layout.tsx
// Groups' stack: large title, New group in the toolbar on iOS (the FAB carries it on Android).
import { Stack, router } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderButton } from '@/features/common/HeaderButton';
import { largeTitle, useStackOptions } from '@/features/common/navigation';

export default function GroupsStack() {
  const options = useStackOptions();
  const ios = Platform.OS === 'ios';
  return (
    <Stack screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{ ...largeTitle('Groups'), headerRight: ios ? () => <HeaderButton label="New group" icon="add" onPress={() => router.push('/(tabs)/(groups)/new')} testID="header-new-group" /> : undefined }}
      />
      <Stack.Screen name="new" options={{ title: 'New group' }} />
      <Stack.Screen name="[groupId]/index" options={{ title: '' }} />
      <Stack.Screen name="[groupId]/settings" options={{ title: 'Group settings' }} />
    </Stack>
  );
}
