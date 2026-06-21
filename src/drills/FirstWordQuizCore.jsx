/**
 * FirstWordQuizCore — "the first word commits you to a sentence pattern."
 *
 * EXAMPLES carry a minChapter tag (when is this opener available?). The
 * PATTERNS button row is filtered to only those whose examples have
 * appeared, so a Ch 12 student doesn't see "obligation" or "have" buttons
 * for patterns they haven't met.
 *
 * Each opener is chosen to be DIAGNOSTIC of its pattern: a TM+pronoun with
 * no negator/Ko = statement; a sentence-initial bare verb (or Mou+verb) =
 * command; ʻikai = negation; Ko = equational; totonu ke / pau ke =
 * obligation; ʻi ai + possessive = have; ʻi ai + bare ha + noun =
 * existential. Forms verified against book/Chapter-{01,02,05,09,12,16,23,29,31}.
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
  // ── Statement: tense marker + pronoun, no negator and no Ko (Ch 1-2) ──
  { minChapter: 1,  opener: 'Naʻa ku',          rest: ' ʻalu ki kolo.',       english: 'I went to town.',               pattern: 'statement',  why: 'Naʻa is the past-tense statement opener (paired here with pronoun ku).' },
  { minChapter: 2,  opener: 'ʻOku ou',          rest: ' kai.',                english: 'I am eating.',                  pattern: 'statement',  why: 'Tense marker (ʻOku) + pronoun (ou = "I") with no negator → a plain statement.' },
  { minChapter: 2,  opener: 'Té ke',            rest: ' mohe.',               english: 'You will sleep.',               pattern: 'statement',  why: 'Future TM (Te) + pronoun ke = "you will…". A statement.' },
  { minChapter: 2,  opener: 'Kuó ne',           rest: ' ʻalu.',               english: 'He has gone.',                  pattern: 'statement',  why: 'Perfect TM (Kuo) + pronoun ne, with no negator or Ko, is a statement. The accent on Kuó marks the one-syllable pronoun.' },
  { minChapter: 2,  opener: 'Naʻa mau',         rest: ' kai.',                english: 'We (not you) ate.',             pattern: 'statement',  why: 'Past TM (Naʻa) + pronoun mau ("we, not you") = a plain past statement.' },
  { minChapter: 2,  opener: 'ʻOku nau',         rest: ' mohe.',               english: 'They are sleeping.',            pattern: 'statement',  why: 'Present TM (ʻOku) + pronoun nau ("they") with no negator → a statement.' },

  // ── Command: a bare verb (or Mou + verb) at the start, no tense marker (Ch 5) ──
  { minChapter: 5,  opener: 'Kai',              rest: ' muʻa!',               english: 'Eat please!',                   pattern: 'command',    why: 'A bare verb at sentence-initial position is an imperative. muʻa softens it.' },
  { minChapter: 5,  opener: 'Mou ō',            rest: '!',                    english: 'Go (all of you)!',              pattern: 'command',    why: 'Mou + plural verb form (ō from ʻalu) = command to a group.' },
  { minChapter: 5,  opener: 'ʻAlu',             rest: '!',                    english: 'Go!',                           pattern: 'command',    why: 'A bare verb with no tense marker, at the start of the sentence, is an imperative.' },
  { minChapter: 5,  opener: 'Nofo',             rest: ' muʻa!',               english: 'Please stay!',                  pattern: 'command',    why: 'Bare verb = command; muʻa after the verb softens it into a polite request.' },
  { minChapter: 5,  opener: 'Mou',              rest: ' hiva!',               english: 'Sing, all of you!',             pattern: 'command',    why: 'Mou + verb addresses a command to three or more people.' },

  // ── Negation: ʻikai — te before a pronoun, ke before a bare verb (Ch 9) ──
  { minChapter: 9,  opener: 'Naʻe ʻikai te',    rest: ' u kai.',              english: 'I did not eat.',                pattern: 'negation',   why: 'ʻikai te + pronoun u is the negation skeleton for pronoun subjects (Lesson 9: use te before a pronoun, ke before a bare verb).' },
  { minChapter: 9,  opener: 'ʻE ʻikai te',      rest: ' u ʻalu.',             english: 'I will not go.',                pattern: 'negation',   why: 'Future-negative: ʻE (future before non-pronoun) + ʻikai te + pronoun u = "I will not".' },
  { minChapter: 9,  opener: 'ʻOku ʻikai te',    rest: ' ne ʻita.',            english: 'He is not angry.',              pattern: 'negation',   why: 'ʻikai marks negation; te connects to the pronoun ne (te before a pronoun). Present tense ʻOku.' },
  { minChapter: 9,  opener: 'ʻOku ʻikai ke',    rest: ' ʻuha.',               english: 'It is not raining.',            pattern: 'negation',   why: 'No pronoun subject here, so ʻikai ke (not ʻikai te) sits directly before the verb ʻuha (Lesson 9).' },
  { minChapter: 9,  opener: 'Naʻe ʻikai te',    rest: ' mau kai.',            english: 'We did not eat.',               pattern: 'negation',   why: 'Past negative takes Naʻe (the word after it, ʻikai, is not a pronoun), then ʻikai te + pronoun mau.' },

  // ── Equational: Ko opens "X is Y" — no verb (Ch 12, pronoun subjects Ch 16) ──
  { minChapter: 12, opener: 'Ko e',             rest: ' tangata eni.',        english: 'This is a man.',                pattern: 'equational', why: 'Ko opens an equation: "X IS Y". No verb needed.' },
  { minChapter: 12, opener: 'Ko e',             rest: ' fala ē.',             english: 'That is a mat.',                pattern: 'equational', why: 'Ko e + noun + demonstrative = identification. Pure equational pattern.' },
  { minChapter: 12, opener: 'Ko e',             rest: ' kato eni.',           english: 'This is a basket.',             pattern: 'equational', why: 'Ko e + noun + demonstrative identifies something. No verb: a pure equational.' },
  { minChapter: 16, opener: 'Ko e',             rest: ' tangata ngāue au.',   english: 'I am a worker.',                pattern: 'equational', why: 'Ko e + predicate + postposed pronoun au = "I am a worker". The ʻa drops before a pronoun.' },
  { minChapter: 16, opener: 'Ko e',             rest: ' taʻahine mālohi ia.', english: 'She is a strong girl.',         pattern: 'equational', why: 'Ko opens "X is Y"; the postposed pronoun ia ("he/she") is the subject. Still equational.' },

  // ── Obligation: a modal head — totonu ke (should) / pau ke (must) (Ch 23) ──
  { minChapter: 23, opener: 'ʻOku totonu ke',   rest: ' u ako.',              english: 'I should study.',               pattern: 'obligation', why: 'totonu ke = "should": a modal head introducing obligation.' },
  { minChapter: 23, opener: 'Kuo pau ke',       rest: ' u foki.',             english: 'I must return.',                pattern: 'obligation', why: 'pau ke = "must / it is certain that". Stronger than totonu ke.' },
  { minChapter: 23, opener: 'ʻOku totonu ke',   rest: ' ne foki.',            english: 'He should return.',             pattern: 'obligation', why: 'totonu ke = "should / ought to": a modal head that marks obligation, not a plain statement.' },
  { minChapter: 23, opener: 'Kuo pau ke',       rest: ' tau ō.',              english: 'We (all) must go.',             pattern: 'obligation', why: 'pau ke = "must / it is necessary that", a stronger obligation than totonu ke.' },

  // ── Have: ʻi ai + an indefinite POSSESSIVE (haʻaku / haʻo / haʻane) (Ch 29) ──
  { minChapter: 29, opener: 'ʻOku ʻi ai haʻaku', rest: ' tohi.',              english: 'I have a book.',                pattern: 'have',       why: 'ʻi ai + indefinite possessive (haʻaku = "a … of mine") is the have-construction. No verb "to have".' },
  { minChapter: 29, opener: 'ʻOku ʻi ai haʻo',   rest: ' kato?',             english: 'Do you have a basket?',          pattern: 'have',       why: 'ʻi ai + the indefinite possessive haʻo ("a … of yours") is the "to have" frame: the possessive marks it as "have".' },
  { minChapter: 29, opener: 'ʻOku ʻi ai haʻane', rest: ' tohi?',             english: 'Does he have a book?',           pattern: 'have',       why: 'ʻi ai + indefinite possessive haʻane ("a … of his") = "does he have…". Contrast existential, which uses a bare ha + noun.' },

  // ── Existential: ʻi ai + an indefinite ha + NOUN — "there is/are" (Ch 31) ──
  { minChapter: 31, opener: 'ʻOku ʻi ai ha',    rest: ' tōketā ʻi ʻapi.',     english: 'There is a doctor at home.',    pattern: 'existential', why: 'ʻi ai ha + indefinite noun = "there is a …". Tongan has no verb "to be".' },
  { minChapter: 31, opener: 'Kuo ʻi ai ha',     rest: ' kātoanga.',           english: 'There has been a celebration.', pattern: 'existential', why: 'Same existential skeleton, now in the perfect tense (Kuo).' },
  { minChapter: 31, opener: 'ʻOku ʻi ai ha',    rest: ' kakai ʻi he kolo.',   english: 'There are people in the town.', pattern: 'existential', why: 'ʻi ai + a bare indefinite ha + noun = "there is/are…". No possessive, so this is existential, not "have".' },
  { minChapter: 31, opener: 'Naʻe ʻi ai ha',    rest: ' faiako.',             english: 'There was a teacher.',          pattern: 'existential', why: 'The same existential frame in the past tense (Naʻe before ʻi ai).' },
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
    <section className="pcs-card">
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
        {isAnswered ? current.english : ' '}
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
            Next {'→'}
          </button>
        </div>
      )}
    </section>
  )
}
