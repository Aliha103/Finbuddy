// apps/mobile/src/features/home/cardOrder.ts
// The order of the readouts on the FinBuddy card, and which one is the hero. Never by size: amounts
// in different currencies cannot be compared without a rate, and FinBuddy never converts (JP¥19,486
// is about US$130, yet its digits outnumber US$251.92's). The profile's currency comes first and is
// the one Readout XL; the others follow grouped by direction, the first readout's direction first
// so the same words run together, then by ISO code. DECISIONS.md (2026-10-12) records the change
// from the direction's "largest first". Pure, so the order is tested without React Native.
import type { CurrencyCode, Money } from '@finbuddy/shared';

import type { ReadoutRole } from '@/design/tokens';

export type Direction = 'owed' | 'owe';

export interface CardReadout {
  readonly money: Money;
  /** "You're owed" or "You owe". A currency that reached zero keeps the direction it had, so it holds its place while it rolls down. */
  readonly direction: Direction;
}

export function directionOf(m: Money): Direction {
  return m.amountMinor >= 0 ? 'owed' : 'owe';
}

/**
 * The card's order: the profile's currency first; then the rest by direction, the first readout's
 * direction first (owed first when the profile's currency has no balance), and by code within each.
 */
export function orderCardReadouts(readouts: readonly CardReadout[], profileCurrency: CurrencyCode | null | undefined): CardReadout[] {
  const home = readouts.find((r) => r.money.currency === profileCurrency);
  const rest = readouts.filter((r) => r !== home);
  const lead: Direction = home?.direction ?? 'owed';
  const rank = (r: CardReadout) => (r.direction === lead ? 0 : 1);
  rest.sort((a, b) => rank(a) - rank(b) || (a.money.currency < b.money.currency ? -1 : a.money.currency > b.money.currency ? 1 : 0));
  return home ? [home, ...rest] : rest;
}

/**
 * The type role of each readout in that order. The profile's currency is the hero (Readout XL) and
 * the rest are Readout M; a single readout is the hero whatever its currency. When the profile's
 * currency has no balance and several others do, none is promoted: all take Readout L, since none
 * is larger than another in any sense the card can show.
 */
export function cardRoles(ordered: readonly CardReadout[], profileCurrency: CurrencyCode | null | undefined): ReadoutRole[] {
  if (ordered.length === 1) return ['readoutXL'];
  const hero = ordered[0]?.money.currency === profileCurrency;
  return ordered.map((_, i) => (hero ? (i === 0 ? 'readoutXL' : 'readoutM') : 'readoutL'));
}
