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

  it('takes the second order the book allows, and marks a mix of the two wrong', () => {
    for (const id of ['ch19-ex4-1', 'ch33-ex2-4', 'ch34-ex2-3', 'ch42-ex2-4']) {
      const sentence = SENTENCES.find(x => x.id === id)
      const second = sentence.orders[1]
      let s = dealt(sentence)
      const used = new Set()
      second.forEach((w, i) => {
        const t = s.round.tiles.find(x => x.text === w && !used.has(x.slot))
        used.add(t.slot)
        s = gameReducer(s, pick(s.round, t.slot, 1000 + i * 300, 2000))
      })
      expect(s.round.status, id).toBe('done')
      expect(s.wrongTaps, id).toBe(0)
      expect(s.correct, id).toBe(1)
    }
    // After the first tile of the second order, a tile only the book order wants is wrong.
    const sentence = SENTENCES.find(x => x.id === 'ch34-ex2-3')
    let s = dealt(sentence)
    const first = s.round.tiles.find(t => t.text === sentence.orders[1][0])
    s = gameReducer(s, pick(s.round, first.slot, 1000))
    expect(s.wrongTaps).toBe(0)
    // the book's first word does not fit after the second order's first tile
    const bookFirst = s.round.tiles.find(t => !s.round.placed.includes(t.slot) && t.text === sentence.words[0])
    s = gameReducer(s, pick(s.round, bookFirst.slot, 1400))
    expect(s.wrongTaps).toBe(1)
    expect(s.round.placed).toEqual([first.slot])
  })
})

describe('Sentence Tiles fill-in', () => {
  const fill = (round, now, elapsedMs = 1000) => ({ type: 'fill', key: round.key, now, elapsedMs })

  it('places the next word of the book order, as a right tap would', () => {
    let s = dealt(plain)
    s = gameReducer(s, fill(s.round, 1000))
    expect(s.round.placed).toHaveLength(1)
    expect(s.round.tiles.find(t => t.slot === s.round.placed[0]).text).toBe(plain.words[0])
    expect(s.round.filled).toEqual([0])
    expect(s.round.penaltyMs).toBe(0)
    expect(s.wrongTaps).toBe(0)
    expect(s.filledWords).toBe(1)
  })

  it('fills the whole sentence: no time, no life, a score of 0, the streak as it was', () => {
    let s = dealt(plain)
    s = { ...s, streak: 3 }
    for (let i = 0; i < plain.words.length; i++) s = gameReducer(s, fill(s.round, 1000 + i * 100))
    expect(s.round.status).toBe('done')
    expect(s.round.gain).toBe(0)
    expect(s.score).toBe(0)
    expect(s.streak).toBe(3)
    expect(s.correct).toBe(0)
    expect(s.helped).toBe(1)
    expect(s.lives).toBe(LIVES)
    expect(s.round.placed.map(sl => s.round.tiles.find(t => t.slot === sl).text)).toEqual(plain.words)
    // nothing more to fill
    expect(gameReducer(s, fill(s.round, 5000))).toBe(s)
  })

  it('scores only the share of words the player placed, and does not grow the streak', () => {
    let s = dealt(plain)
    s = { ...s, streak: 2 }
    const slots = rightSlots(s.round)
    s = gameReducer(s, pick(s.round, slots[0], 1000, 2000))
    s = gameReducer(s, pick(s.round, slots[1], 1200, 2000))
    while (s.round.status === 'building') s = gameReducer(s, fill(s.round, 1500, 2000))
    const full = pointsFor({ elapsedMs: 2000, durationMs: s.round.durationMs, streak: 2, level: 1 })
    expect(s.round.gain).toBe(Math.round((full * 2) / plain.words.length))
    expect(s.score).toBe(s.round.gain)
    expect(s.streak).toBe(2)
    expect(s.round.filled).toEqual([2, 3])
  })

  it('keeps the new-sentence lockout and ignores a fill meant for another sentence', () => {
    let s = dealt(plain, playing(), 500)
    expect(gameReducer(s, fill(s.round, 500 + TAP_LOCKOUT_MS - 1))).toBe(s)
    expect(gameReducer(s, { ...fill(s.round, 3000), key: s.round.key - 1 })).toBe(s)
    const paused = gameReducer(s, { type: 'pause' })
    expect(gameReducer(paused, fill(s.round, 3000))).toBe(paused)
    s = gameReducer(s, fill(s.round, 500 + TAP_LOCKOUT_MS))
    expect(s.round.placed).toHaveLength(1)
  })

  it('fills from the second order when the line already follows it', () => {
    const sentence = SENTENCES.find(x => x.id === 'ch34-ex2-3')
    let s = dealt(sentence)
    const first = s.round.tiles.find(t => t.text === sentence.orders[1][0])
    s = gameReducer(s, pick(s.round, first.slot, 1000))
    while (s.round.status === 'building') s = gameReducer(s, fill(s.round, 1500))
    expect(s.round.placed.map(sl => s.round.tiles.find(t => t.slot === sl).text)).toEqual(sentence.orders[1])
    expect(s.wrongTaps).toBe(0)
  })
})
