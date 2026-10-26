import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import wordLists from '../../premium/data/word-lists.json'
import confusable from '../shared/confusable-pairs.json'
import {
  allWordsDeck, buildDeck, makeRng, makeRound, clashes, posClass, tonganKey,
  gameReducer, initialGame, frontWord, ANSWER_LOCKOUT_MS,
} from './index.js'

const all = allWordsDeck(vocabulary, wordLists)
const deck = buildDeck(vocabulary, 'all')
const byKey = key => all.find(c => c.key === tonganKey(key))
const byId = id => all.find(c => c.id === id)

describe('Word Balloons: a double tap is one answer', () => {
  function twoInTheAir() {
    let s = gameReducer(initialGame(), { type: 'start', instant: true })
    const rng = makeRng(9)
    const a = makeRound(deck, rng, { optionCount: 4 })
    const b = makeRound(deck, rng, { optionCount: 4, avoid: new Set([a.target.id]) })
    s = gameReducer(s, { type: 'launch', round: a, duration: 9000, x: 0.2, now: 0 })
    s = gameReducer(s, { type: 'launch', round: b, duration: 9000, x: 0.7, now: 1500 })
    return { s, a, b }
  }

  it('ignores an answer for the next word within the lockout, and takes it after', () => {
    let { s, a, b } = twoInTheAir()
    const [wa, wb] = s.words
    s = gameReducer(s, { type: 'answer', key: wa.key, index: a.correctIndex, elapsedMs: 800, now: 2000 })
    expect(s.correct).toBe(1)
    expect(frontWord(s).key).toBe(wb.key)
    // The second tap of the double tap: B's key, a wrong index, 80 ms later.
    const wrong = (b.correctIndex + 1) % b.options.length
    const quick = gameReducer(s, { type: 'answer', key: wb.key, index: wrong, now: 2080 })
    expect(quick).toBe(s)
    expect(quick.lives).toBe(3)
    // Still inside the lockout one millisecond early, and open right at the edge.
    expect(gameReducer(s, { type: 'answer', key: wb.key, index: wrong, now: 2000 + ANSWER_LOCKOUT_MS - 1 })).toBe(s)
    const later = gameReducer(s, { type: 'answer', key: wb.key, index: wrong, now: 2000 + ANSWER_LOCKOUT_MS })
    expect(later.lives).toBe(2)
  })

  it('a right quick answer for the next word is also held back, then accepted', () => {
    let { s, b } = twoInTheAir()
    const [wa, wb] = s.words
    s = gameReducer(s, { type: 'answer', key: wa.key, index: s.words[0].round.correctIndex, elapsedMs: 800, now: 2000 })
    expect(gameReducer(s, { type: 'answer', key: wb.key, index: b.correctIndex, now: 2100 })).toBe(s)
    expect(gameReducer(s, { type: 'answer', key: wb.key, index: b.correctIndex, now: 2400 }).correct).toBe(2)
  })

  it('has no lockout for an action without a time (older callers)', () => {
    let { s, b } = twoInTheAir()
    const [wa, wb] = s.words
    s = gameReducer(s, { type: 'answer', key: wa.key, index: s.words[0].round.correctIndex, elapsedMs: 800 })
    expect(gameReducer(s, { type: 'answer', key: wb.key, index: b.correctIndex }).correct).toBe(2)
  })
})

describe('Word Balloons: notes stay with the meaning', () => {
  it('goodbye to the one leaving and to the one staying are told apart', () => {
    const leaving = byKey("'alu ā")
    const staying = byKey('nofo ā')
    expect(leaving.full).toBe('goodbye (to person leaving)')
    expect(staying.full).toBe('goodbye (to person staying)')
    expect(leaving.full).not.toBe(staying.full)
    // The note fits the button (27 characters), so the button shows it too.
    expect(leaving.label).toBe(leaving.full)
    expect(staying.label).toBe(staying.full)
    // The overlap checks still read the note-free meaning.
    expect(leaving.meaning).toBe('goodbye')
    expect(staying.meaning).toBe('goodbye')
  })

  it('lalahi says it is the plural of lahi, with the fakauʻa in a Tongan note', () => {
    expect(byKey('lalahi').full).toContain('plural of lahi')
    expect(byKey('ō').full).toBe('go (plural of ʻalu)')
    expect(byKey('ō').full).not.toContain("'")
  })

  it('a note too long for the button is left off the button and kept in the reveal', () => {
    const c = all.find(x => x.english.length > 40 && x.english.includes('('))
    expect(c).toBeTruthy()
    expect(c.label).not.toContain('(')
    expect(c.full).toContain('(')
  })

  it('kehe shows "different", not the meaning of kae kehe', () => {
    const kehe = byKey('kehe')
    expect(kehe.meaning).toBe('different')
    expect(kehe.label).toBe('different')
    expect(kehe.full).toBe('different')
    expect(kehe.words).toEqual(['different'])
  })
})

describe('Word Balloons: accent examples are not words', () => {
  it('leaves falé, puhá and tēpilé out of the deck and keeps fale, puha and tēpile', () => {
    const keys = new Set(all.map(c => c.key))
    for (const w of ['falé', 'puhá', 'tēpilé']) expect(keys.has(tonganKey(w)), w).toBe(false)
    for (const w of ['fale', 'puha', 'tēpile']) expect(keys.has(tonganKey(w)), w).toBe(true)
  })
})

describe('Word Balloons: the blocklist and the part-of-speech class', () => {
  it('holds the pairs the judge named, and clashes() agrees', () => {
    for (const [a, b] of [
      ['book-v0195', 'book-v0187'], ['book-v0438', 'book-v0608'], ['book-v0348', 'book-v0352'],
      ['book-v0118', 'book-v0194'], ['book-v0055', 'book-v0194'], ['book-v0055', 'book-v0480'], ['book-v0055', 'book-v0216'],
      ['book-v0451', 'book-v0079'],
    ]) {
      expect(confusable.pairs.some(p => p.includes(a) && p.includes(b)), `${a} ${b}`).toBe(true)
      expect(clashes(byId(a), byId(b)), `${a} ${b}`).toBe(true)
    }
  })

  it('a blocklist pair never meets, whichever word is the target', () => {
    const rng = makeRng(31)
    for (const [a, b] of confusable.pairs) {
      for (const [t, o] of [[a, b], [b, a]]) {
        const target = byId(t)
        if (!target || !byId(o)) continue
        for (let i = 0; i < 25; i++) {
          const r = makeRound(all, rng, { target, optionCount: 4 })
          expect(r.options.some(x => x.id === o), `${t} met ${o}`).toBe(false)
        }
      }
    }
  })

  it('reduces a part of speech to its broad class', () => {
    expect(posClass('verb phrase')).toBe('verb')
    expect(posClass('postposed adverb')).toBe('adverb')
    expect(posClass('noun/verb')).toBe('noun')
    expect(posClass('number')).toBe('number')
  })

  it('a two-entry group no longer fixes the partner: lahi pē draws from all the adverbs', () => {
    const target = byId('book-v0348')
    const rng = makeRng(5)
    const seen = new Set()
    for (let i = 0; i < 200; i++) {
      const r = makeRound(all, rng, { target, optionCount: 4 })
      for (const o of r.options) {
        if (o.id === target.id) continue
        expect(posClass(o.pos), o.id).toBe('adverb')
        seen.add(o.id)
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(6)
  })
})
