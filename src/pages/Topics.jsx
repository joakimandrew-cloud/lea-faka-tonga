import { Link } from 'react-router-dom'
import { TOPIC_PAGES } from '../lib/topic-pages'
import '../styles/v11-components.css'

/**
 * /topics: the hub for the seven standalone topic pages.
 *
 * Built 2026-08-26. The pages themselves already existed and were already
 * written; five of them had no internal link pointing at them, so Google could
 * reach them and a person on the site could not. This is the page that fixes
 * that, plus the Topics entry in the header nav and the footer strip.
 *
 * The route is /topics rather than /grammar because two of the seven, the
 * alphabet and the greetings, are not grammar.
 *
 * Every line on a card is shortened from that page's own meta description in
 * src/seo/meta.js. Nothing here makes a claim about Tongan that the
 * descriptions do not already make. The layout is the QuizIndex layout, class
 * for class.
 */

const GROUPS = [
  {
    key: 'sounds',
    name: 'Sounds & Greetings',
    verbPhrase: 'Say it out loud',
    lead: 'The letters and what each one sounds like, and the words you say when you meet someone.',
  },
  {
    key: 'grammar',
    name: 'Grammar',
    verbPhrase: 'How a sentence works',
    lead: 'Tense, word order, the negative, possessives, and the pattern for saying what something is.',
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

export default function Topics() {
  const byGroup = Object.fromEntries(
    GROUPS.map(g => [g.key, TOPIC_PAGES.filter(t => t.group === g.key)]),
  )

  return (
    <div className="topics-page">
      <header className="panel-heading">
        <h1>Topics <span className="dot">·</span> One question each</h1>
        <p className="lead">
          Seven pages that answer one common question each, outside the lesson order.
          Read one on its own, and it ends by pointing into the lessons that cover it.
        </p>
      </header>

      <div className="chapters-groups">
        {GROUPS.map(group => {
          const entries = byGroup[group.key] || []
          return (
            <section key={group.key} className="chapters-group">
              <span className="chapters-group-chip">
                <ChipIcon />
                {group.name}
              </span>
              <div className="chapters-group-headrow">
                <h2 className="chapters-group-name">{group.verbPhrase}</h2>
                <span className="chapters-group-count">
                  {entries.length} page{entries.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="chapters-group-lead">{group.lead}</p>

              <div className="chapters-group-grid">
                {entries.map(topic => (
                  <Link key={topic.to} to={topic.to} className="chapter-row">
                    <span className="chapter-row-marker" aria-hidden="true" />
                    <span className="chapter-row-body">
                      <span className="chapter-row-title">{topic.label}</span>
                      <span className="chapter-row-preview">{topic.blurb}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
