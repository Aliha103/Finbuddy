// apps/mobile/src/features/spending/barGeometry.ts
// The month chart's geometry, as plain numbers: one column per month, a bar centred in each,
// heights scaled to the largest month, a 2-point stub for a month with nothing. The month still
// running is marked partial (drawn open: an outline, hatched when it is tall enough), and a month
// the engine flagged with a category spike carries a small marker above its bar, for which the
// layout keeps room at the top. Pure, so the Skia canvas, the plain-View fallback and the tests all
// draw the same picture.
import { isMoney, type Insight, type MonthKey } from '@finbuddy/shared';

/** The month chart's height on Spending, and on a category's screen. */
export const CHART_HEIGHT = { spending: 120, category: 72 } as const;

/**
 * The partial month's marks: an outline this thick, and stripes this far apart and this thick. A bar
 * shorter than `minHeight` has no room for stripes, so it keeps only the outline (the key then says
 * "outlined"); and a partial bar is never shorter than `minOpen`, so its outline still reads as an
 * open box rather than a solid stub.
 */
export const HATCH = { gap: 6, stroke: 1.5, outline: 1.5, minHeight: 10, minOpen: 6 } as const;

/** How the month still running is drawn: hatched (outline and stripes) or, when too short for stripes, outlined. */
export type PartialMark = 'hatched' | 'outlined';

/** The spike marker: a small triangle pointing up, `gap` above its bar. */
export const SPIKE_MARKER = { width: 8, height: 6, gap: 3 } as const;

export interface SpikeMarker {
  /** The apex's x, centred over the bar. */
  readonly cx: number;
  /** The apex's y. */
  readonly top: number;
  /** The base's y. */
  readonly bottom: number;
  readonly halfWidth: number;
}

export interface Bar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** The month had no spending: the bar is only the stub. */
  readonly zero: boolean;
  /** The month is still running (the current month) and has spending: drawn open, never as a finished month. */
  readonly partial: boolean;
  /** A partial bar tall enough for stripes (else only its outline is drawn). */
  readonly hatched: boolean;
  /** The engine flagged a category spike in this month. */
  readonly spike: SpikeMarker | null;
}

export interface BarsLayout {
  readonly bars: readonly Bar[];
  /** The y of the baseline the bars stand on (the drawing's height). */
  readonly baseline: number;
  /** The width of one month's column. */
  readonly column: number;
}

export interface BarsLayoutOptions {
  /** Space kept between neighbouring bars. */
  readonly gap?: number;
  readonly maxBarWidth?: number;
  /** Height drawn for a month with nothing, so "nothing" is visible. */
  readonly stub?: number;
  /** The month still running, by index; -1 or absent for none. */
  readonly partialIndex?: number;
  /** Months flagged with a spike, by index. Any flag keeps room above the tallest bar for its marker. */
  readonly spikes?: readonly boolean[];
}

export function layoutBars(values: readonly number[], width: number, height: number, options: BarsLayoutOptions = {}): BarsLayout {
  const count = values.length;
  if (count === 0 || width <= 0 || height <= 0) return { bars: [], baseline: Math.max(0, height), column: 0 };
  const gap = options.gap ?? 8;
  const stub = options.stub ?? 2;
  const spikes = options.spikes ?? [];
  const headroom = spikes.some(Boolean) ? SPIKE_MARKER.height + SPIKE_MARKER.gap : 0;
  const column = width / count;
  const barWidth = Math.max(4, Math.min(options.maxBarWidth ?? 28, column - gap));
  const max = values.reduce((m, v) => (v > m ? v : m), 0);
  const usable = height - stub - headroom;
  const bars = values.map((value, i): Bar => {
    const zero = value <= 0;
    const partial = i === options.partialIndex && !zero;
    const scaled = max > 0 && value > 0 ? Math.max(stub, Math.round((value / max) * usable)) : stub;
    // A partial bar keeps room inside its outline, so even the first days of a month read as open.
    const h = partial ? Math.min(Math.max(scaled, HATCH.minOpen), Math.max(stub, usable)) : scaled;
    const x = Math.round(i * column + (column - barWidth) / 2);
    const y = height - h;
    const bottom = y - SPIKE_MARKER.gap;
    const spike = spikes[i] ? { cx: x + barWidth / 2, top: bottom - SPIKE_MARKER.height, bottom, halfWidth: SPIKE_MARKER.width / 2 } : null;
    return { x, y, width: barWidth, height: h, zero, partial, hatched: partial && h >= HATCH.minHeight, spike };
  });
  return { bars, baseline: height, column };
}

/** How the month still running is drawn in a chart this tall, for the key; null when it has no bar to mark (nothing spent yet). */
export function partialMark(values: readonly number[], partialIndex: number, height: number, spikes?: readonly boolean[]): PartialMark | null {
  const bar = layoutBars(values, 1, height, { partialIndex, spikes }).bars[partialIndex];
  return bar?.partial ? (bar.hatched ? 'hatched' : 'outlined') : null;
}

/** The column under a horizontal position; clamped, so a finger past the edge reads the end month. */
export function indexAtX(x: number, width: number, count: number): number {
  'worklet';
  if (count <= 0 || width <= 0) return 0;
  const i = Math.floor((x / width) * count);
  return i < 0 ? 0 : i >= count ? count - 1 : i;
}

/**
 * What each month's column shows besides its bar's colour. The selection must read without colour
 * (the tint and the data mark are only 2.3:1 apart in light, 2.7:1 in dark), so the selected
 * month's label sits in a tint pill, the only label with emphasis; the month still running is drawn
 * open (outlined, hatched when tall enough); a spike carries a marker.
 */
export interface MonthCue {
  readonly month: MonthKey;
  /** Drawn with the label in a tint pill (onTint text): the selection's cue beyond colour. */
  readonly selected: boolean;
  readonly partial: boolean;
  readonly spike: boolean;
}

export function monthCues(months: readonly MonthKey[], selected: MonthKey, current: MonthKey, spikes: ReadonlySet<MonthKey>): MonthCue[] {
  return months.map((month) => ({ month, selected: month === selected, partial: month === current, spike: spikes.has(month) }));
}

/**
 * The months the engine flagged with a category spike, in one currency (and one category, for a
 * category's own chart). The engine flags the month it computed for (body.data.month).
 */
export function spikeMonths(insights: readonly Insight[], currency: string, categoryId?: string): ReadonlySet<MonthKey> {
  const months = new Set<MonthKey>();
  for (const insight of insights) {
    if (insight.kind !== 'category_spike') continue;
    const { month, current } = insight.body.data;
    if (typeof month !== 'string' || !isMoney(current) || current.currency !== currency) continue;
    if (categoryId !== undefined && insight.subject.categoryId !== categoryId) continue;
    months.add(month);
  }
  return months;
}

/** What every renderer of the chart receives. */
export interface BarsDrawingProps {
  readonly layout: BarsLayout;
  readonly width: number;
  readonly height: number;
  readonly selectedIndex: number;
  /** Every month's bar: the data-mark neutral. */
  readonly barColor: string;
  /** The selected month's bar: the tint (a selection is a state of action). */
  readonly selectedColor: string;
  readonly baselineColor: string;
  /** The spike marker's colour (attention). */
  readonly markerColor: string;
  readonly radius?: number;
}

