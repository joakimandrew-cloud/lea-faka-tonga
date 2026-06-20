import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'

const INTERVAL = 4500

// The whole book is free to download (real files in public/downloads/).
const BOOK_PDF = `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.pdf`

// Founding Supporter — Buy Me a Coffee. $35+ locks lifetime access (first 100).
const BMC_URL = 'https://buymeacoffee.com/leafakatonga'

const slides = [
  {
    eyebrow: 'For the Tongan who can’t speak Tongan',
    headline: <>The language<br />of your <span className="accent">family.</span></>,
    sub: 'A complete Tongan course, free and open, from your very first sentence to real conversations. Every chapter, every drill, the whole book: free. Support it if you can.',
  },
  {
    eyebrow: 'All 52 chapters, beginning to end',
    headline: <>52 chapters.<br />The whole <span className="accent">grammar</span>,<br />start to finish.</>,
    sub: 'From your first “hello” to holding a real conversation, one chapter at a time, checked by fluent speakers along the way.',
  },
  {
    eyebrow: 'Every answer teaches the rule',
    headline: <>Know <span className="accent">why</span>,<br />not just<br />right or wrong.</>,
    sub: 'Every wrong answer explains the rule it broke. Every right answer shows why the others weren’t. No guessing, no streaks to protect.',
  },
  {
    eyebrow: 'Better every month',
    headline: <>See something off?<br /><span className="accent">Tell us.</span></>,
    sub: 'This course gets more accurate the more it’s read. Spot a typo or a better example? Flag it. The fluent speakers who check chapters are credited on the Roll of Keepers.',
  },
  {
    eyebrow: 'Reads like a book',
    headline: <>No streaks.<br />No notifications.<br /><span className="accent">Just the book.</span></>,
    sub: 'The practice lives right inside each chapter, not off in a separate app you have to switch to. And every accent mark in Tongan, the macrons and the ʻokina, is shown correctly, so you learn to read and write it the right way.',
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
// opens on its spine hinge (cover always fully in frame) then closes and loops.
const previews = [
  { id: 'book',        file: 'home-hero',                  dwell: 5000, title: 'The whole book',              sub: 'A complete Tongan course, yours and free.' },
  { id: 'feat-read',   file: 'feat-read',                  dwell: 5400, title: 'Read the whole book',          sub: 'Every chapter, with real examples and tables.' },
  { id: 'feat-drills', file: 'feat-drills',                dwell: 5400, title: 'Practice as you go',           sub: 'Every answer teaches the rule, right or wrong.' },
  { id: 'feat-quiz',   file: 'feat-quiz',                  dwell: 5000, title: 'Test yourself',                sub: 'Quizzes that explain the why, not just the what.' },
  { id: 'feat-reveal', file: 'feat-reveal',                dwell: 5000, title: 'Practice inside each chapter',  sub: 'Tap to reveal the answer as you read.' },
  { id: 'feat-vocab',  file: 'feat-vocab',                 dwell: 5600, title: 'Vocab, your way',              sub: 'Flip any word list into flashcards.' },
  { id: 'feat-toggle', file: 'feat-toggle',                dwell: 5000, title: 'Your language first',          sub: 'Show Tongan or English on top, your choice.' },
]

export default function Landing() {
  const [current, setCurrent] = useState(0)
  const [entering, setEntering] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [activePreview, setActivePreview] = useState(0)
  const previewRefs = useRef([])
  const timerRef = useRef(null)

  const goToSlide = useCallback((idx) => {
    setCurrent(idx)
    setEntering(true)
    setTimeout(() => setEntering(false), 600)
  }, [])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
      setEntering(true)
      setTimeout(() => setEntering(false), 600)
    }, INTERVAL)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [resetTimer])

  const handleDotClick = (idx) => {
    if (idx === current) return
    goToSlide(idx)
    resetTimer()
  }

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

          {/* LEFT: rotating claim text */}
          <div className="hero-overlay-left">
            <div className="hero-slides">
              {slides.map((s, i) => (
                <div
                  key={i}
                  className={`hero-slide${i === current ? ' active' : ''}${i === current && entering ? ' entering' : ''}`}
                >
                  <span className="slide-eyebrow">{s.eyebrow}</span>
                  <h1 className="slide-headline">{s.headline}</h1>
                  <p className="slide-sub">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="slide-nav">
              {slides.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot${i === current ? ' active' : ''}`}
                  onClick={() => handleDotClick(i)}
                  aria-label={`Slide ${i + 1}`}
                />
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
