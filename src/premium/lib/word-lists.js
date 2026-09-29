// Word lists (DECISIONS.md 2026-09-29, "Word lists: everyday words beyond the
// lessons"): themed lists of everyday words the lessons do not teach, drawn from
// Shumway's Word Lists and checked against Churchward. They live in their own
// data file, src/premium/data/word-lists.json, never in book-vocabulary.json.
//
// Read-only, like course-dictionary.js. Rows that are course words carry a
// course_id and are shown with the course's own spelling, gloss and lesson; the
// dictionary search adds only the rows that are NOT course words, so no course
// entry is duplicated or changed. Every row's evidence (Shumway page, Churchward
// headword) is in reviews/dictionary-word-lists-2026-09-29/word-lists-evidence.tsv
// under the same id.

import { entryLesson, foldSearchKey } from './course-dictionary.js'

export const WORD_LISTS_PATH = '/word-lists'

export function themeHref(themeId) {
  return `${WORD_LISTS_PATH}#${themeId}`
}

export function wordListSearchLabel(themeLabel) {
  return `Word list: ${themeLabel}, not taught in the lessons`
}

function courseRowsById(vocabulary) {
  return new Map((Array.isArray(vocabulary) ? vocabulary : []).map(row => [row.id, row]))
}

function lessonLink(row) {
  const lesson = entryLesson(row)
  return lesson ? { lesson, label: `Lesson ${lesson}`, href: `/lessons/${lesson}` } : { lesson: null, label: 'Supplemental', href: null }
}

// The /word-lists page: one group per theme, each row either a course word
// (with its lesson) or a word-list word (with its register label, if any).
export function buildWordLists(data, vocabulary) {
  const course = courseRowsById(vocabulary)
  const entries = Array.isArray(data?.entries) ? data.entries : []
  return (Array.isArray(data?.themes) ? data.themes : []).map(theme => {
    const rows = entries
      .filter(row => row.theme === theme.id)
      .map(row => {
        const courseRow = row.course_id ? course.get(row.course_id) : null
        const otherSense = row.other_sense_course_id ? course.get(row.other_sense_course_id) : null
        return {
          id: row.id,
          tongan: courseRow ? courseRow.tongan : row.tongan,
          english: courseRow ? courseRow.english : row.english,
          register: row.register || '',
          taught: courseRow ? lessonLink(courseRow) : null,
          otherSense: otherSense ? { english: otherSense.english, ...lessonLink(otherSense) } : null,
          tonganKey: foldSearchKey(courseRow ? courseRow.tongan : row.tongan),
        }
      })
      .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || a.id.localeCompare(b.id))
    return { id: theme.id, label: theme.label, href: themeHref(theme.id), rows }
  })
}

// Extra dictionary-search rows, in the same shape buildDictionary() returns,
// for word-list words that are not course words. Course words are already in
// the dictionary and are left exactly as they are.
export function buildWordListSearchEntries(data) {
  const labels = new Map((Array.isArray(data?.themes) ? data.themes : []).map(theme => [theme.id, theme.label]))
  return (Array.isArray(data?.entries) ? data.entries : [])
    .filter(row => !row.course_id && labels.has(row.theme) && typeof row.tongan === 'string' && row.tongan.trim())
    .map(row => ({
      id: row.id,
      tongan: row.tongan,
      english: row.register ? `${row.english} (${row.register})` : row.english,
      partOfSpeech: row.part_of_speech || '',
      lesson: null,
      label: wordListSearchLabel(labels.get(row.theme)),
      href: themeHref(row.theme),
      wordList: true,
      tonganKey: foldSearchKey(row.tongan),
      englishKey: foldSearchKey(row.english),
    }))
    .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || String(a.id).localeCompare(String(b.id)))
}
