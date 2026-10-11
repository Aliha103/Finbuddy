// apps/mobile/src/app/settings/_layout.tsx
// Profile and settings: a modal stack on iOS (Done closes it), pushed screens on Android and the web.
import { Stack, router } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderBack, HeaderButton } from '@/features/common/HeaderButton';
import { useStackOptions } from '@/features/common/navigation';

export default function SettingsLayout() {
  const options = useStackOptions();
  const ios = Platform.OS === 'ios';
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Stack screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Settings',
          // Android keeps the native stack's own back when there is one; the web preview draws HeaderBack
          // (a full-size target), which a function returning nothing would otherwise leave out.
          headerLeft: ios
            ? undefined
            : ({ canGoBack, label }) =>
                canGoBack ? (Platform.OS === 'web' ? <HeaderBack canGoBack label={label} onPress={close} /> : undefined) : <HeaderButton label="Back" icon="back" onPress={close} testID="settings-back" />,
          headerRight: ios ? () => <HeaderButton label="Done" emphasis onPress={close} testID="settings-done" /> : undefined,
        }}
      />
      <Stack.Screen name="currency" options={{ title: 'Default currency' }} />
      <Stack.Screen name="appearance" options={{ title: 'Appearance' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="data" options={{ title: 'Your data' }} />
      <Stack.Screen name="signin" options={{ title: 'Sign in' }} />
    </Stack>
  );
}
