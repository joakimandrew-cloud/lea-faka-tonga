/**
 * lab-engine — the pure, engine-adjacent helpers shared by the Sentence Lab's
 * free "Explore" mode (SentenceLabCore) and its graded "Test yourself" mode
 * (graded-lab.js). Extracted verbatim from the shipped SentenceLabCore so the
 * free Lab's behaviour is unchanged; kept framework-free so it runs under the
 * node test environment.
 *
 * Engine reuse only (zero engine changes — review §"Sentence Lab"):
 *   - assembleSentence(patternId, filledSlots) → {tongan, english, method, parts}
 *   - getOptionsForSlot(patternId, slotId, filledSlots, maxChapter) → alternatives
 */

import {
  getAvailableSlots,
  getOptionsForSlot,
  assembleSentence,
  validateSentence,
} from '../engine/slot-engine'
import sentencePatterns from '../data/sentence-patterns.json'

export function getPatternById(patternId) {
  return sentencePatterns.patterns.find((p) => p.id === patternId) || null
}

// Pick a fully-taught pattern for this chapter that produces a NATURAL English
// translation (not the word-by-word `gloss` fallback — that would make the
// "meaning" line read like word salad). Among those, prefer the richest (most
// slots to swap). No chapterNum (standalone /drill) → the whole catalogue is
// eligible. Falls back to the richest taught pattern if none translate cleanly.
export function translatesNaturally(patternId, maxChapter) {
  const seed = seedFill(patternId, maxChapter)
  const a = assembleSentence(patternId, seed)
  return !!(a && a.english && a.method !== 'gloss')
}

export function pickPattern(chapterNum) {
  const max = chapterNum || 53
  const taught = sentencePatterns.patterns.filter(
    (p) => (p.book_chapters || []).every((c) => c <= max)
  )
  const pool = taught.length ? taught : sentencePatterns.patterns
  const byRichness = (a, b) =>
    b.slots.length - a.slots.length ||
    Math.max(...(b.book_chapters || [0])) - Math.max(...(a.book_chapters || [0]))
  const natural = pool.filter((p) => translatesNaturally(p.id, max)).sort(byRichness)
  return natural[0] || [...pool].sort(byRichness)[0]
}

// Greedily fill every required slot with its first legal option → a complete,
// engine-valid sentence to start from.
export function seedFill(patternId, maxChapter) {
  let filled = {}
  for (let i = 0; i < 16; i++) {
    if (validateSentence(patternId, filled).valid) break
    const next = getAvailableSlots(patternId, filled).find(
      (s) => s.required && !filled[s.id]
    )
    if (!next) break
    const opts = getOptionsForSlot(patternId, next.id, filled, maxChapter)
    if (!opts.length) break
    filled = { ...filled, [next.id]: opts[0] }
  }
  return filled
}

// After a swap, keep the sentence complete: re-fill any dependent slot whose
// current value is no longer legal with its first valid option.
export function reconcile(patternId, filled, maxChapter) {
  let next = { ...filled }
  for (let pass = 0; pass < 4; pass++) {
    let changed = false
    for (const id of Object.keys(next)) {
      const opts = getOptionsForSlot(patternId, id, next, maxChapter)
      if (!opts.length) { delete next[id]; changed = true; continue }
      if (!opts.some((o) => o.tongan === next[id].tongan)) {
        next[id] = opts[0]; changed = true
      }
    }
    if (!changed) break
  }
  return next
}

// ---------------------------------------------------------------------------
// English comparison (graded mode) — both sides are engine-generated English,
// so a light normalise (case, trailing punctuation, whitespace) is enough to
// compare a learner's composed meaning to the target meaning. The engine's
// English is the ground truth on BOTH sides (no hand-authored strings).
// ---------------------------------------------------------------------------

export function normalizeEnglish(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[.?!,;:"'‘’“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function englishMatches(a, b) {
  return normalizeEnglish(a) === normalizeEnglish(b)
}

// English flattens Tongan's pronoun system: a bare "we" hides dual-vs-plural and
// inclusive-vs-exclusive, and "you" hides one-vs-two-vs-many. In the graded Lab
// the learner must build ONE exact pronoun from an English target, so we spell
// out the distinction the gloss drops (e.g. "we" = mautolu vs tautolu vs maua…).
// Returns null when the English is already exact (1sg "I", 3sg "he/she").
// Keyed off the subject option's person / number / pronoun_code.
export function pronounClarification(subject) {
  if (!subject || subject.person == null) return null
  const { person, number } = subject
  const count =
    number === 'dual' ? 'exactly two people'
    : number === 'plural' ? 'three or more people'
    : 'one person'
  if (person === 1) {
    if (number === 'singular') return null
    const inclusive = (subject.pronoun_code || '').includes('inc')
    return `Here "we" means ${count}, ${inclusive ? 'including' : 'NOT including'} the person you are speaking to.`
  }
  if (person === 2) return `Here "you" means ${count}.`
  if (person === 3 && number !== 'singular') return `Here "they" means ${count}.`
  return null
}
