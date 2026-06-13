/**
 * TenseSwapper page — standalone route at /tense-swap.
 * Wraps TenseSwapperCore in the shared DrillFrame (header + lesson aside).
 */

import DrillFrame from '../drills/DrillFrame'
import TenseSwapperCore from '../drills/TenseSwapperCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function TenseSwapper() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('tense-swapper')}
      title="Particles do the work."
      blurb={
        <>
          English conjugates the verb. Tongan swaps a particle and leaves the
          verb alone. Click through the tenses — watch the verb stay still.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">Notice what didn&rsquo;t change.</h2>
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
          <p className="pcs-lesson-foot">
            Drill one sentence until you can produce all eight forms out loud
            without looking. Then pick the next example and repeat.
          </p>
        </>
      }
    >
      <TenseSwapperCore />
    </DrillFrame>
  )
}
