// The website's public addresses, shared by generate-sitemap.js and prerender.js.
//
// SITE_URL is this copy's address including its base path (set by the GitHub Pages workflow and the
// Netlify build). Without it, Netlify's URL (the site's main address) plus BASE_PATH is used, so a
// build served under /web/ never claims the address of whatever sits at the site root.
//
// CANONICAL_URL is the address search engines and link previews should treat as the page's own.
// It defaults to this copy's address; a copy that is not the main one names the main one instead
// (the GitHub Pages workflow names the Netlify site's /web/).
const basePath = (process.env.BASE_PATH || '/').replace(/\/$/, '')
const fromNetlify = process.env.URL ? process.env.URL.replace(/\/$/, '') + basePath : null

/** This copy's address, without a trailing slash. */
export const SITE_URL = (process.env.SITE_URL || fromNetlify || 'https://aliha103.github.io/Finbuddy').replace(/\/$/, '')

/** The page's canonical address, as an absolute http(s) URL (the build fails on anything else). */
export const CANONICAL_URL = absolute(process.env.CANONICAL_URL?.trim() || `${SITE_URL}/`)

function absolute(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`CANONICAL_URL must be an absolute address, like https://finbuddych.netlify.app/web/; got "${value}"`)
  }
  if (!/^https?:$/.test(url.protocol)) throw new Error(`CANONICAL_URL must be an http(s) address; got "${value}"`)
  return url.href
}
