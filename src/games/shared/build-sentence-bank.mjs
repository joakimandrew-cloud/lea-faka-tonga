/**
 * The shared sentence bank (plan 2026-10-27-three-more-games, Step 1).
 *
 *   node src/games/shared/build-sentence-bank.mjs [--tsv <path>]
 *
 * One entry for every sentence Sentence Tiles keeps (the deck's own list, read
 * through Vite so the two can never differ), each with the English prompt, the
 * Tongan words as the deck holds them (ASCII apostrophe), the per-word roles
 * from ../sentence-tiles/roles.json, and three tags:
 *
 *   tense:    { word, index, tense }  the word at a position roles.json labels
 *             "tense marker", and the tense the book gives that word (table below).
 *   negation: { word, index }         the word at a position labelled "negative".
 *   who:      { word, index, kind, person, number, inclusive, rule }
 *             the subject. A pronoun gets person and number from the book's own
 *             pronoun table (below); a noun or name subject has no pronoun to
 *             look up, so its person and number stay null.
 *
 * A tag the book does not settle is null; the entry's `notes` say why where a
 * sentence has more than one candidate. Nothing here is a Tongan sentence: the
 * words come from the deck, and the only Tongan typed in this file is the
 * marker and pronoun words of the two tables, each with the book line it
 * stands on (Lesson and line number in book/Chapter-NN.md).
 *
 * roles.json carries no "subject" label. The subject is therefore found by the
 * rules in RULES, each a position the book's own lessons settle; a sentence
 * none of them reaches gets who: null.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../../..')
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'))

/** A word made comparable with a table row: lower case, no definitive acute, no end punctuation. */
export function wordKey(word) {
  return String(word ?? '')
    .normalize('NFD')
    .replace(/́/g, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,;:?!"]+$/, '')
}

/** Tense marker word -> the tense the book gives it. `source` = Lesson and line of the book. */
export const TENSE_TABLE = [
  { word: "na'a", tense: 'past', source: 'Lesson 1 line 181 (Words to Learn: past tense marker); Lesson 2 line 91' },
  { word: "na'e", tense: 'past', source: 'Lesson 1 line 60 (second past marker); Lesson 9 lines 59 and 68' },
  { word: "'oku", tense: 'present', source: 'Lesson 2 line 92 and line 293 (present tense marker)' },
  { word: 'kuo', tense: 'perfect', source: 'Lesson 2 line 93 and line 295 (perfect tense marker)' },
  { word: 'te', tense: 'future', source: 'Lesson 2 line 94 and line 294 (future tense marker)' },
  { word: "'e", tense: 'future', source: 'Lesson 2 line 41 (second future marker); Lesson 9 lines 60 and 69' },
]

/**
 * Pronoun word -> person and number. `inclusive` is true or false for the
 * first-person dual and plural only (the book's table splits "we" into
 * including you or not), null elsewhere.
 */
export const PRONOUN_TABLE = [
  { word: 'ku', person: 1, number: 'singular', inclusive: null, source: 'Lesson 1 lines 72-73; Lesson 2 line 246 (I, after na\'a)' },
  { word: 'ou', person: 1, number: 'singular', inclusive: null, source: 'Lesson 2 line 246 (I, after \'oku)' },
  { word: 'u', person: 1, number: 'singular', inclusive: null, source: 'Lesson 2 line 246 (I, after kuo and te)' },
  { word: 'kau', person: 1, number: 'singular', inclusive: null, source: 'Lesson 51 line 104 (I, as the first word of a sentence)' },
  { word: 'au', person: 1, number: 'singular', inclusive: null, source: 'Lesson 5 line 164 (I, postposed); Lesson 14 line 208' },
  { word: 'ma', person: 1, number: 'dual', inclusive: false, source: 'Lesson 2 line 246 (we two, not you); Lesson 51 line 82' },
  { word: 'mau', person: 1, number: 'plural', inclusive: false, source: 'Lesson 2 line 246 (we, not you, 3+)' },
  { word: 'te', person: 1, number: 'singular', inclusive: true, source: 'Lesson 2 line 247 and line 253 ("one", the impersonal singular)' },
  { word: 'ta', person: 1, number: 'dual', inclusive: true, source: 'Lesson 2 line 247 (we two, including you)' },
  { word: 'tau', person: 1, number: 'plural', inclusive: true, source: 'Lesson 2 line 247 (we, including you, 3+)' },
  { word: 'ke', person: 2, number: 'singular', inclusive: null, source: 'Lesson 1 lines 72-73; Lesson 2 line 248 (you, one person)' },
  { word: 'mo', person: 2, number: 'dual', inclusive: null, source: 'Lesson 2 line 248 (you two)' },
  { word: 'mou', person: 2, number: 'plural', inclusive: null, source: 'Lesson 2 line 248; Lesson 5 line 40 (you, 3+)' },
  { word: 'ne', person: 3, number: 'singular', inclusive: null, source: 'Lesson 2 line 249 (he, she, it)' },
  { word: 'na', person: 3, number: 'dual', inclusive: null, source: 'Lesson 2 line 249 and line 306 (they two)' },
  { word: 'nau', person: 3, number: 'plural', inclusive: null, source: 'Lesson 2 line 249 (they, 3+)' },
  { word: 'ia', person: 3, number: 'singular', inclusive: null, source: 'Lesson 5 line 166 (he, she, postposed)' },
]

/** Where the subject is found. Every rule is a position the book states. */
export const RULES = [
  { id: 'A', what: 'a pronoun straight after a tense marker', source: 'Lesson 1 line 75 and Lesson 2 line 251 (the pronoun goes after the tense marker, before the verb)' },
  { id: 'B', what: "a pronoun after 'ikai, 'oua or te'eki and the linking te, or na'a after 'oua", source: "Lesson 9 line 15 ('ikai te + pronoun); Lesson 5 line 79 ('oua te + pronoun); Lesson 22 line 72 (te'eki te + pronoun); Lesson 5 line 112 ('oua na'a in place of 'oua te); Lesson 23 line 109 ('Oku totonu ke 'oua na'á ke fakapikopiko)" },
  { id: 'C', what: 'a pronoun straight after the subordinator ke (used only when no other rule found a subject)', source: 'Lesson 23 line 23 (the second ke is the pronoun "you")' },
  { id: 'D', what: "a pronoun straight after the agent marker 'e", source: "Lesson 19 line 201 (a subject placed after a transitive verb takes 'e) and line 204" },
  { id: 'E', what: 'kau as the first word of the sentence', source: 'Lesson 51 line 104' },
  { id: 'F', what: 'ko + a name or noun + the postposed pronoun au', source: 'Lesson 14 lines 208 and 211 (Ko Sione au)' },
  { id: 'G', what: "a name or noun straight after the agent marker 'e (an article may sit between)", source: "Lesson 19 line 201 (the subject takes 'e after a transitive verb)" },
  { id: 'H', what: "a name straight after the focus marker 'a, in a sentence with a tense marker and no agent marker 'e", source: "Lesson 15 line 29 (Tense Marker + Verb + 'a + Noun Subject) and line 43 ('a + proper noun = noun subject of a verb with no object)" },
]

const TENSE_BY_WORD = new Map(TENSE_TABLE.map(r => [r.word, r]))
const PRONOUN_BY_WORD = new Map(PRONOUN_TABLE.map(r => [r.word, r]))
const NOUN_ROLES = new Set(['name', 'noun'])

/** The tags and notes for one sentence: `sentence` = { words }, `roles` = one label or null per word. */
export function tagSentence(sentence, roles) {
  const { words } = sentence
  const notes = []
  const roleAt = i => (i >= 0 && i < roles.length ? roles[i] : null)
  const wordAt = i => (i >= 0 && i < words.length ? words[i] : null)
  const used = { tense: new Set(), pronoun: new Set() }

  // tense
  const tmAt = roles.map((r, i) => (r === 'tense marker' ? i : -1)).filter(i => i >= 0)
  let tense = null
  if (tmAt.length) {
    const rows = tmAt.map(i => TENSE_BY_WORD.get(wordKey(words[i])) ?? null)
    if (rows.every(Boolean) && new Set(rows.map(r => r.tense)).size === 1) {
      tense = { word: words[tmAt[0]], index: tmAt[0], tense: rows[0].tense }
      rows.forEach(r => used.tense.add(r.word))
    } else if (rows.every(Boolean)) {
      notes.push(`two tense markers, ${tmAt.map((i, k) => `${words[i]} (${rows[k].tense})`).join(' and ')}: tense left null`)
      rows.forEach(r => used.tense.add(r.word))
    } else {
      notes.push(`tense marker not in the book's table: ${tmAt.filter((i, k) => !rows[k]).map(i => words[i]).join(', ')}`)
    }
  }

  // negation
  const ngAt = roles.findIndex(r => r === 'negative')
  const negation = ngAt >= 0 ? { word: words[ngAt], index: ngAt } : null

  // who
  const hasAgent = roles.includes('agent marker')
  const hasTense = tmAt.length > 0
  // Candidates by kind. A pronoun subject beats a noun subject (Lesson 15 line 15: with a
  // pronoun subject the pronoun sits between the tense marker and the verb, so a name
  // after 'a is then an object); an agent-marked noun beats a focus-marked name;
  // the subordinator rule C is the last resort.
  const pronounFound = []
  const agentNoun = []
  const focusName = []
  const afterKe = []
  const asPronoun = (i, rule) => {
    const row = PRONOUN_BY_WORD.get(wordKey(words[i]))
    return row ? { rule, index: i, kind: 'pronoun', row, key: `${row.person}/${row.number}/${row.inclusive}` } : null
  }
  roles.forEach((r, i) => {
    if (r === 'pronoun') {
      const prev = roleAt(i - 1)
      const prev2 = roleAt(i - 2)
      let c = null
      if (prev === 'tense marker') c = asPronoun(i, 'A')
      else if (prev === null && (prev2 === 'negative' || prev2 === 'prohibition marker')) c = asPronoun(i, 'B')
      else if (prev === null && prev2 === 'aspect marker' && wordKey(wordAt(i - 2)) === "te'eki") c = asPronoun(i, 'B')
      else if (prev === 'agent marker') c = asPronoun(i, 'D')
      else if (i === 0 && wordKey(words[i]) === 'kau') c = asPronoun(i, 'E')
      else if (prev && NOUN_ROLES.has(prev) && prev2 === 'identification marker' && i === words.length - 1 && wordKey(words[i]) === 'au') c = asPronoun(i, 'F')
      else if (prev === 'subordinator') {
        const k = asPronoun(i, 'C')
        if (k) afterKe.push(k)
      }
      if (c) pronounFound.push(c)
    }
    if (r === 'agent marker') {
      let j = i + 1
      while (roleAt(j) === 'article') j++
      if (NOUN_ROLES.has(roleAt(j))) agentNoun.push({ rule: 'G', index: j, kind: roleAt(j), row: null, key: wordKey(words[j]) })
    }
    if (r === 'focus marker' && hasTense && !hasAgent && roleAt(i + 1) === 'name') {
      const compound = roleAt(i + 2) === 'preposition' && wordKey(wordAt(i + 2)) === 'mo' && NOUN_ROLES.has(roleAt(i + 3))
      focusName.push({ rule: 'H', index: i + 1, kind: 'name', row: null, key: wordKey(words[i + 1]), compound })
    }
  })
  const chosen = [pronounFound, agentNoun, focusName, afterKe].find(list => list.length) ?? []
  let who = null
  if (chosen.length) {
    const keys = new Set(chosen.map(c => c.key))
    const first = chosen[0]
    if (chosen.some(c => c.compound)) {
      notes.push(`compound subject (${words[first.index]} and another name): who left null`)
    } else if (keys.size > 1) {
      notes.push(`two different subjects (${chosen.map(c => words[c.index]).join(', ')}): who left null`)
    } else {
      who = {
        word: words[first.index],
        index: first.index,
        kind: first.kind,
        person: first.row ? first.row.person : null,
        number: first.row ? first.row.number : null,
        inclusive: first.row ? first.row.inclusive : null,
        rule: first.rule,
      }
      if (first.row) used.pronoun.add(first.row.word)
      if (first.row && first.row.number === 'dual') notes.push('dual pronoun: the English may name one person or more than two (Lesson 51 line 82)')
    }
  } else if (roles.includes('pronoun')) {
    notes.push('a pronoun the rules do not take as the subject (object, emphatic or idiom): who left null')
  }

  return { tags: { tense, negation, who }, notes, used }
}

/** The whole bank from the deck's sentences and roles.json's `items`. */
export function buildBank(sentences, roleItems) {
  const usedTense = new Set()
  const usedPronoun = new Set()
  const entries = sentences.map(s => {
    const roles = roleItems[s.id]
    const { tags, notes, used } = tagSentence(s, roles)
    used.tense.forEach(w => usedTense.add(w))
    used.pronoun.forEach(w => usedPronoun.add(w))
    return { id: s.id, lesson: s.chapter, english: s.prompt, words: [...s.words], roles: [...roles], tags, notes }
  })
  return {
    entries,
    unusedTense: TENSE_TABLE.map(r => r.word).filter(w => !usedTense.has(w)),
    unusedPronoun: PRONOUN_TABLE.map(r => r.word).filter(w => !usedPronoun.has(w)),
  }
}

async function loadDeck() {
  const { createServer } = await import('vite')
  const server = await createServer({ root: app, configFile: false, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } })
  try {
    const deck = await server.ssrLoadModule(path.join(here, '../sentence-tiles/deck.js'))
    const oki = await server.ssrLoadModule(path.join(app, 'src/lib/okinafy.js'))
    return {
      sentences: deck.SENTENCES.map(s => ({ id: s.id, chapter: s.chapter, prompt: s.prompt, words: [...s.words], reading: oki.okinafy(deck.sentenceText(s)) })),
    }
  } finally {
    await server.close()
  }
}

function tsvCell(v) {
  return String(v ?? '').replace(/[\t\r\n]+/g, ' ')
}

function writeTsv(file, bank, readings) {
  const head = ['id', 'lesson', 'english', 'tongan', 'tense_word', 'tense', 'negation_word', 'who_word', 'person', 'number', 'who_kind', 'who_rule', 'notes']
  const rows = [head]
  for (const e of bank.entries) {
    const t = e.tags
    rows.push([
      e.id, e.lesson, e.english, readings.get(e.id),
      t.tense?.word ?? '', t.tense?.tense ?? '', t.negation?.word ?? '',
      t.who?.word ?? '', t.who?.person ?? '', t.who?.number ?? '',
      t.who?.kind ?? '', t.who?.rule ?? '', e.notes.join('; '),
    ])
  }
  const lines = rows.map(r => r.map(tsvCell).join('\t'))
  lines.push('', '# MAPPING TABLES (every tag in the rows above comes from these)', '')
  lines.push(['tense marker', 'tense', 'book source', 'used in the bank'].join('\t'))
  for (const r of TENSE_TABLE) lines.push([r.word, r.tense, r.source, bank.unusedTense.includes(r.word) ? 'NOT USED' : 'used'].join('\t'))
  lines.push('', ['pronoun', 'person', 'number', 'inclusive', 'book source', 'used in the bank'].join('\t'))
  for (const r of PRONOUN_TABLE) lines.push([r.word, r.person, r.number, r.inclusive ?? '', r.source, bank.unusedPronoun.includes(r.word) ? 'NOT USED' : 'used'].join('\t'))
  lines.push('', ['who rule', 'what', 'book source'].join('\t'))
  for (const r of RULES) lines.push([r.id, r.what, r.source].join('\t'))
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, lines.join('\n') + '\n')
}

async function main() {
  const { sentences } = await loadDeck()
  const roleItems = readJson(path.join(here, '../sentence-tiles/roles.json')).items
  const bank = buildBank(sentences, roleItems)
  const out = [
    '{',
    '  "_note": "The shared sentence bank: every sentence Sentence Tiles keeps, with its words, roles and the tags tense, negation and who. Built by build-sentence-bank.mjs from the deck and roles.json; every tag word comes from the book (the tables below carry the book line). Do not edit by hand; rebuild.",',
    `  "tenseTable": ${JSON.stringify(TENSE_TABLE)},`,
    `  "pronounTable": ${JSON.stringify(PRONOUN_TABLE)},`,
    `  "rules": ${JSON.stringify(RULES)},`,
    `  "unusedTenseRows": ${JSON.stringify(bank.unusedTense)},`,
    `  "unusedPronounRows": ${JSON.stringify(bank.unusedPronoun)},`,
    '  "sentences": [',
    bank.entries.map(e => '    ' + JSON.stringify(e)).join(',\n'),
    '  ]',
    '}',
    '',
  ]
  fs.writeFileSync(path.join(here, 'sentence-bank.json'), out.join('\n'))
  console.log(`sentence-bank.json: ${bank.entries.length} sentences; tense ${bank.entries.filter(e => e.tags.tense).length}, negation ${bank.entries.filter(e => e.tags.negation).length}, who ${bank.entries.filter(e => e.tags.who).length}.`)
  if (bank.unusedTense.length) console.log(`tense rows not used: ${bank.unusedTense.join(', ')}`)
  if (bank.unusedPronoun.length) console.log(`pronoun rows not used: ${bank.unusedPronoun.join(', ')}`)
  const at = process.argv.indexOf('--tsv')
  if (at > 0 && process.argv[at + 1]) {
    writeTsv(process.argv[at + 1], bank, new Map(sentences.map(s => [s.id, s.reading])))
    console.log(`tsv: ${process.argv[at + 1]}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
