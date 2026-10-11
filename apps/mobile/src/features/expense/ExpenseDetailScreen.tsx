// apps/mobile/src/features/expense/ExpenseDetailScreen.tsx
// One expense (DIRECTION.md section 4, Activity): the total as a readout in its currency, who paid
// what, the split as it was entered ("Split by percentage: 40, 30, 30") with what each person
// entered beside every resolved share (which add up exactly to the total, "+1" on whoever took a
// leftover minor unit), then category, date and group. Edit reopens the sheet as entered; Delete is
// the Gate in its destructive intent, and is blocked with the reason when the engine refuses.
import { deletionIssues, formatMoney, type Expense, type PersonId } from '@finbuddy/shared';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { deleteExpense, useDataStore, useExpense, useGroups } from '@/data';
import { Card, CategoryIcon, HoldToConfirm, ListSection, Readout, Row, SPACE, SampleChip, Text, bestOn, useTheme } from '@/design';
import { DataGate } from '@/features/common/DataGate';
import { THIS_DEVICE } from '@/features/common/device';
import { EmptyState } from '@/features/common/EmptyState';
import { cleanName, useFormat, type Formatter } from '@/features/common/format';
import { HeaderButton } from '@/features/common/HeaderButton';
import { PersonAvatar } from '@/features/common/PersonAvatar';
import { Screen } from '@/features/common/Screen';
import { useGroupLineColor } from '@/features/groups/lineColors';

import { RemainderTick, SplitBar } from './components/SplitBar';
import { enteredValue, splitSentence } from './model';
import { remainderCarriers, shareColour } from './splitMath';

const INK = '#1A1420';

function goBack(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function ExpenseDetailScreen({ expenseId }: { expenseId: string }) {
  const expense = useExpense(expenseId);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    if (deleted) goBack();
  }, [deleted]);
  return (
    <DataGate>
      {deleted ? (
        <Screen testID="expense-deleted">{null}</Screen>
      ) : expense ? (
        <ExpenseDetail expense={expense} onDeleted={() => setDeleted(true)} />
      ) : (
        <Screen testID="expense-missing">
          <Stack.Screen options={{ title: 'Expense' }} />
          <EmptyState title="This expense no longer exists" message={`It may have been deleted, or the data on ${THIS_DEVICE} was reset.`} action={{ label: 'Back', onPress: goBack }} />
        </Screen>
      )}
    </DataGate>
  );
}

function ExpenseDetail({ expense, onDeleted }: { expense: Expense; onDeleted: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const f = useFormat();
  const groups = useGroups();
  const snapshot = useDataStore((s) => s.snapshot);
  const line = useGroupLineColor(expense.groupId ?? '');
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<readonly string[]>([]);

  const group = expense.groupId ? (groups.find((g) => g.group.id === expense.groupId)?.group ?? null) : null;
  const total = expense.total;
  const currency = total.currency;
  const blocked = deletionIssues('expenses', expense.id, snapshot);
  const carriers = remainderCarriers(expense.split, expense.splits, total.amountMinor);
  const shared = group !== null && expense.splits.length > 1;
  // A personal expense has one share, the whole total: "Split equally between 1 person" says nothing.
  const only = expense.splits.length === 1 ? expense.splits[0] : undefined;
  const shareFooter = only
    ? `${!group ? 'A personal expense: you carry' : f.isMe(only.personId) ? 'You carry' : `${f.name(only.personId)} carries`} all of ${f.money(total)}.`
    : `${splitSentence(f, expense.split)}. The shares add up exactly to ${f.money(total)}.`;
  const colour = (i: number) => shareColour(line.fill, i, theme.scheme);
  const shareIndex = new Map(expense.splits.map((s, i) => [s.personId, i]));
  // A person keeps one colour on this screen: their share's, wherever they appear.
  const fillFor = (personId: PersonId) => {
    const i = shareIndex.get(personId);
    return shared && i !== undefined ? colour(i) : undefined;
  };
  const avatar = (personId: PersonId) => {
    const fill = fillFor(personId);
    return <PersonAvatar name={f.name(personId)} size={28} fill={fill} on={fill ? bestOn(fill, ['#FFFFFF', INK]) : undefined} />;
  };
  const spokenTotal = f.spokenMoney(total);
  const title = expense.description || f.category(expense.categoryId);

  const remove = () => {
    setBusy(true);
    setProblems([]);
    void deleteExpense(expense.id)
      .then((result) => {
        if (result.ok) {
          if (typeof AccessibilityInfo.announceForAccessibility === 'function') AccessibilityInfo.announceForAccessibility(`Deleted ${title}, ${spokenTotal}`);
          onDeleted();
        } else setProblems(result.problems);
      })
      .catch((error: unknown) => setProblems([error instanceof Error ? error.message : String(error)]))
      .finally(() => setBusy(false));
  };

  return (
    <Screen testID="expense-detail">
      <Stack.Screen
        options={{
          title,
          headerRight: () => <HeaderButton label="Edit" onPress={() => router.push({ pathname: '/add', params: { expenseId: expense.id } })} testID="expense-edit" />,
        }}
      />

      <Card testID="expense-card">
        <View style={styles.cardBody}>
          <View style={styles.titleLine}>
            <View style={[styles.iconTile, { backgroundColor: c.surfaceAlt }]}>
              <CategoryIcon categoryId={expense.categoryId} size={22} color={c.label} />
            </View>
            <Text role="title" style={styles.flex} accessibilityRole="header">
              {title}
            </Text>
            {expense.isSample ? <SampleChip /> : null}
          </View>
          <Readout money={total} locale={f.locale} role="readoutXL" testID="expense-total" />
          <Text role="footnote" color="labelSecondary">
            {`${f.currencyName(currency)} · ${f.date(expense.occurredOn)}`}
          </Text>
          {shared ? (
            <View style={styles.bar}>
              <SplitBar
                people={expense.splits.map((s) => ({ id: s.personId, name: f.name(s.personId), amountMinor: s.amount.amountMinor, remainder: carriers.has(s.personId) }))}
                totalMinor={total.amountMinor}
                currency={currency}
                locale={f.locale}
                line={line}
                legend={false}
                testID="expense-bar"
              />
            </View>
          ) : null}
        </View>
      </Card>

      <ListSection header="Paid by" style={styles.flushList}>
        {expense.paidBy.map((p) => (
          <Row
            key={p.personId}
            title={f.name(p.personId)}
            leading={avatar(p.personId)}
            detail={<Readout money={p.amount} locale={f.locale} role="readoutS" inline />}
            testID={`expense-payer-${p.personId}`}
          />
        ))}
      </ListSection>

      <ListSection header={expense.splits.length > 1 ? 'Shares' : 'Share'} footer={shareFooter} style={styles.flushList}>
        {expense.splits.map((s) => {
          const entered = enteredValue(f, expense, s.personId);
          const remainder = carriers.has(s.personId);
          return (
            <Row
              key={s.personId}
              title={f.name(s.personId)}
              subtitle={entered ?? undefined}
              leading={avatar(s.personId)}
              detail={
                <View style={styles.share} accessible accessibilityLabel={shareLabel(f, s.personId, s.amount, remainder)}>
                  {remainder ? <RemainderTick /> : null}
                  <Readout money={s.amount} locale={f.locale} role="readoutS" inline />
                </View>
              }
              testID={`expense-share-${s.personId}`}
            />
          );
        })}
      </ListSection>

      <ListSection header="Details" style={styles.flushList}>
        <Row title="Category" leading={<CategoryIcon categoryId={expense.categoryId} size={22} color={c.labelSecondary} />} detail={<Text role="body" color="labelSecondary">{f.category(expense.categoryId)}</Text>} />
        <Row title="Date" detail={<Text role="body" color="labelSecondary">{f.date(expense.occurredOn)}</Text>} />
        {group ? (
          <Row
            title="Group"
            detail={<Text role="body" color="labelSecondary" numberOfLines={1}>{cleanName(group.name)}</Text>}
            sample={!!group.isSample}
            onPress={() => router.push({ pathname: '/(tabs)/(groups)/group/[groupId]', params: { groupId: group.id } })}
            chevron
            testID="expense-group"
          />
        ) : (
          <Row title="Group" detail={<Text role="body" color="labelSecondary">Personal</Text>} />
        )}
      </ListSection>

      <View style={styles.delete}>
        {blocked.length ? (
          <Text role="footnote" color="labelSecondary" testID="delete-blocked">
            {`This expense can't be deleted while other records still refer to it: ${blocked.join('; ')}.`}
          </Text>
        ) : null}
        <HoldToConfirm label="Delete expense" summary={`Delete ${title}, ${spokenTotal}`} intent="destructive" onConfirm={remove} disabled={busy || blocked.length > 0} testID="expense-delete" />
        {problems.length ? (
          <Text role="footnote" color="danger" accessibilityRole="alert" testID="delete-problems">
            {`Not deleted: ${problems.join('; ')}`}
          </Text>
        ) : (
          <Text role="footnote" color="labelSecondary">
            {group ? `Deleting it changes the balances in ${cleanName(group.name)}.` : 'Deleting it removes it from your spending.'}
          </Text>
        )}
      </View>
    </Screen>
  );
}

function shareLabel(f: Formatter, personId: PersonId, amount: Expense['total'], remainder: boolean): string {
  const base = `${f.name(personId)}, ${formatMoney(amount, { locale: f.locale, currencyDisplay: 'name' })}`;
  return remainder ? `${base}, includes one leftover ${formatMoney({ amountMinor: 1, currency: amount.currency }, { locale: f.locale, currencyDisplay: 'name' })}` : base;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardBody: { gap: SPACE.s },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  iconTile: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  flushList: { paddingHorizontal: 0 },
  share: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  delete: { gap: SPACE.s, marginTop: SPACE.s },
  bar: { marginTop: SPACE.xs },
});
