/**
 * ChapterDrillAnchor — the inline strip that opens an embedded drill.
 *
 * Rendered by BookChapterContent when remark-drill-anchors injects a
 * <chapter-drill-anchor data-drill-id="…"> node into the parsed tree.
 *
 * Default: collapsed but visually prominent (accent-bordered card with
 * clear call-to-action). Click expands and smooth-scrolls the anchor row
 * to the top of the viewport (so the drill replaces what was on screen
 * rather than pushing it down — Step 3's engineered scroll handling).
 *
 * Persistence: per-chapter localStorage key `drill:expanded:ch{N}` holds
 * an array of drillIds currently expanded.
 */

import { useState, useRef, useCallback } from 'react'
import DrillFrame from '../drills/DrillFrame'
import { drillRegistry } from '../drills/registry'

function readExpandedSet(chapterNum) {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(`drill:expanded:ch${chapterNum}`)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeExpandedSet(chapterNum, set) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(
      `drill:expanded:ch${chapterNum}`,
      JSON.stringify([...set])
    )
  } catch {
    // ignore quota / private-mode errors
  }
}

export default function ChapterDrillAnchor({ drillId, chapterNum }) {
  const [expanded, setExpanded] = useState(() =>
    readExpandedSet(chapterNum).has(drillId)
  )
  const ref = useRef(null)

  const handleToggle = useCallback(() => {
    setExpanded(prev => {
      const next = !prev
      const set = readExpandedSet(chapterNum)
      if (next) set.add(drillId); else set.delete(drillId)
      writeExpandedSet(chapterNum, set)
      if (next) {
        requestAnimationFrame(() => {
          ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        })
      }
      return next
    })
  }, [chapterNum, drillId])

  const entry = drillRegistry[drillId]
  if (!entry) {
    return (
      <div className="my-6 text-xs text-[var(--wrong)] border border-[var(--wrong-border)] px-3 py-2">
        Unknown drill id: <code>{drillId}</code>
      </div>
    )
  }
  const { Core, meta } = entry

  return (
    <div ref={ref} className="my-8 chapter-drill-anchor">
      <button
        onClick={handleToggle}
        aria-expanded={expanded}
        className={`w-full text-left px-5 py-4 border-2 transition-all cursor-pointer flex items-center gap-4 ${
          expanded
            ? 'border-[var(--accent)] bg-[var(--accent-faint)]'
            : 'border-[var(--accent)]/50 bg-[var(--accent-faint)]/40 hover:border-[var(--accent)] hover:bg-[var(--accent-faint)]'
        }`}
      >
        <span
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--bg)] text-[var(--accent)] text-base"
          aria-hidden="true"
        >
          {expanded ? '\u2212' : '\u25B6'}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
            {expanded ? 'Practicing now' : 'Interactive practice'}
          </span>
          <span className="block text-base text-[var(--text-strong)] font-medium mt-0.5">
            {meta.title}
          </span>
          {meta.blurb && (
            <span className="block text-sm text-[var(--text-muted)] mt-0.5">
              {meta.blurb}
            </span>
          )}
        </span>
        <span className="flex-shrink-0 text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
          {expanded ? 'Hide' : 'Open'}
        </span>
      </button>

      {expanded && (
        <div className="mt-4">
          <DrillFrame mode="compact">
            <Core chapterNum={chapterNum} embedded />
          </DrillFrame>
        </div>
      )}
    </div>
  )
}
