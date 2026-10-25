/**
 * Word Rain: the speed curve (pure).
 *
 * How long one word takes to cross the play area, in milliseconds. It starts
 * slow, quickens by about 4.5% a point, and never drops under 3 s, so a word
 * is always on screen long enough to read and answer.
 */
export const START_MS = 7000
export const FLOOR_MS = 3000
export const STEP = 0.955

export function flightMs(score) {
  const s = Math.max(0, Number(score) || 0)
  return Math.max(FLOOR_MS, Math.round(START_MS * Math.pow(STEP, s)))
}
