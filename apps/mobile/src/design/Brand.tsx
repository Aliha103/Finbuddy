// apps/mobile/src/design/Brand.tsx
// The mark, the wordmark and the lockup, drawn from the same geometry as assets/brand/*.svg so the
// app never sets the wordmark in a live font. Strokes take `color` (currentColor in the SVG files);
// the tile and its bars take the theme's tint / onTint pair (graphite with white bars in light mode,
// the light graphite with ink bars in dark mode), defaulting to the light pair.
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { BRAND } from './tokens';

export interface TileProps {
  /** The tile colour: the theme's tint. */
  tile?: string;
  /** The bars on the tile: the theme's onTint. */
  bars?: string;
}

/** The mark: a graphite ID-1-cornered tile, one full bar over the same length split in two. */
export function Mark({ size = 64, tile = BRAND.graphite, bars = '#FFFFFF', accessibilityLabel = 'FinBuddy' }: { size?: number; accessibilityLabel?: string } & TileProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel={accessibilityLabel} accessibilityRole="image" accessible>
      <Rect width={64} height={64} rx={16} fill={tile} />
      <Rect x={14} y={21} width={36} height={8} rx={4} fill={bars} />
      <Rect x={14} y={35} width={16} height={8} rx={4} fill={bars} />
      <Rect x={34} y={35} width={16} height={8} rx={4} fill={bars} />
    </Svg>
  );
}

/** The three bars alone, for a tinted ground (the splash, a card). */
export function Bars({ width = 36, color = '#FFFFFF' }: { width?: number; color?: string }) {
  const height = (width / 36) * 22;
  return (
    <Svg width={width} height={height} viewBox="14 21 36 22" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={14} y={21} width={36} height={8} rx={4} fill={color} />
      <Rect x={14} y={35} width={16} height={8} rx={4} fill={color} />
      <Rect x={34} y={35} width={16} height={8} rx={4} fill={color} />
    </Svg>
  );
}

const WORD_PATHS = [
  'M29 29V111M29 29H86M29 72H77',
  'M120.5 59V111',
  'M155 111V59M155 80C155 67 165 58 179 58C193 58 203 67 203 80V111',
  'M237 29V111M237 29H273C289 29 297 38 297 49.5C297 61 289 70 273 70H237M237 70H279C296 70 305 79 305 90.5C305 102 296 111 279 111H237',
  'M339 59V88C339 102 349 111 363 111C377 111 387 102 387 88V59M387 59V111',
  'M473 29V111',
  'M559 29V111',
  'M593 59L616 108M639 59L605 130C601 138 594 142 585 141',
];

/** The wordmark: custom monoline lettering; the dot of the i is the mark's tile. Minimum width 96. */
export function Wordmark({ height = 24, color, tile = BRAND.graphite }: { height?: number; color: string } & Pick<TileProps, 'tile'>) {
  const width = (height / 170) * 670;
  return (
    <Svg width={width} height={height} viewBox="0 0 670 170" accessibilityLabel="FinBuddy" accessibilityRole="image" accessible>
      <G fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
        {WORD_PATHS.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      <G fill="none" stroke={color} strokeWidth={18}>
        <Circle cx={447} cy={85} r={26} />
        <Circle cx={533} cy={85} r={26} />
      </G>
      <Rect x={111} y={20} width={19} height={19} rx={5} fill={tile} />
    </Svg>
  );
}

/** Mark at 64, a 20-unit gap, wordmark at a 64-unit cap height. For the welcome screen and the site header. */
export function Lockup({ height = 32, color, tile = BRAND.graphite, bars = '#FFFFFF' }: { height?: number; color: string } & TileProps) {
  const width = (height / 96) * 540;
  return (
    <Svg width={width} height={height} viewBox="0 0 540 96" accessibilityLabel="FinBuddy" accessibilityRole="image" accessible>
      <G translateY={16}>
        <Rect width={64} height={64} rx={16} fill={tile} />
        <Rect x={14} y={21} width={36} height={8} rx={4} fill={bars} />
        <Rect x={14} y={35} width={16} height={8} rx={4} fill={bars} />
        <Rect x={34} y={35} width={16} height={8} rx={4} fill={bars} />
      </G>
      <G transform="translate(84 2) scale(0.64)" fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
        {WORD_PATHS.map((d) => (
          <Path key={d} d={d} />
        ))}
        <Circle cx={447} cy={85} r={26} />
        <Circle cx={533} cy={85} r={26} />
        <Rect x={111} y={20} width={19} height={19} rx={5} fill={tile} stroke="none" />
      </G>
    </Svg>
  );
}
