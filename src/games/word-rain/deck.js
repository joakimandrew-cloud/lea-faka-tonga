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

/** The vocabulary rows a word set plays with, as game cards. */
export function buildDeck(vocabulary, wordSet = 'essential') {
  let rows = vocabulary.filter(v => v.category !== 'grammar')
  if (wordSet === 'essential') rows = rows.filter(v => v.tier === 1)
  else if (wordSet === 'useful') rows = rows.filter(v => v.tier <= 2)
  return rows
    .map(v => ({
      id: v.id,
      tongan: v.tongan,
      tonganShown: okinafy(v.tongan),
      english: v.english,
      meaning: shownMeaning(v.english),
      items: meaningItems(v.english),
      pos: v.part_of_speech ?? '',
      tier: v.tier,
      category: v.category,
    }))
    .filter(c => c.meaning && c.tongan)
}
