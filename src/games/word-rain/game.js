/**
 * Word Rain: the game state (a pure reducer, no React, no randomness).
 *
 * The page supplies every random choice (the round, the flight time, where a
 * word enters) inside the action, so the same actions always give the same
 * game, and the rules below are tested in game.test.js.
 *
 * Phases: title -> countdown (3, 2, 1) -> playing -> over.
 * Words in the air live in `words`, oldest first. Each has a fate:
 *   flying   still moving and answerable (only the front one is answered)
 *   popped   answered right; shows its burst until popDone removes it
 *   lost     answered wrong; held while the right pair shows
 *   escaped  reached the far edge (splashed or flew off) unanswered
 * The answer buttons belong to the front word: the first word still flying.
 * While a wrong answer or a miss is being shown (`reveal`), or while the game
 * is paused, every word is frozen and answers are ignored.
 */
import { pointsFor, multiplierFor } from '../shared/scoring.js'
import { levelFor, MAX_IN_AIR } from './levels.js'

export const LIVES = 3
export const COUNTDOWN_FROM = 3
export const RECENT = 10
/** A word that has just become the front word ignores answers for this long (ms). */
export const ANSWER_LOCKOUT_MS = 250

export function initialGame(extra = {}) {
  return {
    phase: 'title', // title | countdown | playing | over
    gameId: 0,
    count: COUNTDOWN_FROM,
    paused: false,
    words: [],
    nextKey: 1,
    since: null, // { key, at }: when the current front word became the front word
    reveal: null, // { key, kind: 'wrong' | 'missed', round }
    last: null, // the round the buttons showed last: { key, round, chosen, right }
    score: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    lives: LIVES,
    level: 1,
    levelUp: null, // { level, at } while the banner shows
    hits: 0, // lives lost so far (drives the shake and the heart)
    missed: [],
    misses: [], // every miss in order, by target id (the page's shuffle bag brings each one back once)
    recent: [],
    ...extra,
  }
}

/** The word the answer buttons belong to: the oldest word still flying. */
export function frontWord(state) {
  return state.words.find(w => w.fate === 'flying') ?? null
}

export function flyingCount(state) {
  return state.words.filter(w => w.fate === 'flying').length
}

/** True when every word should stand still (paused, or a miss is showing). */
export function isFrozen(state) {
  return state.phase !== 'playing' || state.paused || state.reveal !== null
}

function addMissed(list, card) {
  return list.some(c => c.id === card.id) ? list : [...list, card]
}

function loseLife(state, word, kind, chosen = null) {
  const words = state.words.map(w => (w.key === word.key ? { ...w, fate: kind === 'wrong' ? 'lost' : 'escaped' } : w))
  return {
    ...state,
    words,
    lives: Math.max(0, state.lives - 1),
    streak: 0,
    hits: state.hits + 1,
    missed: addMissed(state.missed, word.round.target),
    misses: [...state.misses, word.round.target.id],
    // A second miss while one is already showing keeps the first on screen.
    reveal: state.reveal ?? { key: word.key, kind, round: word.round },
    last: state.reveal ? state.last : { key: word.key, round: word.round, chosen, right: false },
  }
}

function reduce(state, action) {
  switch (action.type) {
    case 'start': {
      const base = initialGame({ gameId: state.gameId + 1 })
      return action.instant ? { ...base, phase: 'playing' } : { ...base, phase: 'countdown' }
    }
    case 'tick': {
      if (state.phase !== 'countdown' || state.paused) return state
      if (state.count <= 1) return { ...state, phase: 'playing', count: 0 }
      return { ...state, count: state.count - 1 }
    }
    case 'launch': {
      if (state.phase !== 'playing' || state.paused || state.reveal) return state
      const flying = flyingCount(state)
      if (flying >= MAX_IN_AIR || !action.round) return state
      const key = state.nextKey
      const word = { key, round: action.round, duration: action.duration, x: action.x ?? 0.5, fate: 'flying', gain: 0, mult: 1 }
      return {
        ...state,
        words: [...state.words, word],
        nextKey: key + 1,
        recent: [action.round.target.id, ...state.recent.filter(id => id !== action.round.target.id)].slice(0, RECENT),
      }
    }
    case 'answer': {
      if (isFrozen(state)) return state
      const front = frontWord(state)
      if (!front) return state
      // An answer is for one word only: a tap aimed at a word that has since
      // been answered or has escaped is dropped, never applied to the next.
      if (action.key != null && action.key !== front.key) return state
      const { index } = action
      if (!Number.isInteger(index) || index < 0 || index >= front.round.options.length) return state
      // A quick double tap (or a held key) aimed at the word that has just
      // moved to the front is the second tap of the first answer, not an
      // answer to it. The page stamps every action with `now`.
      if (state.since && state.since.key === front.key && state.since.at != null && action.now != null
        && action.now - state.since.at < ANSWER_LOCKOUT_MS) return state
      if (index !== front.round.correctIndex) return loseLife(state, front, 'wrong', index)
      const streak = state.streak + 1
      const correct = state.correct + 1
      const gain = pointsFor({ elapsedMs: action.elapsedMs, durationMs: front.duration, streak, level: state.level })
      const level = levelFor(correct)
      return {
        ...state,
        words: state.words.map(w => (w.key === front.key ? { ...w, fate: 'popped', gain, mult: multiplierFor(streak) } : w)),
        score: state.score + gain,
        correct,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        level,
        levelUp: level > state.level ? { level, at: correct } : state.levelUp,
        last: { key: front.key, round: front.round, chosen: index, right: true },
      }
    }
    case 'escape': {
      if (state.phase !== 'playing') return state
      const word = state.words.find(w => w.key === action.key)
      if (!word || word.fate !== 'flying') return state
      return loseLife(state, word, 'missed')
    }
    case 'revealDone': {
      if (!state.reveal) return state
      const words = state.words.filter(w => w.fate === 'flying' || w.fate === 'popped')
      if (state.lives <= 0) return { ...state, words: [], reveal: null, paused: false, phase: 'over' }
      return { ...state, words, reveal: null }
    }
    case 'popDone':
      return { ...state, words: state.words.filter(w => !(w.key === action.key && w.fate === 'popped')) }
    case 'levelUpDone':
      return state.levelUp && state.levelUp.at === action.at ? { ...state, levelUp: null } : state
    case 'pause':
      if ((state.phase !== 'playing' && state.phase !== 'countdown') || state.paused) return state
      return { ...state, paused: true }
    case 'resume':
      return state.paused ? { ...state, paused: false } : state
    case 'quit':
      return initialGame({ gameId: state.gameId })
    default:
      return state
  }
}

/**
 * The reducer: the rules above, plus a stamp of when the front word changed
 * (from the action's `now`), which the answer lockout reads.
 */
export function gameReducer(state, action) {
  const next = reduce(state, action)
  if (next === state) return state
  const was = frontWord(state)?.key ?? null
  const now = frontWord(next)
  if ((now?.key ?? null) === was) return next
  return { ...next, since: now ? { key: now.key, at: action.now ?? null } : null }
}
