// apps/mobile/src/features/home/HomeScreen.tsx
// Home, the first viewport (DIRECTION.md section 1 and 4): the FinBuddy card with one readout per
// currency, Needs settling, Pending payments, This month, two insight rows, five activity rows and
// See all. Add expense is the primary action, carried by the platform (the iOS accessory or "+", the
// Material FAB). Every figure comes from the engine through the data hooks; nothing is typed in.
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useActivity, useDeviceLocale, useGroups, useInsights, useOverview, useProfile } from '@/data';
import { Icon, ListSection, Row, SPACE, useTheme } from '@/design';
import { ActivityRow } from '@/features/activity/ActivityRow';
import { SampleBanner, StorageBar } from '@/features/common/Banners';
import { DataGate } from '@/features/common/DataGate';
import { Fab, FAB_SPACE } from '@/features/common/Fab';
import { Screen } from '@/features/common/Screen';
import { INSIGHTS_EMPTY } from '@/features/insights/copy';
import { useDismissedInsights } from '@/features/insights/dismissed';
import { InsightRow } from '@/features/insights/InsightRow';
import { openInsight } from '@/features/insights/InsightsScreen';

import { FinBuddyCard } from './FinBuddyCard';
import { useFormatter } from './formatter';
import { HomeSkeleton } from './HomeSkeleton';
import { NeedsSettling } from './NeedsSettling';
import { PendingPayments } from './PendingPayments';
import { SectionEmpty } from './SectionEmpty';
import { ThisMonth } from './ThisMonth';

const INSIGHT_ROWS = 2;
const ACTIVITY_ROWS = 5;

export function HomeScreen() {
  return (
    <DataGate skeleton={<HomeSkeleton />}>
      <HomeBody />
      <Fab label="Add expense" onPress={() => router.push('/add')} testID="fab-add" />
    </DataGate>
  );
}

function HomeBody() {
  const { colors } = useTheme();
  const f = useFormatter();
  const locale = useDeviceLocale();
  const profile = useProfile();
  const overview = useOverview();
  const groups = useGroups();
  const activity = useActivity();
  const insights = useInsights();
  const { dismissed, loaded } = useDismissedInsights();
  const hasEntries = activity.length > 0;
  const shownInsights = loaded ? insights.filter((i) => !dismissed.has(i.id)).slice(0, INSIGHT_ROWS) : [];
  const recent = activity.slice(0, ACTIVITY_ROWS);

  return (
    <Screen flush bottomSpace={FAB_SPACE} testID="home">
      <View style={styles.gutter}>
        <StorageBar />
        <SampleBanner />
        <FinBuddyCard nets={overview?.net ?? []} hasEntries={hasEntries} sample={profile?.isSample === true} locale={locale} />
      </View>

      {!hasEntries && groups.length === 0 ? (
        <ListSection footer="Log the first thing you paid for; your balances, what needs settling and this month's spending start from it.">
          <Row title="Add your first expense" subtitle="The keypad is already up" leading={<Icon name="add" size={22} color={colors.tint} />} onPress={() => router.push('/add')} chevron testID="home-add-row" />
          <Row title="Make a group" subtitle="For a trip, a flat or a dinner" leading={<Icon name="groups" size={22} color={colors.labelSecondary} />} onPress={() => router.push('/(tabs)/(groups)/new')} chevron testID="home-new-group-row" />
        </ListSection>
      ) : (
        <NeedsSettling f={f} />
      )}

      <PendingPayments f={f} />

      <ThisMonth f={f} />

      {insights.length === 0 || (loaded && shownInsights.length === 0) ? (
        <View style={styles.gutter}>
          <SectionEmpty title={INSIGHTS_EMPTY} message={insights.length ? 'Everything found today is dismissed. See all insights to restore one.' : 'Insights are worked out on your phone from your own entries.'} testID="insights-empty-home" />
          {insights.length ? <Row title="See all insights" onPress={() => router.push('/(tabs)/(home)/insights')} chevron testID="home-insights" style={styles.bare} /> : null}
        </View>
      ) : (
        <ListSection header="Insights" footer="Worked out on your phone from your own entries.">
          {shownInsights.map((insight) => (
            <InsightRow key={insight.id} insight={insight} f={f} onPress={() => openInsight(insight.id)} testID={`home-insight-${insight.id}`} />
          ))}
          <Row title="See all insights" subtitle={`${insights.length - dismissed.size > INSIGHT_ROWS ? `${insights.length - dismissed.size} today` : 'With the numbers behind each one'}`} onPress={() => router.push('/(tabs)/(home)/insights')} chevron testID="home-insights" />
        </ListSection>
      )}

      {recent.length > 0 ? (
        <ListSection header="Activity">
          {recent.map((item) => (
            <ActivityRow key={item.id} f={f} item={item} testID={`home-activity-${item.id}`} />
          ))}
          <Row title="See all" subtitle="Everything, newest first, by month" onPress={() => router.navigate('/(tabs)/(activity)')} chevron testID="home-see-all-activity" />
        </ListSection>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter, gap: SPACE.l },
  bare: { marginTop: SPACE.s },
});
