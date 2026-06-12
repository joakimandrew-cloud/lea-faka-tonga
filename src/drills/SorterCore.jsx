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
 *
 * `hideGloss` (opt-in) collapses the English gloss under the prompt word
 * until the learner answers, then fades it in — used by FakaSorter, where
 * the gloss ("daily", "in the Tongan way") would otherwise hand over the
 * category. PossessiveSorter leaves it on: there the gloss ("father") is
 * needed context and does NOT reveal the e/ho class.
 */
import { useState, useEffect, useRef } from 'react'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'

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
  hideGloss = false,
}) {
  const [deck, setDeck] = useState(() => shuffle(cards))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const cardRef = useRef(null)
  const isTouch = useIsTouchPrimary()

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
      // End of deck: pause on a completion moment instead of looping silently.
      setFinished(true)
    }
    setGuess(null)
  }

  // "Go again" from the completion screen: reshuffle, but never let the new
  // deck open with the card the student just answered.
  const handleContinue = () => {
    const next = shuffle(cards)
    if (next.length > 1 && next[0] === current) {
      ;[next[0], next[1]] = [next[1], next[0]]
    }
    setDeck(next)
    setIdx(0)
    setGuess(null)
    setFinished(false)
  }

  const handleReset = () => {
    setDeck(shuffle(cards))
    setIdx(0)
    setGuess(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
    setFinished(false)
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
      if (finished) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleContinue()
        }
        return
      }
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
  const pct = finished
    ? 100
    : deck.length > 0 ? ((idx + (isAnswered ? 1 : 0)) / deck.length) * 100 : 0
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
        {keyIndex <= 9 && !isAnswered && !isTouch && (
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
          <span className="pcs-progress">{finished ? deck.length : idx + 1} / {deck.length}</span>
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

      {finished ? (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label">Deck complete</div>
            <div className="pcs-noun">{score.right} / {score.total} correct</div>
            <div className="pcs-noun-gloss">
              {perfect
                ? 'Perfect \u2014 every answer right.'
                : 'You made it through the whole deck.'}
            </div>
          </div>
          <div className="pcs-next-container">
            {!isTouch && (
              <span className="pcs-keyboard-hint">Press <kbd>{'\u21B5'}</kbd> to go again</span>
            )}
            <button onClick={handleReset} className="pcs-reset" type="button">
              start fresh
            </button>
            <button onClick={handleContinue} className="pcs-next" type="button">
              Go again {'\u2192'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-noun">{current.tongan}</div>
            <div className={`pcs-noun-gloss${hideGloss ? ' pcs-noun-gloss-reveal' : ''}`}>{current.english}</div>
          </div>

          <div className="pcs-question">{question}</div>

          <div className={`pcs-buttons${use3Cols ? ' pcs-buttons-3' : ''}`}>
            {categories.map((c, i) => renderCategory(c, i + 1))}
          </div>

          {isAnswered && (
            <div className="pcs-next-container">
              {!isTouch && (
                <span className="pcs-keyboard-hint">Press <kbd>{'\u21B5'}</kbd> to continue</span>
              )}
              <button onClick={handleNext} className="pcs-next" type="button">
                Next {'\u2192'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
