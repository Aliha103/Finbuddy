import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/Finbuddy/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/components': fileURLToPath(new URL('./src/Components', import.meta.url)),
      '@/pages': fileURLToPath(new URL('./src/Pages', import.meta.url)),
      '@/hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@/constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
      '@/services': fileURLToPath(new URL('./src/services', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true, // enables describe/it/expect globally
    setupFiles: './src/test/setup.js', // for jest-dom custom matchers (optional but recommended)
  },
})
