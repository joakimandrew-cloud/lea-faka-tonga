/**
 * Word Rain: the shuffle bag (pure, no React, randomness passed in).
 *
 * Added in Step 4 (plan 2026-10-26-word-rain-game) after Andrew found the
 * same words coming back within one game. Every word of the list is played
 * once, in random order, before any word repeats. When the bag empties it
 * refills and reshuffles, and the new round never starts with the word just
 * played. A missed word comes back once, 5 to 8 words later, and is otherwise
 * left to the bag's normal order.
 *
 * A bag is a plain object and every function returns a new one, so a draw the
 * page cannot use (a second word that would clash with the first) is simply
 * not kept.
 *   order    ids still to play this time round, next first
 *   turn     how many words have been drawn so far
 *   last     the id drawn last
 *   pending  missed words waiting to come back: [{ id, due }], where `due` is
 *            the turn at which it is next in line
 *   round    how many times the bag has been filled
 */
import { shuffle } from './rounds.js'

export const RETURN_MIN = 5
export const RETURN_MAX = 8

/** A full bag for these ids, shuffled. */
export function makeBag(ids, rng = Math.random, { last = null } = {}) {
  const unique = [...new Set(ids)]
  return { ids: unique, order: refillOrder(unique, rng, last), turn: 0, last, pending: [], round: 1 }
}

/** A fresh shuffle that does not start with `last` (when it can avoid it). */
function refillOrder(ids, rng, last) {
  const order = shuffle(ids, rng)
  if (last != null && order.length > 1 && order[0] === last) {
    const j = 1 + Math.floor(rng() * (order.length - 1))
    ;[order[0], order[j]] = [order[j], order[0]]
  }
  return order
}

/**
 * The next word. `blocked` is a set of ids that may not be drawn now (words
 * in the air, or words that would clash with one). Returns { id, bag }, or
 * { id: null, bag } (the bag unchanged) when every word is blocked.
 *
 * A missed word whose turn has come is drawn first. A word waiting to come
 * back is skipped by the normal order until then, so it is not seen twice
 * close together; once it has come back it counts as played for this round.
 */
export function drawFromBag(bag, rng = Math.random, blocked = null) {
  const isBlocked = id => !!blocked && blocked.has(id)
  const due = bag.pending.find(p => p.due <= bag.turn && !isBlocked(p.id))
  if (due) {
    return {
      id: due.id,
      bag: {
        ...bag,
        order: bag.order.filter(id => id !== due.id),
        pending: bag.pending.filter(p => p !== due),
        turn: bag.turn + 1,
        last: due.id,
      },
    }
  }
  const waiting = new Set(bag.pending.map(p => p.id))
  let { order, round } = bag
  if (!order.length) {
    // Every word has been played: refill and reshuffle.
    order = refillOrder(bag.ids, rng, bag.last)
    round += 1
  }
  let at = order.findIndex(id => !isBlocked(id) && !waiting.has(id))
  // Only words waiting to come back are left: the first comes now instead.
  if (at < 0) at = order.findIndex(id => !isBlocked(id))
  if (at < 0) return { id: null, bag }
  const id = order[at]
  return {
    id,
    bag: {
      ...bag,
      order: order.filter((_, i) => i !== at),
      pending: waiting.has(id) ? bag.pending.filter(p => p.id !== id) : bag.pending,
      turn: bag.turn + 1,
      last: id,
      round,
    },
  }
}

/**
 * A word was missed: it comes back once, as the 5th to 8th word drawn from
 * now (chosen by `rng`). A word already waiting keeps its first slot.
 */
export function missedInBag(bag, id, rng = Math.random) {
  if (id == null || bag.pending.some(p => p.id === id)) return bag
  const k = RETURN_MIN + Math.floor(rng() * (RETURN_MAX - RETURN_MIN + 1))
  return { ...bag, pending: [...bag.pending, { id, due: bag.turn + k - 1 }] }
}
