import { Link } from 'react-router-dom'
import quizzes from '../data/quizzes.json'
import chapters from '../data/chapters.json'

const GROUPS = [
  { key: 'foundations',          name: 'Foundations',           verbPhrase: 'Build the sentence',  lead: 'Tense markers, pronouns, verbs, modifiers, time, commands, and location.' },
  { key: 'core-grammar',         name: 'Core Grammar',          verbPhrase: 'Connect ideas',       lead: 'Prepositions, articles, negation, comitative mo, question words, the ko pattern, and everyday greetings.' },
  { key: 'structure-possession', name: 'Structure & Possession', verbPhrase: 'Mark the subject',   lead: 'Noun subjects, equational sentences, possessives, definiteness, transitive word order, plus numbers and time.' },
  { key: 'expanding-sentences',  name: 'Expanding Sentences',   verbPhrase: 'Add nuance',          lead: 'Auxiliaries, aspect, obligation, conjunctions, plurals, purpose, comparison, directionals, and conditionals.' },
  { key: 'shaping-meaning',      name: 'Shaping Meaning',       verbPhrase: 'Refine expression',   lead: 'Existentials, faka- prefix, instrumental ʻaki, reported speech, compound adjectives, clefts, postposed possessives, modal nuances, relative clauses, and spatial nouns.' },
  { key: 'advanced-patterns',    name: 'Advanced Patterns',     verbPhrase: 'Master the patterns', lead: 'Word class flexibility, advanced time and definitive accent, verbal nouns, noun classes, conditionals, productive suffixes and prefixes, reduplication, special pronouns, and emotional and respectful registers.' },
]

const TIERS = [
  { key: 'basic',        name: 'Basic',        blurb: 'Build the sentence.',                  groupKeys: ['foundations', 'core-grammar', 'structure-possession'] },
  { key: 'intermediate', name: 'Intermediate', blurb: 'Expand and refine.',                   groupKeys: ['expanding-sentences', 'shaping-meaning'] },
  { key: 'advanced',     name: 'Advanced',     blurb: 'Productive morphology and register.',  groupKeys: ['advanced-patterns'] },
]

function ChipIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true" fill="none">
      <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1" />
      <rect x="3.5" y="3.5" width="5" height="5" fill="currentColor" />
    </svg>
  )
}

export default function QuizIndex() {
  const entries = Object.values(quizzes)
    .filter(q => q && Array.isArray(q.questions) && q.questions.length > 0)
    .map(q => ({ quiz: q, chapter: chapters.find(c => c.chapter === q.chapter) }))
    .filter(e => e.chapter)
    .sort((a, b) => a.quiz.chapter - b.quiz.chapter)

  const byGroup = Object.fromEntries(GROUPS.map(g => [g.key, []]))
  for (const e of entries) {
    if (byGroup[e.chapter.group]) byGroup[e.chapter.group].push(e)
  }

  return (
    <div className="quizzes-page">
      <header className="panel-heading">
        <h1>Quizzes <span className="dot">·</span> Comprehension</h1>
        <p className="lead">
          Multiple-choice quizzes — one for each chapter. Each quiz tests the patterns introduced in that chapter.
        </p>
      </header>

      <div className="chapters-groups">
        {TIERS.map(tier => {
          const tierGroups = tier.groupKeys
            .map(k => GROUPS.find(g => g.key === k))
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
                  {tierCount} quiz{tierCount === 1 ? '' : 'zes'}
                </div>
              </header>

              {tierGroups.map(group => {
                const groupEntries = byGroup[group.key] || []
                return (
                  <section key={group.key} className="chapters-group">
                    <span className="chapters-group-chip">
                      <ChipIcon />
                      {group.name}
                    </span>
                    <div className="chapters-group-headrow">
                      <h2 className="chapters-group-name">{group.verbPhrase}</h2>
                      <span className="chapters-group-count">
                        {groupEntries.length} quiz{groupEntries.length === 1 ? '' : 'zes'}
                      </span>
                    </div>
                    <p className="chapters-group-lead">{group.lead}</p>

                    {groupEntries.length === 0 ? (
                      <div className="chapters-empty">No quizzes available yet.</div>
                    ) : (
                      <div className="chapters-group-grid">
                        {groupEntries.map(({ quiz, chapter }) => (
                          <Link
                            key={quiz.chapter}
                            to={`/quizzes/${quiz.chapter}`}
                            className="chapter-row"
                          >
                            <span className="chapter-row-marker" aria-hidden="true" />
                            <span className="chapter-row-num">{String(quiz.chapter).padStart(2, '0')}</span>
                            <span className="chapter-row-body">
                              <span className="chapter-row-title">{chapter.title}</span>
                              <span className="chapter-row-preview">{chapter.preview ?? `${quiz.questions.length} questions`}</span>
                            </span>
                          </Link>
                        ))}
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
