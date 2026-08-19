#!/usr/bin/env node
/**
 * make-og-image.mjs, the social card generator.
 *
 * Renders public/og-image.png (1200x630), the image Facebook, WhatsApp,
 * Messenger, iMessage, and X show when someone shares any page of the site.
 * Built from the site's own parts: the LogoMark pinwheel, the brand red
 * (#c24a1f) on the dark ground (#1a1410), Barlow Condensed for display and
 * Inter for the supporting line, both read straight out of @fontsource.
 *
 * Run from lea-faka-tonga-app/:  node scripts/make-og-image.mjs
 *
 * Puppeteer lives in the parent repo's node_modules, the same install the
 * root capture scripts use. This is a one-off asset generator and is not part
 * of `npm run build`.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = path.resolve(ROOT, '..')
const { default: puppeteer } = await import(
  pathToFileURL(path.join(REPO, 'node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).href
)

const logoSrc = await readFile(path.join(ROOT, 'src/components/LogoMark.jsx'), 'utf-8')
const logoPath = logoSrc.match(/ d="([^"]+)"/)[1]

const font = (file) =>
  pathToFileURL(path.join(ROOT, 'node_modules/@fontsource', file)).href

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: 'Barlow Condensed'; font-weight: 700;
    src: url('${font('barlow-condensed/files/barlow-condensed-latin-700-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Barlow Condensed'; font-weight: 800;
    src: url('${font('barlow-condensed/files/barlow-condensed-latin-800-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Inter'; font-weight: 400;
    src: url('${font('inter/files/inter-latin-400-normal.woff2')}') format('woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #1a1410; color: #f0e6d2;
         font-family: 'Inter', system-ui, sans-serif; overflow: hidden; }
  .card { width: 1200px; height: 630px; padding: 62px 72px 56px;
          display: flex; flex-direction: column; justify-content: space-between;
          border-bottom: 14px solid #c24a1f; }
  .brand { display: flex; align-items: center; gap: 22px; }
  .brand svg { width: 62px; height: 62px; color: #c24a1f; }
  .brand span { font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
                font-size: 44px; letter-spacing: 0.11em; text-transform: uppercase; }
  h1 { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 118px;
       line-height: 0.9; letter-spacing: -0.005em; text-transform: uppercase;
       white-space: nowrap; }
  h1 .free { color: #c24a1f; }
  .sub { font-size: 26px; line-height: 1.45; color: rgba(240, 230, 210, 0.78);
         max-width: 46ch; margin-top: 30px; }
  .foot { display: flex; align-items: baseline; justify-content: space-between;
          font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
          font-size: 30px; letter-spacing: 0.14em; text-transform: uppercase; }
  .foot .dom { color: #c24a1f; }
  .foot .note { color: rgba(240, 230, 210, 0.55); }
</style></head>
<body><div class="card">
  <div class="brand">
    <svg viewBox="0 0 800 800" fill="currentColor"><path d="${logoPath}" fill-rule="evenodd"/></svg>
    <span>Lea Faka-Tonga</span>
  </div>
  <div>
    <h1>Learn Tongan,<br><span class="free">free.</span></h1>
    <p class="sub">52 lessons, 30 practice drills, a quiz for every lesson, and the whole book as a free download.</p>
  </div>
  <div class="foot">
    <span class="dom">leafakatonga.org</span>
    <span class="note">Beginner to fluent, in order</span>
  </div>
</div></body></html>`

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()

const out = path.join(ROOT, 'public/og-image.png')
await writeFile(out, buf)
console.log(`wrote ${out} (1200x630)`)
