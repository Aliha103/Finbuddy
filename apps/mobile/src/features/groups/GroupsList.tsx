// apps/mobile/src/features/groups/GroupsList.tsx
// The Groups tab: a stack of fare cards, one per group, archived ones last. New group is the
// toolbar button on iOS (wired in the stack layout) and the FAB on Android and the web.
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { usePeople, useGroups } from '@/data';
import { Card, SPACE, Text, lineColorFor } from '@/design';

import { DataGate } from '../common/DataGate';
import { EmptyState } from '../common/EmptyState';
import { Fab, FAB_SPACE } from '../common/Fab';
import { Screen } from '../common/Screen';
import { useGroupFormat } from './format';
import { GroupCard } from './GroupCard';
import { useLineColorOverrides } from './lineColors';

export function GroupsList() {
  const groups = useGroups();
  const people = usePeople();
  const f = useGroupFormat();
  const overrides = useLineColorOverrides();
  const openNew = () => router.push('/(tabs)/(groups)/new');
  const archived = groups.filter((g) => g.group.archived).length;
  return (
    <DataGate>
      <Screen bottomSpace={FAB_SPACE} testID="groups">
        {groups.length === 0 ? (
          <Card tone="outlined" testID="groups-empty">
            <EmptyState
              title="Make a group for a trip, a flat or a dinner"
              message="Every group is its own card in its own colour, with your net per currency and the fewest payments that settle everyone."
              icon="groups"
              action={{ label: 'New group', icon: 'add', onPress: openNew }}
            />
          </Card>
        ) : (
          <View style={styles.stack} accessibilityRole="list">
            {groups.map((summary) => (
              <GroupCard
                key={summary.group.id}
                summary={summary}
                line={lineColorFor(summary.group.id, overrides)}
                memberNames={summary.group.memberIds.map((id) => people.get(id)?.displayName ?? '?')}
                f={f}
                onPress={() => router.push({ pathname: '/(tabs)/(groups)/[groupId]', params: { groupId: summary.group.id } })}
                testID={`group-${summary.group.id}`}
              />
            ))}
            {archived ? (
              <Text role="footnote" color="labelTertiary">
                {`${archived} archived ${archived === 1 ? 'group keeps' : 'groups keep'} their history and sort last.`}
              </Text>
            ) : null}
          </View>
        )}
      </Screen>
      <Fab label="New group" onPress={openNew} testID="fab-new-group" />
    </DataGate>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACE.m },
});
