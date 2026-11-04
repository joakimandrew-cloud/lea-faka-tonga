// The Fork engine: one question, two lanes, a sentence with an empty slot. The
// slot is empty, a ring moves to the word the question looks at, the answering
// lane lights, the form travels down its branch into the slot, the English
// arrives. forkFrame is a pure function of time, as rowFrame is.
import { clamp01, land, lerp, ramp, travel } from '../lib/motion.js'
import { fitSizes, textWidth, tileSizes } from '../lib/metrics.js'

const FIRST = { enter: [500, 200], ring: [800, 300], lane: [500, 200], drop: [800, 200], en: [350, 500] }
const SECOND = { enter: [400, 150], ring: [600, 200], lane: [350, 150], drop: [600, 150], en: [300, 300] }
const ORDER = ['enter', 'ring', 'lane', 'drop', 'en']

export function forkTimeline(scene) {
  let at = 150
  const beats = []
  const spans = []
  scene.cases.forEach((c, index) => {
    const timing = index === 0 ? FIRST : SECOND
    const spanStart = at
    ORDER.forEach(kind => {
      const [go, hold] = timing[kind]
      beats.push({ kind, caseIndex: index, start: at, travelEnd: at + go, end: at + go + hold })
      at += go + hold
    })
    spans.push({ lane: c.lane, start: spanStart, end: at })
  })
  return {
    beats,
    spans,
    duration: at,
    rests: beats.filter(b => b.kind !== 'enter').map(b => b.end),
  }
}

export function forkLayouts(scene, width) {
  const base = tileSizes(width)
  const place = s => scene.cases.map(c => {
    const items = c.row.map(item => {
      const face = item.slot ? item.form : item
      return { ...item, w: textWidth(face.text, s.fs) + s.pad * 2 }
    })
    let x = 0
    items.forEach(item => { item.x = x; x += item.w + s.gap })
    const total = x - s.gap
    return { items, total }
  })
  const first = place(base)
  const widest = Math.max(...first.map(c => c.total))
  const s = fitSizes(base, widest, width)
  const rows = s === base ? first : place(s)
  rows.forEach(r => {
    const x0 = Math.max(0, (width - r.total) / 2)
    r.items.forEach(item => { item.x += x0 })
  })
  return { rows, s }
}

export function forkGeometry(s, width) {
  const phone = width < 480
  const laneH = phone ? 76 : 84
  const laneGap = phone ? 8 : 12
  const branchH = phone ? 44 : 56
  const rowTop = laneH + branchH
  const labelTop = rowTop + s.h + 7
  const enTop = labelTop + s.label + 4
  const laneW = (width - laneGap) / 2
  return { laneH, laneGap, laneW, branchH, rowTop, labelTop, enTop, height: enTop + 30 }
}

export function forkFrame(scene, timeline, t, layout, geometry) {
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
    w: lerp(slot.w, target.w, ringE),
    opacity: ramp(ringP, 0, 0.12),
  } : null

  const litNow = c.lane
  const lit = scene.cases.reduce((acc, item) => { acc[item.lane] = 0; return acc }, {})
  lit[litNow] = travel(laneP)
  if (previous) lit[litNow] = 1 - ramp(enter, 0, 0.4)

  // The form travels from the foot of its lane to the slot.
  const laneX = c.lane === 0 ? geometry.laneW / 2 : geometry.laneW + geometry.laneGap + geometry.laneW / 2
  const dropE = travel(ramp(dropP, 0.05, 1))
  const form = slot ? {
    face: slot.form,
    x: lerp(laneX - slot.w / 2, slot.x, dropE),
    y: lerp(geometry.laneH - s.h * 0.55, geometry.rowTop, dropE),
    w: slot.w,
    opacity: ramp(dropP, 0, 0.14),
    scale: lerp(0.86, 1, dropE),
  } : null

  const branches = [0, 1].map(lane => {
    const x0 = lane === 0 ? geometry.laneW / 2 : geometry.laneW + geometry.laneGap + geometry.laneW / 2
    const x1 = slot.x + slot.w / 2
    const y0 = geometry.laneH
    const y1 = geometry.rowTop - 2
    const midY = (y0 + y1) / 2
    return {
      lane,
      d: `M ${x0} ${y0} C ${x0} ${midY + 6}, ${x1} ${midY - 6}, ${x1} ${y1}`,
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
    s,
  }
}
