// apps/mobile/src/features/expense/splitMath.ts
// The split bar's maths, kept pure so the UI thread can run it inside gesture worklets and so it
// can be tested without React: moving a boundary between two neighbours in whole minor units, a
// worklet-safe decimal formatter (no Intl on the UI thread), and the "+1" remainder tick, which
// marks the people the engine's largest-remainder allocation gave the leftover minor unit to.
import { allocateMinor, formatMoneyToParts, minorUnits, type CurrencyCode, type PersonId, type Split, type SplitSpec } from '@finbuddy/shared';

/** What a worklet needs to print an amount the way formatMoney would, without Intl. */
export interface MoneyFormatSpec {
  readonly decimals: number;
  readonly decimal: string;
  readonly group: string;
  /** Everything formatMoney puts before the first digit ("£", "US$"). */
  readonly prefix: string;
  /** Everything after the last digit (" €", " kr"). */
  readonly suffix: string;
}

const NUMERIC = new Set(['integer', 'group', 'decimal', 'fraction']);

/** Derives the spec from the engine's own formatting of a sample figure, so symbol side, separators and minor units agree with every other readout. */
export function moneyFormatSpec(currency: CurrencyCode, locale: string): MoneyFormatSpec {
  const decimals = minorUnits(currency);
  const scale = 10 ** decimals;
  // 1,234,567.50 (or 1,234,567 for a zero-decimal currency): long enough to show a group separator.
  const sample = 1_234_567 * scale + (decimals > 0 ? 5 * 10 ** (decimals - 1) : 0);
  const parts = formatMoneyToParts({ amountMinor: sample, currency }, { locale });
  const first = parts.findIndex((p) => p.type === 'integer');
  let last = -1;
  parts.forEach((p, i) => {
    if (NUMERIC.has(p.type)) last = i;
  });
  const prefix = first > 0 ? parts.slice(0, first).map((p) => p.value).join('') : '';
  const suffix = last >= 0 && last < parts.length - 1 ? parts.slice(last + 1).map((p) => p.value).join('') : '';
  return {
    decimals,
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
    group: parts.find((p) => p.type === 'group')?.value ?? '',
    prefix,
    suffix,
  };
}

/** Formats minor units with a MoneyFormatSpec. Runs on the UI thread during a drag. */
export function formatMinorWorklet(minor: number, spec: MoneyFormatSpec): string {
  'worklet';
  const rounded = Math.round(minor);
  const negative = rounded < 0;
  const abs = negative ? -rounded : rounded;
  const scale = Math.pow(10, spec.decimals);
  const whole = Math.floor(abs / scale);
  const frac = abs - whole * scale;
  const digits = String(whole);
  let grouped = '';
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 === 0) grouped += spec.group;
    grouped += digits.charAt(i);
  }
  let fraction = '';
  if (spec.decimals > 0) {
    let f = String(frac);
    while (f.length < spec.decimals) f = '0' + f;
    fraction = spec.decimal + f;
  }
  return (negative ? '-' : '') + spec.prefix + grouped + fraction + spec.suffix;
}

/**
 * Moves the boundary between parts[index] and parts[index + 1] by `deltaMinor` (positive moves it
 * right, giving the left person more). Both neighbours clamp at zero and their sum never changes,
 * so the bar's total is exactly what it was.
 */
export function moveBoundary(parts: readonly number[], index: number, deltaMinor: number): number[] {
  'worklet';
  const next = parts.slice();
  if (index < 0 || index >= parts.length - 1) return next;
  const left = parts[index] ?? 0;
  const right = parts[index + 1] ?? 0;
  const pair = left + right;
  const wanted = left + Math.round(deltaMinor);
  const nextLeft = wanted < 0 ? 0 : wanted > pair ? pair : wanted;
  next[index] = nextLeft;
  next[index + 1] = pair - nextLeft;
  return next;
}

/**
 * Snaps the left share of a moved boundary to a multiple of `stepMinor` (whole pounds, whole yen,
 * or a coarser round step on a narrow bar), so a drag lands on round amounts; the right neighbour
 * takes the odd minor units. Shares already at a clamp (zero, or the whole pair) stay there.
 */
export function snapBoundary(parts: readonly number[], index: number, stepMinor: number): number[] {
  'worklet';
  const next = parts.slice();
  if (index < 0 || index >= parts.length - 1 || stepMinor <= 1) return next;
  const left = parts[index] ?? 0;
  const pair = left + (parts[index + 1] ?? 0);
  if (left === 0 || left === pair) return next;
  const snapped = Math.round(left / stepMinor) * stepMinor;
  const clamped = snapped < 0 ? 0 : snapped > pair ? pair : snapped;
  next[index] = clamped;
  next[index + 1] = pair - clamped;
  return next;
}

/**
 * The drag's step: one major unit of the currency (100 minor units for GBP, 1 for JPY), coarsened
 * along 1-2-5 when one unit would be under `minPoints` of finger travel on this bar.
 */
export function dragStep(decimals: number, denominatorMinor: number, barWidth: number, minPoints = 6): number {
  const unit = 10 ** decimals;
  if (denominatorMinor <= 0 || barWidth <= 0) return unit;
  const pointsPerMinor = barWidth / denominatorMinor;
  const factors = [1, 2, 5];
  for (let power = 0; power < 15; power++) {
    for (const f of factors) {
      const step = unit * f * 10 ** power;
      if (step * pointsPerMinor >= minPoints) return step;
    }
  }
  return unit;
}

/** '#RRGGBB' mixed toward another colour: t = 1 is `a`, 0 is `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    const n = m ? parseInt(m[1] ?? '0', 16) : 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
  };
  const ca = parse(a);
  const cb = parse(b);
  const out = ca.map((v, i) => Math.round(v * t + (cb[i] ?? 0) * (1 - t)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  const n = m ? parseInt(m[1] ?? '0', 16) : 0;
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/**
 * A person's colour in the split: the line colour at full strength for every other person, and a
 * lighter mix between them, toward white in both schemes so the lighter segments stand off a dark
 * card as well as a light one.
 */
export function shareColour(fill: string, index: number, scheme: 'light' | 'dark'): string {
  return index % 2 === 0 ? fill : mixHex(fill, '#FFFFFF', scheme === 'dark' ? 0.5 : 0.6);
}

/** WCAG contrast ratio between two '#RRGGBB' colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Of the candidates, the one that reads best on `background`. */
export function bestOn(background: string, candidates: readonly string[]): string {
  return [...candidates].sort((x, y) => contrast(y, background) - contrast(x, background))[0] ?? '#000000';
}

/**
 * Gives person `index` `stepMinor` more (or less, when negative) at the expense of a neighbour:
 * the next person, or the previous one for the last segment. Used by the accessibility actions.
 */
export function adjustShare(parts: readonly number[], index: number, stepMinor: number): number[] {
  if (parts.length < 2 || index < 0 || index >= parts.length) return parts.slice();
  if (index < parts.length - 1) return moveBoundary(parts, index, stepMinor);
  return moveBoundary(parts, index - 1, -stepMinor);
}

/** "33.33" or 12.5 -> integer weights at a common scale, or null when a weight is not a plain non-negative decimal. */
function integerWeights(weights: readonly (number | string)[]): bigint[] | null {
  const matches = weights.map((w) => /^(\d+)(?:\.(\d+))?$/.exec(String(w).trim()));
  if (matches.some((m) => m === null)) return null;
  const decimals = Math.max(0, ...matches.map((m) => m?.[2]?.length ?? 0));
  return matches.map((m) => BigInt((m?.[1] ?? '0') + (m?.[2] ?? '').padEnd(decimals, '0')));
}

/**
 * The people carrying the leftover minor unit: those whose resolved share is above the plain
 * floor of their proportional part. For £100 split three ways that is the first person (33.34).
 * Typed exact amounts have no leftover, except when they are exactly the even split (which is what
 * Exact starts from): then the same people carry it as in Equally.
 */
export function remainderCarriers(spec: SplitSpec, resolved: readonly Split[], totalMinor: number): ReadonlySet<PersonId> {
  const out = new Set<PersonId>();
  const amount = new Map(resolved.map((s) => [s.personId, s.amount.amountMinor]));
  const over = (id: PersonId, base: number | bigint) => {
    const got = amount.get(id);
    if (got === undefined) return false;
    return typeof base === 'bigint' ? BigInt(got) > base : got > base;
  };
  switch (spec.type) {
    case 'exact': {
      const n = spec.amounts.length;
      if (n === 0 || totalMinor <= 0) return out;
      const even = allocateMinor(totalMinor, spec.amounts.map(() => 1));
      if (!spec.amounts.every((a, i) => a.amountMinor === even[i])) return out;
      const base = Math.floor(totalMinor / n);
      for (const a of spec.amounts) if (over(a.personId, base)) out.add(a.personId);
      return out;
    }
    case 'equal': {
      const n = spec.participants.length;
      if (n === 0) return out;
      const base = Math.floor(totalMinor / n);
      for (const id of spec.participants) if (over(id, base)) out.add(id);
      return out;
    }
    case 'adjustment': {
      const n = spec.adjustments.length;
      if (n === 0) return out;
      const adjusted = spec.adjustments.reduce((acc, a) => acc + a.adjustmentMinor, 0);
      const base = Math.floor((totalMinor - adjusted) / n);
      for (const a of spec.adjustments) if (over(a.personId, base + a.adjustmentMinor)) out.add(a.personId);
      return out;
    }
    case 'percentage':
    case 'shares': {
      const entries = spec.type === 'percentage' ? spec.percentages.map((p) => ({ id: p.personId, w: p.percent })) : spec.shares.map((s) => ({ id: s.personId, w: s.shares }));
      const ints = integerWeights(entries.map((e) => e.w));
      if (!ints) return out;
      const sum = ints.reduce((acc, w) => acc + w, 0n);
      if (sum === 0n) return out;
      const total = BigInt(Math.trunc(totalMinor));
      entries.forEach((e, i) => {
        if (over(e.id, (total * (ints[i] ?? 0n)) / sum)) out.add(e.id);
      });
      return out;
    }
  }
}
