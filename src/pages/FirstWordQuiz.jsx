/**
 * FirstWordQuiz page — standalone route at /first-word.
 * Wraps FirstWordQuizCore in the shared DrillFrame (header + lesson aside).
 */

import DrillFrame from '../drills/DrillFrame'
import FirstWordQuizCore from '../drills/FirstWordQuizCore'
import { drillEyebrow } from '../drills/drill-eyebrow'

export default function FirstWordQuiz() {
  return (
    <DrillFrame
      backTo="/drills"
      eyebrow={drillEyebrow('first-word-quiz')}
      title="The first word commits you."
      blurb={
        <>
          See only the opening. Predict the shape of the sentence before the
          rest reveals. This is the reflex that separates a reader of Tongan
          from a fluent listener.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">Why this drill matters</h2>
          <p>
            Fluent Tongan speakers don&rsquo;t process a sentence left-to-right
            like an English speaker decoding words. They process it
            <em> pattern-first</em>: the opening particle (or particle cluster)
            tells them what shape of thought is coming. The rest of the
            sentence just fills slots.
          </p>
          <p>
            Tongan branches sharply at word one: <em>ʻOku</em> opens a
            statement, <em>Ko e</em> opens an identification, <em>ʻOua</em> a
            prohibition. Once you catch the opener, the rest of the sentence
            just fills slots.
          </p>
          <p className="pcs-lesson-foot">
            Drill until you can name the pattern before the sentence even
            finishes rendering.
          </p>
        </>
      }
    >
      <FirstWordQuizCore />
    </DrillFrame>
  )
}
