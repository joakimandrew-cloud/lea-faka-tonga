import { useState } from 'react'
import bookExercises from '../data/book-exercises.json'

// ---------------------------------------------------------------------------
// Book Exercises — type-aware rendering (owner ruling 2026-06-13, see
// DECISIONS.md). FILL-IN-THE-BLANK items have one canonical answer, so they
// get an interactive type-and-check with correct/wrong feedback in the shared
// (Tactile) look. Everything else — open-ended translation, free practice,
// and rewrite/transform tasks — keeps the book-style blurred reveal (no single
// canonical string to grade against).
// ---------------------------------------------------------------------------

// Answer normalization — tolerate apostrophe variants, markdown, and case.
function normalize(s) {
  if (!s) return ''
  return s
    .replace(/\*+/g, '')                                // strip markdown emphasis
    .replace(/[‘’ʻ'`]/g, "'")            // unify glottal/apostrophe
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip combining diacritics
    .replace(/\s+/g, ' ')                               // collapse whitespace
    .replace(/^[\s".,?!]+|[\s".,?!]+$/g, '')            // trim outer punctuation (NOT ʻokina)
    .toLowerCase()
    .trim()
}

function isCorrect(userInput, item) {
  if (!item.answer) return false
  const u = normalize(userInput)
  if (u === normalize(item.answer)) return true
  return (item.accept || []).some((variant) => u === normalize(variant))
}

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

// Interactive fill-in-the-blank: type the missing word, Check it, get
// correct/wrong feedback. "Show" reveals the answer for anyone stuck.
function FillBlankItem({ item, index }) {
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
            placeholder="Type the missing word…"
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

function ExerciseItem({ item, index, exerciseType }) {
  // Only fill-in-the-blank items are graded (one canonical answer). Everything
  // else stays book-style reveal (DECISIONS.md 2026-06-13).
  if (exerciseType === 'fill_blank' && item.answer) {
    return <FillBlankItem item={item} index={index} />
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
                  {ex.items.map((item, i) => (
                    <ExerciseItem key={item.id} item={item} index={i} exerciseType={ex.type} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
