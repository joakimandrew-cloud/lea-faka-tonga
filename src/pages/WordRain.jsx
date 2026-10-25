import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import vocabulary from '../data/book-vocabulary.json'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import T from '../premium/components/T.jsx'
import {
  WORD_SETS, WORD_SET_LABELS, buildDeck, makeRound, flightMs,
} from '../games/word-rain'

/**
 * Word Rain (plan 2026-10-26-word-rain-game). One word from the course
 * vocabulary moves across the sky, as a raindrop falling or a balloon rising;
 * the learner taps its meaning before it reaches the far edge. Three lives.
 *
 * The round logic is pure and tested in src/games/word-rain/. This page owns
 * the screen: the start card, the flight (Web Animations API, so pause and the
 * "reached the edge" moment come from one animation object), the answer
 * buttons and the end card.
 *
 * It is mounted by the live app (src/premium/App.jsx) in the same shell as
 * every drill page (.source-drill-shell > .premium-core, SourceDrill.jsx), so
 * the drill chrome it reuses (.pcs-card, .pcs-btn, .pcs-next, .x-chip, the
 * DrillFrame header classes) takes the site's own look from source-core.css.
 * word-rain.css holds only the sky and the two shapes.
 *
 * No stylesheet is imported here: the build drops CSS imported from src/
 * outside src/premium (vite.config.js, course-style-bridge), so the premium
 * page src/premium/pages/WordRain.jsx loads source-core.css and word-rain.css
 * and renders this component.
 */

// Tongan goes through the site's one Tongan component (premium T: lang="to",
// the serif italic voice, okinafy on the string). The deck's tonganShown is
// already okinafied; no Tongan is ever typed by hand here.
const Tongan = T

const LIVES = 3
const POP_MS = 450
const REVEAL_MS = 1200
const RECENT = 8
const SHAPE_KEY = 'lft-word-rain-shape'
const SHAPES = { raindrop: 'Raindrop', balloon: 'Balloon' }
const DIRECTION_LABELS = {
  'to-english': 'Tongan → English',
  'to-tongan': 'English → Tongan',
}

// Best score for this visit to the site. Kept outside the component so it
// survives Play again and a trip to another page; nothing is stored.
let sessionBest = 0
function recordBest(n) { sessionBest = Math.max(sessionBest, n) }

function readShape() {
  try {
    const v = window.localStorage.getItem(SHAPE_KEY)
    return v === 'balloon' ? 'balloon' : 'raindrop'
  } catch {
    return 'raindrop'
  }
}
function writeShape(v) {
  try { window.localStorage.setItem(SHAPE_KEY, v) } catch { /* private mode: the pick lasts this visit */ }
}

const initial = {
  phase: 'start', // start | playing | over
  status: 'idle', // flying | right | wrong | missed
  paused: false,
  round: null,
  seq: 0,
  chosen: null,
  score: 0,
  lives: LIVES,
  missed: [],
  recent: [],
  best: 0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'start':
      return {
        ...initial,
        phase: 'playing',
        status: 'flying',
        round: action.round,
        seq: state.seq + 1,
        recent: [action.round.target.id],
        best: Math.max(state.best, sessionBest),
      }
    case 'answer': {
      if (state.status !== 'flying' || state.paused) return state
      if (action.index === state.round.correctIndex) {
        const score = state.score + 1
        return { ...state, status: 'right', chosen: action.index, score, best: Math.max(state.best, score) }
      }
      return {
        ...state,
        status: 'wrong',
        chosen: action.index,
        lives: state.lives - 1,
        missed: addMissed(state.missed, state.round.target),
      }
    }
    case 'miss':
      if (state.status !== 'flying') return state
      return {
        ...state,
        status: 'missed',
        chosen: null,
        lives: state.lives - 1,
        missed: addMissed(state.missed, state.round.target),
      }
    case 'next':
      if (state.lives <= 0) return { ...state, phase: 'over', status: 'idle', paused: false }
      return {
        ...state,
        status: 'flying',
        chosen: null,
        round: action.round,
        seq: state.seq + 1,
        recent: [action.round.target.id, ...state.recent].slice(0, RECENT),
      }
    case 'pause':
      if (state.phase !== 'playing' || state.status !== 'flying') return state
      return { ...state, paused: true }
    case 'resume':
      return { ...state, paused: false }
    case 'quit':
      return { ...initial, seq: state.seq, best: state.best }
    default:
      return state
  }
}

function addMissed(list, card) {
  return list.some(c => c.id === card.id) ? list : [...list, card]
}

export default function WordRain() {
  const [wordSet, setWordSet] = useState('essential')
  const [direction, setDirection] = useState('to-english')
  const [shape, setShapeState] = useState(readShape)
  const [state, dispatch] = useReducer(reducer, initial, s => ({ ...s, best: sessionBest }))
  const isTouch = useIsTouchPrimary()

  const deck = useMemo(() => buildDeck(vocabulary, wordSet), [wordSet])
  const counts = useMemo(
    () => Object.fromEntries(WORD_SETS.map(s => [s, buildDeck(vocabulary, s).length])),
    [],
  )

  const setShape = useCallback((v) => {
    setShapeState(v)
    writeShape(v)
  }, [])

  // A word's flight time is set when it appears, from the score so far.
  const newRound = useCallback((recent = [], score = 0) => ({
    ...makeRound(deck, Math.random, { direction, optionCount: 4, avoid: new Set(recent) }),
    duration: flightMs(score),
  }), [deck, direction])

  const start = useCallback(() => {
    dispatch({ type: 'start', round: newRound() })
  }, [newRound])

  const { phase, status, paused, round, seq, score, lives, chosen } = state

  // After an answer: a short pop on a right one, the right pair held up for a
  // moment on a wrong one or a miss, then the next word (or the end card).
  useEffect(() => {
    if (phase !== 'playing' || status === 'flying' || status === 'idle') return
    const wait = status === 'right' ? POP_MS : REVEAL_MS
    const t = window.setTimeout(() => {
      dispatch({ type: 'next', round: newRound(state.recent, state.score) })
    }, wait)
    return () => window.clearTimeout(t)
  }, [phase, status, seq, newRound, state.recent, state.score])

  // Keep the best score for the rest of this visit.
  useEffect(() => { recordBest(state.best) }, [state.best])

  // A new game or the end card brings the game card to the top of the screen
  // (on a phone the header would otherwise push the answers below the fold).
  const stageRef = useRef(null)
  useEffect(() => {
    if (phase === 'start') return
    const el = stageRef.current
    if (!el) return
    // Scroll only as far as the whole card needs, never past its top edge
    // (the sticky site header is about 70 px tall).
    const rect = el.getBoundingClientRect()
    const header = 82
    if (rect.top < header) window.scrollBy(0, rect.top - header)
    else if (rect.bottom > window.innerHeight) window.scrollBy(0, Math.min(rect.bottom - window.innerHeight + 16, rect.top - header))
  }, [phase])

  // ── the flight ────────────────────────────────────────────────────────
  const skyRef = useRef(null)
  const moverRef = useRef(null)
  const flightRef = useRef(null)
  const durationMs = round ? round.duration : 0

  useLayoutEffect(() => {
    if (phase !== 'playing' || !round) return
    const sky = skyRef.current
    const mover = moverRef.current
    if (!sky || !mover) return
    const H = sky.clientHeight
    const W = sky.clientWidth
    const h = mover.offsetHeight
    const w = mover.offsetWidth
    const gutter = 8
    const span = Math.max(0, W - w - gutter * 2)
    mover.style.left = `${Math.round(gutter + Math.random() * span)}px`
    // The raindrop enters from the top edge and falls until it touches the
    // bottom; the balloon starts on the bottom edge and rises to the top. The
    // balloon's string hangs below its body, so its travel keeps the string
    // inside the sky too (the mover's box includes it).
    const top = gutter
    const bottom = Math.max(top, H - h - gutter)
    const from = shape === 'balloon' ? bottom : top
    const to = shape === 'balloon' ? top : bottom
    const anim = mover.animate(
      [{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }],
      { duration: round.duration, easing: 'linear', fill: 'forwards' },
    )
    anim.onfinish = () => dispatch({ type: 'miss' })
    flightRef.current = anim
    return () => {
      anim.onfinish = null
      anim.cancel()
      if (flightRef.current === anim) flightRef.current = null
    }
    // A new flight starts only when a new word does (seq).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq, phase])

  // Freeze the word once it is answered (the pop plays where it was hit) and
  // while the game is paused.
  useEffect(() => {
    const anim = flightRef.current
    if (!anim) return
    if (paused || status !== 'flying') {
      if (anim.playState === 'running') anim.pause()
    } else if (anim.playState === 'paused') {
      anim.play()
    }
  }, [paused, status])

  // Leaving the tab pauses the game rather than costing a life.
  useEffect(() => {
    const onHide = () => { if (document.hidden) dispatch({ type: 'pause' }) }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  // ── keyboard: 1-4 answer, P or Escape pauses, Enter starts ────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (phase === 'playing') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault()
          dispatch({ type: paused ? 'resume' : 'pause' })
          return
        }
        const n = Number(e.key)
        if (Number.isInteger(n) && n >= 1 && round && n <= round.options.length) {
          e.preventDefault()
          dispatch({ type: 'answer', index: n - 1 })
        }
      } else if (e.key === 'Enter' && tag !== 'BUTTON' && tag !== 'A') {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, paused, round, start])

  const tonganMoves = direction === 'to-english'

  return (
    <section className="source-drill-shell rain-shell" data-game="word-rain">
      <div className={`premium-core word-rain rain-shape-${shape}${phase === 'playing' ? ' is-playing' : ''}`}>
        <div className="pcs-page">
          <header className="pcs-header rain-header">
            <Link to="/drills" className="x-frame-back">{'\u2190'} All drills</Link>
            <div className="pcs-eyebrow">Game · Course vocabulary</div>
            <h1 className="pcs-title rain-title">Word Rain</h1>
            {phase !== 'playing' && <p className="pcs-sub">Tap the meaning before the word gets away.</p>}
          </header>
          <div ref={stageRef} className="rain-stage">

      {phase === 'start' && (
        <section className="pcs-card rain-start" aria-labelledby="rain-start-title">
          <div className="pcs-noun-frame rain-start-frame">
            <div className="pcs-prompt-label" id="rain-start-title">How to play</div>
            <p className="rain-lead">
              A word {shape === 'balloon' ? 'floats up' : 'falls'} across the screen. Tap its meaning before it reaches the {shape === 'balloon' ? 'top' : 'bottom'}. Three misses and the game ends.
            </p>
          </div>

          <div className="rain-settings">
            <div className="rain-setting" role="group" aria-labelledby="rain-set-words">
              <span className="rain-setting-label" id="rain-set-words">Words</span>
              <div className="rain-chips">
                {WORD_SETS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`x-chip${wordSet === s ? ' is-active' : ''}`}
                    aria-pressed={wordSet === s}
                    data-wordset={s}
                    onClick={() => setWordSet(s)}
                  >
                    {WORD_SET_LABELS[s]} <span className="rain-chip-count">{counts[s]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rain-setting" role="group" aria-labelledby="rain-set-direction">
              <span className="rain-setting-label" id="rain-set-direction">Direction</span>
              <div className="rain-chips">
                {Object.entries(DIRECTION_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`x-chip${direction === key ? ' is-active' : ''}`}
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
                    className={`x-chip${shape === key ? ' is-active' : ''}`}
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

          <div className="pcs-next-container rain-start-row">
            {!isTouch && (
              <span className="pcs-keyboard-hint">
                Answer with <kbd>1</kbd>–<kbd>4</kbd> · <kbd>P</kbd> pauses
              </span>
            )}
            <button type="button" className="pcs-next rain-play" onClick={start}>
              Play →
            </button>
          </div>
        </section>
      )}

      {phase === 'playing' && round && (
        <section className={`pcs-card rain-game is-${status}${paused ? ' is-paused' : ''}`} aria-label="Word Rain game">
          <div className="pcs-card-row rain-hud" data-score={score} data-lives={lives}>
            <div className="pcs-stats">
              <span className="pcs-stat">
                <span className="pcs-stat-label">Score</span>{' '}
                <span className="pcs-stat-value rain-score">{score}</span>
              </span>
              <span className="pcs-stat rain-lives" aria-label={`${lives} of ${LIVES} lives left`}>
                <span className="pcs-stat-label">Lives</span>{' '}
                <span className="rain-life-dots" aria-hidden="true">
                  {Array.from({ length: LIVES }, (_, i) => (
                    <span key={i} className={`rain-life${i < lives ? ' is-on' : ''}`} />
                  ))}
                </span>
                <span className="pcs-stat-value rain-lives-count">{lives}</span>
              </span>
            </div>
            <button
              type="button"
              className="x-chip rain-pause"
              onClick={() => dispatch({ type: paused ? 'resume' : 'pause' })}
              disabled={!paused && status !== 'flying'}
              aria-pressed={paused}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>

          <div className="rain-sky" ref={skyRef}>
            <div className="rain-edge" aria-hidden="true" />
            <div
              key={seq}
              ref={moverRef}
              className={`rain-mover${status === 'right' ? ' is-popped' : ''}${status === 'wrong' || status === 'missed' ? ' is-lost' : ''}`}
              data-ms={durationMs}
            >
              <div className="rain-sway">
                <div className="rain-shape">
                  {tonganMoves
                    ? <Tongan className="rain-word font-tongan">{round.mover}</Tongan>
                    : <span className="rain-word rain-word-en">{round.mover}</span>}
                </div>
                {shape === 'balloon' && <span className="rain-string" aria-hidden="true" />}
              </div>
            </div>

            {(status === 'wrong' || status === 'missed') && (
              <div className="rain-reveal" role="status">
                <span className="rain-reveal-label">{status === 'missed' ? 'Got away' : 'Not quite'}</span>
                <span className="rain-reveal-pair">
                  <Tongan className="font-tongan">{round.target.tonganShown}</Tongan>
                  <span className="rain-eq"> = </span>
                  <span>{round.target.meaning}</span>
                </span>
              </div>
            )}

            {paused && (
              <div className="rain-paused">
                <div className="pcs-prompt-label">Paused</div>
                <button type="button" className="pcs-next" onClick={() => dispatch({ type: 'resume' })}>
                  Resume →
                </button>
                <button type="button" className="pcs-reset rain-quit" onClick={() => dispatch({ type: 'quit' })}>
                  End game
                </button>
              </div>
            )}
          </div>

          <div className="pcs-buttons rain-options" role="group" aria-label="Answers">
            {round.options.map((opt, i) => {
              let cls = ''
              if (status !== 'flying') {
                if (i === round.correctIndex) cls = status === 'right' ? ' is-answer' : ' is-revealed-answer'
                else if (i === chosen) cls = ' is-chosen-wrong'
              }
              return (
                <button
                  key={`${seq}-${opt.id}`}
                  type="button"
                  className={`pcs-btn rain-opt${cls}`}
                  disabled={status !== 'flying' || paused}
                  onClick={() => dispatch({ type: 'answer', index: i })}
                >
                  {!isTouch && <span className="pcs-btn-key" aria-hidden="true">{i + 1}</span>}
                  {tonganMoves
                    ? <span className="pcs-btn-label rain-opt-en">{round.labels[i]}</span>
                    : <Tongan className="pcs-btn-label font-tongan">{round.labels[i]}</Tongan>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {phase === 'over' && (
        <section className="pcs-card rain-over" aria-labelledby="rain-over-title">
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label" id="rain-over-title">Game over</div>
            <div className="pcs-noun rain-final" data-score={score}>{score} {score === 1 ? 'word' : 'words'}</div>
            <div className="pcs-noun-gloss">
              {score > 0 && score >= state.best ? 'Your best this visit.' : `Best this visit: ${state.best}`}
            </div>
          </div>

          {state.missed.length > 0 && (
            <div className="rain-missed">
              <div className="rain-setting-label">Words to look at again</div>
              <ul className="rain-missed-list">
                {state.missed.map(c => (
                  <li key={c.id} className="rain-missed-row">
                    <Tongan className="font-tongan rain-missed-to">{c.tonganShown}</Tongan>
                    <span className="rain-eq" aria-hidden="true">=</span>
                    <span className="rain-missed-en">{c.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pcs-next-container pcs-end-row">
            <Link to="/drills" className="pcs-end-link">All drills</Link>
            <button type="button" className="pcs-reset" onClick={() => dispatch({ type: 'quit' })}>
              Change settings
            </button>
            <button type="button" className="pcs-next" onClick={start}>
              Play again →
            </button>
          </div>
        </section>
      )}
          </div>
        </div>
      </div>
    </section>
  )
}
