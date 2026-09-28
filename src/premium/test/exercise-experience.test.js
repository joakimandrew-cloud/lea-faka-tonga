import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import {
  EXERCISE_STATE_VERSION,
  EXERCISE_STORAGE_KEY,
  clearExerciseState,
  emptyExerciseSnapshot,
  exerciseProgressFromSnapshot,
  initialExerciseSnapshot,
  readExerciseSnapshot,
  readExerciseState,
  validateExerciseSnapshot,
  writeExerciseSnapshot,
} from '../lib/exercise-progress.js'

const app = cwd()
const bookExercises = JSON.parse(fs.readFileSync(path.join(app, 'src/data/book-exercises.json')))
const chapterOne = fs.readFileSync(path.join(app, 'book/Chapter-01.md'), 'utf8')
const chapterOneExercise = bookExercises['1'].find(ex => ex.id === 'ch1-ex4')

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  }
}

function text(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#xA0;/g, ' ')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[‘’ʻ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

test('source-guarded feedback uses the actual solved presentation for before, wrong, and corrected states', async () => {
  const server = await createServer({
    root: cwd(),
    configFile: path.join(cwd(), 'vite.config.js'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  })
  try {
    const [{ McqPresentation }, feedbackModule] = await Promise.all([
      server.ssrLoadModule('/src/premium/components/lesson/Exercises.jsx'),
      server.ssrLoadModule('/src/premium/lib/exercise-feedback.js'),
    ])
    const { activeSourceFeedbackFor, sourceFeedbackFor } = feedbackModule
    const item = chapterOneExercise.items[1]

    const before = renderToStaticMarkup(React.createElement(McqPresentation, { item, n: 2 }))
    assert.doesNotMatch(before, /data-source-feedback=/, 'no feedback appears before interaction')

    const wrongTries = ['*ku*']
    const wrongFeedback = activeSourceFeedbackFor(item.id, chapterOneExercise, item, wrongTries)
    const wrong = renderToStaticMarkup(React.createElement(McqPresentation, { item, n: 2, tries: wrongTries, feedback: wrongFeedback }))
    assert.match(wrong, /data-source-feedback=""/)
    assert.match(wrong, /role="status"/)
    assert.match(wrong, /aria-live="polite"/)
    assert.match(text(wrong), /Not that one\. Check the English in brackets, then try the other\./)
    assert.match(text(wrong), /ke you \(one person\) ku I/)
    assert.match(wrong, /lang="to"/)
    assert.match(wrong, /<dd[^>]*lang="en"[^>]*>you \(one person\)<\/dd>/)

    const correctedTries = ['*ku*', '*ke*']
    const correctFeedback = activeSourceFeedbackFor(item.id, chapterOneExercise, item, correctedTries)
    const corrected = renderToStaticMarkup(React.createElement(McqPresentation, { item, n: 2, tries: correctedTries, feedback: correctFeedback }))
    assert.match(corrected, /data-source-feedback=""/, 'panel remains after correction')
    assert.match(text(corrected), /Correct: ke/)
    assert.match(text(corrected), /ke you \(one person\) ku I/)

    for (const sourceItem of chapterOneExercise.items) {
      const firstTry = [sourceItem.options.find(option => option !== sourceItem.correct)]
      assert.ok(sourceFeedbackFor(chapterOneExercise, sourceItem, firstTry), `${sourceItem.id} is explicitly source-verified`)
    }
    assert.equal(activeSourceFeedbackFor('ch1-ex4-1', chapterOneExercise, item, correctedTries), null, 'only the most recently active item shows the source panel')

    const changedItem = { ...item, prompt: `${item.prompt} changed` }
    assert.equal(sourceFeedbackFor(chapterOneExercise, changedItem, wrongTries), null, 'changed item identity falls back')
    assert.equal(sourceFeedbackFor(chapterOneExercise, item, wrongTries, chapterOne.replace('| *ku* | I |', '| *ku* | changed |')), null, 'changed cited mapping falls back')

    const plainExercise = bookExercises['4'].find(ex => ex.id === 'ch4-ex4')
    const plainItem = plainExercise.items[0]
    const plainTries = [plainItem.options.find(option => option !== plainItem.correct)]
    const plainFeedback = activeSourceFeedbackFor(plainItem.id, plainExercise, plainItem, plainTries)
    const plain = renderToStaticMarkup(React.createElement(McqPresentation, { item: plainItem, n: 1, tries: plainTries, feedback: plainFeedback }))
    assert.equal(plainFeedback, null)
    assert.doesNotMatch(plain, /data-source-feedback=/)
    assert.match(text(plain), /Not that one\. Try again\./)
  } finally {
    await server.close()
  }
})

test('versioned storage retains MCQ tries and derives first-attempt state from tries', () => {
  const storage = memoryStorage()
  const item = chapterOneExercise.items[0]
  const wrong = item.options.find(option => option !== item.correct)
  const snapshot = emptyExerciseSnapshot(chapterOneExercise)

  snapshot.items[item.id] = { kind: 'mcq', tries: [wrong] }
  assert.equal(writeExerciseSnapshot(chapterOneExercise, snapshot, storage), true)
  assert.deepEqual(initialExerciseSnapshot(chapterOneExercise, false, storage).items[item.id].tries, [wrong], 'end exercise initializes from its validated saved snapshot')
  assert.deepEqual(initialExerciseSnapshot(chapterOneExercise, true, storage).items, {}, 'compact Quick Practice initializes session-only')
  assert.deepEqual(readExerciseSnapshot(chapterOneExercise, storage).items[item.id].tries, [wrong], 'unsolved wrong try persists')
  assert.deepEqual(readExerciseState(chapterOneExercise, storage), { state: {}, total: 5 }, 'unsolved try is not answered')

  snapshot.items[item.id] = { kind: 'mcq', tries: [wrong, item.correct] }
  writeExerciseSnapshot(chapterOneExercise, snapshot, storage)
  assert.equal(readExerciseState(chapterOneExercise, storage).state[item.id], false, 'later correction derives false first-attempt state')

  const firstTryStorage = memoryStorage()
  const firstTry = emptyExerciseSnapshot(chapterOneExercise)
  firstTry.items[item.id] = { kind: 'mcq', tries: [item.correct] }
  writeExerciseSnapshot(chapterOneExercise, firstTry, firstTryStorage)
  assert.equal(readExerciseState(chapterOneExercise, firstTryStorage).state[item.id], true, 'first correct try derives true state')

  const duplicate = emptyExerciseSnapshot(chapterOneExercise)
  duplicate.items[item.id] = { kind: 'mcq', tries: [wrong, wrong] }
  duplicate.items[chapterOneExercise.items[1].id] = { kind: 'mcq', tries: [chapterOneExercise.items[1].correct] }
  const validated = validateExerciseSnapshot(chapterOneExercise, duplicate)
  assert.equal(validated.items[item.id], undefined, 'invalid item drops independently')
  assert.ok(validated.items[chapterOneExercise.items[1].id], 'valid sibling item remains')

  const correctThenWrong = emptyExerciseSnapshot(chapterOneExercise)
  correctThenWrong.items[item.id] = { kind: 'mcq', tries: [item.correct, wrong] }
  assert.equal(validateExerciseSnapshot(chapterOneExercise, correctThenWrong).items[item.id], undefined, 'correct option is valid only as the last unique try')
})

test('reveal and matching snapshots validate, report callback parity, and clear matching reset state', () => {
  const revealExercise = Object.values(bookExercises).flat().find(ex => !['mcq', 'matching'].includes(ex.type))
  const revealItem = revealExercise.items[0]
  const reveal = emptyExerciseSnapshot(revealExercise)
  reveal.items[revealItem.id] = { kind: 'reveal', open: true, self: null }
  assert.deepEqual(exerciseProgressFromSnapshot(revealExercise, reveal).state, {}, 'open reveal is not answered before self-check')
  reveal.items[revealItem.id] = { kind: 'reveal', open: true, self: false }
  assert.equal(exerciseProgressFromSnapshot(revealExercise, reveal).state[revealItem.id], false)
  reveal.items[revealItem.id] = { kind: 'reveal', open: true, self: true }
  assert.equal(exerciseProgressFromSnapshot(revealExercise, reveal).state[revealItem.id], true)
  reveal.items[revealItem.id] = { kind: 'reveal', open: false, self: true }
  assert.equal(validateExerciseSnapshot(revealExercise, reveal).items[revealItem.id], undefined, 'self-check without reveal is rejected')

  const matching = Object.values(bookExercises).flat().find(ex => ex.type === 'matching')
  const matchingStorage = memoryStorage()
  const matched = emptyExerciseSnapshot(matching)
  for (const item of matching.items.slice(0, 2)) matched.items[item.id] = { kind: 'matching', matched: true }
  matched.items.unknown = { kind: 'matching', matched: true }
  assert.equal(writeExerciseSnapshot(matching, matched, matchingStorage), true)
  const stored = readExerciseSnapshot(matching, matchingStorage)
  assert.deepEqual(Object.keys(stored.items), matching.items.slice(0, 2).map(item => item.id), 'matching ids are limited to the current source set')
  assert.deepEqual(readExerciseState(matching, matchingStorage), exerciseProgressFromSnapshot(matching, stored), 'read helper and callback payload use one validator')

  assert.equal(clearExerciseState(matching, matchingStorage), true)
  assert.deepEqual(readExerciseState(matching, matchingStorage), { state: {}, total: matching.items.length }, 'matching reset clears saved and reported state')
})

test('malformed, mismatched, server, blocked, and quota storage fail closed', () => {
  const malformed = memoryStorage({ [EXERCISE_STORAGE_KEY]: '{bad json' })
  assert.deepEqual(readExerciseState(chapterOneExercise, malformed), { state: {}, total: 5 })

  const nonobject = memoryStorage({ [EXERCISE_STORAGE_KEY]: JSON.stringify([]) })
  assert.deepEqual(readExerciseState(chapterOneExercise, nonobject), { state: {}, total: 5 })

  const storage = memoryStorage()
  const snapshot = emptyExerciseSnapshot(chapterOneExercise)
  snapshot.items[chapterOneExercise.items[0].id] = { kind: 'mcq', tries: [chapterOneExercise.items[0].correct] }
  writeExerciseSnapshot(chapterOneExercise, snapshot, storage)
  const changedExercise = {
    ...chapterOneExercise,
    items: chapterOneExercise.items.map((item, index) => index === 0 ? { ...item, answer: `${item.answer} changed` } : item),
  }
  assert.deepEqual(readExerciseState(changedExercise, storage), { state: {}, total: 5 }, 'source signature mismatch drops the set')

  const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
  assert.deepEqual(readExerciseState(chapterOneExercise, blocked), { state: {}, total: 5 })
  assert.equal(writeExerciseSnapshot(chapterOneExercise, snapshot, blocked), false)
  assert.equal(clearExerciseState(chapterOneExercise, blocked), false)

  assert.equal(EXERCISE_STATE_VERSION, 1)
  assert.equal(EXERCISE_STORAGE_KEY, 'lft-premium-exercises-v1')
  assert.deepEqual(readExerciseState(chapterOneExercise, null), { state: {}, total: 5 }, 'explicit absent or server storage is empty')
})
