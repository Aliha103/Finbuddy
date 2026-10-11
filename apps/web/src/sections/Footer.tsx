import { GithubLogoIcon } from '@phosphor-icons/react/dist/csr/GithubLogo';

import { Lockup } from '../components/Brand';
import { REPO_URL, StoreButtons } from '../components/StoreButtons';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-separator bg-surface-alt">
      <div className="mx-auto grid max-w-[80rem] grid-cols-1 gap-12 px-4 py-14 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <Lockup height={34} className="text-label" />
          <p className="mt-4 max-w-[36ch] text-[16px] text-label-2">Shared costs and your own spending in one exact ledger.</p>
          <StoreButtons className="mt-6" tone="secondary" />
        </div>
        <div className="md:col-span-7 md:pl-8">
          <h2 id="privacy" className="text-[15px] font-semibold">
            Privacy
          </h2>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-label-2">
            This site collects nothing: no analytics, no cookies, no sign-up forms. The split you try above runs in your browser and what you type never leaves it. The only thing kept is your light or dark choice, in your own browser.
          </p>
          <h2 className="mt-8 text-[15px] font-semibold">Sample data</h2>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-label-2">
            Names and amounts marked Sample are invented to show how FinBuddy works. They come from the same sample the app offers when you look around before adding your own.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-label underline-offset-4 hover:underline">
              <GithubLogoIcon size={20} aria-hidden="true" />
              FinBuddy on GitHub
            </a>
            <a href="#privacy" className="font-semibold text-label underline-offset-4 hover:underline">
              Privacy
            </a>
            <span className="text-label-2" suppressHydrationWarning>
              © {year} FinBuddy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
