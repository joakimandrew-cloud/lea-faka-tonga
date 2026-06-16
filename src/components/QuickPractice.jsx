import quickPractice from '../data/quick-practice.json'
import { renderPromptText, ExerciseItem, MatchingExercise } from './exercise-widgets'

// ---------------------------------------------------------------------------
// QuickPractice — the in-flow, mid-chapter practice interlude. Mounted by
// remark-quick-practice (which removes the static block and drops an anchor in
// its place) and routed from BookChapterContent's components map.
//
// Renders with the SAME tap-only widgets as the end-of-chapter <BookExercises>
// (see exercise-widgets.jsx): tap-to-reveal blurred answers, tap-an-option MCQ
// where the book supplies a closed option set, tap-to-match for the one
// matching block. The parsed block (type + items + book-sourced options) comes
// from src/data/quick-practice.json — no Tongan is authored here.
// ---------------------------------------------------------------------------

export default function QuickPractice({ chapterNum, index }) {
  const blocks = quickPractice[String(chapterNum)]
  const block = blocks && blocks[index]
  if (!block || !block.items || block.items.length === 0) return null

  return (
    <div className="qp-block my-6 border border-[var(--border)] bg-[var(--bg-tone)]/40 px-4 py-3">
      <div className="text-xs uppercase tracking-widest text-[var(--accent)] mb-1">
        Quick Practice{block.letter ? ` ${block.letter}` : ''}
      </div>
      {block.topic ? (
        <div className="text-[var(--text-strong)] font-semibold leading-snug mb-1">
          {renderPromptText(block.topic)}
        </div>
      ) : null}
      {block.instructions ? (
        <div className="text-sm text-[var(--text-muted)] mt-1 mb-1">
          {renderPromptText(block.instructions)}
        </div>
      ) : null}

      {block.type === 'matching' ? (
        <MatchingExercise exercise={block} />
      ) : (
        block.items.map((item, i) => (
          <ExerciseItem key={item.id} item={item} index={i} exerciseType={block.type} />
        ))
      )}
    </div>
  )
}
