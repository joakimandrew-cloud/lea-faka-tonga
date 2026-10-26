import { describe, it, expect } from 'vitest'
import {
  multiplierFor, nextMultiplierAt, speedBonus, pointsFor,
  BASE_POINTS, SPEED_BONUS, LEVEL_POINTS,
} from './scoring.js'

describe('Word Rain streak multiplier', () => {
  it('is x1 under 5, x2 from 5, x3 from 10, x4 from 20', () => {
    for (let s = 0; s <= 4; s++) expect(multiplierFor(s)).toBe(1)
    for (let s = 5; s <= 9; s++) expect(multiplierFor(s)).toBe(2)
    for (let s = 10; s <= 19; s++) expect(multiplierFor(s)).toBe(3)
    for (let s = 20; s <= 500; s++) expect(multiplierFor(s)).toBe(4)
  })

  it('treats bad streaks as no streak', () => {
    for (const bad of [-1, -20, NaN, undefined, null, 'x', Infinity * -1]) expect(multiplierFor(bad)).toBe(1)
  })

  it('names the streak where the next multiplier starts', () => {
    expect(nextMultiplierAt(0)).toBe(5)
    expect(nextMultiplierAt(4)).toBe(5)
    expect(nextMultiplierAt(5)).toBe(10)
    expect(nextMultiplierAt(12)).toBe(20)
    expect(nextMultiplierAt(20)).toBe(null)
  })
})

describe('Word Rain points', () => {
  it('pays more for a faster tap', () => {
    const d = 6000
    expect(speedBonus(0, d)).toBe(SPEED_BONUS)
    expect(speedBonus(d, d)).toBe(0)
    let prev = Infinity
    for (let e = 0; e <= d; e += 100) {
      const p = pointsFor({ elapsedMs: e, durationMs: d, streak: 1, level: 1 })
      expect(p).toBeLessThanOrEqual(prev)
      prev = p
    }
    expect(pointsFor({ elapsedMs: 0, durationMs: d })).toBe(BASE_POINTS + SPEED_BONUS)
    expect(pointsFor({ elapsedMs: d, durationMs: d })).toBe(BASE_POINTS)
  })

  it('multiplies by the streak, counting the answer being scored', () => {
    const at = streak => pointsFor({ elapsedMs: 3000, durationMs: 6000, streak, level: 1 })
    expect(at(4)).toBe(at(1))
    expect(at(5)).toBe(at(1) * 2)
    expect(at(10)).toBe(at(1) * 3)
    expect(at(20)).toBe(at(1) * 4)
  })

  it('adds a little for each level', () => {
    const at = level => pointsFor({ elapsedMs: 6000, durationMs: 6000, streak: 1, level })
    expect(at(1)).toBe(BASE_POINTS)
    expect(at(2)).toBe(BASE_POINTS + LEVEL_POINTS)
    expect(at(5)).toBe(BASE_POINTS + 4 * LEVEL_POINTS)
  })

  it('is never negative and always a whole number, whatever the timing', () => {
    const odd = [-5000, -1, 0, 1, 2999, 3000, 6000, 6001, 1e9, NaN, undefined, null, Infinity]
    for (const elapsedMs of odd) {
      for (const durationMs of odd) {
        for (const streak of [-3, 0, 1, 5, 25, NaN]) {
          for (const level of [-2, 0, 1, 7, NaN]) {
            const p = pointsFor({ elapsedMs, durationMs, streak, level })
            expect(Number.isInteger(p)).toBe(true)
            expect(p).toBeGreaterThanOrEqual(0)
            expect(p).toBeGreaterThanOrEqual(BASE_POINTS)
          }
        }
      }
    }
    expect(pointsFor()).toBe(BASE_POINTS)
  })
})
