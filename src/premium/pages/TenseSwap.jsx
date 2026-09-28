import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { ALL_EXAMPLES, TENSES } from '../data/tense-swap.js'
import { DrillSentence as Sentence, DrillChoices, DrillFeedback } from '../components/practice/DrillParts.jsx'
import { KupesiTile, TILE_KEYS } from '../components/Kupesi.jsx'
import '../styles/drill.css'

const ORDER = ['past', 'present', 'perfect', 'future']
const LABEL = Object.fromEntries(TENSES.map(t => [t.id, t.english_label]))
const ROUNDS = 10

function shuffle(a) { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] } return o }

/* Explore: slide through the tenses, watch only the marker move. */
function Explore({ exIdx, setExIdx }) {
  const [t, setT] = useState(0)
  const [neg, setNeg] = useState(false)
  const ex = ALL_EXAMPLES[exIdx]
  const pol = neg ? 'negative' : 'affirmative'
  const tense = ORDER[t]

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return
      if (e.key === 'ArrowRight') setT(v => Math.min(3, v + 1))
      if (e.key === 'ArrowLeft') setT(v => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="dr-explore">
      <div className="dr-stage">
        <Sentence particle={ex.perTense[pol][tense]} body={ex.body} />
        <AnimatePresence mode="wait">
          <Motion.p key={ex.english[pol][tense]} className="dr-en" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3 }}>
            {ex.english[pol][tense]}
          </Motion.p>
        </AnimatePresence>
      </div>

      <div className="dr-track" role="radiogroup" aria-label="Tense">
        <div className="dr-rail" aria-hidden="true">
          <Motion.span className="dr-fill" animate={{ width: `${(t / 3) * 100}%` }} transition={{ type: 'spring', stiffness: 260, damping: 30 }} />
        </div>
        {ORDER.map((id, i) => (
          <button key={id} role="radio" aria-checked={t === i} className={`dr-stop ${t === i ? 'is-on' : ''} ${i < t ? 'is-past' : ''}`} onClick={() => setT(i)}>
            <span className="dr-knob">{t === i && <Motion.span layoutId="knob" className="dr-knob-on" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}</span>
            <span className="dr-stop-l">{LABEL[id]}</span>
            <span className="dr-stop-p" lang="to">{ex.perTense[pol][id]}</span>
          </button>
        ))}
      </div>

      <div className="dr-row">
        <div className="dr-pol" role="radiogroup" aria-label="Positive or negative">
          <button role="radio" aria-checked={!neg} className={!neg ? 'is-on' : ''} onClick={() => setNeg(false)}>Positive</button>
          <button role="radio" aria-checked={neg} className={neg ? 'is-on' : ''} onClick={() => setNeg(true)}>Negative</button>
        </div>
        <p className={`dr-hint ${neg ? '' : 'dr-hint-keys'}`}>{neg ? 'The negative is taught in Lesson 9.' : 'Use ← → to move through the tenses.'}</p>
      </div>

      <p className="dr-note">{ex.hint}</p>

      <div className="dr-examples">
        {ALL_EXAMPLES.map((e, i) => (
          <button key={e.id} className={`dr-exb ${i === exIdx ? 'is-on' : ''}`} onClick={() => setExIdx(i)} aria-pressed={i === exIdx}>
            <span className="dr-exb-t">{e.title}</span>
            <span className="dr-exb-l">From Lesson {e.minChapter}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* Test me: read the English, pick the words that go in front of the verb. */
function Test({ onExit }) {
  const makeDeck = () => shuffle(ALL_EXAMPLES.filter(e => e.minChapter <= 19).flatMap(e => ORDER.map(t => ({ e, t })))).slice(0, ROUNDS)
  const [deck, setDeck] = useState(makeDeck)
  const [i, setI] = useState(0)
  const [pick, setPick] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const done = i >= deck.length
  const card = deck[i]
  const options = useMemo(() => (card ? shuffle(ORDER.map(t => ({ t, p: card.e.perTense.affirmative[t] }))) : []), [card])
  const correct = card?.e.perTense.affirmative[card.t]

  const choose = useCallback((o) => {
    if (pick) return
    setPick(o)
    if (o.p === correct) { setScore(s => s + 1); setStreak(s => s + 1) } else setStreak(0)
  }, [pick, correct])
  const next = useCallback(() => { setPick(null); setI(v => v + 1) }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (done) return
      const n = Number(e.key)
      if (n >= 1 && n <= 4 && !pick) choose(options[n - 1])
      if (e.key === 'Enter' && pick && !e.target.closest('button, a, input, textarea, select')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, next, options, pick, done])

  if (done) {
    return (
      <Motion.div className="dr-done" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .6, ease: [.16, 1, .3, 1] }}>
        <div className="dr-done-tiles" aria-hidden="true">
          {[...Array(ROUNDS)].map((_, k) => (
            <Motion.span key={k} initial={{ opacity: 0, y: 20, rotate: -20 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: k * .06, duration: .6, ease: [.16, 1, .3, 1] }}>
              <KupesiTile kind={TILE_KEYS[k % TILE_KEYS.length]} framed invert={k >= score} />
            </Motion.span>
          ))}
        </div>
        <p className="dr-done-k">Round complete</p>
        <h2 className="dr-done-h display">{score} of {ROUNDS} right</h2>
        <p className="dr-done-p">{score === ROUNDS ? 'Every marker in the right place.' : 'Each lit tile is one you placed. Go again and light the rest.'}</p>
        <div className="dr-done-a">
          <button className="btn btn-primary" onClick={() => { setDeck(makeDeck()); setI(0); setPick(null); setScore(0); setStreak(0) }}>Go again <span className="arr">↻</span></button>
          <button className="btn btn-ghost" onClick={onExit}>Back to explore</button>
          <Link to="/lessons/2" className="btn btn-ghost">Study Lesson 2</Link>
        </div>
      </Motion.div>
    )
  }

  const right = pick && pick.p === correct
  return (
    <div className="dr-test">
      <div className="dr-test-top">
        <span className="dr-count"><strong>{i + 1}</strong> / {deck.length}</span>
        <div className="dr-dots">{deck.map((_, k) => <i key={k} className={k < i ? 'past' : k === i ? 'cur' : ''} />)}</div>
        <span className={`dr-streak ${streak >= 3 ? 'is-hot' : ''}`}>{streak >= 2 ? `${streak} in a row` : `${score} right`}</span>
      </div>
      <p className="dr-ask">Say it in Tongan</p>
      <AnimatePresence mode="wait">
        <Motion.p key={i} className="dr-target" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: .35 }}>
          {card.e.english.affirmative[card.t]}
        </Motion.p>
      </AnimatePresence>
      <div className={`dr-stage is-test ${pick ? (right ? 'is-right' : 'is-wrong') : ''}`}>
        <Sentence particle={pick ? correct : null} body={card.e.body} pending={!pick} />
      </div>
      <DrillChoices options={options} pick={pick} correct={correct} choose={choose} />
      <AnimatePresence>
        {pick && (
          <Motion.div className="dr-feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <DrillFeedback card={card} pick={pick} correct={correct} right={right} />
            <button className="btn btn-primary btn-sm" onClick={next} autoFocus>{i + 1 >= deck.length ? 'See your round' : 'Next'} <span className="arr">→</span></button>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TenseSwap() {
  useTitle('Drill: change the tense with one word')
  const [mode, setMode] = useState('explore')
  const [exIdx, setExIdx] = useState(0)
  return (
    <div className="dr band grain">
      <div className="dr-glow" aria-hidden="true" />
      <div className="dr-in">
        <header className={`dr-head ${mode === 'test' ? 'is-test' : ''}`}>
          <div>
            <p className="eyebrow">Drill · Tense and the verb</p>
            <h1 className={`dr-h1 display ${mode === 'test' ? 'is-compact' : ''}`}>Change the tense with one word.</h1>
          </div>
          <div className="dr-mode" role="tablist" aria-label="Mode">
            {[['explore', 'Explore'], ['test', 'Test me']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? 'is-on' : ''} onClick={() => setMode(k)}>
                {mode === k && <Motion.span layoutId="mode-pill" className="dr-mode-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span>{l}</span>
              </button>
            ))}
          </div>
        </header>
        <AnimatePresence mode="wait">
          <Motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .35 }}>
            {mode === 'explore' ? <Explore exIdx={exIdx} setExIdx={setExIdx} /> : <Test onExit={() => setMode('explore')} />}
          </Motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
