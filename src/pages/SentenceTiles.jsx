import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import { okinafy } from '../lib/okinafy.js'
import T, { Inline } from '../premium/components/T.jsx'
import {
  LESSON_MENU, ALL_LESSONS_ID, lessonChoice,
  makeRound, makeTiles, capitalFirst, sentenceText, cluesFor,
  gameReducer, initialGame, isFrozen, timeLeftMs, LIVES, WRONG_TAP_MS,
} from '../games/sentence-tiles'
import { makeRng } from '../games/shared/fair.js'
import { multiplierFor } from '../games/shared/scoring.js'
import { WORDS_PER_LEVEL, toNextLevel } from '../games/shared/levels.js'
import { drawFromBag, missedInBag, resumeBag, bagToSave } from '../games/shared/bag.js'
import { readStore, writeStore } from '../games/shared/store.js'
import { readBests, bestOf, recordBest } from '../games/shared/best-scores.js'
import { unlock, play } from '../games/shared/sound.js'
import { Sky, Ground, Confetti, Hearts, Flame, PauseIcon, SoundIcon, ChevronIcon } from '../games/word-rain/scene.jsx'

/**
 * Sentence Tiles (plan 2026-10-26-games-section, Step 3). An English sentence
 * from the book's exercises shows; below it, the Tongan words of the book's
 * own answer as shuffled tiles. Tap the tiles into the answer line in order
 * before the clock runs out. A right tap moves the tile into the line; a
 * wrong tap shakes it and takes 1.5 s off the clock (and the streak starts
 * again); running out of time costs a life and shows the right order. Every
 * 8 sentences is a new level and the clock is shorter. Three lives.
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

const COUNT_MS = 650
const DONE_MS = 1300
const REVEAL_MS = 3200
const BANNER_MS = 1800
const NEXT_MS = 260
const AFTER_LEVEL_UP_MS = 1150

const MUTE_KEY = 'lft-sentence-tiles-muted'
// One shuffle bag per lesson choice, kept between games, so a new game goes
// on through the sentences not yet played.
const BAG_KEY_PREFIX = 'lft-sentence-tiles-bag:'
const BEST_KEY = 'lft-sentence-tiles-best'
const CLUES_KEY = 'lft-sentence-tiles-clues'
const COST_LABEL = `−${WRONG_TAP_MS / 1000} s`

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
  const [choiceId, setChoiceId] = useState(ALL_LESSONS_ID)
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

  const choice = useMemo(() => lessonChoice(choiceId), [choiceId])
  const listId = choice.id
  const byId = useMemo(() => new Map(choice.cards.map(s => [s.id, s])), [choice])
  const best = bestOf(bests, listId)

  // The title screen's tiles: a real sentence of the chosen lessons, new on each visit.
  const [titleSeed] = useState(() => Date.now())
  const titleSample = useMemo(() => {
    const rng = makeRng(titleSeed)
    const s = choice.cards[Math.floor(rng() * choice.cards.length)]
    return s ? { sentence: s, tiles: makeTiles(s, rng) } : null
  }, [choice, titleSeed])

  const { phase, paused, round, score, lives, level, streak, levelUp, hits, correct } = state
  const frozen = isFrozen(state)
  const mult = multiplierFor(streak)
  const inGame = phase === 'countdown' || phase === 'playing'

  const stateRef = useRef(state)
  const settingsRef = useRef({ choice, byId, listId, bests, muted })
  useEffect(() => { stateRef.current = state })
  useEffect(() => { settingsRef.current = { choice, byId, listId, bests, muted, bagKey: BAG_KEY_PREFIX + listId } })

  const bagRef = useRef(null)

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

  const start = useCallback((instant = false) => {
    if (!settingsRef.current.muted) unlock()
    setResult(null)
    setPanel(null)
    let saved = null
    try { saved = JSON.parse(readStore(settingsRef.current.bagKey) || 'null') } catch { saved = null }
    bagRef.current = resumeBag(saved, settingsRef.current.choice.cards.map(s => s.id), Math.random)
    dispatch({ type: 'start', instant })
  }, [dispatch])

  // ── the clock: how long this sentence has run, stopped while frozen ───
  const clock = useRef({ key: null, base: 0, from: null })
  const elapsedNow = useCallback(() => {
    const c = clock.current
    return c.base + (c.from != null ? performance.now() - c.from : 0)
  }, [])
  const roundKey = round?.key ?? null
  useLayoutEffect(() => {
    const c = clock.current
    if (c.key !== roundKey) clock.current = { key: roundKey, base: 0, from: null }
    const k = clock.current
    if (frozen) {
      if (k.from != null) { k.base += performance.now() - k.from; k.from = null }
    } else if (k.from == null) {
      k.from = performance.now()
    }
  }, [roundKey, frozen])

  // The timer bar is drawn every frame without a re-render; it calls time.
  const barRef = useRef(null)
  const timedOut = useRef(null)
  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0
    const step = () => {
      const s = stateRef.current
      const r = s.round
      const bar = barRef.current
      if (r) {
        const left = timeLeftMs(r, elapsedNow())
        if (bar) {
          const frac = r.status === 'building' ? left / r.durationMs : (r.status === 'done' ? left / r.durationMs : 0)
          bar.style.transform = `scaleX(${Math.max(0, Math.min(1, frac)).toFixed(4)})`
          bar.dataset.low = frac < 0.3 ? '1' : '0'
        }
        const id = `${s.gameId}-${r.key}`
        if (left <= 0 && !isFrozen(s) && timedOut.current !== id) {
          timedOut.current = id
          dispatch({ type: 'timeout', key: r.key })
        }
      } else if (bar) {
        bar.style.transform = 'scaleX(1)'
        bar.dataset.low = '0'
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [phase, elapsedNow, dispatch])

  // ── the next sentence: from the bag, a beat after the last one ────────
  const deal = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || s.paused || s.round || !bagRef.current) return
    const { byId: cards } = settingsRef.current
    const { id, bag } = drawFromBag(bagRef.current, Math.random)
    const sentence = id && cards.get(id)
    if (!sentence) return
    bagRef.current = bag
    writeStore(settingsRef.current.bagKey, JSON.stringify(bagToSave(bag)))
    dispatch({ type: 'deal', round: makeRound(sentence, Math.random, { level: s.level }) })
  }, [dispatch])

  useEffect(() => {
    if (phase !== 'playing' || paused || round) return
    const t = window.setTimeout(deal, levelUp ? AFTER_LEVEL_UP_MS : NEXT_MS)
    return () => window.clearTimeout(t)
  }, [phase, paused, round, levelUp, deal])

  // A finished sentence holds a moment; a timed-out one shows the right order longer.
  const status = round?.status ?? null
  useEffect(() => {
    if (paused || (status !== 'done' && status !== 'timeout')) return
    const t = window.setTimeout(() => dispatch({ type: 'next' }), status === 'done' ? DONE_MS : REVEAL_MS)
    return () => window.clearTimeout(t)
  }, [status, roundKey, paused, dispatch])

  // Every timed-out sentence goes back in the bag, to come round once more 5 to 8 later.
  const missSeen = useRef({ gameId: 0, n: 0 })
  useEffect(() => {
    if (missSeen.current.gameId !== state.gameId) missSeen.current = { gameId: state.gameId, n: 0 }
    const { misses } = state
    for (let i = missSeen.current.n; i < misses.length; i++) {
      if (bagRef.current) bagRef.current = missedInBag(bagRef.current, misses[i], Math.random)
    }
    missSeen.current.n = misses.length
  }, [state])

  // Game over: keep the best score for this lesson choice.
  const recorded = useRef(0)
  useEffect(() => {
    if (phase !== 'over' || recorded.current === state.gameId) return
    recorded.current = state.gameId
    const { listId: key, bests: all } = settingsRef.current
    const { next, newBest, prev } = recordBest(BEST_KEY, all, key, { score: state.score, level: state.level })
    setBests(next)
    setResult({ newBest, best: prev })
  }, [phase, state.gameId, state.score, state.level])

  useEffect(() => {
    if (!levelUp) return
    const t = window.setTimeout(() => dispatch({ type: 'levelUpDone', at: levelUp.at }), BANNER_MS)
    return () => window.clearTimeout(t)
  }, [levelUp, dispatch])

  useEffect(() => {
    if (phase !== 'countdown' || paused) return
    const t = window.setTimeout(() => dispatch({ type: 'tick' }), COUNT_MS)
    return () => window.clearTimeout(t)
  }, [phase, paused, state.count, dispatch])

  // ── sound, shake and buzz follow the state ───────────────────────────
  const sceneRef = useRef(null)
  const tileEls = useRef(new Map())
  const placedCount = round?.placed.length ?? 0
  const seen = useRef({ gameId: 0, correct: 0, helped: 0, hits: 0, wrongTaps: 0, levelUp: null, count: null, phase: 'title', placed: 0, key: null })
  useEffect(() => {
    let s = seen.current
    if (state.gameId !== s.gameId) s = { gameId: state.gameId, correct: 0, helped: 0, hits: 0, wrongTaps: 0, levelUp: null, count: null, phase: 'title', placed: 0, key: null }
    const sameRound = s.key === roundKey
    if (phase === 'countdown' && state.count !== s.count) sound('tick', false)
    if (phase === 'playing' && s.phase !== 'playing') sound('tick', true)
    // A finished sentence (or a new level) chimes once; each right tile pops.
    if (correct > s.correct || state.helped > s.helped || (levelUp && levelUp.at !== s.levelUp)) sound('chime')
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
    if (hits > s.hits) {
      if (state.wrongTaps === s.wrongTaps) sound('thud')
      if (isTouch) buzz()
      const el = sceneRef.current
      if (el && !reduced && typeof el.animate === 'function') {
        el.animate(
          [
            { transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(8px)' },
            { transform: 'translateX(-5px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' },
          ],
          { duration: 380, easing: 'ease-out' },
        )
      }
    }
    seen.current = {
      gameId: state.gameId, correct, helped: state.helped, hits, wrongTaps: state.wrongTaps, levelUp: levelUp?.at ?? s.levelUp,
      count: state.count, phase, placed: placedCount, key: roundKey,
    }
  }, [phase, state.count, state.gameId, state.wrongTaps, state.helped, correct, hits, levelUp, placedCount, roundKey, round, isTouch, reduced, sound])

  // ── input ────────────────────────────────────────────────────────────
  const pick = useCallback((slot) => {
    const s = stateRef.current
    const r = s.round
    if (!r || r.status !== 'building') return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'pick', key: r.key, slot, elapsedMs: elapsedNow() })
  }, [dispatch, elapsedNow])

  // Fill in: the next word goes into the line for the player (scores nothing).
  const fill = useCallback(() => {
    const s = stateRef.current
    const r = s.round
    if (!r || r.status !== 'building') return
    if (!settingsRef.current.muted) unlock()
    dispatch({ type: 'fill', key: r.key, elapsedMs: elapsedNow() })
  }, [dispatch, elapsedNow])

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

  useEffect(() => {
    const onHide = () => { if (document.hidden) dispatch({ type: 'pause' }) }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
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
  const chooseLessons = useCallback((id) => {
    setChoiceId(id)
    closePanel()
  }, [closePanel])

  // Keys: 1-8 pick a tile, arrows move between tiles and Enter picks the one
  // in focus; Space or P (Escape too) pauses; Enter plays on the title.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = stateRef.current
      const live = s.phase === 'playing' || s.phase === 'countdown'
      if (live) {
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
        start(s.phase === 'over')
      }
    }
    const onKeyUp = (e) => {
      const s = stateRef.current
      if (e.key === ' ' && (s.phase === 'playing' || s.phase === 'countdown') && e.target?.tagName === 'BUTTON') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [pickByKey, focusTile, fill, start, togglePause, closePanel])

  // ── render ───────────────────────────────────────────────────────────
  const sky = Math.min(7, Math.max(1, level))
  const toNext = toNextLevel(correct)
  const sentence = round?.sentence ?? null
  const byText = round ? new Map(round.tiles.map(t => [t.slot, t])) : null
  const placedWords = round ? round.placed.map(slot => byText.get(slot).text) : []
  const filledAt = new Set(round?.filled ?? [])
  const clueList = sentence && clues ? cluesFor(sentence, placedWords) : null
  const lineWords = sentence
    ? sentence.words.map((w, i) => ({
      ...(i < placedWords.length
        ? { text: i === 0 && sentence.capital ? capitalFirst(placedWords[i]) : placedWords[i], kind: filledAt.has(i) ? 'placed is-filled' : 'placed' }
        : status === 'timeout' ? { text: i === 0 && sentence.capital ? capitalFirst(w) : w, kind: 'revealed' } : { text: '', kind: 'empty' }),
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
          data-level={level}
          data-status={status ?? ''}
          data-item={sentence?.id ?? ''}
          data-key={roundKey ?? ''}
        >
          <Sky rate={1 + 0.3 * (sky - 1)} />

          <div className="rain-top">
            {inGame ? (
              <div className="rain-hud" data-score={score} data-lives={lives} data-streak={streak} data-mult={mult} data-level={level}>
                <div className="rain-hud-left">
                  <span className="rain-pill rain-score-pill">
                    <span className="rain-pill-label">Score</span>
                    <TickNumber value={score} className="rain-score" instant={reduced} />
                  </span>
                  <span className="rain-pill rain-lives" role="img" aria-label={`${lives} of ${LIVES} lives left`}>
                    <Hearts key={state.gameId} lives={lives} total={LIVES} />
                    <span className="rain-lives-count">{lives}</span>
                  </span>
                </div>
                <div className="rain-hud-mid">
                  <span className="rain-pill rain-level-pill" aria-label={`Level ${level}, ${toNext} to the next level`}>
                    <span className="rain-pill-label">Level</span>
                    <span className="rain-level">{level}</span>
                    <span className="rain-level-track" aria-hidden="true">
                      {Array.from({ length: WORDS_PER_LEVEL }, (_, i) => (
                        <i key={i} className={i < WORDS_PER_LEVEL - toNext ? 'is-on' : ''} />
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
                <p className="rain-tagline">Put the words in the book’s order before time runs out.</p>
              </div>
            )}

            {phase === 'playing' && (
              <div className="tiles-board">
                <div className="tiles-clock" data-penalty={round?.penaltyMs ?? 0}>
                  <span className="tiles-clock-track"><span className="tiles-clock-bar" ref={barRef} /></span>
                  {round?.wrong && status === 'building' && (
                    <span className="tiles-cost" key={round.wrong.n} role="status">{COST_LABEL}</span>
                  )}
                </div>
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
                    {status === 'timeout' && (
                      <span className="rain-reveal-label tiles-reveal-label" role="status">Out of time: the book’s order</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {phase === 'countdown' && (
              <div className="rain-count" key={state.count} aria-live="assertive">{state.count}</div>
            )}
            {phase === 'playing' && state.nextKey <= 2 && !paused && (
              <div className="rain-count rain-go" key={`go-${state.gameId}`} aria-hidden="true">Go!</div>
            )}

            {levelUp && phase === 'playing' && (
              <div className="rain-banner" key={levelUp.at} role="status">
                <span className="rain-banner-ribbon">
                  <span className="rain-banner-title">Level {levelUp.level}</span>
                  <span className="rain-banner-sub">Less time</span>
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
                data-list={listId}
                data-count={choice.count}
              >
                <span className="rain-words-label">Lessons</span>
                <span className="rain-words-name">{choice.label}</span>
                <span className="rain-words-count">{choice.count} sentences</span>
                <ChevronIcon />
              </button>
              <div className="rain-go-col">
                <button type="button" className="rain-btn rain-btn-primary rain-play" onClick={() => start(false)}>Play</button>
                <div className="rain-best" data-best={best.score}>
                  {best.score > 0
                    ? <>Best <b>{best.score}</b> · level {best.level}</>
                    : <>No best score yet for these lessons</>}
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
                <div className="rain-sheet-body" role="radiogroup" aria-label="Sentences from">
                  <ul className="rain-menu-list tiles-lessons-all">
                    <li>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={listId === ALL_LESSONS_ID}
                        className={`rain-menu-item${listId === ALL_LESSONS_ID ? ' is-active' : ''}`}
                        data-list={ALL_LESSONS_ID}
                        data-count={LESSON_MENU[0].count}
                        onClick={() => chooseLessons(ALL_LESSONS_ID)}
                      >
                        <span className="rain-menu-name">All lessons</span>
                        <span className="rain-menu-count">{LESSON_MENU[0].count}</span>
                      </button>
                    </li>
                  </ul>
                  <div className="rain-menu-group">
                    <div className="rain-setting-label">Up to</div>
                    <ul className="rain-menu-list tiles-lessons-grid">
                      {LESSON_MENU.slice(1).map(c => (
                        <li key={c.id}>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={listId === c.id}
                            aria-label={`${c.label}, ${c.count} sentences`}
                            className={`rain-menu-item${listId === c.id ? ' is-active' : ''}`}
                            data-list={c.id}
                            data-count={c.count}
                            onClick={() => chooseLessons(c.id)}
                          >
                            <span className="rain-menu-name">{c.short}</span>
                            <span className="rain-menu-count">{c.count}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
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
                  if (used || status === 'timeout') {
                    return (
                      <span key={`${roundKey}-${t.slot}`} className={`tiles-tile is-used${!used ? ' is-left' : ''}`} aria-hidden="true">
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
                <div className="rain-over-label" id="tiles-over-title">Game over</div>
                {result?.newBest && <div className="rain-new-best">New best!</div>}
                <div className="rain-final" data-score={score}>
                  <span className="rain-final-num">{score}</span>
                  <span className="rain-final-unit">points</span>
                </div>
                <dl className="rain-stats">
                  <div><dt>Level</dt><dd>{level}</dd></div>
                  <div><dt>Longest streak</dt><dd>{state.bestStreak}</dd></div>
                  <div><dt>Sentences</dt><dd>{correct}</dd></div>
                </dl>
                {state.helped > 0 && (
                  <div className="rain-over-best tiles-over-helped">
                    {state.helped === 1 ? '1 more sentence' : `${state.helped} more sentences`} finished with filled-in words ({state.filledWords} filled)
                  </div>
                )}
                {!result?.newBest && <div className="rain-over-best">Your best for {choice.label}: {best.score}</div>}
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
                  <button type="button" className="rain-btn rain-btn-primary rain-again" onClick={() => start(true)}>Play again</button>
                  <div className="rain-over-links">
                    <button type="button" className="rain-btn rain-btn-quiet" onClick={() => dispatch({ type: 'quit' })}>Change lessons</button>
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
