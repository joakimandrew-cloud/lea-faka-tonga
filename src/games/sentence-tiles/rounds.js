/**
 * Sentence Tiles: one round (pure, no React, randomness passed in).
 *
 * A round is one sentence: its words as tiles in a shuffled order, to put in
 * the book's order. There is no clock (Andrew, 2026-10-26: "this game should
 * not be timed"): a round lasts until the sentence is built. Two tiles that
 * are the same word (the same text) are interchangeable, so the right next
 * tile is any tile whose text is the next word of the sentence.
 */
import { shuffle } from '../shared/fair.js'

/** True when the tiles, read in this order, spell the sentence. */
function inOrder(tiles, sentence) {
  return ordersOf(sentence).some(words => tiles.every((t, i) => t.text === words[i]))
}

/**
 * The tiles of a sentence in a shuffled order: [{ slot, text }], where `slot`
 * is the place the tile is shown in (0 first). The order is never already the
 * sentence when another order exists.
 */
export function makeTiles(sentence, rng = Math.random) {
  const base = sentence.words.map(text => ({ text }))
  let order = shuffle(base, rng)
  for (let tries = 0; tries < 20 && inOrder(order, sentence); tries++) order = shuffle(base, rng)
  if (inOrder(order, sentence) && new Set(sentence.words).size > 1) order = [...order.slice(1), order[0]]
  return order.map((t, slot) => ({ slot, text: t.text }))
}

/** A round for a sentence: { sentence, tiles }. No time is set: a round has no clock. */
export function makeRound(sentence, rng = Math.random) {
  return { sentence, tiles: makeTiles(sentence, rng) }
}

/** A sentence's accepted word orders (the book's first), or just its words. */
function ordersOf(sentence) {
  return sentence.orders?.length ? sentence.orders : [sentence.words]
}

/**
 * True when tile text `text` is a right next pick after `placed`. `placed` is
 * the list of words already placed, in order (a right next pick continues one
 * of the accepted orders), or a count (any accepted order has `text` there).
 */
export function isNextWord(sentence, placed, text) {
  const orders = ordersOf(sentence)
  if (Array.isArray(placed)) {
    const n = placed.length
    return orders.some(o => n < o.length && o[n] === text && placed.every((w, i) => o[i] === w))
  }
  return orders.some(o => placed < o.length && o[placed] === text)
}

/**
 * Every order of tile slots that builds the sentence in an accepted word order
 * (identical tiles swap freely), as arrays of slots. Capped at `max` orders.
 */
export function acceptedOrders(sentence, tiles, max = 50) {
  const out = []
  for (const words of ordersOf(sentence)) {
    const used = new Array(tiles.length).fill(false)
    const path = []
    const walk = (i) => {
      if (out.length >= max) return
      if (i === words.length) { out.push([...path]); return }
      for (const t of tiles) {
        if (used[t.slot] || t.text !== words[i]) continue
        used[t.slot] = true
        path.push(t.slot)
        walk(i + 1)
        path.pop()
        used[t.slot] = false
      }
    }
    walk(0)
  }
  return out
}

/**
 * The accepted order the placed words follow (its index in `orders`): the
 * book's order while it still fits, else the first second order that does.
 * `placed` is the list of words already placed, in order.
 */
export function orderIndexFor(sentence, placed = []) {
  const orders = ordersOf(sentence)
  const i = orders.findIndex(o => placed.length <= o.length && placed.every((w, j) => o[j] === w))
  return i < 0 ? 0 : i
}

/** The clue label for each place in the line, for the order the placed words follow. */
export function cluesFor(sentence, placed = []) {
  const k = orderIndexFor(sentence, placed)
  const list = sentence.roles?.[k] ?? sentence.roles?.[0]
  return sentence.words.map((_, i) => list?.[i] ?? null)
}

/**
 * The tile a fill-in places: the next word of the order the placed words
 * follow, as the first tile not yet used that shows it. Null when the
 * sentence is complete. `placedSlots` are the slots already in the line.
 */
export function fillSlot(sentence, tiles, placedSlots = []) {
  const placedWords = placedSlots.map(sl => tiles.find(t => t.slot === sl)?.text)
  const order = ordersOf(sentence)[orderIndexFor(sentence, placedWords)]
  const word = order[placedSlots.length]
  if (word == null) return null
  const tile = tiles.find(t => t.text === word && !placedSlots.includes(t.slot))
  return tile ? tile.slot : null
}
