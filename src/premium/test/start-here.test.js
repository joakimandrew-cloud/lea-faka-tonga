import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { START_HERE } from '../lib/start-here-content.js'
import { STATIC_META } from '../../seo/meta.js'

// The /start-here page (plan 2026-11-19-start-here-rewrite): its route and links,
// and the content module's rules. Every Tongan string in the module must stand in
// the site's own copy of the lesson its line names (lea-faka-tonga-app/book/).
const root = cwd()
const source = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const premiumApp = source('src/premium/App.jsx')
const routePaths = [...premiumApp.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g)].map(match => match[1]).filter(p => p !== '*')

function routeRegex(pattern) {
  return new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:[a-zA-Z0-9_]+/g, '[^/]+')}$`)
}
const isRoute = href => routePaths.some(pattern => routeRegex(pattern).test(href))

const lines = START_HERE.sections.flatMap(section => section.blocks.flatMap(block => {
  if (block.type === 'p') return [block.parts]
  if (block.type === 'ul' || block.type === 'ol') return block.items
  return []
}))

test('/start-here is a route with its own title and description, linked from the footer and the beginner path', () => {
  assert.ok(routePaths.includes('/start-here'))
  assert.ok(STATIC_META['/start-here'].title.startsWith(START_HERE.meta.title))
  assert.equal(STATIC_META['/start-here'].description, START_HERE.meta.description)
  assert.match(source('src/premium/components/Chrome.jsx'), /<Link to="\/start-here">Start here<\/Link>/)
  assert.match(source('src/seo/learning-paths.js'), /to: '\/start-here'/)
})

test('every link in the content opens a route of the app', () => {
  const links = START_HERE.sections.flatMap(section => section.blocks.filter(block => block.type === 'links').flatMap(block => block.items))
  assert.ok(links.length > 0)
  for (const link of links) assert.ok(isRoute(link.to), `${link.to} is a route`)
  for (const part of lines.flat().filter(part => part.t === 'lesson')) {
    assert.ok(part.v >= 1 && part.v <= 52 && isRoute(`/lessons/${part.v}`), `Lesson ${part.v}`)
  }
})

test('every Tongan string stands in the lesson its line names', () => {
  const book = n => fs.readFileSync(path.join(root, 'book', `Chapter-${String(n).padStart(2, '0')}.md`), 'utf8')
    .normalize('NFC').replace(/[\u02bb\u2018\u2019]/g, "'").replace(/\\_/g, '_').replace(/\*/g, '')
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let spans = 0
  for (const parts of lines) {
    const tongan = parts.filter(part => part.t === 'to')
    if (!tongan.length) continue
    const text = parts.map(part => part.t === 'lesson' ? `Lesson ${part.v} ` : part.v).join('')
    const lessons = [...text.matchAll(/Lessons? (\d+)/g)].map(match => Number(match[1]))
    assert.ok(lessons.length, `a line with Tongan names its lesson: ${text}`)
    for (const { v } of tongan) {
      spans += 1
      const pattern = new RegExp(escape(v.normalize('NFC')).replace(/___/g, "[\\w'āēīōūáéíóú-]+(?: [\\w'āēīōūáéíóú-]+)*"))
      assert.ok(lessons.some(n => pattern.test(book(n))), `"${v}" in Lesson ${lessons.join(' or ')}`)
    }
  }
  assert.ok(spans > 0)
})

test('the content holds no em dash, no outside source, and Tongan keeps the ASCII fakaua', () => {
  const text = JSON.stringify(START_HERE)
  assert.equal(text.includes('\u2014'), false)
  assert.equal(/Shumway|Churchward/.test(text), false)
  for (const part of lines.flat().filter(part => part.t === 'to')) {
    assert.equal(part.v.includes('\u02bb'), false, `stored with the ASCII apostrophe: ${part.v}`)
  }
})
