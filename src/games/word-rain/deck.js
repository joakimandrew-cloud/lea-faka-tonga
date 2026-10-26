/**
 * Word Rain: deck building (pure, no React).
 *
 * The deck is the course vocabulary in src/data/book-vocabulary.json as it
 * stands, minus the "grammar" category (particles and markers have no clean
 * one-word English match, so they would make unfair rounds; plan
 * 2026-10-26-word-rain-game, Review Ledger). The word sets use the same tier
 * filter as the /cards deck (FlipCards.jsx): Essential = tier 1, Useful =
 * tiers 1-2, All = every tier.
 *
 * Since Step 4 the game plays every word it has: the course words, plus the
 * site's word lists (src/premium/data/word-lists.json: Parts of body, Colours,
 * Land animals). A word-list row that is also a course word (course_id) is the
 * course card itself, so no word is counted twice. There is no Essential /
 * Useful / All choice on the page any more (DECISIONS.md 2026-09-29, flip
 * cards); buildDeck keeps its tier argument for the tests only.
 *
 * Tongan stays as stored (ASCII apostrophe) inside the deck; it goes through
 * okinafy only where it is shown, the site-wide display rule.
 */
import { okinafy, looksTongan } from '../../lib/okinafy.js'

export const WORD_SETS = ['essential', 'useful', 'all']
export const WORD_SET_LABELS = { essential: 'Essential', useful: 'Useful', all: 'All' }

/** Longest meaning shown whole; a longer list shows its first item. */
export const MAX_SHOWN_CHARS = 28

const SEPARATOR = /[,;]/

/** Splits at a separator that sits outside any brackets. */
function splitTop(text, sep) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of String(text ?? '')) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === sep && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map(x => x.trim()).filter(Boolean)
}

/** The bracketed notes of one piece of English. */
function notesOf(part) {
  return [...part.matchAll(/\(([^)]*)\)/g)].map(m => m[1].trim())
}

/**
 * The semicolon-separated pieces of a meaning that belong to this word. A
 * piece whose note names a different Tongan phrase ("nevertheless (kae
 * kehe)" under kehe) is another word's meaning and is dropped, unless it is
 * all there is.
 */
function keptParts(english) {
  const parts = splitTop(english, ';')
  if (parts.length < 2) return parts
  const own = parts.filter(p => !notesOf(p).some(n => looksTongan(n)))
  return own.length ? own : [parts[0]]
}

/** The meaning with its notes, whitespace tidied (the pieces that belong to this word). */
function withNotes(english) {
  return keptParts(english).join('; ').replace(/\s+/g, ' ').trim()
}

/** The English without any note: each kept piece cut before its first "(", trimmed. */
function beforeParen(english) {
  return keptParts(english).map(p => p.split('(')[0].trim()).filter(Boolean).join('; ')
}

/**
 * The meaning a player sees when the note does not fit: each kept piece cut
 * before "(" and trimmed. A list (commas, or the book's semicolons) is shown
 * whole unless it runs past 28 characters, then only its first item.
 */
export function shownMeaning(english) {
  const base = beforeParen(english).replace(/\s+/g, ' ')
  if (base.length <= MAX_SHOWN_CHARS || !SEPARATOR.test(base)) return base
  return base.split(SEPARATOR)[0].trim()
}

/**
 * The text on an answer button (and on a word that moves in English): the
 * whole meaning with its note when that fits 28 characters, else the
 * note-free text above. Tongan inside a note gets its fakauʻa.
 */
export function labelMeaning(english) {
  const full = withNotes(english)
  return full.length <= MAX_SHOWN_CHARS ? okinafy(full) : shownMeaning(english)
}

/** One meaning item, normalised for comparison ("To Preach" = "preach"). */
export function normaliseItem(item) {
  return item
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(to|a|an|the) /, '')
    .replace(/[.!?]+$/, '')
    .trim()
}

/**
 * Every comma- or semicolon-separated item of the meaning (the whole field
 * before any "(", not only the shown part), normalised. Two entries that
 * share any item are never put in the same round.
 */
export function meaningItems(english) {
  return beforeParen(english)
    .split(SEPARATOR)
    .map(normaliseItem)
    .filter(Boolean)
}

/**
 * Words too small to tell two meanings apart: to/be/articles, and the little
 * particles of phrasal verbs ("sit down", "live together"). Two meanings that
 * share only these never count as the same meaning.
 */
const SMALL_WORDS = new Set([
  'to', 'be', 'a', 'an', 'the', 'of', 'with', 'for', 'down', 'up', 'out',
  'together', 'in', 'on', 'at', 'from', 'off', 'away', 'and', 'or', 'by', 'as',
  'is', 'it', 'one', 'oneself', 'someone', 'something',
])

/** Folds simple endings, so sit / sits / sitting and live / lives / living agree. */
export function stemWord(word) {
  let w = word
  if (w.length <= 3) return w
  let cut = false
  if (w.endsWith('ing') && w.length > 5) { w = w.slice(0, -3); cut = true }
  else if (w.endsWith('ies') && w.length > 4) { w = `${w.slice(0, -3)}y`; cut = true }
  else if (w.endsWith('es') && w.length > 4) { w = w.slice(0, -2); cut = true }
  else if (w.endsWith('ed') && w.length > 4) { w = w.slice(0, -2); cut = true }
  else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) { w = w.slice(0, -1); cut = true }
  if (w.length > 2 && w.endsWith('e')) w = w.slice(0, -1)
  if (cut && w.length > 2 && w[w.length - 1] === w[w.length - 2] && !/[aeiou]/.test(w[w.length - 1])) w = w.slice(0, -1)
  return w
}

/**
 * The words that carry a meaning: lower-case, notes in brackets dropped (the
 * game never reads past "("), the little words above dropped, endings folded.
 * A meaning made only of little words ("one") keeps them.
 */
export function contentWords(english) {
  const out = new Set()
  for (const item of beforeParen(english).split(SEPARATOR)) {
    const tokens = item
      .toLowerCase()
      .replace(/['\u2019\u02bc]s\b/g, '')
      .replace(/['\u2019\u02bc]/g, '')
      .split(/[^\p{L}]+/u)
      .filter(Boolean)
    const kept = tokens.filter(t => !SMALL_WORDS.has(t))
    for (const t of kept.length ? kept : tokens) out.add(stemWord(t))
  }
  return [...out]
}

/** A Tongan spelling made comparable: one apostrophe, lower case. */
export function tonganKey(tongan) {
  return String(tongan ?? '').normalize('NFC').toLowerCase().replace(/[\u02bb\u2018\u2019\u02bc]/g, "'").trim()
}

/**
 * The Tongan words the English note names as the source of this one:
 * "(plural of nofo)", "(from 'aonga, useful)". A card and the card it was
 * made from are never put in one round.
 */
export function derivedFrom(english) {
  const refs = []
  for (const note of String(english ?? '').matchAll(/\(([^)]*)\)/g)) {
    const m = note[1].match(/^(?:plural of|form of|derived from|from)\s+([^,;]+)/i)
    if (m) refs.push(tonganKey(m[1]))
  }
  return refs
}

/** Every meaning, in full, with its notes (the reveal and the missed list). */
export function fullMeaning(english) {
  return okinafy(withNotes(english))
}

/** One vocabulary row as a game card. */
export function toCard(v) {
  return {
    id: v.id,
    tongan: v.tongan,
    tonganShown: okinafy(v.tongan),
    english: v.english,
    meaning: shownMeaning(v.english),
    label: labelMeaning(v.english),
    full: fullMeaning(v.english),
    items: meaningItems(v.english),
    words: contentWords(v.english),
    key: tonganKey(v.tongan),
    refs: derivedFrom(v.english),
    pos: v.part_of_speech ?? '',
    tier: v.tier,
    category: v.category,
  }
}

/** The vocabulary rows a word set plays with, as game cards. */
export function buildDeck(vocabulary, wordSet = 'all') {
  // The three "(accent example)" rows (falé, puhá, tēpilé) are copies of
  // fale, puha and tēpile with the phrase-final accent; they are not words.
  let rows = vocabulary.filter(v => v.category !== 'grammar' && !LEFT_OUT_OF_GAME.has(v.id) && !/\(accent example\)/i.test(v.english ?? ''))
  if (wordSet === 'essential') rows = rows.filter(v => v.tier === 1)
  else if (wordSet === 'useful') rows = rows.filter(v => v.tier <= 2)
  return rows.map(toCard).filter(c => c.meaning && c.tongan)
}

/** A word-list row's part of speech, as the course's word-type category. */
export function categoryForPos(pos) {
  const p = String(pos ?? '').toLowerCase()
  if (p.startsWith('noun')) return 'nouns'
  if (p.startsWith('adjective')) return 'adjectives'
  if (p.startsWith('verb')) return 'verbs'
  if (p.startsWith('adverb')) return 'adverbs'
  return ''
}

/**
 * A word-list row that is not a course word, as a game card. A register
 * ("polite", "noble word") stays on the word wherever it is shown, as the
 * site's dictionary shows it, so a learner never takes the polite word for
 * the everyday one.
 */
export function wordListCard(row) {
  // A register joins the word's own note ("stomach (said of a chief, noble
  // word)"), never a second pair of brackets.
  const english = !row.register
    ? row.english
    : /\)\s*$/.test(row.english)
      ? row.english.replace(/\)\s*$/, `, ${row.register})`)
      : `${row.english} (${row.register})`
  const card = toCard({
    id: row.id,
    tongan: row.tongan,
    english,
    part_of_speech: row.part_of_speech,
    category: categoryForPos(row.part_of_speech),
    tier: null,
  })
  card.list = row.theme
  if (row.register) {
    card.register = row.register
    card.meaning = `${card.meaning} (${row.register})`
    // The register always stays on the button, even when the whole note is too long for it.
    if (withNotes(english).length > MAX_SHOWN_CHARS) card.label = `${shownMeaning(english)} (${row.register})`
  }
  return card
}

/**
 * Words the game never plays, because a game is played by children too
 * (Andrew, 2026-10-26, after "male genitals" came up in play). They stay in
 * the dictionary and on the Cards page; only the game leaves them out.
 */
export const LEFT_OUT_OF_GAME = new Set([
  'wl-body-025', // male genitals
  'wl-body-031', // a woman's breast
  'wl-body-057', // buttocks, bottom
])

/**
 * The cards of the site's word lists, by theme id, in the data file's order.
 * A row with a course_id is the course card (from `courseCards`, by id); a
 * course card the game leaves out (grammar) is left out here too.
 */
export function wordListDecks(wordLists, courseCards) {
  const byId = new Map(courseCards.map(c => [c.id, c]))
  const out = new Map()
  for (const theme of wordLists?.themes ?? []) out.set(theme.id, [])
  for (const row of wordLists?.entries ?? []) {
    if (!out.has(row.theme) || LEFT_OUT_OF_GAME.has(row.id)) continue
    const card = row.course_id ? byId.get(row.course_id) : wordListCard(row)
    if (card && card.meaning && card.tongan) out.get(row.theme).push(card)
  }
  return out
}

/**
 * Every word the game can play: the course words (no grammar), then the
 * word-list words that are not course words. Distinct by id.
 */
export function allWordsDeck(vocabulary, wordLists) {
  const course = buildDeck(vocabulary, 'all')
  const seen = new Set(course.map(c => c.id))
  const extra = []
  for (const cards of wordListDecks(wordLists, course).values()) {
    for (const c of cards) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      extra.push(c)
    }
  }
  return [...course, ...extra]
}
