import DrillFrame from '../drills/DrillFrame'
import EmotionalArticleMatrixCore from '../drills/EmotionalArticleMatrixCore'

export default function EmotionalArticleMatrix() {
  return (
    <div className="pcs-page">
      <header className="pcs-header">
        <div className="pcs-eyebrow">Chapter 52 · Article Matrix Drill</div>
        <h1 className="pcs-title">Definite × emotional.</h1>
        <p className="pcs-sub">
          Tongan has four article forms that cross two axes: neutral vs
          emotional, definite vs indefinite. <em>e</em> / <em>he</em>{' '}
          (the), <em>ha</em> (a/some), <em>siʻi</em> (the poor/dear),{' '}
          <em>siʻa</em> (a poor/dear). Read the scenario and pick the
          right cell.
        </p>
      </header>

      <DrillFrame mode="full">
        <EmotionalArticleMatrixCore />
      </DrillFrame>

      <aside className="pcs-lesson">
        <h2 className="pcs-lesson-heading">The 2×2 article system</h2>
        <p>
          <strong>Neutral + definite:</strong> <em>e</em> (pre-vocalic:
          <em> he</em>) — plain &ldquo;the.&rdquo;
        </p>
        <p>
          <strong>Neutral + indefinite:</strong> <em>ha</em> — &ldquo;a,
          some.&rdquo; Used where English would use the indefinite article
          or no article at all.
        </p>
        <p>
          <strong>Emotional + definite:</strong> <em>siʻi</em> —
          &ldquo;the poor/dear X.&rdquo; Speaker expresses sympathy,
          affection, or mild pity toward a specific referent.
        </p>
        <p>
          <strong>Emotional + indefinite:</strong> <em>siʻa</em> —
          &ldquo;a poor/dear X.&rdquo; Same emotional charge, but the
          referent is not previously identified.
        </p>
        <p className="pcs-lesson-foot">
          The emotional articles are not interchangeable with neutral
          ones — they shift the speaker&rsquo;s stance, not just the
          noun&rsquo;s reference.
        </p>
      </aside>
    </div>
  )
}
