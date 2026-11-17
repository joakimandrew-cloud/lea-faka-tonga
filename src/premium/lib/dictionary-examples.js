// Example sentences for the dictionary's word pages, copied from the lessons
// as printed (plan 2026-11-18-dictionary-search-and-word-pages; DECISIONS.md
// 2026-09-27 "no generated examples").
//
// Pure: takes the lesson markdown as text and returns data. The script
// scripts/build-dictionary-data.mjs runs it over book/Chapter-NN.md and writes
// src/premium/data/dictionary-examples.json; a test re-runs it and checks every
// pair against the book.
//
// Nothing is written here. A pair is one printed line of a lesson's examples
// block: the Tongan in italics, then the English the lesson prints with it.
// The rule throughout is that no sentence beats a wrong one:
//   - only lines inside an examples block of the lesson body are read, and only
//     the two printed shapes whose pairing is certain;
//   - a row gets a sentence only from the lesson that teaches it, and only when
//     its Tongan stands in the sentence as whole words in exactly the printed
//     spelling (a sentence-opening capital aside);
//   - a word that is part of a longer dictionary entry in that sentence
//     (fale in fale mohe) belongs to the longer entry;
//   - if another row on the same word page is also spelled in the sentence,
//     nobody gets it;
//   - a phrase line that holds nothing but the word is a gloss, and is left out;
//   - when the row's meaning has a plain English sense, a form of that sense
//     must stand in the English printed with the sentence. A word can be
//     spelled the same and mean something else in a given line (ko ia pē,
//     "that is all", beside ko ia, "therefore"); this keeps those out. A row
//     whose meaning only describes its job (a tense marker, say) has nothing
//     to look for and is taken on its spelling.

import { senseDropReason, splitSenses, withoutNotes, wordSlug } from './dictionary-text.js'

export const MAX_EXAMPLES = 3

const GLOTTAL_VARIANTS = /['‘’ʼ`ʻ]/g
const FENCE_OPEN = /^:::\s*\{\.examples\}\s*$/
const FENCE_CLOSE = /^:::\s*$/
const END_OF_BODY = /^###\s+(?:Words to Learn|Exercises|Answers)\s*$/
// *Sentence.* English.   The italic span holds the whole Tongan sentence.
const SENTENCE_LINE = /^\*([^*]+[.?!])\*\s+(\S[^*]*)$/
// *phrase*. English      A phrase with its meaning, as the lessons print it.
const PHRASE_LINE = /^\*([^*]+[^*.?!\s])\*\.\s+(\S[^*]*)$/
// English that is a label, a tone mark or a formula, not a translation.
const NOT_A_TRANSLATION = /[↗↘→=+|\\_]|^\(/
const TONGAN_ONLY = /^[\p{L}\p{M}'‘’ʼ`ʻ ,.?!;:"“”-]+$/u

// The printed example pairs of one lesson, in order.
export function lessonExampleLines(markdown) {
  const out = []
  let inFence = false
  const lines = String(markdown || '').split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index].trim()
    if (END_OF_BODY.test(raw)) break
    if (!inFence) {
      if (FENCE_OPEN.test(raw)) inFence = true
      continue
    }
    if (FENCE_CLOSE.test(raw)) { inFence = false; continue }
    const sentence = SENTENCE_LINE.exec(raw)
    const phrase = sentence ? null : PHRASE_LINE.exec(raw)
    const found = sentence || phrase
    if (!found) continue
    const tongan = found[1].trim()
    const english = found[2].trim()
    if (!TONGAN_ONLY.test(tongan) || NOT_A_TRANSLATION.test(english)) continue
    out.push({ line: index + 1, kind: sentence ? 'sentence' : 'phrase', tongan, english, printed: raw })
  }
  return out
}

const normal = text => text.normalize('NFC').replace(GLOTTAL_VARIANTS, "'")

// "ʻOku" at the head of a sentence is the word "ʻoku".
function lowerFirstLetter(word) {
  const at = word.startsWith("'") ? 1 : 0
  return word.slice(0, at) + word.slice(at, at + 1).toLowerCase() + word.slice(at + 1)
}

// The words of a printed Tongan line, each with its place in the text.
export function tokenise(text) {
  const tokens = []
  const source = String(text || '')
  const pattern = /\S+/g
  let found
  let opening = true
  while ((found = pattern.exec(source))) {
    const chunk = found[0]
    const lead = /^["“(]+/.exec(chunk)?.[0].length || 0
    const trail = /[.,?!;:"”)]+$/.exec(chunk.slice(lead))?.[0].length || 0
    const word = chunk.slice(lead, chunk.length - trail)
    if (word) {
      const text = normal(word)
      tokens.push({ text, lowered: opening ? lowerFirstLetter(text) : text, start: found.index + lead, end: found.index + lead + word.length })
    }
    opening = /[.?!]["”)]*$/.test(chunk)
  }
  return tokens
}

// A row's Tongan as the whole words to look for, or null for a row that cannot
// stand as whole words in a sentence (a bound form such as -ʻaki, a frame with
// a gap such as fe-...-ʻaki).
export function rowWords(tongan) {
  const text = normal(withoutNotes(tongan))
  if (!text || /^-|-$|\.\.\.|\//.test(text) || !/^[\p{L}\p{M}' -]+$/u.test(text)) return null
  if (text.split(' ').some(word => /^-|-$/.test(word))) return null
  return text.split(' ')
}

function occurrences(tokens, words) {
  const starts = []
  for (let start = 0; start + words.length <= tokens.length; start += 1) {
    let ok = true
    for (let i = 0; i < words.length && ok; i += 1) {
      const token = tokens[start + i]
      ok = token.text === words[i] || token.lowered === words[i]
    }
    if (ok) starts.push(start)
  }
  return starts
}

// English forms that do not begin with their base word.
const IRREGULAR_FORMS = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'], go: ['went', 'gone', 'goes'], eat: ['ate'], see: ['saw'], come: ['came'],
  give: ['gave'], take: ['took'], know: ['knew'], drink: ['drank', 'drunk'], run: ['ran'], sit: ['sat'], stand: ['stood'],
  speak: ['spoke'], write: ['wrote', 'written'], say: ['said'], tell: ['told'], make: ['made'], buy: ['bought'], bring: ['brought'],
  think: ['thought'], find: ['found'], get: ['got'], do: ['did', 'does', 'done'], have: ['had', 'has'], hear: ['heard'], meet: ['met'],
  fall: ['fell'], leave: ['left'], begin: ['began', 'begun'], break: ['broke'], build: ['built'], catch: ['caught'], teach: ['taught'],
  wear: ['wore', 'worn'], swim: ['swam'], fly: ['flew'], forget: ['forgot'], feel: ['felt'], keep: ['kept'], pay: ['paid'],
  sell: ['sold'], send: ['sent'], win: ['won'], lose: ['lost'], hold: ['held'], steal: ['stole'], wake: ['woke'], sing: ['sang', 'sung'],
  sleep: ['slept'], child: ['children'], man: ['men'], woman: ['women'], person: ['people'], tooth: ['teeth'], foot: ['feet'],
  good: ['better', 'best', 'well'], bad: ['worse', 'worst'], many: ['more', 'most'], lie: ['lying', 'lay'], die: ['dying'],
}
const LITTLE_WORDS = new Set(['a', 'an', 'the', 'to', 'of', 'be', 'is', 'in', 'at', 'on', 'for', 'it', 'and', 'or', 'with', 'by', 'as'])

function hasFormOf(words, base) {
  if (words.includes(base) || (IRREGULAR_FORMS[base] || []).some(form => words.includes(form))) return true
  if (base.endsWith('y') && ['ied', 'ies', 'ier', 'iest', 'ily'].some(end => words.includes(base.slice(0, -1) + end))) return true
  const stem = base.replace(/e$/, '')
  return stem.length >= 3 && words.some(word => word.startsWith(stem) && word.length - stem.length <= 4)
}

// The row's plain English senses, lowercased; empty when its meaning only
// describes what the word does.
export function plainSenses(tongan, english) {
  return splitSenses(english).map(item => item.sense).filter(sense => !senseDropReason(tongan, sense)).map(sense => sense.toLowerCase())
}

// Does a form of one of the senses stand in the printed English?
export function meaningShowsIn(senses, printedEnglish) {
  const words = String(printedEnglish || '').toLowerCase().split(/[^a-z']+/).filter(Boolean)
  return senses.some(sense => {
    const content = sense.split(/[ -]/).filter(word => !LITTLE_WORDS.has(word))
    return content.length ? content.every(word => hasFormOf(words, word)) : words.includes(sense)
  })
}

// rows:    [{ id, tongan, english, lesson }] for every row shown on a word
//          page; lesson is the teaching lesson's number, or null.
// lessons: { [number]: markdown of book/Chapter-NN.md }
// Returns  { [rowId]: [{ tongan, english, line, kind, at: [start, end] }] }
export function selectExamples({ rows, lessons, max = MAX_EXAMPLES }) {
  const known = rows
    .map(row => ({ id: row.id, lesson: row.lesson, slug: wordSlug(row.tongan), words: rowWords(row.tongan), senses: plainSenses(row.tongan, row.english) }))
    .filter(row => row.words)
  const candidates = new Map()

  for (const [number, markdown] of Object.entries(lessons)) {
    const lesson = Number(number)
    for (const pair of lessonExampleLines(markdown)) {
      const tokens = tokenise(pair.tongan)
      const hits = []
      for (const row of known) for (const start of occurrences(tokens, row.words)) hits.push({ row, start, length: row.words.length })
      const free = hits.filter(hit => !hits.some(other => other.row.id !== hit.row.id && other.length > hit.length
        && other.start <= hit.start && other.start + other.length >= hit.start + hit.length))
      for (const hit of free) {
        if (hit.row.lesson !== lesson) continue
        // A phrase line that is only the word itself is its gloss, not a use of it.
        if (pair.kind === 'phrase' && tokens.length <= hit.length) continue
        if (hits.some(other => other.row.id !== hit.row.id && other.row.slug === hit.row.slug)) continue
        if (hit.row.senses.length && !meaningShowsIn(hit.row.senses, pair.english)) continue
        const list = candidates.get(hit.row.id) || []
        if (list.some(item => item.tongan === pair.tongan)) continue
        const last = tokens[hit.start + hit.length - 1]
        list.push({ tongan: pair.tongan, english: pair.english, line: pair.line, kind: pair.kind, at: [tokens[hit.start].start, last.end] })
        candidates.set(hit.row.id, list)
      }
    }
  }

  const out = {}
  for (const row of rows) {
    const list = candidates.get(row.id)
    if (!list) continue
    // Whole sentences before phrases, each in the order the lesson prints them.
    const ordered = [...list.filter(item => item.kind === 'sentence'), ...list.filter(item => item.kind === 'phrase')]
    out[row.id] = ordered.slice(0, max)
  }
  return out
}
