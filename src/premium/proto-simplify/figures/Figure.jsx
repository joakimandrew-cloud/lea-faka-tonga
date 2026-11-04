/**
 * The figure shell and its three stages (row, fork, grid). The shell holds the
 * number, title, text alternative and controls; a stage draws one exact frame from
 * (scene, t). Nothing on a stage uses a CSS transition or animation.
 */
import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { useFigureClock } from '../lib/clock.js'
import { textWidth, uiWidth, useTileFont, useWidth } from '../lib/metrics.js'
import { land, ramp, travel } from '../lib/motion.js'
import { rowFrame, rowGeometry, rowLayouts, rowSizes, rowStateAt, rowTimeline } from './row.js'
import { forkFrame, forkGeometry, forkLayouts, forkSizes, forkTimeline } from './fork.js'
import { gridTimeline } from './grid-timeline.js'
import { pathTimeline } from './path.js'
import { PathChips, PathStage } from './PathStage.jsx'
import { PersonMark } from './Marks.jsx'
import '../proto.css'

const ROLE_LABEL = {
  tense: 'tense',
  verb: 'verb',
  pronoun: 'pronoun',
  noun: 'noun subject',
  question: 'question word',
  place: 'place',
  particle: 'direction',
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
      {showLabel && <span className={`ft-label label-${face.role}`}><Label role={face.role} label={face.label} /></span>}
    </span>
  )
}

/* ──────────── Row stage ──────────── */

function beforeWidth(before) {
  return 52 + 8 + textWidth(before.say, 17) + 8 + uiWidth(before.en, `400 14px 'Inter Variable', Inter, sans-serif`)
}

function RowStage({ scene, timeline, t, width, def, override }) {
  const sizes = useMemo(() => rowSizes(def, width), [def, width])
  const layout = useMemo(() => rowLayouts(scene, width, sizes), [scene, width, sizes])
  // On a phone a long sentence takes two lines, in every scene, so the stage never changes height.
  const twoLineBefore = width < 480 && def.scenes.some(item => item.before && item.before.say.length + item.before.en.length > 40)
  const lines = useMemo(() => Math.max(...def.scenes.map(item => rowLayouts(item, width, sizes).lines)), [def, width, sizes])
  const reserveBefore = def.scenes.some(item => item.before)
  const geometry = useMemo(() => rowGeometry(sizes, scene, twoLineBefore, lines, reserveBefore), [sizes, scene, twoLineBefore, lines, reserveBefore])
  const frame = rowFrame(scene, timeline, t, layout, geometry, override)
  const { s } = frame
  const vars = { '--fs': `${s.fs}px`, '--h': `${s.h}px`, '--pad': `${s.pad}px`, height: geometry.height }
  // The sentence lines start at the row's left edge, unless that would run off the stage.
  const left = layout.x0
  const beforeLeft = scene.before && !twoLineBefore ? Math.max(0, Math.min(left, width - beforeWidth(scene.before))) : twoLineBefore ? Math.min(left, 8) : left
  return (
    <div className="ft-row" style={vars}>
      {scene.before && (
        <p className={`ft-before ${twoLineBefore ? 'is-two' : ''}`} style={{ opacity: frame.beforeOpacity, left: beforeLeft }}>
          <span className="ft-before-k">Before</span>
          <span className="fx-to" lang="to" data-tongan={scene.before.say}>{scene.before.say}</span>
          <span className="ft-before-en" data-en={scene.before.en}>{scene.before.en}</span>
        </p>
      )}
      <svg className="ft-over" width={width} height={geometry.height} aria-hidden="true">
        {frame.arc && (
          <>
            <path d={frame.arc.d} className="ft-arc" pathLength="1" strokeDasharray={`${frame.arc.progress} 1`} />
            {frame.arc.arrow && <Arrow arc={frame.arc} />}
          </>
        )}
        {frame.line > 0 && <AbsenceLine frame={frame} geometry={geometry} left={left} />}
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
      <p className={`ft-en ${frame.isLine ? 'is-line' : ''}`} data-en={frame.en?.text} style={{ left, top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)` }}>
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
function AbsenceLine({ frame, geometry, left }) {
  const slot = frame.tiles.find(tile => tile.id === 'SLOT')
  if (!slot) return null
  const x0 = left + 7
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
          {frame.slot > 0 && <rect x=".75" y=".75" width={w - 1.5} height={h - 1.5} rx="9.5" pathLength="1" className="ft-slot-rect" strokeDasharray={frame.slot >= 1 ? '0.018 0.012' : `${frame.slot} 1`} />}
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
        <Label role={tile.labelFace.role} label={tile.labelFace.label} />
      </span>
    </span>
  )
}

/* ──────────── Fork stage ──────────── */

const PERSON_LABEL = { speaker: 'speaker', listener: 'listener', third: 'others' }

/** The people above a Fork's lanes: a ring asks about one mark, a frame lands on each member. */
function ForkPeople({ people, frame, width }) {
  const phone = width < 480
  const w = phone ? 40 : 46
  const gap = phone ? 14 : 16
  const total = people.length * w + (people.length - 1) * gap
  const x0 = (width - total) / 2
  return (
    <div className="ff-people" style={{ height: phone ? 92 : 104 }}>
      {people.map((who, i) => {
        const inGroup = frame.frames?.members.includes(i)
        const groupStart = i === 0 || people[i - 1] !== who
        const run = people.filter((item, k) => k >= i && item === who && people.slice(i, k + 1).every(x => x === who)).length
        return (
          <span key={i} className="ff-person" style={{ left: x0 + i * (w + gap), width: w }}>
            <PersonMark who={who} w={w} frame={inGroup ? frame.frames.opacity : 0} />
            {frame.personRing?.index === i && frame.personRing.opacity > 0 && <span className="ff-person-ring" style={{ opacity: frame.personRing.opacity }} />}
            {groupStart && <span className="ft-label ff-person-l" style={{ left: `${(run * w + (run - 1) * gap) / 2}px` }}>{PERSON_LABEL[who]}</span>}
          </span>
        )
      })}
    </div>
  )
}

function ForkStage({ def, scene, timeline, t, width, onLane }) {
  const sizes = useMemo(() => forkSizes(def, width), [def, width])
  const layout = useMemo(() => forkLayouts(scene, width, sizes), [scene, width, sizes])
  const geometry = useMemo(() => forkGeometry(sizes, width, def), [sizes, width, def])
  const frame = forkFrame(scene, timeline, t, layout, geometry)
  const { s } = frame
  const vars = { '--fs': `${s.fs}px`, '--h': `${s.h}px`, '--pad': `${s.pad}px`, height: geometry.height }
  return (
    <div className="ff" style={vars}>
      {def.people && <ForkPeople people={def.people} frame={frame} width={width} />}
      <div className="ff-lanes" style={{ gap: geometry.laneGap, height: geometry.laneH, gridTemplateColumns: `repeat(${geometry.count}, minmax(0, 1fr))` }}>
        {def.lanes.map((lane, i) => (
          <button key={lane.label} type="button" className="ff-lane" style={{ '--lit': frame.lit[i] ?? 0 }} onClick={() => onLane(i)} aria-pressed={(frame.lit[i] ?? 0) > 0.5}>
            <span className="ff-lane-l"><Rich text={lane.label} /></span>
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
                {item.label && <span className={`ft-label label-${item.form.role}`} style={{ top: s.h + 7 }}><Label role={item.form.role} label={item.label === true ? undefined : item.label} /></span>}
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
      <p className="ft-en" data-en={frame.en?.text} style={{ top: geometry.enTop, opacity: frame.en?.opacity ?? 0, transform: `translateY(${frame.en?.y ?? 0}px)`, textAlign: 'center', left: 0, right: 0 }}>
        {frame.en?.text}
      </p>
    </div>
  )
}

/* ──────────── Grid stage ──────────── */

/** A cell's sentence with the marks: who the word means is framed, who it leaves out is not. */
function GridPeople({ cell, phone }) {
  const w = phone ? 30 : 36
  return (
    <span className="fg-people" aria-hidden="true">
      {cell.people.map((who, i) => <PersonMark key={i} who={who} w={w} frame={cell.members.includes(i) ? 1 : 0} />)}
    </span>
  )
}

function GridStage({ def, timeline, t, picked, onPick, width }) {
  const { beats } = timeline
  const selBeat = beats.at(-1)
  const selP = ramp(t, selBeat.start, selBeat.travelEnd)
  const chosen = picked || (selP > 0 ? def.rest : null)
  const chosenCell = chosen ? def.rows[chosen.row].cells[chosen.col] : null
  const sentenceP = picked ? 1 : ramp(selP, 0.35, 1)
  const litAt = b => (picked ? 0 : ramp(t, b.start, b.start + 220) * (1 - ramp(t, b.end - 40, b.end + 180)))
  const colLit = c => {
    const b = beats.find(item => item.kind === 'col' && item.col === c)
    return b ? litAt(b) : 0
  }
  return (
    <div className={`fg ${def.lightColumns ? 'is-people' : ''}`}>
      <table className="fg-t">
        <thead>
          <tr>
            {def.head.map((head, i) => (
              <th key={head || 'row'} scope="col" className={i === 0 ? 'fg-th-tense' : ''} style={i > 0 ? { color: `color-mix(in srgb, var(--ink) ${colLit(i - 1) * 100}%, var(--muted))` } : undefined}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {def.rows.map((row, r) => {
            const b = beats.find(item => item.kind === 'row' && item.row === r)
            const rowLit = b ? litAt(b) : 0
            const tag = picked || !b ? 1 : land(ramp(t, b.start + 120, b.travelEnd))
            return (
              <tr key={row.tense} style={{ '--lit': rowLit }} className="fg-row">
                <th scope="row" className="fg-rowhead">
                  <span className="fg-tense">{row.tense}</span>
                  {row.tag && <span className={`fg-tag ${row.tag === 'Changes form' ? 'is-changes' : ''}`} style={{ opacity: tag, transform: `translateY(${(1 - tag) * 4}px)` }}>{row.tag}</span>}
                </th>
                {row.cells.map((cell, c) => {
                  const isOn = chosen?.row === r && chosen?.col === c
                  const fill = isOn ? (picked ? 1 : travel(ramp(selP, 0, 0.5))) : 0
                  if (cell.none) return <td key={c}><span className="fg-cell is-none" lang="to" data-tongan={cell.form}>{cell.form}</span></td>
                  return (
                    <td key={c} style={{ '--col': colLit(c) }}>
                      <button type="button" className={`fg-cell ${c === 1 && !cell.form ? 'is-noun' : 'is-pron'} ${cell.form ? 'is-form' : ''}`} style={{ '--fill': fill }} aria-pressed={isOn} aria-label={cell.form ? `${cell.form}: ${cell.say} ${cell.en}` : undefined} onClick={() => onPick({ row: r, col: c })} data-tongan={cell.say} lang="to">
                        {cell.form ? (
                          <>
                            <span className="fg-mini" aria-hidden="true">{cell.count.map((who, i) => <PersonMark key={i} who={who} w={width < 480 ? 15 : 18} />)}</span>
                            <span className="fg-form" data-tongan={cell.form}>{cell.form}</span>
                          </>
                        ) : (
                          <><span className="fg-marker">{cell.marker}</span>{cell.rest}</>
                        )}
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
          {chosenCell?.people && <GridPeople cell={chosenCell} phone={width < 480} />}
          {chosenCell && <span className="fx-to" lang="to" data-tongan={chosenCell.say}>{chosenCell.say}</span>}
          {chosenCell && <span className="fg-en" data-en={chosenCell.en}>{chosenCell.en}</span>}
        </p>
        {def.caption && <p className="fg-caption"><Rich text={def.caption} /></p>}
      </div>
    </div>
  )
}

/* ──────────── Shell ──────────── */

function Alt({ def, scene }) {
  if (def.kind === 'grid') return null // A real table: a screen reader reads it directly.
  const lines = def.alt || scene.alt || []
  return (
    <ul className="visually-hidden">
      {lines.map(line => <li key={line}><Rich text={line} /></li>)}
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
  const [chipOverride, setChipOverride] = useState(null)
  const [pathPick, setPathPick] = useState(null)
  const timelines = useMemo(() => def.scenes.map(scene => (
    def.kind === 'row' ? rowTimeline(scene) : def.kind === 'fork' ? forkTimeline(scene) : def.kind === 'path' ? pathTimeline(scene) : gridTimeline(def)
  )), [def])
  const rootRef = useRef(null)
  const onFrame = useListLink(def, rootRef)
  const clock = useFigureClock({ id: def.id, rootRef, timelines, external, autoplay, scenes: def.scenes.length, onFrame })

  const scene = def.scenes[clock.scene]
  const atEnd = clock.atRest
  const onInteract = () => clock.stopAuto()

  // A lane plays its example; if this scene has none for the lane, the scene that does comes up.
  const onLane = lane => {
    setPicked(null)
    const span = clock.timeline.spans.find(item => item.lane === lane)
    if (span) { clock.playSpan(span.start, span.end); return }
    const index = timelines.findIndex(tl => tl.spans?.some(item => item.lane === lane))
    if (index < 0) return
    const there = timelines[index].spans.find(item => item.lane === lane)
    clock.playSpan(there.start, there.end, index)
  }
  const nextChange = () => {
    if (atEnd) setPicked(null)
    setChipOverride(null)
    clock.next()
  }
  const another = () => {
    setPicked(null)
    setChipOverride(null)
    setPathPick(null)
    clock.another()
  }
  // A Swap's chip: that form turns over from whichever form is showing.
  const swapState = def.chips ? rowStateAt(clock.timeline, clock.t, chipOverride) : null
  const onSwapChip = state => {
    const beat = Math.max(0, state - 1)
    setChipOverride({ beat, from: swapState, to: state })
    const b = clock.timeline.beats[beat]
    clock.playSpan(b.start, b.end)
  }
  const onPathChip = index => {
    setPathPick(index)
    const span = clock.timeline.spans[index]
    clock.playSpan(span.start, span.end)
  }
  const pathCurrent = def.kind === 'path' ? (pathPick ?? [...clock.timeline.beats].reverse().find(b => b.kind === 'draw' && clock.t > b.start)?.caseIndex ?? 0) : null

  const limitP = def.limit ? ramp(clock.t, clock.timeline.beats.find(b => b.kind === 'limit')?.start ?? 0, clock.timeline.beats.find(b => b.kind === 'limit')?.travelEnd ?? 1) : 0

  return (
    <figure
      ref={rootRef}
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
      <div className="fx-stage" ref={stageRef} aria-hidden={def.kind === 'row' || def.kind === 'path' ? 'true' : undefined}>
        {width > 0 && def.kind === 'row' && <RowStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} override={chipOverride} />}
        {width > 0 && def.kind === 'path' && <PathStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} picked={pathPick} />}
        {width > 0 && def.kind === 'fork' && <ForkStage def={def} scene={scene} timeline={clock.timeline} t={clock.t} width={width} onLane={onLane} />}
        {width > 0 && def.kind === 'grid' && <GridStage def={def} timeline={clock.timeline} t={clock.t} picked={picked} onPick={setPicked} width={width} />}
      </div>
      <Alt def={def} scene={scene} />
      {def.chips && (
        <div className="fx-chips" style={{ '--n': def.chips.length }}>
          {def.chips.map(chip => (
            <button key={chip.state} type="button" className={`fx-chip ${swapState === chip.state ? 'is-on' : ''}`} aria-pressed={swapState === chip.state} onClick={() => onSwapChip(chip.state)}>
              <span className="fx-chip-to" lang="to" data-tongan={chip.to}>{chip.to}</span>
              <span className="fx-chip-en" data-en={chip.en}>{chip.en}</span>
            </button>
          ))}
        </div>
      )}
      {def.kind === 'path' && <PathChips scene={scene} current={pathCurrent} onPick={onPathChip} />}
      {(!def.chips && def.kind !== 'path') || def.scenes.length > 1 ? (
        <div className="fx-controls">
          {!def.chips && def.kind !== 'path' && <button type="button" className="fx-b is-main" onClick={nextChange}>{atEnd ? 'Play again' : 'Next change'}</button>}
          {def.scenes.length > 1 && <button type="button" className="fx-b" onClick={another}>Another example</button>}
        </div>
      ) : null}
      {def.limit && <LimitRow limit={def.limit} p={limitP} />}
    </figure>
  )
}
