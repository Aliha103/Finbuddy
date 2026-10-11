// apps/mobile/src/features/home/rolling.ts
// Keeps a currency on the FinBuddy card for one roll after its balance reaches zero, so the
// readout rolls down to 0 (Roll to Zero) before the row leaves, instead of vanishing mid-figure.
import { minorUnits, zero, type Money } from '@finbuddy/shared';
import { useEffect, useRef, useState } from 'react';

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

/** The card's readouts, largest first, with currencies that just reached zero lingering at zero. */
export function useCardReadouts(nets: readonly Money[]): CardReadout[] {
  const [lingering, setLingering] = useState<CardReadout[]>([]);
  const previous = useRef<readonly Money[]>(nets);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const gone = previous.current.filter((m) => !nets.some((n) => n.currency === m.currency));
    previous.current = nets;
    if (gone.length === 0) return;
    const zeros = gone.map((m) => ({ money: zero(m.currency), rank: majorUnits(m) }));
    setLingering((l) => [...l.filter((x) => !zeros.some((z) => z.money.currency === x.money.currency)), ...zeros]);
    const t = setTimeout(() => setLingering((l) => l.filter((x) => !zeros.some((z) => z.money.currency === x.money.currency))), LINGER);
    timers.current.push(t);
  }, [nets]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const live = nets.map((money) => ({ money, rank: majorUnits(money) }));
  const kept = lingering.filter((z) => !nets.some((n) => n.currency === z.money.currency));
  return [...live, ...kept].sort((a, b) => b.rank - a.rank || (a.money.currency < b.money.currency ? -1 : 1));
}
