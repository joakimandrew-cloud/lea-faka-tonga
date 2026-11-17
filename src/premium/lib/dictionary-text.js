// Text helpers shared by the dictionary search, the word pages and the scripts
// that build their data (plan 2026-11-18-dictionary-search-and-word-pages).
//
// Pure: no React, no data imports, so `node` can import this file directly.
// Everything here builds a key, a web address or a list of senses. Nothing
// here changes what is displayed: the Tongan, the meaning and the part of
// speech are always shown as the data has them.

// Every character the data or a keyboard may use for the glottal stop (fakauʻa).
const GLOTTAL_VARIANTS = /['‘’ʼ`ʻ]/g
const COMBINING_MARKS = /\p{M}/gu
const BRACKETED_NOTE = /\([^)]*\)/g

// The address segment kept for the English pages; no word page may use it.
export const RESERVED_SLUGS = ['english']

export function stripMarks(text) {
  return String(text == null ? '' : text).normalize('NFD').replace(COMBINING_MARKS, '').normalize('NFC')
}

// A word as someone types it without macrons, accents or fakauʻa. Case, spaces
// and hyphens stay, so this can be shown beside the marked word ("also typed").
export function plainTyping(tongan) {
  return stripMarks(tongan).replace(GLOTTAL_VARIANTS, '').replace(/\s+/g, ' ').trim()
}

// Search key: plain typing, lowercased, hyphens dropped. `ulu` and `ʻulu`,
// `faka-Tonga` and `fakatonga` share one key.
export function plainKey(text) {
  return plainTyping(text).toLowerCase().replace(/-+/g, '').replace(/\s+/g, ' ').trim()
}

// The plain key with its spaces removed: `lotolahi` finds `loto lahi`.
export function compactKey(text) {
  return plainKey(text).replace(/ /g, '')
}

// Exact spelling for comparison: marks kept, every fakauʻa form folded to one
// character, lowercase. Used to tell a word typed with its marks from one
// typed plain.
export function markedKey(text) {
  return String(text == null ? '' : text).normalize('NFC').toLowerCase().replace(GLOTTAL_VARIANTS, "'").replace(/\s+/g, ' ').trim()
}

// The address of a word page: the word typed plain, lowercase, macrons and
// accents removed, fakauʻa and apostrophes removed, a bracketed note dropped,
// every other run of characters a hyphen, and no hyphen at either end (so the
// leading hyphen of a bound form such as -ʻaki goes). Rows whose words fold to
// the same address share one page.
export function wordSlug(tongan) {
  const slug = stripMarks(String(tongan == null ? '' : tongan).replace(BRACKETED_NOTE, ' '))
    .toLowerCase()
    .replace(GLOTTAL_VARIANTS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return RESERVED_SLUGS.includes(slug) ? `${slug}-tongan` : slug
}

export function wordPagePath(slug) {
  return `/dictionary/${slug}`
}

export function englishSlug(headword) {
  return String(headword == null ? '' : headword).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function englishPagePath(slug) {
  return `/dictionary/english/${slug}`
}

// A meaning without its bracketed notes: "goodbye (to person leaving)" is
// "goodbye". The notes explain; they are not the meaning.
export function withoutNotes(english) {
  return String(english == null ? '' : english).replace(BRACKETED_NOTE, ' ').replace(/\s+/g, ' ').trim()
}

// One sense, without a leading "to" or a leading article when a word follows,
// and without an "and" left hanging at its end. "to eat" is "eat"; "a fight"
// is "fight"; "hurry up and" is "hurry up"; a bare "to" or "the" stays.
export function normaliseSense(text) {
  return String(text == null ? '' : text)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^to\s+(?=\S)/i, '')
    .replace(/^(?:a|an|the)\s+(?=\S)/i, '')
    .replace(/(?<=\S)\s+and$/i, '')
    .trim()
}

// A meaning split into its senses at commas and semicolons, notes dropped.
// Each sense keeps the text it came from, so a derived list can be traced.
export function splitSenses(english) {
  return withoutNotes(english)
    .split(/[,;]/)
    .map(part => ({ text: part.replace(/\s+/g, ' ').trim(), sense: normaliseSense(part) }))
    .filter(item => item.sense)
}

// One letter wrong, missing or extra, or two neighbouring letters swapped.
export function withinOneLetter(a, b) {
  if (a === b) return true
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > 1) return false
  let i = 0
  while (i < la && i < lb && a[i] === b[i]) i += 1
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)
  }
  const [long, short] = la > lb ? [a, b] : [b, a]
  return long.slice(i + 1) === short.slice(i)
}

// Only the letters Tongan is written with (marks and fakauʻa already removed).
export function looksLikeTongan(plain) {
  return /^[aefghiklmnopstuv]+$/.test(String(plain || '').replace(/[ -]/g, ''))
}

// ---------------------------------------------------------------------------
// Which senses are plain English words. Used twice: to decide which senses
// become English headwords, and to decide whether a row's meaning can be
// looked for in the English printed beside a lesson sentence.

export const ENGLISH_HEADWORD_MAX_WORDS = 3
// Bound forms and frames (-ʻaki, faka-, fe-...-ʻaki): their meanings describe
// what the form does.
export const isBoundForm = tongan => /^-|-$|\.\.\.|\//.test(withoutNotes(tongan))
// A sense that describes a job instead of giving an English word for it.
// It opens with a verb of description (marks, makes, adds ...), speaks of the
// speaker or the listener, names what a classifier counts ("flat objects"),
// or is the tail of an explanation ("where it bends").
const GRAMMATICAL_NOTE = /^(?:marks|makes|adds|softens|replaces|emphasi[sz]ing|possessing|regarding|where it)\b|\b(?:speaker|listener|objects)\b/i
const PLAIN_WORDS = /^[A-Za-z]+(?:['-][A-Za-z]+)*(?: [A-Za-z]+(?:['-][A-Za-z]+)*)*$/

// Why a sense is not a plain English word or phrase, or '' when it is one.
export function senseDropReason(tongan, sense) {
  if (isBoundForm(tongan)) return 'bound form: the meaning describes the form'
  if (!PLAIN_WORDS.test(sense)) return 'not plain words'
  if (sense.split(' ').length > ENGLISH_HEADWORD_MAX_WORDS) return 'more than three words'
  if (GRAMMATICAL_NOTE.test(sense)) return 'grammatical note'
  return ''
}
