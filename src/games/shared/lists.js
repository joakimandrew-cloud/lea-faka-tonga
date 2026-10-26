/**
 * Word Rain: the word menu (pure, no React).
 *
 * Since Step 4 (plan 2026-10-26-word-rain-game) the game offers the same menu
 * the Cards page does, in the same order and with the same labels: the word
 * types, the course lists and the topics (src/lib/vocab-decks.js, read only),
 * then the site's word lists (src/premium/data/word-lists.json: Parts of body,
 * Colours, Land animals). Every list holds every word it has: there is no
 * Essential / Useful / All choice (DECISIONS.md 2026-09-29, flip cards).
 *
 * "All words" is every course word outside the grammar category plus every
 * word-list word that is not already a course word (a row with a course_id is
 * the course card itself). The word types count word-list words too, by their
 * part of speech. A list with fewer than 8 playable words is not offered.
 * No word is added or changed here; the lists only select cards.
 */
import vocabulary from '../../data/book-vocabulary.json'
import wordLists from '../../premium/data/word-lists.json'
import { deckForPickerLists, listMenu, topicMenu } from '../../lib/vocab-decks.js'
import { allWordsDeck, buildDeck, wordListDecks } from './deck.js'

/** A list needs this many playable words, or it is not offered. */
export const MIN_LIST_WORDS = 8

export const ALL_WORDS_ID = 'all'

// The Cards page's word types, in its order (sorted), without "numbers" (the
// Numbers course list stands in for it there) and without "grammar" (never
// played here).
const TYPE_IDS = ['adjectives', 'adverbs', 'nouns', 'verbs']
const capital = s => s[0].toUpperCase() + s.slice(1)

const courseCards = buildDeck(vocabulary, 'all')
const courseById = new Map(courseCards.map(c => [c.id, c]))
/** Every word the game can play (course words, then word-list words). */
export const ALL_WORDS = allWordsDeck(vocabulary, wordLists)
const listDecks = wordListDecks(wordLists, courseCards)

/** Cards for a Cards-page menu entry: its rows, grammar left out. */
function pickerCards(entry) {
  return deckForPickerLists(entry.lists).map(row => courseById.get(row.id)).filter(Boolean)
}

const RAW_GROUPS = [
  {
    id: 'types',
    label: 'Word types',
    lists: [
      { id: ALL_WORDS_ID, label: 'All words', cards: ALL_WORDS },
      ...TYPE_IDS.map(t => ({ id: `type:${t}`, label: capital(t), cards: ALL_WORDS.filter(c => c.category === t) })),
    ],
  },
  {
    id: 'course',
    label: 'Course lists',
    lists: listMenu.map(e => ({ id: `list:${e.id}`, label: e.label, cards: pickerCards(e) })),
  },
  {
    id: 'topics',
    label: 'Topics',
    lists: topicMenu.map(e => ({ id: `topic:${e.id}`, label: e.label, cards: pickerCards(e) })),
  },
  {
    id: 'word-lists',
    label: 'Word lists',
    lists: (wordLists.themes ?? []).map(t => ({ id: `wl:${t.id}`, label: t.label, cards: listDecks.get(t.id) ?? [] })),
  },
]

/**
 * Every list the Cards page has, each with its cards, its count and whether
 * it is offered (8 words or more). The menu shows only the offered ones.
 */
export const ALL_MENU = RAW_GROUPS.map(g => ({
  ...g,
  lists: g.lists.map(l => ({ ...l, count: l.cards.length, playable: l.cards.length >= MIN_LIST_WORDS })),
}))

/** The menu as the page shows it: offered lists only, empty groups dropped. */
export const MENU = ALL_MENU
  .map(g => ({ ...g, lists: g.lists.filter(l => l.playable) }))
  .filter(g => g.lists.length)

export const MENU_LISTS = MENU.flatMap(g => g.lists)
const byId = new Map(MENU_LISTS.map(l => [l.id, l]))

/** The list a menu id names, or All words for an id the menu does not offer. */
export function listById(id) {
  return byId.get(id) ?? byId.get(ALL_WORDS_ID)
}

/** The cards of the word list a word-list word belongs to (its own list). */
export function homeList(card) {
  return card?.list ? listDecks.get(card.list) ?? null : null
}

/** The key a best score is kept under: the list (no level since Step 4). */
export function bestKey(listId) {
  return listId
}

// Best scores kept by Steps 1 to 3 (key "<old list>|<level>", or the level
// alone in Step 1). The old "all" level of a list is the nearest to the new
// list, which holds the same words or more, so it is read when the new key
// has nothing yet.
const OLD_LIST_IDS = {
  [ALL_WORDS_ID]: ['everything|all', 'all'],
  'type:nouns': ['things|all'],
  'type:verbs': ['actions|all'],
  'type:adjectives': ['describing|all'],
  'list:numbers': ['numbers|all'],
}
export function oldBestKeys(listId) {
  if (OLD_LIST_IDS[listId]) return OLD_LIST_IDS[listId]
  if (listId.startsWith('topic:')) return [`${listId.slice(6)}|all`]
  return []
}
