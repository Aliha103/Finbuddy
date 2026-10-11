// apps/mobile/src/features/insights/severity.ts
// Severity is carried by the leading icon's shape and its spoken label (severityLabel in copy.ts),
// then by colour. A warning and a notice are attention amber (a triangle and a circle); red stays
// reserved for overdue, failure and destructive actions, and the tint for the FinBuddy card,
// filled buttons, links and the active tab (DECISIONS.md), so information is a quiet grey.
import type { InsightSeverity } from '@finbuddy/shared';

import type { IconName, SemanticColors } from '@/design';

import { severityLabel } from './copy';

export function severityStyle(severity: InsightSeverity, colors: SemanticColors): { icon: IconName; color: string; label: string } {
  const label = severityLabel(severity);
  if (severity === 'warning') return { icon: 'warning', color: colors.attention, label };
  if (severity === 'notice') return { icon: 'error', color: colors.attention, label };
  return { icon: 'info', color: colors.labelSecondary, label };
}
