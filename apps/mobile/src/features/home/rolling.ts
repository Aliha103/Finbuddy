// apps/mobile/src/features/home/rolling.ts
// Keeps a currency on the FinBuddy card for one roll after its balance reaches zero, so the
// readout rolls down to 0 (Roll to Zero) before the row leaves, instead of vanishing mid-figure.
// The zero is derived during render (never in an effect), so the same Readout instance carries
// the figure down: a readout mounted fresh at zero would have nothing to roll from.
import { zero, type CurrencyCode, type Money } from '@finbuddy/shared';
import { useEffect, useState } from 'react';

import { DURATION } from '@/design';

import { directionOf, orderCardReadouts, type CardReadout } from './cardOrder';

/** How long a zeroed currency stays: the roll down, then a beat at 0 so the eye reads it. */
const LINGER = DURATION.readout + DURATION.hold;

const has = (list: readonly { money: Money }[] | readonly Money[], currency: string) =>
  list.some((x) => ('money' in x ? x.money.currency : x.currency) === currency);

/** The card's readouts in the card's order (cardOrder.ts), with currencies that just reached zero lingering at zero. */
export function useCardReadouts(nets: readonly Money[], profileCurrency: CurrencyCode | null | undefined): CardReadout[] {
  const [previous, setPrevious] = useState(nets);
  const [lingering, setLingering] = useState<readonly CardReadout[]>([]);

  // Adjust during render when the balances change (React re-renders before anything is committed).
  if (previous !== nets) {
    const gone = previous.filter((m) => !has(nets, m.currency)).map((m) => ({ money: zero(m.currency), direction: directionOf(m) }));
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

  const live = nets.map((money) => ({ money, direction: directionOf(money) }));
  const kept = lingering.filter((z) => !has(nets, z.money.currency));
  return orderCardReadouts([...live, ...kept], profileCurrency);
}
