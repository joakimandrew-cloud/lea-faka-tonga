import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import T from '../components/T.jsx'
import EntryMotif from '../components/EntryMotif.jsx'
import HomePatternBand from '../components/HomePatternBand.jsx'
import { START_HERE, sourceLessons, startHereSection } from '../lib/start-here-content.js'
import { useTitle } from '../lib/title.js'
import '../styles/reference.css'
import '../styles/start-here.css'

// The /start-here page (plan 2026-11-13-start-here-page). Every word on it comes
// from src/premium/lib/start-here-content.js; this file only lays the words out.

// Display only: straight double quotes become curly, as the site's Inline does.
const curly = text => text.replace(/"([^"]*)"/g, '“$1”')

function Source({ value }) {
  const lessons = sourceLessons(value)
  if (!lessons.length) return <span className="start-here-src">{value}</span>
  // Link each lesson number in place, so the source reads exactly as written.
  const pieces = value.split(/(\d+)/)
  return (
    <span className="start-here-src">
      {pieces.map((piece, i) => (/^\d+$/.test(piece)
        ? <Link key={i} to={`/lessons/${piece}`}>{piece}</Link>
        : <Fragment key={i}>{piece}</Fragment>))}
    </span>
  )
}

function Parts({ parts }) {
  // Punctuation straight after a source stays on its line, so no line opens with ". ".
  const shown = parts.map(part => ({ ...part }))
  return shown.map((part, i) => {
    if (part.t === 'to') return <T key={i}>{part.v}</T>
    if (part.t === 'src') {
      const next = shown[i + 1]
      const punct = next && next.t === 'text' ? (next.v.match(/^[.,;:!?]+/) || [''])[0] : ''
      if (!punct) return <Source key={i} value={part.v} />
      next.v = next.v.slice(punct.length)
      return <span key={i} className="start-here-keep"><Source value={part.v} />{punct}</span>
    }
    return <Fragment key={i}>{curly(part.v)}</Fragment>
  })
}

function TestLine({ parts }) {
  // The copy's test line opens "Move on when"; those words carry the weight.
  const [first, ...rest] = parts
  const lead = 'Move on when'
  return (
    <p className="start-here-test">
      <strong>{lead}</strong>
      <Parts parts={[{ ...first, v: first.v.slice(lead.length) }, ...rest]} />
    </p>
  )
}

function LinkList({ items, offset = 0 }) {
  return (
    <ul className="premium-reference-help-links start-here-links">
      {items.map((item, i) => (
        <li key={item.to}>
          <Link to={item.to}>{item.label} <EntryMotif size={20} index={offset + i} /></Link>
        </li>
      ))}
    </ul>
  )
}

function Block({ block, offset }) {
  if (block.type === 'p') return <p><Parts parts={block.parts} /></p>
  if (block.type === 'test') return <TestLine parts={block.parts} />
  if (block.type === 'links') return <LinkList items={block.items} offset={offset} />
  if (block.type === 'ul' || block.type === 'ol') {
    const List = block.type
    return (
      <List className={`start-here-list start-here-list--${block.type}`}>
        {block.items.map((parts, i) => <li key={i}><Parts parts={parts} /></li>)}
      </List>
    )
  }
  if (block.type === 'examples') {
    return (
      <ul className="start-here-examples">
        {block.items.map(item => (
          <li key={item.to} className="start-here-example">
            <T className="start-here-example-to">{item.to}</T>
            <span className="start-here-example-en">
              ({item.meaning}) <Source value={item.source} />
            </span>
          </li>
        ))}
      </ul>
    )
  }
  return null
}

// "Stage 2: When, where ... (Lessons 4, 6 ...)" is shown in three parts, with the
// words unchanged: the stage number, the name, and the lessons it covers.
function StageHeading({ id, text }) {
  const m = text.match(/^(Stage \d+:)\s(.*?)(\s\(Lessons?[^)]*\))?$/)
  if (!m) return <h2 id={`${id}-title`}>{text}</h2>
  return (
    <h2 id={`${id}-title`} className="start-here-stage-title">
      <span className="start-here-stage-n">{m[1]}</span> <span>{m[2]}</span>
      {m[3] && <span className="start-here-stage-range">{m[3]}</span>}
    </h2>
  )
}

function Stage({ section, index }) {
  const main = section.blocks.filter(b => b.type === 'p' || b.type === 'ul')
  const aside = section.blocks.filter(b => b.type === 'test' || b.type === 'links')
  return (
    <section id={section.id} className="start-here-stage" aria-labelledby={`${section.id}-title`}>
      <span className="start-here-stage-mark"><EntryMotif size={30} index={index} /></span>
      <div className="start-here-stage-main">
        <StageHeading id={section.id} text={section.heading} />
        {main.map((block, i) => <Block key={i} block={block} />)}
      </div>
      <div className="start-here-stage-aside">
        {aside.map((block, i) => <Block key={i} block={block} offset={index} />)}
      </div>
    </section>
  )
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
  const stages = START_HERE.sections.filter(s => s.id.startsWith('stage-'))
  const jump = [
    { to: '#first-sentences', label: 'Six sentences' },
    { to: '#routine', label: 'Daily routine' },
    ...stages.map(s => ({ to: `#${s.id}`, label: s.heading.split(':')[0] })),
  ]
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

      <nav className="charts-jump" aria-label="On this page">
        <span>On this page</span>
        <div>{jump.map(item => <a key={item.to} href={item.to}>{item.label}</a>)}</div>
      </nav>

      <div className="wrap start-here-firsts">
        <Card section={startHereSection('first-sentences')} />
        <Card section={startHereSection('routine')} />
      </div>

      <div className="wrap start-here-stages">
        {stages.map((section, i) => <Stage key={section.id} section={section} index={i} />)}
      </div>

      <div className="wrap start-here-end">
        <Card section={startHereSection('limits')} />
      </div>
    </div>
  )
}
