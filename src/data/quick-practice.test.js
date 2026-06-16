/**
 * Data integrity for the mid-chapter Quick Practice blocks (quick-practice.json,
 * built by scripts/extract-quick-practice.mjs and rendered by QuickPractice.jsx
 * with the shared exercise widgets). Mirrors book-exercises.test.js: the
 * renderer trusts that matching is a clean bijection, every MCQ item carries
 * book-sourced options including its correct answer, and every item is
 * answerable. The counts encode the judge-verified 2026-06-17 decision
 * (audits/quick-practice-decision.md) and guard against silent drift.
 */
import { describe, it, expect } from 'vitest'
import data from './quick-practice.json'
import { normalize } from '../components/book-exercise-grading'

const allBlocks = Object.values(data).flat()
const ofType = (type) => allBlocks.filter((b) => b.type === type)

describe('quick-practice decision (judge-verified 2026-06-17)', () => {
  it('keeps 15 blocks: 10 reveal + 4 mcq + 1 matching', () => {
    expect(allBlocks.length).toBe(15)
    expect(ofType('reveal').length).toBe(10)
    expect(ofType('mcq').length).toBe(4)
    expect(ofType('matching').length).toBe(1)
  })

  it('Ch11 has no mid-chapter block (moved into end-of-chapter Ex 5)', () => {
    expect(data['11']).toBeUndefined()
  })

  it('the 9 source chapters are 5,14,15,19,22,27,40,41 (no 11)', () => {
    expect(Object.keys(data).map(Number).sort((a, b) => a - b)).toEqual([5, 14, 15, 19, 22, 27, 40, 41])
  })
})

describe('matching is a clean bijection', () => {
  for (const b of ofType('matching')) {
    it(`${b.slug}: >=2 items, all answered, distinct rights`, () => {
      expect(b.items.length).toBeGreaterThanOrEqual(2)
      expect(b.items.every((it) => it.answer)).toBe(true)
      const rights = b.items.map((it) => normalize(it.answer))
      expect(new Set(rights).size).toBe(rights.length)
    })
  }
})

describe('mcq carries book-sourced options', () => {
  for (const b of ofType('mcq')) {
    it(`${b.slug}: every item has >=2 options including its correct one`, () => {
      for (const it of b.items) {
        expect(Array.isArray(it.options)).toBe(true)
        expect(it.options.length).toBeGreaterThanOrEqual(2)
        expect(it.options).toContain(it.correct)
      }
    })
  }
})

describe('reveal items are answerable', () => {
  for (const b of ofType('reveal')) {
    it(`${b.slug}: every item has a prompt and an answer`, () => {
      expect(b.items.every((it) => it.prompt && it.answer)).toBe(true)
    })
  }
})
