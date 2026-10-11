// apps/mobile/src/features/groups/format.ts
// The sentences only the Groups screens speak. The Formatter, cleanName and the plan sentence live
// in features/common/format.ts.
import type { Expense } from '@finbuddy/shared';

import type { Formatter, Spoken } from '../common/format';

/** "You paid US$213.33 · your share US$53.34", "Devon and Emery paid US$198.50 · your share US$49.63". */
export function paidSummary(f: Formatter, e: Expense): Spoken {
  const payers = e.paidBy.map((p) => f.name(p.personId));
  const who = payers.length === 1 ? `${payers[0]} paid ` : `${payers.slice(0, -1).join(', ')} and ${payers[payers.length - 1]} paid `;
  const myShare = e.splits.find((s) => f.isMe(s.personId));
  if (myShare) return f.say(who, e.total, ' · your share ', myShare.amount);
  return f.say(who, e.total, " · you're not in this split");
}

/** "4 people" / "1 person". */
export function peopleCount(n: number): string {
  return `${n} ${n === 1 ? 'person' : 'people'}`;
}
