import { Link } from 'react-router-dom'
import HomePatternBand from '../components/HomePatternBand.jsx'
import { useTitle } from '../lib/title.js'

// Unknown addresses keep a clear route back into the course.
export default function NotBuilt() {
  useTitle('Page not found')
  return (
    <section className="wr-missing">
      <div className="wrap wr-missing-copy">
        <p className="eyebrow">Page not found</p>
        <h1 className="display">Let’s get you<br />back on track.</h1>
        <p className="wr-missing-lead">
          This address does not match a page. Return home or choose a lesson to continue.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary">Home <span className="arr">→</span></Link>
          <Link to="/lessons" className="btn btn-ghost">All lessons</Link>
        </div>
      </div>
      <HomePatternBand />
    </section>
  )
}
