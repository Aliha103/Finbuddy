// apps/mobile/src/features/common/DataGate.tsx
// The state rules every screen shares (DIRECTION.md section 4): while the store loads, skeleton
// bones in the screen's own layout; when saved data could not be read, one explanation and the
// ways out; otherwise the content, crossfading in over the bones. Every screen gates itself, so its
// own skeleton shows; a navigator only takes over for the error (DataErrorGate).
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { resetSampleData, useDataStatus } from '@/data';
import { Button, Reveal, SPACE, Skeleton, SkeletonText, Text, useTheme } from '@/design';

import { Screen } from './Screen';

export function DataGate({ children, skeleton }: { children: ReactNode; skeleton?: ReactNode }) {
  const { status } = useDataStatus();
  if (status === 'loading') return <>{skeleton ?? <ListSkeleton />}</>;
  if (status === 'error') return <DataError />;
  return <Reveal style={styles.flex}>{children}</Reveal>;
}

/**
 * For a navigator (the tabs): when saved data could not be read, the error replaces everything
 * below it. While the store loads it renders its children, so each screen shows its own skeleton.
 */
export function DataErrorGate({ children }: { children: ReactNode }) {
  const { status } = useDataStatus();
  if (status === 'error') return <DataError />;
  return <>{children}</>;
}

/** Bones in the shape of a list screen: a card and a few rows. */
export function ListSkeleton() {
  return (
    <Screen testID="skeleton" accessibilityLabel="Loading">
      <Skeleton height={168} radius={12} />
      <View style={styles.rows}>
        <SkeletonText role="headline" width="40%" />
        <SkeletonText width="85%" />
        <SkeletonText width="70%" />
        <SkeletonText width="60%" />
      </View>
    </Screen>
  );
}

/** "Saved data could not be read" and the two honest ways forward. */
export function DataError() {
  const { colors } = useTheme();
  const { error } = useDataStatus();
  const [busy, setBusy] = useState(false);
  const reset = () => {
    setBusy(true);
    void resetSampleData()
      .catch(() => {})
      .finally(() => setBusy(false));
  };
  return (
    <Screen testID="data-error">
      <View style={[styles.errorCard, { backgroundColor: colors.surface }]}>
        <Text role="title" accessibilityRole="header">
          Saved data could not be read
        </Text>
        <Text role="body" color="labelSecondary">
          What this phone saved is still there, but FinBuddy cannot make sense of it. You can look around with sample data instead, or start again with your own money. Either choice replaces the saved
          data.
        </Text>
        <View style={styles.actions}>
          <Button label="Reset sample data" onPress={reset} loading={busy} />
          <Button label="Start fresh" variant="tonal" onPress={() => router.replace('/onboarding/profile')} />
        </View>
        {error ? (
          <Text role="footnote" color="labelTertiary" selectable>
            {error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rows: { gap: SPACE.m },
  errorCard: { borderRadius: 12, padding: SPACE.l, gap: SPACE.m },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
});
