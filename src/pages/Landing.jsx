import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BASE, BOOK_PDF, BOOK_EPUB, MESSAGE_MS, PREVIEW_MS, lead, cells, StoryCell } from '../lib/hero-cells.jsx'
import LogoMark from '../components/LogoMark'
import '../styles/v11-landing.css'

// Founding Supporter — Buy Me a Coffee. $35+ locks lifetime access (first 100).
const BMC_URL = 'https://buymeacoffee.com/leafakatonga'

const moduleCards = [
  { num: '01', title: 'Lessons',                  action: 'Start',    to: '/lessons' },
  { num: '02', title: 'Exercises',                action: 'Practice', to: '/drills' },
  { num: '03', title: 'Quizzes',                  action: 'Test',     to: '/quizzes' },
  { num: '04', title: <>Vocab<br />Flip Cards</>, action: 'Flip',     to: '/cards' },
  { num: '05', title: <>Reference<br />Charts</>, action: 'Lookup',   to: '/charts' },
]

// The hero is the Grammar+Dive treatment chosen in /hero-lab: a fixed book-cover
// anchor (the free offer, always in view) beside a stage that auto-cycles the
// five features. Each cell plays a real grammar micro-animation (the teaching
// beat) and then DIVES through it into the matching live-app preview clip — so
// every beat shows the point, then lands you in the real site doing it.
function HomeHeroAnchor() {
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
      <a href={BMC_URL} target="_blank" rel="noopener noreferrer" className="hero-found-note hl-found-note">
        <strong>Founding Supporter</strong>: give $35+ and lock in lifetime access (first 100) <span className="arrow">→</span>
      </a>
      {/* mobile-only: cue the first-time visitor down to the preview */}
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
  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setIdx(p => (p + 1) % cells.length), MESSAGE_MS + PREVIEW_MS)
    return () => clearTimeout(t)
  }, [idx, reduceMotion])

  return (
    <div className="v11-landing">

      {/* ========== TOP BLACK BAND (reversed brand lockup) ========== */}
      <div className="top-band reveal d1">
        <div className="top-brand">
          <LogoMark className="logo-mark" />
          <span className="wordmark">Lea Faka-Tonga</span>
        </div>
        <div className="top-sub">Learn Tongan · free and open</div>
      </div>

      {/* ========== HERO — Grammar+Dive (from /hero-lab): book-cover anchor +
          a stage that teaches each feature, then dives into the real app. ========== */}
      <div className="hl-a home-hero">
        <div className="hl-a-anchor"><HomeHeroAnchor /></div>
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
      </div>

      {/* ========== BOTTOM WHITE BAND ========== */}
      <div className="bottom-band reveal d4">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> The Community Edition</div>
          <div className="bottom-spec">
            52 lessons · beginner to advanced · checked by fluent speakers
          </div>
        </div>
        <Link to="/support" className="free-note" style={{ textDecoration: 'none' }}>Free and open · name your price to support →</Link>
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
