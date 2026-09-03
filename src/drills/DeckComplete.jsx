/**
 * DeckComplete — the one end-of-deck card every drill finishes on.
 *
 * Added 2026-09-03 for UX-09. Thirteen hand-built drills had no end at all:
 * a learner who reached 15 of 15 was reshuffled and put back at 1 with no
 * word said, and the cards deck wrapped from 210 to 1 the same way. The
 * PickerCore pickers did end, on a "Deck complete" card, but that card
 * pointed nowhere: not back to the lesson the drill belongs to and not on to
 * another drill.
 *
 * So this is PickerCore's own card, lifted out unchanged in look, plus the two
 * exits. The exits come from DrillEndLinks, which DrillFrame provides on a
 * standalone drill page and deliberately does not provide in a chapter (a
 * learner reading Lesson 7 should not be shown the door out of it). Nothing
 * new in the visual language: .pcs-noun-frame, .pcs-next-container, .pcs-next
 * and .pcs-reset are the classes the pickers already use.
 */

import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { DrillEndLinks } from './drill-end-links'

export default function DeckComplete({
  right,
  total,
  onAgain,
  againLabel = 'Go again →',
  onFresh,
  freshLabel = 'start fresh',
  message,
  hint = null,
  /* What the count counts. The drills score answers; the cards deck counts
     cards, and calling those "correct" would be a lie. */
  unit = 'correct',
}) {
  const links = useContext(DrillEndLinks)
  const perfect = total > 0 && right === total
  const body = message ?? (perfect
    ? 'Perfect: every answer right.'
    : 'You made it through the whole deck.')

  return (
    <>
      <div className="pcs-noun-frame">
        <div className="pcs-prompt-label">Deck complete</div>
        <div className="pcs-noun">{right} / {total} {unit}</div>
        <div className="pcs-noun-gloss">{body}</div>
      </div>
      <div className="pcs-next-container pcs-end-row">
        {hint}
        {links?.lessonNum && (
          <Link to={`/lessons/${links.lessonNum}`} className="pcs-end-link">
            Back to Lesson {links.lessonNum}
          </Link>
        )}
        {links?.backTo && (
          <Link to={links.backTo} className="pcs-end-link">
            All drills
          </Link>
        )}
        {onFresh && (
          <button onClick={onFresh} className="pcs-reset" type="button">
            {freshLabel}
          </button>
        )}
        <button onClick={onAgain} className="pcs-next" type="button">
          {againLabel}
        </button>
      </div>
    </>
  )
}
