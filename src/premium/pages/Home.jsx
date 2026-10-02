import EntryMotif from '../components/EntryMotif.jsx'
import { Link } from 'react-router-dom'
import { PDF_URL, EPUB_URL } from '../components/Chrome.jsx'
import { useTitle } from '../lib/title.js'
import HomePatternBand from '../components/HomePatternBand.jsx'
import HomeSentenceDemo from '../components/HomeSentenceDemo.jsx'
import HomePracticePreview from '../components/HomePracticePreview.jsx'
import LearningPaths from '../components/LearningPaths.jsx'
import { EXISTING_SUPPORTER_NOTICE, LIFETIME_MEMBERSHIP_URL } from '../lib/membership-offer.js'
import { HOME_HUB } from '@app/seo/learning-paths.js'
import '../styles/white-red-home.css'
import '../styles/home-practice-film.css'

export default function Home() {
  useTitle('Build your first Tongan sentence')

  return (
    <div className="wr-home">
      <section className="wr-home__hero">
        <div className="wr-home__hero-inner">
          <div className="wr-home__hero-copy">
            <p className="wr-home__eyebrow">{HOME_HUB.eyebrow}</p>
            <h1>{HOME_HUB.heading[0]}<br />{HOME_HUB.heading[1]}</h1>
            <p className="wr-home__hero-lede">{HOME_HUB.lead}</p>
            <div className="wr-home__hero-action">
              <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <EntryMotif size={20} index={0} /></Link>
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

      <LearningPaths />

      <section className="wr-home__sentence" aria-labelledby="wr-sentence-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">A preview of what you’ll learn</p>
          <h2 id="wr-sentence-heading">One pattern. So many possibilities.</h2>
          <p>Change the time, person and words. Add detail, then explore negatives and questions.</p>
        </div>
        <HomeSentenceDemo />
        <div className="wr-home__next">
          <p>Lessons 1–3 build the basic pattern and descriptions. Later lessons add negatives and question words.</p>
          <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <EntryMotif size={20} index={1} /></Link>
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
          <Link className="wr-home__button wr-home__button--primary" to="/lessons/1">Start Lesson 1, free <EntryMotif size={20} index={2} /></Link>
        </div>
      </section>

      <section className="wr-home__access" aria-labelledby="wr-access-heading">
        <div className="wr-home__section-intro">
          <p className="wr-home__eyebrow">Lifetime membership</p>
          <h2 id="wr-access-heading">Lock in US$35.<br />Keep learning for life.</h2>
          <p>One payment for Lifetime membership to the website, including the forthcoming audio.</p>
        </div>
        <div className="wr-home__offer">
          <article className="wr-home__offer-member" aria-labelledby="wr-offer-member">
            <h3 className="wr-home__access-kicker" id="wr-offer-member">Reduced preview price</h3>
            <div className="wr-home__price-pair" role="group" aria-label="Lifetime membership prices in US dollars">
              <div>
                <p className="wr-home__price-caption">Future price</p>
                <span className="wr-home__offer-amount wr-home__offer-amount--future">$99</span>
              </div>
              <div>
                <p className="wr-home__price-caption">Now</p>
                <span className="wr-home__offer-amount">$35</span>
              </div>
            </div>
            <p className="wr-home__offer-once">US dollars. One-time donation. No renewals.</p>
            <p className="wr-home__offer-saving">US$64 less than the future price.</p>
            <p className="wr-home__offer-work"><strong>Reduced price while we finish the website.</strong>All that’s left is to add the audio.</p>
            <a className="wr-home__button wr-home__button--primary" href={LIFETIME_MEMBERSHIP_URL}>Lock in Lifetime membership <span aria-hidden="true">↗</span></a>
            <p className="wr-home__offer-handoff">Continue to Buy Me a Coffee to pay.</p>
            <p className="wr-home__offer-condition"><strong>Why join now?</strong> The price rises to US$99 once every Tongan example has audio, including sentences and exercises.</p>
          </article>
          <div className="wr-home__offer-benefits">
            <h3>What you keep</h3>
            <ul>
              <li><span aria-hidden="true">✓</span><div><h4>The complete website</h4><p>52 lessons, drills, quizzes and flip cards.</p></div></li>
              <li><span aria-hidden="true">✓</span><div><h4>Future audio included</h4><p>Every Tongan example, sentence and exercise.</p></div></li>
              <li><span aria-hidden="true">✓</span><div><h4>Your membership for life</h4><p>Keep access after the free preview ends.</p></div></li>
            </ul>
            <Link className="wr-home__offer-link" to="/support">What membership includes <EntryMotif size={18} index={3} /></Link>
          </div>
        </div>
        <div className="wr-home__preview-route">
          <p>Explore all 52 lessons free during the preview.</p>
          <Link to="/lessons/1">Try lesson 1 <EntryMotif size={18} index={0} /></Link>
        </div>
        <div className="wr-home__free-resources">
          <span>Always free:</span>
          <span>The book</span><a href={PDF_URL}>PDF</a><a href={EPUB_URL}>EPUB</a>
          <Link to="/dictionary">Dictionary</Link>
        </div>
        <p className="wr-home__lifetime-note">The book includes lifetime updates. {EXISTING_SUPPORTER_NOTICE}</p>
      </section>

    </div>
  )
}
