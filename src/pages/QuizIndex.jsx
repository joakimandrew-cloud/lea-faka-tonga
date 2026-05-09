import { Link } from 'react-router-dom'
import quizzes from '../data/quizzes.json'
import chapters from '../data/chapters.json'

export default function QuizIndex() {
  const entries = Object.values(quizzes)
    .filter(q => q && Array.isArray(q.questions) && q.questions.length > 0)
    .sort((a, b) => a.chapter - b.chapter)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl text-[var(--text-strong)] mb-2">Quizzes</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Multiple-choice comprehension checks. Each quiz tests one chapter.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-[var(--text-muted)] text-sm">
          No quizzes available yet.
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map(quiz => {
            const ch = chapters.find(c => c.chapter === quiz.chapter)
            return (
              <Link
                key={quiz.chapter}
                to={`/quizzes/${quiz.chapter}`}
                className="block px-4 py-3 border border-[var(--accent)]/20 hover:border-[var(--accent)] hover:bg-[var(--accent-faint)] transition-colors"
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[var(--accent)] font-bold text-sm w-8">
                    {String(quiz.chapter).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <div className="text-[var(--text)] mb-0.5">{quiz.title}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {ch ? `Ch. ${ch.chapter}: ${ch.title} · ` : ''}
                      {quiz.questions.length} questions
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
