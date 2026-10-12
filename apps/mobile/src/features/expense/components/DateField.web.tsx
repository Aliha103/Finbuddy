// apps/mobile/src/features/expense/components/DateField.web.tsx
// The web preview's date: Today, Yesterday, or another day from the browser's own date picker. A
// date input draws the date in the browser's format (10/11/2026 in a US-English browser), so at rest
// the field shows it the app's way instead (f.date, as every other screen does) and the real input
// lies over it, transparent: a click or Enter/Space opens the browser's picker, and the whole
// 48-point box is the target. Editing from the keyboard must be seen, so once the input has focus
// from the keyboard (Tab), or a key other than Enter/Space reaches it, or the browser cannot open
// its picker, the input itself shows in the box, with its segments and the active one marked, until
// focus leaves. A visually hidden live region announces each committed date ("Yesterday, 11 Oct
// 2026"); nothing under the field repeats it. Values are calendar dates (YYYY-MM-DD), the same
// shape the input speaks, so nothing is shifted by time zones.
import { addDays, isLocalDate, type LocalDate } from '@finbuddy/shared';
import { useRef, useState, type CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow, Icon, RADIUS, SPACE, TYPE, Text, focusRing, useTheme } from '@/design';
import type { Formatter } from '@/features/common/format';

export interface DateFieldProps {
  f: Formatter;
  value: LocalDate;
  today: LocalDate;
  onChange: (date: LocalDate) => void;
  testID?: string;
}

export function dateLabel(f: Formatter, date: LocalDate, today: LocalDate): string {
  if (date === today) return `Today, ${f.date(date)}`;
  if (date === addDays(today, -1)) return `Yesterday, ${f.date(date)}`;
  return f.date(date);
}

/** Opens the browser's picker. Where it cannot (no showPicker, or the browser refuses), the input shows and edits from the keyboard. */
function openPicker(input: HTMLInputElement, showInput: () => void): void {
  try {
    input.showPicker();
  } catch {
    showInput();
    input.focus();
  }
}

/** Keys that open the picker, move focus or dismiss: they leave the field at rest. */
const RESTING_KEYS = new Set(['Enter', ' ', 'Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta']);

/** Read by screen readers, never seen: a 1-point box whose clip hides everything it holds. */
const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
};

export function DateField({ f, value, today, onChange, testID }: DateFieldProps) {
  const { colors: c, minTouch, scheme } = useTheme();
  const yesterday = addDays(today, -1);
  const [focused, setFocused] = useState(false);
  /** The input is showing: keyboard editing is under way. */
  const [editing, setEditing] = useState(false);
  /** A pointer went down on the input, so the focus that follows is not the keyboard's. */
  const pointer = useRef(false);
  const showInput = () => setEditing(true);

  const resting: CSSProperties = {
    // Over the whole box, its border included, so every point of the 48-point target opens it.
    top: -BORDER,
    left: -BORDER,
    width: `calc(100% + ${2 * BORDER}px)`,
    height: `calc(100% + ${2 * BORDER}px)`,
    padding: 0,
    opacity: 0,
  };
  const shown: CSSProperties = {
    // Inside the border, which keeps drawing the focus state; set like the field's own text.
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: `0 ${SPACE.m}px`,
    opacity: 1,
    borderRadius: RADIUS.input - BORDER,
    backgroundColor: c.fill,
    color: c.label,
    // react-native-web's system stack, which every body Text on the web preview is set in.
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    lineHeight: `${TYPE.body.lineHeight}px`,
  };

  return (
    <View style={styles.box} testID={testID}>
      <Text role="subhead" color="labelSecondary">
        Date
      </Text>
      <View style={styles.row}>
        <ChipRow label="Date">
          <Chip label="Today" selected={value === today} onPress={() => onChange(today)} testID="date-today" />
          <Chip label="Yesterday" selected={value === yesterday} onPress={() => onChange(yesterday)} testID="date-yesterday" />
        </ChipRow>
        <View style={[styles.field, { minHeight: minTouch, backgroundColor: c.fill, borderColor: focused ? c.tint : 'transparent' }, focused ? focusRing(c.tint) : null]}>
          {/* What the field shows at rest; the input over it is what a screen reader and the keyboard reach. */}
          <View style={[styles.shown, editing ? styles.hidden : null]} aria-hidden>
            <Text role="body" color="label" numberOfLines={1} testID="date-shown">
              {f.date(value)}
            </Text>
            <Icon name="calendar" size={20} color={c.labelSecondary} />
          </View>
          <input
            type="date"
            aria-label={`${f.date(value)}. Choose another day`}
            value={value}
            max={today}
            data-testid="date-pick"
            data-editing={editing ? 'true' : 'false'}
            onChange={(e) => {
              const next = e.currentTarget.value;
              if (isLocalDate(next) && next <= today) onChange(next);
            }}
            onPointerDown={() => {
              pointer.current = true;
            }}
            onClick={(e) => openPicker(e.currentTarget, showInput)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPicker(e.currentTarget, showInput);
                return;
              }
              // Arrow keys, digits, Backspace: the edit happens in the input, so show it.
              if (!RESTING_KEYS.has(e.key)) showInput();
            }}
            onFocus={() => {
              setFocused(true);
              // Focus from the keyboard (Tab) shows the input at once; a click opens the picker instead.
              if (!pointer.current) showInput();
              pointer.current = false;
            }}
            onBlur={() => {
              setFocused(false);
              setEditing(false);
            }}
            style={{
              position: 'absolute',
              margin: 0,
              border: 0,
              // The box draws the focus state (the tint border and ring); the browser's own outline would double it.
              outline: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
              // 16 or more, so Safari on iPhone does not zoom the page when the input takes focus.
              fontSize: TYPE.body.size,
              // The app's scheme, which the in-app appearance setting can set apart from the system's.
              colorScheme: scheme,
              ...(editing ? shown : resting),
            }}
          />
        </View>
      </View>
      <span aria-live="polite" style={{ ...VISUALLY_HIDDEN, color: c.label }} data-testid="date-announce">
        {dateLabel(f, value, today)}
      </span>
    </View>
  );
}

/** The field's border: transparent at rest, the tint when focused (as Field draws it). */
const BORDER = 1.5;

const styles = StyleSheet.create({
  box: { gap: SPACE.s },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s, flexWrap: 'wrap' },
  field: { justifyContent: 'center', borderRadius: RADIUS.input, borderWidth: BORDER, paddingHorizontal: SPACE.m },
  shown: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  hidden: { opacity: 0 },
});
