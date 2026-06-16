import DrillFrame from '../drills/DrillFrame'
import CleftBuilderCore from '../drills/CleftBuilderCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function CleftBuilder() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('cleft-builder')}
      title="Build the cleft, tile by tile."
      blurb={
        <>
          A Tongan cleft sentence fronts the subject with <em>Ko</em> and
          echoes it inside the clause with a resumptive pronoun that matches
          the subject (<em>ne</em> for "he/she", <em>ku</em> for "I",{' '}
          <em>nau</em> for "they"…). The pattern:{' '}
          <em>Ko + subject + tense marker + pronoun + verb + object.</em>{' '}
          Pick the right tiles, in order (some tiles are traps).
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">How the cleft works</h2>
          <p>
            <strong>Standard order.</strong> <em>Naʻe kai ʻe Sione ʻa e mā</em>{' '}
            (verb leads, subject marked with <em>ʻe</em>).
          </p>
          <p>
            <strong>Cleft.</strong> <em>Ko Sione naʻá ne kai ʻa e mā</em>{' '}
            (<em>Ko</em> opens the identification; the subject moves to
            second position; <em>ne</em> (resumptive) holds its place
            inside the verb phrase).
          </p>
          <p>
            <strong>The accent on naʻá.</strong> Before a one-syllable
            resumptive pronoun (<em>ne</em>, <em>ku</em>, <em>ke</em>,{' '}
            <em>ma</em>), the past marker takes a definitive accent:{' '}
            <em>naʻá ne</em>, <em>naʻá ku</em>, never <em>naʻe</em>.
            Before a two-syllable pronoun (<em>nau</em>, <em>mau</em>,{' '}
            <em>tau</em>) it stays plain: <em>naʻa nau</em>,{' '}
            <em>naʻa mau</em>.
          </p>
          <p className="pcs-lesson-foot">
            Clefts appear in answered questions ("Who ate the bread?
            It was Sione who …") and in any sentence where you want to
            put the subject in focus.
          </p>
        </>
      }
    >
      <CleftBuilderCore />
    </DrillFrame>
  )
}
