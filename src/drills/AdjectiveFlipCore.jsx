/**
 * AdjectiveFlipCore — attributive adjective order (Ch 35).
 *
 * Three tiers, mixed in one deck so the learner must DECIDE the position
 * each time rather than assume "noun first" (verified against
 * book/Chapter-35.md):
 *   - postposed: the default — the describing word follows the noun
 *     (vaka lahi), Ch35 "Attributive adjectives after the noun" (L7-36);
 *   - preposed: a fixed handful go BEFORE the noun — fuʻu, kiʻi, ʻuluaki,
 *     muʻaki, toe (L40-60);
 *   - stacking: a preposed word + noun + postposed word (fuʻu meʻa lahi),
 *     Ch35 "Double adjectives" (L66-80).
 *
 * Each phrase lists its `parts` in CORRECT order; buildTiles tags each with
 * its index and shuffles, and the answer is right when the picked order
 * matches 0,1,2…. Page chrome lives in src/pages/AdjectiveFlip.jsx.
 */

import { useState, useEffect } from 'react'

const PHRASES = [
  // ── Postposed: the describing word follows the noun (the default) ──
  { english: 'big boat',        tier: 'postposed', parts: [{ tongan: 'vaka', gloss: 'boat', role: 'noun' }, { tongan: 'lahi', gloss: 'big', role: 'adjective' }] },
  { english: 'small boy',       tier: 'postposed', parts: [{ tongan: 'tamasiʻi', gloss: 'boy', role: 'noun' }, { tongan: 'siʻi', gloss: 'small', role: 'adjective' }] },
  { english: 'new house',       tier: 'postposed', parts: [{ tongan: 'fale', gloss: 'house', role: 'noun' }, { tongan: 'foʻou', gloss: 'new', role: 'adjective' }] },
  { english: 'good teacher',    tier: 'postposed', parts: [{ tongan: 'faiako', gloss: 'teacher', role: 'noun' }, { tongan: 'lelei', gloss: 'good', role: 'adjective' }] },
  { english: 'bad food',        tier: 'postposed', parts: [{ tongan: 'meʻakai', gloss: 'food', role: 'noun' }, { tongan: 'kovi', gloss: 'bad', role: 'adjective' }] },
  { english: 'poor man',        tier: 'postposed', parts: [{ tongan: 'tangata', gloss: 'man', role: 'noun' }, { tongan: 'masiva', gloss: 'poor', role: 'adjective' }] },
  { english: 'strong father',   tier: 'postposed', parts: [{ tongan: 'tamai', gloss: 'father', role: 'noun' }, { tongan: 'mālohi', gloss: 'strong', role: 'adjective' }] },
  { english: 'big celebration', tier: 'postposed', parts: [{ tongan: 'kātoanga', gloss: 'celebration', role: 'noun' }, { tongan: 'lahi', gloss: 'big', role: 'adjective' }] },
  { english: 'new book',        tier: 'postposed', parts: [{ tongan: 'tohi', gloss: 'book', role: 'noun' }, { tongan: 'foʻou', gloss: 'new', role: 'adjective' }] },
  { english: 'big knife',       tier: 'postposed', parts: [{ tongan: 'hele', gloss: 'knife', role: 'noun' }, { tongan: 'lahi', gloss: 'big', role: 'adjective' }] },
  { english: 'small cat',       tier: 'postposed', parts: [{ tongan: 'pusi', gloss: 'cat', role: 'noun' }, { tongan: 'siʻi', gloss: 'small', role: 'adjective' }] },
  { english: 'good dog',        tier: 'postposed', parts: [{ tongan: 'kulī', gloss: 'dog', role: 'noun' }, { tongan: 'lelei', gloss: 'good', role: 'adjective' }] },
  { english: 'strong horse',    tier: 'postposed', parts: [{ tongan: 'hoosi', gloss: 'horse', role: 'noun' }, { tongan: 'mālohi', gloss: 'strong', role: 'adjective' }] },
  { english: 'new car',         tier: 'postposed', parts: [{ tongan: 'kā', gloss: 'car', role: 'noun' }, { tongan: 'foʻou', gloss: 'new', role: 'adjective' }] },
  { english: 'bad woman',       tier: 'postposed', parts: [{ tongan: 'fefine', gloss: 'woman', role: 'noun' }, { tongan: 'kovi', gloss: 'bad', role: 'adjective' }] },

  // ── Preposed: a fixed handful go BEFORE the noun (fuʻu, kiʻi, ʻuluaki, muʻaki, toe) ──
  { english: 'a big house',     tier: 'preposed', parts: [{ tongan: 'fuʻu', gloss: 'big', role: 'preposed adj' }, { tongan: 'fale', gloss: 'house', role: 'noun' }] },
  { english: 'a small boy',     tier: 'preposed', parts: [{ tongan: 'kiʻi', gloss: 'small', role: 'preposed adj' }, { tongan: 'tamasiʻi', gloss: 'boy', role: 'noun' }] },
  { english: 'the first thing', tier: 'preposed', parts: [{ tongan: 'ʻuluaki', gloss: 'first', role: 'preposed adj' }, { tongan: 'meʻa', gloss: 'thing', role: 'noun' }] },
  { english: 'a former king',   tier: 'preposed', parts: [{ tongan: 'muʻaki', gloss: 'former', role: 'preposed adj' }, { tongan: 'tuʻi', gloss: 'king', role: 'noun' }] },
  { english: 'another thing',   tier: 'preposed', parts: [{ tongan: 'toe', gloss: 'another', role: 'preposed adj' }, { tongan: 'meʻa', gloss: 'thing', role: 'noun' }] },
  { english: 'the first book',  tier: 'preposed', parts: [{ tongan: 'ʻuluaki', gloss: 'first', role: 'preposed adj' }, { tongan: 'tohi', gloss: 'book', role: 'noun' }] },

  // ── Stacking: preposed word + noun + postposed word ──
  { english: 'a great big thing', tier: 'stacking', parts: [{ tongan: 'fuʻu', gloss: 'big', role: 'preposed adj' }, { tongan: 'meʻa', gloss: 'thing', role: 'noun' }, { tongan: 'lahi', gloss: 'big', role: 'adjective' }] },
  { english: 'a little tiny thing', tier: 'stacking', parts: [{ tongan: 'kiʻi', gloss: 'little', role: 'preposed adj' }, { tongan: 'meʻa', gloss: 'thing', role: 'noun' }, { tongan: 'siʻi', gloss: 'tiny', role: 'adjective' }] },
  { english: 'a very big house', tier: 'stacking', parts: [{ tongan: 'fuʻu', gloss: 'big', role: 'preposed adj' }, { tongan: 'fale', gloss: 'house', role: 'noun' }, { tongan: 'lahi', gloss: 'big', role: 'adjective' }] },
  { english: 'a very big boat', tier: 'stacking', parts: [{ tongan: 'fuʻu', gloss: 'big', role: 'preposed adj' }, { tongan: 'vaka', gloss: 'boat', role: 'noun' }, { tongan: 'lahi', gloss: 'big', role: 'adjective' }] },
]

const TIER_NOTE = {
  postposed: 'the describing word follows the noun.',
  preposed: 'fuʻu, kiʻi, ʻuluaki, muʻaki and toe come before the noun.',
  stacking: 'one describing word goes before the noun, one after.',
}

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function buildTiles(phrase) {
  return shuffle(phrase.parts.map((p, order) => ({ ...p, order })))
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
    const orderedPos = selected.map(i => tiles[i].order)
    const isCorrect = orderedPos.every((pos, slot) => pos === slot)
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

  const correctPhrase = current.parts.map(p => p.tongan).join(' ')
  const studentPhrase = selected.map(i => tiles[i].tongan).join(' ')
  const note = TIER_NOTE[current.tier]

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
              ? <><span className="afl-right">Yes.</span> <em>{studentPhrase}</em> &mdash; {note}</>
              : <><span className="afl-wrong">Not quite.</span> You built <em>{studentPhrase}</em>. The Tongan order is <em>{correctPhrase}</em> &mdash; {note}</>
            }
          </div>
          <div className="afl-pattern">
            {current.parts.map((p, i) => (
              <span key={p.tongan + i} className="afl-pattern-pair">
                <span className="afl-pattern-slot">{p.tongan}</span>
                <span className="afl-pattern-role">{p.role}</span>
                {i < current.parts.length - 1 && <span className="afl-pattern-arrow">&rarr;</span>}
              </span>
            ))}
          </div>
          <button onClick={handleNext} className="afl-next">
            Next phrase {'→'}
          </button>
        </div>
      )}
    </section>
  )
}
