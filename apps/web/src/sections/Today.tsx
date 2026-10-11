// "What is true today": plain statements of where the product stands, then five questions.
// Every figure in an answer comes from the engine.
import { CURRENCY_CODES, formatMoney, minorUnits, resolveSplit } from '@finbuddy/shared';
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import type { ReactNode } from 'react';

import { REPO_URL, RELEASES_URL } from '../components/StoreButtons';
import { PEOPLE, SAMPLE_LOCALE } from '../lib/sample';

const three = PEOPLE.slice(0, 3);
const hundred = { amountMinor: 10000, currency: 'GBP' } as const;
const rounding = resolveSplit({ type: 'equal', participants: three.map((p) => p.id) }, hundred).map((s) => formatMoney(s.amount, { locale: SAMPLE_LOCALE }));
const list = (items: readonly string[]) => `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;

const FACTS: readonly { lead: string; body: ReactNode }[] = [
  { lead: 'Pre-launch.', body: 'FinBuddy is not in the App Store or on Google Play yet, and there is no launch date to announce.' },
  { lead: 'No accounts yet.', body: 'There is nothing to sign up for. The app does not pretend to sign you in; accounts arrive with an online service, later.' },
  { lead: 'Everything stays on your phone.', body: 'Your entries, balances and insights are stored and worked out on the device.' },
  { lead: 'No bank connection.', body: 'You add expenses yourself. Nothing reads your bank account.' },
  {
    lead: 'Open source.',
    body: (
      <>
        The app, this site and the split engine running on this page are on{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-tint underline">
          GitHub
        </a>
        .
      </>
    ),
  },
];

const FAQ: readonly { q: string; a: ReactNode }[] = [
  {
    q: 'Which currencies does it handle?',
    a: `All ${CURRENCY_CODES.length} ISO 4217 currencies, each with its own decimals: ${minorUnits('JPY') === 0 ? 'yen has none' : 'yen has some'}, Kuwaiti dinar has ${minorUnits('KWD')}. Balances are kept per currency and never added together, so a trip in yen and a flat in pounds show two figures, not one guessed total.`,
  },
  {
    q: 'Who pays the rounding?',
    a: `The first person listed, every time. ${formatMoney(hundred, { locale: SAMPLE_LOCALE })} split three ways is ${list(rounding)}, and every share always adds back to the total exactly.`,
  },
  {
    q: 'Can I split with people who don’t have the app?',
    a: 'Yes. Group members are names on your phone; they don’t need the app or an account. You record what they paid and what they owe, and their balances work the same as yours.',
  },
  {
    q: 'What happens offline?',
    a: 'Everything works the same. FinBuddy keeps your data on the phone and does every calculation there, insights included, so there is nothing to wait for.',
  },
  {
    q: 'When does it launch?',
    a: (
      <>
        There is no date yet. Builds are published as{' '}
        <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-tint underline">
          releases on GitHub
          <ArrowUpRightIcon size={14} className="ml-0.5 inline align-[-1px]" aria-hidden="true" />
        </a>{' '}
        first; watching them is the way to hear when it ships.
      </>
    ),
  },
];

export function Today() {
  return (
    <section id="today" aria-labelledby="today-title" className="bg-surface py-20 lg:py-28">
      <div className="mx-auto max-w-[44rem] px-4 sm:px-6">
        <h2 id="today-title" className="display text-[2.25rem] lg:text-[3rem]">
          What is true today.
        </h2>
        <ul className="mt-8 space-y-4 text-[18px] leading-relaxed">
          {FACTS.map((f) => (
            <li key={f.lead}>
              <strong className="font-semibold">{f.lead}</strong> <span className="text-label-2">{f.body}</span>
            </li>
          ))}
        </ul>

        <h3 className="title mt-16 text-[24px]">Questions</h3>
        <div className="mt-4 border-t border-separator">
          {FAQ.map((item) => (
            <details key={item.q} className="group border-b border-separator">
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-[17px] font-semibold">
                {item.q}
                <CaretDownIcon size={18} aria-hidden="true" className="shrink-0 text-label-2 transition-transform duration-[240ms] ease-gate group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[17px] leading-relaxed text-label-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
