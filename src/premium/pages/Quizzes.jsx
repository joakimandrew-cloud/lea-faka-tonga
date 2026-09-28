import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import chapters from '@app/data/chapters.json'
import quizzes from '@app/data/quizzes.json'
import { useProgress } from '../lib/progress.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'

const GROUPS = [
  ['foundations', 'Foundations'],
  ['core-grammar', 'Core Grammar'],
  ['structure-possession', 'Structure & Possession'],
  ['expanding-sentences', 'Expanding Sentences'],
  ['shaping-meaning', 'Shaping Meaning'],
  ['advanced-patterns', 'Advanced Patterns'],
]

function quizEntries(query) {
  const needle = query.trim().toLocaleLowerCase()
  return Object.values(quizzes)
    .filter(quiz => quiz?.questions?.length)
    .map(quiz => ({ quiz, lesson: chapters.find(chapter => chapter.chapter === quiz.chapter) }))
    .filter(({ lesson }) => lesson && (!needle || [lesson.title, lesson.preview, `lesson ${lesson.chapter}`]
      .some(value => String(value ?? '').toLocaleLowerCase().includes(needle))))
    .sort((a, b) => a.quiz.chapter - b.quiz.chapter)
}

export default function Quizzes() {
  useTitle('Lesson quizzes')
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const { quiz: scores } = useProgress()
  const entries = useMemo(() => quizEntries(query), [query])
  const byGroup = Object.fromEntries(GROUPS.map(([key]) => [key, entries.filter(entry => entry.lesson.group === key)]))

  return (
    <div className="catalog-page quizzes-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Quizzes · One for every lesson</p>
          <h1 className="display">Check your<br />understanding.</h1>
          <p>Multiple-choice quizzes drawn from the current course data. Your best result remains on this device.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search quizzes</span>
            <input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try a lesson number or topic" />
          </label>
        </div>
        <p className="catalog-count" role="status" aria-live="polite">{entries.length} of 52 quizzes</p>
        {entries.length === 0 ? (
          <div className="catalog-empty">
            <h2>No quizzes match.</h2>
            <p>Try another lesson number or topic.</p>
            <button type="button" className="btn btn-primary" onClick={() => { setQuery(''); requestAnimationFrame(() => searchRef.current?.focus()) }}>Clear search</button>
          </div>
        ) : GROUPS.map(([key, name]) => {
          const rows = byGroup[key]
          if (!rows.length) return null
          return (
            <section className="catalog-group quiz-group" key={key} aria-labelledby={`quiz-${key}`}>
              <header><div><p className="catalog-kicker">{rows.length} quizzes</p><h2 id={`quiz-${key}`}>{name}</h2></div></header>
              <ol className="quiz-list">
                {rows.map(({ quiz, lesson }) => {
                  const score = scores[quiz.chapter]
                  return (
                    <li key={quiz.chapter}>
                      <Link to={`/quizzes/${quiz.chapter}`}>
                        <span className="quiz-num">{String(quiz.chapter).padStart(2, '0')}</span>
                        <span className="quiz-copy"><strong>{lesson.title}</strong><span>{lesson.preview || `${quiz.questions.length} questions`}</span></span>
                        {score && <span className="quiz-score" aria-label={`Best score ${score.right} of ${score.total}`}>{score.right}/{score.total}</span>}
                        <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}
