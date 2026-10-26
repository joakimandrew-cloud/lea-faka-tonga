import { describe, it, expect } from 'vitest'
import roleData from './roles.json'
import overrides from './role-overrides.json'
import vocabulary from '../../data/book-vocabulary.json'
import { SENTENCES, ROLE_LABELS } from './deck.js'
import { cluesFor, fillSlot, orderIndexFor, makeRound } from './rounds.js'
import { makeRng } from '../shared/fair.js'
import { roleKey, LABELS } from './build-roles.mjs'

// Every Tongan word here is read from the data; none is typed.
const LABEL_SET = new Set(roleData.labels.map(l => l.label))

describe('Sentence Tiles clue labels (roles.json)', () => {
  it('lists a small fixed label set, each with its source, and no em dash anywhere', () => {
    expect(roleData.labels.length).toBeGreaterThan(5)
    expect(roleData.labels.length).toBeLessThanOrEqual(30)
    for (const l of roleData.labels) {
      expect(typeof l.label).toBe('string')
      expect(l.source.length).toBeGreaterThan(5)
    }
    expect(roleData.labels.map(l => l.label)).toEqual(LABELS.map(([l]) => l))
    expect(ROLE_LABELS).toEqual(roleData.labels.map(l => l.label))
    expect(JSON.stringify(roleData)).not.toMatch(/—/)
    expect(JSON.stringify(overrides)).not.toMatch(/—/)
  })

  it('has an entry for every kept sentence with one label or null per word, every label in the set', () => {
    expect(Object.keys(roleData.items).sort()).toEqual(SENTENCES.map(s => s.id).sort())
    for (const s of SENTENCES) {
      const roles = roleData.items[s.id]
      expect(roles, s.id).toHaveLength(s.words.length)
      for (const r of roles) expect(r === null || LABEL_SET.has(r), `${s.id}: ${r}`).toBe(true)
      expect(s.roles[0], s.id).toEqual(roles)
    }
  })

  it('was settled by hand for every kept sentence, against the sentence as it stands', () => {
    for (const s of SENTENCES) {
      const o = overrides.items[s.id]
      expect(o, s.id).toBeTruthy()
      expect(o.words, s.id).toBe(s.words.join(' '))
      expect(o.roles, s.id).toEqual(roleData.items[s.id])
    }
  })

  it('gives a second order its own words\' labels', () => {
    const withSecond = SENTENCES.filter(s => s.orders.length > 1)
    expect(withSecond.length).toBeGreaterThan(0)
    for (const s of withSecond) {
      for (let k = 1; k < s.orders.length; k++) {
        // each word of the second order carries the label it has in the book's order
        const pairs = s.orders[k].map((w, i) => `${w}|${s.roles[k][i]}`).sort()
        const book = s.words.map((w, i) => `${w}|${s.roles[0][i]}`).sort()
        expect(pairs, s.id).toEqual(book)
      }
      // once the line follows the second order only, the clues follow it too
      const first = s.orders[1][0]
      if (first !== s.words[0]) {
        expect(orderIndexFor(s, [first]), s.id).toBe(1)
        expect(cluesFor(s, [first]), s.id).toEqual(s.roles[1])
      }
      expect(cluesFor(s, []), s.id).toEqual(s.roles[0])
    }
  })

  it('matches words after case, fakauʻa and the definitive accent, and keeps macrons distinct', () => {
    const acute = SENTENCES.flatMap(s => s.words).find(w => /[áéíóú]/.test(w))
    expect(acute).toBeTruthy()
    expect(roleKey(acute)).not.toMatch(/[áéíóú]/)
    expect(roleKey(acute)).toBe(roleKey(acute.normalize('NFD').replace(/́/g, '').normalize('NFC')))
    const okina = vocabulary.map(v => v.tongan).find(w => w.includes('ʻ')) ?? vocabulary.map(v => v.tongan).find(w => w.includes("'"))
    expect(roleKey(okina)).toBe(roleKey(okina.replace(/ʻ/g, "'")))
    expect(roleKey(okina.toUpperCase())).toBe(roleKey(okina))
    const macron = SENTENCES.flatMap(s => s.words).find(w => /[āēīōū]/.test(w))
    expect(roleKey(macron)).toMatch(/[āēīōū]/)
    expect(roleKey(macron)).not.toBe(roleKey(macron.normalize('NFD').replace(/̄/g, '').normalize('NFC')))
  })

  it('fills in the next word of the order the line follows, and nothing once complete', () => {
    const s = SENTENCES.find(x => x.orders.length > 1 && x.orders[1][0] !== x.words[0])
    const round = makeRound(s, makeRng(3))
    const firstBook = fillSlot(s, round.tiles, [])
    expect(round.tiles.find(t => t.slot === firstBook).text).toBe(s.words[0])
    // after the second order's first tile, the fill-in carries on in the second order
    const secondFirst = round.tiles.find(t => t.text === s.orders[1][0]).slot
    const next = fillSlot(s, round.tiles, [secondFirst])
    expect(round.tiles.find(t => t.slot === next).text).toBe(s.orders[1][1])
    // walk the book order to the end
    const placed = []
    for (let i = 0; i < s.words.length; i++) placed.push(fillSlot(s, round.tiles, placed))
    expect(placed.map(sl => round.tiles.find(t => t.slot === sl).text)).toEqual(s.words)
    expect(new Set(placed).size).toBe(placed.length)
    expect(fillSlot(s, round.tiles, placed)).toBe(null)
  })
})

describe('Sentence Tiles clue labels: the judge\'s findings (Step 9)', () => {
  const at = ref => { const [id, pos] = ref.split('#'); return roleData.items[id][Number(pos) - 1] }
  const all = (refs, want) => { for (const r of refs.split(' ')) expect(at(r), r).toBe(want) }

  it('has 28 terms, including dual marker, verbal noun and prohibition marker', () => {
    expect(roleData.labels).toHaveLength(28)
    for (const l of ['dual marker', 'verbal noun', 'prohibition marker']) expect(LABEL_SET.has(l), l).toBe(true)
  })
  it('labels ongo as dual marker', () => all('ch25-ex5-3#2', 'dual marker'))
  it('labels the adjectives', () => all('ch41-ex3-3#3 ch41-ex3-6#3 ch50-ex4-4#2', 'adjective'))
  it('labels the noun used as an adverb a modifier', () => all('ch41-ex3-5#4', 'modifier'))
  it('labels e in mālō e and ko e an article', () => all('ch14-ex2-1#2 ch14-ex2-2#3 ch14-ex2-7#2 ch12-ex2-2#2 ch13-ex2-4#2 ch20-ex4-1#2 ch20-ex4-2#2', 'article'))
  it('labels the verbal nouns', () => {
    all('ch17-ex4-3#3 ch30-ex2-4#3 ch30-ex2-4#5 ch42-ex2-3#3 ch42-ex2-3#6 ch43-ex2-2#5 ch44-ex4-1#3 ch44-ex4-2#3 ch45-ex3-2#3 ch45-ex3-4#6', 'verbal noun')
  })
  it('labels the prohibition markers', () => all('ch5-ex2-3#1 ch5-ex2-5#1 ch21-ex2-6#1 ch23-ex2-5#4 ch26-ex4-4#1 ch34-ex2-4#1 ch35-ex6-3#1', 'prohibition marker'))
  it('shows no label where the book does not settle the word', () => {
    all('ch42-ex2-3#4 ch39-ex5-4#3 ch35-ex6-3#4 ch35-ex6-4#2 ch35-ex6-3#5 ch29-ex3-2#4 ch29-ex3-3#2 ch29-ex3-5#4 ch29-ex5-4#4 ch31-ex2-1#2 ch31-ex2-3#2', null)
  })
})
