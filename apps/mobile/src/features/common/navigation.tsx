// apps/mobile/src/features/common/navigation.tsx
// The per-platform stack chrome from DIRECTION.md section 4: large titles on tab roots collapsing
// on scroll (iOS), inline titles on detail screens, a top app bar on Android, and the brand's
// display face on the large title only. Body chrome stays in the platform face. On the web preview
// the back control is HeaderBack, a full-size target.
import type { NativeStackNavigationOptions } from 'expo-router/native-stack';
import { Platform } from 'react-native';

import { FONT, useTheme } from '@/design';

import { HeaderBack } from './HeaderButton';

/** The web preview's header back control; undefined (the platform's own) on a device. */
export const webHeaderBack: NativeStackNavigationOptions['headerLeft'] =
  Platform.OS === 'web' ? (props: { canGoBack?: boolean; label?: string; onPress?: () => void }) => <HeaderBack {...props} /> : undefined;

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
    headerLeft: webHeaderBack,
    // Android: the system and predictive Back gestures are honoured by the native stack itself.
    animation: Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
  };
}

/**
 * Options for a tab's root screen: the large title (iOS) or the top app bar title (Android). A tab
 * root has nothing to go back to, so it clears the web preview's back slot: an empty headerLeft
 * still takes the title's leading inset, which put the title 4 points from the edge.
 */
export function largeTitle(title: string): NativeStackNavigationOptions {
  return { title, headerLargeTitle: Platform.OS === 'ios', headerLeft: undefined };
}
