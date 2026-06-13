import { useCallback, useEffect, useRef, useState } from 'react'
import FlipCard from './FlipCard'

/**
 * VocabPracticeBlock — drop-in replacement for a chapter's "Words to Learn"
 * <table>. Renders a Table/Cards segmented toggle above the content.
 *
 * - Table view: the original markdown-rendered table (passed in as children).
 * - Cards view: a stacked-deck flip-card practice mode, scoped to the words in
 *   this table. Tongan-first or English-first via direction chips. Click the
 *   card (or press Space/Enter) to flip; arrow keys / Prev / Next to advance.
 *
 * The vocab rows come pre-extracted from rehype-table-labels via the
 * data-vocab-rows JSON property on the <table> hast node, so we don't have to
 * walk the React children tree to find them.
 */
export default function VocabPracticeBlock({ rows, tableClass, children }) {
  const [view, setView] = useState('table')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  // dir = which side faces up first. 'tongan' = Tongan front (default).
  const [dir, setDir] = useState('tongan')
  const sceneRef = useRef(null)

  const total = rows.length
  const card = rows[index] || rows[0]

  const goPrev = useCallback(() => {
    setFlipped(false)
    setIndex((i) => (i - 1 + total) % total)
  }, [total])

  const goNext = useCallback(() => {
    setFlipped(false)
    setIndex((i) => (i + 1) % total)
  }, [total])

  const flip = useCallback(() => setFlipped((f) => !f), [])

  // Keyboard nav only when the deck wrapper has focus, so chapter scrolling
  // with arrow keys still works elsewhere on the page.
  const onKeyDown = useCallback(
    (e) => {
      if (view !== 'cards') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        flip()
      }
    },
    [view, goPrev, goNext, flip]
  )

  // When the user switches into Cards view, focus the deck so keyboard nav
  // works without first having to click the card.
  useEffect(() => {
    if (view === 'cards' && sceneRef.current) {
      sceneRef.current.focus()
    }
  }, [view])

  if (!rows || rows.length === 0) {
    // No vocab rows extracted — bail out and render the original table only.
    return (
      <div className="ch-table-wrap overflow-x-auto my-4">
        <table className={`ch-table border-collapse ${tableClass || ''}`.trim()}>
          {children}
        </table>
      </div>
    )
  }

  const frontIsTongan = dir === 'tongan'
  const front = frontIsTongan ? card.tongan : card.english
  const back = frontIsTongan ? card.english : card.tongan
  const frontLabel = frontIsTongan ? 'Tongan' : 'English'
  const backLabel = frontIsTongan ? 'English' : 'Tongan'

  return (
    <div className="vp-wrap my-4">
      <div className="vp-toolbar">
        {view === 'table' && (
          <span className="vp-toolbar-hint">
            <span className="vp-toolbar-hint-icon" aria-hidden="true">↻</span>
            Click to practice with flip cards
            <span className="vp-toolbar-hint-arrow" aria-hidden="true">→</span>
          </span>
        )}
        <div className="vp-seg" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'table'}
            className={`vp-seg-btn${view === 'table' ? ' is-active' : ''}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'cards'}
            className={`vp-seg-btn${view === 'cards' ? ' is-active' : ''}`}
            onClick={() => setView('cards')}
          >
            Cards
          </button>
        </div>
      </div>

      {view === 'table' && (
        <div className="ch-table-wrap overflow-x-auto">
          <table className={`ch-table border-collapse ${tableClass || ''}`.trim()}>
            {children}
          </table>
        </div>
      )}

      {view === 'cards' && (
        <div className="vp-deck">
          <div
            className="x-deck"
            ref={sceneRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-label="Vocabulary flashcard. Press space to flip, arrow keys to navigate."
          >
            <FlipCard
              front={front}
              back={back}
              frontLabel={frontLabel}
              backLabel={backLabel}
              pos={card.type}
              frontIsTongan={frontIsTongan}
              flipped={flipped}
              onFlip={flip}
              peek
            />
          </div>

          <div className="vp-nav-row">
            <button type="button" className="x-nav" onClick={goPrev} aria-label="Previous card">
              ‹
            </button>
            <span className="x-counter" aria-live="polite">
              {index + 1} / {total}
            </span>
            <button type="button" className="x-nav" onClick={goNext} aria-label="Next card">
              ›
            </button>
          </div>

          <div className="vp-dir-row">
            <span className="vp-dir-label">Show first:</span>
            <button
              type="button"
              className={`x-chip${dir === 'tongan' ? ' is-active' : ''}`}
              onClick={() => {
                setDir('tongan')
                setFlipped(false)
              }}
            >
              Tongan
            </button>
            <button
              type="button"
              className={`x-chip${dir === 'english' ? ' is-active' : ''}`}
              onClick={() => {
                setDir('english')
                setFlipped(false)
              }}
            >
              English
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
