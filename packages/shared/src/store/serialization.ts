import { systemClock, type Clock, type Instant } from '../model/dates';
import type { DataSnapshot, Repository } from './repository';
import { DataValidationError, normalizeSnapshot, validateSnapshot } from './validate';

/**
 * On-disk format: versioned JSON.
 *   { "format": "finbuddy.data", "version": 1, "savedAt": "<ISO instant>", "data": DataSnapshot }
 * Money is { amountMinor, currency } with integer minor units; dates are "YYYY-MM-DD".
 * When the shape changes, bump DATA_FORMAT_VERSION and add a Migration from the old version.
 */
export const DATA_FORMAT = 'finbuddy.data';
export const DATA_FORMAT_VERSION = 1;

export interface DataEnvelope {
  readonly format: typeof DATA_FORMAT;
  readonly version: number;
  readonly savedAt: Instant;
  readonly data: DataSnapshot;
}

/** Upgrades the `data` of an envelope from version `from` to `from + 1`. */
export interface Migration {
  readonly from: number;
  readonly migrate: (data: unknown) => unknown;
}

/** Registered migrations. Version 1 is the first format, so the list starts empty. */
export const MIGRATIONS: readonly Migration[] = [];

export class DataFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataFormatError';
  }
}

export function serializeSnapshot(snapshot: DataSnapshot, options: { clock?: Clock } = {}): string {
  const envelope: DataEnvelope = {
    format: DATA_FORMAT,
    version: DATA_FORMAT_VERSION,
    savedAt: (options.clock ?? systemClock)().toISOString(),
    data: normalizeSnapshot(snapshot),
  };
  return JSON.stringify(envelope);
}

export interface DeserializeOptions {
  /** Migrations to apply (defaults to MIGRATIONS). Injectable for tests. */
  readonly migrations?: readonly Migration[];
  /** Version the result must reach (defaults to DATA_FORMAT_VERSION). */
  readonly targetVersion?: number;
}

/** Applies migrations one version at a time until `targetVersion`. Throws when a step is missing. */
export function migrateData(data: unknown, fromVersion: number, options: DeserializeOptions = {}): unknown {
  const migrations = options.migrations ?? MIGRATIONS;
  const target = options.targetVersion ?? DATA_FORMAT_VERSION;
  if (fromVersion > target) {
    throw new DataFormatError(`Data version ${fromVersion} is newer than this app supports (${target}). Update the app.`);
  }
  let current = data;
  for (let v = fromVersion; v < target; v++) {
    const step = migrations.find((m) => m.from === v);
    if (!step) throw new DataFormatError(`No migration from data version ${v}`);
    current = step.migrate(current);
  }
  return current;
}

/** Parses, migrates and validates stored JSON. Throws DataFormatError or DataValidationError. */
export function deserializeSnapshot(json: string, options: DeserializeOptions = {}): DataSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new DataFormatError('Stored data is not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) throw new DataFormatError('Stored data is not an object');
  const env = parsed as Record<string, unknown>;
  if (env.format !== DATA_FORMAT) throw new DataFormatError(`Unknown data format: ${JSON.stringify(env.format)}`);
  if (typeof env.version !== 'number' || !Number.isInteger(env.version) || env.version < 1) {
    throw new DataFormatError(`Invalid data version: ${JSON.stringify(env.version)}`);
  }
  const data = migrateData(env.data, env.version, options);
  const issues = validateSnapshot(data);
  if (issues.length) throw new DataValidationError(issues);
  return normalizeSnapshot(data as DataSnapshot);
}

/**
 * The subset of AsyncStorage (and of a simple SQLite key-value table) FinBuddy needs.
 * The mobile app supplies the implementation; this package never touches device APIs.
 */
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const DEFAULT_STORAGE_KEY = 'finbuddy.data.v1';

/** Loads a snapshot from storage; null when nothing is stored yet. */
export async function loadSnapshot(storage: StorageAdapter, key = DEFAULT_STORAGE_KEY, options: DeserializeOptions = {}): Promise<DataSnapshot | null> {
  const json = await storage.getItem(key);
  return json === null ? null : deserializeSnapshot(json, options);
}

export async function saveSnapshot(storage: StorageAdapter, snapshot: DataSnapshot, key = DEFAULT_STORAGE_KEY, options: { clock?: Clock } = {}): Promise<void> {
  await storage.setItem(key, serializeSnapshot(snapshot, options));
}

/**
 * Saves the repository to storage after every change. Saves run one at a time and bursts of
 * changes collapse into one follow-up save. Returns a function that stops persisting.
 * `flush()` on the result resolves when pending saves have finished.
 */
export function attachPersistence(
  repository: Repository,
  storage: StorageAdapter,
  options: { key?: string; clock?: Clock; onError?: (error: unknown) => void } = {},
): { stop: () => void; flush: () => Promise<void> } {
  let running: Promise<void> = Promise.resolve();
  let dirty = false;
  let scheduled = false;
  const schedule = () => {
    dirty = true;
    if (scheduled) return;
    scheduled = true;
    running = running.then(async () => {
      scheduled = false;
      while (dirty) {
        dirty = false;
        try {
          await saveSnapshot(storage, await repository.snapshot(), options.key, options);
        } catch (error) {
          options.onError?.(error);
        }
      }
    });
  };
  const unsubscribe = repository.subscribe(schedule);
  return { stop: unsubscribe, flush: () => running };
}
