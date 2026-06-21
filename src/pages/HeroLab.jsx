import { useState, useEffect, useRef } from 'react'
import '../styles/hero-lab.css'

/* =========================================================================
   HeroLab — the hidden /hero-lab iteration surface for the homepage hero.
   Owner chose Variant A (One Stage): a persistent book-cover anchor + a stage
   that auto-cycles the feature cells. THIS ROUND adds a STYLE SELECTOR in the
   topbar so the owner can watch several distinct animation treatments live and
   pick one. Five styles, all on the same cells + the same live-app preview
   clips, differing only in (a) the message visual and (b) how it hands off to
   the preview:

     · Wipe      — bespoke mini-anim, clip-path wipe into the app (the baseline,
                   what's effectively live now).
     · Kinetic   — expressive animated typography per cell, soft fade into app.
     · Grammar   — real grammar micro-animations adapted from the video work
                   (TenseRipple / sentence-swap / drills / ʻikai insert / card
                   flip), wiped into the app. Resolves the parked "bespoke vs
                   grammar-clip for Read/Quiz/Vocab" question by showing it.
     · Dive      — kinetic type that you fly THROUGH as the app zooms forward
                   (the "dive into the screen" feel).
     · App-first — the real app plays full-bleed and the message overlays it.

   Every Tongan token here is verified against the project data (the swap +
   drills use ika/moa/Sione already in the lab; TenseRipple + IkaiInsert copy
   the exact tokens from video-remotion's concept data). No fabricated Tongan.
   Self-contained; Landing.jsx is untouched. Delete this file + hero-lab.css +
   the route once a style ships to the real homepage.
   ========================================================================= */

const BASE = import.meta.env.BASE_URL
const BOOK_PDF = `${BASE}downloads/Lea-Faka-Tonga.pdf`
const BOOK_EPUB = `${BASE}downloads/Lea-Faka-Tonga.epub`

const MESSAGE_MS = 2600   // beat 1: the message + its animation
const PREVIEW_MS = 4400   // beat 2: the live-app preview clip

// The animation treatments the owner picks between (selector in the topbar).
const STYLES = [
  { id: 'wipe', label: 'Wipe', note: 'The baseline: a small bespoke animation per cell that wipes across into the live app.' },
  { id: 'kinetic', label: 'Kinetic', note: 'Expressive animated typography: the headline itself is the animation, then it softly dissolves into the app.' },
  { id: 'grammar', label: 'Grammar', note: 'Real grammar micro-animations from the video work (swap a tense marker, insert ʻikai, flip a card) as each message, then into the app.' },
  { id: 'dive', label: 'Dive', note: 'The headline rushes toward you and you fly through it as the app screen zooms forward, a dive into the website.' },
  { id: 'grammardive', label: 'Grammar+Dive', note: 'Best of both: the grammar concept plays as a quick teaching beat, then you dive THROUGH it into the real app screen where you actually do it.' },
  { id: 'appfirst', label: 'App-first', note: 'The real app leads, playing full-bleed; the message floats in over it as a caption.' },
]
const STYLE_IDS = STYLES.map(s => s.id)

const lead = {
  eyebrow: 'The whole course, free and open',
  headline: <>Find your<br /><span className="accent">Tongan</span>.</>,
  sub: 'Whether it’s your family’s language, you married into it, or you just love Tonga: 52 lessons, beginner to advanced, free to keep.',
}

// Each cell carries a desktop (landscape) + mobile (portrait) preview clip,
// a marketing headline (Kinetic/Dive animate the `kin` word-list version of it),
// and a `grammar` key naming its grammar micro-animation for the Grammar style.
const cells = [
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
    id: 'feat-quiz', file: 'feat-quiz', fileMobile: 'feat-quiz-mobile', anim: 'reveal', grammar: 'ikai', previewTitle: 'Test yourself',
    eyebrow: 'Quizzes that teach',
    headline: <><span className="accent">Understand</span> it,<br />don’t just guess.</>,
    kin: [{ t: 'Understand', accent: true, fx: 'grow' }, { t: 'it,' }, { t: 'don’t' }, { t: 'just' }, { t: 'guess', fx: 'dim' }],
  },
  {
    id: 'feat-vocab', file: 'feat-vocab', fileMobile: 'feat-vocab-mobile', anim: 'reveal', grammar: 'flip', previewTitle: 'Vocab, your way',
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

// Grammar (Quiz): drop one word, ʻikai, and the sentence turns negative.
// Tokens verified against ikai-te-vs-ke-negation-insert.ts.
function IkaiInsert({ run }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!run) { setStep(0); return }
    const t1 = setTimeout(() => setStep(1), 800)
    const t2 = setTimeout(() => setStep(2), 1700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [run])
  return (
    <div className="hl-ikai">
      <div className="hl-ikai-row">
        <span className="hl-tok">ʻOku</span>
        {step >= 1 && <span className="hl-tok neg" key="ik">ʻikai</span>}
        {step >= 2
          ? <span className="hl-tok swap" key="teu">te u</span>
          : <span className="hl-tok" key="ou">ou</span>}
        <span className="hl-tok">fiefia</span>
      </div>
      <div className="hl-ikai-en">{step < 2 ? '“I am happy.”' : '“I am not happy.”'}</div>
      <div className="hl-ripple-cap">{step < 1 ? 'Start with a fact…' : 'One word in, the meaning flips, and the quiz tells you why.'}</div>
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
      : cell.grammar === 'ikai' ? IkaiInsert
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

function StoryCell({ cell, style, active, reduceMotion, portrait }) {
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

/* ---- Variant A — One Stage, with a live STYLE selector ----------------- */

function initialStyle() {
  if (typeof window === 'undefined') return 'wipe'
  const s = new URLSearchParams(window.location.search).get('s')
  return STYLE_IDS.includes(s) ? s : 'wipe'
}

export default function HeroLab() {
  const [idx, setIdx] = useState(0)
  const [style, setStyle] = useState(initialStyle)
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

  // keep the style shareable in the URL (?s=…), like the old ?v= toggle.
  function chooseStyle(id) {
    setStyle(id)
    const u = new URL(window.location.href)
    u.searchParams.set('s', id)
    window.history.replaceState(null, '', u)
  }

  useEffect(() => {
    if (reduceMotion) return
    const t = setTimeout(() => setIdx(p => (p + 1) % cells.length), MESSAGE_MS + PREVIEW_MS)
    return () => clearTimeout(t)
  }, [idx, reduceMotion, style])

  const activeStyle = STYLES.find(s => s.id === style)

  return (
    <div className="hero-lab">
      <div className="hl-topbar">
        <span className="hl-topbar-brand">Hero Lab <span className="dot">·</span> Styles</span>
        <div className="hl-styles" role="group" aria-label="Animation style">
          {STYLES.map(s => (
            <button
              key={s.id}
              type="button"
              className={`hl-style-chip${s.id === style ? ' active' : ''}`}
              onClick={() => chooseStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="hl-note">{activeStyle?.note}</p>
      </div>

      <div className="hl-a">
        <div className="hl-a-anchor"><BookAnchor /></div>
        <div className="hl-a-stage">
          <StoryCell key={`${style}-${cells[idx].id}`} cell={cells[idx]} style={style} active reduceMotion={reduceMotion} portrait={portrait} />
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
