// Test-only helpers. Not exported from the package.
import { createSeededIdGenerator } from '../model/ids';
import type { Clock } from '../model/dates';

export const fixedClock = (iso = '2026-03-01T12:00:00.000Z'): Clock => () => new Date(iso);
export const testDeps = (seed = 1) => ({ ids: createSeededIdGenerator(seed), clock: fixedClock() });

type ProcessLike = { env: Record<string, string | undefined> };
/** Runs fn with process.env.TZ set (Node re-reads TZ on change). */
export function withTimeZone<T>(tz: string, fn: () => T): T {
  const proc = (globalThis as unknown as { process: ProcessLike }).process;
  const previous = proc.env.TZ;
  proc.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete proc.env.TZ;
    else proc.env.TZ = previous;
  }
}
