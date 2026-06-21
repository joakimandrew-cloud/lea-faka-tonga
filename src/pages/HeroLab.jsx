import { useState, useEffect, useRef } from 'react'
import '../styles/hero-lab.css'

/* =========================================================================
   HeroLab — the hidden /hero-lab iteration surface for the homepage hero.
   Owner chose Variant A (One Stage), so this is now A only: a persistent
   book-cover anchor + a stage that auto-cycles the feature cells. Each cell
   fuses a hero MESSAGE with a small animation that wipes into the matching
   live-app PREVIEW clip. The preview is responsive: a landscape clip on
   desktop, and a PORTRAIT phone-shaped clip on phones (so it fills the
   screen instead of being a wide-short strip). Self-contained; Landing.jsx
   is untouched. Delete this file + hero-lab.css + the route once it ships.
   ========================================================================= */

const BASE = import.meta.env.BASE_URL
const BOOK_PDF = `${BASE}downloads/Lea-Faka-Tonga.pdf`
const BOOK_EPUB = `${BASE}downloads/Lea-Faka-Tonga.epub`

const MESSAGE_MS = 2400   // beat 1: the message + its animation
const PREVIEW_MS = 4600   // beat 2: the live-app preview clip

const lead = {
  eyebrow: 'The whole course, free and open',
  headline: <>Find your<br /><span className="accent">Tongan</span>.</>,
  sub: 'Whether it’s your family’s language, you married into it, or you just love Tonga: 52 chapters, beginner to advanced, free to keep.',
}

// Each cell carries a desktop (landscape) + mobile (portrait) preview clip.
const cells = [
  {
    id: 'feat-read', file: 'feat-read', fileMobile: 'feat-read-mobile', anim: 'reveal', previewTitle: 'Read the whole book',
    eyebrow: 'Real chapters, not word lists',
    headline: <>Every rule,<br /><span className="accent">explained</span>.</>,
  },
  {
    id: 'feat-sentence', file: 'feat-sentence', fileMobile: 'feat-sentence-mobile', anim: 'sentence', previewTitle: 'Build your own sentences',
    eyebrow: 'Your own grammar lab',
    headline: <>Swap a word,<br />watch the meaning <span className="accent">change</span>.</>,
  },
  {
    id: 'feat-drills', file: 'feat-drills', fileMobile: 'feat-drills-mobile', anim: 'drills', previewTitle: 'Practice as you go',
    eyebrow: 'Practice that teaches',
    headline: <>Every wrong answer<br />shows you <span className="accent">why</span>.</>,
  },
  {
    id: 'feat-quiz', file: 'feat-quiz', fileMobile: 'feat-quiz-mobile', anim: 'reveal', previewTitle: 'Test yourself',
    eyebrow: 'Quizzes that teach',
    headline: <><span className="accent">Understand</span> it,<br />don’t just guess.</>,
  },
  {
    id: 'feat-vocab', file: 'feat-vocab', fileMobile: 'feat-vocab-mobile', anim: 'reveal', previewTitle: 'Vocab, your way',
    eyebrow: 'Vocabulary, your way',
    headline: <>Any word list,<br />instant <span className="accent">flashcards</span>.</>,
  },
]

/* ---- mini-animations (beat 1) ----------------------------------------- */

// "Swap a word, watch the meaning change": ika ⇄ moa, English tracks it.
function SentenceAnim({ run }) {
  const opts = [{ to: 'ika', en: 'fish' }, { to: 'moa', en: 'chicken' }]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!run) { setI(0); return }
    const t = setInterval(() => setI(p => (p + 1) % opts.length), 1150)
    return () => clearInterval(t)
  }, [run])
  const o = opts[i]
  return (
    <div className="hl-sent">
      <span className="hl-sent-to">ʻOku kai ʻe Sione ʻa e </span>
      <span className="hl-sent-word" key={o.to}>{o.to}</span>
      <span className="hl-sent-to">.</span>
      <div className="hl-sent-en">“Sione eats the <b key={o.en}>{o.en}</b>.”</div>
    </div>
  )
}

// "Every wrong answer shows you why": wrong struck out with the reason, then right.
function DrillsAnim({ run }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!run) { setStep(0); return }
    const t1 = setTimeout(() => setStep(1), 700)
    const t2 = setTimeout(() => setStep(2), 1700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [run])
  return (
    <div className="hl-drill">
      <div className="hl-drill-q">Which word means <i>fish</i>?</div>
      <div className="hl-chips">
        <span className={`hl-chip${step >= 1 ? ' wrong' : ''}`}>moa{step >= 1 && <span className="mark">✕</span>}</span>
        <span className={`hl-chip${step >= 2 ? ' right' : ''}`}>ika{step >= 2 && <span className="mark">✓</span>}</span>
      </div>
      <div className="hl-why">{step === 0 ? ' ' : step === 1 ? '“moa” is chicken, not fish…' : '“ika” is fish. That’s the one.'}</div>
    </div>
  )
}

// Shared stand-in: a few content lines stroke in.
function RevealAnim({ run }) {
  return (
    <div className="hl-reveal" key={run ? 'run' : 'idle'}>
      <span /><span /><span /><span />
    </div>
  )
}

/* ---- the reusable story cell: message-animation → wipe → preview ------- */

function StoryCell({ cell, active, reduceMotion, portrait }) {
  const [phase, setPhase] = useState('message')
  const videoRef = useRef(null)

  useEffect(() => {
    if (!active || reduceMotion) { setPhase('message'); return }
    setPhase('message')
    const t = setTimeout(() => setPhase('preview'), MESSAGE_MS)
    return () => clearTimeout(t)
  }, [active, reduceMotion])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (phase === 'preview' && active && !reduceMotion) {
      try { v.currentTime = 0 } catch { /* noop */ }
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [phase, active, reduceMotion])

  const running = active && !reduceMotion && phase === 'message'
  const Anim = cell.anim === 'sentence' ? SentenceAnim : cell.anim === 'drills' ? DrillsAnim : RevealAnim
  const file = portrait && cell.fileMobile ? cell.fileMobile : cell.file

  return (
    <div className={`hl-stage${portrait ? ' is-portrait' : ''}`}>
      <span className="hl-stage-stripe" aria-hidden="true" />
      <div className={`hl-cell${phase === 'preview' ? ' is-preview' : ''}`}>
        <div className="hl-cell-layer hl-cell-message">
          <span className="hl-eyebrow">{cell.eyebrow}</span>
          <Anim run={running} />
          <h2 className="hl-cell-msg-head">{cell.headline}</h2>
        </div>
        <div className="hl-cell-layer hl-cell-preview">
          {/* key by file so the <video> reloads when the desktop/mobile src swaps */}
          <video
            key={file}
            ref={videoRef}
            className="hl-video"
            muted loop playsInline preload="none"
            poster={`${BASE}${file}-poster.jpg`}
            aria-hidden={phase !== 'preview'}
          >
            <source src={`${BASE}${file}.mp4`} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}

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

/* ---- Variant A — One Stage (auto-cycling) ------------------------------ */

export default function HeroLab() {
  const [idx, setIdx] = useState(0)
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

  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setIdx(p => (p + 1) % cells.length), MESSAGE_MS + PREVIEW_MS)
    return () => clearTimeout(t)
  }, [idx, reduceMotion])

  return (
    <div className="hero-lab">
      <div className="hl-topbar">
        <span className="hl-topbar-brand">Hero Lab <span className="dot">·</span> Option A</span>
        <p className="hl-note">Tuning the chosen layout. The phone preview is now portrait + phone-sized; nothing here is on the real homepage.</p>
      </div>

      <div className="hl-a">
        <div className="hl-a-anchor"><BookAnchor /></div>
        <div className="hl-a-stage">
          <StoryCell key={cells[idx].id} cell={cells[idx]} active reduceMotion={reduceMotion} portrait={portrait} />
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
