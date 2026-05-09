import { Link } from 'react-router-dom'

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const waypoints = [
  { ch: 1, label: 'Your first sentence' },
  { ch: 8, label: 'Talk about anything' },
  { ch: 17, label: 'Your family' },
  { ch: 36, label: 'Tell a story' },
  { ch: 53, label: 'Speak with respect' },
]

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="dashboard-hero-mark reveal d1" />
        <h1 className="dashboard-hero-title reveal d2">
          Speak the words that<br />connect you to <em>your roots</em>
        </h1>
        <p className="dashboard-hero-sub reveal d3">
          <span className="tongan">Ako ʻa e lea faka-Tonga, vahe ki he vahe.</span>
          Every chapter, every word, every conversation brings you closer to fluency. Start where you are. Go as far as you want.
        </p>
      </section>

      <section className="journey-map reveal d3" aria-label="What you'll learn across 53 chapters">
        <div className="journey-map-track">
          <div className="journey-map-line" aria-hidden="true" />
          {waypoints.map((w, i) => (
            <div className="journey-map-stop" key={w.ch} style={{ '--stop-index': i }}>
              <span className="journey-map-dot" aria-hidden="true" />
              <span className="journey-map-ch">Ch {w.ch}</span>
              <span className="journey-map-label">{w.label}</span>
            </div>
          ))}
        </div>
        <p className="journey-map-caption">53 chapters. Start with Chapter 1 — you'll be speaking by the end of it.</p>
      </section>

      <div className="menu-grid">
        {/*
          Hidden sentence builders — routes still work for dev/testing:
            /guided       — Guided Build (what do you want to say?)
            /build        — Free Build (old slot engine)
            /terminal-build — Terminal Build (inline picker, multi-walker)
            /open-build   — Open Build (stack walker, entry-point based)
          Re-add tiles here when ready to ship to students.
        */}

        <Link to="/chapters" className="menu-card c1 reveal d3">
          <span className="menu-card-num">01</span>
          <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H3z" />
            <path d="M21 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
          </svg>
          <div className="menu-card-title-en">Learn by Chapter</div>
          <div className="menu-card-title-tongan">Ako ʻi he Vahe</div>
          <p className="menu-card-desc">53 chapters, built to stack. By Chapter 8, <span className="font-tongan">ʻa e</span> stops looking like a puzzle. By the end, you understand respect speech.</p>
          <div className="menu-card-arrow">Begin <ArrowIcon /></div>
        </Link>

        <Link to="/cards" className="menu-card c2 reveal d4">
          <span className="menu-card-num">02</span>
          <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="6" width="14" height="14" rx="1" transform="rotate(-6 10 13)" />
            <rect x="6" y="3" width="14" height="14" rx="1" />
          </svg>
          <div className="menu-card-title-en">Flip Cards</div>
          <div className="menu-card-title-tongan">Kāti Fakafoki</div>
          <p className="menu-card-desc">630 words across every chapter. By card 50, the language stops feeling foreign.</p>
          <div className="menu-card-arrow">Begin <ArrowIcon /></div>
        </Link>

        <Link to="/quizzes" className="menu-card c3 reveal d5">
          <span className="menu-card-num">03</span>
          <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="12" cy="12" r="9" />
            <path d="M9 11l2 2 4-4" />
          </svg>
          <div className="menu-card-title-en">Quizzes</div>
          <div className="menu-card-title-tongan">Sivi</div>
          <p className="menu-card-desc">Every wrong answer teaches you why. Every right answer locks it in.</p>
          <div className="menu-card-arrow">Begin <ArrowIcon /></div>
        </Link>

        <Link to="/charts" className="menu-card c4 reveal d6">
          <span className="menu-card-num">04</span>
          <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="3" width="18" height="18" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
          <div className="menu-card-title-en">Reference Charts</div>
          <div className="menu-card-title-tongan">Tepile Tokoni</div>
          <p className="menu-card-desc">The whole pronoun and possessive system on one page. No more guessing which <span className="font-tongan">&ldquo;my&rdquo;</span> to use.</p>
          <div className="menu-card-arrow">Begin <ArrowIcon /></div>
        </Link>

        <Link to="/drills" className="menu-card c5 reveal d7">
          <span className="menu-card-num">05</span>
          <svg className="menu-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M4 6h16M4 12h16M4 18h16" />
            <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none" />
            <circle cx="14" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
          <div className="menu-card-title-en">Practice Drills</div>
          <div className="menu-card-title-tongan">Ngāue Fakaʻilo</div>
          <p className="menu-card-desc">Thirteen exercises. Each one, a sentence you build yourself.</p>
          <div className="menu-card-arrow">Begin <ArrowIcon /></div>
        </Link>
      </div>
    </div>
  )
}
