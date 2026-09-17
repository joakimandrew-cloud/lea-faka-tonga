import { useRef } from 'react'
import { Link } from 'react-router-dom'
import '@fontsource/inter/700.css'
import '@fontsource/inter/900.css'
import LogoMark from '../components/LogoMark'
import LearningDeskSample from '../components/LearningDeskSample'
import CourseEntrance from '../components/CourseEntrance'
import TopicLinks from '../components/TopicLinks'
import coverConcept from '../assets/learning-desk-cover-concept.png'
import { BOOK_EPUB, BOOK_PDF } from '../lib/hero-cells.jsx'
import { NAV_LINKS } from '../lib/nav-links'
import { readPartner, supportUrl } from '../lib/partner-link'
import '../styles/learning-desk.css'

export default function Landing() {
  const coverDialog = useRef(null)
  const coverButton = useRef(null)
  const partner = readPartner()
  const supportHref = supportUrl()

  function openCover() {
    coverDialog.current?.showModal()
  }

  function closeCover() {
    coverDialog.current?.close()
  }

  function restoreCoverFocus() {
    coverButton.current?.focus({ preventScroll: true })
  }

  return (
    <CourseEntrance>{replayEntrance => (
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
        <section className="ld-opening" aria-labelledby="ld-home-title">
          <div className="ld-intro">
            <p className="ld-eyebrow">A complete course · 52 lessons</p>
            <h1 id="ld-home-title">Learn Tongan. <span>One sentence at a time.</span></h1>
            <p className="ld-lead">Basic to Advanced, with explanations, practice, and feedback.</p>

            <div className="ld-start-block">
              <p className="ld-start-cue">New to Tongan? <strong>Start here.</strong></p>
              <svg className="ld-start-arrow" viewBox="0 0 224 82" aria-hidden="true" focusable="false">
                <path className="ld-arrow-ghost" d="M211 8 C181 3 167 25 144 38 C118 53 89 48 51 68" />
                <path d="M208 6 C177 4 166 27 142 40 C115 55 86 50 48 69" />
                <path d="M48 69 L63 54 M48 69 L69 72" />
              </svg>
              <div className="ld-actions">
                <Link className="ld-button ld-button-primary" to="/lessons/1" state={{ fromStart: true }}>
                  Start Lesson 1, free
                </Link>
                <Link className="ld-secondary-link" to="/lessons">View the course</Link>
              </div>
            </div>

            <section className="ld-book" aria-labelledby="ld-book-title">
              <button className="ld-cover-action" type="button" onClick={openCover} ref={coverButton} aria-haspopup="dialog">
                <img className="ld-book-cover" src={coverConcept} width="1047" height="1502" alt="Lea Faka-Tonga cover concept" />
                <span className="ld-cover-label">View cover concept</span>
              </button>
              <div className="ld-book-copy">
                <p className="ld-eyebrow">Current published book · Free forever</p>
                <h2 id="ld-book-title">Take the course with you.</h2>
                <p className="ld-book-note">Cover concept shown. The PDF and EPUB still use the current published cover.</p>
                <div className="ld-downloads">
                  <a href={BOOK_PDF} download>Download PDF</a>
                  <a href={BOOK_EPUB} download>Download EPUB</a>
                </div>
              </div>
            </section>

            <p className="ld-access">Free while we build it, members-only later.<br />The book stays free forever.</p>
          </div>

          <LearningDeskSample />
        </section>

        <section className="ld-learning" aria-labelledby="ld-loop-title">
          <div className="ld-learning-inner">
            <p className="ld-eyebrow">How you learn here</p>
            <h2 id="ld-loop-title">Read it. Try it. Understand it.</h2>
            <div className="ld-loop">
              <article><strong>01</strong><h3>Start with an explanation</h3><p>Read the pattern and see it in a sentence.</p></article>
              <article><strong>02</strong><h3>Put it into practice</h3><p>Choose an answer using what you just read.</p></article>
              <article><strong>03</strong><h3>See why it works</h3><p>Check the answer, read the explanation, and try again.</p></article>
            </div>
            <p className="ld-more-tools">
              Keep exploring: <Link to="/sentence-builder">Build a sentence</Link>
              <span aria-hidden="true"> · </span>
              <Link to="/quiz">Take the test</Link>
            </p>
          </div>
        </section>

        <section className="ld-topics" aria-label="Tongan language topics"><TopicLinks /></section>
      </main>

      <footer className="ld-footer">
        <a href={supportHref} target="_blank" rel="noopener noreferrer">
          {partner ? 'Support the work through your partner' : 'Support the work'}: $35+ keeps the site free for you, for life.
        </a>
        <Link to="/report">Spot a mistake? Tell us</Link>
        <button className="course-entrance-replay" type="button" onClick={replayEntrance}>Replay entrance</button>
      </footer>

      <dialog
        className="ld-cover-dialog"
        ref={coverDialog}
        aria-labelledby="ld-cover-dialog-title"
        onClose={restoreCoverFocus}
        onClick={event => { if (event.target === event.currentTarget) closeCover() }}
      >
        <div className="ld-cover-dialog-head">
          <div>
            <h2 id="ld-cover-dialog-title">Lea Faka-Tonga cover concept</h2>
            <p>The published PDF and EPUB still use the current cover.</p>
          </div>
          <button type="button" onClick={closeCover} aria-label="Close cover preview">Close</button>
        </div>
        <img src={coverConcept} width="1047" height="1502" alt="Lea Faka-Tonga cover concept shown at a larger size" />
      </dialog>
    </div>
    )}</CourseEntrance>
  )
}
