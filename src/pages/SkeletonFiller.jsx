/**
 * SkeletonFiller page — standalone route at /skeleton-filler.
 * Wraps SkeletonFillerCore in the shared DrillFrame (header + lesson aside).
 */

import DrillFrame from '../drills/DrillFrame'
import SkeletonFillerCore from '../drills/SkeletonFillerCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function SkeletonFiller() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('skeleton-filler')}
      title="Fill the skeleton."
      blurb={
        <>
          Every Tongan sentence sits inside one of a handful of shapes.
          Here&rsquo;s an empty shape. The slots have roles. Pick words
          from the pool to fill them: the pattern tells you what
          goes where.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">The whole point</h2>
          <p>
            A Tongan sentence isn&rsquo;t a string of words that happen to
            line up. It&rsquo;s a shape with slots. A small set of core
            shapes covers most everyday clauses; longer sentences combine
            and extend them, and some chapters teach word-building beyond
            slot-filling.
          </p>
          <p>
            What fills the slots matters less than the little marker in
            front of each one: in Tongan a word&rsquo;s job is signalled by
            that marker, not by its position. &#x02BB;E marks the doer,
            &#x02BB;a the one acted upon, so the noun phrases can even swap
            order without changing who did what.
          </p>
          <p className="pcs-lesson-foot">
            Cycle through each pattern until the slot roles are obvious
            before you read the English prompt. That&rsquo;s the signal
            you&rsquo;ve internalized the shape.
          </p>
        </>
      }
    >
      <SkeletonFillerCore />
    </DrillFrame>
  )
}
