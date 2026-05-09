import DrillFrame from '../drills/DrillFrame'
import ReciprocityPickerCore from '../drills/ReciprocityPickerCore'

export default function ReciprocityPicker() {
  return (
    <div className="pcs-page">
      <header className="pcs-header">
        <div className="pcs-eyebrow">Chapter 49 · Reciprocal-Verb Drill</div>
        <h1 className="pcs-title">Build the fe-…-ʻaki form.</h1>
        <p className="pcs-sub">
          Reciprocal verbs in Tongan wrap the base verb in a{' '}
          <em>fe-</em> prefix and an <em>-ʻaki</em> suffix:{' '}
          <em>feʻofoʻofaniʻaki</em> (love one another). The challenge
          is choosing the right base form and assembling the sandwich
          correctly. Pick it.
        </p>
      </header>

      <DrillFrame mode="full">
        <ReciprocityPickerCore />
      </DrillFrame>

      <aside className="pcs-lesson">
        <h2 className="pcs-lesson-heading">The reciprocal sandwich</h2>
        <p>
          <strong>Structure.</strong> <em>fe-</em> + verb stem +{' '}
          <em>-ʻaki</em>. The <em>fe-</em> prefix signals mutual
          action; <em>-ʻaki</em> signals the instrument or means —
          together they mean &ldquo;X and Y do [verb] to each other.&rdquo;
        </p>
        <p>
          <strong>Reduplicated stems.</strong> Many reciprocal verbs
          use a reduplicated base (<em>ʻofoʻofa</em> → <em>feʻofoʻofaniʻaki</em>).
          The reduplication is part of the stem, not added by the
          reciprocal morphology.
        </p>
        <p className="pcs-lesson-foot">
          The subject of a reciprocal verb must be plural — it takes at
          least two participants to have reciprocal action. Singular
          subjects are ungrammatical with <em>fe-…-ʻaki</em> forms.
        </p>
      </aside>
    </div>
  )
}
