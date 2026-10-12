// apps/mobile/src/features/common/device.ts
// Where FinBuddy keeps its data, in words. On iOS and Android that is the phone; the web build keeps
// everything in the browser's own storage, so the same sentences name "this browser" there. Every
// sentence that names the device goes through one of these, so the web build never says "phone".
import { Platform } from 'react-native';

const WEB = Platform.OS === 'web';

/** "this phone" on a device, "this browser" on the web build. */
export const THIS_DEVICE = WEB ? 'this browser' : 'this phone';

/** Where the data is, as a place: "on this phone" on a device, "in this browser" on the web build. */
export const ON_THIS_DEVICE = WEB ? 'in this browser' : 'on this phone';

/** Where the work happens, for the insights' footnotes: "on your phone" on a device, "in this browser" on the web build. */
export const ON_YOUR_DEVICE = WEB ? 'in this browser' : 'on your phone';

/** A sentence in its device wording and its web wording; the device's words are unchanged on iOS and Android. */
export function onDevice(native: string, web: string): string {
  return WEB ? web : native;
}
