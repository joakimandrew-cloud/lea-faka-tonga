// Course words (plan 2026-11-18-dictionary-course-words; DECISIONS.md
// 2026-11-18, point 3): words the lessons use that the course word list,
// src/data/book-vocabulary.json, leaves out.
//
//   src/premium/data/dictionary-course-words.json   {note, entries: [{id,
//     tongan, english, part_of_speech, lesson, found_in?}]}. Only what a page
//     shows. found_in ("workbook" or "quiz") marks a word that no lesson page
//     prints and that the lesson's workbook or quiz does; see below. A
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
// A word with found_in is shown as a course word is, with these differences, so
// that no page says a lesson prints it: the line that names the lesson ends with
// the plain words " (in the workbook)" or " (in the quiz)", the meta description
// says "Used in the workbook for Lesson N: Title.", it takes no printed
// sentences, and it is left out of the "same lesson" groups. An entry without
// found_in is a lesson word and behaves as before.
//
// Pure, like dictionary-additions.js: no React and no data imports.

import { entryLesson, foldSearchKey } from './course-dictionary.js'
import { wordPagePath, wordSlug } from './dictionary-text.js'

// The label of the line that names the lesson, on a course word's page. Site copy.
export const COURSE_WORD_LABEL = 'Used in'

// Where a word with no lesson page is found: the only two values found_in may take.
export const COURSE_WORD_FOUND_IN = ['workbook', 'quiz']

// The words that follow the lesson link on a word's page: ' (in the workbook)',
// or '' for a lesson word.
export function courseWordFoundInNote(foundIn) {
  return COURSE_WORD_FOUND_IN.includes(foundIn) ? ` (in the ${foundIn})` : ''
}

// The rows of the data file that the dictionary can show: a word, and a lesson
// of the course (1 to 52), so that no page ever links to /lessons/0. found_in is
// kept only when it is "workbook" or "quiz"; any other value is dropped.
export function courseWordRows(data) {
  return (Array.isArray(data?.entries) ? data.entries : [])
    .filter(row => row && typeof row.tongan === 'string' && row.tongan.trim() && Number.isInteger(row.lesson) && entryLesson({ chapter: row.lesson }) !== null)
    .map(row => {
      const { found_in: foundIn, ...rest } = row
      return COURSE_WORD_FOUND_IN.includes(foundIn) ? { ...rest, found_in: foundIn } : rest
    })
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
        foundIn: row.found_in || null,
        tonganKey: foldSearchKey(row.tongan),
        englishKey: foldSearchKey(row.english),
      }
    })
    .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || String(a.id).localeCompare(String(b.id)))
}
