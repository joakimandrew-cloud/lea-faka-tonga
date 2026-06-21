import { Link, useParams } from 'react-router-dom'
import quizzes from '../data/quizzes.json'
import chapters from '../data/chapters.json'
import QuizRunner from '../components/QuizRunner'

export default function QuizPlay() {
  const { num } = useParams()
  const chapterNum = parseInt(num, 10)
  const quiz = quizzes[String(chapterNum)]
  const chapter = chapters.find(c => c.chapter === chapterNum)

  if (!quiz) {
    return (
      <div>
        <div className="text-[var(--text-muted)] text-sm mb-4">
          No quiz available for this lesson yet.
        </div>
        <Link
          to="/quizzes"
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors text-sm"
        >
          &larr; All quizzes
        </Link>
      </div>
    )
  }

  return <QuizRunner quiz={quiz} chapter={chapter} />
}
