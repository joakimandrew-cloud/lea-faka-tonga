import { useState, useEffect, useRef } from 'react'
import '../styles/hero-lab.css'

/* =========================================================================
   hero-cells — the shared hero "story cell" engine used by BOTH the live
   homepage hero (Landing.jsx, Grammar+Dive) and the hidden /hero-lab tuning
   surface (HeroLab.jsx, the style selector). One source of truth so the two
   never drift.

   A cell fuses a MESSAGE (a small animation that teaches the point) with the
   matching live-app PREVIEW clip, and hands off message → preview per the
   chosen `style`. Grammar+Dive (the homepage's style) plays a real grammar
   micro-animation, then dives THROUGH it into the real app screen.

   Every Tongan token is verified against the project data (ika/moa/Sione;
   TenseRipple + the mini-quiz copy the exact tokens from video-remotion's
   concept data). No fabricated Tongan. Preview clips live in public/feat-*.
   ========================================================================= */

export const BASE = import.meta.env.BASE_URL
export const BOOK_PDF = `${BASE}downloads/Lea-Faka-Tonga.pdf`
export const BOOK_EPUB = `${BASE}downloads/Lea-Faka-Tonga.epub`

export const MESSAGE_MS = 2600   // beat 1: the message + its animation
export const PREVIEW_MS = 4400   // beat 2: the live-app preview clip

export const lead = {
  eyebrow: 'The whole course, free and open',
  headline: <>Find your<br /><span className="accent">Tongan</span>.</>,
  sub: 'Whether it’s your family’s language, you married into it, or you just love Tonga: 52 lessons, beginner to advanced, free to keep.',
}

// Each cell carries a desktop (landscape) + mobile (portrait) preview clip,
// a marketing headline (Kinetic/Dive animate the `kin` word-list version of it),
// and a `grammar` key naming its grammar micro-animation for the Grammar style.
// The Read preview dives into Chapter 2 (the tense-marker chapter), so its beat
// (swap the marker, change the tense) lands on the page that explains that rule.
export const cells = [
  {
    id: 'feat-read', file: 'feat-read', fileMobile: 'feat-read-mobile', anim: 'reveal', grammar: 'tense', previewTitle: 'Read the whole book',
    eyebrow: 'Real lessons, not word lists',
    headline: <>Every rule,<br /><span className="accent">explained</span>.</>,
    kin: [{ t: 'Every' }, { t: 'rule,' }, { t: 'explained', accent: true, fx: 'stamp' }],
  },
  {
    id: 'feat-sentence', file: 'feat-sentence', fileMobile: 'feat-sentence-mobile', anim: 'sentence', grammar: 'sentence', previewTitle: 'Build your own sentences',
    eyebrow: 'Your own grammar lab',
    headline: <>Swap a word,<br />watch the meaning <span className="accent">change</span>.</>,
    kin: [{ t: 'Swap' }, { t: 'a' }, { t: 'word,' }, { t: 'watch' }, { t: 'the' }, { t: 'meaning' }, { t: 'change', accent: true, fx: 'swap' }],
  },
  {
    id: 'feat-drills', file: 'feat-drills', fileMobile: 'feat-drills-mobile', anim: 'drills', grammar: 'drills', previewTitle: 'Practice as you go',
    eyebrow: 'Practice that teaches',
    headline: <>Every wrong answer<br />shows you <span className="accent">why</span>.</>,
    kin: [{ t: 'Every' }, { t: 'wrong', fx: 'strike' }, { t: 'answer' }, { t: 'shows' }, { t: 'you' }, { t: 'why', accent: true, fx: 'pulse' }],
  },
  {
    id: 'feat-quiz', file: 'feat-quiz', fileMobile: 'feat-quiz-mobile', anim: 'reveal', grammar: 'quiz', previewTitle: 'Test yourself',
    eyebrow: 'Quizzes that teach',
    headline: <><span className="accent">Understand</span> it,<br />don’t just guess.</>,
    kin: [{ t: 'Understand', accent: true, fx: 'grow' }, { t: 'it,' }, { t: 'don’t' }, { t: 'just' }, { t: 'guess', fx: 'dim' }],
  },
  {
    id: 'feat-vocab', file: 'feat-vocab', fileMobile: 'feat-vocab-mobile', anim: 'reveal', grammar: 'flip', previewTitle: 'Make your own flashcards',
    eyebrow: 'Vocabulary, your way',
    headline: <>Any word list,<br />instant <span className="accent">flashcards</span>.</>,
    kin: [{ t: 'Any' }, { t: 'word' }, { t: 'list,' }, { t: 'instant' }, { t: 'flashcards', accent: true, fx: 'flip' }],
  },
]

/* ---- mini-animations (beat 1) ----------------------------------------- */

// Wipe + Grammar (Sentence): ʻOku kai ʻe Sione ʻa e ika ⇄ moa, English tracks it.
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

// Wipe + Grammar (Drills): wrong struck out with the reason, then right.
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

// Grammar (Read): the Tongan verb is frozen; only the front marker changes and
// the English re-conjugates. Tokens verified against tense-marker-swap.ts.
function TenseRipple({ run }) {
  const steps = [
    { m: 'Naʻá', en: 'you ate' },
    { m: 'ʻOku', en: 'you eat' },
    { m: 'Kuó', en: 'you have eaten' },
    { m: 'Té', en: 'you will eat' },
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    if (!run) { setI(0); return }
    const t = setInterval(() => setI(p => (p + 1) % steps.length), 720)
    return () => clearInterval(t)
  }, [run])
  const s = steps[i]
  return (
    <div className="hl-ripple">
      <div className="hl-ripple-row">
        <span className="hl-ripple-marker" key={s.m}>{s.m}</span>
        <span className="hl-ripple-frozen">ke kai</span>
      </div>
      <div className="hl-ripple-en">“<b key={s.en}>{s.en}</b>.”</div>
      <div className="hl-ripple-cap">One verb. Change the marker, the tense changes.</div>
    </div>
  )
}

// Grammar (Quiz): illustrate what the quiz DOES — a question, the right answer,
// then the reason — so it dives into the real quiz showing the same thing.
// Both options are verified real forms (the positive vs the negative of the
// same sentence); the "wrong" one is true Tongan, just not the answer asked.
function MiniQuiz({ run }) {
  const [step, setStep] = useState(0)   // 0 question, 1 answer locked, 2 reason
  useEffect(() => {
    if (!run) { setStep(0); return }
    const t1 = setTimeout(() => setStep(1), 900)
    const t2 = setTimeout(() => setStep(2), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [run])
  return (
    <div className="hl-quiz">
      <div className="hl-quiz-q">Which one means <i>“I am not happy”</i>?</div>
      <div className="hl-quiz-opts">
        <span className={`hl-qopt${step >= 1 ? ' dim' : ''}`}>ʻOku ou fiefia</span>
        <span className={`hl-qopt${step >= 1 ? ' right' : ''}`}>ʻOku ʻikai te u fiefia{step >= 1 && <span className="mark">✓</span>}</span>
      </div>
      <div className="hl-quiz-why">{step < 2 ? ' ' : 'ʻikai before the pronoun (it contracts to te u) makes it negative.'}</div>
    </div>
  )
}

// Grammar (Vocab): a flashcard flips Tongan to English. Verified pairs.
function CardFlip({ run }) {
  const pairs = [{ to: 'ika', en: 'fish' }, { to: 'moa', en: 'chicken' }]
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  useEffect(() => {
    if (!run) { setI(0); setFlipped(false); return }
    let flip = false, idx = 0
    const t = setInterval(() => {
      flip = !flip
      if (!flip) idx = (idx + 1) % pairs.length
      setFlipped(flip)
      setI(idx)
    }, 1050)
    return () => clearInterval(t)
  }, [run])
  const p = pairs[i]
  return (
    <div className="hl-flipwrap">
      <div className={`hl-flip${flipped ? ' is-flipped' : ''}`}>
        <div className="hl-flip-face hl-flip-front">{p.to}</div>
        <div className="hl-flip-face hl-flip-back">{p.en}</div>
      </div>
      <div className="hl-ripple-cap">Every word list becomes a deck you can flip.</div>
    </div>
  )
}

// Shared stand-in for Wipe's Read/Quiz/Vocab: a few content lines stroke in.
function RevealAnim({ run }) {
  return (
    <div className="hl-reveal" key={run ? 'run' : 'idle'}>
      <span /><span /><span /><span />
    </div>
  )
}

// Kinetic + Dive: the headline IS the animation. Each word rises in on a
// stagger; accent words get an extra flourish (expressive variant only).
function KineticHeadline({ cell, run, variant }) {
  const expressive = variant === 'expressive'
  return (
    <h2 className="hl-kin" key={run ? `${cell.id}-run` : `${cell.id}-idle`}>
      {cell.kin.map((w, i) => (
        <span
          key={i}
          className={`hl-w${w.accent ? ' accent' : ''}${expressive && w.fx ? ` fx-${w.fx}` : ''}`}
          style={{ '--i': i }}
        >
          {w.t}
        </span>
      ))}
    </h2>
  )
}

/* ---- message-visual dispatch ------------------------------------------ */

function pickAnim(cell, style) {
  if (style === 'grammar' || style === 'grammardive') {
    return cell.grammar === 'tense' ? TenseRipple
      : cell.grammar === 'sentence' ? SentenceAnim
      : cell.grammar === 'drills' ? DrillsAnim
      : cell.grammar === 'quiz' ? MiniQuiz
      : CardFlip
  }
  // wipe
  return cell.anim === 'sentence' ? SentenceAnim : cell.anim === 'drills' ? DrillsAnim : RevealAnim
}

function MessageInner({ cell, style, running }) {
  if (style === 'kinetic' || style === 'dive') {
    return (
      <>
        <span className="hl-eyebrow">{cell.eyebrow}</span>
        <KineticHeadline cell={cell} run={running} variant={style === 'dive' ? 'calm' : 'expressive'} />
      </>
    )
  }
  if (style === 'appfirst') {
    return (
      <div className="hl-overlay-card">
        <span className="hl-eyebrow">{cell.eyebrow}</span>
        <h2 className="hl-overlay-head">{cell.headline}</h2>
      </div>
    )
  }
  const Anim = pickAnim(cell, style)
  return (
    <>
      <span className="hl-eyebrow">{cell.eyebrow}</span>
      <Anim run={running} />
      <h2 className="hl-cell-msg-head">{cell.headline}</h2>
    </>
  )
}

/* ---- the reusable story cell: message → (per-style handoff) → preview -- */

export function StoryCell({ cell, style, active, reduceMotion, portrait }) {
  const [phase, setPhase] = useState('message')
  const videoRef = useRef(null)
  const appFirst = style === 'appfirst'

  // beat machine: message -> preview after MESSAGE_MS (held on message when reduced).
  useEffect(() => {
    if (!active || reduceMotion) { setPhase('message'); return }
    setPhase('message')
    const t = setTimeout(() => setPhase('preview'), MESSAGE_MS)
    return () => clearTimeout(t)
  }, [active, reduceMotion, style, cell.id])

  // app-first plays the clip the whole time; others only once handed off.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active && !reduceMotion && (appFirst || phase === 'preview')) {
      if (phase === 'preview' && !appFirst) { try { v.currentTime = 0 } catch { /* noop */ } }
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [phase, active, reduceMotion, appFirst])

  const running = active && !reduceMotion && (appFirst ? true : phase === 'message')
  const file = portrait && cell.fileMobile ? cell.fileMobile : cell.file

  return (
    <div className={`hl-stage${portrait ? ' is-portrait' : ''}`}>
      <span className="hl-stage-stripe" aria-hidden="true" />
      <div className={`hl-cell hl-cx-${style}${phase === 'preview' ? ' is-preview' : ''}${appFirst ? ' is-appfirst' : ''}`}>
        <div className="hl-cell-layer hl-cell-message">
          <MessageInner cell={cell} style={style} running={running} />
        </div>
        <div className="hl-cell-layer hl-cell-preview">
          {/* key by file so the <video> reloads when the desktop/mobile src swaps */}
          <video
            key={file}
            ref={videoRef}
            className="hl-video"
            muted loop playsInline preload="none"
            poster={`${BASE}${file}-poster.jpg`}
            aria-hidden={!appFirst && phase !== 'preview'}
          >
            <source src={`${BASE}${file}.mp4`} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  )
}
