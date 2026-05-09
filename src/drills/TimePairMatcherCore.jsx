/**
 * TimePairMatcherCore — Ch 4.
 *
 * Three past time words (ʻanepō / ʻanenai / ʻaneafi) pair with three
 * future time words (ʻapō / ʻanai / ʻapongipongi) by shared meaning
 * (tonight / shortly / day-away). The drill is a click-to-pair matcher:
 * click a past card, then its future partner. Right pair → both lock
 * green. Wrong pair → quick terracotta flash, both deselect.
 *
 * Teaches the ʻane- (looks back) / ʻa- (looks forward) prefix pattern.
 */

import { useState, useEffect } from 'react'

const PAIRS = [
  { past: { id: 'anepo',  tongan: 'ʻanepō',       gloss: 'last night' },
    future: { id: 'apo',   tongan: 'ʻapō',         gloss: 'tonight' },
    why: 'Both end in -pō (night). ʻane- looks back → last night. ʻa- looks forward → tonight.' },
  { past: { id: 'anenai', tongan: 'ʻanenai',      gloss: 'a while ago' },
    future: { id: 'anai',  tongan: 'ʻanai',        gloss: 'in a little while' },
    why: 'Both end in -nai. ʻane- = looking back (a while ago). ʻa- = looking forward (in a little while).' },
  { past: { id: 'aneafi', tongan: 'ʻaneafi',      gloss: 'yesterday' },
    future: { id: 'apongipongi', tongan: 'ʻapongipongi', gloss: 'tomorrow' },
    why: 'Different stems but the same logic: ʻane- + a day-marker = a day past. ʻa- + a day-marker = a day future. The third pair doesn\u2019t share endings, but the rule still holds.' },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function TimePairMatcherCore() {
  // Shuffle which past goes with which future-column slot.
  const [pastCards, setPastCards] = useState(() => shuffle(PAIRS.map(p => p.past)))
  const [futureCards, setFutureCards] = useState(() => shuffle(PAIRS.map(p => p.future)))
  const [selectedPast, setSelectedPast] = useState(null)
  const [pairs, setPairs] = useState({})  // { pastId: futureId }
  const [wrongFlash, setWrongFlash] = useState(null) // {pastId, futureId} for terracotta
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const allPaired = Object.keys(pairs).length === PAIRS.length
  const correctMap = Object.fromEntries(PAIRS.map(p => [p.past.id, p.future.id]))

  useEffect(() => {
    if (!wrongFlash) return
    const t = setTimeout(() => setWrongFlash(null), 700)
    return () => clearTimeout(t)
  }, [wrongFlash])

  const handlePastClick = (pastId) => {
    if (pairs[pastId]) return
    if (allPaired) return
    setSelectedPast(prev => prev === pastId ? null : pastId)
  }

  const handleFutureClick = (futureId) => {
    if (Object.values(pairs).includes(futureId)) return
    if (allPaired) return
    if (!selectedPast) return
    const isRight = correctMap[selectedPast] === futureId
    setScore(s => ({ right: s.right + (isRight ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isRight ? s + 1 : 0)
    if (isRight) {
      setPairs(prev => ({ ...prev, [selectedPast]: futureId }))
      setSelectedPast(null)
    } else {
      setWrongFlash({ pastId: selectedPast, futureId })
      setSelectedPast(null)
    }
  }

  const handleReset = () => {
    setPastCards(shuffle(PAIRS.map(p => p.past)))
    setFutureCards(shuffle(PAIRS.map(p => p.future)))
    setSelectedPast(null)
    setPairs({})
    setWrongFlash(null)
  }

  const handleNewRound = () => {
    setPastCards(shuffle(PAIRS.map(p => p.past)))
    setFutureCards(shuffle(PAIRS.map(p => p.future)))
    setSelectedPast(null)
    setPairs({})
  }

  return (
    <section className="pcs-card">
      <div className="pcs-card-row">
        <div className="pcs-progress">{Object.keys(pairs).length} / {PAIRS.length} paired</div>
        <div className="pcs-stats">
          <span className="pcs-stat">
            <span className="pcs-stat-value">{score.right}</span>
            <span className="pcs-stat-label"> / {score.total} correct</span>
          </span>
          {streak > 1 && (
            <span className="pcs-stat pcs-streak">
              <span className="pcs-stat-value">{streak}</span>
              <span className="pcs-stat-label"> in a row</span>
            </span>
          )}
          <button onClick={handleReset} className="pcs-reset" aria-label="Reset">reset</button>
        </div>
      </div>

      <div className="pcs-noun-frame">
        <div className="pcs-question">Pair each <em>ʻane-</em> past word with its <em>ʻa-</em> future partner.</div>
      </div>

      <div className="pcs-pair-cols" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="pcs-form-note" style={{ marginBottom: '0.5rem' }}>Past (ʻane-)</div>
          {pastCards.map(card => {
            const isPaired = !!pairs[card.id]
            const isSelected = selectedPast === card.id
            const isWrongFlash = wrongFlash?.pastId === card.id
            const cls = [
              'pcs-btn',
              isPaired ? 'is-answer' : '',
              isWrongFlash ? 'is-chosen-wrong' : '',
              isSelected ? '' : '',
            ].filter(Boolean).join(' ')
            const style = isSelected ? { outline: '2px solid var(--accent)', outlineOffset: '2px' } : {}
            return (
              <button
                key={card.id}
                onClick={() => handlePastClick(card.id)}
                disabled={isPaired || allPaired}
                className={cls}
                style={{ ...style, width: '100%', marginBottom: '0.5rem' }}
              >
                <span className="pcs-btn-label">{card.tongan}</span>
                <span className="pcs-btn-principle">{card.gloss}</span>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }}>
          <div className="pcs-form-note" style={{ marginBottom: '0.5rem' }}>Future (ʻa-)</div>
          {futureCards.map(card => {
            const isPaired = Object.values(pairs).includes(card.id)
            const isWrongFlash = wrongFlash?.futureId === card.id
            const cls = [
              'pcs-btn',
              isPaired ? 'is-answer' : '',
              isWrongFlash ? 'is-chosen-wrong' : '',
            ].filter(Boolean).join(' ')
            return (
              <button
                key={card.id}
                onClick={() => handleFutureClick(card.id)}
                disabled={isPaired || allPaired}
                className={cls}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                <span className="pcs-btn-label">{card.tongan}</span>
                <span className="pcs-btn-principle">{card.gloss}</span>
              </button>
            )
          })}
        </div>
      </div>

      {allPaired && (
        <div className="pcs-reveal">
          <div className="pcs-verdict">
            <span className="pcs-right">All paired.</span> The pattern: <em>ʻane-</em> looks back, <em>ʻa-</em> looks forward.
          </div>
          <div className="pcs-why">
            <div className="pcs-why-label">Why each pair fits</div>
            {PAIRS.map(p => (
              <div key={p.past.id} className="pcs-why-text" style={{ marginBottom: '0.4rem' }}>
                <strong>{p.past.tongan}</strong> ↔ <strong>{p.future.tongan}</strong>: {p.why}
              </div>
            ))}
          </div>
          <button onClick={handleNewRound} className="pcs-next">
            New round {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
