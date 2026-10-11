// The colour arithmetic, checked against known WCAG figures and the line colours it serves.
import { describe, expect, it } from 'vitest';

import { bestOn, contrastRatio, graphicColor, mixHex } from './color';

describe('colour helpers', () => {
  it('mixes and picks the readable label', () => {
    expect(mixHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mixHex('#1F4FD8', '#FFFFFF', 1)).toBe('#1F4FD8');
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    expect(contrastRatio('#FFFFFF', 'white')).toBeNull();
    expect(bestOn('#F2B705', ['#FFFFFF', '#1A1420'])).toBe('#1A1420');
    expect(bestOn('#1F4FD8', ['#FFFFFF', '#1A1420'])).toBe('#FFFFFF');
  });

  it('lifts a drawn stroke to 3:1 only when it needs it', () => {
    // Cobalt already clears 3:1 on the white card; marigold (about 1.9:1) is mixed toward the label colour.
    expect(graphicColor('#1F4FD8', '#FFFFFF', '#1A1420')).toBe('#1F4FD8');
    const marigold = graphicColor('#F2B705', '#FFFFFF', '#1A1420');
    expect(marigold).not.toBe('#F2B705');
    expect(contrastRatio(marigold, '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });
});
