// apps/mobile/src/features/common/device.ts
// Where FinBuddy keeps its data, in words. On iOS and Android that is the phone; the web build keeps
// everything in the browser's own storage, so the same sentences say "this browser" there.
import { Platform } from 'react-native';

/** "this phone" on a device, "this browser" on the web build. */
export const THIS_DEVICE = Platform.OS === 'web' ? 'this browser' : 'this phone';
