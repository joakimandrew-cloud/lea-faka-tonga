/**
 * The promise check in the finish band (reviews/lesson-course-2026-10-24/
 * Direction.md, "One point, several facets", item 6): every key rule's example
 * comes back before the student marks the lesson done. The Tongan shows, the
 * English waits behind a button, then the student's own mark.
 */
import { useState } from 'react'
import T from '../T.jsx'
import { markKnown } from '../../lib/lesson-path-store.js'

const nn = number => String(number).padStart(2, '0')

function Card({ n, item, known }) {
  const [shown, setShown] = useState(false)
  const [notYet, setNotYet] = useState(false)
  return (
    <li className={`pc-card ${known ? 'is-known' : ''}`}>
      <span className="pc-n" aria-hidden="true">{item.i + 1}</span>
      <div className="pc-body">
        <T className="pc-to">{item.to}</T>
        {shown && item.en && <p className="pc-en">{item.en}</p>}
        <div className="pc-actions">
          {!shown && item.en && (
            <button type="button" className="btn btn-ghost pc-b" onClick={() => setShown(true)}>Show the English</button>
          )}
          {(shown || !item.en) && !known && (
            <>
              <button type="button" className="btn btn-ghost pc-b" onClick={() => markKnown(n, item.i)}>I knew it</button>
              <button type="button" className="btn btn-ghost pc-b" onClick={() => setNotYet(true)} aria-pressed={notYet}>Not yet</button>
            </>
          )}
          {known && <span className="pc-known">Known</span>}
        </div>
        {notYet && !known && item.section && (
          <a className="pc-link" href={`#${item.section.sectionId}`}>{`See it again in section ${nn(item.section.sectionNumber)} \u2193`}</a>
        )}
      </div>
    </li>
  )
}

export default function PromiseCheck({ n, learn, known = [] }) {
  const items = learn.items.filter(item => item.to)
  if (!items.length) return null
  const knownSet = new Set(known)
  return (
    <div className="pc" data-promise-check="">
      <p className="pc-k">Check the points</p>
      <p className="pc-i">Say each example in English, then show it.</p>
      <ol className="pc-list">
        {items.map(item => <Card key={item.i} n={n} item={item} known={knownSet.has(item.i)} />)}
      </ol>
    </div>
  )
}
