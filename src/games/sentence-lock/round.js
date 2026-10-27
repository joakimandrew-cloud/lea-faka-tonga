/**
 * Sentence Lock: one sentence on the lock (pure; the page supplies the rng).
 *
 * Andrew, 2026-10-27: "a game that like a bike lock. The user can click
 * through different options of words for each slot ... and they will see it
 * lock in as correct for each part of speech." One dial per Tongan word, in
 * the sentence's order, each with the options dials.json gives it.
 *
 * A dial's status:
 *   fixed    the word is placed for the player (dials.json `fixed`); no label, no turning
 *   waiting  to the right of the open dial: its label and an empty window
 *   open     the only dial that turns
 *   locked   locked on the right word (green, ticked)
 *   shown    three wrong tries: turned to the right word for the player, 0 points
 *
 * The open dial starts on a wrong option, picked by a seeded shuffle, so the
 * window never opens on the answer. Locking the right word locks the dial and
 * opens the next one. Locking a wrong word marks it tried on that dial and
 * counts one wrong try; the third wrong try shows the answer and play moves
 * on. Locking a word already tried on that dial does nothing (it never costs
 * a second try).
 */
import { shuffle } from '../shared/fair.js'
import { MAX_WRONG, dialPoints, maxForSentence } from './scoring.js'

function firstWaiting(dials, from = 0) {
  for (let i = from; i < dials.length; i++) if (dials[i].status === 'waiting') return i
  return null
}

/** A new round for a dials.json sentence. Every live dial gets its wrong starting option now, from `rng`. */
export function makeRound(sentence, rng = Math.random) {
  const dials = sentence.dials.map(d => {
    const rightAt = Math.max(0, d.options.indexOf(d.right))
    const base = {
      index: d.index,
      role: d.role,
      right: d.right,
      options: d.options,
      rightAt,
      tried: [],
      wrong: 0,
      points: null,
      flash: false,
    }
    if (d.fixed) return { ...base, options: [d.right], rightAt: 0, at: 0, status: 'fixed' }
    const wrongAt = d.options.map((_, i) => i).filter(i => i !== rightAt)
    const at = wrongAt.length ? shuffle(wrongAt, rng)[0] : rightAt
    return { ...base, at, status: 'waiting' }
  })
  const open = firstWaiting(dials)
  if (open != null) dials[open] = { ...dials[open], status: 'open' }
  return {
    id: sentence.id,
    lesson: sentence.lesson,
    english: sentence.english,
    words: sentence.words,
    dials,
    open,
    done: open == null,
    last: null, // { outcome, dial }: what the last lock did, for the line under the dials
  }
}

/** The word in a dial's window. */
export function currentWord(dial) {
  return dial.options[dial.at]
}

/** The word `offset` steps from the window (negative is above), wrapping round the wheel. */
export function wordAt(dial, offset) {
  const n = dial.options.length
  return dial.options[(((dial.at + offset) % n) + n) % n]
}

/** True when the word in the dial's window was already tried on it. */
export function isTried(dial) {
  return dial.tried.includes(dial.at)
}

/** Turns the open dial by `delta` steps (wrapping). Locked, fixed and waiting dials never turn. */
export function turn(round, delta) {
  if (!round || round.open == null || !Number.isInteger(delta) || delta === 0) return round
  const dials = [...round.dials]
  const d = dials[round.open]
  const n = d.options.length
  if (n < 2) return round
  dials[round.open] = { ...d, at: (((d.at + delta) % n) + n) % n, flash: false }
  return { ...round, dials }
}

/**
 * Locks the open dial on the word in its window.
 * Returns { round, outcome }: outcome is 'right', 'wrong', 'shown' (the third
 * wrong try), 'tried' (that word was already tried; nothing changes) or null
 * (no open dial).
 */
export function lock(round) {
  if (!round || round.open == null) return { round, outcome: null }
  const i = round.open
  const d = round.dials[i]
  const dials = [...round.dials]
  let outcome
  if (d.at === d.rightAt) {
    dials[i] = { ...d, status: 'locked', points: dialPoints(d.wrong), flash: false }
    outcome = 'right'
  } else if (d.tried.includes(d.at)) {
    return { round, outcome: 'tried' }
  } else {
    const wrong = d.wrong + 1
    const tried = [...d.tried, d.at]
    if (wrong >= MAX_WRONG) {
      dials[i] = { ...d, wrong, tried, status: 'shown', at: d.rightAt, points: dialPoints(wrong, true), flash: false }
      outcome = 'shown'
    } else {
      dials[i] = { ...d, wrong, tried, flash: true }
      return { round: { ...round, dials, last: { outcome: 'wrong', dial: i } }, outcome: 'wrong' }
    }
  }
  const open = firstWaiting(dials, i + 1)
  if (open != null) dials[open] = { ...dials[open], status: 'open' }
  return { round: { ...round, dials, open, done: open == null, last: { outcome, dial: i } }, outcome }
}

/** The points the round has scored so far. */
export function roundPoints(round) {
  return (round?.dials ?? []).reduce((t, d) => t + (d.points ?? 0), 0)
}

/** The most the round can score. */
export function roundMax(round) {
  return maxForSentence({ dials: (round?.dials ?? []).map(d => ({ fixed: d.status === 'fixed' })) })
}

/** The whole Tongan sentence, as dials.json gives its words. */
export function sentenceText(round) {
  return (round?.words ?? []).join(' ')
}
