/**
 * Grading semantics for the interactive Book Exercises. Guards the owner ruling
 * (2026-06-13): ʻokina is phonemic (kept), accents are lenient (stripped),
 * markdown/case/outer-punctuation ignored, and accept-list variants pass.
 */
import { describe, it, expect } from 'vitest'
import { normalize, isCorrect } from './book-exercise-grading'

describe('normalize', () => {
  it('unifies ʻokina / apostrophe variants to one glyph', () => {
    expect(normalize('ʻalu')).toBe(normalize("'alu"))
    expect(normalize('‘alu')).toBe("'alu")
    expect(normalize('’alu')).toBe("'alu")
  })
  it('strips accents (lenient) but keeps ʻokina (phonemic)', () => {
    expect(normalize('Naʻá')).toBe("na'a")
    expect(normalize('māhina')).toBe('mahina')
    expect(normalize("'alu")).not.toBe(normalize('alu'))
  })
  it('strips markdown, case, and outer punctuation', () => {
    expect(normalize('*Kai!*')).toBe('kai')
    expect(normalize('  KAI.  ')).toBe('kai')
    expect(normalize('"Kai?"')).toBe('kai')
  })
})

describe('isCorrect', () => {
  it('accepts the canonical answer, accent-insensitive', () => {
    const item = { answer: "*Na'á nau mohe.*" }
    expect(isCorrect('naʻa nau mohe', item)).toBe(true)
    expect(isCorrect("Na'a nau mohe.", item)).toBe(true)
  })
  it('rejects a wrong word and a dropped ʻokina', () => {
    const item = { answer: "*'alu*" }
    expect(isCorrect('alu', item)).toBe(false) // ʻokina is phonemic
    expect(isCorrect('nofo', item)).toBe(false)
  })
  it('accepts an accept-list variant (e.g. Tongan-only of a compound answer)', () => {
    const item = {
      answer: "*'Oku ou fiefia 'aupito.* I am very happy.",
      accept: ["*'Oku ou fiefia 'aupito.*"],
    }
    expect(isCorrect("'Oku ou fiefia 'aupito.", item)).toBe(true)
  })
  it('returns false when there is no answer', () => {
    expect(isCorrect('anything', { answer: null })).toBe(false)
    expect(isCorrect('anything', {})).toBe(false)
  })
})
