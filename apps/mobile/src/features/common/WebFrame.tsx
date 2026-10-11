// apps/mobile/src/features/common/WebFrame.tsx
// On a device the app fills the screen; the web export's centred column lives in WebFrame.web.tsx.
import type { ReactNode } from 'react';

export function WebFrame({ children }: { children: ReactNode }) {
  return children;
}
