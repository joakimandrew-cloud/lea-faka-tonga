/**
 * ClusivityCorner page — standalone route at /clusivity.
 * Wraps ClusivityCornerCore with the page header and side lesson panel.
 */

import DrillFrame from '../drills/DrillFrame'
import ClusivityCornerCore from '../drills/ClusivityCornerCore'

export default function ClusivityCorner() {
  return (
    <div className="clu-page">
      <header className="clu-header">
        <div className="clu-eyebrow">Week 2 · Cultural Drill</div>
        <h1 className="clu-title">&ldquo;We&rdquo; has four meanings.</h1>
        <p className="clu-sub">
          English collapses all kinds of &ldquo;we&rdquo; into one word.
          Tongan splits them four ways &mdash; by whether the listener is
          included, and by whether there are two people or three-plus.
          Read the scenario. Pick the right form.
        </p>
      </header>

      <DrillFrame mode="full">
        <ClusivityCornerCore />
      </DrillFrame>

      <aside className="clu-lesson">
        <h2 className="clu-lesson-heading">Why four &ldquo;we&rdquo;s</h2>
        <p>
          English makes you guess from context which &ldquo;we&rdquo; a
          speaker means. Tongan makes you commit upfront. It turns a
          potential ambiguity into a social fact: is the listener one of
          us, or not? Am I talking about the two of us, or the group?
        </p>
        <p>
          This isn&rsquo;t a grammatical quirk &mdash; it&rsquo;s a
          cultural one. Polynesian languages foreground relationship
          information that English leaves implicit. Using the wrong
          &ldquo;we&rdquo; isn&rsquo;t just a mistake; it can
          accidentally exclude someone from the circle you meant to
          include them in.
        </p>
        <p className="clu-lesson-foot">
          When you hear an English &ldquo;we,&rdquo; train yourself to
          pause and ask: <em>which we?</em> Once that pause becomes
          automatic, the four forms land in the right places on their
          own.
        </p>
      </aside>
    </div>
  )
}
