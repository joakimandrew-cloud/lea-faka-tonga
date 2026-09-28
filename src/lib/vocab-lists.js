// Shared meaning groups and themed word lists for the flip cards.
//
// This file pulls in nothing from elsewhere, on purpose: other sites copy it
// byte for byte. Each site passes in its own vocabulary rows and its own okinafy
// function. The module only selects and orders rows. It never edits or
// invents any Tongan or English.

const NUMBER_VALUES = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  'one hundred': 100,
  'one thousand': 1000,
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const MONTH_ORDER = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const TIME_NOUNS = ['day', 'week', 'month', 'year']
const COLOUR_ADJECTIVES = ['blue', 'black', 'yellow', 'white', 'red', 'green']

function byChapterThenId(a, b) {
  if (a.chapter !== b.chapter) return a.chapter - b.chapter
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

// Order rows by the position of their English gloss in an explicit list.
// A row the list cannot place throws; it never goes silently last.
function orderByGloss(rows, order, what) {
  const placed = rows.map((row) => {
    const at = order.indexOf(row.english)
    if (at === -1) {
      throw new Error(`vocab-lists: cannot place ${what} row ${row.id} "${row.english}"`)
    }
    return { row, at }
  })
  placed.sort((a, b) => a.at - b.at)
  return placed.map((p) => p.row)
}

function orderNumbers(rows) {
  const placed = rows.map((row) => {
    const value = NUMBER_VALUES[row.english]
    if (value === undefined) {
      throw new Error(`vocab-lists: cannot place number row ${row.id} "${row.english}"`)
    }
    return { row, value }
  })
  placed.sort((a, b) => a.value - b.value)
  return placed.map((p) => p.row)
}

export function buildVocabLists(vocabulary, okinafy) {
  // 1. Meaning groups: same Tongan word (macrons and acute accents kept).
  const grouped = new Map()
  for (const row of vocabulary) {
    if (typeof row.english === 'string' && row.english.includes('(accent example)')) continue
    const key = okinafy(row.tongan).toLowerCase().trim()
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(row)
  }
  const meaningGroups = new Map()
  for (const [key, rows] of grouped) {
    if (rows.length >= 2) meaningGroups.set(key, rows)
  }

  const groupOfId = new Map()
  for (const rows of meaningGroups.values()) {
    for (const row of rows) groupOfId.set(row.id, rows)
  }

  function otherMeanings(row) {
    const rows = groupOfId.get(row.id)
    if (!rows) return []
    return rows.filter((other) => other.id !== row.id)
  }

  // 2. Themed lists, each in its natural order.
  const pos = (row) => row.part_of_speech || ''

  const numbers = orderNumbers(vocabulary.filter((r) => pos(r) === 'number'))
  const days = orderByGloss(vocabulary.filter((r) => pos(r) === 'day name'), DAY_ORDER, 'day')
  const months = orderByGloss(vocabulary.filter((r) => pos(r) === 'month name'), MONTH_ORDER, 'month')
  const time = vocabulary
    .filter(
      (r) =>
        pos(r) === 'time word' ||
        pos(r) === 'time phrase' ||
        TIME_NOUNS.includes(r.english),
    )
    .sort(byChapterThenId)
  const colours = vocabulary
    .filter(
      (r) =>
        pos(r).includes('color') ||
        (r.category === 'adjectives' && COLOUR_ADJECTIVES.includes(r.english)),
    )
    .sort(byChapterThenId)
  const greetings = vocabulary
    .filter((r) => ['greeting phrase', 'farewell phrase', 'polite word'].includes(pos(r)))
    .sort(byChapterThenId)
  const questions = vocabulary.filter((r) => pos(r) === 'question word').sort(byChapterThenId)

  const lists = [
    { id: 'numbers', label: 'Numbers', ids: numbers.map((r) => r.id) },
    { id: 'days', label: 'Days of the week', ids: days.map((r) => r.id) },
    { id: 'months', label: 'Months', ids: months.map((r) => r.id) },
    { id: 'time', label: 'Time words', ids: time.map((r) => r.id) },
    { id: 'colours', label: 'Colours', ids: colours.map((r) => r.id) },
    { id: 'greetings', label: 'Greetings and courtesy', ids: greetings.map((r) => r.id) },
    { id: 'questions', label: 'Question words', ids: questions.map((r) => r.id) },
  ]

  // 3. Union of chosen lists: chosen order, each list in its own order, no repeats.
  const rowById = new Map(vocabulary.map((r) => [r.id, r]))
  function deckForLists(listIds) {
    const seen = new Set()
    const deck = []
    for (const listId of listIds) {
      const list = lists.find((l) => l.id === listId)
      if (!list) continue
      for (const id of list.ids) {
        if (seen.has(id)) continue
        seen.add(id)
        deck.push(rowById.get(id))
      }
    }
    return deck
  }

  return { meaningGroups, otherMeanings, lists, deckForLists }
}
