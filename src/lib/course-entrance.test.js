import { describe, expect, it } from 'vitest'
import { createEntranceSession, ENTRANCE_SESSION_KEY, entranceGeometry, shouldShowEntrance } from './course-entrance'

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

describe('gateway camera geometry', () => {
  it.each([[320, 740], [390, 844], [768, 1024], [1280, 900], [2304, 1200], [844, 390], [305, 400]])('finishes through the opening at %s × %s without exposed edges', (width, height) => {
    const geometry = entranceGeometry({ width, height })
    const { scale, translateX, translateY } = geometry.transform
    const points = geometry.gateway.split(' ').map(pair => {
      const [x, y] = pair.split(',').map(Number)
      return { x: x * scale + translateX, y: y * scale + translateY }
    })
    for (const [x, y] of [[0, 0], [width, 0], [width, height], [0, height]]) {
      for (let i = 0; i < points.length; i += 1) {
        const a = points[i], b = points[(i + 1) % points.length]
        expect((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)).toBeGreaterThan(0)
      }
    }
    expect(geometry.image.width / geometry.image.height).toBeCloseTo(1222 / 1287)
    expect(scale).toBeGreaterThan(1)
  })

  it('reserves a side control area in short landscape viewports', () => {
    expect(entranceGeometry({ width: 844, height: 390 }).layout).toBe('landscape')
    expect(entranceGeometry({ width: 390, height: 844 }).layout).toBe('portrait')
  })
})
