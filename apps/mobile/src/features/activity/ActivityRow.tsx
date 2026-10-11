// apps/mobile/src/features/activity/ActivityRow.tsx
// One activity row: an expense (description, category, paid-by summary, the total as a readout) or
// a settlement (the settlement sentence from features/common/format and a Pending or Confirmed
// chip). Sample records wear the Sample chip. An expense opens Expense detail; a settlement opens
// its group. Home's five recent rows and the Activity feed share these.
import type { Expense, Settlement } from '@finbuddy/shared';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useGroups, useToday, type ActivityItem } from '@/data';
import { Icon, Readout, Row, SPACE, Text, useTheme } from '@/design';
import { settlementSentence, type Formatter, type Spoken } from '@/features/common/format';
import { cleanName } from '@/features/home/formatter';

/** "Personal" for expenses outside a group, else the group's name without the sample suffix. */
export function useGroupName(): (groupId: string | null) => string {
  const groups = useGroups();
  return (groupId) => (groupId === null ? 'Personal' : cleanName(groups.find((g) => g.group.id === groupId)?.group.name ?? 'Unknown group'));
}

/**
 * Who paid and your part, without repeating the total the row already shows as a readout:
 * "You paid · your share US$53.34", "Devon and Emery paid · your share US$49.63",
 * "Avery paid · you're not part of this split".
 */
export function paidSummary(f: Formatter, e: Expense): Spoken {
  const payers = e.paidBy.map((p) => f.name(p.personId));
  const who = payers.length === 1 ? `${payers[0]} paid` : `${payers.slice(0, -1).join(', ')} and ${payers[payers.length - 1]} paid`;
  const myShare = e.splits.find((s) => f.isMe(s.personId));
  if (myShare) return f.say(who, ' · your share ', myShare.amount);
  return f.say(who, " · you're not part of this split");
}

/** "11 Oct" within the current year (the feed's month headers carry the year), "11 Oct 2025" otherwise. */
export function useShortDate(f: Formatter): (date: string) => string {
  const year = useToday().slice(0, 4);
  return (date) => {
    if (date.slice(0, 4) !== year) return f.date(date);
    try {
      return new Intl.DateTimeFormat(f.locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`));
    } catch {
      return f.date(date);
    }
  };
}

/** A personal expense the owner paid alone: the total already says everything "You paid" would. */
function isPlainPersonal(f: Formatter, e: Expense): boolean {
  return e.groupId === null && e.splits.length === 1 && e.paidBy.length === 1 && f.isMe(e.paidBy[0]!.personId);
}

export function openExpense(expenseId: string): void {
  router.push({ pathname: '/expense/[expenseId]', params: { expenseId } });
}

export function openGroup(groupId: string): void {
  router.push({ pathname: '/(tabs)/(groups)/[groupId]', params: { groupId } });
}

export function ExpenseRow({ f, expense, showGroup = true, testID }: { f: Formatter; expense: Expense; showGroup?: boolean; testID?: string }) {
  const { colors } = useTheme();
  const groupName = useGroupName();
  const shortDate = useShortDate(f);
  const where = showGroup ? ` · ${groupName(expense.groupId)}` : '';
  const paid = paidSummary(f, expense);
  const subtitle = [`${shortDate(expense.occurredOn)}${where} · ${f.category(expense.categoryId)}`];
  if (!isPlainPersonal(f, expense)) subtitle.push(paid.text);
  // The paid line carries an amount, so it may take a third line rather than be cut short.
  return (
    <Row
      title={expense.description || f.category(expense.categoryId)}
      subtitle={subtitle}
      lines={3}
      detail={<Readout money={expense.total} locale={f.locale} role="readoutS" inline />}
      leading={<Icon name="receipt" size={22} color={colors.labelSecondary} />}
      sample={expense.isSample === true}
      onPress={() => openExpense(expense.id)}
      accessibilityHint="Shows who paid and each person's share"
      chevron
      testID={testID}
    />
  );
}

/** "Pending" (amber, not counted in balances) or "Confirmed": the status in words, then colour. */
export function StatusChip({ status }: { status: Settlement['status'] }) {
  const { colors } = useTheme();
  const pending = status === 'pending';
  return (
    <View style={[styles.chip, { backgroundColor: pending ? colors.attentionWash : colors.surfaceAlt }]} accessible accessibilityLabel={pending ? 'Pending, not counted in balances yet' : 'Confirmed'}>
      <Text role="caption" style={{ color: pending ? colors.attention : colors.labelSecondary, fontWeight: '600' }} importantForAccessibility="no">
        {pending ? 'Pending' : 'Confirmed'}
      </Text>
    </View>
  );
}

export function SettlementRow({ f, settlement, showGroup = true, testID }: { f: Formatter; settlement: Settlement; showGroup?: boolean; testID?: string }) {
  const { colors } = useTheme();
  const groupName = useGroupName();
  const shortDate = useShortDate(f);
  const sentence = settlementSentence(f, settlement);
  const where = showGroup ? ` · ${groupName(settlement.groupId)}` : '';
  const pending = settlement.status === 'pending';
  const groupId = settlement.groupId;
  return (
    <Row
      title={sentence.text}
      titleSpoken={sentence.spoken}
      subtitle={`${shortDate(settlement.occurredOn)}${where}${pending ? ' · Not counted in balances yet' : ''}`}
      detail={<StatusChip status={settlement.status} />}
      leading={<Icon name="payment" size={22} color={colors.labelSecondary} />}
      sample={settlement.isSample === true}
      onPress={groupId ? () => openGroup(groupId) : undefined}
      accessibilityHint={groupId ? 'Opens the group' : undefined}
      chevron={!!groupId}
      testID={testID}
    />
  );
}

export function ActivityRow({ f, item, showGroup, testID }: { f: Formatter; item: ActivityItem; showGroup?: boolean; testID?: string }) {
  return item.kind === 'expense' ? <ExpenseRow f={f} expense={item.expense} showGroup={showGroup} testID={testID} /> : <SettlementRow f={f} settlement={item.settlement} showGroup={showGroup} testID={testID} />;
}

const styles = StyleSheet.create({
  chip: { borderRadius: 999, paddingHorizontal: SPACE.s + 2, paddingVertical: 3, alignSelf: 'flex-end' },
});
