// Where FinBuddy can be used today, decided when the site is built. Vite inlines these values into
// the client bundle and into the prerender bundle from the same environment, so the prerendered
// HTML and the hydrated page always agree. An unset or empty value means the link does not exist
// on this build, and nothing that mentions it renders. scripts/build-netlify.mjs (repo root) sets
// both for the Netlify site; .github/workflows/deploy.yml sets VITE_APP_URL for GitHub Pages.
export const REPO_URL = 'https://github.com/Aliha103/Finbuddy';
export const RELEASES_URL = `${REPO_URL}/releases`;

const link = (value: string | undefined): string | null => {
  const v = value?.trim();
  return v ? v : null;
};

/** The web app: "/" on Netlify (the same site), the Netlify address on the GitHub Pages build. */
export const APP_URL = link(import.meta.env.VITE_APP_URL);
/**
 * The web app's host when it lives on another site than this page (the GitHub Pages build), so copy
 * about the browser's data for "this site" can name the right one; null when it is this site.
 */
export const APP_HOST = APP_URL && /^https?:\/\//i.test(APP_URL) ? new URL(APP_URL).host : null;
/** "/android" when the Netlify build has ANDROID_APK_URL; that path redirects to the pre-launch APK. */
export const ANDROID_URL = link(import.meta.env.VITE_ANDROID_URL);
