// apps/mobile/src/features/common/AddAccessory.tsx
// The iOS 26 bottom accessory above the tab bar: "Add expense" in a Liquid Glass capsule where the
// OS has it (isLiquidGlassAvailable), a filled tint capsule otherwise.
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SPACE, Text, useHaptic, useTheme } from '@/design';

export function AddAccessory() {
  const { colors } = useTheme();
  const haptic = useHaptic();
  const glass = isLiquidGlassAvailable();
  const content = (
    <View style={styles.inner}>
      <Icon name="add" size={20} color={glass ? colors.tint : colors.onTint} />
      <Text role="headline" style={{ color: glass ? colors.tint : colors.onTint }}>
        Add expense
      </Text>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add expense"
      onPress={() => {
        haptic('select');
        router.push('/add');
      }}
      style={({ pressed }) => [styles.capsule, { opacity: pressed ? 0.85 : 1 }]}
      testID="add-accessory"
    >
      {glass ? (
        <GlassView glassEffectStyle="regular" isInteractive style={styles.glass}>
          {content}
        </GlassView>
      ) : (
        <View style={[styles.glass, { backgroundColor: colors.tint }]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  capsule: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACE.s },
  glass: { borderRadius: 999, minHeight: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, paddingHorizontal: SPACE.l },
});
