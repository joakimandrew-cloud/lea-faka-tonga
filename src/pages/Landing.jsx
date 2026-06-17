import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'
import previewChapter from '../assets/previews/chapter.png'
import previewContents from '../assets/previews/contents.png'
import previewQuiz from '../assets/previews/quiz.png'
import previewCards from '../assets/previews/cards.png'
import previewBuilder from '../assets/previews/builder-active.png'

const INTERVAL = 7000

const slides = [
  {
    eyebrow: 'For the Tongan who can’t speak Tongan',
    headline: <>The language<br />of your <span className="accent">family.</span></>,
    sub: 'The first complete, modern way to learn Tongan, from your very first sentence to real conversations. The whole thing is free and open: the book, every chapter, every drill. Support it if you can.',
    provenance: 'The only complete Tongan course · The book is free',
  },
  {
    eyebrow: 'A complete arc, in progress',
    headline: <>52 chapters.<br />One <span className="accent">grammar</span>,<br />built in the open.</>,
    sub: 'From greetings to cleft constructions, chapter by chapter, published as it’s written, reviewed by fluent speakers as it grows.',
    provenance: 'Beginner to Advanced · 52 Chapters',
  },
  {
    eyebrow: 'Every answer teaches the rule',
    headline: <>Told <span className="accent">why</span>,<br />not just<br />whether.</>,
    sub: 'Every wrong answer explains the rule it broke. Every right answer shows why the others weren’t. No guessing, no streaks to protect.',
    provenance: 'Explanations on every option',
  },
  {
    eyebrow: 'Speakers, learners, everyone',
    headline: <>Speakers,<br />come help.<br /><span className="accent">Learners, come learn.</span></>,
    sub: 'Flag a typo, suggest a better example, request an exercise. Fluent speakers who review chapters get their names on the Roll of Keepers.',
    provenance: 'Open to feedback · open to contributors',
  },
  {
    eyebrow: 'Reads like a book',
    headline: <>No streaks.<br />No notifications.<br /><span className="accent">Just the book.</span></>,
    sub: 'Drills embedded in the chapter, not quarantined in a separate app. Set in a font built for Pacific orthography: macrons and saltillo, done right.',
    provenance: 'Reads like prose · not a game',
  },
]

const moduleCards = [
  { num: '01', title: 'Chapters',                       desc: 'Follow the full grammar arc step by step.',     action: 'Start',    to: '/chapters' },
  { num: '02', title: 'Exercises',                      desc: "Practice what you've learned in each chapter.", action: 'Practice', to: '/drills' },
  { num: '03', title: 'Quizzes',                        desc: 'Test your understanding and track your progress.', action: 'Test',  to: '/quizzes' },
  { num: '04', title: <>Vocab<br />Flip Cards</>,       desc: 'Build your vocabulary one card at a time.',     action: 'Flip',     to: '/cards' },
  { num: '05', title: <>Reference<br />Charts</>,       desc: 'Quick grammar lookup whenever you need it.',    action: 'Lookup',   to: '/charts' },
]

// Real screenshots of the live app, shown in the rotating hero preview window.
// Captured from the running site (scripts/.. capture, one-off) into assets.
const previews = [
  { img: previewChapter,  caption: 'Read a chapter',          alt: 'A chapter on the live site' },
  { img: previewContents, caption: 'Browse all 52 chapters',  alt: 'The chapter contents' },
  { img: previewQuiz,     caption: 'Quiz · told why',         alt: 'A quiz question with the rule explained' },
  { img: previewCards,    caption: 'Flip cards · vocabulary', alt: 'The vocabulary flip cards' },
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
        <div className="top-sub">A community edition · 52 chapters · Beginner to advanced · The book is free</div>
      </div>

      {/* ========== HERO CANVAS ========== */}
      <div className="hero-canvas">
        <svg className="geo desktop" viewBox="0 0 1440 700" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 720,0 0,654" fill="#5a5855">
            <animate attributeName="fill" values="#5a5855;#54524f;#5a5855" dur="24s" repeatCount="indefinite" />
          </polygon>
          <polygon points="820,-30 1440,-30 1440,730 20,730" fill="#c8c3bc">
            <animate attributeName="fill" values="#c8c3bc;#cdc8c1;#c8c3bc" dur="28s" repeatCount="indefinite" />
          </polygon>
          <polygon points="720,-30 840,-30 40,730 -80,730" fill="#ffffff" />
          <polygon points="744,-30 768,-30 -32,730 -56,730" fill="#8a2e14" />
          <polygon points="768,-30 792,-30 -8,730 -32,730" fill="#c24a1f" />
          <polygon points="792,-30 816,-30 16,730 -8,730" fill="#e6653a" />
        </svg>

        <svg className="geo mobile" viewBox="0 0 400 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 400,0 400,116 0,404" fill="#5a5855">
            <animate attributeName="fill" values="#5a5855;#54524f;#5a5855" dur="24s" repeatCount="indefinite" />
          </polygon>
          <polygon points="400,236 400,800 0,800 0,524" fill="#c8c3bc">
            <animate attributeName="fill" values="#c8c3bc;#cdc8c1;#c8c3bc" dur="28s" repeatCount="indefinite" />
          </polygon>
          <polygon points="400,116 400,236 0,524 0,404" fill="#ffffff" />
          <polygon points="400,140 400,164 0,452 0,428" fill="#e6653a" />
          <polygon points="400,164 400,188 0,476 0,452" fill="#c24a1f" />
          <polygon points="400,188 400,212 0,500 0,476" fill="#8a2e14" />
        </svg>

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
              <Link to="/chapters" className="cta-secondary">See the Contents</Link>
              <Link to="/support" className="cta-secondary">Support this work →</Link>
              <div className="cta-meta"><strong>Built in the open</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== BOTTOM WHITE BAND ========== */}
      <div className="bottom-band reveal d4">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> The Community Edition</div>
          <div className="bottom-spec">
            52 Chapters · Full Grammar Arc · Reviewed in the open
          </div>
        </div>
        <div className="cefr-badge">
          <div className="level">Full Arc</div>
          <div className="scope">Beginner → Advanced</div>
        </div>
        <Link to="/support" className="free-note" style={{ textDecoration: 'none' }}>The book is free →</Link>
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
            <div><strong>Lea Faka-Tonga</strong> · Edition v0.9 · 2026 · A work in progress</div>
          </div>
        </div>
      </div>

    </div>
  )
}
