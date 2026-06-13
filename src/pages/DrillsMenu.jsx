import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Practice Drills menu — Netflix-shelf browser (visual refresh, 2026-06-13).
 *
 * Curation: audits/Exercise-Overwhelm-Review.md (X01–X04) cut the board from
 * 49 cards to 28, judge-verified; the skill-family grouping survives from
 * that review. Presentation (Andrew's ruling, plans/drills-page-visual-refresh.md):
 * each skill family is a horizontally swipeable shelf of large cards, and the
 * top half of every card previews a REAL item from that drill's deck — the
 * sample sentences are verbatim from the Cores, never invented. A search box
 * and level chips narrow the board; chapter-embedded drills stay as quiet
 * dotted-leader rows per shelf. The page follows the app theme toggle (see
 * the .drills-board token overrides in v11-components.css). Level badges read
 * Beginner / Intermediate / Advanced — CEFR codes are banned everywhere
 * (DECISIONS.md, 2026-06-13).
 *
 * Routing: a card links to its bespoke page where one exists (richer lesson
 * aside), otherwise to the generic /drill/:id route which mounts the Core
 * from the registry. Chapter-only rows always use routeFor() too.
 */

import { LEVELS, GROUPS } from '../data/drills-catalog'

// Drills with a richer bespoke page keep their own route; the rest use the
// generic /drill/:id route that mounts the registry Core.
const BESPOKE = {
  'tense-swapper': '/tense-swap',
  'first-word-quiz': '/first-word',
  'skeleton-filler': '/skeleton-filler',
  'possessive-sorter': '/possessive-sort',
  'clusivity-corner': '/clusivity',
  'adjective-flip': '/adjective-flip',
  'faka-pattern-sorter': '/faka-sort',
  'cleft-builder': '/cleft-builder',
  'accent-placement-picker': '/accent-placement',
  'verbal-noun-converter': '/verbal-noun',
  'terminal-builder': '/sentence-builder',
}
const routeFor = (id) => BESPOKE[id] || `/drill/${id}`

function ShelfCard({ drill }) {
  const s = drill.sample
  return (
    <Link to={routeFor(drill.id)} className="drill-ncard reveal">
      <div className="drill-screen" aria-hidden="true">
        <span className="q">{s.q}</span>
        <span className="ton">{s.ton}</span>
        <span className="opts">
          {s.opts.map((o, i) => (
            <span key={o} className={`opt${i === s.sel ? ' sel' : ''}`}>{o}</span>
          ))}
        </span>
      </div>
      <div className="drill-nbody">
        <div className="drill-ntitle">{drill.title}</div>
        <p className="drill-ndesc">{drill.blurb}</p>
      </div>
      <div className="drill-nfoot">
        <span className="drill-nmeta">Ch {drill.ch} · {LEVELS[drill.level]}</span>
        <span className="drill-ngo">{drill.action} →</span>
      </div>
    </Link>
  )
}

function Shelf({ group, cards, chaptersOpen, onToggleChapters, filtering }) {
  const reelRef = useRef(null)
  const scroll = (dir) => {
    const el = reelRef.current
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' })
  }
  return (
    <div className="drill-shelf">
      <div className="drill-shelf-head">
        <span className="drill-shelf-name">{group.name} <span className="cnt">· {cards.length}</span></span>
        <span className="drill-shelf-note">{group.note}</span>
        <span className="drill-shelf-arrows">
          <button type="button" className="drill-shelf-arrow" aria-label={`Scroll ${group.name} backward`} onClick={() => scroll(-1)}>‹</button>
          <button type="button" className="drill-shelf-arrow" aria-label={`Scroll ${group.name} forward`} onClick={() => scroll(1)}>›</button>
        </span>
      </div>
      <div className="drill-reel" ref={reelRef}>
        {cards.map((d) => (
          <ShelfCard key={d.id} drill={d} />
        ))}
      </div>
      {!filtering && group.inChapters.length > 0 && (
        <div className="drills-group-foot">
          <button
            type="button"
            className="drills-chapters-toggle"
            onClick={onToggleChapters}
            aria-expanded={chaptersOpen}
          >
            {chaptersOpen ? '− In the chapters' : `+ In the chapters · ${group.inChapters.length} more`}
          </button>
        </div>
      )}
      {!filtering && chaptersOpen && (
        <ul className="drills-toc">
          {group.inChapters.map((row) => (
            <li key={row.id}>
              <Link to={routeFor(row.id)} className="drills-toc-row">
                <span className="drills-toc-label">{row.label}</span>
                <span className="drills-toc-leader" aria-hidden="true" />
                <span className="drills-toc-ch">Ch {row.ch}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const matches = (drill, query) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    drill.title.toLowerCase().includes(q) ||
    drill.blurb.toLowerCase().includes(q) ||
    `ch ${drill.ch}`.includes(q)
  )
}

export default function DrillsMenu() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [chaptersOpen, setChaptersOpen] = useState({}) // groupKey → true (show in-chapter rows)

  const filtering = query.trim() !== '' || level !== 'all'
  const total = GROUPS.reduce((n, g) => n + g.drills.length, 0)

  const sections = GROUPS.map((group) => {
    const visible = group.drills.filter(d => (level === 'all' || d.level === level) && matches(d, query))
    return { group, visible }
  })
  const shownTotal = sections.reduce((n, s) => n + s.visible.length, 0)

  return (
    <div className="panel-section drills-board">
      <div className="panel-frame">

        <div className="panel-heading">
          <h1>Practice <span className="dot">·</span> Drills</h1>
          <p className="lead">
            <span className="tongan">Ngāue Fakaʻilo.</span>{' '}
            {total} targeted exercises, each isolating a single grammar pattern, grouped by the skill they build. Every card shows a taste of the real thing — swipe along a shelf to browse. More drills live inside the book chapters at the exact moment each pattern is taught; every group lists its own.
          </p>
        </div>

        <div className="drills-filter">
          <input
            type="search"
            className="drills-search"
            placeholder="Search drills (e.g., tense, possessive, counting)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search drills"
          />
          <div className="drills-chips" role="group" aria-label="Filter by level">
            {[['all', 'All'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`drills-chip${level === key ? ' is-active' : ''}`}
                onClick={() => setLevel(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filtering && shownTotal === 0 && (
          <p className="drills-empty">No drills match — try a different word, or clear the level filter.</p>
        )}

        {sections.map(({ group, visible }) => {
          if (filtering && visible.length === 0) return null
          return (
            <Shelf
              key={group.key}
              group={group}
              cards={visible}
              filtering={filtering}
              chaptersOpen={!!chaptersOpen[group.key]}
              onToggleChapters={() => setChaptersOpen(o => ({ ...o, [group.key]: !o[group.key] }))}
            />
          )
        })}

        <div className="panel-colophon">
          <div><strong>{total} Drills</strong> · One pattern each · Grouped by skill · The rest live in their chapters</div>
          <div className="tonga-sig">Ngāue lelei</div>
        </div>

      </div>
    </div>
  )
}
