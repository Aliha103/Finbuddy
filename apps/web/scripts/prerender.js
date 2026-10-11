// Renders the page into dist/index.html at build time (see src/entry-server.tsx), then removes
// the server bundle. Runs after `vite build` and `vite build --ssr`.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const serverDir = path.join(root, 'dist-ssr')
const entry = fs.readdirSync(serverDir).find((f) => /^entry-server\.m?js$/.test(f))
if (!entry) throw new Error('dist-ssr/entry-server.js is missing; run vite build --ssr first')

const { render } = await import(pathToFileURL(path.join(serverDir, entry)).href)
const html = render()
const indexPath = path.join(root, 'dist', 'index.html')
const template = fs.readFileSync(indexPath, 'utf8')
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html has no empty #root to fill')
fs.writeFileSync(indexPath, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
fs.rmSync(serverDir, { recursive: true, force: true })
console.log(`prerendered ${Math.round(html.length / 1024)} KB of HTML into dist/index.html`)
