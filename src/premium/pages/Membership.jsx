import EntryMotif from '../components/EntryMotif.jsx'
import { Link } from 'react-router-dom'
import { motion as Motion } from 'motion/react'
import LogoMark from '@app/components/LogoMark.jsx'
import { supportUrl } from '@app/lib/partner-link.js'
import { useTitle } from '../lib/title.js'
import { PDF_URL, EPUB_URL } from '../components/Chrome.jsx'
import { KupesiTile } from '../components/Kupesi.jsx'
import { useProgress } from '../lib/progress.js'
import { COURSE_FIGURES } from '../lib/course-figures.js'
import {
  AUDIO_MEMBERSHIP_NOTICE,
  EXISTING_SUPPORTER_NOTICE,
  LIFETIME_MEMBERSHIP_NOTICE,
  LIFETIME_MEMBERSHIP_URL,
  MEMBERSHIP_RECORD_NOTICE,
  MEMBERSHIP_RECOVERY_AFTER,
  MEMBERSHIP_RECOVERY_BEFORE,
  MEMBERSHIP_RECOVERY_EMAIL,
} from '../lib/membership-offer.js'
import '../styles/membership.css'

// /support: the page where the decision is made (Strategy changes 13 to 15).
// The sections follow the visitor's questions in the order they arise: what it
// is and what it costs, what is already open, what membership keeps, what if,
// and then the act. Every offer sentence comes from
// membership-offer.js. The membership button goes to the US$35 item for every
// visitor; the page never reads the partner record. The general Buy Me a
// Coffee page stays reachable as an optional donation (supportUrl()).

const EASE = [.16, 1, .3, 1]
const figureFormat = new Intl.NumberFormat('en-US')

function MembershipButton({ className = '' }) {
  return (
    <a className={`mb-button ${className}`} href={LIFETIME_MEMBERSHIP_URL}>
      Secure Lifetime membership <span className="mb-button__price">US$35 <span aria-hidden="true">↗</span></span>
    </a>
  )
}

// The same rule as the header's button: start, continue, or start the next.
function LearnLink({ className = '' }) {
  const { done, last } = useProgress()
  const next = last ? (done.has(last) ? Math.min(52, last + 1) : last) : 1
  const label = !last ? 'Start Lesson 1, free' : done.has(last) ? `Start Lesson ${next}` : `Continue Lesson ${next}`
  return <Link className={`mb-text-link ${className}`} to={`/lessons/${next}`}>{label} <EntryMotif size={18} index={next - 1} /></Link>
}

// A decorative membership card: the offer as an object, carrying the four
// facts already stated in the text beside it and nothing more.
function MembershipCard() {
  return (
    <div className="mb-card-stage" aria-hidden="true">
      <div className="mb-card-halo" />
      <Motion.div
        className="mb-card"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: .2, ease: EASE }}
      >
        <div className="mb-card__top">
          <span className="mb-card__brand"><LogoMark className="mb-card__mark" /><span>Lea Faka-Tonga</span></span>
          <KupesiTile kind="nest" className="mb-card__tile" />
        </div>
        <p className="mb-card__title">Lifetime membership</p>
        <ul className="mb-card__lines">
          <li>All 52 lessons</li>
          <li>Including the audio</li>
          <li>One-time · US$35</li>
        </ul>
      </Motion.div>
    </div>
  )
}

const QUESTIONS = [
  {
    q: 'Is this a donation or a purchase?',
    a: 'A donation. One payment of US$35 through Buy Me a Coffee includes Lifetime membership and the audio.',
  },
  {
    q: 'What happens to what is free now?',
    a: 'All 52 lessons stay open during the free preview. After the move to paid membership, the book stays free forever with lifetime updates, and dictionary search and definitions stay free.',
  },
  {
    q: 'What if the audio takes a while?',
    a: 'The lessons stay open while audio is added. Lifetime membership is US$35 until audio covers every Tongan example, including sentences and exercises; then the website moves to paid membership and Lifetime membership becomes US$99. No launch date has been announced.',
  },
  {
    q: 'Can I give a different amount?',
    a: 'Lifetime membership is a fixed US$35 through the membership button. The general support page accepts optional donations of any amount, which do not include membership.',
    general: true,
  },
  {
    q: 'How is my membership kept?',
    a: MEMBERSHIP_RECORD_NOTICE,
  },
  {
    q: 'What if my email changes?',
    // The address is a link; the sentence is built from the one address
    // constant in membership-offer.js, word for word.
    a: <>{MEMBERSHIP_RECOVERY_BEFORE}<a href={`mailto:${MEMBERSHIP_RECOVERY_EMAIL}`}>{MEMBERSHIP_RECOVERY_EMAIL}</a>{MEMBERSHIP_RECOVERY_AFTER}</>,
  },
  {
    q: 'I was already promised lifetime access.',
    a: 'It stays yours, including the audio.',
  },
]

export default function Membership() {
  useTitle('Lifetime membership')

  return (
    <div className="mb">
      {/* 1 · Terms and the button */}
      <section className="mb-hero" aria-labelledby="mb-title">
        <div className="wrap mb-hero__grid">
          <div className="mb-hero__copy">
            <Motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .05 }}>Lifetime membership</Motion.p>
            <h1 id="mb-title" className="mb-h1 display">
              <span className="mb-line"><Motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: .08, ease: EASE }}>Free now.</Motion.span></span>{' '}
              <span className="mb-line"><Motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: .16, ease: EASE }}>Yours for life for US$35.</Motion.span></span>
            </h1>
            <Motion.p className="mb-lede" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3, duration: .8 }}>
              All 52 lessons are open during the free preview. {LIFETIME_MEMBERSHIP_NOTICE} {AUDIO_MEMBERSHIP_NOTICE}
            </Motion.p>
            <Motion.div className="mb-hero__action" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4, duration: .8 }}>
              <MembershipButton />
              <p className="mb-handoff">You pay on Buy Me a Coffee: a one-time donation, not a subscription.</p>
            </Motion.div>
          </div>
          <MembershipCard />
        </div>
      </section>

      {/* 2 · What is open now: the gift, shown in full before any ask */}
      <section className="mb-section mb-open" aria-labelledby="mb-open-title">
        <div className="wrap">
          <div className="mb-intro">
            <p className="eyebrow">Open to everyone now</p>
            <h2 id="mb-open-title" className="mb-h2 display">Try it all before you decide.</h2>
            <p>No account, no sign-up. Every lesson, drill, quiz and flip card is open during the free preview.</p>
          </div>
          {/* The course in figures: secondary evidence, quieter than a band (DECISIONS 2026-09-30). */}
          <ul className="mb-figures" aria-label="What’s inside the course">
            {COURSE_FIGURES.map(item => {
              const body = (
                <>
                  <span className="mb-figures__value">{figureFormat.format(item.value)}</span>
                  <span className="mb-figures__label">{item.label}</span>
                </>
              )
              return (
                <li key={item.key}>
                  {item.book
                    ? <a className="mb-figures__item" href={PDF_URL}>{body}</a>
                    : <Link className="mb-figures__item" to={item.to}>{body}</Link>}
                </li>
              )
            })}
          </ul>
          <div className="mb-source">
            <p>The lessons draw on Churchward’s <em>Tongan Grammar</em> and Shumway’s <em>Intensive Course in Tongan</em>, and the course is corrected in the open.</p>
            <p>Spot a mistake? <Link to="/report">Tell us</Link>.</p>
          </div>
        </div>
      </section>

      {/* 3 · What you keep for life, and what never changes for anyone */}
      <section className="mb-section mb-keep" aria-labelledby="mb-keep-title">
        <div className="wrap">
          <div className="mb-intro">
            <p className="eyebrow">What membership gives you</p>
            <h2 id="mb-keep-title" className="mb-h2 display">What you keep for life.</h2>
          </div>
          <div className="mb-keep__grid">
            <div className="mb-keep__col mb-keep__col--member">
              <h3>With Lifetime membership</h3>
              <ul className="mb-list">
                <li>Membership for life, after the website moves to paid membership.</li>
                <li>The audio for every Tongan example, including sentences and exercises.</li>
                <li>One payment at today’s price, with no renewals.</li>
              </ul>
            </div>
            <div className="mb-keep__col mb-keep__col--free">
              <h3>Free for everyone, member or not</h3>
              <ul className="mb-list">
                <li>The complete book as a <a href={PDF_URL}>PDF</a> and <a href={EPUB_URL}>EPUB</a>: free forever, with lifetime updates.</li>
                <li><Link to="/dictionary">Dictionary search and definitions</Link>.</li>
              </ul>
            </div>
          </div>
          <p className="mb-note">{EXISTING_SUPPORTER_NOTICE}</p>
        </div>
      </section>

      {/* 4 · Questions, every answer visible */}
      <section className="mb-section mb-faq" aria-labelledby="mb-faq-title">
        <div className="wrap">
          <div className="mb-intro">
            <p className="eyebrow">Questions</p>
            <h2 id="mb-faq-title" className="mb-h2 display">Before you decide.</h2>
          </div>
          <div className="mb-faq__grid">
            {QUESTIONS.map(item => (
              <div className="mb-faq__item" key={item.q}>
                <h3>{item.q}</h3>
                <p>{item.a}</p>
                {item.general && <a className="mb-text-link mb-faq__general" href={supportUrl()}>General support page <span aria-hidden="true">↗</span></a>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Close: the act, with the free route kept beside it */}
      <section className="mb-close" aria-labelledby="mb-close-title">
        <div className="wrap mb-close__inner">
          <h2 id="mb-close-title" className="mb-h2 display">Keep learning either way.</h2>
          <p>The lessons stay open during the free preview, whether you join or not.</p>
          <div className="mb-close__actions">
            <MembershipButton className="mb-button--light" />
            <LearnLink className="mb-text-link--light" />
          </div>
        </div>
      </section>
    </div>
  )
}
