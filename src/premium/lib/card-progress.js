import { useCallback, useState } from 'react'
import { plainInline } from './lesson-content.js'

export const CARD_PROGRESS_KEY = 'lft-premium-cards-v1'
const CARD_PROGRESS_EVENT = 'lft-premium-cards'
const VERSION = 1

function browserStorage() {
  try { return globalThis.localStorage ?? null } catch { return null }
}

function readRoot(storage = browserStorage()) {
  try {
    const value = JSON.parse(storage?.getItem(CARD_PROGRESS_KEY) || '{}')
    return value?.version === VERSION && value.decks && typeof value.decks === 'object'
      ? value
      : { version: VERSION, decks: {} }
  } catch {
    return { version: VERSION, decks: {} }
  }
}

function writeRoot(root, storage = browserStorage()) {
  try { storage?.setItem(CARD_PROGRESS_KEY, JSON.stringify(root)) } catch { /* blocked storage */ }
  if (storage === browserStorage() && typeof window !== 'undefined') window.dispatchEvent(new Event(CARD_PROGRESS_EVENT))
}

export function stableHash(value) {
  let hash = 0x811c9dc5
  for (const char of String(value)) {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

export function lessonCards(tables, lesson) {
  const occurrences = new Map()
  return tables.flatMap(table => table.body.map(row => {
    const tongan = plainInline(row[0])
    const type = plainInline(row[1])
    const english = plainInline(row[2])
    const identity = `${tongan}\u0000${english}\u0000${type}`
    const occurrence = (occurrences.get(identity) || 0) + 1
    occurrences.set(identity, occurrence)
    return {
      id: `lesson-${lesson}-${stableHash(identity)}-${occurrence}`,
      to: tongan,
      en: english,
      type,
      lesson,
    }
  }))
}

export function globalCards(vocabulary) {
  return vocabulary.map(item => ({
    ...item,
    to: item.tongan,
    en: item.english,
    type: item.part_of_speech,
  }))
}

export function filterGlobalCards(cards, tier = 'essential', category = 'all') {
  return cards.filter(card => {
    const inTier = tier === 'all' || (tier === 'essential' ? card.tier === 1 : card.tier <= 2)
    return inTier && (category === 'all' || card.category === category)
  })
}

export function lessonDeckKey(lesson) {
  return `lesson:${lesson}`
}

export function globalDeckKey(tier, category) {
  return `global:${tier}:${category}`
}

// Course lists (vocab-lists.js menu) keep their own progress for each tier,
// apart from the word-type decks (global:) and the lesson decks (lesson:).
export function listDeckKey(menuId, tier) {
  return `list:${menuId}:${tier}`
}

export function sourceFingerprint(cards) {
  return stableHash(cards.map(card => [card.id, card.to, card.en, card.type].join('\u0001')).join('\u0002'))
}

export function freshDeck(cards, direction = 'to') {
  return {
    sourceFingerprint: sourceFingerprint(cards),
    direction: direction === 'en' ? 'en' : 'to',
    order: cards.map(card => card.id),
    position: 0,
    known: [],
    again: [],
    finished: cards.length === 0,
    shuffled: false,
  }
}

function validStoredDeck(stored, cards) {
  if (!stored || stored.sourceFingerprint !== sourceFingerprint(cards)) return null
  const ids = new Set(cards.map(card => card.id))
  const lists = [stored.order, stored.known, stored.again]
  if (!lists.every(list => Array.isArray(list) && list.every(id => ids.has(id)))) return null
  if (!Number.isInteger(stored.position) || stored.position < 0 || stored.position > stored.order.length) return null
  return {
    sourceFingerprint: stored.sourceFingerprint,
    direction: stored.direction === 'en' ? 'en' : 'to',
    order: [...stored.order],
    position: stored.position,
    known: [...stored.known],
    again: [...stored.again],
    finished: Boolean(stored.finished) && stored.position >= stored.order.length,
    shuffled: Boolean(stored.shuffled),
  }
}

// Decks retired in favour of a list keep their learner's progress: the first
// time the list is opened with no record of its own, it starts from the old
// deck's record, card by card (membership and order changed, so the old
// position is not reused). The old record is never changed or deleted.
export const RETIRED_DECKS = Object.freeze({
  [listDeckKey('numbers', 'all')]: globalDeckKey('all', 'numbers'),
})

// Builds a deck for `cards` from a record saved for another deck: known and
// again piles are kept for ids still in `cards` and dropped otherwise; the
// order is the new deck's own; the place is the first card not yet known.
export function carryDeck(stored, cards) {
  if (!stored || typeof stored !== 'object') return null
  const ids = new Set(cards.map(card => card.id))
  const keep = list => Array.isArray(list) ? [...new Set(list.filter(id => ids.has(id)))] : []
  const known = keep(stored.known)
  const knownSet = new Set(known)
  const again = keep(stored.again).filter(id => !knownSet.has(id))
  if (!known.length && !again.length) return null
  const deck = freshDeck(cards, stored.direction)
  const next = deck.order.findIndex(id => !knownSet.has(id))
  const position = next === -1 ? deck.order.length : next
  return { ...deck, position, known, again, finished: position >= deck.order.length }
}

export function loadDeck(deckKey, cards, storage = browserStorage()) {
  const decks = readRoot(storage).decks
  const own = decks[deckKey]
  if (own === undefined && RETIRED_DECKS[deckKey]) {
    const carried = carryDeck(decks[RETIRED_DECKS[deckKey]], cards)
    if (carried) return carried
  }
  return validStoredDeck(own, cards) || freshDeck(cards)
}

export function saveDeck(deckKey, state, storage = browserStorage()) {
  const root = readRoot(storage)
  writeRoot({ ...root, decks: { ...root.decks, [deckKey]: state } }, storage)
  return state
}

// Cards still to come in this pass of the deck, the current card included.
export function cardsLeft(state) {
  if (!state || state.finished) return 0
  return Math.max(0, state.order.length - state.position)
}

export function advanceDeck(state, pile) {
  if (state.finished || state.position >= state.order.length) return state
  const id = state.order[state.position]
  const position = state.position + 1
  return {
    ...state,
    position,
    // A card is in one pile at most (a carried-over deck can hold a known or
    // again card that comes round again).
    known: pile === 'known' ? [...state.known.filter(other => other !== id), id] : state.known.filter(other => other !== id),
    again: pile === 'again' ? [...state.again.filter(other => other !== id), id] : state.again.filter(other => other !== id),
    finished: position >= state.order.length,
  }
}

export function restartDeck(state, cards, ids = cards.map(card => card.id)) {
  const allowed = new Set(cards.map(card => card.id))
  const order = ids.filter((id, index) => allowed.has(id) && ids.indexOf(id) === index)
  return {
    ...freshDeck(cards, state.direction),
    order,
    finished: order.length === 0,
    shuffled: state.shuffled,
  }
}

export function shuffleDeck(state, cards, random = Math.random) {
  const order = cards.map(card => card.id)
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[order[index], order[other]] = [order[other], order[index]]
  }
  return { ...restartDeck(state, cards, order), shuffled: true }
}

export function useDeckProgress(deckKey, cards) {
  const [state, setState] = useState(() => loadDeck(deckKey, cards))

  const update = useCallback((change) => {
    setState(previous => {
      const next = typeof change === 'function' ? change(previous) : change
      return saveDeck(deckKey, next)
    })
  }, [deckKey])

  return [state, update]
}
