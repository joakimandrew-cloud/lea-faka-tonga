import '../styles/answer-feedback.css'

/** Immediate feedback only: the caller still owns grading and progress. */
export default function AnswerFeedback({ outcome, children, announce = true, announcement }) {
  const correct = outcome === 'correct'
  const title = correct ? 'Correct' : 'Not quite'
  return (
    <>
      {outcome && (
        <div className={`answer-feedback is-${correct ? 'correct' : 'wrong'}`} data-answer-feedback={outcome}>
          <span className="answer-feedback-icon" aria-hidden="true">{correct ? '✓' : '×'}</span>
          <div className="answer-feedback-copy">
            <strong>{title}</strong>
            {children && <div className="answer-feedback-detail">{children}</div>}
          </div>
        </div>
      )}
      {/* Keep the region mounted before an answer, and silent for restored work. */}
      <span className="answer-feedback-announcement" role="status" aria-live="polite" aria-atomic="true">
        {announce && outcome ? (announcement || `${title}.`) : ''}
      </span>
    </>
  )
}
