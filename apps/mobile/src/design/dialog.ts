// apps/mobile/src/design/dialog.ts (native)
// The platform's two-step confirmation: an alert on iOS, a Material dialog on Android. Used by the
// Gate when a screen reader or Reduce Motion is on, or the person asked for a dialog instead of a hold.
import { Alert } from 'react-native';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive }: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
