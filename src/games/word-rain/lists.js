/**
 * Word Rain: word lists (pure, no React).
 *
 * A list is a slice of the course vocabulary the player chooses on the title
 * screen: a kind (things, actions, describing words, numbers) or a topic (the
 * eight topics of the Cards page). A level (Essential / Useful / All) then
 * filters inside the list. Every list is made of vocabulary rows as they are;
 * no word is added. The "grammar" category never plays.
 *
 * The topics and the numbers list come from src/lib/vocab-decks.js, the same
 * lists the Cards page uses. This file reads them and changes nothing there.
 */
import { lists as taggedLists, topics } from '../../lib/vocab-decks.js'
import { toCard } from './deck.js'

/** A list needs this many playable words, or its chip is hidden. */
export const MIN_LIST_WORDS = 8

export const EVERYTHING = 'everything'

const CATEGORY_KINDS = [
  { id: 'things', label: 'Things', hint: 'nouns', category: 'nouns' },
  { id: 'actions', label: 'Actions', hint: 'verbs', category: 'verbs' },
  { id: 'describing', label: 'Describing words', hint: 'adjectives', category: 'adjectives' },
]
const numbersIds = new Set(taggedLists.find(l => l.id === 'numbers')?.ids ?? [])

/** The title screen's two rows of chips, in order. */
export const LIST_GROUPS = [
  {
    id: 'kind',
    label: 'By kind',
    lists: [
      { id: EVERYTHING, label: 'Everything' },
      ...CATEGORY_KINDS.map(({ id, label, hint }) => ({ id, label, hint })),
      { id: 'numbers', label: 'Numbers' },
    ],
  },
  {
    id: 'topic',
    label: 'By topic',
    lists: topics.map(t => ({ id: t.id, label: t.label })),
  },
]

export const ALL_LISTS = LIST_GROUPS.flatMap(g => g.lists)
export const LIST_LABELS = Object.fromEntries(ALL_LISTS.map(l => [l.id, l.label]))

/** Does a vocabulary row belong to the list? */
function inList(listId, row, topicIds) {
  if (listId === EVERYTHING) return true
  const kind = CATEGORY_KINDS.find(k => k.id === listId)
  if (kind) return row.category === kind.category
  if (listId === 'numbers') return numbersIds.has(row.id)
  return topicIds ? topicIds.has(row.id) : false
}

const TIER_FOR_LEVEL = { essential: 1, useful: 2, all: 3 }

/**
 * The playable words of a list at a level.
 *   cards         the words the game plays with
 *   level         the level actually used ('all' when `levelIgnored`)
 *   levelIgnored  the level left fewer than 8 words, so the whole list plays
 *   playable      the list has at least 8 words at all (else hide its chip)
 * Cards come back in the order of the vocabulary file.
 */
export function listDeck(vocabulary, listId = EVERYTHING, level = 'essential') {
  const topic = topics.find(t => t.id === listId)
  const topicIds = topic ? new Set(topic.ids) : null
  const whole = vocabulary
    .filter(v => v.category !== 'grammar' && inList(listId, v, topicIds))
    .map(toCard)
    .filter(c => c.meaning && c.tongan)
  const cap = TIER_FOR_LEVEL[level] ?? 3
  const atLevel = whole.filter(c => c.tier <= cap)
  if (atLevel.length >= MIN_LIST_WORDS) return { cards: atLevel, level, levelIgnored: false, playable: true }
  return {
    cards: whole,
    level: 'all',
    levelIgnored: whole.length > atLevel.length || level !== 'all',
    playable: whole.length >= MIN_LIST_WORDS,
  }
}

/** The key a best score is kept under: the list and the level actually played. */
export function bestKey(listId, level) {
  return `${listId}|${level}`
}
