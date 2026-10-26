import { describe, it, expect } from 'vitest'
import { makeRng } from '../shared/fair.js'
import { pointsFor } from '../shared/scoring.js'
import { SENTENCES } from './deck.js'
import { makeRound } from './rounds.js'
import { gameReducer, initialGame, timeLeftMs, LIVES, WRONG_TAP_MS, TAP_LOCKOUT_MS } from './game.js'

// Sentences come from the book's data; no Tongan is typed here.
const plain = SENTENCES.find(s => new Set(s.words).size === s.words.length && s.words.length === 4)
const withDup = SENTENCES.find(s => new Set(s.words).size < s.words.length)

const run = (state, ...actions) => actions.reduce(gameReducer, state)
function playing() {
  return run(initialGame(), { type: 'start', instant: true })
}
function dealt(sentence, state = playing(), now = 0) {
  return run(state, { type: 'deal', round: makeRound(sentence, makeRng(5), { level: state.level }), now })
}
/** The slots that build the sentence, in order (the first matching unused tile each time). */
function rightSlots(round) {
  const used = new Set()
  return round.sentence.words.map(w => {
    const t = round.tiles.find(x => x.text === w && !used.has(x.slot))
    used.add(t.slot)
    return t.slot
  })
}
const wrongSlot = round => round.tiles.find(t => t.text !== round.sentence.words[round.placed.length]).slot
const pick = (round, slot, now, elapsedMs = 1000) => ({ type: 'pick', key: round.key, slot, now, elapsedMs })

describe('Sentence Tiles game', () => {
  it('builds a sentence with right taps and scores it with the shared scoring', () => {
    let s = dealt(plain)
    const slots = rightSlots(s.round)
    slots.forEach((slot, i) => { s = gameReducer(s, pick(s.round, slot, 1000 + i * 300, 2000)) })
    expect(s.round.status).toBe('done')
    expect(s.round.placed).toEqual(slots)
    expect(s.correct).toBe(1)
    expect(s.streak).toBe(1)
    const want = pointsFor({ elapsedMs: 2000, durationMs: s.round.durationMs, streak: 1, level: 1 })
    expect(s.score).toBe(want)
    expect(s.round.gain).toBe(want)
  })

  it('takes either of two identical tiles', () => {
    const s0 = dealt(withDup)
    const word = withDup.words.find((w, i) => withDup.words.indexOf(w) !== i)
    const at = withDup.words.indexOf(word)
    for (const twin of s0.round.tiles.filter(t => t.text === word)) {
      let s = s0
      const others = rightSlots(s.round).slice(0, at)
      others.forEach((slot, i) => { s = gameReducer(s, pick(s.round, slot, 1000 + i * 300)) })
      // a twin may already have been used for an earlier place of the same word
      if (s.round.placed.includes(twin.slot)) continue
      s = gameReducer(s, pick(s.round, twin.slot, 5000))
      expect(s.round.placed.length).toBe(at + 1)
      expect(s.wrongTaps).toBe(0)
    }
  })

  it('makes a wrong tap cost time and the streak, never a life', () => {
    let s = dealt(plain)
    s = { ...s, streak: 4 }
    const before = timeLeftMs(s.round, 1000)
    s = gameReducer(s, pick(s.round, wrongSlot(s.round), 1000))
    expect(s.wrongTaps).toBe(1)
    expect(s.round.penaltyMs).toBe(WRONG_TAP_MS)
    expect(timeLeftMs(s.round, 1000)).toBe(before - WRONG_TAP_MS)
    expect(s.streak).toBe(0)
    expect(s.lives).toBe(LIVES)
    expect(s.round.placed).toEqual([])
    expect(s.round.status).toBe('building')
  })

  it('counts a double tap on the same wrong tile once, and a later tap again', () => {
    let s = dealt(plain)
    const slot = wrongSlot(s.round)
    s = gameReducer(s, pick(s.round, slot, 1000))
    s = gameReducer(s, pick(s.round, slot, 1000 + TAP_LOCKOUT_MS - 50))
    expect(s.wrongTaps).toBe(1)
    s = gameReducer(s, pick(s.round, slot, 1000 + TAP_LOCKOUT_MS + 10))
    expect(s.wrongTaps).toBe(2)
  })

  it('ignores taps just after a new sentence is dealt, and taps meant for the last one', () => {
    let s = dealt(plain, playing(), 500)
    const slot = rightSlots(s.round)[0]
    const same = gameReducer(s, pick(s.round, slot, 500 + TAP_LOCKOUT_MS - 1))
    expect(same).toBe(s)
    const stale = gameReducer(s, { ...pick(s.round, slot, 2000), key: s.round.key - 1 })
    expect(stale).toBe(s)
    s = gameReducer(s, pick(s.round, slot, 500 + TAP_LOCKOUT_MS))
    expect(s.round.placed).toEqual([slot])
    // a placed tile cannot be picked again
    expect(gameReducer(s, pick(s.round, slot, 3000))).toBe(s)
  })

  it('costs a life when time runs out, and ends the game after three', () => {
    let s = playing()
    for (let i = 0; i < LIVES; i++) {
      s = dealt(plain, s)
      s = gameReducer(s, { type: 'timeout', key: s.round.key })
      expect(s.round.status).toBe('timeout')
      expect(s.lives).toBe(LIVES - 1 - i)
      s = gameReducer(s, { type: 'next' })
    }
    expect(s.phase).toBe('over')
    expect(s.missed.map(x => x.id)).toEqual([plain.id])
    expect(s.misses).toEqual([plain.id, plain.id, plain.id])
  })

  it('times out when a wrong tap uses up the last of the time', () => {
    let s = dealt(plain)
    const late = s.round.durationMs - WRONG_TAP_MS + 1
    s = gameReducer(s, pick(s.round, wrongSlot(s.round), 9000, late))
    expect(s.round.status).toBe('timeout')
    expect(s.lives).toBe(LIVES - 1)
  })

  it('holds every tap while paused or while a finished sentence shows', () => {
    let s = dealt(plain)
    const paused = gameReducer(s, { type: 'pause' })
    expect(gameReducer(paused, pick(s.round, rightSlots(s.round)[0], 2000))).toBe(paused)
    s = gameReducer(s, { type: 'timeout', key: s.round.key })
    expect(gameReducer(s, pick(s.round, rightSlots(s.round)[0], 2000))).toBe(s)
    expect(gameReducer(s, { type: 'deal', round: makeRound(plain, makeRng(1)), now: 0 })).toBe(s)
  })

  it('levels up after 8 sentences and the next sentence is quicker', () => {
    let s = playing()
    let t = 0
    for (let i = 0; i < 8; i++) {
      s = dealt(plain, s, t)
      for (const slot of rightSlots(s.round)) { t += 300; s = gameReducer(s, pick(s.round, slot, t)) }
      if (i < 7) s = gameReducer(s, { type: 'next' })
    }
    expect(s.level).toBe(2)
    expect(s.levelUp).toEqual({ level: 2, at: 8 })
    const level1 = s.round.durationMs
    s = gameReducer(s, { type: 'next' })
    s = dealt(plain, s, t)
    expect(s.round.durationMs).toBeLessThan(level1)
  })
})
