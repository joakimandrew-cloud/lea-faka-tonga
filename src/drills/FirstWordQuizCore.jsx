/**
 * FirstWordQuizCore — "the first word commits you to a sentence pattern."
 *
 * EXAMPLES carry a minChapter tag (when is this opener available?). The
 * PATTERNS button row is filtered to only those whose examples have
 * appeared, so a Ch 12 student doesn't see "obligation" or "have" buttons
 * for patterns they haven't met.
 */

import { useState, useMemo } from 'react'

const ALL_PATTERNS = [
  { id: 'statement',   label: 'Statement',   hint: 'Someone does something.',          minChapter: 1  },
  { id: 'command',     label: 'Command',     hint: 'Do this! (imperative)',            minChapter: 5  },
  { id: 'negation',    label: 'Negation',    hint: 'Someone does NOT do something.',   minChapter: 9  },
  { id: 'equational',  label: 'Equational',  hint: 'X is Y.',                          minChapter: 12 },
  { id: 'obligation',  label: 'Obligation',  hint: 'Should / must / let.',             minChapter: 23 },
  { id: 'have',        label: 'Have',        hint: 'Someone has something.',           minChapter: 29 },
  { id: 'existential', label: 'Existential', hint: 'There is / there are …',           minChapter: 31 },
]

const ALL_EXAMPLES = [
  { minChapter: 1,  opener: 'Naʻa ku',         rest: 'ʻalu ki kolo.',         english: 'I went to town.',                  pattern: 'statement',  why: 'Naʻa is the past-tense statement opener (paired here with pronoun ku).' },
  { minChapter: 2,  opener: 'ʻOku ou',         rest: 'kai.',                  english: 'I am eating.',                     pattern: 'statement',  why: 'Tense marker (ʻOku) + pronoun (ou = "I") with no negator → a plain statement.' },
  { minChapter: 2,  opener: 'Té ke',           rest: 'mohe.',                 english: 'You will sleep.',                  pattern: 'statement',  why: 'Future TM (Te) + pronoun ke = "you will…". A statement.' },
  { minChapter: 5,  opener: 'Kai',             rest: 'mu\u02BBa!',            english: 'Eat please!',                      pattern: 'command',    why: 'A bare verb at sentence-initial position is an imperative. mu\u02BBa softens it.' },
  { minChapter: 5,  opener: 'Mou ō',           rest: '!',                     english: 'Go (all of you)!',                 pattern: 'command',    why: 'Mou + plural verb form (ō from ʻalu) = command to a group.' },
  { minChapter: 9,  opener: 'Naʻe ʻikai te',   rest: 'u kai.',                english: 'I did not eat.',                   pattern: 'negation',   why: 'ʻikai te + pronoun u is the negation skeleton for pronoun subjects (Ch 9: use te before a pronoun, ke before a bare verb).' },
  { minChapter: 9,  opener: 'ʻE ʻikai te',     rest: 'u ʻalu.',               english: 'I will not go.',                   pattern: 'negation',   why: 'Future-negative: ʻE (future before non-pronoun) + ʻikai te + pronoun u = "I will not".' },
  { minChapter: 12, opener: 'Ko e',            rest: 'tangata eni.',          english: 'This is a man.',                   pattern: 'equational', why: 'Ko opens an equation: "X IS Y". No verb needed.' },
  { minChapter: 12, opener: 'Ko e',            rest: 'fala ē.',               english: 'That is a mat.',                   pattern: 'equational', why: 'Ko e + noun + demonstrative = identification. Pure equational pattern.' },
  { minChapter: 23, opener: 'ʻOku totonu ke',  rest: 'u ako.',                english: 'I should study.',                  pattern: 'obligation', why: 'totonu ke = "should" — a modal head introducing obligation.' },
  { minChapter: 23, opener: 'Kuo pau ke',      rest: 'u foki.',               english: 'I must return.',                   pattern: 'obligation', why: 'pau ke = "must / it is certain that". Stronger than totonu ke.' },
  { minChapter: 29, opener: 'ʻOku ʻi ai haʻaku', rest: 'tohi.',               english: 'I have a book.',                   pattern: 'have',       why: 'ʻi ai + indefinite possessive (haʻaku = "my") is the have-construction. No verb "to have".' },
  { minChapter: 31, opener: 'ʻOku ʻi ai ha',   rest: 'tōketā ʻi ʻapi.',       english: 'There is a doctor at home.',       pattern: 'existential', why: 'ʻi ai ha + indefinite noun = "there is a …". Tongan has no verb "to be".' },
  { minChapter: 31, opener: 'Kuo ʻi ai ha',    rest: 'kātoanga.',             english: 'There has been a celebration.',    pattern: 'existential', why: 'Same existential skeleton, now in the perfect tense (Kuo).' },
]

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function FirstWordQuizCore({ chapterNum }) {
  const examples = useMemo(
    () => ALL_EXAMPLES.filter(e => !chapterNum || e.minChapter <= chapterNum),
    [chapterNum]
  )
  const patterns = useMemo(
    () => ALL_PATTERNS.filter(p => !chapterNum || p.minChapter <= chapterNum),
    [chapterNum]
  )

  const [deck, setDeck] = useState(() => shuffle(examples))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx] || examples[0]
  const isAnswered = guess !== null
  const isCorrect = isAnswered && guess === current.pattern
  const chosenLabel = (id) => patterns.find(p => p.id === id)?.label || '?'

  const handleGuess = (patternId) => {
    if (isAnswered) return
    setGuess(patternId)
    const right = patternId === current.pattern
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setStreak(s => right ? s + 1 : 0)
  }

  const handleNext = () => {
    if (idx < deck.length - 1) {
      setIdx(idx + 1)
    } else {
      setDeck(shuffle(examples))
      setIdx(0)
    }
    setGuess(null)
  }

  const handleReset = () => {
    setDeck(shuffle(examples))
    setIdx(0)
    setGuess(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (isAnswered ? 1 : 0)) / deck.length) * 100 : 0

  return (
    <section className="fwq-card">
      <div className="fwq-card-row">
        <div className="fwq-progress-wrap">
          <span className="fwq-progress">{idx + 1} / {deck.length}</span>
          <div className="fwq-progress-bar">
            <div className="fwq-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="fwq-stats">
          <span className={`fwq-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="fwq-stat-value">{score.right}</span>
            <span className="fwq-stat-label"> / {score.total} correct</span>
          </span>
          {streak > 1 && (
            <span className="fwq-stat fwq-streak">
              <span className="fwq-stat-value">{streak}</span>
              <span className="fwq-stat-label"> in a row</span>
            </span>
          )}
          <button onClick={handleReset} className="fwq-reset" aria-label="Reset">reset</button>
        </div>
      </div>

      <div className={`fwq-sentence ${isAnswered ? 'is-revealed' : ''}`}>
        <span className="fwq-opener">{current.opener}</span>
        <span className="fwq-rest">{current.rest}</span>
      </div>

      <div className={`fwq-english ${isAnswered ? 'is-revealed' : ''}`}>
        {isAnswered ? current.english : '\u00a0'}
      </div>

      <div className="fwq-question">
        {isAnswered
          ? (isCorrect
              ? <><span className="fwq-correct">Right.</span> That opening commits to a <em>{chosenLabel(current.pattern).toLowerCase()}</em>.</>
              : <><span className="fwq-wrong">Not quite.</span> You picked <em>{chosenLabel(guess).toLowerCase()}</em>. The answer is <em>{chosenLabel(current.pattern).toLowerCase()}</em>.</>
            )
          : 'What kind of sentence is this?'}
      </div>

      <div className="fwq-buttons">
        {patterns.map(p => {
          const isChosen = isAnswered && guess === p.id
          const isAnswer = isAnswered && current.pattern === p.id
          const cls = isAnswered
            ? (isChosen && isAnswer ? 'is-chosen-right'
               : isChosen ? 'is-chosen-wrong'
               : isAnswer ? 'is-revealed-answer'
               : 'is-dim')
            : ''
          return (
            <button
              key={p.id}
              onClick={() => handleGuess(p.id)}
              disabled={isAnswered}
              className={`fwq-btn ${cls}`}
            >
              <span className="fwq-btn-label">{p.label}</span>
              <span className="fwq-btn-hint">{p.hint}</span>
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div className="fwq-why">
          <div className="fwq-why-label">Why</div>
          <div className="fwq-why-text">{current.why}</div>
          <button onClick={handleNext} className="fwq-next">
            Next {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
