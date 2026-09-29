import vocabulary from '../data/book-vocabulary.json'
import topicData from '../data/vocab-topics.json'
import { okinafy } from './okinafy'
import { buildVocabLists } from './vocab-lists'

const built = buildVocabLists(vocabulary, okinafy)

export const meaningGroups = built.meaningGroups
export const otherMeanings = built.otherMeanings
export const lists = built.lists
export const deckForLists = built.deckForLists
export const listMenu = built.menu

// Topic lists (Family, Food and drink, ...), generated from the judged
// topic-tags.tsv into vocab-topics.json. Each topic holds ids only, ordered by
// chapter then id; the words themselves come from book-vocabulary.json.
export const topics = topicData.topics

// The picker's lists: the seven tagged lists, then the topics.
export const pickerLists = [...built.lists, ...topics]

// The topics as the card page's Category menu offers them (one topic each).
export const topicMenu = topics.map(topic => ({ id: topic.id, label: topic.label, lists: [topic.id] }))

// Union of chosen picker lists: chosen order, each list in its own order, no repeats.
const rowById = new Map(vocabulary.map(row => [row.id, row]))
export function deckForPickerLists(listIds) {
  const seen = new Set()
  const deck = []
  for (const listId of listIds) {
    const list = pickerLists.find(entry => entry.id === listId)
    if (!list) continue
    for (const id of list.ids) {
      if (seen.has(id) || !rowById.has(id)) continue
      seen.add(id)
      deck.push(rowById.get(id))
    }
  }
  return deck
}
