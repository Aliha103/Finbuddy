// Generate sitemap for FinBuddy
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://aliha103.github.io/Finbuddy'

const routes = [
  {
    url: '/',
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/login',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/signup',
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/dashboard',
    changefreq: 'daily',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/dashboard/balance',
    changefreq: 'daily',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  }
]

function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${BASE_URL}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return sitemap
}

function generateRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml

# Block sensitive areas
Disallow: /api/
Disallow: /_vite/
Disallow: /node_modules/
Disallow: /.env*

# Allow common crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /`
}

// Write files
const publicDir = path.join(__dirname, '..', 'public')

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

// Generate and write sitemap
const sitemapContent = generateSitemap()
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent)

// Generate and write robots.txt
const robotsContent = generateRobotsTxt()
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent)

console.log('✅ Sitemap and robots.txt generated successfully!')
console.log(`📁 Files created in: ${publicDir}`)
console.log('📄 sitemap.xml - Contains all public routes')
console.log('🤖 robots.txt - Search engine crawler instructions')
