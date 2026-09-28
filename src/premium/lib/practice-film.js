import { ALL_EXAMPLES } from '../data/tense-swap.js'

// Presentation selection and timing only. Wording/answers come from the real drill.
export const FILM_DURATION = 3000
export const PRACTICE_ORDER = ['past', 'present', 'perfect', 'future']
export const DRILL_PREVIEW_CARDS = [
  { e: ALL_EXAMPLES.find(example => example.id === 'he-eats'), t: 'future' },
  { e: ALL_EXAMPLES.find(example => example.id === 'they-sleep'), t: 'past' },
]
export function practiceDuration(kind) {
  return FILM_DURATION * (kind === 'drills' ? DRILL_PREVIEW_CARDS.length : 1)
}
export function practiceFrame(kind, elapsed) {
  const duration = practiceDuration(kind)
  const time = Math.max(0, Math.min(duration, elapsed))
  if (kind === 'drills') {
    const exampleIndex = Math.min(Math.floor(time / FILM_DURATION), DRILL_PREVIEW_CARDS.length - 1)
    const exampleTime = time - exampleIndex * FILM_DURATION
    return { exampleIndex, selected: exampleTime >= 350, feedback: exampleTime >= 700, finished: time === duration }
  }
  if (kind === 'cards') return { flipped: time >= 350 && time < 1750, known: time >= 1350, advanced: time >= 1750, finished: time === FILM_DURATION }
  return { selected: time >= 350, feedback: time >= 700, finished: time === FILM_DURATION }
}
export function practiceTabIndex(current, key, count = 3) {
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key === 'ArrowRight') return (current + 1) % count
  if (key === 'ArrowLeft') return (current + count - 1) % count
  return current
}

export function shouldAdvancePreview({ finished, autoCycle, playing, visible, pageVisible, reduceMotion }) {
  return finished && autoCycle && playing && visible && pageVisible && !reduceMotion
}
