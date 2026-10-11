// apps/mobile/src/features/common/HeaderAvatar.tsx
// The profile avatar in the navigation bar (leading on iOS, in the top app bar on Android): the
// person's initial on the tint wash. Opens Profile and settings.
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useProfile } from '@/data';
import { Icon, SPACE, Text, useHaptic, useTheme } from '@/design';

export function HeaderAvatar() {
  const { colors, minTouch } = useTheme();
  const profile = useProfile();
  const haptic = useHaptic();
  const initial = profile?.displayName.trim().charAt(0).toUpperCase() ?? '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={profile ? `${profile.displayName}, profile and settings` : 'Profile and settings'}
      hitSlop={6}
      onPress={() => {
        haptic('select');
        router.push('/settings');
      }}
      style={({ pressed }) => [styles.box, { minHeight: minTouch, minWidth: minTouch, opacity: pressed ? 0.7 : 1 }]}
      testID="header-avatar"
    >
      <View style={[styles.avatar, { backgroundColor: colors.tintWash }]}>
        {initial ? (
          <Text role="subhead" style={[styles.initial, { color: colors.onTintWash }]}>
            {initial}
          </Text>
        ) : (
          <Icon name="person" size={18} color={colors.onTintWash} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.xs },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  initial: { fontWeight: '700' },
});
