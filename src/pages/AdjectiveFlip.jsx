/**
 * AdjectiveFlip page — standalone route at /adjective-flip.
 * Wraps AdjectiveFlipCore with the page header and side lesson panel.
 */

import DrillFrame from '../drills/DrillFrame'
import AdjectiveFlipCore from '../drills/AdjectiveFlipCore'

export default function AdjectiveFlip() {
  return (
    <div className="afl-page">
      <header className="afl-header">
        <div className="afl-eyebrow">Week 4 · Trap Drill</div>
        <h1 className="afl-title">The noun leads.</h1>
        <p className="afl-sub">
          English puts the adjective first: <em>big boat</em>. Tongan puts
          the noun first: <em>vaka lahi</em>. Your English reflex will push
          the adjective to the front &mdash; drill until you reverse it
          without thinking.
        </p>
      </header>

      <DrillFrame mode="full">
        <AdjectiveFlipCore />
      </DrillFrame>

      <aside className="afl-lesson">
        <h2 className="afl-lesson-heading">Why reversing is hard</h2>
        <p>
          Word order is one of the deepest habits in a native language. You
          don&rsquo;t consciously decide &ldquo;adjective first&rdquo; in
          English &mdash; your mouth just does it. That same muscle tries
          to drive Tongan, and it pulls the wrong word to the front every
          time.
        </p>
        <p>
          The only fix is repeated, active production. Hearing
          <em> vaka lahi</em> and understanding it is trivial; producing it
          without a pause takes a few hundred reps. That&rsquo;s what this
          drill is for.
        </p>
        <p className="afl-lesson-foot">
          When you can build a two-word phrase without stopping to think,
          you&rsquo;re ready for stacked adjectives &mdash; <em>fale foʻou
          lahi</em> (big new house). Same rule, more slots.
        </p>
      </aside>
    </div>
  )
}
