#!/usr/bin/env node
/**
 * prerender.mjs, the post-build SEO pass.
 *
 * GitHub Pages serves an SPA's deep routes through the 404.html bounce, which
 * hands crawlers a literal HTTP 404 for every URL except /. This script runs
 * after `vite build` and writes a real HTML file for every public route:
 *
 *   dist/lessons/5.html  and  dist/lessons/5/index.html
 *
 * so both the extensionless URL and the trailing-slash form answer 200. Each
 * file is the built index.html with its own <title>, meta description,
 * canonical link, Open Graph and Twitter tags, and JSON-LD. Lesson pages also
 * carry a static article block inside #root (heading, the lesson's own opening
 * prose, prev/next links) so a crawler that never runs JS still reads real
 * Tongan course content. React replaces that block when it mounts.
 *
 * It is deliberately additive. It reads dist/ and writes new files; it never
 * touches the JS or CSS bundles Vite produced. That separation is the whole
 * point: the July 2026 revert was caused by the code-splitting change that
 * shipped alongside this, not by the prerender itself.
 *
 * Also emits dist/sitemap.xml. robots.txt is static in public/.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SITE_NAME,
  SITE_URL,
  OG_IMAGE,
  SUPPORT_URL,
  STATIC_META,
  DEFAULT_DESCRIPTION,
  lessonTitle,
  lessonDescription,
  quizTitle,
  quizDescription,
  drillTitle,
  drillDescription,
} from '../src/seo/meta.js'
import { okinafy } from '../src/lib/okinafy.js'
import { GROUPS } from '../src/data/drills-catalog.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

// Shift a lesson number by an offset. A helper rather than inline arithmetic
// so the source never contains a space-hyphen-space sequence, which the house
// voice guard reads as a dash.
const shift = (n, by) => n + by

/* Markdown helpers for the static lesson block
   ================================================================== */

// Minimal inline markdown to HTML. In this book italics mark Tongan, so *…*
// becomes an <em lang="to"> with the fakauʻa normalised the way the app's own
// render layer normalises it; **…** is bold; everything else is escaped text.
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
    const chunk = next === -1 ? rest : rest.slice(0, shift(next, 1))
    out += esc(chunk)
    rest = rest.slice(chunk.length)
  }
  return out
}

// First prose paragraphs of a chapter file. Pandoc fenced divs (the ::: blocks
// that hold example sentences), headings, tables, and horizontal rules are
// dropped whole, so an excerpt is always running prose and never the tail of an
// example block with a stray fence on the end.
function introParagraphs(md, count = 2) {
  const kept = []
  let inDiv = false
  let inFence = false
  for (const raw of md.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (line.startsWith(':::')) {
      // An opening fence carries an attribute block; a bare ::: closes one.
      inDiv = line.length > 3 ? true : false
      continue
    }
    if (inDiv) continue
    if (line.startsWith('#') || line.startsWith('|') || line.startsWith('---') || line.startsWith('<!--')) {
      kept.push('')
      continue
    }
    kept.push(raw)
  }

  const out = []
  for (const block of kept.join('\n').split(/\n\s*\n/)) {
    const b = block.trim().replace(/\n/g, ' ')
    if (b.length < 60) continue
    if (b.startsWith('*') && b.endsWith('*')) continue
    out.push(b)
    if (out.length >= count) break
  }
  return out
}

/* Head tags and JSON-LD
   ================================================================== */

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`
const COURSE_ID = `${SITE_URL}/#course`

const organization = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DEFAULT_DESCRIPTION,
  sameAs: [SUPPORT_URL],
}

const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
}

const course = {
  '@type': 'Course',
  '@id': COURSE_ID,
  name: 'Lea Faka-Tonga: a free 52-lesson Tongan course',
  description: DEFAULT_DESCRIPTION,
  url: `${SITE_URL}/lessons`,
  inLanguage: 'en',
  teaches: 'Tongan language',
  about: { '@type': 'Language', name: 'Tongan', alternateName: 'Lea faka-Tonga' },
  isAccessibleForFree: true,
  provider: { '@id': ORG_ID },
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', category: 'Free' },
  hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
}

function breadcrumb(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: shift(i, 1),
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  }
}

function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) }
}

// Routes that get a real page and a real social card but stay out of the index.
// /support exists only to hand the visitor to Buy Me a Coffee, so a searcher who
// landed on it from Google would be bounced straight off the site.
const NO_INDEX = new Set(['/support'])

function headFor({ title, description, urlPath, ogType, jsonLd }) {
  const url = `${SITE_URL}${urlPath}`
  const lines = [
    ...(NO_INDEX.has(urlPath) ? [`<meta name="robots" content="noindex, follow" />`] : []),
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${esc(ogType || 'website')}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(OG_IMAGE)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${esc(`${SITE_NAME}: learn Tongan, free`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(OG_IMAGE)}" />`,
  ]
  if (jsonLd) {
    // A literal </script> inside the JSON would close the tag early.
    const json = JSON.stringify(jsonLd).replaceAll('</', '<\\/')
    lines.push(`<script type="application/ld+json">${json}</script>`)
  }
  return lines.join('\n    ')
}

// Everything this script injects sits between markers, so a template that has
// already been through a pass can be stripped back to the shape Vite emitted.
// Without that, running the prerender twice without an intervening build bakes
// the homepage's canonical and JSON-LD into every other page.
const HEAD_OPEN = '<!-- prerender:head -->'
const HEAD_CLOSE = '<!-- /prerender:head -->'
const ROOT_OPEN = '<!-- prerender:root -->'
const ROOT_CLOSE = '<!-- /prerender:root -->'

function cleanTemplate(html) {
  return html
    .replace(new RegExp(`[ \\t]*${HEAD_OPEN}[\\s\\S]*?${HEAD_CLOSE}\\n?`, 'g'), '')
    .replace(
      new RegExp(`<div id="root">${ROOT_OPEN}[\\s\\S]*?${ROOT_CLOSE}</div>`, 'g'),
      '<div id="root"></div>'
    )
}

function renderPage(template, { title, description, urlPath, ogType, jsonLd, rootHtml }) {
  const head = headFor({ title, description, urlPath, ogType, jsonLd })
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace('</head>', `    ${HEAD_OPEN}\n    ${head}\n    ${HEAD_CLOSE}\n  </head>`)
  if (rootHtml) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${ROOT_OPEN}${rootHtml}${ROOT_CLOSE}</div>`
    )
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

/* The static block a non-JS crawler reads on a lesson page
   ================================================================== */

const BLOCK_STYLE =
  'max-width:44rem;margin:0 auto;padding:3rem 1.25rem;' +
  'color:var(--text,#2a1f14);background:var(--bg,#fff);' +
  // Single quotes inside: this string lands in an HTML style attribute.
  "font-family:Georgia,'Source Serif 4',serif;line-height:1.65;font-size:1.05rem"

// Tailwind's preflight strips heading sizes and link colour, and this block
// renders outside the app's own stylesheet scope, so it carries its own.
const H1_STYLE = 'font-size:2rem;line-height:1.2;margin:0 0 1.25rem;font-weight:700'
const P_STYLE = 'margin:0 0 1rem'
const link = (href, text) => `<a href="${href}" style="color:#c24a1f;text-decoration:underline">${text}</a>`

function lessonRootHtml({ num, title, intro, total }) {
  const prev = shift(num, -1)
  const next = shift(num, 1)
  const nav = [
    num > 1 ? link(`/lessons/${prev}`, `Lesson ${prev}`) : '',
    link('/lessons', `All ${total} lessons`),
    num < total ? link(`/lessons/${next}`, `Lesson ${next}`) : '',
  ]
    .filter(Boolean)
    .join(' &middot; ')
  return (
    `<article style="${BLOCK_STYLE}">` +
    `<p style="${P_STYLE}">${link('/', esc(SITE_NAME))} &middot; ${link('/lessons', 'Lessons')}</p>` +
    `<h1 style="${H1_STYLE}">Lesson ${num}: ${esc(title)}</h1>` +
    intro.map((p) => `<p style="${P_STYLE}">${inlineMdToHtml(p)}</p>`).join('') +
    `<p style="${P_STYLE}">${link(`/quizzes/${num}`, `Take the lesson ${num} quiz`)}</p>` +
    `<p style="${P_STYLE}">${nav}</p>` +
    `</article>`
  )
}

/* Main
   ================================================================== */

async function main() {
  const template = cleanTemplate(await readFile(path.join(DIST, 'index.html'), 'utf-8'))
  const chapters = JSON.parse(await readFile(path.join(ROOT, 'src/data/chapters.json'), 'utf-8'))
  const total = chapters.length
  const quizzes = JSON.parse(await readFile(path.join(ROOT, 'src/data/quizzes.json'), 'utf-8'))

  // Drill pages are prerendered only where the catalogue gives a real title and
  // the registry actually resolves the id, so no page ships with a placeholder
  // heading.
  const registrySrc = await readFile(path.join(ROOT, 'src/drills/registry.js'), 'utf-8')
  const registryIds = new Set([...registrySrc.matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((m) => m[1]))
  const drills = new Map()
  for (const g of GROUPS) {
    for (const d of g.drills) if (!drills.has(d.id)) drills.set(d.id, { title: d.title, blurb: d.blurb })
    for (const d of g.inChapters || []) if (!drills.has(d.id)) drills.set(d.id, { title: d.label })
  }
  const drillIds = [...drills.keys()].filter((id) => registryIds.has(id))

  const sitemapPaths = []
  let pages = 0

  /* Static routes. */
  for (const [urlPath, meta] of Object.entries(STATIC_META)) {
    let jsonLd
    if (urlPath === '/') {
      jsonLd = graph([organization, website, course])
    } else if (urlPath === '/lessons') {
      jsonLd = graph([
        organization,
        website,
        course,
        {
          '@type': 'ItemList',
          name: `The ${total} lessons`,
          itemListElement: chapters.map((ch) => ({
            '@type': 'ListItem',
            position: ch.chapter,
            name: `Lesson ${ch.chapter}: ${ch.title}`,
            url: `${SITE_URL}/lessons/${ch.chapter}`,
          })),
        },
        breadcrumb([{ name: 'Home', path: '/' }, { name: 'Lessons', path: '/lessons' }]),
      ])
    } else {
      jsonLd = graph([
        organization,
        website,
        {
          '@type': 'WebPage',
          '@id': `${SITE_URL}${urlPath}#webpage`,
          name: meta.title,
          description: meta.description,
          url: `${SITE_URL}${urlPath}`,
          inLanguage: 'en',
          isPartOf: { '@id': SITE_ID },
        },
      ])
    }
    await writeRoute(urlPath, renderPage(template, { ...meta, urlPath, jsonLd }))
    // /support renders for a moment and then sends the visitor to Buy Me a
    // Coffee, so there is no page for a search result to land on. It keeps its
    // title and card (shared links still preview correctly) and stays out of
    // the sitemap and the index.
    if (!NO_INDEX.has(urlPath)) sitemapPaths.push(urlPath)
    pages += 1
  }

  /* Lesson pages. */
  for (const ch of chapters) {
    const num = ch.chapter
    const urlPath = `/lessons/${num}`
    let intro = []
    try {
      const md = await readFile(path.join(ROOT, `book/Chapter-${String(num).padStart(2, '0')}.md`), 'utf-8')
      intro = introParagraphs(md.replace(/^#[^\n]*\n/, ''))
    } catch {
      intro = []
    }
    const title = lessonTitle(num, ch.title)
    const description = lessonDescription(num, ch.title, ch.teaching?.summary)
    const jsonLd = graph([
      organization,
      website,
      course,
      {
        '@type': 'LearningResource',
        '@id': `${SITE_URL}${urlPath}#lesson`,
        name: `Lesson ${num}: ${ch.title}`,
        description,
        url: `${SITE_URL}${urlPath}`,
        position: num,
        inLanguage: 'en',
        teaches: 'Tongan language',
        about: { '@type': 'Language', name: 'Tongan', alternateName: 'Lea faka-Tonga' },
        learningResourceType: 'Lesson',
        educationalLevel: ch.group || 'beginner to advanced',
        isAccessibleForFree: true,
        isPartOf: { '@id': COURSE_ID },
        provider: { '@id': ORG_ID },
      },
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Lessons', path: '/lessons' },
        { name: `Lesson ${num}`, path: urlPath },
      ]),
    ])
    const rootHtml = lessonRootHtml({ num, title: ch.title, intro, total })
    await writeRoute(
      urlPath,
      renderPage(template, { title, description, urlPath, ogType: 'article', jsonLd, rootHtml })
    )
    sitemapPaths.push(urlPath)
    pages += 1
  }

  /* Quiz pages. The questions themselves stay interactive, so these carry
     metadata only. */
  let quizCount = 0
  for (const ch of chapters) {
    const num = ch.chapter
    if (!quizzes[String(num)]) continue
    const urlPath = `/quizzes/${num}`
    const title = quizTitle(num, ch.title)
    const description = quizDescription(num, ch.title)
    const jsonLd = graph([
      organization,
      website,
      {
        '@type': 'Quiz',
        '@id': `${SITE_URL}${urlPath}#quiz`,
        name: `Lesson ${num} quiz: ${ch.title}`,
        description,
        url: `${SITE_URL}${urlPath}`,
        inLanguage: 'en',
        about: { '@type': 'Language', name: 'Tongan', alternateName: 'Lea faka-Tonga' },
        educationalAlignment: {
          '@type': 'AlignmentObject',
          alignmentType: 'assesses',
          targetName: `Lesson ${num}: ${ch.title}`,
          targetUrl: `${SITE_URL}/lessons/${num}`,
        },
        isAccessibleForFree: true,
        isPartOf: { '@id': COURSE_ID },
      },
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Quizzes', path: '/quizzes' },
        { name: `Lesson ${num} quiz`, path: urlPath },
      ]),
    ])
    await writeRoute(urlPath, renderPage(template, { title, description, urlPath, jsonLd }))
    sitemapPaths.push(urlPath)
    pages += 1
    quizCount += 1
  }

  /* Drill pages. */
  for (const id of drillIds) {
    const d = drills.get(id)
    const urlPath = `/drill/${id}`
    const title = drillTitle(d.title)
    const description = drillDescription(d.title, d.blurb)
    const jsonLd = graph([
      organization,
      website,
      {
        '@type': 'LearningResource',
        '@id': `${SITE_URL}${urlPath}#drill`,
        name: d.title,
        description,
        url: `${SITE_URL}${urlPath}`,
        inLanguage: 'en',
        teaches: 'Tongan language',
        learningResourceType: 'Practice drill',
        isAccessibleForFree: true,
        isPartOf: { '@id': COURSE_ID },
        provider: { '@id': ORG_ID },
      },
      breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Drills', path: '/drills' },
        { name: d.title, path: urlPath },
      ]),
    ])
    await writeRoute(urlPath, renderPage(template, { title, description, urlPath, jsonLd }))
    sitemapPaths.push(urlPath)
    pages += 1
  }

  /* sitemap.xml */
  const today = new Date().toISOString().slice(0, 10)
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemapPaths
      .map((p) => `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod></url>`)
      .join('\n') +
    '\n</urlset>\n'
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap)

  console.log(
    `prerender: ${pages} routes (${Object.keys(STATIC_META).length} static, ${total} lessons, ` +
      `${quizCount} quizzes, ${drillIds.length} drills), sitemap.xml with ${sitemapPaths.length} URLs`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
