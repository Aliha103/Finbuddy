// Pre-launch store buttons. No listing exists yet, so the official badges cannot be used (both
// programmes require them to link to a live listing). These are FinBuddy buttons that say so and
// open a dialog with the one honest action available: watching releases on GitHub.
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { useState } from 'react';

import { cn } from '../lib/cn';
import { Button, buttonVariants } from './Button';

export const RELEASES_URL = 'https://github.com/Aliha103/Finbuddy/releases';
export const REPO_URL = 'https://github.com/Aliha103/Finbuddy';

type Store = 'App Store' | 'Google Play';
const STORES: readonly Store[] = ['App Store', 'Google Play'];

export function StoreButtons({ className, tone = 'primary' }: { className?: string; tone?: 'primary' | 'secondary' }) {
  const [store, setStore] = useState<Store | null>(null);
  return (
    <Dialog.Root open={store !== null} onOpenChange={(open) => !open && setStore(null)}>
      <div className={cn('flex flex-wrap gap-3', className)}>
        {STORES.map((name) => (
          <Dialog.Trigger key={name} asChild>
            <button
              type="button"
              onClick={() => setStore(name)}
              className={cn(buttonVariants({ variant: tone, size: 'lg' }), 'h-14 min-w-[10.5rem] flex-col items-start gap-0 px-6 leading-tight')}
            >
              <span className="text-[17px] font-semibold">{name}</span>
              <span className="text-[13px] font-medium opacity-80">At launch</span>
            </button>
          </Dialog.Trigger>
        ))}
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[rgba(18,16,22,0.56)] data-[state=open]:animate-[fade-in_240ms_var(--ease-gate)]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-32px)] max-w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-surface-raised p-6 text-label shadow-card ring-1 ring-separator outline-none data-[state=open]:animate-[dialog-in_320ms_var(--ease-gate)] sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="title text-[22px]">FinBuddy is not on {store === 'Google Play' ? 'Google Play' : 'the App Store'} yet</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Close" className="-mt-1 -mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-label-2 hover:bg-pressed hover:text-label">
                <XIcon size={20} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description asChild>
            <div className="mt-3 space-y-3 text-[16px] leading-relaxed text-label-2">
              <p>The app is pre-launch, for iPhone and Android. There is no store listing to download from today, and there is no waiting list to join.</p>
              <p>Builds are published as releases on GitHub first. Watching the repository's releases is how to hear when it ships.</p>
            </div>
          </Dialog.Description>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="md">
              <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                Watch releases on GitHub
                <ArrowUpRightIcon size={18} aria-hidden="true" />
              </a>
            </Button>
            <Dialog.Close asChild>
              <Button variant="ghost" size="md">
                Close
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
