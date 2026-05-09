/**
 * AdjectiveFlipCore — "the noun leads."
 *
 * Mechanic only. Page chrome lives in src/pages/AdjectiveFlip.jsx.
 */

import { useState, useEffect } from 'react'

const PHRASES = [
  { english: 'big boat',        noun: 'vaka',     adj: 'lahi',   noun_gloss: 'boat',     adj_gloss: 'big' },
  { english: 'small boy',       noun: 'tamasiʻi', adj: 'siʻi',   noun_gloss: 'boy',      adj_gloss: 'small' },
  { english: 'new house',       noun: 'fale',     adj: 'foʻou',  noun_gloss: 'house',    adj_gloss: 'new' },
  { english: 'good teacher',    noun: 'faiako',   adj: 'lelei',  noun_gloss: 'teacher',  adj_gloss: 'good' },
  { english: 'bad food',        noun: 'meʻakai',  adj: 'kovi',   noun_gloss: 'food',     adj_gloss: 'bad' },
  { english: 'poor man',        noun: 'tangata',  adj: 'masiva', noun_gloss: 'man',      adj_gloss: 'poor' },
  { english: 'strong father',   noun: 'tamai',    adj: 'mālohi', noun_gloss: 'father',   adj_gloss: 'strong' },
  { english: 'big celebration', noun: 'kātoanga', adj: 'lahi',   noun_gloss: 'celebration', adj_gloss: 'big' },
  { english: 'new book',        noun: 'tohi',     adj: 'foʻou',  noun_gloss: 'book',     adj_gloss: 'new' },
  { english: 'big knife',       noun: 'hele',     adj: 'lahi',   noun_gloss: 'knife',    adj_gloss: 'big' },
  { english: 'small cat',       noun: 'pusi',     adj: 'siʻi',   noun_gloss: 'cat',      adj_gloss: 'small' },
  { english: 'good dog',        noun: 'kulī',     adj: 'lelei',  noun_gloss: 'dog',      adj_gloss: 'good' },
  { english: 'strong horse',    noun: 'hoosi',    adj: 'mālohi', noun_gloss: 'horse',    adj_gloss: 'strong' },
  { english: 'new car',         noun: 'kā',       adj: 'foʻou',  noun_gloss: 'car',      adj_gloss: 'new' },
  { english: 'bad woman',       noun: 'fefine',   adj: 'kovi',   noun_gloss: 'woman',    adj_gloss: 'bad' },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function buildTiles(phrase) {
  const tiles = [
    { role: 'noun', tongan: phrase.noun, gloss: phrase.noun_gloss },
    { role: 'adj',  tongan: phrase.adj,  gloss: phrase.adj_gloss },
  ]
  return shuffle(tiles)
}

export default function AdjectiveFlipCore() {
  const [deck, setDeck] = useState(() => shuffle(PHRASES))
  const [idx, setIdx] = useState(0)
  const [tiles, setTiles] = useState(() => buildTiles(deck[0]))
  const [selected, setSelected] = useState([])
  const [answered, setAnswered] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx]

  useEffect(() => {
    if (answered !== null) return
    if (selected.length !== tiles.length) return
    const orderedRoles = selected.map(i => tiles[i].role)
    const isCorrect = orderedRoles[0] === 'noun' && orderedRoles[1] === 'adj'
    setAnswered(isCorrect ? 'correct' : 'wrong')
    setScore(s => ({ right: s.right + (isCorrect ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isCorrect ? s + 1 : 0)
  }, [selected, tiles, answered])

  const handleTileClick = (i) => {
    if (answered !== null) return
    setSelected(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i)
      if (prev.length >= tiles.length) return prev
      return [...prev, i]
    })
  }

  const handleNext = () => {
    const nextIdx = idx + 1 >= deck.length ? 0 : idx + 1
    const nextDeck = idx + 1 >= deck.length ? shuffle(PHRASES) : deck
    setDeck(nextDeck)
    setIdx(nextIdx)
    setTiles(buildTiles(nextDeck[nextIdx]))
    setSelected([])
    setAnswered(null)
  }

  const handleReset = () => {
    const fresh = shuffle(PHRASES)
    setDeck(fresh)
    setIdx(0)
    setTiles(buildTiles(fresh[0]))
    setSelected([])
    setAnswered(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const handleClearSelection = () => {
    if (answered !== null) return
    setSelected([])
  }

  const correctPhrase = `${current.noun} ${current.adj}`
  const studentPhrase = selected.map(i => tiles[i].tongan).join(' ')

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (answered !== null ? 1 : 0)) / deck.length) * 100 : 0

  return (
    <section className="afl-card">
      <div className="afl-card-row">
        <div className="afl-progress-wrap">
          <span className="afl-progress">{idx + 1} / {deck.length}</span>
          <div className="afl-progress-bar">
            <div className="afl-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="afl-stats">
          <span className={`afl-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="afl-stat-value">{score.right}</span>
            <span className="afl-stat-label"> / {score.total} correct</span>
          </span>
          {streak > 1 && (
            <span className="afl-stat afl-streak">
              <span className="afl-stat-value">{streak}</span>
              <span className="afl-stat-label"> in a row</span>
            </span>
          )}
          <button onClick={handleReset} className="afl-reset">reset</button>
        </div>
      </div>

      <div className="afl-prompt-label">Say this in Tongan</div>
      <div className="afl-prompt">{current.english}</div>

      <div className="afl-answer-row">
        <div className="afl-answer-label">Your phrase</div>
        <div className="afl-answer-slot">
          {studentPhrase || <span className="afl-answer-placeholder">&mdash;</span>}
        </div>
        {selected.length > 0 && answered === null && (
          <button onClick={handleClearSelection} className="afl-clear">clear</button>
        )}
      </div>

      <div className="afl-pool-label">
        {answered === null ? 'Click the words in order' : 'The pool'}
      </div>
      <div className="afl-pool">
        {tiles.map((t, i) => {
          const pickedPos = selected.indexOf(i)
          const isPicked = pickedPos !== -1
          const stateCls = answered === 'correct' && isPicked
            ? 'is-right'
            : answered === 'wrong' && isPicked
              ? 'is-wrong'
              : isPicked
                ? 'is-picked'
                : ''
          return (
            <button
              key={t.tongan}
              onClick={() => handleTileClick(i)}
              disabled={answered !== null}
              className={`afl-tile ${stateCls}`}
            >
              {isPicked && <span className="afl-tile-num">{pickedPos + 1}</span>}
              <span className="afl-tile-tongan">{t.tongan}</span>
              <span className="afl-tile-gloss">{t.gloss}</span>
            </button>
          )
        })}
      </div>

      {answered !== null && (
        <div className="afl-reveal">
          <div className="afl-verdict">
            {answered === 'correct'
              ? <><span className="afl-right">Yes.</span> <em>{studentPhrase}</em> &mdash; noun first, adjective second.</>
              : <><span className="afl-wrong">Not quite.</span> You built <em>{studentPhrase}</em> &mdash; that&rsquo;s English order. In Tongan the noun leads: <em>{correctPhrase}</em>.</>
            }
          </div>
          <div className="afl-pattern">
            <span className="afl-pattern-pair">
              <span className="afl-pattern-slot">{current.noun}</span>
              <span className="afl-pattern-role">noun</span>
            </span>
            <span className="afl-pattern-arrow">&rarr;</span>
            <span className="afl-pattern-pair">
              <span className="afl-pattern-slot">{current.adj}</span>
              <span className="afl-pattern-role">adjective</span>
            </span>
          </div>
          <button onClick={handleNext} className="afl-next">
            Next phrase {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
