// apps/mobile/src/design/HoldToConfirm.tsx
// The Gate. Money actions (settle up, confirm a payment) are confirmed by touch-and-hold for 600 ms
// while a ring closes, with a haptic at the start and at the gate; releasing early rewinds the ring.
// Screen-reader users, Reduce Motion, and anyone who chose "Confirm with a dialog instead of
// holding" get the platform's two-step confirmation instead, with the same label and summary.
import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { confirmDialog } from './dialog';
import { fireHaptic } from './haptics';
import { HoldRing } from './HoldRing';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme } from './theme';
import { DURATION, SPACE, SPRING, TIMING } from './tokens';

export interface HoldToConfirmProps {
  /** Button copy, e.g. "Paid, settle now". Named for its action; never "OK". */
  label: string;
  /** Spoken summary for the confirmation, e.g. "Pay Casey £57.55". */
  summary: string;
  onConfirm: () => void;
  disabled?: boolean;
  /** 'destructive' colours the control with the danger role (delete all data). */
  intent?: 'money' | 'destructive';
  /** Forces one path (the gallery shows both). Default: decided by the theme. */
  mode?: 'auto' | 'hold' | 'dialog';
  testID?: string;
}

const HEIGHT = 56;
const RING = 40;
const STROKE = 4;

export function HoldToConfirm({ label, summary, onConfirm, disabled, intent = 'money', mode = 'auto', testID }: HoldToConfirmProps) {
  const theme = useTheme();
  const c = theme.colors;
  const accent = intent === 'destructive' ? c.danger : c.tint;
  const on = intent === 'destructive' ? c.onDanger : c.onTint;
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const haptics = theme.haptics;

  useEffect(() => () => cancelAnimation(progress), [progress]);

  const haptic = (kind: 'start' | 'success' | 'select') => fireHaptic(kind, haptics);
  const confirm = () => {
    if (typeof AccessibilityInfo.announceForAccessibility === 'function') AccessibilityInfo.announceForAccessibility(`${summary}. Confirmed.`);
    onConfirm();
  };

  const hold = Gesture.LongPress()
    .enabled(!disabled)
    .minDuration(DURATION.hold)
    .maxDistance(24)
    .onBegin(() => {
      pressScale.set(withSpring(0.97, SPRING.press));
      progress.set(withTiming(1, TIMING.hold));
      scheduleOnRN(haptic, 'start');
    })
    .onStart(() => {
      // The gate: the hold reached 600 ms with the finger still down.
      scheduleOnRN(haptic, 'success');
      scheduleOnRN(confirm);
    })
    .onFinalize((_event, success) => {
      pressScale.set(withSpring(1, SPRING.press));
      if (!success) {
        // Early release: rewind the ring in 160 ms and tick.
        cancelAnimation(progress);
        progress.set(withTiming(0, TIMING.quick));
        scheduleOnRN(haptic, 'select');
      } else {
        progress.set(withTiming(0, { ...TIMING.standard, duration: DURATION.slow }));
      }
    });

  const scaled = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: progress.value >= 0.999 ? 1 : 0.35 + progress.value * 0.3 }));

  const twoStep = mode === 'dialog' || (mode === 'auto' && (theme.screenReader || theme.reduceMotion || theme.confirmWithDialog));
  if (twoStep) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={`Asks you to confirm: ${summary}`}
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        testID={testID}
        onPress={() => {
          void confirmDialog({ title: label, message: summary, confirmLabel: label, destructive: intent === 'destructive' }).then((ok) => {
            if (ok) confirm();
          });
        }}
        style={({ pressed }) => [styles.button, { backgroundColor: accent, minHeight: Math.max(HEIGHT, theme.minTouch), opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }]}
      >
        <View style={styles.ringBox} importantForAccessibility="no">
          <Icon name="check" size={22} color={on} />
        </View>
        <View style={styles.labels}>
          <Text role="headline" style={{ color: on }} numberOfLines={2}>
            {label}
          </Text>
          <Text role="footnote" style={{ color: on, opacity: 0.85 }} numberOfLines={1}>
            Opens a confirmation
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <GestureDetector gesture={hold}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Touch and hold to confirm"
        accessibilityState={{ disabled: !!disabled }}
        testID={testID}
        style={[styles.button, scaled, { backgroundColor: accent, minHeight: Math.max(HEIGHT, theme.minTouch), opacity: disabled ? 0.4 : 1 }]}
      >
        <View style={styles.ringBox} importantForAccessibility="no">
          <HoldRing progress={progress} size={RING} stroke={STROKE} color={on} />
          <Animated.View style={[styles.check, checkStyle]}>
            <Icon name="check" size={18} color={on} />
          </Animated.View>
        </View>
        <View style={styles.labels}>
          <Text role="headline" style={{ color: on }} numberOfLines={2}>
            {label}
          </Text>
          <Text role="footnote" style={{ color: on, opacity: 0.85 }} numberOfLines={1}>
            Hold to confirm
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.m,
    paddingVertical: SPACE.s,
    paddingLeft: SPACE.s,
    paddingRight: SPACE.xl,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  ringBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute' },
  labels: { flex: 1, gap: 1 },
});
