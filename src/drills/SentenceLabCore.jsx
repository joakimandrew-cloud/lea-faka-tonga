/**
 * SentenceLabCore — "swap a word, watch the English change."
 *
 * One fully-taught Tongan sentence rendered as a row of word-chips with the
 * English gloss beneath. Tap a swappable chip → the legal alternatives for
 * THAT slot only (chapter-gated). Each pick re-derives the whole sentence
 * through the slot engine and re-renders, flashing the English so the meaning
 * shift is the "aha" moment.
 *
 * Engine reuse (zero engine changes — review §"Sentence Lab"):
 *   - assembleSentence(patternId, filledSlots) → {tongan, english, literal, parts}
 *   - getOptionsForSlot(patternId, slotId, filledSlots, maxChapter) → alternatives
 * The starting sentence is SEEDED from the engine itself (greedily fill each
 * required slot with its first legal option), so it is always valid and no
 * Tongan is hand-authored here.
 */

import { useMemo, useState, useRef, useEffect } from 'react'
import {
  getAvailableSlots,
  getOptionsForSlot,
  assembleSentence,
  validateSentence,
} from '../engine/slot-engine'
import sentencePatterns from '../data/sentence-patterns.json'

// Pick a fully-taught pattern for this chapter that produces a NATURAL English
// translation (not the word-by-word `gloss` fallback — that would make the
// "meaning" line read like word salad). Among those, prefer the richest (most
// slots to swap). No chapterNum (standalone /drill) → the whole catalogue is
// eligible. Falls back to the richest taught pattern if none translate cleanly.
function translatesNaturally(patternId, maxChapter) {
  const seed = seedFill(patternId, maxChapter)
  const a = assembleSentence(patternId, seed)
  return !!(a && a.english && a.method !== 'gloss')
}

function pickPattern(chapterNum) {
  const max = chapterNum || 53
  const taught = sentencePatterns.patterns.filter(
    (p) => (p.book_chapters || []).every((c) => c <= max)
  )
  const pool = taught.length ? taught : sentencePatterns.patterns
  const byRichness = (a, b) =>
    b.slots.length - a.slots.length ||
    Math.max(...(b.book_chapters || [0])) - Math.max(...(a.book_chapters || [0]))
  const natural = pool.filter((p) => translatesNaturally(p.id, max)).sort(byRichness)
  return natural[0] || [...pool].sort(byRichness)[0]
}

// Greedily fill every required slot with its first legal option → a complete,
// engine-valid sentence to start from.
function seedFill(patternId, maxChapter) {
  let filled = {}
  for (let i = 0; i < 16; i++) {
    if (validateSentence(patternId, filled).valid) break
    const next = getAvailableSlots(patternId, filled).find(
      (s) => s.required && !filled[s.id]
    )
    if (!next) break
    const opts = getOptionsForSlot(patternId, next.id, filled, maxChapter)
    if (!opts.length) break
    filled = { ...filled, [next.id]: opts[0] }
  }
  return filled
}

// After a swap, keep the sentence complete: re-fill any dependent slot whose
// current value is no longer legal with its first valid option.
function reconcile(patternId, filled, maxChapter) {
  let next = { ...filled }
  for (let pass = 0; pass < 4; pass++) {
    let changed = false
    for (const id of Object.keys(next)) {
      const opts = getOptionsForSlot(patternId, id, next, maxChapter)
      if (!opts.length) { delete next[id]; changed = true; continue }
      if (!opts.some((o) => o.tongan === next[id].tongan)) {
        next[id] = opts[0]; changed = true
      }
    }
    if (!changed) break
  }
  return next
}

export default function SentenceLabCore({ chapterNum }) {
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

  // Flash the English line on each swap (fired from the handler, not an
  // effect). The timer is cleared on unmount.
  const flashTimer = useRef(null)
  useEffect(() => () => clearTimeout(flashTimer.current), [])
  const triggerFlash = () => {
    setFlash(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(false), 700)
  }

  // Dismiss the dropdown on outside click / Escape.
  useEffect(() => {
    if (!activeSlot) return
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setActiveSlot(null) }
    const onKey = (e) => { if (e.key === 'Escape') setActiveSlot(null) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [activeSlot])

  if (!pattern || !assembled) {
    return <div className="text-[var(--text-muted)] text-sm">Sentence Lab is not available here yet.</div>
  }

  const orderedSlots = [...pattern.slots].sort((a, b) => a.position - b.position)

  const handleSwap = (slotId, option) => {
    setFilledSlots((prev) => reconcile(patternId, { ...prev, [slotId]: option }, maxChapter))
    setActiveSlot(null)
    triggerFlash()
  }

  const handleReset = () => {
    setFilledSlots(seedFill(patternId, maxChapter))
    setActiveSlot(null)
  }

  const options = activeSlot ? getOptionsForSlot(patternId, activeSlot, filledSlots, maxChapter) : []

  return (
    <section className="pcs-card" ref={wrapRef}>
      <div className="pcs-card-row">
        <span>Swap a word &middot; watch the meaning change</span>
        <button onClick={handleReset} className="pcs-reset" aria-label="Reset sentence">reset</button>
      </div>

      {/* word chips */}
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
                      onClick={() => handleSwap(slot.id, opt)}
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

      {/* English meaning */}
      <div className={`x-lab-en${flash ? ' is-flash' : ''}`} aria-live="polite">
        {assembled.english}
      </div>
      {assembled.literal && assembled.literal !== assembled.english && (
        <div className="x-lab-literal">{assembled.literal}</div>
      )}
    </section>
  )
}
