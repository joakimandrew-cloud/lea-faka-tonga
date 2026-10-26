import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import { okinafy } from '../lib/okinafy.js'
import T, { Inline } from '../premium/components/T.jsx'
import {
  LESSONS, lessonEntry, nextLesson,
  makeRound, makeTiles, capitalFirst, sentenceText, cluesFor,
  gameReducer, initialGame, isFrozen, finishedCount,
  loadProgress, saveProgress, progressAfter, startingLesson, lessonBag, dealFromLesson,
} from '../games/sentence-tiles'
import { makeRng } from '../games/shared/fair.js'
import { multiplierFor } from '../games/shared/scoring.js'
import { readStore, writeStore } from '../games/shared/store.js'
import { readBests, bestOf, recordBest } from '../games/shared/best-scores.js'
import { unlock, play } from '../games/shared/sound.js'
import { Sky, Ground, Confetti, Flame, PauseIcon, SoundIcon, ChevronIcon } from '../games/word-rain/scene.jsx'

/**
 * Sentence Tiles (plan 2026-10-26-games-section, Step 3; untimed and in
 * lesson order since Step 11). An English sentence from the book's exercises
 * shows; below it, the Tongan words of the book's own answer as shuffled
 * tiles. Tap the tiles into the answer line in order. There is no clock: a
 * sentence stays until it is built (Andrew, 2026-10-26: "this game should not
 * be timed"). A right tap moves the tile into the line; a wrong tap shakes it
 * and the streak starts again. There are no lives.
 *
 * One game is one lesson (Andrew, 2026-10-26: "have it in order of lessons").
 * A new player starts at Lesson 1; the lesson's sentences come once each, in
 * a shuffled order, and the finish card offers the next lesson. The furthest
 * lesson reached is kept on this device (lessons.js), so a return visit opens
 * there; the Lessons sheet starts any lesson that has sentences.
 *
 * Two helps (Step 7, Andrew's ruling at the Step 6 look): Fill in (or H)
 * places the next word for the player, the same way a right tap would; a
 * filled word shows lighter and scores nothing. Clues (off until turned on,
 * remembered) label each place in the answer line with the kind of word that
 * belongs there, from roles.json; a place the book does not settle has none.
 *
 * The look is Word Balloons' own (word-rain.css): the sky, the HUD, the mute
 * button, the sheets and the game-over card; sentence-tiles.css adds the
 * prompt, the answer line and the tiles. The pure rules live in
 * src/games/sentence-tiles/ (deck, rounds, reducer, all tested) and reuse the
 * shared game code (score, streak, levels, bag, sound, best scores).
 *
 * Mounted by the live app through src/premium/pages/SentenceTiles.jsx, which
 * loads the stylesheets (the build drops CSS imported from src/ outside
 * src/premium).
 */

const DONE_MS = 1300
const NEXT_MS = 260
// The "Lesson N" banner shows this long before the lesson's first sentence (its ribbon animation's length).
const START_MS = 1800

const MUTE_KEY = 'lft-sentence-tiles-muted'
// Best scores by lesson ({ "lesson:N": { score, level } }, level holding the lesson number).
const BEST_KEY = 'lft-sentence-tiles-best'
const CLUES_KEY = 'lft-sentence-tiles-clues'

function readMuted() { return readStore(MUTE_KEY) === '1' }
function readClues() { return readStore(CLUES_KEY) === '1' }

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

/** A number that counts up to its value instead of jumping. */
function TickNumber({ value, className, instant }) {
  const ref = useRef(null)
  const shown = useRef(value)
  const [first] = useState(value)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const from = shown.current
    const to = value
    if (instant || from === to || to < from) {
      shown.current = to
      el.textContent = String(to)
      return
    }
    const start = performance.now()
    let raf = 0
    const step = (now) => {
      const t = Math.min(1, (now - start) / 420)
      const v = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)))
      shown.current = v
      el.textContent = String(v)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, instant])
  return <span ref={ref} className={className}>{first}</span>
}

const SHAKE = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' },
]

export default function SentenceTiles() {
  const [progress, setProgress] = useState(loadProgress)
  // The lesson the title screen offers: the furthest reached (Lesson 1 for a new player), or one picked from the sheet.
  const [lessonNo, setLessonNo] = useState(() => startingLesson(progress))
  const [panel, setPanel] = useState(null) // null | 'lessons'
  const [muted, setMutedState] = useState(readMuted)
  const [clues, setClues] = useState(readClues)
  const [bests, setBests] = useState(() => readBests(BEST_KEY))
  const [result, setResult] = useState(null) // { newBest, best }
  const [state, rawDispatch] = useReducer(gameReducer, undefined, () => initialGame())
  // Every action carries the time it was sent (the tap lockouts read it).
  const dispatch = useCallback((action) => rawDispatch({ ...action, now: performance.now() }), [])
  const isTouch = useIsTouchPrimary()
  const reduced = useReducedMotion()

  const choice = useMemo(() => lessonEntry(lessonNo), [lessonNo])
  const best = bestOf(bests, choice.id)

  // The title screen's tiles: a real sentence of the chosen lesson, new on each visit.
  const [titleSeed] = useState(() => Date.now())
  const titleSample = useMemo(() => {
    const rng = makeRng(titleSeed)
    const s = choice.cards[Math.floor(rng() * choice.cards.length)]
    return s ? { sentence: s, tiles: makeTiles(s, rng) } : null
  }, [choice, titleSeed])

  const { phase, paused, round, score, streak, correct } = state
  const frozen = isFrozen(state)
  const mult = multiplierFor(streak)
  const inGame = phase === 'playing'
  // The lesson being played (in a game or on its finish card), else the one the title offers.
  const shownLesson = state.lesson ?? choice.lesson
  const played = lessonEntry(shownLesson)
  const after = nextLesson(shownLesson)
  const finished = finishedCount(state)

  const stateRef = useRef(state)
  const settingsRef = useRef({ choice, bests, muted })
  useEffect(() => { stateRef.current = state })
  useEffect(() => { settingsRef.current = { choice, bests, muted } })

  const bagRef = useRef(null)
  // The sentence the last game ended on, so playing the lesson again does not open with it.
  const lastRef = useRef(null)

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

  const toggleClues = useCallback(() => {
    setClues(on => {
      writeStore(CLUES_KEY, on ? '0' : '1')
      return !on
    })
  }, [])

  // Starts a game of one lesson (no countdown: nothing in this game is timed).
  const start = useCallback((lesson) => {
    if (!settingsRef.current.muted) unlock()
    const entry = lessonEntry(lesson ?? settingsRef.current.choice.lesson)
    setResult(null)
    setPanel(null)
    setLessonNo(entry.lesson)
    bagRef.current = lessonBag(entry.lesson, Math.random, { last: lastRef.current })
    dispatch({ type: 'start', lesson: entry.lesson, total: entry.count })
  }, [dispatch])

  // ── the next sentence: the lesson's bag, a beat after the last one ────
  const deal = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || s.paused || s.round || !bagRef.current) return
    const { sentence, bag } = dealFromLesson(bagRef.current, Math.random)
    if (!sentence) return
    bagRef.current = bag
    lastRef.current = sentence.id
    dispatch({ type: 'deal', round: makeRound(sentence, Math.random) })
  }, [dispatch])

  useEffect(() => {
    if (phase !== 'playing' || paused || round) return
    const t = window.setTimeout(deal, state.nextKey === 1 ? START_MS : NEXT_MS)
    return () => window.clearTimeout(t)
  }, [phase, paused, round, state.nextKey, deal])

  // A finished sentence holds a moment, then the next comes (or the finish card).
  const status = round?.status ?? null
  const roundKey = round?.key ?? null
  useEffect(() => {
    if (paused || status !== 'done') return
    const t = window.setTimeout(() => dispatch({ type: 'next' }), DONE_MS)
    return () => window.clearTimeout(t)
  }, [status, roundKey, paused, dispatch])

  // The lesson is finished: keep its best score, mark it done, and move the title screen on to the next lesson.
  const recorded = useRef(0)
  useEffect(() => {
    if (phase !== 'over' || recorded.current === state.gameId || state.lesson == null) return
    recorded.current = state.gameId
    const { bests: all } = settingsRef.current
    const { next, newBest, prev } = recordBest(BEST_KEY, all, lessonEntry(state.lesson).id, { score: state.score, level: state.lesson })
    setBests(next)
    setResult({ newBest, best: prev })
    setProgress(p => {
      const np = progressAfter(p, state.lesson)
      saveProgress(np)
      return np
    })
    setLessonNo(nextLesson(state.lesson) ?? state.lesson)
  }, [phase, state.gameId, state.score, state.lesson])

  // ── sound, shake and buzz follow the state ───────────────────────────
  const sceneRef = useRef(null)
  const tileEls = useRef(new Map())
  const placedCount = round?.placed.length ?? 0
  const seen = useRef({ gameId: 0, correct: 0, helped: 0, wrongTaps: 0, phase: 'title', placed: 0, key: null })
  useEffect(() => {
    let s = seen.current
    if (state.gameId !== s.gameId) s = { gameId: state.gameId, correct: 0, helped: 0, wrongTaps: 0, phase: 'title', placed: 0, key: null }
    const sameRound = s.key === roundKey
    if (phase === 'playing' && s.phase !== 'playing') sound('tick', true)
    // A finished sentence chimes once; each right tile pops.
    if (correct > s.correct || state.helped > s.helped) sound('chime')
    else if (sameRound && placedCount > s.placed) sound('pop', 1)
    if (state.wrongTaps > s.wrongTaps) {
      sound('thud')
      if (isTouch) buzz()
      // The wrong tile flashes red and shakes, then is a plain tile again.
      const el = round?.wrong ? tileEls.current.get(round.wrong.slot) : null
      if (el && typeof el.animate === 'function') {
        const css = getComputedStyle(el)
        const err = css.getPropertyValue('--error').trim()
        const soft = css.getPropertyValue('--error-soft').trim()
        if (err && soft) {
          el.animate(
            [{ borderColor: err, backgroundColor: soft, color: err, offset: 0 }, { borderColor: err, backgroundColor: soft, color: err, offset: 0.6 }, {}],
            { duration: 700, easing: 'ease-out' },
          )
        }
        if (!reduced) el.animate(SHAKE, { duration: 340, easing: 'ease-out', composite: 'add' })
      }
    }
    seen.current = {
      gameId: state.gameId, correct, helped: state.helped, wrongTaps: state.wrongTaps, phase, placed: placedCount, key: roundKey,
    }
  }, [phase, state.gameId, state.wrongTaps, state.helped, correct, placedCount, roundKey, round, isTouch, reduced, sound])

  // ── input ────────────────────────────────────────────────────────────
  const pick = useCallback((slot) => {
    const s = stateRef.current
    const r = s.round
    if (!r || r.status !== 'building') return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'pick', key: r.key, slot })
  }, [dispatch])

  // Fill in: the next word goes into the line for the player (scores nothing).
  const fill = useCallback(() => {
    const s = stateRef.current
    const r = s.round
    if (!r || r.status !== 'building') return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'fill', key: r.key })
  }, [dispatch])

  // A tile picked from the keyboard leaves the tray; the focus moves on to the nearest tile left.
  const trayRef = useRef(null)
  const focusTile = useCallback((fromSlot, dir = 1) => {
    const tray = trayRef.current
    if (!tray) return
    const buttons = [...tray.querySelectorAll('button[data-slot]:not(:disabled)')]
    if (!buttons.length) return
    const slots = buttons.map(b => Number(b.dataset.slot))
    let i
    if (fromSlot == null) i = dir > 0 ? 0 : buttons.length - 1
    else {
      const after = slots.findIndex(x => (dir > 0 ? x > fromSlot : x >= fromSlot))
      i = dir > 0 ? (after < 0 ? 0 : after) : (after <= 0 ? buttons.length - 1 : after - 1)
    }
    buttons[i]?.focus({ preventScroll: true })
  }, [])
  const keyPicked = useRef(null)
  const pickByKey = useCallback((slot) => {
    const focused = document.activeElement?.dataset?.slot
    keyPicked.current = focused != null && Number(focused) === slot ? slot : null
    pick(slot)
  }, [pick])
  // After a keyboard pick lands, move the focus off the tile that left.
  useEffect(() => {
    const slot = keyPicked.current
    if (slot == null || !round) return
    if (round.placed.includes(slot)) {
      keyPicked.current = null
      window.requestAnimationFrame(() => focusTile(slot, 1))
    }
  }, [round, focusTile])

  const togglePause = useCallback(() => {
    const s = stateRef.current
    dispatch({ type: s.paused ? 'resume' : 'pause' })
  }, [dispatch])

  // ── the Lessons sheet ────────────────────────────────────────────────
  const panelRef = useRef(panel)
  useEffect(() => { panelRef.current = panel })
  const triggerRef = useRef(null)
  const sheetRef = useRef(null)
  const openPanel = useCallback((name, e) => {
    triggerRef.current = e?.currentTarget ?? null
    setPanel(name)
  }, [])
  const closePanel = useCallback(() => {
    setPanel(null)
    const t = triggerRef.current
    if (t && typeof t.focus === 'function') window.requestAnimationFrame(() => t.focus())
  }, [])
  useEffect(() => {
    if (!panel) return
    const el = sheetRef.current
    const target = el?.querySelector('[aria-checked="true"]') ?? el?.querySelector('button')
    target?.focus({ preventScroll: true })
  }, [panel])
  const chooseLesson = useCallback((n) => {
    setLessonNo(n)
    closePanel()
  }, [closePanel])

  // Keys: 1-8 pick a tile, arrows move between tiles and Enter picks the one
  // in focus; Space or P (Escape too) pauses; Enter plays on the title, and
  // on the finish card plays the next lesson (or the last one again).
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = stateRef.current
      if (s.phase === 'playing') {
        if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault()
          if (!e.repeat) togglePause()
          return
        }
        const r = s.round
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault()
          // A held key repeats; only the first press fills.
          if (!e.repeat) fill()
          return
        }
        const n = Number(e.key)
        if (r && Number.isInteger(n) && n >= 1 && n <= r.tiles.length) {
          e.preventDefault()
          // A held key repeats; only the first press picks.
          if (!e.repeat) pickByKey(n - 1)
          return
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault()
          const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
          const focused = document.activeElement?.dataset?.slot
          focusTile(focused != null ? Number(focused) : null, dir)
          return
        }
        if (e.key === 'Enter') {
          // Handled here, never as a button click, so a held Enter picks once.
          e.preventDefault()
          if (e.repeat) return
          const focused = document.activeElement?.dataset?.slot
          if (focused != null) pickByKey(Number(focused))
          else focusTile(null, 1)
        }
      } else if (panelRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault()
          closePanel()
        }
      } else if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') {
        e.preventDefault()
        start(s.phase === 'over' && s.lesson != null ? (nextLesson(s.lesson) ?? s.lesson) : undefined)
      }
    }
    const onKeyUp = (e) => {
      const s = stateRef.current
      if (e.key === ' ' && s.phase === 'playing' && e.target?.tagName === 'BUTTON') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [pickByKey, focusTile, fill, start, togglePause, closePanel])

  // ── render ───────────────────────────────────────────────────────────
  // The sky deepens as the lessons go on (one step every 8 lessons).
  const sky = Math.min(7, Math.max(1, 1 + Math.floor(((shownLesson ?? 1) - 1) / 8)))
  const sentence = round?.sentence ?? null
  const byText = round ? new Map(round.tiles.map(t => [t.slot, t])) : null
  const placedWords = round ? round.placed.map(slot => byText.get(slot).text) : []
  const filledAt = new Set(round?.filled ?? [])
  const clueList = sentence && clues ? cluesFor(sentence, placedWords) : null
  const lineWords = sentence
    ? sentence.words.map((w, i) => ({
      ...(i < placedWords.length
        ? { text: i === 0 && sentence.capital ? capitalFirst(placedWords[i]) : placedWords[i], kind: filledAt.has(i) ? 'placed is-filled' : 'placed' }
        : { text: '', kind: 'empty' }),
      clue: clueList?.[i] ?? null,
    }))
    : []
  const filledCount = filledAt.size

  return (
    <section className={`source-drill-shell rain-shell is-${phase}`} data-game="sentence-tiles">
      <div className="premium-core word-rain sentence-tiles">
        <div className="rain-bar">
          <Link to="/games" className="x-frame-back">{'←'} All games</Link>
          <span className="rain-bar-tag">Game · Book sentences</span>
        </div>

        <div
          ref={sceneRef}
          className={`rain-scene rain-sky-${sky}${paused && inGame ? ' is-paused is-frozen' : ''}`}
          data-phase={phase}
          data-lesson={shownLesson ?? ''}
          data-chapter={sentence?.chapter ?? ''}
          data-status={status ?? ''}
          data-item={sentence?.id ?? ''}
          data-key={roundKey ?? ''}
        >
          <Sky rate={1 + 0.3 * (sky - 1)} />

          <div className="rain-top">
            {inGame ? (
              <div className="rain-hud" data-score={score} data-streak={streak} data-mult={mult} data-lesson={state.lesson ?? ''} data-done={finished} data-total={state.total} data-wrong={state.wrongTaps}>
                <div className="rain-hud-left">
                  <span className="rain-pill rain-score-pill">
                    <span className="rain-pill-label">Score</span>
                    <TickNumber value={score} className="rain-score" instant={reduced} />
                  </span>
                </div>
                <div className="rain-hud-mid">
                  <span className="rain-pill rain-level-pill tiles-lesson-pill" aria-label={`Lesson ${state.lesson}, ${finished} of ${state.total} sentences done`}>
                    <span className="rain-pill-label">Lesson</span>
                    <span className="rain-level">{state.lesson}</span>
                    <span className="rain-level-track" aria-hidden="true">
                      {Array.from({ length: state.total }, (_, i) => (
                        <i key={i} className={i < finished ? 'is-on' : ''} />
                      ))}
                    </span>
                  </span>
                </div>
                <span
                  key={mult}
                  className={`rain-streak${streak >= 2 ? ' is-on' : ''} mult-${mult}`}
                  role="img"
                  aria-label={streak >= 2 ? `${streak} in a row${mult > 1 ? `, points times ${mult}` : ''}` : 'No streak'}
                >
                  <Flame />
                  <b className="rain-mult">{mult > 1 ? `×${mult}` : streak}</b>
                  <span className="rain-streak-label">{streak} in a row</span>
                </span>
                <div className="rain-hud-right">
                  <button type="button" className="rain-icon-btn rain-pause" onClick={togglePause} aria-pressed={paused} aria-label={paused ? 'Resume' : 'Pause'}>
                    <PauseIcon paused={paused} />
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

          <div className="rain-field tiles-field">
            {phase === 'title' && (
              <div className="rain-title-block">
                {titleSample && (
                  <div className="tiles-idle" aria-hidden="true">
                    {titleSample.tiles.map((t, i) => (
                      <span key={t.slot} className="tiles-tile tiles-idle-tile" style={{ '--i': i }}>
                        <T className="font-tongan" data-text={okinafy(t.text)}>{t.text}</T>
                      </span>
                    ))}
                  </div>
                )}
                <div className="rain-eyebrow">A sentence game</div>
                <h1 className="rain-title">Sentence Tiles</h1>
                <p className="rain-tagline">Put the words in the book’s order, one lesson at a time.</p>
              </div>
            )}

            {phase === 'playing' && (
              <div className="tiles-board">
                {sentence && (
                  <div className={`tiles-card is-${status}`} key={roundKey}>
                    <p className="tiles-prompt"><Inline text={sentence.prompt} tClass="font-tongan" /></p>
                    <div className={`tiles-line${clueList ? ' has-clues' : ''}`} aria-label="Your answer" data-placed={placedWords.length} data-filled={filledCount}>
                      {lineWords.map((w, i) => (
                        <span key={i} className="tiles-cell">
                          <span className={`tiles-slot is-${w.kind}`}>
                            {w.text ? <T className="font-tongan" data-text={okinafy(w.text)}>{w.text}</T> : <span className="tiles-slot-gap" />}
                          </span>
                          {clueList && <span className="tiles-clue" data-clue={w.clue ?? ''}>{w.clue ?? ''}</span>}
                        </span>
                      ))}
                      {sentence.end && <span className="tiles-end" aria-hidden="true">{sentence.end}</span>}
                    </div>
                    {status === 'done' && (
                      <span className="rain-gain tiles-gain" data-gain={round.gain}>
                        +{round.gain}
                        {filledCount > 0
                          ? <small> {filledCount} filled</small>
                          : round.mult > 1 && <small> ×{round.mult}</small>}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {inGame && !round && state.nextKey === 1 && !paused && (
              <div className="rain-banner tiles-start-banner" key={`start-${state.gameId}`} role="status">
                <span className="rain-banner-ribbon">
                  <span className="rain-banner-title">Lesson {state.lesson}</span>
                  <span className="rain-banner-sub">{state.total === 1 ? '1 sentence' : `${state.total} sentences`}</span>
                </span>
              </div>
            )}

            {paused && inGame && (
              <div className="rain-paused">
                <div className="rain-paused-title">Paused</div>
                <button type="button" className="rain-btn rain-btn-primary" onClick={() => dispatch({ type: 'resume' })}>Resume</button>
                <button type="button" className="rain-btn rain-btn-quiet" onClick={() => dispatch({ type: 'quit' })}>End game</button>
              </div>
            )}
          </div>

          <Ground />

          {phase === 'title' && (
            <div className="rain-tray rain-setup">
              <button
                type="button"
                className="rain-words"
                onClick={e => openPanel('lessons', e)}
                aria-haspopup="dialog"
                aria-expanded={panel === 'lessons'}
                data-lesson={choice.lesson}
                data-count={choice.count}
              >
                <span className="rain-words-label">Lesson</span>
                <span className="rain-words-name">{choice.label}</span>
                <span className="rain-words-count">{choice.count} sentences</span>
                <ChevronIcon />
              </button>
              <div className="rain-go-col">
                <button type="button" className="rain-btn rain-btn-primary rain-play" onClick={() => start(choice.lesson)}>Play</button>
                <div className="rain-best" data-best={best.score}>
                  {best.score > 0
                    ? <>Best <b>{best.score}</b> for this lesson</>
                    : <>No best score yet for this lesson</>}
                </div>
                {!isTouch && (
                  <span className="rain-keys">
                    Pick with <kbd>1</kbd>–<kbd>8</kbd> or arrows and <kbd>Enter</kbd> · <kbd>H</kbd> fills in a word · <kbd>Space</kbd> pauses
                  </span>
                )}
              </div>
            </div>
          )}

          {phase === 'title' && panel === 'lessons' && (
            <div className="rain-sheet-wrap" onClick={e => { if (e.target === e.currentTarget) closePanel() }}>
              <div className="rain-sheet rain-words-sheet tiles-lessons-sheet" role="dialog" aria-modal="true" aria-labelledby="tiles-lessons-title" ref={sheetRef}>
                <div className="rain-sheet-head">
                  <h2 className="rain-sheet-title" id="tiles-lessons-title">Lessons</h2>
                  <button type="button" className="rain-btn rain-btn-quiet rain-sheet-close" onClick={closePanel}>Done</button>
                </div>
                <div className="rain-sheet-body" role="radiogroup" aria-label="Start from a lesson">
                  <p className="tiles-lessons-note">Start from any lesson. Finished lessons are ticked.</p>
                  <ul className="rain-menu-list tiles-lessons-grid">
                    {LESSONS.map(l => {
                      const isDone = progress.done.includes(l.lesson)
                      const on = choice.lesson === l.lesson
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-label={`${l.label}, ${l.count} sentences${isDone ? ', finished' : ''}`}
                            className={`rain-menu-item${on ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
                            data-lesson={l.lesson}
                            data-count={l.count}
                            onClick={() => chooseLesson(l.lesson)}
                          >
                            <span className="rain-menu-name">{l.label}{isDone && <span className="tiles-lesson-done" aria-hidden="true">✓</span>}</span>
                            <span className="rain-menu-count">{l.count}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {inGame && (
            <div className={`rain-tray tiles-tray${status === 'building' ? ' is-live' : ''}`} ref={trayRef}>
              <div className="tiles-helps">
                <button
                  type="button"
                  className="rain-chip tiles-fill"
                  onClick={fill}
                  disabled={status !== 'building' || frozen}
                  aria-label="Fill in the next word (it scores nothing)"
                >
                  Fill in{!isTouch && <kbd>H</kbd>}
                </button>
                <button
                  type="button"
                  className={`rain-chip tiles-clues-toggle${clues ? ' is-active' : ''}`}
                  onClick={toggleClues}
                  aria-pressed={clues}
                >
                  Clues
                </button>
              </div>
              <div className="tiles-set" role="group" aria-label="Tiles">
              {round
                ? round.tiles.map(t => {
                  const used = round.placed.includes(t.slot)
                  if (used) {
                    return (
                      <span key={`${roundKey}-${t.slot}`} className="tiles-tile is-used" aria-hidden="true">
                        <T className="font-tongan">{t.text}</T>
                      </span>
                    )
                  }
                  return (
                    <button
                      key={`${roundKey}-${t.slot}`}
                      ref={el => { if (el) tileEls.current.set(t.slot, el); else tileEls.current.delete(t.slot) }}
                      type="button"
                      className="tiles-tile"
                      data-slot={t.slot}
                      data-text={okinafy(t.text)}
                      disabled={status !== 'building' || frozen}
                      onClick={() => pick(t.slot)}
                    >
                      {!isTouch && <span className="rain-opt-key" aria-hidden="true">{t.slot + 1}</span>}
                      <T className="font-tongan">{t.text}</T>
                    </button>
                  )
                })
                : <span className="tiles-tile is-waiting" aria-hidden="true">&nbsp;</span>}
              </div>
            </div>
          )}

          {phase === 'over' && (
            <div className="rain-over-wrap">
              <section className={`rain-over${result?.newBest ? ' is-new-best' : ''}`} aria-labelledby="tiles-over-title">
                {result?.newBest && !reduced && <Confetti seed={state.gameId} />}
                <div className="rain-over-label" id="tiles-over-title">Lesson {state.lesson} done</div>
                {result?.newBest && <div className="rain-new-best">New best!</div>}
                <div className="rain-final" data-score={score}>
                  <span className="rain-final-num">{score}</span>
                  <span className="rain-final-unit">points</span>
                </div>
                <dl className="rain-stats">
                  <div><dt>Sentences</dt><dd>{correct}</dd></div>
                  <div><dt>Longest streak</dt><dd>{state.bestStreak}</dd></div>
                  <div><dt>Wrong taps</dt><dd>{state.wrongTaps}</dd></div>
                </dl>
                {state.helped > 0 && (
                  <div className="rain-over-best tiles-over-helped">
                    {state.helped === 1 ? '1 more sentence' : `${state.helped} more sentences`} finished with filled-in words ({state.filledWords} filled)
                  </div>
                )}
                {!result?.newBest && <div className="rain-over-best">Your best for {played.label}: {bestOf(bests, played.id).score}</div>}
                {after == null && <div className="rain-over-best tiles-over-last">That was the last lesson with sentences.</div>}
                {state.missed.length > 0 && (
                  <div className="rain-missed">
                    <div className="rain-setting-label">Sentences to look at again</div>
                    <ul className="rain-missed-list">
                      {state.missed.map(s => (
                        <li key={s.id} className="rain-missed-row tiles-missed-row">
                          <span className="rain-missed-en"><Inline text={s.prompt} tClass="font-tongan" /></span>
                          <T className="font-tongan rain-missed-to">{sentenceText(s)}</T>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rain-over-actions">
                  {after != null
                    ? <button type="button" className="rain-btn rain-btn-primary rain-again tiles-next" data-lesson={after} onClick={() => start(after)}>Next: Lesson {after}</button>
                    : <button type="button" className="rain-btn rain-btn-primary rain-again" data-lesson={shownLesson} onClick={() => start(shownLesson)}>Play again</button>}
                  <div className="rain-over-links">
                    {after != null && <button type="button" className="rain-btn rain-btn-quiet tiles-replay" data-lesson={shownLesson} onClick={() => start(shownLesson)}>Play Lesson {shownLesson} again</button>}
                    <button type="button" className="rain-btn rain-btn-quiet tiles-pick" onClick={() => dispatch({ type: 'quit' })}>Pick a lesson</button>
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
