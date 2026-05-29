import DrillFrame from '../drills/DrillFrame'
import AccentPlacementPickerCore from '../drills/AccentPlacementPickerCore'

export default function AccentPlacementPicker() {
  return (
    <div className="pcs-page">
      <header className="pcs-header">
        <div className="pcs-eyebrow">Chapter 44 · Accent Drill</div>
        <h1 className="pcs-title">Where does the accent fall?</h1>
        <p className="pcs-sub">
          The Tongan definitive accent (ʻ) signals &ldquo;end of the
          noun group&rdquo; — it lands on the last word of the phrase,
          not on the noun itself. Pick which word carries the accent
          and prove you can hear where one phrase ends and the next
          begins.
        </p>
      </header>

      <DrillFrame mode="full">
        <AccentPlacementPickerCore />
      </DrillFrame>

      <aside className="pcs-lesson">
        <h2 className="pcs-lesson-heading">The definitive accent rule</h2>
        <p>
          The accent marks the <strong>right edge of a noun group</strong>.
          If the noun is bare, it carries the accent itself:{' '}
          <em>ʻa e falé</em>. If a modifier follows, the accent shifts
          to that modifier: <em>ʻa e fale leléi</em>.
        </p>
        <p>
          <strong>What is NOT in the group.</strong> An adverb or time word
          such as <em>ʻaneafi</em> (yesterday) modifies the verb, not the
          noun, so it sits outside the group and takes no accent &mdash;
          unless a relative clause pulls it inside (<em>ki he fakataha naʻe
          fai ʻaneafí</em>). And an indefinite (<em>ha</em>) or semi-definite
          (<em>e / he</em>) group takes no definitive accent at all: only a
          fully definite group does.
        </p>
        <p>
          <strong>Why it matters.</strong> Without the accent, two noun
          groups can blur together. The accent is the boundary marker
          that lets the listener parse the sentence correctly.
        </p>
        <p className="pcs-lesson-foot">
          In spoken Tongan this is a pitch rise on the accented
          syllable. In writing it is the acute accent mark (´) on the
          final vowel of the final word in the phrase.
        </p>
      </aside>
    </div>
  )
}
