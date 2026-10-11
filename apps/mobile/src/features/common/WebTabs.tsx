// apps/mobile/src/features/common/WebTabs.tsx
// The web preview's tab bar: expo-router's JS Tabs (react-navigation bottom tabs) styled with the
// Material role mapping, since NativeTabs has no web implementation the export can use. Devices get
// NativeTabs from app/(tabs)/_layout.tsx; this file is what app/(tabs)/_layout.web.tsx renders.
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon, SPACE, useTheme, type IconName } from '@/design';

const TABS: { name: string; title: string; icon: IconName; iconFill: IconName }[] = [
  { name: '(home)', title: 'Home', icon: 'home', iconFill: 'homeFill' },
  { name: '(groups)', title: 'Groups', icon: 'groups', iconFill: 'groupsFill' },
  { name: '(spending)', title: 'Spending', icon: 'spending', iconFill: 'spendingFill' },
  { name: '(activity)', title: 'Activity', icon: 'activity', iconFill: 'activityFill' },
];

export function WebTabs() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Material 3 navigation bar: the active destination wears the wash pill behind its icon (the
        // active indicator) and the tint; colour alone would not separate graphite from a grey label.
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.labelTertiary,
        // M3 navigation bar geometry: 80 tall, a 32-point icon slot (the indicator pill), a 16-point label line.
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator, height: 80, paddingTop: SPACE.s },
        tabBarIconStyle: { width: 64, height: 32 },
        // lineHeight: react-navigation gives the label a 13-point box at 12 pt, which cuts the descenders of "Spending" and "Activity".
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '600', marginTop: SPACE.xs },
        sceneStyle: { backgroundColor: colors.ground },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.indicator, focused ? { backgroundColor: colors.tintWash } : null]}>
                <Icon name={focused ? tab.iconFill : tab.icon} size={24} color={String(color)} />
              </View>
            ),
            tabBarButtonTestID: `tab-${tab.title.toLowerCase()}`,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // M3 active indicator: 64 x 32, fully rounded.
  indicator: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
