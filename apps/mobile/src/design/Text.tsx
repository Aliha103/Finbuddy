// apps/mobile/src/design/Text.tsx
// The text primitive. Roles map to iOS Dynamic Type styles (dynamicTypeRamp, so Apple's per-style
// scaling curves apply) and to Material type roles (sp scaling through allowFontScaling). Readouts
// cap at 1.6x and are set with the size pre-multiplied, so digit columns and symbols agree.
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { readoutFamilyFor, readoutWeightFor } from './fonts';
import { textStyle, useTheme } from './theme';
import { READOUT_MAX_SCALE, TYPE, type ColorRole, type TypeRole } from './tokens';

export interface TextProps extends Omit<RNTextProps, 'role'> {
  /** The ARIA role (React Native's own `role`), renamed because `role` here is the type role. */
  ariaRole?: RNTextProps['role'];
  role?: TypeRole;
  color?: ColorRole;
  /** Overrides the role's family: 'system' forces the platform face (used for sentences that carry amounts). */
  face?: 'role' | 'system';
  /** Tabular figures on a non-readout role (e.g. dates in a column). */
  tabular?: boolean;
  align?: TextStyle['textAlign'];
}

const isReadout = (role: TypeRole) => role.startsWith('readout');

/**
 * Text with a design role. Body roles follow the system size without a cap; readouts cap at 1.6x
 * through maxFontSizeMultiplier and, when their text uses a glyph Mona Sans lacks, switch to the
 * platform face with tabular figures (FONTS.md).
 */
export function Text({ role = 'body', color = 'label', face = 'role', tabular, align, ariaRole, style, children, ...rest }: TextProps) {
  const { colors } = useTheme();
  const spec = TYPE[role];
  const base = textStyle(role, colors, color);
  if (isReadout(role) || face === 'system') {
    const family = face === 'system' ? undefined : readoutFamilyFor(typeof children === 'string' ? children : '', spec.family);
    base.fontFamily = family;
    base.fontWeight = readoutWeightFor(family, spec.weight);
  }
  return (
    <RNText
      role={ariaRole}
      dynamicTypeRamp={spec.ios}
      maxFontSizeMultiplier={isReadout(role) ? READOUT_MAX_SCALE : undefined}
      {...rest}
      style={[base, tabular ? { fontVariant: ['tabular-nums'] } : null, align ? { textAlign: align } : null, style]}
    >
      {children}
    </RNText>
  );
}

/** Pre-multiplied metrics for a role at the current readout scale (used where allowFontScaling must be off). */
export function scaledType(role: TypeRole, scale: number): { fontSize: number; lineHeight: number } {
  const t = TYPE[role];
  return { fontSize: Math.round(t.size * scale * 100) / 100, lineHeight: Math.round(t.lineHeight * scale * 100) / 100 };
}
