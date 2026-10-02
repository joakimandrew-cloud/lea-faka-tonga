import EntryMotif from '../components/EntryMotif.jsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion, useReducedMotion } from 'motion/react'
import quizzes from '@app/data/quizzes.json'
import chapters from '@app/data/chapters.json'
import { Md } from '../components/lesson/Blocks.jsx'
import { saveQuizScore, useProgress } from '../lib/progress.js'
import { QuizChoices, QuizExplanation } from '../components/practice/QuizParts.jsx'
import '../styles/quiz.css'

function Ring({ right, total }) {
  const r = 70, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 180 180" className="ring" aria-hidden="true">
      <circle cx="90" cy="90" r={r} className="ring-bg" />
      <Motion.circle
        cx="90" cy="90" r={r} className="ring-fg"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - right / total) }}
        transition={{ duration: 1.6, delay: .3, ease: [.16, 1, .3, 1] }}
      />
    </svg>
  )
}

function Results({ quiz, n, answers, onRetry }) {
  const total = quiz.questions.length
  const right = answers.filter((a, i) => quiz.questions[i].options[a]?.correct).length
  const { quiz: best } = useProgress()
  const nextQuiz = quizzes[String(n + 1)] ? n + 1 : null
  const line = right === total ? 'Every one right.' : right >= total * .8 ? 'Strong. A couple to revisit.' : right >= total * .5 ? 'Good start. The misses are below.' : 'Worth another read of the lesson.'
  const missed = quiz.questions.map((q, i) => ({ q, i, a: answers[i] })).filter(x => !x.q.options[x.a]?.correct)

  return (
    <Motion.div className="qz-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: [.16, 1, .3, 1] }}>
      <div className="qz-score">
        <Ring right={right} total={total} />
        <div className="qz-score-n">
          <Motion.span className="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}>{right}</Motion.span>
          <span>of {total}</span>
        </div>
      </div>
      <p className="qz-k">Lesson {n} quiz complete</p>
      <h1 className="qz-res-h display">{line}</h1>
      {best[n] && best[n].right > right && <p className="qz-best">Your best so far: {best[n].right} of {best[n].total}.</p>}

      <div className="qz-res-actions">
        {right >= total * .6 ? (
          <>
            {nextQuiz && <Link to={`/quizzes/${nextQuiz}`} className="btn btn-primary">Lesson {nextQuiz} quiz <EntryMotif size={20} index={nextQuiz - 1} /></Link>}
            <button className="btn btn-ghost" onClick={onRetry}>Try this quiz again</button>
            <Link to={`/lessons/${n}`} className="btn btn-ghost">Study Lesson {n}</Link>
          </>
        ) : (
          <>
            <Link to={`/lessons/${n}`} className="btn btn-primary">Study Lesson {n} <EntryMotif size={20} index={n - 1} /></Link>
            <button className="btn btn-ghost" onClick={onRetry}>Try this quiz again</button>
            {nextQuiz && <Link to={`/quizzes/${nextQuiz}`} className="btn btn-ghost">Lesson {nextQuiz} quiz</Link>}
          </>
        )}
      </div>

      {missed.length > 0 && (
        <div className="qz-review">
          <h2 className="qz-review-h">To revisit</h2>
          {missed.map(({ q, i, a }) => {
            const correct = q.options.find(o => o.correct)
            return (
              <div className="qz-rv" key={q.id}>
                <span className="qz-rv-n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="qz-rv-q"><Md text={q.prompt} /></p>
                  <p className="qz-rv-a no">You chose: <Md text={q.options[a].text} /></p>
                  <p className="qz-rv-a ok">Answer: <Md text={correct.text} /></p>
                  <p className="qz-rv-why"><Md text={correct.explanation} /></p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Motion.div>
  )
}

export default function Quiz() {
  const { num } = useParams()
  const n = Number(num)
  const quiz = quizzes[String(n)]
  const lesson = chapters.find(c => c.chapter === n)
  useTitle(`Lesson ${n} quiz`)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const footRef = useRef(null)
  const reduceMotion = useReducedMotion()

  const q = quiz?.questions[idx]
  const picked = answers[idx]
  const answered = picked !== undefined
  const total = quiz?.questions.length || 0
  const right = answers.filter((a, i) => quiz?.questions[i].options[a]?.correct).length

  const choose = useCallback((i) => {
    if (answered || !q) return
    setAnswers(a => { const next = [...a]; next[idx] = i; return next })
    // Bring the explanation and the Next button into view once they open.
    setTimeout(() => footRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }), reduceMotion ? 0 : 480)
  }, [answered, q, idx, reduceMotion])

  const next = useCallback(() => {
    if (!answered) return
    if (idx + 1 >= total) {
      setFinished(true)
      saveQuizScore(n, answers.filter((a, i) => quiz.questions[i].options[a]?.correct).length, total)
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    } else setIdx(idx + 1)
  }, [answered, idx, total, n, answers, quiz, reduceMotion])

  useEffect(() => {
    const onKey = (e) => {
      if (finished || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest('a, button, input, select, textarea, summary, [role="button"]')) return
      const k = e.key.toLowerCase()
      const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 }
      if (k in map && q && map[k] < q.options.length) { e.preventDefault(); choose(map[k]) }
      if (k === 'enter' && answered) { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, next, answered, q, finished])

  if (!quiz) {
    return (
      <div className="qz wrap" style={{ padding: '140px var(--gutter)' }}>
        <h1 className="display" style={{ fontSize: 64 }}>No quiz for Lesson {num}</h1>
        <Link to="/quizzes/2" className="link">Try the Lesson 2 quiz</Link>
      </div>
    )
  }

  const retry = () => { setAnswers([]); setIdx(0); setFinished(false) }
  const chosen = answered ? q.options[picked] : null

  return (
    <div className="qz">
      <div className="qz-top">
        <div className="qz-top-in">
          <Link to={`/lessons/${n}`} className="qz-close" aria-label={`Leave quiz, back to Lesson ${n}`}>×</Link>
          <div className="qz-title">
            <span className="qz-k">Lesson {n} quiz</span>
            <span className="qz-t">{lesson?.title}</span>
          </div>
          <div className="qz-segs" aria-label={`Question ${Math.min(idx + 1, total)} of ${total}`}>
            {quiz.questions.map((qq, i) => {
              const a = answers[i]
              const cls = a === undefined ? (i === idx && !finished ? 'cur' : '') : qq.options[a].correct ? 'ok' : 'no'
              return <i key={qq.id} className={cls} />
            })}
          </div>
          <span className="qz-tally" aria-live="polite">{right} right</span>
        </div>
      </div>

      <div className="qz-stage">
        <AnimatePresence mode="wait">
          {finished ? (
            <Results key="res" quiz={quiz} n={n} answers={answers} onRetry={retry} />
          ) : (
            <Motion.div
              key={q.id}
              className="qz-card"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: .45, ease: [.16, 1, .3, 1] }}
            >
              <p className="qz-count"><span className="display">{String(idx + 1).padStart(2, '0')}</span> / {total}</p>
              <h1 className="qz-q"><Md text={q.prompt} /></h1>
              <QuizChoices q={q} picked={picked} answered={answered} choose={choose} />
              <AnimatePresence>
                {chosen && <QuizExplanation q={q} chosen={chosen} />}
              </AnimatePresence>
              <div className="qz-foot" ref={footRef}>
                <span className="qz-hint kbd-only">{answered ? <>Press <kbd>Enter</kbd> to continue</> : <>Press <kbd>A</kbd>–<kbd>D</kbd> to answer</>}</span>
                <button className="btn btn-primary" onClick={next} disabled={!answered}>
                  {idx + 1 >= total ? 'See your score' : 'Next question'} <span className="arr">→</span>
                </button>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
