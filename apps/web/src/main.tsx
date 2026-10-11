import '@fontsource-variable/mona-sans/wdth.css';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { App } from './App';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// The build prerenders the page into #root; hydrate it. The dev server serves an empty root.
if (root?.firstElementChild) hydrateRoot(root, app);
else if (root) createRoot(root).render(app);
