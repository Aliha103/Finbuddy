import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from '@finbuddy/shared';

/**
 * StorageAdapter on AsyncStorage (localStorage on the web).
 *
 * When the platform refuses storage (private browsing, a sandboxed iframe, a full disk) the
 * adapter keeps working from memory for the rest of the session instead of failing, and
 * isStoragePersistent() turns false so the UI can say that changes will not survive a reload.
 */
const memory = new Map<string, string>();
let persistent = true;

function fallBack(): void {
  persistent = false;
}

export const deviceStorage: StorageAdapter = {
  async getItem(key) {
    if (persistent) {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        fallBack();
      }
    }
    return memory.get(key) ?? null;
  },
  async setItem(key, value) {
    memory.set(key, value);
    if (!persistent) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      fallBack();
    }
  },
  async removeItem(key) {
    memory.delete(key);
    if (!persistent) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      fallBack();
    }
  },
};

/** False once the device refused to store data; changes then last only until the app closes. */
export function isStoragePersistent(): boolean {
  return persistent;
}
