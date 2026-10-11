#!/usr/bin/env node
/**
 * Copies the two Mona Sans static weights the app uses from @expo-google-fonts/mona-sans into
 * apps/mobile/assets/fonts, named by their PostScript names. The same file then serves three
 * loaders under ONE family name per weight:
 *   - the expo-font config plugin (app.json), which embeds the files natively: iOS resolves a
 *     family by PostScript name, Android by file name, so the file name must equal the PostScript name;
 *   - expo-font's useFonts for Expo Go and the web preview, keyed by the same names;
 *   - the web export, where the @font-face family is the useFonts key.
 * See apps/mobile/src/design/FONTS.md. Run from the repo root: `npm run brand:fonts`.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(root, 'node_modules/@expo-google-fonts/mona-sans');
const out = join(root, 'apps/mobile/assets/fonts');
mkdirSync(out, { recursive: true });

const FONTS = [
  { from: '700Bold/MonaSans_700Bold.ttf', to: 'MonaSans-Bold.ttf' },
  { from: '600SemiBold/MonaSans_600SemiBold.ttf', to: 'MonaSans-SemiBold.ttf' },
];
for (const f of FONTS) {
  copyFileSync(join(pkg, f.from), join(out, f.to));
  console.log(`${f.from} -> apps/mobile/assets/fonts/${f.to}`);
}
