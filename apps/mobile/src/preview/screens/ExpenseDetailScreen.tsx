import type { Expense, SplitSpec } from '@finbuddy/shared';
import { View } from 'react-native';

import { useExpense } from '@/data';

import { useFormat, type Formatter } from '../format';
import { useBackLabel, useNavigation } from '../navigation';
import { useGroupName } from '../rows';
import { Note, Row, SampleTag, Screen, Section, T, styles } from '../ui';

function methodLabel(spec: SplitSpec): string {
  switch (spec.type) {
    case 'equal':
      return `Split equally between ${spec.participants.length} ${spec.participants.length === 1 ? 'person' : 'people'}`;
    case 'exact':
      return 'Split by exact amounts';
    case 'percentage':
      return 'Split by percentage';
    case 'shares':
      return 'Split by shares';
    case 'adjustment':
      return 'Split equally, with adjustments';
  }
}

/** What each person entered, beside their resolved share: "40%", "2 shares", "+£10.00". */
function entered(f: Formatter, e: Expense, personId: string): string | null {
  const spec = e.split;
  if (spec.type === 'percentage') {
    const p = spec.percentages.find((x) => x.personId === personId);
    return p ? `${f.number(Number(p.percent), 4)}%` : null;
  }
  if (spec.type === 'shares') {
    const s = spec.shares.find((x) => x.personId === personId);
    return s ? `${f.number(Number(s.shares), 4)} ${Number(s.shares) === 1 ? 'share' : 'shares'}` : null;
  }
  if (spec.type === 'adjustment') {
    const a = spec.adjustments.find((x) => x.personId === personId);
    if (!a || a.adjustmentMinor === 0) return null;
    return `${a.adjustmentMinor > 0 ? 'plus' : 'minus'} ${f.money({ amountMinor: Math.abs(a.adjustmentMinor), currency: e.total.currency })}`;
  }
  return null;
}

export function ExpenseDetailScreen({ expenseId }: { expenseId: string }) {
  const f = useFormat();
  const nav = useNavigation();
  const backLabel = useBackLabel();
  const groupName = useGroupName();
  const expense = useExpense(expenseId);

  if (!expense) {
    return (
      <Screen title="Expense not found" back={{ label: backLabel, onPress: nav.pop }}>
        <Section>
          <Note>This expense no longer exists. It may have been removed by a reset.</Note>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen
      title={expense.description || f.category(expense.categoryId)}
      back={{ label: backLabel, onPress: nav.pop }}
      intro={
        <View style={[styles.rowMain, { flexWrap: 'wrap' }]}>
          <T variant="subhead" tone="secondary">{`${f.date(expense.occurredOn)} · ${groupName(expense.groupId)} · ${f.category(expense.categoryId)}`}</T>
          <SampleTag isSample={expense.isSample === true} />
        </View>
      }
    >
      <Section title="Total">
        <Row title={f.say(expense.total)} titleWeight="700" subtitle={f.currencyName(expense.total.currency)} />
      </Section>
      <Section title="Paid by">
        {expense.paidBy.map((p) => (
          <Row key={p.personId} title={f.name(p.personId)} detail={f.say(p.amount)} />
        ))}
      </Section>
      <Section title="Shares" footer={`${methodLabel(expense.split)}. Shares always add up exactly to the total.`}>
        {expense.splits.map((s) => {
          const extra = entered(f, expense, s.personId);
          return <Row key={s.personId} title={f.name(s.personId)} subtitle={extra ?? undefined} detail={f.say(s.amount)} />;
        })}
      </Section>
    </Screen>
  );
}
