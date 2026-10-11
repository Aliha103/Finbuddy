// apps/mobile/src/features/activity/ActivityScreen.tsx
// Activity: everything newest first, grouped by month under sticky month headers, with a filter
// row (All, Personal, each group). Expenses carry their total as a readout, settlements their
// sentence and status, sample records their chip. Local data, so no pull to refresh; the store's
// loading state shows bones in this layout instead of a spinner.
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { SectionList, StyleSheet, View, type SectionListData } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActivity, useGroups, type ActivityItem } from '@/data';
import { Chip, ChipRow, RADIUS, SPACE, Skeleton, SkeletonText, Text, useTheme } from '@/design';
import { DataGate } from '@/features/common/DataGate';
import { EmptyState } from '@/features/common/EmptyState';
import { useFloatingInset } from '@/features/common/Fab';
import { cleanName, useFormat } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { ActivityRow } from './ActivityRow';
import { filterActivity, groupByMonth, type ActivityFilter } from './grouping';

type Section = SectionListData<ActivityItem, { key: string; title: string }>;

export function ActivityScreen() {
  return (
    <DataGate skeleton={<ActivitySkeleton />}>
      <ActivityFeed />
    </DataGate>
  );
}

function ActivityFeed() {
  const theme = useTheme();
  const c = theme.colors;
  const ios = theme.platform === 'ios';
  const insets = useSafeAreaInsets();
  const floating = useFloatingInset(false);
  const f = useFormat();
  const activity = useActivity();
  const groups = useGroups();
  const [filterKey, setFilterKey] = useState<string>('all');

  const sections = useMemo<Section[]>(() => {
    const filter: ActivityFilter = filterKey === 'all' ? 'all' : filterKey === 'personal' ? 'personal' : { groupId: filterKey };
    return groupByMonth(filterActivity(activity, filter)).map((g) => ({ key: g.month, title: f.month(g.month), data: g.items }));
  }, [activity, filterKey, f]);
  const filterLabel = filterKey === 'all' ? 'everything' : filterKey === 'personal' ? 'Personal' : cleanName(groups.find((g) => g.group.id === filterKey)?.group.name ?? 'this group');

  if (activity.length === 0) {
    return (
      <Screen testID="activity">
        <EmptyState
          title="Everything you log appears here"
          message="Expenses and payments, newest first and grouped by month. Each one opens its detail."
          icon="activity"
          action={{ label: 'Add expense', icon: 'add', onPress: () => router.push('/add') }}
          testID="activity-empty"
        />
      </Screen>
    );
  }

  const chips = groups.length > 0 && (
    <View style={styles.filters}>
      <ChipRow role="tablist" label="Show">
        <Chip role="tab" label="All" selected={filterKey === 'all'} onPress={() => setFilterKey('all')} testID="activity-filter-all" />
        <Chip role="tab" label="Personal" selected={filterKey === 'personal'} onPress={() => setFilterKey('personal')} testID="activity-filter-personal" />
        {groups.map(({ group }) => (
          <Chip key={group.id} role="tab" label={cleanName(group.name)} selected={filterKey === group.id} onPress={() => setFilterKey(group.id)} testID={`activity-filter-${group.id}`} />
        ))}
      </ChipRow>
    </View>
  );

  return (
    <SectionList
      testID="activity"
      style={[styles.flex, { backgroundColor: c.ground }]}
      contentContainerStyle={{ paddingTop: SPACE.s, paddingBottom: insets.bottom + floating + SPACE.xxl }}
      contentInsetAdjustmentBehavior="automatic"
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => <MonthHeader title={section.title} />}
      renderItem={({ item, index, section }) => (
        <ItemFrame first={index === 0} last={index === section.data.length - 1}>
          <ActivityRow f={f} item={item} testID={`activity-${item.kind}-${item.id}`} />
        </ItemFrame>
      )}
      ItemSeparatorComponent={Separator}
      SectionSeparatorComponent={({ trailingItem }) => (trailingItem === undefined ? <View style={styles.sectionGap} /> : null)}
      ListHeaderComponent={chips || null}
      ListEmptyComponent={
        <View style={styles.gutter}>
          <EmptyState title={`Nothing for ${filterLabel} yet`} message="Expenses and payments that involve it will appear here as you log them." testID="activity-filter-empty" />
        </View>
      }
      initialNumToRender={14}
      windowSize={7}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel={ios ? undefined : 'Activity'}
    />
  );
}

/** The sticky month header: on the ground so rows scroll under it; uppercase footnote on iOS, subhead on Material. */
function MonthHeader({ title }: { title: string }) {
  const theme = useTheme();
  const ios = theme.platform === 'ios';
  return (
    <View style={[styles.header, { backgroundColor: theme.colors.ground, paddingHorizontal: ios ? SPACE.gutter + SPACE.l : SPACE.l }]}>
      <Text role={ios ? 'footnote' : 'subhead'} color="labelSecondary" accessibilityRole="header" style={ios ? styles.upper : null}>
        {ios ? title.toUpperCase() : title}
      </Text>
    </View>
  );
}

/** Rows sit on the surface: an inset rounded group on iOS, full-width on Material. */
function ItemFrame({ first, last, children }: { first: boolean; last: boolean; children: ReactNode }) {
  const theme = useTheme();
  const ios = theme.platform === 'ios';
  return (
    <View
      style={[
        { backgroundColor: theme.colors.surface },
        ios ? styles.inset : null,
        ios && first ? styles.roundTop : null,
        ios && last ? styles.roundBottom : null,
      ]}
    >
      {children}
    </View>
  );
}

function Separator() {
  const theme = useTheme();
  const ios = theme.platform === 'ios';
  return (
    <View style={[{ backgroundColor: theme.colors.surface }, ios ? styles.inset : null]}>
      <View style={[styles.hairline, { backgroundColor: theme.colors.separator }]} />
    </View>
  );
}

/** Bones in the feed's own layout: a filter row, a month header and six rows. */
export function ActivitySkeleton() {
  const { colors, platform } = useTheme();
  const ios = platform === 'ios';
  return (
    <Screen testID="activity-skeleton" accessibilityLabel="Loading activity" flush={!ios}>
      <View style={[styles.bones, !ios ? styles.gutter : null]}>
        <View style={styles.boneChips}>
          <Skeleton width={56} height={36} radius={18} />
          <Skeleton width={88} height={36} radius={18} />
          <Skeleton width={104} height={36} radius={18} />
        </View>
        <SkeletonText role="footnote" width="34%" />
        <View style={[styles.boneGroup, { backgroundColor: colors.surface }]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.boneRow}>
              <Skeleton width={22} height={22} radius={11} />
              <View style={styles.boneText}>
                <SkeletonText role="body" width={i % 2 ? '58%' : '44%'} />
                <SkeletonText role="subhead" width="76%" />
              </View>
              <SkeletonText role="readoutS" width={64} />
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.gutter },
  filters: { paddingHorizontal: SPACE.gutter, paddingBottom: SPACE.l },
  header: { paddingTop: SPACE.m, paddingBottom: SPACE.s },
  upper: { letterSpacing: 0.4 },
  inset: { marginHorizontal: SPACE.gutter },
  roundTop: { borderTopLeftRadius: RADIUS.row, borderTopRightRadius: RADIUS.row },
  roundBottom: { borderBottomLeftRadius: RADIUS.row, borderBottomRightRadius: RADIUS.row },
  hairline: { height: StyleSheet.hairlineWidth, marginLeft: SPACE.l },
  sectionGap: { height: SPACE.l },
  bones: { gap: SPACE.m },
  boneChips: { flexDirection: 'row', gap: SPACE.s, marginBottom: SPACE.s },
  boneGroup: { borderRadius: RADIUS.row, overflow: 'hidden' },
  boneRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, minHeight: 64 },
  boneText: { flex: 1, gap: 4 },
});
