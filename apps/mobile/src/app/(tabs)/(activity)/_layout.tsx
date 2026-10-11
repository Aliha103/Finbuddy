// apps/mobile/src/app/(tabs)/(activity)/_layout.tsx
import { Stack } from 'expo-router';

import { largeTitle, useStackOptions } from '@/features/common/navigation';

export default function ActivityStack() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={largeTitle('Activity')} />
    </Stack>
  );
}
