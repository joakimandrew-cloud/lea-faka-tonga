// Easing and small maths for the figures. Every figure frame is a pure function
// of time built from these, so a frame can be rendered exactly and repeatably.
// The named curves match the tokens in Direction.md part 4.

export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v)
export const lerp = (a, b, p) => a + (b - a) * p
export const ramp = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)))

/** A CSS cubic-bezier as a function of progress. */
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const x = s => ((ax * s + bx) * s + cx) * s
  const y = s => ((ay * s + by) * s + cy) * s
  const dx = s => (3 * ax * s + 2 * bx) * s + cx
  return p => {
    if (p <= 0) return 0
    if (p >= 1) return 1
    let s = p
    for (let i = 0; i < 6; i += 1) {
      const e = x(s) - p
      if (Math.abs(e) < 1e-4) break
      const d = dx(s)
      if (Math.abs(d) < 1e-6) break
      s -= e / d
    }
    return y(clamp01(s))
  }
}

/** --ease-travel: between places. */
export const travel = bezier(0.65, 0, 0.35, 1)
/** --ease-out: landings. */
export const land = bezier(0.16, 1, 0.3, 1)
/** Leaving: a tile that falls away. */
export const leave = bezier(0.55, 0, 0.85, 0.35)

export const TRAVEL_MS = 900
export const HOLD_MS = 500
export const ROLL_MS = 600
export const OPEN_MS = 700
