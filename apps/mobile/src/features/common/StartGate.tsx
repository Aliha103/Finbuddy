// apps/mobile/src/features/common/StartGate.tsx
// Where the app starts: while the store loads, bones; if saved data could not be read, the error
// state; with no profile on this device, onboarding; otherwise the tabs. The index route and the
// web preview's unknown-hosting-path case both render this.
import { Redirect } from 'expo-router';

import { useDataStatus, useProfile } from '@/data';

import { DataError, ListSkeleton } from './DataGate';

export function StartGate() {
  const { status } = useDataStatus();
  const profile = useProfile();
  if (status === 'loading') return <ListSkeleton />;
  if (status === 'error') return <DataError />;
  return <Redirect href={profile ? '/(tabs)/(home)' : '/onboarding'} />;
}
