// apps/mobile/src/features/settle/SettleUp.tsx
// Settle up: one transfer. "From pays To" and the amount as a readout, an editable amount (partial
// payments are allowed), a method, an optional note, then the Gate: hold to record and confirm in
// one go, or "Mark as pending" to record a payment that still has to happen. At the gate the
// readout rolls to zero and the sheet closes after the roll.
import { formatMoneyForInput, pairwiseDebts, parseMoneyInput, type CurrencyCode, type Money, type SettlementMethod, type Transfer } from '@finbuddy/shared';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirmSettlement, recordSettlement, useDataStore, useGroup, useProfile } from '@/data';
import { Button, Chip, ChipRow, DURATION, Field, HoldToConfirm, Readout, SPACE, Text, useTheme } from '@/design';

import { parseErrorMessage } from '../common/format';
import { HeaderButton } from '../common/HeaderButton';
import { Screen } from '../common/Screen';
import { useGroupFormat } from '../groups/format';

const METHODS: readonly { id: SettlementMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Transfer' },
  { id: 'other', label: 'Other' },
];

const zero = (currency: CurrencyCode): Money => ({ amountMinor: 0, currency });

export function SettleUp() {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ groupId?: string; from?: string; to?: string; currency?: string }>();
  const groupId = params.groupId ?? null;
  const from = params.from ?? '';
  const to = params.to ?? '';
  const f = useGroupFormat();
  const profile = useProfile();
  const detail = useGroup(groupId ?? '');
  const snapshot = useDataStore((s) => s.snapshot);

  // The planned step: from the fewest-payments plan first, then the direct debt between the two.
  const planned = useMemo<Transfer | null>(() => {
    const match = (t: Transfer) => t.from === from && t.to === to && (!params.currency || t.amount.currency === params.currency);
    const inPlan = detail?.plan.find(match);
    if (inPlan) return inPlan;
    return pairwiseDebts(snapshot.expenses, snapshot.settlements, { groupId }).find(match) ?? null;
  }, [detail, snapshot, groupId, from, to, params.currency]);
  const currency: CurrencyCode = planned?.amount.currency ?? (params.currency && /^[A-Z]{3}$/.test(params.currency) ? (params.currency as CurrencyCode) : (detail?.group.currency ?? profile?.defaultCurrency ?? 'USD'));

  const [text, setText] = useState(() => (planned ? formatMoneyForInput(planned.amount, f.locale) : ''));
  const [touched, setTouched] = useState(false);
  const [method, setMethod] = useState<SettlementMethod>('bank_transfer');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'settle' | 'pending' | null>(null);
  const [done, setDone] = useState<Money | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const closing = useRef(false);

  const parsed = parseMoneyInput(text, currency, { locale: f.locale, allowZero: true });
  const amount: Money = parsed.ok ? parsed.value : zero(currency);
  const amountError = !parsed.ok && (touched || text.length > 0) ? parseErrorMessage(f, parsed.error, currency, parsed.maxDecimals) : null;
  const over = planned && amount.amountMinor > planned.amount.amountMinor;
  const valid = parsed.ok && amount.amountMinor > 0 && !!from && !!to && from !== to;

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(close, DURATION.readout);
    return () => clearTimeout(timer);
  }, [done]);

  const who = f.isMe(from) ? `You pay ${f.name(to)}` : f.isMe(to) ? `${f.name(from)} pays you` : `${f.name(from)} pays ${f.name(to)}`;
  const summary = f.say(who, ' ', amount);
  const settledSentence = f.isMe(from) ? f.say('Settled. You no longer owe ', f.name(to), ' ', amount) : f.isMe(to) ? f.say('Settled. ', f.name(from), ' no longer owes you ', amount) : f.say('Settled. ', f.name(from), ' paid ', f.name(to), ' ', amount);

  const record = () =>
    recordSettlement({ groupId, fromPersonId: from, toPersonId: to, amount, method, ...(note.trim() ? { note: note.trim() } : {}) });

  const settleNow = () => {
    if (!valid || busy) return;
    setBusy('settle');
    setFailure(null);
    void record()
      .then((s) => confirmSettlement(s.id))
      .then(() => {
        setDone(amount);
        AccessibilityInfo.announceForAccessibility(settledSentence.spoken);
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : 'Could not record the payment.');
        setBusy(null);
      });
  };

  const markPending = () => {
    if (!valid || busy) return;
    setBusy('pending');
    setFailure(null);
    void record()
      .then(() => {
        AccessibilityInfo.announceForAccessibility(`Recorded as pending. ${summary.spoken}`);
        close();
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : 'Could not record the payment.');
        setBusy(null);
      });
  };

  const ios = theme.platform === 'ios';
  const body = (
    <View style={styles.body}>
      <View style={styles.hero} testID="settle-hero">
        <Text role="headline" color={done ? 'credit' : 'label'} accessibilityLabel={done ? settledSentence.spoken : summary.spoken}>
          {done ? 'Settled' : who}
        </Text>
        <Readout money={done ? zero(currency) : amount} locale={f.locale} role="readoutXL" live testID="settle-readout" />
        <Text role="footnote" color="labelSecondary">
          {done
            ? settledSentence.text
            : planned
              ? `${f.currencyName(currency)}. The plan says ${f.money(planned.amount)}; a smaller amount records a partial payment.`
              : `${f.currencyName(currency)}. Nothing is planned between these two right now; any amount still records.`}
        </Text>
      </View>

      {done ? null : (
        <>
          {!from || !to || from === to ? (
            <Text role="body" color="labelSecondary" testID="settle-nobody">
              {"Open Settle up from a group's plan or from Home: it needs two people."}
            </Text>
          ) : null}
          <Field
            label="Amount"
            value={text}
            onChangeText={setText}
            onBlur={() => setTouched(true)}
            error={amountError}
            hint={over ? `More than the ${f.money(planned.amount)} the plan asks for. It still records; the difference becomes a balance the other way.` : undefined}
            inputMode="decimal"
            keyboardType="decimal-pad"
            returnKeyType="done"
            trailing={
              <Text role="subhead" color="labelSecondary" tabular>
                {currency}
              </Text>
            }
            testID="settle-amount"
          />
          <View style={styles.block}>
            <Text role="subhead" color="labelSecondary">
              Paid by
            </Text>
            <ChipRow label="Payment method">
              {METHODS.map((m) => (
                <Chip key={m.id} label={m.label} selected={method === m.id} onPress={() => setMethod(m.id)} testID={`method-${m.id}`} />
              ))}
            </ChipRow>
          </View>
          <Field label="Note (optional)" placeholder="What it was for" value={note} onChangeText={setNote} returnKeyType="done" testID="settle-note" />
          {failure ? (
            <Text role="footnote" color="danger" accessibilityRole="alert">
              {failure}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <HoldToConfirm label="Paid, settle now" summary={summary.spoken} onConfirm={settleNow} disabled={!valid || busy !== null} testID="settle-gate" />
            <Button label="Mark as pending" variant="tonal" fullWidth onPress={markPending} disabled={!valid || busy === 'settle'} loading={busy === 'pending'} testID="settle-pending" />
            <Text role="footnote" style={{ color: c.labelTertiary }}>
              Pending payments wait for a Confirm in the group and do not change balances until then.
            </Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settle up',
          headerLeft: ios ? () => <HeaderButton label="Cancel" onPress={close} testID="settle-cancel" /> : theme.platform === 'material' && !router.canGoBack() ? () => <HeaderButton label="Close" icon="close" onPress={close} testID="settle-cancel" /> : undefined,
        }}
      />
      {ios ? (
        // A form sheet sized to its content: a scroll view only when the content outgrows the sheet.
        <ScrollView style={{ backgroundColor: c.ground }} contentContainerStyle={[styles.sheet, { paddingBottom: insets.bottom + SPACE.l }]} keyboardShouldPersistTaps="handled" testID="settle">
          {body}
        </ScrollView>
      ) : (
        <Screen testID="settle">{body}</Screen>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { padding: SPACE.gutter, paddingTop: SPACE.l },
  body: { gap: SPACE.xl },
  hero: { gap: SPACE.xs },
  block: { gap: SPACE.s },
  actions: { gap: SPACE.m },
});
