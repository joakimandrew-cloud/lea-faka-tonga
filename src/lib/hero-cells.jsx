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

   Every Tongan token is verified against the project data (ika/moa/Sione). The
   grammar-style messages now DESCRIBE each feature in English (ReadSpec, SentenceSpec,
   QuizSpec, VocabSpec) rather than re-acting the real-app screen the beat dives into,
   so there is no fabricated Tongan in a message. Preview clips live in public/feat-*.
   ========================================================================= */

export const BASE = import.meta.env.BASE_URL
export const BOOK_PDF = `${BASE}downloads/Lea-Faka-Tonga.pdf`
export const BOOK_EPUB = `${BASE}downloads/Lea-Faka-Tonga.epub`

export const MESSAGE_MS = 2600   // beat 1: the message + its animation
export const PREVIEW_MS = 4400   // beat 2: the live-app preview clip

// How long the message beat holds before diving. On phones the tall stage left the
// message lingering on a near-static white card (owner 2026-06-22), so trim the dwell —
// hardest on the text-only beat (no stagger to wait for), gentler on the spec beats but
// never shorter than the tile stagger needs to finish (~1.3s). Desktop is unchanged.
export function messageMsFor(cell, portrait) {
  const base = cell.messageMs ?? MESSAGE_MS
  if (!portrait) return base
  return Math.max(Math.round(base * 0.82), cell.messageTextOnly ? 1050 : 1300)
}

// Preview clips play at half speed (owner 2026-06-22) so the scroll-through and every
// demo read calmly — each preview then lasts ~2× as long. The auto-advance window scales
// by 1/PREVIEW_RATE (see Landing) so the slowed clip still plays through fully.
export const PREVIEW_RATE = 0.5

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
    // Message DESCRIBES what "explained" means (the rule · the why · examples) — it does NOT
    // re-animate the tense-marker table (owner 2026-06-22): the real-app dive lands on that table
    // AND the actual plain-English explanation. Shorter intro + longer preview so the dive can hold
    // on the explanation (kuo-vs-naʻa), then the table, then a beat of the practice.
    messageMs: 1600, previewMs: 6300,
    eyebrow: 'Real lessons, not word lists',
    headline: <>Every rule,<br /><span className="accent">explained</span>.</>,
    kin: [{ t: 'Every' }, { t: 'rule,' }, { t: 'explained', accent: true, fx: 'stamp' }],
  },
  {
    id: 'feat-sentence', file: 'feat-sentence', fileMobile: 'feat-sentence-mobile', anim: 'sentence', grammar: 'sentence', previewTitle: 'Build your own sentences',
    // shorter intro (the SentenceSpec dials read fast), longer preview so the clip
    // can play THREE swaps — tense, pronoun, object — within the cell's total ~7s.
    messageMs: 1700, previewMs: 5300,
    eyebrow: 'Your own grammar lab',
    headline: <>Swap a word,<br />watch the meaning <span className="accent">change</span>.</>,
    kin: [{ t: 'Swap' }, { t: 'a' }, { t: 'word,' }, { t: 'watch' }, { t: 'the' }, { t: 'meaning' }, { t: 'change', accent: true, fx: 'swap' }],
  },
  {
    id: 'feat-drills', file: 'feat-drills', fileMobile: 'feat-drills-mobile', anim: 'drills', grammar: 'drills', previewTitle: 'Practice as you go',
    // Message is TEXT-ONLY (no recreated mini-animation, owner 2026-06-22): the real-app
    // montage of wrong→why moments across different exercises carries the illustration.
    // Shorter intro (headline reads fast) + longer preview so the montage can play.
    messageTextOnly: true, messageMs: 1500, previewMs: 5000,
    eyebrow: 'Practice that teaches',
    headline: <>Every wrong answer<br />shows you <span className="accent">why</span>.</>,
    kin: [{ t: 'Every' }, { t: 'wrong', fx: 'strike' }, { t: 'answer' }, { t: 'shows' }, { t: 'you' }, { t: 'why', accent: true, fx: 'pulse' }],
  },
  {
    id: 'feat-quiz', file: 'feat-quiz', fileMobile: 'feat-quiz-mobile', anim: 'reveal', grammar: 'quiz', previewTitle: 'Test yourself',
    // shorter intro (the QuizSpec describes the quiz fast), longer preview so the clip
    // can play TWO questions — Q1 right, Q2 wrong — within the cell's total ~7s.
    messageMs: 1300, previewMs: 5700,
    eyebrow: 'Quizzes that teach',
    headline: <>Test <span className="accent">yourself</span>.</>,
    kin: [{ t: 'Test' }, { t: 'yourself', accent: true, fx: 'grow' }],
  },
  {
    id: 'feat-vocab', file: 'feat-vocab', fileMobile: 'feat-vocab-mobile', anim: 'reveal', grammar: 'flip', previewTitle: 'Practice the vocabulary',
    // Message DESCRIBES the three ways to study a lesson's words (Table · Flip cards · a
    // dedicated Vocab section) — it does NOT act out a flip (owner 2026-06-22). The real-app
    // clip below carries the flipping. Shorter intro + longer preview so the clip can play
    // table → Cards → card-only flip → next card → Tongan-first→English-first.
    messageMs: 1600, previewMs: 5900,
    eyebrow: 'Vocabulary, your way',
    headline: <>Learn the words,<br />your <span className="accent">way</span>.</>,
    kin: [{ t: 'Learn' }, { t: 'the' }, { t: 'words,' }, { t: 'your' }, { t: 'way', accent: true, fx: 'flip' }],
  },
]

/* ---- mini-animations (beat 1) ----------------------------------------- */

// Wipe (Sentence): ʻOku kai ʻe Sione ʻa e ika ⇄ moa, English tracks it. Kept for
// the non-production "wipe" style only; Grammar+Dive now uses SentenceSpec (below).
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

// Grammar (Sentence): DESCRIBE the Lab instead of acting out a swap (the real Lab
// clip plays a second later, so demonstrating one here just doubled up — same fix
// as the Quiz beat). Three "dials" name the parts you can change — tense, who,
// what — with English examples; the real Tongan only ever appears in the live clip
// below, so NO fabricated Tongan here. The dials + caption rise in on a stagger.
function SentenceSpec({ run }) {
  const dials = [
    { k: 'Tense', eg: 'ate · eats · will eat' },
    { k: 'Who', eg: 'I · you · he' },
    { k: 'What', eg: 'fish · bread · taro' },
  ]
  return (
    <div className="hl-sspec" key={run ? 'run' : 'idle'}>
      <div className="hl-sdials">
        {dials.map((d, i) => (
          <div className="hl-sdial" style={{ '--i': i }} key={d.k}>
            <span className="hl-sdial-key">{d.k}</span>
            <span className="hl-sdial-eg">{d.eg}</span>
          </div>
        ))}
      </div>
      <div className="hl-sdial-cap" style={{ '--i': 3 }}>Change any part: the English re-translates live.</div>
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

// Grammar (Read): DESCRIBE what makes the lessons "explained" — the rule, the why, the examples —
// instead of re-animating the tense-marker table (owner 2026-06-22). The dive lands on that exact
// table AND the real plain-English explanation, so animating the markers here just doubled up
// (same fix as Quiz/Sentence/Vocab). English only — no fabricated Tongan. Tiles rise in on a stagger.
function ReadSpec({ run }) {
  const points = [
    { k: 'The rule', eg: 'stated plainly' },
    { k: 'The why', eg: 'in plain English' },
    { k: 'Examples', eg: 'see it in use' },
  ]
  return (
    <div className="hl-sspec" key={run ? 'run' : 'idle'}>
      <div className="hl-sdials">
        {points.map((d, i) => (
          <div className="hl-sdial" style={{ '--i': i }} key={d.k}>
            <span className="hl-sdial-key">{d.k}</span>
            <span className="hl-sdial-eg">{d.eg}</span>
          </div>
        ))}
      </div>
      <div className="hl-sdial-cap" style={{ '--i': 3 }}>The rule, the reason, real examples.</div>
    </div>
  )
}

// Grammar (Quiz): DESCRIBE the quiz instead of acting one out (the real quiz
// clip plays a second later, so simulating one here just doubled up). Three
// facts about what you get: a quiz per lesson, 10 questions, an explanation
// after every answer. Counts verified against quizzes/ and src/data/quizzes.json
// (52 lesson quizzes x 10 questions). The tiles rise in on a stagger.
function QuizSpec({ run }) {
  const stats = [
    { n: '52', lab: 'lesson quizzes' },
    { n: '10', lab: 'questions each' },
    { n: '✓', lab: 'every answer explained', check: true },
  ]
  return (
    <div className="hl-qspec" key={run ? 'run' : 'idle'}>
      {stats.map((s, i) => (
        <div className="hl-qstat" style={{ '--i': i }} key={s.lab}>
          <span className={`hl-qstat-num${s.check ? ' is-check' : ''}`}>{s.n}</span>
          <span className="hl-qstat-lab">{s.lab}</span>
        </div>
      ))}
    </div>
  )
}

// Grammar (Vocab): DESCRIBE the three ways to study a lesson's words instead of acting out
// a flip (the real-app clip plays the flipping a second later, so demonstrating one here
// just doubled up — same fix as the Quiz/Sentence beats). Three "ways" name the surfaces:
// a Table, the same list as Flip cards, and a dedicated Vocab section. English only — no
// fabricated Tongan. The ways + caption rise in on a stagger (reuses hl-sspec, like Sentence).
function VocabSpec({ run }) {
  const ways = [
    { k: 'Table', eg: 'see the list' },
    { k: 'Flip cards', eg: 'practice it' },
    { k: 'Vocab section', eg: 'words on their own' },
  ]
  return (
    <div className="hl-sspec" key={run ? 'run' : 'idle'}>
      <div className="hl-sdials">
        {ways.map((d, i) => (
          <div className="hl-sdial" style={{ '--i': i }} key={d.k}>
            <span className="hl-sdial-key">{d.k}</span>
            <span className="hl-sdial-eg">{d.eg}</span>
          </div>
        ))}
      </div>
      <div className="hl-sdial-cap" style={{ '--i': 3 }}>Every lesson’s words, learned your way.</div>
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
    return cell.grammar === 'tense' ? ReadSpec
      : cell.grammar === 'sentence' ? SentenceSpec
      : cell.grammar === 'drills' ? DrillsAnim
      : cell.grammar === 'quiz' ? QuizSpec
      : VocabSpec
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
  // A cell can opt out of the recreated mini-animation (messageTextOnly): the message
  // is then just eyebrow + headline, and the REAL-app preview carries the illustration.
  const Anim = pickAnim(cell, style)
  return (
    <>
      <span className="hl-eyebrow">{cell.eyebrow}</span>
      {!cell.messageTextOnly && <Anim run={running} />}
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
    const t = setTimeout(() => setPhase('preview'), messageMsFor(cell, portrait))
    return () => clearTimeout(t)
  }, [active, reduceMotion, style, cell.id, portrait])

  // app-first plays the clip the whole time; others only once handed off.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active && !reduceMotion && (appFirst || phase === 'preview')) {
      if (phase === 'preview' && !appFirst) { try { v.currentTime = 0 } catch { /* noop */ } }
      v.playbackRate = PREVIEW_RATE   // half speed → calmer scroll-through + demos
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
        <div className={`hl-cell-layer hl-cell-message${cell.messageTextOnly ? ' is-textonly' : ''}`}>
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
