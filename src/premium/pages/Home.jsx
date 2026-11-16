import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PDF_URL, EPUB_URL } from '../components/Chrome.jsx'
import { useTitle } from '../lib/title.js'
import HomeColourPicker from '../components/HomeColourPicker.jsx'
import HomeSlides from '../components/HomeSlides.jsx'
import HomeStages from '../components/HomeStages.jsx'
import HomePracticeCards from '../components/HomePracticeCards.jsx'
import LearningPaths from '../components/LearningPaths.jsx'
import { getHomeColour, readHomeColour, saveHomeColour } from '../lib/home-colours.js'
import { EXISTING_SUPPORTER_NOTICE, LIFETIME_MEMBERSHIP_URL } from '../lib/membership-offer.js'
import { HOME_HUB } from '@app/seo/learning-paths.js'
import '../styles/white-red-home.css'
import '../styles/home-slides.css'
import '../styles/home-colours.css'

// The homepage since 2026-11-17: one button shape, one column, and nothing moving by itself but the four slides. The frame film and the course map
// (HomeBlueprint.jsx) and the moving practice preview (HomePracticePreview.jsx) are kept in the app, unused. To put the film back,
// mount <HomeBlueprint /> in the sentence section and restore the .wr-home__film rules from app commit 312696e.
function StartLesson({ children = 'Start Lesson 1, free' }) {
  return <Link className="wr-home__button wr-home__button--primary wr-home__button--go" to="/lessons/1">{children} <span className="wr-home__go" aria-hidden="true">→</span></Link>
}

export default function Home() {
  useTitle('Build your first Tongan sentence')
  const [homeColour, setHomeColour] = useState(readHomeColour)
  const colour = getHomeColour(homeColour)

  const chooseHomeColour = nextColour => {
    setHomeColour(nextColour)
    saveHomeColour(nextColour)
  }

  return (
    <div className="wr-home" data-home-theme={colour.id}>
      <section className="wr-home__hero">
        <div className="wr-home__col wr-home__hero-inner">
          <div className="wr-home__hero-copy">
            <p className="wr-home__eyebrow">{HOME_HUB.eyebrow}</p>
            <h1>{HOME_HUB.heading[0]}<br />{HOME_HUB.heading[1]}</h1>
            <p className="wr-home__hero-lede">{HOME_HUB.lead}</p>
            <div className="wr-home__hero-action">
              <StartLesson />
              <p className="wr-home__access-note">All 52 lessons are open during the free preview.</p>
            </div>
            <p className="wr-home__book-route">
              Prefer the book? <a href={PDF_URL}>Download the free PDF</a> or <a href={EPUB_URL}>EPUB</a>.
            </p>
          </div>
          <div className="wr-home__hero-visual">
            <figure className="wr-home__hero-book">
              <img src={colour.cover} alt={colour.alt} width={colour.width} height={colour.height} />
            </figure>
            <HomeColourPicker value={colour.id} onChange={chooseHomeColour} />
          </div>
        </div>
      </section>

      <section className="wr-home__sentence" aria-labelledby="wr-sentence-heading">
        <div className="wr-home__col">
          <div className="wr-home__section-intro">
            <p className="wr-home__eyebrow">A preview of what you’ll learn</p>
            <h2 id="wr-sentence-heading">Every lesson adds a piece.</h2>
            <p>Start with one short sentence from Lesson 1. Each lesson changes a part of it or adds a new one.</p>
          </div>
          <HomeSlides />
        </div>
      </section>

      <section className="wr-home__course" aria-labelledby="wr-course-heading">
        <div className="wr-home__col">
          <div className="wr-home__split">
            <div className="wr-home__section-intro">
              <p className="wr-home__eyebrow">The course</p>
              <h2 id="wr-course-heading">Lessons 1 to 52,<br />in order.</h2>
              <p>Six stages take you from the basic sentence to advanced patterns. Every lesson has worked examples, exercises and a 10-question quiz.</p>
            </div>
            <HomeStages />
          </div>
          <div className="wr-home__practice" aria-labelledby="wr-practice-heading">
            <h3 id="wr-practice-heading">Practise what you learn.</h3>
            <HomePracticeCards />
          </div>
        </div>
      </section>

      <section className="wr-home__access" aria-labelledby="wr-access-heading">
        <div className="wr-home__col">
          <div className="wr-home__split">
            <div className="wr-home__offer-benefits">
              <div className="wr-home__section-intro">
                <p className="wr-home__eyebrow">Lifetime membership</p>
                <h2 id="wr-access-heading">Lock in US$35.<br />Keep learning for life.</h2>
                <p>One payment for Lifetime membership to the website, including the forthcoming audio.</p>
              </div>
              <ul aria-label="What you keep">
                <li><span aria-hidden="true">✓</span><div><h3>The complete website</h3><p>52 lessons, drills, quizzes and flip cards.</p></div></li>
                <li><span aria-hidden="true">✓</span><div><h3>Future audio included</h3><p>Every Tongan example, sentence and exercise.</p></div></li>
                <li><span aria-hidden="true">✓</span><div><h3>Your membership for life</h3><p>Keep access after the free preview ends.</p></div></li>
              </ul>
              <Link className="wr-home__more" to="/support">What membership includes <span aria-hidden="true">›</span></Link>
            </div>
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
              <a className="wr-home__button wr-home__button--onaccent" href={LIFETIME_MEMBERSHIP_URL}>Lock in Lifetime membership <span aria-hidden="true">↗</span></a>
              <p className="wr-home__offer-handoff">Continue to Buy Me a Coffee to pay.</p>
              <p className="wr-home__offer-condition"><strong>Why join now?</strong> The price rises to US$99 once every Tongan example has audio, including sentences and exercises.</p>
            </article>
          </div>
          <div className="wr-home__free">
            <div className="wr-home__free-resources">
              <span>Always free:</span>
              <span>The book</span><a href={PDF_URL}>PDF</a><a href={EPUB_URL}>EPUB</a>
              <Link to="/dictionary">Dictionary</Link>
            </div>
            <p className="wr-home__lifetime-note">The book includes lifetime updates. {EXISTING_SUPPORTER_NOTICE}</p>
          </div>
        </div>
      </section>

      <LearningPaths>
        <div className="wr-home__closing">
          <StartLesson />
          <p className="wr-home__access-note">All 52 lessons are open during the free preview.</p>
        </div>
      </LearningPaths>
    </div>
  )
}
