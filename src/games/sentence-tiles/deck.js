/**
 * Sentence Tiles: the deck (pure, no React).
 *
 * Every sentence comes from the book's own exercises (src/data/book-exercises.json,
 * read at build time): the "Translate English to Tongan" items whose answer is
 * one Tongan sentence of 3 to 8 words. The English prompt is kept exactly as
 * the book prints it, with any Tongan hint in it (*...*) shown as Tongan.
 *
 * An item is left out when:
 *   - its answer is not one *...* span on its own (two spans, an English
 *     gloss after the Tongan, a numbered pair);
 *   - the Tongan holds a slash, " or ", brackets, or more than one sentence
 *     (a second right answer, or two answers in one);
 *   - it has 2 words or fewer, or more than 8;
 *   - its `accept` list names a Tongan answer other than the printed one (a
 *     second right answer);
 *   - its prompt carries a note joined on from the book page ("> *Preview:*");
 *   - any tile is a word the games leave out (LEFT_OUT_OF_GAME in
 *     ../shared/deck.js), matched whole after the deck's own normalising.
 *
 * Tiles are the answer split at spaces. A comma stays on its word, as the book
 * prints it. The full stop, question mark or exclamation mark at the end is
 * not a tile: it is shown fixed after the answer line. Accents and capitals
 * are kept exactly as printed; the fakauʻa is shown through okinafy, the
 * site-wide display rule, and stays an ASCII apostrophe in the deck.
 */
import exercises from '../../data/book-exercises.json'
import vocabulary from '../../data/book-vocabulary.json'
import wordLists from '../../premium/data/word-lists.json'
import { LEFT_OUT_OF_GAME, tonganKey } from '../shared/deck.js'

export const MIN_WORDS = 3
export const MAX_WORDS = 8
export const ALL_LESSONS_ID = 'all'

const END = /[.?!]+$/

/** A tile made comparable: the deck's Tongan key, with punctuation dropped. */
export function tileKey(text) {
  return tonganKey(text).replace(/[.,;:?!"“”]/g, '').trim()
}

/** The Tongan of every word the games leave out, as tile keys (read from the data). */
export const LEFT_OUT_KEYS = new Set(
  [...(wordLists?.entries ?? []), ...vocabulary]
    .filter(row => LEFT_OUT_OF_GAME.has(row.id))
    .map(row => tileKey(row.tongan))
    .filter(Boolean),
)

/** True when the tiles hold a left-out word, as one tile or as tiles in a row. */
export function holdsLeftOut(words) {
  const keys = words.map(tileKey)
  for (const left of LEFT_OUT_KEYS) {
    const parts = left.split(/\s+/)
    for (let i = 0; i + parts.length <= keys.length; i++) {
      if (parts.every((p, j) => keys[i + j] === p)) return true
    }
  }
  return false
}

/** The Tongan inside a lone *...* answer, or null. */
export function answerText(answer) {
  const m = String(answer ?? '').trim().match(/^\*([^*]+)\*$/)
  return m ? m[1].trim() : null
}

/** A Tongan answer made comparable with another (case, spacing and end marks aside). */
function sameAnswerKey(text) {
  return tonganKey(String(text ?? '').replace(/\*/g, '')).replace(/[.?!]+\s*$/, '').replace(/\s+/g, ' ').trim()
}

/** The answer split into tiles and its end mark: { words, end }. */
export function splitAnswer(text) {
  const words = String(text).trim().split(/\s+/)
  const last = words[words.length - 1]
  const m = last.match(END)
  const end = m ? m[0] : ''
  if (end) words[words.length - 1] = last.slice(0, -end.length)
  return { words: words.filter(Boolean), end }
}

/** Why an item is left out of the game, or null when it is kept. */
export function whyLeftOut(item) {
  const text = answerText(item.answer)
  if (text == null) return 'not one Tongan span'
  if (text.includes('/')) return 'slash'
  if (/\sor\s/i.test(` ${text} `)) return 'or'
  if (/[()[\]]/.test(text)) return 'brackets'
  if (/[.?!]\s+\S/.test(text)) return 'more than one sentence'
  const { words } = splitAnswer(text)
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) return 'length'
  if (Array.isArray(item.accept) && item.accept.some(a => sameAnswerKey(a) !== sameAnswerKey(text))) return 'second answer'
  if (/(^|\s)>\s/.test(String(item.prompt ?? ''))) return 'prompt note'
  if (holdsLeftOut(words)) return 'left-out word'
  return null
}

/** One kept item as a sentence card. */
function toSentence(item, chapter) {
  const answer = answerText(item.answer)
  const { words, end } = splitAnswer(answer)
  return { id: item.id, chapter, prompt: item.prompt, answer, words, end }
}

/** Every translate_to_tongan item of the book, with its lesson number. */
export function allItems(data = exercises) {
  const out = []
  for (const [ch, list] of Object.entries(data)) {
    for (const ex of list ?? []) {
      if (ex.type !== 'translate_to_tongan') continue
      for (const item of ex.items ?? []) out.push({ item, chapter: Number(ch) })
    }
  }
  return out.sort((a, b) => a.chapter - b.chapter)
}

/** The sentences the game plays, lesson by lesson in the book's order. */
export function buildSentences(data = exercises) {
  return allItems(data).filter(({ item }) => !whyLeftOut(item)).map(({ item, chapter }) => toSentence(item, chapter))
}

export const SENTENCES = buildSentences()

/** Kept sentences by lesson: [[lesson, count], ...], lessons with none left out. */
export const LESSON_COUNTS = (() => {
  const m = new Map()
  for (const s of SENTENCES) m.set(s.chapter, (m.get(s.chapter) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => a[0] - b[0])
})()

/**
 * The lesson menu: All lessons, then Up to Lesson N for every lesson that has
 * a sentence of its own (sentences from lessons 1 to N). The last lesson's
 * entry would hold every sentence, the same as All lessons, so it is not
 * offered twice.
 */
export const LESSON_MENU = (() => {
  const all = { id: ALL_LESSONS_ID, label: 'All lessons', upTo: null, cards: SENTENCES, count: SENTENCES.length }
  const last = LESSON_COUNTS.length ? LESSON_COUNTS[LESSON_COUNTS.length - 1][0] : 0
  const upTo = LESSON_COUNTS
    .filter(([n]) => n !== last)
    .map(([n]) => {
      const cards = SENTENCES.filter(s => s.chapter <= n)
      return { id: `upto:${n}`, label: `Up to Lesson ${n}`, short: `Lesson ${n}`, upTo: n, cards, count: cards.length }
    })
  return [all, ...upTo]
})()

const menuById = new Map(LESSON_MENU.map(c => [c.id, c]))

/** The lesson choice an id names, or All lessons for an id the menu does not offer. */
export function lessonChoice(id) {
  return menuById.get(id) ?? menuById.get(ALL_LESSONS_ID)
}
