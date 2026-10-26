import { describe, it, expect } from 'vitest'
import {
  makeBag, drawFromBag, missedInBag, RETURN_MIN, RETURN_MAX,
  makeRng, makeRound, makeFollowerRound, followerBlocked, clashes,
  gameReducer, initialGame, frontWord, levelFlightMs,
} from './index.js'
import { listById, MENU_LISTS } from './lists.js'

const ids = n => Array.from({ length: n }, (_, i) => `w${i + 1}`)

/** Draw `n` words from a fresh bag, nothing blocked. */
function drawMany(bag, rng, n) {
  const out = []
  let b = bag
  for (let i = 0; i < n; i++) {
    const r = drawFromBag(b, rng)
    out.push(r.id)
    b = r.bag
  }
  return { out, bag: b }
}

describe('Word Rain shuffle bag: no repeats', () => {
  it('in a 40-word list, the first 40 targets are all different (50 seeds)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = makeRng(seed)
      const { out } = drawMany(makeBag(ids(40), rng), rng, 40)
      expect(new Set(out).size, `seed ${seed}`).toBe(40)
    }
  })

  it('plays every word once per round, round after round, and a refill never starts with the last word played', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rng = makeRng(100 + seed)
      const { out } = drawMany(makeBag(ids(12), rng), rng, 12 * 6)
      for (let r = 0; r < 6; r++) {
        const slice = out.slice(r * 12, r * 12 + 12)
        expect(new Set(slice).size, `seed ${seed} round ${r + 1}`).toBe(12)
        if (r > 0) expect(slice[0], `seed ${seed} round ${r + 1}`).not.toBe(out[r * 12 - 1])
      }
    }
  })

  it('a missed word returns exactly once within 5-8 turns, then waits for the next round', () => {
    const seen = new Set()
    for (let seed = 1; seed <= 200; seed++) {
      const rng = makeRng(300 + seed)
      let bag = makeBag(ids(40), rng)
      // Play a few, miss the third word drawn.
      let missed = null
      for (let i = 0; i < 3; i++) {
        const r = drawFromBag(bag, rng)
        bag = r.bag
        missed = r.id
      }
      bag = missedInBag(bag, missed, rng)
      // A second report of the same miss changes nothing.
      expect(missedInBag(bag, missed, rng)).toBe(bag)
      const { out } = drawMany(bag, rng, 37)
      const at = out.map((id, i) => (id === missed ? i + 1 : 0)).filter(Boolean)
      expect(at.length, `seed ${seed}: ${missed} at ${at}`).toBe(1)
      expect(at[0]).toBeGreaterThanOrEqual(RETURN_MIN)
      expect(at[0]).toBeLessThanOrEqual(RETURN_MAX)
      seen.add(at[0])
      // Apart from the one return, the round still has no repeats.
      const rest = out.filter(id => id !== missed)
      expect(new Set(rest).size).toBe(rest.length)
    }
    // Every slot from 5 to 8 is used.
    expect([...seen].sort()).toEqual([5, 6, 7, 8])
  })

  it('a missed word due back while it is on screen comes next turn instead', () => {
    const rng = makeRng(9)
    let bag = makeBag(ids(20), rng)
    bag = drawFromBag(bag, rng).bag
    bag = missedInBag(bag, bag.last, () => 0) // back as the 5th word from now
    const missed = bag.last
    for (let i = 0; i < 4; i++) bag = drawFromBag(bag, rng).bag
    const blocked = drawFromBag(bag, rng, new Set([missed]))
    expect(blocked.id).not.toBe(missed)
    expect(drawFromBag(blocked.bag, rng).id).toBe(missed)
  })

  it('never draws a blocked word, and gives null (bag unchanged) when every word is blocked', () => {
    const rng = makeRng(4)
    const bag = makeBag(ids(3), rng)
    const r = drawFromBag(bag, rng, new Set(ids(3)))
    expect(r.id).toBeNull()
    expect(r.bag).toBe(bag)
    const one = drawFromBag(bag, rng, new Set(['w1', 'w2']))
    expect(one.id).toBe('w3')
  })
})

describe('Word Rain shuffle bag in play', () => {
  // The page's own steps: the front word from the bag (nothing on screen may
  // be drawn), a second word from the bag minus everything that could pass
  // for the front word or its answers.
  function launchFront(s, bag, rng, deck, byId) {
    const r = drawFromBag(bag, rng, new Set(s.words.map(w => w.round.target.id)))
    const round = makeRound(deck, rng, { optionCount: 4, target: byId.get(r.id) })
    return { s: gameReducer(s, { type: 'launch', round, duration: levelFlightMs(s.level), x: 0.3 }), bag: r.bag }
  }
  function launchSecond(s, bag, rng, deck, byId) {
    const f = frontWord(s)
    const blocked = followerBlocked(deck, f.round, s.words.map(w => w.round.target.id))
    const r = drawFromBag(bag, rng, blocked)
    if (!r.id) return { s, bag, round: null }
    const round = makeFollowerRound(deck, rng, f.round, { optionCount: 4, target: byId.get(r.id) })
    if (!round) return { s, bag, round: null }
    return { s: gameReducer(s, { type: 'launch', round, duration: 4000, x: 0.8 }), bag: r.bag, round }
  }

  for (const id of ['all', 'wl:land-animals', 'topic:family', 'list:numbers']) {
    it(`${id}: with two words in the air the two are never the same word (and never clash)`, () => {
      const { cards } = listById(id)
      const byId = new Map(cards.map(c => [c.id, c]))
      const rng = makeRng(77 + id.length)
      let bag = makeBag(cards.map(c => c.id), rng)
      let s = gameReducer(initialGame(), { type: 'start', instant: true })
      s = { ...s, level: 5 }
      let pairs = 0
      for (let turn = 0; turn < 300; turn++) {
        ;({ s, bag } = launchFront(s, bag, rng, cards, byId))
        const second = launchSecond(s, bag, rng, cards, byId)
        ;({ s, bag } = second)
        const flying = s.words.filter(w => w.fate === 'flying')
        if (flying.length === 2) {
          pairs++
          const [a, b] = flying.map(w => w.round.target)
          expect(a.id).not.toBe(b.id)
          expect(a.tongan).not.toBe(b.tongan)
          expect(clashes(a, b)).toBe(false)
        }
        // Answer every word in the air, front first.
        for (let w = frontWord(s); w; w = frontWord(s)) {
          s = gameReducer(s, { type: 'answer', key: w.key, index: w.round.correctIndex, elapsedMs: 500 })
        }
        s = { ...s, words: [] }
      }
      expect(pairs).toBeGreaterThan(50)
    })
  }

  it('Land animals: 20 straight targets are its 19 words, each once, before any repeat', () => {
    const { cards } = listById('wl:land-animals')
    expect(cards.length).toBe(19)
    for (let seed = 1; seed <= 30; seed++) {
      const rng = makeRng(seed)
      const { out } = drawMany(makeBag(cards.map(c => c.id), rng), rng, 20)
      expect(new Set(out.slice(0, 19)).size).toBe(19)
      expect(out[19]).not.toBe(out[18])
    }
  })

  it('every list on the menu plays its whole list before a repeat', () => {
    for (const l of MENU_LISTS) {
      const rng = makeRng(l.count)
      const { out } = drawMany(makeBag(l.cards.map(c => c.id), rng), rng, l.count)
      expect(new Set(out).size, l.id).toBe(l.count)
    }
  })
})
