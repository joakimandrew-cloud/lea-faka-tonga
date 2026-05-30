import { useState } from 'react'
import bookExercises from '../data/book-exercises.json'

// ---------------------------------------------------------------------------
// Answer normalization — tolerate apostrophe variants, markdown, and case
// ---------------------------------------------------------------------------

function normalize(s) {
  if (!s) return ''
  return s
    // Strip markdown emphasis markers
    .replace(/\*+/g, '')
    // Unify all apostrophe/glottal variants
    .replace(/[\u2018\u2019\u02BB'`]/g, "'")
    // Strip combining diacritics (e.g. á → a)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    // Strip leading/trailing punctuation and quotes
    .replace(/^[\s"'.,?!]+|[\s"'.,?!]+$/g, '')
    .toLowerCase()
    .trim()
}

function isCorrect(userInput, answer) {
  if (!answer) return false
  return normalize(userInput) === normalize(answer)
}

// ---------------------------------------------------------------------------
// Render a single prompt/answer pair as an interactive item
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

function ExerciseItem({ item, index, exerciseType }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const hasAnswer = !!item.answer
  const interactive = hasAnswer && (exerciseType === 'translate_to_english' || exerciseType === 'translate_to_tongan' || exerciseType === 'fill_blank')

  const correct = submitted && isCorrect(input, item.answer)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setSubmitted(true)
  }

  return (
    <div className="py-2 border-b border-[var(--border)] last:border-b-0">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-[var(--text-muted)] text-sm mt-0.5 w-6 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 text-[var(--text-strong)] text-sm leading-relaxed">
          {renderPromptText(item.prompt)}
        </div>
      </div>

      {interactive && !revealed && (
        <form onSubmit={handleSubmit} className="ml-8 mt-1 flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setSubmitted(false) }}
            placeholder="Your answer..."
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-strong)] text-sm px-2 py-1 focus:outline-none focus:border-[var(--accent)]/50 font-tongan"
          />
          <button
            type="submit"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)]/50 px-2 py-1 transition-colors cursor-pointer"
          >
            Check
          </button>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            Show
          </button>
        </form>
      )}

      {interactive && submitted && !revealed && (
        <div className={`ml-8 mt-1 text-xs ${correct ? 'text-emerald-600' : 'text-amber-600'}`}>
          {correct ? '✓ Correct' : '✗ Not quite — try again or click Show.'}
        </div>
      )}

      {!interactive && hasAnswer && !revealed && (
        <div className="ml-8 mt-1">
          <button
            onClick={() => setRevealed(true)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            Show answer
          </button>
        </div>
      )}

      {revealed && hasAnswer && (
        <div className="ml-8 mt-1 text-sm text-[var(--text-muted)]">
          <span className="text-[var(--accent)]/70 text-xs mr-2">Answer:</span>
          {renderPromptText(item.answer)}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BookExercises({ chapterNum }) {
  const [openExerciseId, setOpenExerciseId] = useState(null)
  const exercises = bookExercises[chapterNum] || []

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
                    Exercise {ex.number}{ex.title ? `: ${ex.title}` : ''}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {ex.items.length} item{ex.items.length === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="text-[var(--accent)] text-xs">{isOpen ? '\u25BC' : '\u25B6'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 border-t border-[var(--border)]">
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
