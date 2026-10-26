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
 * Tongan stays as stored (ASCII apostrophe) inside the deck; it goes through
 * okinafy only where it is shown, the site-wide display rule.
 */
import { okinafy } from '../../lib/okinafy.js'

export const WORD_SETS = ['essential', 'useful', 'all']
export const WORD_SET_LABELS = { essential: 'Essential', useful: 'Useful', all: 'All' }

/** Longest meaning shown whole; a longer list shows its first item. */
export const MAX_SHOWN_CHARS = 28

const SEPARATOR = /[,;]/

/** The English before the first "(", trimmed. */
function beforeParen(english) {
  return String(english ?? '').split('(')[0].trim()
}

/**
 * The meaning a player sees: the `english` field cut before the first "(" and
 * trimmed. A list (commas, or the book's semicolons) is shown whole unless it
 * runs past 28 characters, then only its first item.
 */
export function shownMeaning(english) {
  const base = beforeParen(english).replace(/\s+/g, ' ')
  if (base.length <= MAX_SHOWN_CHARS || !SEPARATOR.test(base)) return base
  return base.split(SEPARATOR)[0].trim()
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
  for (const item of String(english ?? '').split('(')[0].split(SEPARATOR)) {
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

/** Every meaning, in full: the field before any "(", whitespace tidied. */
export function fullMeaning(english) {
  return beforeParen(english).replace(/\s+/g, ' ')
}

/** One vocabulary row as a game card. */
export function toCard(v) {
  return {
    id: v.id,
    tongan: v.tongan,
    tonganShown: okinafy(v.tongan),
    english: v.english,
    meaning: shownMeaning(v.english),
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
export function buildDeck(vocabulary, wordSet = 'essential') {
  let rows = vocabulary.filter(v => v.category !== 'grammar')
  if (wordSet === 'essential') rows = rows.filter(v => v.tier === 1)
  else if (wordSet === 'useful') rows = rows.filter(v => v.tier <= 2)
  return rows.map(toCard).filter(c => c.meaning && c.tongan)
}
