import { okinafy } from '@app/lib/okinafy.js'
/**
 * Interactive figures for Lesson 1. Every Tongan string is taken from the
 * lesson's own parsed blocks (its tables and example lines); only the English
 * past-tense glosses are composed here.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion as Motion } from 'motion/react'
import T from '../T.jsx'
import { LOOP_HOLD_MS, stillPage, useAutoTurn } from '../../figure-engine/lib/clock.js'

const strip = s => s.replace(/^\*|\*$/g, '').trim()
const PAST = { eat: 'ate', drink: 'drank', go: 'went', come: 'came', sleep: 'slept', speak: 'spoke', sing: 'sang', stay: 'stayed', run: 'ran', study: 'studied', return: 'returned', cry: 'cried' }

// No entrance: like the engine's figures, a Lesson 1 figure is simply there when the page loads,
// and with reduced motion its own transitions keep only their fades (MotionConfig "user").
function Frame({ k, title, children, caption, onPointerDownCapture, onKeyDownCapture }) {
  return (
    <MotionConfig reducedMotion="user">
      <figure className="fig" onPointerDownCapture={onPointerDownCapture} onKeyDownCapture={onKeyDownCapture}>
        <div className="fig-head">
          <span className="fig-k">{k}</span>
          <span className="fig-t">{title}</span>
        </div>
        {children}
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </MotionConfig>
  )
}

const prefersReduced = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
// Lesson 1's moving figures loop like the engine's, in the same page-wide queue: one moving thing per screen.
const loops = () => !prefersReduced() && !stillPage()

/* 1 · The three parts. Tap a part to read what it does. */
export function PatternFigure() {
  const parts = [
    { w: "Na'á", role: 'Tense marker', gloss: 'past', what: 'Says when. It always comes first in this pattern.' },
    { w: 'ku', role: 'Pronoun', gloss: 'I', what: 'Says who did it. It sits between the tense marker and the verb.' },
    { w: 'kai.', role: 'Verb', gloss: 'eat', what: 'Says what was done. It keeps the same form in every tense.' },
  ]
  const [on, setOn] = useState(0)
  // While half the figure is in view it goes round the parts (each in turn, then back to the
  // first) and keeps going; none at all with reduced motion; a tap stops it for good.
  const [auto, setAuto] = useState(loops)
  const rootRef = useRef(null)
  const stop = useAutoTurn({
    id: 'bespoke-1.1',
    rootRef,
    enabled: auto,
    play: turn => {
      turn.later(() => setOn(1), 2400)
      turn.later(() => setOn(2), 2400 * 2)
      turn.later(() => setOn(0), 2400 * 3)
      turn.later(turn.done, 2400 * 3 + 600)
    },
    away: () => setOn(0),
  })
  const takeOver = () => { stop(); setAuto(false) }
  return (
    <Frame k="Figure 1.1" title="Three parts, always in this order" caption="Tap a word. The literal reading is “Past I eat”, which English says as “I ate.”" onPointerDownCapture={takeOver} onKeyDownCapture={takeOver}>
      <div className="pf" ref={rootRef}>
        {parts.map((p, i) => (
          <button key={i} className={`pf-part ${on === i ? 'is-on' : ''}`} onClick={() => { takeOver(); setOn(i) }} aria-pressed={on === i}>
            <span className="pf-num">{i + 1}</span>
            <T className="pf-w">{p.w}</T>
            <span className="pf-g">{p.gloss}</span>
            <span className="pf-role">{p.role}</span>
          </button>
        ))}
      </div>
      {/* Read out only when the student picks a part, never on every turn of the loop. */}
      <div className="pf-what" aria-live={auto ? 'off' : 'polite'}>
        <AnimatePresence mode="wait">
          <Motion.p key={on} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .25 }}>
            <strong>{parts[on].role}.</strong> {parts[on].what}
          </Motion.p>
        </AnimatePresence>
      </div>
    </Frame>
  )
}

/* 2 · Build any sentence in the lesson, from its two combination tables. */
export function CombinatorFigure({ tables }) {
  const grid = useMemo(() => {
    const verbs = []
    const rows = {}
    tables.forEach(t => {
      t.head.slice(1).forEach((h, j) => {
        const m = h.match(/^\*([^*]+)\*\s*\(([^)]+)\)/)
        if (!m) return
        verbs.push({ to: m[1], en: m[2] })
        t.body.forEach(r => {
          const pm = r[0].match(/^\*([^*]+)\*\s*\(([^)]+)\)/)
          if (!pm) return
          rows[pm[1]] = rows[pm[1]] || { to: pm[1], en: pm[2], cells: {} }
          rows[pm[1]].cells[m[1]] = strip(r[j + 1])
        })
      })
    })
    return { verbs, pronouns: Object.values(rows) }
  }, [tables])

  const [pr, setPr] = useState(0)
  const [vb, setVb] = useState(0)
  const [q, setQ] = useState(false)
  if (!grid.verbs.length || !grid.pronouns.length) return null
  // Lesson 1 only asks questions with ke ("you"), so question mode uses ke.
  const keIdx = grid.pronouns.findIndex(p => p.to === 'ke')
  const askAs = (on) => { setQ(on); if (on && keIdx >= 0) setPr(keIdx) }
  const P = grid.pronouns[pr]
  const V = grid.verbs[vb]
  const sentence = P.cells[V.to] || ''
  const shown = q ? sentence.replace(/\.$/, '?') : sentence
  const subj = P.en === 'I' ? 'I' : 'You'
  const english = q ? `Did ${subj === 'I' ? 'I' : 'you'} ${V.en}?` : `${subj} ${PAST[V.en] || V.en}.`

  return (
    <Frame k="Figure 1.2" title="Build any sentence from this lesson" caption={`${grid.pronouns.length} pronouns × ${grid.verbs.length} verbs = ${grid.pronouns.length * grid.verbs.length} sentences, and every one follows the same pattern. Asking someone “Did you…?” is the same words with a rising voice.`}>
      <div className="cb">
        <div className="cb-out">
          <div className="cb-sentence">
            <AnimatePresence mode="popLayout" initial={false}>
              <Motion.span key={shown} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .35, ease: [.16, 1, .3, 1] }}>
                <T>{shown}</T>
              </Motion.span>
            </AnimatePresence>
          </div>
          <div className="cb-en" aria-live="polite">{english}</div>
        </div>
        <div className="cb-controls">
          <div className="cb-row">
            <span className="cb-label">Who</span>
            <div className="cb-chips">
              {grid.pronouns.map((p, i) => (
                <button key={p.to} className={`cb-chip ${pr === i ? 'is-on' : ''}`} onClick={() => setPr(i)} aria-pressed={pr === i} disabled={q && i !== keIdx}>
                  <T>{p.to}</T><span>{p.en}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cb-row">
            <span className="cb-label">Did what</span>
            <div className="cb-chips is-verbs">
              {grid.verbs.map((v, i) => (
                <button key={v.to} className={`cb-chip ${vb === i ? 'is-on' : ''}`} onClick={() => setVb(i)} aria-pressed={vb === i}>
                  <T>{v.to}</T><span>{v.en}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="cb-row">
            <span className="cb-label">Say it as</span>
            <div className="cb-toggle" role="radiogroup">
              <button role="radio" aria-checked={!q} className={!q ? 'is-on' : ''} onClick={() => askAs(false)}>A statement ↘</button>
              <button role="radio" aria-checked={q} className={q ? 'is-on' : ''} onClick={() => askAs(true)}>A question ↗</button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  )
}

/* 3 · Same words, different voice. */
export function IntonationFigure({ pairs }) {
  const statement = pairs.find(p => p.english.startsWith('↘'))
  const question = pairs.find(p => p.english.startsWith('↗'))
  const [q, setQ] = useState(false)
  if (!statement || !question) return null
  const cur = q ? question : statement
  const clean = s => s.replace(/^[↘↗]\s*=?\s*/, '')
  const words = okinafy(cur.tongan).split(' ')
  return (
    <Frame k="Figure 1.3" title="Only the voice changes" caption="Same three words. A falling voice makes a statement; a rising voice at the end makes a question.">
      <div className="into">
        <div className="into-toggle" role="radiogroup" aria-label="Sentence type">
          <button role="radio" aria-checked={!q} className={!q ? 'is-on' : ''} onClick={() => setQ(false)}>Statement</button>
          <button role="radio" aria-checked={q} className={q ? 'is-on' : ''} onClick={() => setQ(true)}>Question</button>
          <Motion.span className="into-pill" animate={{ x: q ? '100%' : '0%' }} transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
        </div>
        <div className="into-stage">
          <svg viewBox="0 0 640 150" className="into-svg" aria-hidden="true">
            <path d="M20 118 H620" className="into-base" />
            <Motion.path
              initial={false}
              animate={{ d: q ? 'M40 78 C 180 76, 330 76, 450 72 S 570 26, 610 14' : 'M40 50 C 180 50, 330 56, 450 70 S 570 104, 610 112' }}
              transition={{ duration: .8, ease: [.16, 1, .3, 1] }}
              className="into-line"
            />
            <Motion.circle initial={false} animate={{ cx: 610, cy: q ? 14 : 112 }} r="7" className="into-dot" transition={{ duration: .8, ease: [.16, 1, .3, 1] }} />
          </svg>
          <p className="into-words" lang="to">
            {words.map((w, i) => (
              <Motion.span key={i + w} className="to" initial={false} animate={{ y: i === words.length - 1 ? (q ? -10 : 6) : 0 }} transition={{ duration: .6, ease: [.16, 1, .3, 1] }}>{w}</Motion.span>
            ))}
          </p>
          <p className="into-en">{clean(cur.english)}</p>
        </div>
      </div>
    </Frame>
  )
}

/* 4 · Where the stress lands: count back two vowels in the combined unit. */
export function StressFigure() {
  const [pron, setPron] = useState('ku')
  // With reduced motion the figure opens on its finished count, at rest.
  const [step, setStep] = useState(() => (prefersReduced() ? 3 : 0))
  const [run, setRun] = useState(0)
  // While the figure is on screen it counts, holds the stressed pair, then counts the other
  // pronoun, and keeps going; a tap stops it for good and the student counts it from there.
  const [auto, setAuto] = useState(loops)
  const rootRef = useRef(null)
  const turns = useRef(0)
  const stop = useAutoTurn({
    id: 'bespoke-1.4',
    rootRef,
    enabled: auto,
    play: turn => {
      if (turns.current > 0) setPron(p => (p === 'ku' ? 'ke' : 'ku'))
      turns.current += 1
      setStep(0)
      turn.later(() => setStep(1), 500)
      turn.later(() => setStep(2), 1300)
      turn.later(() => setStep(3), 2100)
      turn.later(turn.done, 2100 + LOOP_HOLD_MS)
    },
    away: () => setStep(3),
  })
  const takeOver = () => { stop(); setAuto(false) }
  const syl = ['na', "'a", pron]
  const vowelsFromEnd = [2, 1] // syllable indexes counted back: last (1st), second-to-last (2nd)
  useEffect(() => {
    // The student's own count: a pronoun or Count it again.
    if (!run) return undefined
    const pace = prefersReduced() ? 0 : 1
    const ids = [setTimeout(() => setStep(1), 500 * pace), setTimeout(() => setStep(2), 1300 * pace), setTimeout(() => setStep(3), 2100 * pace)]
    return () => ids.forEach(clearTimeout)
  }, [pron, run])
  const count = p => { takeOver(); setStep(0); if (p) setPron(p); setRun(r => r + 1) }
  return (
    <Frame k="Figure 1.4" title="Two words, said as one" caption={<>The pronoun leans on <T>naʻa</T>, so the pair is stressed as one word, on its second-to-last vowel. The book marks that stress with an accent: <T>Naʻá ku</T>, <T>Naʻá ke</T>.</>} onPointerDownCapture={takeOver} onKeyDownCapture={takeOver}>
      <div className="st" ref={rootRef}>
        <div className="st-sylls" lang="to">
          {syl.map((s, i) => {
            const counted = vowelsFromEnd.slice(0, step).includes(i)
            const stressed = step >= 3 && i === 1
            return (
              <div key={i + s} className={`st-syl ${counted ? 'is-counted' : ''} ${stressed ? 'is-stress' : ''}`}>
                <span className="st-count">{counted ? vowelsFromEnd.indexOf(i) + 1 : ''}</span>
                <span className="st-box"><span className="to">{okinafy(s)}</span></span>
              </div>
            )
          })}
          <div className="st-syl is-verb"><span className="st-count" /><span className="st-box"><span className="to">kai</span></span></div>
        </div>
        <div className="st-foot">
          <div className="cb-toggle" role="radiogroup" aria-label="Pronoun">
            <button role="radio" aria-checked={pron === 'ku'} className={pron === 'ku' ? 'is-on' : ''} onClick={() => count('ku')}><T>na'a + ku</T></button>
            <button role="radio" aria-checked={pron === 'ke'} className={pron === 'ke' ? 'is-on' : ''} onClick={() => count('ke')}><T>na'a + ke</T></button>
          </div>
          <button className="st-replay" onClick={() => count()}>Count it again ↻</button>
        </div>
      </div>
    </Frame>
  )
}
