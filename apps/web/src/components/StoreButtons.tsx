// Where to get FinBuddy: one row of platform buttons with the same anatomy, the platform and then
// its status. The web app and the Android APK are real links, present only on builds that have them
// (lib/links.ts). The App Store and Google Play have no listing yet, so the official badges cannot be
// used (both programmes require them to link to a live listing). Those two are FinBuddy buttons that
// say so and open a dialog with what is available instead.
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { XIcon } from '@phosphor-icons/react/dist/csr/X';
import { useState } from 'react';

import { cn } from '../lib/cn';
import { ANDROID_URL, APP_URL, RELEASES_URL } from '../lib/links';
import { Button, buttonVariants } from './Button';

type Store = 'App Store' | 'Google Play';
const STORES: readonly Store[] = ['App Store', 'Google Play'];

const platformClass = (tone: 'primary' | 'secondary') =>
  cn(buttonVariants({ variant: tone, size: 'lg' }), 'h-14 min-w-[10.5rem] flex-col items-start gap-0 px-6 leading-tight');

function Label({ name, status }: { name: string; status: string }) {
  return (
    <>
      <span className="text-[17px] font-semibold">{name}</span>
      <span className="text-[13px] font-medium opacity-80">{status}</span>
    </>
  );
}

/** One sentence under the buttons for whatever this build links to; null when it links to nothing. */
function availabilityNote(): string | null {
  const web = APP_URL ? 'The web app runs in your browser, and what you enter stays in that browser.' : '';
  const apk = ANDROID_URL ? 'The Android APK is a pre-launch build you install yourself, outside Google Play.' : '';
  return [web, apk].filter(Boolean).join(' ') || null;
}

export function StoreButtons({ className, tone = 'primary', note: showNote = true }: { className?: string; tone?: 'primary' | 'secondary'; note?: boolean }) {
  const [store, setStore] = useState<Store | null>(null);
  const linksHere = Boolean(APP_URL || ANDROID_URL);
  // Something that works today leads; the "At launch" buttons step back beside it.
  const storeTone = tone === 'primary' && linksHere ? 'secondary' : tone;
  const note = showNote ? availabilityNote() : null;
  const apkHere = store === 'Google Play' ? ANDROID_URL : null;
  return (
    <Dialog.Root open={store !== null} onOpenChange={(open) => !open && setStore(null)}>
      <div className={className}>
        {/* With links: the web app across the top over the two stores, or a 2 x 2 grid with the APK; one column on narrow phones. */}
        <div className={linksHere ? 'grid max-w-[22rem] grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-3' : 'flex flex-wrap gap-3'}>
          {APP_URL ? (
            <a data-platform href={APP_URL} className={cn(platformClass(tone), !ANDROID_URL && 'col-span-full')}>
              <Label name="Web app" status="Open in your browser" />
            </a>
          ) : null}
          {ANDROID_URL ? (
            <a data-platform href={ANDROID_URL} className={platformClass(APP_URL ? storeTone : tone)}>
              <Label name="Android" status="Pre-launch APK" />
            </a>
          ) : null}
          {STORES.map((name) => (
            <Dialog.Trigger key={name} asChild>
              <button data-platform type="button" onClick={() => setStore(name)} className={platformClass(storeTone)}>
                <Label name={name} status="At launch" />
              </button>
            </Dialog.Trigger>
          ))}
        </div>
        {note ? (
          <p data-cta-note className="mt-3 max-w-[22rem] text-[14px] leading-snug text-label-2">
            {note}
          </p>
        ) : null}
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
              {apkHere ? (
                <>
                  <p>The app is pre-launch. There is no Google Play listing today, and there is no waiting list to join.</p>
                  <p>You can install a pre-launch build instead: an APK you download and install yourself, outside Google Play. It does not update itself.</p>
                </>
              ) : (
                <>
                  <p>The app is pre-launch, for iPhone and Android. There is no store listing to download from today, and there is no waiting list to join.</p>
                  {APP_URL ? (
                    <p>Today it works in your browser instead, on a phone or a computer. What you enter in the web app stays in that browser.</p>
                  ) : ANDROID_URL ? (
                    <p>Watching the repository's releases on GitHub is how to hear when it ships.</p>
                  ) : (
                    <p>Builds are published as releases on GitHub first. Watching the repository's releases is how to hear when it ships.</p>
                  )}
                </>
              )}
            </div>
          </Dialog.Description>
          <div className="mt-6 flex flex-wrap gap-3">
            {apkHere ? (
              <Button asChild size="md">
                <a href={apkHere}>Download the APK</a>
              </Button>
            ) : null}
            {APP_URL ? (
              <Button asChild size="md" variant={apkHere ? 'secondary' : 'primary'}>
                <a href={APP_URL}>Open the web app</a>
              </Button>
            ) : null}
            {apkHere ? null : (
              <Button asChild size="md" variant={APP_URL ? 'ghost' : 'primary'}>
                <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                  Watch releases on GitHub
                  <ArrowUpRightIcon size={18} aria-hidden="true" />
                </a>
              </Button>
            )}
            {APP_URL || apkHere ? null : (
              <Dialog.Close asChild>
                <Button variant="ghost" size="md">
                  Close
                </Button>
              </Dialog.Close>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
