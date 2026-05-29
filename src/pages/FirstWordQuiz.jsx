/**
 * FirstWordQuiz page — standalone route at /first-word.
 * Wraps FirstWordQuizCore with the page header and side lesson panel.
 */

import DrillFrame from '../drills/DrillFrame'
import FirstWordQuizCore from '../drills/FirstWordQuizCore'

export default function FirstWordQuiz() {
  return (
    <div className="fwq-page">
      <header className="fwq-header">
        <div className="fwq-eyebrow">Sentence shape</div>
        <h1 className="fwq-title">The first word commits you.</h1>
        <p className="fwq-sub">
          See only the opening. Predict the shape of the sentence before the
          rest reveals. This is the reflex that separates a reader of Tongan
          from a fluent listener.
        </p>
      </header>

      <DrillFrame mode="full">
        <FirstWordQuizCore />
      </DrillFrame>

      <aside className="fwq-lesson">
        <h2 className="fwq-lesson-heading">Why this drill matters</h2>
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
        <p className="fwq-lesson-foot">
          Drill until you can name the pattern before the sentence even
          finishes rendering.
        </p>
      </aside>
    </div>
  )
}
