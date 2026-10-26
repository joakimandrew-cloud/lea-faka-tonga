import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import {
  buildDeck, makeRng, makeRound, makeFollowerRound, levelFlightMs,
  gameReducer, initialGame, frontWord, flyingCount, isFrozen, LIVES,
  multiplierFor, levelFor,
} from './index.js'

const deck = buildDeck(vocabulary, 'useful')

function playing(seed = 1) {
  let s = gameReducer(initialGame(), { type: 'start' })
  s = gameReducer(s, { type: 'tick' })
  s = gameReducer(s, { type: 'tick' })
  s = gameReducer(s, { type: 'tick' })
  expect(s.phase).toBe('playing')
  return { s, rng: makeRng(seed) }
}

function launch(s, rng, x = 0.3) {
  const front = frontWord(s)
  const round = front
    ? makeFollowerRound(deck, rng, front.round, { recent: s.recent })
    : makeRound(deck, rng, { optionCount: 4, avoid: new Set(s.recent) })
  return gameReducer(s, { type: 'launch', round, duration: levelFlightMs(s.level), x })
}

const wrongIndex = r => (r.correctIndex + 1) % r.options.length

describe('Word Rain game state', () => {
  it('counts down 3, 2, 1, then plays; Play again can skip the count', () => {
    let s = gameReducer(initialGame(), { type: 'start' })
    expect([s.phase, s.count]).toEqual(['countdown', 3])
    s = gameReducer(s, { type: 'tick' })
    expect(s.count).toBe(2)
    s = gameReducer(s, { type: 'pause' })
    expect(gameReducer(s, { type: 'tick' }).count).toBe(2)
    s = gameReducer(s, { type: 'resume' })
    s = gameReducer(gameReducer(s, { type: 'tick' }), { type: 'tick' })
    expect(s.phase).toBe('playing')
    const again = gameReducer({ ...s, phase: 'over', score: 99 }, { type: 'start', instant: true })
    expect([again.phase, again.score, again.lives]).toEqual(['playing', 0, LIVES])
    expect(again.gameId).toBe(s.gameId + 1)
  })

  it('scores a right answer, keeps the streak, and levels up every 8', () => {
    let { s, rng } = playing(2)
    for (let i = 1; i <= 17; i++) {
      s = launch(s, rng)
      const w = frontWord(s)
      const before = s.score
      s = gameReducer(s, { type: 'answer', key: w.key, index: w.round.correctIndex, elapsedMs: 500 })
      expect(s.score).toBeGreaterThan(before)
      expect(s.streak).toBe(i)
      expect(s.correct).toBe(i)
      expect(s.level).toBe(levelFor(i))
      const popped = s.words.find(x => x.key === w.key)
      expect(popped.fate).toBe('popped')
      expect(popped.mult).toBe(multiplierFor(i))
      expect(s.score - before).toBe(popped.gain)
      if (i === 8 || i === 16) expect(s.levelUp).toEqual({ level: levelFor(i), at: i })
      s = gameReducer(s, { type: 'popDone', key: w.key })
    }
    expect(s.bestStreak).toBe(17)
    expect(s.lives).toBe(LIVES)
  })

  it('a wrong answer costs one life, resets the streak and shows the right pair', () => {
    let { s, rng } = playing(3)
    for (let i = 0; i < 6; i++) {
      s = launch(s, rng)
      const w = frontWord(s)
      s = gameReducer(gameReducer(s, { type: 'answer', key: w.key, index: w.round.correctIndex, elapsedMs: 0 }), { type: 'popDone', key: w.key })
    }
    expect(s.streak).toBe(6)
    s = launch(s, rng)
    const w = frontWord(s)
    const score = s.score
    s = gameReducer(s, { type: 'answer', key: w.key, index: wrongIndex(w.round) })
    expect(s.lives).toBe(LIVES - 1)
    expect(s.streak).toBe(0)
    expect(s.bestStreak).toBe(6)
    expect(s.score).toBe(score)
    expect(s.reveal).toMatchObject({ key: w.key, kind: 'wrong' })
    expect(s.missed.map(c => c.id)).toEqual([w.round.target.id])
    expect(isFrozen(s)).toBe(true)
  })

  it('ignores answers while a miss is showing, while paused, and when aimed at an older word', () => {
    let { s, rng } = playing(4)
    s = launch(s, rng)
    const w = frontWord(s)
    s = gameReducer(s, { type: 'answer', key: w.key, index: wrongIndex(w.round) })
    // A second tap during the reveal (even the right one) changes nothing.
    const during = gameReducer(s, { type: 'answer', key: w.key, index: w.round.correctIndex })
    expect(during).toBe(s)
    s = gameReducer(s, { type: 'revealDone' })
    s = launch(s, rng)
    const next = frontWord(s)
    // A double tap queued for the word just answered never lands on the next one.
    expect(gameReducer(s, { type: 'answer', key: w.key, index: next.round.correctIndex })).toBe(s)
    s = gameReducer(s, { type: 'pause' })
    expect(gameReducer(s, { type: 'answer', key: next.key, index: next.round.correctIndex })).toBe(s)
    s = gameReducer(s, { type: 'resume' })
    expect(gameReducer(s, { type: 'answer', key: next.key, index: 9 })).toBe(s)
    expect(gameReducer(s, { type: 'answer', key: next.key, index: -1 })).toBe(s)
  })

  it('a word reaching the edge costs a life once, and three lost lives end the game', () => {
    let { s, rng } = playing(5)
    for (let life = LIVES; life > 0; life--) {
      s = launch(s, rng)
      const w = frontWord(s)
      s = gameReducer(s, { type: 'escape', key: w.key })
      expect(s.lives).toBe(life - 1)
      // The same word cannot escape twice.
      expect(gameReducer(s, { type: 'escape', key: w.key }).lives).toBe(life - 1)
      s = gameReducer(s, { type: 'revealDone' })
    }
    expect(s.phase).toBe('over')
    expect(s.words).toEqual([])
    expect(s.missed.length).toBe(LIVES)
  })

  it('answers the front word with two in the air, and never launches a third', () => {
    let { s, rng } = playing(6)
    s = { ...s, level: 3, correct: 16 }
    s = launch(s, rng, 0.2)
    s = launch(s, rng, 0.8)
    expect(flyingCount(s)).toBe(2)
    const [a, b] = s.words
    expect(frontWord(s).key).toBe(a.key)
    // A third launch is refused.
    const third = makeRound(deck, rng, { optionCount: 4 })
    expect(gameReducer(s, { type: 'launch', round: third, duration: 5000 })).toBe(s)
    // The right answer for the front word pops the front word only.
    s = gameReducer(s, { type: 'answer', key: a.key, index: a.round.correctIndex, elapsedMs: 100 })
    expect(s.words.find(w => w.key === a.key).fate).toBe('popped')
    expect(s.words.find(w => w.key === b.key).fate).toBe('flying')
    expect(frontWord(s).key).toBe(b.key)
    // A wrong answer now is for the second word, and costs one life.
    s = gameReducer(s, { type: 'answer', key: b.key, index: wrongIndex(b.round) })
    expect(s.lives).toBe(LIVES - 1)
    expect(s.reveal.key).toBe(b.key)
  })

  it('a second word escaping while a miss shows still costs its life, and the first miss stays on screen', () => {
    let { s, rng } = playing(7)
    s = { ...s, level: 4, correct: 24 }
    s = launch(s, rng, 0.2)
    s = launch(s, rng, 0.8)
    const [a, b] = s.words
    s = gameReducer(s, { type: 'answer', key: a.key, index: wrongIndex(a.round) })
    s = gameReducer(s, { type: 'escape', key: b.key })
    expect(s.lives).toBe(LIVES - 2)
    expect(s.reveal.key).toBe(a.key)
    expect(s.missed.map(c => c.id)).toEqual([a.round.target.id, b.round.target.id])
    s = gameReducer(s, { type: 'revealDone' })
    expect(s.words).toEqual([])
    expect(s.phase).toBe('playing')
  })

  it('never launches while paused or while a miss shows, and quits to the title', () => {
    let { s, rng } = playing(8)
    s = gameReducer(s, { type: 'pause' })
    expect(launch(s, rng)).toBe(s)
    s = gameReducer(s, { type: 'resume' })
    s = launch(s, rng)
    const w = frontWord(s)
    s = gameReducer(s, { type: 'escape', key: w.key })
    expect(launch(s, rng)).toBe(s)
    const q = gameReducer(s, { type: 'quit' })
    expect(q.phase).toBe('title')
    expect(q.gameId).toBe(s.gameId)
  })
})
