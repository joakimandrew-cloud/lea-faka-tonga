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
 *   prompts = [{ tongan, english, answer, why, acceptAlso?, note? }]
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
 *
 *   `acceptAlso` (optional) is an array of additional option ids graded
 *   as correct alongside `answer` — for items where the book treats two
 *   choices as acceptable. `answer` stays the primary/displayed answer.
 *
 *   `note` (optional) is an extra nuance line rendered after the why-text
 *   whichever way the student answers (e.g. why two answers both work).
 */
import { useState, useRef, useEffect } from 'react'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'

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
  const [finished, setFinished] = useState(false)
  const cardRef = useRef(null)
  const isTouch = useIsTouchPrimary()

  const current = deck[idx]
  const isAnswered = guess !== null
  const acceptedIds = [current.answer, ...(current.acceptAlso || [])]
  const isCorrect = isAnswered && acceptedIds.includes(guess)
  const answerOption = options.find(o => o.id === current.answer)
  const guessOption = isAnswered ? options.find(o => o.id === guess) : null

  const handleGuess = (optionId) => {
    if (isAnswered) return
    setGuess(optionId)
    const right = acceptedIds.includes(optionId)
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => right ? s + 1 : 0)
  }

  const scrollCardIntoView = () => {
    requestAnimationFrame(() => {
      const rect = cardRef.current?.getBoundingClientRect()
      if (rect && rect.top < 0) {
        cardRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    })
  }

  const handleNext = () => {
    if (idx < deck.length - 1) {
      setIdx(idx + 1)
    } else {
      // End of deck: pause on a completion moment instead of looping silently.
      setFinished(true)
    }
    setGuess(null)
    scrollCardIntoView()
  }

  // "Go again" from the completion screen: reshuffle, but never let the new
  // deck open with the card the student just answered.
  const handleContinue = () => {
    const next = shuffle(prompts)
    if (next.length > 1 && next[0] === current) {
      ;[next[0], next[1]] = [next[1], next[0]]
    }
    setDeck(next)
    setIdx(0)
    setGuess(null)
    setFinished(false)
    scrollCardIntoView()
  }

  const handleReset = () => {
    setDeck(shuffle(prompts))
    setIdx(0)
    setGuess(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
    setFinished(false)
  }

  // Group options by `category` when any option declares one. Computed
  // before the keyboard effect because the digit keys must follow the same
  // flattened display order as the on-screen number badges.
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

  // Single source of truth for option ordering: number badges AND the 1-9
  // keyboard mapping both read from this flattened, category-grouped list,
  // so they can never diverge.
  const displayOrder = groups.flatMap(([, opts]) => opts)

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
        if (n >= 1 && n <= Math.min(9, displayOrder.length)) {
          e.preventDefault()
          handleGuess(displayOrder[n - 1].id)
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
            <span className="pcs-blank-word">{guessOption?.fill ?? guessOption?.label}</span>
          )}
        </span>
        {after}
      </>
    )
  }

  const perfect = score.total > 0 && score.right === score.total
  const pct = finished
    ? 100
    : deck.length > 0 ? ((idx + (isAnswered ? 1 : 0)) / deck.length) * 100 : 0
  const use3Cols = hasCategories || options.length >= 6

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
        {keyIndex <= 9 && !isAnswered && !isTouch && (
          <span className="pcs-btn-key" aria-hidden="true">{keyIndex}</span>
        )}
        <span className="pcs-btn-label">{o.label}</span>
        {o.detail && <span className="pcs-btn-principle">{o.detail}</span>}
        {isChosen && isCorrect && (
          <span className="pcs-btn-feedback">
            <span className="pcs-btn-feedback-icon" aria-hidden="true">{'\u2713'}</span>
            <span className="pcs-btn-feedback-body">
              <span className="pcs-btn-verdict">That{'\u2019'}s right.</span>
              <span className="pcs-btn-why">
                {current.why}
                {current.note ? ` ${current.note}` : ''}
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
                The answer is <strong>{answerOption.label}</strong>, not{' '}
                <strong>{o.label}</strong>. {current.why}
                {current.note ? ` ${current.note}` : ''}
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
                ? 'Perfect: every answer right.'
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
                  {opts.map(o => renderOption(o, displayOrder.indexOf(o) + 1))}
                </div>
              </div>
            ))}
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
