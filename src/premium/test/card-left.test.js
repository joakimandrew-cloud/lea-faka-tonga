import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceDeck, cardsLeft, freshDeck, restartDeck } from '../lib/card-progress.js'

const cards = ['a', 'b', 'c'].map(id => ({ id, to: id, en: id, type: 'noun' }))

test('cards left counts down as the learner goes through the deck', () => {
  let state = freshDeck(cards)
  assert.equal(cardsLeft(state), 3)
  state = advanceDeck(state, 'known')
  assert.equal(cardsLeft(state), 2)
  state = advanceDeck(state, 'again')
  assert.equal(cardsLeft(state), 1)
  state = advanceDeck(state, 'known')
  assert.equal(state.finished, true)
  assert.equal(cardsLeft(state), 0)
})

test('cards left resets with the deck', () => {
  let state = advanceDeck(freshDeck(cards), 'again')
  state = restartDeck(state, cards)
  assert.equal(cardsLeft(state), 3)
  assert.equal(cardsLeft(freshDeck([])), 0)
})
