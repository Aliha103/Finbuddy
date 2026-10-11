import { DEFAULT_STORAGE_KEY, createSampleData, deserializeSnapshot, todayLocal } from '@finbuddy/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeStorage } from '../test/setup';

/** A fresh copy of the singleton store and its actions, as a new app launch would get. */
async function launch() {
  vi.resetModules();
  const store = await import('./store');
  const actions = await import('./actions');
  await store.startDataStore();
  return { ...store, ...actions, state: () => store.useDataStore.getState() };
}

beforeEach(() => {
  fakeStorage().clear();
  fakeStorage().failing = false;
});

describe('boot', () => {
  it('starts ready on an empty snapshot when nothing is stored, without seeding sample data', async () => {
    const app = await launch();
    expect(app.state().status).toBe('ready');
    expect(app.state().snapshot.profiles).toEqual([]);
    expect(app.state().snapshot.expenses).toEqual([]);
    expect(fakeStorage().has(DEFAULT_STORAGE_KEY)).toBe(false);
  });

  it('loads what an earlier launch saved', async () => {
    const first = await launch();
    await first.keepSampleData();
    expect(fakeStorage().has(DEFAULT_STORAGE_KEY)).toBe(true);

    const second = await launch();
    expect(second.state().status).toBe('ready');
    expect(second.state().snapshot.profiles[0]?.isSample).toBe(true);
    expect(second.state().snapshot).toEqual(first.state().snapshot);
  });

  it('reports unreadable saved data as an error and leaves it in place', async () => {
    fakeStorage().set(DEFAULT_STORAGE_KEY, '{not json');
    const app = await launch();
    expect(app.state().status).toBe('error');
    expect(app.state().error).toBeTruthy();
    expect(fakeStorage().get(DEFAULT_STORAGE_KEY)).toBe('{not json');

    await app.resetSampleData();
    expect(app.state().status).toBe('ready');
    expect(app.state().error).toBeNull();
    expect(app.state().snapshot.groups).toHaveLength(3);
    expect(deserializeSnapshot(fakeStorage().get(DEFAULT_STORAGE_KEY)!)).toEqual(app.state().snapshot);
  });

  it('marks the store non-persistent when storage refuses writes, but keeps working in memory', async () => {
    const app = await launch();
    fakeStorage().failing = true;
    await app.keepSampleData();
    expect(app.state().status).toBe('ready');
    expect(app.state().snapshot.profiles).toHaveLength(1);
    expect(app.state().persistent).toBe(false);
  });
});

describe('sample data', () => {
  it('keepSampleData seeds the labelled sample set only on an empty device', async () => {
    const app = await launch();
    await app.keepSampleData();
    const { snapshot } = app.state();
    expect(snapshot).toEqual(createSampleData({ anchor: todayLocal() }));
    expect(snapshot.profiles[0]?.isSample).toBe(true);
    expect(snapshot.people.every((p) => p.isSample && p.displayName.endsWith('(sample)'))).toBe(true);

    await app.startFresh({ displayName: 'Jo', defaultCurrency: 'EUR', locale: 'de-DE' });
    await app.keepSampleData();
    expect(app.state().snapshot.profiles[0]?.displayName).toBe('Jo');
    expect(app.state().snapshot.groups).toEqual([]);
  });

  it('resetSampleData replaces everything with fresh sample data and persists it', async () => {
    const app = await launch();
    await app.startFresh({ displayName: 'Jo', defaultCurrency: 'GBP', locale: 'en-GB' });
    await app.resetSampleData();
    expect(app.state().snapshot.profiles[0]?.isSample).toBe(true);
    expect(deserializeSnapshot(fakeStorage().get(DEFAULT_STORAGE_KEY)!).groups).toHaveLength(3);
  });

  it('removeSampleData drops every labelled record; a sample profile takes the whole set with it', async () => {
    const app = await launch();
    await app.keepSampleData();
    await app.removeSampleData();
    expect(app.state().snapshot.profiles).toEqual([]);
    expect(app.state().snapshot.expenses).toEqual([]);
    expect(app.state().status).toBe('ready');
  });
});
