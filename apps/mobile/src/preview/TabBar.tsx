import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TABS, useNavigation } from './navigation';
import { MIN_TOUCH, space, usePalette } from './theme';
import { T } from './ui';

/**
 * PREVIEW TAB BAR. Plain text tabs held in React state (no URL changes, see navigation.tsx).
 * The selected tab shows as weight plus an indicator line, never as colour alone.
 */
export function TabBar() {
  const c = usePalette();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View accessibilityRole="tablist" style={[local.bar, { paddingBottom: insets.bottom, backgroundColor: c.surface, borderTopColor: c.separator }]}>
      {TABS.map((tab) => {
        const selected = tab.id === nav.tab;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            accessibilityHint={selected ? 'Returns to the top of this tab' : undefined}
            onPress={() => nav.selectTab(tab.id)}
            style={({ pressed }) => [local.tab, { backgroundColor: pressed ? c.pressed : 'transparent' }]}
          >
            <View style={[local.indicator, { backgroundColor: selected ? c.tint : 'transparent' }]} />
            <T variant="footnote" weight={selected ? '700' : '400'} tone={selected ? 'primary' : 'secondary'} importantForAccessibility="no" numberOfLines={1} style={local.label}>
              {tab.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

const local = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, minHeight: MIN_TOUCH + 6, alignItems: 'center', justifyContent: 'flex-start', paddingBottom: space.s, gap: space.s - 2 },
  indicator: { height: 3, alignSelf: 'stretch', marginHorizontal: space.m, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  label: { textAlign: 'center', paddingHorizontal: space.xs },
});
