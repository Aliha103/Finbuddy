// apps/mobile/src/features/groups/GroupDetail.tsx
// One group: its card as the header (the same card as on the list), balances in words with a
// readout per member and currency, the settle map with its "All debts | Fewest payments" toggle,
// the settle-up plan with a Settle up control on every step, pending payments with Confirm, and
// the expenses newest first. Add expense is the FAB on Android and the web; iOS gets a row (the
// iOS 26 bottom accessory and the "+" in the bar also open it).
import { pairwiseDebts, type Money, type Settlement, type Transfer } from '@finbuddy/shared';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { confirmSettlement, useDataStore, useGroup } from '@/data';
import { Button, Card, Icon, ListSection, Readout, Row, SPACE, Text, useTheme } from '@/design';

import { DataGate } from '../common/DataGate';
import { EmptyState } from '../common/EmptyState';
import { Fab } from '../common/Fab';
import { cleanName, memberNetSentence, planSentence, settlementSentence, useFormat, type Formatter, type Spoken } from '../common/format';
import { HeaderButton } from '../common/HeaderButton';
import { Screen } from '../common/Screen';
import { paidSummary } from './format';
import { GroupCard } from './GroupCard';
import { useGroupLineColor } from './lineColors';
import { SettleMap, type SettleMapMode } from './SettleMap';

const abs = (m: Money): Money => (m.amountMinor < 0 ? { amountMinor: -m.amountMinor, currency: m.currency } : m);

/** The words of a balance row; the readout beside it carries the figure. */
function balanceWords(f: Formatter, personId: string, net: Money): string {
  const me = f.isMe(personId);
  const who = f.name(personId);
  if (net.amountMinor === 0) return me ? "You're settled up" : `${who} is settled up`;
  if (net.amountMinor > 0) return me ? "You're owed" : `${who} is owed`;
  return me ? 'You owe' : `${who} owes`;
}

export function GroupDetail({ groupId }: { groupId: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const f = useFormat();
  const detail = useGroup(groupId);
  const line = useGroupLineColor(groupId);
  const snapshot = useDataStore((s) => s.snapshot);
  const [mode, setMode] = useState<SettleMapMode>('fewest');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<Spoken | null>(null);
  const pairwise = useMemo(() => pairwiseDebts(snapshot.expenses, snapshot.settlements, { groupId }), [snapshot, groupId]);

  if (!detail) {
    return (
      <Screen testID="group-missing">
        <EmptyState
          title="This group no longer exists"
          message="It may have been removed when the data on this phone was reset."
          icon="groups"
          action={{ label: 'Back to Groups', onPress: () => router.replace('/(tabs)/(groups)') }}
        />
      </Screen>
    );
  }

  const { group, balances, plan, members, expenses, pending } = detail;
  const name = cleanName(group.name);
  const multiCurrency = balances.length > 1;
  const currencies = balances.length ? [...balances].sort((a, b) => (a.currency === group.currency ? -1 : b.currency === group.currency ? 1 : 0)).map((cb) => cb.currency) : [group.currency];
  const mine = (t: Transfer) => f.isMe(t.from) || f.isMe(t.to);
  const orderedPlan = [...plan].sort((a, b) => Number(mine(b)) - Number(mine(a)));
  const settled = plan.length === 0 && pairwise.length === 0;
  const mapMembers = members.map((m) => ({ id: m.id, label: f.name(m.id), isMe: f.isMe(m.id) }));

  const openSettle = (t: Transfer) => router.push({ pathname: '/settle', params: { groupId: group.id, from: t.from, to: t.to, currency: t.amount.currency } });
  const openAdd = () => router.push({ pathname: '/add', params: { groupId: group.id } });
  const openSettings = () => router.push({ pathname: '/(tabs)/(groups)/[groupId]/settings', params: { groupId: group.id } });

  const confirm = (s: Settlement) => {
    setBusy(s.id);
    void confirmSettlement(s.id)
      .then((confirmed) => {
        const done = f.say(settlementSentence(f, confirmed), '. Confirmed; balances are updated.');
        setMessage(done);
        AccessibilityInfo.announceForAccessibility(done.spoken);
      })
      .catch((error: unknown) => setMessage(f.say(`Could not confirm that payment: ${error instanceof Error ? error.message : String(error)}`)))
      .finally(() => setBusy(null));
  };

  const ios = theme.platform === 'ios';
  return (
    <DataGate>
      <Stack.Screen
        options={{
          title: name,
          headerRight: () => (
            <View style={styles.headerActions}>
              {ios ? <HeaderButton label="Add expense" icon="add" onPress={openAdd} testID="header-add-expense" /> : null}
              <HeaderButton label="Group settings" icon="settings" onPress={openSettings} testID="header-group-settings" />
            </View>
          ),
        }}
      />
      <Screen fab testID="group-detail">
        <GroupCard summary={detail} line={line} memberNames={members.map((m) => m.displayName)} f={f} variant="header" testID="group-header" />

        <ListSection header="Balances" footer={multiCurrency ? 'This group has expenses in more than one currency. Each currency is settled on its own.' : undefined}>
          {members.flatMap((person) =>
            (balances.length ? balances : [{ currency: group.currency, balances: [] }]).map((cb) => {
              const net = cb.balances.find((b) => b.personId === person.id)?.net ?? { amountMinor: 0, currency: cb.currency };
              const sentence = memberNetSentence(f, person.id, net);
              return (
                <Row
                  key={`${person.id}:${cb.currency}`}
                  title={balanceWords(f, person.id, net)}
                  titleSpoken={sentence.spoken}
                  subtitle={multiCurrency ? f.currencyName(cb.currency) : undefined}
                  detail={
                    net.amountMinor === 0 ? undefined : (
                      <Readout money={abs(net)} locale={f.locale} role="readoutS" color={net.amountMinor > 0 ? 'credit' : 'label'} inline testID={`balance-${person.id}-${cb.currency}`} />
                    )
                  }
                  testID={`balance-row-${person.id}-${cb.currency}`}
                />
              );
            }),
          )}
        </ListSection>

        <Card testID="settle-card">
          <View style={styles.cardBody}>
            <View style={styles.cardTitle}>
              <Icon name="settle" size={20} color={c.labelSecondary} />
              <Text role="headline" accessibilityRole="header">
                Settle up
              </Text>
            </View>
            {settled ? (
              <Text role="body" color="labelSecondary" testID="everyone-settled">
                Everyone is settled up.
              </Text>
            ) : (
              currencies.map((currency) => (
                <View key={currency} style={styles.map}>
                  {multiCurrency ? (
                    <Text role="subhead" color="labelSecondary" accessibilityRole="header">
                      {f.currencyName(currency)}
                    </Text>
                  ) : null}
                  <SettleMap
                    members={mapMembers}
                    all={pairwise.filter((t) => t.amount.currency === currency)}
                    fewest={plan.filter((t) => t.amount.currency === currency)}
                    mode={mode}
                    onModeChange={setMode}
                    line={line}
                    money={f.money}
                    sentence={(t) => planSentence(f, t)}
                    testID={`settle-map-${currency}`}
                  />
                </View>
              ))
            )}
          </View>
        </Card>

        {orderedPlan.length ? (
          <ListSection header="Fewest payments" footer="Each step records a payment for exactly this amount; the plan recomputes after every one.">
            {orderedPlan.map((t) => {
              const key = `${t.from}:${t.to}:${t.amount.currency}`;
              const sentence = planSentence(f, t);
              return (
                <Row
                  key={key}
                  title={sentence.text}
                  titleSpoken={sentence.spoken}
                  subtitle={mine(t) ? undefined : 'Between two other members'}
                  trailing={
                    <Button label="Settle up" size="small" variant="tonal" onPress={() => openSettle(t)} accessibilityLabel={`Settle up. ${sentence.spoken}`} testID={`settle-${t.from}-${t.to}`} />
                  }
                  testID={`plan-${t.from}-${t.to}`}
                />
              );
            })}
          </ListSection>
        ) : null}

        {pending.length ? (
          <ListSection header="Pending" footer="Not counted in balances until confirmed.">
            {pending.map((s) => {
              const sentence = settlementSentence(f, s);
              return (
                <Row
                  key={s.id}
                  title={sentence.text}
                  titleSpoken={sentence.spoken}
                  subtitle={s.dueOn ? `Due ${f.date(s.dueOn)}` : `Recorded ${f.date(s.occurredOn)}`}
                  sample={s.isSample === true}
                  trailing={
                    <Button
                      label="Confirm"
                      size="small"
                      variant="tonal"
                      onPress={() => confirm(s)}
                      loading={busy === s.id}
                      disabled={busy !== null}
                      accessibilityLabel={`Confirm payment. ${sentence.spoken}`}
                      testID={`confirm-${s.id}`}
                    />
                  }
                  testID={`pending-${s.id}`}
                />
              );
            })}
          </ListSection>
        ) : null}

        {message ? (
          <Text role="footnote" color="labelSecondary" accessibilityLiveRegion="polite" accessibilityLabel={message.spoken} testID="group-message">
            {message.text}
          </Text>
        ) : null}

        <ListSection header={expenses.length ? `Expenses (${expenses.length})` : 'Expenses'} footer={expenses.length ? 'Newest first. Tap one for who paid and every share.' : undefined}>
          {ios ? <Row title="Add expense" leading={<Icon name="add" size={22} color={c.tint} />} onPress={openAdd} chevron={false} testID="add-expense-row" /> : null}
          {expenses.length ? (
            expenses.map((e) => {
              const paid = paidSummary(f, e);
              return (
                <Row
                  key={e.id}
                  title={e.description || f.category(e.categoryId)}
                  subtitle={[`${f.date(e.occurredOn)} · ${f.category(e.categoryId)}`, paid.text]}
                  detail={f.money(e.total)}
                  sample={e.isSample === true}
                  onPress={() => router.push({ pathname: '/expense/[expenseId]', params: { expenseId: e.id } })}
                  accessibilityHint="Shows who paid and each person's share"
                  testID={`expense-${e.id}`}
                />
              );
            })
          ) : (
            <View style={styles.emptyExpenses}>
              <Text role="body" color="labelSecondary">
                Nothing shared yet. The first expense starts the balances.
              </Text>
            </View>
          )}
        </ListSection>

        {members.length ? (
          <Text role="footnote" color="labelTertiary">
            {`${members.map((m) => f.name(m.id)).join(', ')}. In-app invites arrive with accounts; until then, people without the app are added by name.`}
          </Text>
        ) : null}
      </Screen>
      <Fab label="Add expense" onPress={openAdd} testID="fab-add-expense" />
    </DataGate>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  cardBody: { gap: SPACE.m },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  map: { gap: SPACE.s },
  emptyExpenses: { padding: SPACE.l, gap: SPACE.m, alignItems: 'flex-start' },
});
