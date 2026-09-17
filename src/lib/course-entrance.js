// "Two stones become two doors" (concept C, plans/2026-09-17-entrance-colours-two-doors.md).
// The stage darkens, the camera frames the stone gateway, everything but the two
// posts sinks into the dark, and each post travels into the homepage door card
// the page actually rendered. The overlay then fades and the real doors remain.
export const ENTRANCE_DURATION = 2300
export const ENTRANCE_SESSION_KEY = 'lft-course-entrance-seen-v1'

// Storage denial still permits normal navigation during this document's life.
// Nothing claims persistence across a reload when the browser denies storage.
export function createEntranceSession(getStorage = () => window.sessionStorage) {
  let memorySeen = false
  return {
    read() {
      if (memorySeen) return true
      try {
        return getStorage()?.getItem(ENTRANCE_SESSION_KEY) === '1'
      } catch {
        return false
      }
    },
    mark() {
      memorySeen = true
      try {
        getStorage()?.setItem(ENTRANCE_SESSION_KEY, '1')
      } catch {
        // The cover remains dismissible with blocked browser storage.
      }
    },
  }
}

const session = createEntranceSession()
export const readEntranceSeen = () => session.read()
export const markEntranceSeen = () => session.mark()

export function shouldShowEntrance({ seen, hash = '' }) {
  return !seen && !hash
}

// All measurements refer to the original, unmodified 1222 × 1287 image.
export const ENTRANCE_SOURCE = { width: 1222, height: 1287 }
const BOOK = { x: 210, y: 32, width: 855, height: 1175 }
// A convex region inside the gateway opening; it places the start control.
const GATEWAY = [[611, 613], [784, 652], [784, 832], [626, 830]]
// Hand traces over the cover from the Step 1 prototype. BOX is the box
// silhouette (spine and front face) without the baked white surround and
// reflection; the posts are the two standing stones.
export const ENTRANCE_BOX = [[221, 75], [312, 41], [1048, 84], [1051, 1149], [312, 1197], [221, 1165]]
export const ENTRANCE_POSTS = {
  site: [[412, 440], [425, 410], [435, 400], [485, 355], [522, 340], [570, 365], [592, 425], [600, 470], [603, 590], [604, 720], [614, 876], [400, 876], [402, 670]],
  book: [[790, 634], [845, 630], [860, 570], [920, 566], [946, 590], [960, 670], [976, 862], [976, 874], [788, 868]],
}
// The camera centres this source point and zooms until the whole gateway
// (posts, lintel and plant) fills most of the screen without going through.
const CAMERA_FOCUS = [688, 612]
const GATE_FRAME = { x: 398, y: 338, width: 580, height: 540 }

// Milliseconds after the click. Every value stays inside ENTRANCE_DURATION.
export const ENTRANCE_TIMELINE = {
  controls: [0, 200],
  surround: [0, 160],
  dusk: [60, 560],
  push: [120, 1150],
  scenery: [950, 1450],
  travel: [1050, 1850],
  chrome: [1300, 1750],
  stage: [1550, 2050],
  posts: [1900, 2300],
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const lerp = (from, to, amount) => from + (to - from) * amount

export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = s => ((ax * s + bx) * s + cx) * s
  const sampleY = s => ((ay * s + by) * s + cy) * s
  const slopeX = s => (3 * ax * s + 2 * bx) * s + cx
  return x => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let s = x
    for (let i = 0; i < 8; i += 1) {
      const error = sampleX(s) - x
      const slope = slopeX(s)
      if (Math.abs(error) < 1e-6 || Math.abs(slope) < 1e-6) break
      s -= error / slope
    }
    return sampleY(clamp(s))
  }
}

const EASE = {
  linear: x => x,
  out: cubicBezier(0.2, 0.7, 0.2, 1),
  inOut: cubicBezier(0.65, 0, 0.35, 1),
  push: cubicBezier(0.6, 0, 0.22, 1),
}

function progress(time, [start, end], ease) {
  return ease(clamp((time - start) / (end - start)))
}

// Every animated value for one moment. 1 means fully shown for the layers
// that leave (controls, surround, scenery, stage, posts) and fully arrived for
// the rest (dusk, push, travel, chrome).
export function entranceFrame(elapsed) {
  const time = clamp(Number(elapsed) || 0, 0, ENTRANCE_DURATION)
  const t = ENTRANCE_TIMELINE
  return {
    controls: 1 - progress(time, t.controls, EASE.out),
    surround: 1 - progress(time, t.surround, EASE.linear),
    dusk: progress(time, t.dusk, EASE.inOut),
    push: progress(time, t.push, EASE.push),
    scenery: 1 - progress(time, t.scenery, EASE.inOut),
    travel: progress(time, t.travel, EASE.inOut),
    chrome: progress(time, t.chrome, EASE.out),
    stage: 1 - progress(time, t.stage, EASE.inOut),
    posts: 1 - progress(time, t.posts, EASE.out),
  }
}

// The two posts travel one after the other instead of at the same time: site
// finishes before book starts, so their straight-line paths (which cross,
// since both begin near the gate and end apart) never overlap on screen at
// once. Both windows still sit inside ENTRANCE_TIMELINE.travel and finish by
// its end point, so the cards form and land at the same instant they did
// before this split.
export const ENTRANCE_POST_TRAVEL = {
  site: [ENTRANCE_TIMELINE.travel[0], 1500],
  book: [1550, ENTRANCE_TIMELINE.travel[1]],
}

export function postTravelProgress(elapsed, key) {
  const time = clamp(Number(elapsed) || 0, 0, ENTRANCE_DURATION)
  const window = ENTRANCE_POST_TRAVEL[key] || ENTRANCE_TIMELINE.travel
  return progress(time, window, EASE.inOut)
}

export function entranceGeometry({ width, height }) {
  const w = Math.max(1, Number(width) || 1)
  const h = Math.max(1, Number(height) || 1)
  const landscape = w > h * 1.5 && h < 600
  const areaWidth = landscape ? w * 0.6 : w
  const areaHeight = landscape ? h : Math.max(100, h - 160)
  const fit = Math.max(0.01, Math.min(
    Math.max(32, areaWidth - 40) / BOOK.width,
    Math.max(80, areaHeight - 32) / BOOK.height,
  ))
  const image = {
    x: areaWidth / 2 - (BOOK.x + BOOK.width / 2) * fit,
    y: (areaHeight - BOOK.height * fit) / 2 - BOOK.y * fit,
    width: ENTRANCE_SOURCE.width * fit,
    height: ENTRANCE_SOURCE.height * fit,
  }
  const points = GATEWAY.map(([x, y]) => ({ x: image.x + x * fit, y: image.y + y * fit }))
  return {
    viewport: { width: w, height: h },
    fit,
    image,
    gateway: points.map(point => `${point.x},${point.y}`).join(' '),
    layout: landscape ? 'landscape' : 'portrait',
  }
}

// Maps source pixels to screen pixels: screen = (x + scale * sx, y + scale * sy).
// At push 0 it is the resting cover; at push 1 the gateway is framed.
export function entranceCamera(geometry, push) {
  const { fit, image, viewport } = geometry
  const amount = clamp(Number(push) || 0)
  const zoom = Math.max(1, Math.min(
    (0.86 * viewport.width) / (GATE_FRAME.width * fit),
    (0.58 * viewport.height) / (GATE_FRAME.height * fit),
  ))
  const scale = fit * zoom ** amount
  const centreX = lerp(image.x + CAMERA_FOCUS[0] * fit, viewport.width / 2, amount)
  const centreY = lerp(image.y + CAMERA_FOCUS[1] * fit, viewport.height * 0.46, amount)
  return { scale, x: centreX - scale * CAMERA_FOCUS[0], y: centreY - scale * CAMERA_FOCUS[1] }
}

export function polygonBounds(points) {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
}

// The same outline pulled toward its own centre, so the hole cut for a post
// sits just inside the post that is drawn over it and leaves no hairline gap.
export function shrinkPolygon(points, factor) {
  const cx = points.reduce((sum, [x]) => sum + x, 0) / points.length
  const cy = points.reduce((sum, [, y]) => sum + y, 0) / points.length
  return points.map(([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor])
}

export function projectRect(camera, rect) {
  return {
    x: camera.x + camera.scale * rect.x,
    y: camera.y + camera.scale * rect.y,
    width: camera.scale * rect.width,
    height: camera.scale * rect.height,
  }
}

export function lerpRect(from, to, amount) {
  return {
    x: lerp(from.x, to.x, amount),
    y: lerp(from.y, to.y, amount),
    width: lerp(from.width, to.width, amount),
    height: lerp(from.height, to.height, amount),
  }
}

export function rectHasArea(rect) {
  return Boolean(rect)
    && [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
    && rect.width > 0
    && rect.height > 0
}

// Prefer the destination's explicit picture hook, retain compatibility with
// the original door visual, then use the card itself when neither picture is
// measurable. The card has already been checked for viewport reachability.
export function landingVisual({ explicit, legacy, door, viewport }) {
  const usable = rect => rectHasArea(rect) && (!viewport || rectOnScreen(rect, viewport))
  if (usable(explicit)) return explicit
  if (usable(legacy)) return legacy
  return rectHasArea(door) ? door : null
}

// True when at least part of rect is visible inside the 0,0 to width,height
// viewport box. A rect entirely above, below, left of or right of the
// viewport cannot be a real landing target: flying a post to it would send
// the post off the visible screen instead of onto a card anyone can see.
export function rectOnScreen(rect, viewport) {
  if (!rectHasArea(rect)) return false
  const width = Math.max(0, Number(viewport?.width) || 0)
  const height = Math.max(0, Number(viewport?.height) || 0)
  return rect.x < width && rect.x + rect.width > 0 && rect.y < height && rect.y + rect.height > 0
}

// Where one post layer sits. The layer box travels from the post's place on
// the cover to the door card; the stone inside it travels from filling the
// layer to the card's picture area, kept clear of the card edge. Without a
// measured door the post stays on the cover and simply fades.
export function postLanding({ camera, post, door, visual, travel }) {
  const from = projectRect(camera, polygonBounds(post))
  const whole = { x: 0, y: 0, width: from.width, height: from.height }
  if (!rectHasArea(door)) return { layer: from, stone: whole }

  const amount = clamp(Number(travel) || 0)
  const layer = lerpRect(from, door, amount)
  const picture = rectHasArea(visual) ? visual : door
  const inset = Math.min(12, picture.width * 0.1, picture.height * 0.1)
  const target = {
    x: picture.x - door.x + inset,
    y: picture.y - door.y + inset,
    width: Math.max(1, picture.width - inset * 2),
    height: Math.max(1, picture.height - inset * 2),
  }
  const stone = lerpRect({ x: 0, y: 0, width: layer.width, height: layer.height }, target, amount)
  return { layer, stone }
}
