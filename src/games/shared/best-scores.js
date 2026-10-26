/**
 * Shared game code: best scores kept on this device (no React).
 *
 * Moved out of pages/WordRain.jsx unchanged. One storage key per game holds
 * an object of best scores by list key: { "<list key>": { score, level } }.
 * Word Balloons keeps its own key, 'lft-word-rain-best', exactly as before,
 * so saved best scores survive; a new game passes its own key.
 */
import { readStore, writeStore } from './store.js'

/** The whole saved object for a game's storage key ({} if none or unreadable). */
export function readBests(storageKey) {
  try {
    const v = JSON.parse(readStore(storageKey) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

/**
 * The best for one list key as { score, level }. A list with nothing kept
 * yet reads the best kept under any of its `oldKeys` (a function from the key
 * to older keys; none by default).
 */
export function bestOf(bests, key, oldKeys = () => []) {
  let b = bests?.[key]
  if (!b) for (const old of oldKeys(key)) { if (bests?.[old]) { b = bests[old]; break } }
  return { score: Math.max(0, Number(b?.score) || 0), level: Math.max(0, Number(b?.level) || 0) }
}

/**
 * Keep a finished game's result if it beats the best for the list. Writes to
 * storage and returns { next, newBest, prev }: the new whole object, whether
 * the score is a new best, and the previous best score.
 */
export function recordBest(storageKey, bests, key, { score, level }, oldKeys = () => []) {
  const prev = bestOf(bests, key, oldKeys)
  const newBest = score > prev.score
  const next = { ...bests, [key]: { score: Math.max(prev.score, score), level: Math.max(prev.level, level) } }
  writeStore(storageKey, JSON.stringify(next))
  return { next, newBest, prev: prev.score }
}
