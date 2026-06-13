/**
 * SentenceBuilder — the merged guided + terminal sentence builder (/sentence-builder).
 *
 * Combines what each older builder did well:
 *   - from open-build: a *skippable* "What do you want to say?" opening step
 *     (statement / command / question / …) so the user has a frame before
 *     building, plus a short "pick next" prompt while building.
 *   - from terminal-build: the `> word word █` terminal canvas, the inline
 *     part-of-speech picker (keyboard on desktop, tap dropdown on mobile),
 *     the end-of-sentence translation, and the multi-walker engine (all 53
 *     chapters).
 *
 * The verbose grammar prose that made open-build feel heavy stays OUT of the
 * build flow; the scaled-back word-by-word breakdown is offered only on
 * demand via <ExplainPanel> after the sentence is finished.
 *
 * Engine: createGuidedMultiWalker opens on PHASE.PICKING_ENTRY_POINT and
 * filters first words to the chosen category. The plain createMultiWalker
 * path (and /terminal-build) is unaffected by these additions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createGuidedMultiWalker,
  getEntryPointCategories,
  pickEntryPointCategory,
  pickFirstWord,
  pickWord,
  pickExtension,
  finishCurrentFrame,
  pickTerminator,
  getRenderedSentence,
  getFinishedWalker,
  getFinishedEntryPoint,
  getEntryPointCategory,
  getPickerData,
  PHASE,
} from '../engine/multi-walker'
import { translateWalkerState } from '../engine/translate'
import { getLivePreview } from '../engine/sentence-preview'
import { getFlatSteps } from '../engine/graph-walker'
import { InlinePicker, MobilePicker } from '../components/TerminalPicker'
import { useIsTouchPrimary, expandAddMoreGroup } from '../lib/terminal-picker-utils'
import { mapErrorToFriendly } from '../lib/error-messages'
import ExplainPanel from '../components/ExplainPanel'

// The merged builder is a free sandbox: every structure unlocked, like the
// terminal builder it grows out of.
const CHAPTER = 53

// "Pronoun" → "a pronoun", "Object" → "an object". Lowercases the part-of-
// speech label and picks a/an from the first letter — good enough for the
// grammar-graph node labels the picker surfaces.
function withArticle(label) {
  if (!label) return ''
  const l = label.toLowerCase()
  return (/^[aeiou]/.test(l) ? 'an ' : 'a ') + l
}

export default function SentenceBuilder() {
  const [mwState, setMwState] = useState(() => createGuidedMultiWalker(CHAPTER))
  const [error, setError] = useState(null)
  const isTouch = useIsTouchPrimary()

  // Picker navigation state
  const [groupIdx, setGroupIdx] = useState(0)
  const [itemIdx, setItemIdx] = useState(0)

  // Undo stack — snapshots of mwState pushed before each successful pick so
  // Backspace / the delete button can step back one word at a time. The
  // entry-point choice is pushed too, so Backspace from the first word
  // returns to the chooser. Ref rather than state because we don't want
  // snapshot changes to trigger renders.
  const historyRef = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const MAX_HISTORY = 50

  const isChoosingEntryPoint = mwState.phase === PHASE.PICKING_ENTRY_POINT
  const isFinished = mwState.phase === PHASE.FINISHED

  // Sentence-type categories for the opening chooser. CHAPTER is constant so
  // this resolves once.
  const entryCategories = useMemo(() => getEntryPointCategories(CHAPTER), [])

  const rendered = useMemo(() => getRenderedSentence(mwState), [mwState])
  const pickerData = useMemo(
    () => (isFinished || isChoosingEntryPoint ? { groups: [] } : getPickerData(mwState)),
    [mwState, isFinished, isChoosingEntryPoint]
  )

  // Split any "Add more" group (terminators + extension items) into per-POS
  // tab pills — same transform the terminal builder uses.
  const displayGroups = useMemo(() => expandAddMoreGroup(pickerData.groups), [pickerData.groups])

  // Note: every action that changes mwState (confirmSelection, handleBackspace,
  // chooseEntryPoint, handleReset) resets groupIdx/itemIdx to 0, so the picker
  // indices are always in range after a transition — no reset effect needed.

  const translation = useMemo(() => {
    if (!isFinished) return null
    const walker = getFinishedWalker(mwState)
    return walker ? translateWalkerState(walker) : null
  }, [mwState, isFinished])

  // Live English preview while building ("Past tense, I" → "I ate"). Not shown
  // on the entry-point chooser or the finished screen (the full translation
  // takes over there).
  const livePreview = useMemo(
    () => (isFinished || isChoosingEntryPoint ? '' : getLivePreview(mwState)),
    [mwState, isFinished, isChoosingEntryPoint]
  )

  // Data for the optional "Show how this was built" breakdown — only computed
  // once the sentence is finished. steps come from the underlying graph-walker
  // path; entryPoint gives ExplainPanel a frame name.
  const explain = useMemo(() => {
    if (!isFinished) return null
    const walker = getFinishedWalker(mwState)
    if (!walker) return null
    return { steps: getFlatSteps(walker), entryPoint: getFinishedEntryPoint(mwState) }
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

  // ── Short "what to pick next" guidance ────────────────────────────────

  // The focused tab's label drives a specific prompt ("Next: pick a verb")
  // and updates as the user cycles categories with ←/→.
  const focusedLabel = currentGroup ? currentGroup.label : ''

  const guidance = useMemo(() => {
    switch (mwState.phase) {
      case PHASE.PICKING_FIRST_WORD:
        return 'Pick a word to begin'
      case PHASE.PICKING_WORD:
      case PHASE.PICKING_CATEGORY:
        return focusedLabel ? `Next: pick ${withArticle(focusedLabel)}` : 'Pick the next word'
      case PHASE.PICKING_EXTENSION_OR_FINISH:
      case PHASE.MIXED:
        if (focusedLabel === 'Finish') return 'Finish your sentence'
        if (focusedLabel === 'Done') return 'Finish this part'
        return focusedLabel
          ? `Add ${withArticle(focusedLabel)}, or finish`
          : 'Add to your sentence, or finish'
      default:
        return ' '
    }
  }, [mwState.phase, focusedLabel])

  // Header hint: lead with the guidance; append control mechanics only on the
  // very first word, where a new user needs to learn the picker.
  const headerHint = isFinished
    ? ' '
    : mwState.phase === PHASE.PICKING_FIRST_WORD
      ? `${guidance} · ${isTouch ? 'tap to pick' : '←→ ↑↓ · Enter'}`
      : guidance

  // ── Confirm the current selection ─────────────────────────────────────

  // Mirrors TerminalBuilder: confirm the keyboard-tracked item (no arg) or a
  // specific item (MobilePicker). Passing the item explicitly sidesteps the
  // setState-then-confirm batching race.
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
      // Keep the technical detail for debugging; show the learner a
      // plain-language version instead of engine-speak.
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }, [currentItem, mwState])

  // ── Entry-point chooser action ────────────────────────────────────────

  // Record the sentence-type choice (or skip with null) and drop into the
  // build flow. Pushed onto the undo stack so Backspace can return here.
  const chooseEntryPoint = useCallback((category) => {
    setError(null)
    historyRef.current.push(mwState)
    setCanUndo(true)
    setMwState(pickEntryPointCategory(mwState, category))
    setGroupIdx(0)
    setItemIdx(0)
  }, [mwState])

  // ── Backspace: pop the last confirmed word (or back to the chooser) ────

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
      if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
        return
      }
      // Arrow/Enter only apply while a picker is present (not on the chooser
      // or finished screens, which use buttons).
      if (isFinished || isChoosingEntryPoint || displayGroups.length === 0) return

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
  }, [isFinished, isChoosingEntryPoint, displayGroups, groupIdx, confirmSelection, handleBackspace])

  // Auto-focus the container so keyboard nav works without a click.
  useEffect(() => {
    if (containerRef.current && !isFinished) {
      containerRef.current.focus()
    }
  }, [mwState, isFinished])

  const handleReset = () => {
    setError(null)
    historyRef.current = []
    setCanUndo(false)
    setMwState(createGuidedMultiWalker(CHAPTER))
    setGroupIdx(0)
    setItemIdx(0)
  }

  // ── Entry-point chooser view ──────────────────────────────────────────

  if (isChoosingEntryPoint) {
    return (
      <div ref={containerRef} tabIndex={0} className="terminal-builder outline-none">
        <div className="tb-header-label">Build a Sentence</div>
        <div className="tb-header-hint">What do you want to say?</div>

        <div className="tb-chooser">
          {entryCategories.map(c => (
            <button
              key={c.category}
              type="button"
              onClick={() => chooseEntryPoint(c.category)}
              className="tb-chooser-item"
            >
              <span className="tb-chooser-cat">{c.label}</span>
              {c.blurb && <span className="tb-chooser-blurb">{c.blurb}</span>}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => chooseEntryPoint(null)}
          className="tb-chooser-skip"
        >
          {'›'} or just start building {'→'}
        </button>

        <Link to="/terminal-build" className="tb-chooser-skip" style={{ opacity: 0.7 }}>
          {'›'} or use the bare terminal canvas {'→'}
        </Link>

        {error && <div className="tb-error">{error}</div>}
      </div>
    )
  }

  // ── Build / finished view ─────────────────────────────────────────────

  const tonganParts = rendered.map(s => s.renderedTongan)
  const pickerHasGroups = displayGroups.length > 0
  const showPicker = !isFinished && pickerHasGroups
  const showCursor = !showPicker

  return (
    <div ref={containerRef} tabIndex={0} className="terminal-builder outline-none">
      <div className="tb-header-label">Build a Sentence</div>
      <div className="tb-header-hint">{headerHint}</div>

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

      {isFinished && explain && (
        <div className="tb-explain">
          <ExplainPanel
            steps={explain.steps}
            translation={translation}
            chapter={CHAPTER}
            entryPoint={explain.entryPoint}
          />
        </div>
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
          <span className="tb-keycap">{'⌫'}</span>
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
