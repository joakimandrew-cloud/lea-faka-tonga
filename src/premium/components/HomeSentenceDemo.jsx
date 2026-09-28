import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'motion/react'
import T from './T.jsx'
import { PREFIXES, SENTENCE_CYCLE, TENSES } from '../data/home-sentence-cycle.js'
import '../styles/home-sentence-film.css'

const TICK = 3200
const roll = {
  initial: { y: '65%', opacity: 0, filter: 'blur(5px)' },
  animate: { y: '0%', opacity: 1, filter: 'blur(0px)' },
  exit: { y: '-65%', opacity: 0, filter: 'blur(5px)' },
}

export default function HomeSentenceDemo() {
  const [cursor, setCursor] = useState({ example: 0, tense: 1, beat: 0 })
  const [playing, setPlaying] = useState(true)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const stage = useRef(null)
  const reduceMotion = useReducedMotion()
  const running = playing && !reduceMotion
  const active = running && inView && pageVisible
  const example = SENTENCE_CYCLE[cursor.example]
  const prefixes = PREFIXES[example.person]
  const prefix = prefixes[cursor.tense]

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .5), { threshold: .5 })
    observer.observe(stage.current)
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setCursor(current => current.beat === 1
      ? { example: (current.example + 1) % SENTENCE_CYCLE.length, tense: current.tense, beat: 0 }
      : { ...current, tense: (current.tense + 1) % TENSES.length, beat: current.beat + 1 }), TICK)
    return () => clearTimeout(timer)
  }, [active, cursor])

  const chooseTense = tense => {
    setPlaying(false)
    setCursor(current => ({ ...current, tense, beat: 0 }))
  }
  const another = () => {
    setPlaying(false)
    setCursor(current => ({ ...current, example: (current.example + 1) % SENTENCE_CYCLE.length, beat: 0 }))
  }

  return (
    <div className="wr-sentence-cycle" data-playback-state={reduceMotion ? 'reduced-motion' : !playing ? 'paused' : !inView ? 'offscreen' : !pageVisible ? 'hidden' : 'playing'}>
      <div className="wr-sentence-cycle__card" onFocusCapture={event => { if (!event.target.closest('[data-playback]')) setPlaying(false) }}>
        <div className="wr-sentence-cycle__top">
          <span className="wr-sentence-cycle__eyebrow"><span aria-hidden="true" />Watch the pattern</span>
          <div className="wr-sentence-cycle__controls">
            {!reduceMotion && <button type="button" data-playback className="wr-sentence-cycle__play" onClick={() => setPlaying(!running)} aria-label={running ? 'Pause the example' : 'Play the example'}>{running ? 'Pause' : 'Play'}</button>}
            <button type="button" className="wr-sentence-cycle__another" onClick={another}>Another sentence <span aria-hidden="true">↻</span></button>
          </div>
        </div>
        <div ref={stage} className="wr-sentence-cycle__stage">
          <div className="wr-sentence-cycle__sentence" aria-hidden="true">
            <div className="wr-sentence-cycle__column wr-sentence-cycle__prefix">
              <span className="wr-sentence-cycle__slot">
                <AnimatePresence initial={false}>
                  <Motion.span key={prefix} {...(reduceMotion ? {} : roll)} transition={{ duration: .55, ease: [.16, 1, .3, 1] }}><T>{prefix}</T></Motion.span>
                </AnimatePresence>
              </span>
              <span className="wr-sentence-cycle__tag">When + who</span>
            </div>
            <div className="wr-sentence-cycle__column wr-sentence-cycle__body">
              <span className="wr-sentence-cycle__slot">
                <AnimatePresence initial={false}>
                  <Motion.span key={example.body} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .3 }}><T>{example.body}.</T></Motion.span>
                </AnimatePresence>
              </span>
              <span className="wr-sentence-cycle__tag">{example.kind} · same form</span>
            </div>
          </div>
          <div aria-live={running ? 'off' : 'polite'} aria-atomic="true">
            <span className="wr-sentence-cycle__sr"><T>{`${prefix} ${example.body}.`}</T></span>
            <p className="wr-sentence-cycle__english">{example.english[cursor.tense]}</p>
          </div>
        </div>
        <div className="wr-sentence-cycle__tenses" role="group" aria-label="Choose a tense">
          {TENSES.map((tense, index) => (
            <button key={tense.id} type="button" aria-pressed={index === cursor.tense} onClick={() => chooseTense(index)}>
              <span className="wr-sentence-cycle__tense-label">{tense.label}</span>
              <T>{prefixes[index]}</T>
              {index === cursor.tense && active && <span key={`${cursor.example}-${cursor.beat}`} className="wr-sentence-cycle__timer" style={{ animationDuration: `${TICK}ms` }} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      <p className="wr-sentence-cycle__note">The opening words tell you when and who. The main word keeps its form.<br />
        <Link to="/lessons/2">Tense &amp; pronouns · Lesson 2</Link><span className="wr-sentence-cycle__note-separator" aria-hidden="true"> / </span><Link to="/lessons/3">Verbs &amp; adjectives · Lesson 3</Link>
      </p>
    </div>
  )
}
