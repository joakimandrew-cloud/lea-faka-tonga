import chapterOne from '@book/Chapter-01.md?raw'

const EXPECTED_ITEMS = {
  'ch1-ex4-1': { prompt: "*Na'a ___ kai.* (I ate.)", options: ['*ke*', '*ku*'], correct: '*ku*', answer: '*ku*' },
  'ch1-ex4-2': { prompt: "*Na'a ___ inu?* (Did you drink?)", options: ['*ke*', '*ku*'], correct: '*ke*', answer: '*ke*' },
  'ch1-ex4-3': { prompt: "*Na'a ___ mohe.* (I slept.)", options: ['*ke*', '*ku*'], correct: '*ku*', answer: '*ku*' },
  'ch1-ex4-4': { prompt: "*Na'a ___ lea?* (Did you speak?)", options: ['*ke*', '*ku*'], correct: '*ke*', answer: '*ke*' },
  'ch1-ex4-5': { prompt: "*Na'a ___ ha'u.* (I came.)", options: ['*ke*', '*ku*'], correct: '*ku*', answer: '*ku*' },
}

const EXPECTED_MAPPING = [
  { tongan: '*ke*', english: 'you (one person)' },
  { tongan: '*ku*', english: 'I' },
]

const itemIdentity = item => JSON.stringify({
  id: item.id,
  prompt: item.prompt,
  options: item.options,
  correct: item.correct,
  answer: item.answer,
})

function tableCells(line) {
  return line.trim().split('|').slice(1, -1).map(cell => cell.trim())
}

export function chapterOnePronounMapping(source = chapterOne) {
  if (typeof source !== 'string') return null
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const sectionStart = lines.findIndex(line => /^####\s+What a Pronoun Is\s*$/.test(line))
  if (sectionStart < 0) return null
  const nextHeading = lines.findIndex((line, index) => index > sectionStart && /^#{1,4}\s+/.test(line))
  const section = lines.slice(sectionStart, nextHeading < 0 ? undefined : nextHeading)
  const header = section.findIndex(line => {
    const cells = tableCells(line)
    return cells.length === 2 && cells[0] === 'Tongan' && cells[1] === 'English'
  })
  if (header < 0 || !/^\|?\s*:?-+/.test(section[header + 1] || '')) return null
  const mapping = section.slice(header + 2, header + 4).map(line => {
    const [tongan, english] = tableCells(line)
    return { tongan, english }
  })
  return JSON.stringify(mapping) === JSON.stringify(EXPECTED_MAPPING) ? mapping : null
}

export function genericMcqHint(item) {
  return item.options.length === 2
    ? 'Not that one. Check the English in brackets, then try the other.'
    : 'Not that one. Try again.'
}

export function sourceFeedbackFor(ex, item, tries, source = chapterOne) {
  if (!Array.isArray(tries) || tries.length === 0) return null
  if (ex.id !== 'ch1-ex4' || ex.type !== 'mcq') return null
  const expected = EXPECTED_ITEMS[item.id]
  if (!expected || itemIdentity(item) !== itemIdentity({ id: item.id, ...expected })) return null
  const sourceItem = ex.items.find(candidate => candidate.id === item.id)
  if (!sourceItem || itemIdentity(sourceItem) !== itemIdentity(item)) return null
  const mapping = chapterOnePronounMapping(source)
  if (!mapping) return null
  const solved = tries.includes(item.correct)
  return {
    kind: solved ? 'correct' : 'retry',
    message: solved ? null : genericMcqHint(item),
    correct: solved ? item.correct : null,
    mapping,
  }
}

export function activeSourceFeedbackFor(activeItemId, ex, item, tries, source = chapterOne) {
  return activeItemId === item.id ? sourceFeedbackFor(ex, item, tries, source) : null
}
