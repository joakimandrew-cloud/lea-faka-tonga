import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/v11-components.css'

// ---------------------------------------------------------------------------
// Render a snippet that may include Tongan glyphs or inline emphasis.
// Words wrapped in single *...* get the font-tongan italic treatment.
// ---------------------------------------------------------------------------

function renderInline(text) {
  if (!text) return null
  const parts = []
  let i = 0
  let key = 0
  while (i < text.length) {
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1) {
        parts.push(
          <span key={key++} className="font-tongan">
            {text.slice(i + 1, end)}
          </span>
        )
        i = end + 1
        continue
      }
      // Unbalanced trailing '*': emit as literal and advance so we can't loop forever.
      parts.push(<span key={key++}>*</span>)
      i++
      continue
    }
    const next = text.indexOf('*', i)
    const chunk = next === -1 ? text.slice(i) : text.slice(i, next)
    if (chunk) parts.push(<span key={key++}>{chunk}</span>)
    i = next === -1 ? text.length : next
  }
  return parts
}

export default function QuizRunner({ quiz, chapter }) {
  const { questions } = quiz

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selections, setSelections] = useState({})
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setCurrentIndex(0)
    setSelections({})
    setScore(0)
    setFinished(false)
  }, [quiz.chapter])

  const question = questions[currentIndex]
  if (!question) return null

  const selectedLabel = selections[currentIndex] ?? null
  const submitted = selectedLabel !== null

  const isLast = currentIndex + 1 >= questions.length
  const isFirst = currentIndex === 0

  const handleSelect = (label) => {
    if (submitted) return
    const picked = question.options.find(o => o.label === label)
    setSelections(prev => ({ ...prev, [currentIndex]: label }))
    if (picked?.correct) {
      setScore(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (isFirst) return
    setCurrentIndex(i => i - 1)
  }

  const handleNext = () => {
    if (!submitted) return
    if (isLast) {
      setFinished(true)
      return
    }
    setCurrentIndex(i => i + 1)
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelections({})
    setScore(0)
    setFinished(false)
  }

  // ── Finish screen ─────────────────────────────────────────────────────
  if (finished) {
    const perfect = score === questions.length
    return (
      <div className="quiz">
        <div className="quiz-finish">
          <div className="quiz-finish-score">
            {score} / {questions.length} correct
          </div>
          <p className="quiz-finish-message">
            {perfect
              ? 'Perfect score!'
              : score >= questions.length / 2
                ? 'Good work. Review the misses and try again.'
                : 'Revisit the lesson and come back to try again.'}
          </p>
          <button onClick={handleRestart} className="quiz-finish-btn">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Active quiz ───────────────────────────────────────────────────────
  const eyebrow = `LESSON ${quiz.chapter} · ${quiz.title.toUpperCase()}`

  return (
    <div className="quiz">
      {/* ── Meta row ── */}
      <div className="quiz-meta">
        <span className="quiz-count">
          Question {String(currentIndex + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
        </span>
        <span>Score · {String(score).padStart(2, '0')} correct</span>
      </div>

      {/* ── Progress bar ── */}
      <div className="quiz-progress">
        <span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {/* ── Chapter eyebrow ── */}
      <div className="quiz-eyebrow">
        <span className="quiz-eyebrow-label">{eyebrow}</span>
        {chapter && (
          <Link
            to={`/chapters/${quiz.chapter}`}
            className="quiz-eyebrow-link"
          >
            Study Lesson {quiz.chapter}: {chapter.title} →
          </Link>
        )}
      </div>

      {/* ── Question ── */}
      <p className="quiz-question">{renderInline(question.prompt)}</p>

      {/* ── Options ── */}
      {question.options.map(opt => {
        const isThisCorrect = opt.correct
        const isUserPick = opt.label === selectedLabel
        const showCorrect = submitted && isThisCorrect
        const showWrongPick = submitted && isUserPick && !isThisCorrect

        const stateClass = showCorrect ? ' is-correct' : showWrongPick ? ' is-wrong' : ''

        return (
          <button
            key={opt.label}
            onClick={() => handleSelect(opt.label)}
            disabled={submitted}
            className={`quiz-option${stateClass}`}
          >
            <span className="quiz-letter">{opt.label}</span>
            <div className="quiz-option-body">
              <div className="quiz-option-text">
                <span>{renderInline(opt.text)}</span>
                {showCorrect && <span className="quiz-check">✓</span>}
                {showWrongPick && <span className="quiz-wrong">✗</span>}
              </div>
              {submitted && (
                <div className="quiz-explanation">
                  {showCorrect && isUserPick && (
                    <div className="quiz-feedback is-correct">That's right!</div>
                  )}
                  {showWrongPick && (
                    <div className="quiz-feedback is-wrong">Not quite.</div>
                  )}
                  <div className="quiz-explanation-text">
                    {renderInline(opt.explanation)}
                  </div>
                </div>
              )}
            </div>
          </button>
        )
      })}

      {/* ── Footer nav ── */}
      <div className="quiz-nav">
        <button
          onClick={handlePrevious}
          disabled={isFirst}
          className="quiz-nav-btn"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!submitted}
          className="quiz-nav-btn is-primary"
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  )
}
