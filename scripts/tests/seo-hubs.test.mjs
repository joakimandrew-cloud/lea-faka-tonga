import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import chapters from '../../src/data/chapters.json' with { type: 'json' }
import referenceCharts from '../../src/data/reference-charts.js'
import { TOPIC_PAGES } from '../../src/lib/topic-pages.js'
import { AUDIO_PROGRESS, BEGINNER_PATH, CHARTS_HUB, HOME_HUB } from '../../src/seo/learning-paths.js'
import { STATIC_META } from '../../src/seo/meta.js'
import {
  escapeHtml,
  renderChartsHub,
  renderHomeHub,
  renderLessonsHub,
  renderTopicsHub,
} from '../lib/seo-hubs.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const count = (html, pattern) => (html.match(pattern) || []).length

test('hub HTML escapes content and produces one meaningful H1 per route', () => {
  assert.equal(escapeHtml('<script data-x="1">&'), '&lt;script data-x=&quot;1&quot;&gt;&amp;')
  for (const [route, html] of Object.entries({
    '/': renderHomeHub(),
    '/lessons': renderLessonsHub(chapters),
    '/charts': renderChartsHub(),
    '/topics': renderTopicsHub(),
  })) {
    assert.equal(count(html, /<h1\b/g), 1, `${route} has one H1`)
    assert.ok(html.length > 900, `${route} has a meaningful body`)
    assert.ok(STATIC_META[route], `${route} has route metadata`)
  }
})

test('home static content uses the visible beginner pathway and honest audio status', () => {
  const html = renderHomeHub()
  assert.ok(html.includes(escapeHtml(HOME_HUB.heading.join(' '))))
  assert.ok(html.includes(escapeHtml(BEGINNER_PATH.heading)))
  assert.ok(html.includes(escapeHtml(AUDIO_PROGRESS)))
  assert.match(html, /All 52 lessons are open during the free preview\./)
  for (const step of BEGINNER_PATH.steps) {
    for (const item of step.links) assert.ok(html.includes(`href="${item.to}"`), item.to)
  }
  assert.doesNotMatch(html, /audio is available|audio is complete|release date is/iu)
})

test('lesson hub contains all 52 exact course links and current titles', () => {
  const html = renderLessonsHub(chapters)
  assert.equal(chapters.length, 52)
  assert.equal(count(html, /href="\/lessons\/\d+"/g), 52)
  for (const chapter of chapters) {
    assert.ok(html.includes(`href="/lessons/${chapter.chapter}"`))
    assert.ok(html.includes(escapeHtml(chapter.title)))
  }
})

test('chart hub preserves the immutable original object and renders every table row', () => {
  const before = JSON.parse(fs.readFileSync(path.join(root, 'src/premium/test/fixtures/reference-charts-before.json'), 'utf8'))
  assert.deepEqual(referenceCharts, before)
  const html = renderChartsHub()
  assert.ok(html.includes(escapeHtml(CHARTS_HUB.heading)))
  assert.equal(count(html, /<table>/g), 12)
  assert.equal(count(html, /<tbody>/g), 12)
  assert.equal(count(html, /<tbody>[\s\S]*?<\/tbody>/g), 12)
  assert.equal(count(html, /<tr>/g), 64, '12 header rows plus all 52 chart data rows')
  for (const chart of before) {
    assert.ok(html.includes(escapeHtml(chart.title)))
    for (const table of chart.tables) {
      for (const row of table.rows) {
        for (const cell of row) assert.ok(html.includes(escapeHtml(cell)), `${chart.id}: ${cell}`)
      }
    }
  }
})

test('topic hub contains all seven shared topic destinations and descriptions', () => {
  const html = renderTopicsHub()
  assert.equal(TOPIC_PAGES.length, 7)
  for (const topic of TOPIC_PAGES) {
    assert.ok(html.includes(`href="${topic.to}"`), topic.to)
    assert.ok(html.includes(escapeHtml(topic.label)), topic.label)
    assert.ok(html.includes(escapeHtml(topic.blurb)), topic.blurb)
  }
})
