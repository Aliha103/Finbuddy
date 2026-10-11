// apps/mobile/src/design/Button.tsx
// Capsule buttons. Filled (the one primary action on a screen), tonal (secondary, on the tint wash),
// outlined and plain; on the tint field (the FinBuddy card) the inverse pair swaps the roles.
// Presses with the press spring; the label names the action. A small button draws a 36-point
// capsule inside a full 44 (iOS) / 48 (Material) pressable, since hitSlop does nothing on the web.
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useHaptic } from './haptics';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from './theme';
import { SPACE, SPRING } from './tokens';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  /** 'inverse' and 'inverseOutlined' sit on the tint field (onTint capsule with the tint as text, onTint outline). */
  variant?: 'filled' | 'tonal' | 'outlined' | 'plain' | 'inverse' | 'inverseOutlined';
  intent?: 'tint' | 'destructive';
  size?: 'regular' | 'small';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({ label, onPress, variant = 'filled', intent = 'tint', size = 'regular', icon, disabled, loading, fullWidth, accessibilityLabel, accessibilityHint, style, testID }: ButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const accent = intent === 'destructive' ? c.danger : c.tint;
  const onAccent = intent === 'destructive' ? c.onDanger : c.onTint;
  const wash = intent === 'destructive' ? c.dangerWash : c.tintWash;
  const onWash = intent === 'destructive' ? c.danger : c.onTintWash;
  const inverse = variant === 'inverse' || variant === 'inverseOutlined';
  const background = variant === 'filled' ? accent : variant === 'tonal' ? wash : variant === 'inverse' ? c.onTint : 'transparent';
  const foreground = variant === 'filled' ? onAccent : variant === 'tonal' ? onWash : variant === 'inverse' ? c.tint : variant === 'inverseOutlined' ? c.onTint : accent;
  const solid = variant === 'filled' || variant === 'tonal' || variant === 'inverse';
  const height = size === 'small' ? SMALL_HEIGHT : Math.max(theme.minTouch, 48);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      onPressIn={() => {
        scale.set(theme.reduceMotion ? 1 : withSpring(0.97, SPRING.press));
        haptic('select');
      }}
      onPressOut={() => {
        scale.set(withSpring(1, SPRING.press));
      }}
      testID={testID}
      style={[fullWidth ? styles.full : styles.inline, size === 'small' ? [styles.smallTarget, { minHeight: theme.minTouch }] : null]}
    >
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.button,
            animated,
            {
              height,
              paddingHorizontal: size === 'small' ? SPACE.m + 2 : SPACE.xl,
              backgroundColor: pressed && !solid ? (inverse ? c.pressed : c.pressed) : background,
              borderColor: variant === 'outlined' ? accent : variant === 'inverseOutlined' ? c.onTint : 'transparent',
              opacity: inactive ? 0.45 : pressed && solid ? 0.85 : 1,
            },
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={foreground} size="small" />
          ) : (
            <View style={styles.content}>
              {icon ? <Icon name={icon} size={size === 'small' ? 16 : 20} color={foreground} /> : null}
              <Text role={size === 'small' ? 'subhead' : 'headline'} style={{ color: foreground, fontWeight: '600' }} numberOfLines={1}>
                {label}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

const SMALL_HEIGHT = 36;

const styles = StyleSheet.create({
  inline: { alignSelf: 'flex-start' },
  smallTarget: { justifyContent: 'center' },
  full: { alignSelf: 'stretch' },
  button: { borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
});
