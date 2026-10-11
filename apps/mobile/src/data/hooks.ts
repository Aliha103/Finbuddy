import type { Expense, Insight, LocalDate, Person, PersonId, PersonalOverview, Profile } from '@finbuddy/shared';

import {
  selectActivity,
  selectExpense,
  selectGroup,
  selectGroups,
  selectInsights,
  selectMyPending,
  selectMySettleUps,
  selectOverview,
  selectPeople,
  selectProfile,
  selectSpending,
  type ActivityItem,
  type GroupDetail,
  type GroupSummary,
  type SettleUpItem,
  type SpendingSummary,
} from './selectors';
import { useDataStore, type DataStatus } from './store';

/**
 * Typed read hooks. Each selects the current snapshot from the store (so it re-renders on every
 * repository change) and derives its view with a cached selector from ./selectors.
 */
export function useDataStatus(): { status: DataStatus; error: string | null; notice: string | null; persistent: boolean } {
  const status = useDataStore((s) => s.status);
  const error = useDataStore((s) => s.error);
  const notice = useDataStore((s) => s.notice);
  const persistent = useDataStore((s) => s.persistent);
  return { status, error, notice, persistent };
}

/** Increments on every data change. */
export function useDataVersion(): number {
  return useDataStore((s) => s.version);
}

/** Today's calendar date on this device. */
export function useToday(): LocalDate {
  return useDataStore((s) => s.today);
}

export function useProfile(): Profile | null {
  return selectProfile(useDataStore((s) => s.snapshot));
}

export function usePeople(): ReadonlyMap<PersonId, Person> {
  return selectPeople(useDataStore((s) => s.snapshot));
}

export function useExpense(expenseId: string): Expense | null {
  return selectExpense(useDataStore((s) => s.snapshot), expenseId);
}

/** What the profile owner owes and is owed, per currency (personalOverview). */
export function useOverview(): PersonalOverview | null {
  return selectOverview(useDataStore((s) => s.snapshot));
}

export function useGroups(): readonly GroupSummary[] {
  return selectGroups(useDataStore((s) => s.snapshot));
}

/** One group with balances (balancesByGroup), its simplifyDebts plan, expenses and settlements. */
export function useGroup(groupId: string): GroupDetail | null {
  return selectGroup(useDataStore((s) => s.snapshot), groupId);
}

/** Settle-up steps across all groups that the profile owner pays or receives. */
export function useMySettleUps(): readonly SettleUpItem[] {
  return selectMySettleUps(useDataStore((s) => s.snapshot));
}

/** Pending settlements the profile owner pays or receives. */
export function useMyPendingSettlements() {
  return selectMyPending(useDataStore((s) => s.snapshot));
}

/** Expenses and settlements together, newest first. */
export function useActivity(): readonly ActivityItem[] {
  return selectActivity(useDataStore((s) => s.snapshot));
}

/** On-device insights for today (generateInsights). */
export function useInsights(): readonly Insight[] {
  const snapshot = useDataStore((s) => s.snapshot);
  const today = useDataStore((s) => s.today);
  return selectInsights(snapshot, today);
}

/** Own-share spending by category and month, per currency. */
export function useSpending(monthCount = 6): SpendingSummary | null {
  const snapshot = useDataStore((s) => s.snapshot);
  const today = useDataStore((s) => s.today);
  return selectSpending(snapshot, today, monthCount);
}
