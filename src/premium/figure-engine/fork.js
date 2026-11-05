// The Fork engine: one question, two lanes, a sentence with an empty slot. The
// slot is empty, a ring moves to the word the question looks at, the answering
// lane lights, the form travels down its branch into the slot, the English
// arrives. forkFrame is a pure function of time, as rowFrame is.
import { clamp01, land, lerp, ramp, travel } from './lib/motion.js'
import { EN_WRAP_LINE, fitSizes, lineHeightOfRow, textWidth, tileSizes } from './lib/metrics.js'

const FIRST = { enter: [500, 200], ring: [800, 300], lane: [500, 200], drop: [800, 200], en: [350, 500] }
const SECOND = { enter: [400, 150], ring: [600, 200], lane: [350, 150], drop: [600, 150], en: [300, 300] }
const ORDER = ['enter', 'ring', 'lane', 'drop', 'en']

/** A case with nothing to ring has no ring beat worth waiting through: the question is about meaning. */
const hasRing = c => c.row.some(item => item.ring) || c.ringPerson != null

/** `withLimit`: the figure has a limit row, which rises after the last case as a Row's does. */
export function forkTimeline(scene, withLimit = false) {
  let at = 150
  const beats = []
  const spans = []
  scene.cases.forEach((c, index) => {
    const timing = index === 0 ? FIRST : SECOND
    const spanStart = at
    ORDER.forEach(kind => {
      const [go, hold] = kind === 'ring' && !hasRing(c) ? [0, 0] : timing[kind]
      beats.push({ kind, caseIndex: index, start: at, travelEnd: at + go, end: at + go + hold })
      at += go + hold
    })
    spans.push({ lane: c.lane, start: spanStart, end: at })
  })
  if (withLimit) {
    beats.push({ kind: 'limit', start: at, travelEnd: at + 620, end: at + 920 })
    at += 920
  }
  return {
    beats,
    spans,
    duration: at,
    rests: beats.filter(b => b.kind !== 'enter' && b.end > b.start).map(b => b.end),
  }
}

/** One scene's rows at one size. Tiles wrap to a new line only when `limit` is passed, as a plain row's do. */
function placeCases(scene, s, limit = Infinity) {
  const lineH = lineHeightOfRow(s)
  return scene.cases.map(c => {
    let x = 0
    let line = 0
    let total = 0
    const items = c.row.map(item => {
      const face = item.slot ? item.form : item
      const w = textWidth(face.text, s.fs) + s.pad * 2
      if (x > 0 && x + w > limit) { line += 1; x = 0 }
      const placed = { ...item, w, x, y: line * lineH }
      total = Math.max(total, x + w)
      x += w + s.gap
      return placed
    })
    return { items, total, lines: line + 1 }
  })
}

/** One size for the whole figure, so Another example never changes the tile size. */
export function forkSizes(def, width) {
  const base = tileSizes(width)
  const widest = Math.max(...def.scenes.flatMap(scene => placeCases(scene, base).map(c => c.total)))
  return fitSizes(base, widest, width)
}

/** The most lines any case in the figure needs, so Another example never changes the stage's height. */
export function forkLines(def, width, s) {
  return Math.max(...def.scenes.flatMap(scene => placeCases(scene, s, width).map(c => c.lines)))
}

export function forkLayouts(scene, width, s) {
  const rows = placeCases(scene, s, width)
  rows.forEach(r => {
    const x0 = Math.max(0, (width - r.total) / 2)
    r.items.forEach(item => { item.x += x0 })
  })
  return { rows, s }
}

/** How many lines a lane's forms take once they wrap inside the lane. */
function laneFormLines(forms, laneW, fs, gap) {
  const room = laneW - 6 // forms may use the lane's padding, up to 3 px from its border
  let x = 0
  let lines = 1
  forms.forEach(form => {
    const w = textWidth(form, fs)
    if (x > 0 && x + w > room) { lines += 1; x = 0 }
    x += w + gap
  })
  return lines
}

export function forkGeometry(s, width, def, lines = 1, enLines = 1) {
  const phone = width < 480
  const count = def.lanes.length
  const peopleH = def.people ? (phone ? 92 : 104) : 0
  const laneGap = phone ? 8 : 12
  const laneW = (width - laneGap * (count - 1)) / count
  const formFs = phone ? 21 : 25
  // A scene may give a lane its own forms (scene.laneForms[i]); the lanes keep the tallest scene's height.
  const formSets = def.lanes.flatMap((lane, i) => [lane.forms, ...def.scenes.map(scene => scene.laneForms?.[i]).filter(Boolean)])
  const formLines = Math.max(...formSets.map(forms => laneFormLines(forms, laneW, formFs, phone ? 12 : 16)))
  const laneH = (phone ? 76 : 84) + (formLines - 1) * (formFs + 8)
  const branchH = phone ? 44 : 56
  const laneBottom = peopleH + laneH
  const rowTop = laneBottom + branchH
  const labelTop = rowTop + (lines - 1) * lineHeightOfRow(s) + s.h + 7
  const enTop = labelTop + s.label + 4
  const laneX = i => i * (laneW + laneGap) + laneW / 2
  return { count, peopleH, laneH, laneGap, laneW, laneX, branchH, laneBottom, rowTop, labelTop, enTop, height: enTop + 30 + (enLines - 1) * EN_WRAP_LINE }
}

/** A branch from a lane's foot to the slot. A slot on a wrapped line is reached down the side of
 *  the lines above it and along the gap over its own line, so the branch never runs behind a tile. */
function branchPath(x0, y0, slot, row, geometry, width) {
  const x1 = slot.x + slot.w / 2
  const y1 = geometry.rowTop + slot.y - 2
  const straight = () => {
    const midY = (y0 + y1) / 2
    return `M ${x0} ${y0} C ${x0} ${midY + 6}, ${x1} ${midY - 6}, ${x1} ${y1}`
  }
  const above = row.items.filter(item => item.y < slot.y)
  if (!above.length) return straight()
  const left = Math.min(...above.map(item => item.x)) - 7
  const right = Math.max(...above.map(item => item.x + item.w)) + 7
  const canLeft = left >= 3
  const canRight = right <= width - 3
  if (!canLeft && !canRight) return straight()
  const cx = canLeft && (!canRight || Math.abs(x1 - left) <= Math.abs(x1 - right)) ? left : right
  const top = geometry.rowTop - 6
  const gapY = geometry.rowTop + slot.y - 10
  const dir = x1 >= cx ? 1 : -1
  const r = Math.min(8, Math.abs(x1 - cx) / 2)
  const midY = (y0 + top) / 2
  return `M ${x0} ${y0} C ${x0} ${midY + 6}, ${cx} ${midY - 6}, ${cx} ${top} L ${cx} ${gapY - r} Q ${cx} ${gapY}, ${cx + dir * r} ${gapY} L ${x1 - dir * r} ${gapY} Q ${x1} ${gapY}, ${x1} ${Math.min(y1, gapY + r)} L ${x1} ${y1}`
}

export function forkFrame(scene, timeline, t, layout, geometry, width = Infinity) {
  const { beats } = timeline
  const caseCount = scene.cases.length
  let caseIndex = 0
  for (const b of beats) if (b.kind === 'enter' && t >= b.start) caseIndex = b.caseIndex
  const beat = kind => beats.find(b => b.kind === kind && b.caseIndex === caseIndex)
  const P = kind => {
    const b = beat(kind)
    return ramp(t, b.start, b.travelEnd)
  }

  const enter = P('enter')
  // The turn between cases: the old sentence out, the new one in.
  let shownCase = caseIndex
  let rowOpacity = 1
  if (caseIndex > 0 && enter < 0.4) {
    shownCase = caseIndex - 1
    rowOpacity = 1 - ramp(enter, 0, 0.4)
  } else if (caseIndex > 0) {
    rowOpacity = ramp(enter, 0.4, 1)
  } else {
    rowOpacity = 1
  }
  const previous = shownCase !== caseIndex
  const c = scene.cases[shownCase]
  const row = layout.rows[shownCase]
  const { s } = layout

  const ringP = previous ? 1 : P('ring')
  const laneP = previous ? 1 : P('lane')
  const dropP = previous ? 1 : P('drop')
  const enP = previous ? 1 : P('en')

  const slot = row.items.find(item => item.slot)
  const target = row.items.find(item => item.ring)
  const ringE = travel(ramp(ringP, 0.05, 1))
  const ring = target && slot ? {
    x: lerp(slot.x, target.x, ringE),
    y: lerp(slot.y, target.y, ringE),
    w: lerp(slot.w, target.w, ringE),
    opacity: ramp(ringP, 0, 0.12),
  } : null

  // People, where a figure has them: the ring asks about one mark, then a frame lands on each member.
  const personRing = c.ringPerson != null ? { index: c.ringPerson, opacity: ramp(ringP, 0.1, 0.5) * (1 - ramp(laneP, 0.2, 0.8)) } : null
  const frames = c.group ? { members: c.group, opacity: travel(laneP) * rowOpacity } : null

  const litNow = c.lane
  const lit = {}
  lit[litNow] = travel(laneP)
  if (previous) lit[litNow] = 1 - ramp(enter, 0, 0.4)

  // The form travels from the foot of its lane to the slot.
  const laneX = geometry.laneX(c.lane)
  const dropE = travel(ramp(dropP, 0.05, 1))
  const form = slot ? {
    face: slot.form,
    x: lerp(laneX - slot.w / 2, slot.x, dropE),
    y: lerp(geometry.laneBottom - s.h * 0.55, geometry.rowTop + slot.y, dropE),
    w: slot.w,
    opacity: ramp(dropP, 0, 0.14),
    scale: lerp(0.86, 1, dropE),
  } : null

  const branches = Array.from({ length: geometry.count }, (_, lane) => {
    return {
      lane,
      d: branchPath(geometry.laneX(lane), geometry.laneBottom, slot, row, geometry, width),
      progress: lane === litNow ? travel(laneP) * (previous ? 1 - ramp(enter, 0, 0.4) : 1) : 0,
    }
  })

  const en = enP > 0 ? { text: c.en, opacity: enP * rowOpacity, y: (1 - land(enP)) * 8 } : null

  return {
    caseIndex: shownCase,
    caseCount,
    c,
    row,
    rowOpacity,
    ring,
    lit,
    form,
    branches,
    en,
    slotOpacity: clamp01(1 - ramp(dropP, 0.8, 1)),
    ringLabel: ramp(ringP, 0.7, 1),
    personRing,
    frames,
    s,
  }
}
