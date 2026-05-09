/**
 * CleftBuilderCore — Ch 36.
 *
 * Cleft sentences move the subject to the front and require a
 * resumptive pronoun in the relative clause: standard "Naʻe kai ʻe
 * Sione ʻa e mā" becomes cleft "Ko Sione naʻá ne kai ʻa e mā". The
 * drill makes the student build the cleft tile-by-tile.
 *
 * Same click-to-order mechanic as ModifierOrderCore — N tiles in a
 * pool, click them in correct Tongan order.
 */

import { useState, useEffect } from 'react'

const PHRASES = [
  {
    id: 'sione-bread',
    standard: 'Naʻe kai ʻe Sione ʻa e mā.',
    english: 'It was Sione who ate the bread.',
    tiles: [
      { id: 'ko',   tongan: 'Ko',    role: 'cleft marker', gloss: 'identification opener' },
      { id: 'sione',tongan: 'Sione', role: 'subject',      gloss: 'fronted subject' },
      { id: 'naa',  tongan: 'naʻá',  role: 'TM',           gloss: 'past (with accent before pronoun ne)' },
      { id: 'ne',   tongan: 'ne',    role: 'pronoun',      gloss: 'resumptive — refers back to Sione' },
    ],
    correct_order: ['ko', 'sione', 'naa', 'ne'],
    fixed_suffix: 'kai ʻa e mā',
    why: 'Standard order puts the verb first and marks Sione with ʻe. Cleft pulls Sione to the front with ko, then the rest of the clause uses ne (pronoun) to refer back. Pattern: ko + subject + TM + ne + verb + object.',
  },
  {
    id: 'mele-clothes',
    standard: 'Naʻe fufulu ʻe Mele ʻa e valá.',
    english: 'It was Mele who washed the clothes.',
    tiles: [
      { id: 'ko',  tongan: 'Ko',    role: 'cleft marker', gloss: 'identification opener' },
      { id: 'mele',tongan: 'Mele',  role: 'subject',      gloss: 'fronted subject' },
      { id: 'naa', tongan: 'naʻá',  role: 'TM',           gloss: 'past (accent shifts before ne)' },
      { id: 'ne',  tongan: 'ne',    role: 'pronoun',      gloss: 'resumptive — refers back to Mele' },
    ],
    correct_order: ['ko', 'mele', 'naa', 'ne'],
    fixed_suffix: 'fufulu ʻa e valá',
    why: 'Cleft transformation. Subject Mele moves to the front with ko; the TM stays past (naʻá), the pronoun ne refers back to Mele.',
  },
  {
    id: 'i-letter',
    standard: 'Naʻá ku tohi ʻa e tohí.',
    english: 'It was I who wrote the letter.',
    tiles: [
      { id: 'ko',  tongan: 'Ko',    role: 'cleft marker', gloss: 'identification opener' },
      { id: 'au',  tongan: 'au',    role: 'subject',      gloss: 'postposed pronoun (long form of "I")' },
      { id: 'naa', tongan: 'naʻá',  role: 'TM',           gloss: 'past' },
      { id: 'ku',  tongan: 'ku',    role: 'pronoun',      gloss: 'preposed pronoun (resumptive "I")' },
    ],
    correct_order: ['ko', 'au', 'naa', 'ku'],
    fixed_suffix: 'tohi ʻa e tohí',
    why: 'When the fronted subject is a pronoun, you use the POSTPOSED form (au) at the front, then keep the preposed form (ku) as resumptive. Both are "I" — one fronted, one in the clause.',
  },
  {
    id: 'they-work',
    standard: 'Naʻa nau fai ʻa e ngāué.',
    english: 'It was they who did the work.',
    tiles: [
      { id: 'ko',         tongan: 'Ko',         role: 'cleft marker', gloss: 'identification opener' },
      { id: 'kinautolu',  tongan: 'kinautolu',  role: 'subject',      gloss: 'postposed pronoun (long "they")' },
      { id: 'naa',        tongan: 'naʻa',       role: 'TM',           gloss: 'past (no accent before two-syllable pronoun nau)' },
      { id: 'nau',        tongan: 'nau',        role: 'pronoun',      gloss: 'resumptive "they" (preposed)' },
    ],
    correct_order: ['ko', 'kinautolu', 'naa', 'nau'],
    fixed_suffix: 'fai ʻa e ngāué',
    why: 'Same pattern with "they". Postposed kinautolu in front, preposed nau as resumptive. The accent on naʻá doesn\u2019t appear because nau is two-syllable (no accent shift).',
  },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function CleftBuilderCore() {
  const [deck, setDeck] = useState(() => shuffle(PHRASES))
  const [idx, setIdx] = useState(0)
  const [pool, setPool] = useState(() => shuffle(deck[0].tiles))
  const [selected, setSelected] = useState([])
  const [answered, setAnswered] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx]
  const slotCount = current.tiles.length

  useEffect(() => {
    if (answered !== null) return
    if (selected.length !== slotCount) return
    const ordered = selected.map(i => pool[i].id)
    const isCorrect = ordered.every((id, i) => id === current.correct_order[i])
    setAnswered(isCorrect ? 'correct' : 'wrong')
    setScore(s => ({ right: s.right + (isCorrect ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isCorrect ? s + 1 : 0)
  }, [selected, pool, slotCount, answered, current.correct_order])

  const handleTileClick = (i) => {
    if (answered !== null) return
    setSelected(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i)
      if (prev.length >= slotCount) return prev
      return [...prev, i]
    })
  }

  const handleNext = () => {
    const nextIdx = idx + 1 >= deck.length ? 0 : idx + 1
    const nextDeck = idx + 1 >= deck.length ? shuffle(PHRASES) : deck
    setDeck(nextDeck)
    setIdx(nextIdx)
    setPool(shuffle(nextDeck[nextIdx].tiles))
    setSelected([])
    setAnswered(null)
  }

  const handleReset = () => {
    const fresh = shuffle(PHRASES)
    setDeck(fresh)
    setIdx(0)
    setPool(shuffle(fresh[0].tiles))
    setSelected([])
    setAnswered(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const handleClear = () => {
    if (answered !== null) return
    setSelected([])
  }

  const studentPrefix = selected.map(i => pool[i].tongan).join(' ')
  const builtSentence = `${studentPrefix}${studentPrefix ? ' ' : ''}${current.fixed_suffix}.`
  const correctSentence = `${current.correct_order.map(id => current.tiles.find(t => t.id === id).tongan).join(' ')} ${current.fixed_suffix}.`

  return (
    <section className="afl-card">
      <div className="afl-card-row">
        <div className="afl-progress">{idx + 1} / {deck.length}</div>
        <div className="afl-stats">
          <span className="afl-stat">
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

      <div className="afl-prompt-label">Standard form (verb-first)</div>
      <div className="afl-prompt" style={{ fontStyle: 'italic' }}>{current.standard}</div>

      <div className="afl-prompt-label" style={{ marginTop: '0.75rem' }}>Build the cleft equivalent</div>
      <div className="afl-prompt">{current.english}</div>

      <div className="afl-answer-row">
        <div className="afl-answer-label">Cleft so far</div>
        <div className="afl-answer-slot">{builtSentence}</div>
        {selected.length > 0 && answered === null && (
          <button onClick={handleClear} className="afl-clear">clear</button>
        )}
      </div>

      <div className="afl-pool-label">
        {answered === null ? `Click the ${slotCount} tiles in correct cleft order` : 'The pool'}
      </div>
      <div className="afl-pool">
        {pool.map((t, i) => {
          const pickedPos = selected.indexOf(i)
          const isPicked = pickedPos !== -1
          return (
            <button
              key={t.id}
              onClick={() => handleTileClick(i)}
              disabled={answered !== null}
              className={`afl-tile ${isPicked ? 'is-picked' : ''}`}
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
              ? <><span className="afl-right">Yes.</span> <em>{builtSentence}</em></>
              : <><span className="afl-wrong">Not quite.</span> You built <em>{builtSentence}</em>. The correct cleft is <em>{correctSentence}</em>.</>
            }
          </div>
          <div className="afl-pattern">
            {current.correct_order.map((id, i) => {
              const t = current.tiles.find(x => x.id === id)
              return (
                <span key={id} className="afl-pattern-pair">
                  <span className="afl-pattern-slot">{t.tongan}</span>
                  <span className="afl-pattern-role">{t.role}</span>
                  {i < current.correct_order.length - 1 && <span className="afl-pattern-arrow">{' \u2192 '}</span>}
                </span>
              )
            })}
          </div>
          <div className="pcs-why">
            <div className="pcs-why-label">Why</div>
            <div className="pcs-why-text">{current.why}</div>
          </div>
          <button onClick={handleNext} className="afl-next">
            Next phrase {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
