// apps/mobile/src/app/index.tsx
// Where the app starts: onboarding while this device has no profile, the tabs otherwise.
import { StartGate } from '@/features/common/StartGate';

export default function Index() {
  return <StartGate />;
}
