// Vitest setup: the two native modules the data layer imports, replaced with Node equivalents.
// The fake AsyncStorage lives on globalThis so it survives vi.resetModules(), which the store tests
// use to boot the singleton store again against what an earlier "launch" saved.
import { randomFillSync } from 'node:crypto';
import { vi } from 'vitest';

export type FakeStorage = Map<string, string> & { failing?: boolean };

declare global {
  var __finbuddyStorage: FakeStorage | undefined;
}

export function fakeStorage(): FakeStorage {
  globalThis.__finbuddyStorage ??= new Map<string, string>() as FakeStorage;
  return globalThis.__finbuddyStorage;
}

vi.mock('expo-crypto', () => ({
  getRandomBytes: (length: number) => randomFillSync(new Uint8Array(length)),
}));

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = () => {
    const s = fakeStorage();
    if (s.failing) throw new Error('storage refused');
    return s;
  };
  return {
    default: {
      getItem: async (key: string) => store().get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store().set(key, value);
      },
      removeItem: async (key: string) => {
        store().delete(key);
      },
      multiGet: async (keys: string[]) => keys.map((k) => [k, store().get(k) ?? null] as [string, string | null]),
      clear: async () => {
        store().clear();
      },
    },
  };
});

vi.mock('expo-localization', () => ({
  useLocales: () => [{ languageTag: 'en-GB', regionCode: 'GB', currencyCode: 'GBP' }],
}));
