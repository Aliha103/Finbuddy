// apps/mobile/src/features/common/Banners.tsx
// Two thin bars that sit under a screen's title when they apply: storage refused (attention) and
// "You're looking at sample data" (while the profile itself is sample).
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDataStatus, useProfile } from '@/data';
import { Icon, RADIUS, SPACE, Text, useTheme } from '@/design';

import { onDevice } from './device';

/** The storage-refused sentence, in the browser's words on the web build. */
export const UNSAVED = onDevice("Changes won't be saved on this device", "Changes won't be saved in this browser");

/** Shown on Home and in Settings when the device refused to store data. Explained in Privacy. */
export function StorageBar({ explain = true }: { explain?: boolean }) {
  const { colors } = useTheme();
  const { persistent } = useDataStatus();
  if (persistent) return null;
  const body = (
    <View style={styles.inner}>
      <Icon name="warning" size={18} color={colors.attention} />
      <Text role="subhead" style={[styles.text, { color: colors.attention }]}>
        {UNSAVED}
      </Text>
      {explain ? <Icon name="chevronRight" size={16} color={colors.attention} /> : null}
    </View>
  );
  if (!explain) return <View style={[styles.bar, { backgroundColor: colors.attentionWash }]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${UNSAVED}. Why`}
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
  const { colors, minTouch } = useTheme();
  const profile = useProfile();
  if (!profile?.isSample) return null;
  return (
    <View style={[styles.bar, { backgroundColor: colors.surfaceAlt }]} testID="sample-banner">
      <View style={[styles.inner, styles.wrap]}>
        <Icon name="sample" size={18} color={colors.labelSecondary} />
        <Text role="subhead" color="labelSecondary" style={styles.sampleText}>
          {"You're looking at sample data"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/onboarding/profile')}
          style={({ pressed }) => [styles.linkTarget, { minHeight: minTouch, opacity: pressed ? 0.6 : 1 }]}
          testID="sample-banner-start"
        >
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
  // When the words and the link do not fit on one line (large text, narrow phones), the link moves
  // under the words instead of squeezing them into a column of single words.
  wrap: { flexWrap: 'wrap' },
  sampleText: { flexGrow: 1, flexShrink: 1, flexBasis: 120 },
  // The link's target is the full 44/48 points: it reaches into the bar's own padding (negative
  // margins) so the bar keeps its height and the words stay where they were.
  linkTarget: { justifyContent: 'center', paddingHorizontal: SPACE.s, marginHorizontal: -SPACE.s, marginVertical: -SPACE.s },
  link: { fontWeight: '600' },
});
