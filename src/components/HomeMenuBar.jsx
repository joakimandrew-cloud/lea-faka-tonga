import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'
import { NAV_LINKS } from '../lib/nav-links'
import '../styles/home-menubar.css'

/**
 * The homepage's persistent menu (goals/home-menu.md, 2026-08-20).
 *
 * The five section links used to live only in the top white band, which scrolls
 * away after about 285px. Measured on a phone that left 8,527px of an 8,812px
 * page with no way into Lessons, Drills, Quizzes, Cards or Charts short of
 * scrolling back to the top. This bar carries the same five for the rest of the
 * page. Sub-pages already have a sticky header; now the homepage does too.
 *
 * WHY position:fixed rather than sticky. `.v11-landing` sets `overflow-x: hidden`,
 * which makes it a scroll container and disables sticky in every descendant. Its
 * `zoom: 1.25` is the other trap, and it was checked rather than assumed: a fixed
 * child of the zoomed wrapper still pins to the real viewport (x=0, width=390 at
 * 390, width=1440 at 1440), so the bar can sit inside the wrapper and inherit the
 * homepage palette instead of hard-coding it. Fixed also takes no layout space,
 * so nothing below it shifts.
 *
 * It stays hidden until the band's own menu has left the screen, so the page
 * never shows the same five links twice.
 */
export default function HomeMenuBar() {
  const [up, setUp] = useState(false)

  useEffect(() => {
    // Read the trigger off the live element with getBoundingClientRect, which is
    // in rendered pixels like scrollY. offsetTop would be in the wrapper's
    // unzoomed layout pixels, and mixing the two spaces desyncs by 25% here.
    const read = () => {
      const bandNav = document.querySelector('.v11-landing .home-nav')
      setUp(bandNav ? bandNav.getBoundingClientRect().bottom < 0 : window.scrollY > 260)
    }
    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  return (
    <div className={`home-menubar${up ? ' is-up' : ''}`}>
      <div className="hmb-in">
        <button
          type="button"
          className="hmb-mark"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to the top"
        >
          <LogoMark className="hmb-seal" />
          <span className="hmb-word">Lea Faka-Tonga</span>
        </button>
        <nav className="hmb-nav" aria-label="Course sections">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to}>{l.label}</Link>
          ))}
        </nav>
        <Link to="/lessons/1" state={{ fromStart: true }} className="hmb-cta">
          Start Lesson 1
        </Link>
      </div>
    </div>
  )
}
