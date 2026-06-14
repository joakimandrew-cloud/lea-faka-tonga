/**
 * graded-lab — the Sentence Lab's graded "Test yourself" round generator.
 *
 * These assertions guard the contract the UI depends on: every generated round
 * is engine-generated, has a `composed` target, means something DIFFERENT from
 * its seed, and is provably solvable by legal chip swaps. The engine's own
 * English is ground truth on both sides — no Tongan is hand-authored here.
 */
import { describe, it, expect } from 'vitest'
import { newRound, buildRoundForPattern, solvableTowards } from './graded-lab'
import { normalizeEnglish, englishMatches, reconcile } from './lab-engine'
import { assembleSentence, getOptionsForSlot } from '../engine/slot-engine'

// deterministic rng so a failure is reproducible
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Simulate a learner solving the round using only legal options + reconcile —
// exactly the moves the UI's ChipRow allows.
function simulateSolve(round, maxChapter) {
  let cur = { ...round.seedFill }
  for (let step = 0; step < 12; step++) {
    if (englishMatches(assembleSentence(round.patternId, cur).english, round.targetEnglish)) return true
    let moved = false
    for (const id of Object.keys(round.targetFill)) {
      const want = round.targetFill[id]
      if (cur[id] && cur[id].tongan === want.tongan) continue
      const opts = getOptionsForSlot(round.patternId, id, cur, maxChapter)
      if (opts.some((o) => o.tongan === want.tongan)) {
        cur = reconcile(round.patternId, { ...cur, [id]: want }, maxChapter)
        moved = true
        break
      }
    }
    if (!moved) break
  }
  return englishMatches(assembleSentence(round.patternId, cur).english, round.targetEnglish)
}

describe('graded-lab: English comparison', () => {
  it('normalises case, trailing punctuation, and whitespace', () => {
    expect(normalizeEnglish('“Let me help.”')).toBe('let me help')
    expect(englishMatches('I must return.', 'i must return')).toBe(true)
    expect(englishMatches('Did you eat?', 'did  you   eat')).toBe(true)
  })
  it('keeps genuinely different meanings distinct', () => {
    expect(englishMatches('I must return.', 'I must sleep.')).toBe(false)
    expect(englishMatches('Did you eat?', 'You ate.')).toBe(false)
  })
})

describe('graded-lab: newRound produces valid, solvable rounds', () => {
  const CEILINGS = [19, 35, 38, 42, 46, 53]
  for (const max of CEILINGS) {
    it(`Ch≤${max}: 40 rounds are composed, meaning-distinct, and solvable`, () => {
      const rng = mulberry32(500 + max)
      let made = 0
      for (let i = 0; i < 40; i++) {
        const round = newRound(max, rng)
        if (!round) continue
        made++
        const ta = assembleSentence(round.patternId, round.targetFill)
        const sa = assembleSentence(round.patternId, round.seedFill)
        expect(ta.method).toBe('composed')            // never gloss/override
        expect(ta.english).toBeTruthy()
        expect(round.targetEnglish).toBe(ta.english)  // target is the engine's own English
        expect(englishMatches(sa.english, round.targetEnglish)).toBe(false) // seed differs
        expect(solvableTowards(round.patternId, round.seedFill, round.targetFill, round.targetEnglish, max)).toBe(true)
        expect(simulateSolve(round, max)).toBe(true)  // a learner can actually reach it
      }
      expect(made).toBeGreaterThan(30)                // newRound reliably yields rounds
    })
  }
})

describe('graded-lab: per-pattern generation', () => {
  it('builds a solvable round for the Ch 38 optative pattern (s43)', () => {
    const rng = mulberry32(99)
    let round = null
    for (let a = 0; a < 12 && !round; a++) {
      round = buildRoundForPattern('s43', 38, rng, 1) || buildRoundForPattern('s43', 38, rng, 2)
    }
    expect(round).toBeTruthy()
    expect(assembleSentence('s43', round.targetFill).method).toBe('composed')
    expect(englishMatches(assembleSentence('s43', round.seedFill).english, round.targetEnglish)).toBe(false)
    expect(simulateSolve(round, 38)).toBe(true)
  })
})

describe('graded-lab: solvableTowards rejects an unreachable target', () => {
  it('returns false when the target English can never be produced', () => {
    const rng = mulberry32(3)
    let round = null
    for (let a = 0; a < 20 && !round; a++) round = newRound(53, rng)
    expect(round).toBeTruthy()
    // A target English that the engine never emits is, by construction, unreachable.
    expect(
      solvableTowards(round.patternId, round.seedFill, round.targetFill, 'this is not a tongan sentence meaning', 53)
    ).toBe(false)
  })
})
