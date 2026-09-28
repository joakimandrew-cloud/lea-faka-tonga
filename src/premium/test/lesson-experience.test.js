import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

const site = cwd()
const source = file => fs.readFileSync(path.join(site, file), 'utf8')
const bookExercises = JSON.parse(source('src/data/book-exercises.json'))

const viteOptions = {
  root: site,
  configFile: path.join(site, 'vite.config.js'),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'silent',
}

function wrap(node) {
  return React.createElement(MemoryRouter, null, node)
}

function hrefWithClass(html, href, className) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`<a(?=[^>]*href="${escapedHref}")(?=[^>]*class="[^"]*${className}[^"]*")[^>]*>`)
}

test('mobile compass states use real section positions without a zero index', async () => {
  const server = await createServer(viteOptions)
  try {
    const { default: MobileCompass, compassState } = await server.ssrLoadModule('/src/premium/components/lesson/MobileCompass.jsx')
    const sections = [
      { id: 'the-pattern', title: 'The Pattern' },
      { id: 'words-to-learn', title: '*Ngaahi Lea* to learn' },
      { id: 'exercises', title: 'Exercises' },
    ]

    assert.deepEqual(compassState(sections, null), {
      mode: 'fallback', index: 0, eyebrow: '3 sections', title: 'The Pattern',
    })
    assert.deepEqual(compassState(sections, 'old-section'), {
      mode: 'fallback', index: 0, eyebrow: '3 sections', title: 'The Pattern',
    })
    assert.deepEqual(compassState(sections, 'words-to-learn'), {
      mode: 'section', index: 1, eyebrow: '2 of 3', title: '*Ngaahi Lea* to learn',
    })
    assert.deepEqual(compassState(sections, 'finish'), {
      mode: 'finish', index: null, eyebrow: 'End of lesson', title: 'End of lesson',
    })

    for (const active of [null, 'old-section', 'words-to-learn', 'finish']) {
      const html = renderToStaticMarkup(React.createElement(MobileCompass, { lessonNumber: 1, sections, active }))
      assert.doesNotMatch(html, /0 of 3/)
      assert.match(html, /<dialog[^>]*aria-labelledby="mobile-compass-title"/)
      assert.equal((html.match(/<li>/g) || []).length, sections.length)
    }

    const finishHtml = renderToStaticMarkup(React.createElement(MobileCompass, { lessonNumber: 1, sections, active: 'finish' }))
    assert.match(finishHtml, /Lesson 1 · End of lesson/)
    assert.doesNotMatch(finishHtml, /complete/i)
  } finally {
    await server.close()
  }
})

test('finish destinations prioritize the first unfinished set and retain every route', async () => {
  const server = await createServer(viteOptions)
  try {
    const { FinishActions, firstUnfinishedExerciseHref } = await server.ssrLoadModule('/src/premium/pages/Lesson.jsx')
    const exercises = [
      { id: 'a', number: 1, items: [{ id: 'a1' }] },
      { id: 'b', number: 2, items: [{ id: 'b1' }, { id: 'b2' }] },
    ]
    assert.equal(firstUnfinishedExerciseHref(exercises, { a: { state: { a1: true } }, b: { state: { b1: false } } }), '#ex-2')
    assert.equal(firstUnfinishedExerciseHref(exercises, { a: { state: { a1: true } }, b: { state: { b1: false, b2: true } } }), null)
    assert.equal(firstUnfinishedExerciseHref([{ id: 'x', items: [{ id: 'x1' }] }], {}), '#exercises')

    const incomplete = renderToStaticMarkup(wrap(React.createElement(FinishActions, {
      n: 1,
      next: { chapter: 2, title: 'Tense Markers and Pronouns' },
      hasQuiz: true,
      vocabCount: 17,
      exStats: { total: 20, answered: 1, right: 1 },
      firstUnfinishedHref: '#ex-2',
    })))
    assert.match(incomplete, hrefWithClass(incomplete, '#ex-2', 'nx-main'))
    assert.match(incomplete, /Continue exercises/)
    assert.match(incomplete, /href="\/lessons\/2"/)
    assert.match(incomplete, /href="\/quizzes\/1"/)
    assert.match(incomplete, /href="\/cards\?lesson=1"/)
    assert.equal((incomplete.match(/items left/g) || []).length, 1)

    const complete = renderToStaticMarkup(wrap(React.createElement(FinishActions, {
      n: 1,
      next: { chapter: 2, title: 'Tense Markers and Pronouns' },
      hasQuiz: true,
      vocabCount: 17,
      exStats: { total: 20, answered: 20, right: 18 },
      firstUnfinishedHref: null,
    })))
    assert.doesNotMatch(complete, /Continue exercises/)
    assert.match(complete, hrefWithClass(complete, '/lessons/2', 'nx-main'))

    const finalLesson = renderToStaticMarkup(wrap(React.createElement(FinishActions, {
      n: 52,
      next: null,
      hasQuiz: true,
      vocabCount: 6,
      exStats: { total: 10, answered: 10, right: 10 },
      firstUnfinishedHref: null,
    })))
    assert.match(finalLesson, hrefWithClass(finalLesson, '/quizzes/52', 'nx-main'))
    assert.match(finalLesson, /href="\/cards\?lesson=52"/)

    const zeroExercises = renderToStaticMarkup(wrap(React.createElement(FinishActions, {
      n: 7,
      next: { chapter: 8, title: 'Next lesson' },
      hasQuiz: false,
      vocabCount: 0,
      exStats: { total: 0, answered: 0, right: 0 },
      firstUnfinishedHref: null,
    })))
    assert.match(zeroExercises, hrefWithClass(zeroExercises, '/lessons/8', 'nx-main'))
  } finally {
    await server.close()
  }
})

test('all 52 lessons seed exercise totals synchronously from the shared reader', async () => {
  const server = await createServer(viteOptions)
  try {
    const { readLessonExerciseProgress, firstUnfinishedExerciseHref } = await server.ssrLoadModule('/src/premium/pages/Lesson.jsx')
    const emptyStorage = { getItem: () => null }
    let sets = 0
    for (let lesson = 1; lesson <= 52; lesson += 1) {
      const exercises = bookExercises[String(lesson)]
      const progress = readLessonExerciseProgress(exercises, emptyStorage)
      assert.equal(Object.keys(progress).length, exercises.length, `lesson ${lesson} set count`)
      for (const exercise of exercises) {
        assert.equal(progress[exercise.id].total, exercise.items.length, `${exercise.id} total`)
        assert.deepEqual(progress[exercise.id].state, {}, `${exercise.id} blank state`)
      }
      assert.match(firstUnfinishedExerciseHref(exercises, progress), /^#ex-(?:\d+|undefined)$|^#exercises$/)
      sets += exercises.length
    }
    assert.equal(sets, 278)
  } finally {
    await server.close()
  }
})

test('compass behavior and responsive styling keep focus and header offsets explicit', () => {
  const component = source('src/premium/components/lesson/MobileCompass.jsx')
  const lesson = source('src/premium/pages/Lesson.jsx')
  const css = source('src/premium/styles/lesson-experience.css')

  assert.match(component, /showModal\(\)/)
  assert.match(component, /onKeyDown=\{keepDialogFocus\}/)
  assert.match(component, /event\.stopPropagation\(\)/)
  assert.match(component, /event\.key !== 'Tab'/)
  assert.match(component, /event\.shiftKey && document\.activeElement === first/)
  assert.match(component, /!event\.shiftKey && document\.activeElement === last/)
  assert.equal((component.match(/event\.preventDefault\(\)/g) || []).length, 2, 'Tab is prevented only for focus wrapping')
  assert.match(component, /onCancel=/)
  assert.match(component, /onClose=/)
  assert.match(component, /event\.target === event\.currentTarget/)
  assert.match(component, /matchMedia\('\(min-width: 1081px\)'\)/)
  assert.match(component, /heading\.focus\(\{ preventScroll: true \}\)/)
  assert.match(component, /prefers-reduced-motion: reduce/)
  assert.match(lesson, /className="ls-h2 display" tabIndex=\{-1\}/)
  assert.match(css, /@media \(max-width: 1080px\)/)
  assert.match(css, /html\[data-hdr='hidden'\] \.mobile-compass/)
  assert.match(css, /\.lesson \.ls-h2,/)
  assert.match(css, /scroll-margin-top: 158px/)
})
