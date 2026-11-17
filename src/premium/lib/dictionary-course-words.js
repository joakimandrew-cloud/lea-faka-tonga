// Course words (plan 2026-11-18-dictionary-course-words; DECISIONS.md
// 2026-11-18, point 3): words the lessons use that the course word list,
// src/data/book-vocabulary.json, leaves out.
//
//   src/premium/data/dictionary-course-words.json   {note, entries: [{id,
//     tongan, english, part_of_speech, lesson}]}. Only what a page shows. A
//     course word is never a row of book-vocabulary.json, which the flash
//     cards, the games and the translate pack read; this file is read by the
//     dictionary and by nothing else.
//
// Why each word is there (the sources) is kept out of what the browser loads,
// in scripts/dictionary-evidence.json under "courseWords", which only node
// scripts and tests read.
//
// A course word shows as a course word shows: its lesson, its link, the
// printed sentences of that lesson. The one difference is the line on its
// page that says where it stands, which reads COURSE_WORD_LABEL where a course
// row reads "Taught in", because the lesson uses the word and does not teach
// it in its Words to Learn list.
//
// Pure, like dictionary-additions.js: no React and no data imports.

import { entryLesson, foldSearchKey } from './course-dictionary.js'
import { wordPagePath, wordSlug } from './dictionary-text.js'

// The label of the line that names the lesson, on a course word's page. Site copy.
export const COURSE_WORD_LABEL = 'Used in'

// The rows of the data file that the dictionary can show: a word, and a lesson
// of the course (1 to 52), so that no page ever links to /lessons/0.
export function courseWordRows(data) {
  return (Array.isArray(data?.entries) ? data.entries : [])
    .filter(row => row && typeof row.tongan === 'string' && row.tongan.trim() && Number.isInteger(row.lesson) && entryLesson({ chapter: row.lesson }) !== null)
}

// Dictionary-search rows for the course words, in the shape buildDictionary()
// returns for a course row (label "Lesson N", the lesson link), plus
// `courseWord: true`.
export function buildCourseWordSearchEntries(data) {
  return courseWordRows(data)
    .map(row => {
      const lesson = entryLesson({ chapter: row.lesson })
      return {
        id: row.id,
        tongan: row.tongan,
        english: row.english || '',
        partOfSpeech: row.part_of_speech || '',
        lesson,
        label: `Lesson ${lesson}`,
        href: `/lessons/${lesson}`,
        wordHref: wordPagePath(wordSlug(row.tongan)),
        courseWord: true,
        tonganKey: foldSearchKey(row.tongan),
        englishKey: foldSearchKey(row.english),
      }
    })
    .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || String(a.id).localeCompare(String(b.id)))
}
