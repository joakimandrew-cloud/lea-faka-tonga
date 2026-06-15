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
            line up. It&rsquo;s a shape with slots, and every conversational
            sentence fills one of a handful of these shapes. Learn the
            shapes, and the vocabulary just fills them.
          </p>
          <p>
            This is why fluent speakers never sound like they&rsquo;re
            translating word-by-word from English: they start from
            the pattern, not from the words.
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
