/**
 * Sentence Lock: the game state (a pure reducer, no React, no randomness).
 *
 * The page supplies every round (made with its own seeded rng) and the time
 * each action was sent (`now`, read only by the lockouts), so the same
 * actions always give the same game.
 *
 * Untimed: no clock, no lives, no game over (Andrew, 2026-10-27: "Fewer
 * tries, more points"). One game is one lesson; its sentences come in bank
 * order, and the lesson screen follows the last one.
 *
 * Phases: title -> playing -> over.
 * While playing, the round is either turning (an open dial) or done (every
 * dial locked or shown; the whole sentence and its points show with a Next
 * sentence button).
 *
 * Fairness (Games-Method rule 5): a Lock inside LOCK_LOCKOUT_MS of the last
 * lock, of the sentence's start or of the game's start is ignored, so a quick
 * double tap never spends a try on the dial that just opened. Next sentence is
 * ignored inside NEXT_LOCKOUT_MS of the sentence finishing, so a double tap on
 * the last Lock (the Next button sits where Lock was) never skips the finished
 * sentence. The held-key guard is the page's (a repeating key does nothing).
 */
import { lock, turn, roundPoints, roundMax } from './round.js'

export const LOCK_LOCKOUT_MS = 300
export const NEXT_LOCKOUT_MS = 600

export function initialGame(extra = {}) {
  return {
    phase: 'title', // title | playing | over
    gameId: 0,
    lesson: null,
    total: 0, // sentences in the lesson
    max: 0, // the lesson's most points
    index: 0, // the sentence being played, 0-based
    round: null,
    score: 0,
    results: [], // { id, points, max } per finished sentence
    rights: 0, // right locks this game
    firstTry: 0, // dials locked on the first try
    shown: 0, // dials whose answer was shown
    wrongs: 0, // wrong locks this game (drives the shake and sound)
    lockAt: null, // when the last lock (or the sentence) began
    doneAt: null, // when the current sentence finished
    ...extra,
  }
}

function inside(since, now, ms) {
  return since != null && now != null && now - since < ms
}

function reduce(state, action) {
  switch (action.type) {
    case 'start': {
      if (!action.round) return state
      return {
        ...initialGame({ gameId: state.gameId + 1 }),
        phase: 'playing',
        lesson: action.lesson ?? null,
        total: Math.max(1, Math.floor(Number(action.total) || 1)),
        max: Math.max(0, Number(action.max) || 0),
        round: action.round,
        lockAt: action.now ?? null,
      }
    }
    case 'turn': {
      if (state.phase !== 'playing' || !state.round || state.round.done) return state
      const round = turn(state.round, action.delta)
      return round === state.round ? state : { ...state, round }
    }
    case 'lock': {
      if (state.phase !== 'playing' || !state.round || state.round.done) return state
      if (inside(state.lockAt, action.now, LOCK_LOCKOUT_MS)) return state
      const { round, outcome } = lock(state.round)
      if (outcome == null || outcome === 'tried') return state
      const was = state.round.dials[state.round.open]
      const settled = round.dials[state.round.open]
      const gain = outcome === 'wrong' ? 0 : settled.points ?? 0
      const next = {
        ...state,
        round,
        score: state.score + gain,
        rights: state.rights + (outcome === 'right' ? 1 : 0),
        firstTry: state.firstTry + (outcome === 'right' && was.wrong === 0 ? 1 : 0),
        shown: state.shown + (outcome === 'shown' ? 1 : 0),
        wrongs: state.wrongs + (outcome === 'wrong' || outcome === 'shown' ? 1 : 0),
        lockAt: action.now ?? null,
      }
      if (!round.done) return next
      return {
        ...next,
        results: [...state.results, { id: round.id, points: roundPoints(round), max: roundMax(round) }],
        doneAt: action.now ?? null,
      }
    }
    case 'next': {
      if (state.phase !== 'playing' || !state.round || !state.round.done) return state
      if (inside(state.doneAt, action.now, NEXT_LOCKOUT_MS)) return state
      if (state.index + 1 >= state.total) return { ...state, phase: 'over' }
      if (!action.round) return state
      return { ...state, index: state.index + 1, round: action.round, lockAt: action.now ?? null, doneAt: null }
    }
    case 'quit':
      return initialGame({ gameId: state.gameId })
    default:
      return state
  }
}

export function gameReducer(state, action) {
  return reduce(state, action)
}

/** Sentences of the lesson finished so far. */
export function finishedCount(state) {
  return state.results.length
}
