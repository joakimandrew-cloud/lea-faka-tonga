/**
 * SentenceBuilderCore — Phase 3A capstone: "Build a Tongan sentence".
 *
 * The integration exercise nothing else covers: given an English prompt,
 * assemble the Tongan sentence from shuffled tiles. The pool carries
 * DISTRACTOR marker tiles (ʻa / ʻe / ʻa e / ʻe he / ha / e / he, plus
 * ho-class possessives and the other plural marker), so the learner must
 * choose the right marker AND the right order. Grading is PER SLOT: each
 * placed tile turns green if it matches the correct tile at that position,
 * red if not.
 *
 * Scope: ch19 ergative core (ʻa intransitive subject; ʻe name-doer / ʻe he
 * common-noun-doer; ʻa-name / ʻa e-definite objects; general-object
 * compounds stay intransitive), layered with possessive class (ʻeku vs
 * hoku), the people-plural kau vs ngaahi, and ʻikai te negation. All
 * sentences verified against book/Chapter-19.md (markers L12-114),
 * Chapter-09.md (negation), Chapter-16/17 (possessive), Chapter-25 (kau).
 *
 * The definitive (pronunciation) accent on definite noun groups is left
 * OFF here on purpose — placing it is a separate skill drilled by
 * accent-placement-picker; this exercise grades markers and word order.
 *
 * Tile mechanic mirrors CleftBuilderCore: pool = parts + distractors,
 * slot count comes from `correct_order`. Content tiles carry an English
 * gloss; marker tiles being tested carry a neutral gloss (or none) so the
 * label does not give the choice away.
 */

import { useState, useEffect, useCallback } from 'react'

const PHRASES = [
  {
    id: 'sione-bread',
    english: 'Sione ate the bread.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'kai',  gloss: 'ate' },
      { id: 'dm', tongan: 'ʻe',   gloss: '' },
      { id: 'doer', tongan: 'Sione', gloss: 'Sione' },
      { id: 'om', tongan: 'ʻa e', gloss: '' },
      { id: 'obj', tongan: 'mā',  gloss: 'bread' },
    ],
    distractors: [
      { id: 'd-a',  tongan: 'ʻa',    gloss: '' },
      { id: 'd-ehe', tongan: 'ʻe he', gloss: '' },
      { id: 'd-ha', tongan: 'ha',    gloss: '' },
    ],
    why: 'Verb first. Sione is the doer of a transitive verb and a name, so the agent marker is ʻe. The definite object "the bread" takes ʻa e. Default order: verb, doer, object.',
  },
  {
    id: 'man-fish',
    english: 'The man ate the fish.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'kai',  gloss: 'ate' },
      { id: 'dm', tongan: 'ʻe he', gloss: '' },
      { id: 'doer', tongan: 'tangata', gloss: 'man' },
      { id: 'om', tongan: 'ʻa e', gloss: '' },
      { id: 'obj', tongan: 'ika', gloss: 'fish' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe', gloss: '' },
      { id: 'd-a',  tongan: 'ʻa', gloss: '' },
      { id: 'd-ha', tongan: 'ha', gloss: '' },
    ],
    why: 'A common-noun doer takes ʻe he (not the bare ʻe used for names): ʻe he tangata. The definite object takes ʻa e ika.',
  },
  {
    id: 'sione-went',
    english: 'Sione went.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'ʻalu', gloss: 'went' },
      { id: 'sm', tongan: 'ʻa',   gloss: '' },
      { id: 'subj', tongan: 'Sione', gloss: 'Sione' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe',   gloss: '' },
      { id: 'd-ae', tongan: 'ʻa e', gloss: '' },
      { id: 'd-he', tongan: 'he',   gloss: '' },
    ],
    why: 'ʻalu (go) has no object, so the sentence is intransitive and the subject takes ʻa, not ʻe: ʻa Sione.',
  },
  {
    id: 'i-read-book',
    english: 'I read the book.',
    parts: [
      { id: 'tm', tongan: 'Naʻá', gloss: 'past' },
      { id: 'pr', tongan: 'ku',   gloss: 'I' },
      { id: 'v',  tongan: 'lau',  gloss: 'read' },
      { id: 'om', tongan: 'ʻa e', gloss: '' },
      { id: 'obj', tongan: 'tohi', gloss: 'book' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe', gloss: '' },
      { id: 'd-he', tongan: 'he', gloss: '' },
      { id: 'd-ha', tongan: 'ha', gloss: '' },
    ],
    why: 'A pronoun subject sits before the verb (Naʻá ku), so there is no ʻe agent marker. The definite object "the book" takes ʻa e tohi.',
  },
  {
    id: 'mele-clothes',
    english: 'Mele washed the clothes.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'fufulu', gloss: 'washed' },
      { id: 'dm', tongan: 'ʻe',   gloss: '' },
      { id: 'doer', tongan: 'Mele', gloss: 'Mele' },
      { id: 'om', tongan: 'ʻa e', gloss: '' },
      { id: 'obj', tongan: 'vala', gloss: 'clothes' },
    ],
    distractors: [
      { id: 'd-a',  tongan: 'ʻa',    gloss: '' },
      { id: 'd-ehe', tongan: 'ʻe he', gloss: '' },
      { id: 'd-ha', tongan: 'ha',    gloss: '' },
    ],
    why: 'A name doing a transitive verb takes ʻe: ʻe Mele. The definite object takes ʻa e vala.',
  },
  {
    id: 'teachers-went',
    english: 'The teachers went.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'ō',    gloss: 'went', accepts: ['d-alu'] },
      { id: 'sm', tongan: 'ʻa e', gloss: '' },
      { id: 'pl', tongan: 'kau',  gloss: 'plural' },
      { id: 'noun', tongan: 'faiako', gloss: 'teacher' },
    ],
    distractors: [
      { id: 'd-alu', tongan: 'ʻalu', gloss: 'went' },
      { id: 'd-ngaahi', tongan: 'ngaahi', gloss: 'plural' },
      { id: 'd-e', tongan: 'ʻe', gloss: '' },
      { id: 'd-ha', tongan: 'ha', gloss: '' },
    ],
    why: 'Intransitive subject takes ʻa e. Teachers are people, so the plural marker is kau (not ngaahi, which is for things): ʻa e kau faiako. With a plural subject, ʻalu takes its plural form ō (Ch 25): ō is the book’s plural form; ʻalu is also commonly heard in speech, so both are accepted here.',
  },
  {
    id: 'i-not-eat',
    english: 'I did not eat.',
    parts: [
      { id: 'tm',   tongan: 'Naʻe', gloss: 'past' },
      { id: 'neg',  tongan: 'ʻikai', gloss: 'not' },
      { id: 'conn', tongan: 'té',   gloss: '' },
      { id: 'pr',   tongan: 'u',    gloss: 'I' },
      { id: 'v',    tongan: 'kai',  gloss: 'eat' },
    ],
    distractors: [
      { id: 'd-ke', tongan: 'ke', gloss: '' },
      { id: 'd-a',  tongan: 'ʻa', gloss: '' },
      { id: 'd-oku', tongan: 'ʻoku', gloss: 'present' },
    ],
    why: 'Past negative: Naʻe (the next word ʻikai is not a pronoun) + ʻikai + té before the pronoun u (the accent marks the stress shift onto te before a one-syllable pronoun). Use te before a pronoun, ke before a bare verb.',
  },
  {
    id: 'my-book',
    english: 'It is my book.',
    parts: [
      { id: 'ko',   tongan: 'Ko',   gloss: 'it is' },
      { id: 'poss', tongan: 'ʻeku', gloss: 'my' },
      { id: 'noun', tongan: 'tohi', gloss: 'book' },
    ],
    distractors: [
      { id: 'd-hoku', tongan: 'hoku', gloss: 'my' },
      { id: 'd-ae',   tongan: 'ʻa e', gloss: '' },
      { id: 'd-he',   tongan: 'he',   gloss: '' },
    ],
    why: 'Ko opens "it is…". A book is something you handle, an e-class noun, so "my book" is ʻeku tohi, not hoku tohi.',
  },
  {
    id: 'woman-called-pita',
    english: 'The woman called Pita.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'ui',   gloss: 'called' },
      { id: 'dm', tongan: 'ʻe he', gloss: '' },
      { id: 'doer', tongan: 'fefine', gloss: 'woman' },
      { id: 'om', tongan: 'ʻa',  gloss: '' },
      { id: 'obj', tongan: 'Pita', gloss: 'Pita' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe',   gloss: '' },
      { id: 'd-ae', tongan: 'ʻa e', gloss: '' },
      { id: 'd-he', tongan: 'he',   gloss: '' },
    ],
    why: 'The doer is a common noun, so ʻe he fefine. The object Pita is a name, so it takes bare ʻa (no article e): ʻa Pita.',
  },
  {
    id: 'they-ate-food',
    english: 'They ate the food.',
    parts: [
      { id: 'tm', tongan: 'Naʻa', gloss: 'past' },
      { id: 'pr', tongan: 'nau',  gloss: 'they' },
      { id: 'v',  tongan: 'kai',  gloss: 'ate' },
      { id: 'om', tongan: 'ʻa e', gloss: '' },
      { id: 'obj', tongan: 'meʻakai', gloss: 'food' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe',   gloss: '' },
      { id: 'd-ehe', tongan: 'ʻe he', gloss: '' },
      { id: 'd-ha', tongan: 'ha',   gloss: '' },
    ],
    why: 'A pronoun subject (nau = they) sits before the verb: Naʻa nau. The definite object takes ʻa e meʻakai.',
  },
  {
    id: 'sione-drank-water',
    english: 'Sione drank water.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'inu',  gloss: 'drank' },
      { id: 'gobj', tongan: 'vai', gloss: 'water' },
      { id: 'sm', tongan: 'ʻa',   gloss: '' },
      { id: 'subj', tongan: 'Sione', gloss: 'Sione' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe',   gloss: '' },
      { id: 'd-ae', tongan: 'ʻa e', gloss: '' },
      { id: 'd-ha', tongan: 'ha',   gloss: '' },
    ],
    why: '"inu vai" (drink water) has a general object and acts as one intransitive verb, so the subject takes ʻa: ʻa Sione. (With a definite object it would be "inu ʻe Sione ʻa e vai".)',
  },
  {
    id: 'boy-read-book',
    english: 'The boy read the book.',
    parts: [
      { id: 'tm', tongan: 'Naʻe', gloss: 'past' },
      { id: 'v',  tongan: 'lau',  gloss: 'read' },
      { id: 'dm', tongan: 'ʻe he', gloss: '' },
      { id: 'doer', tongan: 'tamasiʻi', gloss: 'boy' },
      { id: 'om', tongan: 'ʻa e', gloss: '' },
      { id: 'obj', tongan: 'tohi', gloss: 'book' },
    ],
    distractors: [
      { id: 'd-e',  tongan: 'ʻe', gloss: '' },
      { id: 'd-a',  tongan: 'ʻa', gloss: '' },
      { id: 'd-ha', tongan: 'ha', gloss: '' },
    ],
    why: 'The doer is a common noun, so ʻe he tamasiʻi. The definite object takes ʻa e tohi.',
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

function buildPool(phrase) {
  return shuffle([...phrase.parts, ...phrase.distractors])
}

export default function SentenceBuilderCore() {
  const [deck, setDeck] = useState(() => shuffle(PHRASES))
  const [idx, setIdx] = useState(0)
  const [pool, setPool] = useState(() => buildPool(deck[0]))
  const [selected, setSelected] = useState([])
  const [answered, setAnswered] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx]
  const correctOrder = current.parts.map(p => p.id)
  const slotCount = correctOrder.length

  // A tile fits a slot if it IS the correct tile, or the correct part
  // explicitly accepts it as an alternate (e.g. ō / ʻalu, both correct
  // for a plural subject in speech).
  const fitsSlot = useCallback(
    (tileId, slotIdx) =>
      tileId === current.parts[slotIdx].id || (current.parts[slotIdx].accepts || []).includes(tileId),
    [current]
  )

  useEffect(() => {
    if (answered !== null) return
    if (selected.length !== slotCount) return
    const ordered = selected.map(i => pool[i].id)
    const isCorrect = ordered.every((id, i) => fitsSlot(id, i))
    setAnswered(isCorrect ? 'correct' : 'wrong')
    setScore(s => ({ right: s.right + (isCorrect ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isCorrect ? s + 1 : 0)
  }, [selected, pool, slotCount, answered, fitsSlot])

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
    setPool(buildPool(nextDeck[nextIdx]))
    setSelected([])
    setAnswered(null)
  }

  const handleReset = () => {
    const fresh = shuffle(PHRASES)
    setDeck(fresh)
    setIdx(0)
    setPool(buildPool(fresh[0]))
    setSelected([])
    setAnswered(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const handleClear = () => {
    if (answered !== null) return
    setSelected([])
  }

  const studentSentence = `${selected.map(i => pool[i].tongan).join(' ')}.`
  const correctSentence = `${current.parts.map(p => p.tongan).join(' ')}.`

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (answered !== null ? 1 : 0)) / deck.length) * 100 : 0

  return (
    <section className="pcs-card">
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
        <div className="afl-answer-label">Your sentence</div>
        <div className="afl-answer-slot">
          {selected.length ? studentSentence : <span className="afl-answer-placeholder">&ndash;</span>}
        </div>
        {selected.length > 0 && answered === null && (
          <button onClick={handleClear} className="afl-clear">clear</button>
        )}
      </div>

      <div className="afl-pool-label">
        {answered === null ? `Click ${slotCount} tiles in order: some markers are traps` : 'The pool'}
      </div>
      <div className="afl-pool">
        {pool.map((t, i) => {
          const pickedPos = selected.indexOf(i)
          const isPicked = pickedPos !== -1
          let stateCls = ''
          if (answered !== null && isPicked) {
            stateCls = fitsSlot(pool[i].id, pickedPos) ? 'is-right' : 'is-wrong'
          } else if (isPicked) {
            stateCls = 'is-picked'
          }
          return (
            <button
              key={t.id}
              onClick={() => handleTileClick(i)}
              disabled={answered !== null}
              className={`afl-tile ${stateCls}`}
            >
              {isPicked && <span className="afl-tile-num">{pickedPos + 1}</span>}
              <span className="afl-tile-tongan">{t.tongan}</span>
              {t.gloss && <span className="afl-tile-gloss">{t.gloss}</span>}
            </button>
          )
        })}
      </div>

      {answered !== null && (
        <div className="afl-reveal">
          <div className="afl-verdict">
            {answered === 'correct'
              ? <><span className="afl-right">Yes.</span> <em>{studentSentence}</em></>
              : <><span className="afl-wrong">Not quite.</span> You built <em>{studentSentence}</em>. The correct sentence is <em>{correctSentence}</em>.</>
            }
          </div>
          <div className="pcs-why">
            <div className="pcs-why-label">Why</div>
            <div className="pcs-why-text">{current.why}</div>
          </div>
          <button onClick={handleNext} className="afl-next">
            Next sentence {'→'}
          </button>
        </div>
      )}
    </section>
  )
}
