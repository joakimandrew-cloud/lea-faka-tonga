#!/usr/bin/env node
/**
 * build-translate-pack.mjs — compile the Tier-1 translation pack + the Tongan
 * token allow-set.
 *
 * Run:   `node scripts/build-translate-pack.mjs`  (from lea-faka-tonga-app/)
 *        or `npm run build:translate-pack`
 * Emits: src/data/translate-pack.json      the Tier-1 system prompt (~9-10K tokens)
 *        src/data/translate-allowset.json  the Tongan token allow-set (the P4 guard)
 *
 * Why it exists (reviews/translate-pipeline-analysis.md Q3b + Q5 + R3): the fast
 * translation path is ONE strong-model call with no tool use, so everything it
 * needs to be trustworthy has to be in the prompt: the method's slot order and
 * orthography rules, the legal frame set with its slot templates and the marker
 * disambiguators, the full possessive-class table, the negation paradigm, the
 * house rules, and verified worked pairs. All of that already exists on disk in
 * checked sources; this compiles it, deterministically, into one artifact used
 * by both the local `/vave` skill and the future worker.
 *
 * Follows the extract-quick-practice.mjs precedent: read root sources → emit
 * COMMITTED src/data/*.json. The Pages workflow never runs extraction, so
 * committing the artifact is how it stays deployable.
 *
 * Inputs (ALL read-only — this script edits no source, ever):
 *   spec/Translation-Walkthrough-Method.md        method rules (slot order, orthography, ʻa e, accents)
 *   spec/Frame-Index.md                           the compiled frame index (preferred over re-parsing the spec)
 *   spec/grammar-spec.md                          ka/kae disambiguator + the closed frame set (via harvestFrameTags)
 *   book/Chapter-08.md                            the e/he definite-article disambiguator
 *   source-materials/Possessive-Class-Master.md   the full noun class table + rules + paradigm
 *   source-materials/Negation-Paradigm.md         §A tables
 *   DECISIONS.md                                  Linguistics section → house rules
 *   audits/Accent-Convention-Audit-Findings.md    the 2026-06-10 té accent canon
 *   Translation-Log.md                            verified EN→TO pairs (headings normalized AT HARVEST TIME)
 *   source-materials/EALD-Dictionary.json         allow-set
 *   src/data/book-vocabulary.json                 allow-set
 *   src/data/grammar-graph.json                   allow-set + slot forms
 *
 * The frame set is NOT re-implemented here — it is `harvestFrameTags()` from
 * check-citations.mjs, so every tag the pack names is a tag the lint accepts.
 *
 * Anti-drift: both artifacts embed, per source, the whole-file sha256 AND a
 * `harvest_sha256` over just the slice this script actually reads. check-style.mjs
 * re-verifies them; a changed harvest is a hard error (rebuild the pack), a
 * changed file with an unchanged harvest is a note (nothing the pack quotes moved).
 * Translation-Log.md is warn-only: the log grows every time /translate runs, and
 * a bigger corpus never makes the shipped pack wrong, only staler.
 *
 * Self-tests run before anything is written:
 *   1. Every Tongan token the pack itself quotes passes the allow-set (a
 *      fabrication tripwire pointed at our own artifact).
 *   2. Every frame tag the pack names is in the lint's closed set.
 *   3. The token estimate lands in the 8-12K band (warning outside it).
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { harvestFrameTags } from './check-citations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')

const OUT_PACK = path.join(APP_ROOT, 'src', 'data', 'translate-pack.json')
const OUT_ALLOWSET = path.join(APP_ROOT, 'src', 'data', 'translate-allowset.json')

const REBUILD_CMD = 'npm run build:translate-pack   (from lea-faka-tonga-app/)'

// Source registry. `drift` says how check-style treats a changed harvest.
const SOURCES = {
  method: { rel: 'spec/Translation-Walkthrough-Method.md', drift: 'hard' },
  frameIndex: { rel: 'spec/Frame-Index.md', drift: 'hard' },
  grammarSpec: { rel: 'spec/grammar-spec.md', drift: 'hard' },
  chapter08: { rel: 'book/Chapter-08.md', drift: 'hard' },
  possessive: { rel: 'source-materials/Possessive-Class-Master.md', drift: 'hard' },
  negation: { rel: 'source-materials/Negation-Paradigm.md', drift: 'hard' },
  aspect: { rel: 'source-materials/Aspect-Tense-Matrix.md', drift: 'hard' },
  chapter22: { rel: 'book/Chapter-22.md', drift: 'hard' },
  decisions: { rel: 'DECISIONS.md', drift: 'hard' },
  accentAudit: { rel: 'audits/Accent-Convention-Audit-Findings.md', drift: 'hard' },
  log: { rel: 'Translation-Log.md', drift: 'warn' },
  eald: { rel: 'source-materials/EALD-Dictionary.json', drift: 'warn' },
  bookVocab: { rel: 'lea-faka-tonga-app/src/data/book-vocabulary.json', drift: 'warn' },
  graph: { rel: 'lea-faka-tonga-app/src/data/grammar-graph.json', drift: 'warn' },
}

// grammar-spec must never shrink (CLAUDE.md hard constraint 2).
const GRAMMAR_SPEC_FLOOR = 9591

const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8')
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex')
const approxTokens = (s) => Math.round(s.length / 4)

/** Records what each harvest actually read, so drift can be scoped. */
const harvestSlices = new Map()
function noteHarvest(key, text) {
  const prev = harvestSlices.get(key) || []
  prev.push(text)
  harvestSlices.set(key, prev)
  return text
}

// ---------------------------------------------------------------------------
// Orthography folding — shared by the allow-set and every lookup
// ---------------------------------------------------------------------------

const FAKAUA = 'ʻ' // U+02BB modifier letter turned comma — the fakauʻa

/**
 * Fold a Tongan surface form to a comparison key.
 *
 * 1. Unify every glottal-stop glyph the vault's sources use (ASCII ', curly
 *    ‘ ’, backtick, U+02BB) to U+02BB. The mark is phonemic (*taʻu* ≠ *tau*),
 *    so it is KEPT, never stripped.
 * 2. Decompose and drop combining marks: the acute is the definitive accent,
 *    applied productively per noun phrase, and the macron is written
 *    inconsistently across the sources (Churchward-derived sheets vs EALD).
 *    Folding both is what keeps a correct output from being blocked on a
 *    diacritic; the cost is that a fabricated token differing from a real one
 *    ONLY by a macron would pass. Stated plainly in the allow-set file.
 * 3. Lowercase; trim surrounding punctuation, quotes, brackets and markdown.
 */
function foldTongan(word) {
  return String(word)
    .replace(/[‘’`´']/g, FAKAUA)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(new RegExp(`^[^a-z${FAKAUA}]+`), '')
    .replace(new RegExp(`[^a-z${FAKAUA}]+$`), '')
}

/** Split a Tongan string into candidate word tokens (already folded). */
function tonganTokens(text) {
  return String(text)
    .replace(/[*_`~]/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')       // slot placeholders: [tense_marker]
    .replace(/\([^)]*\)/g, ' ')        // parenthetical English glosses
    .split(/[\s .,;:!?"“”…/|+—–\-()\[\]{}]+/)
    .map(foldTongan)
    .filter((w) => w.length > 0 && /[a-z]/.test(w))
}

// ---------------------------------------------------------------------------
// Tongan-string registry — what self-test 1 checks
// ---------------------------------------------------------------------------

const tonganQuotes = []
/** Register a Tongan string the pack quotes, with provenance for the report. */
function tongan(text, where) {
  if (text && String(text).trim()) tonganQuotes.push({ text: String(text), where })
  return text
}

/**
 * Pull the *italic* spans out of a markdown string — in this vault, italics ARE
 * the Tongan (CLAUDE.md naming conventions). Bold markers are removed first so
 * a bold run (English) is never mistaken for an italic span, and so nested
 * `**post-*te* form**` still yields *te*.
 */
function italics(s) {
  const out = []
  const cleaned = String(s || '').replace(/\*\*/g, '')
  for (const m of cleaned.matchAll(/\*([^*]+)\*/g)) {
    const t = m[1].trim()
    if (t) out.push(t)
  }
  return out
}

/** Register every italic (= Tongan) span in a markdown string. */
function tonganItalics(s, where) {
  for (const t of italics(s)) tongan(t, where)
}

/**
 * Does this string have Tongan word shape? Churchward Ch. 1: the inventory is
 * a e i o u (with macrons) + f h k l m n ng p s t v and the fakauʻa, every
 * consonant is followed by a vowel, and every word ends in a vowel.
 *
 * Used where a source marks Tongan and English with the same markup — the
 * DECISIONS Linguistics section italicizes *fakauʻa* and *Tongan Grammar* and
 * backticks both `haʻu` and `/kickoff`. Shape separates them without a
 * hand-maintained stoplist.
 */
function looksTongan(phrase) {
  const words = String(phrase).split(/[\s—–-]+/).map(foldTongan).filter(Boolean)
  if (words.length === 0) return false
  return words.every((w) =>
    /^[aeiouʻfhklmnpstvg]+$/.test(w) &&      // Tongan letter inventory (g only in ng)
    !/g/.test(w.replace(/ng/g, '')) &&
    /[aeiou]$/.test(w)                        // every Tongan word ends in a vowel
  )
}

// ---------------------------------------------------------------------------
// 1. Method rules — spec/Translation-Walkthrough-Method.md
// ---------------------------------------------------------------------------

function harvestMethodRules(src) {
  const rules = []
  const lines = src.split('\n')

  // Determinism rule 2 — the canonical slot order (the spine of the pack).
  const slotLine = lines.find((l) => /^\s*2\.\s+\*\*Canonical slot order/.test(l))
  if (!slotLine) throw new Error('method: "Canonical slot order" determinism rule not found')
  noteHarvest('method', slotLine)
  // The method states this as an instruction to its Steps 2/3/4; the fast path
  // has no steps, so the same order is stated as the order itself.
  const slotOrder = slotLine
    .replace(/^\s*2\.\s+\*\*Canonical slot order\.\*\*\s*/, '')
    .replace(/^Step 2 and Step 4 list chunks in this fixed order:/, 'Chunks go in this fixed order:')
    .replace(/Step 3 templates follow the same order\.\s*$/, '')
    .trim()
  rules.push({ id: 'slot-order', title: 'Canonical slot order', text: slotOrder })

  // Determinism rule 3 — frame names are closed.
  const frameLine = lines.find((l) => /^\s*3\.\s+\*\*Frame names are closed/.test(l))
  if (!frameLine) throw new Error('method: "Frame names are closed" determinism rule not found')
  noteHarvest('method', frameLine)
  rules.push({
    id: 'closed-frames',
    title: 'Frame names are closed',
    text: 'A frame name must come from the closed set below (grammar-spec Entry Points ∪ Function-Templates frame tags). Inventing a frame tag is a hard error.',
  })

  // Style notes — accents, focus marker, glottal stop, italics.
  const styleStart = lines.findIndex((l) => /^## Style notes/.test(l))
  const styleEnd = lines.findIndex((l, i) => i > styleStart && /^## /.test(l))
  if (styleStart === -1) throw new Error('method: "## Style notes" section not found')
  const styleBlock = lines.slice(styleStart, styleEnd === -1 ? lines.length : styleEnd)
  noteHarvest('method', styleBlock.join('\n'))
  const wanted = [
    ['accents', 'Accents'],
    ['focus-marker', "Focus marker `'a`"],
    ['glottal', 'Glottal stop'],
  ]
  for (const [id, label] of wanted) {
    const bullet = styleBlock.find((l) => l.startsWith(`- **${label.replace(/`/g, '')}`) || l.startsWith(`- **${label}`))
    if (!bullet) continue
    const text = bullet.replace(/^- \*\*[^*]+\*\*:?\s*/, '').trim()
    rules.push({ id, title: label.replace(/`/g, ''), text })
    // The accent / focus-marker bullets quote real Tongan forms; register them.
    tonganItalics(text, `method:${id}`)
  }

  // Step 2 — the role labels the method decomposes an English sentence into.
  const roleLine = lines.find((l) => /^Use these role labels:/.test(l))
  if (roleLine) {
    noteHarvest('method', roleLine)
    rules.push({
      id: 'roles',
      title: 'Role labels',
      text: `Segment the English into chunks and label each one before choosing slots. ${roleLine.trim()}`,
    })
  }

  // Step 1 — idiom resolution (the thing Tier 1 must NOT attempt).
  const step1 = lines.findIndex((l) => /^### Step 1 — Plain English/.test(l))
  const step1Body = lines.slice(step1, step1 + 8).join('\n')
  noteHarvest('method', step1Body)
  rules.push({
    id: 'idioms',
    title: 'Idioms are out of scope for the fast path',
    text: 'Figurative English ("catch up", "kick the bucket", "hit the road", "take your time") is resolved to literal English before translation in the deep method. The fast path does NOT attempt that resolution: an idiomatic input escalates.',
  })

  return rules
}

// ---------------------------------------------------------------------------
// 2. Frame index — spec/Frame-Index.md (+ grammar-spec / Ch 8 for the two
//    disambiguators the index does not carry)
// ---------------------------------------------------------------------------

function harvestFrameIndex(src) {
  const lines = src.split('\n')

  // ── quick table: | `tag` | §N | `template` | notes |
  const tStart = lines.findIndex((l) => /^## Quick table/.test(l))
  if (tStart === -1) throw new Error('frame-index: "## Quick table" not found')
  const tEnd = lines.findIndex((l, i) => i > tStart && /^## /.test(l))
  const tableBlock = lines.slice(tStart, tEnd === -1 ? lines.length : tEnd)
  noteHarvest('frameIndex', tableBlock.join('\n'))

  const frames = {}
  for (const line of tableBlock) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*$/)
    if (!m) continue
    const [, tag, section, template, notes] = m
    const cleanTemplate = template.replace(/^`|`$/g, '').trim()
    frames[tag] = {
      tag,
      section: section === '—' ? null : section,
      template: cleanTemplate === '—' ? null : cleanTemplate,
      disambiguators: notes === '—' ? [] : notes.split(',').map((s) => s.replace(/`/g, '').trim()).filter(Boolean),
    }
    // A template is slot notation, not authored Tongan — `[tense_marker] +
    // [pronoun]` would tokenize to English slot names. Only its italic spans
    // (the ones that ARE Tongan, e.g. `*ʻOku ke fēfē hake?*`) are registered.
    if (frames[tag].template) tonganItalics(frames[tag].template, `frame-template:${tag}`)
  }
  if (Object.keys(frames).length === 0) throw new Error('frame-index: quick table parsed zero frames')

  // ── the two disambiguator blocks, verbatim
  const dStart = lines.findIndex((l) => /^## Marker disambiguators/.test(l))
  const dEnd = lines.findIndex((l, i) => i > dStart && /^## /.test(l))
  const dBlock = lines.slice(dStart + 1, dEnd === -1 ? lines.length : dEnd)
  noteHarvest('frameIndex', dBlock.join('\n'))

  const disambiguators = []
  let cur = null
  for (const l of dBlock) {
    const h = l.match(/^### (.+?)\s+—\s+`([^`]+)`\s*$/)
    if (h) {
      if (cur) disambiguators.push(cur)
      cur = { id: h[2], title: h[1], rules: [], source: null }
      continue
    }
    if (!cur) continue
    if (/^- /.test(l)) {
      cur.rules.push(l.replace(/^- /, '').trim())
      tonganItalics(l, `disambiguator:${cur.id}`)
    } else if (/^Source: /.test(l)) {
      cur.source = l.replace(/^Source:\s*/, '').trim()
    }
  }
  if (cur) disambiguators.push(cur)

  return { frames, disambiguators }
}

/**
 * ka vs kae — grammar-spec §17. Two sources, both verbatim: the student-facing
 * grammar note (which states the rule) and the operative sentence of the
 * engine's "Critical constraint" (which states the test). The constraint's
 * walker framing is dropped by taking only its second sentence.
 */
function harvestKaKae(specSrc) {
  const lines = specSrc.split('\n')
  const constraint = lines.find((l) => /^\*\*Critical constraint:\*\*\s*`ka` and `kae`/.test(l))
  if (!constraint) throw new Error('grammar-spec: ka/kae "Critical constraint" paragraph not found')
  const note = lines.find((l) => /two words for "but" — ka \(before tense markers/.test(l))
  if (!note) throw new Error('grammar-spec: ka/kae student grammar note not found')
  noteHarvest('grammarSpec', `${constraint}\n${note}`)

  const test = (constraint.match(/If the second clause begins[^.]*\./) || [])[0]
  if (!test) throw new Error('grammar-spec: ka/kae "If the second clause begins…" test sentence not found')
  const stated = (note.match(/It also has two words for "but"[^.]*\./) || [])[0]
  if (!stated) throw new Error('grammar-spec: ka/kae "two words for but" sentence not found')

  tongan('ka', 'disambiguator:ka-vs-kae')
  tongan('kae', 'disambiguator:ka-vs-kae')
  return {
    id: 'ka-vs-kae',
    title: '*ka* vs *kae* (the two words for "but")',
    rules: [
      // "It also has…" in the source refers back to a preceding sentence about
      // Tongan's words for "and"; name the antecedent so the rule stands alone.
      stated.replace(/^It also has/, 'Tongan has').replace(/\bka\b/g, '*ka*').replace(/\bkae\b/g, '*kae*').trim(),
      test.replace(/`/g, '*').replace(/\boffer\b/g, 'use').trim(),
      '*ka* and *kae* are not interchangeable; the choice depends on the very next word in the second clause.',
    ],
    source: 'grammar-spec §17 (Conjunctions and Multi-Clause Sentences)',
  }
}

/** e vs he — the definite-article rule, from the chapter that teaches it. */
function harvestEHe(ch08Src) {
  const lines = ch08Src.split('\n')
  const start = lines.findIndex((l) => /^### The Definite Article/.test(l))
  if (start === -1) throw new Error('Chapter-08: "The Definite Article" heading not found')
  const end = lines.findIndex((l, i) => i > start && /^### /.test(l))
  const block = lines.slice(start, end === -1 ? lines.length : end)
  noteHarvest('chapter08', block.join('\n'))

  const useHe = block.find((l) => /^\*\*Use \*he\*\*\*/.test(l))
  const useE = block.find((l) => /^\*\*Use \*e\*\*\*/.test(l))
  const full = block.find((l) => /^The full rule:/.test(l))
  if (!useHe || !useE || !full) throw new Error('Chapter-08: e/he rule lines not found')

  for (const l of [useHe, useE, full]) tonganItalics(l, 'disambiguator:e-vs-he')

  return {
    id: 'e-vs-he',
    title: '*e* vs *he* (the definite article "the")',
    rules: [
      useHe.replace(/\*\*/g, '').replace(/:\s*$/, '.').trim(),
      useE.replace(/\*\*/g, '').replace(/:\s*$/, '.').trim(),
      full.trim(),
    ],
    source: 'LFT Ch. 8 §"The Definite Article: *E* and *He*"',
  }
}

/**
 * Aspect — the fifth disambiguator (D1, 2026-07-27).
 *
 * Why this exists: without it the pack taught frames, possessive class and four
 * marker choices, and said NOTHING about aspect. A model handed an English
 * progressive ("is going", "is eating") therefore rendered it as a bare tense
 * marker, which with an action verb is normally read as habitual — a silent
 * wrong answer with no guard able to see it. Found by Andrew on the Step 3
 * `/vave` test-drive; two of the first two sentences failed the same way.
 *
 * Harvested, never typed from memory:
 *   Aspect-Tense-Matrix §"How to read the matrix"  the pre/post-verb slot rule
 *   Aspect-Tense-Matrix §A row labels               the marker inventory + glosses
 *   book/Chapter-22.md §"*lolotonga*"               the English "-ing" → lolotonga directive
 *
 * NOTE the open question this rule deliberately does not settle: whether a bare
 * tense marker can carry a progressive at all is queue item 13 in
 * audits/Native-Speaker-Review-Queue.md. The rule below is the conservative
 * reading (mark it explicitly) and is one edit away from the stricter
 * "escalate every progressive" policy if the speaker rules the other way.
 */
function harvestAspect(matrixSrc, ch22Src) {
  const mLines = matrixSrc.split('\n')

  // ── slot rule, from §"How to read the matrix"
  const preSlot = mLines.find((l) => /^- \*\*Pre-verb slot\*\*/.test(l))
  const postSlot = mLines.find((l) => /^- \*\*Post-verb slot\*\*/.test(l))
  if (!preSlot || !postSlot) throw new Error('Aspect-Tense-Matrix: pre/post-verb slot bullets not found')

  // ── marker inventory, from the §A row labels: `| **kei** (continuative) | …`
  const markers = []
  const slotOf = (form) => {
    const f = form.replace(/\*/g, '')
    if (new RegExp(`\\*${f}\\*`).test(postSlot)) return 'post-verb'
    if (new RegExp(`\\*${f}\\*`).test(preSlot)) return 'pre-verb'
    return null // kuo (TM slot) and hili (subordinator) are named in their own bullets
  }
  const addMarker = (form, sense) => {
    const f = form.trim()
    // §B rows are stacking PAIRS ("fa'a + kuo"), not markers.
    if (f.includes('+')) return
    if (markers.some((x) => x.form === f)) return
    markers.push({ form: f, sense: sense.trim(), slot: slotOf(f) })
    tongan(f, 'aspect:marker')
  }
  //   §A row labels:  | **kei** (continuative) | …
  for (const l of mLines) {
    const m = l.match(/^\|\s*\*\*([^*]+)\*\*\s*\(([^)]+)\)\s*\|/)
    if (m) addMarker(m[1], m[2])
  }
  //   §D headings:    ### *lolotonga* — currently / in progress (pre-verb slot)
  //   lolotonga has no §A row of its own, so without this it would be missing
  //   from the inventory — which is exactly the marker D1 exists to teach.
  for (const l of mLines) {
    const m = l.match(/^### \*([^*]+)\*\s+—\s+(.+)$/)
    if (m) addMarker(m[1], m[2].replace(/\s*\((?:pre|post)-verb slot\)\s*$/i, ''))
  }
  if (markers.length < 8) throw new Error(`Aspect-Tense-Matrix: parsed only ${markers.length} §A markers`)
  if (!markers.some((m) => m.form === 'lolotonga')) throw new Error('Aspect-Tense-Matrix: lolotonga missing from the marker inventory')
  noteHarvest('aspect', [preSlot, postSlot, ...markers.map((x) => `${x.form}|${x.sense}|${x.slot}`)].join('\n'))

  // ── the operative directive, in the book's own words
  const ch22 = ch22Src.split('\n')
  const ing = ch22.find((l) => /English uses "-ing" forms for this/.test(l))
  if (!ing) throw new Error('Chapter-22: the lolotonga "-ing" sentence not found')
  noteHarvest('chapter22', ing)
  tonganItalics(ing, 'aspect:lolotonga')

  // "in progress" only — *kei* is the CONTINUATIVE ("still"), not the progressive,
  // and must not be offered as the rendering for an English -ing.
  const inProgress = markers.filter((m) => /in progress/i.test(m.sense)).map((m) => `*${m.form}*`)
  const habitual = markers.filter((m) => /often|habitual/i.test(m.sense)).map((m) => `*${m.form}*`)
  const always = markers.filter((m) => /continually|always/i.test(m.sense)).map((m) => `*${m.form}*`)
  if (!inProgress.length || !habitual.length || !always.length) {
    throw new Error(`aspect: sense classification empty (in-progress ${inProgress.length}, habitual ${habitual.length}, always ${always.length})`)
  }

  return {
    markers,
    disambiguator: {
      id: 'aspect-vs-bare-tm',
      title: 'aspect — a bare tense marker is NOT the English progressive',
      rules: [
        'A tense marker places the verb in time; on its own it does not mark an action as in progress. With an action verb it is normally read as the general or habitual case, so an English progressive ("is/are/am + -ing") needs an aspect marker rather than a bare tense marker.',
        ing.trim(),
        `In progress right now: ${inProgress.join(', ')} before the verb. Often / habitually: ${habitual.join(', ')} before the verb. Always / continually: ${always.join(', ')} after the verb.`,
        preSlot.replace(/^- /, '').trim(),
        postSlot.replace(/^- /, '').trim(),
        'If you cannot tell whether the English wants the in-progress or the habitual reading, escalate rather than pick one — the two render differently and the choice is not recoverable downstream.',
      ],
      source: 'source-materials/Aspect-Tense-Matrix.md §A + LFT Ch. 22 §"*lolotonga*"',
    },
  }
}

// ---------------------------------------------------------------------------
// 3. Possessive class — source-materials/Possessive-Class-Master.md
// ---------------------------------------------------------------------------

function splitRow(line) {
  if (!/^\|/.test(line)) return null
  const cells = line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim())
  if (cells.length < 2) return null
  if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return null // separator row
  return cells
}

function sectionBlock(lines, headingRe, stopRe = /^## /) {
  const start = lines.findIndex((l) => headingRe.test(l))
  if (start === -1) return null
  const end = lines.findIndex((l, i) => i > start && stopRe.test(l))
  return { start, end: end === -1 ? lines.length : end, lines: lines.slice(start, end === -1 ? lines.length : end) }
}

function harvestPossessive(src) {
  const lines = src.split('\n')

  // ── §D core distinction (two blockquote lines) + the LFT paraphrase
  const dBlock = sectionBlock(lines, /^## §D — The core distinction/)
  if (!dBlock) throw new Error('possessive: §D not found')
  noteHarvest('possessive', dBlock.lines.join('\n'))
  const core = dBlock.lines
    .filter((l) => /^> \*\*[ao]-class\*\*/.test(l))
    .map((l) => l.replace(/^>\s*/, '').trim())
  const paraphrase = dBlock.lines.find((l) => /^The LFT Ch\. 29 paraphrase/.test(l))
  if (core.length !== 2) throw new Error('possessive: §D core distinction lines not found')

  // ── §A / §O rule tables
  const rules = []
  for (const [sec, re] of [['a', /^### §A — A-class rules/], ['o', /^### §O — O-class rules/]]) {
    const blk = sectionBlock(lines, re, /^### /)
    if (!blk) throw new Error(`possessive: §${sec.toUpperCase()} rules not found`)
    noteHarvest('possessive', blk.lines.join('\n'))
    for (const line of blk.lines) {
      const cells = splitRow(line)
      if (!cells || !/^\d+$/.test(cells[0])) continue
      rules.push({ n: parseInt(cells[0], 10), class: sec, rule: cells[1], citation: cells[2], samples: cells[3] || '' })
      tonganItalics(cells[3] || '', `possessive:rule-${sec}${cells[0]}`)
    }
  }
  if (rules.length === 0) throw new Error('possessive: zero class rules parsed')

  // ── §X exceptions
  const xBlk = sectionBlock(lines, /^### §X — Major exception classes/, /^---/)
  if (!xBlk) throw new Error('possessive: §X not found')
  noteHarvest('possessive', xBlk.lines.join('\n'))
  const exceptions = []
  for (const line of xBlk.lines) {
    const cells = splitRow(line)
    if (!cells || !/^Ex-\d+$/.test(cells[0])) continue
    exceptions.push({ id: cells[0], rule: cells[1].replace(/\*\*/g, ''), citation: cells[2], notes: cells[3] || '' })
    tonganItalics(`${cells[1]} ${cells[3] || ''}`, `possessive:${cells[0]}`)
  }

  // ── §I alphabetical master index (the table Tier 1 actually looks nouns up in)
  const iBlk = sectionBlock(lines, /^## §I — Alphabetical master index/)
  if (!iBlk) throw new Error('possessive: §I not found')
  noteHarvest('possessive', iBlk.lines.join('\n'))
  const index = []
  for (const line of iBlk.lines) {
    const cells = splitRow(line)
    if (!cells) continue
    const nm = cells[0].match(/^\*([^*]+)\*(.*)$/)
    if (!nm) continue
    const noun = nm[1].trim()
    const alt = [...cells[0].matchAll(/\*([^*]+)\*/g)].map((m) => m[1].trim()).slice(1)
    const cls = (cells[1] || '').trim()
    if (!/^(a|o|mixed|—|a \(verb\)\/o \(resulting fall\))$/i.test(cls)) continue
    index.push({ noun, alt, class: cls, source: cells[2] || '', notes: cells[3] || '' })
    tongan(noun, 'possessive:index')
    for (const a of alt) tongan(a, 'possessive:index')
  }
  if (index.length < 150) throw new Error(`possessive: §I parsed only ${index.length} rows — expected ~180+`)

  // ── §S class-shifting nouns
  const sBlk = sectionBlock(lines, /^## §S — Class-shifting nouns/)
  if (!sBlk) throw new Error('possessive: §S not found')
  noteHarvest('possessive', sBlk.lines.join('\n'))
  const shifters = []
  for (const line of sBlk.lines) {
    const cells = splitRow(line)
    if (!cells || !/^\*/.test(cells[0]) || cells.length < 4) continue
    if (/^Noun$/i.test(cells[0])) continue
    shifters.push({ noun: cells[0], aClass: cells[1], oClass: cells[2], citation: cells[3] })
    for (const c of cells.slice(0, 3)) tonganItalics(c, 'possessive:shifters')
  }

  // ── §P possessive prefix paradigm
  const pBlk = sectionBlock(lines, /^## §P — Possessive prefix paradigm/)
  if (!pBlk) throw new Error('possessive: §P not found')
  noteHarvest('possessive', pBlk.lines.join('\n'))
  const paradigm = []
  for (const line of pBlk.lines) {
    const cells = splitRow(line)
    if (!cells || cells.length < 3 || /^Form$/i.test(cells[0])) continue
    paradigm.push({ form: cells[0], a: cells[1], o: cells[2], use: cells[3] || '' })
    for (const c of cells.slice(1, 4)) for (const t of italics(c)) tongan(t.replace(/["]/g, ''), 'possessive:paradigm')
  }

  return { core, paraphrase: paraphrase ? paraphrase.trim() : null, rules, exceptions, index, shifters, paradigm }
}

// ---------------------------------------------------------------------------
// 4. Negation — source-materials/Negation-Paradigm.md §A
// ---------------------------------------------------------------------------

function harvestNegation(src) {
  const lines = src.split('\n')
  const aBlk = sectionBlock(lines, /^## §A — The basic negator/)
  if (!aBlk) throw new Error('negation: §A not found')
  noteHarvest('negation', aBlk.lines.join('\n'))

  const entries = []
  let cur = null
  for (const l of aBlk.lines) {
    const h = l.match(/^### (§A\.\d+)\s+—\s+(.+)$/)
    if (h) {
      if (cur) entries.push(cur)
      cur = { id: h[1], title: h[2].trim(), form: null, examples: [], frame: null, table: [] }
      continue
    }
    if (!cur) continue
    // The label may itself contain italics — `**Example (attested, with *ʻi
    // ai*):**` — so it cannot be matched with a no-asterisk class.
    const b = l.match(/^- \*\*(.+?):?\*\*\s*(.*)$/)
    if (b) {
      const [, label, body] = b
      if (/^Form$/i.test(label)) cur.form = body.trim()
      else if (/^Example/i.test(label)) cur.examples.push(body.trim())
      else if (/^Frame$/i.test(label)) cur.frame = body.trim()
      tonganItalics(body, `negation:${cur.id}`)
      continue
    }
    const cells = splitRow(l)
    if (cells && cells.length >= 2) {
      cur.table.push(cells)
      for (const c of cells) tonganItalics(c, `negation:${cur.id}`)
    }
  }
  if (cur) entries.push(cur)
  if (entries.length < 5) throw new Error(`negation: parsed only ${entries.length} §A entries`)

  // D4 (2026-07-27) — compile-time tag correction, applied here so the source
  // file is left untouched. Negation-Paradigm §A.2 tags ordinary pronoun
  // negation `verbal_negation (grammar-spec §7)`, but Frame-Index says §7 is
  // `negation`; `verbal_negation` is a DIFFERENT frame (*Mahalo* + ʻoku ʻikai …,
  // "perhaps … not") carrying no grammar-spec § at all — and it is ⚠ not-yet-
  // certified, so a correct pronoun negation would escalate on a naming
  // artefact. Remap only the §7 case; leave every other tag alone.
  let retagged = 0
  for (const e of entries) {
    if (e.frame && /`verbal_negation`/.test(e.frame) && /§7\b/.test(e.frame)) {
      e.frame = e.frame.replace('`verbal_negation`', '`negation`')
      e.frame_corrected_from = 'verbal_negation'
      retagged += 1
    }
  }
  if (retagged === 0) {
    warn('negation: the D4 verbal_negation→negation §7 remap matched nothing — if Negation-Paradigm.md was fixed upstream, delete the remap')
  }

  // §A's lead paragraph carries the positional rule.
  const lead = aBlk.lines.find((l) => /all-purpose verbal negator/.test(l))
  if (lead) tonganItalics(lead, 'negation:lead')

  return { lead: lead ? lead.trim() : null, entries }
}

// ---------------------------------------------------------------------------
// 5. House rules — DECISIONS.md Linguistics + the accent canon
// ---------------------------------------------------------------------------

/** Compress a DECISIONS bullet to its ruling, keeping the date + the Tongan. */
function compressRuling(bullet) {
  const m = bullet.match(/^- \*\*(\d{4}-\d{2}-\d{2})\s+—\s+([\s\S]*?)\*\*(?::)?\s*([\s\S]*)$/)
  if (!m) return null
  const [, date, headline, body] = m
  // The operative rule is the body's opening sentence; the rest is the audit
  // trail (blast radius, plan paths, follow-ups) and is dropped. A very short
  // opener usually leaves its imperative in the NEXT sentence ("Don't 'fix' one
  // into the other."), so a short first sentence pulls the second along.
  const sentences = body
    .replace(/\([^)]*`\/kickoff`[^)]*\)/g, '')
    .split(/(?<=\.)\s+(?=[A-Z*ʻ'])/)
  let detail = (sentences[0] || '').trim()
  if (detail.length < 90 && sentences[1] && detail.length + sentences[1].length < 260) {
    detail = `${detail} ${sentences[1].trim()}`
  }
  return {
    date,
    headline: headline.replace(/\*\*/g, '').replace(/[.\s]+$/, '').trim(),
    detail: detail.replace(/^[:\s]+/, '').trim(),
  }
}

/** The Tongan terms a DECISIONS ruling quotes (shape-filtered — see looksTongan). */
function rulingTonganTerms(rule) {
  const spans = [
    ...[...rule.headline.matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    ...italics(rule.detail),
  ]
  return spans.map((s) => s.trim()).filter((s) => s && looksTongan(s))
}

function harvestHouseRules(decisionsSrc, accentSrc) {
  const lines = decisionsSrc.split('\n')
  const blk = sectionBlock(lines, /^## Linguistics \(Tongan\)/)
  if (!blk) throw new Error('DECISIONS: "## Linguistics (Tongan)" section not found')
  noteHarvest('decisions', blk.lines.join('\n'))

  const rules = []
  for (const line of blk.lines) {
    if (!/^- \*\*\d{4}-\d{2}-\d{2}/.test(line)) continue
    const r = compressRuling(line)
    if (!r) continue
    rules.push(r)
    for (const t of rulingTonganTerms(r)) tongan(t, 'house-rules:decisions')
  }
  if (rules.length < 5) throw new Error(`DECISIONS: parsed only ${rules.length} linguistics rulings`)

  // The 2026-06-10 definitive/stress accent canon (the té rulings).
  const canonLine = accentSrc.split('\n').find((l) => /\*\*Resulting canon:\*\*/.test(l))
  if (!canonLine) throw new Error('accent audit: "Resulting canon" line not found')
  noteHarvest('accentAudit', canonLine)
  const canon = canonLine
    .replace(/^>\s*-\s*/, '')
    .replace(/\*\*Resulting canon:\*\*\s*/, '')
    .split(/\.\s+Verified mechanically/)[0]
    .trim()
  const accentRule = {
    date: '2026-06-10',
    headline: 'Stress accent on the te-family before any one-syllable pronoun',
    detail: `${canon}. So *Té u*, *Té ke*, *Té ne*, *Naʻá ku*, *ʻikai té*, *ʻoua té*, *teʻeki té*, *taʻe té* are CORRECT; two-syllable pronouns stay bare, as in *Te nau* and *ʻoua te mou*.`,
  }
  rules.push(accentRule)
  for (const t of rulingTonganTerms(accentRule)) tongan(t, 'house-rules:accent-canon')

  return rules
}

// ---------------------------------------------------------------------------
// 6. Few-shot pairs — Translation-Log.md (headings normalized at harvest time)
// ---------------------------------------------------------------------------

/**
 * Parse the log into verified pairs. Every entry keeps its own direction; a
 * TO→EN entry still yields a verified (English, Tongan) pair — the derivation
 * ran the other way, which is recorded, not hidden.
 *
 * "Lint-clean claims only" is enforced from the entry's own evidence: an entry
 * whose Step 4.5 citation self-check contains a ✗ (an unresolved citation) is
 * dropped. Heading drift in the historical log is a non-blocking lint warning
 * by design (check-citations LAX_KINDS), so it does not disqualify a pair —
 * and no heading text is carried into the pack anyway, since Tier 1 emits no
 * citations.
 */
function harvestFewShot(src, legalFrames) {
  const lines = src.split('\n')
  const heads = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^## (\d{4}-\d{2}-\d{2})\s+—\s+(EN→TO|TO→EN)\s+—\s+(.+)$/)
    if (m) heads.push({ date: m[1], direction: m[2], label: m[3].trim(), start: i })
  }
  if (heads.length === 0) throw new Error('log: zero entries parsed')

  const pairs = []
  const rejected = []
  for (let h = 0; h < heads.length; h++) {
    const start = heads[h].start
    const end = h + 1 < heads.length ? heads[h + 1].start : lines.length
    const body = lines.slice(start, end)
    const blockText = body.join('\n')

    const inputLine = body.find((l) => /^\*\*Input:\*\*/.test(l))
    const asmLine = body.find((l) => /^\*\*Assembled:\*\*/.test(l))
    if (!inputLine || !asmLine) { rejected.push({ ...heads[h], why: 'no Input/Assembled pair' }); continue }

    const input = inputLine.replace(/^\*\*Input:\*\*\s*/, '').trim()
    const assembled = asmLine.replace(/^\*\*Assembled:\*\*\s*/, '').trim()

    // Step 4.5 self-check must not carry an unresolved citation. An entry that
    // states "No ✗ rows" is declaring the opposite, so strip those phrases
    // before testing for a real ✗ mark.
    const selfCheck = blockText.replace(/\b[Nn]o ✗[^.;\n]*/g, '')
    if (/✗/.test(selfCheck)) { rejected.push({ ...heads[h], why: 'Step 4.5 records an unresolved (✗) citation' }); continue }

    // Normalize the label: strip the historical verification suffixes.
    const label = heads[h].label
      .replace(/^"/, '').replace(/"$/, '')
      .replace(/"\s*\([^)]*verification[^)]*\)\s*$/i, '')
      .replace(/\s*\(T\d[a-z]? verification[^)]*\)\s*$/i, '')
      .trim()

    // Frame: first backticked tag on the Frame bullet, validated against the
    // lint's closed set. A prose-only Frame line yields an untagged pair.
    const frameLine = body.find((l) => /^- \*\*Frame:\*\*/.test(l))
    let frame = null
    if (frameLine) {
      for (const m of frameLine.matchAll(/`([^`]+)`/g)) {
        if (legalFrames.has(m[1])) { frame = m[1]; break }
      }
    }

    const english = heads[h].direction === 'EN→TO' ? input : assembled
    const tonganText = heads[h].direction === 'EN→TO' ? assembled : input

    // Strip markdown italics/quotes off the Tongan sentence.
    // Markdown emphasis is display noise in a prompt; the Tongan is already
    // identified by its position in the pair.
    const tonganClean = tonganText.replace(/\*/g, '').replace(/^"+|"+$/g, '').trim()
    const englishClean = english.replace(/\*/g, '').replace(/^"+|"+$/g, '').replace(/\s+/g, ' ').trim()
    if (!tonganClean || !englishClean) {
      // e.g. the shop-dialogue entry, whose Input is a multi-line exchange
      // rather than one sentence — not a few-shot pair.
      rejected.push({ ...heads[h], why: 'no single-sentence Input/Assembled pair on one line (multi-line entry)' })
      continue
    }

    tongan(tonganClean, `few-shot:${heads[h].date}`)
    pairs.push({
      date: heads[h].date,
      label,
      english: englishClean,
      tongan: tonganClean,
      frame,
      derived_from: heads[h].direction,
    })
  }
  noteHarvest('log', pairs.map((p) => `${p.date}|${p.frame || '-'}|${p.english}|${p.tongan}`).join('\n'))
  return { pairs, rejected, entryCount: heads.length }
}

/**
 * Order the few-shot pool: recent first, but round-robin by frame so the pool
 * is frame-diverse rather than nine `statement`s deep (Q3b: "prefer recent +
 * frame-diverse"). Untagged pairs follow, newest first.
 */
function orderFewShot(pairs) {
  const tagged = pairs.filter((p) => p.frame).sort((a, b) => b.date.localeCompare(a.date))
  const untagged = pairs.filter((p) => !p.frame).sort((a, b) => b.date.localeCompare(a.date))
  const byFrame = new Map()
  for (const p of tagged) {
    if (!byFrame.has(p.frame)) byFrame.set(p.frame, [])
    byFrame.get(p.frame).push(p)
  }
  const queues = [...byFrame.values()]
  const out = []
  let moved = true
  while (moved) {
    moved = false
    for (const q of queues) {
      if (q.length) { out.push(q.shift()); moved = true }
    }
  }
  return { tagged: out, untagged }
}

// ---------------------------------------------------------------------------
// 7. The allow-set
// ---------------------------------------------------------------------------

function buildAllowSet({ ealdSrc, bookVocabSrc, graphSrc, possessive, negation, frameIndex, fewShot, houseRules }) {
  const buckets = {}
  const all = new Map() // folded token → Set of bucket names

  const add = (bucket, raw) => {
    for (const t of tonganTokens(raw)) {
      if (!buckets[bucket]) buckets[bucket] = new Set()
      buckets[bucket].add(t)
      if (!all.has(t)) all.set(t, new Set())
      all.get(t).add(bucket)
    }
  }

  // ── EALD surface forms (multi-word headwords contribute each word too)
  const eald = JSON.parse(ealdSrc)
  let ealdEntries = 0
  for (const [, list] of Object.entries(eald.categories || {})) {
    for (const e of list) {
      if (!e || !e.tongan) continue
      ealdEntries += 1
      add('eald', e.tongan)
    }
  }

  // ── book vocabulary
  const bookVocab = JSON.parse(bookVocabSrc)
  for (const v of bookVocab) if (v && v.tongan) add('book-vocabulary', v.tongan)

  // ── grammar-graph node words (every form the live engine can emit)
  const graph = JSON.parse(graphSrc)
  let graphWords = 0
  for (const [, node] of Object.entries(graph.nodes || {})) {
    for (const w of node.words || []) {
      if (w && w.tongan) { add('grammar-graph', w.tongan); graphWords += 1 }
      if (w && w.emotional_form && w.emotional_form.tongan) add('grammar-graph', w.emotional_form.tongan)
      if (w && w.definitive_accent_form) add('grammar-graph', w.definitive_accent_form)
      if (w && w.ta_e_form) add('grammar-graph', w.ta_e_form)
    }
  }

  // ── the closed particle / paradigm inventory: every attested function word
  //    the pack itself teaches, harvested (never typed from memory) from the
  //    negation paradigm, the frame-index disambiguators, and the possessive
  //    prefix paradigm.
  //    Only italic spans are taken: the surrounding prose is English, and
  //    letting it in would put "verb", "pronoun" and "form" in the allow-set.
  for (const e of negation.entries) {
    for (const t of italics(e.form || '')) add('particles-and-paradigm', t)
    for (const ex of e.examples) for (const t of italics(ex)) add('particles-and-paradigm', t)
    for (const row of e.table) for (const c of row) for (const t of italics(c)) add('particles-and-paradigm', t)
  }
  for (const d of frameIndex.disambiguators) for (const r of d.rules) for (const t of italics(r)) add('particles-and-paradigm', t)
  for (const p of possessive.paradigm) for (const c of [p.a, p.o, p.use]) for (const t of italics(c)) add('particles-and-paradigm', t.replace(/"/g, ''))

  // ── the possessive-class index: 180+ Churchward-sourced nouns that are not
  //    all in EALD/book vocab, and which P6 requires an output to be able to use.
  for (const row of possessive.index) { add('possessive-class-master', row.noun); for (const a of row.alt) add('possessive-class-master', a) }
  for (const s of possessive.shifters) for (const c of [s.noun, s.aClass, s.oClass]) for (const t of italics(c)) add('possessive-class-master', t)
  for (const x of possessive.exceptions) for (const t of italics(`${x.rule} ${x.notes}`)) add('possessive-class-master', t)
  for (const r of possessive.rules) for (const t of italics(r.samples)) add('possessive-class-master', t)

  // ── Tongan terms the standing rulings quote (shape-filtered, so the section's
  //    English — book titles, slash commands — cannot leak into the guard).
  for (const r of houseRules) for (const t of rulingTonganTerms(r)) add('decisions-quoted-terms', t)

  // ── the verified log corpus: every Tongan sentence that survived the deep
  //    method's six steps + Step 4.5. Kept as its own bucket so the guard's
  //    composition stays visible (see the allow-set file's `note`).
  for (const p of fewShot) add('translation-log', p.tongan)

  const bucketCounts = {}
  for (const [k, v] of Object.entries(buckets)) bucketCounts[k] = v.size

  return {
    tokens: [...all.keys()].sort(),
    bucketCounts,
    bucketsOf: all,
    stats: { ealdEntries, graphWords, bookVocabEntries: bookVocab.length },
  }
}

// ---------------------------------------------------------------------------
// 8. Prompt rendering — every line derives from the structured data above
// ---------------------------------------------------------------------------

function renderPrompt(d) {
  const S = []
  const push = (id, title, body) => S.push({ id, title, body: body.trim() })

  push('role', 'Role and output contract', `
You translate a single English sentence into Tongan, in ONE pass, using ONLY the knowledge in this prompt. Do not look anything up; there are no tools and no other sources. This is the course's fast path: the deep, citation-verified path is a separate skill.

Return exactly this JSON object and nothing else:

{ "tongan": "<the Tongan sentence>",
  "frame": "<one tag from the closed frame set below>",
  "confidence": "high" | "medium" | "low",
  "notes": "<at most two short notes, or empty>",
  "escalate": false,
  "escalate_reason": null }

Rules on the contract:
- "tongan" is PLAIN TEXT: no markdown, no italics, no quotation marks around it. Write the sentence as it would be printed, with its macrons, its fakauʻa (ʻ), and its stress/definitive accents.
- NEVER emit citations. The frame tag is the only metadata this path is allowed to claim. A citation produced without the deep path's verification loop is a fabrication wearing a scholarly costume.
- Every Tongan word you write must be a word you actually know from this prompt or from the course's vocabulary. Never invent a Tongan word, an inflection, or a particle to fill a gap. If you cannot say it with real Tongan, set "escalate": true and say why.
- Set "escalate": true when the sentence needs an idiom resolved, has more than two finite clauses, is reported speech or a counterfactual, uses a possessed noun that is not in the possessive-class table below, or needs a frame outside the allowed list. Escalation is a correct answer, not a failure.
- Your own confidence may TRIGGER escalation but can never prevent it: the caller re-checks your output mechanically.
`)

  push('method', 'Method rules (from the course translation method)', [
    ...d.methodRules.map((r) => `**${r.title}.** ${r.text}`),
  ].join('\n\n'))

  // Rendered with DECISIONS' own punctuation (`- **date — headline**: body`).
  // Several bodies continue their headline's sentence ("…plural `ō`" + "in app
  // exercises: …"), so any other joiner would garble them.
  push('house', 'House rules (standing project rulings — these override any general intuition)',
    d.houseRules.map((r) => `- **${r.date} — ${r.headline}**: ${r.detail}`).join('\n'))

  const frameRows = Object.values(d.frames)
    .sort((a, b) => a.tag.localeCompare(b.tag))
    .map((f) => {
      const sec = f.section ? f.section : '—'
      const tpl = f.template ? f.template : '—'
      const dis = f.disambiguators.length ? ` [${f.disambiguators.join(', ')}]` : ''
      const gate = d.escalateFrames.includes(f.tag)
        ? ' ⚠ escalate (always)'
        : d.allowedFrames.includes(f.tag) ? '' : ' ⚠ escalate (not yet certified)'
      return `| \`${f.tag}\` | ${sec} | ${tpl} |${dis}${gate} |`
    })

  push('frames', 'Frame index — the closed set of legal frame tags', `
Pick the frame first, then fill its slots in the canonical order. The tag you return must be one of these exactly; a tag not on this list is a hard error.

Bracketed names in a slot template (\`[tense_marker]\`, \`[possessive_head_noun]\`) are notation for the slot, NOT Tongan words. Never write one into the output.

⚠ marks a frame this fast path may NOT answer — "always" for the frame families the fast path is permanently barred from, "not yet certified" for frames without enough verified coverage. Name the ⚠ frame only to explain an escalation.

| Frame tag | grammar-spec § | Slot template | Notes |
|---|---|---|---|
${frameRows.join('\n')}
`)

  push('disambiguators', `Marker disambiguators — the ${d.disambiguators.length} choices that are easy to get wrong`,
    d.disambiguators.map((x) => `**${x.title}**\n${x.rules.map((r) => `- ${r}`).join('\n')}${x.source ? `\n(${x.source})` : ''}`).join('\n\n'))

  const posRules = d.possessive.rules.map((r) => `| ${r.n} | ${r.class}-class | ${r.rule} | ${r.samples} |`)
  const posEx = d.possessive.exceptions.map((x) => `| ${x.id} | ${x.rule} | ${x.notes} |`)
  const posIdx = d.possessive.index.map((r) => {
    const gloss = (r.notes || '').split(/\s+[—-]\s+/)[0].trim()
    return `| *${r.noun}* | ${r.class} | ${gloss} |`
  })
  const posShift = d.possessive.shifters.map((s) => `- ${s.noun}: a-class ${s.aClass}; o-class ${s.oClass}`)
  const posPara = d.possessive.paradigm.map((p) => `| ${p.form} | ${p.a} | ${p.o} | ${p.use} |`)

  push('possessive', 'Possessive class (a-class vs o-class) — the full table', `
${d.possessive.core.join('\n')}
${d.possessive.paraphrase || ''}

The rules:

| # | Class | Rule | Sample nouns |
|---|---|---|---|
${posRules.join('\n')}

Exceptions that override the rules:

| # | Exception | Notes |
|---|---|---|
${posEx.join('\n')}

Prefix paradigm:

| Form | a-class | o-class | Use |
|---|---|---|---|
${posPara.join('\n')}

Class-shifting nouns (the reading decides the class):
${posShift.join('\n')}

**The noun index (${d.possessive.index.length} nouns).** If the possessed noun is here, use this class. If it is NOT here, escalate rather than guess. "mixed" means the class follows the reading (see the shifters above).

| Noun | Class | Meaning |
|---|---|---|
${posIdx.join('\n')}
`)

  const negBlocks = d.negation.entries.map((e) => {
    const parts = [`**${e.id} — ${e.title}**`]
    if (e.form) parts.push(`Form: ${e.form}`)
    if (e.frame) parts.push(`Frame: ${e.frame}`)
    for (const ex of e.examples) parts.push(`Example: ${ex}`)
    if (e.table.length > 1) {
      // Re-insert the markdown separator row that splitRow drops, so the table
      // renders as a table rather than a run of pipe-separated lines.
      const [head, ...rest] = e.table
      parts.push([
        `| ${head.join(' | ')} |`,
        `|${head.map(() => '---').join('|')}|`,
        ...rest.map((r) => `| ${r.join(' | ')} |`),
      ].join('\n'))
    }
    return parts.join('\n')
  })

  push('negation', 'Negation paradigm (§A — the basic negator *ʻikai*)',
    `${d.negation.lead || ''}\n\n${negBlocks.join('\n\n')}`)

  const render = (p, withFrame) => `EN: ${p.english}\nTO: ${p.tongan}${withFrame ? `\nframe: \`${p.frame}\`` : ''}`
  const answerable = d.fewShot.tagged.filter((p) => d.allowedFrames.includes(p.frame))
  const escalators = d.fewShot.tagged.filter((p) => !d.allowedFrames.includes(p.frame))

  push('examples', 'Verified examples (from the course\'s own citation-checked translation log)', `
Every pair below came out of the deep six-step method with every row cited and re-verified. Match their register and their orthography (fakauʻa, macrons, stress accents, definitive accents).

${answerable.map((p) => render(p, true)).join('\n\n')}
${escalators.length ? `\n**Recognise-and-escalate examples.** These are correct translations, but their frames are ⚠ on this path. Study them to RECOGNISE the pattern in an input; do not answer one — escalate it.\n\n${escalators.map((p) => render(p, true)).join('\n\n')}` : ''}
${d.fewShot.untagged.length ? `\n**Verified pairs whose walkthrough recorded no frame tag from the closed set.** Use the Tongan; do not invent a frame from them.\n\n${d.fewShot.untagged.map((p) => render(p, false)).join('\n\n')}` : ''}
`)

  push('escalation', 'When to escalate', `
Set "escalate": true and explain in one line when any of these is true:
- The English needs an idiom or phrasal verb resolved first.
- The sentence has more than two finite clauses.
- It is reported speech ("said/told/asked that…") or a counterfactual ("would have…", "if … had …").
- A possessed noun is not in the noun index above.
- The frame you would need is marked ⚠, or is not on the list at all.
- Any word you would have to write is one you cannot vouch for as real Tongan.

Escalating costs nothing. Writing a Tongan word that does not exist is the one unrecoverable error.
`)

  const body = S.map((s) => `## ${s.title}\n\n${s.body}`).join('\n\n---\n\n')
  const header = `# Lea Faka-Tonga — fast translation pack (Tier 1)\n\nCompiled from the course's own checked sources. UNCERTIFIED: outputs from this pack must be labeled "uncertified — verify before use" until the accuracy gate passes.\n`
  const prompt = `${header}\n${body}\n`

  const sections = S.map((s) => ({
    id: s.id,
    title: s.title,
    chars: s.body.length,
    approx_tokens: approxTokens(s.body),
  }))
  return { prompt, sections }
}

// ---------------------------------------------------------------------------
// Run
//
// Two modes, one implementation:
//   (default)  build and WRITE the two artifacts
//   --verify   build in memory and compare against the committed artifacts;
//              exit 1 when a rule source has drifted (used by check-style)
// ---------------------------------------------------------------------------

const VERIFY = process.argv.includes('--verify')
const QUIET = VERIFY || process.argv.includes('--quiet')

const log = QUIET ? () => {} : console.log
const logWarn = QUIET ? () => {} : console.warn
const logErr = console.error

const problems = []
const warn = (m) => { problems.push({ level: 'warn', m }); logWarn(`  ⚠ ${m}`) }

log('\n── build-translate-pack ──\n')

// Read every source once, hash it, and keep the text.
const src = {}
for (const [key, meta] of Object.entries(SOURCES)) {
  const text = read(meta.rel)
  src[key] = text
  meta.bytes = Buffer.byteLength(text, 'utf8')
  meta.lines = text.split('\n').length
  meta.sha256 = sha(text)
}

// grammar-spec tripwire (CLAUDE.md hard constraint 2) — read-only check.
if (SOURCES.grammarSpec.lines < GRAMMAR_SPEC_FLOOR) {
  logErr(`  ✗ spec/grammar-spec.md is ${SOURCES.grammarSpec.lines} lines, below the ${GRAMMAR_SPEC_FLOOR} floor — refusing to build. See NEXT.md recovery procedure.`)
  process.exit(1)
}

// The closed frame set — the same harvest the lint enforces.
const { frameTags: legalFrames, entryPointCount } = await harvestFrameTags(src.grammarSpec)
if (legalFrames.size === 0) {
  logErr('  ✗ harvestFrameTags returned zero tags — grammar-spec\'s Entry Points Summary is missing or renamed.')
  process.exit(1)
}
log(`  frame set: ${legalFrames.size} legal tags (${entryPointCount} from Entry Points Summary)`)

// Harvest.
const methodRules = harvestMethodRules(src.method)
const frameIndex = harvestFrameIndex(src.frameIndex)
frameIndex.disambiguators.push(harvestKaKae(src.grammarSpec))
frameIndex.disambiguators.push(harvestEHe(src.chapter08))
const aspect = harvestAspect(src.aspect, src.chapter22)
frameIndex.disambiguators.push(aspect.disambiguator)
// The pack's frame table must BE the closed set the lint enforces, so a tag
// legal to the lint but absent from the generated index still appears (as a
// stub) rather than making the pack's own "these tags exactly" rule false.
const missingFromIndex = [...legalFrames].filter((t) => !frameIndex.frames[t]).sort()
for (const tag of missingFromIndex) {
  frameIndex.frames[tag] = { tag, section: null, template: null, disambiguators: [], missing_from_frame_index: true }
}
if (missingFromIndex.length) {
  log(`  note: ${missingFromIndex.length} legal tag(s) absent from spec/Frame-Index.md, added as stubs: ${missingFromIndex.join(', ')}`)
  log('        (spec/Frame-Index.md is generated — `npm run build:frame-index` will close the gap; not this script\'s to edit)')
}

const possessive = harvestPossessive(src.possessive)
const negation = harvestNegation(src.negation)
const houseRules = harvestHouseRules(src.decisions, src.accentAudit)
const { pairs, rejected, entryCount } = harvestFewShot(src.log, legalFrames)
const fewShot = orderFewShot(pairs)

log(`  method rules: ${methodRules.length}`)
log(`  frames: ${Object.keys(frameIndex.frames).length} · disambiguators: ${frameIndex.disambiguators.length}`)
log(`  possessive: ${possessive.index.length} indexed nouns · ${possessive.rules.length} rules · ${possessive.exceptions.length} exceptions · ${possessive.shifters.length} shifters`)
log(`  negation §A: ${negation.entries.length} entries`)
log(`  house rules: ${houseRules.length}`)
log(`  few-shot: ${pairs.length} verified pairs from ${entryCount} log entries (${fewShot.tagged.length} frame-tagged, ${fewShot.untagged.length} untagged)`)
for (const r of rejected) log(`    · skipped ${r.date} "${r.label}" — ${r.why}`)

// Allowed vs escalate frames (Q3b P5). Tier 1 may answer a frame that either
// has ≥3 verified log examples or is buildable by the live engine graph; the
// permanent escalate list is grammar-spec §39/§43/§44/§45/§50 plus the
// reported-speech tags whose section does not resolve in the frame index.
const graphJson = JSON.parse(src.graph)
const graphFrames = new Set((graphJson.entry_points || []).map((e) => e.id))
if (graphFrames.size === 0) throw new Error('grammar-graph.json: zero entry points parsed')
const logFrameCounts = {}
for (const p of pairs) if (p.frame) logFrameCounts[p.frame] = (logFrameCounts[p.frame] || 0) + 1

const ESCALATE_SECTIONS = new Set([39, 43, 44, 45, 50])
const ESCALATE_BY_NAME = new Set([
  'reported_speech_pehē', 'reported_speech_tui', 'reportative_tokua', 'bare_clause_juxtaposition',
  'subordinator_kapau', 'conditional_clause', 'ka_conditional', 'ka_ne_counterfactual',
])
const escalateFrames = []
const allowedFrames = []
for (const tag of Object.keys(frameIndex.frames)) {
  const f = frameIndex.frames[tag]
  const secNum = f.section ? parseInt(String(f.section).replace(/[^\d]/g, ''), 10) : NaN
  const escalate = ESCALATE_BY_NAME.has(tag) || (Number.isFinite(secNum) && ESCALATE_SECTIONS.has(secNum))
  const qualifies = (logFrameCounts[tag] || 0) >= 3 || graphFrames.has(tag)
  if (escalate) escalateFrames.push(tag)
  else if (qualifies) allowedFrames.push(tag)
}
escalateFrames.sort()
allowedFrames.sort()
log(`  frame gating: ${allowedFrames.length} Tier-1-allowed · ${escalateFrames.length} permanent-escalate · ${Object.keys(frameIndex.frames).length - allowedFrames.length - escalateFrames.length} unqualified (escalate by default)`)

// Allow-set.
const allow = buildAllowSet({
  ealdSrc: src.eald,
  bookVocabSrc: src.bookVocab,
  graphSrc: src.graph,
  possessive,
  negation,
  frameIndex,
  fewShot: pairs,
  houseRules,
})
log(`  allow-set: ${allow.tokens.length} folded tokens`)
for (const [k, v] of Object.entries(allow.bucketCounts)) log(`    · ${k}: ${v}`)

// Prompt.
const rendered = renderPrompt({
  methodRules,
  houseRules,
  frames: frameIndex.frames,
  disambiguators: frameIndex.disambiguators,
  escalateFrames,
  allowedFrames,
  possessive,
  negation,
  fewShot,
})

const tokens = approxTokens(rendered.prompt)
log(`\n  prompt: ${rendered.prompt.length} chars ≈ ${tokens} tokens (chars/4)`)
if (tokens < 8000 || tokens > 12000) warn(`token estimate ${tokens} is outside the 8,000–12,000 band`)

// ── Self-test 1: every Tongan token the pack quotes is in the allow-set
const allowSet = new Set(allow.tokens)
const CORE_BUCKETS = new Set(['eald', 'book-vocabulary', 'grammar-graph', 'particles-and-paradigm'])
const misses = []
let coreCovered = 0
let checked = 0
const seenTok = new Set()
for (const q of tonganQuotes) {
  for (const t of tonganTokens(q.text)) {
    checked += 1
    if (!allowSet.has(t)) { misses.push({ token: t, where: q.where, text: q.text }); continue }
    if (!seenTok.has(t)) {
      seenTok.add(t)
      const bs = allow.bucketsOf.get(t)
      if ([...bs].some((b) => CORE_BUCKETS.has(b))) coreCovered += 1
    }
  }
}
log(`\n  self-test 1 (pack Tongan ⊆ allow-set): ${checked} token instances, ${seenTok.size} distinct`)
log(`    ${coreCovered}/${seenTok.size} distinct tokens covered by the core union (EALD ∪ book vocab ∪ graph ∪ particles)`)
if (misses.length) {
  logErr(`  ✗ self-test 1 FAILED — ${misses.length} token(s) outside the allow-set:`)
  const shown = new Set()
  for (const m of misses) {
    if (shown.has(m.token)) continue
    shown.add(m.token)
    logErr(`     · "${m.token}"  (${m.where})  ← ${m.text.slice(0, 90)}`)
  }
  process.exit(1)
}
log('    ✓ every Tongan token the pack quotes passes the allow-set')

// ── Self-test 2: every frame tag the pack names is in the lint's closed set
const packFrames = new Set([
  ...Object.keys(frameIndex.frames),
  ...pairs.filter((p) => p.frame).map((p) => p.frame),
  ...allowedFrames,
  ...escalateFrames,
])
const badFrames = [...packFrames].filter((t) => !legalFrames.has(t))
if (badFrames.length) {
  logErr(`  ✗ self-test 2 FAILED — frame tag(s) outside the lint's closed set: ${badFrames.join(', ')}`)
  process.exit(1)
}
log(`  self-test 2 (frame tags ⊆ lint closed set): ✓ ${packFrames.size} tags, all legal`)

// ── Emit
const sourceRecord = {}
for (const [key, meta] of Object.entries(SOURCES)) {
  const slices = harvestSlices.get(key)
  sourceRecord[meta.rel] = {
    sha256: meta.sha256,
    harvest_sha256: slices ? sha(slices.join('\n \n')) : null,
    bytes: meta.bytes,
    lines: meta.lines,
    drift: meta.drift,
  }
}

const pack = {
  _note: 'GENERATED FILE — do not edit. Rebuild with `npm run build:translate-pack` (from lea-faka-tonga-app/).',
  generated_by: 'lea-faka-tonga-app/scripts/build-translate-pack.mjs',
  rebuild: REBUILD_CMD,
  contract: 'reviews/translate-pipeline-analysis.md — Q3b "Tier 1 — strong model, compiled pack", Q5 build step, R3',
  status: 'UNCERTIFIED — every output built on this pack must be labeled "uncertified — verify before use" until the accuracy gate (follow-up ④) passes.',
  schema_version: 1,
  generated_from: sourceRecord,
  token_estimate: {
    chars: rendered.prompt.length,
    approx_tokens: tokens,
    method: 'chars / 4',
    target_band: [8000, 12000],
    in_band: tokens >= 8000 && tokens <= 12000,
  },
  counts: {
    frames: Object.keys(frameIndex.frames).length,
    frames_allowed: allowedFrames.length,
    frames_escalate: escalateFrames.length,
    disambiguators: frameIndex.disambiguators.length,
    possessive_nouns: possessive.index.length,
    possessive_rules: possessive.rules.length,
    possessive_exceptions: possessive.exceptions.length,
    negation_entries: negation.entries.length,
    aspect_markers: aspect.markers.length,
    house_rules: houseRules.length,
    method_rules: methodRules.length,
    few_shot_total: pairs.length,
    few_shot_frame_tagged: fewShot.tagged.length,
    few_shot_untagged: fewShot.untagged.length,
    log_entries_seen: entryCount,
  },
  system_prompt: rendered.prompt,
  sections: rendered.sections,
  // Machine-readable mirrors of the same harvest the prompt is rendered from,
  // so the /vave guard (P5/P6) never has to re-parse the prompt text.
  data: {
    method_rules: methodRules,
    house_rules: houseRules,
    frames: frameIndex.frames,
    disambiguators: frameIndex.disambiguators,
    allowed_frames: allowedFrames,
    escalate_frames: escalateFrames,
    log_frame_counts: logFrameCounts,
    possessive: {
      core: possessive.core,
      paraphrase: possessive.paraphrase,
      rules: possessive.rules,
      exceptions: possessive.exceptions,
      paradigm: possessive.paradigm,
      shifters: possessive.shifters,
      index: possessive.index,
    },
    negation: negation,
    // D1 — the guard's P8 reads these markers rather than carrying its own copy,
    // so the pack stays the single source of the aspect inventory.
    aspect: { markers: aspect.markers, disambiguator: aspect.disambiguator },
    few_shot: { tagged: fewShot.tagged, untagged: fewShot.untagged, rejected },
  },
}

const allowset = {
  _note: 'GENERATED FILE — do not edit. Rebuild with `npm run build:translate-pack` (from lea-faka-tonga-app/).',
  generated_by: 'lea-faka-tonga-app/scripts/build-translate-pack.mjs',
  rebuild: REBUILD_CMD,
  purpose: 'The P4 guard: every Tongan token in a fast-path output must fold to a member of `tokens`. An out-of-set token is potential fabricated Tongan and the output is never shown.',
  schema_version: 1,
  generated_from: sourceRecord,
  folding: {
    description: 'Compare by folding both sides with these steps, in order.',
    steps: [
      "1. Unify every glottal-stop glyph the sources use — ASCII ' (U+0027), curly ‘ (U+2018) and ’ (U+2019), backtick (U+0060), acute-accent glyph (U+00B4) — to the fakauʻa, U+02BB. The mark is phonemic (taʻu ≠ tau) and is KEPT, never stripped.",
      '2. Normalize to NFD and drop all combining marks (U+0300–U+036F). This folds away the definitive/stress acute (applied productively per noun phrase) and the macron (written inconsistently across the sources).',
      '3. Lowercase.',
      '4. Trim any leading/trailing character that is not a–z or U+02BB (punctuation, quotes, brackets, markdown emphasis).',
      '5. Split on whitespace, punctuation, and hyphens; check each resulting word.',
    ],
    known_limitation: 'Because step 2 folds the macron, a fabricated token differing from a real word ONLY by a macron (e.g. *mama* vs *māmā*) would pass this guard. That is a deliberate trade: false rejections of correct output are the more likely and more damaging failure, and the definitive accent is applied productively so it cannot be checked literally.',
  },
  counts: { total: allow.tokens.length, by_source: allow.bucketCounts },
  source_notes: {
    eald: `source-materials/EALD-Dictionary.json — ${allow.stats.ealdEntries} headword entries (multi-word headwords also contribute each component word)`,
    'book-vocabulary': `src/data/book-vocabulary.json — ${allow.stats.bookVocabEntries} entries`,
    'grammar-graph': `src/data/grammar-graph.json — ${allow.stats.graphWords} node word forms (plus emotional/definitive-accent variants)`,
    'particles-and-paradigm': 'The closed particle inventory, harvested (never typed from memory) from Negation-Paradigm §A forms/examples/tables, the Frame-Index marker disambiguators, and Possessive-Class-Master §P.',
    'possessive-class-master': 'The §I noun index, §S shifters, §X exceptions and §A/§O rule samples. Included because P6 requires an output\'s possessed head noun to BE in this table, and many of these Churchward-sourced nouns are not EALD headwords.',
    'translation-log': 'Every Tongan sentence in Translation-Log.md that survived the deep method including its Step 4.5 citation self-check. Kept as its own bucket so the composition of this guard stays visible: it whitelists what the project has already verified, not everything a model might produce.',
  },
  tokens: allow.tokens,
}

// ── --verify: is the committed artifact what this builder produces today? ──
//
// Severity follows each source's `drift` flag. A rule source (the method spec,
// the frame index, the possessive/negation sheets, DECISIONS, the accent canon,
// grammar-spec, Ch 8) changing its harvested slice means the shipped pack now
// contradicts the sources → hard error. Translation-Log and the vocabulary
// files are additive: a bigger corpus leaves the pack stale, never wrong → warn.
if (VERIFY) {
  const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null } }
  const committedPack = readJson(OUT_PACK)
  const committedAllow = readJson(OUT_ALLOWSET)

  if (!committedPack || !committedAllow) {
    logErr(`  ✗ translate pack missing or unreadable (src/data/translate-pack.json, translate-allowset.json) — run \`${REBUILD_CMD}\``)
    process.exit(1)
  }

  const hard = []
  const soft = []
  const committedSources = committedPack.generated_from || {}
  for (const [rel, fresh] of Object.entries(sourceRecord)) {
    const old = committedSources[rel]
    if (!old) { hard.push(`${rel} is a new pack input, absent from the committed pack`); continue }
    if (old.harvest_sha256 !== fresh.harvest_sha256) {
      const msg = `${rel} — the slice the pack quotes has changed since it was built`
      ;(fresh.drift === 'hard' ? hard : soft).push(msg)
    } else if (old.sha256 !== fresh.sha256) {
      soft.push(`${rel} — file changed, but nothing the pack quotes moved`)
    }
  }

  const outputChanged =
    sha(committedPack.system_prompt || '') !== sha(pack.system_prompt) ||
    sha(JSON.stringify(committedAllow.tokens || [])) !== sha(JSON.stringify(allowset.tokens))
  if (outputChanged && hard.length === 0 && soft.length === 0) {
    hard.push('the committed artifacts differ from what the builder produces (builder changed, or a file was hand-edited)')
  }

  for (const m of hard) console.log(`  ✗ ${m}`)
  for (const m of soft) console.log(`  ⚠ ${m}`)
  if (hard.length) {
    console.log(`  ${hard.length} stale pack input(s) — rerun \`${REBUILD_CMD}\``)
    process.exit(1)
  }
  if (soft.length) console.log(`  (non-blocking: rerun \`${REBUILD_CMD}\` when convenient to pick these up)`)
  else console.log(`  ✓ translate pack + allow-set match their ${Object.keys(sourceRecord).length} sources (${pack.token_estimate.approx_tokens} tokens, ${allowset.counts.total} allowed tokens)`)
  process.exit(0)
}

fs.writeFileSync(OUT_PACK, JSON.stringify(pack, null, 2) + '\n', 'utf8')
fs.writeFileSync(OUT_ALLOWSET, JSON.stringify(allowset, null, 2) + '\n', 'utf8')

log(`\n  wrote ${path.relative(REPO_ROOT, OUT_PACK)}  (${(fs.statSync(OUT_PACK).size / 1024).toFixed(1)} KB)`)
log(`  wrote ${path.relative(REPO_ROOT, OUT_ALLOWSET)}  (${(fs.statSync(OUT_ALLOWSET).size / 1024).toFixed(1)} KB)`)
log(`\n  ${problems.length ? `${problems.length} warning(s)` : 'no warnings'} — pack is UNCERTIFIED until the accuracy gate passes.\n`)
