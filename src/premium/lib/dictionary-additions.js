// Added words and English search words (DECISIONS.md 2026-11-18, "The
// dictionary grows by searched words on two sources").
//
//   src/premium/data/dictionary-additions.json     words beyond the lessons that
//     people search for, each attested by at least two sources, with a meaning
//     in our own words. Never in book-vocabulary.json.
//   src/premium/data/dictionary-english-keys.json  English words people search
//     for, tied to rows the dictionary already has. The row's displayed meaning
//     never changes; the word only helps search find the row and gives the
//     word its own "How to say ... in Tongan" page.
//
// Pure, like word-lists.js: no React and no data imports.

import { foldSearchKey } from './course-dictionary.js'
import { wordPagePath, wordSlug } from './dictionary-text.js'

// The label an added word carries on its page and in results. Site copy.
export const ADDED_WORD_LABEL = 'Added word, not taught in the lessons'

export function additionRows(data) {
  return (Array.isArray(data?.entries) ? data.entries : []).filter(row => row && typeof row.tongan === 'string' && row.tongan.trim())
}

// Dictionary-search rows for the added words, in the shape buildDictionary()
// returns. No lesson and no link: the label says where the word stands.
export function buildAdditionSearchEntries(data) {
  return additionRows(data)
    .map(row => ({
      id: row.id,
      tongan: row.tongan,
      english: row.english || '',
      partOfSpeech: row.part_of_speech || '',
      lesson: null,
      label: ADDED_WORD_LABEL,
      href: null,
      wordHref: wordPagePath(wordSlug(row.tongan)),
      added: true,
      tonganKey: foldSearchKey(row.tongan),
      englishKey: foldSearchKey(row.english),
    }))
    .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || String(a.id).localeCompare(String(b.id)))
}

// The English search words as a flat list: [{ english, rowId, support }].
export function englishKeyList(data) {
  const list = []
  for (const key of Array.isArray(data?.keys) ? data.keys : []) {
    const english = String(key?.english || '').replace(/\s+/g, ' ').trim()
    if (!english) continue
    for (const row of Array.isArray(key.rows) ? key.rows : []) {
      if (row?.id) list.push({ english, rowId: row.id, support: row.support || {} })
    }
  }
  return list
}

// Search rows with their English search words attached as `searchWords`. A row
// with none is returned as it is; a row with some is copied, so the list the
// caller passed in is not changed. What a row displays is untouched.
export function withEnglishKeys(entries, data) {
  const words = new Map()
  for (const { english, rowId } of englishKeyList(data)) words.set(rowId, [...(words.get(rowId) || []), english.toLowerCase()])
  if (!words.size) return entries
  return entries.map(entry => words.has(entry.id) ? { ...entry, searchWords: words.get(entry.id) } : entry)
}
