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
          There&rsquo;s no rule that covers all cases &mdash; you build
          intuition by feeling the philosophy. Sort each noun. Read the
          explanation. Repeat until it&rsquo;s automatic.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">The doer / receiver principle</h2>
          <p>
            <strong>e_class</strong> ("<em>ʻeku</em>") marks nouns where
            <em> you are the principal</em> &mdash; you do, make, use, or
            dominate them. Tools, books, food, your students, your children.
          </p>
          <p>
            <strong>ho_class</strong> ("<em>hoku</em>") marks nouns where
            <em> you are the associated party</em> &mdash; they exist
            independently. Parents, siblings, body parts, land, dwellings.
          </p>
          <p>
            The surprising cases (faiako, ika, moa) are what teach the rule.
            Once you see that &ldquo;my teacher&rdquo; is e_class because
            YOUR studentship is what creates the relationship, the
            philosophy clicks.
          </p>
          <p className="pcs-lesson-foot">
            Don&rsquo;t try to memorize lists. Feel which side of the line
            each noun sits on, and the paradigm will click into place within
            a week.
          </p>
        </>
      }
    >
      <PossessiveSorterCore />
    </DrillFrame>
  )
}
