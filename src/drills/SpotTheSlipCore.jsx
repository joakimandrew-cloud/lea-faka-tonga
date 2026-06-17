/**
 * SpotTheSlipCore, error-spotting / correction (a new drill type).
 *
 * Every other drill only ever shows CORRECT Tongan, so a learner never trains
 * the editor's eye that catches their own mistakes. Here each sentence contains
 * exactly ONE wrong word, one of the high-frequency errors the markers exist to
 * prevent. The learner taps the wrong word, then taps its correct replacement.
 *
 * NO fabricated Tongan: every CORRECT sentence is a real, taught book sentence;
 * the single wrong token is a real Tongan particle used in the wrong slot (the
 * documented learner error), and the fix options are all real particles. The
 * errors targeted are the project's own flagged confusables:
 *   - ʻikai te (before a pronoun) vs ʻikai ke (before a bare verb)  [Negation-Paradigm; memory feedback_drill_negation_te_ke]
 *   - ʻe (transitive doer) vs ʻa (intransitive subject / object)    [book/Chapter-19.md]
 *   - Naʻa (with a pronoun) vs Naʻe (noun subject)                  [memory feedback_naa_nae_grammar]
 *   - Te (future, before a pronoun) vs ʻE (future, noun subject)    [book/Chapter-09.md / Ch15]
 *   - he (article after a preposition) vs ʻa e                       [book/Chapter-08.md]
 *   - ʻe he (common-noun doer) vs ʻe (name doer)                    [book/Chapter-19.md]
 *
 * Reuses the shared .pcs-* chrome for one consistent look.
 */

import { useState, useRef } from 'react'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Each item: the words of the WRONG sentence (one token is the slip),
// errorIndex = which token is wrong, fixes = the closed set of replacements
// (one correct), fix = the right one, correct = the fully-correct sentence
// (shown on reveal), english, why, source.
const ITEMS = [
  { words: ['ʻOku', 'ʻikai', 'ke', 'u', 'ʻalu.'], errorIndex: 2,
    fixes: ['te', 'ʻe', 'naʻa'], fix: 'te',
    correct: 'ʻOku ʻikai te u ʻalu.', english: 'I am not going.',
    why: 'After ʻikai, a pronoun subject takes te, not ke. ke is for a bare verb (e.g. weather: ʻoku ʻikai ke ʻuha).',
    source: 'Negation-Paradigm; Ch 9' },
  { words: ['Naʻe', 'kai', 'ʻa', 'Sione', 'ʻa', 'e', 'mā.'], errorIndex: 2,
    fixes: ['ʻe', 'ʻe he', 'ki'], fix: 'ʻe',
    correct: 'Naʻe kai ʻe Sione ʻa e mā.', english: 'Sione ate the bread.',
    why: 'The doer of a transitive verb is marked ʻe before a name. ʻa marks the thing acted upon (ʻa e mā).',
    source: 'book/Chapter-19.md' },
  { words: ['Naʻe', 'ku', 'ʻalu', 'ki', 'kolo.'], errorIndex: 0,
    fixes: ['Naʻá', 'Kuó', 'ʻOku'], fix: 'Naʻá',
    correct: 'Naʻá ku ʻalu ki kolo.', english: 'I went to town.',
    why: 'Before a pronoun, past tense is Naʻá (Naʻá ku, with the accent on the marker). Naʻe is for a noun subject.',
    source: 'memory feedback_naa_nae_grammar; Ch 1' },
  { words: ['Naʻe', 'lele', 'ʻe', 'Sione.'], errorIndex: 2,
    fixes: ['ʻa', 'ʻe he', 'ki'], fix: 'ʻa',
    correct: 'Naʻe lele ʻa Sione.', english: 'Sione ran.',
    why: 'lele (run) has no object, so its subject is marked ʻa, not ʻe. ʻe is only for the doer of a verb that takes an object.',
    source: 'book/Chapter-19.md' },
  { words: ['Naʻá', 'ku', 'nofo', 'ʻi', 'ʻa', 'e', 'fale.'], errorIndex: 4,
    fixes: ['he', 'ha', 'e'], fix: 'he',
    correct: 'Naʻá ku nofo ʻi he fale.', english: 'I stayed in the house.',
    why: 'After a preposition (ʻi / ki / mei), a definite noun takes he: ʻi he fale. The ʻa e form is not used after a preposition.',
    source: 'book/Chapter-08.md' },
  { words: ['ʻE', 'u', 'ʻalu', 'ʻapongipongi.'], errorIndex: 0,
    fixes: ['Té', 'Naʻá', 'Kuó'], fix: 'Té',
    correct: 'Té u ʻalu ʻapongipongi.', english: 'I will go tomorrow.',
    why: 'Future before a pronoun is Té (Té u, with the accent on the marker). ʻE is the future for a noun subject.',
    source: 'book/Chapter-09.md / Ch 15' },
  { words: ['Naʻe', 'langa', 'ʻe', 'tangata', 'ʻa', 'e', 'fale.'], errorIndex: 2,
    fixes: ['ʻe he', 'ʻa', 'ʻa e'], fix: 'ʻe he',
    correct: 'Naʻe langa ʻe he tangata ʻa e fale.', english: 'The man built the house.',
    why: 'A common-noun doer takes ʻe he (ʻe + the article he). Plain ʻe is only for a name (ʻe Sione).',
    source: 'book/Chapter-19.md' },
]

export default function SpotTheSlipCore() {
  const [deck, setDeck] = useState(() => shuffle(ITEMS))
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('find')   // 'find' → 'fix' → answered
  const [wrongWord, setWrongWord] = useState(null) // index of a mistaken word-tap
  const [fixGuess, setFixGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [missedFind, setMissedFind] = useState(false)
  const [finished, setFinished] = useState(false)
  const cardRef = useRef(null)
  const isTouch = useIsTouchPrimary()

  const current = deck[idx]
  const fixOptions = current ? shuffleStable(current.fixes, idx) : []
  const answered = phase === 'answered'
  const fixCorrect = answered && fixGuess === current.fix

  function handleWordTap(i) {
    if (phase !== 'find') return
    if (i === current.errorIndex) {
      setPhase('fix')
      setWrongWord(null)
    } else {
      setWrongWord(i)
      setMissedFind(true)
    }
  }

  function handleFixTap(opt) {
    if (phase !== 'fix') return
    setFixGuess(opt)
    setPhase('answered')
    const right = opt === current.fix && !missedFind
    setScore(s => ({ right: s.right + (opt === current.fix ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    if (idx < deck.length - 1) {
      setIdx(idx + 1)
    } else {
      setFinished(true)
    }
    setPhase('find'); setWrongWord(null); setFixGuess(null); setMissedFind(false)
  }

  function restart() {
    setDeck(shuffle(ITEMS)); setIdx(0); setPhase('find')
    setWrongWord(null); setFixGuess(null); setScore({ right: 0, total: 0 })
    setMissedFind(false); setFinished(false)
  }

  const perfect = score.total > 0 && score.right === score.total
  const pct = finished ? 100 : deck.length ? ((idx + (answered ? 1 : 0)) / deck.length) * 100 : 0

  return (
    <section ref={cardRef} className={`pcs-card${answered ? ' is-answered' : ''}`}>
      <div className="pcs-card-row">
        <div className="pcs-progress-wrap">
          <span className="pcs-progress">{finished ? deck.length : idx + 1} / {deck.length}</span>
          <div className="pcs-progress-bar"><div className="pcs-progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="pcs-stats">
          <span className={`pcs-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="pcs-stat-value">{score.right}</span>
            <span className="pcs-stat-label"> / {score.total} clean</span>
          </span>
          <button onClick={restart} className="pcs-reset" type="button" aria-label="Reset">reset</button>
        </div>
      </div>

      {finished ? (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label">Deck complete</div>
            <div className="pcs-noun">{score.right} / {score.total} fixed cleanly</div>
            <div className="pcs-noun-gloss">{perfect ? 'Sharp eye: every slip caught and fixed first try.' : 'You worked through every sentence.'}</div>
          </div>
          <div className="pcs-next-container">
            <button onClick={restart} className="pcs-next" type="button">Go again {'→'}</button>
          </div>
        </>
      ) : (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label">{current.english}</div>
            <div className="pcs-noun pcs-slip-sentence" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.1em 0.45em', justifyContent: 'center', alignItems: 'baseline' }}>
              {current.words.map((w, i) => {
                const isError = i === current.errorIndex
                let cls = 'pcs-slip-word'
                if (phase === 'find' && wrongWord === i) cls += ' is-chosen-wrong'
                if ((phase === 'fix' || answered) && isError) cls += answered ? (fixCorrect ? ' is-answer' : ' is-chosen-wrong') : ' is-target'
                return (
                  <button key={i} type="button" className={cls} disabled={phase !== 'find'} onClick={() => handleWordTap(i)} style={{ padding: '0.04em 0.18em', borderRadius: '5px', lineHeight: 1.25 }}>
                    {phase === 'answered' && isError ? current.fix : w.replace(/[.?]$/, '')}
                    {/[.?]$/.test(w) ? w.slice(-1) : ''}
                  </button>
                )
              })}
            </div>
          </div>

          {phase === 'find' && (
            <div className="pcs-question">One word is wrong. Tap the slip.{wrongWord !== null ? ' (not that one, look again)' : ''}</div>
          )}

          {phase === 'fix' && (
            <>
              <div className="pcs-question">Good catch. What should it be instead?</div>
              <div className="pcs-buttons pcs-buttons-3">
                {fixOptions.map(opt => (
                  <button key={opt} type="button" className="pcs-btn" onClick={() => handleFixTap(opt)}>
                    <span className="pcs-btn-label">{opt}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {answered && (
            <>
              <div className="pcs-buttons pcs-buttons-3">
                {fixOptions.map(opt => {
                  const isPick = opt === fixGuess
                  const isRight = opt === current.fix
                  let cls = 'pcs-btn'
                  if (isPick && isRight) cls += ' is-answer'
                  else if (isPick && !isRight) cls += ' is-chosen-wrong'
                  else if (isRight) cls += ' is-revealed-answer'
                  else cls += ' is-dim'
                  return (
                    <button key={opt} type="button" className={cls} disabled>
                      <span className="pcs-btn-label">{opt}</span>
                    </button>
                  )
                })}
              </div>
              <div className="pcs-reveal">
                <div className="pcs-verdict">
                  {fixCorrect && !missedFind
                    ? <><span className="pcs-right">Clean fix.</span> {current.correct}</>
                    : <><span className="pcs-wrong">{fixGuess === current.fix ? 'Right fix.' : 'Not quite.'}</span> The sentence should read: <em>{current.correct}</em></>}
                </div>
                <div className="pcs-why"><div className="pcs-why-text">{current.why}</div></div>
              </div>
              <div className="pcs-next-container">
                {!isTouch && <span className="pcs-keyboard-hint">Press <kbd>{'↵'}</kbd> to continue</span>}
                <button onClick={next} className="pcs-next" type="button">Next {'→'}</button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}

// Deterministic per-card option order (varies by card index, stable across
// re-renders of the same card) so the answer position is not fixed.
function shuffleStable(arr, seed) {
  const out = [...arr]
  let s = (seed + 1) * 9301 + 49297
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
