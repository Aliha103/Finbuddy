// apps/mobile/src/design/Toggle.tsx
// The platform switch in the brand's colours. iOS keeps the system switch (white thumb, the tint
// for the on-track, the fill for the off-track). Android follows Material 3, where the thumb carries
// the state: off is a dark thumb on the light fill (white on the fill alone was 1.1:1 against the
// row and read as no control at all), on is the onTint thumb on the tint. The web preview draws its
// own (Toggle.web.tsx), since react-native-web's switch is a 40 x 20 target.
import { Platform, Switch, type SwitchProps } from 'react-native';

import { useTheme } from './theme';

export interface ToggleProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {
  accessibilityLabel: string;
}

export function Toggle({ value, onValueChange, accessibilityLabel, ...rest }: ToggleProps) {
  const { colors } = useTheme();
  const ios = Platform.OS === 'ios';
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.fill, true: colors.tint }}
      thumbColor={ios ? '#FFFFFF' : value ? colors.onTint : colors.labelSecondary}
      ios_backgroundColor={colors.fill}
      {...rest}
    />
  );
}
