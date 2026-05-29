/**
 * TerminalBuilder — word-by-word sentence builder with a terminal feel.
 *
 * The sentence line shows confirmed words followed by a blinking cursor at
 * the insertion point. The picker lives in a panel below the sentence —
 * arrow keys (desktop) cycle categories / scroll words, Enter confirms,
 * Backspace removes the last confirmed word. On mobile the picker is a
 * tap-to-open dropdown and a visible delete button handles backspacing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createMultiWalker,
  pickFirstWord,
  pickWord,
  pickExtension,
  finishCurrentFrame,
  pickTerminator,
  getRenderedSentence,
  getFinishedWalker,
  getEntryPointCategory,
  getPickerData,
  PHASE,
} from '../engine/multi-walker'
import { translateWalkerState } from '../engine/translate'
import { getLivePreview } from '../engine/sentence-preview'
import { InlinePicker, MobilePicker } from '../components/TerminalPicker'
import { useIsTouchPrimary, expandAddMoreGroup } from '../lib/terminal-picker-utils'

export default function TerminalBuilder() {
  const [mwState, setMwState] = useState(() => createMultiWalker(53))
  const [error, setError] = useState(null)
  const isTouch = useIsTouchPrimary()

  // Picker navigation state
  const [groupIdx, setGroupIdx] = useState(0)
  const [itemIdx, setItemIdx] = useState(0)

  // Undo stack — snapshots of mwState pushed before each successful pick so
  // Backspace / the delete button can step back one word at a time. Ref
  // rather than state because we don't want snapshot changes to trigger
  // renders, and a "can undo" flag derived from length is sufficient for
  // the disabled-button UI.
  const historyRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const MAX_HISTORY = 50

  const rendered = useMemo(() => getRenderedSentence(mwState), [mwState])
  const isFinished = mwState.phase === PHASE.FINISHED
  const pickerData = useMemo(() => isFinished ? { groups: [] } : getPickerData(mwState), [mwState, isFinished])

  // Split any "Add more" group (which bundles terminators + extension
  // items) into per-POS tab pills, so the horizontal tab row reads as
  // parts of speech rather than a single "Add more" pill with a long
  // `+ verb`, `+ adverb` list underneath. Terminators collect into a
  // dedicated "Finish" tab. Word groups and the "Done" group pass
  // through untouched.
  const displayGroups = useMemo(() => expandAddMoreGroup(pickerData.groups), [pickerData.groups])

  // Reset picker indices when options change
  const prevGroupsLen = useRef(0)
  useEffect(() => {
    if (displayGroups.length !== prevGroupsLen.current) {
      setGroupIdx(0)
      setItemIdx(0)
      prevGroupsLen.current = displayGroups.length
    }
  }, [displayGroups.length])

  const translation = useMemo(() => {
    if (!isFinished) return null
    const walker = getFinishedWalker(mwState)
    return walker ? translateWalkerState(walker) : null
  }, [mwState, isFinished])

  // Live English preview of the in-progress sentence — updates on every pick
  // ("Past tense" → "Past tense, I" → "I ate"). Cleared once finished, where
  // the full translation takes over.
  const livePreview = useMemo(
    () => (isFinished ? '' : getLivePreview(mwState)),
    [mwState, isFinished]
  )

  const punct = useMemo(() => {
    if (!isFinished) return ''
    const walker = getFinishedWalker(mwState)
    if (!walker) return '.'
    if (walker.terminator === 'FINISH_QUESTION') return '?'
    if (walker.terminator === 'FINISH_EXCLAMATION') return '!'
    const cat = getEntryPointCategory(mwState)
    return (cat === 'Commands' || cat === 'Exclamatory') ? '!' : '.'
  }, [mwState, isFinished])

  // Current picker selection
  const currentGroup = displayGroups[groupIdx] || null
  const currentItem = currentGroup ? (currentGroup.items[itemIdx] || currentGroup.items[0]) : null

  // ── Confirm the current selection ─────────────────────────────────────

  // Confirm either the current keyboard-tracked item (no arg — used by the
  // desktop InlinePicker's Enter/click handlers) or a specific item passed
  // in directly (used by <MobilePicker> whose dropdown flow bypasses the
  // groupIdx/itemIdx state that the keyboard picker drives). Passing the
  // item explicitly sidesteps the setState-then-confirm race: React batches
  // state updates, so setGroupIdx + setItemIdx + confirmSelection in the
  // same handler would read the STALE currentItem (the memoized value
  // computed from the pre-update indices).
  const confirmSelection = useCallback((itemOverride) => {
    const toConfirm = itemOverride || currentItem
    if (!toConfirm) return
    try {
      setError(null)
      let next
      if (toConfirm.type === 'first_word') {
        next = pickFirstWord(mwState, toConfirm.item)
      } else if (toConfirm.type === 'word') {
        next = pickWord(mwState, toConfirm.word)
      } else if (toConfirm.type === 'extension') {
        next = pickExtension(mwState, toConfirm.id)
      } else if (toConfirm.type === 'terminator') {
        next = pickTerminator(mwState, toConfirm.id)
      } else if (toConfirm.type === 'finish_frame') {
        next = finishCurrentFrame(mwState)
      }
      if (next) {
        // Push the pre-pick state onto the undo stack BEFORE swapping in
        // the new one. Capped at MAX_HISTORY to keep long exploration
        // sessions from growing memory without bound.
        historyRef.current.push(mwState)
        if (historyRef.current.length > MAX_HISTORY) {
          historyRef.current.shift()
        }
        setCanUndo(true)
        setMwState(next)
        setGroupIdx(0)
        setItemIdx(0)
      }
    } catch (e) {
      setError(e.message)
    }
  }, [currentItem, mwState])

  // ── Backspace: pop the last confirmed word ────────────────────────────

  const handleBackspace = useCallback(() => {
    if (historyRef.current.length === 0) return
    const prev = historyRef.current.pop()
    setCanUndo(historyRef.current.length > 0)
    setError(null)
    setMwState(prev)
    setGroupIdx(0)
    setItemIdx(0)
  }, [])

  // ── Keyboard navigation ───────────────────────────────────────────────

  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function handleKey(e) {
      // Backspace always works (even on the finished screen) so the user
      // can undo a terminator pick. Arrow/Enter only apply when a picker
      // is present.
      if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
        return
      }
      if (isFinished || displayGroups.length === 0) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setGroupIdx(prev => {
          const next = (prev - 1 + displayGroups.length) % displayGroups.length
          setItemIdx(0)
          return next
        })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setGroupIdx(prev => {
          const next = (prev + 1) % displayGroups.length
          setItemIdx(0)
          return next
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setItemIdx(prev => {
          const group = displayGroups[groupIdx]
          if (!group) return 0
          return (prev - 1 + group.items.length) % group.items.length
        })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setItemIdx(prev => {
          const group = displayGroups[groupIdx]
          if (!group) return 0
          return (prev + 1) % group.items.length
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        confirmSelection()
      }
    }

    el.addEventListener('keydown', handleKey)
    return () => el.removeEventListener('keydown', handleKey)
  }, [isFinished, displayGroups, groupIdx, confirmSelection, handleBackspace])

  // Auto-focus container
  useEffect(() => {
    if (containerRef.current && !isFinished) {
      containerRef.current.focus()
    }
  }, [mwState, isFinished])

  const handleReset = () => {
    setError(null)
    historyRef.current = []
    setCanUndo(false)
    setMwState(createMultiWalker(53))
    setGroupIdx(0)
    setItemIdx(0)
  }

  // ── Build the sentence display with inline picker ─────────────────────

  const tonganParts = rendered.map(s => s.renderedTongan)

  // ── Render ────────────────────────────────────────────────────────────

  const pickerHasGroups = displayGroups.length > 0
  const showPicker = !isFinished && pickerHasGroups
  // Cursor shows only when no picker is active — i.e. on the finished
  // screen or the transient state with zero groups. When the picker is
  // present it sits at the cursor position and acts as the indicator.
  const showCursor = !showPicker

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="terminal-builder outline-none"
    >
      <div className="tb-header-label">Build a Sentence</div>
      <div className="tb-header-hint">
        {isFinished
          ? '\u00a0'
          : isTouch
            ? 'Tap the picker \u00b7 \u232b to delete'
            : 'Use \u2190\u2192 to change category \u00b7 \u2191\u2193 to scroll words \u00b7 Enter to confirm \u00b7 Backspace to delete'}
      </div>

      <div className="tb-sentence">
        <span className="tb-prompt">&gt;</span>
        {tonganParts.map((part, i) => (
          <span key={i} className="tb-word">{part}</span>
        ))}
        {isFinished && <span className="tb-word">{punct}</span>}
        {showPicker && (
          isTouch ? (
            <MobilePicker
              groups={displayGroups}
              onConfirm={confirmSelection}
            />
          ) : (
            <InlinePicker
              groups={displayGroups}
              groupIdx={groupIdx}
              itemIdx={itemIdx}
              onGroupChange={(gi) => { setGroupIdx(gi); setItemIdx(0) }}
              onItemChange={setItemIdx}
              onConfirm={confirmSelection}
            />
          )
        )}
        {showCursor && <span className="tb-cursor" aria-hidden />}
      </div>

      {!isFinished && livePreview && (
        <div className="tb-preview" aria-live="polite">{livePreview}</div>
      )}

      {isFinished && translation && translation.text && (
        <div className="tb-translation">{translation.text}</div>
      )}
      {isFinished && translation && translation.literal &&
        translation.literal !== translation.text && (
        <div className="tb-translation-literal">literally: {translation.literal}</div>
      )}

      {error && <div className="tb-error">{error}</div>}

      <div className="tb-controls">
        <button
          type="button"
          onClick={handleBackspace}
          disabled={!canUndo}
          aria-label="Delete last word"
          className="tb-keycap-btn"
        >
          <span className="tb-keycap">{'\u232B'}</span>
          <span>delete</span>
        </button>
        {(canUndo || tonganParts.length > 0 || isFinished) && (
          <button
            type="button"
            onClick={handleReset}
            className="tb-start-over"
          >
            start over
          </button>
        )}
      </div>
    </div>
  )
}
