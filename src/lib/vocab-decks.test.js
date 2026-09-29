import { describe, expect, it } from 'vitest'
import topicData from '../data/vocab-topics.json'
import { deckForPickerLists, lists, pickerLists, topicMenu } from './vocab-decks'

describe('vocab-decks picker lists', () => {
  it('lists the seven tagged lists, then the topics', () => {
    expect(lists).toHaveLength(7)
    expect(pickerLists.map(entry => entry.id)).toEqual([
      ...lists.map(entry => entry.id),
      ...topicData.topics.map(topic => topic.id),
    ])
    expect(topicMenu.map(entry => entry.label)).toEqual(topicData.topics.map(topic => topic.label))
  })

  it('builds each topic deck in the order of vocab-topics.json', () => {
    for (const topic of topicData.topics) {
      expect(deckForPickerLists([topic.id]).map(row => row.id)).toEqual(topic.ids)
    }
  })

  it('still builds the tagged lists (Days of the week starts on Monday)', () => {
    expect(deckForPickerLists(['days'])[0].english).toBe('Monday')
  })
})
