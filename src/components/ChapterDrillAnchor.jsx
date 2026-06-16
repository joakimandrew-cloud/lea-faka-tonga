/**
 * ChapterDrillAnchor — the inline interactive-practice module embedded in the
 * chapter reading view.
 *
 * Rendered by BookChapterContent when remark-drill-anchors injects a
 * <chapter-drill-anchor data-drill-id="…"> node into the parsed tree.
 *
 * Always-open (owner ruling 2026-06-16, kickoff chapter-page-modernization):
 * the drill is just part of the page — no expand/collapse. A quiet "Interactive
 * practice" header (eyebrow + title + blurb) sits above the drill, which renders
 * inline inside the shared compact DrillFrame.
 */

import DrillFrame from '../drills/DrillFrame'
import { drillRegistry } from '../drills/registry'

export default function ChapterDrillAnchor({ drillId, chapterNum }) {
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
    <div className="my-8 chapter-drill-anchor border border-[var(--accent)]/30 bg-[var(--accent-faint)]/30 px-5 py-4">
      <div className="mb-4">
        <span className="block text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
          Interactive practice
        </span>
        <span className="block text-base text-[var(--text-strong)] font-medium mt-0.5">
          {meta.title}
        </span>
        {meta.blurb && (
          <span className="block text-sm text-[var(--text-muted)] mt-0.5">
            {meta.blurb}
          </span>
        )}
      </div>

      <DrillFrame mode="compact">
        <Core chapterNum={chapterNum} embedded />
      </DrillFrame>
    </div>
  )
}
