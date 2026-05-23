import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useChapter } from '../contexts/ChapterContext'
import chapters from '../data/chapters.json'
import '../styles/v11-components.css'

const ROWS_PER_GROUP = 6

const LEVEL_FILTERS = ['ALL', 'A1', 'A2', 'B1', 'B2']

const GROUPS = [
  {
    key: 'foundations',
    name: 'Foundations',
    verbPhrase: 'Build the sentence',
    lead: 'Tense markers, pronouns, verbs, modifiers, time, commands, and location.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21V11" />
        <path d="M12 11C12 8 9 5 5 5c0 4 3 6 7 6Z" />
        <path d="M12 11c0-3 3-5 7-5 0 4-3 6-7 6Z" />
      </svg>
    ),
  },
  {
    key: 'core-grammar',
    name: 'Core Grammar',
    verbPhrase: 'Connect ideas',
    lead: 'Prepositions, articles, negation, comitative mo, question words, the ko pattern, and everyday greetings.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5.5C5 4.5 8 4 12 5v14c-4-1-7-.5-9 .5V5.5Z" />
        <path d="M21 5.5C19 4.5 16 4 12 5v14c4-1 7-.5 9 .5V5.5Z" />
        <path d="M12 5v14" />
      </svg>
    ),
  },
  {
    key: 'structure-possession',
    name: 'Structure & Possession',
    verbPhrase: 'Mark the subject',
    lead: 'Noun subjects, equational sentences, possessives, definiteness, transitive word order, plus numbers and time.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="14" height="10" />
        <rect x="7" y="10" width="14" height="10" />
      </svg>
    ),
  },
  {
    key: 'expanding-sentences',
    name: 'Expanding Sentences',
    verbPhrase: 'Add nuance',
    lead: 'Auxiliaries, aspect, obligation, conjunctions, plurals, purpose, comparison, directionals, and conditionals.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16v11H8l-4 4V5Z" />
      </svg>
    ),
  },
  {
    key: 'shaping-meaning',
    name: 'Shaping Meaning',
    verbPhrase: 'Refine expression',
    lead: 'Existentials, faka- prefix, instrumental ʻaki, reported speech, compound adjectives, clefts, postposed possessives, modal nuances, relative clauses, and spatial nouns.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="7" height="5" />
        <rect x="13" y="4" width="7" height="5" />
        <rect x="8" y="10" width="8" height="5" />
        <rect x="4" y="16" width="7" height="5" />
        <rect x="13" y="16" width="7" height="5" />
      </svg>
    ),
  },
  {
    key: 'advanced-patterns',
    name: 'Advanced Patterns',
    verbPhrase: 'Master the patterns',
    lead: 'Word class flexibility, advanced time and definitive accent, verbal nouns, noun classes, conditionals, productive suffixes and prefixes, reduplication, special pronouns, and emotional and respectful registers.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 20l5-9 4 6 3-4 6 7H3Z" />
        <path d="M11 12l-2-3" />
      </svg>
    ),
  },
]

const TIERS = [
  {
    key: 'basic',
    name: 'Basic',
    level: 'A1',
    blurb: 'Build the sentence.',
    groupKeys: ['foundations', 'core-grammar', 'structure-possession'],
  },
  {
    key: 'intermediate',
    name: 'Intermediate',
    level: 'A2–B1',
    blurb: 'Expand and refine.',
    groupKeys: ['expanding-sentences', 'shaping-meaning'],
  },
  {
    key: 'advanced',
    name: 'Advanced',
    level: 'B2',
    blurb: 'Productive morphology and register.',
    groupKeys: ['advanced-patterns'],
  },
]

function ChipIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" fill="none">
      <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" />
      <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" />
    </svg>
  )
}

function StatBookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5.5C5 4.5 8 4 12 5v14c-4-1-7-.5-9 .5V5.5Z" />
      <path d="M21 5.5C19 4.5 16 4 12 5v14c4-1 7-.5 9 .5V5.5Z" />
      <path d="M12 5v14" />
    </svg>
  )
}
function StatHeadphonesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1" />
      <rect x="17" y="14" width="4" height="6" rx="1" />
    </svg>
  )
}
function StatPencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l3.5-1 11-11-2.5-2.5-11 11L4 20Z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  )
}
function StatBarsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="14" width="4" height="6" />
      <rect x="10" y="9" width="4" height="11" />
      <rect x="17" y="4" width="4" height="16" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4-4" />
    </svg>
  )
}
function FilterBookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.5C6 4.5 9 4 12 5v14c-3-1-6-.5-8 .5V5.5Z" />
      <path d="M20 5.5C18 4.5 15 4 12 5v14c3-1 6-.5 8 .5V5.5Z" />
    </svg>
  )
}
function FilterChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  )
}

export default function ChapterBrowser() {
  const { setChapter } = useChapter()
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState(null) // 'grammar' | 'conversation' | null
  const [expanded, setExpanded] = useState({}) // { groupKey: true }
  const firstTierRef = useRef(null)

  function toggleType(type) {
    setTypeFilter(prev => (prev === type ? null : type))
  }

  function scrollToGroups() {
    if (firstTierRef.current) {
      firstTierRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return chapters.filter(ch => {
      if (levelFilter !== 'ALL' && ch.level !== levelFilter) return false
      if (typeFilter && ch.type !== typeFilter) return false
      if (q) {
        const hay = `${ch.title} ${ch.preview ?? ''} ${(ch.topics ?? []).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [query, levelFilter, typeFilter])

  const byGroup = useMemo(() => {
    const map = Object.fromEntries(GROUPS.map(g => [g.key, []]))
    for (const ch of filtered) {
      if (map[ch.group]) map[ch.group].push(ch)
    }
    return map
  }, [filtered])

  return (
    <div className="chapters-page">

      <div className="chapters-brand-band">
        <Link to="/" className="brand">
          <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor">
            <polygon points="0,0 50,0 0,50" />
            <polygon points="100,0 50,0 100,50" />
            <polygon points="100,100 50,100 100,50" />
            <polygon points="0,100 50,100 0,50" />
            <polygon points="25,25 50,25 25,50" />
            <polygon points="75,25 50,25 75,50" />
            <polygon points="75,75 50,75 75,50" />
            <polygon points="25,75 50,75 25,50" />
            <polygon points="37.5,37.5 50,37.5 37.5,50" />
            <polygon points="62.5,37.5 50,37.5 62.5,50" />
            <polygon points="62.5,62.5 50,62.5 62.5,50" />
            <polygon points="37.5,62.5 50,62.5 37.5,50" />
          </svg>
          <span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <Link to="/" className="home-link">← Home</Link>
      </div>

      <div className="chapters-hero">
        <div>
          <div className="chapters-hero-eyebrow">Contents · Ako ʻa e Lea</div>
          <h1 className="chapters-hero-title">
            53 Chapters.
            <span className="tone">One Grammar.</span>
          </h1>
          <p className="chapters-hero-lede">
            A clear, structured path to learning Tongan grammar. Study, listen, and practice with real examples.
          </p>
          <div className="chapters-hero-cta">
            <Link to="/chapters/1" className="chapters-cta-primary" onClick={() => setChapter(1)}>
              Start Chapter 1 <span aria-hidden="true">→</span>
            </Link>
            <button type="button" className="chapters-cta-secondary" onClick={scrollToGroups}>
              Browse by Topic <span aria-hidden="true">⊞</span>
            </button>
          </div>
        </div>

        <aside className="chapters-info-card">
          <div className="chapters-info-card-eyebrow">Complete Tongan Grammar Course</div>
          <div className="chapters-stat-row">
            <div className="chapters-stat-cell">
              <StatBookIcon />
              <div className="chapters-stat-label">53</div>
              <div className="chapters-stat-sub">Chapters</div>
            </div>
            <div className="chapters-stat-cell">
              <StatHeadphonesIcon />
              <div className="chapters-stat-label">Audio</div>
              <div className="chapters-stat-sub">Examples</div>
            </div>
            <div className="chapters-stat-cell">
              <StatPencilIcon />
              <div className="chapters-stat-label">Practice</div>
              <div className="chapters-stat-sub">Exercises</div>
            </div>
            <div className="chapters-stat-cell">
              <StatBarsIcon />
              <div className="chapters-stat-label">A1–B2</div>
              <div className="chapters-stat-sub">Progressive</div>
            </div>
          </div>
          <div className="chapters-info-card-rule" />
          <div className="chapters-info-card-foot">
            <p className="chapters-info-card-blurb">
              From the basics to advanced structures — everything you need in one complete course.
            </p>
            <div className="chapters-cefr-badge">
              <span className="level">A1–B2</span>
              <div className="scope">Beginner → Advanced</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="chapters-search-band">
        <label className="chapters-search">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search chapters (e.g., noun, tense, greetings)"
            aria-label="Search chapters"
          />
        </label>
        <div className="chapters-filters">
          {LEVEL_FILTERS.map(level => (
            <button
              key={level}
              type="button"
              className={`chapters-filter-chip ${levelFilter === level ? 'is-active' : ''}`}
              onClick={() => setLevelFilter(level)}
            >
              {level}
            </button>
          ))}
          <span className="chapters-filter-divider" aria-hidden="true" />
          <button
            type="button"
            className={`chapters-filter-chip ${typeFilter === 'grammar' ? 'is-active' : ''}`}
            onClick={() => toggleType('grammar')}
          >
            <FilterBookIcon />
            Grammar
          </button>
          <button
            type="button"
            className={`chapters-filter-chip ${typeFilter === 'conversation' ? 'is-active' : ''}`}
            onClick={() => toggleType('conversation')}
          >
            <FilterChatIcon />
            Conversation
          </button>
        </div>
      </div>

      <div className="chapters-groups">
        {TIERS.map((tier, tierIdx) => {
          const tierGroups = tier.groupKeys
            .map(key => GROUPS.find(g => g.key === key))
            .filter(Boolean)
          const tierCount = tierGroups.reduce(
            (sum, g) => sum + (byGroup[g.key]?.length || 0),
            0,
          )

          return (
            <section
              key={tier.key}
              className="chapters-tier"
              ref={tierIdx === 0 ? firstTierRef : undefined}
            >
              <header className="chapters-tier-banner">
                <div className="chapters-tier-heading">
                  <div className="chapters-tier-eyebrow">Tier · {tier.level}</div>
                  <h2 className="chapters-tier-name">{tier.name}</h2>
                  <p className="chapters-tier-blurb">{tier.blurb}</p>
                </div>
                <div className="chapters-tier-count">
                  {tierCount} chapter{tierCount === 1 ? '' : 's'}
                </div>
              </header>

              {tierGroups.map((group, gIdx) => {
                const all = byGroup[group.key] || []
                const isExpanded = !!expanded[group.key]
                const visible = isExpanded ? all : all.slice(0, ROWS_PER_GROUP)
                const hasMore = all.length > ROWS_PER_GROUP

                return (
                  <section
                    key={group.key}
                    className="chapters-group"
                  >
                    <span className="chapters-group-chip">
                      <ChipIcon />
                      {group.name}
                    </span>
                    <div className="chapters-group-headrow">
                      <h2 className="chapters-group-name">{group.verbPhrase}</h2>
                      <span className="chapters-group-count">{all.length} chapter{all.length === 1 ? '' : 's'}</span>
                    </div>
                    <p className="chapters-group-lead">{group.lead}</p>

                    {all.length === 0 ? (
                      <div className="chapters-empty">No chapters match these filters.</div>
                    ) : (
                      <div className="chapters-group-grid">
                        {visible.map(ch => (
                          <Link
                            key={ch.chapter}
                            to={`/chapters/${ch.chapter}`}
                            className="chapter-row"
                            onClick={() => setChapter(ch.chapter)}
                          >
                            <span className="chapter-row-marker" aria-hidden="true" />
                            <span className="chapter-row-num">{String(ch.chapter).padStart(2, '0')}</span>
                            <span className="chapter-row-body">
                              <span className="chapter-row-title">{ch.title}</span>
                              <span className="chapter-row-preview">{ch.preview}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {hasMore && (
                      <div className="chapters-group-foot">
                        <button
                          type="button"
                          className="chapters-group-foot-btn"
                          onClick={() => setExpanded(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                        >
                          {isExpanded
                            ? <>Show fewer <span aria-hidden="true">↑</span></>
                            : <>View all {all.length} chapters <span aria-hidden="true">→</span></>}
                        </button>
                      </div>
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
