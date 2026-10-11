// apps/mobile/src/features/activity/grouping.ts
// The feed's shape: newest first (the selector's order), grouped by calendar month, filtered by
// where the money moved (everything, personal only, or one group).
import { monthOf, type MonthKey } from '@finbuddy/shared';

import type { ActivityItem } from '@/data';

export interface MonthGroup {
  readonly month: MonthKey;
  readonly items: ActivityItem[];
}

export function groupByMonth(items: readonly ActivityItem[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const item of items) {
    const month = monthOf(item.date);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.items.push(item);
    else groups.push({ month, items: [item] });
  }
  return groups;
}

/** 'all', 'personal' (no group) or a group id. */
export type ActivityFilter = 'all' | 'personal' | { readonly groupId: string };

function groupIdOf(item: ActivityItem): string | null {
  return item.kind === 'expense' ? item.expense.groupId : item.settlement.groupId;
}

export function filterActivity(items: readonly ActivityItem[], filter: ActivityFilter): ActivityItem[] {
  if (filter === 'all') return [...items];
  if (filter === 'personal') return items.filter((i) => groupIdOf(i) === null);
  return items.filter((i) => groupIdOf(i) === filter.groupId);
}
