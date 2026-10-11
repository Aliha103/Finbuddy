// apps/mobile/src/design/Card.tsx
// The fare card. A flat ID-1-cornered card on the surface colour. A group's card wears its line
// colour as a 6-point band on the leading edge and in its name chip (DECISIONS.md), never as a
// full fill; the FinBuddy card on Home is the one card in the tint. Presses with the press spring.
import { createContext, use, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useHaptic } from './haptics';
import { Text } from './Text';
import { useTheme } from './theme';
import { RADIUS, SPACE, SPRING, type LineColor } from './tokens';

/** The colours text inside a tinted card should use; null when the card is a plain surface. */
export interface CardColors {
  readonly fill: string;
  readonly on: string;
  /** Secondary text on the card: the label colour at 78 percent, which stays above 4.5:1 on the tint. */
  readonly onMuted: string;
}

const CardContext = createContext<CardColors | null>(null);

/** Inside the tinted FinBuddy card, the colours the card decided; elsewhere null (use the theme's colours). */
export function useCardColors(): CardColors | null {
  return use(CardContext);
}

/** The width of the line-colour band on a group's card. */
export const LINE_BAND = 6;

export interface CardProps {
  /** The group's line colour: drawn as the leading-edge band. The card itself stays on the surface colour. */
  line?: LineColor;
  /** A fixed width:height ratio (the Groups list uses 16:9 on phones, 1.586 on wide screens). */
  aspect?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  padding?: number;
  /** 'tint' is the FinBuddy card (the one tinted surface); 'surfaceAlt' for a card inside a surface. */
  tone?: 'surface' | 'surfaceAlt' | 'outlined' | 'tint';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: ReactNode;
}

const muted = (on: string) => (on === '#FFFFFF' ? 'rgba(255,255,255,0.78)' : 'rgba(26,20,32,0.78)');

export function Card({ line, aspect, onPress, accessibilityLabel, accessibilityHint, padding = SPACE.l, tone = 'surface', style, testID, children }: CardProps) {
  const { colors, reduceMotion } = useTheme();
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cardColors: CardColors | null = tone === 'tint' ? { fill: colors.tint, on: colors.onTint, onMuted: muted(colors.onTint) } : null;

  const surface: ViewStyle =
    tone === 'tint'
      ? { backgroundColor: colors.tint }
      : tone === 'outlined'
        ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.separator }
        : { backgroundColor: tone === 'surfaceAlt' ? colors.surfaceAlt : colors.surface };

  const visual = [styles.card, surface, { padding, paddingLeft: line ? padding + LINE_BAND : padding }, aspect ? { aspectRatio: aspect } : null];
  const band = line ? <View style={[styles.band, { backgroundColor: line.fill }]} importantForAccessibility="no" /> : null;

  if (!onPress) {
    return (
      <Animated.View style={[visual, style]} testID={testID}>
        {band}
        <CardContext value={cardColors}>{children}</CardContext>
      </Animated.View>
    );
  }
  // Pressable is the layout item (it takes the caller's width, margins, aspect); the card inside fills it.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[aspect ? { aspectRatio: aspect } : null, style]}
      testID={testID}
      onPress={onPress}
      onPressIn={() => {
        scale.set(reduceMotion ? 1 : withSpring(0.97, SPRING.press));
        haptic('select');
      }}
      onPressOut={() => {
        scale.set(withSpring(1, SPRING.press));
      }}
    >
      <Animated.View style={[visual, styles.fill, animated]}>
        {band}
        <CardContext value={cardColors}>{children}</CardContext>
      </Animated.View>
    </Pressable>
  );
}

/** The group's name in its line colour: the one place the colour carries text (label colour per swatch). */
export function LineChip({ line, label, testID }: { line: LineColor; label: string; testID?: string }) {
  return (
    <View style={[styles.lineChip, { backgroundColor: line.fill }]} testID={testID}>
      <Text role="footnote" style={{ color: line.on, fontWeight: '600' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** A thin hairline inside a card or between stacked content. */
export function Hairline({ inset = 0, color }: { inset?: number; color?: string }) {
  const { colors } = useTheme();
  return <View style={[styles.hairline, { marginLeft: inset, backgroundColor: color ?? colors.separator }]} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.card, overflow: 'hidden' },
  band: { position: 'absolute', left: 0, top: 0, bottom: 0, width: LINE_BAND },
  lineChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: SPACE.m, paddingVertical: SPACE.xs - 1, maxWidth: '100%' },
  fill: { flex: 1, alignSelf: 'stretch' },
  hairline: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
});
