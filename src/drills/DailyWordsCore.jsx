/**
 * DailyWordsCore — spaced vocabulary recall (a new drill type).
 *
 * vocab-cloze tests one frame at a time with no memory between sessions, so
 * nothing in the app schedules review of the words you keep missing. This drill
 * is a lightweight Leitner deck: an English cue, tap the right Tongan among
 * near-neighbours, and a box per word persisted in localStorage. Miss a word and
 * it drops to box 1 (it resurfaces first next time); get it right and it climbs.
 * Each session pulls the least-known words first.
 *
 * NO fabricated Tongan: every word and gloss comes straight from
 * book-vocabulary.json (book + EALD sourced). Distractors are OTHER real words
 * from a nearby chapter, never invented. The deck is capped at the chapter the
 * book has actually taught by the time each word appears (chapter tag), and the
 * book's straight-apostrophe ʻokina (U+0027) is normalised to the app's U+02BB.
 *
 * Reuses the shared .pcs-* chrome for one consistent look.
 */

import { useState, useMemo } from 'react'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import VOCAB from '../data/book-vocabulary.json'

const STORE_KEY = 'lft-daily-words-v1'
const SESSION_SIZE = 12
const MAX_BOX = 5

// In Tongan the apostrophe is always the ʻokina (glottal stop); normalise the
// book data's U+0027 to the app-wide U+02BB so it matches every other drill.
const okina = (s) => (s || '').replace(/'/g, 'ʻ')

// Normalised English for distractor de-duplication: a distractor must not mean
// the same thing as the cue even when worded differently ("tired" vs "be tired").
const normEn = (s) => (s || '').toLowerCase().replace(/^(to |be |a |an |the )+/, '').replace(/[^a-z]/g, '')

function shuffle(arr) {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function loadBoxes() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function saveBoxes(boxes) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(boxes)) } catch { /* ignore */ }
}

// Eligible deck: real content words with a clean one-to-one gloss. Drop grammar
// particles (drilled elsewhere) and open-ended glosses so a single Tongan answer
// is unambiguous.
const DECK = VOCAB.filter(e =>
  e.tongan && e.english &&
  e.category !== 'grammar' &&
  !/\.\.\.|\//.test(e.english) &&
  e.english.length <= 32
).map(e => ({ id: e.id, tongan: okina(e.tongan), english: e.english, chapter: e.chapter ?? 0 }))

function buildSession(boxes) {
  // Least-known first: lowest box (unseen = 0), random tiebreak.
  const ranked = shuffle(DECK).sort((a, b) => (boxes[a.id] ?? 0) - (boxes[b.id] ?? 0))
  const chosen = ranked.slice(0, SESSION_SIZE)
  return chosen.map(entry => {
    // Distractors: other real words, preferring the same chapter band, never the
    // same meaning or form as the answer.
    const pool = DECK.filter(d =>
      d.id !== entry.id && d.tongan !== entry.tongan && normEn(d.english) !== normEn(entry.english))
    const near = shuffle(pool.filter(d => Math.abs(d.chapter - entry.chapter) <= 3))
    const distractors = (near.length >= 3 ? near : shuffle(pool)).slice(0, 3)
    const options = shuffle([entry, ...distractors]).map(d => ({ id: d.id, label: d.tongan }))
    return { entry, options }
  })
}

export default function DailyWordsCore() {
  const isTouch = useIsTouchPrimary()
  const [boxes, setBoxes] = useState(loadBoxes)
  const [session, setSession] = useState(() => buildSession(loadBoxes()))
  const [idx, setIdx] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [finished, setFinished] = useState(false)

  const mastered = useMemo(() => Object.values(boxes).filter(b => b >= MAX_BOX).length, [boxes])
  const round = session[idx]
  const answered = guess !== null
  const isCorrect = answered && guess === round.entry.id

  function handleGuess(optId) {
    if (answered) return
    setGuess(optId)
    const right = optId === round.entry.id
    setScore(s => ({ right: s.right + (right ? 1 : 0), total: s.total + 1 }))
    setBoxes(prev => {
      const cur = prev[round.entry.id] ?? 0
      const next = { ...prev, [round.entry.id]: right ? Math.min(MAX_BOX, cur + 1) : 1 }
      saveBoxes(next)
      return next
    })
  }

  function next() {
    if (idx < session.length - 1) { setIdx(idx + 1); setGuess(null) }
    else { setFinished(true) }
  }

  function goAgain() {
    const fresh = buildSession(boxes)
    setSession(fresh); setIdx(0); setGuess(null); setScore({ right: 0, total: 0 }); setFinished(false)
  }

  const perfect = score.total > 0 && score.right === score.total
  const pct = finished ? 100 : session.length ? ((idx + (answered ? 1 : 0)) / session.length) * 100 : 0
  const answerOpt = round && round.options.find(o => o.id === round.entry.id)

  return (
    <section className={`pcs-card${answered ? ' is-answered' : ''}`}>
      <div className="pcs-card-row">
        <div className="pcs-progress-wrap">
          <span className="pcs-progress">{finished ? session.length : idx + 1} / {session.length}</span>
          <div className="pcs-progress-bar"><div className="pcs-progress-fill" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="pcs-stats">
          <span className={`pcs-stat${perfect ? ' is-perfect' : ''}`}>
            <span className="pcs-stat-value">{score.right}</span>
            <span className="pcs-stat-label"> / {score.total}</span>
          </span>
          {mastered > 0 && (
            <span className="pcs-stat"><span className="pcs-stat-value">{mastered}</span><span className="pcs-stat-label"> mastered</span></span>
          )}
          <button onClick={goAgain} className="pcs-reset" type="button" aria-label="New session">reset</button>
        </div>
      </div>

      {finished ? (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label">Session complete</div>
            <div className="pcs-noun">{score.right} / {score.total} recalled</div>
            <div className="pcs-noun-gloss">{mastered} words mastered so far. Missed words come back first next time.</div>
          </div>
          <div className="pcs-next-container">
            <button onClick={goAgain} className="pcs-next" type="button">Next session {'→'}</button>
          </div>
        </>
      ) : (
        <>
          <div className="pcs-noun-frame">
            <div className="pcs-prompt-label">Recall the Tongan</div>
            <div className="pcs-noun pcs-daily-cue">{round.entry.english}</div>
          </div>
          <div className="pcs-question">Which word means this?</div>
          <div className="pcs-buttons pcs-buttons-3">
            {round.options.map((o, i) => {
              const isChosen = answered && guess === o.id
              const isTheAnswer = answered && round.entry.id === o.id
              let cls = 'pcs-btn'
              if (answered) {
                if (isChosen && isCorrect) cls += ' is-answer'
                else if (isChosen && !isCorrect) cls += ' is-chosen-wrong'
                else if (isTheAnswer) cls += ' is-revealed-answer'
                else cls += ' is-dim'
              }
              return (
                <button key={o.id} type="button" className={cls} disabled={answered} onClick={() => handleGuess(o.id)}>
                  {i <= 8 && !answered && !isTouch && <span className="pcs-btn-key" aria-hidden="true">{i + 1}</span>}
                  <span className="pcs-btn-label">{o.label}</span>
                </button>
              )
            })}
          </div>

          {answered && (
            <>
              <div className="pcs-reveal">
                <div className="pcs-verdict">
                  {isCorrect
                    ? <><span className="pcs-right">Yes.</span> <em>{answerOpt?.label}</em> = {round.entry.english}.</>
                    : <><span className="pcs-wrong">Not quite.</span> {round.entry.english} = <em>{answerOpt?.label}</em>.</>}
                </div>
              </div>
              <div className="pcs-next-container">
                <button onClick={next} className="pcs-next" type="button">Next {'→'}</button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
