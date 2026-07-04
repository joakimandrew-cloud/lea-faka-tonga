/**
 * DrillPage — one generic standalone route for every registered drill.
 *
 * Route: /drill/:id  (e.g. /drill/article-picker).
 *
 * Most of the ~50 drills in the registry have no bespoke page wrapper —
 * they only ever rendered embedded in a chapter via ChapterDrillAnchor.
 * This component surfaces any of them standalone: it looks the id up in
 * drillRegistry, renders a light header from meta.title/meta.blurb, and
 * mounts the Core in DrillFrame's full mode.
 *
 * No chapterNum is passed, so chapter-gated Cores (TenseSwapper,
 * FirstWordQuiz, SkeletonFiller) fall through their `!chapterNum` guard
 * and show their full, unfiltered deck — same contract the bespoke page
 * wrappers (src/pages/PossessiveSorter.jsx etc.) already rely on.
 *
 * The handful of drills that DO have a richer bespoke page (with a lesson
 * aside) keep their own route; the menu links those cards there instead.
 */

import { useParams, Navigate } from 'react-router-dom'
import DrillFrame from '../drills/DrillFrame'
import { drillRegistry } from '../drills/registry'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function DrillPage() {
  const { id } = useParams()
  const entry = drillRegistry[id]

  // Unknown id → bounce back to the menu rather than render a blank frame.
  if (!entry) return <Navigate to="/drills" replace />

  const { Core, meta } = entry

  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow(id)}
      title={meta.title}
      blurb={meta.blurb}
    >
      <Core />
    </DrillFrame>
  )
}
