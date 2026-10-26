import { describe, it, expect } from 'vitest'
import vocabulary from '../../data/book-vocabulary.json'
import wordLists from '../../premium/data/word-lists.json'
import confusable from './confusable-pairs.json'
import { listMenu, topicMenu } from '../../lib/vocab-decks.js'
import {
  makeRng, makeRound, shareWord, derivedPair, clashes, DIRECTIONS,
} from './index.js'
import {
  ALL_MENU, MENU, MENU_LISTS, ALL_WORDS, ALL_WORDS_ID, MIN_LIST_WORDS, listById, homeList, bestKey, oldBestKeys,
} from './lists.js'
import { LEFT_OUT_OF_GAME } from './deck.js'

const byId = new Map(vocabulary.map(v => [v.id, v]))
const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
const blocked = new Set(confusable.pairs.map(([a, b]) => pairKey(a, b)))
const courseNonGrammar = vocabulary.filter(v => v.category !== 'grammar' && !/\(accent example\)/i.test(v.english))
// The three words the game leaves out for children (deck.js LEFT_OUT_OF_GAME) are word-list words.
const wordListOnly = wordLists.entries.filter(e => !e.course_id && !LEFT_OUT_OF_GAME.has(e.id))

describe('Word Rain menu: the Cards page lists, every word', () => {
  it('has the Cards page groups in its order, then the word lists', () => {
    expect(ALL_MENU.map(g => g.label)).toEqual(['Word types', 'Course lists', 'Topics', 'Word lists'])
    expect(ALL_MENU[0].lists.map(l => l.label)).toEqual(['All words', 'Adjectives', 'Adverbs', 'Nouns', 'Verbs'])
    expect(ALL_MENU[1].lists.map(l => l.label)).toEqual(listMenu.map(e => e.label))
    expect(ALL_MENU[2].lists.map(l => l.label)).toEqual(topicMenu.map(e => e.label))
    expect(ALL_MENU[3].lists.map(l => l.label)).toEqual(wordLists.themes.map(t => t.label))
  })

  it('has no Essential / Useful / All level anywhere in the menu', () => {
    for (const l of MENU_LISTS) expect(l.label).not.toMatch(/^(Essential|Useful)$/)
  })

  it('All words is every course word outside grammar plus every word-list word that is not a course word', () => {
    expect(ALL_WORDS.length).toBe(courseNonGrammar.length + wordListOnly.length)
    expect(new Set(ALL_WORDS.map(c => c.id)).size).toBe(ALL_WORDS.length)
    for (const c of ALL_WORDS) if (byId.has(c.id)) expect(byId.get(c.id).category).not.toBe('grammar')
    expect(listById(ALL_WORDS_ID).cards).toBe(ALL_WORDS)
    // A word-list row that is a course word is the course card, once.
    for (const e of wordLists.entries.filter(x => x.course_id)) {
      expect(ALL_WORDS.filter(c => c.id === e.course_id).length).toBe(1)
      expect(ALL_WORDS.some(c => c.id === e.id)).toBe(false)
    }
  })

  it('Land animals holds its 19 words, Colours 9, Parts of body 61 (64 less the three left out)', () => {
    expect(listById('wl:land-animals').count).toBe(19)
    expect(listById('wl:colours').count).toBe(9)
    expect(listById('wl:parts-of-body').count).toBe(61)
  })

  it('offers a list only with 8 or more playable words, and every offered list has them', () => {
    for (const g of ALL_MENU) {
      for (const l of g.lists) {
        expect(l.playable).toBe(l.cards.length >= MIN_LIST_WORDS)
        expect(MENU_LISTS.some(x => x.id === l.id)).toBe(l.playable)
      }
    }
    expect(MENU.every(g => g.lists.length > 0)).toBe(true)
  })

  it('a word type holds every word of that kind, word-list words included', () => {
    const nouns = listById('type:nouns').cards
    expect(nouns.every(c => c.category === 'nouns')).toBe(true)
    expect(nouns.length).toBe(
      courseNonGrammar.filter(v => v.category === 'nouns').length
      + wordListOnly.filter(e => e.part_of_speech.startsWith('noun')).length,
    )
  })

  it('a word with a register keeps it on its face', () => {
    const fatu = ALL_WORDS.find(c => c.id === 'wl-body-027')
    expect(fatu.meaning).toBe('stomach (noble word)')
    // One pair of brackets: the register joins the word's own note.
    expect(fatu.full).toBe('stomach (said of a chief, noble word)')
    // Too long for the button with its whole note, so the button keeps the register only.
    expect(fatu.label).toBe('stomach (noble word)')
    for (const c of ALL_WORDS) expect(c.full, c.id).not.toMatch(/\)\s*\(/)
  })

  it('leaves words unsuited to children out of every list', () => {
    for (const id of LEFT_OUT_OF_GAME) {
      expect(ALL_WORDS.some(c => c.id === id), id).toBe(false)
      for (const group of MENU) for (const list of group.lists) expect(list.cards.some(c => c.id === id), `${list.id} ${id}`).toBe(false)
    }
    for (const c of ALL_WORDS) expect(c.full, c.id).not.toMatch(/genital|breast|buttock/i)
  })

  it('a word-list word has its own list as home; a course word has none', () => {
    expect(homeList(ALL_WORDS.find(c => c.id === 'wl-animal-010'))?.length).toBe(19)
    expect(homeList(ALL_WORDS.find(c => c.id === 'book-v0026'))).toBeNull()
  })

  it('keeps a best score per list, and reads the nearest old key', () => {
    expect(bestKey('topic:family')).not.toBe(bestKey('topic:nature'))
    expect(oldBestKeys(ALL_WORDS_ID)).toContain('everything|all')
    expect(oldBestKeys('topic:family')).toEqual(['family|all'])
    expect(oldBestKeys('wl:land-animals')).toEqual([])
  })

  for (const list of MENU_LISTS) {
    describe(list.id, () => {
      for (const direction of DIRECTIONS) {
        it(`plays 500 rounds, ${direction}, with no overlap`, () => {
          const rng = makeRng(31 + list.id.length + direction.length)
          const fallback = list.id === ALL_WORDS_ID ? null : ALL_WORDS
          for (let i = 0; i < 500; i++) {
            const target = list.cards[Math.floor(rng() * list.cards.length)]
            const home = fallback ? null : homeList(target)
            const r = makeRound(home ?? list.cards, rng, { direction, optionCount: 4, target, fallback: home ? ALL_WORDS : fallback })
            expect(r.options.length, `${list.id} round ${i}`).toBe(4)
            expect(new Set(r.labels.map(x => x.toLowerCase())).size).toBe(4)
            for (let a = 0; a < 4; a++) {
              for (let b = a + 1; b < 4; b++) {
                const x = r.options[a]
                const y = r.options[b]
                expect(clashes(x, y), `${x.id} ${y.id}`).toBe(false)
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

  it('Numbers holds only numbers', () => {
    const { cards } = listById('list:numbers')
    for (const c of cards) expect(byId.get(c.id).part_of_speech).toBe('number')
    expect(cards.length).toBeGreaterThanOrEqual(MIN_LIST_WORDS)
  })
})
