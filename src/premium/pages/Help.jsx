import EntryMotif from '../components/EntryMotif.jsx'
import { Link } from 'react-router-dom'
import HomePatternBand from '../components/HomePatternBand.jsx'
import { EPUB_URL, PDF_URL } from '../components/Chrome.jsx'
import { supportUrl } from '@app/lib/partner-link.js'
import { useTitle } from '../lib/title.js'
import '../styles/reference.css'


export default function Help() {
  useTitle('Help and downloads')
  return (
    <div className="premium-reference premium-reference-help">
      <header className="premium-reference-help-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Help · Downloads · Corrections</p>
          <h1 className="display">Find help.<br />Keep learning.</h1>
          <p>Use the current course services for corrections, downloads and support, or return to the lessons and practice here.</p>
        </div>
        <HomePatternBand className="premium-reference-help-kupesi" />
      </header>

      <div className="wrap premium-reference-help-grid">
        <section className="premium-reference-help-card premium-reference-help-report" aria-labelledby="help-report-title">
          <p className="premium-reference-card-kicker">Corrections</p>
          <h2 id="help-report-title">Spot a mistake? Tell us.</h2>
          <p>A typo, a wrong example, a rule that reads strangely, anything that seems off: tell us where it is and what you would change. It comes straight to us.</p>
          <Link className="btn btn-primary" to="/report">Report a mistake <EntryMotif size={20} /></Link>
        </section>

        <section className="premium-reference-help-card" aria-labelledby="help-book-title">
          <p className="premium-reference-card-kicker">The book</p>
          <h2 id="help-book-title">Download the course.</h2>
          <p>Free forever. Lifetime updates.</p>
          <div className="premium-reference-card-actions">
            <a className="btn btn-ghost" href={PDF_URL} target="_blank" rel="noopener noreferrer">Download PDF <span aria-hidden="true">↗</span></a>
            <a className="btn btn-ghost" href={EPUB_URL} target="_blank" rel="noopener noreferrer">Download EPUB <span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <section className="premium-reference-help-card" aria-labelledby="help-course-title">
          <p className="premium-reference-card-kicker">Course</p>
          <h2 id="help-course-title">Choose where to continue.</h2>
          <ul className="premium-reference-help-links">
            <li><Link to="/lessons">All 52 lessons <EntryMotif size={20} index={1} /></Link></li>
            <li><Link to="/topics">Topic guides <EntryMotif size={20} index={2} /></Link></li>
            <li><Link to="/charts">Grammar charts <EntryMotif size={20} index={3} /></Link></li>
            <li><Link to="/drills">Practice drills <EntryMotif size={20} index={0} /></Link></li>
          </ul>
        </section>

        <section className="premium-reference-help-card premium-reference-help-support" aria-labelledby="help-support-title">
          <p className="premium-reference-card-kicker">Support</p>
          <h2 id="help-support-title">Support the work.</h2>
          <p>A gift of any amount on our general support page is an optional donation and does not include membership.</p>
          <ul className="premium-reference-help-links">
            <li><Link to="/support">Lifetime membership, US$35 <EntryMotif size={20} index={1} /></Link></li>
            <li><a href={supportUrl()} target="_blank" rel="noopener noreferrer">Optional donation <span aria-hidden="true">↗</span></a></li>
          </ul>
        </section>
      </div>
    </div>
  )
}
