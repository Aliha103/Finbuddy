// apps/mobile/src/features/home/rolling.ts
// Keeps a currency on the FinBuddy card for one roll after its balance reaches zero, so the
// readout rolls down to 0 (Roll to Zero) before the row leaves, instead of vanishing mid-figure.
// The zero is derived during render (never in an effect), so the same Readout instance carries
// the figure down: a readout mounted fresh at zero would have nothing to roll from.
import { minorUnits, zero, type Money } from '@finbuddy/shared';
import { useEffect, useState } from 'react';

import { DURATION } from '@/design';

/** How long a zeroed currency stays: the roll down, then a beat at 0 so the eye reads it. */
const LINGER = DURATION.readout + DURATION.hold;

export interface CardReadout {
  readonly money: Money;
  /** The figure's size in major units, for "largest first"; a zeroed currency keeps the rank it had. */
  readonly rank: number;
}

export function majorUnits(m: Money): number {
  return Math.abs(m.amountMinor) / 10 ** minorUnits(m.currency);
}

const has = (list: readonly { money: Money }[] | readonly Money[], currency: string) =>
  list.some((x) => ('money' in x ? x.money.currency : x.currency) === currency);

/** The card's readouts, largest first, with currencies that just reached zero lingering at zero. */
export function useCardReadouts(nets: readonly Money[]): CardReadout[] {
  const [previous, setPrevious] = useState(nets);
  const [lingering, setLingering] = useState<readonly CardReadout[]>([]);

  // Adjust during render when the balances change (React re-renders before anything is committed).
  if (previous !== nets) {
    const gone = previous.filter((m) => !has(nets, m.currency)).map((m) => ({ money: zero(m.currency), rank: majorUnits(m) }));
    setPrevious(nets);
    const kept = lingering.filter((z) => !has(nets, z.money.currency) && !has(gone, z.money.currency));
    if (gone.length > 0 || kept.length !== lingering.length) setLingering([...kept, ...gone]);
  }

  // Each lingering zero leaves after one roll and a beat.
  useEffect(() => {
    if (lingering.length === 0) return;
    const leaving = lingering.map((z) => z.money.currency);
    const timer = setTimeout(() => setLingering((l) => l.filter((z) => !leaving.includes(z.money.currency))), LINGER);
    return () => clearTimeout(timer);
  }, [lingering]);

  const live = nets.map((money) => ({ money, rank: majorUnits(money) }));
  const kept = lingering.filter((z) => !has(nets, z.money.currency));
  return [...live, ...kept].sort((a, b) => b.rank - a.rank || (a.money.currency < b.money.currency ? -1 : 1));
}
