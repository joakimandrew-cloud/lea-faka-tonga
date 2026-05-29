import { describe, it, expect } from 'vitest'
import {
  createMultiWalker,
  getFirstWordOptions,
  pickFirstWord,
  getCurrentOptions,
  pickWord,
  pickExtension,
} from './multi-walker'
import { getLivePreview } from './sentence-preview'

// Drive a fresh walker to "Naʻa" (a past-tense marker).
function startNaa(chapter = 53) {
  const s = createMultiWalker(chapter)
  const naa = getFirstWordOptions(s).groups
    .flatMap(g => g.words)
    .find(item => item.word.tongan === 'Naʻa')
  return pickFirstWord(s, naa)
}

describe('sentence-preview: getLivePreview', () => {
  it('returns empty for a state with no walkers', () => {
    expect(getLivePreview(createMultiWalker(53))).toBe('')
    expect(getLivePreview(null)).toBe('')
    expect(getLivePreview({ walkers: [] })).toBe('')
  })

  it('"Naʻa" → "Past tense"', () => {
    expect(getLivePreview(startNaa())).toBe('Past tense')
  })

  it('"Naʻa ku" → "Past tense, I" (slot list before a verb lands)', () => {
    let s = startNaa()
    const ku = getCurrentOptions(s).words.find(w => w.tongan === 'ku')
    s = pickWord(s, ku)
    expect(getLivePreview(s)).toBe('Past tense, I')
  })

  it('"Naʻa ku kai" → "I ate" (delegates to the real translator once complete)', () => {
    let s = startNaa()
    const ku = getCurrentOptions(s).words.find(w => w.tongan === 'ku')
    s = pickWord(s, ku)
    s = pickExtension(s, 'verb')
    const kai = getCurrentOptions(s).words.find(w => w.tongan === 'kai')
    s = pickWord(s, kai)
    // The preview agrees with what the finished screen would show, minus the
    // trailing period.
    expect(getLivePreview(s)).toBe('I ate')
  })
})
