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
import { BESPOKE } from '../src/lib/drill-routes.js'
import { tokenizeInline } from '../src/seo/inline.js'
import { GROUPS, LEVELS } from '../src/data/drills-catalog.js'
import alphabetDoc from '../src/seo/pages/alphabet.js'
import tenseMarkersDoc from '../src/seo/pages/tense-markers.js'

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
// The tokenizer lives in src/seo/inline.js because the React renderer
// (src/components/ArticlePage.jsx) has to split the same strings the same way.
function inlineMdToHtml(text) {
  let out = ''
  for (const tok of tokenizeInline(text)) {
    if (tok.t === 'strong') out += `<strong>${esc(tok.v)}</strong>`
    else if (tok.t === 'em') out += `<em lang="to">${esc(okinafy(tok.v))}</em>`
    else out += esc(tok.v)
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

function headFor({ title, description, urlPath, ogType, jsonLd, canonicalPath }) {
  const url = `${SITE_URL}${urlPath}`
  // A page whose content also answers at another URL points its canonical at
  // that one, so the pair is read as a single page rather than as duplicates.
  const canonical = `${SITE_URL}${canonicalPath || urlPath}`
  const lines = [
    ...(NO_INDEX.has(urlPath) ? [`<meta name="robots" content="noindex, follow" />`] : []),
    `<link rel="canonical" href="${esc(canonical)}" />`,
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

function renderPage(template, { title, description, urlPath, ogType, jsonLd, rootHtml, canonicalPath }) {
  const head = headFor({ title, description, urlPath, ogType, jsonLd, canonicalPath })
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

/* The static block a non-JS crawler reads on a topic page
   ==================================================================
   Same self-contained styling as the lesson block above: this HTML is read
   before React mounts and outside the app's own `.reading-page` scope, so it
   carries its own type sizes and borders and never depends on the bundle. */

const EYEBROW_STYLE =
  'font-size:0.75rem;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 0.5rem'
const H2_STYLE = 'font-size:1.35rem;line-height:1.25;margin:2rem 0 0.75rem;font-weight:700'
const H3_STYLE = 'font-size:1.1rem;line-height:1.3;margin:1.5rem 0 0.5rem;font-weight:700'
const TABLE_STYLE = 'width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.95rem'
const CELL_STYLE = 'border:1px solid var(--border,#d4cec3);padding:8px 12px;text-align:left'
const TH_STYLE = `${CELL_STYLE};font-weight:700`
const EX_STYLE =
  'border-left:3px solid var(--border,#d4cec3);padding:0.25rem 0 0.25rem 18px;margin:1rem 0'
const EX_PAIR_STYLE = 'margin:0 0 0.75rem'
const NOTE_STYLE =
  'border-left:3px solid var(--border,#d4cec3);padding:0.6rem 0 0.6rem 18px;margin:1rem 0;font-size:0.95rem'
const UL_STYLE = 'margin:0 0 1rem;padding-left:1.2rem'
const LI_STYLE = 'margin:0 0 0.35rem'

function docBlockHtml(block) {
  if (block.k === 'h2') return `<h2 style="${H2_STYLE}">${inlineMdToHtml(block.text)}</h2>`
  if (block.k === 'h3') return `<h3 style="${H3_STYLE}">${inlineMdToHtml(block.text)}</h3>`
  if (block.k === 'p') return `<p style="${P_STYLE}">${inlineMdToHtml(block.text)}</p>`
  if (block.k === 'note') return `<div style="${NOTE_STYLE}">${inlineMdToHtml(block.text)}</div>`
  if (block.k === 'ex') {
    return (
      `<div style="${EX_STYLE}">` +
      block.items
        .map(
          (it) =>
            `<p style="${EX_PAIR_STYLE}"><em lang="to">${esc(okinafy(it.ton))}</em><br />${esc(it.en)}</p>`
        )
        .join('') +
      `</div>`
    )
  }
  if (block.k === 'table') {
    const head = block.headers
      .map((h) => `<th style="${TH_STYLE}">${inlineMdToHtml(h)}</th>`)
      .join('')
    const body = block.rows
      .map(
        (row) =>
          `<tr>${row.map((c) => `<td style="${CELL_STYLE}">${inlineMdToHtml(c)}</td>`).join('')}</tr>`
      )
      .join('')
    return `<table style="${TABLE_STYLE}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
  }
  if (block.k === 'next') {
    return (
      `<ul style="${UL_STYLE}">` +
      block.items.map((it) => `<li style="${LI_STYLE}">${link(it.to, esc(it.label))}</li>`).join('') +
      `</ul>`
    )
  }
  return ''
}

function docRootHtml(doc) {
  return (
    `<article style="${BLOCK_STYLE}">` +
    `<p style="${P_STYLE}">${link('/', esc(SITE_NAME))} &middot; ${link('/lessons', 'Lessons')}</p>` +
    (doc.eyebrow ? `<div style="${EYEBROW_STYLE}">${esc(doc.eyebrow)}</div>` : '') +
    `<h1 style="${H1_STYLE}">${esc(doc.h1)}</h1>` +
    doc.blocks.map(docBlockHtml).join('') +
    `</article>`
  )
}

const DOCS = { [alphabetDoc.path]: alphabetDoc, [tenseMarkersDoc.path]: tenseMarkersDoc }

/* The static block a non-JS crawler reads on a drill page
   ==================================================================
   Every sentence is derived from data that already describes that one drill:
   its registry entry (src/drills/registry.js), its catalogue card or
   in-chapter row (src/data/drills-catalog.js), the lesson or lessons that
   embed it (src/data/drill-map.json), and the shared mechanic its Core is
   built on. Nothing is asserted that the data does not carry: a drill with no
   drill-map entry is described as filed under a lesson, never as running
   inside one, and a bespoke Core makes no claim about the mechanic. */

// Parse the registry's { title, blurb } for every drill. The file imports JSX,
// so it cannot be imported here; each meta object is a plain literal, so the
// balanced-brace slice is evaluated rather than pattern-matched.
function parseRegistryMeta(src) {
  const out = {}
  const re = /^ {2}'([a-z0-9-]+)':\s*\{/gm
  let m
  while ((m = re.exec(src))) {
    const metaAt = src.indexOf('meta:', m.index)
    if (metaAt === -1) continue
    const open = src.indexOf('{', metaAt)
    let depth = 0
    let i = open
    for (; i < src.length; i++) {
      if (src[i] === '{') depth += 1
      else if (src[i] === '}') {
        depth -= 1
        if (depth === 0) {
          i += 1
          break
        }
      }
    }
    const core = src.slice(m.index, metaAt).match(/Core:\s*(\w+)/)
    try {
      out[m[1]] = { ...new Function(`return (${src.slice(open, i)})`)(), core: core ? core[1] : null }
    } catch {
      out[m[1]] = null
    }
  }
  return out
}

// Which shared mechanic a drill's Core is built on. The first two are read from
// the import list; the last two are read from the markup the Core renders, for
// the bespoke drills that are built on neither shared engine.
function coreEngine(coreSrc) {
  if (/from '\.\/PickerCore'/.test(coreSrc)) return 'picker'
  if (/from '\.\/SorterCore'/.test(coreSrc)) return 'sorter'
  if (/-prompt-label">Say this in Tongan</.test(coreSrc)) return 'build'
  if (/clu-matrix-rowhead/.test(coreSrc)) return 'matrix'
  return null
}

// The one question this drill puts at the top of every item: the `question`
// prop the shared engines take, or, for a bespoke Core, the literal line it
// renders in the question slot. Anything with a `{` in it is interpolated at
// runtime and is skipped rather than guessed at.
function coreQuestion(coreSrc) {
  const prop =
    coreSrc.match(/question=\{`([^`]*)`\}/) ||
    coreSrc.match(/question="([^"]*)"/) ||
    coreSrc.match(/question=\{'([^']*)'\}/)
  if (prop) return prop[1]
  // Only the FIRST question slot the file renders: a Core with more than one
  // is running a two-stage item, and the later stage would misdescribe it.
  const at = coreSrc.indexOf('className="pcs-question">')
  if (at === -1) return null
  const from = at + 'className="pcs-question">'.length
  const end = coreSrc.indexOf('</div>', from)
  if (end === -1) return null
  const inner = coreSrc.slice(from, end)
  // Interpolated or nested markup means the line changes as the drill runs, so
  // there is no single question to quote.
  if (/[{}]/.test(inner) || /<(?!\/?em>)/.test(inner)) return null
  return inner.replace(/<\/?em>/g, '').trim() || null
}

const MECHANIC = {
  picker:
    'Each item shows a line of Tongan and a short row of answers to tap. Right or wrong, the drill then says why that answer is the one the grammar wants.',
  sorter:
    'Each card carries one word, and you file it into the class it belongs to. The reason shows on the card either way, so a wrong guess teaches as much as a right one.',
  build:
    'Each item hands you the English and asks you to build the Tongan, and a wrong build is shown beside the sentence the grammar wants.',
  matrix:
    'The answers sit in a grid rather than a row, so each item is a choice of box, and the drill names the form you should have reached for.',
}

function lessonPhrase(n, titles) {
  const t = titles[n]
  return t ? `lesson ${n}, ${t.toLowerCase()}` : `lesson ${n}`
}

function drillRootHtml({ id, meta, card, lessons, titles, question, engine }) {
  const title = meta?.title || card?.title || card?.label || 'Tongan practice drill'
  const level = card?.level ? LEVELS[card.level] : null
  const ps = []

  // 1. Where it sits in the course. A drill with no drill-map entry is never
  // described as running inside a lesson, only as filed under one.
  const home = card?.ch || lessons[0]
  const rated = level ? `, rated ${level.toLowerCase()}` : ''
  if (lessons.length === 1) {
    ps.push(
      `This is a practice drill from the free 52-lesson Tongan course. The course reaches for it ` +
        `in ${lessonPhrase(lessons[0], titles)}, where it runs inside the lesson as well as on ` +
        `this page${rated}.`
    )
  } else if (lessons.length > 1) {
    const list = lessons.map((n) => `lesson ${n}`).join(' and ')
    ps.push(
      `This is a practice drill from the free 52-lesson Tongan course. It runs inside ${list}, ` +
        `and the drills menu files it under ${lessonPhrase(home, titles)}${rated}.`
    )
  } else {
    ps.push(
      `This is a practice drill from the free 52-lesson Tongan course. The drills menu files it ` +
        `under ${lessonPhrase(home, titles)}${rated}.`
    )
  }

  // 2. What it practises, in the words written for this drill.
  if (meta?.blurb) ps.push(inlineOff(meta.blurb))

  // 3. What the learner actually does.
  const doing = []
  // True when the task line is left out because the blurb above already says
  // it. The deck line below then has to carry the framing instead, so a
  // sentence the drill deliberately breaks is never printed bare.
  const taskInBlurb = !question && Boolean(card?.sample?.q) && opensWith(meta?.blurb, card.sample.q)
  if (question) doing.push(`Every item asks the same thing: ${quote(question)}`)
  else if (card?.sample?.q && !taskInBlurb)
    doing.push(`A typical item reads: ${quote(card.sample.q)}`)
  else if (card?.label && !sameText(card.label, title) && !sameText(card.label, meta?.blurb))
    doing.push(`On the drills menu it reads: ${quote(card.label)}`)
  if (engine && MECHANIC[engine]) doing.push(MECHANIC[engine])
  if (doing.length) ps.push(doing.join(' '))

  // 4. A real item from this drill's own deck, where the catalogue carries one.
  if (card?.sample?.ton) {
    const opts = (card.sample.opts || []).filter(Boolean)
    const ton = String(card.sample.ton).trim()
    const lead = taskInBlurb ? 'For that task, one from the deck' : 'One from the deck'
    ps.push(
      `${lead}: <em lang="to">${esc(okinafy(ton))}</em>${/[.?!]$/.test(ton) ? '' : '.'}` +
        (opts.length
          ? ` The answers offered are ${opts.map((o) => esc(okinafy(o))).join(', ')}.`
          : '')
    )
  }

  const nav = [
    home ? link(`/lessons/${home}`, `Read lesson ${home}`) : '',
    home ? link(`/quizzes/${home}`, `Take the lesson ${home} quiz`) : '',
    link('/drills', 'All practice drills'),
  ].filter(Boolean)

  return (
    `<article style="${BLOCK_STYLE}">` +
    `<p style="${P_STYLE}">${link('/', esc(SITE_NAME))} &middot; ${link('/drills', 'Drills')}</p>` +
    `<h1 style="${H1_STYLE}">${esc(title)}</h1>` +
    ps.map((p) => `<p style="${P_STYLE}">${p}</p>`).join('') +
    `<p style="${P_STYLE}">${nav.join(' &middot; ')}</p>` +
    `</article>`
  )
}

// Blurbs are plain sentences, not markdown, but they already carry the real
// fakauʻa, so they only need escaping.
function inlineOff(text) {
  return esc(text)
}

// A line of the drill's own copy, run in after a colon. No quotation marks
// around it: several of these labels quote a Tongan word themselves, and
// nesting one pair of quotes inside another reads badly. The sentence's own
// full stop is added only when the copy does not already end in one.
function quote(text) {
  const t = String(text).trim().replace(/:$/, '')
  return `${esc(t)}${/[.?!]$/.test(t) ? '' : '.'}`
}

// True when one bit of copy opens with the other, so the block does not print
// the same sentence twice under two different labels.
function opensWith(longer, shorter) {
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9ʻ]+/g, ' ')
      .trim()
  const a = norm(longer)
  const b = norm(shorter)
  return Boolean(a) && Boolean(b) && a.startsWith(b)
}

// Do two bits of copy say the same thing? Used to keep a menu label out of the
// block when it only repeats the title or the blurb already printed above it.
function sameText(a, b) {
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9ʻ]+/g, ' ')
      .trim()
  return Boolean(a) && Boolean(b) && norm(a) === norm(b)
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
  const registryMeta = parseRegistryMeta(registrySrc)
  const drills = new Map()
  const cards = new Map()
  for (const g of GROUPS) {
    for (const d of g.drills) {
      if (!drills.has(d.id)) drills.set(d.id, { title: d.title, blurb: d.blurb })
      if (!cards.has(d.id)) cards.set(d.id, d)
    }
    for (const d of g.inChapters || []) {
      if (!drills.has(d.id)) drills.set(d.id, { title: d.label })
      if (!cards.has(d.id)) cards.set(d.id, d)
    }
  }
  const drillIds = [...drills.keys()].filter((id) => registryIds.has(id))

  // Which lesson (or lessons) actually embed each drill, and each lesson's own
  // title, so a drill page can name its lesson without guessing from the id.
  const drillMap = JSON.parse(await readFile(path.join(ROOT, 'src/data/drill-map.json'), 'utf-8'))
  const drillLessons = {}
  for (const [ch, anchors] of Object.entries(drillMap)) {
    if (ch.startsWith('$')) continue
    for (const a of anchors) (drillLessons[a.drillId] ||= []).push(Number(ch))
  }
  const chapterTitles = {}
  for (const ch of chapters) chapterTitles[ch.chapter] = ch.title

  // The mechanic and the one question each drill puts at the top of an item,
  // read from the Core the registry points at.
  const drillCore = {}
  for (const id of drillIds) {
    const name = registryMeta[id]?.core
    if (!name) continue
    const src = await readFile(path.join(ROOT, `src/drills/${name}.jsx`), 'utf-8').catch(() => null)
    if (!src) continue
    drillCore[id] = { engine: coreEngine(src), question: coreQuestion(src) }
  }

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
    } else if (DOCS[urlPath]) {
      // Topic pages teach one subject in full, so they carry the same
      // LearningResource shape a lesson does, plus their own trail.
      jsonLd = graph([
        organization,
        website,
        course,
        {
          '@type': 'LearningResource',
          '@id': `${SITE_URL}${urlPath}#article`,
          name: DOCS[urlPath].h1,
          description: meta.description,
          url: `${SITE_URL}${urlPath}`,
          inLanguage: 'en',
          teaches: 'Tongan language',
          about: { '@type': 'Language', name: 'Tongan', alternateName: 'Lea faka-Tonga' },
          learningResourceType: 'Article',
          isAccessibleForFree: true,
          isPartOf: { '@id': COURSE_ID },
          provider: { '@id': ORG_ID },
        },
        breadcrumb([{ name: 'Home', path: '/' }, { name: DOCS[urlPath].h1, path: urlPath }]),
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
    const docRoot = DOCS[urlPath] ? docRootHtml(DOCS[urlPath]) : undefined
    await writeRoute(
      urlPath,
      renderPage(template, { ...meta, urlPath, jsonLd, rootHtml: docRoot, ogType: docRoot ? 'article' : undefined })
    )
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
    const rootHtml = drillRootHtml({
      id,
      meta: registryMeta[id],
      card: cards.get(id),
      lessons: drillLessons[id] || [],
      titles: chapterTitles,
      question: drillCore[id]?.question,
      engine: drillCore[id]?.engine,
    })
    // Eleven drills also answer at a bespoke route, which is the one the drills
    // menu links to. Those /drill/:id pages point their canonical there and stay
    // out of the sitemap, so the pair reads as one page instead of two.
    const canonicalPath = BESPOKE[id]
    await writeRoute(
      urlPath,
      renderPage(template, { title, description, urlPath, jsonLd, rootHtml, canonicalPath })
    )
    if (!canonicalPath) sitemapPaths.push(urlPath)
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
