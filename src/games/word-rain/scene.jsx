/**
 * Word Rain: the drawn scene (plan 2026-10-26-word-rain-game, Step 2).
 *
 * Everything here is inline SVG or CSS shapes, coloured only with the site's
 * own tokens through word-rain.css (currentColor and classes; no colour is
 * written in this file). No images, no new dependencies. The ground's woven
 * band is the site's own KupesiBand with Andrew's approved motifs (DECISIONS
 * 2026-09-29: every decorative motif on the website comes from that set).
 *
 * Random-looking details (cloud places, particle paths, confetti) come from a
 * seeded generator, so a render is always the same for the same key.
 */
import { useEffect, useRef } from 'react'
import { KupesiBand } from '../../premium/components/Kupesi.jsx'
import { makeRng } from './rounds.js'

// ── clouds ──────────────────────────────────────────────────────────────

/** One cloud: a few overlapping rounds on a flat base, with a shaded underside. */
function Cloud({ x, y, w, flip }) {
  return (
    <svg
      className="rain-cloud"
      viewBox="0 0 200 84"
      style={{ left: `${x}%`, top: `${y}%`, '--w': w, transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
      focusable="false"
    >
      <g className="rain-cloud-shade" transform="translate(0 5)">
        <ellipse cx="58" cy="54" rx="36" ry="24" />
        <ellipse cx="102" cy="40" rx="42" ry="33" />
        <ellipse cx="146" cy="54" rx="32" ry="23" />
        <rect x="34" y="52" width="136" height="26" rx="13" />
      </g>
      <g className="rain-cloud-body">
        <ellipse cx="58" cy="52" rx="36" ry="24" />
        <ellipse cx="102" cy="38" rx="42" ry="33" />
        <ellipse cx="146" cy="52" rx="32" ry="23" />
        <rect x="34" y="50" width="136" height="24" rx="12" />
      </g>
    </svg>
  )
}

function cloudSet(seed, n, wMin, wMax, yMin, yMax) {
  const rng = makeRng(seed)
  return Array.from({ length: n }, (_, i) => ({
    x: Math.round(((i + 0.15 + rng() * 0.7) / n) * 100 * 0.92),
    y: Math.round(yMin + rng() * (yMax - yMin)),
    w: Math.round(wMin + rng() * (wMax - wMin)),
    flip: rng() > 0.5,
  }))
}

const LAYERS = [
  { name: 'far', clouds: cloudSet(11, 4, 90, 140, 4, 46) },
  { name: 'mid', clouds: cloudSet(23, 3, 140, 210, 10, 58) },
  { name: 'near', clouds: cloudSet(37, 2, 210, 300, 30, 70) },
]

/**
 * The sky behind the game: gradient (set by the level class on the scene),
 * the sun or the stars, three cloud layers drifting at different speeds, and
 * light rain for the raindrop's stormy levels. `rate` speeds the clouds up
 * (1 = level 1) without restarting their drift.
 */
export function Sky({ rate = 1 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof el.getAnimations !== 'function') return
    for (const a of el.getAnimations({ subtree: true })) {
      try {
        if (typeof a.updatePlaybackRate === 'function') a.updatePlaybackRate(rate)
        else a.playbackRate = rate
      } catch { /* an animation that cannot change speed keeps its own */ }
    }
  }, [rate])
  return (
    <div className="rain-sky" ref={ref} aria-hidden="true">
      <div className="rain-sun" />
      <div className="rain-stars" />
      {LAYERS.map(layer => (
        <div key={layer.name} className={`rain-clouds rain-clouds-${layer.name}`}>
          {[0, 1].map(half => (
            <div key={half} className="rain-clouds-half">
              {layer.clouds.map((c, i) => <Cloud key={i} {...c} />)}
            </div>
          ))}
        </div>
      ))}
      <div className="rain-streaks" />
    </div>
  )
}

/** The ground: a low hill line, then the woven band the drops land beside. */
export function Ground() {
  return (
    <div className="rain-ground" aria-hidden="true">
      <svg className="rain-hills" viewBox="0 0 400 24" preserveAspectRatio="none" focusable="false">
        <path className="rain-hill-back" d="M0 14 C 50 4, 100 4, 150 11 S 260 20, 310 9 S 380 6, 400 10 L400 24 L0 24 Z" />
        <path className="rain-hill-front" d="M0 18 C 60 12, 120 13, 190 17 S 320 21, 400 15 L400 24 L0 24 Z" />
      </svg>
      <KupesiBand tile={16} animate={false} className="rain-band" />
    </div>
  )
}

// ── the two shapes ─────────────────────────────────────────────────────

/**
 * The shape that carries a word: a raindrop (a round body with a point on
 * top) or a balloon (an egg-shaped body with a knot and a string).
 */
export function ShapeBody({ shape, children }) {
  if (shape === 'balloon') {
    return (
      <div className="rain-shape">
        <div className="rain-body"><span className="rain-gloss" />{children}</div>
        <svg className="rain-knot" viewBox="0 0 16 10" aria-hidden="true" focusable="false"><path d="M8 0 L14 10 L2 10 Z" /></svg>
        <svg className="rain-string" viewBox="0 0 20 64" aria-hidden="true" focusable="false"><path d="M10 0 C 3 14, 17 28, 10 42 S 6 58, 11 64" /></svg>
      </div>
    )
  }
  return (
    <div className="rain-shape">
      <svg className="rain-tip" viewBox="0 0 40 32" aria-hidden="true" focusable="false"><path d="M0 32 C 7 19, 17 10, 20 0 C 23 10, 33 19, 40 32" /></svg>
      <div className="rain-body"><span className="rain-gloss" />{children}</div>
    </div>
  )
}

// ── juice ───────────────────────────────────────────────────────────────

/** The burst on a right answer: 14 bits flying out, and a ring. */
export function Burst({ seed }) {
  const rng = makeRng(seed * 7919 + 13)
  const bits = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + (rng() - 0.5) * 0.5
    const dist = 46 + rng() * 46
    return {
      dx: Math.round(Math.cos(angle) * dist),
      dy: Math.round(Math.sin(angle) * dist - 12),
      size: Math.round(5 + rng() * 6),
      rot: Math.round(rng() * 360),
      tone: i % 4,
      round: i % 3 === 0,
    }
  })
  return (
    <div className="rain-burst" aria-hidden="true">
      <span className="rain-ring" />
      {bits.map((b, i) => (
        <i
          key={i}
          className={`rain-bit rain-bit-${b.tone}${b.round ? ' is-round' : ''}`}
          style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--s': `${b.size}px`, '--r': `${b.rot}deg` }}
        />
      ))}
    </div>
  )
}

/** A missed raindrop hitting the ground: droplets thrown up and a ripple. */
export function Splash() {
  const drops = [-62, -38, -16, 16, 38, 62]
  return (
    <div className="rain-splash" aria-hidden="true">
      <span className="rain-ripple" />
      {drops.map((dx, i) => (
        <i key={i} className="rain-droplet" style={{ '--dx': `${dx}px`, '--dy': `${-22 - (3 - Math.abs(i - 2.5)) * 9}px` }} />
      ))}
    </div>
  )
}

/** Confetti for a new best score. */
export function Confetti({ seed = 1 }) {
  const rng = makeRng(seed * 104729 + 7)
  const bits = Array.from({ length: 36 }, (_, i) => ({
    dx: Math.round((rng() - 0.5) * 520),
    dy: Math.round(120 + rng() * 260),
    up: Math.round(60 + rng() * 120),
    rot: Math.round((rng() - 0.5) * 900),
    delay: Math.round(rng() * 180),
    tone: i % 5,
    w: Math.round(6 + rng() * 6),
  }))
  return (
    <div className="rain-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          className={`rain-confetto rain-bit-${b.tone % 4}${b.tone === 4 ? ' is-ink' : ''}`}
          style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--up': `${b.up}px`, '--r': `${b.rot}deg`, '--d': `${b.delay}ms`, '--w': `${b.w}px` }}
        />
      ))}
    </div>
  )
}

// ── HUD pieces ──────────────────────────────────────────────────────────

const HEART = 'M12 21 C5 15.5 1 11.5 1 6.8 C1 3.6 3.6 1 6.8 1 C9 1 11 2.2 12 4 C13 2.2 15 1 17.2 1 C20.4 1 23 3.6 23 6.8 C23 11.5 19 15.5 12 21 Z'
const HEART_L = 'M12 21 C5 15.5 1 11.5 1 6.8 C1 3.6 3.6 1 6.8 1 C9 1 11 2.2 12 4 L10.6 8 L13 11.5 L11 15 Z'
const HEART_R = 'M12 4 C13 2.2 15 1 17.2 1 C20.4 1 23 3.6 23 6.8 C23 11.5 19 15.5 12 21 L11 15 L13 11.5 L10.6 8 Z'

/** Lives as hearts. A heart that is lost breaks in two and falls away. */
export function Hearts({ lives, total }) {
  return (
    <span className="rain-hearts" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} className={`rain-heart${i < lives ? ' is-on' : ' is-lost'}`} viewBox="-2 -2 28 26" focusable="false">
          <path className="rain-heart-empty" d={HEART} />
          <path className="rain-heart-l" d={HEART_L} />
          <path className="rain-heart-r" d={HEART_R} />
        </svg>
      ))}
    </span>
  )
}

/** The streak flame. */
export function Flame() {
  return (
    <svg className="rain-flame" viewBox="0 0 24 28" aria-hidden="true" focusable="false">
      <path className="rain-flame-out" d="M12 1 C13.5 6.5 20 9.5 20 17 A8 8 0 0 1 4 17 C4 12.5 7 10.5 7.5 6.5 C9.5 8.5 10 10.5 10.5 12 C12.5 9 11 4.5 12 1 Z" />
      <path className="rain-flame-in" d="M12 12 C13 15 16 16 16 19.5 A4 4 0 0 1 8 19.5 C8 17.5 9.5 16.5 10 15 C11 16 11.2 16.8 11.4 17.4 C12.4 15.8 11.6 13.6 12 12 Z" />
    </svg>
  )
}

export function PauseIcon({ paused }) {
  return paused
    ? <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5 L19 12 L8 19 Z" /></svg>
    : <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
}

export function SoundIcon({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="rain-sound-icon">
      <path className="rain-speaker" d="M4 9 H8 L13 5 V19 L8 15 H4 Z" />
      {muted
        ? <path className="rain-sound-line" d="M16.5 9.5 L21 14 M21 9.5 L16.5 14" />
        : <path className="rain-sound-line" d="M16 8.5 C17.6 10.2 17.6 13.8 16 15.5 M18.6 6 C21.6 9.2 21.6 14.8 18.6 18" />}
    </svg>
  )
}

/** The Options button: a plain gear (the site has no icon set to borrow). */
export function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="rain-gear-icon">
      <path
        fillRule="evenodd"
        d="M10.3 2h3.4l.5 2.6a7.6 7.6 0 0 1 1.9 1.1l2.5-.9 1.7 2.9-2 1.7a7.7 7.7 0 0 1 0 2.2l2 1.7-1.7 2.9-2.5-.9a7.6 7.6 0 0 1-1.9 1.1l-.5 2.6h-3.4l-.5-2.6a7.6 7.6 0 0 1-1.9-1.1l-2.5.9-1.7-2.9 2-1.7a7.7 7.7 0 0 1 0-2.2l-2-1.7 1.7-2.9 2.5.9a7.6 7.6 0 0 1 1.9-1.1zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"
      />
    </svg>
  )
}

/** The Words control's "opens a menu" mark. */
export function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="rain-chevron">
      <path d="M7 10 L12 15 L17 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
