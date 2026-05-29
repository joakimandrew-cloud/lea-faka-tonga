/**
 * CleftBuilderCore — Ch 36.
 *
 * Cleft sentences move the subject to the front and require a resumptive
 * pronoun in the relative clause: standard "Naʻe kai ʻe Sione ʻa e mā"
 * becomes cleft "Ko Sione naʻá ne kai ʻa e mā". The drill makes the student
 * build the cleft tile-by-tile.
 *
 * Same click-to-order mechanic as ModifierOrderCore, but the pool now
 * carries DISTRACTOR tiles alongside the correct ones, so the student must
 * both pick the right tiles and order them:
 *   - a resumptive-pronoun distractor (wrong person — the resumptive must
 *     match the fronted subject, Ch36 L33);
 *   - a tense-marker/accent distractor — naʻe (the noun-subject form, never
 *     valid before a resumptive pronoun, Ch36 Ex5 #1) or the wrong accent
 *     (naʻá before a one-syllable pronoun, plain naʻa before a two-syllable
 *     one, Ch36 L48 / Ch2 L279-282).
 *
 * `tiles` is the whole pool (correct + distractors); `correct_order` lists
 * the IDs of the correct tiles in order and sets how many slots to fill.
 * Tile `gloss` (shown in the pool) is a non-leaking cue — the person for a
 * pronoun, "past tense" for every TM variant — so the form, not the label,
 * is what the learner must judge. `role` (shown only in the answered reveal)
 * names each correct tile's job.
 *
 * Name items show the verb-first `standard` for reference; its naʻe is a
 * deliberate trap for copiers, since the cleft needs naʻá. Pronoun items
 * omit `standard` (it would already contain "naʻá ku" and give the game away).
 */

import { useState, useEffect } from 'react'

const KO = { id: 'ko', tongan: 'Ko', gloss: 'focus opener', role: 'cleft marker' }

const PHRASES = [
  // ── Names: 3sg resumptive ne, accented naʻá; naʻe decoy mirrors the standard form ──
  {
    id: 'sione-bread',
    standard: 'Naʻe kai ʻe Sione ʻa e mā.',
    english: 'It was Sione who ate the bread.',
    fixed_suffix: 'kai ʻa e mā',
    tiles: [
      KO,
      { id: 'subj', tongan: 'Sione', gloss: 'the doer', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá',  gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ne',    gloss: 'he / she',   role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻe', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'nau',  gloss: 'they' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'Pattern: Ko + subject + tense marker + pronoun + verb + object. The resumptive matches Sione (he), so it is ne; before a one-syllable pronoun the past marker takes the accent — naʻá, never naʻe (naʻe is for noun subjects).',
  },
  {
    id: 'mele-clothes',
    standard: 'Naʻe fufulu ʻe Mele ʻa e valá.',
    english: 'It was Mele who washed the clothes.',
    fixed_suffix: 'fufulu ʻa e valá',
    tiles: [
      KO,
      { id: 'subj', tongan: 'Mele', gloss: 'the doer', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá', gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ne',   gloss: 'he / she',   role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻa', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'ku',   gloss: 'I' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'Mele is "she", so the resumptive is ne. Before the one-syllable ne the marker carries the accent: naʻá ne. Plain naʻa (no accent) would be wrong here.',
  },
  {
    id: 'ana-mat',
    standard: 'Naʻe ʻave ʻe Ana ʻa e falá.',
    english: 'It was Ana who carried the mat.',
    fixed_suffix: 'ʻave ʻa e falá',
    tiles: [
      KO,
      { id: 'subj', tongan: 'Ana',  gloss: 'the doer', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá', gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ne',   gloss: 'he / she',   role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻe', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'ke',   gloss: 'you' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'The resumptive matches Ana (she) → ne, not ke (you). The marker takes the accent before ne: naʻá ne.',
  },
  {
    id: 'tevita-letter',
    standard: 'Naʻe tohi ʻe Tēvita ʻa e tohí.',
    english: 'It was Tēvita who wrote the letter.',
    fixed_suffix: 'tohi ʻa e tohí',
    tiles: [
      KO,
      { id: 'subj', tongan: 'Tēvita', gloss: 'the doer', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá',   gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ne',     gloss: 'he / she',   role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻa', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'nau',  gloss: 'they' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'One person, Tēvita → ne (not nau, "they"). The accent appears on the marker before the one-syllable ne: naʻá ne.',
  },

  // ── 1sg pronoun: fronted au, resumptive ku, accented naʻá ──
  {
    id: 'i-basket',
    english: 'It was I who carried the basket.',
    fixed_suffix: 'ʻave ʻa e kató',
    tiles: [
      KO,
      { id: 'subj', tongan: 'au',   gloss: 'I (me)',     role: 'subject' },
      { id: 'tm',   tongan: 'naʻá', gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ku',   gloss: 'I',          role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻa', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'ne',   gloss: 'he / she' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'The fronted subject au ("I") pairs with the resumptive ku. ku is one syllable, so the marker takes the accent: naʻá ku, not plain naʻa.',
  },
  // ── 3pl pronoun: fronted kinautolu, resumptive nau, PLAIN naʻa (two syllables) ──
  {
    id: 'they-letter',
    english: 'It was they who wrote the letter.',
    fixed_suffix: 'tohi ʻa e tohí',
    tiles: [
      KO,
      { id: 'subj', tongan: 'kinautolu', gloss: 'they',       role: 'subject' },
      { id: 'tm',   tongan: 'naʻa',      gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'nau',       gloss: 'they',       role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻá', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'ne',   gloss: 'he / she' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'kinautolu ("they") takes the resumptive nau. nau is two syllables, so the marker stays plain — naʻa nau, not naʻá nau.',
  },
  // ── 2sg pronoun: fronted koe, resumptive ke, accented naʻá ──
  {
    id: 'you-bread',
    english: 'It was you who ate the bread.',
    fixed_suffix: 'kai ʻa e mā',
    tiles: [
      KO,
      { id: 'subj', tongan: 'koe',  gloss: 'you',        role: 'subject' },
      { id: 'tm',   tongan: 'naʻá', gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ke',   gloss: 'you',        role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻe', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'ne',   gloss: 'he / she' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'koe ("you", fronted) pairs with the resumptive ke. ke is one syllable → naʻá ke. naʻe never precedes a resumptive pronoun.',
  },
  // ── 1pl exclusive: fronted kimautolu, resumptive mau, PLAIN naʻa ──
  {
    id: 'we-excl-clothes',
    english: 'It was we (not you) who washed the clothes.',
    fixed_suffix: 'fufulu ʻa e valá',
    tiles: [
      KO,
      { id: 'subj', tongan: 'kimautolu', gloss: 'we (not you)', role: 'subject' },
      { id: 'tm',   tongan: 'naʻa',      gloss: 'past tense',   role: 'tense marker' },
      { id: 'pron', tongan: 'mau',       gloss: 'we (not you)', role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻá', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'nau',  gloss: 'they' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'kimautolu ("we, not you") takes the resumptive mau — two syllables, so the marker stays plain: naʻa mau. The decoy nau means "they".',
  },
  // ── 1pl inclusive: fronted kitautolu, resumptive tau, PLAIN naʻa ──
  {
    id: 'we-incl-fish',
    english: 'It was we (and you) who ate the fish.',
    fixed_suffix: 'kai ʻa e iká',
    tiles: [
      KO,
      { id: 'subj', tongan: 'kitautolu', gloss: 'we (and you)', role: 'subject' },
      { id: 'tm',   tongan: 'naʻa',      gloss: 'past tense',   role: 'tense marker' },
      { id: 'pron', tongan: 'tau',       gloss: 'we (and you)', role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻá', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'mau',  gloss: 'we (not you)' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'kitautolu includes the listener ("we and you") → resumptive tau, two syllables → plain naʻa tau. The decoy mau would exclude the listener.',
  },
  // ── 1du exclusive: fronted kimaua, resumptive ma, accented naʻá ──
  {
    id: 'we-two-basket',
    english: 'It was we two (not you) who carried the basket.',
    fixed_suffix: 'ʻave ʻa e kató',
    tiles: [
      KO,
      { id: 'subj', tongan: 'kimaua', gloss: 'we two (not you)', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá',   gloss: 'past tense',       role: 'tense marker' },
      { id: 'pron', tongan: 'ma',     gloss: 'we two (not you)', role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻa', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'mau',  gloss: 'we (three or more)' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'kimaua = "we two (not you)" → resumptive ma, a one-syllable pronoun, so the marker takes the accent: naʻá ma. mau would be three or more.',
  },

  // ── Two more names for object variety ──
  {
    id: 'pita-bread',
    standard: 'Naʻe kai ʻe Pita ʻa e mā.',
    english: 'It was Pita who ate the bread.',
    fixed_suffix: 'kai ʻa e mā',
    tiles: [
      KO,
      { id: 'subj', tongan: 'Pita', gloss: 'the doer', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá', gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ne',   gloss: 'he / she',   role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻa', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'nau',  gloss: 'they' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'One doer, Pita → ne. The marker takes the accent before the one-syllable ne: naʻá ne.',
  },
  {
    id: 'semisi-mat',
    standard: 'Naʻe ʻave ʻe Sēmisi ʻa e falá.',
    english: 'It was Sēmisi who carried the mat.',
    fixed_suffix: 'ʻave ʻa e falá',
    tiles: [
      KO,
      { id: 'subj', tongan: 'Sēmisi', gloss: 'the doer', role: 'subject' },
      { id: 'tm',   tongan: 'naʻá',   gloss: 'past tense', role: 'tense marker' },
      { id: 'pron', tongan: 'ne',     gloss: 'he / she',   role: 'resumptive' },
      { id: 'tm-bad',   tongan: 'naʻe', gloss: 'past tense' },
      { id: 'pron-bad', tongan: 'ku',   gloss: 'I' },
    ],
    correct_order: ['ko', 'subj', 'tm', 'pron'],
    why: 'Sēmisi (he) → resumptive ne. naʻá carries the accent before ne; the standard form’s naʻe is wrong in the cleft.',
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

export default function CleftBuilderCore() {
  const [deck, setDeck] = useState(() => shuffle(PHRASES))
  const [idx, setIdx] = useState(0)
  const [pool, setPool] = useState(() => shuffle(deck[0].tiles))
  const [selected, setSelected] = useState([])
  const [answered, setAnswered] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [streak, setStreak] = useState(0)

  const current = deck[idx]
  const slotCount = current.correct_order.length

  useEffect(() => {
    if (answered !== null) return
    if (selected.length !== slotCount) return
    const ordered = selected.map(i => pool[i].id)
    const isCorrect = ordered.every((id, i) => id === current.correct_order[i])
    setAnswered(isCorrect ? 'correct' : 'wrong')
    setScore(s => ({ right: s.right + (isCorrect ? 1 : 0), total: s.total + 1 }))
    setStreak(s => isCorrect ? s + 1 : 0)
  }, [selected, pool, slotCount, answered, current.correct_order])

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
    setPool(shuffle(nextDeck[nextIdx].tiles))
    setSelected([])
    setAnswered(null)
  }

  const handleReset = () => {
    const fresh = shuffle(PHRASES)
    setDeck(fresh)
    setIdx(0)
    setPool(shuffle(fresh[0].tiles))
    setSelected([])
    setAnswered(null)
    setScore({ right: 0, total: 0 })
    setStreak(0)
  }

  const handleClear = () => {
    if (answered !== null) return
    setSelected([])
  }

  const studentPrefix = selected.map(i => pool[i].tongan).join(' ')
  const builtSentence = `${studentPrefix}${studentPrefix ? ' ' : ''}${current.fixed_suffix}.`
  const correctSentence = `${current.correct_order.map(id => current.tiles.find(t => t.id === id).tongan).join(' ')} ${current.fixed_suffix}.`

  return (
    <section className="afl-card">
      <div className="afl-card-row">
        <div className="afl-progress">{idx + 1} / {deck.length}</div>
        <div className="afl-stats">
          <span className="afl-stat">
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

      {current.standard && (
        <>
          <div className="afl-prompt-label">Standard form (verb-first)</div>
          <div className="afl-prompt" style={{ fontStyle: 'italic' }}>{current.standard}</div>
        </>
      )}

      <div className="afl-prompt-label" style={{ marginTop: current.standard ? '0.75rem' : 0 }}>Build the cleft equivalent</div>
      <div className="afl-prompt">{current.english}</div>

      <div className="afl-answer-row">
        <div className="afl-answer-label">Cleft so far</div>
        <div className="afl-answer-slot">{builtSentence}</div>
        {selected.length > 0 && answered === null && (
          <button onClick={handleClear} className="afl-clear">clear</button>
        )}
      </div>

      <div className="afl-pool-label">
        {answered === null ? `Click ${slotCount} tiles in cleft order — not every tile belongs` : 'The pool'}
      </div>
      <div className="afl-pool">
        {pool.map((t, i) => {
          const pickedPos = selected.indexOf(i)
          const isPicked = pickedPos !== -1
          return (
            <button
              key={t.id}
              onClick={() => handleTileClick(i)}
              disabled={answered !== null}
              className={`afl-tile ${isPicked ? 'is-picked' : ''}`}
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
              ? <><span className="afl-right">Yes.</span> <em>{builtSentence}</em></>
              : <><span className="afl-wrong">Not quite.</span> You built <em>{builtSentence}</em>. The correct cleft is <em>{correctSentence}</em>.</>
            }
          </div>
          <div className="afl-pattern">
            {current.correct_order.map((id, i) => {
              const t = current.tiles.find(x => x.id === id)
              return (
                <span key={id} className="afl-pattern-pair">
                  <span className="afl-pattern-slot">{t.tongan}</span>
                  <span className="afl-pattern-role">{t.role}</span>
                  {i < current.correct_order.length - 1 && <span className="afl-pattern-arrow">{' → '}</span>}
                </span>
              )
            })}
          </div>
          <div className="pcs-why">
            <div className="pcs-why-label">Why</div>
            <div className="pcs-why-text">{current.why}</div>
          </div>
          <button onClick={handleNext} className="afl-next">
            Next phrase {'→'}
          </button>
        </div>
      )}
    </section>
  )
}
