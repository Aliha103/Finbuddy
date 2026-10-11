import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The demo runs the real engine from packages/shared as TypeScript source. apps/web stays outside
// the root npm workspaces (the root overrides vite to ^7, which would fight vite 8 here), so the
// engine is reached by an alias and the dev server is allowed to read that folder.
const sharedEntry = fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url));
const sharedDir = fileURLToPath(new URL('../../packages/shared', import.meta.url));

export default defineConfig({
  // '/' on Netlify (the site root); GitHub Pages sets BASE_PATH=/Finbuddy/ in its workflow.
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@finbuddy/shared': sharedEntry },
  },
  server: {
    fs: { allow: ['.', sharedDir] },
  },
  // The build-time prerender (src/entry-server.tsx) bundles every dependency so Node never has
  // to load browser-only packages from node_modules on its own.
  ssr: { noExternal: true },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        // A small split so the heavy libraries never sit in the entry chunk: React on its own,
        // GSAP core with the two plugins the first viewport uses, and three.js with Fiber in a
        // chunk that is only imported when the card fan is near the viewport. Flip, DrawSVG and
        // MotionPath are dynamic imports of their own and stay out of the 'gsap' group.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'three', test: /node_modules[\\/](three|@react-three)[\\/]/, priority: 20 },
            {
              name: 'gsap',
              test: /node_modules[\\/](@gsap[\\/]react|gsap[\\/](index|gsap-core|CSSPlugin|ScrollTrigger|Observer|SplitText|CustomEase)\.js)/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
