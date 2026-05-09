/**
 * Tests for pronoun-resolver's tense marker resolution.
 * Regression guard: the "future" tense marker was stored as "future (will do)"
 * in grammar-graph.json but pronoun-resolver only looked for the bare label
 * "future", causing Guided Build to silently freeze when the user picked Future.
 */
import { describe, it, expect } from 'vitest'
import { resolveTenseMarker, buildPreSeededSteps } from './pronoun-resolver.js'

describe('resolveTenseMarker', () => {
  it('resolves past → Naʻa in the statement flow', () => {
    const result = resolveTenseMarker('past', 'statement')
    expect(result).not.toBeNull()
    expect(result.tongan).toBe('Naʻa')
  })

  it('resolves present → ʻOku in the statement flow', () => {
    const result = resolveTenseMarker('present', 'statement')
    expect(result).not.toBeNull()
    expect(result.tongan).toBe('ʻOku')
  })

  it('resolves perfect → Kuo (label stored as "perfect (has done)")', () => {
    const result = resolveTenseMarker('perfect', 'statement')
    expect(result).not.toBeNull()
    expect(result.tongan).toBe('Kuo')
  })

  it('resolves future → Te (label stored as "future (will do)")', () => {
    // Regression: this used to return null because the resolver only looked
    // for w.english === 'future' and missed 'future (will do)'.
    const result = resolveTenseMarker('future', 'statement')
    expect(result).not.toBeNull()
    expect(result.tongan).toBe('Te')
  })

  it('returns null for an unknown tense', () => {
    expect(resolveTenseMarker('pluperfect', 'statement')).toBeNull()
  })
})

describe('buildPreSeededSteps for future tense', () => {
  it('produces Te + u for 1st-person singular future', () => {
    const built = buildPreSeededSteps('statement', 'future', 1, 'singular', false)
    expect(built).not.toBeNull()
    expect(built.steps.length).toBeGreaterThanOrEqual(2)
    expect(built.steps[0].word.tongan).toBe('Te')
    expect(built.steps[1].word.tongan).toBe('u')
  })
})
