// apps/mobile/src/features/common/Banners.tsx
// Two thin bars that sit under a screen's title when they apply: storage refused (attention) and
// "You're looking at sample data" (while the profile itself is sample).
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDataStatus, useProfile } from '@/data';
import { Icon, RADIUS, SPACE, Text, useTheme } from '@/design';

/** Shown on Home and in Settings when the device refused to store data. Explained in Privacy. */
export function StorageBar({ explain = true }: { explain?: boolean }) {
  const { colors } = useTheme();
  const { persistent } = useDataStatus();
  if (persistent) return null;
  const body = (
    <View style={styles.inner}>
      <Icon name="warning" size={18} color={colors.attention} />
      <Text role="subhead" style={[styles.text, { color: colors.attention }]}>
        {"Changes won't be saved on this device"}
      </Text>
      {explain ? <Icon name="chevronRight" size={16} color={colors.attention} /> : null}
    </View>
  );
  if (!explain) return <View style={[styles.bar, { backgroundColor: colors.attentionWash }]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Changes won't be saved on this device. Why"
      onPress={() => router.push('/settings/privacy')}
      style={({ pressed }) => [styles.bar, { backgroundColor: colors.attentionWash, opacity: pressed ? 0.85 : 1 }]}
      testID="storage-bar"
    >
      {body}
    </Pressable>
  );
}

/** Shown under the Home title while the profile is the sample one. */
export function SampleBanner() {
  const { colors } = useTheme();
  const profile = useProfile();
  if (!profile?.isSample) return null;
  return (
    <View style={[styles.bar, { backgroundColor: colors.surfaceAlt }]} testID="sample-banner">
      <View style={styles.inner}>
        <Icon name="sample" size={18} color={colors.labelSecondary} />
        <Text role="subhead" color="labelSecondary" style={styles.text}>
          {"You're looking at sample data"}
        </Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding/profile')} hitSlop={8}>
          <Text role="subhead" color="tint" style={styles.link}>
            Start with your own
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: RADIUS.tile, paddingHorizontal: SPACE.m, minHeight: 44, justifyContent: 'center' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, paddingVertical: SPACE.s },
  text: { flex: 1 },
  link: { fontWeight: '600' },
});
