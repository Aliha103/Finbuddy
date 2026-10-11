// apps/mobile/src/design/frame.ts
// The width the app is laid out in. On a phone that is the window. The web export is also served as
// a public preview, and in a window wider than a phone the whole app sits in one centred phone-width
// column (WebFrame.web.tsx) with the ground filling the rest; anything that sizes itself from the
// width reads it here, never from the window, so it agrees with the column.
import { Platform, useWindowDimensions } from 'react-native';

export const WEB_COLUMN = {
  /** Windows wider than this get the centred column; phones and narrow windows stay full width. */
  breakpoint: 600,
  /** The column's width. */
  width: 440,
} as const;

/** The app's layout width for a window width: the column on a wide web window, else the window. */
export function appWidthFor(windowWidth: number): number {
  return Platform.OS === 'web' && windowWidth > WEB_COLUMN.breakpoint ? WEB_COLUMN.width : windowWidth;
}

/** The width the app is laid out in (the column on a wide web window). */
export function useAppWidth(): number {
  return appWidthFor(useWindowDimensions().width);
}
