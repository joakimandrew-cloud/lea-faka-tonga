import { describe, it, expect } from 'vitest'
import { makeRng } from '../shared/fair.js'
import { SENTENCES } from './deck.js'
import { makeTiles, makeRound, roundMs, isNextWord, acceptedOrders, ROUND_BASE_MS, ROUND_PER_TILE_MS, FLOOR_BASE_MS, FLOOR_PER_TILE_MS } from './rounds.js'

const fact = n => (n <= 1 ? 1 : n * fact(n - 1))

describe('Sentence Tiles rounds', () => {
  it('shows every word once as a tile, never already in order', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const rng = makeRng(seed)
      for (const s of SENTENCES) {
        const tiles = makeTiles(s, rng)
        expect(tiles.map(t => t.slot)).toEqual(s.words.map((_, i) => i))
        expect([...tiles.map(t => t.text)].sort()).toEqual([...s.words].sort())
        expect(tiles.map(t => t.text).join(' ')).not.toBe(s.words.join(' '))
      }
    }
  })

  it('accepts either of two identical tiles', () => {
    const dup = SENTENCES.filter(s => new Set(s.words).size < s.words.length)
    expect(dup.length).toBeGreaterThan(5)
    for (const s of dup) {
      const tiles = makeTiles(s, makeRng(7))
      const counts = {}
      for (const w of s.words) counts[w] = (counts[w] ?? 0) + 1
      const want = Object.values(counts).reduce((a, k) => a * fact(k), 1)
      const orders = acceptedOrders(s, tiles)
      expect(orders.length).toBe(want)
      for (const o of orders) expect(o.map(slot => tiles[slot].text)).toEqual(s.words)
      const word = Object.keys(counts).find(w => counts[w] > 1)
      const at = s.words.indexOf(word)
      for (const t of tiles.filter(x => x.text === word)) expect(isNextWord(s, at, t.text)).toBe(true)
    }
    for (const s of SENTENCES.filter(x => new Set(x.words).size === x.words.length).slice(0, 50)) {
      expect(acceptedOrders(s, makeTiles(s, makeRng(3))).length).toBe(1)
    }
  })

  it('gives more time for more tiles, less at each level, never under the floor', () => {
    expect(roundMs(3, 1)).toBe(ROUND_BASE_MS + 3 * ROUND_PER_TILE_MS)
    expect(roundMs(8, 1)).toBeGreaterThan(roundMs(3, 1))
    for (const n of [3, 5, 8]) {
      let prev = Infinity
      for (let l = 1; l <= 30; l++) {
        const ms = roundMs(n, l)
        expect(ms).toBeLessThanOrEqual(prev)
        expect(ms).toBeGreaterThanOrEqual(FLOOR_BASE_MS + n * FLOOR_PER_TILE_MS)
        prev = ms
      }
    }
    expect(makeRound(SENTENCES[0], makeRng(1), { level: 2 }).durationMs).toBe(roundMs(SENTENCES[0].words.length, 2))
  })
})
