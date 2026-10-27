import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import { okinafy } from '../lib/okinafy.js'
import T, { Inline } from '../premium/components/T.jsx'
import {
  LESSONS, FIRST_LESSON, lessonEntry, nextLesson, lessonSentences,
  makeRound, currentWord, wordAt, isTried, roundPoints, roundMax, sentenceText,
  gameReducer, initialGame, finishedCount, MAX_WRONG,
  showHowToOnStart, markHowToSeen, howToSteps,
} from '../games/sentence-lock'
import { makeRng } from '../games/shared/fair.js'
import { readStore, writeStore } from '../games/shared/store.js'
import { readBests, bestOf, recordBest } from '../games/shared/best-scores.js'
import { unlock, play } from '../games/shared/sound.js'
import { Sky, Ground, Confetti, SoundIcon } from '../games/word-rain/scene.jsx'

/**
 * Sentence Lock (plan 2026-10-27-sentence-lock-game, Step 5). Andrew,
 * 2026-10-27: "a game that like a bike lock. The user can click through
 * different options of words for each slot ... and they will see it lock in
 * as correct for each part of speech for the sentence they are trying to make."
 *
 * The English of a book sentence sits on top; under it, one dial per Tongan
 * word, in order, each labelled with its kind of word. Only the open dial
 * turns (tap the word above or below it, swipe or drag it, the mouse wheel, or
 * the up and down keys). Check (the button under the open wheel, or Enter)
 * checks it: the right word locks in (a bolt slides across the wheel, it
 * settles green with its tick and a latch click) and the next dial opens; a
 * wrong word shakes red, is marked tried and fills one of three try marks;
 * the third wrong try shows the answer in its own colour and play moves on.
 * The last dial springs the lock open (its shackle lifts), then the sentence
 * and Next sentence show. 3, 2, 1 or 0 points a dial. No clock, no lives.
 *
 * Step 6 (Andrew, 2026-10-27): no Lock bar at the bottom of the screen, the
 * action lives on the lock; a "How to play" card shows after Play the first
 * time on this device and reopens from the header.
 *
 * The page only renders: the rules live in src/games/sentence-lock/ (lessons,
 * rounds, scoring, reducer, all tested). The look is Word Balloons' own
 * (word-rain.css); sentence-lock.css adds the card, the lock and its dials.
 * Mounted through src/premium/pages/SentenceLock.jsx, which loads the sheets.
 */

const MUTE_KEY = 'lft-sentence-lock-muted'
// Best scores by lesson ({ "lesson:N": { score, level } }, level holding the lesson number).
const BEST_KEY = 'lft-sentence-lock-best'
// A drag or swipe turns the dial one word for every this many pixels.
const DRAG_STEP = 34
// The mouse wheel turns one word per this much scroll, and no faster than one per WHEEL_GAP ms.
const WHEEL_STEP = 40
const WHEEL_GAP = 90

function readMuted() { return readStore(MUTE_KEY) === '1' }
// The store the How to play flag uses (readStore / writeStore already survive refused storage).
const STORE = { read: readStore, write: writeStore }

// ── reduced motion (read live) ─────────────────────────────────────────
const REDUCED = '(prefers-reduced-motion: reduce)'
function subscribeReduced(cb) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(REDUCED)
  mq.addEventListener?.('change', cb)
  return () => mq.removeEventListener?.('change', cb)
}
function getReduced() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(REDUCED).matches
}
function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, getReduced, () => false)
}

function buzz() {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate(60)
  } catch { /* no vibration */ }
}

/** Scrolls the board (its own scroll box, never the page) the least it takes to show `first`
    to `last` whole: below a band of `topBand` pixels at its top (the English held there) and
    above the hills, which overlap the board's foot. */
function showInBoard(board, first, last, topBand) {
  if (!board || !first) return
  const b = board.getBoundingClientRect()
  const hills = board.closest('.rain-scene')?.querySelector('.rain-ground')?.getBoundingClientRect()
  const top = b.top + topBand + 4
  const bottom = Math.min(b.bottom, hills ? hills.top : b.bottom) - 4
  const fromY = first.getBoundingClientRect().top
  const toY = (last ?? first).getBoundingClientRect().bottom
  let d = 0
  if (toY > bottom) d = toY - bottom
  if (fromY - d < top) d = fromY - top
  if (d) board.scrollTop += d
}

const SHAKE = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' },
]

function Chevron({ up }) {
  return (
    <svg className="sl-chev" viewBox="0 0 24 12" aria-hidden="true" focusable="false">
      <path d={up ? 'M5 10 L12 3 L19 10' : 'M5 2 L12 9 L19 2'} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Tick() {
  return (
    <svg className="sl-tick" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg className="sl-help-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.6 7.7 a2.5 2.5 0 1 1 3.4 2.3 c-0.7 0.3 -1 0.8 -1 1.5 v0.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="10" cy="14.6" r="1.1" fill="currentColor" />
    </svg>
  )
}

/** The How to play card: five plain steps and Start. */
function HowTo({ onClose, isTouch }) {
  const startRef = useRef(null)
  useEffect(() => { startRef.current?.focus({ preventScroll: true }) }, [])
  return (
    <div className="rain-over-wrap sl-howto-wrap">
      <section className="rain-over sl-howto" role="dialog" aria-modal="true" aria-labelledby="sl-howto-title">
        <h2 className="rain-over-label sl-howto-title" id="sl-howto-title">How to play</h2>
        <ol className="sl-howto-steps">
          {howToSteps().map((st, i) => (
            <li key={st.id} data-step={st.id}><span className="sl-howto-num" aria-hidden="true">{i + 1}</span><span>{st.text}</span></li>
          ))}
        </ol>
        <button type="button" ref={startRef} className="rain-btn rain-btn-primary sl-howto-start" onClick={onClose}>Start</button>
        {!isTouch && <span className="rain-keys sl-howto-keys"><kbd>Enter</kbd> starts · <kbd>Esc</kbd> closes</span>}
      </section>
    </div>
  )
}

/** The widest word a dial can show, in characters (keeps the window from jumping as it turns). */
function widest(options) {
  return options.reduce((m, w) => Math.max(m, okinafy(w).length), 3)
}

/**
 * One dial of the lock. The open dial has its turn buttons (each shows the
 * neighbouring word faintly) and takes swipes, drags and the mouse wheel.
 */
function Dial({ dial, total, onTurn, onCheck, registerWindow }) {
  const { status, options } = dial
  const open = status === 'open'
  const word = status === 'waiting' ? null : currentWord(dial)
  const tried = open && isTried(dial)
  const wheelRef = useRef(null)
  const drag = useRef(null)
  const dragged = useRef(false)

  // Swipe or drag: one word per DRAG_STEP pixels; down brings the word above into the window.
  const onPointerDown = (e) => {
    if (!open || (e.pointerType === 'mouse' && e.button !== 0)) return
    drag.current = { id: e.pointerId, y: e.clientY, moved: false }
    dragged.current = false
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dy = e.clientY - d.y
    if (!d.moved && Math.abs(dy) < 8) return
    if (!d.moved) {
      d.moved = true
      dragged.current = true
      try { wheelRef.current?.setPointerCapture(e.pointerId) } catch { /* capture is a nicety */ }
    }
    const steps = Math.trunc(dy / DRAG_STEP)
    if (steps !== 0) {
      onTurn(-steps)
      d.y += steps * DRAG_STEP
    }
  }
  const onPointerEnd = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    try { wheelRef.current?.releasePointerCapture(e.pointerId) } catch { /* not captured */ }
  }
  // A tap on a turn button turns once; the click that ends a drag does not.
  const tap = (delta) => () => {
    if (dragged.current) { dragged.current = false; return }
    onTurn(delta)
  }

  // The mouse wheel (a native listener, so the page does not scroll while the dial turns).
  useEffect(() => {
    const el = wheelRef.current
    if (!el || !open) return
    let acc = 0
    let last = 0
    const onWheel = (e) => {
      e.preventDefault()
      const unit = e.deltaMode === 1 ? WHEEL_STEP : e.deltaMode === 2 ? WHEEL_STEP * 4 : 1
      acc += e.deltaY * unit
      const now = performance.now()
      if (Math.abs(acc) < WHEEL_STEP || now - last < WHEEL_GAP) return
      onTurn(acc > 0 ? 1 : -1)
      acc = 0
      last = now
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [open, onTurn])

  const label = status === 'fixed' ? '' : (dial.role ?? '')
  const statusText = status === 'locked' ? 'locked' : status === 'shown' ? 'answer shown' : status === 'waiting' ? 'not open yet' : ''
  return (
    <div
      className={`sl-dial is-${status}${dial.flash ? ' is-wrong' : ''}${tried ? ' is-tried' : ''}`}
      data-index={dial.index}
      data-status={status}
      data-word={word != null ? okinafy(word) : ''}
      data-points={dial.points ?? ''}
      data-wrong={dial.wrong}
      style={{ '--chars': widest(options) }}
    >
      <span className="sl-label" aria-hidden={status === 'fixed' ? 'true' : undefined}>{label || ' '}</span>
      <div
        className="sl-wheel"
        ref={wheelRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {open
          ? (
            <button type="button" className="sl-turn sl-up" onClick={tap(-1)} aria-label={`Turn up to ${okinafy(wordAt(dial, -1))}`} data-word={okinafy(wordAt(dial, -1))}>
              <Chevron up />
              <T className={`font-tongan sl-near${dial.tried.includes((dial.at - 1 + options.length) % options.length) ? ' is-tried' : ''}`}>{wordAt(dial, -1)}</T>
            </button>
            )
          : <span className="sl-turn sl-rest" aria-hidden="true" />}
        <div
          className="sl-window"
          ref={open ? registerWindow : undefined}
          role={open ? 'spinbutton' : undefined}
          tabIndex={open ? 0 : undefined}
          aria-label={open ? `Dial ${dial.index + 1} of ${total}, ${label || 'word'}` : `${label ? label + ', ' : ''}${statusText || okinafy(word ?? '')}`}
          aria-valuenow={open ? dial.at + 1 : undefined}
          aria-valuemin={open ? 1 : undefined}
          aria-valuemax={open ? options.length : undefined}
          aria-valuetext={open ? `${okinafy(word)}${tried ? ', tried' : ''}` : undefined}
        >
          {word != null && <T className="font-tongan sl-word">{word}</T>}
          {status === 'locked' && <Tick />}
          {status === 'locked' && <span className="sl-bolt" aria-hidden="true"><i /><i /></span>}
          {status === 'shown' && <span className="sl-shown-mark">shown</span>}
          {tried && <span className="sl-tried-mark">tried</span>}
        </div>
        {open
          ? (
            <button type="button" className="sl-turn sl-down" onClick={tap(1)} aria-label={`Turn down to ${okinafy(wordAt(dial, 1))}`} data-word={okinafy(wordAt(dial, 1))}>
              <T className={`font-tongan sl-near${dial.tried.includes((dial.at + 1) % options.length) ? ' is-tried' : ''}`}>{wordAt(dial, 1)}</T>
              <Chevron />
            </button>
            )
          : <span className="sl-turn sl-rest" aria-hidden="true" />}
      </div>
      {/* Under the wheel: Check on the open dial, the points on a settled one. */}
      <span className="sl-slot">
        {open && (
          <button
            type="button"
            className="sl-check"
            data-enter="check"
            onClick={onCheck}
            disabled={tried}
            aria-label={`Check ${okinafy(word)}`}
          >
            <Tick /> Check
          </button>
        )}
        {(status === 'locked' || status === 'shown') && <span className="sl-points">+{dial.points}</span>}
      </span>
      <span className="sl-foot">
        {open && (
          <span className="sl-tries" role="img" aria-label={`${dial.wrong} of ${MAX_WRONG} tries used`} data-filled={dial.wrong}>
            {Array.from({ length: MAX_WRONG }, (_, i) => <i key={i} className={i < dial.wrong ? 'is-on' : ''} />)}
          </span>
        )}
      </span>
    </div>
  )
}

/** The title screen's lock: a real sentence of the chosen lesson on its starting words, for show. */
function IdleLock({ round }) {
  return (
    <div className="sl-idle" aria-hidden="true">
      <div className="sl-lock sl-lock-idle">
        {round.dials.map(d => (
          <div key={d.index} className={`sl-dial is-idle${d.status === 'fixed' ? ' is-fixed' : ''}`} style={{ '--chars': widest(d.options) }}>
            <div className="sl-wheel">
              <span className="sl-turn sl-rest"><T className="font-tongan sl-near">{wordAt(d, -1)}</T></span>
              <div className="sl-window"><T className="font-tongan sl-word">{currentWord(d)}</T></div>
              <span className="sl-turn sl-rest"><T className="font-tongan sl-near">{wordAt(d, 1)}</T></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SentenceLock() {
  const [lessonNo, setLessonNo] = useState(FIRST_LESSON)
  const [muted, setMutedState] = useState(readMuted)
  const [bests, setBests] = useState(() => readBests(BEST_KEY))
  const [result, setResult] = useState(null) // { newBest, best }
  // The How to play card: shown on the first Play on this device, and from the header button.
  const [howTo, setHowTo] = useState(false)
  const howToRef = useRef(false)
  // The open dial's window (the keyboard's home while a sentence is turning).
  const windowEl = useRef(null)
  useEffect(() => { howToRef.current = howTo })
  const [state, rawDispatch] = useReducer(gameReducer, undefined, () => initialGame())
  // Every action carries the time it was sent (the lockouts read it).
  const dispatch = useCallback((action) => rawDispatch({ ...action, now: performance.now() }), [])
  const isTouch = useIsTouchPrimary()
  const reduced = useReducedMotion()

  const choice = useMemo(() => lessonEntry(lessonNo), [lessonNo])
  const best = bestOf(bests, choice.id)

  const { phase, round, score } = state
  const inGame = phase === 'playing'
  const shownLesson = state.lesson ?? choice.lesson
  const played = lessonEntry(shownLesson)
  const after = nextLesson(shownLesson)
  const finished = finishedCount(state)

  // The title screen's lock: a sentence of the chosen lesson, new on each visit.
  const [titleSeed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const titleRound = useMemo(() => {
    const list = lessonSentences(choice.lesson)
    if (!list.length) return null
    const rng = makeRng(titleSeed)
    return makeRound(list[Math.floor(rng() * list.length)], rng)
  }, [choice, titleSeed])

  const stateRef = useRef(state)
  const settingsRef = useRef({ choice, bests, muted })
  useEffect(() => { stateRef.current = state })
  useEffect(() => { settingsRef.current = { choice, bests, muted } })

  // Each game has its own seed; sentence i of the lesson starts its dials from seed + i.
  const seedRef = useRef(1)
  const roundFor = useCallback((lesson, i) => {
    const s = lessonSentences(lesson)[i]
    return s ? makeRound(s, makeRng(seedRef.current + i)) : null
  }, [])

  const sound = useCallback((name, ...args) => {
    if (!settingsRef.current.muted) play(name, ...args)
  }, [])

  const toggleMute = useCallback(() => {
    const next = !settingsRef.current.muted
    writeStore(MUTE_KEY, next ? '1' : '0')
    if (!next) unlock()
    settingsRef.current = { ...settingsRef.current, muted: next }
    setMutedState(next)
  }, [])

  const start = useCallback((lesson) => {
    if (!settingsRef.current.muted) unlock()
    const entry = lessonEntry(lesson ?? settingsRef.current.choice.lesson)
    seedRef.current = Math.floor(Math.random() * 2 ** 31)
    setResult(null)
    setLessonNo(entry.lesson)
    dispatch({ type: 'start', lesson: entry.lesson, total: entry.count, max: entry.max, round: roundFor(entry.lesson, 0) })
    const first = showHowToOnStart(STORE)
    howToRef.current = first
    setHowTo(first)
  }, [dispatch, roundFor])

  const openHowTo = useCallback(() => { howToRef.current = true; setHowTo(true) }, [])
  const closeHowTo = useCallback(() => {
    markHowToSeen(STORE)
    howToRef.current = false
    setHowTo(false)
    // The keyboard goes straight to the open wheel.
    window.requestAnimationFrame(() => windowEl.current?.focus({ preventScroll: true }))
  }, [])

  const turnOpen = useCallback((delta) => {
    const s = stateRef.current
    if (s.phase !== 'playing' || !s.round || s.round.done) return
    dispatch({ type: 'turn', delta })
  }, [dispatch])

  const lockOpen = useCallback(() => {
    const s = stateRef.current
    if (howToRef.current || s.phase !== 'playing' || !s.round || s.round.done) return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'lock' })
  }, [dispatch])

  const nextSentence = useCallback(() => {
    const s = stateRef.current
    if (howToRef.current || s.phase !== 'playing' || !s.round?.done) return
    dispatch({ type: 'next', round: roundFor(s.lesson, s.index + 1) })
  }, [dispatch, roundFor])

  // The lesson is finished: keep its best score and move the title screen on to the next lesson.
  const recorded = useRef(0)
  useEffect(() => {
    if (phase !== 'over' || recorded.current === state.gameId || state.lesson == null) return
    recorded.current = state.gameId
    const { next, newBest, prev } = recordBest(BEST_KEY, settingsRef.current.bests, lessonEntry(state.lesson).id, { score: state.score, level: state.lesson })
    setBests(next)
    setResult({ newBest, best: prev })
    setLessonNo(nextLesson(state.lesson) ?? state.lesson)
  }, [phase, state.gameId, state.score, state.lesson])

  // ── sound, shake and buzz follow the state ───────────────────────────
  const lockRef = useRef(null)
  const registerWindow = useCallback((el) => { windowEl.current = el }, [])
  const openAt = round?.open ?? null
  const openTurn = openAt != null ? round.dials[openAt].at : null
  const seen = useRef({ gameId: 0, wrongs: 0, results: 0, rights: 0, key: '', at: null })
  useEffect(() => {
    let s = seen.current
    if (state.gameId !== s.gameId) s = { gameId: state.gameId, wrongs: 0, results: 0, rights: 0, key: '', at: null }
    const key = `${state.index}:${openAt}`
    // A right word latches; the last one also springs the lock open and chimes;
    // a turn of the same dial ticks.
    if (state.results.length > s.results) {
      if (state.rights > s.rights) sound('latch')
      window.setTimeout(() => { sound('latch', true); sound('chime') }, reduced ? 0 : 260)
    } else if (state.rights > s.rights) sound('latch')
    else if (key === s.key && openTurn != null && openTurn !== s.at) sound('tick')
    if (state.wrongs > s.wrongs) {
      sound('thud')
      if (isTouch) buzz()
      // The wrong dial's window flashes red (CSS) and shakes, unless motion is reduced.
      const last = round?.last
      const el = last ? document.querySelector(`.sl-lock .sl-dial[data-index="${round.dials[last.dial].index}"] .sl-wheel`) : null
      if (el && !reduced && typeof el.animate === 'function') el.animate(SHAKE, { duration: 340, easing: 'ease-out' })
    }
    seen.current = { gameId: state.gameId, wrongs: state.wrongs, results: state.results.length, rights: state.rights, key, at: openTurn }
  }, [state.gameId, state.wrongs, state.results.length, state.rights, state.index, round, openAt, openTurn, isTouch, reduced, sound])

  // A keyboard player keeps the focus on the lock: when a dial opens, the focus moves to it.
  const prevOpen = useRef(null)
  useLayoutEffect(() => {
    const key = round ? `${state.gameId}:${state.index}:${openAt}` : null
    if (key === prevOpen.current) return
    const hadFocus = document.activeElement?.closest?.('.sl-lock')
    const newSentence = key?.split(':').slice(0, 2).join(':') !== prevOpen.current?.split(':').slice(0, 2).join(':')
    prevOpen.current = key
    if (openAt != null && hadFocus) windowEl.current?.focus({ preventScroll: true })
    else if (round?.done && hadFocus) lockRef.current?.focus({ preventScroll: true })
    const board = document.querySelector('.sentence-lock .sl-board')
    if (!board) return
    if (newSentence) board.scrollTop = 0
    if (openAt != null) {
      // The open wheel and its Check, below the English (which stays at the top of the board).
      const dial = windowEl.current?.closest('.sl-dial')
      showInBoard(board, dial, dial, board.querySelector('.sl-english')?.offsetHeight ?? 0)
      dial?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    } else if (round?.done) {
      // The sentence, the points and Next sentence under the opened lock.
      showInBoard(board, board.querySelector('.sl-answer'), board.querySelector('.sl-keys') ?? board.querySelector('.sl-answer'), 0)
    }
  }, [round, openAt, state.gameId, state.index])

  // Keys: up and down turn the open dial; Enter checks it, then on a finished
  // sentence moves on. A held Enter acts once (the held-key guard). On the
  // title, arrows choose a lesson and Enter plays; on the lesson screen Enter
  // plays the next lesson (or this one again).
  const gridRef = useRef(null)
  const moveLesson = useCallback((key) => {
    const box = gridRef.current
    const cols = box ? (getComputedStyle(box).gridTemplateColumns.split(' ').length || 1) : 1
    const step = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : key === 'ArrowUp' ? -cols : cols
    const at = Math.max(0, LESSONS.findIndex(l => l.lesson === settingsRef.current.choice.lesson))
    const to = LESSONS[Math.min(LESSONS.length - 1, Math.max(0, at + step))]
    setLessonNo(to.lesson)
    window.requestAnimationFrame(() => box?.querySelector(`[data-lesson="${to.lesson}"]`)?.focus({ preventScroll: true }))
  }, [])
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = stateRef.current
      // The How to play card takes no game keys: Esc closes it, Enter presses its Start button.
      if (howToRef.current) {
        if (e.key === 'Escape') { e.preventDefault(); closeHowTo() }
        return
      }
      if (s.phase === 'playing') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          turnOpen(e.key === 'ArrowUp' ? -1 : 1)
          return
        }
        if (e.key === 'Enter') {
          // A link, or a button other than Check and Next, keeps its own Enter.
          if (tag === 'A' || (tag === 'BUTTON' && !e.target.dataset.enter)) return
          e.preventDefault()
          if (e.repeat) return
          if (s.round?.done) nextSentence()
          else lockOpen()
        }
      } else if (s.phase === 'title' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        moveLesson(e.key)
      } else if (e.key === 'Enter' && !e.repeat && (e.target?.closest?.('.sl-lesson-grid') || (tag !== 'BUTTON' && tag !== 'A'))) {
        e.preventDefault()
        start(s.phase === 'over' && s.lesson != null ? (nextLesson(s.lesson) ?? s.lesson) : undefined)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [turnOpen, lockOpen, nextSentence, start, moveLesson, closeHowTo])

  // Keeps the selected lesson in view inside the grid's own scroll box.
  useLayoutEffect(() => {
    if (phase !== 'title') return
    const box = gridRef.current
    const el = box?.querySelector('[aria-checked="true"]')
    if (!box || !el) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop) box.scrollTop = top
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top + el.offsetHeight - box.clientHeight
  }, [phase, lessonNo])

  // ── render ───────────────────────────────────────────────────────────
  const sky = Math.min(7, Math.max(1, 1 + Math.floor(((shownLesson ?? 1) - 1) / 8)))
  const done = !!round?.done
  const open = openAt != null ? round.dials[openAt] : null
  const openTried = !!open && isTried(open)
  const last = round?.last ?? null
  let line = ''
  let lineKind = 'hint'
  if (round && !done) {
    if (last?.outcome === 'wrong' && open?.flash) {
      // Just locked on a wrong word: it stays red in the window until the dial turns.
      const left = MAX_WRONG - round.dials[last.dial].wrong
      line = `Not that word. ${left === 1 ? '1 try' : `${left} tries`} left.`
      lineKind = 'wrong'
    } else if (openTried) { line = 'You tried that word. Turn the wheel.'; lineKind = 'tried' }
    else if (last?.outcome === 'shown') { line = 'The answer is shown'; lineKind = 'shown' }
    else if (last?.outcome === 'wrong') { line = 'Turn the wheel to another word, then press Check.' }
    else if (last?.outcome === 'right') { line = `Locked in. +${round.dials[last.dial].points}`; lineKind = 'right' }
    else line = 'Turn the wheel to the word that fits, then press Check.'
  } else if (done && last?.outcome === 'shown') { line = 'The answer is shown'; lineKind = 'shown' }
  const points = round ? roundPoints(round) : 0
  const max = round ? roundMax(round) : 0
  const live = round ? round.dials.filter(d => d.status !== 'fixed').length : 0
  const isLast = state.index + 1 >= state.total

  return (
    <section className={`source-drill-shell rain-shell is-${phase}`} data-game="sentence-lock">
      <div className="premium-core word-rain sentence-lock">
        <div className="rain-bar">
          <Link to="/games" className="x-frame-back">{'←'} All games</Link>
          <span className="rain-bar-tag">Game · Book sentences</span>
        </div>

        <div
          className={`rain-scene rain-sky-${sky}`}
          data-phase={phase}
          data-lesson={shownLesson ?? ''}
          data-item={round?.id ?? ''}
          data-index={inGame ? state.index : ''}
          data-done={done ? 'true' : 'false'}
          data-open={openAt ?? ''}
        >
          <Sky rate={1 + 0.3 * (sky - 1)} />

          <div className="rain-top">
            {inGame ? (
              <div className="rain-hud" data-score={score} data-lesson={state.lesson ?? ''} data-done={finished} data-total={state.total} data-wrong={state.wrongs}>
                <div className="rain-hud-left">
                  <span className="rain-pill rain-score-pill">
                    <span className="rain-pill-label">Points</span>
                    <span className="rain-score">{score}</span>
                  </span>
                </div>
                <div className="rain-hud-mid">
                  <span className="rain-pill rain-level-pill" aria-label={`Lesson ${state.lesson}, sentence ${Math.min(state.total, state.index + 1)} of ${state.total}`}>
                    <span className="rain-pill-label">Lesson</span>
                    <span className="rain-level">{state.lesson}</span>
                    <span className="rain-level-track" aria-hidden="true">
                      {Array.from({ length: state.total }, (_, i) => (
                        <i key={i} className={i < finished ? 'is-on' : ''} />
                      ))}
                    </span>
                  </span>
                </div>
                <div className="rain-hud-right">
                  <button type="button" className="rain-btn sl-help" onClick={openHowTo} aria-haspopup="dialog" aria-expanded={howTo}>
                    <HelpIcon /> How to play
                  </button>
                  <button type="button" className="rain-icon-btn rain-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Sound off' : 'Sound on'}>
                    <SoundIcon muted={muted} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rain-top-title">
                <button type="button" className="rain-icon-btn rain-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Sound off' : 'Sound on'}>
                  <SoundIcon muted={muted} />
                </button>
              </div>
            )}
          </div>

          <div className="rain-field sl-field">
            {phase === 'title' && (
              <div className="rain-title-block">
                {titleRound && <IdleLock round={titleRound} />}
                <div className="rain-eyebrow">A sentence game</div>
                <h1 className="rain-title">Sentence Lock</h1>
                <p className="rain-tagline">Turn each dial to the book’s word and lock it in.</p>
              </div>
            )}

            {inGame && round && (
              <div className="sl-board">
                <div className={`sl-card${done ? ' is-done' : ''}`} key={`${state.gameId}-${state.index}`} data-item={round.id}>
                  <p className="sl-english"><Inline text={round.english} tClass="font-tongan" /></p>
                  {/* The padlock: a shackle over the casing; the last word springs it open. */}
                  <div className={`sl-padlock${done ? ' is-open' : ''}`} data-open={done ? 'true' : 'false'}>
                    <span className="sl-shackle" aria-hidden="true" />
                    <div className="sl-lock" role="group" aria-label={done ? 'The lock, open' : 'The lock'}>
                      {round.dials.map(d => (
                        <Dial key={d.index} dial={d} total={live} onTurn={turnOpen} onCheck={lockOpen} registerWindow={registerWindow} />
                      ))}
                    </div>
                  </div>
                  {done
                    ? (
                      <div className="sl-answer">
                        <p className="sl-sentence" data-text={okinafy(sentenceText(round))}><T className="font-tongan">{sentenceText(round)}</T></p>
                        <p className="sl-result" data-points={points} data-max={max}><b>{points}</b> of {max} points</p>
                        {line && <p className={`sl-line is-${lineKind}`} data-kind={lineKind}>{line}</p>}
                        <button type="button" ref={lockRef} className="rain-btn rain-btn-primary sl-next" data-enter="next" onClick={nextSentence}>
                          {isLast ? 'Finish lesson' : 'Next sentence'}
                        </button>
                      </div>
                      )
                    : <p className={`sl-line is-${lineKind}`} role="status" data-kind={lineKind}>{line}</p>}
                  {!isTouch && <span className="rain-keys sl-keys"><kbd>↑</kbd> <kbd>↓</kbd> turn · <kbd>Enter</kbd> {done ? 'next' : 'checks'}</span>}
                </div>
              </div>
            )}
          </div>

          <Ground />

          {phase === 'title' && (
            <div className="rain-tray rain-setup sl-setup">
              <h2 className="sl-choose" id="sl-choose">Choose a lesson</h2>
              <ul className="rain-menu-list sl-lesson-grid" role="radiogroup" aria-labelledby="sl-choose" ref={gridRef}>
                {LESSONS.map(l => {
                  const on = choice.lesson === l.lesson
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={`${l.label}, ${l.count} sentences`}
                        className={`rain-menu-item${on ? ' is-active' : ''}`}
                        data-lesson={l.lesson}
                        data-count={l.count}
                        onClick={() => setLessonNo(l.lesson)}
                      >
                        <span className="rain-menu-name">{l.label}</span>
                        <span className="rain-menu-count">{l.count}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="rain-go-col">
                <button type="button" className="rain-btn rain-btn-primary rain-play" data-lesson={choice.lesson} onClick={() => start(choice.lesson)}>Play Lesson {choice.lesson}</button>
                <div className="rain-best" data-best={best.score}>
                  {best.score > 0
                    ? <>Best <b>{best.score}</b> of {choice.max} for this lesson</>
                    : <>No best score yet for this lesson</>}
                </div>
                {!isTouch && (
                  <span className="rain-keys">
                    <kbd>↑</kbd> <kbd>↓</kbd> turn · <kbd>Enter</kbd> checks
                  </span>
                )}
              </div>
            </div>
          )}

          {inGame && howTo && <HowTo onClose={closeHowTo} isTouch={isTouch} />}

          {phase === 'over' && (
            <div className="rain-over-wrap">
              <section className={`rain-over sl-over${result?.newBest ? ' is-new-best' : ''}`} aria-labelledby="sl-over-title">
                {result?.newBest && !reduced && <Confetti seed={state.gameId} />}
                <div className="rain-over-label" id="sl-over-title">Lesson {state.lesson} done</div>
                {result?.newBest && <div className="rain-new-best">New best!</div>}
                <div className="rain-final" data-score={score} data-max={state.max}>
                  <span className="rain-final-num">{score}</span>
                  <span className="rain-final-unit">of {state.max} points</span>
                </div>
                <dl className="rain-stats">
                  <div><dt>Sentences</dt><dd>{finished}</dd></div>
                  <div><dt>First try</dt><dd>{state.firstTry}</dd></div>
                  <div><dt>Shown</dt><dd>{state.shown}</dd></div>
                </dl>
                <div className="rain-over-best sl-over-best" data-best={bestOf(bests, played.id).score}>
                  Best on this device for {played.label}: {bestOf(bests, played.id).score} of {played.max}
                </div>
                <div className="rain-over-actions">
                  {after != null
                    ? <button type="button" className="rain-btn rain-btn-primary rain-again sl-next-lesson" data-lesson={after} onClick={() => start(after)}>Next lesson</button>
                    : <button type="button" className="rain-btn rain-btn-primary rain-again sl-again" data-lesson={shownLesson} onClick={() => start(shownLesson)}>Play again</button>}
                  <div className="rain-over-links">
                    <button type="button" className="rain-btn rain-btn-quiet sl-pick" onClick={() => dispatch({ type: 'quit' })}>Choose a lesson</button>
                    <Link to="/games" className="rain-btn rain-btn-quiet">All games</Link>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
