/**
 * SentenceLabCore — "swap a word, watch the English change," now with two modes:
 *
 *   • Explore  (free)  — a fully-taught sentence rendered as word-chips with the
 *     English gloss beneath; tap a chip → the legal alternatives for THAT slot,
 *     each pick re-derives the whole sentence and flashes the new English.
 *   • Test yourself (graded) — the learner is given ONLY a target English meaning
 *     ("Make the sentence mean: 'I must return.'") and a DIFFERENT seed sentence,
 *     and swaps chips until the engine's composed English matches the target.
 *
 * Both modes reuse the same chip mechanic (ChipRow) and the same engine
 * (assembleSentence + getOptionsForSlot) with ZERO engine changes. Graded
 * targets are ENGINE-GENERATED (graded-lab.js) — no hand-authored Tongan — and
 * every round is verified solvable before it is shown. The toggle lives INSIDE
 * the Lab (no new route, no 29th menu card — honours the 28-card ruling).
 */

import { useMemo, useState, useRef, useEffect } from 'react'
import { getOptionsForSlot, assembleSentence } from '../engine/slot-engine'
import { pickPattern, seedFill, reconcile, getPatternById, englishMatches } from './lab-engine'
import { newRound } from './graded-lab'

// Dismiss the active dropdown on outside click / Escape. Shared by both modes.
function useDismiss(activeSlot, setActiveSlot, wrapRef) {
  useEffect(() => {
    if (!activeSlot) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setActiveSlot(null) }
    const onKey = (e) => { if (e.key === 'Escape') setActiveSlot(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [activeSlot, setActiveSlot, wrapRef])
}

// Presentational chip row: the swappable word-chips + their dropdowns. Identical
// for Explore and Test-yourself; the parent owns the activeSlot state + onSwap.
function ChipRow({ pattern, patternId, filledSlots, maxChapter, activeSlot, setActiveSlot, onSwap }) {
  const orderedSlots = [...pattern.slots].sort((a, b) => a.position - b.position)
  const options = activeSlot ? getOptionsForSlot(patternId, activeSlot, filledSlots, maxChapter) : []
  return (
    <div className="x-lab-row">
      {orderedSlots.map((slot) => {
        const value = slot.locked ? slot.locked_value : filledSlots[slot.id]
        if (!value) return null
        if (slot.locked) {
          return <span key={slot.id} className="x-lab-chip is-locked font-tongan">{value.tongan}</span>
        }
        const isActive = activeSlot === slot.id
        const canSwap = getOptionsForSlot(patternId, slot.id, filledSlots, maxChapter).length > 1
        return (
          <span key={slot.id} className="x-lab-slot">
            <button
              type="button"
              onClick={() => canSwap && setActiveSlot(isActive ? null : slot.id)}
              className={`x-lab-chip font-tongan${isActive ? ' is-active' : ''}${canSwap ? ' is-swappable' : ''}`}
              aria-label={`${value.tongan}${canSwap ? ' — tap to swap' : ''}`}
            >
              {value.tongan}{canSwap && <span className="x-lab-caret" aria-hidden="true"> &#9662;</span>}
            </button>
            {isActive && options.length > 0 && (
              <div className="x-lab-menu">
                {options.map((opt, i) => (
                  <button
                    key={`${opt.tongan}-${i}`}
                    type="button"
                    onClick={() => onSwap(slot.id, opt)}
                    className={`x-lab-opt${opt.tongan === value.tongan ? ' is-current' : ''}`}
                  >
                    <span className="font-tongan">{opt.tongan}</span>
                    <span className="x-lab-opt-en">{opt.english}</span>
                  </button>
                ))}
              </div>
            )}
          </span>
        )
      })}
    </div>
  )
}

// ── Explore (free) mode — the originally-shipped Lab, unchanged in behaviour ──
function ExploreLab({ chapterNum }) {
  const maxChapter = chapterNum || 53
  const pattern = useMemo(() => pickPattern(chapterNum), [chapterNum])
  const patternId = pattern?.id

  const [filledSlots, setFilledSlots] = useState(() => seedFill(patternId, maxChapter))
  const [activeSlot, setActiveSlot] = useState(null)
  const [flash, setFlash] = useState(false)
  const wrapRef = useRef(null)

  const assembled = useMemo(
    () => (patternId ? assembleSentence(patternId, filledSlots) : null),
    [patternId, filledSlots]
  )

  const flashTimer = useRef(null)
  useEffect(() => () => clearTimeout(flashTimer.current), [])
  const triggerFlash = () => {
    setFlash(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 700)
  }

  useDismiss(activeSlot, setActiveSlot, wrapRef)

  if (!pattern || !assembled) {
    return <div className="text-[var(--text-muted)] text-sm">Sentence Lab is not available here yet.</div>
  }

  const handleSwap = (slotId, option) => {
    setFilledSlots((prev) => reconcile(patternId, { ...prev, [slotId]: option }, maxChapter))
    setActiveSlot(null)
    triggerFlash()
  }
  const handleReset = () => {
    setFilledSlots(seedFill(patternId, maxChapter))
    setActiveSlot(null)
  }

  return (
    <section className="pcs-card" ref={wrapRef}>
      <div className="pcs-card-row">
        <span>Swap a word &middot; watch the meaning change</span>
        <button onClick={handleReset} className="pcs-reset" aria-label="Reset sentence">reset</button>
      </div>

      <ChipRow
        pattern={pattern} patternId={patternId} filledSlots={filledSlots} maxChapter={maxChapter}
        activeSlot={activeSlot} setActiveSlot={setActiveSlot} onSwap={handleSwap}
      />

      <div className={`x-lab-en${flash ? ' is-flash' : ''}`} aria-live="polite">
        {assembled.english}
      </div>
      {assembled.literal && assembled.literal !== assembled.english && (
        <div className="x-lab-literal">{assembled.literal}</div>
      )}
    </section>
  )
}

// ── Test yourself (graded) mode — "make the sentence mean X" ────────────────
function GradedLab({ chapterNum }) {
  const maxChapter = chapterNum || 53

  const [round, setRound] = useState(() => newRound(maxChapter))
  const [filledSlots, setFilledSlots] = useState(() => round?.seedFill || {})
  const [activeSlot, setActiveSlot] = useState(null)
  const [checked, setChecked] = useState(false)   // pressed Check on a non-answer
  const [revealed, setRevealed] = useState(false) // gave up → answer shown
  const wrapRef = useRef(null)

  const pattern = useMemo(() => (round ? getPatternById(round.patternId) : null), [round])
  const assembled = useMemo(
    () => (round ? assembleSentence(round.patternId, filledSlots) : null),
    [round, filledSlots]
  )
  const solved = !!(assembled && round && englishMatches(assembled.english, round.targetEnglish))

  useDismiss(activeSlot, setActiveSlot, wrapRef)

  const startRound = () => {
    const r = newRound(maxChapter)
    setRound(r)
    setFilledSlots(r?.seedFill || {})
    setActiveSlot(null)
    setChecked(false)
    setRevealed(false)
  }
  const handleSwap = (slotId, option) => {
    setFilledSlots((prev) => reconcile(round.patternId, { ...prev, [slotId]: option }, maxChapter))
    setActiveSlot(null)
    setChecked(false)
  }
  const handleReveal = () => {
    setFilledSlots(round.targetFill)
    setActiveSlot(null)
    setRevealed(true)
  }

  if (!round || !pattern || !assembled) {
    return (
      <section className="pcs-card">
        <div className="text-[var(--text-muted)] text-sm">
          Test-yourself mode isn&rsquo;t available on this chapter yet &mdash; try Explore.
        </div>
      </section>
    )
  }

  return (
    <section className="pcs-card" ref={wrapRef}>
      <div className="pcs-card-row">
        <span>Make the sentence mean&hellip;</span>
        <button onClick={startRound} className="pcs-reset" aria-label="New target sentence">new</button>
      </div>

      <div className="x-lab-target">&ldquo;{round.targetEnglish}&rdquo;</div>

      <ChipRow
        pattern={pattern} patternId={round.patternId} filledSlots={filledSlots} maxChapter={maxChapter}
        activeSlot={activeSlot} setActiveSlot={setActiveSlot} onSwap={handleSwap}
      />

      {revealed ? (
        <div className="x-lab-grade is-revealed" aria-live="polite">
          Answer: <span className="font-tongan">{round.targetTongan}</span>
        </div>
      ) : solved ? (
        <div className="x-lab-grade is-correct" aria-live="polite">
          ✓ Correct! <span className="font-tongan">{assembled.tongan}</span>
        </div>
      ) : checked ? (
        <div className="x-lab-grade is-wrong" aria-live="polite">
          ✗ Not yet &mdash; keep swapping to match the meaning.
        </div>
      ) : (
        <div className="x-lab-hint">Swap the highlighted words until the meaning matches.</div>
      )}

      <div className="x-lab-grade-controls">
        {!solved && !revealed && (
          <>
            <button type="button" className="x-nav" onClick={() => setChecked(true)}>Check</button>
            <button type="button" className="x-chip" onClick={handleReveal}>Show answer</button>
          </>
        )}
        {(solved || revealed) && (
          <button type="button" className="x-nav" onClick={startRound}>Next sentence</button>
        )}
      </div>
    </section>
  )
}

export default function SentenceLabCore({ chapterNum }) {
  const [mode, setMode] = useState('explore')
  return (
    <div>
      <div className="x-lab-modes" role="tablist" aria-label="Sentence Lab mode">
        <button
          type="button" role="tab" aria-selected={mode === 'explore'}
          className={`x-chip${mode === 'explore' ? ' is-active' : ''}`}
          onClick={() => setMode('explore')}
        >
          Explore
        </button>
        <button
          type="button" role="tab" aria-selected={mode === 'graded'}
          className={`x-chip${mode === 'graded' ? ' is-active' : ''}`}
          onClick={() => setMode('graded')}
        >
          Test yourself
        </button>
      </div>
      {mode === 'explore'
        ? <ExploreLab chapterNum={chapterNum} />
        : <GradedLab chapterNum={chapterNum} />}
    </div>
  )
}
