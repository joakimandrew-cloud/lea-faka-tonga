import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import {
  CARD_PROGRESS_KEY,
  advanceDeck,
  filterGlobalCards,
  freshDeck,
  globalCards,
  globalDeckKey,
  lessonCards,
  loadDeck,
  restartDeck,
  saveDeck,
  shuffleDeck,
} from '../lib/card-progress.js'

class MemoryStorage {
  #values = new Map()
  get length() { return this.#values.size }
  key(index) { return [...this.#values.keys()][index] ?? null }
  getItem(key) { return this.#values.get(String(key)) ?? null }
  setItem(key, value) { this.#values.set(String(key), String(value)) }
  removeItem(key) { this.#values.delete(String(key)) }
}

const root = cwd()
const vocabulary = JSON.parse(fs.readFileSync(path.join(root, 'src/data/book-vocabulary.json')))
const cards = globalCards(vocabulary)

test('global vocabulary retains all source IDs and exact tier/category membership', () => {
  assert.equal(cards.length, 649)
  assert.equal(new Set(cards.map(card => card.id)).size, 649)
  assert.deepEqual(cards.map(card => card.id), vocabulary.map(item => item.id))
  assert.deepEqual({
    essential: filterGlobalCards(cards, 'essential').length,
    useful: filterGlobalCards(cards, 'useful').length,
    all: filterGlobalCards(cards, 'all').length,
  }, { essential: 210, useful: 477, all: 649 })
  assert.deepEqual(Object.fromEntries(['adjectives', 'adverbs', 'grammar', 'nouns', 'numbers', 'verbs']
    .map(category => [category, filterGlobalCards(cards, 'all', category).length])), {
    adjectives: 81, adverbs: 28, grammar: 166, nouns: 199, numbers: 19, verbs: 156,
  })
  assert.equal(filterGlobalCards(cards, 'essential', 'not-a-category').length, 0)
})

test('a deck persists direction, order, position, piles, finish and affected-deck restart', () => {
  const storage = new MemoryStorage()
  const sample = cards.slice(0, 3)
  const key = globalDeckKey('essential', 'all')
  let state = freshDeck(sample)
  state = { ...state, direction: 'en' }
  state = advanceDeck(state, 'known')
  state = advanceDeck(state, 'again')
  state = advanceDeck(state, 'known')
  saveDeck(key, state, storage)
  assert.equal(storage.length, 1)
  assert.ok(storage.getItem(CARD_PROGRESS_KEY))
  assert.deepEqual(loadDeck(key, sample, storage), state)
  assert.deepEqual({ position: state.position, known: state.known.length, again: state.again.length, finished: state.finished, direction: state.direction }, {
    position: 3, known: 2, again: 1, finished: true, direction: 'en',
  })
  const missed = restartDeck(state, sample, state.again)
  assert.deepEqual(missed.order, state.again)
  assert.equal(missed.position, 0)
  assert.equal(missed.finished, false)
})

test('shuffle is a saved order and changed sources safely restart only that stale deck', () => {
  const storage = new MemoryStorage()
  const sample = cards.slice(0, 4)
  const shuffled = shuffleDeck(freshDeck(sample), sample, () => 0)
  assert.notDeepEqual(shuffled.order, sample.map(card => card.id))
  saveDeck('one', advanceDeck(shuffled, 'known'), storage)
  saveDeck('two', freshDeck(cards.slice(4, 7)), storage)
  const changed = [...sample.slice(0, 3), { ...sample[3], en: `${sample[3].en} changed` }]
  const reset = loadDeck('one', changed, storage)
  assert.equal(reset.position, 0)
  assert.deepEqual(reset.known, [])
  assert.deepEqual(loadDeck('two', cards.slice(4, 7), storage), freshDeck(cards.slice(4, 7)))
})

test('lesson word IDs derive from content and remain stable across navigation', () => {
  const tables = [{ body: [["*kai*", 'verb', 'eat'], ["*inu*", 'verb', 'drink']] }]
  const first = lessonCards(tables, 7)
  const second = lessonCards(tables, 7)
  assert.deepEqual(first, second)
  assert.ok(first.every(card => card.id.startsWith('lesson-7-')))
  assert.notEqual(first[0].id, first[1].id)
})
