import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vocabulary from '../data/book-vocabulary.json'
import { okinafy } from './okinafy'
import { buildVocabLists } from './vocab-lists'

const built = buildVocabLists(vocabulary, okinafy)
const { meaningGroups, otherMeanings, lists, deckForLists } = built
const byId = new Map(vocabulary.map((r) => [r.id, r]))
const list = (id) => lists.find((l) => l.id === id)
const glosses = (id) => list(id).ids.map((i) => byId.get(i).english)
const deckGlosses = (ids) => deckForLists(ids).map((r) => r.english)

function expectCount(id, expected) {
  const rows = list(id).ids.map((i) => byId.get(i))
  if (rows.length !== expected) {
    console.log(`${id}: expected ${expected}, got ${rows.length}`)
    for (const r of rows) console.log(`  ${r.id} ${r.tongan} | ${r.english} | ${r.part_of_speech}`)
  }
  expect(rows.length).toBe(expected)
}

describe('meaning groups', () => {
  it('has exactly four groups: hiva, nima, taha, lava', () => {
    expect([...meaningGroups.keys()].sort()).toEqual(['hiva', 'lava', 'nima', 'taha'])
  })

  it('hiva is nine and sing; nima is five and hand', () => {
    expect(meaningGroups.get('hiva').map((r) => r.english).sort()).toEqual(['nine', 'sing'])
    expect(meaningGroups.get('nima').map((r) => r.english).sort()).toEqual(['five', 'hand'])
  })

  it('no group holds an accent example or joins a macron and a non-macron form', () => {
    for (const rows of meaningGroups.values()) {
      for (const r of rows) expect(r.english).not.toContain('(accent example)')
      expect(new Set(rows.map((r) => okinafy(r.tongan).toLowerCase().trim())).size).toBe(1)
    }
  })

  it('otherMeanings returns the other rows, and [] for an ungrouped row', () => {
    const [nine, sing] = ['nine', 'sing'].map((g) => meaningGroups.get('hiva').find((r) => r.english === g))
    expect(otherMeanings(nine).map((r) => r.id)).toEqual([sing.id])
    expect(otherMeanings(sing).map((r) => r.id)).toEqual([nine.id])
    const lone = vocabulary.find((r) => !meaningGroups.has(okinafy(r.tongan).toLowerCase().trim()))
    expect(otherMeanings(lone)).toEqual([])
  })
})

describe('themed lists', () => {
  it('numbers is the exact 17-gloss sequence with distinct ids', () => {
    expect(glosses('numbers')).toEqual([
      'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'twenty', 'thirty', 'forty', 'fifty', 'one hundred', 'one thousand',
    ])
    expect(new Set(list('numbers').ids).size).toBe(17)
  })

  it('days run Monday to Sunday', () => {
    expect(glosses('days')).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  })

  it('months run January to December', () => {
    expect(glosses('months')).toEqual([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ])
  })

  it('time words 18, colours 6, greetings 6, questions 7', () => {
    expectCount('time', 18)
    expectCount('colours', 6)
    expectCount('greetings', 6)
    expectCount('questions', 7)
  })

  it('colours include blue and no noun', () => {
    expect(glosses('colours')).toContain('blue')
    for (const id of list('colours').ids) expect(byId.get(id).category).not.toBe('nouns')
  })

  it('every list id exists in the data', () => {
    for (const l of lists) for (const id of l.ids) expect(byId.has(id)).toBe(true)
  })
})

describe('deckForLists', () => {
  it('days then months is 19 rows, Monday first', () => {
    const g = deckGlosses(['days', 'months'])
    expect(g).toHaveLength(19)
    expect(g[0]).toBe('Monday')
  })

  it('months then days is 19 rows, January first', () => {
    const g = deckGlosses(['months', 'days'])
    expect(g).toHaveLength(19)
    expect(g[0]).toBe('January')
  })

  it('time then days has no duplicate ids', () => {
    const ids = deckForLists(['time', 'days']).map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('vocab-lists.js source', () => {
  it('contains no import', () => {
    const src = readFileSync(fileURLToPath(new URL('./vocab-lists.js', import.meta.url)), 'utf8')
    expect(src).not.toContain('import')
  })
})

describe('number placement', () => {
  it('throws on a number row it cannot place', () => {
    const rows = [{ id: 'x', tongan: 'x', english: 'zzz', part_of_speech: 'number', category: 'numbers', chapter: 0 }]
    expect(() => buildVocabLists(rows, okinafy)).toThrow(/cannot place/)
  })
})
