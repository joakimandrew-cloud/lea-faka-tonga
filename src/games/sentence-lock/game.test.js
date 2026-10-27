import { describe, it, expect } from 'vitest'
import data from './dials.json'
import { makeRng } from '../shared/fair.js'
import { POINTS_BY_TRY, MAX_WRONG, dialPoints, maxForSentence } from './scoring.js'
import {
  ALL_SENTENCES, SENTENCES, LESSONS, FIRST_LESSON,
  isPlayable, sentencesIn, buildLessons, lessonEntry, nextLesson, lessonSentences,
} from './lessons.js'
import { makeRound, currentWord, wordAt, isTried, turn, lock, roundPoints, roundMax, sentenceText } from './round.js'
import { gameReducer, initialGame, finishedCount, LOCK_LOCKOUT_MS, NEXT_LOCKOUT_MS } from './game.js'

// No Tongan is typed here: every word is read from dials.json.
const LESSON_1 = data.sentences.filter(s => s.lesson === 1)
const FIRST = LESSON_1[0]

/** Turns the open dial until its window shows `word` (at most one lap). */
function turnTo(round, word) {
  let r = round
  for (let k = 0; k < r.dials[r.open].options.length && currentWord(r.dials[r.open]) !== word; k++) r = turn(r, 1)
  return r
}
/** A wrong word on the open dial that has not been tried yet. */
function untriedWrong(round) {
  const d = round.dials[round.open]
  return d.options.find((w, i) => i !== d.rightAt && !d.tried.includes(i))
}

describe('scoring', () => {
  it('scores 3, 2, 1 by try and 0 when the answer is shown', () => {
    expect(POINTS_BY_TRY).toEqual([3, 2, 1])
    expect(MAX_WRONG).toBe(3)
    expect([0, 1, 2].map(n => dialPoints(n))).toEqual([3, 2, 1])
    expect(dialPoints(3, true)).toBe(0)
  })
  it('a sentence is worth 3 for every dial that turns', () => {
    const s = { dials: [{ fixed: false }, { fixed: true }, { fixed: false }] }
    expect(maxForSentence(s)).toBe(6)
  })
})

describe('lessons', () => {
  it('every lesson that has a sentence with a dial is offered, in number order, none locked, and Next lesson runs on to Lesson 52', () => {
    const numbers = LESSONS.map(l => l.lesson)
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
    expect(new Set(numbers).size).toBe(numbers.length)
    expect(numbers[0]).toBe(1)
    expect(numbers[numbers.length - 1]).toBe(52)
    expect(numbers.length).toBe(new Set(ALL_SENTENCES.map(s => s.lesson)).size)
    expect(FIRST_LESSON).toBe(1)
    expect(SENTENCES).toBe(ALL_SENTENCES)
    expect(SENTENCES.length).toBe(ALL_SENTENCES.length)
    // Next lesson walks the whole list and stops after the last
    let n = numbers[0]
    let steps = 1
    while (nextLesson(n) !== null) { n = nextLesson(n); steps++ }
    expect(n).toBe(52)
    expect(steps).toBe(numbers.length)
    expect(nextLesson(52)).toBe(null)
    expect(lessonSentences(52).length).toBeGreaterThan(0)
    expect(lessonSentences(15).length).toBeGreaterThan(0)
  })
  it('Lesson 1 has its five sentences in bank order, worth 45 points', () => {
    const l1 = lessonEntry(1)
    expect(l1.count).toBe(LESSON_1.length)
    expect(l1.count).toBe(5)
    expect(l1.max).toBe(45)
    expect(lessonSentences(1).map(s => s.id)).toEqual(LESSON_1.map(s => s.id))
  })
  it('leaves out only sentences with no dial to turn', () => {
    expect(ALL_SENTENCES.length).toBe(data.sentences.filter(s => s.dials.some(d => !d.fixed)).length)
    expect(ALL_SENTENCES.every(isPlayable)).toBe(true)
  })
  it('without the pilot every lesson with sentences is offered, in number order, none locked', () => {
    const all = buildLessons(sentencesIn(ALL_SENTENCES, null))
    expect(all.map(l => l.lesson)).toEqual([...all.map(l => l.lesson)].sort((a, b) => a - b))
    expect(all.length).toBeGreaterThan(40)
    expect(nextLesson(1, all)).toBe(all[1].lesson)
    expect(nextLesson(all[all.length - 1].lesson, all)).toBe(null)
  })
})

describe('a round', () => {
  it('opens the first dial on a wrong word, the rest waiting', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const s of LESSON_1) {
        const r = makeRound(s, makeRng(seed))
        expect(r.open).toBe(0)
        expect(r.dials[0].status).toBe('open')
        expect(currentWord(r.dials[0])).not.toBe(s.dials[0].right)
        expect(r.dials.slice(1).every(d => d.status === 'waiting')).toBe(true)
      }
    }
  })
  it('the starting word is seeded: the same seed gives the same start', () => {
    const a = makeRound(FIRST, makeRng(7)).dials.map(d => d.at)
    const b = makeRound(FIRST, makeRng(7)).dials.map(d => d.at)
    expect(a).toEqual(b)
  })
  it('fixed dials keep their word in place and are skipped', () => {
    const s = data.sentences.find(x => x.dials[0].fixed && x.dials.some(d => !d.fixed))
    const r = makeRound(s, makeRng(3))
    for (const d of r.dials.filter(x => x.status === 'fixed')) {
      expect(currentWord(d)).toBe(s.dials[d.index].right)
      expect(turn({ ...r, open: d.index }, 1).dials[d.index].at).toBe(0)
    }
    expect(r.dials[r.open].status).toBe('open')
    expect(s.dials[r.open].fixed).toBe(false)
  })
  it('turns only the open dial, wrapping both ways', () => {
    const r = makeRound(FIRST, makeRng(1))
    const n = r.dials[0].options.length
    expect(turn(r, n).dials[0].at).toBe(r.dials[0].at)
    expect(turn(r, -1).dials[0].at).toBe((r.dials[0].at + n - 1) % n)
    expect(turn(r, 1).dials[1].at).toBe(r.dials[1].at)
    expect(wordAt(r.dials[0], -1)).toBe(r.dials[0].options[(r.dials[0].at + n - 1) % n])
  })
  it('all right on the first try locks every dial green for 9 points', () => {
    let r = makeRound(FIRST, makeRng(5))
    for (const d of FIRST.dials) {
      r = turnTo(r, d.right)
      const out = lock(r)
      expect(out.outcome).toBe('right')
      r = out.round
    }
    expect(r.done).toBe(true)
    expect(r.dials.every(d => d.status === 'locked' && d.points === 3)).toBe(true)
    expect(roundPoints(r)).toBe(9)
    expect(roundMax(r)).toBe(9)
    expect(sentenceText(r)).toBe(FIRST.words.join(' '))
  })
  it('a wrong lock marks the word tried and costs one try; the same word again costs nothing', () => {
    let r = makeRound(FIRST, makeRng(2))
    const at = r.dials[0].at
    const out = lock(r)
    expect(out.outcome).toBe('wrong')
    r = out.round
    expect(r.dials[0]).toMatchObject({ status: 'open', wrong: 1, tried: [at], flash: true })
    expect(isTried(r.dials[0])).toBe(true)
    const again = lock(r)
    expect(again.outcome).toBe('tried')
    expect(again.round).toBe(r)
    expect(turn(r, 1).dials[0].flash).toBe(false)
  })
  it('second and third try score 2 and 1', () => {
    let r = makeRound(FIRST, makeRng(9))
    r = lock(r).round // wrong once
    r = turnTo(r, FIRST.dials[0].right)
    r = lock(r).round
    expect(r.dials[0].points).toBe(2)
    r = turnTo(r, untriedWrong(r)); r = lock(r).round
    r = turnTo(r, untriedWrong(r)); r = lock(r).round
    r = turnTo(r, FIRST.dials[1].right); r = lock(r).round
    expect(r.dials[1].points).toBe(1)
  })
  it('the third wrong try shows the answer for 0 points and opens the next dial', () => {
    let r = makeRound(FIRST, makeRng(4))
    for (let k = 0; k < 3; k++) {
      r = turnTo(r, untriedWrong(r))
      const out = lock(r)
      expect(out.outcome).toBe(k < 2 ? 'wrong' : 'shown')
      r = out.round
    }
    expect(r.dials[0]).toMatchObject({ status: 'shown', points: 0, wrong: 3 })
    expect(currentWord(r.dials[0])).toBe(FIRST.dials[0].right)
    expect(r.open).toBe(1)
    expect(r.dials[1].status).toBe('open')
    expect(r.last).toEqual({ outcome: 'shown', dial: 0 })
  })
})

describe('the game', () => {
  const t = 10_000
  const startGame = (s = FIRST) => gameReducer(initialGame(), { type: 'start', lesson: 1, total: 5, max: 45, round: makeRound(s, makeRng(1)), now: t })

  it('starts playing with no clock and no lives', () => {
    const g = startGame()
    expect(g.phase).toBe('playing')
    expect(Object.keys(g)).not.toContain('lives')
    expect(Object.keys(g)).not.toContain('timeLeft')
  })
  it('ignores a lock inside the lockout (a double tap) and a held repeat', () => {
    let g = startGame()
    const early = gameReducer(g, { type: 'lock', now: t + LOCK_LOCKOUT_MS - 1 })
    expect(early).toBe(g)
    g = gameReducer(g, { type: 'lock', now: t + LOCK_LOCKOUT_MS + 1 })
    expect(g.wrongs).toBe(1)
    const double = gameReducer(g, { type: 'turn', delta: 1 })
    expect(gameReducer(double, { type: 'lock', now: t + LOCK_LOCKOUT_MS + 50 })).toBe(double)
  })
  it('plays a lesson through to the lesson screen with every point counted', () => {
    let g = startGame(LESSON_1[0])
    let now = t
    for (let i = 0; i < LESSON_1.length; i++) {
      const s = LESSON_1[i]
      for (const d of s.dials) {
        let r = g.round
        r = turnTo(r, d.right)
        g = { ...g, round: r }
        now += LOCK_LOCKOUT_MS + 1
        g = gameReducer(g, { type: 'lock', now })
      }
      expect(g.round.done).toBe(true)
      expect(finishedCount(g)).toBe(i + 1)
      const tooSoon = gameReducer(g, { type: 'next', now: now + NEXT_LOCKOUT_MS - 1, round: LESSON_1[i + 1] && makeRound(LESSON_1[i + 1], makeRng(i)) })
      expect(tooSoon).toBe(g)
      now += NEXT_LOCKOUT_MS + 1
      g = gameReducer(g, { type: 'next', now, round: LESSON_1[i + 1] && makeRound(LESSON_1[i + 1], makeRng(i)) })
    }
    expect(g.phase).toBe('over')
    expect(g.score).toBe(45)
    expect(g.max).toBe(45)
    expect(g.firstTry).toBe(15)
    expect(g.results.map(r => r.id)).toEqual(LESSON_1.map(s => s.id))
  })
  it('a shown answer adds nothing to the score and counts as shown', () => {
    let g = startGame()
    let now = t
    for (let k = 0; k < 3; k++) {
      g = { ...g, round: turnTo(g.round, untriedWrong(g.round)) }
      now += LOCK_LOCKOUT_MS + 1
      g = gameReducer(g, { type: 'lock', now })
    }
    expect(g.score).toBe(0)
    expect(g.shown).toBe(1)
    expect(g.round.dials[0].status).toBe('shown')
  })
  it('quit returns to the title', () => {
    expect(gameReducer(startGame(), { type: 'quit' }).phase).toBe('title')
  })
})
