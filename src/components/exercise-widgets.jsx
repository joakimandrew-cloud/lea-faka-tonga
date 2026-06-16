import { useState } from 'react'

// ---------------------------------------------------------------------------
// Shared exercise widgets — the tap-only rendering primitives (owner ruling
// 2026-06-16, see DECISIONS.md). Chapter practice is a strict binary: tap an
// option, or tap to reveal. NO typing — Tongan ʻokina / macrons / accents make
// typed answers fiddly and error-prone.
//
// Used by BOTH surfaces:
//   - <BookExercises>  — the end-of-chapter `### Exercises` set
//   - <QuickPractice>  — the in-flow mid-chapter Quick Practice blocks
//
// No Tongan is authored here — every option / answer comes from the book
// (book-exercises.json for end-of-chapter; parsed in-place by
// remark-quick-practice for mid-chapter). MCQ options are never fabricated.
//
// Dispatch (ExerciseItem):
//   mcq      → tap-an-option  (McqItem; the QuizRunner mechanic)
//   matching → tap-to-match   (MatchingExercise; whole-exercise widget)
//   else (fill_blank / transform / free / translate_*) → blurred reveal
// ---------------------------------------------------------------------------

export function renderPromptText(text) {
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

export function AnswerLine({ answer }) {
  return (
    <div className="ml-8 mt-2 flex items-baseline gap-2 text-[17px]">
      <span className="text-[var(--accent)]/70 text-xs flex-shrink-0">Answer</span>
      <span className="text-[var(--text-muted)]">{renderPromptText(answer)}</span>
    </div>
  )
}

// Fisher–Yates shuffle (matching right-hand column). Runtime randomness only.
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Tap-an-option (MCQ) — mirrors the QuizRunner mechanic: select one option, it
// locks, the correct option turns --correct and a wrong pick turns --wrong; the
// annotated book answer is then revealed as the explanation. Options come from
// the book — never fabricated.
export function McqItem({ item, index }) {
  const [selected, setSelected] = useState(null)
  const submitted = selected !== null
  const pickedCorrect = submitted && selected === item.correct
  // Short Tongan banks (ki / kia / kiate) read better as a wrapped pill row;
  // long options (full sentences, classification labels) keep the stacked list.
  const compact = item.options.every((o) => o.replace(/\*/g, '').length <= 14)

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-b-0">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-[var(--text-muted)] text-sm mt-0.5 w-6 flex-shrink-0">{index + 1}.</span>
        {item.prompt ? (
          <div className="flex-1 text-[var(--text-strong)] text-[17px] leading-relaxed">
            {renderPromptText(item.prompt)}
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <div className={`${compact ? 'x-bank' : 'x-opt-list'} ml-8 mt-2`}>
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
export function RevealItem({ item, index }) {
  const [revealed, setRevealed] = useState(false)
  const hasAnswer = !!item.answer

  return (
    <div className="py-3 border-b border-[var(--border)] last:border-b-0">
      <div className="flex items-start gap-2">
        <span className="text-[var(--text-muted)] text-sm mt-0.5 w-6 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 text-[var(--text-strong)] text-[17px] leading-relaxed">
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
          <span className="text-[var(--text-muted)] text-[17px] blur-[7px] select-none transition-[filter] duration-[400ms]">
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
export function MatchingExercise({ exercise }) {
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

export function ExerciseItem({ item, index, exerciseType }) {
  if (exerciseType === 'mcq' && Array.isArray(item.options) && item.options.length > 0) {
    return <McqItem item={item} index={index} />
  }
  return <RevealItem item={item} index={index} />
}
