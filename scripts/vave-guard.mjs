#!/usr/bin/env node
/**
 * vave-guard.mjs — the mechanical guard around the `/vave` fast translation path.
 *
 * Contract: reviews/translate-pipeline-analysis.md, Q3b "Routing and failover —
 * the escalation rule, precisely". This script encodes those predicates; it does
 * not reinterpret them. The governing principle from that section:
 *
 *   "Route on checkable predicates, computed in code around the model call. The
 *    model's confidence/escalate fields may TRIGGER escalation but may never
 *    PREVENT it."
 *
 * Two modes.
 *
 *   PRE-CALL (on the English input) — escalate to the deep path before spending
 *   a token when:
 *     P1  the input matches the idiom / phrasal-verb / set-phrase list
 *     P2  the input has more than 2 finite clauses (the graph's clause_count_max)
 *     P3  the input carries reported-speech markers (grammar-spec §39) or
 *         counterfactual markers (§44)
 *
 *   POST-CALL (on the Tongan output + its frame tag) — regenerate once, then
 *   escalate when:
 *     P4  any Tongan token is outside the compiled allow-set. This is the
 *         fabrication guard (feedback_no_fabricated_tongan): an out-of-set token
 *         means the output is NEVER shown, at any attempt number.
 *     P5  the frame is outside the lint's closed set, or outside Tier 1's
 *         allowed-frames list (≥3 verified log examples ∪ graph-buildable;
 *         permanent escalate list = grammar-spec §39/§43/§44/§45/§50 + the
 *         reported-speech/conditional tags)
 *     P6  a possessive's head noun is missing from the 198-noun class table, or
 *         the form used contradicts the table's class
 *     P7  definitive-accent advisory — NON-BLOCKING by contract ("flag notes"),
 *         never changes the verdict
 *     P8  aspect mismatch: the English carries an explicit aspect (progressive
 *         or habitual) but the Tongan has no aspect marker. Needs --input;
 *         reports itself as NOT CHECKED when the input is withheld.
 *
 *   Two post-call failure kinds. A *defect* (out-of-set token, fabricated frame
 *   tag, a possessive that contradicts the class table) gets the contract's one
 *   regeneration. A *routing fact* — a frame on the permanent escalate list or
 *   outside Tier 1's allowed list, a possessed noun outside the class table —
 *   is marked `terminal` and escalates immediately: Q3b calls that list
 *   permanent and says an out-of-table possessed noun "escalates", and a retry
 *   cannot change a fact about the sentence. Escalating early spends less, and
 *   never in the unsafe direction.
 *
 * Usage
 *   node scripts/vave-guard.mjs pre  --input "<English sentence>"
 *   node scripts/vave-guard.mjs post --tongan "<Tongan>" --frame <tag>
 *          --input "<the English sentence>"   (enables P8)
 *          [--attempt 1|2] [--confidence high|medium|low] [--model-escalate]
 *          [--model-escalate-reason "..."]
 *   node scripts/vave-guard.mjs self-test        # the 8 fixtures from plan Step 2
 *   node scripts/vave-guard.mjs dump-idioms      # inspect the harvested P1 list
 *
 * Exit codes (the machine-readable half of the verdict; JSON is always on stdout)
 *   0  pass         — proceed
 *   2  regenerate   — post-call failure on attempt 1; one retry is allowed
 *   3  escalate     — hand off to /translate; never show a blocked output
 *   1  usage or internal error
 *
 * Everything this script reads is READ-ONLY. It writes no files.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { harvestFrameTags } from './check-citations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')

const PACK_PATH = path.join(APP_ROOT, 'src', 'data', 'translate-pack.json')
const ALLOWSET_PATH = path.join(APP_ROOT, 'src', 'data', 'translate-allowset.json')
const IDIOM_CORPUS = path.join(REPO_ROOT, 'source-materials', 'Idiom-Corpus.md')
const METHOD_SPEC = path.join(REPO_ROOT, 'spec', 'Translation-Walkthrough-Method.md')
const GRAMMAR_SPEC = path.join(REPO_ROOT, 'spec', 'grammar-spec.md')
const GRAPH_PATH = path.join(APP_ROOT, 'src', 'data', 'grammar-graph.json')

const readText = (p) => fs.readFileSync(p, 'utf8')
const readJSON = (p) => JSON.parse(readText(p))

// ---------------------------------------------------------------------------
// Tongan folding — mirrors translate-allowset.json's stated `folding.steps`
// (and build-translate-pack.mjs's foldTongan) exactly. If that file's rules
// change, change these two functions with it.
// ---------------------------------------------------------------------------

const FAKAUA = 'ʻ' // U+02BB — the fakauʻa. Phonemic (taʻu ≠ tau): kept, never stripped.

function foldTongan(word) {
  return String(word)
    .replace(/[‘’`´']/g, FAKAUA)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(new RegExp(`^[^a-z${FAKAUA}]+`), '')
    .replace(new RegExp(`[^a-z${FAKAUA}]+$`), '')
}

function tonganTokens(text) {
  return String(text)
    .replace(/[*_`~]/g, ' ')
    .split(/[\s.,;:!?"“”…/|+—–\-()[\]{}]+/)
    .map((w) => ({ raw: w, folded: foldTongan(w) }))
    .filter((t) => t.folded.length > 0 && /[a-z]/.test(t.folded))
}

// ---------------------------------------------------------------------------
// English normalisation — for the pre-call predicates
// ---------------------------------------------------------------------------

/** Lowercase word list; keeps internal apostrophes (don't, someone's). */
function englishWords(text) {
  return String(text)
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/[^a-z' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// P1 — the idiom / phrasal-verb / set-phrase list
//
// Three strata, all recorded in the verdict so a hit can always be traced:
//
//   method   spec/Translation-Walkthrough-Method.md, Step 1's own examples,
//            harvested from the spec at run time.
//   corpus   source-materials/Idiom-Corpus.md — the vault DOES have an idiom
//            corpus, but it is Tongan-side (Tongan phrase → literal → meaning).
//            Its English *meaning* column is still a usable P1 signal: an input
//            containing one of those glosses is asking for a Tongan set phrase,
//            which is exactly the non-compositional case Step 1 exists to
//            resolve. Harvested and filtered at run time (see KEEP rules below).
//   curated  English idioms and non-compositional phrasal verbs. REASONABLE CALL:
//            no English-side idiom corpus exists anywhere in source-materials/,
//            and the Tongan-side corpus cannot contain "kick the bucket". This
//            list is the smallest honest stand-in — literal phrases only, no
//            judgment, extend it by adding rows.
//
// Matching is on the folded word sequence, with inflection tolerance on the
// first word when an entry is marked `verb` (kick → kicks/kicked/kicking).
// ---------------------------------------------------------------------------

const CURATED_IDIOMS = [
  // Figurative idioms
  ['kick the bucket', 'verb'], ['break the ice', 'verb'], ['spill the beans', 'verb'],
  ['let the cat out of the bag', 'verb'], ['bite the bullet', 'verb'], ['call it a day', 'verb'],
  ['pull my leg', 'verb'], ['pull your leg', 'verb'], ['pull his leg', 'verb'],
  ['cost an arm and a leg', 'verb'], ['hit the sack', 'verb'], ['hit the hay', 'verb'],
  ['change of heart', 'noun'], ['the last straw', 'noun'], ['a piece of cake', 'noun'],
  ['out of the blue', 'noun'], ['once in a blue moon', 'noun'], ['under the weather', 'noun'],
  ['in hot water', 'noun'], ['up in the air', 'noun'], ['on the same page', 'noun'],
  ['over the moon', 'noun'], ['cold feet', 'noun'], ['a long shot', 'noun'],
  ['keep an eye on', 'verb'], ['make up my mind', 'verb'], ['make up your mind', 'verb'],
  ['make up his mind', 'verb'], ['make up her mind', 'verb'], ['hang in there', 'verb'],
  ['run out of steam', 'verb'], ['get on with it', 'verb'], ['take it easy', 'verb'],
  ['lose my temper', 'verb'], ['lose your temper', 'verb'], ['lose his temper', 'verb'],

  // Non-compositional phrasal verbs (the particle changes the meaning)
  ['give up', 'verb'], ['put off', 'verb'], ['put up with', 'verb'], ['put away', 'verb'],
  ['put together', 'verb'], ['look after', 'verb'], ['look forward to', 'verb'],
  ['look into', 'verb'], ['look up', 'verb'], ['run into', 'verb'], ['run out of', 'verb'],
  ['take off', 'verb'], ['take after', 'verb'], ['take over', 'verb'], ['get over', 'verb'],
  ['get by', 'verb'], ['get along', 'verb'], ['get away with', 'verb'], ['bring up', 'verb'],
  ['carry on', 'verb'], ['come across', 'verb'], ['come up with', 'verb'], ['figure out', 'verb'],
  ['find out', 'verb'], ['hold on', 'verb'], ['keep up', 'verb'], ['pass away', 'verb'],
  ['pick up', 'verb'], ['point out', 'verb'], ['set up', 'verb'], ['show up', 'verb'],
  ['sort out', 'verb'], ['tell off', 'verb'], ['throw away', 'verb'], ['turn down', 'verb'],
  ['turn up', 'verb'], ['work out', 'verb'], ['break down', 'verb'], ['call off', 'verb'],
  ['check out', 'verb'], ['cut down on', 'verb'], ['drop off', 'verb'], ['end up', 'verb'],
  ['fill in', 'verb'], ['go over', 'verb'], ['hang out', 'verb'], ['let down', 'verb'],
  ['move on', 'verb'], ['pull over', 'verb'], ['watch out', 'verb'], ['wear out', 'verb'],
  ['make out', 'verb'], ['catch up', 'verb'], ['grab a bite', 'verb'], ['hit the road', 'verb'],
  ['take your time', 'verb'], ['take my time', 'verb'], ['take his time', 'verb'],
]

/** Irregular verb forms for the P1 verbs that need them. Attested English only. */
const IRREGULAR = {
  kick: ['kicks', 'kicked', 'kicking'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  spill: ['spills', 'spilled', 'spilt', 'spilling'],
  let: ['lets', 'letting'],
  bite: ['bites', 'bit', 'bitten', 'biting'],
  call: ['calls', 'called', 'calling'],
  pull: ['pulls', 'pulled', 'pulling'],
  cost: ['costs', 'costing'],
  hit: ['hits', 'hitting'],
  keep: ['keeps', 'kept', 'keeping'],
  make: ['makes', 'made', 'making'],
  hang: ['hangs', 'hung', 'hanging'],
  run: ['runs', 'ran', 'running'],
  get: ['gets', 'got', 'gotten', 'getting'],
  take: ['takes', 'took', 'taken', 'taking'],
  lose: ['loses', 'lost', 'losing'],
  give: ['gives', 'gave', 'given', 'giving'],
  put: ['puts', 'putting'],
  look: ['looks', 'looked', 'looking'],
  bring: ['brings', 'brought', 'bringing'],
  carry: ['carries', 'carried', 'carrying'],
  come: ['comes', 'came', 'coming'],
  figure: ['figures', 'figured', 'figuring'],
  find: ['finds', 'found', 'finding'],
  hold: ['holds', 'held', 'holding'],
  pass: ['passes', 'passed', 'passing'],
  pick: ['picks', 'picked', 'picking'],
  point: ['points', 'pointed', 'pointing'],
  set: ['sets', 'setting'],
  show: ['shows', 'showed', 'shown', 'showing'],
  sort: ['sorts', 'sorted', 'sorting'],
  tell: ['tells', 'told', 'telling'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  turn: ['turns', 'turned', 'turning'],
  work: ['works', 'worked', 'working'],
  check: ['checks', 'checked', 'checking'],
  cut: ['cuts', 'cutting'],
  drop: ['drops', 'dropped', 'dropping'],
  end: ['ends', 'ended', 'ending'],
  fill: ['fills', 'filled', 'filling'],
  go: ['goes', 'went', 'gone', 'going'],
  move: ['moves', 'moved', 'moving'],
  watch: ['watches', 'watched', 'watching'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  catch: ['catches', 'caught', 'catching'],
  grab: ['grabs', 'grabbed', 'grabbing'],
}

/** All surface forms of a verb lemma: the lemma, its irregulars, regular -s/-ed/-ing. */
function verbForms(lemma) {
  const out = new Set([lemma, ...(IRREGULAR[lemma] || [])])
  out.add(lemma.endsWith('s') || lemma.endsWith('h') || lemma.endsWith('x') ? `${lemma}es` : `${lemma}s`)
  out.add(lemma.endsWith('e') ? `${lemma}d` : `${lemma}ed`)
  out.add(lemma.endsWith('e') ? `${lemma.slice(0, -1)}ing` : `${lemma}ing`)
  return [...out]
}

/**
 * The corpus's English gloss column is kept only when it looks like a set
 * phrase rather than a bare definition. The column is a DEFINITION column, not
 * an English idiom list, so it needs real filtering: harvested raw it yields
 * triggers like "want to" and "because of" that would escalate ordinary
 * sentences, plus Tongan words quoted inside glosses ("lelei ange better").
 * KEEP rules, deliberately conservative (a hair-trigger P1 makes /vave useless):
 *   - 3–5 words after stripping parentheticals (2-word glosses are almost all
 *     bare definitions: "want to", "wish to", "because of")
 *   - no meta-vocabulary ("expressing a desire", "depending on intonation")
 *   - no placeholder letters (x / y) from the sheet's schematic glosses
 *   - at least one content word
 *   - no Tongan token leaking in from the sheet's inline examples — tested
 *     mechanically against the compiled allow-set (a ≥4-letter word that is a
 *     known Tongan surface form drops the gloss). A shared English/Tongan
 *     spelling would drop a legal gloss; the cost is one missed escalation on
 *     a rare phrase, which is the safe direction for a *filter* on P1.
 */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'and', 'or',
  'is', 'are', 'was', 'were', 'be', 'been', 'as', 'that', 'this', 'it', 'its', 'so', 'not',
  'no', 'only', 'just', 'all', 'one', 'up', 'down', 'out', 'off', 'over', 'top', 'above',
  'below', 'inside', 'outside', 'more', 'most', 'very', 'too', 'also', 'both', 'each', 'any',
  'some', 'such', 'than', 'then', 'thus', 'whole',
])

const CORPUS_GLOSS_STOPLIST = new Set([
  'on top of', 'in this manner', 'at all times', 'without result', 'without reason',
  'without permission', 'in order to', 'because of it', 'so long as', 'provided that',
  'want to do', 'wish to do', 'the same as', 'equal to it', 'looks like it',
])

/** Meta-vocabulary a definition uses to talk ABOUT a phrase — never part of one. */
const GLOSS_META = new Set([
  'expressing', 'expresses', 'introducing', 'introduces', 'intonation', 'adds', 'denotes',
  'indicating', 'indicates', 'literally', 'hypothetical', 'schematic', 'e', 'g', 'etc',
  'x', 'y', 'lit', 'sole', 'stronger', 'formal', 'informal',
])

function harvestCorpusGlosses(src, tonganAllowSet) {
  const out = new Map() // phrase → the § it came from
  let section = null
  for (const line of src.split('\n')) {
    const h = line.match(/^## (§[A-Z] — .+)$/)
    if (h) { section = h[1]; continue }
    if (!/^\|/.test(line)) continue
    const cells = line.split('|').map((c) => c.trim())
    // | Tongan | Literal | Meaning | Citation |
    if (cells.length < 6) continue
    const meaning = cells[3]
    if (!meaning || /^-+$/.test(meaning) || /^Meaning$/i.test(meaning)) continue
    for (let alt of meaning.split(/[;,]/)) {
      const hadTonganGlyph = /[ʻ‘’'āēīōūáéíóú]/.test(alt)
      alt = alt.replace(/\([^)]*\)/g, ' ').replace(/[*"]/g, ' ').trim().toLowerCase()
      alt = alt.replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim()
      if (!alt || hadTonganGlyph) continue
      const words = alt.split(' ')
      if (words.length < 3 || words.length > 5) continue
      if (words.every((w) => FUNCTION_WORDS.has(w))) continue
      if (words.some((w) => GLOSS_META.has(w))) continue
      if (words.some((w) => w.length >= 4 && tonganAllowSet.has(w))) continue
      if (CORPUS_GLOSS_STOPLIST.has(alt)) continue
      if (!out.has(alt)) out.set(alt, section || 'Idiom-Corpus.md')
    }
  }
  return out
}

/** Step 1 of the method spec quotes its own idiom examples in double quotes. */
function harvestMethodIdioms(src) {
  const lines = src.split('\n')
  const start = lines.findIndex((l) => /^### Step 1 — Plain English/.test(l))
  if (start === -1) throw new Error('method spec: "### Step 1 — Plain English" not found')
  const end = lines.findIndex((l, i) => i > start && /^### Step 2/.test(l))
  const block = lines.slice(start, end === -1 ? lines.length : end).join('\n')
  const out = []
  for (const m of block.matchAll(/[“"]([a-z][a-z' ]{2,40})[”"]/g)) {
    const phrase = m[1].trim().toLowerCase()
    if (phrase.split(' ').length >= 2) out.push(phrase)
  }
  if (out.length === 0) throw new Error('method spec: Step 1 quoted no idiom examples — harvest is empty')
  return [...new Set(out)]
}

let _idiomIndex = null
function idiomIndex() {
  if (_idiomIndex) return _idiomIndex
  const entries = [] // { phrase, words, stratum, kind, source }

  const tonganAllowSet = new Set(readJSON(ALLOWSET_PATH).tokens)

  for (const phrase of harvestMethodIdioms(readText(METHOD_SPEC))) {
    entries.push({ phrase, words: phrase.split(' '), stratum: 'method', kind: 'verb', source: 'spec/Translation-Walkthrough-Method.md Step 1' })
  }
  for (const [phrase, section] of harvestCorpusGlosses(readText(IDIOM_CORPUS), tonganAllowSet)) {
    entries.push({ phrase, words: phrase.split(' '), stratum: 'corpus', kind: 'phrase', source: `source-materials/Idiom-Corpus.md ${section}` })
  }
  for (const [phrase, kind] of CURATED_IDIOMS) {
    entries.push({ phrase, words: phrase.split(' '), stratum: 'curated', kind, source: 'vave-guard.mjs CURATED_IDIOMS' })
  }

  // De-dupe by phrase, first stratum wins.
  const seen = new Set()
  const deduped = entries.filter((e) => (seen.has(e.phrase) ? false : (seen.add(e.phrase), true)))
  _idiomIndex = deduped
  return _idiomIndex
}

/** Does the word sequence contain this entry, with inflection tolerance on word 1? */
function matchesEntry(words, entry) {
  const [head, ...rest] = entry.words
  const heads = entry.kind === 'verb' ? verbForms(head) : [head]
  for (let i = 0; i < words.length; i++) {
    if (!heads.includes(words[i])) continue
    let ok = true
    for (let j = 0; j < rest.length; j++) {
      if (words[i + 1 + j] !== rest[j]) { ok = false; break }
    }
    if (ok) return words.slice(i, i + 1 + rest.length).join(' ')
  }
  return null
}

function checkP1(input) {
  const words = englishWords(input)
  const hits = []
  for (const entry of idiomIndex()) {
    const found = matchesEntry(words, entry)
    if (found) hits.push({ matched: found, phrase: entry.phrase, stratum: entry.stratum, source: entry.source })
  }
  if (!hits.length) return null
  // Longest match first — the most specific hit is the most informative.
  hits.sort((a, b) => b.phrase.length - a.phrase.length)
  const top = hits[0]
  return {
    predicate: 'P1',
    name: 'idiom / phrasal verb / set phrase',
    detail: `"${top.matched}" matches the ${top.stratum} idiom list (${top.phrase}) — idiom resolution is Step 1 of the deep method and has no Tier-1 counterpart.`,
    matches: hits.slice(0, 5),
    contract: 'Q3b P1',
  }
}

// ---------------------------------------------------------------------------
// P2 — more than 2 finite clauses
//
// The threshold is read from the graph's own clause_count_max conditions, so
// the guard and the sentence-builder agree by construction.
//
// Counting: 1 (the matrix clause) + every clause-linking marker that is
// followed by a finite-verb signal. The finite-verb test is what keeps
// "fish and rice" (an NP coordination) from counting as a second clause.
// ---------------------------------------------------------------------------

const CLAUSE_MARKERS = [
  'and', 'but', 'or', 'so', 'yet', 'because', 'that', 'if', 'when', 'while', 'although',
  'though', 'since', 'after', 'before', 'unless', 'until', 'whether', 'who', 'which',
  'where', 'whom', 'whose', 'as', 'whenever', 'wherever',
]

const FINITE_AUX = new Set([
  'is', 'are', 'was', 'were', 'am', 'be', 'been', 'being', 'has', 'have', 'had', 'do',
  'does', 'did', 'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might',
  'must', "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't",
  "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't",
])

/** Common irregular finite forms — attested English, used only as a clause signal. */
const FINITE_IRREGULAR = new Set([
  'went', 'came', 'said', 'says', 'told', 'tells', 'took', 'takes', 'bought', 'buys',
  'left', 'leaves', 'saw', 'sees', 'ate', 'eats', 'gave', 'gives', 'made', 'makes',
  'got', 'gets', 'put', 'puts', 'kept', 'keeps', 'knew', 'knows', 'thought', 'thinks',
  'found', 'finds', 'brought', 'brings', 'ran', 'runs', 'drove', 'drives', 'sold', 'sells',
  'wrote', 'writes', 'read', 'reads', 'sang', 'sings', 'slept', 'sleeps', 'spoke', 'speaks',
  'stood', 'stands', 'sat', 'sits', 'met', 'meets', 'lost', 'loses', 'won', 'wins',
  'paid', 'pays', 'sent', 'sends', 'built', 'builds', 'held', 'holds', 'heard', 'hears',
  'felt', 'feels', 'fell', 'falls', 'grew', 'grows', 'rose', 'rises', 'told', 'wanted',
  'wants', 'lives', 'lived', 'works', 'worked', 'goes', 'comes', 'comes',
])

function isFiniteSignal(word) {
  if (FINITE_AUX.has(word)) return true
  if (FINITE_IRREGULAR.has(word)) return true
  if (/^[a-z]{3,}ed$/.test(word)) return true // regular past: walked, kicked, wanted
  return false
}

function graphClauseMax() {
  const graph = readJSON(GRAPH_PATH)
  const found = []
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'clause_count_max' && Number.isFinite(node.max)) found.push(node.max)
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v)
  }
  walk(graph)
  if (!found.length) throw new Error('grammar-graph.json: no clause_count_max condition found — refusing to guess P2 threshold')
  return Math.max(...found)
}

function countClauses(input) {
  const words = englishWords(input)
  const markerPositions = []
  words.forEach((w, i) => { if (CLAUSE_MARKERS.includes(w)) markerPositions.push(i) })

  let clauses = 1
  const counted = []
  for (let k = 0; k < markerPositions.length; k++) {
    const start = markerPositions[k] + 1
    const stop = k + 1 < markerPositions.length ? markerPositions[k + 1] : words.length
    const segment = words.slice(start, stop)
    if (segment.some(isFiniteSignal)) {
      clauses++
      counted.push({ marker: words[markerPositions[k]], clause: segment.join(' ') })
    }
  }
  return { clauses, counted, words }
}

function checkP2(input, max) {
  const { clauses, counted } = countClauses(input)
  if (clauses <= max) return null
  return {
    predicate: 'P2',
    name: 'clause count',
    detail: `${clauses} finite clauses (limit ${max}, the graph's clause_count_max): ${counted.map((c) => `${c.marker} → "${c.clause}"`).join(' · ')}`,
    clause_count: clauses,
    limit: max,
    contract: 'Q3b P2',
  }
}

// ---------------------------------------------------------------------------
// P3 — reported speech (grammar-spec §39) / counterfactual (§44)
// ---------------------------------------------------------------------------

const REPORTING_VERBS = [
  'say', 'says', 'said', 'saying', 'tell', 'tells', 'told', 'telling', 'ask', 'asks',
  'asked', 'asking', 'reply', 'replies', 'replied', 'answer', 'answers', 'answered',
  'mention', 'mentions', 'mentioned', 'claim', 'claims', 'claimed', 'explain', 'explains',
  'explained', 'wonder', 'wonders', 'wondered', 'report', 'reports', 'reported',
]

function checkP3(input) {
  const words = englishWords(input)
  const raw = String(input)
  const triggers = []

  // Reported speech: a reporting verb followed by "that", a quote, or a finite clause.
  for (let i = 0; i < words.length; i++) {
    if (!REPORTING_VERBS.includes(words[i])) continue
    const after = words.slice(i + 1, i + 8)
    const hasThat = after.slice(0, 3).includes('that')
    const hasQuote = /["“”]/.test(raw)
    const hasFinite = after.some(isFiniteSignal)
    if (hasThat || hasQuote || hasFinite) {
      triggers.push({ kind: 'reported_speech', marker: words[i], section: 'grammar-spec §39' })
      break
    }
  }

  // Counterfactual / conditional-irrealis markers.
  const cfPatterns = [
    [/\bwould have\b/i, 'would have'],
    [/\bcould have\b/i, 'could have'],
    [/\bshould have\b/i, 'should have'],
    [/\bmight have\b/i, 'might have'],
    [/\bif\b[^.?!]*\bhad\b/i, 'if … had'],
    [/\bif\b[^.?!]*\bwere\b/i, 'if … were'],
    [/\bhad\b[^.?!]*\bwould\b/i, 'had … would'],
    [/\bi wish\b/i, 'I wish'],
    [/\bwished (he|she|they|we|i|you)\b/i, 'wished + subject'],
  ]
  for (const [re, label] of cfPatterns) {
    if (re.test(raw)) { triggers.push({ kind: 'counterfactual', marker: label, section: 'grammar-spec §44' }); break }
  }

  if (!triggers.length) return null
  return {
    predicate: 'P3',
    name: 'reported speech / counterfactual',
    detail: triggers.map((t) => `${t.kind} marker "${t.marker}" → ${t.section}; thin Translation-Log coverage, must not run uncited`).join(' · '),
    triggers,
    contract: 'Q3b P3',
  }
}

// ---------------------------------------------------------------------------
// P4 — token coverage (the fabrication guard). An out-of-set token means the
// output is NEVER shown, on any attempt.
// ---------------------------------------------------------------------------

function checkP4(tongan, allowSet) {
  const tokens = tonganTokens(tongan)
  const misses = tokens.filter((t) => !allowSet.has(t.folded))
  if (!misses.length) return null
  const distinct = [...new Set(misses.map((m) => m.folded))]
  return {
    predicate: 'P4',
    name: 'token coverage (fabrication guard)',
    detail: `${distinct.length} token(s) outside the compiled allow-set: ${distinct.map((t) => `"${t}"`).join(', ')}. Potential fabricated Tongan — this output is never shown.`,
    out_of_set: distinct,
    never_show: true,
    contract: 'Q3b P4',
  }
}

// ---------------------------------------------------------------------------
// P5 — frame legality
// ---------------------------------------------------------------------------

function checkP5(frame, legalFrames, pack) {
  const allowed = new Set(pack.data.allowed_frames)
  const escalate = new Set(pack.data.escalate_frames)
  if (!frame) {
    return { predicate: 'P5', name: 'frame check', detail: 'no frame tag supplied — the frame tag is the only metadata Tier 1 emits and it is mandatory.', terminal: false, contract: 'Q3b P5' }
  }
  if (!legalFrames.has(frame)) {
    return { predicate: 'P5', name: 'frame check', detail: `"${frame}" is not in the lint's closed frame set (grammar-spec Entry Points Summary ∪ Function-Templates) — a fabricated tag.`, terminal: false, contract: 'Q3b P5' }
  }
  if (escalate.has(frame)) {
    const section = pack.data.frames[frame]?.section || 'unsectioned'
    // Terminal: the escalate list is *permanent* (Q3b P5). This is a fact about
    // the sentence, not a defect in the generation — a retry cannot fix it.
    return { predicate: 'P5', name: 'frame check', detail: `"${frame}" (${section}) is on the permanent escalate list (§39/§43/§44/§45/§50 + reported-speech/conditional tags).`, terminal: true, contract: 'Q3b P5' }
  }
  if (!allowed.has(frame)) {
    return { predicate: 'P5', name: 'frame check', detail: `"${frame}" is legal but not in Tier 1's allowed-frames list (needs ≥3 verified Translation-Log examples or graph-buildability).`, terminal: true, contract: 'Q3b P5' }
  }
  return null
}

// ---------------------------------------------------------------------------
// P6 — possessive head noun must be in the 198-noun class table, class matching
//
// Checked construction: the PREPOSED possessive determiners (and their fused
// he- forms) plus the maʻa/moʻo benefactives, where the head noun is the next
// token. LIMITATION, stated deliberately: the ʻa / ʻo prepositional possessive
// is NOT checked, because ʻa and ʻo are ambiguous with the absolutive/subject
// markers (*Naʻe ʻalu ʻa Sione* is a subject, not a possessor) — testing them
// would fire on nearly every sentence. That construction is left to the deep
// path, and the limitation is reported in the verdict.
// ---------------------------------------------------------------------------

const POSSESSIVE_FORMS = {
  // a-class preposed (+ the fused he- forms and the maʻa benefactive)
  ʻeku: 'a', ʻema: 'a', ʻemau: 'a', ʻetau: 'a', ʻenau: 'a', ʻene: 'a',
  hoʻo: 'a', hoʻomo: 'a', hoʻomou: 'a',
  heʻeku: 'a', heʻene: 'a', heʻema: 'a', heʻemau: 'a', heʻetau: 'a', heʻenau: 'a', heʻo: 'a',
  maʻa: 'a', maʻaku: 'a', maʻau: 'a', maʻana: 'a',
  // o-class preposed (+ the moʻo benefactive)
  hoku: 'o', ho: 'o', hono: 'o', homa: 'o', homau: 'o', hotau: 'o', honau: 'o',
  moʻo: 'o', moʻoku: 'o', moʻou: 'o', moʻona: 'o',
}

function possessiveIndex(pack) {
  const map = new Map()
  for (const row of pack.data.possessive.index) {
    const key = foldTongan(row.noun)
    if (key) map.set(key, row)
    // Multi-word entries ("fale lotu") are also keyed on their first word so a
    // single-token lookup still resolves the head.
    const head = foldTongan(String(row.noun).split(/\s+/)[0])
    if (head && !map.has(head)) map.set(head, row)
    for (const a of row.alt || []) {
      const k = foldTongan(a)
      if (k && !map.has(k)) map.set(k, row)
    }
  }
  return map
}

function checkP6(tongan, pack) {
  const tokens = tonganTokens(tongan)
  const index = possessiveIndex(pack)
  const problems = []
  const checked = []
  // Q3b's wording splits the two failures: "an out-of-table possessed noun
  // escalates" (a fact about the boundary — terminal), while a form that
  // contradicts the table is a defect a regeneration can fix.
  let terminal = false

  for (let i = 0; i < tokens.length; i++) {
    const cls = POSSESSIVE_FORMS[tokens[i].folded]
    if (!cls) continue
    const next = tokens[i + 1]
    if (!next) {
      problems.push(`possessive "${tokens[i].raw}" has no head noun following it`)
      continue
    }
    const row = index.get(next.folded)
    if (!row) {
      problems.push(`possessed noun "${next.raw}" (after ${tokens[i].raw}) is not in the ${pack.counts.possessive_nouns}-noun class table — outside Tier 1's judgment boundary`)
      terminal = true
      continue
    }
    checked.push({ form: tokens[i].raw, noun: next.raw, table_class: row.class, form_class: cls })
    if (row.class === 'mixed' || row.class === '—') {
      if (row.class === '—') { problems.push(`"${next.raw}" is listed in the table as not a noun (${row.notes || ''})`.trim()); terminal = true }
      continue // 'mixed' = both classes attested; the table cannot refute the form
    }
    if (row.class !== cls) {
      problems.push(`"${tokens[i].raw} ${next.raw}" uses the ${cls}-class form but the table lists ${next.raw} as ${row.class}-class (${row.source})`)
    }
  }

  if (!problems.length) return null
  return {
    predicate: 'P6',
    name: 'possessive class',
    detail: problems.join(' · '),
    checked,
    terminal,
    contract: 'Q3b P6',
  }
}

// ---------------------------------------------------------------------------
// P7 — definitive-accent advisory. NON-BLOCKING by contract ("flag notes").
// ---------------------------------------------------------------------------

let _accentForms = null
function accentedFormSet() {
  if (_accentForms) return _accentForms
  const graph = readJSON(GRAPH_PATH)
  const set = new Set()
  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (typeof node.definitive_accent_form === 'string') set.add(foldTongan(node.definitive_accent_form))
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v)
  }
  walk(graph)
  _accentForms = set
  return set
}

function checkP7(tongan, allowSet) {
  const accented = []
  for (const t of tonganTokens(tongan)) {
    const decomposed = t.raw.normalize('NFD')
    if (!/[́]/.test(decomposed)) continue // acute = the definitive/stress accent
    accented.push(t)
  }
  if (!accented.length) return null
  const known = accentedFormSet()
  const unattested = accented.filter((t) => !known.has(t.folded))
  if (!unattested.length) return null

  // D5 (2026-07-27) — the definitive accent is PRODUCTIVE: it lands on whatever
  // word ends a definite noun phrase, so the graph's definitive_accent_form data
  // can never enumerate every legal form, and P7 fired on ordinary correct
  // output (*akó*, *tamaí*) — noise that would bury a real signal. Split the two
  // cases: a known base word carrying an accent is expected and reported as
  // such; an accent on a word the allow-set does not know is the real signal
  // (and P4 will already have caught the token itself).
  const knownBase = unattested.filter((t) => allowSet && allowSet.has(t.folded)).map((t) => t.raw)
  const unknownBase = unattested.filter((t) => !allowSet || !allowSet.has(t.folded)).map((t) => t.raw)
  const expectedOnly = unknownBase.length === 0

  return {
    predicate: 'P7',
    name: 'definitive-accent advisory (non-blocking)',
    detail: expectedOnly
      ? `accent on known word(s) ${knownBase.map((t) => `"${t}"`).join(', ')} not enumerated in the graph's definitive_accent_form data. Expected: the definitive accent is productive, so the graph cannot list every legal form. No action.`
      : `accent carried on form(s) the allow-set does not know: ${unknownBase.map((t) => `"${t}"`).join(', ')}. Advisory only — the Q4 gate decides whether this family stays Tier 1.`,
    forms: unattested.map((t) => t.raw),
    expected_productive_accent: knownBase,
    unknown_base: unknownBase,
    expected: expectedOnly,
    blocking: false,
    contract: 'Q3b P7',
  }
}

// ---------------------------------------------------------------------------
// P8 — aspect mismatch (D1/D2, 2026-07-27). BLOCKING, non-terminal.
//
// The failure this exists to catch: the English carries an explicit aspect
// ("is going", "is eating", "always lives") and the Tongan comes back with a
// bare tense marker and no aspect marker at all. With an action verb that is
// normally read as the general/habitual case, so the sentence quietly means
// something else. Found on the Step 3 test-drive, where two of two progressive
// inputs failed this way and P1–P7 could not see it.
//
// The marker inventory is NOT duplicated here — it is read from the pack's
// data.aspect.markers, harvested from Aspect-Tense-Matrix.md, so the guard and
// the prompt can never drift apart.
//
// Deliberately conservative, in both directions:
//   · "is interesting" / "is willing" are adjectives, not progressives (STATIVE_ING).
//   · the *ko* + verbal-noun construction (Ko hoʻo ngāue?) IS the progressive and
//     carries no aspect marker — it must not trip the check.
// ---------------------------------------------------------------------------

// -ing forms that follow "is/are/was" as predicate adjectives, not progressives.
const STATIVE_ING = new Set([
  'interesting', 'willing', 'boring', 'exciting', 'surprising', 'tiring',
  'confusing', 'missing', 'outstanding', 'charming', 'pleasing', 'amazing',
])

const HABITUAL_ADVERBS = [
  ['always', 'always'], ['often', 'often'], ['usually', 'usually'],
  ['every day', 'every day'], ['every week', 'every week'], ['all the time', 'all the time'],
]

function englishAspect(input) {
  const t = ` ${input.toLowerCase().replace(/[^a-z\s'-]/g, ' ').replace(/\s+/g, ' ')} `
  const prog = t.match(/\b(?:is|are|am|was|were|been|being)\s+([a-z]+ing)\b/)
  if (prog && !STATIVE_ING.has(prog[1])) return { kind: 'progressive', evidence: prog[0].trim() }
  for (const [needle, label] of HABITUAL_ADVERBS) {
    if (t.includes(` ${needle} `)) return { kind: 'habitual', evidence: label }
  }
  return null
}

/** The ko + verbal-noun progressive: "Ko hoʻo ngāue?", "Ko e fai ʻeku huo." */
function isKoVerbalNoun(tongan) {
  return /^\s*ko\s+(?:e\s+\w+\s+)?(?:h[oa]['ʻ]?o|['ʻ]?e[kn][uae]|ho['ʻ]?o|['ʻ]?eku|['ʻ]?ene)/i.test(tongan.trim())
}

function packAspectMarkers(pack) {
  const markers = pack?.data?.aspect?.markers
  if (!Array.isArray(markers) || !markers.length) {
    throw new Error('translate-pack.json: data.aspect.markers missing — rebuild with `npm run build:translate-pack` (P8 refuses to guess the inventory)')
  }
  return markers
}

function checkP8(input, tongan, pack) {
  if (!input) {
    return {
      predicate: 'P8',
      name: 'aspect mismatch — NOT CHECKED',
      detail: 'post-call was given no --input, so the English aspect could not be compared against the Tongan. Pass --input to enable P8.',
      blocking: false,
      skipped: true,
      contract: 'Q3b P8',
    }
  }
  const want = englishAspect(input)
  if (!want) return null

  const markers = packAspectMarkers(pack)
  const folded = new Set(tonganTokens(tongan).map((t) => t.folded))
  const present = markers.filter((m) => m.form.split(/\s+/).every((w) => folded.has(foldTongan(w)))).map((m) => m.form)
  if (present.length) return null
  if (want.kind === 'progressive' && isKoVerbalNoun(tongan)) return null

  const suggest = markers
    .filter((m) => (want.kind === 'progressive' ? /in progress/i.test(m.sense) : /often|habitual|continually|always/i.test(m.sense)))
    .map((m) => m.form)

  return {
    predicate: 'P8',
    name: 'aspect mismatch',
    detail: `the English is ${want.kind} ("${want.evidence}") but the Tongan carries no aspect marker — a bare tense marker with an action verb is normally read as the general/habitual case. Expected one of: ${suggest.join(', ')}.`,
    english_aspect: want.kind,
    english_evidence: want.evidence,
    expected_markers: suggest,
    blocking: true,
    contract: 'Q3b P8',
  }
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

function preCall(input) {
  const max = graphClauseMax()
  const triggers = [checkP1(input), checkP2(input, max), checkP3(input)].filter(Boolean)
  return {
    mode: 'pre',
    verdict: triggers.length ? 'escalate' : 'pass',
    input,
    checked: ['P1', 'P2', 'P3'],
    triggers,
    route: triggers.length ? '/translate' : null,
    clause_limit: max,
    contract: 'reviews/translate-pipeline-analysis.md Q3b — pre-call predicates',
  }
}

async function postCall({ tongan, frame, attempt, confidence, modelEscalate, modelEscalateReason, input }) {
  const pack = readJSON(PACK_PATH)
  const allowset = readJSON(ALLOWSET_PATH)
  const allowSet = new Set(allowset.tokens)
  const { frameTags: legalFrames } = await harvestFrameTags(readText(GRAMMAR_SPEC))

  const p4 = checkP4(tongan, allowSet)
  const p5 = checkP5(frame, legalFrames, pack)
  const p6 = checkP6(tongan, pack)
  const p7 = checkP7(tongan, allowSet)
  const p8 = checkP8(input, tongan, pack)

  const blocking = [p4, p5, p6, p8].filter((t) => t && t.blocking !== false)
  const advisories = [p7, p8].filter((t) => t && t.blocking === false)

  // The model's own fields may TRIGGER escalation, never PREVENT it.
  const modelTriggers = []
  if (modelEscalate) modelTriggers.push({ predicate: 'MODEL', name: 'model escalate flag', detail: modelEscalateReason || 'the model set escalate=true' })
  if (confidence === 'low') modelTriggers.push({ predicate: 'MODEL', name: 'model confidence', detail: 'confidence=low' })

  const neverShow = Boolean(p4)
  const terminal = blocking.some((t) => t.terminal)
  let verdict
  if (blocking.length === 0 && modelTriggers.length === 0) verdict = 'pass'
  else if (terminal) verdict = 'escalate'                       // regenerating cannot fix a routing fact
  else if (blocking.length === 0) verdict = 'escalate'          // model-triggered only
  else verdict = attempt >= 2 ? 'escalate' : 'regenerate'

  return {
    mode: 'post',
    verdict,
    never_show: neverShow,
    attempt,
    tongan,
    frame: frame || null,
    checked: ['P4', 'P5', 'P6', 'P7', 'P8'],
    triggers: [...blocking, ...modelTriggers],
    advisories,
    model_fields: { confidence: confidence || null, escalate: Boolean(modelEscalate) },
    route: verdict === 'escalate' ? '/translate' : null,
    limitations: [
      'P4 folds macrons and the definitive accent (see translate-allowset.json → folding.known_limitation): a token differing from a real word only by a macron would pass.',
      'P6 checks preposed possessives and maʻa/moʻo only — the ʻa/ʻo prepositional possessive is ambiguous with the absolutive/subject marker and is left to the deep path.',
    ],
    allowset_size: allowSet.size,
    contract: 'reviews/translate-pipeline-analysis.md Q3b — post-call predicates + failover contract',
  }
}

// ---------------------------------------------------------------------------
// self-test — the 8 fixtures the plan's Step 2 requires.
// Every Tongan string below is copied verbatim from the pack's own verified
// few-shot pairs (harvested from Translation-Log.md); the "corrupted" fixture
// replaces one token with a nonsense ASCII string that is deliberately NOT a
// plausible Tongan word, so no fabricated Tongan is minted even in a test.
// ---------------------------------------------------------------------------

const PRE_FIXTURES = [
  { label: 'idiom', input: 'He kicked the bucket.', expect: 'escalate', want: 'P1' },
  { label: '3 finite clauses', input: 'The boat left because the tide was high and the wind was strong.', expect: 'escalate', want: 'P2' },
  { label: 'reported speech', input: 'She said that Sione would come.', expect: 'escalate', want: 'P3' },
  { label: 'plain 1', input: 'The teacher is going to the school.', expect: 'pass', want: null },
  { label: 'plain 2', input: 'My father is eating fish.', expect: 'pass', want: null },
  { label: 'plain 3', input: 'The children did not come.', expect: 'pass', want: null },
]

async function selfTest() {
  const pack = readJSON(PACK_PATH)
  const good = pack.data.few_shot.tagged.find((p) => p.frame === 'statement' && pack.data.allowed_frames.includes(p.frame))
  if (!good) throw new Error('self-test: no verified statement-frame few-shot pair in the pack to use as the known-good fixture')

  const rows = []
  for (const f of PRE_FIXTURES) {
    const v = preCall(f.input)
    const fired = v.triggers.map((t) => t.predicate).join(',') || '—'
    rows.push({
      mode: 'pre',
      label: f.label,
      input: f.input,
      expected: f.expect,
      got: v.verdict,
      fired,
      ok: v.verdict === f.expect && (!f.want || fired.split(',').includes(f.want)),
      why: v.triggers[0]?.detail || null,
    })
  }

  const okPost = await postCall({ tongan: good.tongan, frame: good.frame, attempt: 1 })
  rows.push({
    mode: 'post',
    label: `known-good log pair (${good.date} "${good.label}")`,
    input: `${good.tongan}  [frame: ${good.frame}]`,
    expected: 'pass',
    got: okPost.verdict,
    fired: okPost.triggers.map((t) => t.predicate).join(',') || '—',
    ok: okPost.verdict === 'pass',
    why: okPost.triggers[0]?.detail || null,
  })

  // Corrupt exactly one token into a nonsense string (not a plausible Tongan word).
  const parts = good.tongan.split(' ')
  const idx = parts.findIndex((p) => foldTongan(p).length > 3)
  const corrupted = parts.map((p, i) => (i === idx ? 'zzqxv' : p)).join(' ')
  const badPost = await postCall({ tongan: corrupted, frame: good.frame, attempt: 1 })
  rows.push({
    mode: 'post',
    label: 'deliberately corrupted token',
    input: `${corrupted}  [frame: ${good.frame}]`,
    expected: 'regenerate + never_show',
    got: `${badPost.verdict}${badPost.never_show ? ' + never_show' : ''}`,
    fired: badPost.triggers.map((t) => t.predicate).join(',') || '—',
    ok: badPost.never_show === true && badPost.verdict === 'regenerate',
    why: badPost.triggers[0]?.detail || null,
  })

  // And the same corruption on attempt 2 → escalate, still never shown.
  const badPost2 = await postCall({ tongan: corrupted, frame: good.frame, attempt: 2 })

  // Extra regression probes for the predicates the mandated 8 don't exercise.
  // Both Tongan strings are verbatim verified log pairs; the P6 probe swaps one
  // attested possessive determiner for another attested one to create a
  // deliberate CLASS error — no invented word is minted.
  const pehe = pack.data.few_shot.tagged.find((p) => p.frame === 'reported_speech_pehē')
  const poss = pack.data.few_shot.tagged.find((p) => /ʻene|'ene/.test(p.tongan))
  const probes = []
  if (pehe) {
    const v = await postCall({ tongan: pehe.tongan, frame: pehe.frame, attempt: 1 })
    probes.push({ predicate: 'P5 permanent-escalate frame', got: v.verdict, expected: 'escalate', ok: v.verdict === 'escalate' })
  }
  const bogus = await postCall({ tongan: good.tongan, frame: 'not_a_real_frame', attempt: 1 })
  probes.push({ predicate: 'P5 fabricated tag', got: bogus.verdict, expected: 'regenerate', ok: bogus.verdict === 'regenerate' })
  if (poss) {
    const swapped = poss.tongan.replace(/(['ʻ‘’])ene/, 'hono')
    const v = await postCall({ tongan: swapped, frame: poss.frame, attempt: 1 })
    probes.push({ predicate: 'P6 class mismatch', got: v.verdict, expected: 'regenerate', ok: v.verdict === 'regenerate', detail: v.triggers[0]?.detail || null })
  }
  const modelLow = await postCall({ tongan: good.tongan, frame: good.frame, attempt: 1, confidence: 'low' })
  probes.push({ predicate: 'model confidence=low triggers escalation', got: modelLow.verdict, expected: 'escalate', ok: modelLow.verdict === 'escalate' })

  // P8 (D1/D2, 2026-07-27). The two FIRE cases are the exact sentences that
  // slipped through P1–P7 on the Step 3 test-drive; the rest guard the
  // false-positive edges that would make P8 too noisy to keep.
  const alwaysPair = pack.data.few_shot.tagged.find((p) => /ma['ʻ]u pē/.test(p.tongan))
  const p8Cases = [
    ['aspect mismatch: progressive, bare TM', 'ʻOku ʻalu ʻa e faiakó ki he akó.', 'noun_subject', 'The teacher is going to the school.', 'regenerate'],
    ['aspect mismatch: progressive, bare TM (2)', 'ʻOku kai ika ʻa ʻeku tamaí.', 'noun_subject', 'My father is eating fish.', 'regenerate'],
    ['aspect satisfied by lolotonga', 'ʻOku lolotonga kai ika ʻa ʻeku tamaí.', 'noun_subject', 'My father is eating fish.', 'pass'],
    ['no false positive on simple past', 'Naʻe ʻikai ke haʻu ʻa e fānaú.', 'negation_impersonal', 'The children did not come.', 'pass'],
    ['no false positive on ko + verbal noun', 'Ko hoʻo ngāue?', 'ko_identification', 'Are you working?', 'pass'],
    ['no false positive on stative -ing', good.tongan, good.frame, 'The film is interesting.', 'pass'],
  ]
  if (alwaysPair) p8Cases.push(['aspect satisfied by maʻu pē', alwaysPair.tongan, alwaysPair.frame, 'She always lives in Vavaʻu.', 'pass'])
  for (const [label, tongan, frame, input, expected] of p8Cases) {
    const v = await postCall({ tongan, frame, attempt: 1, input })
    probes.push({ predicate: `P8 — ${label}`, got: v.verdict, expected, ok: v.verdict === expected })
  }
  // Withholding --input must announce itself, never pass silently.
  const p8Skip = await postCall({ tongan: good.tongan, frame: good.frame, attempt: 1 })
  const skipAdv = p8Skip.advisories.find((a) => a.predicate === 'P8' && a.skipped)
  probes.push({ predicate: 'P8 reports NOT CHECKED without --input', got: skipAdv ? 'announced' : 'silent', expected: 'announced', ok: Boolean(skipAdv) })

  const passed = rows.filter((r) => r.ok).length
  const probesOk = probes.every((p) => p.ok)
  return {
    mode: 'self-test',
    verdict: passed === rows.length && probesOk && badPost2.verdict === 'escalate' ? 'pass' : 'fail',
    passed,
    total: rows.length,
    rows,
    retry_contract: {
      attempt_2_verdict: badPost2.verdict,
      attempt_2_never_show: badPost2.never_show,
      ok: badPost2.verdict === 'escalate' && badPost2.never_show === true,
    },
    extra_probes: probes,
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function arg(name, argv) {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? null : argv[i + 1]
}

const USAGE = `vave-guard.mjs — the /vave mechanical guard (contract: reviews/translate-pipeline-analysis.md Q3b)

  node scripts/vave-guard.mjs pre  --input "<English sentence>"
  node scripts/vave-guard.mjs post --tongan "<Tongan>" --frame <tag> [--attempt 1|2]
                                   --input "<the English sentence>"   (enables P8)
                                   [--confidence high|medium|low] [--model-escalate]
                                   [--model-escalate-reason "..."]
  node scripts/vave-guard.mjs self-test
  node scripts/vave-guard.mjs dump-idioms

exit: 0 pass · 2 regenerate · 3 escalate · 1 usage/internal error`

const EXIT = { pass: 0, regenerate: 2, escalate: 3, fail: 3 }

async function main() {
  const argv = process.argv.slice(2)
  const mode = argv[0]
  const pretty = argv.includes('--pretty')

  let result
  if (mode === 'pre') {
    const input = arg('input', argv)
    if (!input) { console.error(USAGE); process.exit(1) }
    result = preCall(input)
  } else if (mode === 'post') {
    const tongan = arg('tongan', argv)
    const frame = arg('frame', argv)
    if (!tongan) { console.error(USAGE); process.exit(1) }
    result = await postCall({
      tongan,
      frame,
      attempt: parseInt(arg('attempt', argv) || '1', 10),
      confidence: arg('confidence', argv),
      modelEscalate: argv.includes('--model-escalate'),
      modelEscalateReason: arg('model-escalate-reason', argv),
      input: arg('input', argv),
    })
  } else if (mode === 'self-test') {
    result = await selfTest()
  } else if (mode === 'dump-idioms') {
    const idx = idiomIndex()
    const byStratum = {}
    for (const e of idx) (byStratum[e.stratum] ||= []).push(e.phrase)
    result = { mode: 'dump-idioms', total: idx.length, counts: Object.fromEntries(Object.entries(byStratum).map(([k, v]) => [k, v.length])), phrases: byStratum }
  } else {
    console.error(USAGE)
    process.exit(1)
  }

  console.log(JSON.stringify(result, null, pretty || mode === 'self-test' || mode === 'dump-idioms' ? 2 : 0))
  process.exit(EXIT[result.verdict] ?? 0)
}

main().catch((err) => {
  console.log(JSON.stringify({ mode: 'error', verdict: 'escalate', error: String(err && err.message ? err.message : err) }))
  console.error(err)
  process.exit(1)
})
