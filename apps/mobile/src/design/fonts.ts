// apps/mobile/src/design/fonts.ts
// The readout face. One family name per weight serves the config-plugin embedding (devices), useFonts
// (Expo Go, web) and the web @font-face; the verified facts behind the choices are in FONTS.md.
import { useFonts } from 'expo-font';
import { Platform, type TextStyle } from 'react-native';

import { monaSansCovers } from './fontCoverage';
import { FONT } from './tokens';

/**
 * Keys are the fonts' PostScript names (what iOS resolves an embedded font by); the files in
 * assets/fonts carry the same names (what Android resolves an embedded font by). On a device
 * build the plugin has already embedded these, so useFonts resolves at once; in Expo Go and on the
 * web it loads the bundled files.
 */
export const FONT_ASSETS = {
  [FONT.readout]: require('../../assets/fonts/MonaSans-Bold.ttf') as number,
  [FONT.readoutMedium]: require('../../assets/fonts/MonaSans-SemiBold.ttf') as number,
} as const;

/** Loads the readout face. Returns true once it is available (or failed, so the system face shows). */
export function useAppFonts(): { ready: boolean; error: Error | null } {
  const [loaded, error] = useFonts(FONT_ASSETS);
  return { ready: loaded || error !== null, error };
}

/**
 * Tabular figures. Mona Sans ships proportional digits by default and tabular ones behind the
 * OpenType `tnum` feature (verified, see FONTS.md), so every readout must set this. The platform
 * faces (SF Pro, Roboto) honour the same request, which is what makes the fallback seamless.
 */
export const TABULAR: Pick<TextStyle, 'fontVariant'> = { fontVariant: ['tabular-nums'] };

/**
 * The documented switch: Mona Sans lacks some currency symbols (₫ for VND, ₱, ₽, ₴, the Arabic-script
 * abbreviations, fullwidth ￥). A readout whose formatted text uses a glyph the face does not have
 * falls back to the platform face, with tabular figures, so symbol and digits share one face and
 * baseline instead of the OS stitching two fonts together. Only readouts call this; body text is
 * always the system face.
 */
export function readoutFamilyFor(text: string, preferred: string | undefined): string | undefined {
  if (!preferred) return undefined;
  if (monaSansCovers(text)) return preferred;
  return undefined;
}

/** When the system face carries a readout, the weight comes from fontWeight instead of the file. */
export function readoutWeightFor(family: string | undefined, weight: '400' | '600' | '700'): TextStyle['fontWeight'] {
  if (family) return Platform.OS === 'web' ? weight : undefined;
  return weight;
}
