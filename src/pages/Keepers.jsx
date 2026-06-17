import { Link } from 'react-router-dom'
import founders from '../data/founders.json'
import '../styles/v11-landing.css'
import '../styles/v11-components.css'
import '../styles/offer.css'

// The Roll of Keepers — the public, costly-signal status object.
// Names come from src/data/founders.json. Append real Keepers as they join;
// never seed fake names. The wall is a git history of patrons.
const TIER_ORDER = [
  { key: 'Tauhi Fonua', label: 'Tauhi Fonua', sub: 'Keepers of the Homeland' },
  { key: 'Tauhi Lea', label: 'Tauhi Lea', sub: 'Language-Keepers' },
  { key: 'Kau Poupou', label: 'Kau Poupou', sub: 'Patrons' },
  { key: 'Kau Tokoni', label: 'Kau Tokoni', sub: 'Helpers' },
]

const Logo = () => (
  <svg className="logo-mark" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
    <polygon points="0,0 50,0 0,50" /><polygon points="100,0 50,0 100,50" />
    <polygon points="100,100 50,100 100,50" /><polygon points="0,100 50,100 0,50" />
    <polygon points="25,25 50,25 25,50" /><polygon points="75,25 50,25 75,50" />
    <polygon points="75,75 50,75 75,50" /><polygon points="25,75 50,75 25,50" />
    <polygon points="37.5,37.5 50,37.5 37.5,50" /><polygon points="62.5,37.5 50,37.5 62.5,50" />
    <polygon points="62.5,62.5 50,62.5 62.5,50" /><polygon points="37.5,62.5 50,62.5 37.5,50" />
  </svg>
)

export default function Keepers() {
  const grouped = TIER_ORDER.map(t => ({ ...t, people: founders.filter(f => f.tier === t.key) }))
  const total = founders.length

  return (
    <div className="v11-landing offer-page">
      <div className="top-band">
        <Link to="/" className="top-brand" style={{ textDecoration: 'none' }}>
          <Logo /><span className="wordmark">Lea Faka-Tonga</span>
        </Link>
        <div className="top-sub">The Roll of Keepers · kept free by the people below</div>
      </div>

      <section className="offer-hero">
        <span className="offer-eyebrow">Tauhi ʻa e lea: keepers of the language</span>
        <h1 className="offer-headline">The Roll of <span className="accent">Keepers.</span></h1>
        <p className="offer-lede">
          Every name here paid so that a Tongan family, somewhere, learns their language for free.
          Each one is a reason it still exists.
        </p>
      </section>

      <div className="offer-sec">
        <div className="panel-frame">
          {total === 0 ? (
            <div className="keepers-empty">
              <span className="keepers-empty-mark">ʻ</span>
              <h2 className="keepers-empty-title">This wall is being carved.</h2>
              <p className="keepers-empty-body">
                The first names go here. Be among the first {250} Founding Keepers, your name cast into
                the work, in your own community.
              </p>
              <Link to="/support" className="cta-btn">Become a Founding Keeper →</Link>
            </div>
          ) : (
            <>
              <div className="offer-sec-bar">
                <span>§ The Keepers</span>
                <span className="right">{total} and counting</span>
              </div>
              {grouped.filter(g => g.people.length).map(g => (
                <div className="keepers-group" key={g.key}>
                  <div className="keepers-group-head">
                    <span className="kgh-ton">{g.label}</span>
                    <span className="kgh-sub">{g.sub}</span>
                  </div>
                  <ul className="keepers-list">
                    {g.people.map((p, i) => (
                      <li key={p.name + i} className="keeper">
                        <span className="keeper-name">{p.name}</span>
                        {p.dedication && <span className="keeper-ded">in honour of {p.dedication}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="offer-keepers-link">
                <Link to="/support" className="cta-btn">Add your name →</Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="offer-sec">
        <div className="panel-frame">
          <div className="colophon">
            <div><strong>Lea Faka-Tonga</strong> · The book is free · Kept alive by its supporters</div>
            <Link to="/" style={{ color: 'var(--red)', textDecoration: 'none' }}>← Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
