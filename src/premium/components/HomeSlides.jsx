import { useState } from 'react'
import { Link } from 'react-router-dom'
import DATA from '@app/data/sentence-frame-data.js'

// Four still slides in place of the frame film (2026-11-17). Every Tongan sentence, its English and its part names are read
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

export default function HomeSlides() {
  const [active, setActive] = useState(0)
  const last = SLIDES.length - 1
  const go = index => setActive(Math.max(0, Math.min(last, index)))

  return (
    <div className="home-slides" role="group" aria-roledescription="carousel" aria-label="How a Tongan sentence grows, in four slides"
      onKeyDown={event => {
        if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1) }
      }}>
      <div className="home-slides__stage">
        {SLIDES.map((slide, index) => (
          <article key={slide.lesson} className="home-slides__slide" data-active={index === active} aria-hidden={index !== active}
            role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${SLIDES.length}`}>
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
            <button key={slide.lesson} type="button" className="home-slides__dot" aria-label={`Slide ${index + 1}: ${slide.title}`} aria-current={index === active ? 'true' : undefined} onClick={() => go(index)} />
          ))}
        </div>
        <p className="home-slides__count" aria-live="polite">{active + 1} of {SLIDES.length}</p>
        <Link className="wr-home__more home-slides__next" to="/lessons/1">Start with Lesson 1 <span aria-hidden="true">›</span></Link>
        <div className="home-slides__arrows">
          <button type="button" className="home-slides__arrow" aria-label="Previous slide" disabled={active === 0} onClick={() => go(active - 1)}><span aria-hidden="true">‹</span></button>
          <button type="button" className="home-slides__arrow" aria-label="Next slide" disabled={active === last} onClick={() => go(active + 1)}><span aria-hidden="true">›</span></button>
        </div>
      </div>
    </div>
  )
}
