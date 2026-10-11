// apps/mobile/src/app/+not-found.tsx
// An unknown path. On the web preview that is almost always the sub-path the export is hosted from
// (/team/review/index.html), so the preview starts where "/" would; "?route=dev/gallery" still opens
// the design gallery. On a device it is a stale link, which gets a way home.
import { Redirect, router, useGlobalSearchParams } from 'expo-router';
import { Platform } from 'react-native';

import { GALLERY_ENABLED } from '@/features/dev/Gallery';
import { RoutePlaceholder } from '@/features/common/Placeholders';
import { StartGate } from '@/features/common/StartGate';

export default function NotFound() {
  const params = useGlobalSearchParams<{ 'not-found'?: string | string[]; route?: string }>();
  const asked = typeof params.route === 'string' ? params.route.replace(/^\/+|\/+$/g, '') : null;
  if (GALLERY_ENABLED && asked === 'dev/gallery') return <Redirect href="/dev/gallery" />;
  if (Platform.OS === 'web') return <StartGate />;
  return (
    <RoutePlaceholder
      title="That screen does not exist"
      message="The link points somewhere this version of FinBuddy does not know."
      action={{ label: 'Go to Home', onPress: () => router.replace('/') }}
      testID="not-found"
    />
  );
}
