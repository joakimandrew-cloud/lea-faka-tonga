import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { pathToFileURL } from 'node:url'
import { filterDrillGroups, matchesDrill } from '../lib/catalog-query.js'

test('production bridge preserves source storage names, including Daily Words', () => {
  const vite = fs.readFileSync(path.join(cwd(), 'vite.config.js'), 'utf8')
  const dailyWords = fs.readFileSync(path.join(cwd(), 'src/drills/DailyWordsCore.jsx'), 'utf8')
  assert.doesNotMatch(vite, /source-storage|premiumLocalStorage|premiumSessionStorage/)
  assert.match(dailyWords, /const STORE_KEY = 'lft-daily-words-v1'/)
  assert.match(dailyWords, /localStorage\.getItem\(STORE_KEY\)/)
  assert.match(dailyWords, /localStorage\.setItem\(STORE_KEY/)
  assert.doesNotMatch(dailyWords, /lft-premium-source:/)
})

test('catalog search, level filters and empty results use the menu contract', async () => {
  const appRoot = cwd()
  const { GROUPS } = await import(pathToFileURL(path.join(appRoot, 'src/data/drills-catalog.js')))
  const count = groups => groups.reduce((sum, group) => sum + group.visible.length, 0)
  assert.equal(count(filterDrillGroups(GROUPS)), 30)
  assert.equal(count(filterDrillGroups(GROUPS, '', 'beginner')), 11)
  assert.equal(count(filterDrillGroups(GROUPS, '', 'intermediate')), 10)
  assert.equal(count(filterDrillGroups(GROUPS, '', 'advanced')), 9)
  assert.equal(count(filterDrillGroups(GROUPS, 'counting')), 2)
  assert.equal(count(filterDrillGroups(GROUPS, 'lesson 19')), 5)
  assert.equal(count(filterDrillGroups(GROUPS, 'no-such-drill-name')), 0)
  assert.ok(matchesDrill(GROUPS[1].drills[0], 'CHANGE THE TENSE'))
})
