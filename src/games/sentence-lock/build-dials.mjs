/**
 * Sentence Lock: the dial options (plan 2026-10-27-sentence-lock-game, Step 2).
 *
 *   node src/games/sentence-lock/build-dials.mjs [--tsv [dir]]
 *
 * One entry for every sentence in the shared sentence bank, in bank order.
 * Each word of the sentence is one dial: its role label from the bank, the
 * book's word (`right`), and `options` = the right word plus up to three wrong
 * ones in a fixed seeded order (the game picks its own start position).
 *
 * Every Tongan string in dials.json comes from sentence-bank.json (words, the
 * tense and pronoun tables) or book-vocabulary.json. Nothing Tongan is typed
 * here: the only literals are English role labels, English vocabulary type
 * names and the English patterns that read the bank's English prompts.
 *
 * The rules (the `rules` list of dials.json carries the same text; each one is
 * enforced by dials.test.js):
 *   R1  same kind          R2a-R2j  never a second right answer
 *   R3  no spelling give-away    R4  data only    R5  dials that cannot be fair
 *
 * Two small local data files sit beside this one (made by local-data.mjs):
 * possessives.json (the book's Lesson 17 possessive tables) and equivalents.json
 * (pairs that are not wrong for each other). Their Tongan is copied, not typed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { toCard, tonganKey, contentWords, LEFT_OUT_OF_GAME } from '../shared/deck.js'
import { clashes, makeRng } from '../shared/fair.js'
import { okinafy } from '../../lib/okinafy.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../../..')
const ROOT = process.env.LFT_ROOT || '/Users/andrewjoakim/Desktop/Lea-Faka-Tonga'
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'))

export const MAX_WRONG = 3

/**
 * Options the book does not settle, dropped by row. The key is `<sentence id>#<dial index>`; each entry names the
 * bank sentence and word position the dropped option is copied from, so no Tongan is typed here
 * (finding 8a, queue item 45: noun + the question word of ch6-ex2-7 may fit "Which day of the month is this?").
 */
export const DROPPED_OPTIONS = {
  'ch42-ex2-6#3': [{ sentence: 'ch6-ex2-7', word: 4 }],
}

/** The rules as they stand in dials.json. */
export const RULES = [
  { id: 'R1', what: 'Same kind: a wrong option has the same role label as the right word. Sources in order: the bank\'s words with that role; for tense marker and pronoun the bank\'s tenseTable and pronounTable; for possessive the book\'s possessive tables (Lesson 17 lines 37 to 80, possessives.json); for verb, noun, adjective, modifier, time word and name also the matching entries of book-vocabulary.json. Words of the sentence\'s own lesson and earlier lessons come first; later lessons fill only when earlier ones run short.' },
  { id: 'R2a', what: 'No other tense marker of the same tense as the right one, and no two options of one tense, so the past markers never sit together on one dial. Where the English says "is/are/am" with a state and no "-ing" word ("is tired"), the present and perfect markers count as one tense, because the book glosses both as the state. Where the English is "is/are/am" + "-ing" with no future cue (no will, tomorrow, soon, going to ...), no future marker is offered, because the book renders such English with a future marker in places.' },
  { id: 'R2b', what: 'A pronoun option never has the same person as the subject the English names, unless the English itself marks the number or inclusiveness that rules it out ("(one person)", "(exclusive, three or more)", "(not including you)", "(two)", "(to a group)"). "You" without such a mark excludes every other second-person pronoun. The general "one" pronoun (the table row glossed "one") is never a wrong option where the English subject is "I" or "you", marked or not, because the book uses it for English "you" and "I" in general statements.' },
  { id: 'R2c', what: 'Another form of the same pronoun (the I forms) is a wrong option only where the pronoun table\'s book lines settle that it does not follow the right tense marker: the right word\'s line says which markers it follows ("after ...") and the option\'s line does not name that marker.' },
  { id: 'R2d', what: 'No option clashes with the right word under fair.js clashes() (shared content word, shared meaning item, same spelling, derived pair, confusable pair), and no two wrong options clash with each other. Pairs the book uses for the same English meaning, kept in equivalents.json beside the builder (the shared confusable-pairs.json is untouched), clash too.' },
  { id: 'R2e', what: 'No option equals the right word or another option after okinafy display and case-folding; an accent-only variant of the same word counts as equal.' },
  { id: 'R2f', what: 'No option whose meaning shares a content word with the sentence\'s English prompt (it could be the book\'s own word for that English word).' },
  { id: 'R2g', what: 'Every word on a dial except tense markers, pronouns and names has a meaning in the course vocabulary, so R2d and R2f could be run on it; a word without one is fixed, and a candidate without one is not offered. The lookup ignores acute accents and macrons, so a word and its vocabulary spelling match. A preposition the vocabulary gives no meaning (the one glossed "with") is still live: its options are checked against the English by R2f, small words such as \"with\" and \"from\" included, and against each other by R2d. A possessive is checked against the book\'s possessive tables instead (R2j).' },
  { id: 'R2h', what: 'Where the English says "a", "an" or "some" and the noun carries no final-vowel accent, the two articles the vocabulary glosses "a, some" and "the" (equivalents.json) are not wrong options for each other, because the book writes the English "a basket" with either. The article used only before one word class stays fair where its position rules it out.' },
  { id: 'R2i', what: 'A direction word (the directional particle role) is a dial only where the English marks the direction (come, toward, around, up, down, away, here). Where the English only names the action ("return"), no direction word is a sure wrong answer, so the word is fixed.' },
  { id: 'R2j', what: 'A possessive is a dial when the book\'s possessive tables (Lesson 17) have a row for it. Its options are rows of the same class (e-class or ho-class) with another person than the right word, whatever the number, and no option whose table gloss shares a content word with the English.' },
  { id: 'R3', what: 'No give-away by spelling. A tense marker option shows the form the book prints in that position (the bank\'s accented form before a one-syllable pronoun, the bare form otherwise). For every other word the option shows a form with the same accent state as the right word, taken from the bank or the vocabulary; a word with no such form is not offered. Trailing punctuation of the right word is copied onto the options. A pronoun that follows a word whose stress accent depends on the pronoun (the tense markers, and any word the bank prints accented before a one-syllable pronoun) is offered only with pronouns of the right word\'s number of vowels, so the accent on the word to its left never narrows the dial to one answer.' },
  { id: 'R4', what: 'Every option string comes from sentence-bank.json, book-vocabulary.json or the book\'s Lesson 17 possessive tables in possessives.json (apart from the trailing punctuation copied from the right word). Words in LEFT_OUT_OF_GAME never appear.' },
  { id: 'R5', what: 'A word whose role is null is fixed (shown in place, no dial; why "no label in the book"). A word with no fair wrong option is fixed too, with its reason.' },
]

// ---------------------------------------------------------------- spelling

const TRAIL = /[.,;:?!"]+$/
const stripAcute = w => String(w ?? '').normalize('NFD').replace(/́/g, '').normalize('NFC')
/** The word without its end punctuation. */
export const bare = w => String(w ?? '').replace(TRAIL, '')
export const trailOf = w => (String(w ?? '').match(TRAIL) ?? [''])[0]
/** True when the word carries an acute accent (the definitive accent), not a macron. */
export const hasAcute = w => /́/.test(String(w ?? '').normalize('NFD'))
/** A word made comparable: no end punctuation, no acute, one apostrophe, lower case. */
export const foldKey = w => tonganKey(stripAcute(bare(w)))
/** The table key of a word: no acute, no end punctuation, lower case (as build-sentence-bank's wordKey). */
export const tableKey = w => stripAcute(bare(w)).toLowerCase()
/** Vowels of a word (each vowel is a syllable in Tongan; "ou" has two). */
export function vowelCount(w) {
  return (String(w ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[aeiou]/g) ?? []).length
}
/** The display form the site shows, case-folded. */
export const shown = w => okinafy(String(w ?? '')).toLowerCase()
/**
 * Word-final macrons the book treats as the definitive accent (Ch 40:16): a final-macron form whose bare twin
 * (same letters, final vowel without its macron) is also a form of the same role in the bank or the vocabulary.
 * `pairs` is a list of [role, word]. Returns a predicate `hasAccent(text, role)`: an acute accent anywhere, or such a
 * final macron.
 */
export function accentTester(pairs) {
  const seen = new Set(pairs.map(([role, w]) => `${role}|${foldKey(w)}`))
  const finalMacronAccent = (w, role) => {
    const k = foldKey(w).normalize('NFD')
    if (!/[aeiou]\u0304$/.test(k)) return false
    return seen.has(`${role}|${k.replace(/\u0304$/, '').normalize('NFC')}`)
  }
  return (w, role) => hasAcute(w) || finalMacronAccent(w, role)
}
/** The accent predicate over the bank's words and the vocabulary's. */
export function accentTesterFor(bank, vocabulary) {
  return accentTester([
    ...bank.sentences.flatMap(s => s.words.map((w, i) => [s.roles[i], w])),
    ...Object.entries(VOCAB_TYPES).flatMap(([role, types]) => vocabulary.filter(v => types.includes(v.part_of_speech) && usableVocabWord(v.tongan)).map(v => [role, v.tongan])),
  ])
}
/** A fold key with the macrons taken off too: how a word is matched to its vocabulary entry (finding 8). */
export const lookupKey = k => String(k ?? '').normalize('NFD').replace(/\u0304/g, '').normalize('NFC')

// ---------------------------------------------------------------- English cues (findings 2, 3, 7)

/** English "is/are/am" + a state, with no "-ing" word: ("Siale is tired."). */
export function stateEnglish(english) {
  const e = String(english ?? '')
  return /\b(is|are|am)\b/i.test(e) && !/\b\w+ing\b/i.test(e)
}
const ENGLISH_CLAUSE_BREAK = /,\s*|\s+(?:for|because|but|and|if|when|so|that)\s+/i
/**
 * The clause of the sentence a word sits in (finding 2). A Tongan clause ends at a word with end punctuation
 * and starts after a conjunction; the English splits at commas and conjunctions. When the two counts agree, the
 * dial's own English clause is returned, otherwise the whole English (the count cannot be trusted).
 */
export function clauseEnglish(english, words, roles, index) {
  const starts = []
  let cur = -1
  let o = false
  words.forEach((w, i) => {
    if (roles[i] === 'conjunction') { o = false; return }
    if (!o) { cur++; starts.push([]); o = true }
    starts[cur].push(i)
    if (/[,;:]$/.test(String(w))) o = false
  })
  const mine = starts.findIndex(g => g.includes(index))
  const eng = String(english ?? '').split(ENGLISH_CLAUSE_BREAK).map(x => x.trim()).filter(Boolean)
  if (mine < 0 || eng.length !== starts.length) return String(english ?? '')
  return eng[mine]
}
const FUTURE_CUE = /\b(will|shall|tomorrow|later|soon|tonight|next|going to|about to|until|when)\b/i
/** English "is/are/am (adverb) -ing" with no future cue: ("Who is coming?"). */
export function progressiveEnglish(english) {
  const e = String(english ?? '')
  return /\b(is|are|am)\s+(?:\w+\s+)?\w+ing\b/i.test(e) && !FUTURE_CUE.test(e)
}
/** English that marks the direction a direction word has to show. */
export function directionCue(english) {
  return /\b(come|comes|came|coming|toward|towards|here|away|around|up|down|hither)\b/i.test(String(english ?? ''))
}
/** The pronoun-table row for the general "one" (glossed "one" in the book's line). */
export const isGeneralOne = row => /"one"|impersonal/i.test(String(row?.source ?? ''))
/** Every word of three or more letters, small words included (how a right word with no meaning is guarded). */
export const rawWords = text => String(text ?? '').toLowerCase().split(/[^a-z]+/).filter(w => w.length >= 3)
/** English "a", "an" or "some". */
export const aSomeEnglish = english => /\b(a|an|some)\b/i.test(String(english ?? ''))

function hashSeed(text) {
  let h = 2166136261
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0 }
  return h >>> 0
}

// ---------------------------------------------------------------- data

/** Vocabulary part_of_speech values that carry each role label (English names only). */
export const VOCAB_TYPES = {
  verb: ['verb', 'verb (intransitive)'],
  noun: ['noun', 'spatial noun'],
  adjective: ['adjective', 'compound adjective', 'adjective (color)'],
  modifier: ['adverb', 'postposed adverb', 'preposed modifier', 'modifier', 'postposed intensifier', 'postposed limiter', 'adjective/modifier'],
  'time word': ['time word'],
  name: ['month name'],
}
/** Roles whose options are checked by the tables or by being different names, not by a vocabulary meaning. */
export const NO_CARD_ROLES = new Set(['tense marker', 'pronoun', 'name', 'possessive'])
const LATE = 99 // supplemental words (chapter 0) carry no lesson: last resort

const firstLesson = source => Number((String(source).match(/Lesson (\d+)/) ?? [])[1] ?? LATE)

function afterList(source) {
  const m = String(source).match(/,\s*after ([^)]*)\)/)
  if (!m) return null
  return m[1].split(/,| and /).map(s => tableKey(s.trim())).filter(Boolean)
}

/** Reads what the builder needs. Everything else is derived from these files. */
export function loadSources() {
  const bank = readJson(path.join(app, 'src/games/shared/sentence-bank.json'))
  const vocabulary = readJson(path.join(app, 'src/data/book-vocabulary.json'))
  const wordLists = readJson(path.join(app, 'src/premium/data/word-lists.json'))
  const possessives = readJson(path.join(here, 'possessives.json'))
  const equivalents = readJson(path.join(here, 'equivalents.json'))
  return { bank, vocabulary, wordLists, possessives, equivalents }
}

/** The words the games leave out, as fold keys (read from the data by id). */
function leftOutKeys(vocabulary, wordLists) {
  return new Set([...(wordLists?.entries ?? []), ...vocabulary].filter(r => LEFT_OUT_OF_GAME.has(r.id)).map(r => foldKey(r.tongan)).filter(Boolean))
}

const usableVocabWord = t => /^[\p{L}'ʻ‘’ʼ̀-ͯ]+(?:-[\p{L}'ʻ‘’ʼ̀-ͯ]+)*$/u.test(String(t ?? ''))

// ---------------------------------------------------------------- English marks (R2b)

/** What the English prompt itself says about the subject's number and inclusiveness. */
export function englishMarks(english) {
  const e = String(english ?? '')
  let numbers = null
  if (/\(one person\)|\bto one person\b/i.test(e)) numbers = ['singular']
  else if (/three or more/i.test(e)) numbers = ['plural']
  else if (/\(two\)|\b(?:they|we|you) two\b|\(you two\)|\(we two/i.test(e)) numbers = ['dual']
  else if (/\bto a group\b/i.test(e)) numbers = ['dual', 'plural']
  let inclusive = null
  if (/\(exclusive|not including you|\bexclusive\b/i.test(e)) inclusive = false
  else if (/\(inclusive|including you/i.test(e)) inclusive = true
  return { numbers, inclusive }
}

/** True when pronoun row `row` could still be a right rendering of the English subject (person `person`, with `marks`). */
export function couldBeSubject(row, person, marks) {
  if (row.person !== person) return false
  if (marks.numbers && !marks.numbers.includes(row.number)) return false
  if (person === 1 && marks.inclusive !== null && row.inclusive !== null && row.inclusive !== marks.inclusive) return false
  return true
}

// ---------------------------------------------------------------- the builder

export function buildDials({ bank, vocabulary, wordLists, possessives, equivalents }) {
  const leftOut = leftOutKeys(vocabulary, wordLists)
  const hasAccent = accentTesterFor(bank, vocabulary)
  const tenseRows = bank.tenseTable.map(r => ({ ...r, key: tableKey(r.word), lesson: firstLesson(r.source) }))
  const tenseByKey = new Map(tenseRows.map(r => [r.key, r]))
  const pronounRows = bank.pronounTable.map(r => ({ ...r, key: tableKey(r.word), lesson: firstLesson(r.source), after: afterList(r.source) }))
  const pronounByKey = new Map(pronounRows.map(r => [r.key, r]))

  const possRows = (possessives?.rows ?? []).map(r => ({ ...r, key: foldKey(r.word) }))
  const possByKey = new Map(possRows.map(r => [r.key, r]))
  // Pairs that are not wrong for each other (equivalents.json), as sorted lookup-key pairs.
  const pk = (a, b) => { const x = lookupKey(foldKey(a)); const y = lookupKey(foldKey(b)); return x < y ? `${x}|${y}` : `${y}|${x}` }
  const sameMeaning = new Set((equivalents?.sameMeaning ?? []).map(p => pk(p.a.word, p.b.word)))
  const aSome = equivalents?.aSome ? pk(equivalents.aSome.a.word, equivalents.aSome.b.word) : null
  const equal = (aKey, bKey) => sameMeaning.has(pk(aKey, bKey))

  // Course cards for the clash and English tests: every vocabulary row, grammar words included.
  const cardsByKey = new Map()
  for (const v of vocabulary) {
    if (LEFT_OUT_OF_GAME.has(v.id) || /\(accent example\)/i.test(v.english ?? '')) continue
    const c = toCard(v)
    if (!c.meaning || !c.tongan) continue
    const k = lookupKey(foldKey(v.tongan))
    if (!cardsByKey.has(k)) cardsByKey.set(k, [])
    cardsByKey.get(k).push(c)
  }

  // Candidate pool per role: fold key -> { key, lesson, forms: [{ text, accent, source, bankFirst }] }
  const pool = new Map()
  const poolFor = role => { if (!pool.has(role)) pool.set(role, new Map()); return pool.get(role) }
  const addForm = (role, text, source, lesson, isBank) => {
    const k = foldKey(text)
    if (!k || leftOut.has(k)) return
    const m = poolFor(role)
    if (!m.has(k)) m.set(k, { key: k, lesson: LATE, forms: [] })
    const c = m.get(k)
    c.lesson = Math.min(c.lesson, lesson)
    const t = bare(text)
    if (!c.forms.some(f => f.text === t)) c.forms.push({ text: t, accent: hasAccent(t, role), source, bank: isBank })
  }
  for (const s of bank.sentences) {
    s.words.forEach((w, i) => {
      const role = s.roles[i]
      if (role) addForm(role, w, `bank ${s.id}`, s.lesson, true)
    })
  }
  for (const [role, types] of Object.entries(VOCAB_TYPES)) {
    for (const v of vocabulary) {
      if (!types.includes(v.part_of_speech) || LEFT_OUT_OF_GAME.has(v.id)) continue
      if (/\(accent example\)/i.test(v.english ?? '') || !usableVocabWord(v.tongan)) continue
      addForm(role, v.tongan, `vocabulary ${v.id}`, v.chapter > 0 ? v.chapter : LATE, false)
    }
  }
  // Order forms inside a candidate: bank forms first, in the order added (bank order).
  for (const m of pool.values()) for (const c of m.values()) c.forms.sort((a, b) => Number(b.bank) - Number(a.bank))

  // Bank forms of each word, any role, for the tense marker forms (R3) and the pronoun spellings.
  const bankForms = new Map() // fold key -> [{ text, accent, source, lesson, role }]
  for (const s of bank.sentences) {
    s.words.forEach((w, i) => {
      const k = foldKey(w)
      if (!bankForms.has(k)) bankForms.set(k, [])
      const t = bare(w)
      const list = bankForms.get(k)
      if (!list.some(f => f.text === t && f.role === s.roles[i])) list.push({ text: t, accent: hasAcute(t), source: `bank ${s.id}`, lesson: s.lesson, role: s.roles[i] })
    })
  }

  // Words whose stress accent depends on a one-syllable pronoun after them (finding 1): the bank prints them accented there.
  const stressKeys = new Set()
  for (const s of bank.sentences) {
    s.words.forEach((w, i) => {
      if (i > 0 && s.roles[i] === 'pronoun' && vowelCount(w) === 1 && hasAcute(s.words[i - 1])) stressKeys.add(foldKey(s.words[i - 1]))
    })
  }

  const cardsOf = k => cardsByKey.get(lookupKey(k)) ?? []
  const anyClash = (aKey, bKey) => {
    const a = cardsOf(aKey)
    const b = cardsOf(bKey)
    return a.some(x => b.some(y => clashes(x, y) || clashes(y, x)))
  }

  const bankById = new Map(bank.sentences.map(x => [x.id, x]))
  const sentences = []
  for (const s of bank.sentences) {
    const engWords = new Set(contentWords(s.english))
    const dials = s.words.map((right, index) => buildDial(s, right, index, engWords))
    sentences.push({ id: s.id, lesson: s.lesson, english: s.english, words: [...s.words], dials })
  }

  function fixedDial(s, index, right, role, why) {
    return { index, role, right, options: [right], sources: [`bank ${s.id}`], fixed: true, why }
  }

  function buildDial(s, right, index, engWords) {
    const role = s.roles[index]
    if (role === null || role === undefined) return fixedDial(s, index, right, null, 'no label in the book')
    const rKey = foldKey(right)
    const trail = trailOf(right)
    const rng = makeRng(hashSeed(`${s.id}#${index}`))
    const tally = {}
    const rule = (name, n = 1) => { tally[name] = (tally[name] ?? 0) + n }

    const dropped = new Set((DROPPED_OPTIONS[`${s.id}#${index}`] ?? []).map(x => foldKey(bankById.get(x.sentence).words[x.word])))
    let picks // [{ text, source }]
    let considered = 0

    if (role === 'tense marker') {
      const rRow = tenseByKey.get(tableKey(right))
      if (!rRow) return fixedDial(s, index, right, role, "the book's tense table has no row for this word")
      const next = s.words[index + 1]
      const needAccent = Boolean(next) && s.roles[index + 1] === 'pronoun' && vowelCount(next) === 1
      const state = stateEnglish(clauseEnglish(s.english, s.words, s.roles, index))
      const noFuture = progressiveEnglish(s.english) && rRow.tense !== 'future'
      const group = t => (state && (t === 'present' || t === 'perfect') ? 'present' : t)
      const byTense = new Map()
      for (const r of tenseRows) {
        if (group(r.tense) === group(rRow.tense)) { rule('same tense'); continue }
        const forms = (bankForms.get(r.key) ?? []).filter(f => f.role === 'tense marker')
        if (!forms.length) { rule('no bank form'); continue }
        const accented = forms.find(f => f.accent)
        const plain = forms.find(f => !f.accent)
        const form = needAccent ? (accented ?? plain) : plain
        if (!form) { rule('no bank form'); continue }
        const rv = rng()
        if (noFuture && r.tense === 'future') { rule('future'); continue }
        if (!byTense.has(group(r.tense))) byTense.set(group(r.tense), [])
        byTense.get(group(r.tense)).push({ row: r, form, pref: needAccent && accented ? 0 : 1, r: rv })
      }
      const per = []
      for (const list of byTense.values()) {
        considered += list.length
        list.sort((a, b) => a.pref - b.pref || a.row.lesson - b.row.lesson || a.r - b.r)
        per.push(list[0])
      }
      per.sort((a, b) => Number(a.row.lesson > s.lesson) - Number(b.row.lesson > s.lesson) || a.row.lesson - b.row.lesson || a.r - b.r)
      picks = per.slice(0, MAX_WRONG).map(p => ({ text: p.form.text, source: `tenseTable ${p.row.word} (Lesson ${p.row.lesson}); ${p.form.source}` }))
    } else if (role === 'pronoun') {
      const rRow = pronounByKey.get(tableKey(right))
      if (!rRow) return fixedDial(s, index, right, role, "the book's pronoun table has no row for this word")
      const who = s.tags.who
      const isSubject = Boolean(who) && who.kind === 'pronoun' && who.index === index
      const person = isSubject ? who.person : rRow.person
      const marks = isSubject ? englishMarks(s.english) : { numbers: null, inclusive: null }
      const prev = index > 0 ? tableKey(s.words[index - 1]) : null
      const stress = index > 0 && stressKeys.has(foldKey(s.words[index - 1]))
      const cands = []
      for (const row of pronounRows) {
        if (row === rRow) continue
        const sameFeatures = row.person === rRow.person && row.number === rRow.number && row.inclusive === rRow.inclusive
        let ok = true
        if (couldBeSubject(row, person, marks)) {
          // R2c: the same pronoun in another form, only where the book's lines settle it
          const settled = sameFeatures && prev && rRow.after && rRow.after.includes(prev) && row.after && !row.after.includes(prev)
          if (!settled) { rule('same person'); ok = false }
        }
        if (ok && foldKey(row.word) === rKey) { rule('same spelling'); ok = false }
        if (!ok) continue
        const rv = rng()
        if (stress && vowelCount(row.word) !== vowelCount(bare(right))) { rule('stress accent'); continue }
        if ((rRow.person === 1 || rRow.person === 2) && !isGeneralOne(rRow) && isGeneralOne(row)) { rule('general one'); continue }
        const forms = (bankForms.get(row.key) ?? []).filter(f => f.role === 'pronoun')
        const form = forms[0] ?? { text: row.word, source: `pronounTable ${row.word}` }
        cands.push({ row, form, source: forms[0] ? `${form.source}; pronounTable ${row.word} (Lesson ${row.lesson})` : `pronounTable ${row.word} (Lesson ${row.lesson})`, r: rv })
      }
      considered = cands.length
      cands.sort((a, b) => Number(a.row.lesson > s.lesson) - Number(b.row.lesson > s.lesson)
        || (a.row.lesson > s.lesson ? a.row.lesson - b.row.lesson : 0)
        || Number(a.row.number !== rRow.number) - Number(b.row.number !== rRow.number)
        || a.r - b.r)
      picks = []
      const seen = new Set([shown(bare(right)), foldKey(right)])
      for (const c of cands) {
        if (picks.length >= MAX_WRONG) break
        if (seen.has(shown(c.form.text)) || seen.has(foldKey(c.form.text))) { rule('same spelling'); continue }
        seen.add(shown(c.form.text)); seen.add(foldKey(c.form.text))
        picks.push({ text: c.form.text, source: c.source })
      }
    } else if (role === 'possessive') {
      const rRow = possByKey.get(rKey)
      if (!rRow) return fixedDial(s, index, right, role, "the book's possessive tables (Lesson 17) have no row for this word")
      const want = hasAcute(right)
      const cands = []
      for (const row of possRows) {
        considered++
        if (row === rRow) continue
        if (row.class !== rRow.class) { rule('other class'); continue }
        if (row.person === rRow.person) { rule('same person'); continue }
        if (contentWords(row.meaning).some(w => engWords.has(w))) { rule('in the English'); continue }
        const bankF = (bankForms.get(row.key) ?? []).filter(f => f.role === 'possessive' && f.accent === want)[0]
        const form = bankF ?? (want ? null : { text: row.word, source: `possessives ${row.source}` })
        if (!form) { rule('accent'); continue }
        cands.push({ row, form, r: rng() })
      }
      cands.sort((a, b) => a.r - b.r)
      picks = []
      const seen = new Set([shown(bare(right)), rKey])
      for (const c of cands) {
        if (picks.length >= MAX_WRONG) break
        if (seen.has(shown(c.form.text)) || seen.has(c.row.key)) { rule('same spelling'); continue }
        seen.add(shown(c.form.text)); seen.add(c.row.key)
        picks.push({ text: c.form.text, source: `${c.form.source}; possessives ${c.row.source}` })
      }
    } else {
      if (role === 'directional particle' && !directionCue(s.english)) return fixedDial(s, index, right, role, 'the English names no direction, so no direction word is a sure wrong answer')
      const needCards = !NO_CARD_ROLES.has(role)
      const rCards = cardsOf(rKey)
      const rightUnchecked = role === 'preposition' && !rCards.length
      const rawEnglish = new Set(rawWords(s.english))
      const nounAccented = s.words.some((w, j) => j > index && s.roles[j] === 'noun' && hasAcute(w))
      if (needCards && !rCards.length && !rightUnchecked) return fixedDial(s, index, right, role, 'the course vocabulary gives this word no meaning to check options against')
      const want = hasAccent(right, role)
      const m = pool.get(role) ?? new Map()
      const cands = []
      for (const c of m.values()) {
        considered++
        if (c.key === rKey) { rule('same word'); continue }
        if (dropped.has(c.key)) { rule('not settled by the book'); continue }
        if (needCards) {
          const cc = cardsOf(c.key)
          if (!cc.length) { rule('no vocabulary meaning'); continue }
          if (anyClash(rKey, c.key)) { rule('clash'); continue }
          if (cc.some(card => card.words.some(w => engWords.has(w)))) { rule('in the English'); continue }
          if (rightUnchecked && cc.some(card => rawWords(card.english).some(w => rawEnglish.has(w)))) { rule('in the English (small words too)'); continue }
        }
        const form = c.forms.find(f => f.accent === want)
        if (!form) { rule('accent'); continue }
        const rv = rng()
        if (lookupKey(c.key) === lookupKey(rKey)) { rule('same word'); continue }
        if (equal(rKey, c.key)) { rule('same meaning'); continue }
        if (role === 'article' && aSome && pk(rKey, c.key) === aSome && aSomeEnglish(s.english) && !nounAccented) { rule('a or some'); continue }
        cands.push({ c, form, r: rv })
      }
      cands.sort((a, b) => Number(a.c.lesson > s.lesson) - Number(b.c.lesson > s.lesson)
        || (a.c.lesson > s.lesson ? a.c.lesson - b.c.lesson : 0)
        || Number(!a.form.source.startsWith('bank')) - Number(!b.form.source.startsWith('bank'))
        || a.r - b.r)
      picks = []
      const seen = new Set([shown(bare(right)), rKey, lookupKey(rKey)])
      for (const p of cands) {
        if (picks.length >= MAX_WRONG) break
        const text = p.form.text
        if (seen.has(shown(text)) || seen.has(p.c.key) || seen.has(lookupKey(p.c.key))) { rule('same spelling'); continue }
        if (picks.some(q => equal(q.key, p.c.key) || (needCards && anyClash(q.key, p.c.key)))) { rule('clash with another option'); continue }
        seen.add(shown(text)); seen.add(p.c.key); seen.add(lookupKey(p.c.key))
        picks.push({ text, key: p.c.key, source: `${p.form.source} (Lesson ${p.c.lesson === LATE ? 'none' : p.c.lesson})` })
      }
    }

    if (!picks.length) {
      const reasons = Object.entries(tally).map(([k, n]) => `${k} ${n}`).join(', ')
      if (considered <= 1) return fixedDial(s, index, right, role, 'no other word of this kind in the bank or the vocabulary')
      return fixedDial(s, index, right, role, `no fair wrong option (${considered} words of this kind looked at${reasons ? `; ruled out: ${reasons}` : ''})`)
    }
    const all = [{ text: right, source: `bank ${s.id}` }, ...picks.map(p => ({ text: p.text + trail, source: p.source }))]
    // a fixed seeded order
    const order = all.map((x, i) => ({ x, r: rng(), i })).sort((a, b) => a.r - b.r || a.i - b.i).map(o => o.x)
    return { index, role, right, options: order.map(o => o.text), sources: order.map(o => o.source), fixed: false, why: null }
  }

  return {
    _note: 'The Sentence Lock dials: for every sentence in the shared sentence bank, one dial per Tongan word with its role label, the book\'s word (right) and the options in a fixed order (the right word plus up to three wrong ones of the same kind). `sources` names where each option comes from, parallel to `options`. Built by build-dials.mjs from sentence-bank.json and book-vocabulary.json under the rules below; every Tongan string comes from those two files. Do not edit by hand; rebuild.',
    rules: RULES,
    sentences,
  }
}

// ---------------------------------------------------------------- output

const stable = obj => `${JSON.stringify({ ...obj, sentences: undefined }, null, 2).replace(/\n}$/, ',')}\n  "sentences": [\n${obj.sentences.map(s => '    ' + JSON.stringify(s)).join(',\n')}\n  ]\n}\n`

export function dialsToJson(obj) { return stable(obj) }

const tsvCell = v => String(v ?? '').replace(/[\t\r\n]+/g, ' ')

export function dialsToTsv(obj, lessonOnly = null) {
  const head = ['lesson', 'id', 'english', 'tongan', 'position', 'role', 'right', 'wrong_1', 'source_1', 'wrong_2', 'source_2', 'wrong_3', 'source_3', 'fixed', 'why']
  const rows = [head]
  for (const s of obj.sentences) {
    if (lessonOnly !== null && s.lesson !== lessonOnly) continue
    const sentence = okinafy(s.words.join(' '))
    for (const d of s.dials) {
      const wrong = d.options.map((o, i) => ({ o, src: d.sources[i] })).filter(x => x.o !== d.right)
      const cells = [s.lesson, s.id, s.english, sentence, d.index + 1, d.role ?? '(no label)', okinafy(d.right)]
      for (let k = 0; k < MAX_WRONG; k++) cells.push(wrong[k] ? okinafy(wrong[k].o) : '', wrong[k] ? wrong[k].src : '')
      cells.push(d.fixed ? 'fixed' : '', d.why ?? '')
      rows.push(cells)
    }
  }
  return rows.map(r => r.map(tsvCell).join('\t')).join('\n') + '\n'
}

export function summarise(obj) {
  const lines = []
  const dials = obj.sentences.flatMap(s => s.dials.map(d => ({ ...d, lesson: s.lesson })))
  lines.push(`sentences: ${obj.sentences.length}; dials: ${dials.length}; fixed: ${dials.filter(d => d.fixed).length}`)
  const why = {}
  for (const d of dials.filter(x => x.fixed)) {
    const k = d.why.replace(/\(\d+ words.*$/, '(...)')
    why[k] = (why[k] ?? 0) + 1
  }
  lines.push('fixed dials by why:')
  for (const [k, n] of Object.entries(why).sort((a, b) => b[1] - a[1])) lines.push(`  ${n}\t${k}`)
  const live = dials.filter(d => !d.fixed)
  const short = live.filter(d => d.options.length - 1 < MAX_WRONG)
  const byRole = {}
  for (const d of short) { byRole[d.role] ??= { 1: 0, 2: 0 }; byRole[d.role][d.options.length - 1]++ }
  lines.push(`live dials: ${live.length}; with fewer than three wrong options: ${short.length}`)
  for (const [r, c] of Object.entries(byRole).sort((a, b) => (b[1][1] + b[1][2]) - (a[1][1] + a[1][2]))) lines.push(`  ${r}: ${c[1]} with one wrong option, ${c[2]} with two`)
  lines.push('per lesson (dials / fixed / live with fewer than three wrong):')
  const lessons = [...new Set(dials.map(d => d.lesson))].sort((a, b) => a - b)
  lines.push(lessons.map(l => {
    const ds = dials.filter(d => d.lesson === l)
    return `L${l}: ${ds.length}/${ds.filter(d => d.fixed).length}/${ds.filter(d => !d.fixed && d.options.length - 1 < MAX_WRONG).length}`
  }).join('  '))
  return lines.join('\n')
}

function main() {
  const obj = buildDials(loadSources())
  fs.writeFileSync(path.join(here, 'dials.json'), dialsToJson(obj))
  console.log(summarise(obj))
  const at = process.argv.indexOf('--tsv')
  if (at > 0) {
    const arg = process.argv[at + 1]
    const dir = arg && !arg.startsWith('--') ? path.resolve(arg) : path.join(ROOT, 'reviews/sentence-lock-2026-10-27')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'dials-all.tsv'), dialsToTsv(obj), 'utf8')
    fs.writeFileSync(path.join(dir, 'dials-lesson-01.tsv'), dialsToTsv(obj, 1), 'utf8')
    console.log(`tsv: ${path.join(dir, 'dials-all.tsv')} and dials-lesson-01.tsv`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
