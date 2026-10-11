// apps/mobile/src/features/groups/graphicColor.ts
// Lines and rings that carry meaning need 3:1 against what they sit on (WCAG 1.4.11). Most line
// colours clear that on the white card; marigold does not (about 1.9:1), so its drawn strokes are
// mixed toward the label colour just far enough to pass. The card band and name chip keep the true
// line colour; only the map's strokes use this.
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

export function contrastRatio(a: string, b: string): number | null {
  const ca = rgb(a);
  const cb = rgb(b);
  if (!ca || !cb) return null;
  const [hi, lo] = [luminance(ca), luminance(cb)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const hex = (c: [number, number, number]) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

/** `color` as is when it reaches `min`:1 on `ground`; otherwise mixed toward `toward` until it does. */
export function graphicColor(color: string, ground: string, toward: string, min = 3): string {
  const from = rgb(color);
  const to = rgb(toward);
  const first = contrastRatio(color, ground);
  if (!from || !to || first === null || first >= min) return color;
  for (let t = 0.1; t <= 1; t += 0.05) {
    const mixed = hex([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t]);
    if ((contrastRatio(mixed, ground) ?? 0) >= min) return mixed;
  }
  return toward;
}
