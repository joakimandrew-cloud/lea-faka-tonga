import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion as Motion, useScroll, useSpring } from 'motion/react'
import LogoMark from '@app/components/LogoMark.jsx'
import { supportUrl } from '@app/lib/partner-link.js'
import HomePatternBand from './HomePatternBand.jsx'
import { useProgress } from '../lib/progress.js'

const NAV = [
  { to: '/lessons', label: 'Lessons' },
  { to: '/drills', label: 'Drills' },
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/cards', label: 'Flip cards' },
  { to: '/dictionary', label: 'Dictionary' },
  { to: '/topics', label: 'Reference' },
  { to: '/support', label: 'Membership' },
]

export const PDF_URL = '/downloads/Lea-Faka-Tonga.pdf'
export const EPUB_URL = '/downloads/Lea-Faka-Tonga.epub'

export function Wordmark({ compact = false }) {
  return (
    <Link to="/" className={`wm ${compact ? 'is-compact' : ''}`} aria-label="Lea Faka-Tonga, home">
      <LogoMark className="wm-mark" />
      <span className="wm-text">Lea Faka-Tonga</span>
    </Link>
  )
}

export function Header({ progress = false }) {
  const [menuPath, setMenuPath] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  const open = menuPath === loc.pathname
  const menuRef = useRef(null)
  const toggleRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: .3 })

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      if (!open) setHidden(y > 240 && y > last + 2 ? true : y < last - 2 ? false : hidden)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [open, hidden])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const onKey = (e) => {
      // A drill's page-level shortcuts must not answer behind the open menu.
      // Native link/button activation still runs because default is preserved.
      e.stopPropagation()
      if (e.key === 'Escape') {
        setMenuPath(null)
        toggleRef.current?.focus()
      }
      if (e.key !== 'Tab') return
      const controls = [...menuRef.current.querySelectorAll('a[href], button:not(:disabled), [tabindex="0"]')]
        .filter(node => node.getClientRects().length > 0)
      const first = controls[0]
      const last = controls.at(-1)
      const outside = !menuRef.current.contains(document.activeElement)
      if ((e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last) || outside) {
        e.preventDefault()
        ;(e.shiftKey ? last : first)?.focus()
      }
    }
    const desktop = window.matchMedia('(min-width: 881px)')
    const onResize = () => { if (desktop.matches) setMenuPath(null) }
    window.addEventListener('keydown', onKey, true)
    desktop.addEventListener('change', onResize)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      desktop.removeEventListener('change', onResize)
      document.documentElement.style.overflow = previousOverflow
    }
  }, [open])

  // Sticky bars below the header read this to slide up when it hides.
  useEffect(() => {
    document.documentElement.dataset.hdr = hidden ? 'hidden' : 'shown'
  }, [hidden])

  const { done, last } = useProgress()
  const next = last ? (done.has(last) ? Math.min(52, last + 1) : last) : 1
  const ctaLabel = !last ? 'Start Lesson 1' : done.has(last) ? `Start Lesson ${next}` : `Continue Lesson ${next}`
  const hideCta = /^\/(lessons\/\d+|quizzes|drill)/.test(loc.pathname)
  const toggleMenu = () => {
    if (!open) setHidden(false)
    setMenuPath(open ? null : loc.pathname)
  }

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="navigation-shell" ref={menuRef} role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined} aria-label={open ? 'Site menu' : undefined} onClick={event => {
        if (open && event.target.closest('a')) setMenuPath(null)
      }}>
      <header className={`hdr ${hidden ? 'is-hidden' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="hdr-in">
          <Wordmark />
          <nav className="hdr-nav" aria-label="Main">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `hdr-link ${isActive || (n.to === '/lessons' && loc.pathname.startsWith('/lessons')) || (n.to === '/drills' && loc.pathname.startsWith('/drill/')) || (n.to === '/quizzes' && loc.pathname.startsWith('/quizzes/')) || (n.to === '/topics' && /^\/(charts|alphabet|greetings|grammar\/)/.test(loc.pathname)) ? 'is-active' : ''}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hdr-cta">
            {!hideCta && <Link to={`/lessons/${next}`} className="btn btn-primary btn-sm">{ctaLabel}</Link>}
            <button ref={toggleRef} className="hdr-burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="site-menu" onClick={toggleMenu}>
              <span /><span />
            </button>
          </div>
        </div>
        {progress && <Motion.div className="hdr-progress" style={{ scaleX: bar }} />}
      </header>

      <AnimatePresence>
        {open && (
          <Motion.div
            id="site-menu"
            className="sheet band grain"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: .55, ease: [.76, 0, .24, 1] }}
          >
            <nav className="sheet-nav" aria-label="Menu">
              {[{ to: '/', label: 'Home' }, ...NAV].map((n, i) => (
                <Motion.div key={n.to} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .18 + i * .05, duration: .6, ease: [.16, 1, .3, 1] }}>
                  <Link to={n.to} className="sheet-link display">{n.label}</Link>
                </Motion.div>
              ))}
            </nav>
            <div className="sheet-foot">
              <Link to="/lessons/1" className="btn btn-primary">Start Lesson 1, it's free <span className="arr">→</span></Link>
              <a href={PDF_URL} className="btn btn-ghost">Download the book (PDF)</a>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
      </div>
    </>
  )
}

export function Footer() {
  const compact = useLocation().pathname === '/'
  return (
    <footer className={`ftr band grain${compact ? ' ftr--compact' : ''}`}>
      <HomePatternBand className="ftr-band" />
      <div className="wrap ftr-grid">
        <div className="ftr-brand">
          {compact ? <Wordmark /> : <>
            <div className="ftr-mark"><LogoMark /></div>
            <p className="ftr-big display">Learn Tongan.<br />One sentence<br />at a time.</p>
          </>}
        </div>
        <div className="ftr-col">
          <h2>Learn</h2>
          <Link to="/lessons">All 52 lessons</Link>
          <Link to="/lessons/1">Lesson 1</Link>
          <Link to="/drills">Drills</Link>
          <Link to="/quizzes">Quizzes</Link>
          <Link to="/cards">Flip cards</Link>
          <Link to="/dictionary">Dictionary</Link>
          <Link to="/topics">Topic guides</Link>
          <Link to="/charts">Grammar charts</Link>
        </div>
        <div className="ftr-col">
          <h2>The book</h2>
          <a href={PDF_URL}>Download PDF</a>
          <a href={EPUB_URL}>Download EPUB</a>
          <span className="ftr-note">Free forever. Lifetime updates.</span>
        </div>
        <div className="ftr-col">
          <h2>Help it grow</h2>
          <Link to="/support">Lifetime membership, US$35</Link>
          <a href={supportUrl()}>Optional donation</a>
          <Link to="/report">Spot a mistake? Tell us</Link>
          <Link to="/help">Help and downloads</Link>
        </div>
      </div>
      <div className="wrap ftr-colophon">
        <span>Lea Faka-Tonga · First Edition · 2026 · Corrected in the open</span>
        {/* Owner request, 2026-09-27: no farewell/sign-off in the footer. */}
      </div>
    </footer>
  )
}
