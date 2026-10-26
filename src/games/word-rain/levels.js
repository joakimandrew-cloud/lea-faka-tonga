/**
 * Word Rain: levels and the second word in the air (pure, no React).
 *
 * Every 8 right answers is a new level. Each level makes a word cross the sky
 * faster, using Step 1's speed curve (speed.js) three points per level, so the
 * 3 s floor still holds. The sky shifts with the level up to level 7, and the
 * clouds drift faster.
 *
 * From level 3 a second word may enter while the first is still in the air,
 * once the first has travelled part of the way (the stagger). The answer
 * buttons always belong to the word further along (the front word: the lower
 * raindrop, the higher balloon). The second word is chosen so it never shares
 * a target with the front word and never appears in the front word's answer
 * set, and the front word never appears in the second word's set. Its flight
 * is stretched, when needed, so it reaches the edge at least GAP_MS after the
 * front word: two straight-line flights that start in that order and finish
 * in that order never cross, so the front word stays the front word.
 */
import { flightMs, FLOOR_MS } from './speed.js'
import { clashes, makeRound } from './rounds.js'

export const WORDS_PER_LEVEL = 8
export const SKY_LEVELS = 7
export const TWO_AT_ONCE_FROM = 3
export const MAX_IN_AIR = 2
export const GAP_MS = 900

function count(n) {
  const v = Math.floor(Number(n))
  return Number.isFinite(v) && v > 0 ? v : 0
}

/** The level after `correct` right answers: 0-7 is level 1, 8-15 level 2. */
export function levelFor(correct) {
  return 1 + Math.floor(count(correct) / WORDS_PER_LEVEL)
}

/** True when the answer that took `before` to `after` started a new level. */
export function isLevelUp(before, after) {
  return levelFor(after) > levelFor(before)
}

/** Right answers still needed for the next level. */
export function toNextLevel(correct) {
  const c = count(correct)
  return WORDS_PER_LEVEL - (c % WORDS_PER_LEVEL)
}

/** How long one word takes to cross the sky at a level (never under 3 s). */
export function levelFlightMs(level) {
  return flightMs((Math.max(1, count(level)) - 1) * 3)
}

/** The sky's step, 1 to SKY_LEVELS (it stops changing after level 7). */
export function skyStep(level) {
  return Math.min(SKY_LEVELS, Math.max(1, count(level)))
}

/** Cloud drift speed relative to level 1. */
export function cloudRate(level) {
  return 1 + 0.3 * (skyStep(level) - 1)
}

/** How far (0-1) the front word must travel before a second may enter. */
export function staggerFor(level) {
  const l = count(level)
  if (l < TWO_AT_ONCE_FROM) return Infinity
  if (l === TWO_AT_ONCE_FROM) return 0.55
  if (l === TWO_AT_ONCE_FROM + 1) return 0.5
  return 0.42
}

/**
 * May a second word enter now? Only from level 3, only when exactly one word
 * is in the air, and only once that word is past the stagger point.
 */
export function canLaunchSecond({ level, inAir, frontProgress }) {
  if (count(inAir) !== 1) return false
  const p = Number(frontProgress)
  return Number.isFinite(p) && p >= staggerFor(level)
}

/**
 * The second word's flight: the level's own time, or longer when needed so
 * it lands at least `gapMs` after the front word (which has
 * `frontRemainingMs` to go).
 */
export function secondFlightMs(baseMs, frontRemainingMs, gapMs = GAP_MS) {
  const base = Math.max(FLOOR_MS, Number(baseMs) || 0)
  const rest = Math.max(0, Number(frontRemainingMs) || 0)
  return Math.max(base, Math.round(rest + gapMs))
}

/** A horizontal place (0-1) for the second word, in the half away from the front word. */
export function followerX(frontX, rng = Math.random) {
  const fx = Math.min(1, Math.max(0, Number(frontX) || 0))
  const r = rng()
  return fx < 0.5 ? 0.55 + r * 0.45 : r * 0.45
}

/**
 * A round for a second word while `front` (a round from makeRound) is in the
 * air. Its target never clashes with the front target or with any of the
 * front's options, and its options never include the front target or a word
 * that could pass for it. Returns null if the deck cannot supply one (the
 * game then waits for the front word to clear).
 */
export function makeFollowerRound(deck, rng, front, { direction = 'to-english', optionCount = 4, recent = [] } = {}) {
  if (!front) return null
  const blocked = new Set(recent)
  for (const c of deck) {
    if (clashes(front.target, c) || front.options.some(o => clashes(o, c))) blocked.add(c.id)
  }
  if (blocked.size >= deck.length) return null
  for (let tries = 0; tries < 40; tries++) {
    const r = makeRound(deck, rng, { direction, optionCount, avoid: blocked })
    if (blocked.has(r.target.id)) continue
    if (r.options.some(o => clashes(front.target, o))) continue
    return r
  }
  return null
}
