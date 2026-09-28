import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { plainInline } from '../lib/lesson-content.js'

const app = cwd()
const bookExercises = JSON.parse(fs.readFileSync(path.join(app, 'src/data/book-exercises.json')))
const quickPractice = JSON.parse(fs.readFileSync(path.join(app, 'src/data/quick-practice.json')))

function mcqItems(groups) {
  return Object.values(groups).flatMap(sets => sets
    .filter(set => set.type === 'mcq' && set.items.every(item => item.options?.length))
    .flatMap(set => set.items))
}

function visibleText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#xA0;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[‘’ʻ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const compact = text => visibleText(text).replace(/\s+/g, '')
async function withPresentation(run) {
  const server = await createServer({
    root: cwd(),
    configFile: path.join(cwd(), 'vite.config.js'),
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  })
  try {
    const [{ McqPresentation }, { Md }] = await Promise.all([
      server.ssrLoadModule('/src/premium/components/lesson/Exercises.jsx'),
      server.ssrLoadModule('/src/premium/components/lesson/Blocks.jsx'),
    ])
    await run({ McqPresentation, Md })
  } finally {
    await server.close()
  }
}

test('the actual solved MCQ presentation retains every end-exercise answer', async () => {
  await withPresentation(({ McqPresentation, Md }) => {
    const items = mcqItems(bookExercises)
    let annotated = 0

    for (const [index, item] of items.entries()) {
      const html = renderToStaticMarkup(React.createElement(McqPresentation, {
        item,
        n: index + 1,
        tries: [item.correct],
      }))
      const rendered = compact(html)
      const answer = compact(renderToStaticMarkup(React.createElement(Md, { text: item.answer })))
      const distinct = plainInline(item.answer) !== plainInline(item.correct)

      assert.ok(answer && rendered.includes(answer), `${item.id} solved state contains its established answer`)
      assert.equal(html.includes('data-mcq-answer=""'), distinct, `${item.id} adds an answer line only for distinct source text`)
      if (distinct) annotated += 1
    }

    assert.equal(items.length, 293, 'all current end-exercise MCQ item records are exercised')
    assert.equal(new Set(items.map(item => plainInline(item.correct))).size, 152, 'all 152 distinct established correct-option texts are covered')
    assert.ok(annotated >= 29, `${annotated} annotated answers retain teaching text beyond the option`)
  })
})

test('Quick Practice MCQ answers stay visible without a duplicate answer line', async () => {
  await withPresentation(({ McqPresentation, Md }) => {
    const items = mcqItems(quickPractice)

    for (const [index, item] of items.entries()) {
      assert.equal(plainInline(item.answer), plainInline(item.correct), `${item.id} answer still matches its source option`)
      const html = renderToStaticMarkup(React.createElement(McqPresentation, {
        item,
        n: index + 1,
        tries: [item.correct],
      }))
      const answer = compact(renderToStaticMarkup(React.createElement(Md, { text: item.answer })))
      assert.ok(compact(html).includes(answer), `${item.id} solved state retains its answer`)
      assert.doesNotMatch(html, /data-mcq-answer=/, `${item.id} does not duplicate the same answer in a note`)
    }

    assert.equal(items.length, 20, 'all current Quick Practice MCQ items are exercised')
  })
})
