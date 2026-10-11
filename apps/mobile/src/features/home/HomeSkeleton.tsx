// apps/mobile/src/features/home/HomeSkeleton.tsx
// Bones in Home's own layout while the store loads: the card, a settle row, a month row.
import { StyleSheet, View } from 'react-native';

import { RADIUS, SPACE, Skeleton, SkeletonText, useTheme } from '@/design';
import { Screen } from '@/features/common/Screen';

export function HomeSkeleton() {
  const { colors } = useTheme();
  return (
    <Screen testID="home-skeleton" accessibilityLabel="Loading Home">
      <View style={[styles.card, { backgroundColor: colors.bone }]}>
        <Skeleton width={72} height={18} radius={6} style={styles.onBone} />
        <View style={styles.block}>
          <Skeleton width={64} height={14} radius={6} style={styles.onBone} />
          <Skeleton width="56%" height={40} radius={8} style={styles.onBone} />
        </View>
        <View style={styles.block}>
          <Skeleton width={64} height={14} radius={6} style={styles.onBone} />
          <Skeleton width="38%" height={24} radius={8} style={styles.onBone} />
        </View>
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={styles.section}>
          <SkeletonText role="footnote" width="30%" />
          <View style={[styles.group, { backgroundColor: colors.surface }]}>
            {[0, 1].map((j) => (
              <View key={j} style={styles.row}>
                <View style={styles.text}>
                  <SkeletonText role="body" width={j ? '46%' : '58%'} />
                  <SkeletonText role="subhead" width="34%" />
                </View>
                <SkeletonText role="readoutS" width={72} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: RADIUS.card, padding: SPACE.l, gap: SPACE.l, minHeight: 200 },
  onBone: { opacity: 0.55 },
  block: { gap: SPACE.s },
  section: { gap: SPACE.s },
  group: { borderRadius: RADIUS.row, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, minHeight: 64 },
  text: { flex: 1, gap: 4 },
});
