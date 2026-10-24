import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { parseLessonContent } from '../lib/lesson-content.js'
import { FIGURE_PLAN } from '../lib/figure-plan.js'
import {
  figureAnchor, figureModel, figureVariant, groupSections, learnModel, practiceBlocks, stationsModel,
} from '../lib/lesson-plan.js'
import { LESSON_PATH_KEY, markKnown, markPattern, markRead, markTried, readPath } from '../lib/lesson-path-store.js'

const app = cwd()
const readJson = relative => JSON.parse(fs.readFileSync(path.join(app, relative)))
const chapters = readJson('src/data/chapters.json')
const quickPractice = readJson('src/data/quick-practice.json')
const drillMap = readJson('src/data/drill-map.json')
const bookExercises = readJson('src/data/book-exercises.json')
const quizzes = readJson('src/data/quizzes.json')
// The app's slugify, copied as lesson-fidelity.test.js and lesson-practice.test.js copy it.
const slugify = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2018\u2019\u02bb'`]/g, '').replace(/[/. :,;\u2014\u2013]/g, ' ')
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

const lessons = chapters.map(meta => {
  const n = meta.chapter
  const md = fs.readFileSync(path.join(app, 'book', `Chapter-${String(n).padStart(2, '0')}.md`), 'utf8')
  const parsed = parseLessonContent(md, { chapter: n, quickPractices: quickPractice[String(n)] || [], drillAnchors: drillMap[String(n)] || [], slugify })
  const sections = groupSections(parsed.blocks)
  const exercises = bookExercises[String(n)] || []
  const total = exercises.reduce((sum, set) => sum + set.items.length, 0)
  const base = { n, meta, sections, plan: FIGURE_PLAN }
  const stationsFor = extra => stationsModel({
    ...base, exercises, exStats: { total, answered: 0 }, quizQuestions: quizzes[String(n)]?.questions?.length || 0,
    deckSize: 1, ...extra,
  })
  return { n, meta, sections, learn: learnModel(base), figure: figureModel(base), anchor: figureAnchor(base), stations: stationsFor({}), stationsFor, total }
})

// Strip an acute accent or macron from the last vowel of each word: the data carries definitive accents.
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

test('the figure role map has one entry per lesson and matches each paradigm', () => {
  assert.deepEqual(Object.keys(FIGURE_PLAN).map(Number).sort((a, b) => a - b), chapters.map(meta => meta.chapter))
  let mapped = 0
  for (const { n, meta } of lessons) {
    const entry = FIGURE_PLAN[n]
    if (entry.v !== 'switch' && entry.v !== 'ladder') continue
    assert.ok(meta.teaching.paradigm, `lesson ${n} has a paradigm`)
    assert.equal(entry.roles.length, meta.teaching.paradigm.headers.length, `lesson ${n} role count`)
    mapped += 1
  }
  assert.equal(mapped, 46)
  const counts = { switch: 0, ladder: 0, rules: 0, bespoke: 0 }
  const rules = []
  for (const { n, meta } of lessons) {
    const variant = figureVariant(n, meta, FIGURE_PLAN)
    counts[variant] += 1
    if (variant === 'rules') rules.push(n)
  }
  assert.deepEqual(rules, [3, 14, 31, 34, 38], 'the rules fallback is used on these five only, never by run-time validation')
  assert.deepEqual(counts, { switch: 20, ladder: 26, rules: 5, bespoke: 1 })
})

test('every learn block has at least three items, each verbatim from topics, summary or key rules', () => {
  for (const { n, meta, learn } of lessons) {
    assert.ok(learn.items.length >= 3, `lesson ${n} learn items`)
    const sources = [...(meta.topics || []), meta.teaching.summary, ...meta.teaching.key_rules.map(rule => rule.rule)].filter(Boolean)
    for (const item of learn.items) {
      assert.ok(sources.some(source => source.includes(item.text)), `lesson ${n} learn item "${item.text}"`)
    }
  }
})

test('every Tongan string in the plan, path and figure models is a substring of its chapters.json entry', () => {
  let checked = 0
  for (const lesson of lessons) {
    const entry = stripFinal(allStrings(lesson.meta).join('\n'))
    for (const model of [lesson.learn, lesson.stations, lesson.figure]) {
      for (const text of tonganStrings(model)) {
        assert.ok(entry.includes(stripFinal(text)), `lesson ${lesson.n}: "${text}" is not in chapters.json`)
        checked += 1
      }
    }
  }
  assert.ok(checked > 500, `checked ${checked} Tongan strings`)
})

test('no model holds an empty string', () => {
  for (const lesson of lessons) {
    for (const model of [lesson.learn, lesson.stations, lesson.figure, lesson.anchor]) {
      for (const text of allStrings(model)) assert.notEqual(text.trim(), '', `lesson ${lesson.n} empty string`)
    }
  }
})

test('every figure model has at least two parts or the fallback set, and an anchor unless bespoke', () => {
  for (const { n, figure, anchor } of lessons) {
    assert.ok(figure.parts.length >= 2 || figure.fallback, `lesson ${n} figure parts`)
    if (figure.variant === 'rules') assert.equal(figure.fallback, 'rules')
    if (figure.variant === 'bespoke') assert.equal(anchor, null)
    else assert.ok(anchor?.sectionId, `lesson ${n} anchor`)
  }
})

test('every lesson path has a practice station; lesson 5 has quick practice only', () => {
  for (const { n, stations, sections } of lessons) {
    const practise = stations.steps.find(step => step.key === 'practise')
    assert.ok(practise && practise.rows.length >= 1, `lesson ${n} practice station`)
    assert.equal(practise.rows.length, practiceBlocks(sections).length)
    assert.equal(new Set(practise.rows.map(row => row.key)).size, practise.rows.length, `lesson ${n} practice keys are unique`)
  }
  const five = lessons.find(lesson => lesson.n === 5).stations.steps.find(step => step.key === 'practise')
  assert.ok(five.rows.every(row => row.kind === 'qp'))
  assert.ok(lessons.every(lesson => lesson.stations.steps.length === 7), 'all 52 show seven steps')
})

test('lesson 15: rule links resolve to sections 01, 01, 06 and the figure follows the section 04 table', () => {
  const lesson = lessons.find(item => item.n === 15)
  assert.deepEqual(lesson.learn.items.map(item => item.section?.sectionNumber), [1, 1, 6])
  assert.equal(lesson.anchor.sectionNumber, 4)
  assert.equal(lesson.anchor.blockType, 'table')
  assert.equal(lesson.figure.variant, 'switch')
  assert.deepEqual(lesson.figure.parts.map(part => part.id), ['form-0', 'form-1', 'row-0', 'row-1', 'row-2'])
  const row = lesson.figure.rows[1]
  assert.deepEqual(row.cells[0].to.split(' ').filter((_, i) => row.marks[0][i]).length, 2)
  assert.deepEqual(row.cells[1].to.split(' ').filter((_, i) => row.marks[1][i]).length, 3)
  const missing = [[2, 3], [40, 0], [40, 1]]
  for (const [n, i] of missing) assert.equal(lessons.find(item => item.n === n).learn.items[i].section, undefined, `lesson ${n} rule ${i + 1} has no guessed link`)
})

test('station states read from storage fixtures: empty, partial and all done', () => {
  const lesson = lessons.find(item => item.n === 15)
  const states = model => Object.fromEntries(model.steps.map(step => [step.key, step.state]))
  const empty = lesson.stations
  assert.deepEqual(Object.values(states(empty)), Array(7).fill('todo'))
  assert.equal(empty.steps.filter(step => step.next).length, 1)
  assert.equal(empty.steps.find(step => step.next).key, 'learn')
  assert.equal(empty.steps[0].detail, '9 sections to read')
  assert.equal(empty.steps.find(step => step.key === 'exercises').detail, '6 sets \u00b7 34 items')
  assert.equal(empty.steps.find(step => step.key === 'words').detail, '1 word to keep')

  const store = new Map()
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }
  markRead(15, 3, 'pronouns-vs-names', storage)
  markRead(15, 1, 'noun-subjects-a-new-word-order', storage)
  markTried(15, 'qp:0', storage)
  const partialPath = readPath(15, storage)
  assert.deepEqual(partialPath, { read: 3, at: 'noun-subjects-a-new-word-order', tried: ['qp:0'] })
  const partial = lesson.stationsFor({ path: partialPath, exStats: { total: lesson.total, answered: 12 }, deck: { known: [], position: 1 } })
  assert.deepEqual(states(partial), { learn: 'part', pattern: 'todo', practise: 'part', exercises: 'part', quiz: 'todo', words: 'part', finish: 'todo' })
  assert.equal(partial.steps[0].detail, '4 of 9 read')
  assert.equal(partial.steps.find(step => step.key === 'practise').detail, '1 of 2 tried')
  assert.equal(partial.steps.find(step => step.key === 'practise').href, '#practice-drill-tm-by-context-picker')

  markRead(15, 8, 'the-full-pattern', storage)
  markPattern(15, storage)
  markTried(15, 'drill:tm-by-context-picker', storage)
  markKnown(15, 0, storage)
  markKnown(15, 0, storage)
  const fullPath = readPath(15, storage)
  assert.deepEqual(fullPath.known, [0])
  const all = lesson.stationsFor({
    path: fullPath, exStats: { total: lesson.total, answered: lesson.total }, quizBest: { right: 8, total: 10 },
    deck: { known: ['x'], position: 1, finished: true }, done: true,
  })
  assert.deepEqual(Object.values(states(all)), Array(7).fill('done'))
  assert.equal(all.doneCount, 7)
  assert.equal(all.steps.some(step => step.next), false)
  assert.equal(all.steps.find(step => step.key === 'quiz').detail, 'Best 8 of 10')

  assert.deepEqual(readPath(15, { getItem: () => 'not json' }), {})
  assert.deepEqual(readPath(15, { getItem: () => { throw new Error('blocked') } }), {})
  assert.ok(JSON.parse(store.get(LESSON_PATH_KEY)).version === 1)
})

test('no fakaua or macron vowel is typed as a literal in the new lesson-course files', () => {
  const files = [
    'src/premium/components/lesson/FigureEngine.jsx', 'src/premium/lib/figure-plan.js', 'src/premium/lib/lesson-plan.js',
    'src/premium/components/lesson/LessonPlan.jsx', 'src/premium/components/lesson/LessonPath.jsx',
    'src/premium/components/lesson/PromiseCheck.jsx', 'src/premium/components/lesson/CourseStrip.jsx',
  ]
  for (const file of files) {
    const text = fs.readFileSync(path.join(app, file), 'utf8')
    assert.doesNotMatch(text, TONGAN_GLYPH, `${file} types Tongan`)
  }
})
