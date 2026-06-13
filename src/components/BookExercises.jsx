import { useState } from 'react'
import bookExercises from '../data/book-exercises.json'

// ---------------------------------------------------------------------------
// Render a single prompt/answer pair book-style: the prompt, with its answer
// shown below but blurred until the reader taps to reveal it. (The book lists
// answers in a separate section; here each answer sits with its question.)
// Mirrors the .fwq-rest flash-card blur idiom: blur(7px), 0.4s, no select.
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

function ExerciseItem({ item, index }) {
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
        <div className="ml-8 mt-2 flex items-baseline gap-2 text-sm">
          <span className="text-[var(--accent)]/70 text-xs flex-shrink-0">Answer</span>
          <span className="text-[var(--text-muted)]">{renderPromptText(item.answer)}</span>
        </div>
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
                    <ExerciseItem key={item.id} item={item} index={i} />
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
