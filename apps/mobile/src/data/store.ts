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

/** Sample data built around today, so "this month" figures and reminders have something to show. */
export function freshSampleData(): DataSnapshot {
  return createSampleData({ anchor: todayLocal() });
}

let persistence: ReturnType<typeof attachPersistence> | null = null;
function persist(): void {
  persistence ??= attachPersistence(repository, deviceStorage, {
    key: DEFAULT_STORAGE_KEY,
    onError: () => useDataStore.setState({ persistent: false }),
  });
}

function publish(extra: Partial<Pick<DataState, 'notice' | 'error'>> = {}): Promise<void> {
  return repository.snapshot().then((snapshot) => {
    useDataStore.setState((state) => ({
      status: 'ready',
      snapshot,
      version: state.version + 1,
      persistent: isStoragePersistent(),
      error: null,
      ...extra,
    }));
  });
}

/**
 * Replaces everything with `snapshot`, saves it, and marks the store ready. Used by the actions
 * that start over: startFresh, keepSampleData / resetSampleData, deleteAllData. Also the way
 * out of a failed load: the store is usable again once a readable snapshot is in place.
 */
export async function applySnapshot(snapshot: DataSnapshot, options: { notice?: string | null } = {}): Promise<void> {
  persist();
  useDataStore.setState({ today: todayLocal() });
  await repository.replaceAll(snapshot);
  await persistence?.flush();
  await publish({ notice: options.notice ?? null });
}

/**
 * Loads what this device has saved. Nothing saved means a first launch: the store becomes ready
 * on an empty snapshot and the index route sends the person to onboarding, where sample data is
 * an explicit choice ("Look around with sample data"), never something that greets every new user.
 * Saved data that cannot be read is left in place and reported as an error, so nothing is
 * overwritten without the person choosing to (Reset sample data, or starting fresh).
 */
async function boot(): Promise<void> {
  try {
    let stored: DataSnapshot | null;
    try {
      stored = await loadSnapshot(deviceStorage, DEFAULT_STORAGE_KEY);
    } catch (error) {
      useDataStore.setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
      return;
    }
    if (stored) await repository.replaceAll(stored);
    persist();
    await publish({ notice: null });
  } catch (error) {
    useDataStore.setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
  }
}

let started: Promise<void> | null = null;
let dayTimer: ReturnType<typeof setInterval> | null = null;

/** Loads saved data (an empty store stays empty). Safe to call more than once. */
export function startDataStore(): Promise<void> {
  dayTimer ??= setInterval(() => {
    const today = todayLocal();
    if (today !== useDataStore.getState().today) useDataStore.setState({ today });
  }, 60_000);
  started ??= boot();
  return started;
}

/** Replaces everything with fresh sample data (the "Reset sample data" action, and the way out of a failed load). */
export function resetSampleData(): Promise<void> {
  return applySnapshot(freshSampleData());
}

/** Clears the one-time notice shown under a screen title. */
export function dismissNotice(): void {
  useDataStore.setState({ notice: null });
}
