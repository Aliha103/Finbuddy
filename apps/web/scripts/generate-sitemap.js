// Writes public/sitemap.xml and public/robots.txt for the one-page site.
// SITE_URL is the site's public address including its base path (set by the GitHub Pages workflow
// and the Netlify build). Without it, Netlify's URL (the site's main address) plus BASE_PATH is used,
// so a build served under /web/ never claims the address of whatever sits at the site root.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const basePath = (process.env.BASE_PATH || '/').replace(/\/$/, '')
const fromNetlify = process.env.URL ? process.env.URL.replace(/\/$/, '') + basePath : null
const BASE_URL = (process.env.SITE_URL || fromNetlify || 'https://aliha103.github.io/Finbuddy').replace(/\/$/, '')
const today = new Date().toISOString().split('T')[0]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`

const publicDir = path.join(here, '..', 'public')
fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap)
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots)
console.log(`sitemap.xml and robots.txt written for ${BASE_URL}`)
