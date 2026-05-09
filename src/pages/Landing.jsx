import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-landing.css'

const INTERVAL = 7000

const slides = [
  {
    eyebrow: 'The Only Modern Course for Tongan',
    headline: <>Duolingo<br />doesn&apos;t have<br />Tongan. <span className="accent">We do.</span></>,
    sub: 'Churchward’s grammar is from 1953. This is the serious, contemporary alternative — for adults who want to actually speak and understand the language.',
    provenance: 'Category of One · Since 2024',
  },
  {
    eyebrow: 'One Complete Grammar Arc',
    headline: <>52 chapters.<br />One <span className="accent">complete</span><br />grammar.</>,
    sub: 'From greetings to cleft constructions. A1 to B2, chapter by chapter, with nothing skipped and nothing padded.',
    provenance: 'A1–B2 · Beginner to Advanced',
  },
  {
    eyebrow: 'Every Answer Teaches the Rule',
    headline: <>Told <span className="accent">why</span>,<br />not just<br />whether.</>,
    sub: 'Every wrong answer explains the rule it broke. Every right answer shows why the others weren’t. No guessing, no streaks to protect.',
    provenance: 'Explanations on Every Option',
  },
  {
    eyebrow: 'Clean Prose · Beautiful Typography',
    headline: <>No streaks.<br />No notifications.<br /><span className="accent">Just the book.</span></>,
    sub: 'Drills embedded in the chapter, not quarantined in a separate app. Reads like a book, works like a course.',
    provenance: 'Reads Like Prose · Not a Game',
  },
  {
    eyebrow: 'Typeset for Pacific Languages',
    headline: <>Saltillo<br /><span className="accent">and macrons</span>,<br />done right.</>,
    sub: 'ʻOku ou nofo ʻi Tongatapu — set in a font purpose-built for Pacific orthography. The detail your language deserves.',
    provenance: 'Purpose-Built Pacific Typesetting',
  },
]

const moduleCards = [
  {
    num: '01',
    type: 'Chapters',
    title: <>Learn by<br />Chapter</>,
    tongan: 'ʻOku tuʻu fakataha pe',
    desc: '52 chapters, A1 to B2. Greetings through cleft constructions, each one a self-contained lesson with drills embedded in the prose.',
    to: '/chapters',
    color: 'c1',
    tag: '§ 01',
  },
  {
    num: '02',
    type: 'Exercises',
    title: <>Targeted<br />Drills</>,
    tongan: 'Ngaahi ngaue fakapotopoto',
    desc: 'Sentence builders, tense swaps, possessive sorters. Practice the exact pattern the chapter just taught you — nothing generic.',
    to: '/drills',
    color: 'c2',
    tag: '§ 02',
  },
  {
    num: '03',
    type: 'Quizzes',
    title: <>Told<br />Why</>,
    tongan: 'ʻUhinga, ʻikai pe totonu',
    desc: 'One multiple-choice quiz per chapter, with an explanation on every option — right and wrong. You are taught, not tested.',
    to: '/quizzes',
    color: 'c3',
    tag: '§ 03',
  },
  {
    num: '04',
    type: 'Vocabulary',
    title: <>Flip<br />Cards</>,
    tongan: 'Kāti fakafoki',
    desc: '630+ vocabulary cards across every chapter. Filter by category, shuffle, and test your recall.',
    to: '/cards',
    color: 'c4',
    tag: '§ 04',
  },
  {
    num: '05',
    type: 'Reference',
    title: <>Reference<br />Charts</>,
    tongan: 'Tepile tokoni',
    desc: 'Pronoun paradigms, possessive tables, tense markers. The full grammatical system at a glance, typeset for the page.',
    to: '/charts',
    color: 'c5',
    tag: '§ 05',
  },
]

// ── Sentence builder data (for Preview 4) ─────────────────────────────────
const BUILDER_SENTENCES = [
  { words: ['ʻOku', 'ou', 'ʻalu', 'ki', 'he', 'fale'], punct: '.', en: 'I am going to the house', prompt: 'I am going to the house' },
  { words: ['Ko', 'hai', 'koe'],                                  punct: '?', en: 'Who are you?',               prompt: 'Who are you?' },
  { words: ['Ko', 'hoku', 'hingoa', 'ko', 'Sione'],               punct: '.', en: 'My name is Sione',          prompt: 'My name is Sione' },
  { words: ['Mālō', 'e', 'lelei'],                      punct: '',  en: 'Hello (formal greeting)',   prompt: 'Hello (formal)' },
  { words: ['ʻOku', 'ou', 'fiefia'],                         punct: '.', en: 'I am happy',                prompt: 'I am happy' },
]

// Preload tile positions (scatter them in the pool)
function computeTilePositions(n) {
  const positions = []
  const rowYs = [30, 70]
  for (let i = 0; i < n; i++) {
    const row = i % 2
    const inRow = Math.floor(i / 2)
    const totalInRow = Math.ceil((n - row) / 2)
    const xStep = 76 / totalInRow
    const x = 12 + xStep * (inRow + 0.5) + (Math.random() * 8 - 4)
    positions.push({ top: rowYs[row], left: Math.max(8, Math.min(92, x)) })
  }
  return positions
}

function shuffleIndexes(n) {
  const order = Array.from({ length: n }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

function SentenceBuilder({ active }) {
  const [sIdx, setSIdx] = useState(0)
  const [tiles, setTiles] = useState([])
  const [slots, setSlots] = useState([])
  const [complete, setComplete] = useState(false)
  const [translation, setTranslation] = useState('')
  const [prompt, setPrompt] = useState(BUILDER_SENTENCES[0].prompt)
  const timersRef = useRef([])

  const clearTimers = () => {
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
  }

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timersRef.current.push(t)
    return t
  }

  useEffect(() => {
    if (!active) {
      clearTimers()
      return () => clearTimers()
    }

    let cancelled = false
    const runCycle = () => {
      if (cancelled) return
      const sentence = BUILDER_SENTENCES[sIdx % BUILDER_SENTENCES.length]
      setPrompt(sentence.prompt)
      setTranslation('')
      setComplete(false)
      setSlots([])

      const N = sentence.words.length
      const positions = computeTilePositions(N)
      const order = shuffleIndexes(N)
      const initialTiles = sentence.words.map((w, i) => ({
        word: w,
        top: positions[order.indexOf(i)].top,
        left: positions[order.indexOf(i)].left,
        show: false,
        placed: false,
        hidden: false,
      }))
      setTiles(initialTiles)

      // Stagger-in
      initialTiles.forEach((_, i) => {
        later(() => {
          setTiles(prev => prev.map((t, idx) => idx === i ? { ...t, show: true } : t))
        }, 40 + i * 70)
      })

      const startPlacingAt = 500
      const placeStep = 380
      sentence.words.forEach((w, i) => {
        later(() => {
          setTiles(prev => prev.map((t, idx) => idx === i ? { ...t, placed: true } : t))
          later(() => {
            setSlots(prev => [...prev, { text: w, show: false, punct: false }])
            later(() => {
              setSlots(prev => prev.map((s, si) => si === prev.length - 1 ? { ...s, show: true } : s))
              setTiles(prev => prev.map((t, idx) => idx === i ? { ...t, hidden: true } : t))
            }, 20)
          }, 180)

          const isLast = i === sentence.words.length - 1
          if (isLast) {
            later(() => {
              if (sentence.punct) {
                setSlots(prev => [...prev, { text: sentence.punct, show: false, punct: true }])
                later(() => {
                  setSlots(prev => prev.map((s, si) => si === prev.length - 1 ? { ...s, show: true } : s))
                }, 20)
              }
            }, 480)
            later(() => setComplete(true), 720)
            later(() => setTranslation(sentence.en), 980)
          }
        }, startPlacingAt + i * placeStep)
      })

      const total = startPlacingAt + sentence.words.length * placeStep + 800 + 2000
      later(() => {
        if (cancelled) return
        setSIdx(prev => prev + 1)
      }, total)
    }

    runCycle()
    return () => {
      cancelled = true
      clearTimers()
    }
  }, [active, sIdx])

  return (
    <div className="preview-body">
      <div className="p5-prompt">Build: <em>{prompt}</em></div>
      <div className="p5-pool">
        {tiles.map((t, i) => (
          <span
            key={`${sIdx}-${i}`}
            className={`p5-tile${t.show && !t.hidden ? ' show' : ''}${t.placed ? ' placed' : ''}`}
            style={{ top: `${t.top}%`, left: `${t.left}%`, opacity: t.hidden ? 0 : undefined }}
          >
            {t.word}
          </span>
        ))}
      </div>
      <div className={`p5-line${complete ? ' complete' : ''}`}>
        <div className="p5-line-rail" />
        <div className="p5-slots">
          {slots.map((s, i) => (
            <span
              key={`${sIdx}-slot-${i}`}
              className={`p5-slot${s.show ? ' show' : ''}${s.punct ? ' punct' : ''}`}
            >
              {s.text}
            </span>
          ))}
        </div>
        <span className={`p5-check${complete ? ' show' : ''}`}>✓</span>
      </div>
      <div className={`p5-translation${translation ? ' show' : ''}`}>{translation}</div>
    </div>
  )
}

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
        <div className="top-sub">The Modern Course · 52 Chapters · A1–B2</div>
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

              <div className="badge-52">
                <span className="num">52</span>
                <div className="sub">Chapters. One book.</div>
              </div>

              {/* Preview 0: Chapter featured sentence */}
              <div className={`preview-frame${current === 0 ? ' active' : ''}`}>
                <div className="preview-header">
                  <div className="browser-dots"><span /><span /><span /></div>
                  <div className="url-pill">leafakatonga.com</div>
                  <span className="ph-right">Ch.01 · First Sentence</span>
                </div>
                <div className="preview-body">
                  <div className="p1-top">
                    <span className="p1-label">Chapter 01 · First Sentence</span>
                    <div className="p1-ch-nav">
                      <span className="chip">‹ Prev</span>
                      <span className="chip on">Ch 1</span>
                      <span className="chip">Next ›</span>
                    </div>
                  </div>
                  <div className="p1-featured">ʻOKU OU <span className="underline">NOFO</span>.</div>
                  <div className="p1-meaning">&ldquo;<em>I live / I stay.</em>&rdquo; — the hinge of the whole grammar.</div>
                  <div className="p1-phonetic">/ OH-KOO · OH · NOH-FOH /</div>
                  <div className="p1-buttons">
                    <button className="p1-btn primary"><span className="play-ico" /> Listen</button>
                    <button className="p1-btn">Read the Chapter</button>
                  </div>
                </div>
              </div>

              {/* Preview 1: Flip cards */}
              <div className={`preview-frame${current === 1 ? ' active' : ''}`}>
                <div className="preview-header">
                  <div className="browser-dots"><span /><span /><span /></div>
                  <div className="url-pill">leafakatonga.com/cards</div>
                  <span className="ph-right">Vocabulary · Tap to Flip</span>
                </div>
                <div className="preview-body">
                  <div className="p2-toolbar">
                    <div className="p2-filters">
                      <span className="f on">All</span>
                      <span className="f">Verbs</span>
                      <span className="f">Nouns</span>
                      <span className="f">Phrases</span>
                    </div>
                    <span className="p2-counter">014 / 512</span>
                  </div>
                  <div className="p2-card-stack">
                    <div className="p2-card side">
                      <span className="cat-tag">Noun</span>
                      <span className="word">fale</span>
                      <span className="meaning">house</span>
                    </div>
                    <div className="p2-card active-card">
                      <span className="cat-tag">Verb / Noun</span>
                      <span className="word">kai</span>
                      <span className="meaning">food · to eat</span>
                      <span className="flip-hint">↻ flip</span>
                    </div>
                    <div className="p2-card side">
                      <span className="cat-tag">Verb</span>
                      <span className="word">ʻalu</span>
                      <span className="meaning">to go</span>
                    </div>
                  </div>
                  <div className="p2-controls">
                    <span className="btn">‹ Prev</span>
                    <span className="btn">⇄ Shuffle</span>
                    <span className="btn">Next ›</span>
                  </div>
                </div>
              </div>

              {/* Preview 2: Quiz */}
              <div className={`preview-frame${current === 2 ? ' active' : ''}`}>
                <div className="preview-header">
                  <div className="browser-dots"><span /><span /><span /></div>
                  <div className="url-pill">leafakatonga.com/quiz</div>
                  <span className="ph-right">Chapter 2 · Q6 of 10</span>
                </div>
                <div className="preview-body">
                  <div className="p3-top">
                    <span className="q-count">Question 06 / 10</span>
                    <span>Score · 05 correct</span>
                  </div>
                  <div className="p3-question">How do you say &ldquo;I am going to the store&rdquo; in Tongan?</div>
                  <div className="p3-option">
                    <span className="letter">A</span>
                    <span>ʻOku ou kai he falekoloa.</span>
                  </div>
                  <div className="p3-option correct">
                    <span className="letter">B</span>
                    <span>ʻOku ou ʻalu ki he falekoloa.</span>
                    <span className="check">✓</span>
                  </div>
                  <div className="p3-why">
                    <strong>Told Why</strong>
                    ʻOku marks present tense; ʻalu (&ldquo;to go&rdquo;) takes ki (&ldquo;to&rdquo;) before the destination. Option A uses &ldquo;kai&rdquo; (eat), not &ldquo;go.&rdquo;
                  </div>
                </div>
              </div>

              {/* Preview 3: Table of Contents */}
              <div className={`preview-frame${current === 3 ? ' active' : ''}`}>
                <div className="preview-header">
                  <div className="browser-dots"><span /><span /><span /></div>
                  <div className="url-pill">leafakatonga.com/contents</div>
                  <span className="ph-right">Table of Contents</span>
                </div>
                <div className="preview-body">
                  <div className="p4-toc-head">
                    <div className="p4-toc-label">Contents · Ako ʻa e Lea</div>
                    <div className="p4-toc-title">52 Chapters.<span className="tone">One Grammar.</span></div>
                  </div>
                  <ul className="p4-toc">
                    <li><span className="num">01</span><span className="t">The First Sentence</span><span className="sub">ʻOku ou nofo</span><span className="dots" /><span className="p">p.08</span></li>
                    <li><span className="num">04</span><span className="t">Questions &amp; the Answer Particle</span><span className="sub">Naʻi</span><span className="dots" /><span className="p">p.42</span></li>
                    <li><span className="num">11</span><span className="t">Possession, Inclusive &amp; Exclusive</span><span className="dots" /><span className="p">p.118</span></li>
                    <li><span className="num">23</span><span className="t">The Four Tenses That Aren&apos;t Tenses</span><span className="dots" /><span className="p">p.224</span></li>
                    <li><span className="num">38</span><span className="t">Cleft Constructions</span><span className="sub">Ko e…</span><span className="dots" /><span className="p">p.358</span></li>
                    <li className="final"><span className="num">52</span><span className="t">…The Full Arc → B2</span><span className="dots" /><span className="p">p.512</span></li>
                  </ul>
                </div>
              </div>

              {/* Preview 4: Sentence builder */}
              <div className={`preview-frame${current === 4 ? ' active' : ''}`}>
                <div className="preview-header">
                  <div className="browser-dots"><span /><span /><span /></div>
                  <div className="url-pill">leafakatonga.com/build</div>
                  <span className="ph-right">Sentence Builder</span>
                </div>
                <SentenceBuilder active={current === 4} />
              </div>

            </div>

            <div className="preview-cta">
              <Link to="/chapters/1" className="cta-btn">Start Chapter 01 <span className="arrow">→</span></Link>
              <Link to="/chapters" className="cta-secondary">See the Contents</Link>
              <div className="cta-meta"><strong>Ch. 01 Free</strong> · Full Course from $12</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== BOTTOM WHITE BAND ========== */}
      <div className="bottom-band reveal d4">
        <div>
          <div className="bottom-title">Lea Faka-Tonga <span className="dot">·</span> The Complete Course</div>
          <div className="bottom-spec">
            52 Chapters · Full Grammar Arc · Audio
            <span className="counter"> · No streaks. No notifications. No gamification.</span>
          </div>
        </div>
        <div className="cefr-badge">
          <div className="level">A1–B2</div>
          <div className="scope">Beginner → Advanced</div>
        </div>
        <div className="free-note">Ch. 01 Free</div>
      </div>

      {/* ========== DARK SECTION — five module cards ========== */}
      <div className="dark-section">
        <div className="dark-frame">
          <div className="section-bar" style={{ marginTop: 0, paddingTop: '28px' }}>
            <span>§ 01 · Five Ways In</span>
            <span className="right">Choose where to begin</span>
          </div>
          <div className="cards">
            {moduleCards.map((c, i) => (
              <Link
                key={c.num}
                to={c.to}
                className={`card ${c.color} scroll-reveal`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className="top-stripe" />
                <div className="card-body">
                  <div className="card-head">
                    <span className="card-num">No. {c.num}</span>
                    <span>{c.type}</span>
                  </div>
                  <div className="card-title">{c.title}</div>
                  <div className="card-tongan">{c.tongan}</div>
                  <p className="card-desc">{c.desc}</p>
                </div>
                <div className="card-foot">
                  <span className="tag">{c.tag}</span>
                  <span className="arrow">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="provenance-bar">
            <div className="line">
              <strong>Written by a Tongan teacher.</strong>
              &nbsp;Every chapter edited by a native speaker, every sentence recorded by a native voice. This is the course we wanted to exist, so we made it.
            </div>
            <div className="sig">
              <strong>Lea Faka-Tonga</strong><br />
              Edition 2026
            </div>
          </div>

          <div className="colophon">
            <div><strong>Lea Faka-Tonga</strong> · Edition 2026</div>
            <div>Set in Barlow Condensed, Inter &amp; Source Serif</div>
            <div className="tonga-sig">Tuʻa ʻofa atu</div>
          </div>
        </div>
      </div>

    </div>
  )
}
