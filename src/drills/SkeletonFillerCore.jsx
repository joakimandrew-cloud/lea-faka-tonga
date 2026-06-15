/**
 * SkeletonFillerCore — fill the skeleton.
 *
 * Each EXERCISE carries a `minChapter` tag. When mounted in a chapter via
 * the registry, the Core filters EXERCISES to those a student at chapter
 * N has actually been taught. Standalone route (`chapterNum=undefined`)
 * sees everything.
 *
 * Authoring rule: an exercise's vocab and structure must all be ≤
 * minChapter in the book's introduction order. Don't put Naʻe on a Ch 1
 * exercise; don't put noun-subjects below Ch 15.
 */

import { useState, useMemo } from 'react'

const ALL_EXERCISES = [
  // ── Ch 1: Past statements only (Naʻa + ku/ke + verb) ──────────────────
  {
    minChapter: 1,
    pattern: 'Past Statement',
    english: 'I ate.',
    parts: [
      { type: 'fixed', text: 'Naʻa' },
      { type: 'slot',  role: 'PRONOUN', answer: 'ku',   hint: 'I (after Naʻa)' },
      { type: 'slot',  role: 'VERB',    answer: 'kai',  hint: 'eat' },
    ],
    pool: ['ku', 'ke', 'kai', 'inu', 'ʻalu', 'mohe'],
  },
  {
    minChapter: 1,
    pattern: 'Past Question',
    english: 'Did you go?',
    parts: [
      { type: 'fixed', text: 'Naʻa' },
      { type: 'slot',  role: 'PRONOUN', answer: 'ke',   hint: 'you (singular)' },
      { type: 'slot',  role: 'VERB',    answer: 'ʻalu', hint: 'go' },
    ],
    pool: ['ke', 'ku', 'ʻalu', 'mohe', 'kai', 'lea'],
  },
  {
    minChapter: 1,
    pattern: 'Past Statement',
    english: 'I sang.',
    parts: [
      { type: 'fixed', text: 'Naʻa' },
      { type: 'slot',  role: 'PRONOUN', answer: 'ku',   hint: 'I (after Naʻa)' },
      { type: 'slot',  role: 'VERB',    answer: 'hiva', hint: 'sing' },
    ],
    pool: ['ku', 'ke', 'hiva', 'lea', 'mohe', 'kai'],
  },

  // ── Ch 2: Four TMs + full pronoun paradigm, pronoun subjects only ────
  {
    minChapter: 2,
    pattern: 'Present Statement',
    english: 'I am eating.',
    parts: [
      { type: 'slot', role: 'TENSE',   answer: 'ʻOku', hint: 'present' },
      { type: 'slot', role: 'PRONOUN', answer: 'ou',   hint: 'I (after ʻOku)' },
      { type: 'slot', role: 'VERB',    answer: 'kai',  hint: 'eat' },
    ],
    pool: ['ʻOku', 'Naʻa', 'Kuo', 'Te', 'ou', 'ku', 'u', 'kai', 'inu'],
  },
  {
    minChapter: 2,
    pattern: 'Future Statement',
    english: 'I will go.',
    parts: [
      { type: 'slot', role: 'TENSE',   answer: 'Te',   hint: 'future' },
      { type: 'slot', role: 'PRONOUN', answer: 'u',    hint: 'I (after Te)' },
      { type: 'slot', role: 'VERB',    answer: 'ʻalu', hint: 'go' },
    ],
    pool: ['Te', 'ʻOku', 'Naʻa', 'Kuo', 'u', 'ou', 'ku', 'ʻalu', 'mohe'],
  },
  {
    minChapter: 2,
    pattern: 'Perfect Statement',
    english: 'He has fallen asleep.',
    parts: [
      { type: 'slot', role: 'TENSE',   answer: 'Kuo',  hint: 'perfect' },
      { type: 'slot', role: 'PRONOUN', answer: 'ne',   hint: 'he/she' },
      { type: 'slot', role: 'VERB',    answer: 'mohe', hint: 'sleep' },
    ],
    pool: ['Kuo', 'ʻOku', 'Te', 'Naʻa', 'ne', 'ke', 'ou', 'mohe', 'hiva'],
  },
  {
    minChapter: 2,
    pattern: 'Present Statement',
    english: 'We (incl. you) sing.',
    parts: [
      { type: 'slot', role: 'TENSE',   answer: 'ʻOku', hint: 'present' },
      { type: 'slot', role: 'PRONOUN', answer: 'tau',  hint: 'we (incl, plural)' },
      { type: 'slot', role: 'VERB',    answer: 'hiva', hint: 'sing' },
    ],
    pool: ['ʻOku', 'Naʻa', 'Te', 'tau', 'mau', 'mou', 'hiva', 'lea'],
  },
  {
    minChapter: 2,
    pattern: 'Past Statement',
    english: 'We (excl. you) ate.',
    parts: [
      { type: 'slot', role: 'TENSE',   answer: 'Naʻa', hint: 'past' },
      { type: 'slot', role: 'PRONOUN', answer: 'mau',  hint: 'we (excl, plural)' },
      { type: 'slot', role: 'VERB',    answer: 'kai',  hint: 'eat' },
    ],
    pool: ['Naʻa', 'ʻOku', 'Kuo', 'mau', 'tau', 'mou', 'kai', 'inu'],
  },
  {
    minChapter: 2,
    pattern: 'Future Statement',
    english: 'You all will sing.',
    parts: [
      { type: 'slot', role: 'TENSE',   answer: 'Te',   hint: 'future' },
      { type: 'slot', role: 'PRONOUN', answer: 'mou',  hint: 'you all (plural)' },
      { type: 'slot', role: 'VERB',    answer: 'hiva', hint: 'sing' },
    ],
    pool: ['Te', 'ʻOku', 'Kuo', 'mou', 'tau', 'mau', 'hiva', 'mohe'],
  },

  // ── Ch 9: Negation (ʻikai te + pronoun) ──────────────────────────────
  {
    minChapter: 9,
    pattern: 'Negation',
    english: 'I am not eating.',
    parts: [
      { type: 'slot',  role: 'TENSE',   answer: 'ʻOku', hint: 'present' },
      { type: 'fixed', text: 'ʻikai te' },
      { type: 'slot',  role: 'PRONOUN', answer: 'u',    hint: 'I (after te)' },
      { type: 'slot',  role: 'VERB',    answer: 'kai',  hint: 'eat' },
    ],
    pool: ['ʻOku', 'Naʻe', 'Kuo', 'u', 'ne', 'ou', 'kai', 'ʻalu', 'inu'],
  },

  // ── Ch 12: Equational (ko e + noun + demo) ───────────────────────────
  {
    minChapter: 12,
    pattern: 'Equational',
    english: 'This is a boy.',
    parts: [
      { type: 'fixed', text: 'Ko e' },
      { type: 'slot',  role: 'NOUN', answer: 'tamasiʻi', hint: 'boy' },
      { type: 'slot',  role: 'DEMO', answer: 'ʻeni',     hint: 'this' },
    ],
    pool: ['tamasiʻi', 'tangata', 'taʻahine', 'ʻeni', 'ʻena', 'ē'],
  },

  // ── Ch 19: Transitive command with definite object ───────────────────
  {
    minChapter: 19,
    pattern: 'Command with Object',
    english: 'Eat the food!',
    parts: [
      { type: 'slot',  role: 'VERB', answer: 'Kai',     hint: 'eat (command)' },
      { type: 'fixed', text: 'ʻa e' },
      { type: 'slot',  role: 'NOUN', answer: 'meʻakai', hint: 'food' },
    ],
    pool: ['Kai', 'Inu', 'ʻAlu', 'meʻakai', 'vai', 'ika', 'tohi'],
  },

  // ── Ch 29+: Have (uses indefinite possessive haʻaku) ─────────────────
  {
    minChapter: 29,
    pattern: 'Have',
    english: 'I have a book.',
    parts: [
      { type: 'slot',  role: 'TENSE',      answer: 'ʻOku',   hint: 'present' },
      { type: 'fixed', text: 'ʻi ai' },
      { type: 'slot',  role: 'POSSESSIVE', answer: 'haʻaku', hint: 'my (indef)' },
      { type: 'slot',  role: 'NOUN',       answer: 'tohi',   hint: 'book' },
    ],
    pool: ['ʻOku', 'Naʻe', 'haʻaku', 'haʻo', 'haʻane', 'tohi', 'tōketā', 'vaka'],
  },

  // ── Ch 31+: Existential (ʻi ai ha + indef noun) ──────────────────────
  {
    minChapter: 31,
    pattern: 'Existential',
    english: 'There is a doctor.',
    parts: [
      { type: 'slot',  role: 'TENSE', answer: 'ʻOku',   hint: 'present' },
      { type: 'fixed', text: 'ʻi ai ha' },
      { type: 'slot',  role: 'NOUN',  answer: 'tōketā', hint: 'doctor' },
    ],
    pool: ['ʻOku', 'Naʻe', 'Kuo', 'tōketā', 'tangata', 'fefine', 'vaka', 'tohi'],
  },
  {
    minChapter: 31,
    pattern: 'Past Existential',
    english: 'There was a dog.',
    parts: [
      { type: 'slot',  role: 'TENSE', answer: 'Naʻe', hint: 'past (no pronoun)' },
      { type: 'fixed', text: 'ʻi ai ha' },
      { type: 'slot',  role: 'NOUN',  answer: 'kulī', hint: 'dog' },
    ],
    pool: ['Naʻe', 'ʻOku', 'Kuo', 'kulī', 'pusi', 'tangata', 'vaka'],
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

// Definitive accent (Chapter 2, "Pronunciation: Stress Across All
// Combinations"): a tense marker takes an acute accent on its final vowel
// when immediately followed by a ONE-syllable enclitic pronoun. Two-syllable
// pronouns (ou, mau, tau, mou, nau) leave the marker unaccented. The accent is
// a pronunciation aid, not standard spelling — so the word-pool tiles stay
// plain and the accent surfaces only on the assembled reveal.
const ENCLITIC_PRONOUNS = new Set(['u', 'ku', 'ke', 'ne', 'na', 'ma', 'ta', 'mo'])
const ACCENTABLE_MARKERS = new Set(['ʻoku', 'naʻa', 'kuo', 'te'])
const ACUTE = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' }

function accentFinalVowel(word) {
  for (let i = word.length - 1; i >= 0; i--) {
    if (ACUTE[word[i]]) return word.slice(0, i) + ACUTE[word[i]] + word.slice(i + 1)
  }
  return word
}

// Build the surface sentence from the parts, applying the definitive accent
// across every (tense-marker → one-syllable pronoun) boundary.
function assembleSentence(parts) {
  const words = parts.flatMap(p => (p.type === 'fixed' ? p.text : p.answer).split(' '))
  for (let i = 0; i < words.length - 1; i++) {
    if (ACCENTABLE_MARKERS.has(words[i].toLowerCase()) && ENCLITIC_PRONOUNS.has(words[i + 1])) {
      words[i] = accentFinalVowel(words[i])
    }
  }
  return words.join(' ')
}

export default function SkeletonFillerCore({ chapterNum }) {
  const exercises = useMemo(
    () => ALL_EXERCISES.filter(e => !chapterNum || e.minChapter <= chapterNum),
    [chapterNum]
  )

  const [deck, setDeck] = useState(() => shuffle(exercises))
  const [idx, setIdx] = useState(0)
  const current = deck[idx] || exercises[0]

  const slotIndices = useMemo(
    () => current.parts.map((p, i) => p.type === 'slot' ? i : null).filter(x => x !== null),
    [current]
  )
  const [slotAnswers, setSlotAnswers] = useState(() => slotIndices.map(() => null))
  const [activeSlot, setActiveSlot] = useState(null)
  const [answered, setAnswered] = useState(null)
  const [shuffledPool, setShuffledPool] = useState(() => shuffle(current.pool.map((w, i) => ({ tongan: w, origIdx: i }))))
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const allFilled = slotAnswers.every(a => a !== null)

  const handleSlotClick = (partIdx) => {
    if (answered !== null) return
    const slotIdx = slotIndices.indexOf(partIdx)
    if (slotAnswers[slotIdx] !== null) {
      setSlotAnswers(prev => {
        const next = [...prev]
        next[slotIdx] = null
        return next
      })
      setActiveSlot(slotIdx)
      return
    }
    setActiveSlot(slotIdx)
  }

  const handlePoolClick = (poolIdx) => {
    if (answered !== null) return
    if (slotAnswers.includes(poolIdx)) return
    let target = activeSlot
    if (target === null) {
      target = slotAnswers.findIndex(a => a === null)
      if (target === -1) return
    }
    setSlotAnswers(prev => {
      const next = [...prev]
      next[target] = poolIdx
      return next
    })
    const nextEmpty = slotAnswers.findIndex((a, i) => a === null && i !== target)
    setActiveSlot(nextEmpty === -1 ? null : nextEmpty)
  }

  const handleCheck = () => {
    if (!allFilled || answered !== null) return
    const allRight = slotAnswers.every((poolIdx, slotIdx) => {
      const partIdx = slotIndices[slotIdx]
      const expected = current.parts[partIdx].answer
      const actual = shuffledPool[poolIdx].tongan
      return expected === actual
    })
    setAnswered(allRight ? 'correct' : 'wrong')
    setScore(s => ({ right: s.right + (allRight ? 1 : 0), total: s.total + 1 }))
    setStreak(s => allRight ? s + 1 : 0)
  }

  const handleNext = () => {
    const nextIdx = idx + 1 >= deck.length ? 0 : idx + 1
    const nextDeck = idx + 1 >= deck.length ? shuffle(exercises) : deck
    const nextCurrent = nextDeck[nextIdx]
    setDeck(nextDeck)
    setIdx(nextIdx)
    setSlotAnswers(nextCurrent.parts.filter(p => p.type === 'slot').map(() => null))
    setShuffledPool(shuffle(nextCurrent.pool.map((w, i) => ({ tongan: w, origIdx: i }))))
    setActiveSlot(null)
    setAnswered(null)
  }

  const handleReset = () => {
    const fresh = shuffle(exercises)
    const firstCurrent = fresh[0]
    setDeck(fresh)
    setIdx(0)
    setSlotAnswers(firstCurrent.parts.filter(p => p.type === 'slot').map(() => null))
    setShuffledPool(shuffle(firstCurrent.pool.map((w, i) => ({ tongan: w, origIdx: i }))))
    setActiveSlot(null)
    setAnswered(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const handleClear = () => {
    if (answered !== null) return
    setSlotAnswers(slotIndices.map(() => null))
    setActiveSlot(null)
  }

  const correctSentence = assembleSentence(current.parts)

  const perfect = score.total > 0 && score.right === score.total
  const pct = deck.length > 0 ? ((idx + (answered !== null ? 1 : 0)) / deck.length) * 100 : 0

  return (
    <section className="pcs-card">
      <div className="skf-card-row">
        <div className="skf-progress-wrap">
          <div className="skf-progress">
            <span className="skf-pattern-tag">{current.pattern}</span>
            <span className="skf-progress-sep">·</span>
            <span>{idx + 1} / {deck.length}</span>
          </div>
          <div className="skf-progress-bar">
            <div className="skf-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="skf-stats">
          <span className={`skf-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="skf-stat-value">{score.right}</span>
            <span className="skf-stat-label"> / {score.total}</span>
          </span>
          {streak > 1 && (
            <span className="skf-stat skf-streak">
              <span className="skf-stat-value">{streak}</span>
              <span className="skf-stat-label"> in a row</span>
            </span>
          )}
          <button onClick={handleReset} className="skf-reset">reset</button>
        </div>
      </div>

      <div className="skf-prompt-label">Say this in Tongan</div>
      <div className="skf-prompt">{current.english}</div>

      <div className="skf-skeleton">
        {current.parts.map((p, i) => {
          if (p.type === 'fixed') {
            return <span key={i} className="skf-fixed">{p.text}</span>
          }
          const slotIdx = slotIndices.indexOf(i)
          const poolIdx = slotAnswers[slotIdx]
          const isFilled = poolIdx !== null
          const isActive = activeSlot === slotIdx
          const isCorrect = answered !== null && isFilled && shuffledPool[poolIdx].tongan === p.answer
          const isWrong = answered !== null && isFilled && shuffledPool[poolIdx].tongan !== p.answer
          const cls = [
            'skf-slot',
            isActive ? 'is-active' : '',
            isFilled ? 'is-filled' : '',
            isCorrect ? 'is-right' : '',
            isWrong ? 'is-wrong' : '',
          ].filter(Boolean).join(' ')
          return (
            <button
              key={i}
              onClick={() => handleSlotClick(i)}
              disabled={answered !== null}
              className={cls}
            >
              <span className="skf-slot-role">{p.role}</span>
              <span className="skf-slot-word">
                {isFilled ? shuffledPool[poolIdx].tongan : '\u2013'}
              </span>
            </button>
          )
        })}
      </div>

      <div className="skf-pool-label">Word pool</div>
      <div className="skf-pool">
        {shuffledPool.map((w, i) => {
          const isUsed = slotAnswers.includes(i)
          return (
            <button
              key={i}
              onClick={() => handlePoolClick(i)}
              disabled={answered !== null || isUsed}
              className={`skf-pool-word ${isUsed ? 'is-used' : ''}`}
            >
              {w.tongan}
            </button>
          )
        })}
      </div>

      <div className="skf-actions">
        {slotAnswers.some(a => a !== null) && answered === null && (
          <button onClick={handleClear} className="skf-action skf-action-secondary">
            clear slots
          </button>
        )}
        {answered === null && (
          <button
            onClick={handleCheck}
            disabled={!allFilled}
            className="skf-action skf-action-primary"
          >
            Check
          </button>
        )}
      </div>

      {answered !== null && (
        <div className="skf-reveal">
          <div className="skf-verdict">
            {answered === 'correct'
              ? <><span className="skf-right">Yes.</span> You built a <em>{current.pattern.toLowerCase()}</em>: <em>{correctSentence}</em></>
              : <><span className="skf-wrong">Not quite.</span> The correct sentence is <em>{correctSentence}</em>.</>
            }
          </div>
          <div className="skf-english-reveal">
            <span className="skf-english-label">means</span>
            <span className="skf-english-text">{current.english}</span>
          </div>
          <button onClick={handleNext} className="skf-next">
            Next skeleton {'\u2192'}
          </button>
        </div>
      )}
    </section>
  )
}
