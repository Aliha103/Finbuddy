// apps/mobile/src/features/common/WebFrame.web.tsx
// The web export is also the public preview. In a window wider than a phone the whole app (headers,
// tab bar, FAB, the add and settle cards, confirmations' callers) renders inside one centred
// phone-width column, with the ground colour filling the rest of the window; phones and narrow
// windows stay full width. The tree is the same at every width, so resizing never remounts the app.
// On very wide windows a quiet line beside the column says what this is; nothing else is drawn.
import type { ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { useProfile } from '@/data';
import { Lockup, SPACE, Text, WEB_COLUMN, useTheme } from '@/design';

/** From this window width there is room for the note beside the column. */
const NOTE_BREAKPOINT = 1100;

export function WebFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const framed = width > WEB_COLUMN.breakpoint;
  const note = width >= NOTE_BREAKPOINT;
  return (
    <View style={[styles.window, { backgroundColor: colors.ground }]}>
      {note ? <PreviewNote right={(width + WEB_COLUMN.width) / 2 + SPACE.xxl} /> : null}
      <View
        style={[
          styles.column,
          { backgroundColor: colors.ground },
          framed ? { maxWidth: WEB_COLUMN.width, borderLeftWidth: StyleSheet.hairlineWidth, borderRightWidth: StyleSheet.hairlineWidth, borderColor: colors.separator } : null,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function PreviewNote({ right }: { right: number }) {
  const { colors } = useTheme();
  const profile = useProfile();
  return (
    <View style={[styles.note, { right }]}>
      <Lockup height={28} color={colors.label} tile={colors.tint} bars={colors.onTint} />
      <Text role="footnote" color="labelSecondary" align="right">
        {`Preview of the FinBuddy app for iOS and Android.${profile?.isSample ? ' Sample data.' : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  window: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  column: { flex: 1, width: '100%', overflow: 'hidden' },
  note: { position: 'absolute', top: SPACE.xxl, width: 240, gap: SPACE.m, alignItems: 'flex-end' },
});
