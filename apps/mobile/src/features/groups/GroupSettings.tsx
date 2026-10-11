// apps/mobile/src/features/groups/GroupSettings.tsx
// Rename, currency, line colour, members and archive. The currency stays fixed once the group has
// expenses (balances are per currency, never converted); a member who is still in an expense cannot
// leave (the engine's groupUpdateIssues); archiving is the Gate, restoring is a plain button.
import { peopleInExpense } from '@finbuddy/shared';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { addPerson, archiveGroup, updateGroup, useDeviceLocale, useGroup, usePeople, useProfile, type GroupUpdateResult } from '@/data';
import { Button, Field, HoldToConfirm, ListSection, Row, SPACE, Text, gateUsesDialog, useTheme } from '@/design';

import { CurrencyPicker } from '../common/CurrencyPicker';
import { currencyNames } from '../common/currency';
import { DataGate } from '../common/DataGate';
import { THIS_DEVICE } from '../common/device';
import { EmptyState } from '../common/EmptyState';
import { Screen } from '../common/Screen';
import { cleanName, useFormat } from '../common/format';
import { peopleCount } from './format';
import { LineColorPicker } from './LineColorPicker';
import { MemberEditor } from './MemberEditor';
import { setGroupLineColor, useGroupLineColor } from './lineColors';

export function GroupSettings({ groupId }: { groupId: string }) {
  return (
    <DataGate>
      <GroupSettingsBody groupId={groupId} />
    </DataGate>
  );
}

function GroupSettingsBody({ groupId }: { groupId: string }) {
  const theme = useTheme();
  const f = useFormat();
  const locale = useDeviceLocale();
  const detail = useGroup(groupId);
  const people = usePeople();
  const profile = useProfile();
  const line = useGroupLineColor(groupId);
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const nameOf = useMemo(() => currencyNames(locale), [locale]);

  const candidates = useMemo(() => {
    if (!detail) return [];
    const memberSet = new Set(detail.group.memberIds);
    return [...people.values()].filter((p) => !memberSet.has(p.id) && p.id !== profile?.personId).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [detail, people, profile]);

  if (!detail) {
    return (
      <Screen testID="group-settings-missing">
        <EmptyState
          title="This group no longer exists"
          message={`It may have been removed when the data on ${THIS_DEVICE} was reset.`}
          icon="groups"
          action={{ label: 'Back to Groups', onPress: () => router.replace('/(tabs)/(groups)') }}
        />
      </Screen>
    );
  }
  const { group, members, expenses } = detail;
  const storedName = cleanName(group.name);
  const currentName = name ?? storedName;
  const inExpenses = (personId: string) => expenses.filter((e) => peopleInExpense(e).includes(personId)).length;

  const apply = (task: () => Promise<GroupUpdateResult>, okText: string) => {
    setBusy(true);
    setStatus(null);
    void task()
      .then((result) => setStatus(result.ok ? { tone: 'ok', text: okText } : { tone: 'error', text: explain(result.problems, f) }))
      .catch((error: unknown) => setStatus({ tone: 'error', text: error instanceof Error ? error.message : String(error) }))
      .finally(() => setBusy(false));
  };

  const saveName = () => {
    const trimmed = currentName.trim();
    if (!trimmed) {
      setStatus({ tone: 'error', text: 'Give the group a name.' });
      return;
    }
    if (trimmed === storedName) return;
    apply(() => updateGroup(group.id, { name: trimmed }), `Renamed to ${cleanName(trimmed)}.`);
  };

  const addMember = (personId: string) => apply(() => updateGroup(group.id, { memberIds: [...group.memberIds, personId] }), `${f.name(personId)} is in the group.`);
  const addByName = (displayName: string) =>
    apply(() => addPerson({ displayName }).then((person) => updateGroup(group.id, { memberIds: [...group.memberIds, person.id] })), `${displayName} is in the group.`);
  const removeMember = (personId: string) => apply(() => updateGroup(group.id, { memberIds: group.memberIds.filter((id) => id !== personId) }), `${f.name(personId)} left the group.`);

  const archive = () =>
    apply(
      () =>
        archiveGroup(group.id, !group.archived).then((result) => {
          if (result.ok && result.group.archived) router.replace('/(tabs)/(groups)');
          return result;
        }),
      group.archived ? 'Restored. The group is back on the list.' : 'Archived.',
    );

  return (
    <Screen testID="group-settings">
      <Field label="Name" value={currentName} onChangeText={setName} onBlur={saveName} onSubmitEditing={saveName} returnKeyType="done" autoCapitalize="sentences" testID="group-name" />

      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          Line colour
        </Text>
        <LineColorPicker value={line.id} onChange={(id) => setGroupLineColor(group.id, id)} />
      </View>

      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          Currency
        </Text>
        <Text role="body">{`${group.currency} · ${nameOf(group.currency)}`}</Text>
        {expenses.length ? (
          <Text role="footnote" color="labelSecondary" testID="currency-locked">
            {`This group already has ${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}, so its currency stays ${group.currency}. Balances are kept per currency and never converted; an expense in another currency simply shows its own balance.`}
          </Text>
        ) : (
          <>
            <Text role="footnote" color="labelSecondary">
              New expenses default to it. It can change until the first expense is logged.
            </Text>
            <CurrencyPicker
              locale={locale}
              value={group.currency}
              suggested={[profile?.defaultCurrency ?? 'USD', 'EUR', 'USD', 'GBP', 'JPY']}
              limit={6}
              onChange={(code) => {
                if (code !== group.currency) apply(() => updateGroup(group.id, { currency: code }), `Currency is now ${code}.`);
              }}
            />
          </>
        )}
      </View>

      {/* The same section title as Line colour, Currency and Add members above and below it, not a list-group caption. */}
      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          {`Members · ${peopleCount(members.length)}`}
        </Text>
        <ListSection footer="Someone who is still in an expense stays until that expense is edited or deleted.">
          {members.map((person) => {
            const count = inExpenses(person.id);
            const creator = person.id === group.createdBy;
            const me = f.isMe(person.id);
            return (
              <Row
                key={person.id}
                title={me && cleanName(person.displayName) !== 'You' ? `You (${cleanName(person.displayName)})` : f.name(person.id)}
                subtitle={creator ? 'Created the group' : count ? `In ${count} ${count === 1 ? 'expense' : 'expenses'}` : 'Not in any expense yet'}
                sample={person.isSample === true}
                trailing={
                  creator ? undefined : (
                    <Button
                      label="Remove"
                      size="small"
                      variant="plain"
                      onPress={() => removeMember(person.id)}
                      disabled={busy || count > 0}
                      accessibilityLabel={`Remove ${f.name(person.id)}`}
                      testID={`remove-${person.id}`}
                    />
                  )
                }
                testID={`member-row-${person.id}`}
              />
            );
          })}
        </ListSection>
      </View>

      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          Add members
        </Text>
        <MemberEditor candidates={candidates} selectedIds={[]} onToggle={addMember} newNames={[]} onAddName={addByName} onRemoveName={() => {}} />
      </View>

      {status ? (
        <Text role="footnote" color={status.tone === 'ok' ? 'credit' : 'danger'} accessibilityLiveRegion="polite" testID="settings-status">
          {status.text}
        </Text>
      ) : null}

      <View style={styles.section}>
        <Text role="headline" accessibilityRole="header">
          {group.archived ? 'Archived' : 'Archive'}
        </Text>
        {group.archived ? (
          <>
            <Text role="footnote" color="labelSecondary">
              Archived groups keep their history and sort last. Restoring puts it back among the others.
            </Text>
            <Button label="Restore group" variant="tonal" onPress={archive} loading={busy} testID="restore-group" />
          </>
        ) : (
          <>
            <HoldToConfirm
              label="Archive group"
              summary={`Moves ${cleanName(group.name)} to the end of the list. Its expenses and payments stay.`}
              onConfirm={archive}
              disabled={busy}
              testID="archive-group"
            />
            <Text role="footnote" style={{ color: theme.colors.labelTertiary }}>
              {gateUsesDialog(theme) ? 'Asks you to confirm first. Nothing is deleted.' : 'Hold until the ring closes. Nothing is deleted.'}
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

/** The engine's messages name ids; put the people's names in front of them. */
function explain(problems: readonly string[], f: { name(id: string): string }): string {
  return problems.map((p) => p.replace(/member (\S+) is still in expense \S+/, (_, id: string) => `${f.name(id)} is still in an expense`)).join(' ');
}

const styles = StyleSheet.create({
  section: { gap: SPACE.m },
});
