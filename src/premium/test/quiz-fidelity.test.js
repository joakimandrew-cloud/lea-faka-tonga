import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { createServer } from 'vite'

const app = cwd()
const quizzes = JSON.parse(fs.readFileSync(path.join(app, 'src/data/quizzes.json'), 'utf8'))
const markdown = unified().use(remarkParse)

function markdownText(source) {
  const text = node => typeof node.value === 'string'
    ? node.value
    : (node.children || []).map(text).join('')
  return text(markdown.parse(String(source ?? '')))
}

function visibleText(html) {
  return html
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#xA0;/g, ' ')
    .replace(/&quot;|&#x27;|&#39;|&apos;/g, match => match === '&quot;' ? '"' : "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[‘’ʻ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

const expectedText = source => visibleText(markdownText(source))

test('all quiz Markdown and all 52 first-question routes render without text loss', async () => {
  const server = await createServer({
    root: cwd(),
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  })

  try {
    const [{ Md }, { default: Quiz }] = await Promise.all([
      server.ssrLoadModule('/src/premium/components/lesson/Blocks.jsx'),
      server.ssrLoadModule('/src/premium/pages/Quiz.jsx'),
    ])
    const quizEntries = Object.entries(quizzes)
    let questionCount = 0
    let optionCount = 0
    let explanationCount = 0

    assert.equal(quizEntries.length, 52, 'all lesson quizzes are present')

    for (const [number, quiz] of quizEntries) {
      assert.equal(quiz.questions.length, 10, `quiz ${number} question count`)
      for (const question of quiz.questions) {
        questionCount += 1
        const fragments = [
          ['prompt', question.prompt],
          ...question.options.flatMap(option => [
            ['option', option.text],
            ['explanation', option.explanation],
          ]),
        ]
        optionCount += question.options.length
        explanationCount += question.options.length

        for (const [kind, source] of fragments) {
          const rendered = renderToStaticMarkup(React.createElement(Md, { text: source }))
          assert.equal(visibleText(rendered), expectedText(source), `quiz ${number} ${question.id} ${kind}`)
        }
      }

      const routeHtml = renderToStaticMarkup(
        React.createElement(MemoryRouter, { initialEntries: [`/quizzes/${number}`] },
          React.createElement(Routes, null,
            React.createElement(Route, { path: '/quizzes/:num', element: React.createElement(Quiz) }))),
      )
      const promptHtml = routeHtml.match(/<h1 class="qz-q">([\s\S]*?)<\/h1>/)?.[1]
      const optionHtml = [...routeHtml.matchAll(/<span class="qz-ot">([\s\S]*?)<\/span><span class="qz-mark"/g)].map(match => match[1])
      assert.ok(visibleText(routeHtml).length > 100, `quiz ${number} produces substantive SSR`)
      assert.doesNotMatch(routeHtml, /not in the sample|quiz not found|placeholder/i, `quiz ${number} is not a placeholder`)
      assert.ok(promptHtml, `quiz ${number} mounts a first prompt`)
      assert.equal(visibleText(promptHtml), expectedText(quiz.questions[0].prompt), `quiz ${number} route prompt`)
      assert.deepEqual(
        optionHtml.map(visibleText),
        quiz.questions[0].options.map(option => expectedText(option.text)),
        `quiz ${number} route options`,
      )
    }

    assert.equal(questionCount, 520)
    assert.equal(optionCount, 2080)
    assert.equal(explanationCount, 2080)

    const escapedBlank = quizzes['1'].questions[4].prompt
    assert.equal(expectedText(escapedBlank).includes('___'), true)
    assert.equal(visibleText(renderToStaticMarkup(React.createElement(Md, { text: escapedBlank }))).includes('\\_'), false)
  } finally {
    await server.close()
  }
})
