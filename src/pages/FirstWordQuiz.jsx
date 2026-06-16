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
          rest reveals. Training this habit is one of the fastest ways to start
          listening in real time.
        </>
      }
      aside={
        <>
          <h2 className="pcs-lesson-heading">Why this drill matters</h2>
          <p>
            Tongan puts the grammar up front. The first word (or first little
            cluster) is usually a particle that already tells you what KIND of
            sentence is coming, before any of the content arrives. Training
            yourself to catch that opener and predict the clause type is one of
            the fastest routes to listening in real time instead of translating
            after the fact. (Good readers of any language predict as they go;
            this drill just builds the habit on the cues Tongan happens to put
            first.)
          </p>
          <p>
            Tongan branches sharply at word one: <em>ʻOku</em> opens a
            statement, <em>Ko e</em> opens an identification, <em>ʻOua</em> a
            prohibition. Catch the opener and you already know the frame; then
            the verb, its subject, and the rest of the words fill in the
            specifics.
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
