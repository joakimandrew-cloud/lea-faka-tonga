/**
 * EmotionalArticleMatrixCore — Ch 52.
 *
 * The emotional article system maps onto a 2×2: definite vs indefinite
 * crossed with neutral vs emotional. Same matrix shape as Clusivity
 * Corner (Ch 2), different content. The student reads a scenario and
 * picks the right cell.
 *
 *   Neutral · Definite     = e / he      (the X)
 *   Neutral · Indefinite   = ha          (a / some X)
 *   Emotional · Definite   = siʻi        (the [poor / dear] X)
 *   Emotional · Indefinite = siʻa        (a [poor / dear] X)
 */

import { useState } from 'react'

const ARTICLES = [
  { id: 'e',   tongan: 'e / he', emotional: false, definite: true,  desc: 'neutral, definite' },
  { id: 'ha',  tongan: 'ha',     emotional: false, definite: false, desc: 'neutral, indefinite' },
  { id: 'sii', tongan: 'siʻi',   emotional: true,  definite: true,  desc: 'emotional, definite' },
  { id: 'sia', tongan: 'siʻa',   emotional: true,  definite: false, desc: 'emotional, indefinite' },
]

const EXERCISES = [
  { english: 'The poor horse is tired.',                                 scenario: 'The speaker feels sympathy for a specific known horse.',                              answer: 'sii', why: 'Definite (the speaker has a particular horse in mind) + emotional (pity) → siʻi.' },
  { english: 'I want a fish (any fish).',                                 scenario: 'Neutral request for any indefinite fish.',                                            answer: 'ha',  why: 'Indefinite (any fish) + neutral (no emotional colour) → ha.' },
  { english: 'Has a child been hurt? (poor thing)',                       scenario: 'The speaker doesn\u2019t know which child but feels sympathy.',                       answer: 'sia', why: 'Indefinite (which child unknown) + emotional (sympathy) → siʻa.' },
  { english: 'Did you eat the bread?',                                    scenario: 'The speaker means a particular known bread, no emotional colour.',                    answer: 'e',   why: 'Definite (specific known bread) + neutral → e (or he after ʻi/ki/mei).' },
  { english: 'Where are Tēvita\u2019s dear children?',                     scenario: 'Specific (Tēvita\u2019s) children, with affection.',                                    answer: 'sii', why: 'Definite + emotional (affection / endearment) → siʻi.' },
  { english: 'They brought him home so he could have some food. (poor fellow)', scenario: 'Some (indefinite) food, with sympathy for the person being fed.',               answer: 'sia', why: 'Indefinite (some food, any food) + emotional (sympathy) → siʻa.' },
  { english: 'The unfortunate death of the mother.',                     scenario: 'Specific death, marked with sorrow.',                                                  answer: 'sii', why: 'Definite (the specific death) + emotional (sorrow) → siʻi.' },
  { english: 'I went with some friends.',                                scenario: 'Indefinite friends, no emotional colour.',                                              answer: 'ha',  why: 'Indefinite + neutral → ha.' },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function EmotionalArticleMatrixCore() {
  const [deck, setDeck] = useState(() => shuffle(EXERCISES))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx]
  const answered = guess !== null
  const isCorrect = answered && guess === current.answer
  const answerArticle = ARTICLES.find(a => a.id === current.answer)
  const chosenArticle = answered ? ARTICLES.find(a => a.id === guess) : null

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
    <section className="pcs-card">
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

      <div className="clu-prompt-label">Sentence</div>
      <div className="clu-prompt">&ldquo;{current.english}&rdquo;</div>
      <div className="clu-scenario">{current.scenario}</div>

      <div className="clu-matrix">
        <div className="clu-matrix-corner" />
        <div className="clu-matrix-colhead">Definite<span className="clu-matrix-colsub">specific known thing</span></div>
        <div className="clu-matrix-colhead">Indefinite<span className="clu-matrix-colsub">any / unspecified</span></div>

        <div className="clu-matrix-rowhead">Neutral<span className="clu-matrix-rowsub">no emotional colour</span></div>
        {renderArticleButton('e',   ARTICLES, current, guess, answered, handleGuess)}
        {renderArticleButton('ha',  ARTICLES, current, guess, answered, handleGuess)}

        <div className="clu-matrix-rowhead">Emotional<span className="clu-matrix-rowsub">pity / affection / humility</span></div>
        {renderArticleButton('sii', ARTICLES, current, guess, answered, handleGuess)}
        {renderArticleButton('sia', ARTICLES, current, guess, answered, handleGuess)}
      </div>

      {answered && (
        <div className="clu-reveal">
          <div className="clu-verdict">
            {isCorrect
              ? <><span className="clu-right">Right.</span> The form is <em>{answerArticle.tongan}</em>.</>
              : <><span className="clu-wrong">Not quite.</span> You picked <em>{chosenArticle.tongan}</em>. The answer is <em>{answerArticle.tongan}</em>.</>
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

function renderArticleButton(id, articles, current, guess, answered, handleGuess) {
  const a = articles.find(x => x.id === id)
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
      <span className="clu-cell-tongan">{a.tongan}</span>
      <span className="clu-cell-quick">{a.desc}</span>
    </button>
  )
}
