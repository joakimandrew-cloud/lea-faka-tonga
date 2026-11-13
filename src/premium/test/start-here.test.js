import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { START_HERE, sourceLessons, startHereSection } from '../lib/start-here-content.js'
import { STATIC_META } from '../../seo/meta.js'

// The /start-here page (plan 2026-11-13-start-here-page): its route, the shape of
// its content module, and that every address it links to is a page of the site.
const root = cwd()
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const premiumApp = source('src/premium/App.jsx')
const routePaths = [...premiumApp.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g)].map(match => match[1]).filter(p => p !== '*')

function routeRegex(pattern) {
  if (pattern.endsWith('/*')) return new RegExp(`^${pattern.slice(0, -2).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/.*)?$`)
  return new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-zA-Z0-9_]+/g, '[^/]+')}$`)
}
const isRoute = href => routePaths.some(pattern => routeRegex(pattern).test(href))

function allParts() {
  const out = []
  for (const section of START_HERE.sections) {
    for (const block of section.blocks) {
      if (block.parts) out.push(...block.parts)
      if (block.type === 'ul' || block.type === 'ol') for (const parts of block.items) out.push(...parts)
      if (block.type === 'examples') for (const item of block.items) out.push({ t: 'to', v: item.to }, { t: 'src', v: item.source })
    }
  }
  return out
}

test('/start-here is a route of the premium app with its own title and description', () => {
  assert.ok(routePaths.includes('/start-here'))
  assert.match(premiumApp, /<Route path="\/start-here" element={<Page><StartHere \/><\/Page>} \/>/)
  assert.ok(STATIC_META['/start-here'].title.includes(START_HERE.meta.title))
  assert.equal(STATIC_META['/start-here'].description, START_HERE.meta.description)
})

test('the content holds stages 0 to 5, six first sentences and four routine items', () => {
  const stages = START_HERE.sections.filter(section => section.id.startsWith('stage-'))
  assert.deepEqual(stages.map(section => section.id), ['stage-0', 'stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5'])
  stages.forEach((section, n) => assert.ok(section.heading.startsWith(`Stage ${n}:`), section.heading))
  for (const section of stages.slice(0, 5)) {
    const tests = section.blocks.filter(block => block.type === 'test')
    assert.equal(tests.length, 1, `${section.id} has one test for moving on`)
    assert.match(tests[0].parts[0].v, /^Move on when /)
  }
  assert.equal(stages[5].blocks.some(block => block.type === 'test'), false)

  const firsts = startHereSection('first-sentences').blocks.filter(block => block.type === 'examples')
  assert.equal(firsts.length, 1)
  assert.equal(firsts[0].items.length, 6)
  for (const item of firsts[0].items) assert.ok(item.to && item.meaning && item.source)

  const routine = startHereSection('routine').blocks.filter(block => block.type === 'ol')
  assert.equal(routine.length, 1)
  assert.equal(routine[0].items.length, 4)
})

test('every link in the content opens a route of the app', () => {
  const links = START_HERE.sections.flatMap(section => section.blocks.filter(block => block.type === 'links').flatMap(block => block.items))
  assert.ok(links.length > 0)
  for (const link of links) assert.ok(isRoute(link.to), `${link.to} is a route`)
  const lessons = allParts().filter(part => part.t === 'src').flatMap(part => sourceLessons(part.v))
  assert.ok(lessons.length > 0)
  for (const n of lessons) {
    assert.ok(n >= 1 && n <= 52, `Lesson ${n} exists`)
    assert.ok(isRoute(`/lessons/${n}`))
  }
  assert.deepEqual(sourceLessons('Shumway, Lesson 51'), [])
  assert.deepEqual(sourceLessons('Lessons 6, 7 and 11'), [6, 7, 11])
})

test('no string in the content holds an em dash, and Tongan keeps the ASCII fakaua', () => {
  const text = JSON.stringify(START_HERE)
  assert.equal(text.includes('\u2014'), false)
  for (const part of allParts().filter(part => part.t === 'to')) {
    assert.equal(part.v.includes('\u02bb'), false, `stored with the ASCII apostrophe: ${part.v}`)
  }
})
