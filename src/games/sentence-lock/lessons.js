/**
 * Sentence Lock: the sentences the game plays and their lesson order (pure, no React).
 *
 * Every sentence comes from dials.json (built from the shared sentence bank by
 * build-dials.mjs, never edited by hand). A sentence is playable when at least
 * one of its dials turns; a sentence whose every word is fixed has nothing to
 * lock and is left out.
 *
 * A lesson's sentences play in bank order (the order of dials.json). No lesson
 * is ever locked: any lesson in the grid can be played.
 *
 * PILOT_LESSONS limits the game to the pilot lesson while Andrew looks at it
 * (plan 2026-10-27-sentence-lock-game, Step 5). It limits the lesson grid, the
 * Next lesson button and the count on the /games card. Step 8 removes it.
 */
import data from './dials.json'
import { maxForSentence } from './scoring.js'

export const PILOT_LESSONS = [1]

/** True when the sentence has a dial to turn. */
export function isPlayable(sentence) {
  return Array.isArray(sentence?.dials) && sentence.dials.some(d => !d.fixed)
}

/** Every playable sentence in dials.json, in bank order. */
export const ALL_SENTENCES = data.sentences.filter(isPlayable)

/** The sentences limited to a list of lessons (null for every lesson), in bank order. */
export function sentencesIn(sentences, lessons = null) {
  return lessons ? sentences.filter(s => lessons.includes(s.lesson)) : sentences
}

/** One entry per lesson with sentences: { lesson, id, label, count, max, ids }, lessons in number order. */
export function buildLessons(sentences) {
  const by = new Map()
  for (const s of sentences) {
    if (!by.has(s.lesson)) by.set(s.lesson, [])
    by.get(s.lesson).push(s)
  }
  return [...by.keys()].sort((a, b) => a - b).map(n => {
    const list = by.get(n)
    return {
      lesson: n,
      id: `lesson:${n}`,
      label: `Lesson ${n}`,
      count: list.length,
      max: list.reduce((t, s) => t + maxForSentence(s), 0),
      ids: list.map(s => s.id),
    }
  })
}

/** The sentences the game plays now (the pilot lessons only, until Step 8). */
export const SENTENCES = sentencesIn(ALL_SENTENCES, PILOT_LESSONS)
export const LESSONS = buildLessons(SENTENCES)
export const FIRST_LESSON = LESSONS[0]?.lesson ?? 1

const byId = new Map(ALL_SENTENCES.map(s => [s.id, s]))

/** The lesson's entry, or the first lesson's when `n` is not offered. */
export function lessonEntry(n, lessons = LESSONS) {
  return lessons.find(l => l.lesson === Number(n)) ?? lessons[0]
}

/** The next lesson offered after `n`, or null when `n` is the last. */
export function nextLesson(n, lessons = LESSONS) {
  return lessons.find(l => l.lesson > Number(n))?.lesson ?? null
}

/** The lesson's sentences in bank order. */
export function lessonSentences(n, lessons = LESSONS) {
  const entry = lessons.find(l => l.lesson === Number(n))
  return entry ? entry.ids.map(id => byId.get(id)).filter(Boolean) : []
}
