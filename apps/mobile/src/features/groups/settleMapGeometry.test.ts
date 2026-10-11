// The settle map's chip placement: in either state, no two amount chips overlap and none sits on
// the stations, for groups up to the sample's dinner club (4 people, 6 debts); a crowded larger group
// keeps far fewer overlaps than chips at their apexes would.
import type { Money, Transfer } from '@finbuddy/shared';
import { describe, expect, it } from 'vitest';

import { CHIP_HEIGHT, RING_R, arcPoint, buildSlots, layoutStations, mapMetrics, placeChips } from './settleMapGeometry';

const money = (n: number): Money => ({ amountMinor: n, currency: 'USD' });
const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);
/** Every pair owes (debts in "all"), and a chain in "fewest". */
function transfers(ids: readonly string[]): { all: Transfer[]; fewest: Transfer[] } {
  const all = ids.flatMap((a, i) => ids.slice(i + 1).map((b, j) => ({ from: a, to: b, amount: money(1000 + 137 * (i + j)) })));
  const fewest = ids.slice(1).map((b, i) => ({ from: ids[i]!, to: b, amount: money(6012 + i) }));
  return { all, fewest };
}

function overlaps(places: { x: number; y: number; w: number }[]): number {
  let n = 0;
  for (let i = 0; i < places.length; i++)
    for (let j = i + 1; j < places.length; j++) {
      const a = places[i]!;
      const b = places[j]!;
      if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < CHIP_HEIGHT) n++;
    }
  return n;
}

describe('placeChips', () => {
  it('puts a lone chip at its apex', () => {
    const stations = layoutStations(['a', 'b'], 326);
    const [slot] = buildSlots([{ from: 'a', to: 'b', amount: money(100) } as Transfer], [], stations);
    const { railY } = mapMetrics(2);
    const at = placeChips([{ id: 'x', g: slot!.a, width: 80 }], railY, 326).get('x')!;
    const apex = arcPoint(slot!.a, railY, 0.5);
    expect(at.x).toBeCloseTo(apex.x);
    expect(at.y).toBeCloseTo(apex.y);
  });

  const place = (n: number, state: 'a' | 'b') => {
    const ids = people(n);
    const width = 326;
    const stations = layoutStations(ids, width);
    const { all, fewest } = transfers(ids);
    const slots = buildSlots(all, fewest, stations);
    const { railY } = mapMetrics(n);
    const reqs = slots.filter((s) => (state === 'a' ? s.amountA : s.amountB)).map((s) => ({ id: s.key, g: s[state], width: 84 }));
    const placed = placeChips(reqs, railY, width);
    const boxes = reqs.map((r) => ({ ...placed.get(r.id)!, w: r.width }));
    const apexes = reqs.map((r) => ({ ...arcPoint(r.g, railY, 0.5), w: r.width }));
    return { boxes, apexes, railY, width };
  };

  for (const n of [3, 4]) {
    it(`keeps ${n} people's chips apart and above the stations at phone width, in both states`, () => {
      for (const state of ['a', 'b'] as const) {
        const { boxes, railY, width } = place(n, state);
        expect(overlaps(boxes)).toBe(0);
        for (const b of boxes) {
          expect(b.y + CHIP_HEIGHT / 2).toBeLessThanOrEqual(railY - RING_R);
          expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0);
          expect(b.x + b.w / 2).toBeLessThanOrEqual(width);
        }
      }
    });
  }

  for (const n of [5, 6]) {
    it(`in a crowded ${n}-person map every debt between everyone overlaps far less than at the apexes, inside the card and above the stations`, () => {
      const { boxes, apexes, railY, width } = place(n, 'a');
      expect(overlaps(boxes)).toBeLessThan(overlaps(apexes) / 3);
      for (const b of boxes) {
        expect(b.y + CHIP_HEIGHT / 2).toBeLessThanOrEqual(railY - RING_R);
        expect(b.y - CHIP_HEIGHT / 2).toBeGreaterThanOrEqual(0);
        expect(b.x - b.w / 2).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w / 2).toBeLessThanOrEqual(width);
      }
      expect(overlaps(place(n, 'b').boxes)).toBe(0);
    });
  }
});
