/**
 * Sentence Tiles: builds roles.json, the clue label for every word of every
 * kept sentence (plan 2026-10-26-games-section, Step 7).
 *
 *   node src/games/sentence-tiles/build-roles.mjs
 *
 * 1. Proposes a role for each word from the course data: the part_of_speech
 *    of book-vocabulary.json and the slot lists of vocabulary-by-slot.json.
 *    A word is matched after its case, its fakauʻa (U+0027 or U+02BB) and a
 *    definitive acute accent are made the same; macrons stay distinct. A word
 *    with no match, or with matches that disagree, is proposed as null.
 * 2. Applies role-overrides.json: the label settled for each word by reading
 *    the sentence in its lesson (book/Chapter-NN.md). An entry is used only
 *    while its `words` still equal the sentence's tiles, so a rebuild keeps
 *    every decision and a changed sentence is reported, never mislabelled.
 * 3. Writes roles.json: the fixed label set with where each term comes from,
 *    then one array per item id (a label or null per word, in the book's
 *    order). The deck reads it; the page shows a null as no label.
 *
 * The kept sentences come from the deck itself (loaded through Vite, which
 * reads its JSON imports), so this list and the game can never differ.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))
const app = path.resolve(here, '../../..')
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'))

/** The fixed label set, in the book's own terms, each with where the term comes from. */
export const LABELS = [
  ['tense marker', 'Lesson 2 "Tense Markers and Pronouns"; Grammar-Concepts B1 "What a tense marker is"'],
  ['pronoun', 'Lesson 2 "Tense Markers and Pronouns"; Grammar-Concepts A4 "What a pronoun is"'],
  ['verb', 'Grammar-Concepts A2 "What a verb is"; Words to Learn type "verb"'],
  ['noun', 'Grammar-Concepts A1 "What a noun is"; Words to Learn type "noun"; Lesson 40 "Spatial Nouns"'],
  ['verbal noun', 'Lesson 45 "Verbal Nouns"'],
  ['name', 'Grammar-Concepts A1 ("proper names like Sione or place names like Vava\'u"); Words to Learn "month name"'],
  ['adjective', 'Lesson 3 "Adjectives in the Verb Slot"; Lesson 35 "Adjectives and Compound Adjectives"; Lesson 41 "Verbs used as adjectives"; Grammar-Concepts A3'],
  ['modifier', 'Lesson 3 "Modifiers"; Grammar-Concepts A8 "What an adverb / modifier is"'],
  ['time word', 'Lesson 4 "Time Words"'],
  ['preposition', 'Lesson 7 "Prepositions"; Lesson 17 "The possessive prepositions \'a and \'o"; Grammar-Concepts A5'],
  ['article', 'Lesson 8 "Articles"; Lesson 52 "Emotional Articles and Possessives"; Grammar-Concepts A7'],
  ['negative', 'Lesson 9 "The Negative"; Grammar-Concepts B7 and B10 "prohibition (negative command)"; Lesson 43 Words to Learn "negation prefix"'],
  ['prohibition marker', 'Lesson 5 Words to Learn (\'oua)'],
  ['question word', 'Lesson 11 "Question Words"; Grammar-Concepts B8'],
  ['identification marker', 'Lesson 12 Words to Learn "ko: identification marker"'],
  ['vocative particle', 'Lesson 14 "The Vocative Particle \'e"'],
  ['focus marker', 'Lesson 16 and Lesson 19 "the focus marker \'a"; Grammar-Concepts B13'],
  ['possessive', 'Lesson 17 "Possessives"; Lesson 37 "Postposed Possessives"; Grammar-Concepts C3'],
  ['agent marker', 'Lesson 19 "The agent marker \'e"; Grammar-Concepts B14'],
  ['number', 'Lesson 20 "Numbers and Time"'],
  ['helper verb', 'Lesson 21 "Auxiliary Verbs"; Words to Learn "fie: helper verb"; Grammar-Concepts B12 "helper verb before the main verb"'],
  ['aspect marker', 'Lesson 22 "Aspect Markers and Frequency"; Grammar-Concepts B11'],
  ['subordinator', 'Lesson 23 Words to Learn "ke: subordinator"; Lesson 26 "ke: to, in order to, so that"'],
  ['conjunction', 'Lesson 24 "Conjunctions"; Grammar-Concepts A6'],
  ['plural marker', 'Lesson 25 "Plural Markers"'],
  ['dual marker', 'Lesson 25 "ongo: the dual marker"'],
  ['directional particle', 'Lesson 28 "Directional Particles"; Grammar-Concepts F10'],
  ['demonstrative', 'Grammar-Concepts A9 "What a demonstrative is"; Lesson 4 ("ni is a demonstrative"); Words to Learn "demonstrative (place)"'],
]
const LABEL_SET = new Set(LABELS.map(([l]) => l))

const ACUTE = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ú: 'u' }
/** A word made matchable: case, fakauʻa and the definitive acute made the same; macrons kept. */
export function roleKey(word) {
  return String(word ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[ʻ‘’]/g, "'")
    .replace(/[áéíóúÁÉÍÓÚ]/g, c => ACUTE[c])
    .replace(/[.,;:?!"“”]/g, '')
    .trim()
}

/** book-vocabulary.json part_of_speech -> label (only the ones that map plainly). */
function labelForPos(pos) {
  const p = String(pos ?? '').toLowerCase()
  if (/tense marker/.test(p)) return 'tense marker'
  if (/^noun$|^spatial noun$|^noun \(quasi-local\)$/.test(p)) return 'noun'
  if (/^verb$|^verb \(intransitive\)$/.test(p)) return 'verb'
  if (/^adjective|compound adjective/.test(p)) return 'adjective'
  if (/^number$/.test(p)) return 'number'
  if (/^time word$/.test(p)) return 'time word'
  if (/^preposition/.test(p)) return 'preposition'
  if (/^conjunction/.test(p)) return 'conjunction'
  if (/^question word$/.test(p)) return 'question word'
  if (/^directional particle/.test(p)) return 'directional particle'
  if (/^demonstrative/.test(p)) return 'demonstrative'
  if (/^aspect marker$/.test(p)) return 'aspect marker'
  if (/^plural marker$/.test(p)) return 'plural marker'
  if (/^(postposed|preposed) (intensifier|limiter|modifier)$|^modifier$/.test(p)) return 'modifier'
  if (/^definite article|^indefinite article/.test(p)) return 'article'
  if (/^month name$|^day name$/.test(p)) return 'name'
  if (/^identification marker$/.test(p)) return 'identification marker'
  return null
}

/** vocabulary-by-slot.json slot -> label. */
const SLOT_LABEL = {
  tense_markers: 'tense marker',
  verbs_intransitive: 'verb', verbs_transitive: 'verb', verbs_transitive_full: 'verb', transitive_i_verbs: 'verb', reciprocal_verbs: 'verb',
  verbs_stative: 'adjective', colors: 'adjective', compound_adjectives: 'adjective', comparison_adjectives: 'adjective',
  modifiers: 'modifier',
  prepositions: 'preposition',
  time_phrases: 'time word',
  companions: 'name', noun_subject_names: 'name', months: 'name', days_of_week: 'name',
  question_words: 'question word',
  demonstratives: 'demonstrative',
  cardinal_numbers: 'number',
  aspect_markers: 'aspect marker',
  plural_markers: 'plural marker',
  directionals: 'directional particle',
  possessives_e: 'possessive', possessives_ho: 'possessive', indefinite_possessives_e: 'possessive', indefinite_possessives_ho: 'possessive',
  postposed_possessives_e: 'possessive', postposed_possessives_ho: 'possessive', emotional_possessives: 'possessive',
  auxiliaries: 'helper verb',
  pronouns: 'pronoun', postposed_pronouns: 'pronoun',
}

export function lookupTables() {
  const vocab = readJson(path.join(app, 'src/data/book-vocabulary.json'))
  const slots = readJson(path.join(app, 'src/data/vocabulary-by-slot.json'))
  const seen = new Map() // key -> Set of labels (a null source counts as a disagreement)
  const add = (word, label) => {
    const k = roleKey(word)
    if (!k || /\s/.test(k)) return
    if (!seen.has(k)) seen.set(k, new Set())
    seen.get(k).add(label)
  }
  for (const row of vocab) add(row.tongan, labelForPos(row.part_of_speech))
  for (const [slot, list] of Object.entries(slots)) {
    if (slot === 'meta' || slot === 'selectional') continue
    if (slot === 'pronouns') {
      for (const p of Object.values(list)) {
        for (const w of [p.short, p.long, ...Object.values(p.short_forms ?? {})]) if (w) add(w, 'pronoun')
      }
      continue
    }
    if (!Array.isArray(list) || !(slot in SLOT_LABEL)) continue
    for (const x of list) add(typeof x === 'string' ? x : x?.tongan, SLOT_LABEL[slot])
  }
  return seen
}

/** The lookup's proposal for one word: its one label, or null (no match, or matches disagree). */
export function propose(word, table) {
  const labels = table.get(roleKey(word))
  if (!labels || labels.size !== 1) return null
  const [only] = labels
  return only ?? null
}

async function loadSentences() {
  const server = await createServer({ root: app, configFile: false, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true } })
  try {
    const deck = await server.ssrLoadModule(path.join(here, 'deck.js'))
    return deck.SENTENCES.map(s => ({ id: s.id, chapter: s.chapter, words: [...s.words] }))
  } finally {
    await server.close()
  }
}

async function main() {
  const sentences = await loadSentences()
  const table = lookupTables()
  const overrides = readJson(path.join(here, 'role-overrides.json')).items ?? {}
  const items = {}
  const stale = []
  const unreviewed = []
  let words = 0, labelled = 0, agreed = 0
  for (const s of sentences) {
    const proposal = s.words.map(w => propose(w, table))
    const o = overrides[s.id]
    let roles
    if (o && o.words === s.words.join(' ') && Array.isArray(o.roles) && o.roles.length === s.words.length) {
      roles = o.roles.map(r => (r == null ? null : r))
    } else {
      if (o) stale.push(s.id)
      else unreviewed.push(s.id)
      roles = proposal
    }
    for (const r of roles) {
      if (r != null && !LABEL_SET.has(r)) throw new Error(`${s.id}: "${r}" is not in the label set`)
    }
    roles.forEach((r, i) => { words++; if (r != null) labelled++; if (r === proposal[i]) agreed++ })
    items[s.id] = roles
  }
  const note = 'Clue labels for Sentence Tiles: for every kept sentence (by item id), the role of each word in the book\'s order, or null where the book does not settle it (null shows no label). Built by build-roles.mjs from book-vocabulary.json and vocabulary-by-slot.json, then settled sentence by sentence in role-overrides.json. Do not edit by hand; edit role-overrides.json and rebuild.'
  const lines = [
    '{',
    `  "_note": ${JSON.stringify(note)},`,
    '  "labels": [',
    LABELS.map(([label, source]) => `    ${JSON.stringify({ label, source })}`).join(',\n'),
    '  ],',
    '  "items": {',
    Object.entries(items).map(([id, roles]) => `    ${JSON.stringify(id)}: ${JSON.stringify(roles)}`).join(',\n'),
    '  }',
    '}',
    '',
  ]
  fs.writeFileSync(path.join(here, 'roles.json'), lines.join('\n'))
  console.log(`roles.json: ${sentences.length} sentences, ${words} words, ${labelled} labelled, ${words - labelled} null; the lookup's proposal matched the settled label for ${agreed} of ${words} words.`)
  if (stale.length) console.log(`STALE override (sentence text changed, proposal used): ${stale.join(', ')}`)
  if (unreviewed.length) console.log(`UNREVIEWED (no override, proposal used): ${unreviewed.join(', ')}`)
  if (stale.length || unreviewed.length) process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
