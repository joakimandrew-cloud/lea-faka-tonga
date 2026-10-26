/**
 * Sentence Tiles: lesson order and saved progress (pure apart from storage).
 *
 * Andrew, 2026-10-26: "have it in order of lessons. It starts too advanced."
 * Every game is one lesson. A new player starts at Lesson 1; finishing a
 * lesson moves them on to the next lesson that has sentences. Inside a game
 * the lesson's sentences come once each, in a shuffled order (the shared
 * shuffle bag), and the game ends when the last of them is built.
 *
 * Progress is kept on this device under PROGRESS_KEY as
 *   { furthest, done }
 *   furthest  the lesson to play next: one past the highest lesson finished
 *             (Lesson 1 for a new player)
 *   done      the lessons finished at least once, in order
 * Opening a lesson from the menu does not move `furthest`; finishing one does.
 */
import { makeBag, drawFromBag } from '../shared/bag.js'
import { readStore, writeStore } from '../shared/store.js'
import { SENTENCES, LESSONS, FIRST_LESSON, lessonEntry, nextLesson } from './deck.js'

export const PROGRESS_KEY = 'lft-sentence-tiles-progress'

const offered = new Set(LESSONS.map(l => l.lesson))
const byId = new Map(SENTENCES.map(s => [s.id, s]))

/** A lesson number the game offers: `n` itself, else the first offered lesson after it, else the last. */
function offeredLesson(n) {
  const v = Math.floor(Number(n))
  if (!Number.isFinite(v)) return FIRST_LESSON
  if (offered.has(v)) return v
  const after = LESSONS.find(l => l.lesson > v)
  return after ? after.lesson : (LESSONS.length ? LESSONS[LESSONS.length - 1].lesson : null)
}

/** Progress for a new player: Lesson 1, nothing finished. */
export function freshProgress() {
  return { furthest: FIRST_LESSON, done: [] }
}

/** Progress read back from stored text (anything unreadable gives a new player's progress). */
export function parseProgress(raw) {
  let v = null
  try { v = JSON.parse(raw ?? 'null') } catch { v = null }
  if (!v || typeof v !== 'object') return freshProgress()
  const done = [...new Set((Array.isArray(v.done) ? v.done : []).map(Number).filter(n => offered.has(n)))].sort((a, b) => a - b)
  const furthest = v.furthest == null ? FIRST_LESSON : offeredLesson(v.furthest)
  return { furthest: furthest ?? FIRST_LESSON, done }
}

/** Progress after finishing `lesson`: it is marked done, and `furthest` moves on to the next lesson (never back). */
export function progressAfter(progress, lesson) {
  const p = progress ?? freshProgress()
  const n = Number(lesson)
  if (!offered.has(n)) return p
  const done = [...new Set([...p.done, n])].sort((a, b) => a - b)
  const reached = nextLesson(n) ?? n
  return { furthest: Math.max(p.furthest ?? FIRST_LESSON, reached), done }
}

/** The lesson the game opens on: the furthest reached (Lesson 1 for a new player). */
export function startingLesson(progress) {
  return offeredLesson(progress?.furthest ?? FIRST_LESSON)
}

/** Progress kept on this device. */
export function loadProgress() {
  return parseProgress(readStore(PROGRESS_KEY))
}

/** Keep progress on this device. */
export function saveProgress(progress) {
  writeStore(PROGRESS_KEY, JSON.stringify({ furthest: progress.furthest, done: progress.done }))
}

/**
 * A shuffle bag holding one lesson's sentences, each once. `last` is the
 * sentence the last game ended on, so playing the lesson again does not open
 * with it.
 */
export function lessonBag(lesson, rng = Math.random, { last = null } = {}) {
  return makeBag(lessonEntry(lesson).cards.map(s => s.id), rng, { last })
}

/**
 * The lesson's next sentence: { sentence, bag }. Once every sentence of the
 * lesson has been dealt, `sentence` is null (the bag is never refilled
 * inside a game, so a game is the lesson once through).
 */
export function dealFromLesson(bag, rng = Math.random) {
  if (!bag || !bag.order.length) return { sentence: null, bag }
  const { id, bag: next } = drawFromBag(bag, rng)
  return { sentence: id == null ? null : byId.get(id) ?? null, bag: next }
}
