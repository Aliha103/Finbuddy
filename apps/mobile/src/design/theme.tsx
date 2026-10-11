// apps/mobile/src/design/theme.tsx
// Appearance (system / light / dark), Reduce Motion, the confirmation preference and the
// platform's conventions, in one hook. Preferences are app-local (AsyncStorage), never in the
// shared model.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Appearance as RNAppearance, Platform, useColorScheme, useWindowDimensions, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { TABULAR } from './fonts';
import { appWidthFor } from './frame';
import { COMPACT_TEXT_WIDTH, DARK, LIGHT, RADIUS, READOUT_MAX_SCALE, STACK_FONT_SCALE, TOUCH, TYPE, type ColorRole, type SemanticColors, type TypeRole } from './tokens';

export type Appearance = 'system' | 'light' | 'dark';

const KEYS = {
  appearance: 'finbuddy.appearance',
  reduceMotion: 'finbuddy.reduceMotion',
  confirmWithDialog: 'finbuddy.confirmWithDialog',
  haptics: 'finbuddy.haptics',
} as const;

export interface Theme {
  readonly scheme: 'light' | 'dark';
  readonly appearance: Appearance;
  readonly colors: SemanticColors;
  /** 'ios' follows the HIG; everything else (Android, the web preview) follows Material 3. */
  readonly platform: 'ios' | 'material';
  /** OS Reduce Motion / Remove animations, or the in-app override. Anything that moves checks this. */
  readonly reduceMotion: boolean;
  /** The in-app override alone (for the Settings switch). */
  readonly reduceMotionOverride: boolean;
  /** A screen reader is running: hold-to-confirm and drag editors swap to their two-step equivalents. */
  readonly screenReader: boolean;
  /** "Confirm with a dialog instead of holding": the motor-accessibility escape hatch for the Gate. */
  readonly confirmWithDialog: boolean;
  /** Haptic feedback on or off (Settings). */
  readonly haptics: boolean;
  /** The system text size multiplier. */
  readonly fontScale: number;
  /** The multiplier readouts actually use: fontScale capped at 1.6. */
  readonly readoutScale: number;
  /**
   * True at font scale >= 1.35, or when the layout is narrower than COMPACT_TEXT_WIDTH in text
   * units (the same room a 390-point phone has at 1.35): rows with a readout beside text stack
   * vertically, controls drop under the names they belong to, segmented options stack.
   */
  readonly largeText: boolean;
  readonly minTouch: number;
  readonly sheetRadius: number;
  setAppearance(next: Appearance): void;
  setReduceMotionOverride(next: boolean): void;
  setConfirmWithDialog(next: boolean): void;
  setHaptics(next: boolean): void;
}

const ThemeContext = createContext<Theme | null>(null);

function persist(key: string, value: string): void {
  AsyncStorage.setItem(key, value).catch(() => {
    // Storage refused: the choice lasts for this session.
  });
}

/**
 * Tells the OS about the in-app appearance override, so native alerts, sheets, pickers, the tab
 * bar and the keyboard follow the chosen scheme rather than only our own colour tables.
 */
function applyAppearance(appearance: Appearance): void {
  const setColorScheme = (RNAppearance as { setColorScheme?: (scheme: 'light' | 'dark' | 'unspecified') => void }).setColorScheme;
  if (typeof setColorScheme !== 'function') return; // react-native-web has no such API; the web follows the browser.
  try {
    setColorScheme(appearance === 'system' ? 'unspecified' : appearance);
  } catch {
    // Older runtimes without the setter: our own colours still switch.
  }
}

export function ThemeProvider({ children, initialAppearance = 'system' }: { children: ReactNode; initialAppearance?: Appearance }) {
  const system = useColorScheme();
  const osReduceMotion = useReducedMotion();
  const { fontScale, width } = useWindowDimensions();
  const textWidth = appWidthFor(width) / fontScale;
  const [appearance, setAppearanceState] = useState<Appearance>(initialAppearance);
  const [motionOverride, setMotionOverride] = useState(false);
  const [confirmWithDialog, setConfirmWithDialogState] = useState(false);
  const [haptics, setHapticsState] = useState(true);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet([KEYS.appearance, KEYS.reduceMotion, KEYS.confirmWithDialog, KEYS.haptics])
      .then((pairs) => {
        if (!active) return;
        for (const [key, value] of pairs) {
          if (key === KEYS.appearance && (value === 'light' || value === 'dark' || value === 'system')) {
            setAppearanceState(value);
            applyAppearance(value);
          }
          if (key === KEYS.reduceMotion) setMotionOverride(value === 'true');
          if (key === KEYS.confirmWithDialog) setConfirmWithDialogState(value === 'true');
          if (key === KEYS.haptics && value !== null) setHapticsState(value !== 'false');
        }
      })
      .catch(() => {
        // Storage refused: keep the defaults for this session.
      });
    // react-native-web cannot know whether a screen reader runs and answers true unconditionally, which
    // would route every Gate on the web preview to the dialog path; the web keeps the gesture (and the
    // "Confirm with a dialog" preference) and only native platforms ask the OS.
    if (Platform.OS === 'web') {
      return () => {
        active = false;
      };
    }
    AccessibilityInfo.isScreenReaderEnabled()
      .then((on) => active && setScreenReader(on))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next);
    applyAppearance(next);
    persist(KEYS.appearance, next);
  }, []);
  const setReduceMotionOverride = useCallback((next: boolean) => {
    setMotionOverride(next);
    persist(KEYS.reduceMotion, String(next));
  }, []);
  const setConfirmWithDialog = useCallback((next: boolean) => {
    setConfirmWithDialogState(next);
    persist(KEYS.confirmWithDialog, String(next));
  }, []);
  const setHaptics = useCallback((next: boolean) => {
    setHapticsState(next);
    persist(KEYS.haptics, String(next));
  }, []);

  const value = useMemo<Theme>(() => {
    const scheme = appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
    const platform = Platform.OS === 'ios' ? 'ios' : 'material';
    return {
      scheme,
      appearance,
      colors: scheme === 'dark' ? DARK : LIGHT,
      platform,
      reduceMotion: osReduceMotion || motionOverride,
      reduceMotionOverride: motionOverride,
      screenReader,
      confirmWithDialog,
      haptics,
      fontScale,
      readoutScale: Math.min(fontScale, READOUT_MAX_SCALE),
      largeText: fontScale >= STACK_FONT_SCALE || textWidth < COMPACT_TEXT_WIDTH,
      minTouch: platform === 'ios' ? TOUCH.min : TOUCH.minAndroid,
      sheetRadius: platform === 'ios' ? RADIUS.sheetIOS : RADIUS.sheetM3,
      setAppearance,
      setReduceMotionOverride,
      setConfirmWithDialog,
      setHaptics,
    };
  }, [appearance, system, osReduceMotion, motionOverride, screenReader, confirmWithDialog, haptics, fontScale, textWidth, setAppearance, setReduceMotionOverride, setConfirmWithDialog, setHaptics]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) throw new Error('useTheme() needs <ThemeProvider>');
  return theme;
}

/**
 * A text style for a type role. Sizes scale with Dynamic Type / font scale through RN's own
 * allowFontScaling (the Text primitive adds dynamicTypeRamp on iOS and the 1.6x cap on readouts).
 */
export function textStyle(role: TypeRole, colors: SemanticColors, color: ColorRole = 'label'): TextStyle {
  const t = TYPE[role];
  return {
    fontSize: t.size,
    lineHeight: t.lineHeight,
    fontFamily: t.family,
    // A brand face carries its weight in the file (the web still wants the CSS weight); the system face takes fontWeight.
    fontWeight: t.family && Platform.OS !== 'web' ? undefined : t.weight,
    color: colors[color],
    ...(t.tabular ? TABULAR : {}),
  };
}
