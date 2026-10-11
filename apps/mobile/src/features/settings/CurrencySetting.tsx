// apps/mobile/src/features/settings/CurrencySetting.tsx
// The profile's default currency: the searchable list with a readout preview above it.
import { useDeviceLocale, useProfile, updateProfile } from '@/data';
import { Card, Readout, Text } from '@/design';

import { CurrencyPicker } from '../common/CurrencyPicker';
import { exampleMoney, useRegionCurrency } from '../common/currency';
import { Screen } from '../common/Screen';

export function CurrencySetting() {
  const profile = useProfile();
  const locale = useDeviceLocale();
  const region = useRegionCurrency();
  const current = profile?.defaultCurrency ?? region;
  return (
    <Screen testID="currency-setting">
      <Card>
        <Text role="subhead" color="labelSecondary">
          Personal expenses default to
        </Text>
        <Readout money={exampleMoney(current)} locale={locale} role="readoutXL" live />
        <Text role="footnote" color="labelTertiary">
          Groups keep their own currency, and balances are never converted or summed across currencies.
        </Text>
      </Card>
      <CurrencyPicker
        locale={locale}
        value={current}
        suggested={[region, 'EUR', 'USD', 'GBP', 'JPY']}
        onChange={(code) => {
          if (code !== current) void updateProfile({ defaultCurrency: code }).catch(() => {});
        }}
      />
    </Screen>
  );
}
