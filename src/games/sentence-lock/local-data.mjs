/**
 * Sentence Lock: the two small data files the builder reads besides the bank
 * and the vocabulary (judge's Lesson 1 findings 5, 6 and 8).
 *
 *   node src/games/sentence-lock/local-data.mjs
 *
 *   possessives.json   the book's possessive tables, Lesson 17 lines 37 to 80
 *                      (read from ROOT/book/Chapter-17.md), one row per word with
 *                      its class (e-class or ho-class), person, number and inclusiveness
 *   equivalents.json   pairs of words that can both be right for one English prompt,
 *                      copied by vocabulary id from book-vocabulary.json (never retyped)
 *
 * Every Tongan string in both files is copied from the book or the vocabulary.
 * Only English patterns and vocabulary ids are typed here.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../../..')
const ROOT = process.env.LFT_ROOT || '/Users/andrewjoakim/Desktop/Lea-Faka-Tonga'
const FIRST = 37
const LAST = 80

/** The person, number and inclusiveness of a possessive from its English gloss in the table. */
export function readGloss(gloss) {
  const g = String(gloss).toLowerCase()
  if (/^my$/.test(g)) return { person: 1, number: 'singular', inclusive: null }
  if (/^your \(sg/.test(g)) return { person: 2, number: 'singular', inclusive: null }
  if (/^his, her/.test(g)) return { person: 3, number: 'singular', inclusive: null }
  if (/^our \(incl/.test(g)) return { person: 1, number: 'plural', inclusive: true }
  if (/^our \(excl/.test(g)) return { person: 1, number: 'plural', inclusive: false }
  if (/^your \(pl/.test(g)) return { person: 2, number: 'plural', inclusive: null }
  if (/^their$/.test(g)) return { person: 3, number: 'plural', inclusive: null }
  return null
}

export function extractPossessives(markdown) {
  const lines = markdown.split('\n')
  const rows = []
  let cls = null
  for (let n = FIRST; n <= LAST; n++) {
    const line = lines[n - 1] ?? ''
    const h = line.match(/^#{2,4}\s+(.*?)-class/i)
    if (h) { cls = /^'?e$/i.test(h[1].replace(/[ʻ‘’ʼ]/g, "'")) ? 'e' : 'ho'; continue }
    const m = line.match(/^\|\s*\*([^*|]+)\*\s*\|\s*([^|]+?)\s*\|/)
    if (!m || !cls) continue
    const f = readGloss(m[2])
    if (!f) continue
    rows.push({ word: m[1].trim(), meaning: m[2].trim(), class: cls, ...f, source: `Lesson 17 line ${n}` })
  }
  return rows
}

/** [id, id, why]: the words are looked up in book-vocabulary.json by id. */
export const EQUIVALENT_PAIRS = [
  { ids: ['book-v0386', 'book-v0068'], why: 'the two words can each say "very" after an adjective (Lesson 3 line 83: "He is very angry")' },
  { ids: ['book-v0386', 'book-v0079'], why: 'the two words can each say "hard" after a verb (Lesson 3 line 72; Lesson 23 lines 171 and 212: "study hard")' },
]
export const A_SOME = ['book-v0156', 'book-v0110']

function main() {
  const book = fs.readFileSync(path.join(ROOT, 'book/Chapter-17.md'), 'utf8')
  const rows = extractPossessives(book)
  fs.writeFileSync(path.join(here, 'possessives.json'), JSON.stringify({
    _note: "The book's possessive tables (Lesson 17 lines 37 to 80), read by local-data.mjs. person/number/inclusive come from the English gloss in the table.",
    rows,
  }, null, 2) + '\n', 'utf8')
  const vocab = JSON.parse(fs.readFileSync(path.join(app, 'src/data/book-vocabulary.json'), 'utf8'))
  const byId = new Map(vocab.map(v => [v.id, v]))
  const pick = id => { const v = byId.get(id); if (!v) throw new Error(`no vocabulary row ${id}`); return { word: v.tongan, source: id } }
  fs.writeFileSync(path.join(here, 'equivalents.json'), JSON.stringify({
    _note: 'Pairs that are not wrong for each other on one dial (judge findings 5 and 6). Words are copied from book-vocabulary.json by id. Local to Sentence Lock; the shared confusable-pairs.json is untouched.',
    sameMeaning: EQUIVALENT_PAIRS.map(p => ({ a: pick(p.ids[0]), b: pick(p.ids[1]), why: p.why })),
    aSome: { a: pick(A_SOME[0]), b: pick(A_SOME[1]), why: 'the two articles both translate English "a" and "some" when the noun has no final accent (Lesson 18 lines 14 and 16; Lesson 8 line 13)' },
  }, null, 2) + '\n', 'utf8')
  console.log(`possessives.json: ${rows.length} rows; equivalents.json written`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
