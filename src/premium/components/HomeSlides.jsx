import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DATA from '@app/data/sentence-frame-data.js'

// Four slides in place of the frame film (2026-11-17); they change by themselves every two seconds (his rulings the same day). Every Tongan sentence, its English and its part names are read
// from the film's own data file, src/data/sentence-frame-data.js; nothing Tongan is typed here. A slide names a lesson's row
// and which of its parts to mark.
const HEADING = Object.fromEntries(DATA.frame.columns.map(column => [column.key, column.heading]))
const row = lesson => DATA.frame.rows.find(item => item.lesson === lesson)
const BASE = new Set(['tense', 'pron', 'verb'])

const SLIDES = [
  { lesson: 1, title: 'One sentence, three parts.', note: 'A sentence from Lesson 1, and the three parts it is made of.', marked: () => true },
  { lesson: 2, title: 'Change one part.', note: 'Lesson 2 changes the tense marker, and the time of the sentence changes with it.', marked: part => part.shaded },
  { lesson: 4, title: 'Add detail.', note: 'By Lesson 4 the sentence also has an object, a modifier and a time word.', marked: part => !BASE.has(part.col) },
  { lesson: 9, title: 'Say what did not happen.', note: 'Lesson 9 adds the negative.', marked: part => part.shaded },
].map(slide => ({ ...slide, row: row(slide.lesson) }))

// Each slide holds for HOLD_MS and the set loops. It plays only while the slides are on screen, the tab is showing, nothing is
// hovering or focused inside, and the visitor has not taken over (a dot, an arrow or the pause button). Under reduced motion
// it never plays by itself.
export const HOLD_MS = 2000

export default function HomeSlides() {
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  const [held, setHeld] = useState(false)
  const [seen, setSeen] = useState(false)
  const [still, setStill] = useState(true)
  const host = useRef(null)
  const count = SLIDES.length
  const running = auto && !held && seen && !still

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const read = () => setStill(query.matches)
    read()
    query.addEventListener('change', read)
    return () => query.removeEventListener('change', read)
  }, [])

  useEffect(() => {
    const el = host.current
    if (!el || typeof IntersectionObserver !== 'function') return undefined
    const show = () => setSeen(inView.current && document.visibilityState === 'visible')
    const inView = { current: false }
    const observer = new IntersectionObserver(entries => { inView.current = entries.some(entry => entry.isIntersecting); show() }, { threshold: 0.5 })
    observer.observe(el)
    document.addEventListener('visibilitychange', show)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', show) }
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const timer = setTimeout(() => setActive(index => (index + 1) % count), HOLD_MS)
    return () => clearTimeout(timer)
  }, [running, active, count])

  // A choice by the visitor stops the cycle; the play button starts it again.
  const pick = index => { setAuto(false); setActive((index + count) % count) }

  return (
    <div className="home-slides" ref={host} role="group" aria-roledescription="carousel" aria-label="How a Tongan sentence grows, in four slides"
      onPointerEnter={event => { if (event.pointerType === 'mouse') setHeld(true) }} onPointerLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)} onBlurCapture={() => setHeld(false)}
      onKeyDown={event => {
        if (event.key === 'ArrowRight') { event.preventDefault(); pick(active + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); pick(active - 1) }
      }}>
      <div className="home-slides__stage" onPointerDown={event => { if (event.pointerType !== 'mouse') setAuto(false) }}>
        {SLIDES.map((slide, index) => (
          <article key={slide.lesson} className="home-slides__slide" data-active={index === active} aria-hidden={index !== active}
            role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}>
            <p className="home-slides__lesson">Lesson {slide.lesson} · {DATA.titles[slide.lesson]}</p>
            <p className="home-slides__sentence" lang="to">
              {slide.row.parts.map((part, partIndex) => (
                <span key={partIndex} className="home-slides__part" data-marked={slide.marked(part)}>
                  <span className="home-slides__label" lang="en">{HEADING[part.col]}</span>
                  <span className="home-slides__word">{part.text}</span>
                </span>
              ))}
            </p>
            <p className="home-slides__english">{slide.row.english}</p>
            <div className="home-slides__caption">
              <h3>{slide.title}</h3>
              <p>{slide.note}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="home-slides__controls">
        <div className="home-slides__dots">
          {SLIDES.map((slide, index) => (
            <button key={slide.lesson} type="button" className="home-slides__dot" aria-label={`Slide ${index + 1}: ${slide.title}`} aria-current={index === active ? 'true' : undefined} onClick={() => pick(index)}>
              {index === active && running && <span key={active} className="home-slides__fill" style={{ animationDuration: `${HOLD_MS}ms` }} />}
            </button>
          ))}
        </div>
        {!still && (
          <button type="button" className="home-slides__toggle" aria-label={auto ? 'Pause the slides' : 'Play the slides'} onClick={() => setAuto(value => !value)}>
            <span aria-hidden="true">{auto ? '❙❙' : '▶'}</span>
          </button>
        )}
        <p className="home-slides__count" aria-live={auto ? 'off' : 'polite'}>{active + 1} of {count}</p>
        <Link className="wr-home__more home-slides__next" to="/lessons/1">Start with Lesson 1 <span aria-hidden="true">›</span></Link>
        <div className="home-slides__arrows">
          <button type="button" className="home-slides__arrow" aria-label="Previous slide" onClick={() => pick(active - 1)}><span aria-hidden="true">‹</span></button>
          <button type="button" className="home-slides__arrow" aria-label="Next slide" onClick={() => pick(active + 1)}><span aria-hidden="true">›</span></button>
        </div>
      </div>
    </div>
  )
}
