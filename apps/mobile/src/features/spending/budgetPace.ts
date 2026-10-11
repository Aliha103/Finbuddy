// apps/mobile/src/features/spending/budgetPace.ts
// A budget's pace, read from the engine's budget_pace insight (generateInsights emits one per
// budget for the current month), so the Budgets screen quotes exactly the figures Insights does.
import { isMoney, type Insight, type Money } from '@finbuddy/shared';

import type { BudgetPace, PaceStatus } from '@/features/common/format';

const money = (value: unknown): Money | null => (isMoney(value) ? value : null);

export function paceFromInsight(insight: Insight): BudgetPace | null {
  if (insight.kind !== 'budget_pace') return null;
  const data = insight.body.data;
  const spent = money(data.spent);
  const budget = money(data.budget);
  const expectedToDate = money(data.expectedToDate);
  const projected = money(data.projected);
  const status = data.status;
  if (!spent || !budget || !expectedToDate || !projected) return null;
  if (status !== 'on_track' && status !== 'ahead' && status !== 'over') return null;
  const excluded = typeof data.excludedCurrencies === 'string' && data.excludedCurrencies ? data.excludedCurrencies.split(',') : [];
  return { spent, budget, expectedToDate, projected, daysLeft: typeof data.daysLeft === 'number' ? data.daysLeft : 0, status: status as PaceStatus, excluded };
}

/** The pace of one budget, or null when the engine produced none for it. */
export function findPace(insights: readonly Insight[], budgetId: string): BudgetPace | null {
  const insight = insights.find((i) => i.kind === 'budget_pace' && i.subject.budgetId === budgetId);
  return insight ? paceFromInsight(insight) : null;
}
