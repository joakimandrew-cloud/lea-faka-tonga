import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import T from '../components/T.jsx'
import { filteredDrillGroups, GROUPS, LEVELS, premiumRouteFor, UNCATALOGUED_DRILLS } from '../lib/source-routes.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'

const LEVEL_FILTERS = [['all', 'All'], ...Object.entries(LEVELS)]

function DrillCard({ drill }) {
  return (
    <Link className="catalog-card" to={premiumRouteFor(drill.id)}>
      <span className="catalog-card-top">
        <span>Lesson {drill.ch}</span>
        <span>{LEVELS[drill.level]}</span>
      </span>
      <span className="catalog-sample" aria-hidden="true">
        <span>{drill.sample.q}</span>
        <T>{drill.sample.ton}</T>
      </span>
      <strong>{drill.title}</strong>
      <span className="catalog-card-copy">{drill.blurb}</span>
      <span className="catalog-card-action">{drill.action} <span aria-hidden="true">→</span></span>
    </Link>
  )
}

function DrillGroup({ section, filtering, open, onToggle }) {
  const { visible } = section
  if (filtering && visible.length === 0) return null
  return (
    <section className="catalog-group" aria-labelledby={`drill-group-${section.key}`}>
      <header>
        <div>
          <p className="catalog-kicker">{visible.length} {visible.length === 1 ? 'drill' : 'drills'}</p>
          <h2 id={`drill-group-${section.key}`}>{section.name}</h2>
          <p>{section.note}</p>
        </div>
      </header>
      <div className="catalog-grid">
        {visible.map(drill => <DrillCard key={drill.id} drill={drill} />)}
      </div>
      {!filtering && section.inChapters.length > 0 && (
        <div className="catalog-more">
          <button type="button" onClick={onToggle} aria-expanded={open}>
            {open ? 'Hide lesson drills' : `In the lessons · ${section.inChapters.length} more`}
          </button>
          {open && (
            <ul>
              {section.inChapters.map(row => (
                <li key={row.id}>
                  <Link to={premiumRouteFor(row.id)}>
                    <span>{row.label}</span>
                    <span>Lesson {row.ch} <span aria-hidden="true">→</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}

export default function Drills() {
  useTitle('Practice drills')
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [openGroups, setOpenGroups] = useState({})
  const sections = useMemo(() => filteredDrillGroups(query, level), [query, level])
  const total = GROUPS.reduce((sum, group) => sum + group.drills.length, 0)
  const shown = sections.reduce((sum, group) => sum + group.visible.length, 0)
  const filtering = query.trim() !== '' || level !== 'all'

  const clear = () => {
    setQuery('')
    setLevel('all')
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  return (
    <div className="catalog-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Drills · Practice at your pace</p>
          <h1 className="display">Practice one<br />pattern.</h1>
          <p><T>Ngāue Fakaʻilo.</T> {total} featured drills, grouped by skill, plus the practice placed inside lessons.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search drills</span>
            <input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try tense, possessive, counting" />
          </label>
          <div className="catalog-filters" role="group" aria-label="Filter drills by level">
            {LEVEL_FILTERS.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={level === key} onClick={() => setLevel(key)}>{label}</button>
            ))}
          </div>
        </div>
        <p className="catalog-count" role="status" aria-live="polite">{shown} of {total} featured drills{filtering ? ' match your filters' : ''}</p>
        {shown === 0 ? (
          <div className="catalog-empty">
            <h2>No drills match.</h2>
            <p>Try a different word or clear the level filter.</p>
            <button type="button" className="btn btn-primary" onClick={clear}>Clear search and filters</button>
          </div>
        ) : (
          <>
            {sections.map(section => (
              <DrillGroup
                key={section.key}
                section={section}
                filtering={filtering}
                open={Boolean(openGroups[section.key])}
                onToggle={() => setOpenGroups(previous => ({ ...previous, [section.key]: !previous[section.key] }))}
              />
            ))}
            {!filtering && UNCATALOGUED_DRILLS.length > 0 && (
              <section className="catalog-group catalog-registry" aria-labelledby="registry-practice">
                <header><div><p className="catalog-kicker">Keep practising</p><h2 id="registry-practice">More practice</h2></div></header>
                <ul>
                  {UNCATALOGUED_DRILLS.map(drill => (
                    <li key={drill.id}><Link to={premiumRouteFor(drill.id)}><strong>{drill.title}</strong><span>{drill.blurb}</span><span aria-hidden="true">→</span></Link></li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
