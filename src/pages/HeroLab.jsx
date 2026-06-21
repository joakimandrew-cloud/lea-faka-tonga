import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import '../styles/hero-lab.css'

/* =========================================================================
   HeroLab — a hidden PROTOTYPE route (/hero-lab) for the Home Hero Review.
   It shows two ways to arrange the homepage hero so the owner can watch each
   one run on a phone and pick:
     · Variant A — One Stage : the cells on one big auto-cycling stage.
     · Variant B — Scroll Reveal : one cell revealed per scroll, in turn.
   A "cell" fuses a hero MESSAGE with a little ANIMATION that then wipes into
   the matching live-app PREVIEW clip. The book is a still cover + download
   buttons. This file is self-contained (its own data + css) so it can be
   deleted wholesale once a layout wins; Landing.jsx is left untouched.
   ========================================================================= */

const BASE = import.meta.env.BASE_URL
const BOOK_PDF = `${BASE}downloads/Lea-Faka-Tonga.pdf`
const BOOK_EPUB = `${BASE}downloads/Lea-Faka-Tonga.epub`

const MESSAGE_MS = 2400   // beat 1: the message + its animation
const PREVIEW_MS = 4200   // beat 2: the live-app preview clip

// The lead welcome — carried by the book anchor, present in both variants.
const lead = {
  eyebrow: 'The whole course, free and open',
  headline: <>Find your<br /><span className="accent">Tongan</span>.</>,
  sub: 'Whether it’s your family’s language, you married into it, or you just love Tonga: 52 chapters, beginner to advanced, free to keep.',
}

// Five feature cells (same claims as the live hero). `anim` picks the beat-1
// treatment: bespoke 'sentence' + 'drills', shared 'reveal' stand-in for the
// rest (swap those for the grammar clips later if we go that way).
const cells = [
  {
    id: 'feat-read', file: 'feat-read', anim: 'reveal', previewTitle: 'Read the whole book',
    eyebrow: 'Real chapters, not word lists',
    headline: <>Every rule,<br /><span className="accent">explained</span>.</>,
    sub: 'Real chapters that teach the grammar step by step, with worked examples and clear tables you can actually follow.',
  },
  {
    id: 'feat-sentence', file: 'feat-sentence', anim: 'sentence', previewTitle: 'Build your own sentences',
    eyebrow: 'Your own grammar lab',
    headline: <>Swap a word,<br />watch the meaning <span className="accent">change</span>.</>,
    sub: 'Build a real Tongan sentence, change one word, and the English re-translates live.',
  },
  {
    id: 'feat-drills', file: 'feat-drills', anim: 'drills', previewTitle: 'Practice as you go',
    eyebrow: 'Practice that teaches',
    headline: <>Every wrong answer<br />shows you <span className="accent">why</span>.</>,
    sub: 'Miss a drill and it explains the rule you broke, right then.',
  },
  {
    id: 'feat-quiz', file: 'feat-quiz', anim: 'reveal', previewTitle: 'Test yourself',
    eyebrow: 'Quizzes that teach',
    headline: <><span className="accent">Understand</span> it,<br />don’t just guess.</>,
    sub: 'Every one of 520 quiz questions comes with the reason behind the answer.',
  },
  {
    id: 'feat-vocab', file: 'feat-vocab', anim: 'reveal', previewTitle: 'Vocab, your way',
    eyebrow: 'Vocabulary, your way',
    headline: <>Any word list,<br />instant <span className="accent">flashcards</span>.</>,
    sub: 'Every chapter’s new words become a deck you can flip in a tap, Tongan or English first.',
  },
]

/* ---- mini-animations (beat 1) ----------------------------------------- */

// "Swap a word, watch the meaning change": the object toggles ika ⇄ moa and
// the English gloss tracks it. Standard ergative frame; verified vocab
// (kai 'eat' takes ika 'fish' / moa 'chicken').
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

// "Every wrong answer shows you why": the wrong chip is struck out with the
// reason, then the right one is confirmed. Verified vocab (ika / moa).
function DrillsAnim({ run }) {
  const [step, setStep] = useState(0)  // 0 idle · 1 wrong picked · 2 right shown
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
      <div className="hl-why">{step === 0 ? ' ' : step === 1 ? '“moa” is chicken, not fish…' : '“ika” is fish. That’s the one.'}</div>
    </div>
  )
}

// Shared stand-in: a few content lines stroke in (chapter text / quiz / cards).
function RevealAnim({ run }) {
  return (
    <div className="hl-reveal" key={run ? 'run' : 'idle'}>
      <span /><span /><span /><span />
    </div>
  )
}

/* ---- the reusable story cell: message-animation → wipe → preview ------- */

function StoryCell({ cell, active, reduceMotion }) {
  const [phase, setPhase] = useState('message')   // 'message' | 'preview'
  const videoRef = useRef(null)

  // When the cell becomes active, play beat 1 (message), then wipe to beat 2.
  useEffect(() => {
    if (!active || reduceMotion) { setPhase('message'); return }
    setPhase('message')
    const t = setTimeout(() => setPhase('preview'), MESSAGE_MS)
    return () => clearTimeout(t)
  }, [active, reduceMotion])

  // Play the clip only on the preview beat; pause otherwise.
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

  return (
    <div className="hl-stage">
      <span className="hl-stage-stripe" aria-hidden="true" />
      <div className={`hl-cell${phase === 'preview' ? ' is-preview' : ''}`}>
        <div className="hl-cell-layer hl-cell-message">
          <span className="hl-eyebrow">{cell.eyebrow}</span>
          <Anim run={running} />
          <h2 className="hl-cell-msg-head">{cell.headline}</h2>
        </div>
        <div className="hl-cell-layer hl-cell-preview">
          <video
            ref={videoRef}
            className="hl-video"
            muted loop playsInline preload="none"
            poster={`${BASE}${cell.file}-poster.jpg`}
            aria-hidden={phase !== 'preview'}
          >
            <source src={`${BASE}${cell.file}.mp4`} type="video/mp4" />
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
    </div>
  )
}

/* ---- Variant A — One Stage (auto-cycling) ------------------------------ */

function VariantA({ reduceMotion }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setIdx(p => (p + 1) % cells.length), MESSAGE_MS + PREVIEW_MS)
    return () => clearTimeout(t)
  }, [idx, reduceMotion])

  return (
    <div className="hl-a">
      <div className="hl-a-anchor"><BookAnchor /></div>
      <div className="hl-a-stage">
        <StoryCell key={cells[idx].id} cell={cells[idx]} active reduceMotion={reduceMotion} />
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
  )
}

/* ---- Variant B — Scroll Reveal (one cell per scroll) ------------------- */

function ScrollSection({ cell, reduceMotion }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.unobserve(el) }
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={`hl-section${inView ? ' inview' : ''}`}>
      <div className="hl-section-stage">
        <StoryCell cell={cell} active={inView} reduceMotion={reduceMotion} />
        <div className="hl-stage-cap"><span className="hl-stage-cap-title">{cell.previewTitle}</span></div>
      </div>
    </div>
  )
}

function VariantB({ reduceMotion }) {
  return (
    <div className="hl-b">
      <div className="hl-b-anchor"><BookAnchor /></div>
      {cells.map(c => (
        <div key={c.id}>
          <span className="hl-split" aria-hidden="true" />
          <ScrollSection cell={c} reduceMotion={reduceMotion} />
        </div>
      ))}
    </div>
  )
}

/* ---- the lab shell: sticky A | B toggle + the chosen variant ----------- */

export default function HeroLab() {
  const [params, setParams] = useSearchParams()
  const variant = params.get('v') === 'b' ? 'b' : 'a'
  const setVariant = v => setParams(v === 'a' ? {} : { v }, { replace: true })

  const [reduceMotion, setReduceMotion] = useState(false)
  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  return (
    <div className="hero-lab">
      <div className="hl-topbar">
        <span className="hl-topbar-brand">Hero Lab <span className="dot">·</span></span>
        <div className="hl-toggle" role="tablist" aria-label="Hero variant">
          <button type="button" role="tab" aria-selected={variant === 'a'} className={variant === 'a' ? 'active' : ''} onClick={() => setVariant('a')}>A · One Stage</button>
          <button type="button" role="tab" aria-selected={variant === 'b'} className={variant === 'b' ? 'active' : ''} onClick={() => setVariant('b')}>B · Scroll Reveal</button>
        </div>
        <p className="hl-note">A prototype to choose between two homepage heroes. Watch each one run, then pick. Nothing here is on the real homepage.</p>
      </div>
      {variant === 'a'
        ? <VariantA reduceMotion={reduceMotion} />
        : <VariantB reduceMotion={reduceMotion} />}
    </div>
  )
}
