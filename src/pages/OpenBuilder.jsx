/**
 * OpenBuilder — page that drives the stack-based walker end-to-end.
 *
 * The first UI that consumes the new stack-based walker (graph-walker.js
 * §2A.1–2A.5). Its original purpose was narrow: give the user a way to
 * exercise the walker so Phase 2E preliminary could verify that the three
 * original bugs (options disappearing, ki/kia agreement, period/question
 * termination) were fixed for Ch 1–15 data. That milestone is now done.
 *
 * Phase history:
 *   - 2D.1: minimum stub + chapter selector + entry-point chooser.
 *   - 2D.2: wired at `/open-build` via Dashboard tile + Layout breadcrumb.
 *   - 2D.3: way-of-code styling pass (no bordered boxes or bordered buttons;
 *     text-link-list aesthetic) and the 2A.4 definiteness picker handler.
 *
 * Scope boundary per spec/Phase-2-Engine-Plan.md:
 *   - Builder.jsx / SlotBuilder.jsx / slot-engine.js must stay untouched —
 *     the old Free Build path runs in parallel until the new one is stable.
 *
 * This page deliberately holds its own chapter override instead of driving
 * ChapterContext — during walker exploration the user can jump chapters
 * without mutating the global chapter state the rest of the app shares.
 */

import { useMemo, useState } from 'react'
import {
  createWalkerState,
  advanceInFrame,
  takeExtension as walkerTakeExtension,
  finishFrame as walkerFinishFrame,
  finishSentence as walkerFinishSentence,
  setStepDefiniteness as walkerSetStepDefiniteness,
  getEntryPoints,
} from '../engine/graph-walker'
import OpenBuilderSlot from '../components/OpenBuilderSlot'
import { mapErrorToFriendly } from '../lib/error-messages'
import { useChapter } from '../contexts/ChapterContext'

const CATEGORY_ORDER = [
  'Statements',
  'Commands',
  'Negation',
  'Ko Sentences',
  'Questions',
  'Noun Subjects',
]

const MAX_CHAPTER_IN_DATA = 30 // Ch 1–15 covered; plus the 2A.5 Ch 30 slice (Ch 24 `ka` contrast, Ch 26 `ke` purpose) so the Ch 30 target sentence is reachable in the browser. Chapters 16–23 and 27–29 are intentionally selectable but expose no new content yet — they're placeholders until 2C lands.

export default function OpenBuilder() {
  const { chapter: contextChapter } = useChapter()
  // Local override so the user can exercise Ch 1–15 without mutating the
  // global chapter they use for the rest of the app. Clamp the initial value
  // to the range the grammar-graph.json actually covers.
  const [chapter, setLocalChapter] = useState(() =>
    Math.min(Math.max(contextChapter, 1), MAX_CHAPTER_IN_DATA)
  )
  const [entryPointId, setEntryPointId] = useState(null)
  const [walkerState, setWalkerState] = useState(null)
  const [error, setError] = useState(null)

  const availableEntryPoints = useMemo(() => getEntryPoints(chapter), [chapter])

  const groupedEntryPoints = useMemo(() => {
    const groups = {}
    for (const ep of availableEntryPoints) {
      if (!groups[ep.category]) groups[ep.category] = []
      groups[ep.category].push(ep)
    }
    return CATEGORY_ORDER
      .filter(cat => groups[cat])
      .map(cat => ({ category: cat, entryPoints: groups[cat] }))
  }, [availableEntryPoints])

  const startWalk = (epId) => {
    try {
      // Create the walker state FIRST so a throw leaves both fields unset —
      // we never want to render "entry point selected but walker null" which
      // would drop the user back into the chooser with the wrong highlight.
      const newState = createWalkerState(epId, chapter)
      setError(null)
      setEntryPointId(epId)
      setWalkerState(newState)
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  const backToEntryPoints = () => {
    setEntryPointId(null)
    setWalkerState(null)
    setError(null)
  }

  const resetCurrentWalk = () => {
    if (!entryPointId) return
    try {
      setError(null)
      setWalkerState(createWalkerState(entryPointId, chapter))
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  const handleSelectWord = (word) => {
    try {
      setError(null)
      setWalkerState(prev => advanceInFrame(prev, word))
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  const handleTakeExtension = (targetId) => {
    try {
      setError(null)
      setWalkerState(prev => walkerTakeExtension(prev, targetId))
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  const handleFinishFrame = () => {
    try {
      setError(null)
      setWalkerState(prev => walkerFinishFrame(prev))
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  const handleFinishSentence = (terminatorId) => {
    try {
      setError(null)
      setWalkerState(prev => walkerFinishSentence(prev, terminatorId))
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  // Phase 2D.3: definiteness picker handler. Wraps `setStepDefiniteness` so
  // OpenBuilderSlot can flip a common-noun step between default rendering
  // (e.g. `ki he fale`) and definite rendering (`ki he falé`) without
  // needing walker internals. `level` is null to clear or 'definite' to set;
  // the 2-state UI picker deliberately avoids surfacing 'indefinite' /
  // 'semi_definite' until indefinite article-shifting lands in a follow-up.
  const handleSetDefiniteness = (flatStepIndex, level) => {
    try {
      setError(null)
      setWalkerState(prev => walkerSetStepDefiniteness(prev, flatStepIndex, level))
    } catch (e) {
      console.error(e)
      setError(mapErrorToFriendly(e.message))
    }
  }

  const handleChapterChange = (e) => {
    const next = parseInt(e.target.value, 10)
    setLocalChapter(next)
    // Changing chapter resets any in-flight walk so the new words/edges
    // actually take effect for the current entry point. If the current
    // entry point is no longer available at the new chapter, drop back
    // to the chooser so the user doesn't end up stuck on a walk that
    // can't proceed.
    if (entryPointId) {
      const stillAvailable = getEntryPoints(next).some(ep => ep.id === entryPointId)
      if (!stillAvailable) {
        setEntryPointId(null)
        setWalkerState(null)
        setError(null)
        return
      }
      try {
        setError(null)
        setWalkerState(createWalkerState(entryPointId, next))
      } catch (err) {
        console.error(err)
        setError(mapErrorToFriendly(err.message))
      }
    }
  }

  // ── Header shared across both views ───────────────────────────────────

  const header = (
    <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
      <div>
        <h1 className="text-xs text-[var(--text-muted)] uppercase tracking-[0.2em]">
          Open Build
        </h1>
        <p className="text-xs text-[var(--text-faint)] italic mt-1">
          experimental stack-walker builder &mdash; Ch 1&ndash;15 + Ch 30 slice
        </p>
      </div>
      <div className="flex items-center gap-6">
        <label className="text-xs text-[var(--text-muted)] italic">
          chapter
          <select
            value={chapter}
            onChange={handleChapterChange}
            className="ml-2 bg-transparent border-b border-[var(--border)] text-[var(--text)] text-xs focus:border-[var(--text-muted)] focus:outline-none cursor-pointer"
          >
            {Array.from({ length: MAX_CHAPTER_IN_DATA }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        {entryPointId && (
          <button
            onClick={backToEntryPoints}
            className="text-xs text-[var(--text-muted)] italic hover:text-[var(--accent-hover)] hover:underline decoration-[var(--text-muted)] underline-offset-4 transition-colors cursor-pointer"
          >
            &larr; change entry point
          </button>
        )}
      </div>
    </div>
  )

  // ── Walker view ───────────────────────────────────────────────────────

  if (entryPointId && walkerState) {
    const ep = availableEntryPoints.find(e => e.id === entryPointId)
    return (
      <div>
        {header}
        {ep && (
          <div className="mb-6">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em]">
              {ep.label}
            </div>
            {ep.description && (
              <div className="text-sm text-[var(--text-faint)] italic mt-1">
                {ep.description}
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="border border-[var(--wrong-border)] text-[var(--wrong)] text-xs px-4 py-2 mb-4">
            {error}
          </div>
        )}
        <OpenBuilderSlot
          walkerState={walkerState}
          entryPoint={ep}
          onSelectWord={handleSelectWord}
          onTakeExtension={handleTakeExtension}
          onFinishFrame={handleFinishFrame}
          onFinishSentence={handleFinishSentence}
          onSetDefiniteness={handleSetDefiniteness}
          onReset={resetCurrentWalk}
        />
      </div>
    )
  }

  // ── Entry point chooser ───────────────────────────────────────────────

  return (
    <div>
      {header}
      {error && (
        <div className="border border-[var(--wrong-border)] text-[var(--wrong)] text-xs px-4 py-2 mb-4">
          {error}
        </div>
      )}
      {groupedEntryPoints.length === 0 ? (
        <div className="text-sm text-[var(--text-muted)] italic">
          No entry points available at chapter {chapter}.
        </div>
      ) : (
        groupedEntryPoints.map(({ category, entryPoints }) => (
          <div key={category} className="mb-10">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em] mb-4">
              {category}
            </div>
            <div className="space-y-4">
              {entryPoints.map(ep => (
                <button
                  key={ep.id}
                  onClick={() => startWalk(ep.id)}
                  className="block w-full text-left cursor-pointer group"
                >
                  <div className="text-lg text-[var(--text)] group-hover:text-[var(--accent-hover)] group-hover:underline decoration-[var(--text-muted)] underline-offset-4 transition-colors">
                    {ep.label}
                  </div>
                  {ep.description && (
                    <div className="text-sm text-[var(--text-muted)] italic mt-0.5">
                      {ep.description}
                    </div>
                  )}
                  <div className="text-xs text-[var(--text-faint)] mt-0.5">
                    ch {ep.min_chapter} &middot;{' '}
                    {(ep.allowed_terminators || ['FINISH_STATEMENT', 'FINISH_QUESTION'])
                      .map(t => (t === 'FINISH_QUESTION' ? '?' : '.'))
                      .join(' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
