import { describe, expect, it } from 'vitest'
import {
  createEntranceSession,
  cubicBezier,
  ENTRANCE_DURATION,
  ENTRANCE_POST_TRAVEL,
  ENTRANCE_POSTS,
  ENTRANCE_SESSION_KEY,
  ENTRANCE_TIMELINE,
  entranceCamera,
  entranceFrame,
  entranceGeometry,
  landingVisual,
  polygonBounds,
  postLanding,
  postTravelProgress,
  projectRect,
  rectOnScreen,
  shouldShowEntrance,
  shrinkPolygon,
} from './course-entrance'

const VIEWPORTS = [[320, 568], [320, 740], [390, 844], [768, 1024], [1280, 900], [1440, 900], [2304, 1200], [844, 390], [305, 400]]
const LEFT_STONE = [[412, 440], [425, 410], [435, 400], [485, 355], [522, 340], [570, 365], [592, 425], [600, 470], [603, 590], [604, 720], [614, 876], [400, 876], [402, 670]]
const RIGHT_STONE = [[790, 634], [845, 630], [860, 570], [920, 566], [946, 590], [960, 670], [976, 862], [976, 874], [788, 868]]

describe('course entrance visit policy', () => {
  it('shows a fresh root visit but preserves direct content anchors and return visits', () => {
    expect(shouldShowEntrance({ seen: false })).toBe(true)
    expect(shouldShowEntrance({ seen: false, hash: '#learning-desk-main' })).toBe(false)
    expect(shouldShowEntrance({ seen: true })).toBe(false)
  })

  it('remembers completion in the tab session without modifying course progress', () => {
    const values = new Map([['currentChapter', '7']])
    const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }
    const first = createEntranceSession(() => storage)
    expect(first.read()).toBe(false)
    first.mark()
    expect(createEntranceSession(() => storage).read()).toBe(true)
    expect(values.get('currentChapter')).toBe('7')
    expect(values.get(ENTRANCE_SESSION_KEY)).toBe('1')
  })

  it('stays dismissible when access to storage or writes throw', () => {
    for (const getStorage of [
      () => { throw new Error('storage denied') },
      () => ({ getItem: () => null, setItem: () => { throw new Error('quota') } }),
      () => undefined,
    ]) {
      const denied = createEntranceSession(getStorage)
      expect(denied.read()).toBe(false)
      expect(() => denied.mark()).not.toThrow()
      expect(denied.read()).toBe(true)
    }
  })
})

describe('entrance timeline', () => {
  it('keeps every motion inside the 2.5 second budget', () => {
    expect(ENTRANCE_DURATION).toBe(2300)
    for (const [start, end] of Object.values(ENTRANCE_TIMELINE)) {
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeGreaterThan(start)
      expect(end).toBeLessThanOrEqual(ENTRANCE_DURATION)
    }
  })

  it('starts on the resting cover and ends with nothing left over the homepage', () => {
    expect(entranceFrame(0)).toEqual({ controls: 1, surround: 1, dusk: 0, push: 0, scenery: 1, travel: 0, chrome: 0, stage: 1, posts: 1 })
    expect(entranceFrame(ENTRANCE_DURATION)).toEqual({ controls: 0, surround: 0, dusk: 1, push: 1, scenery: 0, travel: 1, chrome: 1, stage: 0, posts: 0 })
    expect(entranceFrame(-50)).toEqual(entranceFrame(0))
    expect(entranceFrame(99999)).toEqual(entranceFrame(ENTRANCE_DURATION))
    expect(entranceFrame(Number.NaN)).toEqual(entranceFrame(0))
  })

  it('lands the posts on their doors before the overlay starts to leave', () => {
    const landed = entranceFrame(ENTRANCE_TIMELINE.travel[1])
    expect(landed.travel).toBe(1)
    expect(landed.posts).toBe(1)
    expect(ENTRANCE_TIMELINE.posts[0]).toBeGreaterThanOrEqual(ENTRANCE_TIMELINE.travel[1])
    expect(ENTRANCE_TIMELINE.scenery[1]).toBeLessThanOrEqual(ENTRANCE_TIMELINE.stage[0])
  })

  it('moves every value one way only', () => {
    let previous = entranceFrame(0)
    for (let time = 20; time <= ENTRANCE_DURATION; time += 20) {
      const frame = entranceFrame(time)
      for (const key of ['dusk', 'push', 'travel', 'chrome']) expect(frame[key]).toBeGreaterThanOrEqual(previous[key] - 1e-9)
      for (const key of ['controls', 'surround', 'scenery', 'stage', 'posts']) expect(frame[key]).toBeLessThanOrEqual(previous[key] + 1e-9)
      previous = frame
    }
  })

  it('eases between fixed end points', () => {
    const ease = cubicBezier(0.65, 0, 0.35, 1)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
    expect(ease(0.5)).toBeCloseTo(0.5, 5)
    expect(ease(0.25)).toBeLessThan(0.25)
  })
})

describe('gateway camera geometry', () => {
  it('keeps the source polygons intact while associating left with site and right with book', () => {
    expect(ENTRANCE_POSTS.site).toEqual(LEFT_STONE)
    expect(ENTRANCE_POSTS.book).toEqual(RIGHT_STONE)
    expect(polygonBounds(ENTRANCE_POSTS.site).x).toBeLessThan(polygonBounds(ENTRANCE_POSTS.book).x)
  })

  it.each(VIEWPORTS)('rests on the cover and frames the whole gateway on screen at %s × %s', (width, height) => {
    const geometry = entranceGeometry({ width, height })
    expect(geometry.image.width / geometry.image.height).toBeCloseTo(1222 / 1287)

    const resting = entranceCamera(geometry, 0)
    expect(resting.scale).toBeCloseTo(geometry.fit)
    expect(resting.x).toBeCloseTo(geometry.image.x)
    expect(resting.y).toBeCloseTo(geometry.image.y)

    const framed = entranceCamera(geometry, 1)
    expect(framed.scale).toBeGreaterThanOrEqual(geometry.fit)
    const gate = projectRect(framed, { x: 398, y: 338, width: 580, height: 540 })
    expect(gate.x).toBeGreaterThanOrEqual(0)
    expect(gate.y).toBeGreaterThanOrEqual(0)
    expect(gate.x + gate.width).toBeLessThanOrEqual(width)
    expect(gate.y + gate.height).toBeLessThanOrEqual(height)
  })

  it('reserves a side control area in short landscape viewports', () => {
    expect(entranceGeometry({ width: 844, height: 390 }).layout).toBe('landscape')
    expect(entranceGeometry({ width: 390, height: 844 }).layout).toBe('portrait')
  })

  it('pulls a post outline inside itself without moving its centre', () => {
    const post = ENTRANCE_POSTS.book
    const shrunk = shrinkPolygon(post, 0.985)
    const outer = polygonBounds(post)
    const inner = polygonBounds(shrunk)
    expect(inner.x).toBeGreaterThan(outer.x)
    expect(inner.x + inner.width).toBeLessThan(outer.x + outer.width)
    expect(inner.width / outer.width).toBeCloseTo(0.985, 5)
  })
})

describe('deciding whether a door card is a real landing target', () => {
  const viewport = { width: 844, height: 390 }

  it('rejects a missing or zero-size rect', () => {
    expect(rectOnScreen(null, viewport)).toBe(false)
    expect(rectOnScreen({ x: 10, y: 10, width: 0, height: 40 }, viewport)).toBe(false)
    expect(rectOnScreen({ x: 10, y: 10, width: 40, height: 0 }, viewport)).toBe(false)
  })

  it('rejects a card entirely below a short landscape viewport, matching 844x390', () => {
    expect(rectOnScreen({ x: 16, y: 470, width: 358, height: 200 }, viewport)).toBe(false)
  })

  it('rejects a card entirely above, left of, or right of the viewport', () => {
    expect(rectOnScreen({ x: 16, y: -300, width: 358, height: 200 }, viewport)).toBe(false)
    expect(rectOnScreen({ x: -400, y: 10, width: 358, height: 200 }, viewport)).toBe(false)
    expect(rectOnScreen({ x: 900, y: 10, width: 358, height: 200 }, viewport)).toBe(false)
  })

  it('accepts a card only partly inside the viewport, matching the 320x568 site door', () => {
    const short = { width: 320, height: 568 }
    expect(rectOnScreen({ x: 16, y: 448.4, width: 288, height: 224.1 }, short)).toBe(true)
  })

  it('accepts a card that fully fits, matching 1440x900 and 390x844', () => {
    expect(rectOnScreen({ x: 524.5, y: 129, width: 404.7, height: 495.7 }, { width: 1440, height: 900 })).toBe(true)
    expect(rectOnScreen({ x: 16, y: 586.5, width: 358, height: 235.1 }, { width: 390, height: 844 })).toBe(true)
  })

  it('uses the explicit picture first, then the legacy picture, then the valid card', () => {
    const door = { x: 10, y: 20, width: 300, height: 400 }
    const explicit = { x: 20, y: 30, width: 260, height: 180 }
    const legacy = { x: 30, y: 40, width: 240, height: 160 }
    expect(landingVisual({ explicit, legacy, door })).toBe(explicit)
    expect(landingVisual({ explicit: null, legacy, door })).toBe(legacy)
    expect(landingVisual({ explicit: { ...explicit, width: 0 }, legacy, door })).toBe(legacy)
    expect(landingVisual({ explicit: null, legacy: { ...legacy, height: 0 }, door })).toBe(door)
  })

  it('does not create a picture target from an invalid card', () => {
    expect(landingVisual({ explicit: null, legacy: null, door: null })).toBeNull()
    expect(landingVisual({ explicit: null, legacy: null, door: { x: 0, y: 0, width: 0, height: 20 } })).toBeNull()
  })

  it('falls back from an offscreen picture to the reachable card', () => {
    const viewport = { width: 320, height: 568 }
    const door = { x: 16, y: 448, width: 288, height: 224 }
    const offscreen = { x: 16, y: 590, width: 288, height: 82 }
    expect(landingVisual({ explicit: offscreen, legacy: null, door, viewport })).toBe(door)
  })
})

describe('the two posts travel one after the other so their paths never overlap', () => {
  it('moves the left site stone first and starts book after site has fully landed', () => {
    expect(ENTRANCE_POST_TRAVEL.site).toEqual([1050, 1500])
    expect(ENTRANCE_POST_TRAVEL.book).toEqual([1550, 1850])
    expect(ENTRANCE_POST_TRAVEL.site[0]).toBe(ENTRANCE_TIMELINE.travel[0])
    expect(ENTRANCE_POST_TRAVEL.book[0]).toBeGreaterThanOrEqual(ENTRANCE_POST_TRAVEL.site[1])
  })

  it('ends both inside ENTRANCE_TIMELINE.travel, book landing at its end point', () => {
    expect(ENTRANCE_POST_TRAVEL.site[1]).toBeLessThanOrEqual(ENTRANCE_TIMELINE.travel[1])
    expect(ENTRANCE_POST_TRAVEL.book[1]).toBe(ENTRANCE_TIMELINE.travel[1])
  })

  it('never has both posts moving at once', () => {
    for (let time = 0; time <= ENTRANCE_DURATION; time += 10) {
      const bookMoving = postTravelProgress(time, 'book') > 0 && postTravelProgress(time, 'book') < 1
      const siteMoving = postTravelProgress(time, 'site') > 0 && postTravelProgress(time, 'site') < 1
      expect(bookMoving && siteMoving).toBe(false)
    }
  })

  it('both reach full travel by the shared end point and stay there', () => {
    for (const key of ['book', 'site']) {
      expect(postTravelProgress(ENTRANCE_TIMELINE.travel[1], key)).toBe(1)
      expect(postTravelProgress(ENTRANCE_DURATION, key)).toBe(1)
    }
    expect(ENTRANCE_TIMELINE.posts[0]).toBeGreaterThanOrEqual(ENTRANCE_POST_TRAVEL.book[1])
  })
})

describe('posts landing on the door cards', () => {
  const geometry = entranceGeometry({ width: 1440, height: 900 })
  const camera = entranceCamera(geometry, 1)
  const door = { x: 526, y: 130, width: 403, height: 495 }
  const visual = { x: 526, y: 130, width: 403, height: 188 }

  it('starts exactly on the stone in the framed cover', () => {
    for (const post of Object.values(ENTRANCE_POSTS)) {
      const { layer, stone } = postLanding({ camera, post, door, visual, travel: 0 })
      expect(layer).toEqual(projectRect(camera, polygonBounds(post)))
      expect(stone).toEqual({ x: 0, y: 0, width: layer.width, height: layer.height })
    }
  })

  it('ends on the measured door card with the stone inside its picture area', () => {
    const { layer, stone } = postLanding({ camera, post: ENTRANCE_POSTS.book, door, visual, travel: 1 })
    for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(layer[key] - door[key])).toBeLessThanOrEqual(4)
    expect(stone.x).toBeGreaterThanOrEqual(0)
    expect(stone.y).toBeGreaterThanOrEqual(0)
    expect(stone.x + stone.width).toBeLessThanOrEqual(visual.width)
    expect(stone.y + stone.height).toBeLessThanOrEqual(visual.height)
  })

  it('uses the whole card when a door has no picture area, and stays put with no door', () => {
    const landed = postLanding({ camera, post: ENTRANCE_POSTS.site, door, visual: null, travel: 1 })
    expect(landed.stone.x + landed.stone.width).toBeLessThanOrEqual(door.width)
    expect(landed.stone.y + landed.stone.height).toBeLessThanOrEqual(door.height)

    const start = projectRect(camera, polygonBounds(ENTRANCE_POSTS.site))
    expect(postLanding({ camera, post: ENTRANCE_POSTS.site, door: null, visual: null, travel: 1 }).layer).toEqual(start)
    expect(postLanding({ camera, post: ENTRANCE_POSTS.site, door: { x: 0, y: 0, width: 0, height: 0 }, visual: null, travel: 1 }).layer).toEqual(start)
  })
})
