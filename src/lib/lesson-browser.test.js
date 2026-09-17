import { describe, expect, it } from 'vitest'
import chapters from '../data/chapters.json'
import {
  filterLessons,
  groupLessons,
  LESSON_GROUPS,
  LESSON_TIERS,
  resolveOpenGroupKeys,
  splitMixedTonganText,
} from './lesson-browser'

describe('lesson browser course structure', () => {
  it('keeps all 52 source lessons in their established order and groups', () => {
    expect(chapters).toHaveLength(52)
    expect(chapters.map(lesson => lesson.chapter)).toEqual(
      Array.from({ length: 52 }, (_, index) => index + 1),
    )

    const grouped = groupLessons(chapters)
    expect(LESSON_GROUPS.map(group => grouped[group.key].length)).toEqual([6, 8, 6, 10, 10, 12])
  })

  it('derives truthful level totals from the source groups', () => {
    expect(LESSON_TIERS.map(tier => filterLessons(chapters, { level: tier.key }).length))
      .toEqual([20, 20, 12])
  })

  it('matches both ASCII apostrophes and the canonical fakauʻa', () => {
    const ascii = filterLessons(chapters, { query: "'oku" }).map(lesson => lesson.chapter)
    const canonical = filterLessons(chapters, { query: 'ʻoku' }).map(lesson => lesson.chapter)
    expect(ascii.length).toBeGreaterThan(0)
    expect(ascii).toEqual(canonical)
  })

  it('combines level and text filters without inflating the result count', () => {
    const results = filterLessons(chapters, { query: 'possessive', level: 'intermediate' })
    expect(results.map(lesson => lesson.chapter)).toEqual([29, 37])
  })
})

describe('mixed Tongan text segmentation', () => {
  it('preserves every source character while marking embedded course terms', () => {
    const source = 'Instrumental ʻaki and suffix -ʻi; fe-...-ʻaki and faka-.'
    const segments = splitMixedTonganText(source)
    expect(segments.map(segment => segment.text).join('')).toBe(source)
    expect(segments.filter(segment => segment.tongan).map(segment => segment.text))
      .toEqual(['ʻaki', '-ʻi', 'fe-...-ʻaki', 'faka-'])
  })

  it('marks the complete Tongan terms in lesson topics', () => {
    expect(splitMixedTonganText('Who? (ko hai) and where? (ko fe)')
      .filter(segment => segment.tongan)
      .map(segment => segment.text))
      .toEqual(['ko', 'hai', 'ko', 'fe'])
  })

  it('uses a narrow gloss vocabulary so English “he” stays English', () => {
    const english = splitMixedTonganText('When did he/she arrive?', 'gloss')
    expect(english.some(segment => segment.tongan)).toBe(false)

    const mixed = splitMixedTonganText('The water is lukewarm. (from māfana = warm)', 'gloss')
    expect(mixed.map(segment => segment.text).join('')).toBe('The water is lukewarm. (from māfana = warm)')
    expect(mixed.filter(segment => segment.tongan).map(segment => segment.text)).toEqual(['māfana'])
  })
})

describe('native disclosure state', () => {
  it('does not overwrite manual choices when search temporarily forces matches open', () => {
    const manual = new Set(['foundations'])
    const duringSearch = resolveOpenGroupKeys(manual, ['advanced-patterns'], true)
    const afterClear = resolveOpenGroupKeys(manual, ['advanced-patterns'], false)

    expect([...duringSearch]).toEqual(['foundations', 'advanced-patterns'])
    expect([...afterClear]).toEqual(['foundations'])
    expect([...manual]).toEqual(['foundations'])
  })
})
