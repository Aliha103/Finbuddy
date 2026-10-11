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
