import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import T from '../components/T.jsx'
import EntryMotif from '../components/EntryMotif.jsx'
import HomePatternBand from '../components/HomePatternBand.jsx'
import { START_HERE, startHereSection } from '../lib/start-here-content.js'
import { useTitle } from '../lib/title.js'
import '../styles/reference.css'
import '../styles/start-here.css'

// The /start-here page (plan 2026-11-19-start-here-rewrite): how to study the lessons
// in order. Every word on it comes from src/premium/lib/start-here-content.js; this
// file only lays the words out.

// Display only: straight double quotes become curly, as the site's Inline does.
const curly = text => text.replace(/"([^"]*)"/g, '“$1”')

function Parts({ parts }) {
  return parts.map((part, i) => {
    if (part.t === 'to') return <T key={i}>{part.v}</T>
    if (part.t === 'lesson') {
      return <Link key={i} className="start-here-lesson" to={`/lessons/${part.v}`}>Lesson {part.v}</Link>
    }
    return <Fragment key={i}>{curly(part.v)}</Fragment>
  })
}

function LinkList({ items }) {
  return (
    <ul className="premium-reference-help-links start-here-links">
      {items.map((item, i) => (
        <li key={item.to}>
          <Link to={item.to}>{item.label} <EntryMotif size={20} index={i} /></Link>
        </li>
      ))}
    </ul>
  )
}

function Block({ block }) {
  if (block.type === 'p') return <p><Parts parts={block.parts} /></p>
  if (block.type === 'links') return <LinkList items={block.items} />
  if (block.type === 'ul' || block.type === 'ol') {
    const List = block.type
    return (
      <List className={`start-here-list start-here-list--${block.type}`}>
        {block.items.map((parts, i) => <li key={i}><Parts parts={parts} /></li>)}
      </List>
    )
  }
  return null
}

function Card({ section }) {
  return (
    <section id={section.id} className="premium-reference-help-card start-here-card" aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`}>{section.heading}</h2>
      {section.blocks.map((block, i) => <Block key={i} block={block} />)}
    </section>
  )
}

export default function StartHere() {
  useTitle(START_HERE.meta.title)
  const intro = startHereSection('intro')
  const cards = START_HERE.sections.filter(section => section.id !== 'intro')
  return (
    <div className="premium-reference premium-reference-start" data-page="start-here">
      <section className="premium-reference-help-hero band grain" aria-labelledby="start-here-title">
        <div className="wrap">
          <p className="eyebrow">New to Tongan?</p>
          <h1 id="start-here-title" className="display">{START_HERE.heading}</h1>
          {intro.blocks.map((block, i) => <p key={i} className="start-here-lead"><Parts parts={block.parts} /></p>)}
        </div>
        <HomePatternBand className="premium-reference-help-kupesi" />
      </section>

      <div className="wrap start-here-cards">
        {cards.map(section => <Card key={section.id} section={section} />)}
      </div>
    </div>
  )
}
