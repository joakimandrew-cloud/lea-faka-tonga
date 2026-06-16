import bookExercises from '../data/book-exercises.json'
import { renderPromptText, ExerciseItem, MatchingExercise } from './exercise-widgets'

// ---------------------------------------------------------------------------
// Book Exercises — the end-of-chapter `### Exercises` set, rendered with the
// shared tap-only widgets (see exercise-widgets.jsx; owner ruling 2026-06-16).
// The mid-chapter Quick Practice blocks use the same widgets via <QuickPractice>.
//
// No Tongan is authored here — every option / answer comes from
// book-exercises.json (generated from the book by extract-book-exercises.mjs).
// ---------------------------------------------------------------------------

export default function BookExercises({ chapterNum }) {
  // Defensive: never render an exercise that extracted to zero items
  const exercises = (bookExercises[chapterNum] || []).filter((ex) => ex.items.length > 0)

  if (exercises.length === 0) return null

  // Always-open (owner ruling 2026-06-16): every exercise renders expanded as a
  // titled block — no accordion, just part of the page.
  return (
    <div className="mb-8">
      <h2 className="text-sm text-[var(--accent)] uppercase tracking-widest border-b border-[var(--border)] pb-2 mb-4">
        Book Exercises
      </h2>

      <div className="space-y-4">
        {exercises.map((ex) => (
          <div key={ex.id} className="border border-[var(--border)]">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="text-[var(--text-strong)] text-sm">
                Exercise {ex.number}{ex.title ? ': ' : ''}{ex.title ? renderPromptText(ex.title) : null}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                {ex.items.length} item{ex.items.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="px-4 pb-3">
              {ex.instructions ? (
                <div className="pt-3 pb-1 text-[17px] text-[var(--text-muted)]">
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
          </div>
        ))}
      </div>
    </div>
  )
}
