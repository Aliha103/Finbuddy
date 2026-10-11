// apps/mobile/src/app/(tabs)/_layout.tsx
// Four sections, native on each OS: UITabBarController on iOS (Liquid Glass on iOS 26, with the
// "Add expense" bottom accessory), Material 3 navigation bar on Android. The web preview renders
// _layout.web.tsx instead (JS tabs), since NativeTabs has no web implementation.
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useTheme } from '@/design/theme';
import { AddAccessory } from '@/features/common/AddAccessory';
import { DataGate } from '@/features/common/DataGate';

export default function TabsLayout() {
  const { colors, platform } = useTheme();
  const ios = platform === 'ios';
  return (
    <DataGate>
      <NativeTabs
        tintColor={colors.tint}
        // Only the selected icon takes the tint. The unselected colour stays the platform's own grey:
        // with a graphite tint, labelSecondary (#5F5564) would be indistinguishable from the tint
        // (#4A4652), and Material draws its active indicator pill on Android regardless.
        iconColor={{ selected: colors.tint }}
        backgroundColor={ios ? undefined : colors.surface}
        minimizeBehavior={ios ? 'onScrollDown' : undefined}
        labelVisibilityMode="labeled"
      >
        {Platform.OS === 'ios' ? (
          <NativeTabs.BottomAccessory>
            <AddAccessory />
          </NativeTabs.BottomAccessory>
        ) : null}
        <NativeTabs.Trigger name="(home)">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(groups)">
          <NativeTabs.Trigger.Label>Groups</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} md="group" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(spending)">
          <NativeTabs.Trigger.Label>Spending</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} md="bar_chart" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(activity)">
          <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} md="history" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </DataGate>
  );
}
