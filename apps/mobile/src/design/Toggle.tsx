// apps/mobile/src/design/Toggle.tsx
// The platform switch in the brand's colours: the tint for the on-track, the fill for the off-track,
// a white thumb. react-native-web colours the on-thumb teal unless `activeThumbColor` is set, so the
// web preview passes it too; native ignores the extra prop.
import { Platform, Switch, type SwitchProps } from 'react-native';

import { useTheme } from './theme';

export interface ToggleProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  accessibilityLabel: string;
}

export function Toggle({ value, onValueChange, accessibilityLabel, ...rest }: ToggleProps) {
  const { colors } = useTheme();
  const webThumb = Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF' } as object) : null;
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.fill, true: colors.tint }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.fill}
      {...webThumb}
      {...rest}
    />
  );
}
