import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import T from '../premium/components/T.jsx'
import {
  makeRng, makeRound, moverText,
  gameReducer, initialGame, frontWord, flyingCount, isFrozen, LIVES, MAX_IN_AIR,
  levelFlightMs, skyStep, cloudRate, canLaunchSecond, secondFlightMs, followerX, makeFollowerRound, followerBlocked,
  multiplierFor, toNextLevel, WORDS_PER_LEVEL, TWO_AT_ONCE_FROM,
  makeBag, drawFromBag, missedInBag,
} from '../games/word-rain'
import { MENU, ALL_WORDS, ALL_WORDS_ID, listById, homeList, bestKey, oldBestKeys } from '../games/word-rain/lists.js'
import { unlock, play } from '../games/word-rain/sound.js'
import {
  Sky, Ground, ShapeBody, Burst, Splash, Confetti, Hearts, Flame, PauseIcon, SoundIcon, GearIcon, ChevronIcon,
} from '../games/word-rain/scene.jsx'

/**
 * Word Rain (plan 2026-10-26-word-rain-game). Words from the course
 * vocabulary fall as raindrops or rise as balloons through a living sky; tap
 * the meaning before a word gets away. Right answers pop the word and score
 * more for a quick tap and a long streak; every 8 right is a new level, the
 * sky shifts and the words speed up, and from level 3 two words can be in the
 * air at once. Three lives. The best score and level for each word list stay
 * on this device.
 *
 * Words (Step 4): one menu, the Cards page's own (word types, course lists,
 * topics) plus the site's word lists; every list holds every word it has.
 * A shuffle bag plays every word of the list once before any repeats; a
 * missed word comes back once, 5 to 8 words later. The title screen shows the
 * Words control and Play; direction and shape sit in a small Options panel.
 *
 * Pure rules live in src/games/word-rain/ (rounds, scoring, levels and the
 * game reducer, all tested); this page owns the screen, the timing (Web
 * Animations API, so a pause freezes every word exactly), sound and storage.
 *
 * It is mounted by the live app through src/premium/pages/WordRain.jsx, which
 * loads source-core.css and word-rain.css (the build drops CSS imported from
 * src/ outside src/premium).
 */

// Tongan goes through the site's one Tongan component (premium T: lang="to",
// the serif italic voice, okinafy on the string). The deck's tonganShown is
// already okinafied; no Tongan is ever typed by hand here.
const Tongan = T

const COUNT_MS = 650
const POP_MS = 850
const REVEAL_MS = 1300
const BANNER_MS = 1800
const NEXT_MS = 260
const AFTER_LEVEL_UP_MS = 1150
const GAP_PX = 10

const SHAPE_KEY = 'lft-word-rain-shape'
const MUTE_KEY = 'lft-word-rain-muted'
const BEST_KEY = 'lft-word-rain-best'
const SHAPES = { raindrop: 'Raindrop', balloon: 'Balloon' }
const DIRECTION_LABELS = {
  'to-english': 'Tongan → English',
  'to-tongan': 'English → Tongan',
}

// ── storage (every read and write survives a browser that refuses it) ──
function readStore(key) {
  try { return window.localStorage.getItem(key) } catch { return null }
}
function writeStore(key, value) {
  try { window.localStorage.setItem(key, value) } catch { /* private mode: lasts this visit */ }
}
function readShape() { return readStore(SHAPE_KEY) === 'balloon' ? 'balloon' : 'raindrop' }
function readMuted() { return readStore(MUTE_KEY) === '1' }
function readBests() {
  try {
    const v = JSON.parse(readStore(BEST_KEY) || '{}')
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}
// A best score belongs to a list (key "topic:family"). A list with nothing
// kept yet reads the score Steps 1 to 3 kept for its nearest old list.
function bestOf(bests, key) {
  let b = bests?.[key]
  if (!b) for (const old of oldBestKeys(key)) { if (bests?.[old]) { b = bests[old]; break } }
  return { score: Math.max(0, Number(b?.score) || 0), level: Math.max(0, Number(b?.level) || 0) }
}

// ── reduced motion (read live, no state copied in an effect) ───────────
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
  } catch { /* no vibration: nothing to do */ }
}

/** A number that counts up to its value instead of jumping. */
function TickNumber({ value, className, instant }) {
  const ref = useRef(null)
  const shown = useRef(value)
  // React renders the first value only; after that the effect writes the
  // text, so the count-up never flashes the final number first.
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

/**
 * One word in the air. It measures the field, starts its own flight and
 * hands the animation to the page (for pause, freeze and timing); when the
 * flight ends unanswered it reports the escape.
 */
function Mover({ word, shape, tonganMoves, role, fieldRef, register, onEscape, reduced }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const field = fieldRef.current
    const el = ref.current
    if (!field || !el) return
    const H = field.clientHeight
    const W = field.clientWidth
    const h = el.offsetHeight
    const w = el.offsetWidth
    const span = Math.max(0, W - w - GAP_PX * 2)
    el.style.left = `${Math.round(GAP_PX + word.x * span)}px`
    // The raindrop appears at the top of the sky (just under the score, so
    // it can be read at once) and falls until it meets the ground; the
    // balloon starts on the ground and rises until its top reaches the top
    // of the sky (then it gets away, off the top).
    const ground = Math.max(0, H - h)
    const from = shape === 'balloon' ? ground : 0
    const to = shape === 'balloon' ? 0 : ground
    const anim = el.animate(
      [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }],
      { duration: word.duration, easing: 'linear', fill: 'forwards' },
    )
    anim.onfinish = () => onEscape(word.key)
    register(word.key, anim)
    return () => {
      anim.onfinish = null
      anim.cancel()
      register(word.key, null)
    }
    // A flight is started once, when the word appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.key])

  const { fate } = word
  return (
    <div
      ref={ref}
      className={`rain-mover is-${fate}${role ? ` is-${role}` : ''}`}
      data-key={word.key}
      data-ms={word.duration}
    >
      <div className="rain-sway">
        <ShapeBody shape={shape}>
          {tonganMoves
            ? <Tongan className="rain-word font-tongan">{word.round.mover}</Tongan>
            : <span className="rain-word rain-word-en">{word.round.mover}</span>}
        </ShapeBody>
      </div>
      {fate === 'popped' && (
        <>
          {!reduced && <Burst seed={word.key} />}
          <span className="rain-gain">
            +{word.gain}{word.mult > 1 && <small> ×{word.mult}</small>}
          </span>
        </>
      )}
      {fate === 'escaped' && shape === 'raindrop' && !reduced && <Splash />}
    </div>
  )
}

export default function WordRain() {
  const [listChoice, setListChoice] = useState(ALL_WORDS_ID)
  const [panel, setPanel] = useState(null) // null | 'words' | 'options'
  const [direction, setDirection] = useState('to-english')
  const [shape, setShapeState] = useState(readShape)
  const [muted, setMutedState] = useState(readMuted)
  const [bests, setBests] = useState(readBests)
  const [result, setResult] = useState(null) // { newBest, best }
  const [state, dispatch] = useReducer(gameReducer, undefined, () => initialGame())
  const isTouch = useIsTouchPrimary()
  const reduced = useReducedMotion()

  // The chosen list: every word it has. A short list borrows distractors
  // from all the words (same part of speech first).
  const playing = useMemo(() => listById(listChoice), [listChoice])
  const listId = playing.id
  const deck = playing.cards
  const fallback = listId === ALL_WORDS_ID ? null : ALL_WORDS
  const byId = useMemo(() => new Map(playing.cards.map(c => [c.id, c])), [playing])
  const bestId = bestKey(listId)
  const listLabel = playing.label
  // The word the title screen's shape carries: a real card from the chosen
  // set (fixed seed, so it does not flicker), shown in the chosen direction.
  const titleWord = useMemo(() => moverText(makeRound(playing.cards, makeRng(2026), { direction }).target, direction), [playing, direction])

  const { phase, paused, words, reveal, last, score, lives, level, streak, levelUp, hits, correct } = state
  const front = frontWord(state)
  const inAir = flyingCount(state)
  const frozen = isFrozen(state)
  const tonganMoves = direction === 'to-english'
  const mult = multiplierFor(streak)
  const best = bestOf(bests, bestId)

  // Latest state for timers and the launch loop, which run outside render.
  const stateRef = useRef(state)
  const settingsRef = useRef({ deck, byId, fallback, direction, bestId, bests, muted })
  useEffect(() => { stateRef.current = state })
  useEffect(() => { settingsRef.current = { deck, byId, fallback, direction, bestId, bests, muted } })

  // The shuffle bag for this game: every word once before any repeats.
  const bagRef = useRef(null)
  // Where a target's distractors come from: a word-list word playing in All
  // words draws them from its own list first, then from all the words.
  const sourcesFor = useCallback((target) => {
    const { deck: d, fallback: fb } = settingsRef.current
    const home = fb ? null : homeList(target)
    return home ? { pool: home, wider: ALL_WORDS } : { pool: d, wider: fb }
  }, [])

  const sound = useCallback((name, ...args) => {
    if (!settingsRef.current.muted) play(name, ...args)
  }, [])

  const setShape = useCallback((v) => { setShapeState(v); writeStore(SHAPE_KEY, v) }, [])
  const toggleMute = useCallback(() => {
    const next = !settingsRef.current.muted
    writeStore(MUTE_KEY, next ? '1' : '0')
    if (!next) unlock()
    settingsRef.current = { ...settingsRef.current, muted: next }
    setMutedState(next)
  }, [])

  const start = useCallback((instant = false) => {
    if (!settingsRef.current.muted) unlock()
    setResult(null)
    setPanel(null)
    bagRef.current = makeBag(settingsRef.current.deck.map(c => c.id), Math.random)
    dispatch({ type: 'start', instant })
  }, [])

  // ── flights: every word's animation, by key ──────────────────────────
  const fieldRef = useRef(null)
  const sceneRef = useRef(null)
  const anims = useRef(new Map())
  const register = useCallback((key, anim) => {
    if (anim) anims.current.set(key, anim)
    else anims.current.delete(key)
  }, [])
  const onEscape = useCallback((key) => dispatch({ type: 'escape', key }), [])

  // Freeze every word while paused or while a miss is showing; a word that
  // has been answered or has escaped stays where it is.
  useEffect(() => {
    for (const w of words) {
      const a = anims.current.get(w.key)
      if (!a || a.playState === 'finished') continue
      const hold = frozen || w.fate !== 'flying'
      if (hold && a.playState === 'running') a.pause()
      else if (!hold && a.playState === 'paused') a.play()
    }
  }, [words, frozen])

  const launchFront = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing' || s.paused || s.reveal || flyingCount(s) >= MAX_IN_AIR || !bagRef.current) return
    const { byId: cards, direction: dir } = settingsRef.current
    // The bag gives the next word; a word still on screen is never drawn.
    const { id, bag } = drawFromBag(bagRef.current, Math.random, new Set(s.words.map(w => w.round.target.id)))
    const target = id && cards.get(id)
    if (!target) return
    const { pool, wider } = sourcesFor(target)
    const round = makeRound(pool, Math.random, { direction: dir, optionCount: 4, target, fallback: wider })
    bagRef.current = bag
    dispatch({ type: 'launch', round, duration: levelFlightMs(s.level), x: Math.random() })
  }, [sourcesFor])

  // The next word comes when the sky is clear of answerable words: a beat
  // after a pop, longer after a level-up so the banner can be read.
  useEffect(() => {
    if (phase !== 'playing' || paused || reveal || inAir > 0) return
    const t = window.setTimeout(launchFront, levelUp ? AFTER_LEVEL_UP_MS : NEXT_MS)
    return () => window.clearTimeout(t)
  }, [phase, paused, reveal, inAir, levelUp, launchFront])

  // Every miss goes back in the bag, to come round once more 5 to 8 words on.
  const missSeen = useRef({ gameId: 0, n: 0 })
  useEffect(() => {
    if (missSeen.current.gameId !== state.gameId) missSeen.current = { gameId: state.gameId, n: 0 }
    const { misses } = state
    for (let i = missSeen.current.n; i < misses.length; i++) {
      if (bagRef.current) bagRef.current = missedInBag(bagRef.current, misses[i], Math.random)
    }
    missSeen.current.n = misses.length
  }, [state])

  // From level 3 a second word enters once the front word is far enough on.
  useEffect(() => {
    if (phase !== 'playing') return
    const id = window.setInterval(() => {
      const s = stateRef.current
      if (s.paused || s.reveal || s.level < TWO_AT_ONCE_FROM) return
      const f = frontWord(s)
      const n = flyingCount(s)
      const a = f && anims.current.get(f.key)
      if (!f || !a || n !== 1) return
      const t = Number(a.currentTime) || 0
      if (!canLaunchSecond({ level: s.level, inAir: n, frontProgress: t / f.duration })) return
      if (!bagRef.current) return
      const { deck: d, byId: cards, direction: dir } = settingsRef.current
      // The bag's next word that cannot pass for the front word or its answers.
      const blocked = followerBlocked(d, f.round, s.words.map(w => w.round.target.id))
      const next = drawFromBag(bagRef.current, Math.random, blocked)
      const target = next.id && cards.get(next.id)
      if (!target) return
      const { pool, wider } = sourcesFor(target)
      const round = makeFollowerRound(pool, Math.random, f.round, { direction: dir, optionCount: 4, fallback: wider, target })
      if (!round) return
      bagRef.current = next.bag
      dispatch({
        type: 'launch',
        round,
        duration: secondFlightMs(levelFlightMs(s.level), f.duration - t),
        x: followerX(f.x, Math.random),
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [phase, sourcesFor])

  // A popped word leaves once its burst has played.
  useEffect(() => {
    const popped = words.filter(w => w.fate === 'popped')
    if (!popped.length) return
    const timers = popped.map(w => window.setTimeout(() => dispatch({ type: 'popDone', key: w.key }), POP_MS))
    return () => timers.forEach(t => window.clearTimeout(t))
  }, [words])

  // A miss holds the right pair up, then play goes on (or the game ends,
  // and the best score for this word set is kept).
  useEffect(() => {
    if (!reveal || paused) return
    const t = window.setTimeout(() => {
      const s = stateRef.current
      dispatch({ type: 'revealDone' })
      if (s.lives > 0) return
      const { bestId: set, bests: all } = settingsRef.current
      const prev = bestOf(all, set)
      const newBest = s.score > prev.score
      const next = { ...all, [set]: { score: Math.max(prev.score, s.score), level: Math.max(prev.level, s.level) } }
      writeStore(BEST_KEY, JSON.stringify(next))
      setBests(next)
      setResult({ newBest, best: prev.score })
    }, REVEAL_MS)
    return () => window.clearTimeout(t)
  }, [reveal, paused])

  // The level banner shows for a moment.
  useEffect(() => {
    if (!levelUp) return
    const t = window.setTimeout(() => dispatch({ type: 'levelUpDone', at: levelUp.at }), BANNER_MS)
    return () => window.clearTimeout(t)
  }, [levelUp])

  // The countdown.
  useEffect(() => {
    if (phase !== 'countdown' || paused) return
    const t = window.setTimeout(() => dispatch({ type: 'tick' }), COUNT_MS)
    return () => window.clearTimeout(t)
  }, [phase, paused, state.count])

  // ── sound, shake and buzz follow the state ───────────────────────────
  const seen = useRef({ gameId: 0, correct: 0, hits: 0, levelUp: null, count: null, phase: 'title' })
  useEffect(() => {
    let s = seen.current
    if (state.gameId !== s.gameId) s = { gameId: state.gameId, correct: 0, hits: 0, levelUp: null, count: null, phase: 'title' }
    if (phase === 'countdown' && state.count !== s.count) sound('tick', false)
    if (phase === 'playing' && s.phase !== 'playing') sound('tick', true)
    if (correct > s.correct) sound('pop', multiplierFor(streak))
    if (hits > s.hits) {
      sound('thud')
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
    if (levelUp && levelUp.at !== s.levelUp) sound('chime')
    seen.current = { gameId: state.gameId, correct, hits, levelUp: levelUp?.at ?? s.levelUp, count: state.count, phase }
  }, [phase, state.count, state.gameId, correct, hits, streak, levelUp, isTouch, reduced, sound])

  // ── input ────────────────────────────────────────────────────────────
  const answer = useCallback((index, key) => {
    const s = stateRef.current
    const f = frontWord(s)
    if (!f || f.key !== key) return
    if (!settingsRef.current.muted) unlock()
    const a = anims.current.get(f.key)
    dispatch({ type: 'answer', key, index, elapsedMs: a ? Number(a.currentTime) || 0 : f.duration })
  }, [])

  const togglePause = useCallback(() => {
    const s = stateRef.current
    dispatch({ type: s.paused ? 'resume' : 'pause' })
  }, [])

  // Leaving the tab pauses the game rather than costing a life.
  useEffect(() => {
    const onHide = () => { if (document.hidden) dispatch({ type: 'pause' }) }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  // ── the title screen's two panels (Words, Options) ───────────────────
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
  // An open panel takes the focus: the chosen entry, else its first button.
  useEffect(() => {
    if (!panel) return
    const el = sheetRef.current
    const target = el?.querySelector('[aria-checked="true"], [aria-pressed="true"]') ?? el?.querySelector('button')
    target?.focus({ preventScroll: true })
  }, [panel])
  const chooseList = useCallback((id) => {
    setListChoice(id)
    closePanel()
  }, [closePanel])

  // Keys: 1-4 answer, Space or P pauses (Escape too), Enter plays; Escape
  // closes an open panel.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = stateRef.current
      const inGame = s.phase === 'playing' || s.phase === 'countdown'
      if (inGame) {
        if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault()
          if (!e.repeat) togglePause()
          return
        }
        const n = Number(e.key)
        const f = frontWord(s)
        if (f && Number.isInteger(n) && n >= 1 && n <= f.round.options.length) {
          e.preventDefault()
          answer(n - 1, f.key)
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
    // Space on a focused answer button would also click it; in a game Space
    // means pause only.
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
  }, [answer, start, togglePause, closePanel])

  // ── render ───────────────────────────────────────────────────────────
  const sky = skyStep(level)
  // The buttons answer the front word. While a miss is showing they hold the
  // missed word's answers (right one marked) even if another word waits.
  const shown = reveal && last
    ? { ...last, live: false }
    : front
      ? { key: front.key, round: front.round, chosen: null, right: null, live: true }
      : last ? { ...last, live: false } : null
  const twoUp = inAir > 1
  const toNext = toNextLevel(correct)
  const inGame = phase === 'countdown' || phase === 'playing'

  return (
    <section className={`source-drill-shell rain-shell is-${phase}`} data-game="word-rain">
      <div className={`premium-core word-rain rain-shape-${shape}`}>
        <div className="rain-bar">
          <Link to="/drills" className="x-frame-back">{'←'} All drills</Link>
          <span className="rain-bar-tag">Game · Course vocabulary</span>
        </div>

        <div
          ref={sceneRef}
          className={`rain-scene rain-sky-${sky}${frozen && inGame ? ' is-frozen' : ''}${paused && inGame ? ' is-paused' : ''}${twoUp ? ' is-two-up' : ''}`}
          data-phase={phase}
          data-level={level}
        >
          <Sky rate={cloudRate(level)} />

          {/* ── top row: the HUD in a game, the sound switch on the title ── */}
          <div className="rain-top">
            {inGame ? (
              <div
                className="rain-hud"
                data-score={score}
                data-lives={lives}
                data-streak={streak}
                data-mult={mult}
                data-level={level}
              >
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
                  <button
                    type="button"
                    className="rain-icon-btn rain-pause"
                    onClick={togglePause}
                    aria-pressed={paused}
                    aria-label={paused ? 'Resume' : 'Pause'}
                  >
                    <PauseIcon paused={paused} />
                  </button>
                  <button type="button" className="rain-icon-btn rain-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Sound off' : 'Sound on'}>
                    <SoundIcon muted={muted} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rain-top-title">
                {phase === 'title' && (
                  <button
                    type="button"
                    className="rain-icon-btn rain-options-btn"
                    onClick={e => (panel === 'options' ? closePanel() : openPanel('options', e))}
                    aria-haspopup="dialog"
                    aria-expanded={panel === 'options'}
                    aria-label="Options"
                  >
                    <GearIcon />
                  </button>
                )}
                <button type="button" className="rain-icon-btn rain-mute" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? 'Sound off' : 'Sound on'}>
                  <SoundIcon muted={muted} />
                </button>
              </div>
            )}
          </div>

          {/* ── the field: where words fly ── */}
          <div className="rain-field" ref={fieldRef}>
            {phase === 'title' && (
              <div className="rain-title-block">
                <div className="rain-idle" aria-hidden="true">
                  {shape === 'raindrop'
                    ? <div className="rain-drizzle">{[0, 1, 2, 3, 4].map(i => <i key={i} />)}</div>
                    : <div className="rain-idle-far"><ShapeBody shape={shape}><span className="rain-word" /></ShapeBody></div>}
                  <div className="rain-idle-main">
                    <div className="rain-sway">
                      <ShapeBody shape={shape}>
                        {tonganMoves
                          ? <Tongan className="rain-word font-tongan">{titleWord}</Tongan>
                          : <span className="rain-word rain-word-en">{titleWord}</span>}
                      </ShapeBody>
                    </div>
                  </div>
                </div>
                <div className="rain-eyebrow">A word game</div>
                <h1 className="rain-title">Word Rain</h1>
                <p className="rain-tagline">Tap the meaning before the word gets away.</p>
              </div>
            )}

            {inGame && words.map(w => (
              <Mover
                key={`${state.gameId}-${w.key}`}
                word={w}
                shape={shape}
                tonganMoves={tonganMoves}
                role={w.fate === 'flying' ? (front && w.key === front.key ? 'active' : 'queued') : null}
                fieldRef={fieldRef}
                register={register}
                onEscape={onEscape}
                reduced={reduced}
              />
            ))}

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
                  <span className="rain-banner-sub">{levelUp.level === TWO_AT_ONCE_FROM ? 'Two words at once' : 'Faster'}</span>
                </span>
              </div>
            )}

            {reveal && phase === 'playing' && (
              <div className="rain-reveal" role="status" key={reveal.key}>
                <span className="rain-reveal-label">{reveal.kind === 'missed' ? 'Got away' : 'Not quite'}</span>
                <span className="rain-reveal-pair">
                  <Tongan className="font-tongan">{reveal.round.target.tonganShown}</Tongan>
                  <span className="rain-eq"> = </span>
                  <span className="rain-reveal-en">{reveal.round.target.full}</span>
                </span>
              </div>
            )}

            {paused && inGame && (
              <div className="rain-paused">
                <div className="rain-paused-title">Paused</div>
                <button type="button" className="rain-btn rain-btn-primary" onClick={() => dispatch({ type: 'resume' })}>
                  Resume
                </button>
                <button type="button" className="rain-btn rain-btn-quiet" onClick={() => dispatch({ type: 'quit' })}>
                  End game
                </button>
              </div>
            )}
          </div>

          <Ground />

          {/* ── bottom row: the Words control and Play on the title, answers in a game ── */}
          {phase === 'title' && (
            <div className="rain-tray rain-setup">
              <button
                type="button"
                className="rain-words"
                onClick={e => openPanel('words', e)}
                aria-haspopup="dialog"
                aria-expanded={panel === 'words'}
                data-list={listId}
                data-count={playing.count}
              >
                <span className="rain-words-label">Words</span>
                <span className="rain-words-name">{listLabel}</span>
                <span className="rain-words-count">{playing.count} words</span>
                <ChevronIcon />
              </button>
              <div className="rain-go-col">
                <button type="button" className="rain-btn rain-btn-primary rain-play" onClick={() => start(false)}>
                  Play
                </button>
                <div className="rain-best" data-best={best.score}>
                  {best.score > 0
                    ? <>Best <b>{best.score}</b> · level {best.level}</>
                    : <>No best score yet for this list</>}
                </div>
                {!isTouch && (
                  <span className="rain-keys">
                    Answer with <kbd>1</kbd>–<kbd>4</kbd> · <kbd>Space</kbd> pauses
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── the Words menu: the Cards page's lists, each with its count ── */}
          {phase === 'title' && panel === 'words' && (
            <div className="rain-sheet-wrap" onClick={e => { if (e.target === e.currentTarget) closePanel() }}>
              <div className="rain-sheet rain-words-sheet" role="dialog" aria-modal="true" aria-labelledby="rain-words-title" ref={sheetRef}>
                <div className="rain-sheet-head">
                  <h2 className="rain-sheet-title" id="rain-words-title">Words</h2>
                  <button type="button" className="rain-btn rain-btn-quiet rain-sheet-close" onClick={closePanel}>Done</button>
                </div>
                <div className="rain-sheet-body">
                  {MENU.map(g => (
                    <div key={g.id} className="rain-menu-group" role="radiogroup" aria-labelledby={`rain-menu-${g.id}`}>
                      <div className="rain-setting-label" id={`rain-menu-${g.id}`}>{g.label}</div>
                      <ul className="rain-menu-list">
                        {g.lists.map(l => (
                          <li key={l.id}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={listId === l.id}
                              className={`rain-menu-item${listId === l.id ? ' is-active' : ''}`}
                              data-list={l.id}
                              data-count={l.count}
                              onClick={() => chooseList(l.id)}
                            >
                              <span className="rain-menu-name">{l.label}</span>
                              <span className="rain-menu-count">{l.count}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Options: direction and shape ── */}
          {phase === 'title' && panel === 'options' && (
            <div className="rain-sheet-wrap rain-options-wrap" onClick={e => { if (e.target === e.currentTarget) closePanel() }}>
              <div className="rain-sheet rain-options-sheet" role="dialog" aria-modal="true" aria-labelledby="rain-options-title" ref={sheetRef}>
                <div className="rain-sheet-head">
                  <h2 className="rain-sheet-title" id="rain-options-title">Options</h2>
                  <button type="button" className="rain-btn rain-btn-quiet rain-sheet-close" onClick={closePanel}>Done</button>
                </div>
                <div className="rain-sheet-body">
                  <div className="rain-setting" role="group" aria-labelledby="rain-set-direction">
                    <span className="rain-setting-label" id="rain-set-direction">Direction</span>
                    <div className="rain-chips">
                      {Object.entries(DIRECTION_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`rain-chip${direction === key ? ' is-active' : ''}`}
                          aria-pressed={direction === key}
                          data-direction={key}
                          onClick={() => setDirection(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rain-setting" role="group" aria-labelledby="rain-set-shape">
                    <span className="rain-setting-label" id="rain-set-shape">Shape</span>
                    <div className="rain-chips">
                      {Object.entries(SHAPES).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          className={`rain-chip${shape === key ? ' is-active' : ''}`}
                          aria-pressed={shape === key}
                          data-shape={key}
                          onClick={() => setShape(key)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {inGame && (
            <div
              className={`rain-tray rain-options${shown?.live ? ' is-live' : ''}`}
              role="group"
              aria-label="Answers"
              data-key={shown?.live ? shown.key : ''}
            >
              {shown
                ? shown.round.options.map((opt, i) => {
                  let cls = ''
                  if (!shown.live) {
                    if (i === shown.round.correctIndex) cls = shown.right ? ' is-answer' : ' is-revealed-answer'
                    else if (i === shown.chosen) cls = ' is-chosen-wrong'
                  }
                  return (
                    <button
                      key={`${shown.key}-${opt.id}`}
                      type="button"
                      className={`rain-opt${cls}`}
                      disabled={!shown.live || frozen}
                      onClick={() => answer(i, shown.key)}
                    >
                      {!isTouch && <span className="rain-opt-key" aria-hidden="true">{i + 1}</span>}
                      {tonganMoves
                        ? <span className="rain-opt-label rain-opt-en">{shown.round.labels[i]}</span>
                        : <Tongan className="rain-opt-label font-tongan">{shown.round.labels[i]}</Tongan>}
                    </button>
                  )
                })
                : Array.from({ length: 4 }, (_, i) => (
                  <button key={`wait-${i}`} type="button" className="rain-opt is-waiting" disabled aria-hidden="true" tabIndex={-1}>
                    <span className="rain-opt-label">&nbsp;</span>
                  </button>
                ))}
            </div>
          )}

          {/* ── game over ── */}
          {phase === 'over' && (
            <div className="rain-over-wrap">
              <section className={`rain-over${result?.newBest ? ' is-new-best' : ''}`} aria-labelledby="rain-over-title">
                {result?.newBest && !reduced && <Confetti seed={state.gameId} />}
                <div className="rain-over-label" id="rain-over-title">Game over</div>
                {result?.newBest && <div className="rain-new-best">New best!</div>}
                <div className="rain-final" data-score={score}>
                  <span className="rain-final-num">{score}</span>
                  <span className="rain-final-unit">points</span>
                </div>
                <dl className="rain-stats">
                  <div><dt>Level</dt><dd>{level}</dd></div>
                  <div><dt>Longest streak</dt><dd>{state.bestStreak}</dd></div>
                  <div><dt>Words</dt><dd>{correct}</dd></div>
                </dl>
                {!result?.newBest && (
                  <div className="rain-over-best">Your best for {listLabel}: {best.score}</div>
                )}
                {state.missed.length > 0 && (
                  <div className="rain-missed">
                    <div className="rain-setting-label">Words to look at again</div>
                    <ul className="rain-missed-list">
                      {state.missed.map(c => (
                        <li key={c.id} className="rain-missed-row">
                          <Tongan className="font-tongan rain-missed-to">{c.tonganShown}</Tongan>
                          <span className="rain-eq" aria-hidden="true">=</span>
                          <span className="rain-missed-en">{c.full}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rain-over-actions">
                  <button type="button" className="rain-btn rain-btn-primary rain-again" onClick={() => start(true)}>
                    Play again
                  </button>
                  <div className="rain-over-links">
                    <button type="button" className="rain-btn rain-btn-quiet" onClick={() => dispatch({ type: 'quit' })}>
                      Change settings
                    </button>
                    <Link to="/drills" className="rain-btn rain-btn-quiet">All drills</Link>
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
