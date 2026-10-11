import { Header } from './components/Header';
import { Currencies } from './sections/Currencies';
import { Footer } from './sections/Footer';
import { Groups } from './sections/Groups';
import { Hero } from './sections/Hero';
import { Settle } from './sections/Settle';
import { Spending } from './sections/Spending';
import { Today } from './sections/Today';

export function App() {
  return (
    <>
      <a href="#main" className="sr-only rounded-full bg-tint px-4 py-2 font-semibold text-on-tint focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50">
        Skip to the demo
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Groups />
        <Currencies />
        <Settle />
        <Spending />
        <Today />
      </main>
      <Footer />
    </>
  );
}
