/**
 * PossessiveSorter page — standalone route at /possessive-sort.
 *
 * Wraps PossessiveSorterCore in the shared DrillFrame (header + lesson aside).
 * The drill mechanic itself lives in src/drills/PossessiveSorterCore.jsx and is
 * also mounted in chapters via the drill registry + ChapterDrillAnchor.
 */

import DrillFrame from '../drills/DrillFrame'
import PossessiveSorterCore from '../drills/PossessiveSorterCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function PossessiveSorter() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('possessive-sorter')}
      title="The two classes of possession."
      blurb={
        <>
          Every Tongan noun belongs to one of two possessive classes.
          One principle covers most nouns, and a handful of
          assignments are simply learned per-noun. Sort each noun. Read
          the explanation. Repeat until it&rsquo;s automatic.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">The doer / receiver principle</h2>
          <p>
            <strong>e_class</strong> ("<em>ʻeku</em>") marks nouns you
            <em> make, use, control, or consume</em>. Tools, books,
            food, work, your animals.
          </p>
          <p>
            <strong>ho_class</strong> ("<em>hoku</em>") marks nouns that
            are <em>part of you</em>, or that surround, shelter, support,
            or define you. Body parts, relatives, clothes, houses, land.
          </p>
          <p>
            Some assignments are exceptions you simply learn. Parents and
            children flip to e_class (<em>ʻeku tamai</em>, my father).
            People you employ or who serve you, such as a doctor or a
            teacher, are also e_class (<em>ʻeku faiako</em>, my teacher).
          </p>
          <p className="pcs-lesson-foot">
            Don&rsquo;t try to memorize the whole list at once. Class is
            best learned per-noun, as you meet each word.
          </p>
        </>
      }
    >
      <PossessiveSorterCore />
    </DrillFrame>
  )
}
