/**
 * graded-lab — round generator for the Sentence Lab's graded "Test yourself"
 * mode ("Make the sentence mean: '…'"). Pure + framework-free so it runs under
 * the node test environment and is fully unit-testable.
 *
 * The contract (review §"Sentence Lab"; NEXT.md graded-mode spec):
 *   - Targets are ENGINE-GENERATED. We pick a taught pattern, fill its required
 *     slots from the engine, assemble, and use the engine's OWN English as the
 *     target meaning. No Tongan is ever hand-authored.
 *   - Only `method === 'composed'` targets qualify (never the 'gloss' word-salad
 *     fallback, and not the 'override' table — composed is the clean, parametric
 *     path), exactly the filter the free Lab applies for its meaning line.
 *   - The seed is a DIFFERENT valid fill of the SAME pattern, and every round is
 *     VERIFIED SOLVABLE: a target-directed greedy walk must reach the target
 *     meaning from the seed by legal swaps before the round is handed out. This
 *     guarantees the learner always has a path, despite slot dependencies.
 */

import {
  getAvailableSlots,
  getOptionsForSlot,
  assembleSentence,
  validateSentence,
} from '../engine/slot-engine'
import sentencePatterns from '../data/sentence-patterns.json'
import { reconcile, englishMatches } from './lab-engine'

// Fisher-Yates over a copy (never mutates the source); rng() ∈ [0,1).
function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)]
}

// Like seedFill, but fills each required slot with a RANDOM legal option, so
// repeated calls explore the pattern's space. Returns null if it can't reach a
// valid (all-required-filled) state.
function randomValidFill(patternId, maxChapter, rng) {
  let filled = {}
  for (let i = 0; i < 16; i++) {
    if (validateSentence(patternId, filled).valid) break
    const next = getAvailableSlots(patternId, filled).find(
      (s) => s.required && !filled[s.id]
    )
    if (!next) break
    const opts = getOptionsForSlot(patternId, next.id, filled, maxChapter)
    if (!opts.length) break
    filled = { ...filled, [next.id]: pick(opts, rng) }
  }
  return validateSentence(patternId, filled).valid ? filled : null
}

// Slot ids in `filled` that have an alternative legal option (i.e. are worth
// perturbing / swapping).
function perturbableSlotIds(patternId, filled, maxChapter) {
  return Object.keys(filled).filter((id) => {
    const opts = getOptionsForSlot(patternId, id, filled, maxChapter)
    return opts.length > 1 && opts.some((o) => o.tongan !== filled[id].tongan)
  })
}

/**
 * Verify the target MEANING is reachable from the seed by legal swaps: greedily
 * nudge each slot whose value differs from the target toward the target value
 * (only when that value is currently legal), reconciling after each move, until
 * the composed English matches the target or no further progress is possible.
 * This is the solvability guarantee enforced at generation time.
 */
export function solvableTowards(patternId, seedFill, targetFill, targetEnglish, maxChapter, maxSteps = 10) {
  let cur = { ...seedFill }
  for (let step = 0; step < maxSteps; step++) {
    if (englishMatches(assembleSentence(patternId, cur).english, targetEnglish)) return true
    let moved = false
    for (const id of Object.keys(targetFill)) {
      const want = targetFill[id]
      if (!want) continue
      if (cur[id] && cur[id].tongan === want.tongan) continue
      const opts = getOptionsForSlot(patternId, id, cur, maxChapter)
      if (opts.some((o) => o.tongan === want.tongan)) {
        cur = reconcile(patternId, { ...cur, [id]: want }, maxChapter)
        moved = true
        break
      }
    }
    if (!moved) break
  }
  return englishMatches(assembleSentence(patternId, cur).english, targetEnglish)
}

/**
 * Build one graded round for a specific pattern, or null if this pattern can't
 * produce a valid, solvable, meaning-distinct round on this attempt.
 */
export function buildRoundForPattern(patternId, maxChapter, rng, perturb = 1) {
  const target = randomValidFill(patternId, maxChapter, rng)
  if (!target) return null

  const ta = assembleSentence(patternId, target)
  if (!ta || ta.method !== 'composed' || !ta.english) return null

  const ids = perturbableSlotIds(patternId, target, maxChapter)
  if (!ids.length) return null

  const chosen = shuffle(ids, rng).slice(0, Math.min(perturb, ids.length))
  let seed = { ...target }
  for (const id of chosen) {
    const alts = getOptionsForSlot(patternId, id, seed, maxChapter).filter(
      (o) => o.tongan !== target[id].tongan
    )
    if (!alts.length) continue
    seed = reconcile(patternId, { ...seed, [id]: pick(alts, rng) }, maxChapter)
  }

  const sa = assembleSentence(patternId, seed)
  if (!sa || !sa.english) return null
  // The seed must mean something DIFFERENT (synonyms can collide → reject).
  if (englishMatches(sa.english, ta.english)) return null
  // And the target meaning must be reachable from the seed by legal swaps.
  if (!solvableTowards(patternId, seed, target, ta.english, maxChapter)) return null

  return {
    patternId,
    targetFill: target,
    targetEnglish: ta.english,
    targetTongan: ta.tongan,
    seedFill: seed,
  }
}

/**
 * Generate a fresh graded round for the given chapter ceiling. Tries patterns in
 * a shuffled order (so successive rounds vary), each with a few attempts and an
 * escalating perturbation count. Returns null only if NO taught pattern can
 * yield a valid round (e.g. a chapter with no composed patterns at all).
 */
export function newRound(maxChapter, rng = Math.random, opts = {}) {
  const max = maxChapter || 53
  const candidates = sentencePatterns.patterns.filter((p) =>
    (p.book_chapters || []).every((c) => c <= max) &&
    p.slots.filter((s) => !s.locked).length >= 2
  )
  const pool = candidates.length ? candidates : sentencePatterns.patterns
  const order = shuffle(pool, rng)
  const perturbs = opts.perturb ? [opts.perturb] : [1, 1, 2]

  for (const p of order) {
    for (const k of perturbs) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const round = buildRoundForPattern(p.id, max, rng, k)
        if (round) return round
      }
    }
  }
  return null
}
