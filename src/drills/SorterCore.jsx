/**
 * SorterCore — generic "sort cards into N bins" mechanic.
 *
 * Used by PossessiveSorter (2 bins: e_class / ho_class) and
 * FakaSorter (4 bins: manner / causative / temporal / pertaining-to-one).
 *
 * Pure mechanic + state. No page chrome. No side lesson panel.
 * Pages and chapter anchors compose this with their own framing.
 *
 * Shares the .pcs-* visual chrome with PickerCore: meanings hidden
 * until an answer is locked in; verdict + "why" render inline inside
 * the chosen tile; the correct bin reveals in green when the student
 * picks wrong.
 */
import { useState, useEffect, useRef } from 'react'

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function SorterCore({
  categories,
  cards,
  question,
  formatRightForm,
  formatWrongForm,
  rightFormNote,
  wrongFormNote,
}) {
  const [deck, setDeck] = useState(() => shuffle(cards))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const cardRef = useRef(null)

  const current = deck[idx]
  const isAnswered = guess !== null
  const isCorrect = isAnswered && guess === current.category
  const answerCategory = categories.find(c => c.id === current.category)
  const guessCategory = isAnswered ? categories.find(c => c.id === guess) : null

  const rightForm = formatRightForm ? formatRightForm(current) : null
  const wrongForm = formatWrongForm ? formatWrongForm(current, guess) : null
  const rightNote = isAnswered && rightFormNote ? rightFormNote(current) : null
  const wrongNote = isAnswered && !isCorrect && wrongFormNote ? wrongFormNote(current, guess) : null

  const handleGuess = (categoryId) => {
    if (isAnswered) return
    setGuess(categoryId)
    const right = categoryId === current.category
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => right ? s + 1 : 0)
  }

  const handleNext = () => {
    if (idx < deck.length - 1) {
      setIdx(idx + 1)
    } else {
      setDeck(shuffle(cards))
      setIdx(0)
    }
    setGuess(null)
  }

  const handleReset = () => {
    setDeck(shuffle(cards))
    setIdx(0)
    setGuess(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

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
        if (n >= 1 && n <= Math.min(9, categories.length)) {
          e.preventDefault()
          handleGuess(categories[n - 1].id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (isAnswered ? 1 : 0)) / deck.length) * 100 : 0
  const use3Cols = categories.length >= 3

  const renderCategory = (c, keyIndex) => {
    const isChosen = isAnswered && guess === c.id
    const isTheAnswer = isAnswered && current.category === c.id
    let cls = ''
    if (isAnswered) {
      if (isChosen && isCorrect) cls = 'is-answer'
      else if (isChosen && !isCorrect) cls = 'is-chosen-wrong'
      else if (!isChosen && !isCorrect && isTheAnswer) cls = 'is-revealed-answer'
      else cls = 'is-dim'
    }
    return (
      <button
        key={c.id}
        type="button"
        onClick={() => handleGuess(c.id)}
        disabled={isAnswered}
        className={`pcs-btn ${cls}`}
      >
        {keyIndex <= 9 && !isAnswered && (
          <span className="pcs-btn-key" aria-hidden="true">{keyIndex}</span>
        )}
        <span className="pcs-btn-label">{c.label}</span>
        {c.prefix_example && <span className="pcs-btn-prefix">{c.prefix_example}</span>}
        {c.principle && <span className="pcs-btn-principle">{c.principle}</span>}
        {isChosen && isCorrect && (
          <span className="pcs-btn-feedback">
            <span className="pcs-btn-feedback-icon" aria-hidden="true">{'\u2713'}</span>
            <span className="pcs-btn-feedback-body">
              <span className="pcs-btn-verdict">That{'\u2019'}s right.</span>
              <span className="pcs-btn-why">
                <em>{current.tongan}</em> is <strong>{answerCategory.label}</strong>. {current.why}
                {rightForm && (
                  <span className="pcs-inline-form">
                    {'\u2192'} {rightForm}{rightNote ? ` \u2014 ${rightNote}` : ''}
                  </span>
                )}
              </span>
            </span>
          </span>
        )}
        {isChosen && !isCorrect && (
          <span className="pcs-btn-feedback">
            <span className="pcs-btn-feedback-icon" aria-hidden="true">{'\u2715'}</span>
            <span className="pcs-btn-feedback-body">
              <span className="pcs-btn-verdict">Not quite.</span>
              <span className="pcs-btn-why">
                <em>{current.tongan}</em> is <strong>{answerCategory.label}</strong>, not{' '}
                <strong>{guessCategory?.label}</strong>. {current.why}
                {wrongForm && (
                  <span className="pcs-inline-form pcs-inline-form-wrong">
                    {wrongForm}{wrongNote ? ` \u2014 ${wrongNote}` : ''}
                  </span>
                )}
                {rightForm && (
                  <span className="pcs-inline-form">
                    {'\u2192'} {rightForm}{rightNote ? ` \u2014 ${rightNote}` : ''}
                  </span>
                )}
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
        <div className="pcs-noun">{current.tongan}</div>
        <div className="pcs-noun-gloss">{current.english}</div>
      </div>

      <div className="pcs-question">{question}</div>

      <div className={`pcs-buttons${use3Cols ? ' pcs-buttons-3' : ''}`}>
        {categories.map((c, i) => renderCategory(c, i + 1))}
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
