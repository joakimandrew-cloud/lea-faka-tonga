/**
 * The shared sentence bank: every sentence Sentence Tiles keeps, tagged for
 * tense, negation and who (pure, no React). Built by build-sentence-bank.mjs
 * from the deck and roles.json, never by hand. A game takes its sentences
 * from here and reads the tags; a tag the book does not settle is null.
 *
 * Entry: { id, lesson, english, words, roles, tags: { tense, negation, who }, notes }
 *   tense:    { word, index, tense } | null   tense is past, present, future or perfect
 *   negation: { word, index } | null
 *   who:      { word, index, kind, person, number, inclusive, rule } | null
 *             kind is 'pronoun', 'name' or 'noun'; person and number are null for a noun
 */
import bank from './sentence-bank.json'

/** Every entry, in the deck's order (lesson by lesson). */
export const SENTENCE_BANK = bank.sentences

/** The book's tense marker table and pronoun table the tags were mapped from, each row with its book line. */
export const TENSE_TABLE = bank.tenseTable
export const PRONOUN_TABLE = bank.pronounTable

/** The lessons that have at least one entry, in the book's order. */
export const BANK_LESSONS = [...new Set(SENTENCE_BANK.map(e => e.lesson))].sort((a, b) => a - b)

/** The entries of one lesson. */
export function byLesson(n) {
  return SENTENCE_BANK.filter(e => e.lesson === Number(n))
}

/** The lessons, in order, with at least one entry whose `tagName` ('tense', 'negation' or 'who') is set. */
export function lessonsWith(tagName) {
  return BANK_LESSONS.filter(n => byLesson(n).some(e => e.tags?.[tagName]))
}

/** The distinct tense marker words (lower case, accent kept as printed) used in one lesson's entries. */
export function tenseWordsIn(n) {
  return [...new Set(byLesson(n).map(e => e.tags.tense?.word).filter(Boolean))]
}
