// apps/mobile/src/features/spending/CategoryRow.tsx
// One category in the "By category" list: name, count and total (a readout), with a proportional
// bar under them scaled to the largest category. Opens the category screen.
import type { Money } from '@finbuddy/shared';

import { BarRow, Readout } from '@/design';

import { expenseCount } from './copy';

export interface CategoryRowProps {
  label: string;
  count: number;
  total: Money;
  /** The spoken total (currency name) for the row's accessibility label. */
  spokenTotal: string;
  /** 0..1 of the largest category in the list. */
  fraction: number;
  locale: string;
  onPress: () => void;
  testID?: string;
}

export function CategoryRow({ label, count, total, spokenTotal, fraction, locale, onPress, testID }: CategoryRowProps) {
  return (
    <BarRow
      title={label}
      subtitle={expenseCount(count)}
      detail={<Readout money={total} locale={locale} role="readoutS" inline />}
      bar={{ fraction }}
      onPress={onPress}
      accessibilityLabel={`${label}, ${spokenTotal}, ${expenseCount(count)}`}
      accessibilityHint="Opens this category"
      testID={testID}
    />
  );
}
