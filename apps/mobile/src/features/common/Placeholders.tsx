// apps/mobile/src/features/common/Placeholders.tsx
// The screens the feature stages fill in, as titled empty states: each says what will live there
// and offers the one action that leads on, so navigation works end to end today. None of them
// quotes a figure: numbers arrive with the engine-backed screens, never typed in.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDataStore, useGroup, useGroups } from '@/data';
import { Card, Icon, ListSection, Row, SPACE, Text, type IconName } from '@/design';

import { SampleBanner, StorageBar } from './Banners';
import { DataGate } from './DataGate';
import { EmptyState } from './EmptyState';
import { Fab, FAB_SPACE } from './Fab';
import { Screen } from './Screen';
import { INSIGHTS_EMPTY, INSIGHTS_FOOTER } from '../insights/copy';

export interface RoutePlaceholderProps {
  title: string;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; icon?: IconName };
  footnote?: string;
  children?: ReactNode;
  testID?: string;
}

/** A plain titled empty state for a route that is not built yet. */
export function RoutePlaceholder({ title, message, icon, action, footnote, children, testID }: RoutePlaceholderProps) {
  return (
    <Screen testID={testID}>
      <EmptyState title={title} message={message} icon={icon} action={action} footnote={footnote}>
        {children}
      </EmptyState>
    </Screen>
  );
}

const hasEntries = () => {
  const s = useDataStore.getState().snapshot;
  return s.expenses.length > 0 || s.settlements.length > 0;
};

export function HomePlaceholder() {
  const empty = !hasEntries();
  return (
    <DataGate>
      <Screen bottomSpace={FAB_SPACE} testID="home">
        <StorageBar />
        <SampleBanner />
        <Card testID="home-card">
          <View style={styles.cardBody}>
            <Text role="title" accessibilityRole="header">
              {empty ? 'Nothing to settle' : 'Your ledger'}
            </Text>
            <Text role="body" color="labelSecondary">
              {empty
                ? 'Log the first thing you paid for and your balances, what needs settling and this month\'s spending start here.'
                : 'Your balances per currency, what needs settling, this month\'s spending and two insights land on this screen.'}
            </Text>
          </View>
        </Card>
        <ListSection>
          <Row title={empty ? 'Add your first expense' : 'Add expense'} leading={<Icon name="add" size={22} />} onPress={() => router.push('/add')} chevron testID="home-add-row" />
          <Row title="Insights" subtitle="Worked out on your phone from your own entries" leading={<Icon name="info" size={22} />} onPress={() => router.push('/(tabs)/(home)/insights')} chevron testID="home-insights" />
        </ListSection>
      </Screen>
      <Fab label="Add expense" onPress={() => router.push('/add')} testID="fab-add" />
    </DataGate>
  );
}

export function InsightsPlaceholder() {
  return (
    <RoutePlaceholder
      title="Insights"
      message="Spending spikes, unusual expenses, costs that look regular, payment reminders and budget pace, each with the numbers behind it."
      footnote={INSIGHTS_FOOTER}
      testID="insights"
    >
      <Text role="subhead" color="labelTertiary">
        {INSIGHTS_EMPTY}.
      </Text>
    </RoutePlaceholder>
  );
}

export function GroupsPlaceholder() {
  const groups = useGroups();
  return (
    <DataGate>
      <Screen bottomSpace={FAB_SPACE} testID="groups">
        {groups.length === 0 ? (
          <EmptyState
            title="Make a group for a trip, a flat or a dinner"
            message="Every group is its own card with its own line colour, your net per currency and a settle-up plan."
            action={{ label: 'New group', icon: 'add', onPress: () => router.push('/(tabs)/(groups)/new') }}
            testID="groups-empty"
          />
        ) : (
          <ListSection header="Your groups" footer="Each group becomes a card with its line colour on the leading edge, with your net per currency.">
            {groups.map(({ group }) => (
              <Row
                key={group.id}
                title={group.name.replace(/ \(sample\)$/, '')}
                subtitle={`${group.memberIds.length} people · ${group.currency}${group.archived ? ' · Archived' : ''}`}
                sample={!!group.isSample}
                onPress={() => router.push({ pathname: '/(tabs)/(groups)/[groupId]', params: { groupId: group.id } })}
                chevron
                testID={`group-${group.id}`}
              />
            ))}
          </ListSection>
        )}
      </Screen>
      <Fab label="New group" onPress={() => router.push('/(tabs)/(groups)/new')} testID="fab-new-group" />
    </DataGate>
  );
}

export function GroupDetailPlaceholder({ groupId }: { groupId: string }) {
  const detail = useGroup(groupId);
  if (!detail) {
    return <RoutePlaceholder title="This group no longer exists" message="It may have been removed when the data on this phone was reset." action={{ label: 'Back to Groups', onPress: () => router.replace('/(tabs)/(groups)') }} testID="group-missing" />;
  }
  const { group, members } = detail;
  return (
    <DataGate>
      <Screen bottomSpace={FAB_SPACE} testID="group-detail">
        <EmptyState
          title={group.name.replace(/ \(sample\)$/, '')}
          message={`${group.currency} · ${members.map((m) => m.displayName.replace(/ \(sample\)$/, '')).join(', ')}. Balances per member and currency, the settle-up plan and the expenses by month arrive on this screen.`}
          action={{ label: 'Add expense', icon: 'add', onPress: () => router.push({ pathname: '/add', params: { groupId: group.id } }) }}
        />
        <ListSection header="Group">
          <Row title="Group settings" subtitle="Name, currency, members, colour, archive" onPress={() => router.push({ pathname: '/(tabs)/(groups)/[groupId]/settings', params: { groupId: group.id } })} chevron testID="group-settings-row" />
        </ListSection>
      </Screen>
      <Fab label="Add expense" onPress={() => router.push({ pathname: '/add', params: { groupId: group.id } })} />
    </DataGate>
  );
}

export function SpendingPlaceholder() {
  const empty = !hasEntries();
  return (
    <DataGate>
      <Screen testID="spending">
        <EmptyState
          title={empty ? 'Nothing logged yet this month' : 'Your own share, per currency'}
          message="This month against last, six months of bars, spending by category and budgets, each currency on its own; currencies are never summed."
          action={empty ? { label: 'Add expense', icon: 'add', onPress: () => router.push('/add') } : undefined}
        />
        <ListSection header="Also here">
          <Row title="Budgets" subtitle="Monthly limits per category, with pace" onPress={() => router.push('/(tabs)/(spending)/budgets')} chevron testID="spending-budgets" />
          <Row title="Insights" onPress={() => router.push('/(tabs)/(home)/insights')} chevron />
        </ListSection>
      </Screen>
    </DataGate>
  );
}

export function ActivityPlaceholder() {
  const empty = !hasEntries();
  return (
    <DataGate>
      <Screen testID="activity">
        <EmptyState
          title={empty ? 'Everything you log appears here' : 'Activity'}
          message="Expenses and payments by day, filtered by group, each opening its detail."
          action={empty ? { label: 'Add expense', icon: 'add', onPress: () => router.push('/add') } : undefined}
        />
      </Screen>
    </DataGate>
  );
}

const styles = StyleSheet.create({
  cardBody: { gap: SPACE.s },
});
