import DrillFrame from '../drills/DrillFrame'
import CleftBuilderCore from '../drills/CleftBuilderCore'

export default function CleftBuilder() {
  return (
    <div className="pcs-page">
      <header className="pcs-header">
        <div className="pcs-eyebrow">Chapter 36 · Cleft-Sentence Drill</div>
        <h1 className="pcs-title">Build the cleft, tile by tile.</h1>
        <p className="pcs-sub">
          A Tongan cleft sentence fronts the subject with <em>Ko</em> and
          echoes it inside the clause with a resumptive pronoun that matches
          the subject (<em>ne</em> for "he/she", <em>ku</em> for "I",{' '}
          <em>nau</em> for "they"…). The pattern:{' '}
          <em>Ko + subject + tense marker + pronoun + verb + object.</em>{' '}
          Pick the right tiles, in order &mdash; some tiles are traps.
        </p>
      </header>

      <DrillFrame mode="full">
        <CleftBuilderCore />
      </DrillFrame>

      <aside className="pcs-lesson">
        <h2 className="pcs-lesson-heading">How the cleft works</h2>
        <p>
          <strong>Standard order.</strong> <em>Naʻe kai ʻe Sione ʻa e mā</em>{' '}
          — verb leads, subject marked with <em>ʻe</em>.
        </p>
        <p>
          <strong>Cleft.</strong> <em>Ko Sione naʻá ne kai ʻa e mā</em>{' '}
          — <em>Ko</em> opens the identification; the subject moves to
          second position; <em>ne</em> (resumptive) holds its place
          inside the verb phrase.
        </p>
        <p>
          <strong>The accent on naʻá.</strong> Before a pronoun, the
          tense marker carries a definitive accent: <em>naʻá ne</em>,
          not <em>naʻe ne</em>.
        </p>
        <p className="pcs-lesson-foot">
          Clefts appear in answered questions ("Who ate the bread? —
          It was Sione who …") and in any sentence where you want to
          put the subject in focus.
        </p>
      </aside>
    </div>
  )
}
