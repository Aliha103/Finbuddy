import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dismissNotice, resetSampleData, startDataStore, useDataStatus } from '@/data';

import { AddExpenseSheet } from './add-expense/AddExpenseSheet';
import { NavigationProvider, useNavigation, type Route, type TabId } from './navigation';
import { ActivityScreen } from './screens/ActivityScreen';
import { ExpenseDetailScreen } from './screens/ExpenseDetailScreen';
import { GroupDetailScreen } from './screens/GroupDetailScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InsightDetailScreen, InsightsScreen } from './screens/InsightsScreen';
import { SpendingScreen } from './screens/SpendingScreen';
import { TabBar } from './TabBar';
import { space, usePalette } from './theme';
import { Button, Note, PreviewBanner, Section, T, styles } from './ui';

/**
 * ENGINE PREVIEW ROOT. Mounted by the single Expo Router route (and by +not-found, so the
 * exported web build works from any sub-path or iframe). Everything inside navigates with
 * React state: a bottom tab bar, a stack of detail screens per tab, and one modal sheet.
 * The real designed app replaces this whole folder; the data layer in src/data stays.
 */
export function PreviewApp() {
  useEffect(() => {
    void startDataStore();
  }, []);
  return (
    <NavigationProvider>
      <Shell />
    </NavigationProvider>
  );
}

function Shell() {
  const c = usePalette();
  const { status, error, notice } = useDataStatus();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.flex, { backgroundColor: c.background }]}>
      <StatusBar style="auto" />
      <PreviewBanner />
      {notice ? <NoticeBar text={notice} /> : null}
      <View style={styles.flex}>{status === 'loading' ? <Loading /> : status === 'error' ? <Failed error={error} /> : <Current />}</View>
      <TabBar />
      <AddExpenseSheet />
    </SafeAreaView>
  );
}

/** The top of the current tab's stack, or the tab's root screen. */
function Current() {
  const nav = useNavigation();
  if (nav.route) return <DetailScreen key={`${nav.tab}:${nav.depth}`} route={nav.route} />;
  return <TabRoot tab={nav.tab} />;
}

function DetailScreen({ route }: { route: Route }) {
  switch (route.name) {
    case 'group':
      return <GroupDetailScreen groupId={route.groupId} />;
    case 'expense':
      return <ExpenseDetailScreen expenseId={route.expenseId} />;
    case 'insight':
      return <InsightDetailScreen insightId={route.insightId} />;
  }
}

function TabRoot({ tab }: { tab: TabId }) {
  switch (tab) {
    case 'home':
      return <HomeScreen />;
    case 'groups':
      return <GroupsScreen />;
    case 'spending':
      return <SpendingScreen />;
    case 'insights':
      return <InsightsScreen />;
    case 'activity':
      return <ActivityScreen />;
  }
}

function Loading() {
  const c = usePalette();
  return (
    <View style={[styles.flex, local.center]} accessibilityLiveRegion="polite">
      <ActivityIndicator color={c.secondaryLabel} accessibilityLabel="Loading" />
      <T tone="secondary">Loading sample data…</T>
    </View>
  );
}

function Failed({ error }: { error: string | null }) {
  return (
    <Section title="Something went wrong" footer={error ?? undefined}>
      <Note tone="primary" live>
        The saved data could not be loaded. Resetting replaces it with fresh sample data.
      </Note>
      <View style={styles.row}>
        <Button label="Reset sample data" variant="filled" onPress={() => void resetSampleData()} style={local.start} />
      </View>
    </Section>
  );
}

/** Something the person should know once, e.g. unreadable saved data was replaced. */
function NoticeBar({ text }: { text: string }) {
  const c = usePalette();
  return (
    <View style={[local.notice, { backgroundColor: c.surface, borderBottomColor: c.separator }]}>
      <T variant="subhead" style={styles.shrink} accessibilityLiveRegion="polite">
        {text}
      </T>
      <Button label="Dismiss" variant="plain" onPress={dismissNotice} accessibilityLabel="Dismiss this notice" />
    </View>
  );
}

const local = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', gap: space.m, padding: space.xl },
  start: { alignSelf: 'flex-start' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.s, paddingLeft: space.l, paddingRight: space.xs, paddingVertical: space.xs, borderBottomWidth: StyleSheet.hairlineWidth },
});
