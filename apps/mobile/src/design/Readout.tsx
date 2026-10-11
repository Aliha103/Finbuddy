// apps/mobile/src/design/Readout.tsx
// The signature: a money readout whose digits roll like a gate display ("Roll to Zero"). Exact digits
// only; the text is produced by formatMoneyToParts, so locale, symbol and minor units are the engine's.
//
// Sizing: every token (digits, symbol, separators) is set with allowFontScaling off and the role's
// size pre-multiplied by the capped font scale (<= 1.6x), so nothing misaligns at large text sizes.
// An amount is never truncated: when the row is narrower than the figure, the whole readout scales
// down to fit. Screen readers hear the currency-name form, and a live readout announces each change.
import { formatMoney, formatMoneyToParts, type Money } from '@finbuddy/shared';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text as RNText, View, type LayoutChangeEvent, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { readoutFamilyFor, readoutWeightFor } from './fonts';
import { useLayoutTransition } from './motion';
import { scaledType } from './Text';
import { textStyle, useTheme } from './theme';
import { SPRING, TIMING, TYPE, type ColorRole, type ReadoutRole } from './tokens';

export interface ReadoutProps {
  money: Money;
  locale: string;
  role?: ReadoutRole;
  /** 'exceptZero' shows +/- for signed balances; direction words usually carry this instead. */
  signDisplay?: 'auto' | 'always' | 'exceptZero' | 'never';
  color?: ColorRole;
  /** Explicit colour (for text on a fare card, where the card decides). Wins over `color`. */
  textColor?: string;
  /** Announce changes to screen readers (settle-up confirmation). */
  live?: boolean;
  /** Where the figure sits inside the width it is given. */
  align?: 'left' | 'center' | 'right';
  /** Inline readouts take only their own width and never shrink (inside a sentence or a chip). */
  inline?: boolean;
  style?: ViewStyle;
  testID?: string;
}

type Token = { kind: 'digit'; value: number } | { kind: 'text'; value: string; type: string };

function tokenize(parts: { type: string; value: string }[]): Token[] {
  const out: Token[] = [];
  for (const part of parts) {
    if (part.type === 'integer' || part.type === 'fraction') {
      for (const ch of part.value) {
        const n = Number(ch);
        // Only ASCII digits roll; other numeral systems render correctly but statically.
        out.push(ch >= '0' && ch <= '9' && Number.isInteger(n) ? { kind: 'digit', value: n } : { kind: 'text', value: ch, type: part.type });
      }
    } else {
      out.push({ kind: 'text', value: part.value, type: part.type });
    }
  }
  return out;
}

/**
 * Keys counted from the right, per kind: when £185.92 becomes £0.00 the surviving digit columns
 * keep their keys and roll in place, the currency symbol keeps its key and stays, and only the
 * leading columns leave.
 */
function stableKeys(tokens: readonly Token[]): string[] {
  const seen = new Map<string, number>();
  const keys = new Array<string>(tokens.length);
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i]!;
    const kind = t.kind === 'digit' ? 'digit' : t.type;
    const n = (seen.get(kind) ?? 0) + 1;
    seen.set(kind, n);
    keys[i] = `${kind}-${n}`;
  }
  return keys;
}

function announce(text: string): void {
  if (typeof AccessibilityInfo.announceForAccessibility === 'function') AccessibilityInfo.announceForAccessibility(text);
}

export function Readout({ money, locale, role = 'readoutL', signDisplay = 'auto', color = 'label', textColor, live, align = 'left', inline, style, testID }: ReadoutProps) {
  const theme = useTheme();
  const spec = TYPE[role];
  const text = formatMoney(money, { locale, signDisplay });
  const spoken = formatMoney(money, { locale, signDisplay, currencyDisplay: 'name' });
  const tokens = tokenize(formatMoneyToParts(money, { locale, signDisplay }));
  const keys = stableKeys(tokens);

  // The documented font switch: a symbol Mona Sans cannot draw moves the whole figure to the platform face.
  const family = readoutFamilyFor(text, spec.family);
  const { fontSize, lineHeight } = scaledType(role, theme.readoutScale);
  const glyph: TextStyle = {
    ...textStyle(role, theme.colors, color),
    fontFamily: family,
    fontWeight: readoutWeightFor(family, spec.weight),
    fontSize,
    lineHeight,
    ...(textColor ? { color: textColor } : {}),
  };

  // Live region: announce the new value once per change, on every platform (iOS has no live regions).
  const previous = useRef(spoken);
  useEffect(() => {
    if (live && previous.current !== spoken) announce(spoken);
    previous.current = spoken;
  }, [live, spoken]);

  // Shrink to fit: measure the natural width and the width we were given; never clip a digit.
  const [available, setAvailable] = useState(0);
  const [natural, setNatural] = useState(0);
  const fit = !inline && available > 0 && natural > available ? available / natural : 1;
  const onOuterLayout = (e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.width);
  const onInnerLayout = (e: LayoutChangeEvent) => setNatural(e.nativeEvent.layout.width);
  // The row's width follows the figure (a column leaves when £185.92 rolls to £0.00). Native only:
  // on the web the transition scales from the previous box, which is 0x0 while the screen is hidden.
  const layout = useLayoutTransition();

  const row = (
    <Animated.View
      layout={layout}
      onLayout={inline ? undefined : onInnerLayout}
      style={[
        styles.row,
        { height: lineHeight },
        fit < 1
          ? { position: 'absolute', left: 0, top: 0, transform: [{ translateX: -(natural * (1 - fit)) / 2 }, { translateY: -(lineHeight * (1 - fit)) / 2 }, { scale: fit }] }
          : null,
      ]}
    >
      {tokens.map((token, i) => {
        const key = keys[i] ?? String(i);
        return token.kind === 'digit' ? (
          <DigitColumn key={key} digit={token.value} glyph={glyph} lineHeight={lineHeight} reduceMotion={theme.reduceMotion} />
        ) : (
          <Animated.Text
            key={key}
            entering={theme.reduceMotion ? undefined : FadeIn.duration(TIMING.quick.duration ?? 160)}
            exiting={theme.reduceMotion ? undefined : FadeOut.duration(TIMING.quick.duration ?? 160)}
            style={[glyph, styles.glyph, { height: lineHeight }]}
            allowFontScaling={false}
            importantForAccessibility="no"
          >
            {token.value}
          </Animated.Text>
        );
      })}
    </Animated.View>
  );

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={spoken}
      testID={testID}
      onLayout={inline ? undefined : onOuterLayout}
      style={[
        inline ? styles.inline : [styles.block, { alignItems: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }],
        fit < 1 ? { height: lineHeight * fit } : null,
        style,
      ]}
    >
      {fit < 1 ? <View style={{ width: natural * fit, height: lineHeight * fit }}>{row}</View> : row}
    </View>
  );
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitColumn({ digit, glyph, lineHeight, reduceMotion }: { digit: number; glyph: TextStyle; lineHeight: number; reduceMotion: boolean }) {
  const y = useSharedValue(-digit * lineHeight);
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      // No travel: a crossfade is the Reduce Motion rendition of the roll.
      opacity.value = withSequence(withTiming(0.2, { duration: 80 }), withTiming(1, { duration: 160 }));
      y.value = withTiming(-digit * lineHeight, { duration: 0 });
    } else {
      y.value = withSpring(-digit * lineHeight, SPRING.roll);
    }
  }, [digit, lineHeight, reduceMotion, y, opacity]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(TIMING.quick.duration ?? 160)}
      exiting={reduceMotion ? undefined : FadeOut.duration(TIMING.quick.duration ?? 160)}
      style={[styles.column, { height: lineHeight }]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Animated.View style={animated}>
        {DIGITS.map((d) => (
          <RNText key={d} style={[glyph, styles.glyph, { height: lineHeight }]} allowFontScaling={false}>
            {d}
          </RNText>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: { alignSelf: 'stretch', flexShrink: 1 },
  inline: { alignSelf: 'flex-start', flexShrink: 0 },
  row: { flexDirection: 'row', alignItems: 'flex-start', overflow: 'hidden' },
  column: { overflow: 'hidden' },
  glyph: { includeFontPadding: false, textAlignVertical: 'center' },
});

/**
 * Sizing rule used by callers: when a currency readout would not fit its row at the current font
 * scale, drop one role (readoutXL -> readoutL) before anything else moves; very long figures at
 * large text sizes drop to readoutM.
 */
export function fitRole(preferred: ReadoutRole, fontScale: number, longestDigits: number): ReadoutRole {
  if (fontScale >= 1.35 && longestDigits > 8) return 'readoutM';
  if (fontScale >= 1.35 || longestDigits > 10) return preferred === 'readoutXL' ? 'readoutL' : preferred;
  return preferred;
}
