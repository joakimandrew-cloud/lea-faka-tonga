import { Link } from 'react-router-dom'
import LogoMark from '@app/components/LogoMark.jsx'
import { PDF_URL, EPUB_URL } from '../components/Chrome.jsx'
import { useTitle } from '../lib/title.js'
import HomePatternBand from '../components/HomePatternBand.jsx'
import HomeSentenceDemo from '../components/HomeSentenceDemo.jsx'
import HomePracticePreview from '../components/HomePracticePreview.jsx'
import '../styles/white-red-home.css'
import '../styles/home-practice-film.css'

export default function Home() {
  useTitle('Build your first Tongan sentence')

  return (
    <div className="wr-home">
      <section className="wr-home__hero">
        <div className="wr-home__hero-inner">
          <div className="wr-home__hero-copy">
            <p className="wr-home__eyebrow">A complete 52-lesson Tongan course</p>
            <h1>Build your first<br />Tongan sentence.</h1>
            <p className="wr-home__hero-lede">See how the words fit together, change one part, and understand what changed. Begin with the real pattern from Lesson 1.</p>
            <div className="wr-home__hero-action">
              <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <span aria-hidden="true">→</span></Link>
              <p className="wr-home__access-note">All 52 lessons and practice tools are free.</p>
            </div>
            <p className="wr-home__book-route">Prefer the book? <a href={PDF_URL}>Download the free PDF</a> or <a href={EPUB_URL}>EPUB</a>. Free forever, with lifetime updates.</p>
          </div>
          <figure className="wr-home__hero-book">
            <div className="wr-home__book-halo" aria-hidden="true" />
            <img src="/cover-round8-red-3d.webp" alt="The red Lea Faka-Tonga book, shown standing upright" width="900" height="1248" />
            <figcaption>The whole course is also available as a free book.</figcaption>
          </figure>
        </div>
      </section>

      <HomePatternBand />

      <section className="wr-home__sentence" aria-labelledby="wr-sentence-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">A preview of what you’ll learn</p>
          <h2 id="wr-sentence-heading">One pattern. So many possibilities.</h2>
          <p>Watch the opening words change the tense. Try another sentence to change who, the action, or how someone feels.</p>
        </div>
        <HomeSentenceDemo />
      </section>

      <section className="wr-home__practice" aria-labelledby="wr-practice-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">Learn, then use it</p>
          <h2 id="wr-practice-heading">The website turns each lesson into practice.</h2>
          <p>See drills, quizzes and flip cards in action. A quick look at how you’ll practise.</p>
        </div>
        <HomePracticePreview />
      </section>

      <section className="wr-home__path" aria-labelledby="wr-path-heading">
        <div className="wr-home__path-heading">
          <p className="wr-home__eyebrow">A clear way through the course</p>
          <h2 id="wr-path-heading">Start with the sentence. Build from there.</h2>
        </div>
        <ol className="wr-home__lesson-path">
          <li><span className="wr-home__lesson-number">Lesson 1</span><h3>The Basic Sentence</h3><p>Statements and questions about past actions.</p><span className="wr-home__access-pill">Free on the website</span></li>
          <li><span className="wr-home__lesson-number">Lesson 2</span><h3>Tense Markers and Pronouns</h3><p>Expand the same pattern with more tense markers and pronouns.</p><span className="wr-home__access-pill">Free on the website</span></li>
          <li><span className="wr-home__lesson-number">Lesson 3</span><h3>Descriptive Words</h3><p>Use descriptive words in the sentence pattern.</p><span className="wr-home__access-pill">Free on the website</span></li>
          <li className="wr-home__path-continue"><span className="wr-home__lesson-number">Lessons 4–52</span><h3>Continue the course</h3><p>Work through the established sequence from beginner to advanced.</p><span className="wr-home__access-pill">Free on the website</span></li>
        </ol>
        <Link className="wr-home__button wr-home__button--secondary" to="/lessons">See all 52 lessons <span aria-hidden="true">→</span></Link>
      </section>

      <section className="wr-home__access" aria-labelledby="wr-access-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">Choose how you learn</p>
          <h2 id="wr-access-heading">The whole course. Free to learn.</h2>
          <p>Read a lesson, practise what you learn, or take the book with you. All 52 lessons are open.</p>
        </div>
        <div className="wr-home__access-grid">
          <article className="wr-home__access-card is-featured">
            <p className="wr-home__access-kicker">Start on the website</p><h3>Lessons 1–3</h3>
            <p>Read the lessons and use the website practice.</p><strong>Free</strong>
            <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1 <span aria-hidden="true">→</span></Link>
          </article>
          <article className="wr-home__access-card">
            <p className="wr-home__access-kicker">Continue on the website</p><h3>Lessons 4–52</h3>
            <p>Continue through the rest of the course on the website.</p><strong>Free</strong>
            <p className="wr-home__supporter-note">Existing supporter commitments are honoured, including audio when it is available.</p>
          </article>
          <article className="wr-home__access-card">
            <p className="wr-home__access-kicker">Keep the complete book</p><h3>PDF or EPUB</h3>
            <p>All 52 lessons with grammar, vocabulary, and exercises.</p><strong>Free forever</strong>
            <p className="wr-home__supporter-note">Includes lifetime updates.</p>
            <div className="wr-home__downloads"><a href={PDF_URL}>PDF</a><a href={EPUB_URL}>EPUB</a></div>
          </article>
        </div>
        <p className="wr-home__dictionary-note"><Link to="/dictionary">Dictionary search and definitions</Link> stay free.</p>
      </section>

      <section className="wr-home__closing" aria-labelledby="wr-closing-heading">
        <LogoMark className="wr-home__closing-mark" aria-hidden="true" />
        <p className="wr-home__eyebrow">Your first pattern is waiting</p>
        <h2 id="wr-closing-heading">Start with one sentence.<br />Then build the next.</h2>
        <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <span aria-hidden="true">→</span></Link>
        <p className="wr-home__access-note">All 52 lessons and practice tools are free.</p>
      </section>
    </div>
  )
}
