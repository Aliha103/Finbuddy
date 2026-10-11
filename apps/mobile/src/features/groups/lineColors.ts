// apps/mobile/src/features/groups/lineColors.ts
// Which line colour a group's card wears. The default comes from a hash of the group's id
// (lineColorFor); a choice made in the group's settings is app-local (AsyncStorage), never part
// of the shared model, and is dropped silently if the colour set no longer carries that id.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { create } from 'zustand';

import { LINE_COLORS, lineColorFor, type LineColor, type LineColorId } from '@/design';

const KEY = 'finbuddy.groupLineColors';

interface LineColorState {
  readonly overrides: Readonly<Record<string, LineColorId>>;
  readonly loaded: boolean;
}

export const useLineColorStore = create<LineColorState>(() => ({ overrides: {}, loaded: false }));

const isLineColorId = (value: unknown): value is LineColorId => typeof value === 'string' && LINE_COLORS.some((c) => c.id === value);

let loading: Promise<void> | null = null;

/** Reads the saved choices once; safe to call from every screen that shows a card. */
export function loadLineColorOverrides(): Promise<void> {
  if (useLineColorStore.getState().loaded) return Promise.resolve();
  loading ??= AsyncStorage.getItem(KEY)
    .then((raw) => {
      const overrides: Record<string, LineColorId> = {};
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const [groupId, id] of Object.entries(parsed as Record<string, unknown>)) if (isLineColorId(id)) overrides[groupId] = id;
        }
      }
      useLineColorStore.setState({ overrides, loaded: true });
    })
    .catch(() => {
      // Storage refused or unreadable: the hash-assigned colours stand.
      useLineColorStore.setState({ loaded: true });
    });
  return loading;
}

/** Chooses (or, with null, clears) a group's line colour. */
export function setGroupLineColor(groupId: string, id: LineColorId | null): void {
  const next = { ...useLineColorStore.getState().overrides };
  if (id) next[groupId] = id;
  else delete next[groupId];
  useLineColorStore.setState({ overrides: next });
  AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
    // The choice lasts for this session.
  });
}

/** Every saved choice, loading them on first use. */
export function useLineColorOverrides(): Readonly<Record<string, LineColorId>> {
  const overrides = useLineColorStore((s) => s.overrides);
  const loaded = useLineColorStore((s) => s.loaded);
  useEffect(() => {
    if (!loaded) void loadLineColorOverrides();
  }, [loaded]);
  return overrides;
}

/** The line colour one group's card wears right now. */
export function useGroupLineColor(groupId: string): LineColor {
  return lineColorFor(groupId, useLineColorOverrides());
}

/** True when the person chose this group's colour (as opposed to the hash). */
export function useHasChosenLineColor(groupId: string): boolean {
  return useLineColorOverrides()[groupId] !== undefined;
}
