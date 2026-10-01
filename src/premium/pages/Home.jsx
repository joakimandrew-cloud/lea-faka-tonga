import { Link } from 'react-router-dom'
import { PDF_URL, EPUB_URL } from '../components/Chrome.jsx'
import { useTitle } from '../lib/title.js'
import HomePatternBand from '../components/HomePatternBand.jsx'
import HomeSentenceDemo from '../components/HomeSentenceDemo.jsx'
import HomePracticePreview from '../components/HomePracticePreview.jsx'
import { AUDIO_MEMBERSHIP_NOTICE, EXISTING_SUPPORTER_NOTICE, LIFETIME_MEMBERSHIP_URL } from '../lib/membership-offer.js'
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
              <p className="wr-home__access-note">All 52 lessons are open during the free preview.</p>
            </div>
            <div className="wr-home__book-route">
              <span className="wr-home__book-prompt">Prefer the book? </span>
              <a href={PDF_URL}>Download the free PDF</a>
              <span className="wr-home__book-or"> or </span>
              <a href={EPUB_URL}>EPUB</a>
              <span className="wr-home__book-note"><span className="wr-home__book-stop">. </span>Free forever, with lifetime updates.</span>
            </div>
          </div>
          <figure className="wr-home__hero-book">
            <div className="wr-home__book-halo" aria-hidden="true" />
            <img src="/covers/2026-09-30-three-row/cover-red-3d.webp" alt="The red Lea Faka-Tonga book, shown standing upright" width="900" height="1248" />
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
        <div className="wr-home__next">
          <p>Lesson 1 introduces this three-part pattern: tense marker, pronoun, verb. Lessons 2 and 3 add the other tenses and descriptive words.</p>
          <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="wr-home__practice" aria-labelledby="wr-practice-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">Learn, then use it</p>
          <h2 id="wr-practice-heading">Practise what you learn.</h2>
          <p>See drills, quizzes and flip cards in action. Every quiz answer, right or wrong, comes with an explanation.</p>
        </div>
        <HomePracticePreview />
        <div className="wr-home__next">
          <p>Every lesson has worked examples, exercises and a 10-question quiz.</p>
          <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="wr-home__access" aria-labelledby="wr-access-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">Membership</p>
          <h2 id="wr-access-heading">Free preview now.<br />Lifetime membership for US$35.</h2>
          <p>Explore all 52 lessons for free today. {AUDIO_MEMBERSHIP_NOTICE}</p>
        </div>
        <div className="wr-home__offer">
          <article className="wr-home__offer-member" aria-labelledby="wr-offer-member">
            <h3 className="wr-home__access-kicker" id="wr-offer-member">Lifetime membership</h3>
            <p className="wr-home__offer-price"><span className="wr-home__offer-amount">$35</span>{' '}<span className="wr-home__offer-unit"><span>USD</span>{' '}<span>Paid once</span></span></p>
            <p className="wr-home__offer-terms">A one-time donation for Lifetime membership, including the audio.</p>
            <div className="wr-home__offer-actions">
              <a className="wr-home__button wr-home__button--primary" href={LIFETIME_MEMBERSHIP_URL}>Secure Lifetime membership <span aria-hidden="true">↗</span></a>
              <Link className="wr-home__offer-link" to="/support">What Lifetime membership includes <span aria-hidden="true">→</span></Link>
            </div>
          </article>
          <div className="wr-home__offer-free">
            <div className="wr-home__offer-group">
              <h3>Open to everyone now</h3>
              <p>All 52 lessons, with the drills, quizzes and flip cards.</p>
              <Link className="wr-home__offer-link" to="/lessons/1">Start Lesson 1 <span aria-hidden="true">→</span></Link>
            </div>
            <div className="wr-home__offer-group">
              <h3>Stays free, member or not</h3>
              <p>The complete book as a PDF or EPUB: free forever, with lifetime updates.</p>
              <div className="wr-home__downloads"><a href={PDF_URL}>PDF</a><a href={EPUB_URL}>EPUB</a></div>
              <p><Link to="/dictionary">Dictionary search and definitions</Link> stay free.</p>
            </div>
          </div>
        </div>
        <p className="wr-home__lifetime-note">{EXISTING_SUPPORTER_NOTICE}</p>
      </section>

    </div>
  )
}
