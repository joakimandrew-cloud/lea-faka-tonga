// The drills page keeps 18 drills that practise the whole language; every other
// drill lives in its lesson only. Ruled 2026-11-26 (DECISIONS.md, plans/2026-11-26-drills-earn-their-place.md).
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { createServer } from 'vite'

const appRoot = cwd()
const readJson = relative => JSON.parse(fs.readFileSync(path.join(appRoot, relative), 'utf8'))

const MENU = {
  start: ['pronoun-paradigm', 'tense-swapper', 'first-word-quiz', 'tm-by-context-picker'],
  nouns: ['preposition-selector', 'article-picker', 'plural-marker-picker', 'possessive-sorter', 'subject-marker-picker', 'accent-placement-picker'],
  sentences: ['question-word-picker', 'sentence-builder', 'read-it-back', 'spot-the-slip', 'connector-disambiguator', 'terminal-builder', 'sentence-lab'],
  words: ['daily-words'],
}
const MENU_IDS = Object.values(MENU).flat()

// "Ten placements that sit too early" in audits/Drills-Place-Review-2026-11.md:
// drill, lesson, the heading it is anchored after now (as the book prints it).
const MOVED = [
  ['introduce-yourself', 14, "Asking Someone's Age"],
  ['auxiliary-picker', 21, "*sai'ia*: to like"],
  ['negative-obligation', 23, 'All obligation patterns'],
  ['plural-marker-picker', 25, '*ongo*: the dual marker (exactly two)'],
  ['same-as-like', 27, '*hangē*: to be like, seem like'],
  ['reporting-picker', 34, '*Ko ia*: That is it / Therefore'],
  ['adjective-flip', 35, 'Double adjectives: preposed and postposed together'],
  ['permission-hope', 38, '*Fai mo ke* (hurry up and)'],
  ['seem-look', 41, '*Ngalingali* (to look as if, to seem)'],
  ['conditional-picker', 47, 'Present counterfactuals with *ka ne*'],
]

// Mirrors src/lib/remark-drill-anchors.js and scripts/validate-drill-map.mjs.
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻ'`]/g, '')
    .replace(/[/.:,;—–]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
const plain = heading => heading.replace(/\*+/g, '').trim()

async function withVite(run) {
  const server = await createServer({
    configFile: path.join(appRoot, 'vite.config.js'),
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  try { return await run(server) } finally { await server.close() }
}

test('the menu holds exactly the 18 whole-language drills, in four groups, in order', async () => {
  const { GROUPS } = await import(new URL(`file://${appRoot}/src/data/drills-catalog.js`))
  assert.deepEqual(GROUPS.map(group => group.key), Object.keys(MENU))
  assert.deepEqual(GROUPS.map(group => group.name), ['Start the sentence', 'Mark the nouns', 'Whole sentences', 'Words'])
  for (const group of GROUPS) {
    assert.deepEqual(group.drills.map(drill => drill.id), MENU[group.key], `${group.key} drills and their order`)
    assert.ok(group.note && group.note.length > 20, `${group.key} says what it is for`)
    assert.deepEqual(group.inChapters, [], `${group.key} has no "in the lessons" rows`)
  }
  assert.deepEqual(GROUPS.flatMap(group => group.drills.map(drill => drill.id)), MENU_IDS)
  assert.equal(new Set(MENU_IDS).size, 18)
})

test('every menu card keeps a lesson, a level, a title, a blurb and a sample; no card carries an access field', async () => {
  const { GROUPS, LESSON_DRILLS, LEVELS } = await import(new URL(`file://${appRoot}/src/data/drills-catalog.js`))
  const allowed = new Set(['id', 'ch', 'level', 'title', 'blurb', 'action', 'sample', 'label'])
  for (const drill of [...GROUPS.flatMap(group => group.drills), ...LESSON_DRILLS]) {
    for (const key of Object.keys(drill)) assert.ok(allowed.has(key), `${drill.id} has only catalogue fields, found "${key}" (access tiers are not part of this change)`)
  }
  for (const drill of GROUPS.flatMap(group => group.drills)) {
    assert.ok(Number.isInteger(drill.ch) && drill.ch >= 1 && drill.ch <= 52, `${drill.id} has a lesson`)
    assert.ok(drill.level in LEVELS, `${drill.id} has a level`)
    assert.ok(drill.title && drill.blurb && drill.action, `${drill.id} has title, blurb and action`)
    assert.ok(drill.sample?.ton && drill.sample?.q && Array.isArray(drill.sample?.opts), `${drill.id} has a sample`)
  }
  const lab = GROUPS.flatMap(group => group.drills).find(drill => drill.id === 'sentence-lab')
  assert.equal(lab.ch, 19)
  assert.equal(lab.level, 'intermediate')
})

test('drill-map.json carries only drillId and after: no access field was added to a placement', () => {
  const map = readJson('src/data/drill-map.json')
  for (const [chapter, anchors] of Object.entries(map)) {
    if (chapter.startsWith('$')) continue
    for (const anchor of anchors) assert.deepEqual(Object.keys(anchor).sort(), ['after', 'drillId'], `Lesson ${chapter} ${anchor.drillId}`)
  }
})

test('every registered drill is on the menu or in LESSON_DRILLS, never both, and "More practice" is empty', async () => {
  await withVite(async server => {
    const { drillRegistry } = await server.ssrLoadModule('/src/drills/registry.js')
    const { GROUPS, LESSON_DRILLS } = await server.ssrLoadModule('/src/data/drills-catalog.js')
    const { UNCATALOGUED_DRILLS } = await server.ssrLoadModule('/src/premium/lib/source-routes.js')
    const menu = new Set(GROUPS.flatMap(group => group.drills.map(drill => drill.id)))
    const lessonOnly = LESSON_DRILLS.map(drill => drill.id)
    assert.equal(new Set(lessonOnly).size, lessonOnly.length, 'no id listed twice in LESSON_DRILLS')
    assert.deepEqual(UNCATALOGUED_DRILLS, [], 'the "More practice" list is empty')
    for (const id of Object.keys(drillRegistry)) {
      const onMenu = menu.has(id)
      const inLesson = lessonOnly.includes(id)
      assert.ok(onMenu || inLesson, `${id} is on the menu or in LESSON_DRILLS`)
      assert.ok(!(onMenu && inLesson), `${id} is not in both`)
    }
    for (const id of lessonOnly) assert.ok(id in drillRegistry, `${id} in LESSON_DRILLS is a registered drill`)
    // terminal-builder is the free-build page, not a registry Core; every other menu id is registered.
    assert.deepEqual([...menu].filter(id => !(id in drillRegistry)), ['terminal-builder'])
  })
})

test('every LESSON_DRILLS id is placed in a lesson by drill-map.json', async () => {
  const { LESSON_DRILLS } = await import(new URL(`file://${appRoot}/src/data/drills-catalog.js`))
  const map = readJson('src/data/drill-map.json')
  const placed = new Map()
  for (const [chapter, anchors] of Object.entries(map)) {
    if (chapter.startsWith('$')) continue
    for (const anchor of anchors) placed.set(anchor.drillId, [...(placed.get(anchor.drillId) ?? []), Number(chapter)])
  }
  for (const drill of LESSON_DRILLS) assert.ok(placed.has(drill.id), `${drill.id} is placed in a lesson`)
})

test('every registered drill still resolves a route and an eyebrow with its lesson number', async () => {
  await withVite(async server => {
    const { drillRegistry } = await server.ssrLoadModule('/src/drills/registry.js')
    const { premiumRouteFor } = await server.ssrLoadModule('/src/premium/lib/source-routes.js')
    const { routeFor, BESPOKE } = await server.ssrLoadModule('/src/lib/drill-routes.js')
    const { drillEyebrow, drillLesson } = await server.ssrLoadModule('/src/drills/drill-eyebrow.js')
    for (const id of [...Object.keys(drillRegistry), ...MENU_IDS]) {
      const route = premiumRouteFor(id)
      assert.equal(route, routeFor(id), `${id} premium route is the source route`)
      assert.equal(route, BESPOKE[id] || `/drill/${id}`, `${id} route`)
      assert.match(route, /^\/[a-z-]+(\/[a-z-]+)?$/, `${id} has a clean route`)
      assert.ok(Number.isInteger(drillLesson(id)), `${id} has a lesson number`)
      assert.match(drillEyebrow(id), new RegExp(`^Lesson ${drillLesson(id)}( · \\w+)?$`), `${id} eyebrow`)
    }
  })
})

test('a drill that left the menu keeps the lesson and level it had on it', async () => {
  await withVite(async server => {
    const { drillEyebrow } = await server.ssrLoadModule('/src/drills/drill-eyebrow.js')
    // Eyebrows as origin/main printed them for drills that were cards or rows.
    const before = {
      'modifier-order': 'Lesson 3 · Beginner',
      'cleft-builder': 'Lesson 36 · Advanced',
      'aspect-picker': 'Lesson 22 · Intermediate',
      'count-time': 'Lesson 20 · Beginner',
      'skeleton-filler': 'Lesson 1 · Beginner',
      'clusivity-corner': 'Lesson 2 · Beginner',
      'adjective-flip': 'Lesson 35 · Beginner',
      'vocab-cloze': 'Lesson 19 · Beginner',
      'sentence-lab': 'Lesson 19 · Intermediate',
      'te-or-ke-picker': 'Lesson 9',
      'greet-thank': 'Lesson 14',
      'conditional-picker': 'Lesson 47',
      'tense-swapper': 'Lesson 9 · Beginner',
      'first-word-quiz': 'Lesson 12 · Beginner',
    }
    for (const [id, eyebrow] of Object.entries(before)) assert.equal(drillEyebrow(id), eyebrow, id)
  })
})

test('the ten placements that sat too early sit at their proposed anchors, and each heading is in the app book copy', () => {
  const map = readJson('src/data/drill-map.json')
  assert.equal(MOVED.length, 10)
  for (const [drillId, chapter, heading] of MOVED) {
    const anchors = map[String(chapter)].filter(anchor => anchor.drillId === drillId)
    assert.equal(anchors.length, 1, `${drillId} is placed once in Lesson ${chapter}`)
    assert.equal(anchors[0].after, slugify(plain(heading)), `${drillId} anchor`)
    const book = fs.readFileSync(path.join(appRoot, `book/Chapter-${String(chapter).padStart(2, '0')}.md`), 'utf8')
    const headings = book.split('\n').filter(line => line.startsWith('### ')).map(line => slugify(plain(line.slice(4))))
    assert.ok(headings.includes(anchors[0].after), `${drillId}: "${heading}" is an H3 in the app's Lesson ${chapter}`)
  }
})
