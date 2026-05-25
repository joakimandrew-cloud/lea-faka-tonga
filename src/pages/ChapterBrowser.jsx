import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useChapter } from '../contexts/ChapterContext'
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

  const byGroup = useMemo(() => {
    const map = Object.fromEntries(GROUPS.map(g => [g.key, []]))
    for (const ch of chapters) {
      if (map[ch.group]) map[ch.group].push(ch)
    }
    return map
  }, [])

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

      <div className="chapters-groups">
        {TIERS.map(tier => {
          const tierGroups = tier.groupKeys
            .map(key => GROUPS.find(g => g.key === key))
            .filter(Boolean)
          const tierCount = tierGroups.reduce(
            (sum, g) => sum + (byGroup[g.key]?.length || 0),
            0,
          )

          return (
            <section key={tier.key} className="chapters-tier">
              <header className="chapters-tier-banner">
                <div className="chapters-tier-heading">
                  <h2 className="chapters-tier-name">{tier.name}</h2>
                  <p className="chapters-tier-blurb">{tier.blurb}</p>
                </div>
                <div className="chapters-tier-count">
                  {tierCount} chapter{tierCount === 1 ? '' : 's'}
                </div>
              </header>

              {tierGroups.map(group => {
                const all = byGroup[group.key] || []

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
                        {all.length} chapter{all.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="subsection-sub">{group.lead}</p>
                    <hr className="subsection-rule" />

                    {all.length === 0 ? (
                      <div className="chapters-empty">No chapters in this section.</div>
                    ) : (
                      <ol className="chapter-list">
                        {all.map(ch => {
                          const isActive = ch.chapter === currentChapter
                          return (
                            <li key={ch.chapter}>
                              <Link
                                to={`/chapters/${ch.chapter}`}
                                className={`chapter-list-row${isActive ? ' is-active' : ''}`}
                                onClick={() => setChapter(ch.chapter)}
                              >
                                <span className="chapter-list-num">{String(ch.chapter).padStart(2, '0')}</span>
                                <span className="chapter-list-body">
                                  <span className="chapter-list-title">{ch.title}</span>
                                  <span className="chapter-list-sub">{ch.preview}</span>
                                </span>
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
