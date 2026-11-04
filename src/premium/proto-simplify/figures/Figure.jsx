/**
 * The figure shell and its three stages (row, fork, grid). The shell holds the
 * number, title, text alternative and controls; a stage draws one exact frame from
 * (scene, t). Nothing on a stage uses a CSS transition or animation.
 */
import { useCallback, useId, useMemo, useState } from 'react'
import { useFigureClock } from '../lib/clock.js'
import { useTileFont, useWidth } from '../lib/metrics.js'
import { land, ramp, travel } from '../lib/motion.js'
import { rowFrame, rowGeometry, rowLayouts, rowTimeline } from './row.js'
import { forkFrame, forkGeometry, forkLayouts, forkTimeline } from './fork.js'
import { gridTimeline } from './grid-timeline.js'
import '../proto.css'

const ROLE_LABEL = {
  tense: 'tense',
  verb: 'verb',
  pronoun: 'pronoun',
  noun: 'noun subject',
  question: 'question word',
  place: 'place',
}

/** Marks Tongan in a rich string; each piece carries data-tongan for the sweep. */
export function Rich({ text }) {
  return String(text).split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) => (
    part.startsWith('*') && part.endsWith('*')
      ? <span key={i} className="fx-to" lang="to" data-tongan={part.slice(1, -1)}>{part.slice(1, -1)}</span>
      : <span key={i}>{part}</span>
  ))
}

export function Label({ role, label }) {
  if (role === 'focus') {
    return <>focus <span className="fx-to" lang="to" data-tongan="ʻa">ʻa</span></>
  }
  return label ?? ROLE_LABEL[role] ?? null
}

function TileFace({ face, style }) {
  return (
    <span className={`ft-face role-${face.role}`} style={style}>
      <span className="ft-word" lang="to" data-tongan={face.text}>{face.text}</span>
    </span>
  )
}

/** One tile in its resting form, for the hero's still row and the limit row. */
export function StaticTile({ face, ring = false, showLabel = true, small = false }) {
  return (
    <span className={`ft-static ${small ? 'is-small' : ''}`}>
      <span className={`ft-static-box role-${face.role} ${ring ? 'has-ring' : ''}`}>
        <span className="ft-word" lang="to" data-tongan={face.text}>{face.text}</span>
      </span>
      {showLabel && <span className={`ft-label label-${face.role}`}><Label role={face.role} /></span>}
    </span>
  )
}

/* ──────────── Row stage ──────────── */

function RowStage({ scene, timeline, t, width, def }) {
  const layout = useMemo(() => rowLayouts(scene, width), [scene, width])
  const geometry = useMemo(() => rowGeometry(layout.s, scene), [layout.s, scene])
  const frame = rowFrame(scene, timeline, t, layout, geometry)
  const { s } = frame
  const vars = { '--fs': `${s.fs}px`, '--h': `${s.h}px`, '--pad': `${s.pad}px`, height: geometry.height }
  return (
    <div className="ft-row" style={vars}>
      {scene.before && (
        <p className="ft-before" style={{ opacity: frame.beforeOpacity }}>
          <span className="ft-before-k">Before</span>
          <span className="fx-to" lang="to" data-tongan={scene.before.say}>{scene.before.say}</span>
          <span className="ft-before-en">{scene.before.en}</span>
        </p>
      )}
      <svg className="ft-over" width={width} height={geometry.height} aria-hidden="true">
        {frame.arc && (
          <>
            <path d={frame.arc.d} className="ft-arc" pathLength="1" strokeDasharray={`${frame.arc.progress} 1`} />
            {frame.arc.arrow && <Arrow arc={frame.arc} />}
          </>
        )}
        {frame.line > 0 && <AbsenceLine frame={frame} geometry={geometry} scene={scene} />}
      </svg>
      {frame.tiles.map(tile => (
        <RowTile key={tile.id} tile={tile} frame={frame} geometry={geometry} s={s} />
      ))}
      {frame.olds.map(old => (
        <span key={old.text} className="ft-old" lang="to" data-tongan={old.text} style={{ transform: `translate(${old.x}px, ${old.y}px)`, opacity: old.opacity }}>{old.text}</span>
      ))}
      {frame.marks.map(mark => (
        <span key={mark.n} className={`ft-mark ${mark.onArc ? 'is-on-arc' : ''}`} style={{ transform: `translate(${mark.x}px, ${mark.y}px) translate(-50%, -50%) scale(${mark.scale})` }}>{mark.n}</span>
      ))}
      <p className="ft-en" style={{ top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)` }}>
        <EnglishLine text={frame.en?.text} first={scene.enFirstWord} />
      </p>
    </div>
  )
}

function EnglishLine({ text, first }) {
  if (!text) return null
  if (first && text.startsWith(`${first} `)) return <><span className="ft-en-it">{first}</span>{text.slice(first.length)}</>
  return text
}

function Arrow({ arc }) {
  const len = Math.hypot(arc.tx, arc.ty) || 1
  const ux = arc.tx / len
  const uy = arc.ty / len
  const size = 7
  const wing = 0.5
  const x = arc.endX
  const y = arc.y0
  const ax = x - size * (ux - wing * uy)
  const ay = y - size * (uy + wing * ux)
  const bx = x - size * (ux + wing * uy)
  const by = y - size * (uy - wing * ux)
  return <path d={`M ${ax} ${ay} L ${x} ${y} L ${bx} ${by}`} className="ft-arc ft-arrow" />
}

/** The line from the English "It" that reaches nothing in the Tongan row. */
function AbsenceLine({ frame, geometry }) {
  const slot = frame.tiles.find(tile => tile.id === 'SLOT')
  if (!slot) return null
  const x0 = 7
  const y0 = geometry.enTop + 6
  const x1 = slot.x + slot.w / 2
  const y1 = geometry.rowTop + frame.s.h
  const d = `M ${x0} ${y0} C ${x0} ${y0 - 22}, ${x1} ${y1 + 38}, ${x1} ${y1 + 6}`
  return (
    <>
      <path d={d} className="ft-arc" pathLength="1" strokeDasharray={`${frame.line} 1`} />
      {frame.line > 0.98 && <circle cx={x1} cy={y1 + 3} r="3.25" className="ft-end" />}
    </>
  )
}

function RowTile({ tile, frame, geometry, s }) {
  const style = {
    width: tile.w,
    top: geometry.rowTop,
    height: s.h,
    transform: `translate3d(${tile.x}px, ${tile.y}px, 0)`,
    opacity: tile.opacity,
    zIndex: tile.z,
  }
  if (tile.id === 'GHOST') return <span className="ft-tile ft-ghost" style={style} />
  if (tile.id === 'SLOT') {
    const w = tile.w
    const h = s.h
    return (
      <span className="ft-tile" style={style}>
        <svg className="ft-slot-line" width={w} height={h} aria-hidden="true">
          <rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="9.5" pathLength="1" className="ft-slot-rect" strokeDasharray={frame.slot >= 1 ? '0.018 0.012' : `${frame.slot} 1`} />
        </svg>
        <span className="ft-slot-label" style={{ opacity: ramp(frame.slot, 0.6, 1) }}>no subject</span>
      </span>
    )
  }
  const rolling = tile.roll > 0 && tile.roll < 1 && tile.faceA !== tile.faceB
  const finalFace = tile.roll >= 1 ? tile.faceB : tile.faceA
  return (
    <span className="ft-tile" style={style}>
      <span className={`ft-box ${tile.outline > 0 ? 'is-outlining' : ''} ${rolling ? 'is-rolling' : ''}`} style={tile.outline > 0 ? { '--outline': tile.outline } : undefined}>
        {rolling ? (
          <>
            <TileFace face={tile.faceA} style={{ transform: `translateY(${-tile.roll * 100}%)` }} />
            <TileFace face={tile.faceB} style={{ transform: `translateY(${(1 - tile.roll) * 100}%)` }} />
          </>
        ) : (
          <TileFace face={finalFace} />
        )}
      </span>
      <span className={`ft-label label-${tile.labelFace.role}`} style={{ opacity: tile.labelOpacity, top: s.h + 7 }}>
        <Label role={tile.labelFace.role} />
      </span>
    </span>
  )
}

/* ──────────── Fork stage ──────────── */

function ForkStage({ def, scene, timeline, t, width, onLane }) {
  const layout = useMemo(() => forkLayouts(scene, width), [scene, width])
  const geometry = useMemo(() => forkGeometry(layout.s, width), [layout.s, width])
  const frame = forkFrame(scene, timeline, t, layout, geometry)
  const { s } = frame
  const vars = { '--fs': `${s.fs}px`, '--h': `${s.h}px`, '--pad': `${s.pad}px`, height: geometry.height }
  return (
    <div className="ff" style={vars}>
      <div className="ff-lanes" style={{ gap: geometry.laneGap, height: geometry.laneH }}>
        {def.lanes.map((lane, i) => (
          <button key={lane.label} type="button" className="ff-lane" style={{ '--lit': frame.lit[i] ?? 0 }} onClick={() => onLane(i)} aria-pressed={(frame.lit[i] ?? 0) > 0.5}>
            <span className="ff-lane-l">{lane.label}</span>
            <span className="ff-lane-f">
              {lane.forms.map(form => <span key={form} className="ft-word" lang="to" data-tongan={form}>{form}</span>)}
            </span>
          </button>
        ))}
      </div>
      <svg className="ft-over" width={width} height={geometry.height} aria-hidden="true">
        {frame.branches.map(branch => (
          <g key={branch.lane}>
            <path d={branch.d} className="ff-branch" />
            {branch.progress > 0 && <path d={branch.d} className="ff-branch is-lit" pathLength="1" strokeDasharray={`${branch.progress} 1`} />}
          </g>
        ))}
      </svg>
      <div className="ff-row" aria-hidden="true" style={{ opacity: frame.rowOpacity }}>
        {frame.row.items.map((item, i) => {
          const style = { width: item.w, top: geometry.rowTop, height: s.h, transform: `translate3d(${item.x}px, 0, 0)` }
          if (item.slot) {
            return (
              <span key={i} className="ft-tile" style={style}>
                <span className="ft-ghost is-slot" style={{ opacity: frame.slotOpacity }} />
                {item.label && <span className={`ft-label label-${item.form.role}`} style={{ top: s.h + 7 }}><Label role={item.form.role} /></span>}
              </span>
            )
          }
          return (
            <span key={i} className="ft-tile" style={style}>
              <span className="ft-box"><TileFace face={item} /></span>
              {item.ring && (
                <span className={`ft-label label-${item.role}`} style={{ top: s.h + 7, opacity: frame.ringLabel }}><Label role={item.role} /></span>
              )}
            </span>
          )
        })}
        {frame.ring && (
          <span className="ff-ring" style={{ top: geometry.rowTop, height: s.h, width: frame.ring.w, transform: `translate3d(${frame.ring.x}px, 0, 0)`, opacity: frame.ring.opacity }} />
        )}
        {frame.form && frame.form.opacity > 0 && (
          <span className="ft-tile ff-form" style={{ width: frame.form.w, top: 0, height: s.h, opacity: frame.form.opacity, transform: `translate3d(${frame.form.x}px, ${frame.form.y}px, 0) scale(${frame.form.scale})` }}>
            <span className="ft-box"><TileFace face={frame.form.face} /></span>
          </span>
        )}
      </div>
      <p className="ft-en" style={{ top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)`, textAlign: 'center', left: 0, right: 0 }}>
        {frame.en?.text}
      </p>
    </div>
  )
}

/* ──────────── Grid stage ──────────── */

function GridStage({ def, timeline, t, picked, onPick }) {
  const { beats } = timeline
  const selBeat = beats.at(-1)
  const selP = ramp(t, selBeat.start, selBeat.travelEnd)
  const chosen = picked || (selP > 0 ? def.rest : null)
  const chosenCell = chosen ? def.rows[chosen.row].cells[chosen.col] : null
  const sentenceP = picked ? 1 : ramp(selP, 0.35, 1)
  return (
    <div className="fg">
      <table className="fg-t">
        <thead>
          <tr>
            {def.head.map((head, i) => <th key={head} scope="col" className={i === 0 ? 'fg-th-tense' : ''}>{head}</th>)}
          </tr>
        </thead>
        <tbody>
          {def.rows.map((row, r) => {
            const b = beats[r]
            const rowLit = picked ? 0 : ramp(t, b.start, b.start + 220) * (1 - ramp(t, b.end - 40, b.end + 180))
            const tag = picked ? 1 : land(ramp(t, b.start + 120, b.travelEnd))
            return (
              <tr key={row.tense} style={{ '--lit': rowLit }} className="fg-row">
                <th scope="row" className="fg-rowhead">
                  <span className="fg-tense">{row.tense}</span>
                  <span className={`fg-tag ${row.tag === 'Changes form' ? 'is-changes' : ''}`} style={{ opacity: tag, transform: `translateY(${(1 - tag) * 4}px)` }}>{row.tag}</span>
                </th>
                {row.cells.map((cell, c) => {
                  const isOn = chosen?.row === r && chosen?.col === c
                  const fill = isOn ? (picked ? 1 : travel(ramp(selP, 0, 0.5))) : 0
                  return (
                    <td key={c}>
                      <button type="button" className={`fg-cell ${c === 1 ? 'is-noun' : 'is-pron'}`} style={{ '--fill': fill }} aria-pressed={isOn} onClick={() => onPick({ row: r, col: c })} data-tongan={cell.say} lang="to">
                        <span className="fg-marker">{cell.marker}</span>{cell.rest}
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="fg-out">
        <p className="fg-say" style={{ opacity: chosenCell ? sentenceP : 0 }}>
          {chosenCell && <span className="fx-to" lang="to" data-tongan={chosenCell.say}>{chosenCell.say}</span>}
          {chosenCell && <span className="fg-en">{chosenCell.en}</span>}
        </p>
        <p className="fg-caption"><Rich text={def.caption} /></p>
      </div>
    </div>
  )
}

/* ──────────── Shell ──────────── */

function Alt({ def, scene }) {
  if (def.kind === 'grid') return null // A real table: a screen reader reads it directly.
  const lines = def.alt || scene.alt || []
  const limit = null
  return (
    <ul className="visually-hidden">
      {lines.map(line => <li key={line}><Rich text={line} /></li>)}
      {limit}
    </ul>
  )
}

function LimitRow({ limit, p }) {
  return (
    <div className="ft-limit" aria-hidden="true" style={{ opacity: p, transform: `translateY(${(1 - land(p)) * 10}px)` }}>
      <div className="ft-limit-row">
        {limit.row.map(item => <StaticTile key={item.text} face={item} ring={item.ring} showLabel={false} small />)}
        <span className="ft-limit-en">{limit.en}</span>
      </div>
      <p className="ft-limit-cap">{limit.caption}</p>
    </div>
  )
}

/** Sets the list item's underlay from the frame, so the clock stays the only cause. */
function useListLink(def, rootRef) {
  return useCallback((scene, t, timeline) => {
    if (!def.linkList) return
    const root = rootRef.current
    const list = root?.closest('.blk')?.querySelector('ol.lst')
    if (!list) return
    const items = [...list.children]
    items.forEach(item => item.style.setProperty('--lit', 0))
    timeline.beats.forEach(b => {
      if (b.li == null || !items[b.li]) return
      const v = ramp(t, b.start - 120, b.start + 160) * (1 - ramp(t, b.end - 80, b.end + 120))
      if (v > 0) items[b.li].style.setProperty('--lit', v.toFixed(3))
    })
  }, [def, rootRef])
}

export default function Figure({ def, external = null, autoplay = true, compact = false }) {
  useTileFont()
  const [stageRef, width] = useWidth()
  const headingId = useId()
  const [picked, setPicked] = useState(null)
  const timelines = useMemo(() => def.scenes.map(scene => (
    def.kind === 'row' ? rowTimeline(scene) : def.kind === 'fork' ? forkTimeline(scene) : gridTimeline(def)
  )), [def])
  const [rootHolder] = useState(() => ({ current: null }))
  const onFrame = useListLink(def, rootHolder)
  const clock = useFigureClock({ id: def.id, timelines, external, autoplay, scenes: def.scenes.length, onFrame })
  const setRoot = useCallback(node => {
    clock.rootRef.current = node
    rootHolder.current = node
  }, [clock.rootRef, rootHolder])

  const scene = def.scenes[clock.scene]
  const atEnd = clock.atRest
  const onInteract = () => clock.stopAuto()

  const onLane = lane => {
    setPicked(null)
    const span = clock.timeline.spans.find(item => item.lane === lane)
    if (span) clock.playSpan(span.start, span.end)
  }
  const nextChange = () => {
    if (atEnd) setPicked(null)
    clock.next()
  }
  const another = () => {
    setPicked(null)
    clock.another()
  }

  const limitP = def.limit ? ramp(clock.t, clock.timeline.beats.find(b => b.kind === 'limit')?.start ?? 0, clock.timeline.beats.find(b => b.kind === 'limit')?.travelEnd ?? 1) : 0

  return (
    <figure
      ref={setRoot}
      className={`fx fx-${def.kind} ${compact ? 'is-compact' : ''}`}
      id={`fig-${def.id.replace('.', '-')}`}
      data-figure={def.id}
      data-scene={clock.scene}
      data-at-rest={atEnd ? 'true' : 'false'}
      aria-labelledby={headingId}
      onPointerDownCapture={onInteract}
      onKeyDownCapture={onInteract}
    >
      <figcaption className="fx-head" id={headingId}>
        <span className="fx-k">Figure {def.id}</span>
        <span className="fx-t"><Rich text={def.title} /></span>
      </figcaption>
      <div className="fx-stage" ref={stageRef} aria-hidden={def.kind === 'row' ? 'true' : undefined}>
        {width > 0 && def.kind === 'row' && <RowStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} />}
        {width > 0 && def.kind === 'fork' && <ForkStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} onLane={onLane} />}
        {width > 0 && def.kind === 'grid' && <GridStage def={def} timeline={clock.timeline} t={clock.t} picked={picked} onPick={setPicked} />}
      </div>
      <Alt def={def} scene={scene} />
      <div className="fx-controls">
        <button type="button" className="fx-b is-main" onClick={nextChange}>{atEnd ? 'Play again' : 'Next change'}</button>
        {def.scenes.length > 1 && <button type="button" className="fx-b" onClick={another}>Another example</button>}
      </div>
      {def.limit && <LimitRow limit={def.limit} p={limitP} />}
    </figure>
  )
}
