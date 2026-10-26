/**
 * Word Rain: scoring (pure, no React).
 *
 * A right answer is worth a base of 10 points, 2 more for every level past the
 * first, plus a speed bonus of up to 10 for tapping early in the word's
 * flight (the bonus shrinks to 0 as the word reaches the far edge). The total
 * is then multiplied by the streak multiplier: x2 from 5 right in a row, x3
 * from 10, x4 from 20. A miss or a wrong answer resets the streak, so the
 * multiplier drops back to x1. Points are never negative and always whole.
 */

export const BASE_POINTS = 10
export const LEVEL_POINTS = 2
export const SPEED_BONUS = 10

/** [streak at least, multiplier], highest first. */
export const MULTIPLIER_STEPS = Object.freeze([
  Object.freeze([20, 4]),
  Object.freeze([10, 3]),
  Object.freeze([5, 2]),
])

function count(n) {
  const v = Math.floor(Number(n))
  return Number.isFinite(v) && v > 0 ? v : 0
}

/** The multiplier for a streak of `streak` right answers in a row. */
export function multiplierFor(streak) {
  const s = count(streak)
  for (const [from, mult] of MULTIPLIER_STEPS) if (s >= from) return mult
  return 1
}

/** The streak at which the next multiplier starts, or null at the top. */
export function nextMultiplierAt(streak) {
  const s = count(streak)
  const ahead = [...MULTIPLIER_STEPS].reverse().find(([from]) => from > s)
  return ahead ? ahead[0] : null
}

/**
 * Speed bonus: SPEED_BONUS when tapped the moment the word appears, falling
 * evenly to 0 at the far edge. Bad or missing timings score no bonus.
 */
export function speedBonus(elapsedMs, durationMs) {
  const d = Number(durationMs)
  const e = Number(elapsedMs)
  if (!Number.isFinite(d) || d <= 0 || !Number.isFinite(e)) return 0
  const left = Math.min(1, Math.max(0, 1 - e / d))
  return Math.round(SPEED_BONUS * left)
}

/**
 * Points for one right answer. `streak` is the streak including this answer
 * (the 5th right answer in a row is the first one scored at x2).
 */
export function pointsFor({ elapsedMs, durationMs, streak = 1, level = 1 } = {}) {
  const lvl = Math.max(1, count(level))
  const base = BASE_POINTS + LEVEL_POINTS * (lvl - 1) + speedBonus(elapsedMs, durationMs)
  return Math.max(0, Math.round(base * multiplierFor(streak)))
}
