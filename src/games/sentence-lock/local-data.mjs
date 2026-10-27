/**
 * Sentence Lock: the small data files the builder reads besides the bank
 * and the vocabulary (judge's Lesson 1 findings 5, 6 and 8; Lessons 2-52
 * findings, Step 8).
 *
 *   node src/games/sentence-lock/local-data.mjs
 *
 *   possessives.json   the book's possessive tables, one row per word with its class (e-class or
 *                      ho-class), person, number, inclusiveness and `kind`:
 *                        plain            Lesson 17 lines 37 to 80
 *                        indefinite       Lesson 29 lines 102-110 and 130-138
 *                        postposed        Lesson 37 lines 19-42 and 58-83 (long forms)
 *                        postposed-short  Lesson 37 line 132 (the short forms)
 *                        emotional        Lesson 52 lines 177-190
 *   equivalents.json   pairs of words that can both be right for one English prompt (sameMeaning),
 *                      the "a/some" article pair, and one-way rules (oneWay), copied by vocabulary id
 *   book-tables.json   the rest of the book's tables the builder reads: the tense marker forms by
 *                      position (Lesson 15 line 77), the Tongan words that make a sentence a state
 *                      (by vocabulary id), the pronoun the pronoun table lacks (Lesson 19 line 153)
 *                      and the meanings the vocabulary lacks (Lesson 22 lines 188-200 and line 55)
 *
 * Every book table is read from the committed book (`git show HEAD:book/Chapter-NN.md`), because other
 * sessions edit the working files. Every Tongan string in the three files is copied from the book, the
 * bank or the vocabulary. Only English patterns, line numbers and ids are typed here.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../../..')
const ROOT = process.env.LFT_ROOT || '/Users/andrewjoakim/Desktop/Lea-Faka-Tonga'

/** A committed chapter as text. */
export function bookAtHead(n, root = ROOT) {
  const file = `book/Chapter-${String(n).padStart(2, '0')}.md`
  return execFileSync('git', ['-C', root, 'show', `HEAD:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

const apos = s => String(s).replace(/[ʻ‘’ʼ]/g, "'")

/** The person, number and inclusiveness of a possessive from its English gloss in a table. */
export function readGloss(gloss) {
  const g = String(gloss).toLowerCase().replace(/\s+/g, ' ').trim()
  const who = g.match(/^(my|mine|your|yours|his|hers|their|theirs|our|ours)\b/)
  if (!who) return null
  const person = { my: 1, mine: 1, our: 1, ours: 1, your: 2, yours: 2, his: 3, hers: 3, their: 3, theirs: 3 }[who[1]]
  let number = 'singular'
  if (/\bdual\b/.test(g)) number = 'dual'
  else if (/\bpl(?:ural|\.|\))/.test(g) || /^(our|ours|their|theirs)\b/.test(g)) number = 'plural'
  if (/\bsg\b/.test(g)) number = 'singular'
  let inclusive = null
  if (person === 1 && number !== 'singular') inclusive = /incl/.test(g) ? true : /excl/.test(g) ? false : null
  if (person === 1 && number !== 'singular' && inclusive === null) return null
  return { person, number, inclusive }
}

const classOf = text => (/^'?e$/i.test(apos(text).trim()) ? 'e' : 'ho')

/** The nearest heading above `line` (1-based) that names a class, as 'e' or 'ho' (null when none within 6 lines). */
function headingClass(lines, line) {
  for (let n = line - 1; n >= Math.max(1, line - 6); n--) {
    const h = (lines[n - 1] ?? '').match(/^#{2,4}\s+(.*?)-class/i)
    if (h) return classOf(h[1])
  }
  return null
}

/** Rows `| *word* | gloss | ... |` of a table between two lines (1-based, inclusive) with a given class and kind. */
function readTable(lines, from, to, cls, kind, lesson, glossOf = x => x) {
  const rows = []
  for (let n = from; n <= to; n++) {
    const m = (lines[n - 1] ?? '').match(/^\|\s*\*([^*|]+)\*\s*\|\s*(?:\*([^*|]+)\*\s*\|\s*)?([^|]+?)\s*\|/)
    if (!m) continue
    // Lesson 29: | *definite* | *indefinite* | gloss |  (the indefinite form is the row); Lesson 37: | *form* | gloss | ... |
    const word = (m[2] ?? m[1]).trim()
    const meaning = glossOf(m[3].trim())
    const f = readGloss(meaning)
    if (!f) throw new Error(`Lesson ${lesson} line ${n}: no person in the gloss "${meaning}"`)
    rows.push({ word, meaning, class: cls, kind, ...f, source: `Lesson ${lesson} line ${n}` })
  }
  return rows
}

/** Lesson 17, lines 37 to 80: the plain (definite) possessives. Class from the heading above each table. */
export function extractPlain(markdown) {
  const lines = markdown.split('\n')
  const rows = []
  let cls = null
  for (let n = 37; n <= 80; n++) {
    const line = lines[n - 1] ?? ''
    const h = line.match(/^#{2,4}\s+(.*?)-class/i)
    if (h) { cls = classOf(h[1]); continue }
    const m = line.match(/^\|\s*\*([^*|]+)\*\s*\|\s*([^|]+?)\s*\|/)
    if (!m || !cls) continue
    const f = readGloss(m[2])
    if (!f) continue
    rows.push({ word: m[1].trim(), meaning: m[2].trim(), class: cls, kind: 'plain', ...f, source: `Lesson 17 line ${n}` })
  }
  return rows
}

/** Lesson 29: the indefinite possessives, lines 102-110 (e-class) and 130-138 (ho-class). */
export function extractIndefinite(markdown) {
  const lines = markdown.split('\n')
  const rows = []
  for (const [from, to] of [[102, 110], [130, 138]]) {
    const cls = headingClass(lines, from)
    if (!cls) throw new Error(`Lesson 29 line ${from}: no class heading above the table`)
    rows.push(...readTable(lines, from, to, cls, 'indefinite', 29))
  }
  return rows
}

/** Lesson 37: the postposed possessives, lines 19-42 (e-class) and 58-83 (ho-class), and the short forms of line 132. */
export function extractPostposed(markdown) {
  const lines = markdown.split('\n')
  const rows = []
  for (const [from, to, cls] of [[19, 42, 'e'], [58, 83, 'ho']]) rows.push(...readTable(lines, from, to, cls, 'postposed', 37))
  // The six short forms of line 132 drop the reduplicated syllable: each is a singular long form without its first two letters.
  const italics = [...(lines[131] ?? '').matchAll(/\*([^*]+)\*/g)].map(m => m[1].trim())
  const shorts = []
  for (const w of italics) {
    const long = rows.find(r => r.number === 'singular' && r.word.slice(2) === w)
    if (!long) continue
    shorts.push({ ...long, word: w, kind: 'postposed-short', source: 'Lesson 37 line 132' })
  }
  if (shorts.length !== 6) throw new Error(`Lesson 37 line 132: expected six short forms, found ${shorts.length}`)
  return [...rows, ...shorts]
}

/** Lesson 52, lines 177-190: the emotional possessives that name a class (the two without one are left out). */
export function extractEmotional(markdown) {
  const lines = markdown.split('\n')
  const rows = []
  for (let n = 177; n <= 190; n++) {
    const m = (lines[n - 1] ?? '').match(/^\|\s*\*([^*|]+)\*\s*\|\s*emotional possessive\s*(?:\(([^)]*)\))?\s*\|\s*([^|]+?)\s*\|/)
    if (!m || !m[2]) continue
    const cls = /^'?e-class$/i.test(apos(m[2]).trim()) ? 'e' : /^ho-class$/i.test(m[2].trim()) ? 'ho' : null
    if (!cls) continue
    // "my (poor/dear)" -> "my": the pity words are the article's, and would clash with the English "poor"
    const meaning = m[3].replace(/,?\s*poor\/dear/i, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim()
    const f = readGloss(meaning)
    if (!f) throw new Error(`Lesson 52 line ${n}: no person in the gloss "${meaning}"`)
    rows.push({ word: m[1].trim(), meaning, class: cls, kind: 'emotional', ...f, source: `Lesson 52 line ${n}` })
  }
  return rows
}

export function allPossessives(read = bookAtHead) {
  const rows = [
    ...extractPlain(read(17)),
    ...extractIndefinite(read(29)),
    ...extractPostposed(read(37)),
    ...extractEmotional(read(52)),
  ]
  const seen = new Map()
  for (const r of rows) {
    const k = apos(r.word).toLowerCase()
    if (seen.has(k)) throw new Error(`possessive ${r.word} (${r.source}) repeats ${seen.get(k)}`)
    seen.set(k, r.source)
  }
  return rows
}

/** Lesson 15 line 77: which tense marker forms stand before a pronoun and which everywhere else. */
export function extractTenseForms(markdown) {
  const line = markdown.split('\n')[76] ?? ''
  const m = line.match(/\*([^*]+)\* is used immediately before a pronominal subject, \*([^*]+)\* in all other cases; and similarly \*([^*]+)\* immediately before a pronoun, \*([^*]+)\* in all other cases/)
  if (!m) throw new Error('Lesson 15 line 77 no longer says which marker stands before a pronoun')
  return { beforePronoun: [m[1], m[3]], elsewhere: [m[2], m[4]], source: 'Lesson 15 line 77' }
}

/**
 * Lesson 19 line 153: the postposed pronouns the bank's pronoun table has no row for. Only one of them is a word of
 * a bank sentence (the others are never a dial); it is the third person plural, which the line lists after
 * the first and second person forms.
 */
export function extractPronouns(markdown, tableWords, bankPronounWords) {
  const line = markdown.split('\n')[152] ?? ''
  const have = new Set(tableWords.map(w => apos(w).toLowerCase()))
  const inBank = new Set(bankPronounWords.map(w => apos(w).toLowerCase().replace(/[.,;:?!"]+$/, '')))
  const missing = [...line.matchAll(/\*([^*]+)\*/g)].map(m => m[1].trim()).filter(w => !have.has(apos(w).toLowerCase()) && inBank.has(apos(w).toLowerCase()))
  if (missing.length !== 1) throw new Error(`Lesson 19 line 153: expected one pronoun without a table row, found ${missing.length}`)
  return [{ word: missing[0], person: 3, number: 'plural', inclusive: null, source: 'Lesson 19 line 153 (postposed pronoun, third person plural)' }]
}

/**
 * Lesson 22 lines 188-200 (the aspect marker table) and line 55 ("(*word* = meaning)"): meanings for words the
 * vocabulary has none for. A table row counts when its first column is one italic word, or an italic phrase whose first
 * word is an aspect marker on its own in the bank; the table's meaning is then the word's. Each meaning names the role it
 * is for (the table lists aspect markers; the line 55 gloss is for the noun), so the same spelling in another role gets none.
 */
export function extractMeanings(markdown, aspectWords) {
  const lines = markdown.split('\n')
  const out = []
  const aspect = new Set(aspectWords.map(w => apos(w).toLowerCase()))
  for (let n = 188; n <= 200; n++) {
    const m = (lines[n - 1] ?? '').match(/^\|\s*\*([^*|]+)\*\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/)
    if (!m) continue
    const parts = m[1].trim().split(/\s+/)
    if (parts.length > 1 && !aspect.has(apos(parts[0]).toLowerCase())) continue
    out.push({ word: parts[0], role: 'aspect marker', meaning: m[3].trim(), phrase: m[1].trim(), source: `Lesson 22 line ${n}` })
  }
  const g = (lines[54] ?? '').match(/\(\*([^*]+)\*\s*=\s*([^)]+)\)/)
  if (g) out.push({ word: g[1].trim(), role: 'noun', meaning: g[2].trim(), phrase: g[1].trim(), source: 'Lesson 22 line 55' })
  if (out.length < 8) throw new Error(`Lesson 22: only ${out.length} meanings found`)
  return out
}

/** [id, id, why]: the words are looked up in book-vocabulary.json by id, or "table:<source>" for a word of book-tables.json meanings. */
export const EQUIVALENT_PAIRS = [
  { ids: ['book-v0386', 'book-v0068'], why: 'the two words can each say "very" after an adjective (Lesson 3 line 83: "He is very angry")' },
  { ids: ['book-v0386', 'book-v0079'], why: 'the two words can each say "hard" after a verb (Lesson 3 line 72; Lesson 23 lines 171 and 212: "study hard")' },
  { ids: ['book-v0302', 'table:Lesson 22 line 193'], why: 'the table glosses the first "still, continuing" and the second "currently, in progress" (Lesson 22 lines 190 and 193); the two overlap, so neither is a sure wrong answer for the other (Step 8: both became dials with the table meanings)' },
  { ids: ['book-v0216', 'book-v0245'], why: 'the book uses the first for finished work too (Lesson 45 lines 148 and 270: "When the work is done"), so it can also say "finished" (judge finding 6, Lessons 41-52; native-speaker queue item 46)' },
]
export const A_SOME = ['book-v0156', 'book-v0110']
/** [the word that is never a wrong option, the words it may stand for]: ids in book-vocabulary.json. */
export const ONE_WAY = {
  never: 'book-v0199',
  whenRightIs: ['book-v0198', 'book-v0197'],
  why: 'the book says the first covers the jobs of the other two ("Ē often covers the jobs of all three", Lesson 12 line 51; Lesson 16 line 110), so it can also render "this" and "that near you"; the other direction stays fair (judge finding 1)',
}
/** The Tongan words that make a tense marker's sentence a state: ids in book-vocabulary.json, or a bank sentence word. */
export const STATE_WORDS = {
  skip: [{ id: 'book-v0049' }, { sentence: 'ch29-ex3-2', word: 2 }],
  state: [{ id: 'book-v0312' }, { id: 'book-v0311' }],
  pair: { id: 'book-v0384' },
}

function main() {
  const vocab = JSON.parse(fs.readFileSync(path.join(app, 'src/data/book-vocabulary.json'), 'utf8'))
  const bank = JSON.parse(fs.readFileSync(path.join(app, 'src/games/shared/sentence-bank.json'), 'utf8'))
  const byId = new Map(vocab.map(v => [v.id, v]))
  const aspect = bank.sentences.flatMap(s => s.words.filter((w, i) => s.roles[i] === 'aspect marker'))
  const meanings = extractMeanings(bookAtHead(22), aspect)
  const pick = id => {
    if (id.startsWith('table:')) {
      const m = meanings.find(x => x.source === id.slice(6))
      if (!m) throw new Error(`no table meaning at ${id}`)
      return { word: m.word, source: m.source }
    }
    const v = byId.get(id)
    if (!v) throw new Error(`no vocabulary row ${id}`)
    return { word: v.tongan, source: id }
  }

  const rows = allPossessives()
  fs.writeFileSync(path.join(here, 'possessives.json'), JSON.stringify({
    _note: "The book's possessive tables, read by local-data.mjs from the committed book: kind plain = Lesson 17 lines 37 to 80, indefinite = Lesson 29 lines 102-110 and 130-138, postposed = Lesson 37 lines 19-42 and 58-83, postposed-short = Lesson 37 line 132, emotional = Lesson 52 lines 177-190. person/number/inclusive come from the English gloss in the table. A dial's options come only from rows of its own kind.",
    rows,
  }, null, 2) + '\n', 'utf8')

  fs.writeFileSync(path.join(here, 'equivalents.json'), JSON.stringify({
    _note: 'Pairs that are not wrong for each other on one dial (judge findings 5 and 6, Step 8 finding 6), and one-way rules (Step 8 finding 1). Words are copied from book-vocabulary.json by id. Local to Sentence Lock; the shared confusable-pairs.json is untouched.',
    sameMeaning: EQUIVALENT_PAIRS.map(p => ({ a: pick(p.ids[0]), b: pick(p.ids[1]), why: p.why })),
    aSome: { a: pick(A_SOME[0]), b: pick(A_SOME[1]), why: 'the two articles both translate English "a" and "some" when the noun has no final accent (Lesson 18 lines 14 and 16; Lesson 8 line 13)' },
    oneWay: { never: pick(ONE_WAY.never), whenRightIs: ONE_WAY.whenRightIs.map(pick), why: ONE_WAY.why },
  }, null, 2) + '\n', 'utf8')

  const fromBank = ({ sentence, word }) => {
    const s = bank.sentences.find(x => x.id === sentence)
    if (!s) throw new Error(`no bank sentence ${sentence}`)
    return { word: s.words[word], source: `bank ${sentence} word ${word}` }
  }
  const stateWord = x => (x.id ? pick(x.id) : fromBank(x))
  const pair = pick(STATE_WORDS.pair.id)
  const pairWords = pair.word.split(' ')
  if (pairWords.length !== 2) throw new Error('the existential marker is not two words')

  fs.writeFileSync(path.join(here, 'book-tables.json'), JSON.stringify({
    _note: 'Book tables the builder reads besides the bank and the vocabulary (Step 8). tenseForms: Lesson 15 line 77. stateWords: Tongan words after a tense marker that make a state (ids in book-vocabulary.json or a bank word). pronouns: rows the bank pronoun table lacks, merged in memory by loadSources(). meanings: meanings the vocabulary lacks, used only for a word with no vocabulary meaning.',
    tenseForms: extractTenseForms(bookAtHead(15)),
    stateWords: {
      skip: STATE_WORDS.skip.map(stateWord),
      state: STATE_WORDS.state.map(stateWord),
      pair: { words: pairWords, source: pair.source },
    },
    pronouns: extractPronouns(bookAtHead(19), bank.pronounTable.map(r => r.word), bank.sentences.flatMap(s => s.words.filter((w, i) => s.roles[i] === 'pronoun'))),
    meanings,
  }, null, 2) + '\n', 'utf8')
  console.log(`possessives.json: ${rows.length} rows; equivalents.json and book-tables.json written`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
