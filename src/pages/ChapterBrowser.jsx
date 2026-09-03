import { useMemo, useRef, useState, useEffect } from 'react'
import LogoMark from '../components/LogoMark'
import { Link } from 'react-router-dom'
import { okinafy } from '../lib/okinafy'
import { useChapter } from '../contexts/ChapterContext'
// UX-03: this page renders outside <Layout />, so it carried neither the six
// section links every other in-app page has nor the theme pill. Both are shared
// pieces now, so the band below shows the identical ones.
import { NAV_LINKS } from '../lib/nav-links'
import ThemeToggle from '../components/ThemeToggle'
// UX-11: a lesson whose quiz has been finished carries a tick, so the index
// shows what has been done as well as where the learner stopped.
import { readQuizScores, bestQuizScore } from '../lib/quiz-scores'
import chapters from '../data/chapters.json'
import '../styles/v11-components.css'

const GROUPS = [
  {
    key: 'foundations',
    name: 'Foundations',
    verbPhrase: 'Build the sentence',
    lead: 'Tense markers, pronouns, verbs, modifiers, time, commands, and location.',
  },
  {
    key: 'core-grammar',
    name: 'Core Grammar',
    verbPhrase: 'Connect ideas',
    lead: 'Prepositions, articles, negation, comitative mo, question words, the ko pattern, and everyday greetings.',
  },
  {
    key: 'structure-possession',
    name: 'Structure & Possession',
    verbPhrase: 'Mark the subject',
    lead: 'Noun subjects, equational sentences, possessives, definiteness, transitive word order, plus numbers and time.',
  },
  {
    key: 'expanding-sentences',
    name: 'Expanding Sentences',
    verbPhrase: 'Add nuance',
    lead: 'Auxiliaries, aspect, obligation, conjunctions, plurals, purpose, comparison, directionals, and conditionals.',
  },
  {
    key: 'shaping-meaning',
    name: 'Shaping Meaning',
    verbPhrase: 'Refine expression',
    lead: 'Existentials, faka- prefix, instrumental ʻaki, reported speech, compound adjectives, clefts, postposed possessives, modal nuances, relative clauses, and spatial nouns.',
  },
  {
    key: 'advanced-patterns',
    name: 'Advanced Patterns',
    verbPhrase: 'Master the patterns',
    lead: 'Word class flexibility, advanced time and definitive accent, verbal nouns, noun classes, conditionals, productive suffixes and prefixes, reduplication, special pronouns, and emotional and respectful registers.',
  },
]

const TIERS = [
  {
    key: 'basic',
    name: 'Basic',
    blurb: 'Build the sentence.',
    groupKeys: ['foundations', 'core-grammar', 'structure-possession'],
  },
  {
    key: 'intermediate',
    name: 'Intermediate',
    blurb: 'Expand and refine.',
    groupKeys: ['expanding-sentences', 'shaping-meaning'],
  },
  {
    key: 'advanced',
    name: 'Advanced',
    blurb: 'Productive morphology and register.',
    groupKeys: ['advanced-patterns'],
  },
]

// UX-04: what a typed query is matched against. The lesson's title and the two
// topic chips the row already prints, nothing hidden. Chips are matched in both
// spellings because the row renders them through okinafy, so a learner typing a
// plain apostrophe should still find "ʻoku".
function matchesLesson(ch, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (ch.title.toLowerCase().includes(q)) return true
  const topics = Array.isArray(ch.topics) ? ch.topics.slice(0, 2) : []
  return topics.some(
    t => t.toLowerCase().includes(q) || okinafy(t).toLowerCase().includes(q),
  )
}

function ChipIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" fill="none">
      <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" />
      <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" />
    </svg>
  )
}

export default function ChapterBrowser() {
  const { chapter: currentChapter, setChapter } = useChapter()
  // UX-01: the index is 12 phone screens long and the only trace of a returning
  // learner was a grey highlight somewhere down it. The row below names where
  // they stopped, and the ref pulls that highlighted row onto the screen.
  const activeRowRef = useRef(null)
  // UX-04: fifty-two lessons with no search and no level jump. The box and the
  // chips are the pair /drills already uses, in this page's own palette.
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [scores] = useState(readQuizScores)
  const filtering = query.trim() !== '' || level !== 'all'

  const resume = useMemo(
    () => (currentChapter > 1 ? chapters.find(c => c.chapter === currentChapter) : null),
    [currentChapter],
  )

  useEffect(() => {
    if (!resume || !activeRowRef.current) return
    activeRowRef.current.scrollIntoView({ block: 'center' })
  }, [resume])

  const byGroup = useMemo(() => {
    const map = Object.fromEntries(GROUPS.map(g => [g.key, []]))
    for (const ch of chapters) {
      if (map[ch.group]) map[ch.group].push(ch)
    }
    return map
  }, [])

  // The typed query narrows the rows; the level chip hides whole bands. Both
  // are applied here so every count on the page reports what is actually shown.
  const visibleByGroup = useMemo(() => {
    const map = {}
    for (const g of GROUPS) {
      map[g.key] = (byGroup[g.key] || []).filter(ch => matchesLesson(ch, query))
    }
    return map
  }, [byGroup, query])

  const shownTotal = TIERS.reduce((sum, tier) => {
    if (level !== 'all' && level !== tier.key) return sum
    return sum + tier.groupKeys.reduce((n, key) => n + (visibleByGroup[key]?.length || 0), 0)
  }, 0)

  return (
    <div className="chapters-page">

      <div className="chapters-brand-band">
        <Link to="/" className="brand">
          <LogoMark className="logo-mark" />
          <span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <div className="chapters-brand-actions">
          <Link to="/" className="home-link">← Home</Link>
          <nav className="header-nav" aria-label="Site sections">
            {NAV_LINKS.map(l => (
              <Link key={l.to} to={l.to}>{l.label}</Link>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>

      <div className="chapters-groups">
        {/* Cold-visitor framing (CVC-03): Google can land a stranger here directly —
            without this line the page is an unlabelled syllabus starting "BASIC".
            The nbsp groups keep mobile wraps at the middots, never mid-phrase. */}
        <div className="chapters-course-intro">
          The&nbsp;full&nbsp;course &middot; 52&nbsp;lessons &middot; free&nbsp;while&nbsp;we&nbsp;build&nbsp;it
        </div>
        {resume && (
          <Link to={`/lessons/${resume.chapter}`} className="chapters-continue">
            Continue &middot; Lesson&nbsp;{resume.chapter} &middot; {resume.title}
          </Link>
        )}
        {/* UX-04: the search box and the level chips, ported from /drills.
            BASIC, not BEGINNER: the bands below have been named Basic /
            Intermediate / Advanced since UX-12 unified the public names. */}
        <div className="chapters-filter">
          <input
            type="search"
            className="chapters-search"
            placeholder="Search lessons (e.g., possessive, tense, greetings)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search lessons"
          />
          <div className="chapters-chips" role="group" aria-label="Filter by level">
            {[['all', 'All'], ['basic', 'Basic'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`chapters-chip${level === key ? ' is-active' : ''}`}
                onClick={() => setLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtering && shownTotal === 0 && (
          <p className="chapters-no-match">No lesson matches.</p>
        )}

        {TIERS.map(tier => {
          if (level !== 'all' && level !== tier.key) return null
          const tierGroups = tier.groupKeys
            .map(key => GROUPS.find(g => g.key === key))
            .filter(Boolean)
          const tierCount = tierGroups.reduce(
            (sum, g) => sum + (visibleByGroup[g.key]?.length || 0),
            0,
          )
          if (filtering && tierCount === 0) return null

          return (
            <section key={tier.key} className={`chapters-tier chapters-tier--${tier.key}`}>
              <header className="chapters-tier-banner">
                <div className="chapters-tier-heading">
                  <h2 className="chapters-tier-name">{tier.name}</h2>
                  <p className="chapters-tier-blurb">{tier.blurb}</p>
                </div>
                <div className="chapters-tier-count">
                  {tierCount} lesson{tierCount === 1 ? '' : 's'}
                </div>
              </header>

              {tierGroups.map(group => {
                const all = visibleByGroup[group.key] || []
                if (filtering && all.length === 0) return null

                return (
                  <section key={group.key} className="chapter-subsection">
                    <div className="subsection-head">
                      <div className="subsection-head-left">
                        <span className="subsection-pill">
                          <ChipIcon />
                          {group.name}
                        </span>
                        <h3 className="subsection-title">{group.verbPhrase}</h3>
                      </div>
                      <span className="subsection-count">
                        {all.length} lesson{all.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="subsection-sub">{group.lead}</p>
                    <hr className="subsection-rule" />

                    {all.length === 0 ? (
                      <div className="chapters-empty">No lessons in this section.</div>
                    ) : (
                      <ol className="chapter-list">
                        {all.map(ch => {
                          const isActive = ch.chapter === currentChapter
                          const sample = ch.teaching?.key_rules?.[0]
                          const topics = Array.isArray(ch.topics) ? ch.topics.slice(0, 2) : []
                          const best = bestQuizScore(scores, ch.chapter)
                          return (
                            <li key={ch.chapter}>
                              <Link
                                to={`/lessons/${ch.chapter}`}
                                ref={isActive ? activeRowRef : null}
                                className={`chapter-list-row${isActive ? ' is-active' : ''}`}
                                onClick={() => setChapter(ch.chapter)}
                              >
                                <span className="chapter-list-num">{String(ch.chapter).padStart(2, '0')}</span>
                                <span className="chapter-list-body">
                                  <span className="chapter-list-title">{ch.title}</span>
                                  {sample?.example_tongan && (
                                    <span className="chapter-list-sample">
                                      {okinafy(sample.example_tongan)}
                                      {sample.example_english && (
                                        <span className="chapter-list-gloss">{sample.example_english}</span>
                                      )}
                                    </span>
                                  )}
                                  {topics.length > 0 && (
                                    <span className="chapter-list-chips">
                                      {topics.map((t, i) => (
                                        <span key={i} className="chapter-list-chip">{okinafy(t)}</span>
                                      ))}
                                    </span>
                                  )}
                                </span>
                                {best && (
                                  <span className="chapter-list-tick">
                                    <span aria-hidden="true">&#10003;</span>
                                    <span className="sr-only">
                                      Quiz done, best score {best.best} out of {best.of}
                                    </span>
                                  </span>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ol>
                    )}
                  </section>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}
