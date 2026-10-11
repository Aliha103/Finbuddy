import { PreviewApp } from '@/preview/PreviewApp';

/**
 * The only route. All in-app navigation is React state inside PreviewApp, so the exported
 * web build never depends on the URL (it is served from an unknown sub-path, inside an iframe).
 */
export default function Index() {
  return <PreviewApp />;
}
