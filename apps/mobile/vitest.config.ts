// Tests for the data layer run in Node against the real engine (@finbuddy/shared is TypeScript
// source); the two device modules it touches (expo-crypto for ids, AsyncStorage for persistence)
// are replaced in src/test/setup.ts, so nothing here needs React Native.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
