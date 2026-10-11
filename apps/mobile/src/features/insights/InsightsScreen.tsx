// apps/mobile/src/features/insights/InsightsScreen.tsx
// The list: the engine's insights in its order (warnings first), each with its severity as its icon,
// an inline "Why am I seeing this" disclosure, and the honest footer. Dismissed insights are kept
// behind one row so they can be restored.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useInsights } from '@/data';
import { Button, ListSection, Row, SPACE } from '@/design';
import { DataGate } from '@/features/common/DataGate';
import { EmptyState } from '@/features/common/EmptyState';
import { useFormat } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { INSIGHTS_EMPTY, INSIGHTS_FOOTER } from './copy';
import { restoreInsight, useDismissedInsights } from './dismissed';
import { InsightRow } from './InsightRow';

export function openInsight(insightId: string): void {
  router.push({ pathname: '/(tabs)/(home)/insights/[insightId]', params: { insightId } });
}

export function InsightsScreen() {
  const f = useFormat();
  const insights = useInsights();
  const { dismissed } = useDismissedInsights();
  const [showDismissed, setShowDismissed] = useState(false);
  const visible = insights.filter((i) => !dismissed.has(i.id));
  const hidden = insights.filter((i) => dismissed.has(i.id));

  return (
    <DataGate>
      <Screen flush testID="insights">
        {visible.length === 0 ? (
          <View style={styles.gutter}>
            <EmptyState
              title={INSIGHTS_EMPTY}
              message={hidden.length ? 'Everything the engine found today is dismissed.' : 'Spending spikes, unusual expenses, costs that look regular, payment reminders and budget pace show up here as you log.'}
              icon="info"
              footnote={INSIGHTS_FOOTER}
              testID="insights-empty"
            />
          </View>
        ) : (
          <ListSection header={`${visible.length} insight${visible.length === 1 ? '' : 's'}`} footer={INSIGHTS_FOOTER}>
            {visible.map((insight) => (
              <InsightRow key={insight.id} insight={insight} f={f} onPress={() => openInsight(insight.id)} expandable testID={`insight-${insight.id}`} />
            ))}
          </ListSection>
        )}
        {hidden.length > 0 ? (
          <ListSection header="Dismissed" footer={showDismissed ? 'Restoring puts an insight back on Home and in the list above.' : undefined}>
            <Row
              title={`${hidden.length} dismissed insight${hidden.length === 1 ? '' : 's'}`}
              subtitle={showDismissed ? undefined : 'Hidden from Home and the list above'}
              trailing={<Button label={showDismissed ? 'Hide' : 'Show'} variant="plain" onPress={() => setShowDismissed((s) => !s)} testID="insights-toggle-dismissed" />}
            />
            {showDismissed
              ? hidden.map((insight) => (
                  <InsightRow
                    key={insight.id}
                    insight={insight}
                    f={f}
                    onPress={() => openInsight(insight.id)}
                    trailing={<Button label="Restore" variant="tonal" onPress={() => restoreInsight(insight.id)} testID={`restore-${insight.id}`} />}
                    testID={`dismissed-${insight.id}`}
                  />
                ))
              : null}
          </ListSection>
        ) : null}
      </Screen>
    </DataGate>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter },
});
