import {
  DEFAULT_STORAGE_KEY,
  InMemoryRepository,
  attachPersistence,
  createSampleData,
  emptySnapshot,
  loadSnapshot,
  todayLocal,
  type DataSnapshot,
  type LocalDate,
  type Repository,
} from '@finbuddy/shared';
import { create } from 'zustand';

import { deviceStorage, isStoragePersistent } from './storage';

/**
 * The app's single data source: an InMemoryRepository persisted to device storage, plus a
 * zustand store that mirrors its latest snapshot. Screens read the store (so they re-render on
 * every change) and write through the actions in ./actions, never through the store itself.
 * A backend-backed Repository can replace the in-memory one later without touching screens.
 */
export type DataStatus = 'loading' | 'ready' | 'error';

export interface DataState {
  readonly status: DataStatus;
  /** The repository every action writes to. Stable for the life of the app. */
  readonly repository: Repository;
  /** A consistent copy of all data, replaced (never mutated) after every change. */
  readonly snapshot: DataSnapshot;
  /** Increments on every change, so anything keyed on it recomputes. */
  readonly version: number;
  /** Today's calendar date on this device; refreshed when the day changes. */
  readonly today: LocalDate;
  /** False when device storage is unavailable and changes last only for this session. */
  readonly persistent: boolean;
  /** Something the person should know, e.g. that unreadable saved data was replaced. */
  readonly notice: string | null;
  readonly error: string | null;
}

const repository = new InMemoryRepository();

export const useDataStore = create<DataState>(() => ({
  status: 'loading',
  repository,
  snapshot: emptySnapshot(),
  version: 0,
  today: todayLocal(),
  persistent: true,
  notice: null,
  error: null,
}));

// Mirror every repository change into the store. snapshot() reads synchronously when called,
// so results arrive in change order; the sequence check drops any that were overtaken.
let refreshSeq = 0;
function refresh(): void {
  const seq = ++refreshSeq;
  void repository.snapshot().then((snapshot) => {
    if (seq !== refreshSeq) return;
    useDataStore.setState((state) => ({ snapshot, version: state.version + 1, persistent: isStoragePersistent() }));
  });
}
repository.subscribe(refresh);

function hasProfile(snapshot: DataSnapshot | null): snapshot is DataSnapshot {
  return snapshot !== null && snapshot.profiles.length > 0;
}

/** Sample data built around today, so "this month" figures and reminders have something to show. */
function freshSampleData(): DataSnapshot {
  return createSampleData({ anchor: todayLocal() });
}

let persistence: ReturnType<typeof attachPersistence> | null = null;
function persist(): void {
  persistence ??= attachPersistence(repository, deviceStorage, {
    key: DEFAULT_STORAGE_KEY,
    onError: () => useDataStore.setState({ persistent: false }),
  });
}

async function boot(): Promise<void> {
  try {
    let stored: DataSnapshot | null = null;
    let notice: string | null = null;
    try {
      stored = await loadSnapshot(deviceStorage, DEFAULT_STORAGE_KEY);
    } catch {
      notice = 'Saved data could not be read, so the sample data was restored.';
    }
    if (hasProfile(stored)) {
      await repository.replaceAll(stored);
      persist();
    } else {
      // First launch (or unreadable data): persist first so the seeded sample data is saved.
      persist();
      await repository.replaceAll(freshSampleData());
      await persistence?.flush();
    }
    const snapshot = await repository.snapshot();
    useDataStore.setState((state) => ({
      status: 'ready',
      snapshot,
      version: state.version + 1,
      persistent: isStoragePersistent(),
      notice,
      error: null,
    }));
  } catch (error) {
    useDataStore.setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
  }
}

let started: Promise<void> | null = null;
let dayTimer: ReturnType<typeof setInterval> | null = null;

/** Loads saved data, or seeds sample data on first launch. Safe to call more than once. */
export function startDataStore(): Promise<void> {
  dayTimer ??= setInterval(() => {
    const today = todayLocal();
    if (today !== useDataStore.getState().today) useDataStore.setState({ today });
  }, 60_000);
  started ??= boot();
  return started;
}

/** Replaces everything with fresh sample data (the "Reset sample data" action). */
export async function resetSampleData(): Promise<void> {
  persist();
  useDataStore.setState({ today: todayLocal(), notice: null });
  await repository.replaceAll(freshSampleData());
  await persistence?.flush();
  // Also the way out of a failed load: the store is usable again once sample data is in place.
  const snapshot = await repository.snapshot();
  useDataStore.setState((state) => ({ status: 'ready', error: null, snapshot, version: state.version + 1, persistent: isStoragePersistent() }));
}

/** Clears the one-time notice shown under the preview banner. */
export function dismissNotice(): void {
  useDataStore.setState({ notice: null });
}
