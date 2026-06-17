import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import previewChapter from '../assets/previews/chapter.png'
import previewContents from '../assets/previews/contents.png'
import previewQuiz from '../assets/previews/quiz.png'
import previewCards from '../assets/previews/cards.png'
import previewBuilder from '../assets/previews/builder-active.png'

const INTERVAL = 4500

const slides = [
  {
    eyebrow: 'For the Tongan who can’t speak Tongan',
    headline: <>The language<br />of your <span className="accent">family.</span></>,
    sub: 'A complete Tongan course, free and open, from your very first sentence to real conversations. Every chapter, every drill, the whole book: free. Support it if you can.',
    provenance: 'A complete course, free and open · the book is free too',
  },
  {
    eyebrow: 'All 52 chapters, beginning to end',
    headline: <>52 chapters.<br />The whole <span className="accent">grammar</span>,<br />start to finish.</>,
    sub: 'From your first “hello” to holding a real conversation, one chapter at a time, checked by fluent speakers along the way.',
    provenance: 'Beginner to Advanced · 52 Chapters',
  },
  {
    eyebrow: 'Every answer teaches the rule',
    headline: <>Know <span className="accent">why</span>,<br />not just<br />right or wrong.</>,
    sub: 'Every wrong answer explains the rule it broke. Every right answer shows why the others weren’t. No guessing, no streaks to protect.',
    provenance: 'Every answer explained · 520 questions',
  },
  {
    eyebrow: 'Better every month',
    headline: <>See something off?<br /><span className="accent">Tell us.</span></>,
    sub: 'This course gets more accurate the more it’s read. Spot a typo or a better example? Flag it. The fluent speakers who check chapters are credited on the Roll of Keepers.',
    provenance: 'Checked by fluent speakers · open to all',
  },
  {
    eyebrow: 'Reads like a book',
    headline: <>No streaks.<br />No notifications.<br /><span className="accent">Just the book.</span></>,
    sub: 'The practice lives right inside each chapter, not off in a separate app you have to switch to. And every accent mark in Tongan, the macrons and the ʻokina, is shown correctly, so you learn to read and write it the right way.',
    provenance: 'Reads like prose · not a game',
  },
]

const moduleCards = [
  { num: '01', title: 'Chapters',                       desc: 'Work through all 52 chapters, in order.',       action: 'Start',    to: '/chapters' },
  { num: '02', title: 'Exercises',                      desc: "Practice what you've learned in each chapter.", action: 'Practice', to: '/drills' },
  { num: '03', title: 'Quizzes',                        desc: 'Check what you know, and see why every answer is right or wrong.', action: 'Test',  to: '/quizzes' },
  { num: '04', title: <>Vocab<br />Flip Cards</>,       desc: 'Build your vocabulary, 649 cards to flip through.', action: 'Flip',  to: '/cards' },
  { num: '05', title: <>Reference<br />Charts</>,       desc: 'Quick grammar lookup whenever you need it.',    action: 'Lookup',   to: '/charts' },
]

// Real screenshots of the live app, shown in the rotating hero preview window.
// Captured from the running site (scripts/.. capture, one-off) into assets.
const previews = [
  { img: previewChapter,  caption: 'Read a chapter',          alt: 'A chapter on the live site' },
  { img: previewContents, caption: 'Browse all 52 chapters',  alt: 'The chapter contents' },
  { img: previewQuiz,     caption: 'Quiz · every answer explained', alt: 'A quiz question with the rule explained' },
  { img: previewCards,    caption: '649 vocab flip cards',    alt: 'The vocabulary flip cards' },
  { img: previewBuilder,  caption: 'Build a sentence',        alt: 'The sentence builder' },
]

export default function Landing() {
  const [current, setCurrent] = useState(0)
  const [entering, setEntering] = useState(false)
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
        <div className="top-sub">Learn Tongan, free · 52 chapters · beginner to advanced · name your price to support</div>
      </div>

      {/* ========== HERO CANVAS ========== */}
      <div className="hero-canvas">
        {/* Diagonal wedge geometry removed 2026-06-17 — hero is now one solid colour
            (legibility: small text was clashing across the multi-colour wedges). */}

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
                  <span className="slide-provenance">{s.provenance}</span>
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
          </div>

          {/* RIGHT: preview mockups */}
          <div className="hero-overlay-right">
            <div className="preview-window">
              {previews.map((p, i) => (
                <div key={p.alt} className={`preview-frame${current === i ? ' active' : ''}`}>
                  <img className="preview-shot" src={p.img} alt={p.alt} />
                  <div className="preview-caption">{p.caption}</div>
                </div>
              ))}
            </div>

            <div className="preview-cta">
              <Link to="/chapters/1" className="cta-btn">Start Chapter 01 <span className="arrow">→</span></Link>
              <Link to="/chapters" className="cta-secondary">See all 52 chapters</Link>
              <Link to="/support" className="cta-secondary">Support this work →</Link>
              <div className="cta-meta"><strong>The whole site is free · name your price to support</strong></div>
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
        <div className="cefr-badge">
          <div className="level">Full Arc</div>
          <div className="scope">Beginner → Advanced</div>
        </div>
        <Link to="/support" className="free-note" style={{ textDecoration: 'none' }}>Free and open · name your price to support →</Link>
      </div>

      {/* ========== § 01 · Five Ways In — light panel ========== */}
      <div className="panel-section">
        <div className="panel-frame">
          <div className="panel-section-bar" style={{ marginTop: 0 }}>
            <span>§ 01 · Five Ways In</span>
            <span className="right">Choose where to begin</span>
          </div>

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
                  <span className="panel-card-num">{c.num}</span>
                  <div className="panel-card-center">
                    <div className="panel-card-title">{c.title}</div>
                    <p className="panel-card-desc">{c.desc}</p>
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
            <div><strong>Lea Faka-Tonga</strong> · 2026 · free and open, and still growing with help from its readers</div>
          </div>
        </div>
      </div>

    </div>
  )
}
