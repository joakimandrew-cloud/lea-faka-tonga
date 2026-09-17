import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import LogoMark from '../components/LogoMark'
import { useChapter } from '../contexts/ChapterContext'
import { NAV_LINKS } from '../lib/nav-links'
import { okinafy } from '../lib/okinafy'
import { bestQuizScore, readQuizScores } from '../lib/quiz-scores'
import { useTheme } from '../lib/use-theme'
import {
  filterLessons,
  groupLessons,
  LESSON_GROUPS,
  LESSON_TIERS,
  resolveOpenGroupKeys,
  splitMixedTonganText,
} from '../lib/lesson-browser'
import chapters from '../data/chapters.json'
import '../styles/learning-desk-lessons.css'

const BOOK_PDF = `${import.meta.env.BASE_URL}downloads/Lea-Faka-Tonga.pdf`

function MixedText({ children, scope = 'mixed' }) {
  return splitMixedTonganText(children, scope).map((segment, index) => (
    <Fragment key={`${index}-${segment.text}`}>
      {segment.tongan ? <span lang="to">{segment.text}</span> : segment.text}
    </Fragment>
  ))
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function LessonRow({ lesson, active, activeRowRef, score, onChoose }) {
  const sample = lesson.teaching?.key_rules?.[0]
  const topics = Array.isArray(lesson.topics) ? lesson.topics.slice(0, 2) : []

  return (
    <li>
      <Link
        to={`/lessons/${lesson.chapter}`}
        ref={active ? activeRowRef : null}
        className={`desk-lesson${active ? ' is-current' : ''}`}
        aria-current={active ? 'step' : undefined}
        onClick={() => onChoose(lesson.chapter)}
      >
        <span className="desk-num">{String(lesson.chapter).padStart(2, '0')}</span>
        <span className="desk-lesson-copy">
          <span className="desk-lesson-title"><MixedText>{lesson.title}</MixedText></span>
          {sample?.example_tongan && (
            <span className="desk-example">
              <span lang="to">{okinafy(sample.example_tongan)}</span>
              {sample.example_english && (
                <span className="desk-gloss">
                  <MixedText scope="gloss">{sample.example_english}</MixedText>
                </span>
              )}
            </span>
          )}
          {topics.length > 0 && (
            <span className="desk-topics">
              {topics.map((topic, index) => (
                <Fragment key={`${lesson.chapter}-${index}`}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <MixedText>{okinafy(topic)}</MixedText>
                </Fragment>
              ))}
            </span>
          )}
        </span>
        {score !== null && (
          <span className="desk-score">
            <span aria-hidden="true">✓</span>
            <span className="sr-only">Quiz done, best score {score.best} out of {score.of}</span>
          </span>
        )}
        <span className="desk-next" aria-hidden="true">›</span>
      </Link>
    </li>
  )
}

export default function ChapterBrowser() {
  const { chapter: currentChapter, setChapter } = useChapter()
  const [dark, setDark] = useTheme()
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [scores] = useState(readQuizScores)
  const activeRowRef = useRef(null)
  const searchRef = useRef(null)

  const currentLesson = useMemo(
    () => chapters.find(lesson => lesson.chapter === currentChapter) || null,
    [currentChapter],
  )
  const resume = currentChapter > 1 ? currentLesson : null
  const startLesson = resume || chapters[0]
  const currentGroup = currentLesson?.group || LESSON_GROUPS[0].key
  const [manualOpenGroups, setManualOpenGroups] = useState(() => new Set([currentGroup]))
  const searchActive = query.trim().length > 0

  const visibleLessons = useMemo(
    () => filterLessons(chapters, { query, level }),
    [query, level],
  )
  const visibleByGroup = useMemo(() => groupLessons(visibleLessons), [visibleLessons])
  const matchedGroupKeys = useMemo(
    () => LESSON_GROUPS.filter(group => visibleByGroup[group.key].length > 0).map(group => group.key),
    [visibleByGroup],
  )
  const openGroupKeys = useMemo(
    () => resolveOpenGroupKeys(manualOpenGroups, matchedGroupKeys, searchActive),
    [manualOpenGroups, matchedGroupKeys, searchActive],
  )

  useEffect(() => {
    if (!resume || !activeRowRef.current) return
    activeRowRef.current.scrollIntoView({ block: 'center' })
  }, [resume])

  function chooseLevel(nextLevel) {
    setLevel(nextLevel)
    if (nextLevel === 'all') return
    const firstGroup = LESSON_TIERS.find(tier => tier.key === nextLevel)?.groupKeys[0]
    if (!firstGroup) return
    setManualOpenGroups(previous => new Set([...previous, firstGroup]))
  }

  function recordGroupToggle(key, open) {
    if (searchActive) return
    setManualOpenGroups(previous => {
      const next = new Set(previous)
      if (open) next.add(key)
      else next.delete(key)
      return next
    })
  }

  function resetFilters() {
    setQuery('')
    setLevel('all')
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  const resultSuffix = searchActive
    ? ' matching your search'
    : level === 'all'
      ? ' · Basic to Advanced'
      : ` · ${LESSON_TIERS.find(tier => tier.key === level)?.name}`

  return (
    <div className="learning-desk-lessons" data-theme={dark ? 'dark' : 'light'}>
      <header className="desk-header">
        <Link to="/" className="desk-brand" aria-label="Lea Faka-Tonga home">
          <LogoMark className="desk-brand-mark" />
          <span>Lea Faka-Tonga</span>
        </Link>
        <nav className="desk-nav" aria-label="Course sections">
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={link.to === '/lessons' ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          className="desk-theme"
          type="button"
          aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
          aria-pressed={dark}
          onClick={() => setDark(!dark)}
        >
          <span aria-hidden="true">{dark ? '☀' : '◐'}</span>
          {dark ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="desk-main">
        <section className="desk-intro" aria-labelledby="lessons-title">
          <div>
            <p className="desk-eyebrow">The full course · Basic to Advanced</p>
            <h1 id="lessons-title">52 lessons.<br />One clear path.</h1>
            <p className="desk-lead">
              Learn Tongan with explanations, practice, and feedback. Start at the beginning or find the lesson you need.
            </p>
          </div>
          <div className="desk-start">
            <div className="desk-start-head">
              <div>
                <span>{resume ? 'Continue where you left off' : 'Your first lesson'}</span>
                <h2><MixedText>{startLesson.title}</MixedText></h2>
              </div>
              <span className="desk-page-number">{String(startLesson.chapter).padStart(2, '0')}</span>
            </div>
            <div className="desk-start-body">
              <p>{resume ? 'Ready for your next step?' : <>New to Tongan? <strong>Start here.</strong></>}</p>
              <Link
                className="desk-primary"
                to={`/lessons/${startLesson.chapter}`}
                state={resume ? undefined : { fromStart: true }}
              >
                {resume ? `Continue Lesson ${startLesson.chapter}` : 'Start Lesson 1, free'}
              </Link>
              <p className="desk-access">Free while we build it, members-only later.</p>
            </div>
          </div>
        </section>

        <div className="desk-tools">
          <label className="desk-search">
            <SearchIcon />
            <input
              ref={searchRef}
              type="search"
              aria-label="Search lessons"
              placeholder="Search lessons or topics"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <div className="desk-filters" role="group" aria-label="Filter by level">
            {[
              ['all', 'All'],
              ['basic', 'Basic'],
              ['intermediate', 'Intermediate'],
              ['advanced', 'Advanced'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={level === key}
                onClick={() => chooseLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="desk-result" role="status" aria-live="polite">
          {visibleLessons.length} {visibleLessons.length === 1 ? 'lesson' : 'lessons'}{resultSuffix}
        </p>

        <div className="desk-course">
          {visibleLessons.length === 0 ? (
            <div className="desk-empty">
              <p>No lessons match your search.</p>
              <button className="desk-reset" type="button" onClick={resetFilters}>
                Clear search and filters
              </button>
            </div>
          ) : (
            LESSON_TIERS.map(tier => {
              if (level !== 'all' && level !== tier.key) return null
              const tierGroups = tier.groupKeys
                .map(key => LESSON_GROUPS.find(group => group.key === key))
                .filter(group => group && visibleByGroup[group.key].length > 0)
              const tierCount = tierGroups.reduce(
                (total, group) => total + visibleByGroup[group.key].length,
                0,
              )
              if (tierCount === 0) return null

              return (
                <section key={tier.key} className="desk-tier" aria-label={`${tier.name} lessons`}>
                  <header className="desk-tier-head">
                    <div className="desk-tier-title">
                      <h2>{tier.name}</h2>
                      <p>{tier.blurb}</p>
                    </div>
                    <span className="desk-tier-count">
                      {tierCount} {tierCount === 1 ? 'lesson' : 'lessons'}
                    </span>
                  </header>

                  {tierGroups.map(group => {
                    const groupLessonList = visibleByGroup[group.key]
                    return (
                      <details
                        key={group.key}
                        className="desk-group"
                        data-group={group.key}
                        open={openGroupKeys.has(group.key)}
                        onToggle={event => recordGroupToggle(group.key, event.currentTarget.open)}
                      >
                        <summary>
                          <span>
                            <span className="desk-group-label">{group.name}</span>
                            <span className="desk-group-title">{group.verbPhrase}</span>
                          </span>
                          <span className="desk-group-meta">
                            <span>{groupLessonList.length} {groupLessonList.length === 1 ? 'lesson' : 'lessons'}</span>
                            <span className="desk-expand" aria-hidden="true">+</span>
                          </span>
                        </summary>
                        <p className="desk-group-lead"><MixedText>{group.lead}</MixedText></p>
                        <ol className="desk-lesson-list">
                          {groupLessonList.map(lesson => (
                            <LessonRow
                              key={lesson.chapter}
                              lesson={lesson}
                              active={lesson.chapter === currentChapter}
                              activeRowRef={activeRowRef}
                              score={bestQuizScore(scores, lesson.chapter)}
                              onChoose={setChapter}
                            />
                          ))}
                        </ol>
                      </details>
                    )
                  })}
                </section>
              )
            })
          )}
        </div>

        <footer className="desk-foot">
          <a href={BOOK_PDF}>Download the free book (PDF)</a>
          <Link to="/report">Spot a mistake? Tell us</Link>
        </footer>
      </main>
    </div>
  )
}
