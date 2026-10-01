import { Link } from 'react-router-dom'
import founders from '@app/data/founders.json'
import { supportUrl } from '@app/lib/partner-link.js'
import { useTitle } from '../lib/title.js'
import '../styles/services.css'

const TIER_ORDER = [
  { key: 'Tauhi Fonua', label: 'Tauhi Fonua', sub: 'Keepers of the Homeland' },
  { key: 'Tauhi Lea', label: 'Tauhi Lea', sub: 'Language-Keepers' },
  { key: 'Kau Poupou', label: 'Kau Poupou', sub: 'Patrons' },
  { key: 'Kau Tokoni', label: 'Kau Tokoni', sub: 'Helpers' },
]

export default function Keepers() {
  useTitle('The Roll of Keepers')
  const supportHref = supportUrl()
  const grouped = TIER_ORDER.map(tier => ({
    ...tier,
    people: founders.filter(founder => founder.tier === tier.key),
  }))
  const total = founders.length

  return (
    <div className="service-page service-keepers">
      <header className="service-hero">
        <div className="wrap service-hero-inner">
          <p className="eyebrow"><span lang="to">Tauhi ʻa e lea</span> · Keepers of the language</p>
          <h1 className="display">The Roll of<br /><span>Keepers.</span></h1>
          <p className="service-lead">
            Every name here helped so that a Tongan family, somewhere, learns their language for free.
            Each one is a reason it still exists.
          </p>
        </div>
      </header>

      <div className="wrap service-body">
        <section className="service-panel" aria-labelledby="keepers-title">
          {total === 0 ? (
            <div className="keepers-empty">
              <span className="keepers-empty-mark" aria-hidden="true">ʻ</span>
              <h2 id="keepers-title">This wall is being carved.</h2>
              <p>
                The first names go here. People who send in a correction can be thanked on this roll.
                To support the course, Lifetime membership is US$35 now, or you can give an optional
                donation of any amount.
              </p>
              <div className="service-actions">
                <Link to="/support" className="btn btn-primary">About Lifetime membership →</Link>
                <a href={supportHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  Optional donation <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <header className="service-panel-head">
                <h2 id="keepers-title">The Keepers</h2>
                <span>{total} and counting</span>
              </header>
              <div className="keepers-groups">
                {grouped.filter(group => group.people.length).map(group => (
                  <section className="keepers-group" key={group.key} aria-labelledby={`keepers-${group.key.replaceAll(' ', '-').toLowerCase()}`}>
                    <header>
                      <h3 id={`keepers-${group.key.replaceAll(' ', '-').toLowerCase()}`}>{group.label}</h3>
                      <p>{group.sub}</p>
                    </header>
                    <ul>
                      {group.people.map((person, index) => (
                        <li key={`${person.name}-${index}`}>
                          <strong>{person.name}</strong>
                          {person.dedication && <span>in honour of {person.dedication}</span>}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <div className="service-actions keepers-actions">
                <Link to="/support" className="btn btn-primary">About Lifetime membership →</Link>
                <a href={supportHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Optional donation <span aria-hidden="true">↗</span></a>
                <Link to="/lessons" className="btn btn-ghost">Explore all 52 lessons</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
