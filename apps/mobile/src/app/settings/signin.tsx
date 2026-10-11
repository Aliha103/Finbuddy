// The sign-in placeholder, reached from Settings (so Back returns to Settings). The route map's
// onboarding/signin renders the same screen.
import { SignInPlaceholder } from '@/features/onboarding/SignInPlaceholder';

export default function SettingsSignInRoute() {
  return <SignInPlaceholder />;
}
