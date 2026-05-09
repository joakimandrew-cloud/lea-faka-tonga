import DrillFrame from '../drills/DrillFrame'
import DefinitenessFlipCore from '../drills/DefinitenessFlipCore'

export default function DefinitenessFlip() {
  return (
    <div className="pcs-page">
      <header className="pcs-header">
        <div className="pcs-eyebrow">Chapter 19 · Ergative Pivot Drill</div>
        <h1 className="pcs-title">Toggle &ldquo;some&rdquo; ↔ &ldquo;the.&rdquo;</h1>
        <p className="pcs-sub">
          Tongan&rsquo;s most surprising structural moment: changing one
          English word (&ldquo;some&rdquo; ↔ &ldquo;the&rdquo;) rebuilds the
          entire Tongan sentence. An indefinite object fuses with the verb
          and takes an <em>ʻa</em>-subject; a definite object splits off and
          takes an <em>ʻe</em>-subject. Toggle the flip and watch it happen
          in real time.
        </p>
      </header>

      <DrillFrame mode="full">
        <DefinitenessFlipCore />
      </DrillFrame>

      <aside className="pcs-lesson">
        <h2 className="pcs-lesson-heading">The definiteness pivot</h2>
        <p>
          <strong>Indefinite object.</strong> The verb and noun fuse into
          a compound predicate. Subject is marked with <em>ʻa</em>:{' '}
          <em>Naʻe kai mā ʻa Sione</em> (Sione ate bread).
        </p>
        <p>
          <strong>Definite object.</strong> The object splits away from
          the verb and is marked with <em>ʻa e</em>. Subject shifts to{' '}
          <em>ʻe</em>: <em>Naʻe kai ʻe Sione ʻa e mā</em> (Sione ate
          the bread).
        </p>
        <p className="pcs-lesson-foot">
          This is the ergative pivot — the same pattern that shows up in
          all transitive clauses from Chapter 19 onward. Master the flip
          here and every later chapter clicks into place.
        </p>
      </aside>
    </div>
  )
}
