/**
 * Shared game code: the fair-answer rules (pure, no React).
 *
 * Moved out of word-rain/rounds.js (plan 2026-10-26-games-section, Step 1) so
 * every game that shows a right answer among distractors uses the same test
 * for "could this pass for the right answer". A distractor is never a second
 * right answer:
 *   - its shown meaning never equals the target's;
 *   - it shares no comma- or semicolon-separated meaning item with the target;
 *   - it never has the target's Tongan spelling (homographs: hiva is both
 *     "nine" and "sing", so neither may sit beside the other);
 *   - it shares no content word with the target ("sit down" is a fair
 *     translation of one meaning of nofo, "stay, sit, live"), and no two
 *     distractors share one either; applied in both directions;
 *   - it is not the singular or the source of the target, where the English
 *     note says so ("live together (plural of nofo)");
 *   - the pair is not in confusable-pairs.json, the synonyms that share no
 *     word (big and large).
 * Also here: the seeded random number generator and the shuffle every game
 * draws from.
 */
import confusable from './confusable-pairs.json' with { type: 'json' }

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
/** Entry pairs never put in one round, from confusable-pairs.json. */
export const CONFUSABLE = new Set(confusable.pairs.map(([a, b]) => pairKey(a, b)))


/** Seeded PRNG (mulberry32), so tests and the review sample can repeat. */
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * A part of speech reduced to its broad class (noun, verb, adjective,
 * adverb), so "verb phrase" and "postposed adverb" draw from the same group
 * as "verb" and "adverb" and a two-entry group is not forced into every
 * round. Anything else keeps its own string.
 */
export function posClass(pos) {
  const p = String(pos ?? '').toLowerCase()
  const m = p.match(/\b(noun|verb|adjective|adverb)\b/)
  return m ? m[1] : p
}

/** True when the two cards share a content word in any of their meanings. */
export function shareWord(a, b) {
  const words = new Set(a.words)
  return b.words.some(w => words.has(w))
}

/** True when one card is named as the source of the other in its English note. */
export function derivedPair(a, b) {
  return a.refs.includes(b.key) || b.refs.includes(a.key)
}

/** True when `other` could pass for a right answer to `target`. */
export function clashes(target, other) {
  if (other.id === target.id) return true
  if (other.tongan === target.tongan) return true
  if (other.meaning.toLowerCase() === target.meaning.toLowerCase()) return true
  const items = new Set(target.items)
  if (other.items.some(i => items.has(i))) return true
  if (shareWord(target, other)) return true
  if (derivedPair(target, other)) return true
  return CONFUSABLE.has(pairKey(target.id, other.id))
}
