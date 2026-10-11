import { DesktopIcon } from '@phosphor-icons/react/dist/csr/Desktop';
import { MoonIcon } from '@phosphor-icons/react/dist/csr/Moon';
import { SunIcon } from '@phosphor-icons/react/dist/csr/Sun';

import { useRef, type KeyboardEvent } from 'react';

import { cn } from '../lib/cn';
import { useTheme, type ThemePreference } from '../lib/theme';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof SunIcon }[] = [
  { value: 'system', label: 'Match the system', Icon: DesktopIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
];

/** Appearance: follows the system by default, with an explicit light or dark choice. */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();
  const group = useRef<HTMLDivElement>(null);
  // Radio group keyboard pattern: one tab stop, arrows move the choice.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = OPTIONS.findIndex((o) => o.value === preference);
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    const option = OPTIONS[next];
    if (!option) return;
    setPreference(option.value);
    group.current?.querySelectorAll<HTMLButtonElement>('[role=radio]')[next]?.focus();
  };
  return (
    <div ref={group} role="radiogroup" aria-label="Appearance" onKeyDown={onKeyDown} className={cn('inline-flex items-center gap-0.5 rounded-full bg-fill p-0.5', className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const checked = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            aria-label={label}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full transition-colors duration-[160ms]',
              checked ? 'bg-surface text-label shadow-[0_1px_2px_rgba(26,20,32,0.12)]' : 'text-label-2 hover:text-label',
            )}
          >
            <Icon size={18} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
