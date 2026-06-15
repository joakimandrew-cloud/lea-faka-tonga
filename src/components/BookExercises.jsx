import { useState } from 'react'
import bookExercises from '../data/book-exercises.json'
import { isCorrect } from './book-exercise-grading'

// ---------------------------------------------------------------------------
// Book Exercises — type-aware rendering (owner ruling 2026-06-13, see
// DECISIONS.md; extended 2026-06-15). Items with ONE canonical answer are
// interactive in the shared (Tactile) look; genuinely open items keep the
// book-style blurred reveal. Dispatch (see ExerciseItem / the main render):
//
//   fill_blank  → type-and-check (TypeCheckItem)
//   transform   → type-and-check (TypeCheckItem); untypeable items fall to reveal
//   mcq         → tap-an-option  (McqItem; QuizRunner mechanic)
//   matching    → tap-to-match   (MatchingExercise; whole-exercise widget)
//   translate_* / free → blurred reveal (RevealItem)
//
// No Tongan is authored here — every pair / option / answer comes from
// book-exercises.json (generated from the book). Grading reuses the shipped
// normalize / isCorrect semantics (ʻokina phonemic, accents lenient).
// ---------------------------------------------------------------------------

function renderPromptText(text) {
  const parts = []
  let i = 0
  let key = 0
  while (i < text.length) {
    // Bold
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        parts.push(<strong key={key++} className="text-[var(--text-strong)] font-semibold">{text.slice(i + 2, end)}</strong>)
        i = end + 2
        continue
      }
    }
    // Italic (Tongan)
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end !== -1) {
        parts.push(
          <span key={key++} className="font-tongan italic">{text.slice(i + 1, end)}</span>
        )
        i = end + 1
        continue
      }
    }
    // Plain chunk up to next marker
    const next = text.indexOf('*', i)
    const chunk = next === -1 ? text.slice(i) : text.slice(i, next)
    if (chunk) parts.push(<span key={key++}>{chunk}</span>)
    i = next === -1 ? text.length : next
  }
  return parts
}

function AnswerLine({ answer }) {
  return (
    <div className="ml-8 mt-2 flex items-baseline gap-2 text-sm">
      <span className="text-[var(--accent)]/70 text-xs flex-shrink-0">Answer</span>
      <span className="text-[var(--text-muted)]">{renderPromptText(answer)}</span>
    </div>
  )
}

// Fisher–Yates shuffle (matching right-hand column). Runtime randomness only.
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// A transform item is only type-checkable when it has a single canonical answer
// that a learner can actually type. Vowel-protraction answers (e.g. *la––hi*,
// U+2013) can't be typed, so those fall through to reveal.
function isTypeableTransform(item) {
  return !!item.answer && !/[–—]/.test(item.answer)
}

// Interactive type-and-check: type the answer, Check it, get correct/wrong
// feedback. "Show" reveals the answer for anyone stuck. Shared by fill_blank
// and transform (only the placeholder differs).
function TypeCheckItem({ item, index, placeholder }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const correct = submitted && isCorrect(input, item)
  const showAnswer = revealed || correct

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-b-0">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-[var(--text-muted)] text-sm mt-0.5 w-6 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 text-[var(--text-strong)] text-sm leading-relaxed">
          {renderPromptText(item.prompt)}
        </div>
      </div>

      {item.answer && (
        <form onSubmit={handleSubmit} className="ml-8 mt-2 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setSubmitted(false) }}
            placeholder={placeholder}
            aria-label={`Answer for item ${index + 1}`}
            className={`flex-1 min-w-[10rem] bg-[var(--bg)] border rounded-xl text-[var(--text-strong)] text-[15px] px-3 py-2 focus:outline-none transition-colors font-tongan ${
              submitted
                ? correct
                  ? 'border-[var(--correct)] focus:border-[var(--correct)]'
                  : 'border-[var(--wrong)] focus:border-[var(--wrong)]'
                : 'border-[var(--border)] focus:border-[var(--accent)]'
            }`}
          />
          <button type="submit" className="x-nav">Check</button>
          {!showAnswer && (
            <button type="button" onClick={() => setRevealed(true)} className="x-chip">Show</button>
          )}
        </form>
      )}

      {submitted && (
        <div className={`ml-8 mt-2 text-sm font-medium ${correct ? 'text-[var(--correct)]' : 'text-[var(--wrong)]'}`}>
          {correct ? '✓ Correct' : '✗ Not quite — try again, or tap Show.'}
        </div>
      )}

      {showAnswer && item.answer && <AnswerLine answer={item.answer} />}
    </div>
  )
}

// Tap-an-option (MCQ) — mirrors the QuizRunner mechanic: select one option, it
// locks, the correct option turns --correct and a wrong pick turns --wrong; the
// annotated book answer is then revealed as the explanation. Options come from
// the book (see extract-book-exercises.mjs) — never fabricated.
function McqItem({ item, index }) {
  const [selected, setSelected] = useState(null)
  const submitted = selected !== null
  const pickedCorrect = submitted && selected === item.correct

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-b-0">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-[var(--text-muted)] text-sm mt-0.5 w-6 flex-shrink-0">{index + 1}.</span>
        {item.prompt ? (
          <div className="flex-1 text-[var(--text-strong)] text-sm leading-relaxed">
            {renderPromptText(item.prompt)}
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <div className="x-opt-list ml-8 mt-2">
        {item.options.map((opt, i) => {
          const picked = selected === opt
          const isOptCorrect = opt === item.correct
          const showCorrect = submitted && isOptCorrect
          const showWrong = submitted && picked && !isOptCorrect
          const dim = submitted && !showCorrect && !picked
          const cls = ['x-opt', showCorrect && 'is-correct', showWrong && 'is-wrong', dim && 'is-dim']
            .filter(Boolean).join(' ')
          return (
            <button
              key={i}
              type="button"
              disabled={submitted}
              onClick={() => { if (!submitted) setSelected(opt) }}
              className={cls}
            >
              <span>{renderPromptText(opt)}</span>
              {showCorrect && <span className="x-opt-mark"> ✓</span>}
              {showWrong && <span className="x-opt-mark"> ✗</span>}
            </button>
          )
        })}
      </div>

      {submitted && (
        <div className={`ml-8 mt-2 text-sm font-medium ${pickedCorrect ? 'text-[var(--correct)]' : 'text-[var(--wrong)]'}`}>
          {pickedCorrect ? '✓ Correct' : '✗ Not quite.'}
        </div>
      )}

      {submitted && item.answer && <AnswerLine answer={item.answer} />}
    </div>
  )
}

// Book-style item: the answer sits below, blurred until tapped (the reveal
// idiom — mirrors .fwq-rest: blur(7px), 0.4s, no-select).
function RevealItem({ item, index }) {
  const [revealed, setRevealed] = useState(false)
  const hasAnswer = !!item.answer

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="text-[var(--text-muted)] text-sm mt-0.5 w-6 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 text-[var(--text-strong)] text-sm leading-relaxed">
          {renderPromptText(item.prompt)}
        </div>
      </div>

      {hasAnswer && (revealed ? (
        <AnswerLine answer={item.answer} />
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          aria-label="Reveal answer"
          className="ml-8 mt-2 flex items-baseline gap-2 text-sm text-left cursor-pointer rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        >
          <span className="text-[var(--accent)]/70 text-xs flex-shrink-0">Answer</span>
          <span className="text-[var(--text-muted)] blur-[7px] select-none transition-[filter] duration-[400ms]">
            {renderPromptText(item.answer)}
          </span>
          <span className="text-[var(--accent)]/50 text-xs flex-shrink-0">tap to reveal</span>
        </button>
      ))}
    </div>
  )
}

// Tap-to-match: tap a left item, then its pair on the right. A correct pair
// locks (--correct); a wrong pick flashes (--wrong). All pairs come from the
// book (left = item.prompt, right = item.answer).
function MatchingExercise({ exercise }) {
  const items = exercise.items
  const [rights] = useState(() => shuffle(items.map((it, i) => ({ i, text: it.answer }))))
  const [selectedLeft, setSelectedLeft] = useState(null)
  const [matched, setMatched] = useState(() => new Set())
  const [wrongRight, setWrongRight] = useState(null)

  const done = matched.size === items.length

  const tapLeft = (i) => {
    if (matched.has(i)) return
    setWrongRight(null)
    setSelectedLeft(i === selectedLeft ? null : i)
  }
  const tapRight = (i) => {
    if (matched.has(i) || selectedLeft === null) return
    if (i === selectedLeft) {
      setMatched((m) => new Set(m).add(i))
      setSelectedLeft(null)
      setWrongRight(null)
    } else {
      setWrongRight(i)
      setSelectedLeft(null)
    }
  }
  const reset = () => { setSelectedLeft(null); setMatched(new Set()); setWrongRight(null) }

  return (
    <div className="x-match pt-3">
      <div className="flex items-center justify-between mb-3">
        <span className="x-counter">{matched.size} / {items.length} matched</span>
        <button type="button" onClick={reset} className="x-chip">Reset</button>
      </div>
      <div className="x-match-grid">
        <div className="x-match-col">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              disabled={matched.has(i)}
              onClick={() => tapLeft(i)}
              className={`x-match-cell ${matched.has(i) ? 'is-matched' : ''} ${selectedLeft === i ? 'is-selected' : ''}`}
            >
              {renderPromptText(it.prompt)}
            </button>
          ))}
        </div>
        <div className="x-match-col">
          {rights.map((r) => (
            <button
              key={r.i}
              type="button"
              disabled={matched.has(r.i)}
              onClick={() => tapRight(r.i)}
              onAnimationEnd={() => { if (wrongRight === r.i) setWrongRight(null) }}
              className={`x-match-cell ${matched.has(r.i) ? 'is-matched' : ''} ${wrongRight === r.i ? 'is-wrong' : ''}`}
            >
              {renderPromptText(r.text)}
            </button>
          ))}
        </div>
      </div>
      {done && <div className="mt-3 text-sm font-medium text-[var(--correct)]">✓ All matched!</div>}
    </div>
  )
}

function ExerciseItem({ item, index, exerciseType }) {
  if (exerciseType === 'fill_blank' && item.answer) {
    return <TypeCheckItem item={item} index={index} placeholder="Type the missing word…" />
  }
  if (exerciseType === 'transform' && isTypeableTransform(item)) {
    return <TypeCheckItem item={item} index={index} placeholder="Type the full sentence…" />
  }
  if (exerciseType === 'mcq' && Array.isArray(item.options) && item.options.length > 0) {
    return <McqItem item={item} index={index} />
  }
  return <RevealItem item={item} index={index} />
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BookExercises({ chapterNum }) {
  const [openExerciseId, setOpenExerciseId] = useState(null)
  // Defensive: never render an exercise that extracted to zero items
  const exercises = (bookExercises[chapterNum] || []).filter((ex) => ex.items.length > 0)

  if (exercises.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-sm text-[var(--accent)] uppercase tracking-widest border-b border-[var(--border)] pb-2 mb-4">
        Book Exercises
      </h2>

      <div className="space-y-2">
        {exercises.map((ex) => {
          const isOpen = openExerciseId === ex.id
          return (
            <div key={ex.id} className="border border-[var(--border)]">
              <button
                onClick={() => setOpenExerciseId(isOpen ? null : ex.id)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-tone)] transition-colors cursor-pointer flex justify-between items-center"
              >
                <div>
                  <div className="text-[var(--text-strong)] text-sm">
                    Exercise {ex.number}{ex.title ? ': ' : ''}{ex.title ? renderPromptText(ex.title) : null}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {ex.items.length} item{ex.items.length === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="text-[var(--accent)] text-xs">{isOpen ? '▼' : '▶'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 border-t border-[var(--border)]">
                  {ex.instructions ? (
                    <div className="pt-3 pb-1 text-sm text-[var(--text-muted)]">
                      {renderPromptText(ex.instructions)}
                    </div>
                  ) : null}
                  {ex.type === 'matching' ? (
                    <MatchingExercise exercise={ex} />
                  ) : (
                    ex.items.map((item, i) => (
                      <ExerciseItem key={item.id} item={item} index={i} exerciseType={ex.type} />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
