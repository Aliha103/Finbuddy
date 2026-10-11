// apps/mobile/src/features/settings/PrivacySettings.tsx
// "Your data stays on this phone", with the facts, and the explanation of the storage-refused bar.
import { StyleSheet, View } from 'react-native';

import { useDataStatus } from '@/data';
import { Icon, ListSection, Row, SPACE, Text, useTheme } from '@/design';

import { StorageBar } from '../common/Banners';
import { Screen } from '../common/Screen';

export function PrivacySettings() {
  const theme = useTheme();
  const { persistent } = useDataStatus();
  return (
    <Screen flush={theme.platform !== 'ios'} testID="privacy">
      <View style={styles.gutter}>
        <View style={styles.hero}>
          <Icon name="lock" size={28} color={theme.colors.tint} />
          <Text role="title" accessibilityRole="header">
            Your data stays on this phone
          </Text>
        </View>
        <StorageBar explain={false} />
      </View>
      <ListSection header="The facts">
        <Row title="No account" subtitle="There is nothing to sign in to. Accounts and sync arrive with the online service." />
        <Row title="No server" subtitle="Expenses, groups, balances and insights are stored and worked out on this device." />
        <Row title="No analytics" subtitle="FinBuddy does not measure how you use it and sends nothing anywhere." />
        <Row title="Insights are rules, not a model" subtitle="They compare your own entries with your own history. Nothing is sent for processing." />
      </ListSection>
      <ListSection header="Keeping your data" footer="Export makes a JSON file you can keep or move to another phone. Deleting removes everything from this device.">
        <Row title="Export your data" subtitle="Settings › Your data" />
        <Row title="Delete all data" subtitle="Settings › Your data" />
      </ListSection>
      <ListSection header={persistent ? 'If storage is refused' : 'Storage is refused right now'}>
        <Row
          title={persistent ? 'Changes stay only until the app closes' : 'Changes won\'t be saved on this device'}
          subtitle="Some private browsing modes, a full disk or a restricted profile can stop the app from writing to storage. FinBuddy keeps working from memory and tells you so with the amber bar on Home and here, instead of failing quietly."
        />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter, gap: SPACE.m },
  hero: { gap: SPACE.s },
});
