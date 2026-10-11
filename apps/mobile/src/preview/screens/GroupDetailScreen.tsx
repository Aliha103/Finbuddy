import type { Settlement, Transfer } from '@finbuddy/shared';
import { useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';

import { confirmSettlement, settleTransfer, useGroup } from '@/data';

import { memberNetSentence, settlementSentence, useFormat, type Formatter, type Spoken } from '@/features/common/format';
import { useBackLabel, useNavigation } from '../navigation';
import { ExpenseRow, SettlementRow } from '../rows';
import { Button, Note, Row, SampleTag, Screen, Section, SpokenText, T, styles } from '../ui';

/** One step of the plan: "Devon (sample) pays Casey (sample) £701.21", "You pay Casey (sample) £57.55". */
function planSentence(f: Formatter, t: Transfer): Spoken {
  if (f.isMe(t.from)) return f.say('You pay ', f.name(t.to), ' ', t.amount);
  if (f.isMe(t.to)) return f.say(f.name(t.from), ' pays you ', t.amount);
  return f.say(f.name(t.from), ' pays ', f.name(t.to), ' ', t.amount);
}

export function GroupDetailScreen({ groupId }: { groupId: string }) {
  const f = useFormat();
  const nav = useNavigation();
  const backLabel = useBackLabel();
  const detail = useGroup(groupId);
  const [message, setMessage] = useState<Spoken | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!detail) {
    return (
      <Screen title="Group not found" back={{ label: backLabel, onPress: nav.pop }}>
        <Section>
          <Note>This group no longer exists. It may have been removed by a reset.</Note>
        </Section>
      </Screen>
    );
  }
  const { group, balances, plan, members, expenses, settlements, pending } = detail;
  const multiCurrency = balances.length > 1;

  async function record(t: Transfer) {
    const key = `${t.from}:${t.to}:${t.amount.currency}`;
    setBusy(key);
    try {
      const settlement = await settleTransfer(group.id, t);
      const done = f.say(settlementSentence(f, settlement), '. Recorded and confirmed; balances are updated.');
      setMessage(done);
      AccessibilityInfo.announceForAccessibility(done.spoken);
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
      AccessibilityInfo.announceForAccessibility(done.spoken);
    } finally {
      setBusy(null);
    }
  }

  const confirmed = settlements.filter((s) => s.status === 'confirmed');

  return (
    <Screen
      title={group.name}
      back={{ label: backLabel, onPress: nav.pop }}
      intro={
        <>
          <View style={[styles.rowMain, { flexWrap: 'wrap' }]}>
            <T variant="subhead" tone="secondary">{`Group currency: ${f.currencyName(group.currency)}`}</T>
            <SampleTag isSample={group.isSample === true} />
          </View>
          <Button
            label="Add expense"
            variant="filled"
            onPress={() => nav.openAddExpense(group.id)}
            accessibilityLabel={`Add expense to ${group.name}`}
            style={{ alignSelf: 'flex-start' }}
          />
        </>
      }
    >
      <Section title="Members">
        {members.map((person) => {
          const nets = balances.map((cb) => cb.balances.find((b) => b.personId === person.id)?.net ?? { amountMinor: 0, currency: cb.currency });
          const lines = nets.length ? nets.map((net) => memberNetSentence(f, person.id, net)) : [memberNetSentence(f, person.id, { amountMinor: 0, currency: group.currency })];
          const [first, ...rest] = lines;
          return (
            <Row
              key={person.id}
              title={first ?? f.name(person.id)}
              subtitle={multiCurrency ? rest : undefined}
              sample={person.isSample === true}
            />
          );
        })}
      </Section>

      {message ? (
        <Section>
          <View style={styles.row}>
            <SpokenText value={message} accessibilityLiveRegion="polite" />
          </View>
        </Section>
      ) : null}

      <Section title="Settle-up plan" footer="The fewest payments that settle everyone in this group, per currency.">
        {plan.length ? (
          plan.map((t) => {
            const key = `${t.from}:${t.to}:${t.amount.currency}`;
            const sentence = planSentence(f, t);
            return (
              <Row key={key} title={sentence}>
                <Button
                  label={busy === key ? 'Recording…' : 'Record payment'}
                  disabled={busy !== null}
                  onPress={() => void record(t)}
                  accessibilityLabel={`Record payment. ${sentence.spoken}`}
                  accessibilityHint="Records and confirms a payment for this exact amount"
                  style={{ alignSelf: 'flex-start' }}
                />
              </Row>
            );
          })
        ) : (
          <Note>Everyone in this group is settled up.</Note>
        )}
      </Section>

      {pending.length ? (
        <Section title="Pending payments" footer="Not counted in balances until confirmed.">
          {pending.map((s) => {
            const sentence = settlementSentence(f, s);
            return (
              <Row key={s.id} title={sentence} subtitle={s.dueOn ? `Due ${f.date(s.dueOn)}` : undefined} sample={s.isSample === true}>
                <Button
                  label={busy === s.id ? 'Confirming…' : 'Confirm payment'}
                  disabled={busy !== null}
                  onPress={() => void confirm(s)}
                  accessibilityLabel={`Confirm payment. ${sentence.spoken}`}
                  style={{ alignSelf: 'flex-start' }}
                />
              </Row>
            );
          })}
        </Section>
      ) : null}

      <Section title={`Expenses (${expenses.length})`}>
        {expenses.length ? expenses.map((e) => <ExpenseRow key={e.id} f={f} expense={e} showGroup={false} />) : <Note>No expenses yet.</Note>}
      </Section>

      {confirmed.length ? (
        <Section title="Payments">
          {confirmed.map((s) => (
            <SettlementRow key={s.id} f={f} settlement={s} showGroup={false} />
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}
