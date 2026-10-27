/**
 * Sentence Lock: points (pure).
 *
 * Andrew, 2026-10-27: "Fewer tries, more points", the answer shown after 3
 * wrong tries on one dial, no game over. A dial locked on the first try
 * scores 3, on the second 2, on the third 1; a dial whose answer is shown
 * scores 0. There are no lives and no clock.
 */

/** Points for a dial locked after this many wrong tries (index = wrong tries). */
export const POINTS_BY_TRY = [3, 2, 1]
/** Wrong tries on one dial before its answer is shown. */
export const MAX_WRONG = 3

/** Points for a dial: locked after `wrong` wrong tries, or 0 when its answer was shown. */
export function dialPoints(wrong, shown = false) {
  if (shown) return 0
  return POINTS_BY_TRY[wrong] ?? 0
}

/** The most a sentence can score: 3 for every dial that turns. */
export function maxForSentence(sentence) {
  return (sentence?.dials ?? []).filter(d => !d.fixed).length * POINTS_BY_TRY[0]
}
