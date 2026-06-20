import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'

// The whole book is free to download (real files in public/downloads/).
const BOOK_PDF = `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.pdf`

// Founding Supporter — Buy Me a Coffee. $35+ locks lifetime access (first 100).
const BMC_URL = 'https://buymeacoffee.com/leafakatonga'

// One claim per preview, SAME ORDER as `previews` below, so the left-hand message
// always describes whatever the preview window is showing (driven by activePreview).
const slides = [
  { // 0 · book — the whole course, free
    eyebrow: 'The whole course, free and open',
    headline: <>The language<br />of your <span className="accent">family</span>,<br />all of it.</>,
    sub: 'All 52 chapters, beginner to advanced, plus every drill, quiz and flashcard. The complete book, free to download and keep.',
  },
  { // 1 · read — real chapters that explain
    eyebrow: 'Real chapters, not word lists',
    headline: <>Every rule,<br /><span className="accent">explained</span>.</>,
    sub: 'Real chapters that teach the grammar step by step, with worked examples and clear tables you can actually follow.',
  },
  { // 2 · sentence lab — swap a word, watch the meaning change (the differentiator)
    eyebrow: 'Your own grammar lab',
    headline: <>Swap a word,<br />watch the meaning <span className="accent">change</span>.</>,
    sub: 'Build a real Tongan sentence, change one word, and the English re-translates live. Try any combination and see exactly how the grammar works.',
  },
  { // 3 · drills — every wrong answer teaches
    eyebrow: 'Practice that teaches',
    headline: <>Every wrong answer<br />shows you <span className="accent">why</span>.</>,
    sub: 'Miss a drill and it explains the rule you broke, right then. The correction a good teacher gives, on every question.',
  },
  { // 4 · quiz — know the why
    eyebrow: 'Quizzes that teach',
    headline: <><span className="accent">Understand</span> it,<br />don’t just guess.</>,
    sub: 'Every one of 520 quiz questions comes with the reason behind the answer, so each test leaves you knowing more.',
  },
  { // 5 · vocab — any list into flashcards (Tongan or English first folds in the old toggle)
    eyebrow: 'Vocabulary, your way',
    headline: <>Any word list,<br />instant <span className="accent">flashcards</span>.</>,
    sub: 'Every chapter’s new words become a deck you can flip in a tap, Tongan or English first. 649 cards, with every macron and ʻokina shown right.',
  },
]

const moduleCards = [
  { num: '01', title: 'Chapters',                 action: 'Start',    to: '/chapters' },
  { num: '02', title: 'Exercises',                action: 'Practice', to: '/drills' },
  { num: '03', title: 'Quizzes',                  action: 'Test',     to: '/quizzes' },
  { num: '04', title: <>Vocab<br />Flip Cards</>, action: 'Flip',     to: '/cards' },
  { num: '05', title: <>Reference<br />Charts</>, action: 'Lookup',   to: '/charts' },
]

// The hero's cycling preview: starts on the book opening, then the real-app
// previews. Each is a short silent loop in public/ (<file>.mp4 + <file>-poster.jpg).
// All clips are landscape 16:10 and fill the window; item 0 is the book that
// dives into the live site. SAME ORDER as slides[] above (1:1). The Sentence Lab
// (the differentiator) sits 3rd; the old Reveal + Toggle slots were folded in
// (Reveal overlapped Drills; Toggle is part of the Vocab cards).
const previews = [
  { id: 'book',          file: 'home-hero',     dwell: 5000, title: 'The whole book',          sub: 'A complete Tongan course, yours and free.' },
  { id: 'feat-read',     file: 'feat-read',     dwell: 5400, title: 'Read the whole book',      sub: 'Every chapter, with real examples and tables.' },
  { id: 'feat-sentence', file: 'feat-sentence', dwell: 5400, title: 'Build your own sentences', sub: 'Swap a word and the English changes live.' },
  { id: 'feat-drills',   file: 'feat-drills',   dwell: 5400, title: 'Practice as you go',       sub: 'Every answer teaches the rule, right or wrong.' },
  { id: 'feat-quiz',     file: 'feat-quiz',     dwell: 5000, title: 'Test yourself',            sub: 'Quizzes that explain the why, not just the what.' },
  { id: 'feat-vocab',    file: 'feat-vocab',    dwell: 5600, title: 'Vocab, your way',          sub: 'Flip any list into cards, Tongan or English first.' },
]

export default function Landing() {
  const [entering, setEntering] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [activePreview, setActivePreview] = useState(0)
  const previewRefs = useRef([])

  // Scroll reveal observer
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

  // Reduced-motion: honor the OS setting (hero + feature clips show their poster, no autoplay).
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Hero preview cycler: auto-advance (per-item dwell; re-armed on each change so
  // manual dot-clicks reset the timer). Paused under reduced-motion.
  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setActivePreview(p => (p + 1) % previews.length), previews[activePreview]?.dwell || 5400)
    return () => clearTimeout(t)
  }, [activePreview, reduceMotion])

  // The left-hand claim is tied to the active preview (slides[] is 1:1 with
  // previews[]): wipe the matching message in whenever the preview changes.
  useEffect(() => {
    setEntering(true)
    const t = setTimeout(() => setEntering(false), 600)
    return () => clearTimeout(t)
  }, [activePreview])

  // Play only the active preview (from its start); pause the rest.
  useEffect(() => {
    previewRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === activePreview && !reduceMotion) { try { v.currentTime = 0 } catch { /* noop */ } ; v.play().catch(() => {}) }
      else { v.pause() }
    })
  }, [activePreview, reduceMotion])

  return (
    <div className="v11-landing">

      {/* ========== TOP WHITE BAND ========== */}
      <div className="top-band reveal d1">
        <div className="top-brand">
          <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="0,0 50,0 0,50" />
            <polygon points="100,0 50,0 100,50" />
            <polygon points="100,100 50,100 100,50" />
            <polygon points="0,100 50,100 0,50" />
            <polygon points="25,25 50,25 25,50" />
            <polygon points="75,25 50,25 75,50" />
            <polygon points="75,75 50,75 75,50" />
            <polygon points="25,75 50,75 25,50" />
            <polygon points="37.5,37.5 50,37.5 37.5,50" />
            <polygon points="62.5,37.5 50,37.5 62.5,50" />
            <polygon points="62.5,62.5 50,62.5 62.5,50" />
            <polygon points="37.5,62.5 50,62.5 37.5,50" />
          </svg>
          <span className="wordmark">Lea Faka-Tonga</span>
        </div>
        <div className="top-sub">Learn Tongan · free and open</div>
      </div>

      {/* ========== HERO CANVAS — claim (left) + big looping preview (right) ==========
          The "Download the book, free" panel was replaced by the larger preview
          (owner, 2026-06-20); its key CTAs live compactly under the claim. */}
      <div className="hero-canvas hero-canvas-preview">
        <div className="hero-overlay">

          {/* LEFT: the claim, tied to the active preview (the cycler's dots are the
              single control; this message changes with the window on the right) */}
          <div className="hero-overlay-left">
            <div className="hero-slides">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className={`hero-slide${i === activePreview ? ' active' : ''}${i === activePreview && entering ? ' entering' : ''}`}
                >
                  <span className="slide-eyebrow">{s.eyebrow}</span>
                  <h1 className="slide-headline">{s.headline}</h1>
                  <p className="slide-sub">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="hero-cta-row">
              <a href={BOOK_PDF} download className="cta-btn">Download the book, free <span className="arrow">→</span></a>
              <Link to="/chapters/1" className="cta-secondary">Start Chapter 01</Link>
            </div>
            <a href={BMC_URL} target="_blank" rel="noopener noreferrer" className="hero-found-note">
              <strong>Founding Supporter</strong> — give $35+ and lock in lifetime access (first 100) <span className="arrow">→</span>
            </a>
          </div>

          {/* RIGHT: one big landscape window — starts on the book cover, then
              auto-cycles the real-app previews (caption + dots below). */}
          <div className="hero-overlay-right hero-preview-col">
            <div className="hero-cycler">
              <div className="hero-cycler-stage">
                <span className="hero-cycler-stripe" aria-hidden="true" />
                <div className="hero-cycler-screens">
                  {previews.map((p, i) => (
                    <video
                      key={p.id}
                      ref={(el) => { previewRefs.current[i] = el }}
                      className={`hero-cycler-video${i === activePreview ? ' active' : ''}`}
                      style={{ objectFit: p.fit || 'cover' }}
                      muted loop playsInline
                      preload={i === 0 ? 'auto' : 'none'}
                      poster={`${import.meta.env.BASE_URL}${p.file}-poster.jpg`}
                      aria-hidden={i !== activePreview}
                    >
                      <source src={`${import.meta.env.BASE_URL}${p.file}.mp4`} type="video/mp4" />
                    </video>
                  ))}
                </div>
              </div>
              <div className="hero-cycler-meta">
                <span className="hero-cycler-title">{previews[activePreview].title}</span>
                <span className="hero-cycler-sub">{previews[activePreview].sub}</span>
                <div className="hero-cycler-dots">
                  {previews.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`hero-cycler-dot${i === activePreview ? ' active' : ''}`}
                      onClick={() => setActivePreview(i)}
                      aria-label={p.title}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== BOTTOM WHITE BAND ========== */}
      <div className="bottom-band reveal d4">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> The Community Edition</div>
          <div className="bottom-spec">
            52 chapters · beginner to advanced · checked by fluent speakers
          </div>
        </div>
        <Link to="/support" className="free-note" style={{ textDecoration: 'none' }}>Free and open · name your price to support →</Link>
      </div>

      {/* The "See it in action" strip was replaced by the auto-cycling preview in
          the hero (owner, 2026-06-20): all four previews show in one spot, no scroll. */}

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
