import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { parseLessonContent } from '../lib/lesson-content.js'

const app = cwd()
const inventory = JSON.parse(fs.readFileSync(path.join(app, 'src/premium/test/fixtures/Source-Inventory.json')))
const readJson = relative => JSON.parse(fs.readFileSync(path.join(app, relative)))
const exercises = readJson('src/data/book-exercises.json')
const quickPractice = readJson('src/data/quick-practice.json')
const drillMap = readJson('src/data/drill-map.json')
const registrySource = fs.readFileSync(path.join(app, 'src/drills/registry.js'), 'utf8')
const registryIds = new Set([...registrySource.matchAll(/^\s{2}'([^']+)':\s*\{/gm)].map(match => match[1]))
const slugify = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[\u2018\u2019\u02BB'`]/g, '').replace(/[/. :,;\u2014\u2013]/g, ' ')
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')

test('all seven end-exercise types keep exact IDs, answers, and supplied options', () => {
  const sets = Object.values(exercises).flat()
  const items = sets.flatMap(set => set.items)
  assert.deepEqual([...new Set(sets.map(set => set.type))].sort(), [
    'fill_blank', 'free', 'matching', 'mcq', 'transform', 'translate_to_english', 'translate_to_tongan',
  ])
  assert.equal(sets.length, 278)
  assert.equal(items.length, 1605)
  assert.equal(new Set(sets.map(set => set.id)).size, 278)
  assert.equal(new Set(items.map(item => item.id)).size, 1605)
  assert.ok(sets.filter(set => set.type === 'mcq').every(set => set.items.every(item => item.options?.includes(item.correct))))
  assert.ok(sets.filter(set => set.type !== 'mcq').every(set => set.items.every(item => item.answer)))
})

test('all Quick Practice ranges and registered drill anchors are consumed once in source order', () => {
  let quickSets = 0
  let quickItems = 0
  let anchors = 0
  for (let chapter = 1; chapter <= 52; chapter += 1) {
    const markdown = fs.readFileSync(path.join(app, 'book', `Chapter-${String(chapter).padStart(2, '0')}.md`), 'utf8')
    const chapterQuick = quickPractice[String(chapter)] || []
    const chapterAnchors = drillMap[String(chapter)] || []
    const parsed = parseLessonContent(markdown, {
      chapter,
      quickPractices: chapterQuick,
      drillAnchors: chapterAnchors,
      slugify,
    })
    assert.equal(parsed.blocks.filter(block => block.type === 'quick-practice').length, chapterQuick.length)
    assert.deepEqual(parsed.blocks.filter(block => block.type === 'quick-practice').map(block => block.index), chapterQuick.map((_, index) => index))
    const placedAnchors = parsed.blocks.filter(block => block.type === 'drill').map(block => [block.drillId, block.after])
    assert.deepEqual(
      placedAnchors.sort(([a], [b]) => a.localeCompare(b)),
      chapterAnchors.map(anchor => [anchor.drillId, anchor.after]).sort(([a], [b]) => a.localeCompare(b)),
    )
    assert.ok(chapterAnchors.every(anchor => registryIds.has(anchor.drillId)))
    if (chapter === 39) {
      const pointing = parsed.blocks.findIndex(block => block.type === 'drill' && block.drillId === 'pointing-scene')
      const mentioned = parsed.blocks.findIndex(block => block.type === 'h3' && block.id === 'mentioned-ia')
      const nextSection = parsed.blocks.findIndex(block => block.type === 'h2' && block.id === 'koeni-with-days-of-the-week')
      assert.equal(parsed.blocks.filter(block => block.drillId === 'pointing-scene').length, 1)
      assert.ok(pointing > mentioned, 'pointing practice follows all four reference explanations')
      assert.equal(pointing + 1, nextSection, 'pointing practice ends the section before the next topic')
      assert.equal(parsed.blocks.filter(block => block.drillId === 'relative-ai-picker').length, 1)
    }
    quickSets += chapterQuick.length
    quickItems += chapterQuick.reduce((sum, set) => sum + set.items.length, 0)
    anchors += chapterAnchors.length
  }
  assert.deepEqual({ quickSets, quickItems, anchors }, { quickSets: 15, quickItems: 76, anchors: 74 })
})

test('Quick Practice instructions, item IDs, prompts, answers, and supplied options match the independent oracle', () => {
  const expected = inventory.lessons.flatMap(lesson => lesson.quickPractice.map(entry => entry.generated))
  const actual = Object.values(quickPractice).flat()
  assert.deepEqual(actual, expected)
  assert.equal(actual.length, 15)
  assert.equal(actual.flatMap(set => set.items).length, 76)
  assert.ok(actual.every(set => set.instructions && set.items.every(item => item.id && item.prompt && item.answer)))
})

test('exercise renderer dispatch keeps matching and real MCQ interactive while five open types reveal', () => {
  const source = fs.readFileSync(path.resolve(cwd(), 'src/premium/components/lesson/Exercises.jsx'), 'utf8')
  assert.match(source, /ex\.type === 'matching'/)
  assert.match(source, /ex\.type === 'mcq'.*options/s)
  assert.match(source, /<MatchingItems/)
  assert.match(source, /<McqItem/)
  assert.match(source, /<RevealItem/)
})
