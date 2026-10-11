// apps/mobile/src/features/insights/InsightDetailScreen.tsx
// "Why am I seeing this": the insight in full, then its basis rows expanding with a layout
// transition and amounts rolling from zero (static under Reduce Motion), the subject links, and
// Dismiss (remembered app-locally by the stable insight id).
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useInsights } from '@/data';
import { Button, Card, Icon, RADIUS, SPACE, Text, useHaptic, useTheme } from '@/design';
import { DataGate } from '@/features/common/DataGate';
import { EmptyState } from '@/features/common/EmptyState';
import { useFormat } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { BasisRows, useBasisMotion } from './Basis';
import { INSIGHTS_FOOTER, insightCopy } from './copy';
import { dismissInsight, restoreInsight, useDismissedInsights } from './dismissed';
import { severityStyle } from './severity';
import { SubjectLinks } from './SubjectLinks';

const OPEN_AFTER_PUSH = 350;

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/(home)/insights');
}

export function InsightDetailScreen({ insightId }: { insightId: string }) {
  return (
    <DataGate>
      <InsightDetail insightId={insightId} />
    </DataGate>
  );
}

function InsightDetail({ insightId }: { insightId: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const ios = theme.platform === 'ios';
  const f = useFormat();
  const haptic = useHaptic();
  const insight = useInsights().find((i) => i.id === insightId);
  const { dismissed } = useDismissedInsights();
  const { layout } = useBasisMotion();
  // The basis opens itself once the push has settled, so the rows expand and the readouts roll as
  // you arrive. Under Reduce Motion it is simply open.
  const [opened, setOpened] = useState<boolean | null>(null);
  const open = opened ?? theme.reduceMotion;
  useEffect(() => {
    if (theme.reduceMotion) return;
    const t = setTimeout(() => setOpened((o) => o ?? true), OPEN_AFTER_PUSH);
    return () => clearTimeout(t);
  }, [theme.reduceMotion]);

  if (!insight) {
    return (
      <Screen testID="insight-missing">
        <EmptyState
          title="This insight no longer applies"
          message="The entries it was worked out from have changed or been removed, so there is nothing left to explain."
          icon="info"
          action={{ label: 'Back to Insights', onPress: goBack }}
        />
      </Screen>
    );
  }

  const copy = insightCopy(f, insight);
  const sev = severityStyle(insight.severity, c);
  const isDismissed = dismissed.has(insight.id);

  return (
    <Screen flush testID="insight-detail">
      <View style={styles.gutter}>
        <Card>
          <View style={styles.titleLine}>
            <Icon name={sev.icon} size={24} color={sev.color} accessibilityLabel={sev.label} style={styles.titleIcon} />
            <Text role="title" accessibilityRole="header" style={styles.title}>
              {copy.title}
            </Text>
          </View>
          <Text role="body" accessibilityLabel={copy.body.spoken}>
            {copy.body.text}
          </Text>
          {copy.context.map((line, i) => (
            <Text key={i} role="subhead" color="labelSecondary" accessibilityLabel={line.spoken}>
              {line.text}
            </Text>
          ))}
        </Card>
      </View>

      <View style={[styles.section, ios ? styles.gutter : null]}>
        <Text role={ios ? 'footnote' : 'subhead'} color="labelSecondary" accessibilityRole="header" style={[styles.header, ios ? styles.upper : null]}>
          {ios ? 'WHAT IT IS BASED ON' : 'What it is based on'}
        </Text>
        <Animated.View layout={layout} style={[styles.group, { backgroundColor: c.surface }, ios ? styles.groupInset : null]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityHint={open ? 'Hides the numbers behind this insight' : 'Shows the numbers behind this insight'}
            onPress={() => {
              haptic('select');
              setOpened(!open);
            }}
            style={({ pressed }) => [styles.disclosure, { minHeight: theme.minTouch }, pressed && { backgroundColor: c.pressed }]}
            testID="basis-toggle"
          >
            <Text role="body" style={styles.flex}>
              {open ? 'The numbers behind it' : 'Show the numbers behind it'}
            </Text>
            <Icon name={open ? 'chevronDown' : 'chevronRight'} size={16} color={c.labelTertiary} />
          </Pressable>
          {open ? (
            <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separator }}>
              <BasisRows insight={insight} f={f} testID="basis" />
            </View>
          ) : null}
        </Animated.View>
        <Text role="footnote" color="labelSecondary" style={styles.header}>
          {`Computed for ${f.date(insight.asOf)}. ${INSIGHTS_FOOTER}`}
        </Text>
      </View>

      <Animated.View layout={layout}>
        <SubjectLinks insight={insight} f={f} />
      </Animated.View>

      <Animated.View layout={layout} style={[styles.gutter, styles.actions]}>
        <Button
          label={isDismissed ? 'Show this insight again' : 'Dismiss this insight'}
          variant="tonal"
          onPress={() => {
            if (isDismissed) restoreInsight(insight.id);
            else {
              dismissInsight(insight.id);
              goBack();
            }
          }}
          accessibilityHint={isDismissed ? 'Puts it back on Home and in the list' : 'Hides it from Home and the list; you can restore it from the list'}
          testID="insight-dismiss"
        />
        {isDismissed ? (
          <Text role="footnote" color="labelSecondary">
            Dismissed. It stays out of Home and the list until you show it again.
          </Text>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gutter: { paddingHorizontal: SPACE.gutter },
  titleLine: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.s, marginBottom: SPACE.xs },
  titleIcon: { marginTop: 2 },
  title: { flex: 1 },
  section: { gap: SPACE.s },
  header: { paddingHorizontal: SPACE.l },
  upper: { letterSpacing: 0.4 },
  group: { overflow: 'hidden' },
  groupInset: { borderRadius: RADIUS.row },
  disclosure: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, paddingHorizontal: SPACE.l, paddingVertical: SPACE.m },
  actions: { gap: SPACE.s, alignItems: 'flex-start' },
});
