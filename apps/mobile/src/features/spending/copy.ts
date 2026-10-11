// apps/mobile/src/features/spending/copy.ts
// The sentences the spending screens speak: a month's change against the one before, in words
// ("Up 68% (£829.50) from September"), and a budget's pace ("£159.50 of £200.00, 20 days left,
// ahead of pace"). Every amount goes through the Formatter, so it carries its currency and has a
// spoken form; nothing here invents a figure.
import { addMonths, type Money, type MonthChange, type MonthKey } from '@finbuddy/shared';

import type { Formatter, Spoken } from '@/features/common/format';

/** "October" or "Oct" in the device locale. */
export function monthName(locale: string, month: MonthKey, style: 'long' | 'short' = 'long'): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00.000Z`));
  } catch {
    return month;
  }
}

const abs = (m: Money): Money => (m.amountMinor < 0 ? { amountMinor: -m.amountMinor, currency: m.currency } : m);

/**
 * A month against the one before, in words. Sentences end without a full stop so they can sit
 * under a readout as a caption.
 */
export function changeInWords(f: Formatter, change: MonthChange): Spoken {
  const previous = monthName(f.locale, addMonths(change.month, -1));
  if (!change.previous || !change.change) return f.say(`No ${previous} figures to compare with`);
  if (change.current.amountMinor === 0 && change.previous.amountMinor === 0) return f.say(`Nothing in ${previous} either`);
  if (change.change.amountMinor === 0) return f.say(`The same as ${previous}`);
  const up = change.change.amountMinor > 0;
  const amount = abs(change.change);
  if (change.changeRatio === null) return f.say('Up ', amount, ` from nothing in ${previous}`);
  // A change that rounds to 0% is "about the same", not "up 0%".
  if (Math.round(Math.abs(change.changeRatio) * 100) === 0) return f.say(`About the same as ${previous} (`, up ? 'up ' : 'down ', amount, ')');
  return f.say(up ? 'Up ' : 'Down ', f.percent(Math.abs(change.changeRatio)), ' (', amount, `) from ${previous}`);
}

export type PaceStatus = 'on_track' | 'ahead' | 'over';

export interface BudgetPace {
  readonly spent: Money;
  readonly budget: Money;
  readonly expectedToDate: Money;
  readonly projected: Money;
  readonly daysLeft: number;
  readonly status: PaceStatus;
  /** Currencies with spending this month that the budget does not count (never mixed in). */
  readonly excluded: readonly string[];
}

/** The status in words; the words, not a colour, carry the state. */
export function paceWords(status: PaceStatus): string {
  return status === 'over' ? 'over budget' : status === 'ahead' ? 'ahead of pace' : 'on pace';
}

/** "£159.50 of £200.00, 20 days left, ahead of pace" */
export function paceSentence(f: Formatter, pace: BudgetPace): Spoken {
  const days = pace.daysLeft === 1 ? '1 day left' : `${pace.daysLeft} days left`;
  return f.say(pace.spent, ' of ', pace.budget, `, ${days}, ${paceWords(pace.status)}`);
}

/** The engine's excludedCurrencies, in the direction's words; null when nothing was left out. */
export function excludedNote(excluded: readonly string[]): string | null {
  if (excluded.length === 0) return null;
  const list = excluded.length === 1 ? excluded[0] : `${excluded.slice(0, -1).join(', ')} and ${excluded[excluded.length - 1]}`;
  return `Spending in ${list} is not counted, currencies are never mixed`;
}

/** "3 expenses", "1 expense" */
export function expenseCount(n: number): string {
  return `${n} ${n === 1 ? 'expense' : 'expenses'}`;
}
