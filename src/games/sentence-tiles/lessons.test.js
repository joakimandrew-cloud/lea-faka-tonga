import { describe, it, expect, beforeEach } from 'vitest'
import { makeRng } from '../shared/fair.js'
import { LESSONS, FIRST_LESSON, nextLesson } from './deck.js'
import { makeRound } from './rounds.js'
import { gameReducer, initialGame } from './game.js'
import {
  PROGRESS_KEY, freshProgress, parseProgress, progressAfter, startingLesson,
  loadProgress, saveProgress, lessonBag, dealFromLesson,
} from './lessons.js'

// Sentences come from the book's data; no Tongan is typed here.

/** A stand-in for the browser's localStorage, so progress can be saved and read back. */
function fakeStorage() {
  const m = new Map()
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: k => { m.delete(k) },
    clear: () => m.clear(),
  }
}

/**
 * Plays one whole lesson the way the page does: a bag of the lesson's
 * sentences, dealt one at a time, each built with right taps. Returns the
 * sentences in the order dealt and the finished state.
 */
function playLesson(lesson, rng) {
  const entry = LESSONS.find(l => l.lesson === lesson)
  let state = gameReducer(initialGame(), { type: 'start', lesson, total: entry.count })
  let bag = lessonBag(lesson, rng)
  const dealt = []
  let now = 0
  for (let guard = 0; state.phase === 'playing' && guard < 100; guard++) {
    const d = dealFromLesson(bag, rng)
    bag = d.bag
    if (!d.sentence) break
    dealt.push(d.sentence)
    now += 10000
    state = gameReducer(state, { type: 'deal', round: makeRound(d.sentence, rng), now })
    const used = new Set()
    for (const w of d.sentence.words) {
      const t = state.round.tiles.find(x => x.text === w && !used.has(x.slot))
      used.add(t.slot)
      now += 300
      state = gameReducer(state, { type: 'pick', key: state.round.key, slot: t.slot, now })
    }
    state = gameReducer(state, { type: 'next' })
  }
  return { dealt, state, bag }
}

describe('Sentence Tiles lesson order and progress', () => {
  let saved
  beforeEach(() => {
    saved = globalThis.window
    globalThis.window = { localStorage: fakeStorage() }
    return () => { globalThis.window = saved }
  })

  it('starts a new player at Lesson 1, and the first sentence dealt is from Lesson 1', () => {
    expect(FIRST_LESSON).toBe(1)
    expect(freshProgress()).toEqual({ furthest: 1, done: [] })
    expect(loadProgress()).toEqual(freshProgress())
    const lesson = startingLesson(loadProgress())
    expect(lesson).toBe(1)
    for (let seed = 1; seed <= 20; seed++) {
      const { sentence } = dealFromLesson(lessonBag(lesson, makeRng(seed)), makeRng(seed))
      expect(sentence.chapter).toBe(1)
    }
  })

  it('deals each sentence of a lesson once, only that lesson, then ends the game', () => {
    for (const l of LESSONS) {
      const { dealt, state, bag } = playLesson(l.lesson, makeRng(l.lesson))
      expect(dealt.every(s => s.chapter === l.lesson)).toBe(true)
      expect(dealt.map(s => s.id).sort()).toEqual(l.cards.map(s => s.id).sort())
      expect(state.phase).toBe('over')
      expect(state.correct).toBe(l.count)
      // the bag is never refilled inside a game
      expect(dealFromLesson(bag, makeRng(1)).sentence).toBe(null)
    }
  })

  it('plays the lessons in order: finishing one moves the player on to the next', () => {
    let progress = freshProgress()
    const order = []
    for (let k = 0; k < 6; k++) {
      const lesson = startingLesson(progress)
      const { dealt, state } = playLesson(lesson, makeRng(100 + k))
      expect(state.phase).toBe('over')
      order.push(...dealt.map(s => s.chapter))
      progress = progressAfter(progress, lesson)
    }
    const want = LESSONS.slice(0, 6).flatMap(l => Array(l.count).fill(l.lesson))
    expect(order).toEqual(want)
    // never out of lesson order
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThanOrEqual(order[i - 1])
    expect(progress.furthest).toBe(LESSONS[6].lesson)
    expect(progress.done).toEqual(LESSONS.slice(0, 6).map(l => l.lesson))
  })

  it('saves progress and reads it back', () => {
    let p = progressAfter(freshProgress(), 1)
    p = progressAfter(p, 2)
    saveProgress(p)
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_KEY))).toEqual({ furthest: 3, done: [1, 2] })
    expect(loadProgress()).toEqual({ furthest: 3, done: [1, 2] })
    expect(startingLesson(loadProgress())).toBe(3)
  })

  it('never moves progress back when an earlier lesson is played again, and stops at the last lesson', () => {
    let p = progressAfter(progressAfter(freshProgress(), 1), 2)
    p = progressAfter(p, 1)
    expect(p).toEqual({ furthest: 3, done: [1, 2] })
    const last = LESSONS[LESSONS.length - 1].lesson
    expect(nextLesson(last)).toBe(null)
    p = progressAfter(p, last)
    expect(p.furthest).toBe(last)
    expect(p.done).toContain(last)
  })

  it('reads anything unreadable as a new player, and drops lessons the game does not offer', () => {
    expect(parseProgress(null)).toEqual(freshProgress())
    expect(parseProgress('not json')).toEqual(freshProgress())
    expect(parseProgress('[1,2]').furthest).toBe(1)
    expect(parseProgress(JSON.stringify({ furthest: 4, done: [1, 2, 2, 999, 'x'] }))).toEqual({ furthest: 4, done: [1, 2] })
    expect(parseProgress(JSON.stringify({ furthest: 999 })).furthest).toBe(LESSONS[LESSONS.length - 1].lesson)
    // a browser that refuses storage: progress lasts the visit, and reading gives a new player
    globalThis.window = { get localStorage() { throw new Error('blocked') } }
    expect(() => saveProgress({ furthest: 5, done: [1] })).not.toThrow()
    expect(loadProgress()).toEqual(freshProgress())
  })

  it('does not open a replayed lesson with the sentence the last game ended on', () => {
    const l = LESSONS.find(x => x.count >= 3)
    for (let seed = 1; seed <= 20; seed++) {
      const last = l.cards[seed % l.count].id
      const { sentence } = dealFromLesson(lessonBag(l.lesson, makeRng(seed), { last }), makeRng(seed))
      expect(sentence.id).not.toBe(last)
    }
  })
})
