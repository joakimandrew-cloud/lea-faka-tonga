/**
 * DefinitenessFlipCore — Ch 19, the ergative pivot.
 *
 * Tongan's hardest pedagogical moment. The same verb behaves
 * structurally differently based on whether its object is indefinite
 * or definite:
 *   - "ate bread"        → kai mā ʻa Sione    (intransitive compound: verb+noun fuse, subject = ʻa)
 *   - "ate the bread"    → kai ʻe Sione ʻa e mā (transitive: object splits off, subject = ʻe)
 *
 * Two-mode drill:
 *   1. EXPLORE — toggle "some" ↔ "the" on an English sentence and
 *      watch the Tongan rebuild in real time. Highlight what changed.
 *   2. QUIZ — locked-definiteness English sentence, two Tongan
 *      options, pick the matching structure.
 *
 * The student first FEELS the rebuild, then proves they can pick
 * the matching form. This is the core insight of Ch 19, made tactile.
 */

import { useState } from 'react'

const EXAMPLES = [
  {
    id: 'sione-bread',
    object: 'bread',
    object_tongan: 'mā',
    indefinite: {
      english: 'Sione ate bread.',
      tongan: 'Naʻe kai mā ʻa Sione.',
    },
    definite: {
      english: 'Sione ate the bread.',
      tongan: 'Naʻe kai ʻe Sione ʻa e mā.',
    },
    lead: 'Sione ate',
    principle: { indefinite: 'verb + noun fused, subject takes ʻa', definite: 'object splits off (ʻa e …), subject takes ʻe' },
    why: 'With "bread" (indef): the verb-noun pair kai+mā fuses into one intransitive unit. The subject takes ʻa (Sione is treated like the only argument).\nWith "the bread" (def): the object splits off as a separate phrase ʻa e mā. The verb is now transitive — the subject takes ʻe.',
  },
  {
    id: 'mele-fish',
    object: 'fish',
    object_tongan: 'ika',
    indefinite: {
      english: 'Mele ate fish.',
      tongan: 'Naʻe kai ika ʻa Mele.',
    },
    definite: {
      english: 'Mele ate the fish.',
      tongan: 'Naʻe kai ʻe Mele ʻa e iká.',
    },
    lead: 'Mele ate',
    principle: { indefinite: 'verb + noun fused, subject takes ʻa', definite: 'object splits off (ʻa e …), subject takes ʻe' },
    why: 'Same pivot. kai+ika fused, subject ʻa. Versus kai split from ʻa e iká, subject ʻe.',
  },
  {
    id: 'i-water',
    object: 'water',
    object_tongan: 'vai',
    indefinite: {
      english: 'I drank water.',
      tongan: 'Naʻá ku inu vai.',
    },
    definite: {
      english: 'I drank the water.',
      tongan: 'Naʻá ku inu ʻa e vaí.',
    },
    lead: 'I drank',
    principle: { indefinite: 'verb + noun fused (inu vai)', definite: 'object splits off as ʻa e vaí; subject ku is unchanged' },
    why: 'Pronoun subject (ku/u) doesn\u2019t change between the two versions — the pivot is in the OBJECT side. Indefinite: inu+vai fused. Definite: object splits off as ʻa e vaí.',
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

export default function DefinitenessFlipCore() {
  const [mode, setMode] = useState('explore')

  // Explore mode state
  const [exampleIdx, setExampleIdx] = useState(0)
  const [defState, setDefState] = useState('indefinite')

  // Quiz mode state
  const [deck, setDeck] = useState(() => shuffle(EXAMPLES.flatMap(e => [
    { ...e, target: 'indefinite' },
    { ...e, target: 'definite' },
  ])))
  const [quizIdx, setQuizIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  if (mode === 'explore') {
    const example = EXAMPLES[exampleIdx]
    const current = example[defState]
    return (
      <section className="pcs-card">
        <div className="pcs-card-row">
          <div className="pcs-progress">Explore mode — example {exampleIdx + 1} / {EXAMPLES.length}</div>
          <div className="pcs-stats">
            <button
              onClick={() => setExampleIdx(i => (i + 1) % EXAMPLES.length)}
              className="pcs-reset"
            >
              next example {'\u2192'}
            </button>
          </div>
        </div>

        <div className="pcs-noun-frame">
          <div className="pcs-question">
            {example.lead} {' '}
            <button
              onClick={() => setDefState('indefinite')}
              className={`pcs-btn ${defState === 'indefinite' ? 'is-answer' : 'is-dim'}`}
              style={{ display: 'inline-block', padding: '0.2rem 0.7rem', margin: '0 0.25rem' }}
            >
              some
            </button>
            /
            <button
              onClick={() => setDefState('definite')}
              className={`pcs-btn ${defState === 'definite' ? 'is-answer' : 'is-dim'}`}
              style={{ display: 'inline-block', padding: '0.2rem 0.7rem', margin: '0 0.25rem' }}
            >
              the
            </button>
            {' '} {example.object}.
          </div>
          <div className="pcs-noun" style={{ marginTop: '1rem' }}>{current.tongan}</div>
          <div className="pcs-noun-gloss">{current.english}</div>
        </div>

        <div className="pcs-why">
          <div className="pcs-why-label">Watch what changed</div>
          <div className="pcs-why-text" style={{ whiteSpace: 'pre-line' }}>{example.why}</div>
        </div>

        <button
          onClick={() => { setMode('quiz'); setDeck(shuffle(EXAMPLES.flatMap(e => [
            { ...e, target: 'indefinite' },
            { ...e, target: 'definite' },
          ]))); setQuizIdx(0); setGuess(null); }}
          className="pcs-next"
        >
          I&rsquo;m ready — quiz me {'\u2192'}
        </button>
      </section>
    )
  }

  // Quiz mode
  const current = deck[quizIdx]
  const isAnswered = guess !== null
  const isCorrect = isAnswered && guess === current.target
  const correctTongan = current[current.target].tongan
  const wrongTongan = current[current.target === 'indefinite' ? 'definite' : 'indefinite'].tongan

  const handleGuess = (which) => {
    if (isAnswered) return
    setGuess(which)
    const right = which === current.target
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => right ? s + 1 : 0)
  }

  const handleNext = () => {
    if (quizIdx < deck.length - 1) {
      setQuizIdx(quizIdx + 1)
    } else {
      setDeck(shuffle(EXAMPLES.flatMap(e => [
        { ...e, target: 'indefinite' },
        { ...e, target: 'definite' },
      ])))
      setQuizIdx(0)
    }
    setGuess(null)
  }

  return (
    <section className="pcs-card">
      <div className="pcs-card-row">
        <div className="pcs-progress">Quiz · {quizIdx + 1} / {deck.length}</div>
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
          <button
            onClick={() => setMode('explore')}
            className="pcs-reset"
          >
            back to explore
          </button>
        </div>
      </div>

      <div className="pcs-noun-frame">
        <div className="pcs-prompt-label">English</div>
        <div className="pcs-noun">{current[current.target].english}</div>
      </div>

      {!isAnswered && <div className="pcs-question">Which Tongan structure matches?</div>}

      <div className="pcs-buttons">
        {['indefinite', 'definite'].map(opt => {
          const isChosen = isAnswered && guess === opt
          const isAnswer = isAnswered && current.target === opt
          const cls = isAnswered
            ? (isAnswer ? 'is-answer' : isChosen ? 'is-chosen-wrong' : 'is-dim')
            : ''
          return (
            <button
              key={opt}
              onClick={() => handleGuess(opt)}
              disabled={isAnswered}
              className={`pcs-btn ${cls}`}
            >
              <span className="pcs-btn-label">{current[opt].tongan}</span>
              <span className="pcs-btn-principle">{current.principle[opt]}</span>
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div className="pcs-reveal">
          <div className="pcs-verdict">
            {isCorrect
              ? <><span className="pcs-right">Right.</span> The {current.target} version: <em>{correctTongan}</em>.</>
              : <><span className="pcs-wrong">Not quite.</span> The English uses "{current.target === 'indefinite' ? 'some' : 'the'}" → the answer is <em>{correctTongan}</em>, not <em>{wrongTongan}</em>.</>
            }
          </div>
          <div className="pcs-why">
            <div className="pcs-why-label">Why</div>
            <div className="pcs-why-text" style={{ whiteSpace: 'pre-line' }}>{current.why}</div>
          </div>
          <button onClick={handleNext} className="pcs-next">
            Next {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
