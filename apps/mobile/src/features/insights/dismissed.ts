// apps/mobile/src/features/insights/dismissed.ts
// Dismissed insights, remembered app-locally by the engine's stable insight id (AsyncStorage, never
// the shared model). A dismissal hides the insight from Home and the list; the list keeps a way to
// see and restore what was dismissed, so nothing disappears for good.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';

const KEY = 'finbuddy.dismissedInsights';

interface DismissedState {
  readonly ids: readonly string[];
  /** True once storage has been read (or refused), so screens do not flash an insight that is dismissed. */
  readonly loaded: boolean;
}

export const useDismissedStore = create<DismissedState>(() => ({ ids: [], loaded: false }));

let hydrating: Promise<void> | null = null;

/** Reads the remembered ids once. Safe to call many times. */
export function hydrateDismissed(): Promise<void> {
  hydrating ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
      useDismissedStore.setState({ ids, loaded: true });
    })
    .catch(() => {
      // Storage refused or unreadable: nothing is dismissed this session.
      useDismissedStore.setState({ loaded: true });
    });
  return hydrating;
}

function persist(ids: readonly string[]): void {
  AsyncStorage.setItem(KEY, JSON.stringify(ids)).catch(() => {
    // Storage refused: the dismissal lasts for this session.
  });
}

export function dismissInsight(id: string): void {
  const ids = useDismissedStore.getState().ids;
  if (ids.includes(id)) return;
  const next = [...ids, id];
  useDismissedStore.setState({ ids: next });
  persist(next);
}

export function restoreInsight(id: string): void {
  const next = useDismissedStore.getState().ids.filter((x) => x !== id);
  useDismissedStore.setState({ ids: next });
  persist(next);
}

export function useDismissedInsights(): { dismissed: ReadonlySet<string>; loaded: boolean } {
  const ids = useDismissedStore((s) => s.ids);
  const loaded = useDismissedStore((s) => s.loaded);
  useEffect(() => {
    void hydrateDismissed();
  }, []);
  return useMemo(() => ({ dismissed: new Set(ids), loaded }), [ids, loaded]);
}
