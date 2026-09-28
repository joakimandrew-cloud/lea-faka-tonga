import { AUDIO_MEMBERSHIP_NOTICE, EXISTING_SUPPORTER_NOTICE, LIFETIME_MEMBERSHIP_URL } from '../lib/membership-offer.js'
import '../styles/membership-notice.css'

export default function MembershipNotice() {
  return (
    <aside className="membership-notice" aria-labelledby="membership-notice-title">
      <div className="wrap membership-notice__inner">
        <div className="membership-notice__copy">
          <h2 id="membership-notice-title">You’re exploring the free preview.</h2>
          <p>All 52 lessons are open. {AUDIO_MEMBERSHIP_NOTICE}</p>
        </div>
        <div className="membership-notice__offer">
          <p>Donate US$35 or more now for lifetime membership, including audio, before the price increases.</p>
          <a href={LIFETIME_MEMBERSHIP_URL} className="membership-notice__button">Secure lifetime membership <span>US$35 <span aria-hidden="true">↗</span></span></a>
          <p className="membership-notice__supporters">{EXISTING_SUPPORTER_NOTICE}</p>
        </div>
      </div>
    </aside>
  )
}
