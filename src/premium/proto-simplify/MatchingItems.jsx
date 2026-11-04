/** Tap-to-match, as Exercises.jsx has it (that copy is private to its file). */
import { useMemo, useState } from 'react'
import { Md } from '../components/lesson/Blocks.jsx'

function shuffle(items) {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[other]] = [next[other], next[index]]
  }
  return next
}

export function MatchingItems({ items, matchedIds, onChange }) {
  const [rights, setRights] = useState(() => shuffle(items.map(item => ({ id: item.id, answer: item.answer }))))
  const [selected, setSelected] = useState(null)
  const [wrong, setWrong] = useState(null)
  const matched = useMemo(() => new Set(matchedIds), [matchedIds])
  const chooseLeft = id => {
    if (matched.has(id)) return
    setWrong(null)
    setSelected(value => (value === id ? null : id))
  }
  const chooseRight = id => {
    if (!selected || matched.has(id)) return
    if (selected === id) {
      setSelected(null)
      setWrong(null)
      onChange([...new Set(matched).add(id)])
    } else {
      setWrong(id)
      setSelected(null)
    }
  }
  const reset = () => {
    setSelected(null)
    setWrong(null)
    setRights(shuffle(items.map(item => ({ id: item.id, answer: item.answer }))))
    onChange([])
  }
  return (
    <div className="match">
      <div className="match-head">
        <span role="status">{matched.size} of {items.length} matched</span>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <div className="match-grid">
        <div>
          {items.map(item => (
            <button type="button" key={item.id} disabled={matched.has(item.id)} aria-pressed={selected === item.id} className={`match-cell ${selected === item.id ? 'is-selected' : ''} ${matched.has(item.id) ? 'is-matched' : ''}`} onClick={() => chooseLeft(item.id)}>
              <Md text={item.prompt} />
            </button>
          ))}
        </div>
        <div>
          {rights.map(item => (
            <button type="button" key={item.id} disabled={matched.has(item.id)} className={`match-cell ${matched.has(item.id) ? 'is-matched' : ''} ${wrong === item.id ? 'is-wrong' : ''}`} onClick={() => chooseRight(item.id)} onAnimationEnd={() => { if (wrong === item.id) setWrong(null) }}>
              <Md text={item.answer} />
            </button>
          ))}
        </div>
      </div>
      {matched.size === items.length && <p className="match-done">All matched.</p>}
    </div>
  )
}
