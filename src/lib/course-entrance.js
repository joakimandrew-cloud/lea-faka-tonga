export const ENTRANCE_DURATION = 1800
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
// These points sit inside the gateway so the stone edges move past the viewer.
const SOURCE = { width: 1222, height: 1287 }
const BOOK = { x: 210, y: 32, width: 855, height: 1175 }
const GATEWAY = [[611, 613], [784, 652], [784, 832], [626, 830]]

function cross(a, b) { return a.x * b.y - a.y * b.x }

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
    width: SOURCE.width * fit,
    height: SOURCE.height * fit,
  }
  const points = GATEWAY.map(([x, y]) => ({ x: image.x + x * fit, y: image.y + y * fit }))
  const center = points.reduce((sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }), { x: 0, y: 0 })
  const corners = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }]

  // Cover every viewport corner with the actual convex opening, not its box.
  // For each edge, solve the minimum scale that puts the corner inside it.
  let scale = 1
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const edge = { x: b.x - a.x, y: b.y - a.y }
    const inside = cross(edge, { x: center.x - a.x, y: center.y - a.y })
    for (const corner of corners) {
      const offset = { x: corner.x - w / 2, y: corner.y - h / 2 }
      scale = Math.max(scale, -cross(edge, offset) / inside)
    }
  }
  scale *= 1.12
  return {
    image,
    gateway: points.map(point => `${point.x},${point.y}`).join(' '),
    transform: { scale, translateX: w / 2 - scale * center.x, translateY: h / 2 - scale * center.y },
    layout: landscape ? 'landscape' : 'portrait',
  }
}
