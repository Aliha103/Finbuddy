// apps/mobile/src/design/color.ts
// Colour arithmetic on '#RRGGBB' strings: WCAG contrast, mixing, picking the readable label for a
// fill, and lifting a drawn stroke to 3:1. Pure functions (no React Native), so they run in tests
// and anywhere a colour is computed from a token.

function rgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two '#RRGGBB' colours; null when either is not one. */
export function contrastRatio(a: string, b: string): number | null {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return null;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** '#RRGGBB' mixed toward another colour: t = 1 is `a`, 0 is `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = rgb(a) ?? [0, 0, 0];
  const cb = rgb(b) ?? [0, 0, 0];
  const out = ca.map((v, i) => Math.round(v * t + cb[i]! * (1 - t)));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Of the candidates, the one that reads best on `background`. */
export function bestOn(background: string, candidates: readonly string[]): string {
  const ratio = (c: string) => contrastRatio(c, background) ?? 0;
  return [...candidates].sort((x, y) => ratio(y) - ratio(x))[0] ?? '#000000';
}

/**
 * Lines and rings that carry meaning need 3:1 against what they sit on (WCAG 1.4.11). Most line
 * colours clear that on the white card; marigold does not (about 1.9:1), so its drawn strokes are
 * mixed toward `toward` (the label colour) just far enough to pass. A card's band and name chip keep
 * the true line colour; only drawn strokes use this. Returns `color` as is when it already passes.
 */
export function graphicColor(color: string, ground: string, toward: string, min = 3): string {
  const first = contrastRatio(color, ground);
  if (!rgb(color) || !rgb(toward) || first === null || first >= min) return color;
  for (let t = 0.1; t <= 1; t += 0.05) {
    const mixed = mixHex(toward, color, t);
    if ((contrastRatio(mixed, ground) ?? 0) >= min) return mixed;
  }
  return toward;
}
