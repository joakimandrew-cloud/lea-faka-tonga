import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'
import { buildVocabLists } from '../../lib/vocab-lists.js'
import { okinafy } from '../../lib/okinafy.js'
import {
  CARD_PROGRESS_KEY,
  RETIRED_DECKS,
  advanceDeck,
  carryDeck,
  filterGlobalCards,
  freshDeck,
  globalCards,
  globalDeckKey,
  listDeckKey,
  loadDeck,
  saveDeck,
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
const vocabulary = JSON.parse(fs.readFileSync(path.join(root, 'src/data/book-vocabulary.json'), 'utf8'))
const { deckForLists } = buildVocabLists(vocabulary, okinafy)
const oldCards = filterGlobalCards(globalCards(vocabulary), 'all', 'numbers')
const listCards = globalCards(deckForLists(['numbers']))
const OLD_KEY = globalDeckKey('all', 'numbers')
const LIST_KEY = listDeckKey('numbers', 'all')

// The old 19-card word-type deck after one card marked Got it (position 1).
function oldDeckOneKnown() {
  return advanceDeck(freshDeck(oldCards), 'known')
}

test('the retired Numbers word-type deck maps to the Numbers list', () => {
  assert.equal(oldCards.length, 19)
  assert.equal(listCards.length, 17)
  assert.equal(RETIRED_DECKS[LIST_KEY], OLD_KEY)
})

test('old Numbers progress (19 cards, one known, position 1) opens the new list with that card known', () => {
  const storage = new MemoryStorage()
  const old = oldDeckOneKnown()
  assert.equal(old.position, 1)
  assert.equal(old.known.length, 1)
  saveDeck(OLD_KEY, old, storage)
  const before = storage.getItem(CARD_PROGRESS_KEY)

  const deck = loadDeck(LIST_KEY, listCards, storage)
  const knownId = old.known[0]
  assert.ok(listCards.some(card => card.id === knownId), 'the known card is a counting number')
  assert.deepEqual(deck.known, [knownId])
  assert.deepEqual(deck.again, [])
  assert.deepEqual(deck.order, listCards.map(card => card.id))
  assert.equal(deck.position, deck.order.findIndex(id => id !== knownId))
  assert.equal(deck.finished, false)
  // Loading never writes: the old record is untouched and nothing new is saved.
  assert.equal(storage.getItem(CARD_PROGRESS_KEY), before)
})

test('known and again are kept by id, ids outside the list are dropped, and the place is the first unknown card', () => {
  const order = listCards.map(card => card.id)
  const outside = oldCards.find(card => !order.includes(card.id)).id
  const stored = {
    ...freshDeck(oldCards),
    direction: 'en',
    position: 5,
    known: [order[0], order[1], order[3], outside],
    again: [order[2], outside],
  }
  const deck = carryDeck(stored, listCards)
  assert.deepEqual(deck.known, [order[0], order[1], order[3]])
  assert.deepEqual(deck.again, [order[2]])
  assert.equal(deck.position, 2)
  assert.equal(deck.direction, 'en')
  // Moving past the known card later does not count it twice.
  let next = advanceDeck(deck, 'known')
  next = advanceDeck(next, 'known')
  assert.deepEqual(next.known, [order[0], order[1], order[2], order[3]])
  assert.deepEqual(next.again, [])
  assert.equal(carryDeck({ ...freshDeck(oldCards) }, listCards), null, 'nothing to carry gives a fresh deck')
})

test('an existing list record is never overwritten by the old deck, and the old record is kept', () => {
  const storage = new MemoryStorage()
  saveDeck(OLD_KEY, oldDeckOneKnown(), storage)
  const own = advanceDeck(advanceDeck(freshDeck(listCards), 'again'), 'again')
  saveDeck(LIST_KEY, own, storage)
  const before = storage.getItem(CARD_PROGRESS_KEY)

  const deck = loadDeck(LIST_KEY, listCards, storage)
  assert.deepEqual(deck.known, [])
  assert.deepEqual(deck.again, own.again)
  assert.equal(deck.position, 2)
  assert.equal(storage.getItem(CARD_PROGRESS_KEY), before)
  const decks = JSON.parse(before).decks
  assert.ok(decks[OLD_KEY] && decks[LIST_KEY])
})

test('without an old record the Numbers list opens fresh', () => {
  const deck = loadDeck(LIST_KEY, listCards, new MemoryStorage())
  assert.deepEqual(deck, freshDeck(listCards))
})
