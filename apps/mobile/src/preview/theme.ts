import { Platform, useColorScheme, useWindowDimensions } from 'react-native';

/**
 * PREVIEW THEME, NOT THE DESIGN. Neutral, system-like values so the engine can be clicked
 * through before the visual design exists: platform grouped-list greys, one neutral graphite
 * tint, system font, light and dark. The real design system replaces this file.
 */
export interface Palette {
  readonly background: string;
  readonly surface: string;
  readonly pressed: string;
  readonly label: string;
  readonly secondaryLabel: string;
  readonly separator: string;
  readonly tint: string;
  readonly onTint: string;
  readonly track: string;
  readonly banner: string;
  readonly input: string;
  readonly error: string;
}

const light: Palette = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  pressed: '#E5E5EA',
  label: '#000000',
  secondaryLabel: '#5E5E63',
  separator: '#C6C6C8',
  tint: '#2C2C2E',
  onTint: '#FFFFFF',
  track: '#E5E5EA',
  banner: '#E5E5EA',
  input: '#F2F2F7',
  error: '#B3261E',
};

const dark: Palette = {
  background: '#000000',
  surface: '#1C1C1E',
  pressed: '#3A3A3C',
  label: '#FFFFFF',
  secondaryLabel: '#AEAEB2',
  separator: '#38383A',
  tint: '#E5E5EA',
  onTint: '#000000',
  track: '#3A3A3C',
  banner: '#2C2C2E',
  input: '#2C2C2E',
  error: '#F2B8B5',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Text sizes in points. Nothing below 13; all of them scale with Dynamic Type / font scale. */
export const textSize = {
  largeTitle: Platform.select({ ios: 34, default: 28 }),
  title: Platform.select({ ios: 22, default: 22 }),
  headline: 17,
  body: Platform.select({ ios: 17, default: 16 }),
  subhead: 15,
  footnote: 13,
} as const;

export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24 } as const;

/** Minimum touch target (44pt iOS HIG; Material asks 48dp). */
export const MIN_TOUCH = Platform.select({ android: 48, default: 44 });

/** iOS (and the web preview) use inset grouped lists; Android uses full-width surfaces. */
export const list = {
  inset: Platform.select({ android: 0, default: 16 }),
  radius: Platform.select({ android: 0, default: 10 }),
  headerUppercase: Platform.OS === 'ios',
} as const;

/** True when the person uses a large text size, so side-by-side rows should stack. */
export function useLargeText(): boolean {
  return useWindowDimensions().fontScale >= 1.35;
}
