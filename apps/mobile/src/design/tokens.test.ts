// The colour tokens against the contrast rules they promise: every line colour mark at 3:1 on the
// surface and ground of the scheme drawing it, with its label at 4.5:1; data marks at 3:1 wherever
// they sit. Reanimated (easing and motion configs in tokens.ts) is stubbed: nothing here moves.
import { describe, expect, it, vi } from 'vitest';

import { bestOn, contrastRatio } from './color';
import { DARK, LIGHT, LINE_COLORS, lineSwatch } from './tokens';

vi.mock('react-native-reanimated', () => ({
  Easing: { bezier: () => () => 0, linear: () => 0 },
  ReduceMotion: { System: 'system', Never: 'never', Always: 'always' },
}));

const ratio = (a: string, b: string) => contrastRatio(a, b) ?? 0;
const INK = LIGHT.label;
const WHITE = '#FFFFFF';

describe('line colours', () => {
  it('keep their light pair in light mode', () => {
    for (const line of LINE_COLORS) expect(lineSwatch(line, 'light')).toEqual({ fill: line.fill, on: line.on });
  });

  it('reach 3:1 on the dark surface and ground', () => {
    for (const line of LINE_COLORS) {
      const { fill } = lineSwatch(line, 'dark');
      expect([line.id, ratio(fill, DARK.surface) >= 3, ratio(fill, DARK.ground) >= 3]).toEqual([line.id, true, true]);
    }
  });

  for (const scheme of ['light', 'dark'] as const) {
    it(`carry the label that reads best on each ${scheme} fill, at 4.5:1 or more`, () => {
      for (const line of LINE_COLORS) {
        const { fill, on } = lineSwatch(line, scheme);
        expect([line.id, on, ratio(on, fill) >= 4.5]).toEqual([line.id, bestOn(fill, [WHITE, INK]), true]);
      }
    });
  }

  it('change only where the light fill is under 3:1 on the dark surface', () => {
    for (const line of LINE_COLORS) expect([line.id, line.dark !== null]).toEqual([line.id, ratio(line.fill, DARK.surface) < 3]);
  });
});

describe('data marks', () => {
  for (const [scheme, colors] of [['light', LIGHT], ['dark', DARK]] as const) {
    it(`reach 3:1 on every ${scheme} surface a chart or bar sits on, and stay apart from the selected bar`, () => {
      for (const ground of [colors.surface, colors.ground, colors.surfaceAlt, colors.fill]) expect(ratio(colors.dataMark, ground)).toBeGreaterThanOrEqual(3);
      expect(ratio(colors.dataMark, colors.tint)).toBeGreaterThanOrEqual(2);
      expect(ratio(colors.dataMark, colors.label)).toBeGreaterThanOrEqual(3);
    });
    // The selected bar and the others are under 3:1 apart, so the selection also puts its month's
    // label in a tint pill (MonthBars, monthCues): a shape that reads on the card by itself.
    it(`give the selected month a ${scheme} label pill at 3:1 on the card, with its text at 4.5:1`, () => {
      expect(ratio(colors.tint, colors.dataMark)).toBeLessThan(3);
      expect(ratio(colors.tint, colors.surface)).toBeGreaterThanOrEqual(3);
      expect(ratio(colors.onTint, colors.tint)).toBeGreaterThanOrEqual(4.5);
    });
    it(`draw the ${scheme} spike marker at 3:1 on the card`, () => {
      expect(ratio(colors.attention, colors.surface)).toBeGreaterThanOrEqual(3);
    });
  }
});
