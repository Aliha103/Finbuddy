// apps/mobile/src/features/groups/settleMapGeometry.ts
// The SettleMap's layout, kept pure so it is testable and shared by the Skia arcs and the text
// chips: members are stations on a rail, every transfer is an arc from payer to payee whose height
// grows with the distance between them. "All debts" (pairwiseDebts) and "Fewest payments"
// (simplifyDebts) are the two states; each slot has geometry in both, collapsed to the payer's
// station when absent, so one progress value morphs every arc.
import type { Money, PersonId, Transfer } from '@finbuddy/shared';

export const RAIL_INSET = 36;
export const RING_R = 10;
export const ARC_STROKE = 3;
export const CHIP_HEIGHT = 24;
export const CHIP_WIDTH = 92;
export const LABEL_HEIGHT = 20;
const TOP = 20;

export interface ArcGeometry {
  readonly x0: number;
  readonly x1: number;
  /** Height of the control points above the rail; the apex sits at 0.75 h. */
  readonly h: number;
  /** 1 when the transfer exists in this state, 0 when it collapses. */
  readonly present: number;
}

export interface ArcSlot {
  readonly key: string;
  readonly from: PersonId;
  readonly to: PersonId;
  /** Geometry in the "all debts" state. */
  readonly a: ArcGeometry;
  /** Geometry in the "fewest payments" state. */
  readonly b: ArcGeometry;
  readonly amountA: Money | null;
  readonly amountB: Money | null;
}

export interface Station {
  readonly id: PersonId;
  readonly x: number;
}

export const transferKey = (t: Transfer): string => `${t.from}>${t.to}`;

/** Control-point height for a transfer spanning `span` stations. */
export function arcHeight(span: number): number {
  return 40 + 30 * span;
}

/** Where the rail sits and how tall the canvas is for `memberCount` stations. */
export function mapMetrics(memberCount: number): { railY: number; height: number } {
  const maxH = arcHeight(Math.max(1, memberCount - 1));
  const railY = TOP + 0.75 * maxH + CHIP_HEIGHT / 2 + RING_R;
  return { railY, height: Math.ceil(railY + RING_R + 6 + LABEL_HEIGHT + 4) };
}

export function layoutStations(memberIds: readonly PersonId[], width: number): Station[] {
  const n = memberIds.length;
  const step = n > 1 ? (width - 2 * RAIL_INSET) / (n - 1) : 0;
  return memberIds.map((id, i) => ({ id, x: n > 1 ? RAIL_INSET + i * step : width / 2 }));
}

function geometry(t: Transfer | undefined, from: PersonId, xs: ReadonlyMap<PersonId, number>, idx: ReadonlyMap<PersonId, number>): ArcGeometry {
  if (!t) {
    const x = xs.get(from) ?? 0;
    return { x0: x, x1: x, h: 0, present: 0 };
  }
  const span = Math.abs((idx.get(t.to) ?? 0) - (idx.get(t.from) ?? 0));
  return { x0: xs.get(t.from) ?? 0, x1: xs.get(t.to) ?? 0, h: arcHeight(span), present: 1 };
}

/** One slot per payer→payee pair that appears in either state, in a stable order. */
export function buildSlots(all: readonly Transfer[], minimal: readonly Transfer[], stations: readonly Station[]): ArcSlot[] {
  const xs = new Map(stations.map((s) => [s.id, s.x] as const));
  const idx = new Map(stations.map((s, i) => [s.id, i] as const));
  const keys = new Map<string, { from: PersonId; to: PersonId }>();
  for (const t of [...all, ...minimal]) keys.set(transferKey(t), { from: t.from, to: t.to });
  return [...keys.entries()].map(([key, { from, to }]) => {
    const inAll = all.find((t) => transferKey(t) === key);
    const inMin = minimal.find((t) => transferKey(t) === key);
    return { key, from, to, a: geometry(inAll, from, xs, idx), b: geometry(inMin, from, xs, idx), amountA: inAll?.amount ?? null, amountB: inMin?.amount ?? null };
  });
}

/** Linear blend of a slot's two geometries at progress p (0 = all debts, 1 = fewest payments). */
export function blend(slot: ArcSlot, p: number): ArcGeometry {
  'worklet';
  return {
    x0: slot.a.x0 + (slot.b.x0 - slot.a.x0) * p,
    x1: slot.a.x1 + (slot.b.x1 - slot.a.x1) * p,
    h: slot.a.h + (slot.b.h - slot.a.h) * p,
    present: slot.a.present + (slot.b.present - slot.a.present) * p,
  };
}
