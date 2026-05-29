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
        <div className="afl-eyebrow">Chapter 35 · Adjective Drill</div>
        <h1 className="afl-title">Where does the adjective go?</h1>
        <p className="afl-sub">
          English puts the adjective first: <em>big boat</em>. Tongan usually
          puts the noun first: <em>vaka lahi</em>. But a few adjectives break
          that rule and sit <em>before</em> the noun &mdash; <em>fuʻu fale</em>
          {' '}(a big house), <em>kiʻi tamasiʻi</em> (a small boy). Decide each
          one: does the describing word come after the noun, or before it?
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
          Five adjectives sit <em>before</em> the noun instead of after:
          {' '}<em>fuʻu</em> (big), <em>kiʻi</em> (little), <em>ʻuluaki</em>
          {' '}(first), <em>muʻaki</em> (former), <em>toe</em> (another). You
          can even stack one before and one after: <em>fuʻu fale lahi</em>
          {' '}(a very big house).
        </p>
      </aside>
    </div>
  )
}
