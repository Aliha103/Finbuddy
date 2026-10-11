import { DEFAULT_STORAGE_KEY, balancesByGroup, deserializeSnapshot, isUlid, type ExpenseDraft } from '@finbuddy/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeStorage } from '../test/setup';

async function launch() {
  vi.resetModules();
  const store = await import('./store');
  const actions = await import('./actions');
  const selectors = await import('./selectors');
  await store.startDataStore();
  return { ...store, ...actions, ...selectors, state: () => store.useDataStore.getState() };
}

/** The sample set, with the people and groups looked up by name. */
async function sampleApp() {
  const app = await launch();
  await app.keepSampleData();
  const { snapshot } = app.state();
  const person = (name: string) => snapshot.people.find((p) => p.displayName.startsWith(name))!;
  const group = (name: string) => snapshot.groups.find((g) => g.name.startsWith(name))!;
  return { ...app, me: snapshot.profiles[0]!.personId, person, group };
}

beforeEach(() => {
  fakeStorage().clear();
  fakeStorage().failing = false;
});

describe('startFresh', () => {
  it('creates one person and one profile on an otherwise empty snapshot and saves them', async () => {
    const app = await launch();
    const profile = await app.startFresh({ displayName: '  Jo  ', defaultCurrency: 'EUR', locale: 'de-DE' });
    const { snapshot, status } = app.state();
    expect(status).toBe('ready');
    expect(snapshot.profiles).toEqual([profile]);
    expect(profile.displayName).toBe('Jo');
    expect(profile.defaultCurrency).toBe('EUR');
    expect(profile.locale).toBe('de-DE');
    expect(profile.isSample).toBeUndefined();
    expect(snapshot.people).toHaveLength(1);
    expect(snapshot.people[0]?.id).toBe(profile.personId);
    expect(isUlid(profile.id)).toBe(true);
    expect(snapshot.groups).toEqual([]);
    expect(deserializeSnapshot(fakeStorage().get(DEFAULT_STORAGE_KEY)!)).toEqual(snapshot);
  });

  it('refuses an empty name and an unknown currency', async () => {
    const app = await launch();
    await expect(app.startFresh({ displayName: '   ', defaultCurrency: 'GBP', locale: 'en-GB' })).rejects.toThrow(RangeError);
    await expect(app.startFresh({ displayName: 'Jo', defaultCurrency: 'XXX' as never, locale: 'en-GB' })).rejects.toThrow(RangeError);
    expect(app.state().snapshot.profiles).toEqual([]);
  });

  it('replaces sample data with the real profile', async () => {
    const app = await sampleApp();
    await app.startFresh({ displayName: 'Jo', defaultCurrency: 'GBP', locale: 'en-GB' });
    expect(app.state().snapshot.profiles[0]?.isSample).toBeUndefined();
    expect(app.state().snapshot.expenses).toEqual([]);
  });
});

describe('profile', () => {
  it('updateProfile changes the profile and keeps the owner person record in step', async () => {
    const app = await launch();
    const profile = await app.startFresh({ displayName: 'Jo', defaultCurrency: 'GBP', locale: 'en-GB' });
    const updated = await app.updateProfile({ displayName: 'Joanna', defaultCurrency: 'JPY' });
    expect(updated.id).toBe(profile.id);
    expect(updated.displayName).toBe('Joanna');
    expect(updated.defaultCurrency).toBe('JPY');
    expect(app.state().snapshot.people[0]?.displayName).toBe('Joanna');
    await expect(app.updateProfile({ displayName: '' })).rejects.toThrow(RangeError);
    await expect(app.updateProfile({ defaultCurrency: 'NOPE' as never })).rejects.toThrow(RangeError);
  });
});

describe('groups and people', () => {
  it('createGroup makes person records for new members and puts the owner first', async () => {
    const app = await launch();
    const profile = await app.startFresh({ displayName: 'Jo', defaultCurrency: 'GBP', locale: 'en-GB' });
    const sam = await app.addPerson({ displayName: 'Sam', email: 'sam@example.com' });
    const group = await app.createGroup({ name: 'Ski trip', currency: 'CHF', memberIds: [sam.id], newMemberNames: ['Kim'] });
    const { snapshot } = app.state();
    expect(group.memberIds[0]).toBe(profile.personId);
    expect(group.memberIds).toContain(sam.id);
    expect(group.memberIds).toHaveLength(3);
    expect(snapshot.people.map((p) => p.displayName).sort()).toEqual(['Jo', 'Kim', 'Sam']);
    expect(snapshot.people.find((p) => p.displayName === 'Sam')?.email).toBe('sam@example.com');
    expect(snapshot.groups).toEqual([group]);
  });

  it('createGroup needs a profile', async () => {
    const app = await launch();
    await expect(app.createGroup({ name: 'Nope', currency: 'GBP' })).rejects.toThrow(/onboarding/);
  });

  it('updateGroup renames and re-currencies, and refuses to drop a member who is still in expenses', async () => {
    const app = await sampleApp();
    const trip = app.group('Trip to Japan');
    const blake = app.person('Blake');

    const renamed = await app.updateGroup(trip.id, { name: ' Japan 2026 ' });
    expect(renamed.ok && renamed.group.name).toBe('Japan 2026');
    expect(renamed.ok && renamed.group.currency).toBe('JPY');

    const dropped = await app.updateGroup(trip.id, { memberIds: trip.memberIds.filter((id) => id !== blake.id) });
    expect(dropped.ok).toBe(false);
    if (!dropped.ok) {
      expect(dropped.blockedMemberIds).toEqual([blake.id]);
      expect(dropped.problems.length).toBeGreaterThan(0);
      expect(dropped.problems[0]).toMatch(blake.id);
    }
    expect(app.state().snapshot.groups.find((g) => g.id === trip.id)?.memberIds).toEqual(trip.memberIds);

    const blank = await app.updateGroup(trip.id, { name: '  ' });
    expect(blank.ok).toBe(false);
    const missing = await app.updateGroup('01ARZ3NDEKTSV4RRFFQ69G5FAV', { name: 'x' });
    expect(missing.ok).toBe(false);
  });

  it('updateGroup never removes the creator, and can add a member', async () => {
    const app = await sampleApp();
    const trip = app.group('Trip to Japan');
    const emery = app.person('Emery');
    const result = await app.updateGroup(trip.id, { memberIds: [...trip.memberIds.filter((id) => id !== app.me), emery.id] });
    expect(result.ok && result.group.memberIds[0]).toBe(app.me);
    expect(result.ok && result.group.memberIds).toContain(emery.id);
  });

  it('archiveGroup archives and restores', async () => {
    const app = await sampleApp();
    const club = app.group('Dinner club');
    const archived = await app.archiveGroup(club.id);
    expect(archived.ok && archived.group.archived).toBe(true);
    expect(app.selectGroups(app.state().snapshot).at(-1)?.group.id).toBe(club.id);
    const restored = await app.archiveGroup(club.id, false);
    expect(restored.ok && restored.group.archived).toBe(false);
  });
});

describe('expenses', () => {
  const draftFor = (app: Awaited<ReturnType<typeof sampleApp>>, groupName: string, total: number, currency: 'GBP' | 'JPY' | 'USD'): ExpenseDraft => {
    const group = app.group(groupName);
    return {
      groupId: group.id,
      description: 'Taxi',
      categoryId: 'transport',
      total: { amountMinor: total, currency },
      paidBy: app.me,
      split: { type: 'equal', participants: group.memberIds },
      occurredOn: app.state().today,
      createdBy: app.me,
    };
  };

  it('updateExpense rebuilds the shares under the original id and creation time and moves the balances', async () => {
    const app = await sampleApp();
    const added = await app.addExpense(draftFor(app, 'Flat share', 3000, 'GBP'));
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const before = balancesByGroup(app.state().snapshot.expenses, app.state().snapshot.settlements);

    const updated = await app.updateExpense(added.expense.id, { ...draftFor(app, 'Flat share', 9000, 'GBP'), description: 'Taxi home' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.expense.id).toBe(added.expense.id);
    expect(updated.expense.createdAt).toBe(added.expense.createdAt);
    expect(updated.expense.description).toBe('Taxi home');
    expect(updated.expense.splits.map((s) => s.amount.amountMinor)).toEqual([3000, 3000, 3000]);
    expect(updated.expense.isSample).toBeUndefined();

    const after = balancesByGroup(app.state().snapshot.expenses, app.state().snapshot.settlements);
    const flat = app.group('Flat share').id;
    const mine = (b: typeof before) => b.find((g) => g.groupId === flat)!.byCurrency.find((c) => c.currency === 'GBP')!.balances.find((x) => x.personId === app.me)!.net.amountMinor;
    expect(mine(after) - mine(before)).toBe(6000 - 2000);
    expect(app.state().snapshot.expenses.filter((e) => e.id === added.expense.id)).toHaveLength(1);
  });

  it('updateExpense keeps the sample label on a sample record and reports engine issues', async () => {
    const app = await sampleApp();
    const sample = app.state().snapshot.expenses.find((e) => e.groupId === app.group('Trip to Japan').id)!;
    const ok = await app.updateExpense(sample.id, { ...draftFor(app, 'Trip to Japan', 9800, 'JPY'), split: { type: 'shares', shares: app.group('Trip to Japan').memberIds.map((id, i) => ({ personId: id, shares: i === 2 ? 2 : 1 })) } });
    expect(ok.ok && ok.expense.isSample).toBe(true);
    expect(ok.ok && ok.expense.splits.map((s) => s.amount.amountMinor)).toEqual([2450, 2450, 4900]);

    const outsider = await app.updateExpense(sample.id, { ...draftFor(app, 'Trip to Japan', 1000, 'JPY'), split: { type: 'equal', participants: [app.person('Emery').id] } });
    expect(outsider.ok).toBe(false);
    if (!outsider.ok) expect(outsider.issues.map((i) => i.code)).toContain('not_a_member');

    const gone = await app.updateExpense('01ARZ3NDEKTSV4RRFFQ69G5FAV', draftFor(app, 'Trip to Japan', 1000, 'JPY'));
    expect(gone.ok).toBe(false);
    if (!gone.ok) expect(gone.problems[0]).toMatch(/no longer exists/);
  });

  it('deleteExpense removes the record once and reports a missing one', async () => {
    const app = await sampleApp();
    const target = app.state().snapshot.expenses[0]!;
    const count = app.state().snapshot.expenses.length;
    expect(await app.deleteExpense(target.id)).toEqual({ ok: true });
    expect(app.state().snapshot.expenses).toHaveLength(count - 1);
    const again = await app.deleteExpense(target.id);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.problems[0]).toMatch(/no longer exists/);
  });
});

describe('budgets', () => {
  it('setBudget creates, then changes the same budget; removeBudget deletes it', async () => {
    const app = await sampleApp();
    const created = await app.setBudget({ categoryId: 'transport', amount: { amountMinor: 12000, currency: 'GBP' } });
    expect(created.period).toBe('monthly');
    expect(created.categoryId).toBe('transport');
    const changed = await app.setBudget({ id: created.id, categoryId: null, amount: { amountMinor: 50000, currency: 'GBP' } });
    expect(changed.id).toBe(created.id);
    expect(changed.categoryId).toBeNull();
    expect(changed.amount).toEqual({ amountMinor: 50000, currency: 'GBP' });
    expect(app.selectBudgets(app.state().snapshot)[0]?.id).toBe(created.id);
    await expect(app.setBudget({ id: created.id, categoryId: null, amount: { amountMinor: 0, currency: 'GBP' } })).rejects.toThrow(RangeError);
    expect(await app.removeBudget(created.id)).toBe(true);
    expect(await app.removeBudget(created.id)).toBe(false);
  });
});

describe('export and delete', () => {
  it('exportData is the versioned envelope that round-trips to the same snapshot', async () => {
    const app = await sampleApp();
    const json = await app.exportData();
    const parsed = JSON.parse(json) as { format: string; version: number };
    expect(parsed.format).toBe('finbuddy.data');
    expect(parsed.version).toBe(1);
    expect(deserializeSnapshot(json)).toEqual(app.state().snapshot);
  });

  it('deleteAllData leaves an empty, ready, saved store so the next launch starts at onboarding', async () => {
    const app = await sampleApp();
    await app.deleteAllData();
    expect(app.state().status).toBe('ready');
    expect(app.state().snapshot.profiles).toEqual([]);
    expect(app.state().snapshot.people).toEqual([]);
    const next = await launch();
    expect(next.state().status).toBe('ready');
    expect(next.state().snapshot.profiles).toEqual([]);
  });
});

describe('selectors', () => {
  it('selectCategoryRecords filters by category and currency, newest first, own share only', async () => {
    const app = await sampleApp();
    const snapshot = app.state().snapshot;
    const food = app.selectCategoryRecords(snapshot, 'food', 'GBP');
    expect(food.length).toBeGreaterThan(0);
    expect(food.every((r) => r.expense.categoryId === 'food' && r.share.currency === 'GBP')).toBe(true);
    for (let i = 1; i < food.length; i++) expect(food[i - 1]!.expense.occurredOn >= food[i]!.expense.occurredOn).toBe(true);
    for (const r of food) {
      const mine = r.expense.splits.filter((s) => s.personId === app.me).reduce((acc, s) => acc + s.amount.amountMinor, 0);
      expect(r.share.amountMinor).toBe(mine);
    }
    const all = app.selectCategoryRecords(snapshot, null, 'JPY');
    expect(all.every((r) => r.share.currency === 'JPY')).toBe(true);
    expect(app.selectCategoryRecords(snapshot, 'food', 'GBP')).toBe(food);
  });
});
