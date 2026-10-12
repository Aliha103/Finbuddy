// The FinBuddy card's order: the profile's currency first and the hero, the rest grouped by
// direction and code, never ranked by the size of figures in different currencies.
import { createSampleData, personalOverview, type CurrencyCode, type Money } from '@finbuddy/shared';
import { describe, expect, test } from 'vitest';

import { cardRoles, directionOf, orderCardReadouts, type CardReadout } from './cardOrder';

const r = (currency: CurrencyCode, amountMinor: number): CardReadout => {
  const money: Money = { currency, amountMinor };
  return { money, direction: directionOf(money) };
};
const codes = (list: readonly CardReadout[]) => list.map((x) => `${x.direction} ${x.money.currency}`);

describe('FinBuddy card order', () => {
  test('a large yen balance does not outrank the profile currency', () => {
    const ordered = orderCardReadouts([r('JPY', -2_148_600), r('USD', 18_592), r('GBP', -5_755)], 'GBP');
    expect(codes(ordered)).toEqual(['owe GBP', 'owe JPY', 'owed USD']);
    expect(cardRoles(ordered, 'GBP')).toEqual(['readoutXL', 'readoutM', 'readoutM']);
  });

  test('the rest follow the first readout direction, then the other, each by code', () => {
    const ordered = orderCardReadouts([r('USD', -100), r('EUR', 200), r('JPY', 300), r('CHF', -400), r('GBP', 500)], 'GBP');
    expect(codes(ordered)).toEqual(['owed GBP', 'owed EUR', 'owed JPY', 'owe CHF', 'owe USD']);
  });

  test('without a profile-currency balance, owed comes first and no readout is promoted', () => {
    const ordered = orderCardReadouts([r('USD', -100), r('JPY', 100_000), r('EUR', 5)], 'GBP');
    expect(codes(ordered)).toEqual(['owed EUR', 'owed JPY', 'owe USD']);
    expect(cardRoles(ordered, 'GBP')).toEqual(['readoutL', 'readoutL', 'readoutL']);
  });

  test('a single readout is the hero whatever its currency', () => {
    expect(cardRoles(orderCardReadouts([r('JPY', -100)], 'GBP'), 'GBP')).toEqual(['readoutXL']);
  });

  test('a currency rolling down to zero keeps its direction and its place', () => {
    const settling: CardReadout = { money: { currency: 'AUD', amountMinor: 0 }, direction: 'owe' };
    const ordered = orderCardReadouts([r('USD', 100), settling, r('GBP', -50)], 'GBP');
    expect(codes(ordered)).toEqual(['owe GBP', 'owe AUD', 'owed USD']);
  });

  test('the order never depends on the size of the figures', () => {
    const small = orderCardReadouts([r('KRW', -1), r('IDR', -2), r('USD', -3)], 'EUR');
    const large = orderCardReadouts([r('KRW', -9_000_000), r('IDR', -50_000_000), r('USD', -3)], 'EUR');
    expect(codes(large)).toEqual(codes(small));
  });

  test('the sample profile reads GBP first, then the other debt, then what is owed', () => {
    const data = createSampleData({ anchor: '2026-10-12' });
    const profile = data.profiles[0]!;
    const overview = personalOverview(profile.personId, data.expenses, data.settlements);
    const ordered = orderCardReadouts(
      overview.net.map((money) => ({ money, direction: directionOf(money) })),
      profile.defaultCurrency,
    );
    expect(overview.net.length).toBeGreaterThan(1);
    expect(ordered[0]?.money.currency).toBe(profile.defaultCurrency);
    const directions = ordered.map((x) => x.direction);
    // One change of direction at most: the same words run together.
    expect(directions.filter((d, i) => i > 0 && d !== directions[i - 1]).length).toBeLessThanOrEqual(1);
  });
});
