import { useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const KEY = 'finbuddy.theme';
const DARK = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage may be unavailable; the system setting then rules.
  }
  return 'system';
}

let preference: ThemePreference = typeof window === 'undefined' ? 'system' : readPreference();
let resolved: ResolvedTheme = resolve();
let snapshot = { preference, resolved };
// What the prerendered HTML was built with; hydration starts here and then catches up.
const SERVER_SNAPSHOT = { preference: 'system' as ThemePreference, resolved: 'light' as ResolvedTheme };

function resolve(): ResolvedTheme {
  if (preference !== 'system') return preference;
  return typeof window !== 'undefined' && window.matchMedia?.(DARK).matches ? 'dark' : 'light';
}

function publish() {
  resolved = resolve();
  snapshot = { preference, resolved };
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia(DARK).addEventListener('change', publish);
}

export function setThemePreference(next: ThemePreference): void {
  preference = next;
  const root = document.documentElement;
  if (next === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', next);
  try {
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Remembering the choice is a convenience, not a requirement.
  }
  publish();
}

/** The appearance preference (system by default) and the scheme it currently resolves to. */
export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme; setPreference: (p: ThemePreference) => void } {
  const current = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
  return { ...current, setPreference: setThemePreference };
}
