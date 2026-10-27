/**
 * Sentence Lock: the "How to play" card (pure, no React).
 *
 * Andrew, 2026-10-27 (Step 6 look): "WE NEED GAME INSTRUCTIONS WHEN THE GAME
 * STARTS TO EXPLAIN HOW IT WORKS." The card shows after Play Lesson N and
 * before the first sentence, the first time on this device, and the game
 * header's "How to play" button opens it again at any time.
 *
 * The seen flag lives in localStorage under HOWTO_KEY. The page passes a
 * store ({ read(key), write(key, value) }); every call here is wrapped, so a
 * browser that refuses storage (private mode, blocked site data) shows the
 * card on each start and never throws.
 */
import { MAX_WRONG, POINTS_BY_TRY } from './scoring.js'

export const HOWTO_KEY = 'lft-sentence-lock-howto-seen'

/** True when this device has closed the card before. */
export function hasSeenHowTo(store) {
  try {
    return store?.read?.(HOWTO_KEY) === '1'
  } catch {
    return false
  }
}

/** Remembers that the card was closed. Returns false when storage refused it. */
export function markHowToSeen(store) {
  try {
    store?.write?.(HOWTO_KEY, '1')
    return true
  } catch {
    return false
  }
}

/** Whether Play should show the card before the first sentence. */
export function showHowToOnStart(store) {
  return !hasSeenHowTo(store)
}

/**
 * The card's steps, in plain English (no em dashes). The points line is
 * built from the game's own scoring table, so it never drifts from it.
 */
export function howToSteps() {
  const pts = POINTS_BY_TRY.join(', ').replace(/, (\d+)$/, ' or $1')
  const tries = ['no', 'one', 'two', 'three', 'four'][MAX_WRONG] ?? String(MAX_WRONG)
  return [
    { id: 'read', text: 'Read the English sentence at the top.' },
    { id: 'turn', text: 'Turn the open wheel to the Tongan word that fits. Tap the arrows, swipe it, use the mouse wheel, or press the up and down keys.' },
    { id: 'check', text: 'Press Check under the wheel, or press Enter.' },
    { id: 'lock', text: `A right word locks in green and the next wheel opens. A wrong word costs a try; after ${tries} wrong tries the answer is shown.` },
    { id: 'points', text: `Each word scores ${pts} points by tries. There is no clock.` },
  ]
}
