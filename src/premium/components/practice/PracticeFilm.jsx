import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, MotionConfig, useReducedMotion } from 'motion/react'
import { DRILL_PREVIEW_CARDS, PRACTICE_ORDER, practiceDuration, practiceFrame, shouldAdvancePreview } from '../../lib/practice-film.js'
import { Md } from '../lesson/Blocks.jsx'
import { DrillSentence, DrillChoices, DrillFeedback } from './DrillParts.jsx'
import { QuizChoices, QuizExplanation } from './QuizParts.jsx'
import PracticeCard from './PracticeCard.jsx'
import '../../styles/drill.css'
import '../../styles/quiz.css'
import '../../styles/cards.css'

function DrillScene({ frame, still }) {
  const card = DRILL_PREVIEW_CARDS[frame.exampleIndex]
  const options = PRACTICE_ORDER.map(t => ({ t, p: card.e.perTense.affirmative[t] }))
  const correct = options.find(option => option.t === card.t)
  return <div className="dr practice-drill">
    <p className="dr-ask">Say it in Tongan</p>
    <p className="dr-target">{card.e.english.affirmative[card.t]}</p>
    <div className={`dr-stage is-test ${frame.feedback ? 'is-right' : ''}`}>
      <DrillSentence particle={frame.feedback ? correct.p : null} body={card.e.body} pending={!frame.feedback} still={still} />
    </div>
    <DrillChoices options={options} pick={frame.selected ? correct : null} correct={correct.p} demo />
    <div className="practice-drill__feedback">
      {frame.feedback && <div className="dr-feedback"><DrillFeedback card={card} pick={correct} correct={correct.p} right /></div>}
    </div>
  </div>
}

function QuizScene({ frame, question, still }) {
  const picked = question.options.findIndex(option => option.correct)
  return <div className="qz-card practice-quiz">
    <p className="qz-q"><Md text={question.prompt} /></p>
    <QuizChoices q={question} picked={frame.selected ? picked : null} answered={frame.selected} demo />
    <div className="practice-quiz__feedback">
      {frame.feedback && <QuizExplanation q={question} chosen={question.options[picked]} still={still} />}
    </div>
  </div>
}

function CardsScene({ frame, words }) {
  return <div className="practice-cards">
    <div className="cards-main">
      <div className="pile pile-again"><span className="pile-n display">0</span><span className="pile-l">Again</span></div>
      <div className="deck">
        <AnimatePresence custom={1}>
          {words.slice(frame.advanced ? 1 : 0).map((word, i) => <PracticeCard key={word.id} word={word} depth={i} flipped={i === 0 && frame.flipped} front="to" demo />)}
        </AnimatePresence>
      </div>
      <div className={`pile pile-known ${frame.known ? 'is-earned' : ''}`}><span className="pile-n display">{frame.advanced ? 1 : 0}</span><span className="pile-l">Got it</span></div>
    </div>
    <div className="cards-actions" aria-hidden="true"><span className="ca again">Again</span><span className={`ca flip ${frame.flipped && !frame.known ? 'is-demo-active' : ''}`}>Turn</span><span className={`ca known ${frame.known ? 'is-demo-active' : ''}`}>Got it</span></div>
  </div>
}

export default function PracticeFilm({ surface, autoCycle, playing, setPlaying, onComplete, onHold, onReplay }) {
  const stage = useRef(null)
  const [sample, setSample] = useState(null)
  const [failed, setFailed] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const reduceMotion = useReducedMotion()
  const ready = surface.id === 'drills' || Boolean(sample)
  const duration = practiceDuration(surface.id)
  const finished = elapsed >= duration
  const running = ready && visible && pageVisible && playing && !finished && !reduceMotion
  const frame = practiceFrame(surface.id, reduceMotion ? (surface.id === 'cards' ? 1500 : duration) : elapsed)

  useEffect(() => {
    let live = true
    if (surface.id === 'quizzes') import('@app/data/quizzes.json').then(data => { if (live) setSample(data.default['6'].questions.find(question => question.id === 'q3')) }).catch(() => { if (live) setFailed(true) })
    if (surface.id === 'cards') import('@app/data/book-vocabulary.json').then(data => {
      const words = ['kai', 'inu', 'mohe'].map(text => data.default.find(row => row.tongan === text && row.chapter === 1))
      if (words.some(word => !word)) throw new Error('Missing existing vocabulary')
      if (live) setSample(words.map(word => ({ id: word.tongan, to: word.tongan, en: word.english, type: word.part_of_speech })))
    }).catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [surface.id])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= .25), { threshold: [0, .25] })
    observer.observe(stage.current)
    const onVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  useEffect(() => {
    if (!running) return
    let previous = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const delta = now - previous
      previous = now
      setElapsed(value => Math.min(duration, value + delta))
    }, 100)
    return () => clearInterval(timer)
  }, [running, duration])

  useEffect(() => {
    if (shouldAdvancePreview({ finished, autoCycle, playing, visible, pageVisible, reduceMotion })) onComplete()
  }, [finished, autoCycle, playing, visible, pageVisible, reduceMotion, onComplete])

  const playback = reduceMotion ? 'still' : finished ? 'finished' : !playing ? 'paused' : !visible ? 'offscreen' : !pageVisible ? 'hidden' : running ? 'playing' : 'loading'
  return (
    <div className="practice-film" data-playback-state={playback} data-frame={JSON.stringify(frame)}>
      <div className="practice-film__heading"><h3>{surface.description}</h3>{surface.id === 'drills' && <span className="practice-film__count" aria-label={`Example ${frame.exampleIndex + 1} of ${DRILL_PREVIEW_CARDS.length}`}>{frame.exampleIndex + 1} / {DRILL_PREVIEW_CARDS.length}</span>}</div>
      <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'} transition={reduceMotion ? { duration: 0 } : undefined}>
        <div ref={stage} className={`practice-film__stage wr-inner is-${surface.id}`}>
          {!ready ? <p className="practice-loading" role="status">{failed ? 'This preview could not load. You can still open the activity below.' : 'Loading the practice preview…'}</p>
            : surface.id === 'drills' ? <DrillScene key={frame.exampleIndex} frame={frame} still={reduceMotion} />
              : surface.id === 'quizzes' ? <QuizScene frame={frame} question={sample} still={reduceMotion} /> : <CardsScene frame={frame} words={sample} />}
        </div>
      </MotionConfig>
      <div className="practice-film__footer">
        <div className="practice-film__playback">
          {!reduceMotion && <button type="button" data-practice-playback disabled={!ready} onClick={() => { if (finished) { setElapsed(0); onReplay() } else setPlaying(value => !value) }} aria-label={finished ? 'Replay previews' : playing ? 'Pause preview' : 'Play preview'}><span aria-hidden="true">{finished ? '↻' : playing ? 'Ⅱ' : '▷'}</span>{finished ? 'Replay all' : playing ? 'Pause' : 'Play'}</button>}
        </div>
        <Link className="wr-home__button wr-home__button--primary" to={surface.to} onPointerEnter={onHold}>Try {surface.name.toLowerCase()}</Link>
      </div>
    </div>
  )
}
