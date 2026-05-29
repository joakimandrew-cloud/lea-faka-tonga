import DrillFrame from '../drills/DrillFrame'
import VerbalNounConverterCore from '../drills/VerbalNounConverterCore'

export default function VerbalNounConverter() {
  return (
    <div className="pcs-page">
      <header className="pcs-header">
        <div className="pcs-eyebrow">Chapter 45 · Verbal-Noun Drill</div>
        <h1 className="pcs-title">Convert the subject to a possessive.</h1>
        <p className="pcs-sub">
          When a verb phrase is nominalized (turned into a noun phrase),
          its subject becomes a possessive pronoun before the verbal
          noun. <em>Naʻá ne lau ʻa e tohí</em> (he read the book)
          becomes <em>ʻi heʻene lau ʻa e tohí</em> (when he read the
          book). Pick the right form for each pronoun.
        </p>
      </header>

      <DrillFrame mode="full">
        <VerbalNounConverterCore />
      </DrillFrame>

      <aside className="pcs-lesson">
        <h2 className="pcs-lesson-heading">Verbal noun possessives</h2>
        <p>
          <strong>The pattern.</strong> Subject pronoun + <em>he</em> +
          verbal noun becomes <em>heʻe + pronoun + verbal noun</em>.
          The contracted forms are: <em>heʻeku</em> (my), <em>heʻene</em>{' '}
          (his/her), <em>he ʻenau</em> (their) — note the space before
          plural <em>ʻenau</em>.
        </p>
        <p>
          <strong>Only two contract.</strong> First-person singular{' '}
          <em>ku</em> and third-person singular <em>ne</em> fuse with{' '}
          <em>he</em> into a single written word. All other pronouns
          keep a space: <em>he ʻenau, he ʻemau,</em> etc.
        </p>
        <p className="pcs-lesson-foot">
          The possessive class is always <em>he-</em> (ʻe-class) for
          verbal nouns, because the person doing the action is the one
          &ldquo;controlled by&rdquo; the action — never the receiver.
        </p>
      </aside>
    </div>
  )
}
