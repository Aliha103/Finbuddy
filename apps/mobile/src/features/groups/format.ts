// apps/mobile/src/features/groups/format.ts
// The sentences the Groups screens speak with. Sample people carry " (sample)" in their stored
// names; here the suffix comes off because every sample card and row wears the Sample chip instead,
// so the chip (not the name) is what says "demonstration data".
import type { Expense, Transfer } from '@finbuddy/shared';

import { useDeviceLocale, usePeople, useProfile, type GroupSummary } from '@/data';

import { createFormatter, myNetSentence, type Formatter, type Spoken } from '../common/format';

export const cleanName = (name: string): string => name.replace(/ \(sample\)$/, '');

/** A Formatter whose people are named without the sample suffix. */
export function useGroupFormat(): Formatter {
  const locale = useDeviceLocale();
  const profile = useProfile();
  const people = usePeople();
  const names = new Map<string, { displayName: string }>();
  for (const [id, person] of people) names.set(id, { displayName: cleanName(person.displayName) });
  return createFormatter(locale, profile?.personId ?? null, names);
}

/** "You're owed US$185.92", "You owe £57.55; you owe JP¥21,486" or "Settled up". */
export function groupPosition(f: Formatter, summary: GroupSummary): Spoken {
  if (summary.myNet.length === 0) return f.say("You're settled up in this group");
  const parts = summary.myNet.flatMap((net, i) => (i === 0 ? [myNetSentence(f, net)] : ['; ', myNetSentence(f, net)]));
  return f.say(...parts);
}

/** One step of the plan: "You pay Casey £57.55", "Avery pays you US$135.99", "Devon pays Emery US$60.12". */
export function planSentence(f: Formatter, t: Transfer): Spoken {
  if (f.isMe(t.from)) return f.say('You pay ', f.name(t.to), ' ', t.amount);
  if (f.isMe(t.to)) return f.say(f.name(t.from), ' pays you ', t.amount);
  return f.say(f.name(t.from), ' pays ', f.name(t.to), ' ', t.amount);
}

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

/** First letter of a cleaned name, for the member initials on a card. */
export function initialOf(name: string): string {
  return cleanName(name).trim().charAt(0).toUpperCase();
}
