// The row engine behind Move, Swap and Add and Drop. rowTimeline says when each
// beat runs; rowFrame says where everything is at time t. rowFrame is pure: the
// same scene, time and layout always give the same frame, with no state and no
// CSS animation, so any frame can be rendered exactly.
import { HOLD_MS, OPEN_MS, ROLL_MS, TRAVEL_MS, clamp01, land, leave, lerp, ramp, travel } from '../lib/motion.js'
import { fitSizes, textWidth, tileSizes } from '../lib/metrics.js'

const TRAVEL = { move: TRAVEL_MS, add: TRAVEL_MS, drop: TRAVEL_MS, swap: ROLL_MS, en: 420, limit: 620, slot: 620, line: TRAVEL_MS }
const HOLD = { move: HOLD_MS, add: HOLD_MS, drop: HOLD_MS, swap: HOLD_MS, en: 380, limit: 300, slot: 300, line: 300 }

export function rowTimeline(scene) {
  let at = OPEN_MS
  let state = 0
  const beats = scene.beats.map(beat => {
    const from = state
    if (beat.to != null) state = beat.to
    const b = {
      ...beat,
      from,
      toState: state,
      start: at,
      travelEnd: at + (TRAVEL[beat.kind] ?? TRAVEL_MS),
      end: at + (TRAVEL[beat.kind] ?? TRAVEL_MS) + (HOLD[beat.kind] ?? HOLD_MS),
    }
    at = b.end
    return b
  })
  return { beats, duration: at, rests: beats.map(b => b.end) }
}

const SLOT_W = { fs30: 112, fs24: 96 }

function tileWidth(id, face, s) {
  if (id === 'GHOST') return s.ghost
  if (id === 'SLOT') return s.fs >= 28 ? SLOT_W.fs30 : SLOT_W.fs24
  return textWidth(face.text, s.fs) + s.pad * 2
}

/** Each state's tile positions, left aligned so a tile that holds still really does. */
export function rowLayouts(scene, width) {
  const base = tileSizes(width)
  const place = s => scene.states.map(state => {
    const map = {}
    let x = 0
    state.forEach(([id, faceIndex]) => {
      const face = id === 'GHOST' || id === 'SLOT' ? null : scene.tiles[id][faceIndex]
      const w = tileWidth(id, face, s)
      map[id] = { x, w, face, faceIndex }
      x += w + s.gap
    })
    map.__w = x - s.gap
    return map
  })
  const first = place(base)
  const widest = Math.max(...first.map(m => m.__w))
  const s = fitSizes(base, widest, width)
  const layouts = s === base ? first : place(s)
  return { layouts, s, widest: Math.max(...layouts.map(m => m.__w)) }
}

/** Geometry of the stage's rows, shared with the render. Headroom is only what the scene needs. */
export function rowGeometry(s, scene, twoLineBefore = false) {
  const beforeH = scene.before ? (twoLineBefore ? 48 : 26) : 0
  const hasArc = scene.beats.some(b => b.kind === 'move' && b.arc)
  const hasLane = scene.beats.some(b => b.mark || b.old)
  const headroom = hasArc ? s.arc + 16 : hasLane ? 34 : 4
  const rowTop = beforeH + headroom
  const labelTop = rowTop + s.h + 7
  const enTop = labelTop + s.label + (scene.enFirstWord ? 24 : 4)
  const enH = 30
  return { beforeH, rowTop, labelTop, enTop, height: enTop + enH }
}

export function rowFrame(scene, timeline, t, layout, geometry) {
  const { layouts, s } = layout
  const { beats } = timeline
  let state = 0
  for (const b of beats) if (t >= b.travelEnd && b.to != null) state = b.toState
  const cur = beats.find(b => t >= b.start && t < b.travelEnd) || null
  const p = cur ? (t - cur.start) / (cur.travelEnd - cur.start) : 1
  const moving = cur && cur.to != null
  const A = moving ? layouts[cur.from] : layouts[state]
  const B = moving ? layouts[cur.toState] : layouts[state]

  const posE = !cur ? 1 : cur.kind === 'add' ? travel(ramp(p, 0, 0.55)) : cur.kind === 'drop' ? travel(ramp(p, 0.35, 1)) : travel(p)
  const mains = cur ? [].concat(cur.tile || []) : []

  const ids = new Set([...Object.keys(A), ...Object.keys(B)].filter(k => !k.startsWith('__')))
  const tiles = []
  const frames = {}
  for (const id of ids) {
    const a = A[id]
    const b = B[id]
    const isMain = mains.includes(id)
    let x = lerp((a ?? b).x, (b ?? a).x, posE)
    let y = 0
    let opacity = 1
    let outline = 0
    let z = 1
    let w = lerp((a ?? b).w, (b ?? a).w, posE)
    let roll = 0
    let faceA = (a ?? b).face
    let faceB = (b ?? a).face
    let labelOpacity = 1

    if (cur?.kind === 'move' && isMain) {
      const e = travel(p)
      x = lerp(a.x, b.x, e)
      w = lerp(a.w, b.w, ramp(e, 0.5, 1))
      y = -Math.sin(Math.PI * e) * s.h * 0.82
      z = 3
      roll = faceA !== faceB ? travel(ramp(p, 0.52, 0.96)) : 0
      labelOpacity = Math.max(0, 1 - ramp(p, 0, 0.2)) + ramp(p, 0.82, 1)
    } else if (cur?.kind === 'add' && isMain) {
      const q = ramp(p, 0.38, 1)
      y = (1 - land(q)) * s.h * 0.62
      opacity = ramp(q, 0, 0.35)
      labelOpacity = ramp(q, 0.4, 1)
      x = b.x
      w = b.w
    } else if (cur?.kind === 'drop' && isMain) {
      const q = ramp(p, 0.16, 1)
      outline = ramp(p, 0, 0.22)
      y = leave(q) * s.h * 0.72
      opacity = 1 - ramp(q, 0.45, 0.95)
      labelOpacity = 1 - ramp(p, 0, 0.2)
      x = a.x
      w = a.w
    } else if (cur?.kind === 'swap' && isMain) {
      roll = travel(p)
    } else if (cur?.roll === id) {
      roll = travel(ramp(p, 0.2, 0.8))
    } else if (a && !b) {
      opacity = 1 - ramp(p, 0, 0.4)
    } else if (!a && b) {
      // A ghost waits until the tile has mostly gone from its place.
      opacity = cur?.kind === 'drop' ? ramp(p, 0.4, 0.75) : ramp(p, 0.12, 0.5)
    }

    if (roll > 0 && roll < 1) labelOpacity *= 1 - Math.sin(Math.PI * roll)
    const face = roll >= 0.5 ? faceB : faceA

    frames[id] = { x, y, w }
    tiles.push({ id, x, y, w, z, opacity, outline, roll, faceA, faceB, labelFace: face, labelOpacity: clamp01(labelOpacity), kind: id })
  }

  // Arc from where the tile was to where it landed.
  let arc = null
  const arcBeat = beats.find(b => b.kind === 'move' && b.arc)
  if (arcBeat && t >= arcBeat.start) {
    const inTravel = t < arcBeat.travelEnd
    const after = layouts[arcBeat.toState]
    const origin = layouts[arcBeat.from][arcBeat.tile]
    const startX = arcBeat.arc === 'GHOST'
      ? (frames.GHOST ? frames.GHOST.x + frames.GHOST.w / 2 : origin.x + origin.w / 2)
      : origin.x + origin.w / 2
    const landed = inTravel ? after[arcBeat.tile] : frames[arcBeat.tile]
    const endX = landed.x + landed.w / 2
    const y0 = geometry.rowTop - 5
    const apex = s.arc - 6
    const ctrlY = y0 - apex * 2
    const midX = (startX + endX) / 2
    const dir = endX >= startX ? 1 : -1
    const q = inTravel ? travel((t - arcBeat.start) / (arcBeat.travelEnd - arcBeat.start)) : 1
    arc = {
      d: `M ${startX} ${y0} Q ${midX} ${ctrlY} ${endX} ${y0}`,
      progress: q,
      arrow: q > 0.97,
      endX,
      y0,
      dir,
      midX,
      apexY: y0 - apex,
      // Tangent at the end of a quadratic: from the control point to the end.
      tx: endX - midX,
      ty: y0 - ctrlY,
    }
  }

  // Numbered marks land at the end of their beat. A Move's sits on its arc; the others,
  // with any old form, sit in the lane above the tile, so nothing covers a tile's edge.
  const LANE_Y = geometry.rowTop - 15
  const marks = []
  const olds = []
  for (const b of beats) {
    const f = b.kind === 'drop' ? frames.GHOST : b.tile ? frames[[].concat(b.tile)[0]] : null
    const oldAt = b.start + 0.3 * (b.travelEnd - b.start)
    if (b.mark && t >= b.travelEnd - 180) {
      const scale = land(ramp(t, b.travelEnd - 180, b.travelEnd + 160))
      if (b.kind === 'move' && arc) marks.push({ n: b.mark, x: arc.midX, y: arc.apexY, scale, onArc: true })
      else if (f) {
        const x = b.kind === 'add' ? f.x + f.w / 2 : b.kind === 'drop' ? f.x + f.w / 2 - 11 : f.x + 11
        marks.push({ n: b.mark, x, y: LANE_Y, scale })
      }
    }
    if ((b.old || b.kind === 'drop') && f && t >= oldAt) {
      const x = b.kind === 'drop' ? f.x + f.w / 2 + 3 : f.x + 26
      olds.push({ text: scene.tiles[b.tile][0].text, x, y: LANE_Y - 9, opacity: ramp(t, oldAt, b.travelEnd) })
    }
  }

  // Sentence lines. In-between states carry no English.
  const first = beats[0]
  const enBeat = beats.find(b => b.kind === 'en')
  const beforeOpacity = scene.before ? ramp(t, first.start + 100, first.start + 500) : 0
  let en = null
  if (scene.before && t < first.start + 220) en = { text: scene.before.en, opacity: 1 - ramp(t, first.start, first.start + 220), y: 0 }
  if (enBeat && t >= enBeat.start) {
    const q = ramp(t, enBeat.start, enBeat.travelEnd)
    en = { text: scene.after.en, opacity: q, y: (1 - land(q)) * 8 }
  }

  // A soft underlay on the book's list while its beat runs.
  const lit = beats.filter(b => b.li != null).map(b => ({
    li: b.li,
    v: ramp(t, b.start - 120, b.start + 160) * (1 - ramp(t, b.end - 80, b.end + 120)),
  }))

  const limitBeat = beats.find(b => b.kind === 'limit')
  const limit = limitBeat ? ramp(t, limitBeat.start, limitBeat.travelEnd) : 1
  const slotBeat = beats.find(b => b.kind === 'slot')
  const slot = slotBeat ? travel(ramp(t, slotBeat.start, slotBeat.travelEnd)) : 0
  const lineBeat = beats.find(b => b.kind === 'line')
  const line = lineBeat ? travel(ramp(t, lineBeat.start, lineBeat.travelEnd)) : 0

  return { tiles, marks, olds, arc, beforeOpacity, en, lit, limit, slot, line, s }
}
