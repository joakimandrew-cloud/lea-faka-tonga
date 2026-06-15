/**
 * Data integrity for the interactive Book-Exercise types. The renderer trusts
 * these invariants (BookExercises.jsx): matching is a clean bijection, every
 * MCQ item carries book-sourced options that include its correct answer, and
 * every transform item is answerable. The counts guard against silent drift if
 * the book or the extractor changes.
 */
import { describe, it, expect } from 'vitest'
import data from './book-exercises.json'
import { normalize } from '../components/book-exercise-grading'

const allExercises = Object.values(data).flat()
const ofType = (type) => allExercises.filter((ex) => ex.type === type)
const byId = (id) => allExercises.find((ex) => ex.id === id)

describe('classification', () => {
  it('has the expected interactive-type counts', () => {
    expect(ofType('matching').length).toBe(10)
    expect(ofType('mcq').length).toBe(7)
    expect(ofType('transform').length).toBe(14)
  })

  it('keeps the categorization/echo and compare exercises on reveal', () => {
    expect(byId('ch53-ex1').type).toBe('free') // "identify the respect level" — echo, not a pairing
    expect(byId('ch46-ex5').type).toBe('free') // "explain the difference" — compare, not pick-one
  })
})

describe('matching is a clean bijection', () => {
  for (const ex of ofType('matching')) {
    it(`${ex.id}: >=2 items, all answered, distinct non-echo rights`, () => {
      expect(ex.items.length).toBeGreaterThanOrEqual(2)
      expect(ex.items.every((it) => it.answer)).toBe(true)
      const rights = ex.items.map((it) => normalize(it.answer))
      expect(new Set(rights).size).toBe(rights.length)
      const echo = ex.items.filter(
        (it) => normalize(it.prompt) && normalize(it.answer).startsWith(normalize(it.prompt))
      ).length
      expect(echo).toBeLessThanOrEqual(ex.items.length / 2)
    })
  }
})

describe('mcq carries book-sourced options', () => {
  for (const ex of ofType('mcq')) {
    it(`${ex.id}: every item has >=2 options including its correct one`, () => {
      for (const it of ex.items) {
        expect(Array.isArray(it.options)).toBe(true)
        expect(it.options.length).toBeGreaterThanOrEqual(2)
        expect(it.options).toContain(it.correct)
      }
    })
  }
})

describe('transform is answerable', () => {
  for (const ex of ofType('transform')) {
    it(`${ex.id}: every item has an answer`, () => {
      expect(ex.items.every((it) => it.answer)).toBe(true)
    })
  }
})
