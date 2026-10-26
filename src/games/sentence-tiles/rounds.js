/**
 * Sentence Tiles: one round (pure, no React, randomness passed in).
 *
 * A round is one sentence: its words as tiles in a shuffled order, and the
 * time the player has to put them in the book's order. Two tiles that are the
 * same word (the same text) are interchangeable, so the right next tile is
 * any tile whose text is the next word of the sentence.
 */
import { shuffle } from '../shared/fair.js'
import { levelTimeMs } from '../shared/levels.js'

/** Time for a sentence at level 1: a base to read the English, plus a share per tile. */
export const ROUND_BASE_MS = 4000
export const ROUND_PER_TILE_MS = 2000
/** The quickest a sentence ever gets: half the level-1 time. */
export const FLOOR_BASE_MS = 2000
export const FLOOR_PER_TILE_MS = 1000

/** The time to build a sentence of `tiles` tiles at a level (shared speed-up, with a floor). */
export function roundMs(tiles, level = 1) {
  const n = Math.max(1, Number(tiles) || 1)
  return levelTimeMs(level, ROUND_BASE_MS + ROUND_PER_TILE_MS * n, FLOOR_BASE_MS + FLOOR_PER_TILE_MS * n)
}

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

/** A round for a sentence: { sentence, tiles, durationMs }. */
export function makeRound(sentence, rng = Math.random, { level = 1 } = {}) {
  return { sentence, tiles: makeTiles(sentence, rng), durationMs: roundMs(sentence.words.length, level) }
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
