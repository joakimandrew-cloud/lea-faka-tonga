/**
 * PickerCore — generic "pick the right option for this prompt" mechanic.
 *
 * Used by all the M2-shape drills (Preposition Selector, Article Picker,
 * Question-Word Picker, etc.). The drill-specific Core wrappers configure
 * options, prompts, and the question text; PickerCore handles deck
 * shuffling, scoring, reveal, and the inline feedback.
 *
 * Data shape:
 *   options = [{ id, label, detail?, category? }]
 *   prompts = [{ tongan, english, answer, why }]
 *
 *   `detail` is the English gloss. Hidden until the student answers,
 *   then fades in so meanings become visible without leaking the answer.
 *
 *   `category` is optional. When any option carries a category string,
 *   options are grouped under category headers (e.g. Place / Person /
 *   Pronoun). When no option has a category, options render as a flat
 *   grid — existing drills don't need migration.
 *
 *   `why` is a single string explaining the correct answer. The wrong-
 *   state feedback is auto-composed as "The answer is X, not Y. {why}".
 */
import { useState, useRef, useEffect } from 'react'

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function PickerCore({
  options,
  prompts,
  question,
  promptLabel,
}) {
  const [deck, setDeck] = useState(() => shuffle(prompts))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const cardRef = useRef(null)

  const current = deck[idx]
  const isAnswered = guess !== null
  const isCorrect = isAnswered && guess === current.answer
  const answerOption = options.find(o => o.id === current.answer)
  const guessOption = isAnswered ? options.find(o => o.id === guess) : null

  const handleGuess = (optionId) => {
    if (isAnswered) return
    setGuess(optionId)
    const right = optionId === current.answer
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => right ? s + 1 : 0)
  }

  const handleNext = () => {
    if (idx < deck.length - 1) {
      setIdx(idx + 1)
    } else {
      setDeck(shuffle(prompts))
      setIdx(0)
    }
    setGuess(null)
    requestAnimationFrame(() => {
      const rect = cardRef.current?.getBoundingClientRect()
      if (rect && rect.top < 0) {
        cardRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    })
  }

  const handleReset = () => {
    setDeck(shuffle(prompts))
    setIdx(0)
    setGuess(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  // Keyboard shortcuts: 1..9 pick option (in displayed order); Enter advances.
  // When multiple drills are open on a chapter page, only the card whose
  // bounds contain the viewport centre responds — keeps `1` from answering
  // every drill at once. Re-subscribes each render so the handler always
  // reads current state (cheap; happens at most a few times per answer).
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const rect = cardRef.current?.getBoundingClientRect()
      if (!rect) return
      const centerY = window.innerHeight / 2
      if (rect.top > centerY || rect.bottom < centerY) return
      if (isAnswered) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleNext()
        }
        return
      }
      if (/^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10)
        if (n >= 1 && n <= Math.min(9, options.length)) {
          e.preventDefault()
          handleGuess(options[n - 1].id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Render the Tongan prompt with the blank styled; fill it in after answer.
  const renderTongan = (text) => {
    if (!text.includes('___')) return text
    const [before, after] = text.split('___')
    const blankCls = !isAnswered
      ? 'pcs-blank'
      : isCorrect
        ? 'pcs-blank is-filled-correct'
        : 'pcs-blank is-filled-wrong'
    return (
      <>
        {before}
        <span className={blankCls}>
          {isAnswered && (
            <span className="pcs-blank-word">{guessOption?.label}</span>
          )}
        </span>
        {after}
      </>
    )
  }

  // Group options by `category` when any option declares one.
  const hasCategories = options.some(o => o.category)
  const groups = hasCategories
    ? Array.from(
        options.reduce((map, o) => {
          const k = o.category || 'Other'
          if (!map.has(k)) map.set(k, [])
          map.get(k).push(o)
          return map
        }, new Map())
      )
    : [[null, options]]

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (isAnswered ? 1 : 0)) / deck.length) * 100 : 0
  const use3Cols = hasCategories || options.length >= 6

  let keyCounter = 0

  const renderOption = (o, keyIndex) => {
    const isChosen = isAnswered && guess === o.id
    const isTheAnswer = isAnswered && current.answer === o.id
    let cls = ''
    if (isAnswered) {
      if (isChosen && isCorrect) cls = 'is-answer'
      else if (isChosen && !isCorrect) cls = 'is-chosen-wrong'
      else if (!isChosen && !isCorrect && isTheAnswer) cls = 'is-revealed-answer'
      else cls = 'is-dim'
    }
    return (
      <button
        key={o.id}
        type="button"
        onClick={() => handleGuess(o.id)}
        disabled={isAnswered}
        className={`pcs-btn ${cls}`}
      >
        {keyIndex <= 9 && !isAnswered && (
          <span className="pcs-btn-key" aria-hidden="true">{keyIndex}</span>
        )}
        <span className="pcs-btn-label">{o.label}</span>
        {o.detail && <span className="pcs-btn-principle">{o.detail}</span>}
        {isChosen && isCorrect && (
          <span className="pcs-btn-feedback">
            <span className="pcs-btn-feedback-icon" aria-hidden="true">{'\u2713'}</span>
            <span className="pcs-btn-feedback-body">
              <span className="pcs-btn-verdict">That{'\u2019'}s right.</span>
              <span className="pcs-btn-why">{current.why}</span>
            </span>
          </span>
        )}
        {isChosen && !isCorrect && (
          <span className="pcs-btn-feedback">
            <span className="pcs-btn-feedback-icon" aria-hidden="true">{'\u2715'}</span>
            <span className="pcs-btn-feedback-body">
              <span className="pcs-btn-verdict">Not quite.</span>
              <span className="pcs-btn-why">
                The answer is <strong>{answerOption.label}</strong>, not{' '}
                <strong>{o.label}</strong>. {current.why}
              </span>
            </span>
          </span>
        )}
      </button>
    )
  }

  return (
    <section ref={cardRef} className={`pcs-card${isAnswered ? ' is-answered' : ''}`}>
      <div className="pcs-card-row">
        <div className="pcs-progress-wrap">
          <span className="pcs-progress">{idx + 1} / {deck.length}</span>
          <div className="pcs-progress-bar">
            <div className="pcs-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="pcs-stats">
          <span className={`pcs-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="pcs-stat-value">{score.right}</span>
            <span className="pcs-stat-label"> / {score.total} correct</span>
          </span>
          {streak > 1 && (
            <span className="pcs-stat pcs-streak">
              <span className="pcs-stat-value">{streak}</span>
              <span className="pcs-stat-label"> in a row</span>
            </span>
          )}
          <button onClick={handleReset} className="pcs-reset" type="button" aria-label="Reset">reset</button>
        </div>
      </div>

      <div className="pcs-noun-frame">
        {promptLabel && <div className="pcs-prompt-label">{promptLabel}</div>}
        <div className="pcs-noun">{renderTongan(current.tongan)}</div>
        <div className="pcs-noun-gloss">{current.english}</div>
      </div>

      <div className="pcs-question">{question}</div>

      <div className="pcs-option-groups">
        {groups.map(([cat, opts]) => (
          <div key={cat ?? '__all'} className="pcs-category-group">
            {cat && (
              <div className="pcs-category-header">
                <span className="pcs-category-label">{cat}</span>
                <span className="pcs-category-line" />
              </div>
            )}
            <div className={`pcs-buttons${use3Cols ? ' pcs-buttons-3' : ''}`}>
              {opts.map(o => {
                keyCounter += 1
                return renderOption(o, keyCounter)
              })}
            </div>
          </div>
        ))}
      </div>

      {isAnswered && (
        <div className="pcs-next-container">
          <span className="pcs-keyboard-hint">Press <kbd>{'\u21B5'}</kbd> to continue</span>
          <button onClick={handleNext} className="pcs-next" type="button">
            Next {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
