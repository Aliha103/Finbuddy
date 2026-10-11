// apps/mobile/src/app/onboarding/_layout.tsx
// Welcome (no chrome), profile setup and the sign-in placeholder, which Settings also opens.
import { Stack } from 'expo-router';

import { useStackOptions } from '@/features/common/navigation';

export default function OnboardingLayout() {
  const options = useStackOptions();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Your profile' }} />
      {/* Settings opens its own copy (settings/signin) so Back returns there; this one keeps the route map's place. */}
      <Stack.Screen name="signin" options={{ title: 'Sign in' }} />
    </Stack>
  );
}
