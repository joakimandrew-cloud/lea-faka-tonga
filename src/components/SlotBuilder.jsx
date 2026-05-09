import { useState, useMemo, useRef, useEffect } from 'react'
import {
  getAvailableSlots,
  getOptionsForSlot,
  assembleSentence,
  validateSentence,
  getMatchingNotes,
} from '../engine/slot-engine'
import sentencePatterns from '../data/sentence-patterns.json'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPattern(patternId) {
  return sentencePatterns.patterns.find(p => p.id === patternId) || null
}

/** Group verb options by tag for easier scanning */
function groupVerbOptions(options) {
  const intrans = options.filter(o => o.tags?.includes('intransitive'))
  const trans = options.filter(o => o.tags?.includes('transitive'))
  const stative = options.filter(o => o.tags?.includes('adjective'))
  const groups = []
  if (intrans.length) groups.push({ label: 'Actions (no object)', items: intrans })
  if (trans.length) groups.push({ label: 'Actions (with object)', items: trans })
  if (stative.length) groups.push({ label: 'States / Feelings', items: stative })
  return groups.length > 1 ? groups : null
}

/** Group pronoun options by number */
function groupPronounOptions(options) {
  const sg = options.filter(o => o.number === 'singular')
  const dl = options.filter(o => o.number === 'dual')
  const pl = options.filter(o => o.number === 'plural')
  const groups = []
  if (sg.length) groups.push({ label: 'Singular', items: sg })
  if (dl.length) groups.push({ label: 'Dual (two)', items: dl })
  if (pl.length) groups.push({ label: 'Plural (three+)', items: pl })
  return groups.length > 1 ? groups : null
}

function getOptionGroups(options, slotDef) {
  if (!slotDef || options.length <= 6) return null
  if (slotDef.type === 'verb') return groupVerbOptions(options)
  if (slotDef.type === 'pronoun') return groupPronounOptions(options)
  return null
}

/**
 * The `place` slot narrows to a person when the chosen preposition is
 * personal (kia / ʻia / meia) or pronoun (kiate / ʻiate / meiate).
 * Relabel so "Place" doesn't look wrong for those picks.
 */
function displaySlotLabel(slot, filledSlots) {
  if (slot.id === 'place') {
    const cls = filledSlots.preposition?.noun_class
    if (cls === 'personal' || cls === 'pronoun') return 'Person'
  }
  return slot.label
}

// ===========================================================================
// SlotBuilder
// ===========================================================================

export default function SlotBuilder({
  patternId,
  initialFilledSlots = {},
  maxChapter = 53,
  forceQuestion = false,
  onBack = null,
  onNext = null,
}) {
  const pattern = useMemo(() => getPattern(patternId), [patternId])
  const [filledSlots, setFilledSlots] = useState(initialFilledSlots)
  const [activeSlot, setActiveSlot] = useState(null)
  const [phase, setPhase] = useState('building') // building | punctuation | finished
  const [isQuestion, setIsQuestion] = useState(forceQuestion)
  const [notesOpen, setNotesOpen] = useState(false)
  const activeSlotWrapperRef = useRef(null)

  // Dismiss dropdown on outside click or Escape
  useEffect(() => {
    if (!activeSlot) return
    const handleClickOutside = (e) => {
      if (activeSlotWrapperRef.current && !activeSlotWrapperRef.current.contains(e.target)) {
        setActiveSlot(null)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setActiveSlot(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [activeSlot])

  if (!pattern) {
    return <div className="text-[var(--text-muted)]">Pattern not found: {patternId}</div>
  }

  // All slots sorted by position
  const allSlots = useMemo(
    () => [...pattern.slots].sort((a, b) => a.position - b.position),
    [patternId]
  )

  // Available (unfilled, unlocked, condition-met) slots
  const availableSlots = getAvailableSlots(patternId, filledSlots)
  const availableIds = new Set(availableSlots.map(s => s.id))

  // Validation
  const { valid, missing } = validateSentence(patternId, filledSlots)

  // Assembly — once the user has chosen punctuation (finished phase) or the
  // caller forced a question, pass the explicit isQuestion so the English
  // translation reflects the chosen mood.
  const assembled = useMemo(() => {
    if (Object.keys(filledSlots).length === 0) return null
    const override = (phase === 'finished' || forceQuestion) ? isQuestion : undefined
    return assembleSentence(patternId, filledSlots, override)
  }, [patternId, filledSlots, phase, isQuestion, forceQuestion])

  // Grammar notes
  const notes = getMatchingNotes(patternId, filledSlots, maxChapter)

  // Options for active slot
  const options = activeSlot
    ? getOptionsForSlot(patternId, activeSlot, filledSlots, maxChapter)
    : []

  const activeSlotDef = activeSlot
    ? pattern.slots.find(s => s.id === activeSlot)
    : null

  // Option groups (verbs by tag, pronouns by number)
  const optionGroups = useMemo(
    () => getOptionGroups(options, activeSlotDef),
    [options, activeSlotDef]
  )

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelectOption = (option) => {
    const newFilled = { ...filledSlots, [activeSlot]: option }

    // Cascade: invalidate dependent filled slots whose value is no longer valid
    for (const slot of pattern.slots) {
      if (slot.locked || slot.id === activeSlot || !(slot.id in newFilled)) continue
      const opts = getOptionsForSlot(patternId, slot.id, newFilled, maxChapter)
      if (opts.length === 0 || !opts.some(o => o.tongan === newFilled[slot.id].tongan)) {
        delete newFilled[slot.id]
      }
    }

    setFilledSlots(newFilled)

    // Auto-advance to next unfilled required slot
    const nextAvailable = getAvailableSlots(patternId, newFilled)
    const nextRequired = nextAvailable.find(s => s.required)
    setActiveSlot(nextRequired ? nextRequired.id : null)
  }

  const handleSlotTap = (slotId) => {
    if (phase === 'finished') return
    setActiveSlot(activeSlot === slotId ? null : slotId)
  }

  const handleClearAll = () => {
    setFilledSlots({ ...initialFilledSlots })
    setActiveSlot(null)
    setPhase('building')
  }

  const handleSelectPunctuation = (question) => {
    setIsQuestion(question)
    setPhase('finished')
    setActiveSlot(null)
  }

  const handleBuildAnother = () => {
    setFilledSlots({ ...initialFilledSlots })
    setActiveSlot(null)
    setPhase('building')
    setIsQuestion(forceQuestion)
  }

  // ── Slot visual state ───────────────────────────────────────────────────

  const getSlotState = (slot) => {
    if (slot.locked) return 'locked'
    if (filledSlots[slot.id]) return 'filled'
    if (availableIds.has(slot.id)) return slot.required ? 'empty-required' : 'empty-optional'
    return 'hidden'
  }

  // ── Build Tongan preview string with placeholders ──────────────────────

  const previewParts = allSlots.map(slot => {
    const state = getSlotState(slot)
    if (state === 'hidden') return null
    if (state === 'locked') return { text: slot.locked_value.tongan, type: 'locked' }
    if (state === 'filled') return { text: filledSlots[slot.id].tongan, type: 'filled' }
    if (state === 'empty-required') return { text: '...', type: 'missing' }
    return null // empty-optional slots don't appear in the sentence string
  }).filter(Boolean)

  const previewTongan = previewParts.map(p => p.text).join(' ')

  // ── Render option row ──────────────────────────────────────────────────

  const renderOption = (opt, i) => {
    const isSelected = filledSlots[activeSlot]?.tongan === opt.tongan
    return (
      <button
        key={`${opt.tongan}-${i}`}
        onClick={() => handleSelectOption(opt)}
        className={`w-full flex items-center justify-between gap-3 rounded-md transition-colors cursor-pointer text-left ${
          isSelected ? 'bg-[var(--accent-faint)]' : 'hover:bg-[var(--accent-faint)]'
        }`}
        style={{ padding: '10px 12px' }}
      >
        <span className="font-tongan whitespace-nowrap">{opt.tongan}</span>
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{opt.english}</span>
      </button>
    )
  }

  // =====================================================================
  // FINISHED VIEW
  // =====================================================================

  if (phase === 'finished' && assembled) {
    const punct = isQuestion ? '?' : '.'
    return (
      <div>
        <div className="border border-[var(--accent)] px-6 py-5 mb-6">
          <div className="font-tongan text-xl text-[var(--text-strong)] mb-2">
            {assembled.tongan}{punct}
          </div>
          {assembled.literal && (
            <div className="text-sm text-[var(--text-muted)] mb-1">{assembled.literal}</div>
          )}
          {assembled.method === 'gloss' ? (
            <div className="text-xs text-[var(--text-muted)] italic">Literal — translate in your head.</div>
          ) : (
            <div className="text-[var(--accent)]">{assembled.english}</div>
          )}

          {/* Parts breakdown */}
          <div className="flex flex-wrap gap-2 mt-4">
            {assembled.parts.map((part, i) => (
              <div key={i} className="px-3 py-1.5 bg-[var(--bg-tone)] border border-[var(--border)]">
                <div className="font-tongan">{part.tongan}</div>
                <div className="text-xs text-[var(--text-muted)]">{part.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleBuildAnother}
            className="px-4 py-2 border border-[var(--accent)] text-[var(--accent)] text-sm hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer"
          >
            Build another sentence
          </button>
          {onNext && (
            <button
              onClick={onNext}
              className="px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              Next pattern &rarr;
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-[var(--border)] text-[var(--text-muted)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
            >
              &larr; Change pattern
            </button>
          )}
        </div>

        {notes.length > 0 && (
          <div className="space-y-3">
            {notes.map(note => (
              <div key={note.id} className="border-l-2 border-[var(--accent)] pl-4 py-2">
                <div className="text-xs text-[var(--accent)] uppercase tracking-wider mb-1">
                  {note.title}
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed font-tongan">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =====================================================================
  // PUNCTUATION VIEW
  // =====================================================================

  // =====================================================================
  // BUILDING VIEW
  // =====================================================================

  return (
    <div>
      {/* ── SENTENCE PREVIEW BAR ── */}
      <div className="border border-[var(--border)] px-4 py-4 mb-6">
        <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">
          {pattern.label_to}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {allSlots.map(slot => {
            const state = getSlotState(slot)
            if (state === 'hidden') return null

            const isActive = activeSlot === slot.id

            if (state === 'locked') {
              return (
                <div
                  key={slot.id}
                  className="px-3 py-2 bg-[var(--bg-tone)] border border-[var(--border)] font-tongan text-lg"
                >
                  {slot.locked_value.tongan}
                </div>
              )
            }

            let slotButton
            if (state === 'filled') {
              slotButton = (
                <button
                  onClick={() => handleSlotTap(slot.id)}
                  className={`px-3 py-2 font-tongan text-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    isActive
                      ? 'border border-[var(--text-strong)] text-[var(--text-strong)] bg-[var(--accent-faint)]'
                      : 'bg-[var(--accent-faint)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/15'
                  }`}
                >
                  <span>{filledSlots[slot.id].tongan}</span>
                  {isActive && <span className="text-sm not-italic">&#9662;</span>}
                </button>
              )
            } else if (state === 'empty-required') {
              slotButton = (
                <button
                  onClick={() => handleSlotTap(slot.id)}
                  className={`px-3 py-2 transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    isActive
                      ? 'border border-[var(--text-strong)] text-[var(--text-strong)]'
                      : 'border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  <span>{displaySlotLabel(slot, filledSlots)}</span>
                  {isActive && <span className="text-sm">&#9662;</span>}
                </button>
              )
            } else {
              // empty-optional
              slotButton = (
                <button
                  onClick={() => handleSlotTap(slot.id)}
                  className={`px-3 py-2 transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    isActive
                      ? 'border border-[var(--text-strong)] text-[var(--text-strong)]'
                      : 'border border-dashed border-[var(--bg-med)] text-[var(--text-faint)] hover:border-[var(--accent)]/50 hover:text-[var(--text-muted)]'
                  }`}
                >
                  <span>+ {displaySlotLabel(slot, filledSlots)}</span>
                  {isActive && <span className="text-sm">&#9662;</span>}
                </button>
              )
            }

            return (
              <div
                key={slot.id}
                ref={isActive ? activeSlotWrapperRef : null}
                className="relative"
              >
                {slotButton}
                {isActive && activeSlotDef && (
                  <div
                    className="absolute left-0 top-full overflow-y-auto"
                    style={{
                      marginTop: '4px',
                      minWidth: '160px',
                      maxHeight: '280px',
                      background: '#ffffff',
                      border: '0.5px solid var(--border)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      padding: '6px',
                      zIndex: 50,
                    }}
                  >
                    {options.length === 0 ? (
                      <div className="text-sm text-[var(--text-faint)] italic px-3 py-2 whitespace-nowrap">
                        {activeSlotDef.depends_on && !filledSlots[activeSlotDef.depends_on]
                          ? `Select ${pattern.slots.find(s => s.id === activeSlotDef.depends_on)?.label || 'the required slot'} first`
                          : 'No options available'}
                      </div>
                    ) : optionGroups ? (
                      <div className="space-y-1">
                        {optionGroups.map(group => (
                          <div key={group.label}>
                            <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)] px-3 pt-1 pb-1">
                              {group.label}
                            </div>
                            {group.items.map((opt, i) => renderOption(opt, i))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      options.map((opt, i) => renderOption(opt, i))
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Punctuation slot — appears once all required slots are filled */}
          {valid && (() => {
            const punctActive = activeSlot === '__punct__'
            const punctOptions = forceQuestion
              ? [{ symbol: '?', label: 'question', isQuestion: true }]
              : [
                  { symbol: '.', label: 'statement', isQuestion: false },
                  { symbol: '?', label: 'question', isQuestion: true },
                ]
            return (
              <div
                ref={punctActive ? activeSlotWrapperRef : null}
                className="relative"
              >
                <button
                  onClick={() => setActiveSlot(punctActive ? null : '__punct__')}
                  className={`px-3 py-2 transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    punctActive
                      ? 'border border-[var(--text-strong)] text-[var(--text-strong)]'
                      : 'border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  <span>. / ?</span>
                  {punctActive && <span className="text-sm">&#9662;</span>}
                </button>
                {punctActive && (
                  <div
                    className="absolute left-0 top-full overflow-y-auto"
                    style={{
                      marginTop: '4px',
                      minWidth: '160px',
                      maxHeight: '280px',
                      background: '#ffffff',
                      border: '0.5px solid var(--border)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      padding: '6px',
                      zIndex: 50,
                    }}
                  >
                    {punctOptions.map(opt => (
                      <button
                        key={opt.symbol}
                        onClick={() => handleSelectPunctuation(opt.isQuestion)}
                        className="w-full flex items-center justify-between gap-3 rounded-md transition-colors cursor-pointer text-left hover:bg-[var(--accent-faint)]"
                        style={{ padding: '10px 12px' }}
                      >
                        <span className="font-tongan whitespace-nowrap">{opt.symbol}</span>
                        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* Translation preview */}
        {assembled ? (
          <div>
            <div className="font-tongan text-[var(--text-strong)] mb-0.5">{previewTongan}</div>
            <div className="text-sm text-[var(--accent)]">{assembled.english}</div>
            {assembled.literal && (
              <div className="text-xs text-[var(--text-faint)] mt-0.5">{assembled.literal}</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[var(--text-faint)] italic">
            Tap a slot above to start building your sentence.
          </div>
        )}

        {/* Controls */}
        {Object.keys(filledSlots).length > Object.keys(initialFilledSlots).length && (
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleClearAll}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── GRAMMAR NOTES ── */}
      {notes.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="text-xs text-[var(--accent)]/80 uppercase tracking-wider cursor-pointer flex items-center gap-1 mb-2"
          >
            <span className={`transition-transform inline-block ${notesOpen ? 'rotate-90' : ''}`}>&#8250;</span>
            Grammar Notes ({notes.length})
          </button>
          {notesOpen && (
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="border-l-2 border-[var(--accent)] pl-4 py-2">
                  <div className="text-xs text-[var(--accent)] uppercase tracking-wider mb-1">
                    {note.title}
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed font-tongan">
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
