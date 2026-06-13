/**
 * ModifierOrderCore — Ch 3 drill.
 *
 * Ch 3 introduces three positional moves: postposed modifiers (lelei /
 * lahi / mālohi after the verb), the intensifier ʻaupito (always last
 * among modifiers), the limiter pē (postposed), and the rare PRE-verb
 * modifier faʻa (between pronoun and verb).
 *
 * The drill shows a sentence with the TM + pronoun fixed and the
 * remaining word tiles shuffled in a pool. The student clicks the tiles
 * in correct Tongan order — actively producing the postposed reflex (and
 * the one preposed exception). Same click-to-order shape as AdjectiveFlip
 * but generalized to N tiles.
 *
 * Anchored at Ch 3 only. Vocab kept inside Ch 1-3.
 */

import { useState, useEffect } from 'react'

const PHRASES = [
  {
    id: 'sing-well',
    english: 'I sing well.',
    tongan: 'ʻOku ou hiva lelei',
    fixed_prefix: 'ʻOku ou',
    tiles: [
      { id: 'hiva',  tongan: 'hiva',  role: 'verb',     gloss: 'sing' },
      { id: 'lelei', tongan: 'lelei', role: 'modifier', gloss: 'well' },
    ],
    correct_order: ['hiva', 'lelei'],
    why: 'Tongan modifiers go AFTER the verb. The order verb + modifier is fixed; never lelei + hiva.',
  },
  {
    id: 'ate-a-lot',
    english: 'We (excl.) ate a lot.',
    tongan: 'Naʻa mau kai lahi',
    fixed_prefix: 'Naʻa mau',
    tiles: [
      { id: 'kai',  tongan: 'kai',  role: 'verb',     gloss: 'eat' },
      { id: 'lahi', tongan: 'lahi', role: 'modifier', gloss: 'much / a lot' },
    ],
    correct_order: ['kai', 'lahi'],
    why: 'Same postposed pattern. lahi after the verb means "much" / "a lot".',
  },
  {
    id: 'very-tired',
    english: 'I am very tired.',
    tongan: 'ʻOku ou helaʻia ʻaupito',
    fixed_prefix: 'ʻOku ou',
    tiles: [
      { id: 'helaia',  tongan: 'helaʻia', role: 'adj',         gloss: 'tired' },
      { id: 'aupito',  tongan: 'ʻaupito', role: 'intensifier', gloss: 'very' },
    ],
    correct_order: ['helaia', 'aupito'],
    why: 'helaʻia is an adjective in the verb slot; ʻaupito intensifies it. ʻaupito always sits last.',
  },
  {
    id: 'extremely-happy',
    english: 'I am extremely happy.',
    tongan: 'ʻOku ou fiefia lahi ʻaupito',
    fixed_prefix: 'ʻOku ou',
    tiles: [
      { id: 'fiefia', tongan: 'fiefia',  role: 'adj',         gloss: 'happy' },
      { id: 'lahi',   tongan: 'lahi',    role: 'modifier',    gloss: 'much' },
      { id: 'aupito', tongan: 'ʻaupito', role: 'intensifier', gloss: 'very' },
    ],
    correct_order: ['fiefia', 'lahi', 'aupito'],
    why: 'Three slots, in order: verb/adj + modifier + ʻaupito. ʻaupito always last; lahi ʻaupito together means "very much / extremely".',
  },
  {
    id: 'often-sing',
    english: 'I often sing.',
    tongan: 'ʻOku ou faʻa hiva',
    fixed_prefix: 'ʻOku ou',
    tiles: [
      { id: 'faa',  tongan: 'faʻa', role: 'preposed', gloss: 'often (PRE-verb)' },
      { id: 'hiva', tongan: 'hiva', role: 'verb',     gloss: 'sing' },
    ],
    correct_order: ['faa', 'hiva'],
    why: 'faʻa is the exception: it goes BEFORE the verb (between pronoun and verb), not after. All other modifiers in this chapter go after.',
  },
  {
    id: 'just-slept',
    english: 'We just slept.',
    tongan: 'Naʻa mau mohe pē',
    fixed_prefix: 'Naʻa mau',
    tiles: [
      { id: 'mohe', tongan: 'mohe', role: 'verb',    gloss: 'sleep' },
      { id: 'pe',   tongan: 'pē',   role: 'limiter', gloss: 'just / only' },
    ],
    correct_order: ['mohe', 'pe'],
    why: 'pē is a postposed limiter: it attaches to whatever it follows. Here it limits the action — "we did nothing but sleep".',
  },
  {
    id: 'worked-hard',
    english: 'I worked hard.',
    tongan: 'Naʻá ku ngāue mālohi',
    fixed_prefix: 'Naʻá ku',
    tiles: [
      { id: 'ngaue',  tongan: 'ngāue',  role: 'verb',     gloss: 'work' },
      { id: 'malohi', tongan: 'mālohi', role: 'modifier', gloss: 'hard / strongly' },
    ],
    correct_order: ['ngaue', 'malohi'],
    why: 'mālohi after the verb means "hard, strongly". (As a verb-slot adjective it means "strong" — context disambiguates.)',
  },
  {
    id: 'often-work-hard',
    english: 'We (excl.) often work hard.',
    tongan: 'ʻOku mau faʻa ngāue mālohi',
    fixed_prefix: 'ʻOku mau',
    tiles: [
      { id: 'faa',    tongan: 'faʻa',   role: 'preposed', gloss: 'often (PRE-verb)' },
      { id: 'ngaue',  tongan: 'ngāue',  role: 'verb',     gloss: 'work' },
      { id: 'malohi', tongan: 'mālohi', role: 'modifier', gloss: 'hard' },
    ],
    correct_order: ['faa', 'ngaue', 'malohi'],
    why: 'faʻa BEFORE the verb, mālohi AFTER. Three slots; the preposed exception sits where pronouns sit, the postposed modifier sits in its usual place.',
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

export default function ModifierOrderCore() {
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

  const studentPhrase = selected.map(i => pool[i].tongan).join(' ')
  const renderedSentence = `${current.fixed_prefix}${studentPhrase ? ' ' + studentPhrase : ''}`
  const correctSentence = `${current.fixed_prefix} ${current.correct_order.map(id => current.tiles.find(t => t.id === id).tongan).join(' ')}`

  return (
    <section className="pcs-card">
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

      <div className="afl-prompt-label">Say this in Tongan</div>
      <div className="afl-prompt">{current.english}</div>

      <div className="afl-answer-row">
        <div className="afl-answer-label">Your sentence</div>
        <div className="afl-answer-slot">
          {renderedSentence || <span className="afl-answer-placeholder">&mdash;</span>}
        </div>
        {selected.length > 0 && answered === null && (
          <button onClick={handleClear} className="afl-clear">clear</button>
        )}
      </div>

      <div className="afl-pool-label">
        {answered === null ? `Click the ${slotCount} words in order` : 'The pool'}
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
              ? <><span className="afl-right">Yes.</span> <em>{renderedSentence}</em>.</>
              : <><span className="afl-wrong">Not quite.</span> You built <em>{renderedSentence}</em>. The correct order is <em>{correctSentence}</em>.</>
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
