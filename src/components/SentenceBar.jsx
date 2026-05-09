import { translate, buildTonganSentence } from '../engine/translate'

export default function SentenceBar({ steps, isFinished, isQuestion = false, onUndo, onReset, completeness = 'incomplete' }) {
  if (steps.length === 0) {
    return (
      <div className="border border-[var(--border)] px-6 py-4 mb-6">
        <div className="text-[var(--text-muted)] italic text-sm">
          Start building your sentence by choosing a word below.
        </div>
      </div>
    )
  }

  const punct = isFinished ? (isQuestion ? '?' : '.') : ''
  const tongan = buildTonganSentence(steps) + punct
  const { text: translation, literal, method } = isFinished
    ? translate(steps, isQuestion)
    : { text: '', literal: '', method: 'none' }

  return (
    <div className="border border-[var(--border)] px-6 py-4 mb-6">
      {/* Tongan word pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {steps.map((step, i) => (
          <span
            key={i}
            className="px-3 py-1 bg-[var(--bg-tone)] border border-[var(--border)] text-[var(--text)] font-tongan text-lg"
          >
            {step.word.tongan}
            <span className="text-[var(--text-faint)] text-xs ml-2">{step.nodeId.replace(/_/g, ' ')}</span>
          </span>
        ))}
      </div>

      {/* Full Tongan sentence */}
      <div className="font-tongan text-lg text-[var(--text)] mb-1">
        {tongan}
      </div>

      {/* Literal translation (Tongan word order) — shown when finished */}
      {isFinished && literal && (
        <div className="text-sm mt-1 text-[var(--text-muted)]">
          {literal}
        </div>
      )}

      {/* Natural English translation — shown when finished */}
      {isFinished && translation && (
        <div className={`text-sm ${method === 'gloss' ? 'text-[var(--text-muted)] italic' : 'text-[var(--accent)]'}`}>
          {translation}
        </div>
      )}

      {/* Completeness indicator */}
      {!isFinished && steps.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            completeness === 'incomplete' ? 'bg-[var(--clay)]' :
            completeness === 'completable' ? 'bg-[var(--accent)]' :
            'bg-[var(--accent)]'
          }`} />
          <span className="text-xs text-[var(--text-muted)]">
            {completeness === 'incomplete' && 'Keep building...'}
            {completeness === 'completable' && 'Complete \u2014 add more?'}
            {completeness === 'terminal' && 'Complete!'}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3 mt-3">
        {steps.length > 0 && (
          <button
            onClick={onUndo}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            &larr; Undo last
          </button>
        )}
        {steps.length > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Start over
          </button>
        )}
      </div>
    </div>
  )
}
