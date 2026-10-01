import { okinafy } from '@app/lib/okinafy.js'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion as Motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { plainInline } from '../../lib/lesson-content.js'
import { advanceDeck, lessonCards, lessonDeckKey, restartDeck, useDeckProgress } from '../../lib/card-progress.js'
import T from '../T.jsx'
import chapters from '@app/data/chapters.json'
import '../../styles/example-formatting.css'
import '../../styles/cards.css'
import PracticeCard from '../practice/PracticeCard.jsx'
import { Md } from './InlineMarkdown.jsx'
export { Md } from './InlineMarkdown.jsx'


const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-8% 0px' },
  transition: { duration: .7, ease: [.16, 1, .3, 1] },
}

function Pair({ p, big }) {
  if (p.line) {
    return (
      <div className={`pair pair-source-line ${big ? 'is-big' : ''}`}>
        <span className="pair-source"><Md text={p.line} /></span>
      </div>
    )
  }
  if (!p.tongan) return <p className="pair-note"><Md text={p.english} /></p>
  const arrow = p.english.match(/^([↘↗])\s*/)
  const english = okinafy(arrow ? p.english.slice(arrow[0].length) : p.english)
  return (
    <div className={`pair ${big ? 'is-big' : ''}`}>
      <T className="pair-to">{p.tongan}</T>
      <span className="pair-en">
        {arrow && <span className={`pair-tone ${arrow[1] === '↗' ? 'up' : 'down'}`} aria-label={arrow[1] === '↗' ? 'rising voice' : 'falling voice'}>{arrow[1]}</span>}
        <Md text={english} />
      </span>
    </div>
  )
}

export function Examples({ pairs }) {
  return (
    <Motion.div className="ex-block" {...reveal}>
      {pairs.map((p, i) => <Pair key={i} p={p} big={pairs.length <= 2} />)}
    </Motion.div>
  )
}

export function Pairs({ pairs }) {
  return (
    <Motion.div className="ex-inline" {...reveal}>
      {pairs.map((p, i) => <Pair key={i} p={p} />)}
    </Motion.div>
  )
}

function Cell({ text, header }) {
  const Tag = header ? 'th' : 'td'
  return <Tag><Md text={text} /></Tag>
}

export function Table({ head, body }) {
  const wide = head.length > 3
  return (
    <Motion.div className={`tbl-wrap ${wide ? 'is-wide' : ''}`} {...reveal}>
      <div className="tbl-scroll" tabIndex={wide ? 0 : undefined} role={wide ? 'region' : undefined} aria-label={wide ? 'Scrollable table' : undefined}>
        <table className="tbl">
          <thead><tr>{head.map((h, i) => <Cell key={i} text={h} header />)}</tr></thead>
          <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 && wide ? <th key={j} scope="row"><Md text={c} /></th> : <Cell key={j} text={c} />)}</tr>)}</tbody>
        </table>
      </div>
    </Motion.div>
  )
}

export function Note({ label, text }) {
  // Cross-references like "Lesson 9: The Negative" become links.
  return (
    <Motion.aside className={`note ${label ? '' : 'is-unlabelled'}`} {...reveal}>
      {label && <span className="note-k">{label}:</span>}
      <p><Linked text={text} /></p>
    </Motion.aside>
  )
}

const TITLES = Object.fromEntries(chapters.map(c => [c.chapter, c.title]))

export function Linked({ text }) {
  // "Lesson N" plus, when it follows, that lesson's real title, as one link.
  const out = []
  let rest = text
  let k = 0
  const re = /Lesson (\d+)/
  while (rest) {
    const m = rest.match(re)
    if (!m) { out.push(<Md key={k++} text={rest} />); break }
    const before = rest.slice(0, m.index)
    if (before) out.push(<Md key={k++} text={before} />)
    const n = Number(m[1])
    let label = m[0]
    const after = rest.slice(m.index + m[0].length)
    const title = TITLES[n]
    if (title && after.startsWith(`: ${title}`)) label += `: ${title}`
    out.push(TITLES[n] ? <Link key={k++} to={`/lessons/${n}`} className="xref">{label}</Link> : <span key={k++}>{label}</span>)
    rest = rest.slice(m.index + label.length)
  }
  return out
}

export function Para({ text }) {
  return <Motion.p className="para" {...reveal}><Linked text={text} /></Motion.p>
}

export function List({ ordered, items }) {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className="lst">
      {items.map((item, index) => (
        <li key={index}>
          <Md text={typeof item === 'string' ? item : item.text} />
          {typeof item !== 'string' && item.children?.map((child, childIndex) => (
            <List key={childIndex} ordered={child.ordered} items={child.items} />
          ))}
        </li>
      ))}
    </Tag>
  )
}

/* Words to Learn: source groups share one table/deck, with each source label
   kept beside its own rows (DECISIONS 2026-06-16: one merged table). */
export function WordCards({ groups, lesson }) {
  const tables = useMemo(() => groups.map(group => group.table), [groups])
  const words = useMemo(() => lessonCards(tables, lesson), [tables, lesson])
  const [view, setView] = useState('table')
  const helpId = useId()
  return (
    <div className="words">
      <div className="words-toolbar">
        <p>{words.length} words from this lesson</p>
        <div className="words-view-options" role="group" aria-label="Vocabulary view" aria-describedby={helpId}>
          <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}>Read the table</button>
          <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}>Practise with flip cards</button>
        </div>
      </div>
      <p className="words-view-help" id={helpId}>Scan every word in the table, or use flip cards to test yourself one word at a time.</p>
      {view === 'table' ? (
        <div className="tbl-wrap words-table">
          <div className="tbl-scroll">
            <table className="tbl">
              {groups.map((group, groupIndex) => (
                <tbody className="words-group" key={`${lesson}-${groupIndex}`}>
                  {group.label && <tr className="words-group-label"><th colSpan={group.table.head.length}><Md text={group.label} /></th></tr>}
                  <tr className="words-group-cols">{group.table.head.map((heading, index) => <th key={index} scope="col"><Md text={heading} /></th>)}</tr>
                  {group.table.body.map((row, rowIndex) => (
                    <tr className="words-row" key={`${groupIndex}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => <td key={cellIndex}>{cellIndex === 0 ? <T>{plainInline(cell)}</T> : <Md text={cell} />}</td>)}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      ) : (
        <EmbeddedWordDeck key={lessonDeckKey(lesson)} words={words} lesson={lesson} />
      )}
      <Link to={`/cards?lesson=${lesson}`} className="words-cta">
          <span>Open the full Lesson {lesson} deck</span>
          <span className="arr" aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

function EmbeddedWordDeck({ words, lesson }) {
  const [state, setState] = useDeckProgress(lessonDeckKey(lesson), words)
  const [flipped, setFlipped] = useState(false)
  const deckRef = useRef(null)
  const byId = useMemo(() => new Map(words.map(word => [word.id, word])), [words])
  const word = byId.get(state.order[state.position])
  const [exitDirection, setExitDirection] = useState(1)
  const queue = state.order.slice(state.position).map(id => byId.get(id)).filter(Boolean)

  const grade = (pile) => {
    setExitDirection(pile === 'known' ? 1 : -1)
    setState(previous => advanceDeck(previous, pile))
    setFlipped(false)
    deckRef.current?.focus()
  }

  useEffect(() => {
    deckRef.current?.focus()
  }, [])

  const onKeyDown = (event) => {
    if (event.target !== event.currentTarget && !event.target.closest('.fc')) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setFlipped(value => !value)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      grade('again')
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      grade('known')
    }
  }

  if (!word || state.finished) {
    return (
      <div className="vp-complete" role="status">
        <strong>Lesson deck complete.</strong>
        <span>{state.known.length} known · {state.again.length} to revisit</span>
        <div>
          {state.again.length > 0 && <button type="button" onClick={() => { setFlipped(false); setState(previous => restartDeck(previous, words, previous.again)) }}>Practise missed words</button>}
          <button type="button" onClick={() => { setFlipped(false); setState(previous => restartDeck(previous, words)) }}>Restart lesson deck</button>
        </div>
      </div>
    )
  }

  return (
    <div className="vp-deck" ref={deckRef} tabIndex="0" onKeyDown={onKeyDown} aria-label="Lesson vocabulary cards. Space flips; left marks again; right marks known.">
      <div className="vp-status" role="status">{state.position + 1} / {state.order.length}<span>{state.again.length} again · {state.known.length} known</span></div>
      <div className="deck">
        <AnimatePresence custom={exitDirection}>
          {queue.slice(0, 3).map((card, depth) => (
            <PracticeCard key={card.id} word={card} depth={depth}
              flipped={depth === 0 && flipped} onFlip={() => setFlipped(value => !value)}
              onSwipe={grade} front={state.direction} />
          ))}
        </AnimatePresence>
      </div>
      <div className="vp-actions">
        <button type="button" onClick={() => grade('again')}>← Again</button>
        <button type="button" onClick={() => { setFlipped(false); setState(previous => ({ ...previous, direction: previous.direction === 'to' ? 'en' : 'to' })) }}>
          {state.direction === 'to' ? 'Tongan first' : 'English first'}
        </button>
        <button type="button" onClick={() => grade('known')}>Got it →</button>
      </div>
    </div>
  )
}
