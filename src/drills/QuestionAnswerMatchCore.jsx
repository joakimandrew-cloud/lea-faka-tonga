/**
 * QuestionAnswerMatchCore — Ch 11.
 *
 * Question words sit where the answer goes, so a natural answer echoes the
 * slot the question word filled: mei fē? → mei Tonga, 'anefē? → 'aneafi,
 * he fiha? → he fitu, 'i fē? → 'i fale mohe, ki fē? → ki kolo. The drill is
 * a click-to-pair matcher: click a question card, then its answer partner.
 * Right pair → both lock green. Wrong pair → quick terracotta flash, both
 * deselect.
 *
 * Note: two questions use 'anefē and two use he fiha; the answers are still
 * uniquely pairable because the verb content has to match (foki↔foki,
 * tau mai↔tau mai, kamata↔kamata), so you can't match on the question word
 * alone.
 *
 * All Tongan is verbatim from book/Chapter-11.md (Exercise 4 + chapter
 * examples). The ʻokina here is U+02BB to match the app's other drills.
 */

import { useState, useEffect } from 'react'

const PAIRS = [
  { q: { id: 'kife',   tongan: 'Té ke ʻalu ki fē?' },
    a: { id: 'kikolo', tongan: 'Ki kolo.' },
    why: 'ki fē = "where to". The answer fills the same slot with ki + a place: ki kolo (to town).' },
  { q: { id: 'meife',  tongan: 'Naʻá ke haʻu mei fē?' },
    a: { id: 'meitonga', tongan: 'Naʻá ku haʻu mei Tonga.' },
    why: 'mei fē = "where from". The answer echoes mei + a place: mei Tonga (from Tonga).' },
  { q: { id: 'anefe_foki', tongan: 'Naʻá ke foki ʻanefē?' },
    a: { id: 'aneafi_foki', tongan: 'Naʻá ku foki ʻaneafi.' },
    why: 'ʻanefē = "when (past)". It sits after the verb, so a past time word fills the slot: ʻaneafi (yesterday). The verb foki marks this as the partner.' },
  { q: { id: 'fiha_kamata', tongan: 'Té ke kamata he fiha?' },
    a: { id: 'hefitu', tongan: 'He fitu.' },
    why: 'he fiha = "at what time". The answer gives a clock number with he: he fitu (at seven).' },
  { q: { id: 'ife_mohe', tongan: 'Naʻá ke mohe ʻi fē?' },
    a: { id: 'ifalemohe', tongan: 'ʻI fale mohe.' },
    why: 'ʻi fē = "where at". The answer fills the slot with ʻi + a place: ʻi fale mohe (in the dormitory).' },
  { q: { id: 'fiha_kamata_ako', tongan: 'Te tau kamata ako he fiha?' },
    a: { id: 'hevalu', tongan: 'Tau kamata he valu.' },
    why: 'Another he fiha question. The answer names the clock number: he valu (at eight). It pairs by the kamata ako content, not just the question word.' },
  { q: { id: 'anefe_taumai', tongan: 'Naʻá ne tau mai ʻanefē?' },
    a: { id: 'aneafi_taumai', tongan: 'Naʻá ku tau mai ʻaneafi.' },
    why: 'Another ʻanefē question. The verb tau mai (arrive) marks this answer as its partner: ʻaneafi (yesterday).' },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function QuestionAnswerMatchCore() {
  // Shuffle each column independently so the rows don't line up.
  const [qCards, setQCards] = useState(() => shuffle(PAIRS.map(p => p.q)))
  const [aCards, setACards] = useState(() => shuffle(PAIRS.map(p => p.a)))
  const [selectedQ, setSelectedQ] = useState(null)
  const [pairs, setPairs] = useState({})  // { qId: aId }
  const [wrongFlash, setWrongFlash] = useState(null) // {qId, aId} for terracotta
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const allPaired = Object.keys(pairs).length === PAIRS.length
  const correctMap = Object.fromEntries(PAIRS.map(p => [p.q.id, p.a.id]))

  useEffect(() => {
    if (!wrongFlash) return
    const t = setTimeout(() => setWrongFlash(null), 700)
    return () => clearTimeout(t)
  }, [wrongFlash])

  const handleQClick = (qId) => {
    if (pairs[qId]) return
    if (allPaired) return
    setSelectedQ(prev => prev === qId ? null : qId)
  }

  const handleAClick = (aId) => {
    if (Object.values(pairs).includes(aId)) return
    if (allPaired) return
    if (!selectedQ) return
    const isRight = correctMap[selectedQ] === aId
    setScore(s => ({ right: s.right + (isRight ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isRight ? s + 1 : 0)
    if (isRight) {
      setPairs(prev => ({ ...prev, [selectedQ]: aId }))
      setSelectedQ(null)
    } else {
      setWrongFlash({ qId: selectedQ, aId })
      setSelectedQ(null)
    }
  }

  const handleReset = () => {
    setQCards(shuffle(PAIRS.map(p => p.q)))
    setACards(shuffle(PAIRS.map(p => p.a)))
    setSelectedQ(null)
    setPairs({})
    setWrongFlash(null)
  }

  const handleNewRound = () => {
    setQCards(shuffle(PAIRS.map(p => p.q)))
    setACards(shuffle(PAIRS.map(p => p.a)))
    setSelectedQ(null)
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
        <div className="pcs-question">Pair each question with its natural answer.</div>
      </div>

      <div className="pcs-pair-cols" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div className="pcs-form-note" style={{ marginBottom: '0.5rem' }}>Question</div>
          {qCards.map(card => {
            const isPaired = !!pairs[card.id]
            const isSelected = selectedQ === card.id
            const isWrongFlash = wrongFlash?.qId === card.id
            const cls = [
              'pcs-btn',
              isPaired ? 'is-answer' : '',
              isWrongFlash ? 'is-chosen-wrong' : '',
            ].filter(Boolean).join(' ')
            const style = isSelected ? { outline: '2px solid var(--accent)', outlineOffset: '2px' } : {}
            return (
              <button
                key={card.id}
                onClick={() => handleQClick(card.id)}
                disabled={isPaired || allPaired}
                className={cls}
                style={{ ...style, width: '100%', marginBottom: '0.5rem' }}
              >
                <span className="pcs-btn-label">{card.tongan}</span>
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }}>
          <div className="pcs-form-note" style={{ marginBottom: '0.5rem' }}>Answer</div>
          {aCards.map(card => {
            const isPaired = Object.values(pairs).includes(card.id)
            const isWrongFlash = wrongFlash?.aId === card.id
            const cls = [
              'pcs-btn',
              isPaired ? 'is-answer' : '',
              isWrongFlash ? 'is-chosen-wrong' : '',
            ].filter(Boolean).join(' ')
            return (
              <button
                key={card.id}
                onClick={() => handleAClick(card.id)}
                disabled={isPaired || allPaired}
                className={cls}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              >
                <span className="pcs-btn-label">{card.tongan}</span>
              </button>
            )
          })}
        </div>
      </div>

      {allPaired && (
        <div className="pcs-reveal">
          <div className="pcs-verdict">
            <span className="pcs-right">All paired.</span> A question word sits where the answer goes, so the answer echoes that slot.
          </div>
          <div className="pcs-why">
            <div className="pcs-why-label">Why each pair fits</div>
            {PAIRS.map(p => (
              <div key={p.q.id} className="pcs-why-text" style={{ marginBottom: '0.4rem' }}>
                <strong>{p.q.tongan}</strong> → <strong>{p.a.tongan}</strong>: {p.why}
              </div>
            ))}
          </div>
          <button onClick={handleNewRound} className="pcs-next">
            New round {'→'}
          </button>
        </div>
      )}
    </section>
  )
}
