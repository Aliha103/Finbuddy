// apps/mobile/src/design/dialog.web.ts
// react-native-web's Alert is a no-op, so the web preview uses the browser's own confirm dialog.
import type { ConfirmDialogOptions } from './dialog';

export type { ConfirmDialogOptions };

export function confirmDialog({ title, message }: ConfirmDialogOptions): Promise<boolean> {
  if (typeof window === 'undefined' || typeof window.confirm !== 'function') return Promise.resolve(false);
  return Promise.resolve(window.confirm(`${title}\n\n${message}`));
}
