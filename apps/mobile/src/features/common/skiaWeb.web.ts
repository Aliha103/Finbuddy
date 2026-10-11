// apps/mobile/src/features/common/skiaWeb.web.ts
// Skia on the web preview runs on CanvasKit (WebAssembly). The root layout starts the load once the
// first screen has painted; components that draw with Skia check useSkiaReady() and show their
// plain fallback until then. The .wasm ships as a bundled asset (metro.config.js adds the
// extension), so the preview needs no CDN and works from any sub-path.
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
// Metro turns the file into a URL string on the web (make-relative.mjs keeps it relative).
import wasmUrl from 'canvaskit-wasm/bin/full/canvaskit.wasm';
import { useEffect, useState } from 'react';

let ready = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function resolveAsset(url: string): string {
  try {
    return new URL(url, typeof document !== 'undefined' ? document.baseURI : undefined).href;
  } catch {
    return url;
  }
}

/** Loads CanvasKit once. Safe to call many times; errors leave the fallbacks in place. */
export function startSkiaWeb(): Promise<void> {
  if (ready) return Promise.resolve();
  loading ??= LoadSkiaWeb({ locateFile: () => resolveAsset(wasmUrl) })
    .then(() => {
      ready = true;
      for (const l of [...listeners]) l();
    })
    .catch((error: unknown) => {
      loading = null;
      console.warn('CanvasKit did not load; Skia drawings keep their fallbacks.', error);
    });
  return loading;
}

/** True once CanvasKit is loaded; re-renders the caller when it arrives. */
export function useSkiaReady(): boolean {
  const [state, setState] = useState(ready);
  useEffect(() => {
    if (ready) return;
    const l = () => setState(true);
    listeners.add(l);
    void startSkiaWeb();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return state;
}

/**
 * A Skia drawing module for the web, where it must not run before CanvasKit has loaded:
 * @shopify/react-native-skia builds its web API from the CanvasKit global when its module first
 * runs. `load` is a synchronous require written at the call site, so Metro keeps the module in the
 * one web bundle (no split chunk to resolve from a sub-path) while deferring its evaluation.
 * Returns a hook that gives null until CanvasKit is ready, or if the module cannot load on this
 * browser (the caller keeps its plain fallback), and the module after that.
 */
export function deferSkiaModule<M>(load: () => M, unavailable: string): () => M | null {
  let loaded: M | null = null;
  let failed = false;
  const get = (): M | null => {
    if (loaded || failed) return loaded;
    try {
      loaded = load();
    } catch (error) {
      failed = true;
      console.warn(unavailable, error);
    }
    return loaded;
  };
  return function useSkiaModule() {
    return useSkiaReady() ? get() : null;
  };
}
