/**
 * The homepage signature: one Tongan sentence, four times. The verb never moves;
 * only the words in front of it change. Data: the reviewed Tense Swapper examples
 * (pronoun subjects, Lesson 2 and up), copied verbatim into src/data/tense-swap.js.
 */
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { ALL_EXAMPLES, TENSES } from '../data/tense-swap.js'

const EXAMPLES = ALL_EXAMPLES.filter(e => e.minChapter <= 2)
const ORDER = ['past', 'present', 'perfect', 'future']
const TICK = 2600

const roll = {
  initial: { y: '70%', opacity: 0, filter: 'blur(6px)' },
  animate: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: { y: '-70%', opacity: 0, filter: 'blur(6px)' },
}

export default function TenseMachine({ compact = false }) {
  const [ex, setEx] = useState(0)
  const [t, setT] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hold, setHold] = useState(false)
  const holdTimer = useRef(null)
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (paused || hold || reduce) return
    const id = setTimeout(() => {
      if (t === ORDER.length - 1) { setT(0); setEx(e => (e + 1) % EXAMPLES.length) }
      else setT(t + 1)
    }, TICK)
    return () => clearTimeout(id)
  }, [t, ex, paused, hold, reduce])

  const pick = (i) => {
    setT(i)
    setHold(true)
    clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => setHold(false), 9000)
  }
  const nextExample = () => { setEx(e => (e + 1) % EXAMPLES.length); setT(0); pick(0) }

  const example = EXAMPLES[ex]
  const tense = ORDER[t]
  const particle = example.perTense.affirmative[tense]
  const english = example.english.affirmative[tense]
  const stopped = paused || hold

  return (
    <div
      className={`tm ${compact ? 'is-compact' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="tm-top">
        <span className="tm-label">Watch the verb</span>
        <button className="tm-next" onClick={nextExample} aria-label="Show another sentence">
          Another sentence <span aria-hidden="true">↻</span>
        </button>
      </div>

      <div className="tm-stage" aria-live="polite">
        <div className="tm-sentence">
          <div className="tm-col">
            <span className="tm-slot tm-particle" lang="to">
              <AnimatePresence mode="popLayout" initial={false}>
                <Motion.span key={particle + ex} {...roll} transition={{ duration: .55, ease: [.16, 1, .3, 1] }} className="tm-word">
                  {particle}
                </Motion.span>
              </AnimatePresence>
            </span>
            <span className="tm-tag tm-tag-when" aria-hidden="true">when + who</span>
          </div>
          <div className="tm-col">
            <span className="tm-slot tm-verb" lang="to">
              <AnimatePresence mode="popLayout" initial={false}>
                <Motion.span
                  key={example.body}
                  initial={{ opacity: 0, scale: .92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: .5, ease: [.16, 1, .3, 1] }}
                  className="tm-word"
                >
                  <span className="tm-verb-w">{example.body}</span>.
                </Motion.span>
              </AnimatePresence>
            </span>
            <span className="tm-tag tm-tag-verb" aria-hidden="true">the verb · same form</span>
          </div>
        </div>
        <div className="tm-english">
          <AnimatePresence mode="wait" initial={false}>
            <Motion.span key={english} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .3 }}>
              {english}
            </Motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="tm-chips" role="tablist" aria-label="Tense">
        {ORDER.map((id, i) => {
          const label = TENSES.find(x => x.id === id).english_label
          const on = i === t
          return (
            <button
              key={id}
              role="tab"
              aria-selected={on}
              className={`tm-chip ${on ? 'is-on' : ''}`}
              onClick={() => pick(i)}
            >
              <span className="tm-chip-t">{label}</span>
              <span className="tm-chip-p" lang="to">{example.perTense.affirmative[id]}</span>
              {on && !stopped && !reduce && <span className="tm-chip-bar" style={{ animationDuration: `${TICK}ms` }} key={`${ex}-${t}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
