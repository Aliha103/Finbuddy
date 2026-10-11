// apps/mobile/src/features/common/skiaWeb.ts (native)
// Skia is native on iOS and Android: nothing to load, every canvas can draw at once.
// The web preview needs CanvasKit first; see skiaWeb.web.ts.
export function startSkiaWeb(): Promise<void> {
  return Promise.resolve();
}

/** True once Skia can draw. Always true on a device. */
export function useSkiaReady(): boolean {
  return true;
}

/** The web's deferred Skia module (skiaWeb.web.ts); on a device the module loads on first use. */
export function deferSkiaModule<M>(load: () => M, unavailable: string): () => M | null {
  let loaded: M | null = null;
  return function useSkiaModule() {
    if (loaded) return loaded;
    try {
      loaded = load();
    } catch (error) {
      console.warn(unavailable, error);
    }
    return loaded;
  };
}
