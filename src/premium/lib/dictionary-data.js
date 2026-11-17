// The dictionary's data as the React pages use it: the same index the node
// scripts build through scripts/lib/dictionary-data.mjs, from the same files.
// Imported only by the lazy dictionary pages, so the word data stays out of
// the first bundle.

import vocabulary from '@app/data/book-vocabulary.json'
import chapters from '@app/data/chapters.json'
import wordListData from '../data/word-lists.json'
import exampleData from '../data/dictionary-examples.json'
import { buildDictionary } from './course-dictionary.js'
import { buildDictionaryIndex } from './dictionary-pages.js'
import { buildWordListSearchEntries } from './word-lists.js'

export const DICTIONARY = buildDictionaryIndex({ vocabulary, wordLists: wordListData, chapters, examples: exampleData.examples })

// The course's own 649 words: what the letters browse and the full list show.
export const COURSE_ENTRIES = buildDictionary(vocabulary)
// Word-list words (DECISIONS.md 2026-09-29) join the search only, after the
// course words and with their own label.
export const SEARCH_ENTRIES = [...COURSE_ENTRIES, ...buildWordListSearchEntries(wordListData)]
