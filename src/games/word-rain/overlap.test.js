import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import confusable from './confusable-pairs.json'
import {
  buildDeck, contentWords, stemWord, derivedFrom, clashes, shareWord, derivedPair,
  makeRng, makeRound, makeFollowerRound, DIRECTIONS,
} from './index.js'

const ids = { nofo: 'book-v0062', tangutu: 'book-v0133', mouiLive: 'book-v0029', nonofo: 'book-v0331' }
const all = buildDeck(vocabulary, 'all')
const card = id => all.find(c => c.id === id)
const ROUNDS = 5000

describe('key words', () => {
  it('folds endings and drops the little words', () => {
    expect(stemWord('sitting')).toBe(stemWord('sit'))
    expect(stemWord('sits')).toBe(stemWord('sit'))
    expect(stemWord('living')).toBe(stemWord('live'))
    expect(stemWord('lives')).toBe(stemWord('live'))
    expect(stemWord('staying')).toBe(stemWord('stay'))
    expect(stemWord('stays')).toBe(stemWord('stay'))
    expect(contentWords('sit down')).toEqual(['sit'])
    expect(contentWords('live together (plural of nofo)')).toEqual([stemWord('live')])
    expect(contentWords('live, be alive, be well')).toContain(stemWord('live'))
    expect(contentWords('stay, sit, live').sort()).toEqual([stemWord('live'), stemWord('sit'), stemWord('stay')].sort())
    expect(contentWords('one')).toEqual(['one'])
    expect(contentWords('one thousand')).toEqual(['thousand'])
  })

  it('reads the source word out of "(plural of x)" and "(from x, ...)"', () => {
    expect(derivedFrom('live together (plural of nofo)')).toEqual(['nofo'])
    expect(derivedFrom("useless (from 'aonga, useful)")).toEqual(["'aonga"])
    expect(derivedFrom('house, building')).toEqual([])
  })
})

describe('nofo and the words that overlap its meanings', () => {
  const nofo = card(ids.nofo)
  const others = [ids.tangutu, ids.mouiLive, ids.nonofo].map(card)

  it('has the data the report describes', () => {
    expect(nofo.english).toBe('stay, sit, live')
    expect(others.map(c => c.english)).toEqual(['sit down', 'live, be alive, be well', 'live together (plural of nofo)'])
  })

  it('refuses each of them in both directions', () => {
    for (const o of others) {
      expect(clashes(nofo, o), o.id).toBe(true)
      expect(clashes(o, nofo), o.id).toBe(true)
    }
    expect(shareWord(nofo, card(ids.tangutu))).toBe(true)
    expect(shareWord(nofo, card(ids.mouiLive))).toBe(true)
    expect(derivedPair(nofo, card(ids.nonofo))).toBe(true)
  })

  for (const direction of DIRECTIONS) {
    it(`never meets tangutu, mo'ui or nonofo in ${ROUNDS} rounds, ${direction}`, () => {
      const rng = makeRng(26102026)
      // nofo as the target never shows the other three; each of the other
      // three as the target never shows nofo.
      for (const target of [nofo, ...others]) {
        const forbidden = target.id === nofo.id ? others.map(o => o.id) : [nofo.id]
        for (let i = 0; i < ROUNDS; i++) {
          const r = makeRound(all, rng, { direction, optionCount: 4, target })
          const bad = r.options.filter(o => forbidden.includes(o.id)).map(o => o.id)
          expect(bad, `${target.id} round ${i}`).toEqual([])
        }
      }
    })
  }
})

describe('no round shows two answers that could both be right', () => {
  const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const blocked = new Set(confusable.pairs.map(([a, b]) => pairKey(a, b)))

  it('lists only entries that exist, once each', () => {
    const idsInData = new Set(vocabulary.map(v => v.id))
    expect(confusable.pairs.length).toBe(confusable.pair_notes.length)
    expect(new Set(confusable.pairs.map(([a, b]) => pairKey(a, b))).size).toBe(confusable.pairs.length)
    for (const [a, b] of confusable.pairs) {
      expect(idsInData.has(a) && idsInData.has(b) && a !== b, `${a} ${b}`).toBe(true)
    }
  })

  for (const set of ['essential', 'useful', 'all']) {
    for (const direction of DIRECTIONS) {
      it(`${set}, ${direction}: no two options share a content word, a derived form or a blocklist pair`, () => {
        const deck = buildDeck(vocabulary, set)
        const rng = makeRng(77 + set.length + direction.length)
        for (let i = 0; i < 3000; i++) {
          const r = makeRound(deck, rng, { direction, optionCount: 4 })
          for (let a = 0; a < r.options.length; a++) {
            for (let b = a + 1; b < r.options.length; b++) {
              const x = r.options[a]
              const y = r.options[b]
              expect(shareWord(x, y), `${x.id} ${y.id} share a word`).toBe(false)
              expect(derivedPair(x, y), `${x.id} ${y.id} derived`).toBe(false)
              expect(blocked.has(pairKey(x.id, y.id)), `${x.id} ${y.id} blocklist`).toBe(false)
            }
          }
        }
      })
    }
  }

  it('a second word in the air never shares a content word with the first', () => {
    const deck = buildDeck(vocabulary, 'useful')
    const rng = makeRng(4242)
    for (let i = 0; i < 1500; i++) {
      const front = makeRound(deck, rng, { optionCount: 4 })
      const second = makeFollowerRound(deck, rng, front, { optionCount: 4 })
      if (!second) continue
      for (const o of second.options) expect(shareWord(front.target, o)).toBe(false)
      for (const o of front.options) expect(shareWord(second.target, o)).toBe(false)
    }
  })
})
