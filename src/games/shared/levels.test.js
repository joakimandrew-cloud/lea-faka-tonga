import { describe, it, expect } from 'vitest'
import { WORDS_PER_LEVEL, levelFor, isLevelUp, toNextLevel, levelPace, levelTimeMs, PACE_STEP } from './levels.js'
import { levelFlightMs, START_MS, FLOOR_MS, STEP } from '../word-rain/index.js'

describe('shared levels', () => {
  it('counts a level every 8 right answers', () => {
    expect(WORDS_PER_LEVEL).toBe(8)
    expect(levelFor(0)).toBe(1)
    expect(levelFor(7)).toBe(1)
    expect(levelFor(8)).toBe(2)
    expect(isLevelUp(7, 8)).toBe(true)
    expect(isLevelUp(8, 9)).toBe(false)
    expect(toNextLevel(3)).toBe(5)
  })

  it('speeds up by three steps of the curve a level, with a floor', () => {
    expect(levelPace(1)).toBe(1)
    expect(levelPace(0)).toBe(1)
    expect(levelPace(2)).toBeCloseTo(PACE_STEP ** 3, 10)
    let prev = Infinity
    for (let l = 1; l <= 40; l++) {
      const ms = levelTimeMs(l, 10000, 4000)
      expect(ms).toBeGreaterThanOrEqual(4000)
      expect(ms).toBeLessThanOrEqual(prev)
      prev = ms
    }
    expect(levelTimeMs(40, 10000, 4000)).toBe(4000)
  })

  it('gives Word Balloons exactly its own flight times', () => {
    expect(STEP).toBe(PACE_STEP)
    for (let l = 1; l <= 30; l++) expect(levelTimeMs(l, START_MS, FLOOR_MS)).toBe(levelFlightMs(l))
  })
})
