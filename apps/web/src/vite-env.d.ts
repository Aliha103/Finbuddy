/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build-time links; see src/lib/links.ts. */
  readonly VITE_APP_URL?: string;
  readonly VITE_ANDROID_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
