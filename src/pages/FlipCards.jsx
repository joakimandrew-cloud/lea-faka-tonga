import { useState, useMemo, useCallback, useEffect } from 'react'
import vocabulary from '../data/book-vocabulary.json'
import { useIsTouchPrimary } from '../lib/terminal-picker-utils'
import { okinafy } from '../lib/okinafy'
import FlipCard from '../components/FlipCard'
import DeckComplete from '../drills/DeckComplete'
import { DrillEndLinks } from '../drills/drill-end-links'
import '../styles/v11-components.css'

const categories = [...new Set(vocabulary.map(v => v.category))].sort()

const tierLabels = { essential: 'Essential', useful: 'Useful', all: 'All' }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlipCards() {
  const [category, setCategory] = useState('all')
  const [tier, setTier] = useState('essential')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [shuffleOrder, setShuffleOrder] = useState(null)
  // UX-09 (2026-09-03): the counter used to read 210 / 210 and then wrap to 1
  // with nothing said. The deck ends now.
  const [finished, setFinished] = useState(false)

  const filtered = useMemo(() => {
    let base = vocabulary

    // Apply tier filter
    if (tier === 'essential') base = base.filter(v => v.tier === 1)
    else if (tier === 'useful') base = base.filter(v => v.tier <= 2)

    // Apply category filter
    if (category !== 'all') base = base.filter(v => v.category === category)

    // Apply shuffle
    if (shuffled && shuffleOrder) {
      const ids = new Set(base.map(v => v.id))
      return shuffleOrder.filter(v => ids.has(v.id))
    }
    return base
  }, [category, tier, shuffled, shuffleOrder])

  const card = filtered[index]

  const handleCategoryChange = useCallback((val) => {
    setCategory(val)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [])

  const handleTierChange = useCallback((val) => {
    setTier(val)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [])

  const handleShuffle = useCallback(() => {
    if (shuffled) {
      setShuffled(false)
      setShuffleOrder(null)
    } else {
      setShuffleOrder(shuffle(vocabulary))
      setShuffled(true)
    }
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }, [shuffled])

  const handlePrev = useCallback(() => {
    setFlipped(false)
    setIndex(i => (i > 0 ? i - 1 : filtered.length - 1))
  }, [filtered.length])

  const handleNext = useCallback(() => {
    setFlipped(false)
    // The last card ends the deck instead of silently starting it again.
    if (index >= filtered.length - 1) {
      setFinished(true)
      return
    }
    setIndex(i => i + 1)
  }, [filtered.length, index])

  const handleDeckAgain = useCallback(() => {
    setFinished(false)
    setIndex(0)
    setFlipped(false)
  }, [])

  const handleFlip = useCallback(() => {
    setFlipped(f => !f)
  }, [])

  // Window-level keyboard listener so the advertised shortcuts work without
  // the container needing focus first (same approach as PickerCore). Skips
  // form fields, and lets Space/Enter on focused buttons keep their native
  // click behavior instead of also flipping the card.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return
      if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'ArrowRight') handleNext()
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleFlip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlePrev, handleNext, handleFlip])

  const isTouch = useIsTouchPrimary()

  if (!card) {
    return (
      <div className="flip-cards">
        <div className="fc-empty">No vocabulary items found.</div>
      </div>
    )
  }

  // Display-only fakauʻa normalization — the underlying data stays ASCII
  // (DECISIONS.md 2026-06-20 storage rule; site-analysis fix #3).
  const tonganFace = okinafy(card.tongan)
  const front = reversed ? card.english : tonganFace
  const back = reversed ? tonganFace : card.english
  const frontLabel = reversed ? 'English' : 'Tongan'
  const backLabel = reversed ? 'Tongan' : 'English'

  return (
    <div className="flip-cards">

      {/* UX-12: /cards was the one practice surface with no heading at all, so
          the nav said Cards, the breadcrumb said Flip Cards and the page said
          nothing. Same Barlow Condensed uppercase and red middot as the
          /drills and /quizzes headings, sized for the reading column. */}
      <h1 className="fc-heading">Cards <span className="dot">&middot;</span> Vocab</h1>

      {/* Toolbar: tier chips + category + direction, counter right */}
      <div className="fc-toolbar">
        <div className="fc-filters">
          {['essential', 'useful', 'all'].map(t => (
            <button
              key={t}
              onClick={() => handleTierChange(t)}
              className={`x-chip${tier === t ? ' is-active' : ''}`}
            >
              {tierLabels[t]}
            </button>
          ))}
          <select
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="x-select"
          >
            <option value="all">All categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            onClick={() => setReversed(r => !r)}
            className={`x-chip${reversed ? ' is-active' : ''}`}
          >
            {reversed ? 'English \u2192 Tongan' : 'Tongan \u2192 English'}
          </button>
        </div>
        <span className="fc-counter">
          {String(index + 1).padStart(3, '0')} / {String(filtered.length).padStart(3, '0')}
        </span>
      </div>

      {finished ? (
        /* UX-09: the end of the deck, on the same card the drills end on.
           The links context is supplied here because /cards renders outside
           DrillFrame; there is no lesson behind a vocabulary deck, so the one
           exit is the drills board. */
        <DrillEndLinks.Provider value={{ backTo: '/drills' }}>
          <section className="pcs-card">
            <DeckComplete
              right={filtered.length}
              total={filtered.length}
              unit="cards"
              message="That is the whole deck at this filter."
              onAgain={handleDeckAgain}
              againLabel="Start again →"
            />
          </section>
        </DrillEndLinks.Provider>
      ) : (
        <>
      {/* Card — the shared FlipCard (identical to the in-chapter deck) */}
      <FlipCard
        front={front}
        back={back}
        frontLabel={frontLabel}
        backLabel={backLabel}
        pos={card.part_of_speech}
        frontIsTongan={!reversed}
        flipped={flipped}
        onFlip={handleFlip}
        peek
      />

      {/* Controls */}
      <div className="fc-controls">
        <button className="x-nav" onClick={handlePrev}>‹ Prev</button>
        <button
          className={`x-chip${shuffled ? ' is-active' : ''}`}
          onClick={handleShuffle}
        >
          ⇄ Shuffle
        </button>
        <button className="x-nav" onClick={handleNext}>Next ›</button>
      </div>

      {/* Keyboard hint (pointless on touch devices, so hidden there) */}
      {!isTouch && (
        <div className="x-hint">Arrow keys to navigate · Space to flip</div>
      )}
        </>
      )}

    </div>
  )
}
