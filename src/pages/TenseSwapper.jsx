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
          verb alone. Click through the tenses, and watch the verb stay still.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">Notice what didn&rsquo;t change.</h2>
          <p>
            In English, &ldquo;is going / went / has gone / will go&rdquo; uses
            four different verb forms. In Tongan, the verb <em>ʻalu</em> stays
            put across the tenses: only the particle in front of it changes.
            (A handful of common verbs do change form for a dual or plural
            subject, e.g. <em>ʻalu</em> &rarr; <em>ō</em>,{' '}
            <em>haʻu</em> &rarr; <em>ō mai</em>, <em>nofo</em> &rarr;{' '}
            <em>nonofo</em>, but the tense itself never reshapes the stem.)
          </p>
          <p>
            Negation works the same way: put <em>ʻikai</em> after the tense
            particle. The link word that follows depends on what comes next,
            <em> ʻikai te</em> before a pronoun (<em>ʻOku ʻikai té u ʻalu</em>),{' '}
            <em>ʻikai ke</em> before a bare verb or a noun subject. The perfect
            negates with <em>teʻeki</em>, not <em>ʻikai</em>. The verb still
            doesn&rsquo;t change.
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
