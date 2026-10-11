// Build-time prerender: the page's HTML is rendered once from the same components, so the first
// paint needs no JavaScript and the page reads with scripts blocked. The client hydrates it.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { App } from './App';

export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
