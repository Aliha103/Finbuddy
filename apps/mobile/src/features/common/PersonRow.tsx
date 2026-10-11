// apps/mobile/src/features/common/PersonRow.tsx
// One person in a list of people (the split editor, the payers screen): their avatar, their
// name, the method's control at the trailing end, and the problem with that row in words under it.
// At large text sizes the control drops under the name instead of squeezing it.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type AccessibilityRole, type AccessibilityState } from 'react-native';

import { Icon, RADIUS, SPACE, Text, useTheme } from '@/design';

import { PersonAvatar } from './PersonAvatar';

export interface PersonRowProps {
  name: string;
  avatarFill?: string;
  avatarOn?: string;
  /** A secondary line under the name ("Paid £40.00", "Left out"). */
  detail?: ReactNode;
  error?: string | null;
  control?: ReactNode;
  /** Makes the whole row one control (a checkbox or a radio row). */
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityLabel?: string;
  leading?: ReactNode;
  testID?: string;
}

export function PersonRow({ name, avatarFill, avatarOn, detail, error, control, onPress, accessibilityRole, accessibilityState, accessibilityLabel, leading, testID }: PersonRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const stacked = theme.largeText && !!control && !onPress;
  const body = (
    <View style={styles.inner}>
      <View style={[styles.main, { minHeight: theme.minTouch }]}>
        {leading}
        <PersonAvatar name={name} size={32} fill={avatarFill} on={avatarOn} />
        <View style={styles.text}>
          <Text role="body" numberOfLines={2}>
            {name}
          </Text>
          {typeof detail === 'string' ? (
            <Text role="subhead" color="labelSecondary">
              {detail}
            </Text>
          ) : (
            detail
          )}
        </View>
        {!stacked && control ? <View style={styles.control}>{control}</View> : null}
      </View>
      {stacked && control ? <View style={styles.stackedControl}>{control}</View> : null}
      {error ? (
        <Text role="footnote" color="danger" accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      aria-checked={accessibilityState?.checked === undefined ? undefined : accessibilityState.checked === true}
      accessibilityLabel={accessibilityLabel ?? name}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
    >
      {body}
    </Pressable>
  );
}

/** A checkbox mark: a filled square with a check when on, an outlined square when off. */
export function CheckMark({ checked }: { checked: boolean }) {
  const { colors: c } = useTheme();
  return (
    <View style={[styles.check, checked ? { backgroundColor: c.tint, borderColor: c.tint } : { borderColor: c.labelTertiary }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {checked ? <Icon name="check" size={16} color={c.onTint} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.s },
  inner: { gap: SPACE.xs },
  main: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  text: { flex: 1, gap: 2 },
  control: { flexShrink: 0 },
  stackedControl: { paddingLeft: 32 + SPACE.m, alignSelf: 'stretch' },
  error: { paddingLeft: 32 + SPACE.m },
  check: { width: 24, height: 24, borderRadius: RADIUS.tile - 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
