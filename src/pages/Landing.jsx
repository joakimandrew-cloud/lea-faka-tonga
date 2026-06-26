import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BOOK_PDF, BOOK_EPUB, PREVIEW_MS, PREVIEW_RATE, messageMsFor, lead, cells, StoryCell } from '../lib/hero-cells.jsx'
import LogoMark from '../components/LogoMark'
import '../styles/v11-landing.css'
import '../styles/home-hero.css'

// Buy Me a Coffee: $35+ keeps the site free for you, for life, when it goes members-only.
const BMC_URL = 'https://buymeacoffee.com/leafakatonga'

const moduleCards = [
  { num: '01', title: 'Lessons',                  action: 'Start',    to: '/lessons' },
  { num: '02', title: 'Exercises',                action: 'Practice', to: '/drills' },
  { num: '03', title: 'Quizzes',                  action: 'Test',     to: '/quizzes' },
  { num: '04', title: <>Vocab<br />Flip Cards</>, action: 'Flip',     to: '/cards' },
  { num: '05', title: <>Reference<br />Charts</>, action: 'Lookup',   to: '/charts' },
]

// The homepage hero is the "D2 / one action" layout (chosen 2026-06-25):
// Free Preview framing, one CTA (Start Lesson 1), the auto-cycling feature stage
// beneath it, with the book download + support ask in a quiet foot. Rendered inline.

export default function Landing() {
  const [idx, setIdx] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [portrait, setPortrait] = useState(false)

  // Scroll reveal observer (the Five Ways In cards)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          observer.unobserve(e.target)
        }
      }),
      { threshold: 0.15 }
    )
    document.querySelectorAll('.v11-landing .scroll-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Honor the OS reduced-motion setting; track the phone breakpoint (portrait preview).
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const m = window.matchMedia('(max-width: 600px)')
    const on = () => setPortrait(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])

  // Auto-advance the stage (one full message→dive→preview beat per cell).
  // Per-cell timing: the quiz cell runs a shorter intro + longer preview (2-question clip).
  useEffect(() => {
    if (reduceMotion) return
    const c = cells[idx]
    // preview plays at half speed (PREVIEW_RATE), so it needs ~2× its natural window to finish
    const previewLen = portrait ? (c.previewMsMobile ?? c.previewMs ?? PREVIEW_MS) : (c.previewMs ?? PREVIEW_MS)  // per-viewport clip length
    const previewWindow = c.holdMs ?? previewLen / (c.rate ?? PREVIEW_RATE)  // per-cell hold/rate override (owner-tuned via /scrub)
    const t = setTimeout(() => setIdx(p => (p + 1) % cells.length), messageMsFor(c, portrait) + previewWindow)
    return () => clearTimeout(t)
  }, [idx, reduceMotion, portrait])

  return (
    <div className="v11-landing">

      {/* ========== TOP WHITE BAND (centered brand lockup) ========== */}
      <div className="top-band reveal d1">
        <div className="top-brand">
          <LogoMark className="logo-mark" />
          <span className="wordmark">Lea Faka-Tonga</span>
        </div>
        <div className="top-sub">Learn Tongan · the book is free</div>
      </div>

      {/* ========== HERO: Free Preview, one action (Start Lesson 1), stage beneath ========== */}
      <div className="hl-a home-hero hv-single">
        <div className="hv-single-head">
          <span className="hl-eyebrow">{lead.eyebrow}</span>
          <h1 className="hl-headline">{lead.headline}</h1>
          <p className="hl-sub">{lead.sub}</p>
          <Link to="/lessons/1" state={{ fromStart: true }} className="hv-start">Start Lesson 1, free <span aria-hidden="true">→</span></Link>
          <p className="hv-access">Free while we build it, members-only later. The book stays free forever.</p>
        </div>
        <div className="hl-a-stage">
          <StoryCell key={cells[idx].id} cell={cells[idx]} style="grammardive" active reduceMotion={reduceMotion} portrait={portrait} />
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
        <div className="hv-single-foot">
          <div className="hl-downloads hv-dl-small">
            <a href={BOOK_PDF} download className="hl-cta-secondary">Prefer the book? Download free (PDF)</a>
            <a href={BOOK_EPUB} download className="hl-cta-secondary">EPUB</a>
          </div>
          <a href={BMC_URL} target="_blank" rel="noopener noreferrer" className="hero-found-note hl-found-note">
            The book's yours, free. If it's worth something to you, <strong>support the work</strong>: $35+ keeps the site free for you, for life <span className="arrow">→</span>
          </a>
        </div>
      </div>

      {/* ========== BOTTOM WHITE BAND ========== */}
      <div className="bottom-band reveal d4">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> The Community Edition</div>
          <div className="bottom-spec">
            52 lessons · beginner to advanced · checked by fluent speakers
          </div>
        </div>
        <a href={BMC_URL} target="_blank" rel="noopener noreferrer" className="free-note" style={{ textDecoration: 'none' }}>Name your price to support →</a>
      </div>

      {/* ========== Horizontal red-stripe split: white band → grey box field ========== */}
      <div className="section-split-grey" aria-hidden="true" />

      {/* ========== § 01 · Five Ways In — light panel ========== */}
      <div className="panel-section panel-section-grey">
        <div className="panel-frame">
          <div className="panel-cards cards-5">
            {moduleCards.map((c, i) => (
              <Link
                key={c.num}
                to={c.to}
                className={`panel-card panel-card-c${i + 1} scroll-reveal`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <span className="panel-card-stripe" aria-hidden="true" />
                <div className="panel-card-body">
                  <div className="panel-card-center">
                    <div className="panel-card-title">{c.title}</div>
                  </div>
                </div>
                <div className="panel-card-foot">
                  <span className="panel-card-tag">{c.action}</span>
                  <span className="panel-card-arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="panel-colophon">
            <div><strong>Lea Faka-Tonga</strong> · 2026</div>
            <Link to="/report" style={{ color: 'var(--red)', textDecoration: 'none' }}>Spot a mistake? Tell us →</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
