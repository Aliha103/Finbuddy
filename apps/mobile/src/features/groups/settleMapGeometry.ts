// apps/mobile/src/features/groups/settleMapGeometry.ts
// The SettleMap's layout, kept pure so it is testable and shared by the Skia arcs and the text
// chips: members are stations on a rail, every transfer is an arc from payer to payee whose height
// grows with the distance between them. "All debts" (pairwiseDebts) and "Fewest payments"
// (simplifyDebts) are the two states; each slot has geometry in both, collapsed to the payer's
// station when absent, so one progress value morphs every arc. The amount chips are placed per
// state (placeChips): each sits on its own arc, at the apex when it is free, otherwise slid along the
// arc to the nearest place that touches no other chip and stays above the stations, or, in a crowded
// map, lifted straight above its apex.
import type { Money, PersonId, Transfer } from '@finbuddy/shared';

export const RAIL_INSET = 36;
export const RING_R = 10;
export const ARC_STROKE = 3;
export const CHIP_HEIGHT = 24;
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

/** How much higher each further station span reaches: apexes a chip and a gap apart. */
const SPAN_STEP = 40;

/** Control-point height for a transfer spanning `span` stations. */
export function arcHeight(span: number): number {
  return 40 + SPAN_STEP * span;
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

/** A point on a slot's arc at parameter t (0 at the payer, 0.5 at the apex, 1 at the payee). */
export function arcPoint(g: ArcGeometry, railY: number, t: number): { x: number; y: number } {
  const u = 1 - t;
  return { x: g.x0 * (u * u * u + 3 * u * u * t) + g.x1 * (3 * u * t * t + t * t * t), y: railY - 3 * g.h * t * u };
}

export interface ChipRequest {
  readonly id: string;
  /** The arc the chip rides, in the state being placed. */
  readonly g: ArcGeometry;
  /** The chip's width (measured, or estimated until it is). */
  readonly width: number;
}

export interface ChipPlace {
  /** The chip's centre. */
  readonly x: number;
  readonly y: number;
}

/** Where along its arc a chip may sit, best first: the apex, then outward in both directions. */
const CANDIDATES = [0.5, 0.42, 0.58, 0.35, 0.65, 0.28, 0.72, 0.22, 0.78];
/** Clear space kept between two chips. */
const CHIP_GAP = 4;

/** Rough chip width before it is measured: caption digits plus the chip's padding and border. */
export function estimateChipWidth(text: string): number {
  return Math.ceil(text.length * 7.2 + 2 * 8 + 3);
}

/** How many chip rows a crowded chip may be lifted above its apex. */
const LIFTS = 4;

/**
 * Places one state's amount chips so that no two overlap and none sits on a station: short arcs
 * first (they have the least room), each at the first free candidate along its arc, then straight
 * above its apex, kept inside the canvas and above the rings. When nothing is free (a very crowded
 * group in a narrow card), the candidate with the least overlap wins.
 */
export function placeChips(requests: readonly ChipRequest[], railY: number, width: number): Map<string, ChipPlace> {
  const placed: { id: string; x: number; y: number; w: number }[] = [];
  const lowest = railY - RING_R - CHIP_GAP - CHIP_HEIGHT / 2;
  const order = [...requests].sort((a, b) => a.g.h - b.g.h || Math.min(a.g.x0, a.g.x1) - Math.min(b.g.x0, b.g.x1));
  const overlap = (x: number, y: number, w: number) => {
    let area = 0;
    for (const p of placed) {
      const dx = (w + p.w) / 2 + CHIP_GAP - Math.abs(x - p.x);
      const dy = CHIP_HEIGHT + CHIP_GAP - Math.abs(y - p.y);
      if (dx > 0 && dy > 0) area += dx * dy;
    }
    return area;
  };
  for (const r of order) {
    let best: { x: number; y: number; area: number } | null = null;
    const apex = arcPoint(r.g, railY, 0.5);
    const candidates = [
      ...CANDIDATES.map((t) => arcPoint(r.g, railY, t)).filter((pt, i) => i === 0 || pt.y <= lowest),
      ...Array.from({ length: LIFTS }, (_, k) => apex.y - (k + 1) * (CHIP_HEIGHT + CHIP_GAP))
        .filter((y) => y >= CHIP_HEIGHT / 2)
        .flatMap((y) => [0, -0.5, 0.5].map((dx) => ({ x: apex.x + dx * r.width, y }))),
    ];
    for (const pt of candidates) {
      const x = Math.min(Math.max(pt.x, r.width / 2), Math.max(r.width / 2, width - r.width / 2));
      const y = Math.min(pt.y, lowest);
      const area = overlap(x, y, r.width);
      if (!best || area < best.area) best = { x, y, area };
      if (area === 0) break;
    }
    const at = best ?? { x: (r.g.x0 + r.g.x1) / 2, y: railY - 0.75 * r.g.h };
    placed.push({ id: r.id, x: at.x, y: at.y, w: r.width });
  }
  return new Map(placed.map((p) => [p.id, { x: p.x, y: p.y }]));
}
