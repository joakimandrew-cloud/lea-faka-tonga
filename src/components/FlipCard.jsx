/**
 * FlipCard — the ONE shared flashcard, used by both the standalone /cards
 * deck (FlipCards.jsx) and the in-chapter "Words to Learn" deck
 * (VocabPracticeBlock.jsx), so a vocab card looks identical wherever it is
 * studied. (Before this, the two were separate fc-* / vp-* implementations
 * with different borders, fonts, sizes and aspect ratios — the inconsistency
 * the owner flagged.)
 *
 * Tactile-deck anatomy (rounded card, soft shadow, stacked-deck peek) driven
 * entirely by the app's real design tokens — no bespoke palette.
 *
 * Presentational + controlled: the parent owns index / flipped / direction
 * state and passes the current face values; clicking the card calls onFlip.
 */
export default function FlipCard({
  front,
  back,
  frontLabel = 'Tongan',
  backLabel = 'English',
  pos,
  frontIsTongan = true,
  flipped = false,
  onFlip,
  peek = true,
}) {
  return (
    <div className="xcard-scene" onClick={onFlip}>
      {peek && (
        <>
          <span className="xcard-peek p2" aria-hidden="true" />
          <span className="xcard-peek p1" aria-hidden="true" />
        </>
      )}
      <div className={`xcard${flipped ? ' is-flipped' : ''}`}>
        <div className="xcard-face">
          <span className="xcard-label">{frontLabel}</span>
          <span className={`xcard-word${frontIsTongan ? ' font-tongan' : ''}`}>{front}</span>
          {pos && <span className="xcard-pos">{pos}</span>}
          <span className="xcard-hint" aria-hidden="true">tap to flip</span>
        </div>
        <div className="xcard-face is-back">
          <span className="xcard-label">{backLabel}</span>
          <span className={`xcard-word${!frontIsTongan ? ' font-tongan' : ''}`}>{back}</span>
          {pos && <span className="xcard-pos">{pos}</span>}
        </div>
      </div>
    </div>
  )
}
