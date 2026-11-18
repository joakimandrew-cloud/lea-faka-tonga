#!/usr/bin/env node
// check-dictionary-pages.mjs: the check behind plan 2026-11-18-dictionary-
// search-and-word-pages, Step 3. Run after `npm run build`; it reads dist/ and
// the dictionary index and exits 1 on any failure (and on any count of zero).
//
//   npm run check:dictionary
//
// What it asserts, with each count printed:
//   - one built page per index word page and per English page, in both file
//     forms (<slug>.html and <slug>/index.html), and no extra files
//   - every row of src/data/book-vocabulary.json,
//     src/premium/data/word-lists.json,
//     src/premium/data/dictionary-course-words.json (words the lessons use that
//     the course word list leaves out) and
//     src/premium/data/dictionary-additions.json (the added words, DECISIONS.md
//     2026-11-18) lands on exactly one word page, and that page's static body
//     shows the row's entry. No count of rows is pinned to a number: each
//     follows its data file and must not be zero.
//   - a course word's page carries its meaning, the line "Used in" and a link to
//     /lessons/<its lesson>; its id has sources in the evidence file; its lesson's
//     file in book/ holds the word (an acute set aside); and no row of the file
//     repeats a row of the other three files with the same spelling and meaning
//   - an added word's page carries its label, links to no lesson and shows no
//     sentence; every English search word of dictionary-english-keys.json has
//     its English page, and that page lists each row the word is tied to
//   - every <title> in dist/ is unique once the two file forms of a route
//     are counted as one
//   - on every dictionary page: canonical = its own address; exactly one <h1>
//     in the static body; every JSON-LD block parses; a word page has as many
//     DefinedTerm nodes as entries; title and description = dictionaryPageMeta
//     (page); no "Page not found" and no U+2014 dash
//   - every dictionary address (and /dictionary) is in sitemap.xml, once
//   - every lang="to" string in the static bodies is found, through okinafy,
//     in book-vocabulary.json, word-lists.json, dictionary-additions.json or
//     the app's book/Chapter-*.md
//     (a plain typing is allowed when it is the plain form of such a string)
//   - /dictionary's static body links to every word page
//   - nothing about sources is in what a browser loads: no string of
//     scripts/dictionary-evidence.json that names a source or a place in one
//     (its note, each citation, each support's source and location) is in any
//     text file under dist/, and the app's two data files hold only the
//     fields a page shows

import fs from 'node:fs'
import path from 'node:path'
import { SITE_URL, dictionaryPageMeta } from '../src/seo/meta.js'
import { okinafy } from '../src/lib/okinafy.js'
import { DICTIONARY_GROUPS, foldSearchKey } from '../src/premium/lib/course-dictionary.js'
import { ADDED_WORD_LABEL, englishKeyList } from '../src/premium/lib/dictionary-additions.js'
import { COURSE_WORD_FOUND_IN, COURSE_WORD_LABEL, courseWordFoundInNote } from '../src/premium/lib/dictionary-course-words.js'
import { englishSlug } from '../src/premium/lib/dictionary-text.js'
import { ADDITIONS_FILE, APP_ROOT, COURSE_WORDS_FILE, ENGLISH_KEYS_FILE, chapterFile, evidenceStrings, lessonHoldsWord, loadDictionaryIndex, readDictionaryEvidence, readDictionarySources } from './lib/dictionary-data.mjs'

const DIST = path.join(APP_ROOT, 'dist')
const ROOT_OPEN = '<!-- prerender:root -->'
const ROOT_CLOSE = '<!-- /prerender:root -->'
const EM_DASH = String.fromCharCode(0x2014)

let failures = 0
const fail = (name, detail) => {
  failures += 1
  console.log(`FAIL  ${name}${detail ? `: ${detail}` : ''}`)
}
const pass = (name, detail) => console.log(`ok    ${name}${detail ? `: ${detail}` : ''}`)
const sample = (list) => list.slice(0, 5).join(' | ') + (list.length > 5 ? ` (and ${list.length - 5} more)` : '')

// A count that must equal what the index says and must not be zero.
function counted(name, got, want) {
  if (got === 0) return fail(name, 'count is zero')
  if (want !== undefined && got !== want) return fail(name, `${got} found, ${want} expected`)
  pass(name, String(got))
}
// A list of problems: empty is a pass, and `seen` (how many things were looked at) must not be zero.
function none(name, seen, problems) {
  if (seen === 0) return fail(name, 'nothing was checked (count is zero)')
  if (problems.length) return fail(name, `${problems.length} of ${seen}: ${sample(problems)}`)
  pass(name, `${seen} checked`)
}

const decode = (s) =>
  s.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&amp;', '&')
const stripTags = (s) => s.replace(/<[^>]*>/g, '')
const read = (file) => fs.readFileSync(file, 'utf8')
const escHtml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const escRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const index = loadDictionaryIndex()
const { vocabulary, wordLists, courseWords, additions, englishKeys } = readDictionarySources()
const evidence = readDictionaryEvidence()

if (!fs.existsSync(DIST)) {
  console.log('FAIL  dist/ does not exist: run npm run build first')
  process.exit(1)
}

// ---- every html file in dist/, one record per route ------------------------
const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.html')) files.push(full)
  }
}
walk(DIST)
const routeOf = (file) => {
  const rel = path.relative(DIST, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  return `/${rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`
}
const byRoute = new Map()
for (const file of files) {
  const route = routeOf(file)
  if (!byRoute.has(route)) byRoute.set(route, [])
  byRoute.get(route).push(file)
}

const titleOf = (html) => decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '')
const descriptionOf = (html) => decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '')
const canonicalOf = (html) => decode(html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? '')
const bodyOf = (html) => {
  const from = html.indexOf(ROOT_OPEN)
  const to = html.indexOf(ROOT_CLOSE)
  return from === -1 || to === -1 ? '' : html.slice(from + ROOT_OPEN.length, to)
}

// ---- 1. the files ------------------------------------------------------------
const dictDir = path.join(DIST, 'dictionary')
const englishDir = path.join(dictDir, 'english')
const listHtml = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.html') && n !== 'index.html') : []
const listIndexDirs = (dir, skip = []) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && !skip.includes(e.name) && fs.existsSync(path.join(dir, e.name, 'index.html'))).map((e) => e.name)
  : []

const wordFlat = listHtml(dictDir)
const wordDirs = listIndexDirs(dictDir, ['english'])
const englishFlat = listHtml(englishDir)
const englishDirs = listIndexDirs(englishDir)
counted('word pages, <slug>.html files', wordFlat.length, index.pages.length)
counted('word pages, <slug>/index.html files', wordDirs.length, index.pages.length)
counted('English pages, <slug>.html files', englishFlat.length, index.english.length)
counted('English pages, <slug>/index.html files', englishDirs.length, index.english.length)
none('every index word page has both files', index.pages.length, index.pages.filter((p) => !fs.existsSync(path.join(DIST, `${p.path}.html`)) || !fs.existsSync(path.join(DIST, p.path, 'index.html'))).map((p) => p.path))
none('every index English page has both files', index.english.length, index.english.filter((p) => !fs.existsSync(path.join(DIST, `${p.path}.html`)) || !fs.existsSync(path.join(DIST, p.path, 'index.html'))).map((p) => p.path))
none('the two files of each dictionary route are identical', index.pages.length + index.english.length, [...index.pages, ...index.english].filter((p) => read(path.join(DIST, `${p.path}.html`)) !== read(path.join(DIST, p.path, 'index.html'))).map((p) => p.path))
none('no word or English file without an index page', wordFlat.length + englishFlat.length, [
  ...wordFlat.filter((n) => !index.pageBySlug.has(n.slice(0, -5))),
  ...englishFlat.filter((n) => !index.englishBySlug.has(n.slice(0, -5))),
])

// ---- 2. the data rows --------------------------------------------------------
const courseIds = vocabulary.map((row) => row.id)
const listIds = wordLists.entries.map((row) => row.id)
counted('data rows in book-vocabulary.json', courseIds.length)
counted('data rows in word-lists.json', listIds.length)
// The course words: the words the lessons use that the course word list leaves out.
const courseWordIds = courseWords.entries.map((row) => row.id)
counted('data rows in dictionary-course-words.json', courseWordIds.length)
// The added words (DECISIONS.md 2026-11-18).
const addedIds = additions.entries.map((row) => row.id)
counted('data rows in dictionary-additions.json', addedIds.length)
const allIds = [...courseIds, ...listIds, ...courseWordIds, ...addedIds]
counted('data rows in all', allIds.length, courseIds.length + listIds.length + courseWordIds.length + addedIds.length)
none('no id is used twice across the four data files', allIds.length, allIds.filter((id, at) => allIds.indexOf(id) !== at))
const pagesOfRow = new Map()
for (const page of index.pages) for (const id of page.rowIds) pagesOfRow.set(id, [...(pagesOfRow.get(id) || []), page])
none('every data row is on exactly one word page', allIds.length, allIds.filter((id) => (pagesOfRow.get(id) || []).length !== 1))
none('no page holds a row the data does not have', index.pages.length, index.pages.flatMap((p) => p.rowIds).filter((id) => !allIds.includes(id)))
// The built page shows the row: its own entry, or the course entry it folds into.
const rowShown = []
for (const id of allIds) {
  const page = (pagesOfRow.get(id) || [])[0]
  if (!page) continue
  const entry = page.entries.find((e) => e.id === id || e.alsoInWordLists.some((l) => l.id === id))
  if (!entry) { rowShown.push(`${id}: no entry on ${page.path}`); continue }
  const body = bodyOf(read(path.join(DIST, `${page.path}.html`)))
  if (!body.includes(`>${escHtml(entry.display)}</`)) rowShown.push(`${id}: ${entry.display} not in ${page.path}`)
}
none('the static body of each row\'s page shows the row\'s word', allIds.length, rowShown)

// ---- 2b. added words and English search words --------------------------------
const addedProblems = []
for (const row of additions.entries) {
  const page = (pagesOfRow.get(row.id) || [])[0]
  const entry = page?.entries.find((e) => e.id === row.id)
  if (!entry) { addedProblems.push(`${row.id}: no entry`); continue }
  if (entry.kind !== 'added' || entry.lesson || entry.examples.length || entry.wordList) addedProblems.push(`${row.id}: not a plain added entry`)
  if (entry.tongan !== row.tongan || entry.english !== row.english || entry.partOfSpeech !== row.part_of_speech) addedProblems.push(`${row.id}: the entry is not the data's own`)
  const cited = (evidence.additions || []).filter((item) => item.id === row.id)
  if (cited.length !== 1 || !Array.isArray(cited[0].sources) || cited[0].sources.length < 2) addedProblems.push(`${row.id}: the evidence file does not cite two sources for it`)
  const body = bodyOf(read(path.join(DIST, `${page.path}.html`)))
  if (!body.includes(`>${escHtml(ADDED_WORD_LABEL)}</dd>`)) addedProblems.push(`${row.id}: ${page.path} does not carry the label`)
  if (!body.includes(escHtml(row.english))) addedProblems.push(`${row.id}: ${page.path} does not show the meaning`)
  if (page.entries.every((e) => e.kind === 'added') && body.includes('href="/lessons/')) addedProblems.push(`${row.id}: ${page.path} links to a lesson`)
}
none('each added word\'s page carries its label, its meaning, no lesson link and no sentence', additions.entries.length, addedProblems)
const keyList = englishKeyList(englishKeys)
const keyProblems = []
for (const { english, rowId } of keyList) {
  const page = index.englishBySlug.get(englishSlug(english))
  const entry = page?.entries.find((e) => e.id === rowId)
  if (!page || !entry) { keyProblems.push(`${english}: no English page lists ${rowId}`); continue }
  const body = bodyOf(read(path.join(DIST, `${page.path}.html`)))
  if (!body.includes(`href="${entry.path}"`)) keyProblems.push(`${english}: ${page.path} does not link to ${entry.path}`)
  if (!body.includes(escHtml(entry.english))) keyProblems.push(`${english}: ${page.path} does not show the meaning of ${rowId} as the data has it`)
  const wordBody = bodyOf(read(path.join(DIST, `${entry.path}.html`)))
  if (!wordBody.includes(`href="${page.path}"`)) keyProblems.push(`${english}: ${entry.path} does not link back to ${page.path}`)
}
counted('English search words tied to rows (word and row pairs)', keyList.length)
none('each English search word has its page, listing the row with its meaning as the data has it', keyList.length, keyProblems)

// ---- 2c. course words --------------------------------------------------------
// Words the lessons use that the course word list leaves out: a page like a
// course word's, with "Used in" where a course row says "Taught in". A row with
// found_in ("workbook" or "quiz") is a word no lesson page prints: its page says so
// after the lesson link, its description says so, and it has no sentence and no
// same-lesson group.
const courseWordProblems = []
const foundInRows = courseWords.entries.filter((row) => row.found_in)
const courseWordPage = (row) => (pagesOfRow.get(row.id) || [])[0]
for (const row of courseWords.entries) {
  const page = courseWordPage(row)
  const entry = page?.entries.find((e) => e.id === row.id)
  if (!entry) { courseWordProblems.push(`${row.id} (${row.tongan}): no entry`); continue }
  if (entry.kind !== 'course-word' || entry.lesson?.number !== row.lesson || entry.supplemental || entry.wordList || entry.added) courseWordProblems.push(`${row.id}: not a course-word entry of lesson ${row.lesson}`)
  if (entry.tongan !== row.tongan || entry.english !== row.english || entry.partOfSpeech !== row.part_of_speech) courseWordProblems.push(`${row.id}: the entry is not the data's own`)
  if ((entry.foundIn || null) !== (row.found_in || null)) courseWordProblems.push(`${row.id}: the entry's found_in is ${entry.foundIn}, the data's is ${row.found_in}`)
  const body = bodyOf(read(path.join(DIST, `${page.path}.html`)))
  if (!body.includes(escHtml(row.english))) courseWordProblems.push(`${row.id}: ${page.path} does not show the meaning`)
  if (!new RegExp(`${escRegExp(COURSE_WORD_LABEL)}</dt><dd[^>]*><a href="/lessons/${row.lesson}"`).test(body)) courseWordProblems.push(`${row.id}: ${page.path} has no "${COURSE_WORD_LABEL}" line linking to /lessons/${row.lesson}`)
  if (row.found_in) {
    // The words after the lesson link, and no sentences, and (for a page of this word alone) no same-lesson group.
    if (!new RegExp(`${escRegExp(COURSE_WORD_LABEL)}</dt><dd[^>]*><a href="/lessons/${row.lesson}"[^>]*>[^<]*</a>${escRegExp(escHtml(courseWordFoundInNote(row.found_in)))}</dd>`).test(body)) courseWordProblems.push(`${row.id}: ${page.path} does not say "${courseWordFoundInNote(row.found_in).trim()}" after the lesson link`)
    if (entry.examples.length) courseWordProblems.push(`${row.id}: a ${row.found_in} word has printed sentences`)
    const own = page.entries.length === 1
    if (own && page.sameLesson.length) courseWordProblems.push(`${row.id}: its page has a same-lesson group`)
    if (own && body.includes('Taught in the same lesson')) courseWordProblems.push(`${row.id}: ${page.path} shows a same-lesson group`)
    const meta = dictionaryPageMeta(page)
    if (own && !meta.description.includes(`Used in the ${row.found_in} for Lesson ${row.lesson}`)) courseWordProblems.push(`${row.id}: the description does not say "Used in the ${row.found_in} for Lesson ${row.lesson}"`)
    for (const other of index.pages) {
      if (other === page) continue
      for (const group of other.sameLesson) if (group.words.some((w) => w.path === page.path) && page.entries.length === 1) courseWordProblems.push(`${row.id}: listed in the same-lesson group of ${other.path}`)
    }
  } else if (!new RegExp(`${escRegExp(COURSE_WORD_LABEL)}</dt><dd[^>]*><a href="/lessons/${row.lesson}"[^>]*>[^<]*</a>(?! \\()`).test(body)) {
    courseWordProblems.push(`${row.id}: a lesson word's "${COURSE_WORD_LABEL}" line carries words after the lesson link`)
  }
}
none('each course word\'s page carries its meaning, "Used in" and a link to /lessons/<its lesson>', courseWords.entries.length, courseWordProblems)
const sourceProblems = []
for (const row of courseWords.entries) {
  const cited = (evidence.courseWords || []).filter((item) => item.id === row.id)
  if (cited.length !== 1 || !Array.isArray(cited[0].sources) || !cited[0].sources.length || cited[0].sources.some((cite) => typeof cite !== 'string' || !cite.trim())) sourceProblems.push(`${row.id} (${row.tongan}): the evidence file does not give it sources`)
}
for (const item of evidence.courseWords || []) if (!courseWordIds.includes(item.id)) sourceProblems.push(`${item.id}: in the evidence file and not in the course words`)
none('every course word has sources in the evidence file, and only course words do', courseWords.entries.length, sourceProblems)
const lessonFiles = new Map()
const lessonText = (n) => {
  if (!lessonFiles.has(n)) lessonFiles.set(n, fs.existsSync(path.join(APP_ROOT, chapterFile(n))) ? read(path.join(APP_ROOT, chapterFile(n))) : '')
  return lessonFiles.get(n)
}
none('every course word without found_in stands in the file of the lesson its page links to (an acute set aside)', courseWords.entries.length - foundInRows.length,
  courseWords.entries.filter((row) => !row.found_in).filter((row) => !Number.isInteger(row.lesson) || row.lesson < 1 || row.lesson > 52 || !lessonHoldsWord(lessonText(row.lesson), row.tongan)).map((row) => `${row.id} ${row.tongan} not in lesson ${row.lesson}`))
none('no course word with found_in stands in the file of its lesson (a lesson that prints it makes it a lesson word)', foundInRows.length,
  foundInRows.filter((row) => COURSE_WORD_FOUND_IN.includes(row.found_in) && Number.isInteger(row.lesson) && lessonHoldsWord(lessonText(row.lesson), row.tongan)).map((row) => `${row.id} ${row.tongan} stands in lesson ${row.lesson}`))
none('found_in is "workbook" or "quiz" when it is there at all', courseWords.entries.length, courseWords.entries.filter((row) => 'found_in' in row && !COURSE_WORD_FOUND_IN.includes(row.found_in)).map((row) => `${row.id}: found_in is ${JSON.stringify(row.found_in)}`))
const spellKey = (text) => `${String(text).replace(/['‘’ʼ`ʻ]/g, "'").toLowerCase().trim()}`
const senseKey = (text) => String(text).toLowerCase().replace(/\s+/g, ' ').trim()
const others = [...vocabulary, ...wordLists.entries, ...additions.entries].map((row) => `${spellKey(row.tongan)} | ${senseKey(row.english)}`)
const seenCourseWords = new Set()
const repeats = []
for (const row of courseWords.entries) {
  const key = `${spellKey(row.tongan)} | ${senseKey(row.english)}`
  if (others.includes(key)) repeats.push(`${row.id} ${row.tongan}: already a row of another data file`)
  if (seenCourseWords.has(key)) repeats.push(`${row.id} ${row.tongan}: repeats an earlier course word`)
  seenCourseWords.add(key)
}
none('no course word repeats a row of the other three files (or of its own) with the same spelling and meaning', courseWords.entries.length, repeats)

// ---- 3. titles unique across dist/ -------------------------------------------
const titles = new Map()
const splitTitles = []
for (const [route, group] of byRoute) {
  const own = [...new Set(group.map((f) => titleOf(read(f))))]
  if (own.length > 1) splitTitles.push(route)
  const title = own[0]
  if (!titles.has(title)) titles.set(title, [])
  titles.get(title).push(route)
}
counted('routes in dist/ (two file forms of a route counted once)', byRoute.size)
none('the two files of every route carry the same title', byRoute.size, splitTitles)
const duplicates = [...titles].filter(([, routes]) => routes.length > 1).map(([title, routes]) => `"${title}" on ${routes.join(', ')}`)
none('every <title> in dist/ is unique', titles.size, duplicates)

// ---- 4. per page: canonical, h1, JSON-LD, meta, forbidden text ----------------
const dictionaryPages = [...index.pages, ...index.english]
const problems = { canonical: [], h1: [], jsonld: [], terms: [], title: [], description: [], notFound: [], dash: [], noRoot: [], noindex: [] }
let jsonBlocks = 0
for (const page of dictionaryPages) {
  const html = read(path.join(DIST, `${page.path}.html`))
  const body = bodyOf(html)
  if (!body) problems.noRoot.push(page.path)
  if (canonicalOf(html) !== `${SITE_URL}${page.path}`) problems.canonical.push(page.path)
  if ((body.match(/<h1\b/g) || []).length !== 1) problems.h1.push(page.path)
  if (/<meta name="robots"[^>]*noindex/.test(html)) problems.noindex.push(page.path)
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])
  if (!blocks.length) problems.jsonld.push(`${page.path} has none`)
  let terms = 0
  for (const block of blocks) {
    jsonBlocks += 1
    try {
      const parsed = JSON.parse(block)
      terms += (parsed['@graph'] || []).filter((n) => n['@type'] === 'DefinedTerm').length
    } catch {
      problems.jsonld.push(`${page.path} does not parse`)
    }
  }
  if (page.kind === 'word' && terms !== page.entries.length) problems.terms.push(`${page.path}: ${terms} terms, ${page.entries.length} entries`)
  const meta = dictionaryPageMeta(page)
  if (titleOf(html) !== meta.title) problems.title.push(page.path)
  if (descriptionOf(html) !== meta.description) problems.description.push(page.path)
  if (html.includes('Page not found')) problems.notFound.push(page.path)
  if (html.includes(EM_DASH)) problems.dash.push(page.path)
}
const total = dictionaryPages.length
none('every dictionary page has a static body', total, problems.noRoot)
none('every dictionary canonical equals the page\'s own address', total, problems.canonical)
none('every dictionary page has exactly one <h1> in its static body', total, problems.h1)
none('no dictionary page is noindex', total, problems.noindex)
none('every JSON-LD block on a dictionary page parses (and each page has one)', total, problems.jsonld)
counted('JSON-LD blocks read', jsonBlocks)
none('each word page has as many DefinedTerm nodes as entries', index.pages.length, problems.terms)
none('each page title equals dictionaryPageMeta(page).title', total, problems.title)
none('each page description equals dictionaryPageMeta(page).description', total, problems.description)
none('no dictionary page says "Page not found"', total, problems.notFound)
none('no dictionary page holds a U+2014 dash', total, problems.dash)

// ---- 5. the sitemap ----------------------------------------------------------
const sitemap = fs.existsSync(path.join(DIST, 'sitemap.xml')) ? read(path.join(DIST, 'sitemap.xml')) : ''
const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
counted('URLs in sitemap.xml', locs.length)
const seenLocs = new Set()
const repeated = []
for (const loc of locs) { if (seenLocs.has(loc)) repeated.push(loc); seenLocs.add(loc) }
none('sitemap.xml has no duplicate', locs.length, repeated)
none('every dictionary address is in sitemap.xml', total + 1, [`/dictionary`, ...dictionaryPages.map((p) => p.path)].filter((p) => !seenLocs.has(`${SITE_URL}${p}`)))

// ---- 6. every lang="to" string is the data's own -----------------------------
const known = new Set()
const addKnown = (text) => { if (text) known.add(okinafy(text)) }
for (const row of vocabulary) addKnown(row.tongan)
for (const row of wordLists.entries) addKnown(row.tongan)
for (const row of additions.entries) addKnown(row.tongan)
for (const row of courseWords.entries) addKnown(row.tongan)
const plain = (text) => foldSearchKey(text).replaceAll("'", '')
const knownPlain = new Set([...known].map(plain))
for (const g of DICTIONARY_GROUPS) { known.add(g); known.add(g === 'ng' ? 'Ng' : g.toUpperCase()); known.add(okinafy(g)); known.add(okinafy(g === 'ng' ? 'Ng' : g.toUpperCase())) }
let book = ''
for (let n = 1; n <= 52; n += 1) book += `${okinafy(read(path.join(APP_ROOT, chapterFile(n))))}\n`
const traced = new Map()
const isTraceable = (text) => {
  if (traced.has(text)) return traced.get(text)
  const parts = text.split(', ')
  const ok = known.has(text) || book.includes(text) || knownPlain.has(text) || knownPlain.has(plain(text))
    || (parts.length > 1 && parts.every((part) => known.has(part) || book.includes(part) || knownPlain.has(plain(part))))
  traced.set(text, ok)
  return ok
}
const untraced = []
let toStrings = 0
for (const page of [{ path: '/dictionary' }, ...dictionaryPages]) {
  const html = read(path.join(DIST, `${page.path}.html`))
  for (const m of bodyOf(html).matchAll(/<(span|a|h2)\b[^>]*\blang="to"[^>]*>([\s\S]*?)<\/\1>/g)) {
    toStrings += 1
    const text = decode(stripTags(m[2])).trim()
    if (!isTraceable(text)) untraced.push(`${page.path}: ${text}`)
  }
}
counted('lang="to" strings in the static bodies', toStrings)
none('every lang="to" string is found in the data or the book copy', toStrings, untraced)

// ---- 7. /dictionary links to every word page --------------------------------
const hubBody = bodyOf(read(path.join(DIST, 'dictionary.html')))
const hubLinks = new Set([...hubBody.matchAll(/href="([^"]+)"/g)].map((m) => m[1]))
none('/dictionary\'s static body links to every word page', index.pages.length, index.pages.filter((p) => !hubLinks.has(p.path)).map((p) => p.path))
none('/dictionary\'s static body has exactly one <h1>', 1, (hubBody.match(/<h1\b/g) || []).length === 1 ? [] : ['not one'])
none('/dictionary links to /word-lists', 1, hubLinks.has('/word-lists') ? [] : ['missing'])

// ---- 8. nothing about sources in what a browser loads -------------------------
// The app's three data files hold only what a page shows or search needs.
const shape = []
const sameKeys = (object, keys) => JSON.stringify(Object.keys(object).sort()) === JSON.stringify([...keys].sort())
const rawAdditions = JSON.parse(read(path.join(APP_ROOT, ADDITIONS_FILE)))
const rawCourseWords = JSON.parse(read(path.join(APP_ROOT, COURSE_WORDS_FILE)))
const rawKeys = JSON.parse(read(path.join(APP_ROOT, ENGLISH_KEYS_FILE)))
if (!sameKeys(rawAdditions, ['entries'])) shape.push(`${ADDITIONS_FILE}: top-level fields ${Object.keys(rawAdditions).join(', ')}`)
for (const row of rawAdditions.entries || []) if (!sameKeys(row, ['id', 'tongan', 'english', 'part_of_speech'])) shape.push(`${ADDITIONS_FILE}: ${row.id} has fields ${Object.keys(row).join(', ')}`)
if (!sameKeys(rawCourseWords, ['note', 'entries'])) shape.push(`${COURSE_WORDS_FILE}: top-level fields ${Object.keys(rawCourseWords).join(', ')}`)
for (const row of rawCourseWords.entries || []) if (!sameKeys(row, ['id', 'tongan', 'english', 'part_of_speech', 'lesson', ...('found_in' in row ? ['found_in'] : [])])) shape.push(`${COURSE_WORDS_FILE}: ${row.id} has fields ${Object.keys(row).join(', ')}`)
if (!sameKeys(rawKeys, ['keys'])) shape.push(`${ENGLISH_KEYS_FILE}: top-level fields ${Object.keys(rawKeys).join(', ')}`)
for (const key of rawKeys.keys || []) {
  if (!sameKeys(key, ['english', 'rows']) || !Array.isArray(key.rows) || key.rows.some((id) => typeof id !== 'string')) shape.push(`${ENGLISH_KEYS_FILE}: "${key.english}" holds more than the word and its row ids`)
}
none('the app\'s three data files hold only the fields a page shows', (rawAdditions.entries || []).length + (rawCourseWords.entries || []).length + (rawKeys.keys || []).length + 3, shape)
// Every tie of the app's file has its support in the evidence file, and no other is recorded.
const tiesInApp = keyList.map((key) => `${key.english} ${key.rowId}`).sort()
const tiesInEvidence = (evidence.englishKeys || []).map((item) => `${item.english} ${item.row}`).sort()
none('every English search word has its support in the evidence file, and only those', tiesInApp.length, JSON.stringify(tiesInApp) === JSON.stringify(tiesInEvidence) ? [] : [`app: ${tiesInApp.join(' | ')}; evidence: ${tiesInEvidence.join(' | ')}`])
// The strings to look for, and every text file of the built site.
const needles = evidenceStrings(evidence)
counted('evidence strings to look for in dist/ (the note, citations, support sources and places)', needles.length)
none('each evidence string is long enough to be told from ordinary text', needles.length, needles.filter((text) => text.length < 20))
const TEXT_FILE = /\.(?:html|js|mjs|css|json|xml|txt|svg|map|tsv|csv|md|webmanifest)$/
const textFiles = []
const walkText = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkText(full)
    else if (TEXT_FILE.test(entry.name)) textFiles.push(full)
  }
}
walkText(DIST)
// A string may be in a file as it is, as HTML, or as a JSON or JavaScript string.
const forms = (text) => [...new Set([text, escHtml(text), JSON.stringify(text).slice(1, -1), text.replaceAll("'", "\\'")])]
const needleForms = needles.map((text) => ({ text, forms: forms(text) }))
const leaks = []
for (const file of textFiles) {
  const body = read(file)
  for (const needle of needleForms) {
    if (needle.forms.some((form) => body.includes(form))) leaks.push(`${path.relative(DIST, file)} holds "${needle.text.slice(0, 60)}${needle.text.length > 60 ? '...' : ''}"`)
  }
}
counted('text files read under dist/', textFiles.length)
none('no evidence string (note, citation, support source or place) is in any file under dist/', textFiles.length, leaks)

console.log(failures ? `\n${failures} check(s) failed` : `\nall checks passed (${total} dictionary pages: ${index.pages.length} word, ${index.english.length} English)`)
process.exit(failures ? 1 : 0)
