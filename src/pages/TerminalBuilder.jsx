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

// Touch-primary detection for swapping the inline drum-roller for a
// tap-first dropdown picker on phones/tablets. Uses pointer/hover media
// queries rather than a viewport-width breakpoint — a wide iPad still
// needs the tap flow, and a narrow desktop window shouldn't. SSR-safe
// default is false (desktop) since window is only read inside useEffect.
function useIsTouchPrimary() {
  const [isTouch, setIsTouch] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: none) and (pointer: coarse)')
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return isTouch
}

// ── Split an "Add more" group into per-POS tab pills ─────────────────────
//
// The engine's `extensions` / `mixed` phases bundle terminators (. ?) and
// extension items (+ verb, + adverb, + ki he place, …) into one group
// labelled "Add more". That rendered as a single pill with a long list of
// `+ …` rows, which reads like the old "+ Add More" button rather than a
// part-of-speech tab row.
//
// This transform flattens that group: terminators become a "Finish" tab
// and each extension becomes its own tab pill whose only item is a
// confirmation row. `type` + `id` on the item are preserved so the parent's
// confirmSelection still routes to `pickExtension` / `pickTerminator`.
// Groups without any extension items (plain word groups, "Finish", "Done")
// pass through unchanged.
function expandAddMoreGroup(groups) {
  const result = []
  for (const group of groups) {
    const hasExtensions = group.items.some(it => it.type === 'extension')
    if (!hasExtensions) {
      result.push(group)
      continue
    }
    const terminators = group.items.filter(it => it.type === 'terminator')
    const extensions = group.items.filter(it => it.type === 'extension')
    if (terminators.length > 0) {
      result.push({ label: 'Finish', items: terminators })
    }
    for (const ext of extensions) {
      const tabLabel = ext.display.replace(/^\+\s*/, '')
      result.push({
        label: tabLabel,
        items: [{
          type: 'extension',
          id: ext.id,
          display: `add ${tabLabel.toLowerCase()}`,
          hint: ext.hint || '',
        }],
      })
    }
  }
  return result
}

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

// ── Inline Picker ─────────────────────────────────────────────────────────

function InlinePicker({ groups, groupIdx, itemIdx, onGroupChange, onItemChange, onConfirm }) {
  // Nothing to pick (rare transient state) — the sentence-line cursor
  // stands in instead.
  if (groups.length === 0) return null

  const group = groups[groupIdx] || groups[0]
  const activeItem = group.items[itemIdx] || group.items[0]
  const tabRowRef = useRef(null)
  const listRef = useRef(null)

  // Keep the active tab visible when the category row overflows the
  // picker width — otherwise the selected pill could scroll off-edge
  // as the user cycles with ←/→.
  useEffect(() => {
    const row = tabRowRef.current
    if (!row) return
    const tab = row.children[groupIdx]
    if (tab && tab.scrollIntoView) {
      tab.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [groupIdx])

  // Keep the active word row visible inside the capped-height list as
  // the user arrows ↑/↓ past what's initially rendered. `block: 'nearest'`
  // means rows already in view don't trigger a scroll — the list only
  // moves when the active row would otherwise clip.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const row = list.children[itemIdx]
    if (row && row.scrollIntoView) {
      row.scrollIntoView({ block: 'nearest' })
    }
  }, [itemIdx, groupIdx])

  return (
    <span className="tb-picker">
      <span className="tb-picker-tabrow">
        {groups.length > 1 && <span className="tb-picker-edge" aria-hidden>{'\u25C0'}</span>}
        <span className="tb-picker-tabs" ref={tabRowRef}>
          {groups.map((g, gi) => (
            <button
              type="button"
              key={g.label + gi}
              onClick={(e) => {
                e.stopPropagation()
                onGroupChange(gi)
              }}
              className={`tb-picker-tab ${gi === groupIdx ? 'is-active' : ''}`}
              tabIndex={-1}
            >
              {g.label}
            </button>
          ))}
        </span>
        {groups.length > 1 && <span className="tb-picker-edge" aria-hidden>{'\u25B6'}</span>}
      </span>

      <span className="tb-picker-list" ref={listRef}>
        {group.items.map((item, i) => {
          const isActive = i === itemIdx
          return (
            <button
              type="button"
              key={item.display + i}
              onClick={(e) => {
                e.stopPropagation()
                if (isActive) onConfirm()
                else onItemChange(i)
              }}
              className={`tb-picker-row ${isActive ? 'is-active' : ''}`}
              tabIndex={-1}
            >
              <span className="tb-picker-caret" aria-hidden>{isActive ? '\u25B8' : ''}</span>
              <span className="tb-picker-word">{item.display}</span>
              {item.hint && <span className="tb-picker-gloss">{item.hint}</span>}
            </button>
          )
        })}
      </span>

      {/* Fixed-height hint strip. Shows the active item's hint for now;
          when per-group example strings land in multi-walker, swap this
          to `group.hint`. The &nbsp; fallback keeps the picker from
          jumping when an item has no hint. */}
      <span className="tb-picker-footer">
        {activeItem?.hint || '\u00A0'}
      </span>
    </span>
  )
}

// ── Mobile Picker ─────────────────────────────────────────────────────────
//
// Two-stage dropdown: panel button → POS list → word list → confirm. The
// panel lives below the sentence line (the sentence shows the blinking
// cursor instead). When there's only one group (common in branching mode
// — e.g. the merged "Tense Marker" after `he`) the POS step is skipped
// and the word list opens directly.
//
// Desktop parity note: the inline drum-roller uses the parent's groupIdx/
// itemIdx state because it needs to track keyboard focus for arrow keys.
// MobilePicker has no keyboard input, so it manages its own local stage
// and lets the parent's indices stay at defaults. onConfirm accepts the
// picked item directly to sidestep setState-then-confirm batching.

function MobilePicker({ groups, onConfirm }) {
  const [stage, setStage] = useState('closed') // 'closed' | 'pos' | 'word'
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0)

  if (groups.length === 0) return null

  const openMenu = () => {
    setStage(groups.length === 1 ? 'word' : 'pos')
    setSelectedGroupIdx(0)
  }

  const pickGroup = (gi) => {
    setSelectedGroupIdx(gi)
    setStage('word')
  }

  const pickItem = (item) => {
    onConfirm(item)
    setStage('closed')
  }

  const group = groups[selectedGroupIdx] || groups[0]

  return (
    <span className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={openMenu}
        aria-label="Pick the next word"
        className="tb-mobile-trigger"
      >
        <span>pick</span>
        <span aria-hidden>{'\u25BE'}</span>
      </button>

      {stage !== 'closed' && (
        <>
          {/* Outside-tap dismissal. z-index below the menu so taps on items
              don't fall through to the backdrop. */}
          <span
            onClick={() => setStage('closed')}
            className="fixed inset-0 z-40 bg-transparent"
            aria-hidden
          />
          <span className="tb-mobile-menu">
            <span className="tb-mobile-menu-header">
              {stage === 'word' && groups.length > 1 ? (
                <button type="button" onClick={() => setStage('pos')}>
                  {'\u2190'} back
                </button>
              ) : <span />}
              <span>{stage === 'pos' ? 'Pick a category' : group.label}</span>
              <button
                type="button"
                onClick={() => setStage('closed')}
                aria-label="Close"
              >
                {'\u2715'}
              </button>
            </span>

            {stage === 'pos' && groups.map((g, gi) => (
              <button
                key={g.label + gi}
                type="button"
                onClick={() => pickGroup(gi)}
                className="tb-mobile-menu-item"
                style={{ fontStyle: 'normal' }}
              >
                {g.label} <span className="tb-mobile-menu-item-hint">{g.items.length}</span>
              </button>
            ))}

            {stage === 'word' && group.items.map((it, i) => (
              <button
                key={it.display + i}
                type="button"
                onClick={() => pickItem(it)}
                className="tb-mobile-menu-item"
              >
                <span>{it.display}</span>
                {it.hint && (
                  <span className="tb-mobile-menu-item-hint">{it.hint}</span>
                )}
              </button>
            ))}
          </span>
        </>
      )}
    </span>
  )
}
