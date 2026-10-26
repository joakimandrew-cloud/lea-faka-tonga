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
 *     ../shared/deck.js), matched whole after the deck's own normalising;
 *   - it is listed in stale-items.json and its prompt and answer still read
 *     exactly as listed (the data is older than the book; a re-sync that
 *     changes the text lets the item back in).
 * A sentence whose answer text an earlier lesson already has is not played twice.
 *
 * Tiles are the answer split at spaces. A comma stays on its word, as the book
 * prints it. The full stop, question mark or exclamation mark at the end is
 * not a tile: it is shown fixed after the answer line. Accents are kept as
 * printed. The first word is lower-cased on its tile and in the comparison, so
 * the capital does not point at the first tile; capitalFirst puts it back in
 * the answer line. Names keep their capitals; the fakauʻa is shown through okinafy, the
 * site-wide display rule, and stays an ASCII apostrophe in the deck.
 *
 * Clues: roles.json (built by build-roles.mjs, settled in role-overrides.json)
 * gives the role of each word in the book's order, or null where the book does
 * not settle it. `roles[k]` is the list for `orders[k]` (a second order's words
 * carry their own roles with them).
 */
import exercises from '../../data/book-exercises.json'
import vocabulary from '../../data/book-vocabulary.json'
import wordLists from '../../premium/data/word-lists.json'
import staleItems from './stale-items.json'
import secondOrders from './second-orders.json'
import roleData from './roles.json'
import { LEFT_OUT_OF_GAME, tonganKey } from '../shared/deck.js'

export const MIN_WORDS = 3
export const MAX_WORDS = 8

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
  if (words[0]) words[0] = words[0].toLowerCase()
  const last = words[words.length - 1]
  const m = last.match(END)
  const end = m ? m[0] : ''
  if (end) words[words.length - 1] = last.slice(0, -end.length)
  return { words: words.filter(Boolean), end }
}

/** A word with its first letter in capitals (the sentence's capital, shown in the answer line). */
export function capitalFirst(word) {
  const w = String(word ?? '')
  const i = [...w].findIndex(c => /\p{L}/u.test(c))
  if (i < 0) return w
  const cs = [...w]
  cs[i] = cs[i].toUpperCase()
  return cs.join('')
}

/** The sentence as the answer line prints it: capital, tiles, end mark. */
export function sentenceText(s, words = s.words) {
  return `${[s.capital ? capitalFirst(words[0]) : words[0], ...words.slice(1)].join(' ')}${s.end}`
}

/** True when the item is listed as stale and its text is still the listed text. */
export function isStale(item, list = staleItems.items) {
  const f = list?.[item.id]
  return !!f && f.prompt === item.prompt && f.answer === item.answer
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
  if (isStale(item)) return 'stale'
  return null
}

/** One kept item as a sentence card. */
function toSentence(item, chapter) {
  const answer = answerText(item.answer)
  const { words, end } = splitAnswer(answer)
  // orders[0] is the book's; the rest are the second orders listed for this id.
  const orders = [words]
  const base = roleData.items?.[item.id]
  const bookRoles = Array.isArray(base) && base.length === words.length ? base : words.map(() => null)
  const roles = [bookRoles]
  for (const perm of secondOrders.orders?.[item.id] ?? []) {
    const w = perm.map(i => words[i])
    if (!orders.some(o => o.join(' ') === w.join(' '))) {
      orders.push(w)
      roles.push(perm.map(i => bookRoles[i] ?? null))
    }
  }
  // `capital`: the book prints the first word with a capital (a few noun-phrase answers do not).
  const first = answer.trim().split(/\s+/)[0]
  return { id: item.id, chapter, prompt: item.prompt, answer, words, orders, roles, end, capital: first !== first.toLowerCase() }
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
  const seen = new Set()
  return allItems(data)
    .filter(({ item }) => !whyLeftOut(item))
    .filter(({ item }) => {
      const k = sameAnswerKey(item.answer)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .map(({ item, chapter }) => toSentence(item, chapter))
}

export const SENTENCES = buildSentences()

/** The clue labels the game can show, each with where its term comes from (roles.json). */
export const ROLE_LABELS = (roleData.labels ?? []).map(l => l.label)

/** Kept sentences by lesson: [[lesson, count], ...], lessons with none left out. */
export const LESSON_COUNTS = (() => {
  const m = new Map()
  for (const s of SENTENCES) m.set(s.chapter, (m.get(s.chapter) ?? 0) + 1)
  return [...m.entries()].sort((a, b) => a[0] - b[0])
})()

/**
 * The lessons, in the book's order, each with its own sentences (Andrew,
 * 2026-10-26: "have it in order of lessons"). Every game is one lesson; a
 * lesson with no kept sentence is not offered. `label` says Lesson, never
 * Chapter.
 */
export const LESSONS = LESSON_COUNTS.map(([n]) => {
  const cards = SENTENCES.filter(s => s.chapter === n)
  return { lesson: n, id: `lesson:${n}`, label: `Lesson ${n}`, cards, count: cards.length }
})

/** The first lesson with sentences (Lesson 1): where a new player starts. */
export const FIRST_LESSON = LESSONS.length ? LESSONS[0].lesson : null

const byLesson = new Map(LESSONS.map(l => [l.lesson, l]))

/** The lesson entry for a lesson number, or the first lesson for a number the game does not offer. */
export function lessonEntry(n) {
  return byLesson.get(Number(n)) ?? LESSONS[0]
}

/** The next lesson after `n` that has sentences, or null after the last. */
export function nextLesson(n) {
  const at = LESSONS.find(l => l.lesson > Number(n))
  return at ? at.lesson : null
}
