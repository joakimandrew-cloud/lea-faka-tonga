// Writes the dictionary's two generated files (plan 2026-11-18-dictionary-
// search-and-word-pages):
//   src/premium/data/dictionary-examples.json  printed lesson pairs per row
//   src/premium/data/dictionary-english.tsv    the English headwords, for review
//
// Run it after any change to book/Chapter-NN.md, src/data/book-vocabulary.json,
// src/premium/data/word-lists.json, dictionary-course-words.json,
// dictionary-additions.json or dictionary-english-keys.json: `npm run build:dictionary-data`.
// `npm run test:premium` fails while either file is stale. `--check` writes
// nothing and exits 1 when a file would change.

import fs from 'node:fs'
import path from 'node:path'
import { buildDictionaryIndex } from '../src/premium/lib/dictionary-pages.js'
import { APP_ROOT, ENGLISH_TSV_FILE, EXAMPLES_FILE, drawExamples, englishTsvText, examplesFileText, readDictionarySources } from './lib/dictionary-data.mjs'

const check = process.argv.includes('--check')
const examples = drawExamples()
const index = buildDictionaryIndex({ ...readDictionarySources(), examples })
const outputs = [
  [EXAMPLES_FILE, examplesFileText(examples)],
  [ENGLISH_TSV_FILE, englishTsvText(index)],
]

let stale = 0
for (const [file, text] of outputs) {
  const target = path.join(APP_ROOT, file)
  const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null
  if (current === text) continue
  stale += 1
  if (!check) fs.writeFileSync(target, text, 'utf8')
}

const withExamples = index.entries.filter(entry => entry.examples.length).length
const dropReasons = {}
for (const item of index.englishDropped) dropReasons[item.reason] = (dropReasons[item.reason] || 0) + 1
console.log(JSON.stringify({
  mode: check ? 'check' : 'write',
  changedFiles: stale,
  rows: index.rowPage.size,
  courseWords: index.entries.filter(entry => entry.kind === 'course-word').length,
  addedWords: index.entries.filter(entry => entry.kind === 'added').length,
  englishSearchWords: index.english.filter(page => page.sources.some(source => source.origin === 'search word')).map(page => page.headword),
  wordPages: index.pages.length,
  pagesWithSeveralRows: index.pages.filter(page => page.entries.length > 1).length,
  englishPages: index.english.length,
  rowsWithExamples: withExamples,
  rowsWithoutExamples: index.entries.length - withExamples,
  examplePairs: index.entries.reduce((sum, entry) => sum + entry.examples.length, 0),
  englishSensesDropped: dropReasons,
}, null, 2))
if (check && stale) process.exit(1)
