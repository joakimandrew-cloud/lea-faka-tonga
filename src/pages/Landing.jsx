import { useRef } from 'react'
import { Link } from 'react-router-dom'
import '@fontsource/inter/700.css'
import '@fontsource/inter/900.css'
import LogoMark from '../components/LogoMark'
import HomeCoursePreview from '../components/HomeCoursePreview'
import HomeLessonArrow from '../components/HomeLessonArrow'
import CourseEntrance from '../components/CourseEntrance'
import courseCover from '../assets/course-entrance-cover.png'
import { BOOK_EPUB, BOOK_PDF } from '../lib/hero-cells.jsx'
import { NAV_LINKS } from '../lib/nav-links'
import { readPartner, supportUrl } from '../lib/partner-link'
import '../styles/learning-desk.css'
import '../styles/homepage-preview.css'

export default function Landing() {
  const openingRef = useRef(null)
  const titleRef = useRef(null)
  const ctaRef = useRef(null)
  const partner = readPartner()
  const supportHref = supportUrl()

  return (
    <CourseEntrance>{(replayEntrance, entranceComplete) => (
    <div className="learning-desk">
      <a className="ld-skip" href="#learning-desk-main">Skip to content</a>

      <header className="ld-header">
        <Link className="ld-brand" to="/" aria-label="Lea Faka-Tonga home">
          <LogoMark className="ld-brand-mark" />
          <span>Lea Faka-Tonga</span>
        </Link>
        <nav className="ld-nav" aria-label="Course sections">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to}>{link.label}</Link>
          ))}
        </nav>
      </header>

      <main id="learning-desk-main" tabIndex="-1">
        <section ref={openingRef} className="ld-opening ld-opening-doors" aria-labelledby="ld-home-title">
          <div className="ld-intro">
            <p className="ld-eyebrow">A complete course · 52 lessons</p>
            <h1 id="ld-home-title">Learn Tongan. <span ref={titleRef}>One sentence at a time.</span></h1>
            <p className="ld-lead">Try the interactive course, or keep all 52 lessons in the free book.</p>
          </div>

          <div className="ld-doors">
            <section className="ld-door ld-door-site" aria-labelledby="ld-door-site-title">
              <div className="ld-door-copy">
                <div className="xp-invitation">
                  <p className="ld-eyebrow">Website course · Free while we build it</p>
                  <div className="ld-door-actions">
                    <Link ref={ctaRef} className="ld-button ld-button-primary" to="/lessons/1" state={{ fromStart: true }}>Start Here</Link>
                  </div>
                </div>
                <h2 id="ld-door-site-title">Read a little. Try it yourself.</h2>
                <p className="ld-door-text">All 52 lessons from the book, plus interactive exercises, vocabulary cards and a comprehension quiz for every chapter.</p>
              </div>
              <HomeCoursePreview active={entranceComplete} />
              <p className="ld-door-note ld-door-site-note">
                <Link className="ld-secondary-link" to="/lessons">View all 52 lessons</Link>
                <span>Members-only later.</span>
              </p>
            </section>

            <section className="ld-door ld-door-book" aria-labelledby="ld-door-book-title">
              <div className="ld-door-visual" data-entrance-visual>
                <img className="ld-door-cover" src={courseCover} width="1222" height="1287" alt="Lea Faka-Tonga course box" />
                <span className="ld-door-visual-label" aria-hidden="true">52 lessons · PDF + EPUB</span>
              </div>
              <div className="ld-door-copy">
                <p className="ld-eyebrow">The book · Free forever</p>
                <h2 id="ld-door-book-title">Download the book</h2>
                <p className="ld-door-text">Download all 52 lessons as a PDF or EPUB. The book is yours to keep.</p>
                <div className="ld-door-actions ld-downloads">
                  <a href={BOOK_PDF} download>Download PDF</a>
                  <a href={BOOK_EPUB} download>Download EPUB</a>
                </div>
              </div>
            </section>
          </div>
          <HomeLessonArrow openingRef={openingRef} titleRef={titleRef} ctaRef={ctaRef} />
        </section>

      </main>

      <footer className="ld-footer">
        <a href={supportHref} target="_blank" rel="noopener noreferrer">
          {partner ? 'Support the work through your partner' : 'Support the work'}: $35+ keeps the site free for you, for life.
        </a>
        <Link to="/report">Spot a mistake? Tell us</Link>
        <button className="course-entrance-replay" type="button" onClick={replayEntrance}>Replay entrance</button>
      </footer>

    </div>
    )}</CourseEntrance>
  )
}
