#!/usr/bin/env node
/**
 * The Netlify build (netlify.toml runs it as `npm run build:netlify`). One site serves:
 *   /          the FinBuddy app's web export (apps/mobile, `expo export --platform web`)
 *   /web/      the marketing website (apps/web, built for the /web/ base path)
 *   /android   a 302 to the pre-launch Android APK, only when ANDROID_APK_URL is set
 * all from apps/mobile/dist, the publish directory. It also writes the routing rules
 * (_redirects) and the root robots.txt, and checks that the website names <URL>/web/ as its
 * canonical address. Any failure stops the build with a non-zero exit.
 *
 * Environment:
 *   URL              the site's main address. Netlify sets it (also on deploy previews);
 *                    locally it defaults to https://finbuddych.netlify.app.
 *   ANDROID_APK_URL  optional: one https:// URL of the APK, which EAS builds. Netlify reads it
 *                    at build time, so changing it needs a new deploy.
 *
 * Run from anywhere, after `npm ci` at the repo root: `npm run build:netlify`.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SITE = 'https://finbuddych.netlify.app';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publish = path.join(root, 'apps/mobile/dist');
const webDir = path.join(root, 'apps/web');
const rel = (p) => path.relative(root, p) || '.';

class BuildError extends Error {}
const fail = (message) => {
  throw new BuildError(message);
};

/** The site's address without a trailing slash; the website's own address is this plus /web. */
function readSiteUrl() {
  const value = (process.env.URL || DEFAULT_SITE).trim().replace(/\/+$/, '');
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`URL must be the site's address, like ${DEFAULT_SITE}; got "${value}".`);
  }
  if (!/^https?:$/.test(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
    fail(`URL must be the site's address with no path, like ${DEFAULT_SITE}; got "${value}".`);
  }
  return value;
}

/**
 * The APK's address, or null when the variable is unset or blank (surrounding whitespace is ignored).
 * It becomes one whitespace-separated field of a _redirects line, so it must be a single token, and
 * it must name its host right after https:// (the URL parser alone would accept "https:///x.apk").
 */
function readApkUrl() {
  const value = (process.env.ANDROID_APK_URL ?? '').trim();
  if (!value) return null;
  let host = '';
  try {
    host = new URL(value).hostname;
  } catch {
    // Reported below.
  }
  if (!/^https:\/\/[^\s/?#@]+([/?#]\S*)?$/.test(value) || !host) {
    fail(`ANDROID_APK_URL must be a single https:// URL with no spaces (got "${value}"). Fix it, or delete the variable to deploy without the Android download.`);
  }
  return value;
}

function npm(args, env = {}) {
  console.log(`\n> npm ${args.join(' ')}`);
  execFileSync('npm', args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env }, shell: process.platform === 'win32' });
}

const countFiles = (dir) => fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter((d) => d.isFile()).length;

/** Runs `build` and puts back the files it rewrites, so a local run leaves the working tree as it was. */
function keepingFiles(files, build) {
  const saved = files.filter((f) => fs.existsSync(f)).map((f) => [f, fs.readFileSync(f)]);
  try {
    build();
  } finally {
    for (const [f, content] of saved) fs.writeFileSync(f, content);
  }
}

function main() {
  const started = Date.now();
  const site = readSiteUrl();
  const apk = readApkUrl();

  // 1. The app at the site root. Start from an empty folder so nothing from an earlier run is published.
  fs.rmSync(publish, { recursive: true, force: true });
  npm(['run', 'build:web', '--workspace', '@finbuddy/mobile']);
  if (!fs.existsSync(path.join(publish, 'index.html'))) fail(`The app export did not write ${rel(publish)}/index.html.`);
  const appFiles = countFiles(publish);
  // This build owns these names at the root; the app's public folder must not ship them.
  for (const name of ['web', 'web.html', 'android', 'android.html', '_redirects', '_headers', 'robots.txt', 'sitemap.xml']) {
    if (fs.existsSync(path.join(publish, name))) {
      fail(`The app export already contains ${rel(publish)}/${name}, which this build writes or routes. Remove it from apps/mobile/public, or update scripts/build-netlify.mjs.`);
    }
  }

  // 2. The website under /web/. apps/web is not an npm workspace: it installs from its own lockfile.
  // --include=dev keeps its build tools even if NODE_ENV=production is set on the site. Both links
  // are set (or emptied) here, so the Android button and the /android rule below share one condition.
  npm(['ci', '--prefix', 'apps/web', '--include=dev', '--no-audit', '--no-fund']);
  // This copy is the website's main one, so its canonical address is its own (CANONICAL_URL emptied).
  const webEnv = { BASE_PATH: '/web/', SITE_URL: `${site}/web`, CANONICAL_URL: '', VITE_APP_URL: '/', VITE_ANDROID_URL: apk ? '/android' : '' };
  keepingFiles([path.join(webDir, 'public/sitemap.xml'), path.join(webDir, 'public/robots.txt')], () => {
    npm(['run', 'build', '--prefix', 'apps/web'], webEnv);
  });

  const webOut = path.join(webDir, 'dist');
  const page = fs.readFileSync(path.join(webOut, 'index.html'), 'utf8');
  if (!page.includes('src="/web/assets/')) fail('The website build does not load its scripts from /web/assets/: BASE_PATH did not take effect.');
  if (!page.includes('href="/"')) fail('The website build has no link to the web app at "/".');
  if (page.includes('href="/android"') !== Boolean(apk)) {
    fail(`The website ${apk ? 'lacks' : 'has'} a link to /android, but ANDROID_APK_URL is ${apk ? 'set' : 'unset'}.`);
  }
  const canonical = new URL(`${site}/web/`).href;
  if (!page.includes(`<link rel="canonical" href="${canonical}"`)) fail(`The website does not name ${canonical} as its canonical address.`);
  const sitemap = fs.readFileSync(path.join(webOut, 'sitemap.xml'), 'utf8');
  if (!sitemap.includes(`<loc>${site}/web/</loc>`)) fail(`The website's sitemap.xml does not list ${site}/web/.`);

  const webPublish = path.join(publish, 'web');
  fs.cpSync(webOut, webPublish, { recursive: true });

  // 3. Routing. First match wins, and a file that exists is served before any of these rules, so
  // real files always load. The /web rule also matches /web/, and both /web rules come before the
  // app's catch-all, so nothing under /web reaches the app. The website is one page, so any other
  // path under /web (a missing asset included) shows that page with a 404 status, and search engines
  // do not index endless copies of it. No rule is forced (a forced /web -> /web/ would loop).
  const rules = [
    '# Written by scripts/build-netlify.mjs. First match wins; existing files are served before these rules.',
    '',
    '# The website: /web and /web/ show it; any other missing path under /web shows it as a 404.',
    '/web           /web/index.html   200',
    '/web/*         /web/index.html   404',
    '# Crawlers that ask for a sitemap at the root get the website\'s.',
    '/sitemap.xml   /web/sitemap.xml  200',
    '',
    ...(apk ? ['# The pre-launch Android APK (the ANDROID_APK_URL environment variable).', `/android       ${apk}  302`, ''] : []),
    '# The app: a missing hashed file is a 404, every other path opens the app and its router.',
    '/_expo/*       /index.html       404',
    '/assets/*      /index.html       404',
    '/*             /index.html       200',
  ];
  fs.writeFileSync(path.join(publish, '_redirects'), `${rules.join('\n')}\n`);

  // 4. Crawlers read robots.txt only at the site root; point it at the website's sitemap. The website's
  // own web/robots.txt and web/sitemap.xml stay as built (the rule above also serves the sitemap at
  // /sitemap.xml).
  fs.writeFileSync(path.join(publish, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}/web/sitemap.xml\n`);

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`
Netlify build ready in ${rel(publish)} (${seconds} s) for ${site}
  /           the app's web export, ${appFiles} files
  /web/       the website, ${countFiles(webPublish)} files (sitemap: ${site}/web/sitemap.xml)
  /android    ${apk ? `302 to ${apk}` : 'not offered: ANDROID_APK_URL is unset'}
  _redirects  ${rules.filter((r) => r && !r.startsWith('#')).length} rules; robots.txt at the root`);
}

try {
  main();
} catch (error) {
  // A failed npm step has already printed its own output; name the step rather than repeat a stack.
  const message =
    error instanceof BuildError ? error.message : typeof error?.status === 'number' ? `${String(error.message).split('\n')[0]} (exit ${error.status})` : error?.stack || String(error);
  console.error(`\nNetlify build failed: ${message}`);
  process.exit(1);
}
