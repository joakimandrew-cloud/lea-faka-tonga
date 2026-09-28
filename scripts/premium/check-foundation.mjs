import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.resolve(here, '../..')
const premiumRoot = path.join(appRoot, 'src/premium')
const { GROUPS, LEVELS } = await import(pathToFileURL(path.join(appRoot, 'src/data/drills-catalog.js')))
const registrySource = fs.readFileSync(path.join(appRoot, 'src/drills/registry.js'), 'utf8')
const registryIds = [...registrySource.matchAll(/^  '([^']+)': \{/gm)].map(match => match[1])
const registrySet = new Set(registryIds)
const cards = GROUPS.flatMap(group => group.drills)
const lessonRows = GROUPS.flatMap(group => group.inChapters)
const catalogIds = [...cards, ...lessonRows].map(drill => drill.id)
const catalogSet = new Set(catalogIds)
const quizzes = JSON.parse(fs.readFileSync(path.join(appRoot, 'src/data/quizzes.json'), 'utf8'))
const chapters = JSON.parse(fs.readFileSync(path.join(appRoot, 'src/data/chapters.json'), 'utf8'))

assert.equal(registrySet.size, 75, 'registered drill count')
assert.equal(catalogSet.size, 75, 'catalogued drill count')
assert.equal(cards.length, 30, 'featured drill count')
assert.equal(lessonRows.length, 45, 'in-lesson drill count')
assert.deepEqual([...catalogSet].filter(id => !registrySet.has(id)), ['terminal-builder'])
assert.deepEqual([...registrySet].filter(id => !catalogSet.has(id)), ['sentence-lab'])
assert.deepEqual(Object.fromEntries(Object.keys(LEVELS).map(level => [level, cards.filter(card => card.level === level).length])), {
  beginner: 11,
  intermediate: 10,
  advanced: 9,
})

const quizIds = Object.values(quizzes).filter(quiz => quiz?.questions?.length).map(quiz => quiz.chapter).sort((a, b) => a - b)
assert.deepEqual(quizIds, Array.from({ length: 52 }, (_, index) => index + 1), 'quiz IDs 1..52')
assert.deepEqual(chapters.map(chapter => chapter.chapter), Array.from({ length: 52 }, (_, index) => index + 1), 'lesson IDs 1..52')

const routeSource = fs.readFileSync(path.join(premiumRoot, 'lib/source-routes.js'), 'utf8')
assert.match(routeSource, /import \{ BESPOKE, routeFor \} from '@app\/lib\/drill-routes\.js'/)
assert.match(routeSource, /export const premiumRouteFor = routeFor/)
const appSource = fs.readFileSync(path.join(premiumRoot, 'App.jsx'), 'utf8')
for (const route of ['/drills', '/quizzes', '/drill/tense-swap', '/drill/:id', '/terminal-build']) {
  assert.ok(appSource.includes(`path="${route}"`), `App includes ${route}`)
}
assert.match(appSource, /loc\.search.*loc\.hash/s, 'legacy redirects preserve query and hash')

const viteSource = fs.readFileSync(path.join(appRoot, 'vite.config.js'), 'utf8')
for (const pkg of ['react', 'react-dom', 'react-router', 'react-router-dom']) assert.ok(viteSource.includes(`'${pkg}'`), `dedupes ${pkg}`)
assert.match(viteSource, /course-css-in-premium/)
assert.doesNotMatch(viteSource, /premiumLocalStorage|premiumSessionStorage|source-storage/, 'production keeps canonical storage keys unprefixed')

console.log(JSON.stringify({
  registered: registrySet.size,
  catalogued: catalogSet.size,
  featured: cards.length,
  inLessons: lessonRows.length,
  union: new Set([...registrySet, ...catalogSet]).size,
  quizzes: quizIds.length,
  lessons: chapters.length,
}, null, 2))
