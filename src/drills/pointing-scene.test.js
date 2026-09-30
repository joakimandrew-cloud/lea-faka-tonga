import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import drillMap from '../data/drill-map.json'
import {
  POINTING_ITEMS,
  createPointingSceneState,
  reducePointingScene,
} from './pointing-scene'

const EXACT_SOURCE = [
  [59, 'Nofo heni.', 'Stay here.', 'speaker'],
  [69, "Ko ho'o kató ena 'i he loki.", 'There (near you) is your basket in the room.', 'listener'],
  [77, 'Ko e hā ē?', 'What is that? (pointing)', 'pointing'],
  [79, 'Tuku hē.', 'Put it there. (where I am pointing)', 'pointing'],
  [87, 'Ko ia pē.', 'That is all.', 'mentioned'],
]

describe('Lesson 39 pointing scene source bank', () => {
  it('contains only the five approved source lines with their exact glosses', () => {
    expect(POINTING_ITEMS.map(({ sourceLine, tongan, english, answer }) => [sourceLine, tongan, english, answer]))
      .toEqual(EXACT_SOURCE)
  })

  it('matches every complete pair in the released Chapter 39 copy', () => {
    const chapter = readFileSync(new URL('../../book/Chapter-39.md', import.meta.url), 'utf8')
    for (const [, tongan, english] of EXACT_SOURCE) {
      expect(chapter).toContain(`*${tongan}* ${english}`)
    }
    expect(POINTING_ITEMS.map((item) => item.sourceLine)).not.toContain(67)
  })

  it('mounts once after the complete pointing-word H3 section', () => {
    const anchors = drillMap['39'].filter((entry) => entry.drillId === 'pointing-scene')
    expect(anchors).toEqual([{ drillId: 'pointing-scene', after: 'all-the-pointing-words-in-one-place' }])
    expect(anchors[0].after).not.toBe('mentioned-ia')
  })
})

describe('Lesson 39 pointing scene retry state', () => {
  it('keeps the first wrong choice open, then reveals after a distinct second wrong choice', () => {
    const initial = createPointingSceneState()
    const retry = reducePointingScene(initial, { type: 'choose', cueId: 'listener' })
    expect(retry).toMatchObject({ status: 'retry', wrongChoices: ['listener'], resolution: null })

    const duplicate = reducePointingScene(retry, { type: 'choose', cueId: 'listener' })
    expect(duplicate).toBe(retry)

    const revealed = reducePointingScene(retry, { type: 'choose', cueId: 'pointing' })
    expect(revealed).toMatchObject({ status: 'resolved', resolution: 'revealed', wrongChoices: ['listener', 'pointing'] })
  })

  it('resolves a correct cue immediately and cannot advance twice from one card', () => {
    const correct = reducePointingScene(createPointingSceneState(), { type: 'choose', cueId: 'speaker' })
    expect(correct).toMatchObject({ status: 'resolved', resolution: 'correct', selected: 'speaker' })

    const next = reducePointingScene(correct, { type: 'next' })
    const duplicateNext = reducePointingScene(next, { type: 'next' })
    expect(next).toMatchObject({ index: 1, status: 'asking' })
    expect(duplicateNext).toBe(next)
  })

  it('finishes after the fifth resolved item and reset restores the first item', () => {
    let state = createPointingSceneState()
    for (const item of POINTING_ITEMS) {
      state = reducePointingScene(state, { type: 'choose', cueId: item.answer })
      state = reducePointingScene(state, { type: 'next' })
    }
    expect(state).toMatchObject({ index: 4, finished: true })
    expect(reducePointingScene(state, { type: 'reset' })).toEqual(createPointingSceneState())
  })
})
