import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BOOK_PDF, BOOK_EPUB, PREVIEW_MS, PREVIEW_RATE, messageMsFor, lead, cells, StoryCell } from '../lib/hero-cells.jsx'
import LogoMark from '../components/LogoMark'
import HomeTour from '../components/HomeTour'
import TLWRibbon from '../components/TLWRibbon'   // Tongan Language Week ribbon — PROTOTYPE, remove with its two lines below
import { NAV_LINKS } from '../lib/nav-links'
import { supportUrl, readPartner } from '../lib/partner-link'
import '../styles/v11-landing.css'
import '../styles/home-hero.css'

// Buy Me a Coffee: $35+ keeps the site free for you, for life, when it goes members-only.
// The URL is resolved per render by src/lib/partner-link.js, so a visitor who
// arrived through a partner link lands on that partner's item instead of the
// ordinary page. Nothing about the offer or the copy changes.

// The five module tiles that used to sit under the hero were replaced by
// <HomeTour /> on 2026-08-11 (DECISIONS, option E). Every doorway they carried
// still exists: Lessons, Drills and Cards are the tour stages' own links,
// Quizzes is the Test section, and Charts is in the closing strip.

// The homepage hero is the "D2 / one action" layout (chosen 2026-06-25):
// Free Preview framing, one CTA (Start Lesson 1), the auto-cycling feature stage
// beneath it, with the book download + support ask in a quiet foot. Rendered inline.

export default function Landing() {
  const BMC_URL = supportUrl()
  // A visitor who arrived through a partner link is sent to that partner's fixed
  // $35 item, where there is no price to name, so the label has to match the
  // destination. Everyone else keeps the ruled copy (DECISIONS 2026-06-25).
  const SUPPORT_LABEL = readPartner() ? 'Support the work, $35' : 'Name your price to support'
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

      {/* ========== TONGAN LANGUAGE WEEK RIBBON (PROTOTYPE) ==========
          Delete this line + the TLWRibbon import above to remove it entirely;
          ?tlw=off hides it for a look. See components/TLWRibbon.jsx. */}
      <TLWRibbon />

      {/* ========== TOP WHITE BAND (centered brand lockup) ========== */}
      <div className="top-band reveal d1">
        <div className="top-brand">
          <LogoMark className="logo-mark" />
          <span className="wordmark">Lea Faka-Tonga</span>
        </div>
        <div className="top-sub">Learn Tongan · the book is free</div>
        {/* The same five section links the sub-page header carries (SSR-01) —
            the homepage was the one page with no nav at all (2026-08-12).
            Identical .header-nav voice; .home-nav only re-centres it here. */}
        <nav className="header-nav home-nav" aria-label="Site sections">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </nav>
      </div>

      {/* ========== HERO: Free Preview, one action (Start Lesson 1), stage beneath ========== */}
      <div className="hl-a home-hero hv-single">
        <div className="hv-single-head">
          <span className="hl-eyebrow">{lead.eyebrow}</span>
          <h1 className="hl-headline">{lead.headline}</h1>
          <p className="hl-sub">{lead.sub}</p>
          <Link to="/lessons/1" state={{ fromStart: true }} className="hv-start">Start Lesson 1, free</Link>
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
            The book's yours, free. If it's worth something to you, <strong>support the work</strong>: $35+ keeps the site free for you, for life
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
        <a href={BMC_URL} target="_blank" rel="noopener noreferrer" className="free-note" style={{ textDecoration: 'none' }}>{SUPPORT_LABEL}</a>
      </div>

      {/* ========== THE TOUR ==========
          Replaces the old five word-tiles (DECISIONS 2026-08-11, option E):
          six sections that show the product working, each one a doorway into
          the surface it shows. The tile grid is gone, not its navigation. */}
      <HomeTour />

      {/* No arrow on the colophon link: Andrew, 2026-08-11 taste pass. */}
      <div className="panel-colophon home-colophon">
        <div><strong>Lea Faka-Tonga</strong> · 2026</div>
        <Link to="/report" style={{ color: 'var(--red)', textDecoration: 'none' }}>Spot a mistake? Tell us</Link>
      </div>

    </div>
  )
}
