/**
 * TenseSwapper page — standalone route at /tense-swap.
 * Wraps TenseSwapperCore with the page header and side lesson panel.
 */

import DrillFrame from '../drills/DrillFrame'
import TenseSwapperCore from '../drills/TenseSwapperCore'

export default function TenseSwapper() {
  return (
    <div className="tense-swap-page">
      <header className="tense-swap-header">
        <div className="tense-swap-eyebrow">Week 2 · Lesson 1</div>
        <h1 className="tense-swap-title">Particles do the work.</h1>
        <p className="tense-swap-sub">
          English conjugates the verb. Tongan swaps a particle and leaves the
          verb alone. Click through the tenses — watch the verb stay still.
        </p>
      </header>

      <DrillFrame mode="full">
        <TenseSwapperCore />
      </DrillFrame>

      <aside className="tense-swap-lesson">
        <h2 className="tense-swap-lesson-heading">Notice what didn&rsquo;t change.</h2>
        <p>
          In English, &ldquo;is going / went / has gone / will go&rdquo; uses
          four different verb forms. In Tongan, the verb <em>ʻalu</em> never
          moves &mdash; only the particle in front of it. That&rsquo;s the
          move. Every verb. Every sentence.
        </p>
        <p>
          Negation works the same way. Add <em>ʻikai ke</em> after the tense
          particle. The verb still doesn&rsquo;t change.
        </p>
        <p className="tense-swap-lesson-foot">
          Drill one sentence until you can produce all eight forms out loud
          without looking. Then pick the next example and repeat.
        </p>
      </aside>
    </div>
  )
}
