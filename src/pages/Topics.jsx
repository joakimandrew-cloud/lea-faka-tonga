import { Link } from 'react-router-dom'
import { TOPIC_PAGES, QUESTIONS_PAGE } from '../lib/topic-pages'
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
 * descriptions do not already make. The premium adapter owns the scoped
 * styling; shared topic metadata remains the source for every card.
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

// Presentation annotations only: these terms already appear in the source copy.
const TOPIC_TERMS = {
  '/greetings': ['Mālō e lelei'],
  '/grammar/negation': ['ʻikai', 'te', 'ke'],
  '/grammar/ko-sentences': ['Ko e hele ʻeni', 'Ko'],
}

function TopicText({ text, terms = [] }) {
  if (!terms.length) return text
  const alternatives = [...terms].sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const pattern = new RegExp(`(?<![\\p{L}\\p{M}])(${alternatives})(?![\\p{L}\\p{M}])`, 'gu')
  return text.split(pattern).map((part, index) => terms.includes(part)
    ? <span key={index} lang="to" className="to">{part}</span>
    : part)
}

export default function Topics({ entryMark = '→' }) {
  const mark = index => typeof entryMark === 'function' ? entryMark(index) : entryMark
  const byGroup = Object.fromEntries(
    GROUPS.map(group => [group.key, TOPIC_PAGES.filter(topic => topic.group === group.key)]),
  )

  return (
    <div className="topics-page topics-index">
      <header className="topic-hero">
        <div className="topic-intro">
          <p className="topic-eyebrow">Reference · Read in any order</p>
          <h1>Topics</h1>
          <p className="topic-lead">
            Seven pages that answer one common question each, outside the lesson order.
            Read one on its own, and it ends by pointing into the lessons that cover it.
            {' '}Not started yet? Read the{' '}
            <Link to={QUESTIONS_PAGE.to} className="link">{QUESTIONS_PAGE.link}</Link>.
          </p>
        </div>
        <Link to="/charts" className="topic-charts-link">
          Grammar charts <span aria-hidden="true">{mark(TOPIC_PAGES.length)}</span>
        </Link>
      </header>

      <div className="topic-sections">
        {GROUPS.map(group => {
          const entries = byGroup[group.key]
          return (
            <section key={group.key} className="topic-section" aria-labelledby={`topic-group-${group.key}`}>
              <header className="topic-section-heading">
                <p className="topic-eyebrow">{group.name}</p>
                <h2 id={`topic-group-${group.key}`}>{group.verbPhrase}</h2>
                <p className="topic-section-lead">{group.lead}</p>
                <p className="topic-count">{entries.length} pages</p>
              </header>
              <ul className="topic-card-grid">
                {entries.map(topic => (
                  <li key={topic.to}>
                    <Link to={topic.to} className="topic-card">
                      <strong><TopicText text={topic.label} terms={TOPIC_TERMS[topic.to]} /></strong>
                      <span className="topic-card-description"><TopicText text={topic.blurb} terms={TOPIC_TERMS[topic.to]} /></span>
                      <span className="topic-card-arrow" aria-hidden="true">{mark(TOPIC_PAGES.indexOf(topic))}</span>
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
