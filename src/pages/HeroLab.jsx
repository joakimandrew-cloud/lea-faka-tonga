import { useState, useEffect } from 'react'
import { BASE, BOOK_PDF, BOOK_EPUB, MESSAGE_MS, PREVIEW_MS, lead, cells, StoryCell } from '../lib/hero-cells.jsx'

/* =========================================================================
   HeroLab — the hidden /hero-lab tuning surface for the homepage hero. It
   reuses the SAME story-cell engine as the live homepage (../lib/hero-cells)
   and adds a topbar STYLE SELECTOR so the owner can watch the treatments live
   and pick one. The homepage ships Grammar+Dive; this lab keeps every style
   around for future tuning. Self-contained otherwise.
   ========================================================================= */

// The animation treatments the owner picks between (selector in the topbar).
const STYLES = [
  { id: 'wipe', label: 'Wipe', note: 'The baseline: a small bespoke animation per cell that wipes across into the live app.' },
  { id: 'kinetic', label: 'Kinetic', note: 'Expressive animated typography: the headline itself is the animation, then it softly dissolves into the app.' },
  { id: 'grammar', label: 'Grammar', note: 'Real grammar micro-animations from the video work (swap a tense marker, answer a quiz, flip a card), each matched to the real-app preview it leads into.' },
  { id: 'dive', label: 'Dive', note: 'The headline rushes toward you and you fly through it as the app screen zooms forward, a dive into the website.' },
  { id: 'grammardive', label: 'Grammar+Dive', note: 'Shipped on the homepage: the grammar concept plays as a quick teaching beat, then you dive THROUGH it into the real app screen where you actually do it.' },
  { id: 'appfirst', label: 'App-first', note: 'The real app leads, playing full-bleed; the message floats in over it as a caption.' },
]
const STYLE_IDS = STYLES.map(s => s.id)

/* ---- the book anchor: still standing cover + Download PDF / EPUB ------- */

function BookAnchor() {
  return (
    <div className="hl-anchor">
      <span className="hl-eyebrow">{lead.eyebrow}</span>
      <h1 className="hl-headline">{lead.headline}</h1>
      <p className="hl-sub">{lead.sub}</p>
      <img className="hl-anchor-cover" src={`${BASE}cover-standing.png`} alt="Lea Faka-Tonga, the book" />
      <div className="hl-downloads">
        <a href={BOOK_PDF} download className="hl-cta">Download PDF <span aria-hidden="true">→</span></a>
        <a href={BOOK_EPUB} download className="hl-cta-secondary">Download EPUB <span aria-hidden="true">→</span></a>
      </div>
      {/* mobile-only: cue the first-time visitor to scroll down to the preview */}
      <button
        type="button"
        className="hl-scrollcue"
        onClick={() => document.querySelector('.hl-a-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
      >
        <span className="hl-scrollcue-label">See it in action</span>
        <span className="hl-scrollcue-arrow" aria-hidden="true">↓</span>
      </button>
    </div>
  )
}

/* ---- Variant A — One Stage, with a live STYLE selector ----------------- */

function initialStyle() {
  if (typeof window === 'undefined') return 'grammardive'
  const s = new URLSearchParams(window.location.search).get('s')
  return STYLE_IDS.includes(s) ? s : 'grammardive'
}

export default function HeroLab() {
  const [idx, setIdx] = useState(0)
  const [style, setStyle] = useState(initialStyle)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [portrait, setPortrait] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const m = window.matchMedia('(max-width: 600px)')
    const on = () => setPortrait(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  // keep the style shareable in the URL (?s=…), like the old ?v= toggle.
  function chooseStyle(id) {
    setStyle(id)
    const u = new URL(window.location.href)
    u.searchParams.set('s', id)
    window.history.replaceState(null, '', u)
  }

  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setIdx(p => (p + 1) % cells.length), MESSAGE_MS + PREVIEW_MS)
    return () => clearTimeout(t)
  }, [idx, reduceMotion, style])

  const activeStyle = STYLES.find(s => s.id === style)

  return (
    <div className="hero-lab">
      <div className="hl-topbar">
        <span className="hl-topbar-brand">Hero Lab <span className="dot">·</span> Styles</span>
        <div className="hl-styles" role="group" aria-label="Animation style">
          {STYLES.map(s => (
            <button
              key={s.id}
              type="button"
              className={`hl-style-chip${s.id === style ? ' active' : ''}`}
              onClick={() => chooseStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="hl-note">{activeStyle?.note}</p>
      </div>

      <div className="hl-a">
        <div className="hl-a-anchor"><BookAnchor /></div>
        <div className="hl-a-stage">
          <StoryCell key={`${style}-${cells[idx].id}`} cell={cells[idx]} style={style} active reduceMotion={reduceMotion} portrait={portrait} />
          <div className="hl-dots">
            {cells.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`hl-dot${i === idx ? ' active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={c.previewTitle}
              />
            ))}
          </div>
          <div className="hl-stage-cap"><span className="hl-stage-cap-title">{cells[idx].previewTitle}</span></div>
        </div>
      </div>
    </div>
  )
}
