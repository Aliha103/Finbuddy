// Line colours: the flat card stock of each group (DECISIONS.md set: no magenta, no graphite).
// Assigned per group from a hash of its id, never per currency. Each ships with the one label
// colour that passes 4.5:1 on it.
export const LINE_COLORS = [
  { id: 'violet', fill: '#6D3FC8', on: '#FFFFFF' },
  { id: 'tangerine', fill: '#E8620A', on: '#1A1420' },
  { id: 'marigold', fill: '#F2B705', on: '#1A1420' },
  { id: 'leaf', fill: '#1F7A4D', on: '#FFFFFF' },
  { id: 'moss', fill: '#6B7A1E', on: '#FFFFFF' },
  { id: 'cocoa', fill: '#7A4A2B', on: '#FFFFFF' },
  { id: 'cobalt', fill: '#1F4FD8', on: '#FFFFFF' },
  { id: 'teal', fill: '#0F7B86', on: '#FFFFFF' },
] as const;
export type LineColor = (typeof LINE_COLORS)[number];

export function lineColorFor(id: string): LineColor {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return LINE_COLORS[h % LINE_COLORS.length] ?? LINE_COLORS[0];
}

/** Line colours for a list of ids with no two neighbours sharing a colour. */
export function distinctLineColors(ids: readonly string[]): LineColor[] {
  const used = new Set<string>();
  return ids.map((id) => {
    let colour = lineColorFor(id);
    if (used.has(colour.id)) colour = LINE_COLORS.find((c) => !used.has(c.id)) ?? colour;
    used.add(colour.id);
    return colour;
  });
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}
