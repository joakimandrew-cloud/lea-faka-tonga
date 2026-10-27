import { describe, it, expect } from 'vitest'
import { HOWTO_KEY, hasSeenHowTo, markHowToSeen, showHowToOnStart, howToSteps } from './howto.js'
import { POINTS_BY_TRY, MAX_WRONG } from './scoring.js'

/** A store like the page's (readStore / writeStore), backed by a Map. */
function memoryStore() {
  const m = new Map()
  return { m, read: k => (m.has(k) ? m.get(k) : null), write: (k, v) => { m.set(k, v) } }
}
/** A store that throws on every call (a browser that refuses storage). */
const refusing = { read: () => { throw new Error('denied') }, write: () => { throw new Error('denied') } }

describe('how to play: the seen flag', () => {
  it('shows the card on the first start, not after it is closed', () => {
    const store = memoryStore()
    expect(hasSeenHowTo(store)).toBe(false)
    expect(showHowToOnStart(store)).toBe(true)
    expect(markHowToSeen(store)).toBe(true)
    expect(store.m.get(HOWTO_KEY)).toBe('1')
    expect(hasSeenHowTo(store)).toBe(true)
    expect(showHowToOnStart(store)).toBe(false)
  })

  it('keeps its own key, apart from the mute and best-score keys', () => {
    expect(HOWTO_KEY).toBe('lft-sentence-lock-howto-seen')
    const store = memoryStore()
    store.write('lft-sentence-lock-muted', '1')
    store.write('lft-sentence-lock-best', '{}')
    expect(hasSeenHowTo(store)).toBe(false)
  })

  it('reads only "1" as seen', () => {
    const store = memoryStore()
    for (const v of ['0', '', 'true', 'yes']) {
      store.write(HOWTO_KEY, v)
      expect(hasSeenHowTo(store)).toBe(false)
    }
  })

  it('never throws when storage refuses, and then shows the card each start', () => {
    expect(() => hasSeenHowTo(refusing)).not.toThrow()
    expect(hasSeenHowTo(refusing)).toBe(false)
    expect(markHowToSeen(refusing)).toBe(false)
    expect(showHowToOnStart(refusing)).toBe(true)
    expect(showHowToOnStart(null)).toBe(true)
    expect(markHowToSeen(undefined)).toBe(true)
  })
})

describe('how to play: the steps', () => {
  const steps = howToSteps()
  const all = steps.map(s => s.text).join(' ')

  it('has five short steps in play order', () => {
    expect(steps.map(s => s.id)).toEqual(['read', 'turn', 'check', 'lock', 'points'])
    for (const s of steps) expect(s.text.length).toBeLessThan(140)
  })

  it('names every way to turn, the Check button and Enter, and no Lock button', () => {
    for (const w of ['arrows', 'swipe', 'mouse wheel', 'up and down keys', 'Check', 'Enter']) expect(all).toContain(w)
    expect(all).not.toMatch(/\bLock\b/)
  })

  it('takes its points and tries from the scoring table, and says there is no clock', () => {
    expect(POINTS_BY_TRY).toEqual([3, 2, 1])
    expect(MAX_WRONG).toBe(3)
    expect(all).toContain('3, 2 or 1 points')
    expect(all).toContain('after three wrong tries the answer is shown')
    expect(all).toContain('no clock')
  })

  it('has no em dash and no Tongan typed in', () => {
    expect(all).not.toContain('—')
    expect(all).not.toMatch(/[ʻ'ʻāēīōūáéíóú]/)
  })
})
