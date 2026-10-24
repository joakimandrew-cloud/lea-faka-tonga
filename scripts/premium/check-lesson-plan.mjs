// Builds the lesson-course models for all 52 lessons with the real data and
// checks them (plans/2026-10-24-lesson-course-experience.md, Step 3).
//
//   node scripts/premium/check-lesson-plan.mjs
//
// Prints one row per lesson and exits 1 on any failure. The lessons are parsed
// with parseLessonContent and the app's own slugify from
// src/lib/remark-drill-anchors.js, as book.js does. That module imports JSON
// without an import attribute, which plain node refuses, so a small loader hook
// supplies the attribute; no Vite server is started (a Vite server here
// crashed node on close now and then).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { register } from 'node:module'
import { parseLessonContent } from '../../src/premium/lib/lesson-content.js'
import { FIGURE_PLAN } from '../../src/premium/lib/figure-plan.js'
import {
  figureAnchor, figureModel, groupSections, isWordsSection, learnModel, practiceBlocks, stationsModel,
} from '../../src/premium/lib/lesson-plan.js'

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const readJson = relative => JSON.parse(fs.readFileSync(path.join(app, relative), 'utf8'))
const chapters = readJson('src/data/chapters.json')
const quickPractice = readJson('src/data/quick-practice.json')
const drillMap = readJson('src/data/drill-map.json')
const bookExercises = readJson('src/data/book-exercises.json')
const quizzes = readJson('src/data/quizzes.json')

register('data:text/javascript,' + encodeURIComponent(
  'export async function load(url, context, next) {' +
  ' if (url.endsWith(".json")) return next(url, { ...context, importAttributes: { ...context.importAttributes, type: "json" } });' +
  ' return next(url, context) }',
))
const { slugify } = await import('../../src/lib/remark-drill-anchors.js')

const stripFinal = s => String(s).normalize('NFD').replace(/[\u0301\u0304](?=[^\p{L}\p{M}]|$)/gu, '').normalize('NFC')
const allStrings = value => typeof value === 'string' ? [value]
  : Array.isArray(value) ? value.flatMap(allStrings)
    : value && typeof value === 'object' ? Object.values(value).flatMap(allStrings) : []
const TONGAN_GLYPH = /[\u02bb\u0101\u0113\u012b\u014d\u016b\u0100\u0112\u012a\u014c\u016a]/
function tonganStrings(value, out = []) {
  if (Array.isArray(value)) value.forEach(item => tonganStrings(item, out))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'to' && typeof item === 'string') out.push(item)
      else tonganStrings(item, out)
    }
  } else if (typeof value === 'string' && TONGAN_GLYPH.test(value)) out.push(value)
  return out
}

const failures = []
const fail = (n, message) => failures.push(`lesson ${n}: ${message}`)
const rows = []
const counts = { switch: 0, ladder: 0, rules: 0, bespoke: 0 }

for (const meta of chapters) {
  const n = meta.chapter
  const md = fs.readFileSync(path.join(app, 'book', `Chapter-${String(n).padStart(2, '0')}.md`), 'utf8')
  const parsed = parseLessonContent(md, { chapter: n, quickPractices: quickPractice[String(n)] || [], drillAnchors: drillMap[String(n)] || [], slugify })
  const sections = groupSections(parsed.blocks)
  const exercises = bookExercises[String(n)] || []
  const total = exercises.reduce((sum, set) => sum + set.items.length, 0)
  const deckSize = sections.filter(isWordsSection).flatMap(section => section.blocks.filter(block => block.type === 'table')).reduce((sum, table) => sum + table.body.length, 0)
  const base = { n, meta, sections, plan: FIGURE_PLAN }
  const learn = learnModel(base)
  const stations = stationsModel({ ...base, exercises, exStats: { total, answered: 0 }, quizQuestions: quizzes[String(n)]?.questions?.length || 0, deckSize })
  const figure = figureModel(base)
  const anchor = figureAnchor(base)
  counts[figure.variant] += 1

  // Learn block: at least three items, each verbatim from topics, summary or key rules.
  if (learn.items.length < 3) fail(n, `learn block has ${learn.items.length} items`)
  const sources = [...(meta.topics || []), meta.teaching?.summary, ...(meta.teaching?.key_rules || []).map(rule => rule.rule)].filter(Boolean)
  for (const item of learn.items) if (!sources.some(source => source.includes(item.text))) fail(n, `learn item not verbatim: ${item.text}`)

  // Tongan strings: each a substring of the lesson's chapters.json entry, final-vowel accents aside.
  const entry = stripFinal(allStrings(meta).join('\n'))
  let checked = 0
  for (const model of [learn, stations, figure]) {
    for (const text of tonganStrings(model)) {
      checked += 1
      if (!entry.includes(stripFinal(text))) fail(n, `Tongan string not in chapters.json: ${text}`)
    }
  }

  // No empty string anywhere.
  for (const model of [learn, stations, figure, anchor]) {
    for (const text of allStrings(model)) if (!text.trim()) fail(n, 'empty string in a model')
  }

  // Figure: two parts or the fallback; an anchor unless bespoke.
  if (!(figure.parts.length >= 2 || figure.fallback)) fail(n, `figure has ${figure.parts.length} parts and no fallback`)
  if (figure.variant !== 'bespoke' && !anchor?.sectionId) fail(n, 'figure has no anchor')

  // Path: at least one practice station.
  const practise = stations.steps.find(step => step.key === 'practise')
  if (!practise?.rows?.length) fail(n, 'no practice station')
  else if (practise.rows.length !== practiceBlocks(sections).length) fail(n, 'practice rows differ from practice blocks')

  const qp = practise?.rows?.filter(row => row.kind === 'qp').length || 0
  const drills = practise?.rows?.filter(row => row.kind === 'drill').length || 0
  rows.push({
    lesson: n,
    type: meta.type,
    learn: learn.items.length,
    stations: `${stations.steps.length} (practice ${qp} qp + ${drills} drill)`,
    figure: figure.variant === 'bespoke' ? `BESPOKE ${figure.bespoke} wrappers` : figure.fallback ? 'FALLBACK rules' : `${figure.variant} ${figure.parts.length} parts`,
    anchor: anchor ? `${String(anchor.sectionNumber).padStart(2, '0')} ${anchor.blockType}${anchor.score ? ` (${anchor.score})` : ''}` : 'none',
    tongan: checked,
  })
}

if (counts.switch !== 20 || counts.ladder !== 26 || counts.rules !== 5 || counts.bespoke !== 1) {
  failures.push(`figure counts ${JSON.stringify(counts)}, expected switch 20, ladder 26, rules 5, bespoke 1`)
}

const head = ['lesson', 'type', 'learn', 'stations', 'figure', 'anchor', 'tongan']
const widths = head.map(key => Math.max(key.length, ...rows.map(row => String(row[key]).length)))
const fmt = values => values.map((value, i) => String(value).padEnd(widths[i])).join('  ')
console.log(fmt(head))
for (const row of rows) console.log(fmt(head.map(key => row[key])))
console.log(`\n${rows.length} lessons; figures switch ${counts.switch}, ladder ${counts.ladder}, rules ${counts.rules}, bespoke ${counts.bespoke}; Tongan strings checked ${rows.reduce((sum, row) => sum + row.tongan, 0)}`)
if (failures.length) {
  console.log(`\n${failures.length} FAILURES`)
  for (const message of failures) console.log(`FAIL ${message}`)
  process.exit(1)
}
console.log('PASS')
