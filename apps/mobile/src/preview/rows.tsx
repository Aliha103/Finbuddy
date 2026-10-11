import type { Expense, Settlement } from '@finbuddy/shared';

import { useGroups, type ActivityItem } from '@/data';

import { settlementSentence, type Formatter, type Spoken } from '@/features/common/format';
import { useNavigation } from './navigation';
import { Row } from './ui';

export function useGroupName(): (groupId: string | null) => string {
  const groups = useGroups();
  return (groupId) => (groupId === null ? 'Personal' : (groups.find((g) => g.group.id === groupId)?.group.name ?? 'Unknown group'));
}

/** "You paid £45.20" / "Casey (sample) paid £1,800.00 · your share £720.00". */
export function paidSummary(f: Formatter, e: Expense): Spoken {
  const payers = e.paidBy.map((p) => f.name(p.personId));
  const who = payers.length === 1 ? `${payers[0]} paid ` : `${payers.slice(0, -1).join(', ')} and ${payers[payers.length - 1]} paid `;
  const myShare = e.splits.find((s) => f.isMe(s.personId));
  const personal = e.groupId === null && e.splits.length === 1 && myShare !== undefined;
  if (personal) return f.say(who, e.total);
  if (myShare) return f.say(who, e.total, ' · your share ', myShare.amount);
  return f.say(who, e.total, " · you're not part of this split");
}

export function ExpenseRow({ f, expense, showGroup = true }: { f: Formatter; expense: Expense; showGroup?: boolean }) {
  const groupName = useGroupName();
  const nav = useNavigation();
  const where = showGroup ? ` · ${groupName(expense.groupId)}` : '';
  return (
    <Row
      title={expense.description || f.category(expense.categoryId)}
      detail={f.say(expense.total)}
      subtitle={[`${f.date(expense.occurredOn)}${where} · ${f.category(expense.categoryId)}`, paidSummary(f, expense)]}
      sample={expense.isSample === true}
      onPress={() => nav.push({ name: 'expense', expenseId: expense.id })}
      hint="Shows who paid and each person's share"
    />
  );
}

export function SettlementRow({ f, settlement, showGroup = true }: { f: Formatter; settlement: Settlement; showGroup?: boolean }) {
  const groupName = useGroupName();
  const where = showGroup ? ` · ${groupName(settlement.groupId)}` : '';
  const status = settlement.status === 'confirmed' ? 'Payment confirmed' : 'Pending, not counted in balances yet';
  return <Row title={settlementSentence(f, settlement)} subtitle={`${f.date(settlement.occurredOn)}${where} · ${status}`} sample={settlement.isSample === true} />;
}

export function ActivityRow({ f, item }: { f: Formatter; item: ActivityItem }) {
  return item.kind === 'expense' ? <ExpenseRow f={f} expense={item.expense} /> : <SettlementRow f={f} settlement={item.settlement} />;
}
