// apps/mobile/src/design/tokens.ts
// FinBuddy design tokens. Exact values; semantic roles first, platform mappings beside them.
// Source of truth: design/DIRECTION.md section 3, as amended by design/DECISIONS.md (2026-10-11: the
// tint is Graphite, not Fare Magenta; the line-colour set gains cobalt and teal). The site mirrors
// these as CSS variables.
import { Easing, ReduceMotion, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/** Brand hue: Graphite (DECISIONS.md). Never used for owe/owed/error state; those have their own roles. */
export const BRAND = {
  graphite: '#4A4652', // light-mode tint. White on it: 9.2:1; on #FFFFFF 9.2:1, on #F5F3F6 8.3:1
  graphiteBright: '#CFC8D6', // dark-mode tint. #1A1420 on it: 11.1:1; on #1C1922 10.6:1, on #121016 11.6:1
  graphiteDeep: '#2E2935', // dark-mode wash
  graphiteInk: '#1A1420', // text on the dark-mode tint
  graphiteWash: '#ECE9EF', // light-mode wash
} as const;

export interface SemanticColors {
  /** iOS systemGroupedBackground · M3 surface */
  ground: string;
  /** iOS secondarySystemGroupedBackground · M3 surfaceContainerLowest (light) / surfaceContainerLow (dark) */
  surface: string;
  /** iOS tertiarySystemGroupedBackground · M3 surfaceContainer */
  surfaceAlt: string;
  /** Sheets, menus · M3 surfaceContainerHigh */
  surfaceRaised: string;
  /** iOS tertiarySystemFill (inputs) · M3 surfaceContainerHighest */
  fill: string;
  /** iOS label · M3 onSurface */
  label: string;
  /** iOS secondaryLabel · M3 onSurfaceVariant */
  labelSecondary: string;
  /** iOS tertiaryLabel (kept >=4.5:1 on surface) · M3 outline when used as text */
  labelTertiary: string;
  /** iOS separator · M3 outlineVariant */
  separator: string;
  /** iOS tint · M3 primary */
  tint: string;
  /** Text/icon on tint · M3 onPrimary */
  onTint: string;
  /** iOS: tint at 10% · M3 primaryContainer */
  tintWash: string;
  /** M3 onPrimaryContainer */
  onTintWash: string;
  /** Owed to you (credit) · M3 tertiary. Never the only signal: the row also says "owed to you". */
  credit: string;
  creditWash: string;
  /** You owe: deliberately ink, not red. Debts between friends are not alarms. */
  debit: string;
  /** Pending, due soon · amber */
  attention: string;
  attentionWash: string;
  /** Overdue, failed save, destructive · iOS systemRed role · M3 error */
  danger: string;
  dangerWash: string;
  onDanger: string;
  /** Pressed-state overlay for Pressable */
  pressed: string;
  /** Skeleton bone */
  bone: string;
}

export const LIGHT: SemanticColors = {
  ground: '#F5F3F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F0ECF2',
  surfaceRaised: '#FFFFFF',
  fill: '#EFEAF1',
  label: '#1A1420',
  labelSecondary: '#5F5564', // 7.1:1 on surface, 6.4:1 on ground
  labelTertiary: '#726778', // 5.3:1 on surface, 4.8:1 on ground
  separator: '#E4DEE6',
  tint: BRAND.graphite,
  onTint: '#FFFFFF',
  tintWash: BRAND.graphiteWash,
  onTintWash: '#2E2935', // 11.8:1 on the wash
  credit: '#1F7A4D', // 5.3:1 on surface
  creditWash: '#D9F2E4',
  debit: '#1A1420',
  attention: '#9A5B00', // 5.4:1 on surface
  attentionWash: '#FFF0D6',
  danger: '#B3261E',
  dangerWash: '#F9DEDC',
  onDanger: '#FFFFFF',
  pressed: 'rgba(26,20,32,0.08)',
  bone: '#E9E4EB',
};

export const DARK: SemanticColors = {
  ground: '#121016',
  surface: '#1C1922',
  surfaceAlt: '#1F1B25',
  surfaceRaised: '#2A252F',
  fill: '#2A2431',
  label: '#F6F2F7',
  labelSecondary: '#B9AFBE', // 8:1 on surface
  labelTertiary: '#9A8FA0', // 5.5:1 on surface
  separator: '#332C3A',
  tint: BRAND.graphiteBright,
  onTint: BRAND.graphiteInk,
  tintWash: BRAND.graphiteDeep,
  onTintWash: '#E8E2EC', // 11.1:1 on the wash
  credit: '#5FD39A', // 9:1 on surface
  creditWash: '#123D28',
  debit: '#F6F2F7',
  attention: '#FFB857',
  attentionWash: '#4A2E00',
  danger: '#FFB4AB',
  dangerWash: '#93000A',
  onDanger: '#690005',
  pressed: 'rgba(246,242,247,0.10)',
  bone: '#2A252F',
};

export type ColorRole = keyof SemanticColors;

/**
 * Line colours: each group's colour, worn as a band on the leading edge of its (white) card and in
 * its name chip (DECISIONS.md). Assigned per group (hash of id, user can change), never per
 * currency. Each ships with the one label colour that passes 4.5:1 on it (white: violet 6.6, leaf
 * 5.3, moss 5.0, cocoa 7.8, cobalt 6.6, teal 5.0; ink: tangerine 5.2, marigold 10.2).
 * Red is absent on purpose (it is the danger role); magenta was retired with the old tint and
 * graphite became the tint, so neither is a line colour.
 */
export const LINE_COLORS = [
  { id: 'violet', fill: '#6D3FC8', on: '#FFFFFF', name: 'Violet' },
  { id: 'tangerine', fill: '#E8620A', on: '#1A1420', name: 'Tangerine' },
  { id: 'marigold', fill: '#F2B705', on: '#1A1420', name: 'Marigold' },
  { id: 'leaf', fill: '#1F7A4D', on: '#FFFFFF', name: 'Leaf' },
  { id: 'moss', fill: '#6B7A1E', on: '#FFFFFF', name: 'Moss' },
  { id: 'cocoa', fill: '#7A4A2B', on: '#FFFFFF', name: 'Cocoa' },
  { id: 'cobalt', fill: '#1F4FD8', on: '#FFFFFF', name: 'Cobalt' },
  { id: 'teal', fill: '#0F7B86', on: '#FFFFFF', name: 'Teal' },
] as const;
export type LineColor = (typeof LINE_COLORS)[number];
export type LineColorId = LineColor['id'];

export function lineColorFor(id: string, overrides: Readonly<Record<string, LineColorId>> = {}): LineColor {
  const forced = overrides[id];
  if (forced) return LINE_COLORS.find((c) => c.id === forced) ?? LINE_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return LINE_COLORS[h % LINE_COLORS.length] ?? LINE_COLORS[0];
}

/**
 * Font families. Readouts and titles: Mona Sans static weights, embedded natively by the expo-font
 * config plugin and loaded with useFonts for Expo Go and the web (see fonts.ts and FONTS.md).
 * The names are the fonts' PostScript names, which is what iOS resolves an embedded font by, and
 * the TTF files carry the same names so Android resolves them too. Body: the system face.
 */
export const FONT = {
  readout: 'MonaSans-Bold',
  readoutMedium: 'MonaSans-SemiBold',
  display: 'MonaSans-Bold',
  title: 'MonaSans-SemiBold',
  /** undefined = San Francisco on iOS, Roboto on Android, the system UI stack on the web */
  body: undefined as string | undefined,
} as const;

/** The iOS Dynamic Type styles React Native's dynamicTypeRamp accepts. */
export type DynamicTypeRamp = 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'subheadline' | 'footnote' | 'caption1' | 'caption2';

export interface TypeRoleSpec {
  readonly size: number;
  readonly lineHeight: number;
  readonly family: string | undefined;
  readonly weight: '400' | '600' | '700';
  /** The Dynamic Type style the role tracks on iOS. */
  readonly ios: DynamicTypeRamp;
  /** The Material 3 type role it fills on Android. */
  readonly m3: string;
  readonly tabular: boolean;
}

/**
 * Type roles. size/lineHeight in pt (iOS) and sp (Android), both scale with the system text size.
 * Readouts cap at READOUT_MAX_SCALE and shrink to fit before they clip; rows beside a readout stack at >= 1.35.
 */
export const TYPE = {
  readoutXL: { size: 40, lineHeight: 44, family: FONT.readout, weight: '700', ios: 'largeTitle', m3: 'displaySmall', tabular: true },
  readoutL: { size: 28, lineHeight: 32, family: FONT.readout, weight: '700', ios: 'title1', m3: 'headlineMedium', tabular: true },
  readoutM: { size: 22, lineHeight: 28, family: FONT.readoutMedium, weight: '600', ios: 'title2', m3: 'titleLarge', tabular: true },
  readoutS: { size: 17, lineHeight: 22, family: FONT.readoutMedium, weight: '600', ios: 'headline', m3: 'titleMedium', tabular: true },
  display: { size: 34, lineHeight: 41, family: FONT.display, weight: '700', ios: 'largeTitle', m3: 'headlineLarge', tabular: false },
  title: { size: 22, lineHeight: 28, family: FONT.title, weight: '600', ios: 'title2', m3: 'titleLarge', tabular: false },
  headline: { size: 17, lineHeight: 22, family: FONT.body, weight: '600', ios: 'headline', m3: 'titleMedium', tabular: false },
  body: { size: 17, lineHeight: 22, family: FONT.body, weight: '400', ios: 'body', m3: 'bodyLarge', tabular: false },
  callout: { size: 16, lineHeight: 21, family: FONT.body, weight: '400', ios: 'callout', m3: 'bodyLarge', tabular: false },
  subhead: { size: 15, lineHeight: 20, family: FONT.body, weight: '400', ios: 'subheadline', m3: 'bodyMedium', tabular: false },
  footnote: { size: 13, lineHeight: 18, family: FONT.body, weight: '400', ios: 'footnote', m3: 'bodySmall', tabular: false },
  caption: { size: 12, lineHeight: 16, family: FONT.body, weight: '400', ios: 'caption1', m3: 'labelSmall', tabular: false },
} as const satisfies Record<string, TypeRoleSpec>;
export type TypeRole = keyof typeof TYPE;
export type ReadoutRole = Extract<TypeRole, 'readoutXL' | 'readoutL' | 'readoutM' | 'readoutS'>;

/** Readouts follow the system text size up to this multiplier, then shrink to fit rather than clip. */
export const READOUT_MAX_SCALE = 1.6;
/** At and above this font scale, rows that put a readout beside text stack vertically. */
export const STACK_FONT_SCALE = 1.35;
/**
 * Layout width, in text units (points / font scale), below which rows stack as they do at
 * STACK_FONT_SCALE: the room a 390-point phone has at 1.35 (289). A narrower phone at a slightly
 * smaller scale, and the web preview zoomed to 135% (the browser scales everything and reports a
 * font scale of 1), get the same layout instead of squeezing names to two letters.
 */
export const COMPACT_TEXT_WIDTH = 290;

/** 4-point grid. */
export const SPACE = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48, gutter: 16 } as const;

/** Radii. 12 is the ISO/IEC 7810 ID-1 card corner (3.18 mm of 85.6 mm) at a 320-wide card. */
export const RADIUS = { card: 12, row: 12, input: 10, tile: 8, sheetIOS: 20, sheetM3: 28, pill: 999 } as const;

/** Touch targets: HIG 44 pt, Material 48 dp. */
export const TOUCH = { min: 44, minAndroid: 48, gap: 8 } as const;

/**
 * Keyboard focus on the web preview (devices draw their own): a ring in the tint, outside the
 * control so it never covers its border or text. The browser's default outline is turned off only
 * where this ring replaces it.
 */
export const FOCUS = { width: 2, offset: 2 } as const;

/** Elevation. iOS draws none (grouped surfaces + hairlines); Android uses tonal surfaces; the FAB alone casts a shadow. */
export const SHADOW = {
  fab: { shadowColor: '#1A1420', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  none: { shadowOpacity: 0, elevation: 0 },
} as const;

export const DURATION = { instant: 100, quick: 160, standard: 240, slow: 320, readout: 560, hold: 600, focal: 800 } as const;

export const EASING = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1),
  emphasizedAccelerate: Easing.bezier(0.3, 0, 0.8, 0.15),
  linear: Easing.linear,
} as const;

/** Every animation config carries ReduceMotion.System: Reanimated itself skips motion when the OS asks. */
export const SPRING: Record<'press' | 'sheet' | 'gate' | 'roll', WithSpringConfig> = {
  press: { damping: 22, stiffness: 420, mass: 0.7, reduceMotion: ReduceMotion.System },
  sheet: { damping: 28, stiffness: 240, mass: 1, reduceMotion: ReduceMotion.System },
  gate: { damping: 18, stiffness: 200, mass: 1, reduceMotion: ReduceMotion.System },
  // Money never overshoots: critically damped and clamped, so a readout cannot show a value it never had.
  roll: { duration: DURATION.readout, dampingRatio: 1, overshootClamping: true, reduceMotion: ReduceMotion.System },
};

export const TIMING: Record<'quick' | 'standard' | 'slow' | 'hold', WithTimingConfig> = {
  quick: { duration: DURATION.quick, easing: EASING.standard, reduceMotion: ReduceMotion.System },
  standard: { duration: DURATION.standard, easing: EASING.emphasizedDecelerate, reduceMotion: ReduceMotion.System },
  slow: { duration: DURATION.slow, easing: EASING.emphasizedDecelerate, reduceMotion: ReduceMotion.System },
  // The hold is a progress bar, not motion for its own sake: it runs even under Reduce Motion.
  hold: { duration: DURATION.hold, easing: EASING.linear, reduceMotion: ReduceMotion.Never },
};
