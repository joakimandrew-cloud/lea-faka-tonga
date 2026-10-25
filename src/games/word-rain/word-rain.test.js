import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import {
  WORD_SETS, DIRECTIONS, buildDeck, shownMeaning, meaningItems,
  makeRng, makeRound, flightMs, FLOOR_MS,
} from './index.js'

const ROUNDS = 2500
const byId = new Map(vocabulary.map(v => [v.id, v]))

describe('Word Rain deck', () => {
  it('cuts the meaning before "(" and shortens long lists to the first item', () => {
    expect(shownMeaning('goodbye (to person leaving)')).toBe('goodbye')
    expect(shownMeaning("long in duration ('o fuoloa = for a long time)")).toBe('long in duration')
    expect(shownMeaning('fine, clear (weather)')).toBe('fine, clear')
    expect(shownMeaning('congratulations, worthy of praise')).toBe('congratulations')
    expect(meaningItems('sermon; to preach')).toEqual(['sermon', 'preach'])
  })

  it('never holds a grammar entry, and the word sets follow the tiers', () => {
    for (const set of WORD_SETS) {
      const deck = buildDeck(vocabulary, set)
      expect(deck.length).toBeGreaterThan(20)
      for (const c of deck) {
        expect(byId.get(c.id).category).not.toBe('grammar')
        if (set === 'essential') expect(c.tier).toBe(1)
        if (set === 'useful') expect(c.tier).toBeLessThanOrEqual(2)
        expect(c.meaning).not.toContain('(')
        expect(c.meaning.length).toBeGreaterThan(0)
      }
    }
    expect(buildDeck(vocabulary, 'all').length).toBe(vocabulary.filter(v => v.category !== 'grammar').length)
  })
})

for (const set of WORD_SETS) {
  for (const direction of DIRECTIONS) {
    for (const optionCount of [4, 3]) {
      describe(`Word Rain rounds: ${set}, ${direction}, ${optionCount} options`, () => {
        const deck = buildDeck(vocabulary, set)
        const rng = makeRng(20261026 + set.length * 7 + direction.length + optionCount)
        const rounds = []
        for (let i = 0; i < ROUNDS; i++) rounds.push(makeRound(deck, rng, { direction, optionCount }))

        it(`generates ${ROUNDS} rounds with the full number of options`, () => {
          expect(rounds.length).toBe(ROUNDS)
          for (const r of rounds) expect(r.options.length).toBe(optionCount)
        })

        it('has exactly one option that matches the target', () => {
          for (const r of rounds) {
            const right = direction === 'to-tongan' ? r.target.tonganShown : r.target.meaning
            expect(r.labels.filter(l => l === right).length).toBe(1)
            expect(r.labels[r.correctIndex]).toBe(right)
            expect(r.options[r.correctIndex].id).toBe(r.target.id)
            expect(r.options.filter(o => o.id === r.target.id).length).toBe(1)
          }
        })

        it('never shows two equal options', () => {
          for (const r of rounds) {
            const lower = r.labels.map(l => l.toLowerCase())
            expect(new Set(lower).size).toBe(lower.length)
          }
        })

        it('never gives a distractor the same meaning, a shared meaning item or the same Tongan', () => {
          for (const r of rounds) {
            const items = new Set(r.target.items)
            r.options.forEach((o, i) => {
              if (i === r.correctIndex) return
              expect(o.tongan).not.toBe(r.target.tongan)
              expect(o.meaning.toLowerCase()).not.toBe(r.target.meaning.toLowerCase())
              for (const it of o.items) expect(items.has(it)).toBe(false)
            })
          }
        })

        it('never uses a grammar entry and never shows a "("', () => {
          for (const r of rounds) {
            for (const o of r.options) expect(byId.get(o.id).category).not.toBe('grammar')
            for (const l of [...r.labels, r.mover]) expect(l).not.toContain('(')
          }
        })
      })
    }
  }
}

describe('Word Rain speed curve', () => {
  it('never puts a word on screen for under 3 s, and quickens gently', () => {
    let prev = Infinity
    for (let s = 0; s <= 10000; s++) {
      const ms = flightMs(s)
      expect(ms).toBeGreaterThanOrEqual(3000)
      expect(ms).toBeLessThanOrEqual(prev)
      prev = ms
    }
    expect(FLOOR_MS).toBe(3000)
    expect(flightMs(0)).toBeGreaterThan(flightMs(5))
    expect(flightMs(1) / flightMs(0)).toBeGreaterThan(0.9)
    expect(flightMs(-5)).toBe(flightMs(0))
  })
})
