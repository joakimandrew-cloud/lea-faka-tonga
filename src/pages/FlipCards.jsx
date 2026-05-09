import { useState, useMemo, useCallback } from 'react'
import vocabulary from '../data/book-vocabulary.json'
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

function formatCount(n) {
  return n.toLocaleString()
}

export default function FlipCards() {
  const [category, setCategory] = useState('all')
  const [tier, setTier] = useState('essential')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(false)
  const [shuffled, setShuffled] = useState(false)
  const [shuffleOrder, setShuffleOrder] = useState(null)

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
  }, [])

  const handleTierChange = useCallback((val) => {
    setTier(val)
    setIndex(0)
    setFlipped(false)
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
  }, [shuffled])

  const handlePrev = useCallback(() => {
    setFlipped(false)
    setIndex(i => (i > 0 ? i - 1 : filtered.length - 1))
  }, [filtered.length])

  const handleNext = useCallback(() => {
    setFlipped(false)
    setIndex(i => (i < filtered.length - 1 ? i + 1 : 0))
  }, [filtered.length])

  const handleFlip = useCallback(() => {
    setFlipped(f => !f)
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') handlePrev()
    else if (e.key === 'ArrowRight') handleNext()
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleFlip()
    }
  }, [handlePrev, handleNext, handleFlip])

  // Count words per tier for the current category
  const tierCounts = useMemo(() => {
    const inCategory = category === 'all'
      ? vocabulary
      : vocabulary.filter(v => v.category === category)
    return {
      essential: inCategory.filter(v => v.tier === 1).length,
      useful: inCategory.filter(v => v.tier <= 2).length,
      all: inCategory.length
    }
  }, [category])

  if (!card) {
    return (
      <div className="flip-cards">
        <div className="fc-empty">No vocabulary items found.</div>
      </div>
    )
  }

  const front = reversed ? card.english : card.tongan
  const back = reversed ? card.tongan : card.english
  const frontLabel = reversed ? 'English' : 'Tongan'
  const backLabel = reversed ? 'Tongan' : 'English'

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} className="flip-cards">

      {/* Toolbar: tier chips + category + direction, counter right */}
      <div className="fc-toolbar">
        <div className="fc-filters">
          {['essential', 'useful', 'all'].map(t => (
            <button
              key={t}
              onClick={() => handleTierChange(t)}
              className={`fc-chip${tier === t ? ' is-active' : ''}`}
            >
              {tierLabels[t]}
            </button>
          ))}
          <select
            value={category}
            onChange={e => handleCategoryChange(e.target.value)}
            className="fc-select"
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
            className={`fc-btn${reversed ? ' is-active' : ''}`}
          >
            {reversed ? 'English \u2192 Tongan' : 'Tongan \u2192 English'}
          </button>
        </div>
        <span className="fc-counter">
          {String(index + 1).padStart(3, '0')} / {String(filtered.length).padStart(3, '0')}
        </span>
      </div>

      {/* Card */}
      <div className="fc-card-scene" onClick={handleFlip}>
        <div className={`fc-card-inner${flipped ? ' is-flipped' : ''}`}>
          {/* Front */}
          <div className="fc-card-face">
            {card.part_of_speech && (
              <span className="fc-cat">{card.part_of_speech}</span>
            )}
            <span className="fc-face-label">{frontLabel}</span>
            <span className="fc-word">{front}</span>
            <span className="fc-flip">↻ flip</span>
          </div>

          {/* Back */}
          <div className="fc-card-face is-back">
            <span className="fc-face-label">{backLabel}</span>
            <span className="fc-meaning">{back}</span>
            {card.part_of_speech && (
              <span className="fc-pos">{card.part_of_speech}</span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="fc-controls">
        <button className="fc-btn-nav" onClick={handlePrev}>‹ Prev</button>
        <button
          className={`fc-btn${shuffled ? ' is-active' : ''}`}
          onClick={handleShuffle}
        >
          ⇄ Shuffle
        </button>
        <button className="fc-btn-nav" onClick={handleNext}>Next ›</button>
      </div>

      {/* Keyboard hint */}
      <div className="fc-hint">Arrow keys to navigate · Space to flip</div>

    </div>
  )
}
