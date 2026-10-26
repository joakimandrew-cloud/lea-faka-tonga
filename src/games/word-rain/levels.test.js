import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import {
  WORD_SETS, DIRECTIONS, buildDeck, makeRng, makeRound, clashes, FLOOR_MS,
  levelFor, isLevelUp, toNextLevel, levelFlightMs, skyStep, cloudRate, staggerFor,
  canLaunchSecond, secondFlightMs, followerX, makeFollowerRound,
  WORDS_PER_LEVEL, TWO_AT_ONCE_FROM, MAX_IN_AIR, GAP_MS,
} from './index.js'

describe('Word Rain levels', () => {
  it('starts a new level every 8 right answers', () => {
    expect(WORDS_PER_LEVEL).toBe(8)
    for (let c = 0; c <= 7; c++) expect(levelFor(c)).toBe(1)
    expect(levelFor(8)).toBe(2)
    expect(levelFor(15)).toBe(2)
    expect(levelFor(16)).toBe(3)
    expect(levelFor(24)).toBe(4)
    expect(levelFor(-4)).toBe(1)
    expect(levelFor(NaN)).toBe(1)
  })

  it('reports a level-up only on the answer that crosses a boundary', () => {
    const ups = []
    for (let c = 0; c < 64; c++) if (isLevelUp(c, c + 1)) ups.push(c + 1)
    expect(ups).toEqual([8, 16, 24, 32, 40, 48, 56, 64])
    expect(toNextLevel(0)).toBe(8)
    expect(toNextLevel(7)).toBe(1)
    expect(toNextLevel(8)).toBe(8)
  })

  it('gets faster each level and never under 3 s', () => {
    let prev = Infinity
    for (let l = 1; l <= 200; l++) {
      const ms = levelFlightMs(l)
      expect(ms).toBeGreaterThanOrEqual(3000)
      expect(ms).toBeLessThanOrEqual(prev)
      if (l > 1 && prev > FLOOR_MS) expect(ms).toBeLessThan(prev)
      prev = ms
    }
    expect(levelFlightMs(0)).toBe(levelFlightMs(1))
  })

  it('shifts the sky up to level 7 and speeds the clouds with it', () => {
    expect(skyStep(1)).toBe(1)
    expect(skyStep(7)).toBe(7)
    expect(skyStep(30)).toBe(7)
    expect(cloudRate(2)).toBeGreaterThan(cloudRate(1))
    expect(cloudRate(30)).toBe(cloudRate(7))
  })
})

describe('Word Rain: two words in the air', () => {
  it('never allows a second word before level 3, or a third at any level', () => {
    for (let level = 1; level < TWO_AT_ONCE_FROM; level++) {
      for (const p of [0, 0.5, 0.99, 1]) expect(canLaunchSecond({ level, inAir: 1, frontProgress: p })).toBe(false)
    }
    for (let level = TWO_AT_ONCE_FROM; level <= 40; level++) {
      expect(canLaunchSecond({ level, inAir: 0, frontProgress: 1 })).toBe(false)
      expect(canLaunchSecond({ level, inAir: MAX_IN_AIR, frontProgress: 1 })).toBe(false)
      expect(canLaunchSecond({ level, inAir: 3, frontProgress: 1 })).toBe(false)
      expect(canLaunchSecond({ level, inAir: 1, frontProgress: 0.1 })).toBe(false)
      expect(canLaunchSecond({ level, inAir: 1, frontProgress: staggerFor(level) })).toBe(true)
    }
    expect(MAX_IN_AIR).toBe(2)
  })

  it('lands the second word after the front word, so the front word stays in front', () => {
    for (let level = TWO_AT_ONCE_FROM; level <= 12; level++) {
      const base = levelFlightMs(level)
      // The front word may have been launched at this level or an earlier,
      // slower one (frontTotal), and be anywhere past the stagger point.
      for (const frontTotal of [base, levelFlightMs(level - 1), levelFlightMs(1)]) {
        for (let p0 = staggerFor(level); p0 < 1; p0 += 0.05) {
          const remaining = frontTotal * (1 - p0)
          const d2 = secondFlightMs(base, remaining)
          expect(d2).toBeGreaterThanOrEqual(3000)
          expect(d2).toBeGreaterThanOrEqual(base)
          expect(d2).toBeGreaterThanOrEqual(remaining + GAP_MS)
          // Walk both straight-line flights until the front word lands: the
          // second word is behind it at every moment.
          for (let t = 0; t <= remaining; t += 50) {
            const front = p0 + t / frontTotal
            const second = t / d2
            expect(second).toBeLessThan(front)
          }
        }
      }
    }
  })

  it('puts the second word in the other half of the sky', () => {
    const rng = makeRng(7)
    for (let i = 0; i < 500; i++) {
      const fx = rng()
      const x = followerX(fx, rng)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
      expect(fx < 0.5 ? x >= 0.55 : x <= 0.45).toBe(true)
    }
  })

  for (const set of WORD_SETS) {
    for (const direction of DIRECTIONS) {
      it(`never shares a target or an answer set (${set}, ${direction})`, () => {
        const deck = buildDeck(vocabulary, set)
        const rng = makeRng(20261026 + set.length + direction.length)
        let made = 0
        for (let i = 0; i < 1500; i++) {
          const front = makeRound(deck, rng, { direction, optionCount: 4 })
          const second = makeFollowerRound(deck, rng, front, { direction, optionCount: 4, recent: [front.target.id] })
          expect(second).not.toBeNull()
          made++
          // Different targets, and neither could pass for the other.
          expect(second.target.id).not.toBe(front.target.id)
          expect(clashes(front.target, second.target)).toBe(false)
          // The second word is not an answer on the front word's buttons...
          for (const o of front.options) expect(clashes(o, second.target)).toBe(false)
          // ...and the front word is not an answer on the second word's.
          for (const o of second.options) expect(clashes(front.target, o)).toBe(false)
          // Each answer set has exactly one right answer, its own target.
          for (const r of [front, second]) {
            expect(r.options.filter(o => o.id === r.target.id).length).toBe(1)
            expect(r.options[r.correctIndex].id).toBe(r.target.id)
            expect(new Set(r.labels.map(l => l.toLowerCase())).size).toBe(r.labels.length)
          }
          const frontIds = new Set(front.options.map(o => o.id))
          expect(frontIds.has(second.target.id)).toBe(false)
        }
        expect(made).toBe(1500)
      })
    }
  }

  it('gives up cleanly when the deck cannot supply a second word', () => {
    const deck = buildDeck(vocabulary, 'essential').slice(0, 4)
    const rng = makeRng(1)
    const front = makeRound(deck, rng, { optionCount: 4 })
    expect(makeFollowerRound(deck, rng, front)).toBeNull()
    expect(makeFollowerRound(deck, rng, null)).toBeNull()
  })
})
