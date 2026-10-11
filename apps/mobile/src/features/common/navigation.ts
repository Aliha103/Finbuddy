// apps/mobile/src/features/common/navigation.ts
// The per-platform stack chrome from DIRECTION.md section 4: large titles on tab roots collapsing
// on scroll (iOS), inline titles on detail screens, a top app bar on Android, and the brand's
// display face on the large title only. Body chrome stays in the platform face.
import type { NativeStackNavigationOptions } from 'expo-router/native-stack';
import { Platform } from 'react-native';

import { FONT, useTheme } from '@/design';

/** Default options for every native stack in the app. */
export function useStackOptions(): NativeStackNavigationOptions {
  const { colors, platform, scheme } = useTheme();
  const ios = platform === 'ios';
  return {
    headerTintColor: colors.tint,
    headerTitleStyle: { color: colors.label },
    // iOS: the collapsed bar is the system material (headerBlurEffect only applies to a transparent
    // header); the large-title state keeps the ground colour, so the title sits on the same surface
    // as the content. Android and the web draw an opaque top app bar on the ground.
    headerTransparent: ios,
    headerStyle: ios ? undefined : { backgroundColor: colors.ground },
    headerShadowVisible: false,
    headerLargeStyle: { backgroundColor: colors.ground },
    headerLargeTitleStyle: { color: colors.label, fontFamily: FONT.display },
    headerBackButtonDisplayMode: ios ? 'minimal' : undefined,
    headerBlurEffect: ios ? (scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterial') : undefined,
    contentStyle: { backgroundColor: colors.ground },
    // Android: the system and predictive Back gestures are honoured by the native stack itself.
    animation: Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
  };
}

/** Options for a tab's root screen: the large title (iOS) or the top app bar title (Android). */
export function largeTitle(title: string): NativeStackNavigationOptions {
  return { title, headerLargeTitle: Platform.OS === 'ios' };
}
