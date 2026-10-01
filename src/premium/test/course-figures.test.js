import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { cwd } from 'node:process'
import { pathToFileURL } from 'node:url'
import { COURSE_FIGURES } from '../lib/course-figures.js'
import { filterDrillGroups } from '../lib/catalog-query.js'

// Every figure the membership page shows is recomputed here from the file that holds it.
const root = cwd()
const json = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))
const figure = key => COURSE_FIGURES.find(item => item.key === key)

// The PDF keeps its page tree in compressed object streams. The root /Pages
// node carries the largest /Count, which is the book's page count.
function pdfPageCount(file) {
  const bytes = fs.readFileSync(file)
  const text = bytes.toString('latin1')
  let largest = 0
  const readCounts = source => {
    for (const match of source.matchAll(/<<(?:(?!<<|>>)[\s\S])*?\/Type\s*\/Pages\b(?:(?!<<|>>)[\s\S])*?>>/g)) {
      const count = /\/Count\s+(\d+)/.exec(match[0])
      if (count) largest = Math.max(largest, Number(count[1]))
    }
  }
  readCounts(text)
  for (const match of text.matchAll(/stream\r?\n/g)) {
    const start = match.index + match[0].length
    const end = text.indexOf('endstream', start)
    if (end < 0) continue
    let inflated
    try { inflated = zlib.inflateSync(bytes.subarray(start, end), { finishFlush: zlib.constants.Z_SYNC_FLUSH }) } catch { continue }
    readCounts(inflated.toString('latin1'))
  }
  return largest
}

test('the membership page shows six figures, each with a label and a destination', () => {
  assert.deepEqual(COURSE_FIGURES.map(item => item.key), ['lessons', 'exercises', 'quiz-questions', 'drills', 'words', 'book-pages'])
  for (const item of COURSE_FIGURES) {
    assert.ok(Number.isInteger(item.value) && item.value > 0, `${item.key} is a counted number`)
    assert.ok(item.label && !/\u2014/.test(item.label), `${item.key} has a label without an em dash`)
    assert.ok(item.to || item.book, `${item.key} links somewhere`)
  }
})

test('lessons: every lesson in chapters.json, from Basic to Advanced', () => {
  assert.equal(json('src/data/chapters.json').length, figure('lessons').value)
  const tiers = fs.readFileSync(path.join(root, 'src/lib/lesson-browser.js'), 'utf8')
  assert.match(tiers, /name: 'Basic'/)
  assert.match(tiers, /name: 'Advanced'/)
})

test('exercise items: every item in book-exercises.json, each with its answer', () => {
  const book = json('src/data/book-exercises.json')
  const items = Object.values(book).flatMap(sets => sets.flatMap(set => set.items))
  assert.equal(items.length, figure('exercises').value)
  assert.equal(items.filter(item => String(item.answer ?? '').trim()).length, items.length, 'every item carries an answer')
})

test('quiz questions: every question in quizzes.json, every answer explained', () => {
  const quizzes = Object.values(json('src/data/quizzes.json'))
  const questions = quizzes.flatMap(quiz => quiz.questions)
  assert.equal(questions.length, figure('quiz-questions').value)
  const options = questions.flatMap(question => question.options)
  assert.equal(options.filter(option => String(option.explanation ?? '').trim()).length, options.length, 'every answer option carries an explanation')
})

test('drills: the featured drills on the drills menu', async () => {
  const { GROUPS } = await import(pathToFileURL(path.join(root, 'src/data/drills-catalog.js')))
  const shown = filterDrillGroups(GROUPS).reduce((sum, group) => sum + group.visible.length, 0)
  assert.equal(shown, figure('drills').value)
})

test('vocabulary entries: the flip-card deck and the dictionary', () => {
  assert.equal(json('src/data/book-vocabulary.json').length, figure('words').value)
})

test('book pages: the page tree of the free PDF', () => {
  assert.equal(pdfPageCount(path.join(root, 'public/downloads/Lea-Faka-Tonga.pdf')), figure('book-pages').value)
})
