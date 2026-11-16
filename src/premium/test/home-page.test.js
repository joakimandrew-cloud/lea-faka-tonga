import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

// The homepage as rebuilt on 2026-11-17: still slides whose Tongan is the film data's own, six stages that match the course
// map's data, no film, no moving preview, and one road to Lesson 1.
const viteOptions = { configFile: 'vite.config.js', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' }
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim()

async function withHome(run) {
  const server = await createServer(viteOptions)
  try {
    const { default: Home } = await server.ssrLoadModule('/src/premium/pages/Home.jsx')
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Home)))
    await run(html, server)
  } finally {
    await server.close()
  }
}

test('every slide prints a sentence from the film data, word for word, with its English', async () => {
  await withHome(async (html, server) => {
    const { default: DATA } = await server.ssrLoadModule('/src/data/sentence-frame-data.js')
    const slides = html.split('class="home-slides__slide"').slice(1)
    assert.equal(slides.length, 4, 'four slides')
    for (const slide of slides) {
      const words = [...slide.matchAll(/class="home-slides__word">([^<]+)</g)].map(match => match[1])
      const sentence = words.join(' ')
      const row = DATA.frame.rows.find(item => item.text === sentence)
      assert.ok(row, `"${sentence}" is a row of the film data`)
      assert.ok(text(slide).includes(text(row.english)), `the English of "${sentence}" is the data's`)
      assert.ok(text(slide).includes(`Lesson ${row.lesson} · ${DATA.titles[row.lesson]}`), 'the slide names the lesson the sentence is from')
    }
  })
})

test('the six stages are the course map\'s own names and lesson ranges', async () => {
  await withHome(async (html, server) => {
    const { HOME_STAGES } = await server.ssrLoadModule('/src/premium/lib/home-stages.js')
    const { default: BLOOM } = await server.ssrLoadModule('/src/data/sentence-bloom-data.js')
    assert.deepEqual(HOME_STAGES, BLOOM.course.groups.map(group => ({ name: group.name, first: group.lessons[0], last: group.lessons.at(-1) })))
    for (const stage of HOME_STAGES) assert.ok(text(html).includes(`${stage.name} Lessons ${stage.first} to ${stage.last}`))
  })
})

test('the page has no film, no moving preview and no em dash, and opens and ends on Lesson 1', async () => {
  await withHome(async html => {
    assert.doesNotMatch(html, /wr-home__film|wr-home__coursemap|practice-showcase|home-pattern-band/)
    assert.doesNotMatch(html, /—/)
    const buttons = [...html.matchAll(/<a class="wr-home__button wr-home__button--primary" href="([^"]+)"/g)].map(match => match[1])
    assert.deepEqual(buttons, ['/lessons/1', '/lessons/1'], 'two main buttons, both to Lesson 1')
    assert.equal((html.match(/name="home-colour"/g) || []).length, 4, 'the four colour choices remain')
  })
})
