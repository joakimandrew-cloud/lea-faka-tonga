// Node-side loader for the dictionary's pages (plan 2026-11-18-dictionary-
// search-and-word-pages). The React pages get the same data through
// src/premium/lib/dictionary-data.js; both call buildDictionaryIndex() in
// src/premium/lib/dictionary-pages.js, so a script and the site never disagree.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { okinafy } from '../../src/lib/okinafy.js'
import { buildDictionaryIndex } from '../../src/premium/lib/dictionary-pages.js'
import { selectExamples } from '../../src/premium/lib/dictionary-examples.js'
import { courseWordRows } from '../../src/premium/lib/dictionary-course-words.js'
import { entryLesson, FIRST_LESSON, LAST_LESSON } from '../../src/premium/lib/course-dictionary.js'

// DICTIONARY_APP_ROOT points the data, the book copy and dist/ at another folder
// with the same layout (used to prove check:dictionary fails on broken data).
export const APP_ROOT = process.env.DICTIONARY_APP_ROOT
  ? path.resolve(process.env.DICTIONARY_APP_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const EXAMPLES_FILE = 'src/premium/data/dictionary-examples.json'
export const ENGLISH_TSV_FILE = 'src/premium/data/dictionary-english.tsv'
export const ADDITIONS_FILE = 'src/premium/data/dictionary-additions.json'
// Words the lessons use that the course word list leaves out (plan
// 2026-11-18-dictionary-course-words). Read by the dictionary only.
export const COURSE_WORDS_FILE = 'src/premium/data/dictionary-course-words.json'
export const ENGLISH_KEYS_FILE = 'src/premium/data/dictionary-english-keys.json'
// Why each added word, each course word and each English search word is in the
// dictionary: the sources and the support. Read by scripts and tests only; the app never
// imports it, so none of it is in what a browser loads.
export const EVIDENCE_FILE = 'scripts/dictionary-evidence.json'

const readJson = (root, file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))

export function chapterFile(number) {
  return `book/Chapter-${String(number).padStart(2, '0')}.md`
}

export function readDictionarySources(root = APP_ROOT) {
  return {
    vocabulary: readJson(root, 'src/data/book-vocabulary.json'),
    wordLists: readJson(root, 'src/premium/data/word-lists.json'),
    courseWords: readJson(root, COURSE_WORDS_FILE),
    // Added words and English search words (DECISIONS.md 2026-11-18).
    additions: readJson(root, ADDITIONS_FILE),
    englishKeys: readJson(root, ENGLISH_KEYS_FILE),
    chapters: readJson(root, 'src/data/chapters.json'),
  }
}

export function readDictionaryEvidence(root = APP_ROOT) {
  return readJson(root, EVIDENCE_FILE)
}

// Every string of the evidence file that names a source or a place in one, or
// explains the file: the note, each citation of an added word or a course word, and the source
// and location of an English search word's support. A support that quotes a
// row's own meaning is the site's own data and is not in this list. None of
// these may be in the built site (check-dictionary-pages.mjs).
export function evidenceStrings(evidence) {
  const strings = []
  if (evidence?.note) strings.push(evidence.note)
  for (const item of evidence?.additions || []) strings.push(...(item.sources || []))
  for (const item of evidence?.courseWords || []) strings.push(...(item.sources || []))
  for (const item of evidence?.englishKeys || []) {
    if (item.support?.source) strings.push(item.support.source)
    if (item.support?.location) strings.push(item.support.location)
  }
  return [...new Set(strings.map(text => String(text).trim()).filter(Boolean))]
}

// A word as it can be looked for in a lesson: marks as the site shows them
// (okinafy), lowercase, the acute stress accent set aside (a lesson prints one
// inside a sentence and the data stores the word without it). A macron stays.
const lessonForm = text => okinafy(String(text)).normalize('NFD').replace(/\u0301/g, '').normalize('NFC').toLowerCase()

// Does the lesson's markdown hold the word, as a whole word? Used by the check
// that every course word stands in the lesson its page links to.
export function lessonHoldsWord(markdown, tongan) {
  const word = lessonForm(tongan).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!word) return false
  return new RegExp(`(?<![\\p{L}\\p{M}ʻ'])${word}(?![\\p{L}\\p{M}ʻ'])`, 'u').test(lessonForm(markdown))
}

export function readLessons(root = APP_ROOT) {
  const lessons = {}
  for (let number = FIRST_LESSON; number <= LAST_LESSON; number += 1) {
    lessons[number] = fs.readFileSync(path.join(root, chapterFile(number)), 'utf8')
  }
  return lessons
}

// The example pairs, drawn fresh from the app's book copy.
export function drawExamples(root = APP_ROOT) {
  const { vocabulary } = readDictionarySources(root)
  const rows = vocabulary.map(row => ({ id: row.id, tongan: row.tongan, english: row.english, lesson: entryLesson(row) }))
  // Word-list rows take no sentence (no lesson teaches them), but a word-list
  // row that shares a page with a course row can still block a sentence.
  // The same holds for an added word. A course word carries its lesson, so it
  // takes sentences exactly as a course row does.
  const { wordLists, additions, courseWords } = readDictionarySources(root)
  for (const row of wordLists.entries) if (!row.course_id) rows.push({ id: row.id, tongan: row.tongan, english: row.english, lesson: null })
  // A word with found_in is printed by no lesson page, so it takes no sentence (lesson null) and can only block one.
  for (const row of courseWordRows(courseWords)) rows.push({ id: row.id, tongan: row.tongan, english: row.english, lesson: row.found_in ? null : entryLesson({ chapter: row.lesson }) })
  for (const row of additions.entries) rows.push({ id: row.id, tongan: row.tongan, english: row.english, lesson: null })
  return selectExamples({ rows, lessons: readLessons(root) })
}

// The index as the site builds it, from the files on disk.
export function loadDictionaryIndex(root = APP_ROOT) {
  const examples = readJson(root, EXAMPLES_FILE).examples
  return buildDictionaryIndex({ ...readDictionarySources(root), examples })
}

export function examplesFileText(examples) {
  return `${JSON.stringify({
    note: 'Generated by scripts/build-dictionary-data.mjs from book/Chapter-NN.md. Each pair is one printed line of the lesson that teaches the row. Do not edit by hand.',
    examples,
  }, null, 1)}\n`
}

// headword, the rows it came from, the sense text of each row, and where the
// headword came from for each row: "meaning" (a sense of the row's own
// meaning; sense_text is that sense) or "search word" (an English search word
// tied to the row in dictionary-english-keys.json; sense_text is then the
// row's meaning in full, which does not hold the word).
export function englishTsvText(index) {
  const lines = ['headword\tslug\trows\tsense_text\torigin']
  for (const page of index.english) {
    lines.push([
      page.headword,
      page.slug,
      page.sources.map(source => source.rowId).join(' | '),
      page.sources.map(source => source.senseText).join(' | '),
      page.sources.map(source => source.origin).join(' | '),
    ].join('\t'))
  }
  return `${lines.join('\n')}\n`
}
