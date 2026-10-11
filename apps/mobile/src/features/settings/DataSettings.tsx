// apps/mobile/src/features/settings/DataSettings.tsx
// Export (serializeSnapshot to a JSON file through the share sheet), sample data (reset, remove),
// and Delete all data behind the Gate in its destructive intent, after which onboarding returns.
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { deleteAllData, exportData, removeSampleData, resetSampleData, useDataStatus, useDataStore } from '@/data';
import { Button, HoldToConfirm, ListSection, Row, SPACE, Text, useTheme } from '@/design';

import { Screen } from '../common/Screen';
import { shareExport } from './exportFile';

export function DataSettings() {
  const theme = useTheme();
  const c = theme.colors;
  const { persistent } = useDataStatus();
  const snapshot = useDataStore((s) => s.snapshot);
  const counts = { expenses: snapshot.expenses.length, groups: snapshot.groups.length, settlements: snapshot.settlements.length };
  const sampleCount = [snapshot.profiles, snapshot.people, snapshot.groups, snapshot.expenses, snapshot.settlements, snapshot.budgets].flat().filter((r) => r.isSample).length;
  const [busy, setBusy] = useState<'export' | 'reset' | 'remove' | 'delete' | null>(null);
  const [exportNote, setExportNote] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const run = (what: NonNullable<typeof busy>, task: () => Promise<void>) => {
    setBusy(what);
    void task()
      .catch((error: unknown) => setExportNote({ tone: 'error', text: error instanceof Error ? error.message : String(error) }))
      .finally(() => setBusy(null));
  };

  const doExport = () =>
    run('export', async () => {
      setExportNote(null);
      const json = await exportData();
      const stamp = new Date().toISOString().slice(0, 10);
      const outcome = await shareExport(json, `finbuddy-${stamp}.json`);
      setExportNote(
        outcome === 'unavailable'
          ? { tone: 'error', text: 'Sharing is not available on this device, so the file could not be handed over.' }
          : { tone: 'ok', text: outcome === 'saved' ? `Saved finbuddy-${stamp}.json (${(json.length / 1024).toFixed(0)} KB).` : `Shared finbuddy-${stamp}.json (${(json.length / 1024).toFixed(0)} KB).` },
      );
    });

  return (
    <Screen flush={theme.platform !== 'ios'} testID="data-settings">
      <ListSection
        header="Export"
        footer={`A JSON file with every record on this phone: ${counts.expenses} expenses, ${counts.groups} groups, ${counts.settlements} payments. The same file can be imported on another phone when that arrives.`}
      >
        <View style={styles.block}>
          <Button label="Export your data" icon="share" onPress={doExport} loading={busy === 'export'} testID="export-data" />
          {exportNote ? (
            <Text role="footnote" color={exportNote.tone === 'ok' ? 'credit' : 'danger'} accessibilityLiveRegion="polite" testID="export-note">
              {exportNote.text}
            </Text>
          ) : null}
        </View>
      </ListSection>

      <ListSection header="Sample data" footer={sampleCount ? `${sampleCount} records on this phone are sample data, each labelled.` : 'No sample data on this phone.'}>
        <Row title="Reset sample data" subtitle="Replaces everything with a fresh, labelled sample set" onPress={() => run('reset', resetSampleData)} chevron={false} testID="reset-sample" />
        {sampleCount ? <Row title="Remove sample data" subtitle="Drops every labelled record; a sample profile goes back to the welcome screen" onPress={() => run('remove', () => removeSampleData().then(() => afterWipe()))} chevron={false} testID="remove-sample" /> : null}
      </ListSection>

      <ListSection header="Delete" footer={persistent ? 'Removes every expense, group, payment, budget and your profile from this phone. There is no copy anywhere else, so export first if you want one.' : 'Storage is refused right now, so there is nothing saved to delete; the data in memory goes when the app closes.'}>
        <View style={styles.block}>
          <HoldToConfirm
            label="Delete all data"
            summary={`Removes ${counts.expenses} expenses, ${counts.groups} groups and your profile from this phone`}
            intent="destructive"
            disabled={busy !== null}
            onConfirm={() => run('delete', () => deleteAllData().then(() => afterWipe()))}
            testID="delete-all"
          />
          <Text role="footnote" style={{ color: c.labelTertiary }}>
            Hold until the ring closes. Nothing happens on a tap.
          </Text>
        </View>
      </ListSection>
    </Screen>
  );
}

/** After the data is gone the store is empty; the app starts over at the welcome screen. */
function afterWipe(): void {
  if (useDataStore.getState().snapshot.profiles.length === 0) router.replace('/onboarding');
}

const styles = StyleSheet.create({
  block: { padding: SPACE.l, gap: SPACE.m },
});
