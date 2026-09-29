import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { buildVocabLists } from '../../lib/vocab-lists.js'
import { okinafy } from '../../lib/okinafy.js'
import { filterGlobalCards, globalCards, globalDeckKey, lessonDeckKey, listDeckKey } from '../lib/card-progress.js'

const root = cwd()
const vocabulary = JSON.parse(fs.readFileSync(path.join(root, 'src/data/book-vocabulary.json'), 'utf8'))
const { meaningGroups, otherMeanings, deckForLists, menu } = buildVocabLists(vocabulary, okinafy)

test('exactly four meaning groups: hiva, nima, taha, lava', () => {
  assert.deepEqual([...meaningGroups.keys()].sort(), ['hiva', 'lava', 'nima', 'taha'])
  const glosses = key => meaningGroups.get(key).map(row => row.english).sort()
  assert.deepEqual(glosses('hiva'), ['nine', 'sing'])
  assert.deepEqual(glosses('nima'), ['five', 'hand'])
  for (const rows of meaningGroups.values()) {
    for (const row of rows) {
      assert.equal(otherMeanings(row).length, rows.length - 1)
      assert.ok(!otherMeanings(row).some(other => other.id === row.id))
    }
  }
  const ungrouped = vocabulary.find(row => !meaningGroups.has(okinafy(row.tongan).toLowerCase().trim()))
  assert.deepEqual(otherMeanings(ungrouped), [])
})

test('Days + Months is 19 cards Monday first; Months + Days is 19 cards January first', () => {
  const daysMonths = globalCards(deckForLists(['days', 'months']))
  const monthsDays = globalCards(deckForLists(['months', 'days']))
  assert.equal(daysMonths.length, 19)
  assert.equal(monthsDays.length, 19)
  assert.equal(daysMonths[0].en, 'Monday')
  assert.equal(daysMonths[7].en, 'January')
  assert.equal(monthsDays[0].en, 'January')
  assert.equal(monthsDays[12].en, 'Monday')
  for (const card of daysMonths) assert.ok(card.to && card.en && card.type, `card ${card.id} has to/en/type`)
})

test('the Category menu offers eight word lists; Days and months is 7 days under Essential', () => {
  assert.deepEqual(menu.map(entry => entry.label), [
    'Numbers', 'Days of the week', 'Months', 'Days and months',
    'Time words', 'Colours', 'Greetings and courtesy', 'Question words',
  ])
  const daysMonths = globalCards(deckForLists(menu.find(entry => entry.id === 'days-months').lists))
  assert.equal(daysMonths.length, 19)
  const essential = filterGlobalCards(daysMonths, 'essential', 'all')
  assert.equal(essential.length, 7)
  assert.equal(essential[0].en, 'Monday')
  const numbers = globalCards(deckForLists(['numbers']))
  assert.equal(numbers[0].en, 'zero')
})

test('list progress keys: one per list and tier, never colliding with word-type or lesson decks', () => {
  const categories = [...new Set(vocabulary.map(item => item.category)), 'all']
  const tiers = ['essential', 'useful', 'all']
  const others = new Set()
  for (const tier of tiers) for (const category of categories) others.add(globalDeckKey(tier, category))
  for (let lesson = 1; lesson <= 52; lesson += 1) others.add(lessonDeckKey(lesson))
  const listKeys = new Set()
  for (const entry of menu) for (const tier of tiers) listKeys.add(listDeckKey(entry.id, tier))
  assert.equal(listKeys.size, menu.length * tiers.length)
  for (const key of listKeys) assert.ok(!others.has(key), `${key} collides`)
  assert.equal(listDeckKey('days-months', 'all'), 'list:days-months:all')
  assert.notEqual(listDeckKey('numbers', 'all'), globalDeckKey('all', 'numbers'))
})
