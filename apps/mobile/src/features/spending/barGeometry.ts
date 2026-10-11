// apps/mobile/src/features/spending/barGeometry.ts
// The month chart's geometry, as plain numbers: one column per month, a bar centred in each,
// heights scaled to the largest month, a 2-point stub for a month with nothing. Pure, so the Skia
// canvas, the plain-View fallback and the tests all draw the same picture.

export interface Bar {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** The month had no spending: the bar is only the stub. */
  readonly zero: boolean;
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
}

export function layoutBars(values: readonly number[], width: number, height: number, options: BarsLayoutOptions = {}): BarsLayout {
  const count = values.length;
  if (count === 0 || width <= 0 || height <= 0) return { bars: [], baseline: Math.max(0, height), column: 0 };
  const gap = options.gap ?? 8;
  const stub = options.stub ?? 2;
  const column = width / count;
  const barWidth = Math.max(4, Math.min(options.maxBarWidth ?? 28, column - gap));
  const max = values.reduce((m, v) => (v > m ? v : m), 0);
  const usable = height - stub;
  const bars = values.map((value, i) => {
    const h = max > 0 && value > 0 ? Math.max(stub, Math.round((value / max) * usable)) : stub;
    return { x: Math.round(i * column + (column - barWidth) / 2), y: height - h, width: barWidth, height: h, zero: value <= 0 };
  });
  return { bars, baseline: height, column };
}

/** The column under a horizontal position; clamped, so a finger past the edge reads the end month. */
export function indexAtX(x: number, width: number, count: number): number {
  'worklet';
  if (count <= 0 || width <= 0) return 0;
  const i = Math.floor((x / width) * count);
  return i < 0 ? 0 : i >= count ? count - 1 : i;
}

/** What every renderer of the chart receives. */
export interface BarsDrawingProps {
  readonly layout: BarsLayout;
  readonly width: number;
  readonly height: number;
  readonly selectedIndex: number;
  /** The bar colour (the tint). */
  readonly barColor: string;
  /** Opacity of the months that are not selected. */
  readonly mutedOpacity: number;
  readonly baselineColor: string;
  readonly radius?: number;
}
