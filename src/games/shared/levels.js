/**
 * Shared game code: levels and the speed-up (pure, no React).
 *
 * Lifted out of word-rain/levels.js and word-rain/speed.js (plan
 * 2026-10-26-games-section, Step 3) so every game levels up and speeds up the
 * same way. Word Balloons keeps its flight times exactly as before: its
 * levels.js re-exports the level count from here, and its speed curve reads
 * the same step.
 *
 * Every 8 right answers is a new level. Each level makes the game quicker by
 * three steps of the speed curve: a time is multiplied by 0.955 three times
 * (about 13% shorter) per level, and never falls under the game's own floor.
 */

export const WORDS_PER_LEVEL = 8
/** One step of the speed curve (about 4.5% quicker). */
export const PACE_STEP = 0.955
/** Steps of the curve per level. */
export const STEPS_PER_LEVEL = 3

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

/** How much of the level-1 time is left at a level: 1 at level 1, then x0.871 a level. */
export function levelPace(level) {
  return Math.pow(PACE_STEP, (Math.max(1, count(level)) - 1) * STEPS_PER_LEVEL)
}

/** A time at a level: `startMs` at level 1, quicker each level, never under `floorMs`. */
export function levelTimeMs(level, startMs, floorMs = 0) {
  return Math.max(Number(floorMs) || 0, Math.round((Number(startMs) || 0) * levelPace(level)))
}
