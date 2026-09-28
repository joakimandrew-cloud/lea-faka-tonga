// The course dictionary (scope v2, section 7): the course word list,
// src/data/book-vocabulary.json, searchable in Tongan and English.
//
// Read-only. Nothing here rewrites an entry: the Tongan, the gloss and the part
// of speech are shown as the data has them, with the Tongan passed through the
// site's okinafy display rule at render time. Folding exists only to build a
// search key; it never changes what is displayed. No other dictionary source is
// read.

// Every character the data or a keyboard may use for the glottal stop.
const GLOTTAL_VARIANTS = /['‘’ʼ`ʻ]/g
// Combining acute accent (U+0301) and combining macron (U+0304), after NFD.
const ACUTE_AND_MACRON = /[\u0301\u0304]/g

export const FIRST_LESSON = 1
export const LAST_LESSON = 52
// Browse groups pair each vowel with its fakauʻa-prefixed forms (Andrew's choice).
// These are navigation groups, not a redefinition of the Tongan alphabet.
export const DICTIONARY_GROUPS = ['a', 'ʻa', 'e', 'ʻe', 'f', 'h', 'i', 'ʻi', 'k', 'l', 'm', 'n', 'ng', 'o', 'ʻo', 'p', 's', 't', 'u', 'ʻu', 'v']

// Search key only: lowercase, fold every apostrophe or fakauʻa variant to one
// character, strip macrons and acute accents.
export function foldSearchKey(text) {
  return String(text == null ? '' : text)
    .normalize('NFD')
    .replace(ACUTE_AND_MACRON, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(GLOTTAL_VARIANTS, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function dictionaryBrowseKey(text) {
  // Ignore the notation for a bound form (e.g. -ʻaki), not its first letter.
  const key = foldSearchKey(text).replace(/^-+/, '')
  if (key.startsWith("'")) return `ʻ${key[1] || ''}`
  return key.startsWith('ng') ? 'ng' : key[0] || ''
}

export function browseDictionary(entries, letter) {
  if (!letter) return entries
  const initial = dictionaryBrowseKey(letter)
  return entries.filter(entry => dictionaryBrowseKey(entry.tongan) === initial)
}

// The lesson a word belongs to, or null for the chapter-0 supplemental words.
// Never 0, so no result ever links to /lessons/0.
export function entryLesson(row) {
  const n = Number(row?.chapter)
  return Number.isInteger(n) && n >= FIRST_LESSON && n <= LAST_LESSON ? n : null
}

export function buildDictionary(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row && typeof row.tongan === 'string' && row.tongan.trim())
    .map((row) => {
      const lesson = entryLesson(row)
      return {
        id: row.id,
        tongan: row.tongan,
        english: row.english || '',
        partOfSpeech: row.part_of_speech || '',
        lesson,
        label: lesson ? `Lesson ${lesson}` : 'Supplemental',
        href: lesson ? `/lessons/${lesson}` : null,
        tonganKey: foldSearchKey(row.tongan),
        englishKey: foldSearchKey(row.english),
      }
    })
    .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || String(a.id).localeCompare(String(b.id)))
}

// How well an entry matches: lower is better, null is no match.
function rank(entry, q) {
  if (entry.tonganKey === q) return 0
  if (entry.englishKey === q) return 1
  if (entry.tonganKey.startsWith(q)) return 2
  if (entry.englishKey.startsWith(q) || entry.englishKey.split(/[^a-z0-9']+/).includes(q)) return 3
  if (entry.tonganKey.includes(q)) return 4
  if (entry.englishKey.includes(q)) return 5
  return null
}

export function searchDictionary(entries, query) {
  const q = foldSearchKey(query)
  if (!q) return entries
  const scored = []
  entries.forEach((entry, index) => {
    const r = rank(entry, q)
    if (r !== null) scored.push({ entry, r, index })
  })
  scored.sort((a, b) => a.r - b.r || a.index - b.index)
  return scored.map((item) => item.entry)
}
