/**
 * ClusivityCornerCore — "we has four meanings."
 *
 * Mechanic only. Page chrome lives in src/pages/ClusivityCorner.jsx.
 */

import { useState } from 'react'

const PRONOUNS = [
  { id: 'ta',  tongan: 'ta',  number: 'dual',   clusivity: 'inclusive', quick: 'we two',      detail: 'you + me' },
  { id: 'ma',  tongan: 'ma',  number: 'dual',   clusivity: 'exclusive', quick: 'we two',      detail: 'me + someone (not you)' },
  { id: 'tau', tongan: 'tau', number: 'plural', clusivity: 'inclusive', quick: 'we all (3+)', detail: 'everyone incl. you' },
  { id: 'mau', tongan: 'mau', number: 'plural', clusivity: 'exclusive', quick: 'we all (3+)', detail: 'us, not including you' },
]

const EXERCISES = [
  { english: 'You and I are going to town.',           scenario: 'Two people total: the speaker and the listener.',                      answer: 'ta',  why: 'Two people, and the listener is one of them. Dual + inclusive = ta.' },
  { english: 'Mele and I went to the market.',         scenario: 'Two people (speaker + Mele); the listener is a third party.',          answer: 'ma',  why: 'Two people, but the listener is NOT one of them. Dual + exclusive = ma.' },
  { english: 'Let\u2019s all eat together!',           scenario: 'Family around the table, 3+ people, speaker is addressing everyone.',  answer: 'tau', why: 'Three or more, and the listeners are included. Plural + inclusive = tau.' },
  { english: 'We (the workers) are finished.',         scenario: 'Speaker + other workers; the listener is the boss, not a worker.',     answer: 'mau', why: 'Three or more, and the listener is NOT one of the "we." Plural + exclusive = mau.' },
  { english: 'We two will wait for you.',              scenario: 'Speaker + one other person; the listener is the one being waited for.', answer: 'ma', why: 'Dual (two people) + the listener is outside the "we" = ma.' },
  { english: 'You and I will wait for Sione.',         scenario: 'Speaker + listener; Sione is absent.',                                   answer: 'ta', why: 'Dual + listener included = ta. (Sione being absent doesn\u2019t affect it.)' },
  { english: 'We are a big family.',                   scenario: 'Speaker describing their family to a visitor, who isn\u2019t family.',  answer: 'mau', why: 'Three or more, listener not included. Plural + exclusive = mau.' },
  { english: 'Shall we three go together?',            scenario: 'Speaker addressing two friends; all three will go.',                     answer: 'tau', why: 'Three or more counts as plural (not dual) even if the count is exactly three. Listeners included = tau.' },
  { english: 'We\u2019re cousins, you and I.',         scenario: 'Speaker addressing one listener, describing their relationship.',        answer: 'ta',  why: 'Just the two of them, listener is one of the "we." Dual + inclusive = ta.' },
  { english: 'We\u2019re from the same village.',      scenario: 'Speaker describing themselves and their neighbours to a stranger.',     answer: 'mau', why: 'Plural group (speaker + neighbours), listener is an outsider. Plural + exclusive = mau.' },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function ClusivityCornerCore() {
  const [deck, setDeck] = useState(() => shuffle(EXERCISES))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx]
  const answered = guess !== null
  const isCorrect = answered && guess === current.answer
  const answerPronoun = PRONOUNS.find(p => p.id === current.answer)
  const chosenPronoun = answered ? PRONOUNS.find(p => p.id === guess) : null

  const handleGuess = (id) => {
    if (answered) return
    setGuess(id)
    const right = id === current.answer
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => right ? s + 1 : 0)
  }

  const handleNext = () => {
    const nextIdx = idx + 1 >= deck.length ? 0 : idx + 1
    const nextDeck = idx + 1 >= deck.length ? shuffle(EXERCISES) : deck
    setDeck(nextDeck)
    setIdx(nextIdx)
    setGuess(null)
  }

  const handleReset = () => {
    setDeck(shuffle(EXERCISES))
    setIdx(0)
    setGuess(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (answered ? 1 : 0)) / deck.length) * 100 : 0

  return (
    <section className="clu-card">
      <div className="clu-card-row">
        <div className="clu-progress-wrap">
          <span className="clu-progress">{idx + 1} / {deck.length}</span>
          <div className="clu-progress-bar">
            <div className="clu-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="clu-stats">
          <span className={`clu-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="clu-stat-value">{score.right}</span>
            <span className="clu-stat-label"> / {score.total}</span>
          </span>
          {streak > 1 && (
            <span className="clu-stat clu-streak">
              <span className="clu-stat-value">{streak}</span>
              <span className="clu-stat-label"> in a row</span>
            </span>
          )}
          <button onClick={handleReset} className="clu-reset">reset</button>
        </div>
      </div>

      <div className="clu-prompt-label">Scenario</div>
      <div className="clu-prompt">&ldquo;{current.english}&rdquo;</div>
      <div className="clu-scenario">{current.scenario}</div>

      <div className="clu-matrix">
        <div className="clu-matrix-corner" />
        <div className="clu-matrix-colhead">Inclusive<span className="clu-matrix-colsub">listener IS in &ldquo;we&rdquo;</span></div>
        <div className="clu-matrix-colhead">Exclusive<span className="clu-matrix-colsub">listener is NOT in &ldquo;we&rdquo;</span></div>

        <div className="clu-matrix-rowhead">Dual<span className="clu-matrix-rowsub">two people</span></div>
        {renderPronounButton('ta', PRONOUNS, current, guess, answered, handleGuess)}
        {renderPronounButton('ma', PRONOUNS, current, guess, answered, handleGuess)}

        <div className="clu-matrix-rowhead">Plural<span className="clu-matrix-rowsub">three or more</span></div>
        {renderPronounButton('tau', PRONOUNS, current, guess, answered, handleGuess)}
        {renderPronounButton('mau', PRONOUNS, current, guess, answered, handleGuess)}
      </div>

      {answered && (
        <div className="clu-reveal">
          <div className="clu-verdict">
            {isCorrect
              ? <><span className="clu-right">Right.</span> The form is <em>{answerPronoun.tongan}</em>.</>
              : <><span className="clu-wrong">Not quite.</span> You picked <em>{chosenPronoun.tongan}</em>. The answer is <em>{answerPronoun.tongan}</em>.</>
            }
          </div>
          <div className="clu-why">
            <div className="clu-why-label">Why</div>
            <div className="clu-why-text">{current.why}</div>
          </div>
          <button onClick={handleNext} className="clu-next">
            Next scenario {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}

function renderPronounButton(id, pronouns, current, guess, answered, handleGuess) {
  const p = pronouns.find(x => x.id === id)
  const isAnswer = answered && current.answer === id
  const isChosen = answered && guess === id
  const cls = answered
    ? (isChosen && isAnswer ? 'is-chosen-right'
       : isChosen ? 'is-chosen-wrong'
       : isAnswer ? 'is-revealed-answer'
       : 'is-dim')
    : ''
  return (
    <button
      key={id}
      onClick={() => handleGuess(id)}
      disabled={answered}
      className={`clu-cell ${cls}`}
    >
      <span className="clu-cell-tongan">{p.tongan}</span>
      <span className="clu-cell-quick">{p.quick}</span>
      <span className="clu-cell-detail">{p.detail}</span>
    </button>
  )
}
