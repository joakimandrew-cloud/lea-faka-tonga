#!/usr/bin/env node
/**
 * prerender.mjs — post-build SEO pass (site-analysis fix #1, 2026-07-03).
 *
 * GitHub Pages serves an SPA's deep routes as HTTP 404 via the 404.html
 * bounce, which makes every URL except / invisible to crawlers. This script
 * runs after `vite build` and writes a real HTML file for every public route:
 *
 *   dist/lessons/5.html  +  dist/lessons/5/index.html   (both forms, so the
 *   extensionless URL /lessons/5 AND the trailing-slash form serve HTTP 200)
 *
 * Each file is the built index.html with per-route <title>/<meta description>,
 * canonical, Open Graph/Twitter tags and JSON-LD. Lesson pages additionally
 * get a small static article block inside #root (h1 + intro + nav links) so
 * non-JS crawlers see real content; React replaces it on mount.
 *
 * Also emits dist/sitemap.xml. robots.txt is static in public/.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_NAME,
  SITE_URL,
  STATIC_META,
  lessonTitle,
  quizTitle,
} from '../src/seo/meta.js'
import { okinafy } from '../src/lib/okinafy.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const OG_IMAGE = `${SITE_URL}/og-image.png`

const esc = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

// Minimal inline markdown → HTML for the static lesson block: *…* is the
// book's Tongan surface (okinafied + lang="to"), **…** is bold. Everything
// else is escaped text.
function inlineMdToHtml(text) {
  let out = ''
  let rest = text
  while (rest.length) {
    const bold = rest.match(/^\*\*([^*]+)\*\*/)
    if (bold) {
      out += `<strong>${esc(bold[1])}</strong>`
      rest = rest.slice(bold[0].length)
      continue
    }
    const em = rest.match(/^\*([^*]+)\*/)
    if (em) {
      out += `<em lang="to">${esc(okinafy(em[1]))}</em>`
      rest = rest.slice(em[0].length)
      continue
    }
    const next = rest.slice(1).search(/\*/)
    const chunk = next === -1 ? rest : rest.slice(0, next + 1)
    out += esc(chunk)
    rest = rest.slice(chunk.length)
  }
  return out
}

// Plain-text version (for meta descriptions): markdown stripped, Tongan spans
// okinafied, whitespace collapsed, truncated on a word boundary.
function mdToDescription(text, max = 158) {
  const plain = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, (_, inner) => okinafy(inner))
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

// First prose paragraphs of a chapter markdown file (skips the title line,
// directives, headings, tables, rules).
function introParagraphs(md, count = 2) {
  const out = []
  for (const block of md.split(/\n\s*\n/)) {
    const b = block.trim()
    if (!b || b.startsWith('#') || b.startsWith(':::') || b.startsWith('|') || b.startsWith('---')) continue
    if (b.startsWith('*') && b.endsWith('*') && !b.includes('\n')) continue
    out.push(b.replace(/\n/g, ' '))
    if (out.length >= count) break
  }
  return out
}

function headFor({ title, description, urlPath, jsonLd }) {
  const url = `${SITE_URL}${urlPath}`
  const lines = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(OG_IMAGE)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE)}" />`,
  ]
  if (jsonLd) lines.push(`<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`)
  return lines.join('\n    ')
}

function renderPage(template, { title, description, urlPath, jsonLd, rootHtml }) {
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${esc(description)}" />`
    )
    .replace('</head>', `    ${headFor({ title, description, urlPath, jsonLd })}\n  </head>`)
  if (rootHtml) {
    html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`)
  }
  return html
}

async function writeRoute(urlPath, html) {
  if (urlPath === '/') {
    await writeFile(path.join(DIST, 'index.html'), html)
    return
  }
  const clean = urlPath.replace(/^\//, '')
  await mkdir(path.dirname(path.join(DIST, `${clean}.html`)), { recursive: true })
  await writeFile(path.join(DIST, `${clean}.html`), html)
  await mkdir(path.join(DIST, clean), { recursive: true })
  await writeFile(path.join(DIST, clean, 'index.html'), html)
}

async function main() {
  const template = await readFile(path.join(DIST, 'index.html'), 'utf-8')
  const chapters = JSON.parse(await readFile(path.join(ROOT, 'src/data/chapters.json'), 'utf-8'))
  const titleByNum = Object.fromEntries(chapters.map((c) => [c.chapter, c.title]))
  const sitemapPaths = []

  // Static routes (hidden lab/scrub routes are deliberately absent).
  for (const [urlPath, meta] of Object.entries(STATIC_META)) {
    const jsonLd =
      urlPath === '/'
        ? {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
            description: meta.description,
          }
        : undefined
    await writeRoute(urlPath, renderPage(template, { ...meta, urlPath, jsonLd }))
    if (!['/keepers', '/report'].includes(urlPath)) sitemapPaths.push(urlPath)
  }

  // Lesson pages — meta from the chapter markdown + a static article block.
  for (const ch of chapters) {
    const num = ch.chapter
    const urlPath = `/lessons/${num}`
    let intro = []
    try {
      const md = await readFile(
        path.join(ROOT, `book/Chapter-${String(num).padStart(2, '0')}.md`),
        'utf-8'
      )
      intro = introParagraphs(md.replace(/^#[^\n]*\n/, ''))
    } catch {
      intro = []
    }
    const title = lessonTitle(num, ch.title)
    const description = intro.length
      ? mdToDescription(intro[0])
      : `Lesson ${num} of the free 52-lesson Tongan course: ${ch.title}.`
    const nav = [
      num > 1 ? `<a href="/lessons/${num - 1}">← Lesson ${num - 1}</a>` : '',
      `<a href="/lessons">All 52 lessons</a>`,
      num < chapters.length ? `<a href="/lessons/${num + 1}">Lesson ${num + 1} →</a>` : '',
    ]
      .filter(Boolean)
      .join(' · ')
    const rootHtml =
      `<article><h1>Lesson ${num}: ${esc(ch.title)}</h1>` +
      intro.map((p) => `<p>${inlineMdToHtml(p)}</p>`).join('') +
      `<p>${nav}</p></article>`
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: `Lesson ${num}: ${ch.title}`,
      description,
      url: `${SITE_URL}${urlPath}`,
      inLanguage: 'en',
      teaches: 'Tongan language',
      isAccessibleForFree: true,
      isPartOf: { '@type': 'Course', name: `${SITE_NAME} — Learn Tongan, free`, url: SITE_URL },
    }
    await writeRoute(urlPath, renderPage(template, { title, description, urlPath, jsonLd, rootHtml }))
    sitemapPaths.push(urlPath)
  }

  // Quiz pages — title-only meta (content is interactive).
  for (const ch of chapters) {
    const urlPath = `/quizzes/${ch.chapter}`
    const title = quizTitle(ch.chapter, ch.title)
    const description = `Ten questions on Lesson ${ch.chapter} (${ch.title}) of the free Tongan course. Every wrong answer explains why.`
    await writeRoute(urlPath, renderPage(template, { title, description, urlPath }))
    sitemapPaths.push(urlPath)
  }

  const today = new Date().toISOString().slice(0, 10)
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    sitemapPaths
      .map((p) => `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n') +
    `\n</urlset>\n`
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap)

  console.log(`prerendered ${sitemapPaths.length + 2} routes (+ sitemap.xml)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
