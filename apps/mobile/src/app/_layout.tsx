// apps/mobile/src/app/_layout.tsx
// Root: fonts, theme, data store, the stack that holds the tabs and the app-wide modals, and on the
// web preview the CanvasKit load that Skia drawings wait for.
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { startDataStore } from '@/data';
import { useAppFonts } from '@/design/fonts';
import { ThemeProvider, useTheme } from '@/design/theme';
import { DURATION } from '@/design/tokens';
import { useStackOptions } from '@/features/common/navigation';
import { startSkiaWeb } from '@/features/common/skiaWeb';

// Hold the splash until the readout face is available, so the hero readout never flashes the system
// face on a cold start. On device builds the fonts are embedded (expo-font config plugin) and this
// resolves at once; in Expo Go and on the web they load from the bundle. A 1.5 s timeout caps the wait.
const SPLASH_TIMEOUT = 1500;
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or unavailable (web): nothing to hold.
});
if (Platform.OS !== 'web') {
  try {
    SplashScreen.setOptions({ fade: true, duration: DURATION.standard });
  } catch {
    // Older native runtime without setOptions.
  }
}

function hideSplash(): void {
  SplashScreen.hideAsync().catch(() => {});
}

export default function RootLayout() {
  const { ready } = useAppFonts();
  useEffect(() => {
    void startDataStore();
    const timer = setTimeout(hideSplash, SPLASH_TIMEOUT);
    // The web preview loads CanvasKit (8 MB) after the first screen has painted; native needs nothing.
    const skia = setTimeout(() => void startSkiaWeb(), 800);
    return () => {
      clearTimeout(timer);
      clearTimeout(skia);
    };
  }, []);
  useEffect(() => {
    if (ready) hideSplash();
  }, [ready]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { scheme, platform } = useTheme();
  const options = useStackOptions();
  const ios = platform === 'ios';
  const web = Platform.OS === 'web';
  // Add expense and Settle up: a form sheet on iOS, a full-screen Material dialog on Android; the web preview pushes a card.
  const taskPresentation = ios ? 'formSheet' : web ? 'card' : 'fullScreenModal';
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={options}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="add"
          options={{
            headerShown: false,
            presentation: taskPresentation,
            sheetAllowedDetents: ios ? [0.92, 1] : undefined,
            sheetGrabberVisible: ios,
            sheetCornerRadius: ios ? 20 : undefined,
            animation: Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
          }}
        />
        <Stack.Screen name="settle" options={{ title: 'Settle up', presentation: taskPresentation, sheetAllowedDetents: ios ? 'fitToContents' : undefined, sheetGrabberVisible: ios }} />
        <Stack.Screen name="expense/[expenseId]" options={{ title: 'Expense' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: ios ? 'modal' : 'card' }} />
        <Stack.Screen name="dev/gallery" options={{ title: 'Design gallery' }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
