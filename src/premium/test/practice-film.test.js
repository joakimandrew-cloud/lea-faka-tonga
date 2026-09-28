import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { cwd } from 'node:process'
import { practiceFrame, practiceDuration, practiceTabIndex, FILM_DURATION, DRILL_PREVIEW_CARDS, shouldAdvancePreview } from '../lib/practice-film.js'
import { ALL_EXAMPLES } from '../data/tense-swap.js'

test('a demonstration starts unanswered, shows its choice before feedback, and finishes once', () => {
  for (const kind of ['drills', 'quizzes']) {
    const duration = practiceDuration(kind)
    assert.equal(practiceFrame(kind, 0).selected, false)
    assert.equal(practiceFrame(kind, 500).selected, true)
    assert.equal(practiceFrame(kind, 500).feedback, false)
    assert.equal(practiceFrame(kind, 800).feedback, true)
    assert.equal(practiceFrame(kind, duration).finished, true)
    assert.deepEqual(practiceFrame(kind, duration + 50000), practiceFrame(kind, duration))
  }
  assert.equal(practiceFrame('cards', 0).flipped, false)
  assert.equal(practiceFrame('cards', 800).flipped, true)
  assert.equal(practiceFrame('cards', 1500).known, true)
  assert.equal(practiceFrame('cards', 2200).advanced, true)
})

test('drills show two real examples with fresh choices before completing the preview', () => {
  assert.equal(DRILL_PREVIEW_CARDS.length, 2)
  assert.equal(new Set(DRILL_PREVIEW_CARDS.map(card => card.e.id)).size, 2)
  for (const { e, t } of DRILL_PREVIEW_CARDS) {
    assert.ok(ALL_EXAMPLES.includes(e), 'the sample uses the actual drill record')
    assert.ok(e.perTense.affirmative[t])
    assert.ok(e.english.affirmative[t])
  }
  assert.deepEqual(practiceFrame('drills', FILM_DURATION - 1), { exampleIndex: 0, selected: true, feedback: true, finished: false })
  assert.deepEqual(practiceFrame('drills', FILM_DURATION), { exampleIndex: 1, selected: false, feedback: false, finished: false })
  assert.deepEqual(practiceFrame('drills', FILM_DURATION + 500), { exampleIndex: 1, selected: true, feedback: false, finished: false })
  assert.deepEqual(practiceFrame('drills', FILM_DURATION + 800), { exampleIndex: 1, selected: true, feedback: true, finished: false })
  assert.deepEqual(practiceFrame('drills', practiceDuration('drills')), { exampleIndex: 1, selected: true, feedback: true, finished: true })
  assert.equal(practiceFrame('drills', 0).exampleIndex, 0, 'replay begins at the first example')
})

test('cycling waits for completion and stops for pause, manual selection, hidden/offscreen and reduced motion', () => {
  const ready = { finished: true, autoCycle: true, playing: true, visible: true, pageVisible: true, reduceMotion: false }
  assert.equal(FILM_DURATION, 3000)
  assert.equal(shouldAdvancePreview(ready), true)
  for (const key of ['finished', 'autoCycle', 'playing', 'visible', 'pageVisible']) assert.equal(shouldAdvancePreview({ ...ready, [key]: false }), false)
  assert.equal(shouldAdvancePreview({ ...ready, reduceMotion: true }), false)
})

test('tabs wrap with arrow keys and support Home/End without a mouse', () => {
  assert.equal(practiceTabIndex(2, 'ArrowRight'), 0)
  assert.equal(practiceTabIndex(0, 'ArrowLeft'), 2)
  assert.equal(practiceTabIndex(1, 'Home'), 0)
  assert.equal(practiceTabIndex(1, 'End'), 2)
  assert.equal(practiceTabIndex(1, 'Tab'), 1)
})

test('shared real-tool views retain answer feedback while demo views have no answer controls', async () => {
  const server = await createServer({ root: cwd(), appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
  try {
    const [{ QuizChoices, QuizExplanation }, { DrillChoices }, quizzes] = await Promise.all([
      server.ssrLoadModule('/src/premium/components/practice/QuizParts.jsx'),
      server.ssrLoadModule('/src/premium/components/practice/DrillParts.jsx'),
      server.ssrLoadModule('@app/data/quizzes.json'),
    ])
    const q = quizzes.default['6'].questions.find(question => question.id === 'q3')
    const correct = q.options.findIndex(option => option.correct)
    const wrong = q.options.findIndex(option => !option.correct)
    for (const picked of [correct, wrong]) {
      const props = { q, picked, answered: true }
      const actual = renderToStaticMarkup(React.createElement(QuizChoices, props))
      const demo = renderToStaticMarkup(React.createElement(QuizChoices, { ...props, demo: true }))
      assert.equal((actual.match(/role="radio"/g) || []).length, q.options.length)
      assert.ok(actual.includes('aria-checked="true"'))
      assert.ok(actual.includes('is-right'))
      assert.doesNotMatch(demo, /<button|tabindex|role="radio"/)
      const explanation = renderToStaticMarkup(React.createElement(QuizExplanation, { q, chosen: q.options[picked], still: true }))
      assert.ok(explanation.includes(picked === correct ? 'Right.' : 'Why the answer is right:'))
      assert.ok(explanation.includes(picked === correct ? 'kp-leaf' : 'kp-nest'))
      assert.doesNotMatch(explanation, /opacity:0|height:0/, 'reduced-motion feedback renders as a visible still')
    }
    const example = ALL_EXAMPLES.find(row => row.id === 'he-eats')
    const options = Object.entries(example.perTense.affirmative).map(([t, p]) => ({ t, p }))
    const correctOption = options.find(row => row.t === 'future')
    const actual = renderToStaticMarkup(React.createElement(DrillChoices, { options, correct: correctOption.p, pick: correctOption }))
    const demo = renderToStaticMarkup(React.createElement(DrillChoices, { options, correct: correctOption.p, pick: correctOption, demo: true }))
    assert.equal((actual.match(/<button/g) || []).length, 4)
    assert.equal((actual.match(/disabled/g) || []).length, 3)
    assert.doesNotMatch(demo, /<button|tabindex/)
  } finally { await server.close() }
})
