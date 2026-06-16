/**
 * AdjectiveFlip page — standalone route at /adjective-flip.
 * Wraps AdjectiveFlipCore in the shared DrillFrame (header + lesson aside).
 */

import DrillFrame from '../drills/DrillFrame'
import AdjectiveFlipCore from '../drills/AdjectiveFlipCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function AdjectiveFlip() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('adjective-flip')}
      title="Where does the adjective go?"
      blurb={
        <>
          English puts the adjective first: <em>big boat</em>. Tongan usually
          puts the noun first: <em>vaka lahi</em>. But a few adjectives break
          that rule and sit <em>before</em> the noun: <em>fuʻu fale</em>
          {' '}(a big house), <em>kiʻi tamasiʻi</em> (a small boy). Decide each
          one: does the describing word come after the noun, or before it?
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">Why reversing is hard</h2>
          <p>
            Word order is one of the deepest habits in a native language. You
            don&rsquo;t consciously decide &ldquo;adjective first&rdquo; in
            English: your mouth just does it. That same muscle tries
            to drive Tongan, and it pulls the wrong word to the front every
            time.
          </p>
          <p>
            Hearing <em>vaka lahi</em> and understanding it is easy; producing
            it without a pause is harder, and that gap closes mainly through
            active practice. That&rsquo;s what this drill is for.
          </p>
          <p className="pcs-lesson-foot">
            Five adjectives sit <em>before</em> the noun instead of after:
            {' '}<em>fuʻu</em> (big), <em>kiʻi</em> (little), <em>ʻuluaki</em>
            {' '}(first), <em>muʻaki</em> (former), <em>toe</em> (another). You
            can even stack one before and one after: <em>fuʻu fale lahi</em>
            {' '}(a very big house).
          </p>
        </>
      }
    >
      <AdjectiveFlipCore />
    </DrillFrame>
  )
}
