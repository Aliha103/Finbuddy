// apps/mobile/src/features/onboarding/SignInPlaceholder.tsx
// There is no backend, so there is nothing to sign in to. This screen says so plainly; it has no
// fields, because a form that cannot authenticate anyone would be a fake login.
import { StyleSheet, View } from 'react-native';

import { ListSection, Mark, Row, SPACE, Text } from '@/design';

import { Screen } from '../common/Screen';

export function SignInPlaceholder() {
  return (
    <Screen testID="signin">
      <View style={styles.hero}>
        <Mark size={56} />
        <Text role="title" accessibilityRole="header">
          Your data stays on this phone
        </Text>
        <Text role="body" color="labelSecondary">
          Accounts and sync arrive with the online service. Until then there is nothing to sign in to, so FinBuddy asks for no email, password or phone number.
        </Text>
      </View>
      <ListSection header="What that means today">
        <Row title="Everything is stored on this device" subtitle="Expenses, groups and settings live in the app's own storage." />
        <Row title="Nothing is sent anywhere" subtitle="No server, no account, no analytics." />
        <Row title="Keep a copy" subtitle="Export your data from Settings whenever you like." />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: SPACE.m },
});
