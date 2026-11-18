#!/usr/bin/env node
/**
 * check-served-paragraphs.mjs: proves, on the built dist/, that the practice
 * tools, /cards and the 52 quiz pages each serve real text inside #root
 * (SEO plan 2026-08-20, FIX-01 to FIX-03). Run after `npm run build`.
 *
 *   npm run check:served
 *   npm run check:served -- --sitemap-before=2356
 *   npm run check:served -- --list=/path/to/Served-Paragraphs.md
 *   npm run check:served -- --dist=/path/to/another/dist
 *
 * For each of the 65 addresses it requires:
 *   - a prerendered block in #root with at least one paragraph of 25 words or
 *     more, counted without the words inside links;
 *   - no em dash (U+2014) anywhere in the block;
 *   - quiz pages: the lesson number and the lesson's title present, and no
 *     prompt, option text or explanation from that quiz. Option texts shorter
 *     than four characters are skipped, and an option text counts when it
 *     stands as whole words in the heading or the paragraphs (the navigation
 *     links are the same on every quiz page and are left out). The lesson's
 *     own title and topics (chapters.json) are required text, so the option
 *     test runs on what is left once those are taken out; the count of option
 *     texts that are also words in a title or topic is printed as a note;
 *   - a bespoke tool whose drill has a /drill/<id> page: the same heading and
 *     paragraphs as that page, links aside;
 *   - /cards: the deck's size, tier counts and category names as the data
 *     gives them.
 * It also requires each address to sit in sitemap.xml exactly once, and the
 * sitemap's address count to equal the count recorded before this change.
 *
 * The earlier count comes from --sitemap-before=<number or file>, else from
 * SERVED_SITEMAP_BEFORE, else from sitemap-count-before.txt beside the
 * checkout (first line a number). With none of those the count is printed
 * and not compared.
 *
 * Prints one line per failure and a closing line, and exits 1 on any failure.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BESPOKE } from '../src/lib/drill-routes.js'
import { SITE_URL } from '../src/seo/meta.js'
import { okinafy } from '../src/lib/okinafy.js'
import { cardsFacts } from './lib/served-paragraphs.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (rel) => JSON.parse(readFileSync(path.join(ROOT, rel), 'utf-8'))

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  })
)

// --dist=<folder> points the check at another build (used to prove it fails
// on a broken copy).
const DIST = typeof args.dist === 'string' ? path.resolve(args.dist) : path.join(ROOT, 'dist')
const MIN_WORDS = 25
const TOOLS = [
  '/sentence-builder',
  '/terminal-build',
  '/tense-swap',
  '/first-word',
  '/possessive-sort',
  '/adjective-flip',
  '/skeleton-filler',
  '/clusivity',
  '/faka-sort',
  '/cleft-builder',
  '/accent-placement',
  '/verbal-noun',
]

/* Reading a served page
   ================================================================== */

const decode = (s) =>
  s
    .replaceAll('&middot;', '·')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
const text = (html) => decode(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
const words = (s) => s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
// Apostrophe forms, case and spacing levelled, so a match cannot be dodged by
// a curly quote or a capital.
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/['‘’ʼ`ʻ]/g, 'ʻ')
    .replace(/\s+/g, ' ')
    .trim()

// Does `needle` stand in `hay` as whole words, not as part of a longer one?
const EDGE = '[\\p{L}\\p{N}ʻ]'
const hasWhole = (hay, needle) =>
  new RegExp(`(?<!${EDGE})${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!${EDGE})`, 'u').test(hay)

function served(route) {
  const file = path.join(DIST, `${route.replace(/^\//, '')}.html`)
  if (!existsSync(file)) return null
  const html = readFileSync(file, 'utf-8')
  const m = html.match(/<div id="root"><!-- prerender:root -->([\s\S]*?)<!-- \/prerender:root --><\/div>/)
  if (!m) return { html, root: '', h1: '', paragraphs: [] }
  const root = m[1]
  const h1 = text((root.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1])
  const paragraphs = [...root.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((p) => {
    const inner = p[1]
    return {
      text: text(inner),
      // The same paragraph with its links taken out whole, link words included.
      prose: text(inner.replace(/<a\b[\s\S]*?<\/a>/g, '')).replace(/^[·\s]+|[·\s]+$/g, '').replace(/(\s*·\s*)+/g, ' ').trim(),
      links: [...inner.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((a) => ({ href: a[1], label: text(a[2]) })),
    }
  })
  return { html, root, h1, paragraphs }
}

const failures = []
const fail = (route, why) => failures.push(`FAIL ${route}: ${why}`)
const passed = new Set()

function baseChecks(route, page) {
  const before = failures.length
  if (!page) {
    fail(route, 'no prerendered file in dist/')
    return false
  }
  if (!page.root) {
    fail(route, 'no prerendered block inside #root')
    return false
  }
  const longest = Math.max(0, ...page.paragraphs.map((p) => words(p.prose)))
  if (longest < MIN_WORDS) fail(route, `longest paragraph is ${longest} words, under ${MIN_WORDS}`)
  if (page.root.includes('—')) fail(route, 'an em dash (U+2014) in the served block')
  if (!/<script type="module"[^>]*src="\/assets\//.test(page.html)) fail(route, 'the page no longer loads its JavaScript bundle')
  return failures.length === before
}

/* The 65 addresses
   ================================================================== */

const chapters = readJson('src/data/chapters.json')
const quizzes = readJson('src/data/quizzes.json')
const vocabulary = readJson('src/data/book-vocabulary.json')
const pages = new Map()
const routes = [...TOOLS, '/cards', ...chapters.filter((ch) => quizzes[String(ch.chapter)]).map((ch) => `/quizzes/${ch.chapter}`)]

for (const route of Object.values(BESPOKE)) {
  if (!TOOLS.includes(route)) fail(route, 'a bespoke drill route that this check does not list')
}

// Practice tools.
const twinOf = Object.fromEntries(Object.entries(BESPOKE).map(([id, route]) => [route, id]))
let twins = 0
for (const route of TOOLS) {
  const page = served(route)
  pages.set(route, page)
  let ok = baseChecks(route, page)
  const id = twinOf[route]
  const twin = id ? served(`/drill/${id}`) : null
  if (twin) {
    twins += 1
    const shape = (p) => JSON.stringify([p.h1, ...p.paragraphs.map((x) => x.prose).filter(Boolean)])
    if (!page || shape(page) !== shape(twin)) {
      fail(route, `its heading and paragraphs differ from /drill/${id}`)
      ok = false
    }
    for (const p of page ? page.paragraphs : []) {
      for (const l of p.links) {
        if (l.href === route) {
          fail(route, 'the block links to its own address')
          ok = false
        }
      }
    }
  }
  if (ok) passed.add(route)
}

// /cards.
{
  const route = '/cards'
  const page = served(route)
  pages.set(route, page)
  let ok = baseChecks(route, page)
  if (page && page.root) {
    const f = cardsFacts(vocabulary)
    const body = page.paragraphs.map((p) => p.prose).join(' ')
    const numbers = new Set(body.match(/\d+/g) || [])
    const need = [
      ['deck size', f.total],
      ['Essential count', f.essential],
      ['Useful count', f.useful],
      ...f.categories.map((c) => [`${c.label} count`, c.count]),
    ]
    for (const [what, n] of need) {
      if (!numbers.has(String(n))) {
        fail(route, `${what} ${n} (from book-vocabulary.json) is not in the text`)
        ok = false
      }
    }
    for (const c of f.categories) {
      if (!norm(body).includes(norm(c.label))) {
        fail(route, `category "${c.label}" is not named`)
        ok = false
      }
    }
  }
  if (ok) passed.add(route)
}

// Quiz pages.
let sharedWords = 0
const sharedQuizzes = new Set()
for (const ch of chapters) {
  const num = ch.chapter
  const quiz = quizzes[String(num)]
  if (!quiz) continue
  const route = `/quizzes/${num}`
  const page = served(route)
  pages.set(route, page)
  let ok = baseChecks(route, page)
  if (page && page.root) {
    const all = norm([page.h1, ...page.paragraphs.map((p) => p.text)].join(' '))
    const body = norm(page.paragraphs.map((p) => p.prose).join(' '))
    const read = norm([page.h1, ...page.paragraphs.map((p) => p.prose)].join(' '))
    if (!new RegExp(`\\blesson ${num}\\b`).test(body)) {
      fail(route, `"lesson ${num}" is not in the paragraph`)
      ok = false
    }
    if (!body.includes(norm(ch.title))) {
      fail(route, `the lesson title "${ch.title}" is not in the paragraph`)
      ok = false
    }
    // What the block may legitimately carry from chapters.json, taken out
    // before the option test, longest first so a topic is removed whole.
    const allowed = [ch.title, ...(ch.topics || [])].map((t) => norm(okinafy(t))).sort((a, b) => b.length - a.length)
    let rest = read
    for (const a of allowed) rest = rest.split(a).join(' | ')
    for (const q of quiz.questions) {
      if (all.includes(norm(q.prompt))) {
        fail(route, `question ${q.id}'s prompt is in the served text`)
        ok = false
      }
      for (const o of q.options) {
        if (o.explanation && all.includes(norm(o.explanation))) {
          fail(route, `question ${q.id} option ${o.label}'s explanation is in the served text`)
          ok = false
        }
        const t = norm(o.text)
        if (t.length < 4) continue
        if (hasWhole(rest, t)) {
          fail(route, `question ${q.id} option ${o.label}'s text "${o.text}" is in the served text`)
          ok = false
        } else if (hasWhole(read, t)) {
          sharedWords += 1
          sharedQuizzes.add(num)
        }
      }
    }
  }
  if (ok) passed.add(route)
}

/* The sitemap
   ================================================================== */

const sitemapFile = path.join(DIST, 'sitemap.xml')
const locs = existsSync(sitemapFile)
  ? [...readFileSync(sitemapFile, 'utf-8').matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
  : []
if (!locs.length) failures.push('FAIL sitemap: dist/sitemap.xml is missing or empty')
for (const route of routes) {
  const n = locs.filter((l) => l === `${SITE_URL}${route}`).length
  if (n !== 1) failures.push(`FAIL sitemap: ${route} is listed ${n} times, expected once`)
}

function sitemapBefore() {
  const given = args['sitemap-before'] ?? process.env.SERVED_SITEMAP_BEFORE
  const fallback = path.resolve(ROOT, '..', 'sitemap-count-before.txt')
  const source = given !== undefined && given !== true ? String(given) : existsSync(fallback) ? fallback : null
  if (source === null) return null
  const raw = /^\d+$/.test(source) ? source : existsSync(source) ? readFileSync(source, 'utf-8') : ''
  const n = Number.parseInt(raw.trim().split(/\s/)[0], 10)
  if (!Number.isInteger(n)) {
    failures.push(`FAIL sitemap: no earlier count could be read from ${source}`)
    return null
  }
  return n
}
const before = sitemapBefore()
if (before !== null && before !== locs.length) {
  failures.push(`FAIL sitemap: ${before} addresses before, ${locs.length} now`)
}

/* The review list (what the owner reads at the look)
   ================================================================== */

if (typeof args.list === 'string') {
  const out = [
    '# Served paragraphs: the practice tools, /cards and the quiz pages',
    '',
    'This is the text a search engine reads on each of these 65 addresses before any JavaScript runs. A visitor with JavaScript on never sees it, because the page replaces it as it loads. The list is written by script from the built site, so it shows exactly what is served.',
    '',
    `Ten practice tools carry the same text as their /drill twin, which was already live. The new writing is on /sentence-builder, /terminal-build and /cards, and in the one paragraph every quiz page shares (quiz 1 shows it; only the lesson, its title and its topics change after that).`,
    '',
  ]
  const section = (title, list) => {
    out.push(`## ${title}`, '')
    for (const route of list) {
      const page = pages.get(route)
      out.push(`### ${route}`, '')
      if (!page || !page.root) {
        out.push('Nothing served.', '')
        continue
      }
      if (twinOf[route] && served(`/drill/${twinOf[route]}`)) out.push(`Same text as /drill/${twinOf[route]}.`, '')
      out.push(`Heading: ${page.h1}`, '')
      for (const p of page.paragraphs) if (p.prose) out.push(p.prose, '')
      const linkLine = page.paragraphs
        .filter((p) => !p.prose)
        .flatMap((p) => p.links.map((l) => `${l.label} (${l.href})`))
      if (linkLine.length) out.push(`Links: ${linkLine.join(' · ')}`, '')
    }
  }
  section('Practice tools', TOOLS)
  section('Cards', ['/cards'])
  section('Quizzes', routes.filter((r) => r.startsWith('/quizzes/')))
  writeFileSync(args.list, out.join('\n'))
  console.log(`wrote ${args.list}`)
}

/* Report
   ================================================================== */

for (const line of failures) console.log(line)
if (sharedWords) {
  console.log(
    `note: ${sharedWords} quiz option texts in ${sharedQuizzes.size} quizzes are also words in the lesson's own ` +
      `title or topics (lessons ${[...sharedQuizzes].join(', ')}); they come from chapters.json, not from the quiz`
  )
}
console.log(`twins compared: ${twins} of ${Object.keys(BESPOKE).length} bespoke routes have a /drill/<id> page`)
const sitemapPart = before === null ? `sitemap ${locs.length} (no earlier count given)` : `sitemap ${before} -> ${locs.length}`
console.log(`${routes.length} pages, ${passed.size} pass, ${sitemapPart}`)
process.exit(failures.length ? 1 : 0)
