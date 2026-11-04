// The Path engine: which way a word points. Marks or panels hold still; an arrow draws from
// its start to its end, its particle lands on it, and the sentence and English land when it
// arrives. Earlier arrows stay, quieter, so the rest state reads as the whole set. pathFrame
// is a pure function of time, as rowFrame and forkFrame are.
import { land, ramp, travel } from '../lib/motion.js'

const DRAW = 800
const AFTER_DRAW = 200
const SAY = 300
const HOLD = 500

export function pathTimeline(scene) {
  let at = 150
  const beats = []
  const spans = []
  scene.cases.forEach((c, index) => {
    const start = at
    const drawEnd = start + DRAW
    beats.push({ kind: 'draw', caseIndex: index, start, travelEnd: drawEnd, end: drawEnd + AFTER_DRAW })
    const sayStart = drawEnd + AFTER_DRAW
    const end = sayStart + SAY + HOLD
    beats.push({ kind: 'say', caseIndex: index, start: sayStart, travelEnd: sayStart + SAY, end })
    spans.push({ caseIndex: index, start, end })
    at = end
  })
  return { beats, spans, duration: at, rests: beats.filter(b => b.kind === 'say').map(b => b.end) }
}

/** Marks in fixed places, so a student learns one picture: you and I level, the third person
 *  up and apart. Each arrow takes its own side of the line between speaker and listener. */
export function peopleGeometry(width) {
  const phone = width < 480
  const mw = phone ? 44 : 60
  const mh = phone ? 52 : 71
  const top = phone ? 80 : 104
  const places = {
    speaker: { x: width * (phone ? 0.125 : 0.13), y: top },
    listener: { x: width * (phone ? 0.59 : 0.6), y: top },
    third: { x: width * (phone ? 0.875 : 0.87), y: 0 },
  }
  return { phone, mw, mh, places, height: top + mh + (phone ? 40 : 44), tile: phone ? { h: 30, fs: 18, pad: 9 } : { h: 36, fs: 21, pad: 12 } }
}

/** A quadratic curve with its point at t and the tangent at its end. */
function curve(from, ctrl, to) {
  const at = q => ({
    x: (1 - q) * (1 - q) * from.x + 2 * (1 - q) * q * ctrl.x + q * q * to.x,
    y: (1 - q) * (1 - q) * from.y + 2 * (1 - q) * q * ctrl.y + q * q * to.y,
  })
  return { d: `M ${from.x} ${from.y} Q ${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`, at, end: to, tan: { x: to.x - ctrl.x, y: to.y - ctrl.y } }
}

function peopleCurve(c, geo, width) {
  const { mw, mh, places } = geo
  const S = places.speaker
  const L = places.listener
  const T = places.third
  const mid = mh * 0.6
  const gap = 8
  const bow = geo.phone ? 60 : 72
  // The two sides of the line never share an end, so each arrowhead belongs to one arrow.
  const apart = geo.phone ? 10 : 13
  if (c.from === 'listener' && c.to === 'speaker') {
    return curve({ x: L.x - mw / 2 - gap, y: L.y + mid + apart }, { x: (S.x + L.x) / 2, y: L.y + mid + apart + bow }, { x: S.x + mw / 2 + gap, y: S.y + mid + apart })
  }
  if (c.from === 'speaker' && c.to === 'listener') {
    return curve({ x: S.x + mw / 2 + gap, y: S.y + mid - apart }, { x: (S.x + L.x) / 2, y: S.y + mid - apart - bow }, { x: L.x - mw / 2 - gap, y: L.y + mid - apart })
  }
  if (c.to === 'third') {
    return curve({ x: L.x + mw * 0.1, y: L.y - gap }, { x: L.x + mw * 0.1, y: T.y + mh * 0.5 }, { x: T.x - mw / 2 - gap, y: T.y + mh * 0.5 })
  }
  // Away from the speaker, past the listener, with no mark at its end.
  const y = L.y + mid
  return curve({ x: L.x + mw / 2 + gap, y }, { x: (L.x + width) / 2, y: y + (geo.phone ? 10 : 12) }, { x: width - 6, y })
}

/** Panels side by side: up, down, around. Each case's arrow lives in its own column. */
export function spaceGeometry(width, count) {
  const phone = width < 480
  const gap = phone ? 8 : 12
  const colW = (width - gap * (count - 1)) / count
  return { phone, gap, colW, colX: i => i * (colW + gap), height: phone ? 132 : 168, tile: phone ? { h: 30, fs: 18, pad: 9 } : { h: 36, fs: 21, pad: 12 } }
}

function spaceCurve(c, i, geo) {
  const x0 = geo.colX(i)
  const w = geo.colW
  const h = geo.height
  const ax = x0 + w * 0.28
  const ground = h - 10
  if (c.dir === 'up') return { ...curve({ x: ax, y: ground }, { x: ax, y: (ground + 12) / 2 }, { x: ax, y: 12 }), dot: { x: ax, y: ground }, ground }
  if (c.dir === 'down') return { ...curve({ x: ax, y: 12 }, { x: ax, y: (ground + 12) / 2 }, { x: ax, y: ground - 6 }), dot: { x: ax, y: 12 }, ground }
  // Around: a line with no end it is going to, so no arrowhead.
  const u = w / 100
  const v = (h - 56) / 100
  const X = n => x0 + n * u
  const Y = n => 52 + n * v
  const d = `M ${X(10)} ${Y(70)} C ${X(26)} ${Y(8)}, ${X(50)} ${Y(4)}, ${X(50)} ${Y(38)} S ${X(30)} ${Y(92)}, ${X(58)} ${Y(82)} S ${X(92)} ${Y(30)}, ${X(74)} ${Y(14)} S ${X(62)} ${Y(50)}, ${X(90)} ${Y(66)}`
  return { d, end: null, tan: null, dot: { x: X(10), y: Y(70) }, ground: null, wander: true }
}

export function pathFrame(def, scene, timeline, t, width, picked = null) {
  const space = def.layout === 'space'
  const geo = space ? spaceGeometry(width, scene.cases.length) : peopleGeometry(width)
  const { beats } = timeline
  let current = picked ?? 0
  // A case holds until its successor has actually started, so each rest shows its own sentence.
  if (picked == null) for (const b of beats) if (b.kind === 'draw' && t > b.start) current = b.caseIndex
  const draw = beats.find(b => b.kind === 'draw' && b.caseIndex === current)
  const say = beats.find(b => b.kind === 'say' && b.caseIndex === current)
  const arrows = scene.cases.map((c, i) => {
    const line = space ? spaceCurve(c, i, geo) : peopleCurve(c, geo, width)
    const isCurrent = i === current
    const started = picked != null || i < current
    const progress = isCurrent ? travel(ramp(t, draw.start, draw.travelEnd)) : started ? 1 : 0
    const tile = isCurrent ? ramp(progress, 0.5, 0.92) : progress
    return { c, i, line, isCurrent, progress, tile }
  })
  const sayP = ramp(t, say.start, say.travelEnd)
  return { geo, space, arrows, current, c: scene.cases[current], say: { opacity: sayP, y: (1 - land(sayP)) * 6 } }
}

