import { APP_URL } from '../lib/links';
import { Lockup } from './Brand';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '#groups', label: 'Groups' },
  { href: '#currencies', label: 'Currencies' },
  { href: '#settle', label: 'Settling up' },
  { href: '#spending', label: 'Spending' },
  { href: '#today', label: 'FAQ' },
];

export function Header() {
  return (
    <header className="mx-auto flex h-16 max-w-[80rem] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
      <a href="#top" className="-m-2 rounded-[10px] p-2 text-label">
        <Lockup height={30} title="FinBuddy, back to the top" />
      </a>
      <nav aria-label="On this page" className="hidden lg:block">
        <ul className="flex items-center gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3 py-2 text-[15px] font-medium text-label-2 no-underline transition-colors hover:bg-pressed hover:text-label">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3">
        {APP_URL ? (
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <a href={APP_URL}>Open the web app</a>
          </Button>
        ) : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
