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
 * descriptions do not already make. Use the browse/section class contract
 * styled by the premium reference adapter; legacy CSS is suppressed there.
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

export default function Topics() {
  const byGroup = Object.fromEntries(
    GROUPS.map(g => [g.key, TOPIC_PAGES.filter(t => t.group === g.key)]),
  )

  return (
    <div className="topics-page">
      <header className="section-heading">
        <h1>Topics <span className="dot">·</span> One question each</h1>
        <p className="section-lead">
          Seven pages that answer one common question each, outside the lesson order.
          Read one on its own, and it ends by pointing into the lessons that cover it.
        </p>
      </header>

      <div className="browse-topic-grid">
        {GROUPS.map(group => {
          const entries = byGroup[group.key] || []
          return (
            <section key={group.key} className="browse-panel" aria-labelledby={`topic-group-${group.key}`}>
              <header className="browse-panel-head">
                <div>
                  <p className="browse-kicker">{group.name}</p>
                  <h2 id={`topic-group-${group.key}`}>{group.verbPhrase}</h2>
                  <p>{group.lead}</p>
                </div>
                <span>
                  {entries.length} page{entries.length === 1 ? '' : 's'}
                </span>
              </header>

              <ul className="browse-topic-list">
                {entries.map(topic => (
                  <li key={topic.to}>
                    <Link to={topic.to} className="browse-topic-link">
                      <span>
                        <strong>{topic.label}</strong>
                        <span>{topic.blurb}</span>
                      </span>
                      <span className="browse-next" aria-hidden="true">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
