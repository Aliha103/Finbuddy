// apps/mobile/src/features/insights/severity.ts
// Severity is said in words first (severityLabel in copy.ts) and only then shown in colour:
// a warning in the danger role, a notice in attention, information in the tint.
import type { InsightSeverity } from '@finbuddy/shared';

import type { IconName, SemanticColors } from '@/design';

export function severityStyle(severity: InsightSeverity, colors: SemanticColors): { icon: IconName; color: string } {
  if (severity === 'warning') return { icon: 'warning', color: colors.danger };
  if (severity === 'notice') return { icon: 'error', color: colors.attention };
  return { icon: 'info', color: colors.tint };
}
