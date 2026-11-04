/** The Path stage: marks or panels, arrows, a particle on each, and the sentence below. */
import { PersonMark } from './Marks.jsx'
import { pathFrame } from './path.js'

const LABEL = { speaker: 'speaker', listener: 'listener', third: 'third person' }

function ArrowHead({ end, tan, size = 8 }) {
  const len = Math.hypot(tan.x, tan.y) || 1
  const ux = tan.x / len
  const uy = tan.y / len
  const wing = 0.55
  const ax = end.x - size * (ux - wing * uy)
  const ay = end.y - size * (uy + wing * ux)
  const bx = end.x - size * (ux + wing * uy)
  const by = end.y - size * (uy - wing * ux)
  return <path d={`M ${ax} ${ay} L ${end.x} ${end.y} L ${bx} ${by}`} className="fp-head" />
}

/** Where a particle sits: on its curve, or beside it where the curve is short. */
function tilePlace(arrow, frame) {
  const { line, c, i } = arrow
  const { geo, space } = frame
  if (space) {
    const x = geo.colX(i) + geo.colW * (c.dir === 'around' ? 0.5 : 0.68)
    const y = c.dir === 'around' ? 18 : geo.height * 0.46
    return { x, y }
  }
  const mid = line.at(0.5)
  if (c.to === 'third') return { x: mid.x - (geo.phone ? 36 : 44), y: mid.y - (geo.phone ? 6 : 4) }
  if (c.to === 'away') return { x: mid.x + (geo.phone ? 4 : 0), y: mid.y - (geo.tile.h / 2 + (geo.phone ? 5 : 6)) }
  return mid
}

export function PathStage({ def, scene, timeline, t, width, picked }) {
  const frame = pathFrame(def, scene, timeline, t, width, picked)
  const { geo, space, arrows, c, say } = frame
  const marks = def.marks || []
  return (
    <div className={`fp ${space ? 'is-space' : 'is-people'}`}>
      <div className="fp-field" style={{ height: geo.height }}>
        {space && scene.cases.map((item, i) => (
          <span key={item.particle} className="fp-col" style={{ left: geo.colX(i), width: geo.colW, height: geo.height }} />
        ))}
        {!space && marks.map(who => {
          const place = geo.places[who]
          return (
            <span key={who} className="fp-mark" style={{ transform: `translate(${place.x - geo.mw / 2}px, ${place.y}px)`, width: geo.mw }}>
              <PersonMark who={who} w={geo.mw} />
              <span className="ft-label fp-label" style={{ top: geo.mh + 6 }}>{LABEL[who]}</span>
            </span>
          )
        })}
        <svg className="ft-over" width={width} height={geo.height} aria-hidden="true">
          {arrows.map(arrow => {
            const { line, progress, isCurrent, i } = arrow
            const cls = isCurrent ? 'is-on' : 'is-off'
            return (
              <g key={i} className={`fp-arrow ${cls}`}>
                {line.ground != null && <line x1={geo.colX(i) + 6} x2={geo.colX(i) + geo.colW - 6} y1={line.ground} y2={line.ground} className="fp-ground" />}
                {line.dot && progress > 0 && <circle cx={line.dot.x} cy={line.dot.y} r="3.5" className="fp-dot" />}
                {progress > 0 && <path d={line.d} className="fp-line" pathLength="1" strokeDasharray={`${progress} 1`} />}
                {progress > 0.97 && line.end && <ArrowHead end={line.end} tan={line.tan} size={geo.phone ? 8 : 9} />}
              </g>
            )
          })}
        </svg>
        {arrows.map(arrow => {
          if (arrow.tile <= 0) return null
          const place = tilePlace(arrow, frame)
          return (
            <span
              key={arrow.i}
              className={`fp-tile ${arrow.isCurrent ? 'role-particle' : 'role-quiet is-off'}`}
              style={{ '--fs': `${geo.tile.fs}px`, height: geo.tile.h, padding: `0 ${geo.tile.pad}px`, opacity: arrow.isCurrent ? arrow.tile : 1, transform: `translate(${place.x}px, ${place.y}px) translate(-50%, -50%)` }}
            >
              <span className="ft-word" lang="to" data-tongan={arrow.c.particle}>{arrow.c.particle}</span>
            </span>
          )
        })}
      </div>
      <p className="fp-say" style={{ opacity: say.opacity, transform: `translateY(${say.y}px)` }}>
        <span className="fx-to" lang="to" data-tongan={c.say}>{c.say}</span>
        <span className="fp-en" data-en={c.en}>{c.en}</span>
      </p>
    </div>
  )
}

/** One chip per particle, under its column or in order. */
export function PathChips({ scene, current, onPick }) {
  return (
    <div className="fx-chips" style={{ '--n': scene.cases.length }}>
      {scene.cases.map((c, i) => (
        <button key={c.particle} type="button" className={`fx-chip ${i === current ? 'is-on' : ''}`} aria-pressed={i === current} onClick={() => onPick(i)}>
          <span className="fx-chip-to" lang="to" data-tongan={c.particle}>{c.particle}</span>
          <span className="fx-chip-en" data-en={c.dirText}>{c.dirText}</span>
        </button>
      ))}
    </div>
  )
}
