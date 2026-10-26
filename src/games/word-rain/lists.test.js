import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import confusable from './confusable-pairs.json'
import {
  makeRng, makeRound, shareWord, derivedPair, DIRECTIONS,
} from './index.js'
import { ALL_LISTS, LIST_GROUPS, listDeck, EVERYTHING, MIN_LIST_WORDS, bestKey } from './lists.js'

const byId = new Map(vocabulary.map(v => [v.id, v]))
const LEVELS = ['essential', 'useful', 'all']
const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
const blocked = new Set(confusable.pairs.map(([a, b]) => pairKey(a, b)))

describe('word lists', () => {
  it('offers the five kinds and the eight topics', () => {
    expect(LIST_GROUPS.map(g => g.id)).toEqual(['kind', 'topic'])
    expect(LIST_GROUPS[0].lists.map(l => l.label)).toEqual(['Everything', 'Things', 'Actions', 'Describing words', 'Numbers'])
    expect(LIST_GROUPS[1].lists.map(l => l.label)).toEqual([
      'Family', 'People', 'Body', 'Feelings', 'Food and drink', 'Home and clothes', 'Places and travel', 'Nature',
    ])
  })

  it('has no animals list: no word is added to the course vocabulary', () => {
    expect(ALL_LISTS.some(l => /animal/i.test(l.label))).toBe(false)
  })

  it('keeps a best score per list and level', () => {
    expect(bestKey('numbers', 'all')).not.toBe(bestKey('numbers', 'essential'))
    expect(bestKey('body', 'useful')).not.toBe(bestKey('nature', 'useful'))
  })

  for (const list of ALL_LISTS) {
    for (const level of LEVELS) {
      describe(`${list.id} at ${level}`, () => {
        const { cards, playable, levelIgnored } = listDeck(vocabulary, list.id, level)
        const full = listDeck(vocabulary, EVERYTHING, 'all').cards

        it('builds with at least 8 words and no grammar entry', () => {
          expect(playable).toBe(true)
          expect(cards.length).toBeGreaterThanOrEqual(MIN_LIST_WORDS)
          for (const c of cards) expect(byId.get(c.id).category).not.toBe('grammar')
          if (!levelIgnored && list.id === EVERYTHING) expect(cards.length).toBeGreaterThan(100)
        })

        for (const direction of DIRECTIONS) {
          it(`plays 500 rounds, ${direction}, with no overlap`, () => {
            const rng = makeRng(31 + list.id.length + level.length + direction.length)
            for (let i = 0; i < 500; i++) {
              const r = makeRound(cards, rng, { direction, optionCount: 4, fallback: full })
              expect(r.options.length, `${list.id} round ${i}`).toBe(4)
              expect(cards.some(c => c.id === r.target.id)).toBe(true)
              for (let a = 0; a < 4; a++) {
                for (let b = a + 1; b < 4; b++) {
                  const x = r.options[a]
                  const y = r.options[b]
                  expect(shareWord(x, y), `${x.id} ${y.id}`).toBe(false)
                  expect(derivedPair(x, y), `${x.id} ${y.id}`).toBe(false)
                  expect(blocked.has(pairKey(x.id, y.id)), `${x.id} ${y.id}`).toBe(false)
                }
              }
            }
          })
        }
      })
    }
  }

  it('a list the level leaves under 8 words plays whole; the others filter by level', () => {
    const essential = listDeck(vocabulary, 'family', 'essential')
    expect(essential.levelIgnored).toBe(true)
    expect(essential.cards.length).toBeGreaterThanOrEqual(MIN_LIST_WORDS)
    const everything = listDeck(vocabulary, EVERYTHING, 'essential')
    expect(everything.levelIgnored).toBe(false)
    expect(everything.cards.every(c => c.tier === 1)).toBe(true)
  })

  it('Numbers holds only numbers', () => {
    const { cards } = listDeck(vocabulary, 'numbers', 'all')
    for (const c of cards) expect(byId.get(c.id).part_of_speech).toBe('number')
    expect(cards.length).toBeGreaterThanOrEqual(MIN_LIST_WORDS)
  })
})
