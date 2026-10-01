import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '../lib/progress.js'
import { AUDIO_MEMBERSHIP_NOTICE, EXISTING_SUPPORTER_NOTICE, FREE_PREVIEW_AUDIO_NOTICE, LIFETIME_MEMBERSHIP_URL } from '../lib/membership-offer.js'
import '../styles/membership-notice.css'

export default function MembershipNotice({ mode = 'course', menuOpen = false }) {
  const detailsRef = useRef(null)
  const dictionary = mode === 'dictionary'

  useEffect(() => {
    const details = detailsRef.current
    if (menuOpen) details.open = false
    const onKey = event => {
      if (event.key === 'Escape' && details.open) {
        details.open = false
        details.querySelector('summary').focus()
      }
    }
    const onPointer = event => {
      if (!details.contains(event.target)) details.open = false
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

  return (
    <aside className="membership-notice" aria-labelledby="membership-notice-title" inert={menuOpen}>
      <div className="wrap membership-notice__inner">
        <div className="membership-notice__copy">
          <p id="membership-notice-title" className="membership-notice__heading">
            <strong>{dictionary ? 'Free dictionary' : 'Free preview'}</strong>
            <span>{dictionary ? 'Lessons on free preview' : 'All 52 lessons open'}</span>
          </p>
          <p className="membership-notice__body">{dictionary ? 'Dictionary search and definitions stay free. Course lessons are on free preview.' : FREE_PREVIEW_AUDIO_NOTICE}</p>
        </div>
        <details ref={detailsRef} className="membership-notice__details">
          <summary><span className="membership-notice__summary-full">Preview &amp; membership details</span><span className="membership-notice__summary-short">Details</span></summary>
          <div className="membership-notice__panel">
            <p className="membership-notice__compact-copy">All 52 lessons are open during the free preview. {FREE_PREVIEW_AUDIO_NOTICE}</p>
            <p>Audio must cover every Tongan example, including sentences and exercises, before paid website membership starts.</p>
            <p>A one-time donation of <strong>US$35</strong> now secures lifetime website membership, including future audio. Once the audio is complete, lifetime website membership will cost US$99.</p>
            <a href={LIFETIME_MEMBERSHIP_URL} className="membership-notice__button">Get lifetime membership · US$35 once <span aria-hidden="true">↗</span></a>
            <p className="membership-notice__supporters">{EXISTING_SUPPORTER_NOTICE}</p>
            <p className="membership-notice__free">The book (PDF and EPUB) remains free forever. Dictionary search and definitions stay free.</p>
          </div>
        </details>
      </div>
    </aside>
  )
}

export function MembershipEndOffer({ id = 'membership-end-offer-title', title, lead, placement = 'lesson' }) {
  const { done } = useProgress()
  const finished = done.size
  const heading = title ?? (finished > 0 ? `You’ve finished ${finished} of 52 lessons in the free preview.` : 'You’re exploring the free preview.')
  return (
    <aside className={`membership-end-offer membership-end-offer--${placement}`} aria-labelledby={id}>
      <div className="wrap membership-end-offer__inner">
        <div className="membership-end-offer__copy">
          <h2 id={id}>{heading}</h2>
          <p>{lead ?? `All 52 lessons are open. ${AUDIO_MEMBERSHIP_NOTICE}`}</p>
        </div>
        <div className="membership-end-offer__offer">
          <p>Lifetime membership is US$35 now, paid once, and it includes the audio.</p>
          <a href={LIFETIME_MEMBERSHIP_URL} className="membership-end-offer__button">Secure Lifetime membership <span>US$35 <span aria-hidden="true">↗</span></span></a>
          <div className="membership-end-offer__foot">
            <Link className="membership-end-offer__more" to="/support">What Lifetime membership includes <span aria-hidden="true">→</span></Link>
            <p className="membership-end-offer__supporters">{EXISTING_SUPPORTER_NOTICE}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// One quiet line in a lesson's finish state, shown only after the learner has
// marked the lesson finished (Strategy change 12). Text, never a button.
export function MembershipFinishLine() {
  return (
    <div className="membership-finish">
      <p>If the course is helping you, a one-time donation of US$35 now secures Lifetime membership, including the audio.</p>
      <Link className="membership-finish__link" to="/support">About Lifetime membership <span aria-hidden="true">→</span></Link>
    </div>
  )
}
