/**
 * Sentence Tiles: the game state (a pure reducer, no React, no randomness).
 *
 * The page supplies every random choice (the round's shuffled tiles) and
 * every time (how long the round has run, and `now` for the lockouts) inside
 * the action, so the same actions always give the same game.
 *
 * Phases: title -> countdown (3, 2, 1) -> playing -> over.
 * One sentence is on screen at a time (`round`). Its status:
 *   building  the player is putting tiles in the line
 *   done      the sentence is finished; it scores, then the next comes
 *   timeout   time ran out; the right order shows, a life is lost
 *
 * A right tap moves the tile into the line. A wrong tap shakes the tile and
 * costs WRONG_TAP_MS off the clock, and the streak starts again; it never
 * costs a life. Running out of time costs a life. Three lives.
 *
 * Fill-in (Andrew's ruling at the Step 6 look): `fill` places the next word
 * of the order the line follows, exactly as a right tap would. A filled word
 * costs no time and no life, but it scores nothing: the sentence scores its
 * points times the share of words the player placed (a fully filled sentence
 * scores 0). A sentence with any filled word leaves the streak as it was (it
 * does not grow it, and does not break it) and counts in `helped`, not in
 * `correct`, so levels and the Sentences total are the player's own work.
 */
import { pointsFor, multiplierFor } from '../shared/scoring.js'
import { levelFor } from '../shared/levels.js'
import { isNextWord, fillSlot } from './rounds.js'

export const LIVES = 3
export const COUNTDOWN_FROM = 3
/** What a wrong tap costs: this much time off the sentence's clock. */
export const WRONG_TAP_MS = 1500
/**
 * A new sentence ignores taps for this long (ms), so the second tap of a
 * quick double tap on the last tile never lands on the next sentence; the
 * same wrong tile tapped again inside it is the same tap, not a second cost.
 */
export const TAP_LOCKOUT_MS = 250

export function initialGame(extra = {}) {
  return {
    phase: 'title', // title | countdown | playing | over
    gameId: 0,
    count: COUNTDOWN_FROM,
    paused: false,
    round: null,
    nextKey: 1,
    since: null, // { key, at }: when the current sentence was dealt
    score: 0,
    correct: 0, // sentences finished with no filled word
    helped: 0, // sentences finished with at least one filled word
    filledWords: 0, // words placed by the fill-in, this game
    streak: 0,
    bestStreak: 0,
    lives: LIVES,
    level: 1,
    levelUp: null, // { level, at } while the banner shows
    hits: 0, // lives lost so far
    wrongTaps: 0, // wrong taps so far (drives the shake and the cost label)
    missed: [], // sentences that timed out, once each
    misses: [], // every timed-out sentence id in order (the page's bag brings each back once)
    ...extra,
  }
}

/** Time left on the sentence's clock after it has run `elapsedMs`. */
export function timeLeftMs(round, elapsedMs) {
  if (!round) return 0
  return Math.max(0, round.durationMs - round.penaltyMs - Math.max(0, Number(elapsedMs) || 0))
}

/** True when the clock should stand still (paused, or no sentence being built). */
export function isFrozen(state) {
  return state.phase !== 'playing' || state.paused || !state.round || state.round.status !== 'building'
}

function addMissed(list, sentence) {
  return list.some(s => s.id === sentence.id) ? list : [...list, sentence]
}

function timeOut(state) {
  const { round } = state
  return {
    ...state,
    round: { ...round, status: 'timeout' },
    lives: Math.max(0, state.lives - 1),
    streak: 0,
    hits: state.hits + 1,
    missed: addMissed(state.missed, round.sentence),
    misses: [...state.misses, round.sentence.id],
  }
}

/** True when a tap or fill-in for this round arrives inside the new-sentence lockout. */
function lockedOut(state, round, now) {
  return now != null && state.since?.key === round.key && state.since.at != null && now - state.since.at < TAP_LOCKOUT_MS
}

/** Puts a tile in the line (a right tap, or a fill-in when `filled`); finishes the sentence when it is complete. */
function place(state, slot, elapsedMs, filled) {
  const { round } = state
  const placed = [...round.placed, slot]
  const filledAt = filled ? [...(round.filled ?? []), round.placed.length] : (round.filled ?? [])
  const filledWords = state.filledWords + (filled ? 1 : 0)
  if (placed.length < round.sentence.words.length) return { ...state, filledWords, round: { ...round, placed, filled: filledAt } }
  const total = round.sentence.words.length
  const own = total - filledAt.length
  const used = Math.max(0, Number(elapsedMs) || 0) + round.penaltyMs
  if (filledAt.length > 0) {
    // Helped: points for the player's own share only, at the streak as it stands; the streak stays.
    const full = pointsFor({ elapsedMs: used, durationMs: round.durationMs, streak: state.streak, level: state.level })
    const gain = Math.round((full * own) / total)
    return {
      ...state,
      filledWords,
      round: { ...round, placed, filled: filledAt, status: 'done', gain, mult: multiplierFor(state.streak) },
      score: state.score + gain,
      helped: state.helped + 1,
    }
  }
  const streak = state.streak + 1
  const correct = state.correct + 1
  const gain = pointsFor({ elapsedMs: used, durationMs: round.durationMs, streak, level: state.level })
  const level = levelFor(correct)
  return {
    ...state,
    filledWords,
    round: { ...round, placed, filled: filledAt, status: 'done', gain, mult: multiplierFor(streak) },
    score: state.score + gain,
    correct,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    level,
    levelUp: level > state.level ? { level, at: correct } : state.levelUp,
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
    case 'deal': {
      if (state.phase !== 'playing' || state.paused || state.round || !action.round) return state
      const key = state.nextKey
      return {
        ...state,
        nextKey: key + 1,
        round: { ...action.round, key, placed: [], filled: [], penaltyMs: 0, status: 'building', gain: 0, mult: 1, wrong: null },
        since: { key, at: action.now ?? null },
      }
    }
    case 'pick': {
      if (isFrozen(state)) return state
      const { round } = state
      // A tap is for one sentence only.
      if (action.key != null && action.key !== round.key) return state
      const tile = round.tiles.find(t => t.slot === action.slot)
      if (!tile || round.placed.includes(tile.slot)) return state
      const now = action.now
      if (lockedOut(state, round, now)) return state
      if (now != null && round.wrong && round.wrong.slot === tile.slot && now - round.wrong.at < TAP_LOCKOUT_MS) return state
      if (!isNextWord(round.sentence, round.placed.map(sl => round.tiles.find(t => t.slot === sl)?.text), tile.text)) {
        const wrongTaps = state.wrongTaps + 1
        const next = {
          ...state,
          wrongTaps,
          streak: 0,
          round: { ...round, penaltyMs: round.penaltyMs + WRONG_TAP_MS, wrong: { slot: tile.slot, at: now ?? null, n: wrongTaps } },
        }
        // The cost can use up the last of the time.
        return timeLeftMs(next.round, action.elapsedMs) <= 0 ? timeOut(next) : next
      }
      return place(state, tile.slot, action.elapsedMs, false)
    }
    case 'fill': {
      // The fill-in: the next word of the order the line follows, as a right tap would place it.
      if (isFrozen(state)) return state
      const { round } = state
      if (action.key != null && action.key !== round.key) return state
      if (lockedOut(state, round, action.now)) return state
      const slot = fillSlot(round.sentence, round.tiles, round.placed)
      if (slot == null) return state
      return place(state, slot, action.elapsedMs, true)
    }
    case 'timeout': {
      if (state.phase !== 'playing' || !state.round || state.round.status !== 'building') return state
      if (action.key != null && action.key !== state.round.key) return state
      return timeOut(state)
    }
    case 'next': {
      if (!state.round || state.round.status === 'building') return state
      if (state.lives <= 0) return { ...state, round: null, paused: false, phase: 'over' }
      return { ...state, round: null }
    }
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

export function gameReducer(state, action) {
  return reduce(state, action)
}
