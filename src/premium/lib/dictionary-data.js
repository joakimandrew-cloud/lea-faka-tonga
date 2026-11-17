// The dictionary's data as the React pages use it: the same index the node
// scripts build through scripts/lib/dictionary-data.mjs, from the same files.
// Imported only by the lazy dictionary pages, so the word data stays out of
// the first bundle.

import vocabulary from '@app/data/book-vocabulary.json'
import chapters from '@app/data/chapters.json'
import wordListData from '../data/word-lists.json'
import courseWordData from '../data/dictionary-course-words.json'
import additionData from '../data/dictionary-additions.json'
import englishKeyData from '../data/dictionary-english-keys.json'
import exampleData from '../data/dictionary-examples.json'
import { buildDictionary } from './course-dictionary.js'
import { buildAdditionSearchEntries, withEnglishKeys } from './dictionary-additions.js'
import { buildCourseWordSearchEntries } from './dictionary-course-words.js'
import { buildDictionaryIndex } from './dictionary-pages.js'
import { buildWordListSearchEntries } from './word-lists.js'

export const DICTIONARY = buildDictionaryIndex({ vocabulary, wordLists: wordListData, courseWords: courseWordData, additions: additionData, englishKeys: englishKeyData, chapters, examples: exampleData.examples })

// The course's own 649 words.
export const COURSE_ENTRIES = buildDictionary(vocabulary)
// Course words (plan 2026-11-18-dictionary-course-words): words the lessons
// use that the course word list leaves out. They show as course words show,
// each with its lesson. This file is the only reader of their data.
export const COURSE_WORD_ENTRIES = buildCourseWordSearchEntries(courseWordData)
// Added words (DECISIONS.md 2026-11-18): words people search for that the
// lessons do not teach, each with its own label.
export const ADDED_ENTRIES = buildAdditionSearchEntries(additionData)
// What the letters browse and the full list show: the course words, the
// course words the list leaves out and the added words, in one dictionary order.
export const BROWSE_ENTRIES = [...COURSE_ENTRIES, ...COURSE_WORD_ENTRIES, ...ADDED_ENTRIES]
  .sort((a, b) => a.tonganKey.localeCompare(b.tonganKey) || String(a.id).localeCompare(String(b.id)))
// The search reads the course words (with the course words the list leaves
// out), then the word-list words (DECISIONS.md
// 2026-09-29: search only, with their own label), then the added words. The
// English search words (DECISIONS.md 2026-11-18) are attached to the rows they
// name; they change what search finds, never what a row displays.
export const SEARCH_ENTRIES = withEnglishKeys([...COURSE_ENTRIES, ...COURSE_WORD_ENTRIES, ...buildWordListSearchEntries(wordListData), ...ADDED_ENTRIES], englishKeyData)
