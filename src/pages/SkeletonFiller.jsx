/**
 * SkeletonFiller page — standalone route at /skeleton-filler.
 * Wraps SkeletonFillerCore with the page header and side lesson panel.
 */

import DrillFrame from '../drills/DrillFrame'
import SkeletonFillerCore from '../drills/SkeletonFillerCore'

export default function SkeletonFiller() {
  return (
    <div className="skf-page">
      <header className="skf-header">
        <div className="skf-eyebrow">Week 3 · Pattern Drill</div>
        <h1 className="skf-title">Fill the skeleton.</h1>
        <p className="skf-sub">
          Every Tongan sentence sits inside one of a handful of shapes.
          Here&rsquo;s an empty shape. The slots have roles. Pick words
          from the pool to fill them &mdash; the pattern tells you what
          goes where.
        </p>
      </header>

      <DrillFrame mode="full">
        <SkeletonFillerCore />
      </DrillFrame>

      <aside className="skf-lesson">
        <h2 className="skf-lesson-heading">The whole point</h2>
        <p>
          A Tongan sentence isn&rsquo;t a string of words that happen to
          line up. It&rsquo;s a shape with slots, and every conversational
          sentence fills one of a handful of these shapes. Learn the
          shapes, and the vocabulary just fills them.
        </p>
        <p>
          This is why fluent speakers never sound like they&rsquo;re
          translating word-by-word from English &mdash; they start from
          the pattern, not from the words.
        </p>
        <p className="skf-lesson-foot">
          Cycle through each pattern until the slot roles are obvious
          before you read the English prompt. That&rsquo;s the signal
          you&rsquo;ve internalized the shape.
        </p>
      </aside>
    </div>
  )
}
