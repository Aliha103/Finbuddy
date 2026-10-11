import { PreviewApp } from '@/preview/PreviewApp';

/**
 * Any path the router does not know (for example the sub-path the web demo is served from)
 * renders the same root as "/", so the preview always opens.
 */
export default function NotFound() {
  return <PreviewApp />;
}
