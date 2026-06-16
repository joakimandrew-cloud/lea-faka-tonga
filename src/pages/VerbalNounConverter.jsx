import DrillFrame from '../drills/DrillFrame'
import VerbalNounConverterCore from '../drills/VerbalNounConverterCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function VerbalNounConverter() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('verbal-noun-converter')}
      title="Convert the subject to a possessive."
      blurb={
        <>
          When a verb phrase is nominalized (turned into a noun phrase),
          its subject becomes a possessive pronoun before the verbal
          noun. <em>Naʻá ne lau ʻa e tohí</em> (he read the book)
          becomes <em>ʻi heʻene lau ʻa e tohí</em> (when he read the
          book). Pick the right form for each pronoun.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">Verbal noun possessives</h2>
          <p>
            <strong>The pattern.</strong> Subject pronoun + <em>he</em> +
            verbal noun becomes <em>heʻe + pronoun + verbal noun</em>.
            The contracted forms are: <em>heʻeku</em> (my), <em>heʻene</em>{' '}
            (his/her), <em>he ʻenau</em> (their), noting the space before
            plural <em>ʻenau</em>.
          </p>
          <p>
            <strong>Only two contract.</strong> First-person singular{' '}
            <em>ku</em> and third-person singular <em>ne</em> fuse with{' '}
            <em>he</em> into a single written word. All other pronouns
            keep a space: <em>he ʻenau, he ʻemau,</em> etc.
          </p>
          <p className="pcs-lesson-foot">
            <strong>Which class?</strong> The class follows whether the
            possessor is the <em>doer</em> or the <em>object</em> of the
            underlying verb. When the possessor does the action, use the
            ʻe-class: <em>heʻene lau</em> (his reading, the reading he
            does). When the possessor is what is acted on, use the
            ho-class: <em>hoku tokoni ʻe Sēmisi</em> (my being helped by
            Sēmisi).
          </p>
        </>
      }
    >
      <VerbalNounConverterCore />
    </DrillFrame>
  )
}
