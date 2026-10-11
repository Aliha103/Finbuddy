import type { Settlement } from '@finbuddy/shared';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import {
  confirmSettlement,
  resetSampleData,
  settleTransfer,
  useActivity,
  useDataStatus,
  useGroups,
  useMyPendingSettlements,
  useMySettleUps,
  useOverview,
  useProfile,
  type SettleUpItem,
} from '@/data';

import { settlementSentence, transferSentence, useFormat, type Spoken } from '@/features/common/format';
import { useNavigation } from '../navigation';
import { ActivityRow } from '../rows';
import { Button, Note, Row, SampleTag, Screen, Section, SpokenText, T, styles } from '../ui';

function announce(message: Spoken) {
  AccessibilityInfo.announceForAccessibility(message.spoken);
}

export function HomeScreen() {
  const f = useFormat();
  const nav = useNavigation();
  const profile = useProfile();
  const overview = useOverview();
  const settleUps = useMySettleUps();
  const pending = useMyPendingSettlements();
  const activity = useActivity();
  const groups = useGroups();
  const { persistent } = useDataStatus();
  const [message, setMessage] = useState<Spoken | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const groupName = (id: string | null) => groups.find((g) => g.group.id === id)?.group.name ?? 'Personal';

  async function settle(item: SettleUpItem) {
    const key = `${item.groupId}:${item.transfer.from}:${item.transfer.to}:${item.transfer.amount.currency}`;
    setBusy(key);
    try {
      const settlement = await settleTransfer(item.groupId, item.transfer);
      const done = f.say(settlementSentence(f, settlement), '. Recorded and confirmed; balances are updated.');
      setMessage(done);
      announce(done);
    } catch (error) {
      setMessage(f.say(`Could not record that payment: ${error instanceof Error ? error.message : String(error)}`));
    } finally {
      setBusy(null);
    }
  }

  async function confirm(s: Settlement) {
    setBusy(s.id);
    try {
      const confirmed = await confirmSettlement(s.id);
      const done = f.say(settlementSentence(f, confirmed), '. Confirmed; balances are updated.');
      setMessage(done);
      announce(done);
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    setConfirmReset(false);
    await resetSampleData();
    const done = f.say('Sample data was reset.');
    setMessage(done);
    announce(done);
  }

  const headline = [...(overview?.owed ?? []).map((m) => f.say("You're owed ", m)), ...(overview?.owe ?? []).map((m) => f.say('You owe ', m))];

  return (
    <Screen
      title="Home"
      action={<Button label="Add expense" variant="filled" onPress={() => nav.openAddExpense(null)} accessibilityHint="Opens the add expense form" />}
      intro={
        profile ? (
          <View style={[styles.rowMain, { flexWrap: 'wrap' }]}>
            <T variant="subhead" tone="secondary">{`Profile: ${profile.displayName}`}</T>
            <SampleTag isSample={profile.isSample === true} />
          </View>
        ) : null
      }
    >
      <Section title="Your balances" footer="Each currency is shown on its own. Amounts in different currencies are never added together.">
        {headline.length ? headline.map((line, i) => <Row key={i} title={line} titleWeight="600" />) : <Note>{"You're all settled up."}</Note>}
      </Section>

      {message ? (
        <Section>
          <View style={styles.row}>
            <SpokenText value={message} accessibilityLiveRegion="polite" />
          </View>
        </Section>
      ) : null}

      <Section title="Needs settling" footer="Settle up records a payment for the exact amount and confirms it, so the balance clears.">
        {settleUps.length ? (
          settleUps.map((item) => {
            const key = `${item.groupId}:${item.transfer.from}:${item.transfer.to}:${item.transfer.amount.currency}`;
            const sentence = transferSentence(f, item.transfer);
            return (
              <Row key={key} title={sentence} subtitle={groupName(item.groupId)}>
                <Button
                  label={busy === key ? 'Recording…' : 'Settle up'}
                  disabled={busy !== null}
                  onPress={() => void settle(item)}
                  accessibilityLabel={`Settle up. ${sentence.spoken}`}
                  accessibilityHint="Records and confirms a payment for this exact amount"
                  style={{ alignSelf: 'flex-start' }}
                />
              </Row>
            );
          })
        ) : (
          <Note>Nothing to settle right now.</Note>
        )}
      </Section>

      {pending.length ? (
        <Section title="Pending payments" footer="Pending payments are not counted in balances until they are confirmed.">
          {pending.map((s) => {
            const sentence = settlementSentence(f, s);
            return (
              <Row
                key={s.id}
                title={sentence}
                subtitle={`${groupName(s.groupId)}${s.dueOn ? ` · due ${f.date(s.dueOn)}` : ''}`}
                sample={s.isSample === true}
              >
                <Button
                  label={busy === s.id ? 'Confirming…' : 'Confirm payment'}
                  disabled={busy !== null}
                  onPress={() => void confirm(s)}
                  accessibilityLabel={`Confirm payment. ${sentence.spoken}`}
                  accessibilityHint="Marks the payment as made so it counts in balances"
                  style={{ alignSelf: 'flex-start' }}
                />
              </Row>
            );
          })}
        </Section>
      ) : null}

      <Section title="Recent activity">
        {activity.slice(0, 5).map((item) => (
          <ActivityRow key={item.id} f={f} item={item} />
        ))}
        <Row title="See all activity" onPress={() => nav.selectTab('activity')} titleWeight="600" />
      </Section>

      <Section
        title="Preview tools"
        footer={
          persistent
            ? 'Changes are saved on this device. Reset brings back the original sample data.'
            : 'This browser is not letting the preview save, so changes last until you close or reload it.'
        }
      >
        <View style={styles.row}>
          {confirmReset ? (
            <View style={{ gap: 8 }}>
              <T>Replace everything with fresh sample data? Expenses and payments you added will be removed.</T>
              <View style={[styles.rowMain, { flexWrap: 'wrap' }]}>
                <Button label="Reset" variant="filled" onPress={() => void reset()} accessibilityLabel="Yes, reset sample data" />
                <Button label="Keep my changes" onPress={() => setConfirmReset(false)} />
              </View>
            </View>
          ) : (
            <Button label="Reset sample data" onPress={() => setConfirmReset(true)} style={{ alignSelf: 'flex-start' }} accessibilityHint="Asks you to confirm first" />
          )}
        </View>
      </Section>
    </Screen>
  );
}
