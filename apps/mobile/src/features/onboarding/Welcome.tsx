// apps/mobile/src/features/onboarding/Welcome.tsx
// The welcome: the lockup on a white card set in the middle of the ground, one sentence, and two
// honest ways in. Quiet by decision (DECISIONS.md): no full-bleed colour field; the tint shows only
// on the mark and the one filled button. "Look around with sample data" is the only place sample
// data is ever seeded.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { keepSampleData, useDataStatus } from '@/data';
import { Button, Lockup, RADIUS, SPACE, Text, useTheme } from '@/design';

import { Fill } from '../common/Screen';

export function Welcome() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { status } = useDataStatus();
  const [seeding, setSeeding] = useState(false);

  const lookAround = () => {
    setSeeding(true);
    void keepSampleData()
      .then(() => router.replace('/(tabs)/(home)'))
      .catch(() => setSeeding(false));
  };

  return (
    <Fill style={[styles.fill, { paddingTop: insets.top + SPACE.xxl, paddingBottom: insets.bottom + SPACE.xl }]}>
      {/* The card sits in the middle of the ground above the actions, like a card held up to a gate. */}
      <View style={styles.stage}>
        <View style={[styles.card, { backgroundColor: colors.surface }]} accessibilityRole="header" testID="welcome-card">
          <Lockup height={44} color={colors.label} tile={colors.tint} bars={colors.onTint} />
          <Text role="title">Shared costs and your own spending, one exact ledger</Text>
          <Text role="subhead" color="labelSecondary">
            Every amount keeps its currency. Nothing leaves this phone.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Start with your own money" fullWidth onPress={() => router.push('/onboarding/profile')} testID="start-fresh" />
        <Button label="Look around with sample data" variant="tonal" fullWidth loading={seeding} disabled={status !== 'ready'} onPress={lookAround} testID="look-around" />
        <Text role="footnote" color="labelSecondary" align="center" style={styles.footnote}>
          Sample data is invented and always labelled. You can replace it with your own at any time.
        </Text>
      </View>
    </Fill>
  );
}

const styles = StyleSheet.create({
  fill: { paddingHorizontal: SPACE.gutter, gap: SPACE.xl },
  stage: { flex: 1, justifyContent: 'center' },
  card: { borderRadius: RADIUS.card, padding: SPACE.xl, gap: SPACE.l, aspectRatio: 1.586, justifyContent: 'space-between', maxHeight: 320 },
  actions: { gap: SPACE.m },
  footnote: { paddingHorizontal: SPACE.s },
});
