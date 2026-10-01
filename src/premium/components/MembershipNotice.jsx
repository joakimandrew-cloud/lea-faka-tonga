import { Link } from 'react-router-dom'
import { AUDIO_MEMBERSHIP_NOTICE, EXISTING_SUPPORTER_NOTICE, LIFETIME_MEMBERSHIP_URL } from '../lib/membership-offer.js'
import { useProgress } from '../lib/progress.js'
import '../styles/membership-notice.css'

// The free-preview offer. Above every lesson it sits in normal flow, with no
// popup, no dismissal memory and no delay (DECISIONS 2026-09-29). Once lessons
// are finished on this device the heading counts them, from the same progress
// store the lessons list reads; with no progress (and in server renders) it
// keeps the default heading. The lessons list reuses it after the last lesson
// with its own heading and lead (Strategy changes 8 to 11).
export default function MembershipNotice({ id = 'membership-notice-title', title, lead, placement = 'lesson' }) {
  const { done } = useProgress()
  const finished = done.size
  const heading = title ?? (finished > 0 ? `You’ve finished ${finished} of 52 lessons in the free preview.` : 'You’re exploring the free preview.')
  return (
    <aside className={`membership-notice membership-notice--${placement}`} aria-labelledby={id}>
      <div className="wrap membership-notice__inner">
        <div className="membership-notice__copy">
          <h2 id={id}>{heading}</h2>
          <p>{lead ?? `All 52 lessons are open. ${AUDIO_MEMBERSHIP_NOTICE}`}</p>
        </div>
        <div className="membership-notice__offer">
          <p>Lifetime membership is US$35 now, paid once, and it includes the audio.</p>
          <a href={LIFETIME_MEMBERSHIP_URL} className="membership-notice__button">Secure Lifetime membership <span>US$35 <span aria-hidden="true">↗</span></span></a>
          <div className="membership-notice__foot">
            <Link className="membership-notice__more" to="/support">What Lifetime membership includes <span aria-hidden="true">→</span></Link>
            <p className="membership-notice__supporters">{EXISTING_SUPPORTER_NOTICE}</p>
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
