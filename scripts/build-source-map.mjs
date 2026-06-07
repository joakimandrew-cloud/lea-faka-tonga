#!/usr/bin/env node
/**
 * build-source-map.mjs — Phase P (Source-Fidelity Audit) Stage 0 tool.
 *
 * Run: `node scripts/build-source-map.mjs` (from lea-faka-tonga-app/)
 *      or `npm run build:source-map`
 *
 * Builds the chapter -> source-packet routing map that the Stage-1 auditor
 * agents consume. The chapters barely cite their sources inline, so this is
 * the bridge from a chapter to the Churchward / Shumway / grammar-spec
 * passages it was distilled from. It is a deterministic join of:
 *
 *   1. spec/Grammar-Concepts-for-Students.md — each `### X#.` concept block
 *      carries `**LFT chapter:** Ch N ...` and `**Sources:** Churchward Ch. N,
 *      §...; Shumway L#, ...`. Reverse-indexing the LFT-chapter field gives
 *      chapter -> concept IDs; each concept's Sources line gives the
 *      Churchward chapters and Shumway lessons that chapter draws on. This is
 *      the PRIMARY (machine-parsed) routing signal.
 *
 *   2. CHAPTER_TO_SECTION (curated below) — chapter -> grammar-spec §§, from
 *      the grammar-spec Document-Status table + section titles. The §§ are
 *      secondary context (the formal rule statement); the §-level Churchward
 *      citations live inside each section. Not 1:1 with chapter numbers.
 *
 *   3. DERIVED_CORPUS (curated below) — chapter -> the pre-digested topical
 *      corpora in source-materials/ (Negation-Paradigm, Possessive-Class-
 *      Master, etc.). Parallel-Corpus is attached to every chapter (it is the
 *      aligned book<->source index used by check-originality.mjs).
 *
 *   4. A scan of each book/Chapter-NN.md for inline `Churchward Ch. N` /
 *      `Shumway L#` citations — doubling as the first-ever citation-coverage
 *      report of book/ itself (the citation lint never scanned chapters).
 *      Chapters that distilled a source but cite nothing are where silent
 *      infidelity hides — they are flagged `low-citation`.
 *
 * Emits two artifacts to audits/:
 *   - Source-Fidelity-Map.json  (orchestrator reads this to assemble packets)
 *   - Source-Fidelity-Map.md    (human eyeballs the routing before fan-out)
 *
 * Read-only against all inputs; only writes the two map files.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const BOOK_DIR = path.join(REPO_ROOT, 'book')
const AUDITS_DIR = path.join(REPO_ROOT, 'audits')
const GRAMMAR_CONCEPTS = path.join(REPO_ROOT, 'spec', 'Grammar-Concepts-for-Students.md')

const CHAPTER_COUNT = 53

// ── Chapter metadata (from Chapter-Inventory.md) ───────────────────────────
// type per Chapter-Inventory Part 2 (14, 40, 53 = WORDS). NOTE: grammar-spec's
// Document-Status table additionally lists Ch 42 as "WORDS-only (no graph
// changes)", contradicting Chapter-Inventory which marks 42 TEACH. Recorded as
// a flagged discrepancy below; 42 is treated TEACH here (per the inventory).
const CHAPTER_TITLES = {
  1: 'The Basic Sentence', 2: 'Tense Markers and Pronouns', 3: 'Descriptive Words',
  4: 'Time Words', 5: 'Commands and Emphasis', 6: 'Location',
  7: "Prepositions: Ki, 'I, and Mei", 8: 'Articles', 9: 'The Negative',
  10: 'The Comitative Mo', 11: 'Question Words', 12: 'The Ko Pattern',
  13: 'Ko Questions', 14: 'Greetings and Social Formulas', 15: 'Noun Subjects',
  16: 'Equational Sentences', 17: 'Possessives', 18: 'Definiteness and the Definitive Accent',
  19: 'Transitive Word Order', 20: 'Numbers and Time', 21: 'Auxiliary Verbs',
  22: 'Aspect Markers and Frequency', 23: 'Obligation and Necessity', 24: 'Conjunctions',
  25: 'Plural Markers', 26: 'Purpose, Reason, and Benefit', 27: 'Comparison and Degree',
  28: 'Directional Particles', 29: 'The Possessive System in Full',
  30: 'Temporal, Conditional, and Concessive Conjunctions', 31: 'Existential Expressions',
  32: 'The Faka- Prefix', 33: "Instrumental 'aki and the Suffix -'i", 34: 'Reported Speech',
  35: 'Adjectives and Compound Adjectives', 36: 'Cleft Sentences and Emphatic Word Order',
  37: 'Postposed Possessives', 38: 'Warnings, Hopes, Permissions, and Uncertainty',
  39: 'Relative Clauses with Ai and Demonstratives', 40: 'Spatial Nouns',
  41: 'Word Class Flexibility', 42: 'Time Expressions',
  43: "The Ta'e- Prefix and Advanced Negation", 44: 'The Definitive Accent System',
  45: 'Verbal Nouns', 46: 'Noun Classes', 47: 'Conditionals and Counterfactuals',
  48: 'Suffixes', 49: 'Prefixes', 50: 'Reduplication and Expressive Sound Devices',
  51: 'Special Pronoun Uses', 52: 'Emotional Articles and Possessives', 53: 'The Language of Respect',
}
const WORDS_CHAPTERS = new Set([14, 40, 53]) // per Chapter-Inventory Part 2

// ── chapter -> grammar-spec §§ (curated from Document-Status + § titles) ────
// Sections 1–15 map to the original-scope early chapters by TOPIC, not by
// number (e.g. §14 = Noun Subject = Ch 15; §15 = Experiencer = Ch 7). Sections
// 16–50 are the explicit Document-Status mappings. [] = no dedicated section
// (chapter rides §1's extensions or is WORDS-only) — see notes.
const CHAPTER_TO_SECTION = {
  1: [1], 2: [1], 3: [1], 4: [1], 5: [3, 4, 5, 6], 6: [2], 7: [15, 20], 8: [23],
  9: [7, 8], 10: [1], 11: [11, 12, 13], 12: [9, 10], 13: [11, 12, 13], 14: [],
  15: [14], 16: [21], 17: [22], 18: [23], 19: [16], 20: [26], 21: [27], 22: [24],
  23: [28], 24: [17], 25: [29], 26: [25], 27: [31], 28: [30], 29: [36], 30: [18],
  31: [32], 32: [37], 33: [38], 34: [39], 35: [33], 36: [19], 37: [40], 38: [34],
  39: [35], 40: [], 41: [41], 42: [], 43: [42], 44: [46], 45: [43], 46: [20],
  47: [44], 48: [47], 49: [48], 50: [45], 51: [49], 52: [50], 53: [],
}

// Per-chapter routing notes (caveats the auditor should know).
const CHAPTER_NOTES = {
  2: 'TM/pronoun paradigm is part of §1 (Statement) nodes; no dedicated section.',
  3: 'Modifiers are §1 extensions (modifier self-loop); adjective system proper is §33/Ch 35.',
  4: 'Time word is a §1 extension (sentence-final).',
  7: "Preposition forms governed by Rule 3 (Noun Class System) + §20; §15 (experiencer) shares these forms. Churchward Ch. 16 is the primary source.",
  10: 'Comitative mo is a §1 extension.',
  11: 'General question words; nearest sections are the ko-question §§11–13. Churchward Ch. 24 (interrogatives) is primary.',
  14: 'WORDS chapter (greetings/social formulas) — no grammar-spec section.',
  40: 'WORDS chapter (spatial-noun vocabulary into existing ʻi he + noun) — no grammar-spec section.',
  42: 'CLASSIFICATION CONFLICT: Chapter-Inventory marks Ch 42 TEACH (talu/hilí time clauses); grammar-spec Document-Status lists 42 as WORDS-only. No dedicated grammar-spec section either way. Resolve in audit.',
  53: 'WORDS chapter (language of respect / register) — no grammar-spec section. Churchward Ch. 36 (Language of Respect) is primary.',
}

// ── chapter -> derived topical corpora in source-materials/ ────────────────
const DERIVED_CORPUS = {
  1: ['Aspect-Tense-Matrix.md'], 2: ['Aspect-Tense-Matrix.md'],
  9: ['Negation-Paradigm.md'], 11: ['Interrogative-Paradigm.md'],
  12: ['Equatives.md'], 13: ['Interrogative-Paradigm.md'],
  16: ['Equatives.md'], 17: ['Possessive-Class-Master.md'],
  19: ['Verb-Collocation-Index.md'], 21: ['Verb-Collocation-Index.md'],
  22: ['Aspect-Tense-Matrix.md'], 24: ['Discourse-Particles.md', 'Function-Templates.md'],
  26: ['Function-Templates.md'], 28: ['Discourse-Particles.md'],
  29: ['Possessive-Class-Master.md'], 30: ['Discourse-Particles.md', 'Function-Templates.md'],
  33: ['Verb-Collocation-Index.md'], 34: ['Discourse-Particles.md', 'Idiom-Corpus.md'],
  37: ['Possessive-Class-Master.md'], 38: ['Function-Templates.md'],
  41: ['Idiom-Corpus.md'], 43: ['Negation-Paradigm.md', 'Idiom-Corpus.md'],
  45: ['Possessive-Class-Master.md'], 47: ['Function-Templates.md'],
  50: ['Idiom-Corpus.md'], 53: ['Idiom-Corpus.md'],
}
// Parallel-Corpus.md is the aligned book<->source index — relevant everywhere.
const GLOBAL_CORPUS = ['Parallel-Corpus.md']

// ── chapter -> Churchward chapters, by TOPIC (curated) ─────────────────────
// Grammar-Concepts only carries explicit source citations for foundational
// concepts (≈Ch 1–29); grammar-spec.md carries NO source citations at all. So
// for advanced chapters this topical map (book topic -> Churchward chapter, via
// the Churchward chapter-title index) is the routing signal. The auditor
// confirms the exact §§ by reading. Unioned with any concept-derived chapters.
const CHAPTER_TO_CHURCHWARD_TOPICAL = {
  1: [7, 10, 18], 2: [7, 18, 19], 3: [3, 26, 27], 4: [27], 5: [11, 12],
  6: [16, 23], 7: [16, 17, 14], 8: [4], 9: [9], 10: [16, 8], 11: [24],
  12: [16, 23, 4], 13: [24], 14: [34], 15: [10, 15], 16: [4, 19],
  17: [13, 20, 14], 18: [4, 33, 2], 19: [10, 11, 12, 16], 20: [25],
  21: [11, 12], 22: [7, 27], 23: [11, 12, 9], 24: [8], 25: [5, 6],
  26: [8, 16], 27: [28], 28: [27], 29: [13, 20, 21], 30: [8], 31: [29, 16],
  32: [31], 33: [30, 16], 34: [29, 8], 35: [26], 36: [10, 19, 29],
  37: [20, 21], 38: [9, 11, 29], 39: [22, 23], 40: [16, 14], 41: [3, 29],
  42: [27, 8], 43: [31, 9], 44: [33], 45: [15, 14], 46: [14, 16], 47: [8],
  48: [30], 49: [31], 50: [32, 35], 51: [18, 19, 29], 52: [4, 20, 29], 53: [36],
}

// ── parse Grammar-Concepts: chapter -> concepts, churchward, shumway ───────
async function parseConcepts() {
  const src = await fs.readFile(GRAMMAR_CONCEPTS, 'utf8')
  const lines = src.split('\n')
  const concepts = [] // { id, lftChapters:[], introduction:bool, churchward:Set, shumway:Set }
  let cur = null
  for (const line of lines) {
    const h = line.match(/^###\s+([A-G]\d+)\.\s*(.*)$/)
    if (h) {
      if (cur) concepts.push(cur)
      cur = { id: h[1], title: h[2].trim(), lftChapters: new Set(), introduction: false, churchward: new Set(), shumway: new Set() }
      continue
    }
    if (!cur) continue
    const lft = line.match(/^\*\*LFT chapter:\*\*\s*(.*)$/)
    if (lft) {
      const v = lft[1]
      for (const m of v.matchAll(/\bCh\s*(\d+)/g)) {
        const n = parseInt(m[1], 10)
        if (n >= 1 && n <= CHAPTER_COUNT) cur.lftChapters.add(n) // ignore stale out-of-range (e.g. "Ch 57")
      }
      if (/Introduction/i.test(v)) cur.introduction = true
      continue
    }
    const srcLine = line.match(/^\*\*Sources:\*\*\s*(.*)$/)
    if (srcLine) {
      const v = srcLine[1]
      for (const m of v.matchAll(/Churchward Ch\.\s*(\d+)/g)) cur.churchward.add(parseInt(m[1], 10))
      for (const m of v.matchAll(/Shumway\s+L(\d+)/g)) cur.shumway.add(parseInt(m[1], 10))
    }
  }
  if (cur) concepts.push(cur)
  return concepts
}

// ── scan a chapter file for inline source citations ────────────────────────
async function scanChapterCitations(n) {
  const padded = String(n).padStart(2, '0')
  const src = await fs.readFile(path.join(BOOK_DIR, `Chapter-${padded}.md`), 'utf8').catch(() => null)
  if (src == null) return { found: false, churchward: [], shumway: [], raw: [] }
  const churchward = new Set(), shumway = new Set(), raw = []
  const lines = src.split('\n')
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(/Churchward Ch\.?\s*(\d+)/g)) { churchward.add(parseInt(m[1], 10)); raw.push(`L${i + 1}: ${m[0]}`) }
    for (const m of lines[i].matchAll(/Shumway\s+L\.?\s*(\d+)/g)) { shumway.add(parseInt(m[1], 10)); raw.push(`L${i + 1}: ${m[0]}`) }
  }
  return { found: true, churchward: [...churchward].sort((a, b) => a - b), shumway: [...shumway].sort((a, b) => a - b), raw }
}

function sortedNums(set) { return [...set].sort((a, b) => a - b) }

async function build() {
  const concepts = await parseConcepts()

  // Reverse index: chapter -> concepts, and union of churchward/shumway.
  const chapterConcepts = new Map() // n -> Set(conceptId)
  const chapterChurchward = new Map() // n -> Set(int)
  const chapterShumway = new Map() // n -> Set(int)
  const introConcepts = [] // concepts tagged "Introduction"
  const ensure = (map, n) => { if (!map.has(n)) map.set(n, new Set()); return map.get(n) }

  for (const c of concepts) {
    if (c.introduction) introConcepts.push(c.id)
    for (const n of c.lftChapters) {
      ensure(chapterConcepts, n).add(c.id)
      for (const cw of c.churchward) ensure(chapterChurchward, n).add(cw)
      for (const sw of c.shumway) ensure(chapterShumway, n).add(sw)
    }
  }

  const chapters = []
  const lowCitation = []
  for (let n = 1; n <= CHAPTER_COUNT; n++) {
    const inline = await scanChapterCitations(n)
    const type = WORDS_CHAPTERS.has(n) ? 'WORDS' : 'TEACH'
    const sections = CHAPTER_TO_SECTION[n] || []
    const conceptIds = sortedConceptIds(chapterConcepts.get(n))
    // Churchward routing: union the concept-derived chapters (explicit source
    // citations, ≈Ch 1–29) with the curated topical map (covers all 53).
    const cwSet = new Set(chapterChurchward.get(n) || [])
    for (const x of (CHAPTER_TO_CHURCHWARD_TOPICAL[n] || [])) cwSet.add(x)
    const churchward = sortedNums(cwSet)
    // Shumway routing comes only from concepts (lesson-level, ≈Ch 1–29). For
    // advanced chapters Shumway is sparse by design (grep by lesson goal-line).
    const shumway = sortedNums(chapterShumway.get(n) || new Set())
    const corpus = [...(DERIVED_CORPUS[n] || []), ...GLOBAL_CORPUS]

    // low-citation flag: a TEACH chapter that draws on a source (per concepts)
    // but cites nothing inline is a high-risk silent-infidelity surface.
    const drawsOnSource = churchward.length > 0 || shumway.length > 0
    const citesInline = inline.churchward.length > 0 || inline.shumway.length > 0
    const flag = (type === 'TEACH' && drawsOnSource && !citesInline) ? 'low-citation' : null
    if (flag) lowCitation.push(n)

    chapters.push({
      chapter: n,
      title: CHAPTER_TITLES[n],
      type,
      grammar_spec_sections: sections,
      grammar_concepts: conceptIds,
      churchward_chapters: churchward,
      shumway_lessons: shumway,
      derived_corpora: corpus,
      inline_citations: { churchward: inline.churchward, shumway: inline.shumway, raw: inline.raw },
      flag,
      notes: CHAPTER_NOTES[n] || null,
    })
  }

  const map = {
    generated_by: 'scripts/build-source-map.mjs',
    phase: 'P — Source-Fidelity & Citation Audit',
    chapter_count: CHAPTER_COUNT,
    introduction_concepts: introConcepts,
    eald_dictionary: 'source-materials/EALD-Dictionary.json (grep on demand for any gloss)',
    low_citation_chapters: lowCitation,
    chapters,
  }

  await fs.mkdir(AUDITS_DIR, { recursive: true })
  await fs.writeFile(path.join(AUDITS_DIR, 'Source-Fidelity-Map.json'), JSON.stringify(map, null, 2) + '\n')
  await fs.writeFile(path.join(AUDITS_DIR, 'Source-Fidelity-Map.md'), renderMarkdown(map))

  console.log(`✓ built Source-Fidelity-Map for ${CHAPTER_COUNT} chapters`)
  console.log(`  ${chapters.filter(c => c.type === 'TEACH').length} TEACH, ${chapters.filter(c => c.type === 'WORDS').length} WORDS`)
  console.log(`  ${lowCitation.length} low-citation TEACH chapters (draw on a source, cite nothing inline): ${lowCitation.join(', ')}`)
  console.log(`  → audits/Source-Fidelity-Map.json + .md`)
}

function sortedConceptIds(set) {
  if (!set) return []
  const order = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 0 }
  return [...set].sort((a, b) => {
    const oa = order[a[0]], ob = order[b[0]]
    if (oa !== ob) return oa - ob
    return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10)
  })
}

function renderMarkdown(map) {
  const L = []
  L.push('# Source-Fidelity Map — Phase P')
  L.push('')
  L.push('**Generated by** `scripts/build-source-map.mjs` (re-run to refresh). **Do not hand-edit** — edit the source files and rebuild.')
  L.push('')
  L.push('Per-chapter routing for the Stage-1 source-fidelity auditor. Each chapter lists the grammar-spec §§ (the formal-rule statement to compare against), the Grammar Concepts it draws plain-English wording from, the Churchward chapters and Shumway lessons it was distilled from, the topical corpora to cross-check, and any source citations the chapter currently carries inline.')
  L.push('')
  L.push('**Churchward routing provenance:** unioned from (a) explicit `**Sources:**` citations in `spec/Grammar-Concepts-for-Students.md` (covers ≈Ch 1–29) and (b) a curated topical map (book topic → Churchward chapter, via the Churchward chapter-title index) that covers all 53. grammar-spec.md carries NO source citations, so it is not a routing source. **Shumway** routing is concept-derived only (≈Ch 1–29); for advanced chapters grep Shumway by lesson goal-line. The auditor confirms exact §§/lessons by reading.')
  L.push('')
  L.push('EALD dictionary (`source-materials/EALD-Dictionary.json`) is grepped on demand for any gloss and is not listed per-chapter. `Parallel-Corpus.md` is attached to every chapter (aligned book↔source index).')
  L.push('')
  L.push(`**Introduction concepts** (pronunciation/phonology, available to early chapters): ${map.introduction_concepts.join(', ')}`)
  L.push('')
  L.push(`**Low-citation TEACH chapters** (draw on a source per the concept map but cite nothing inline — prioritize for citation-balance + fidelity scrutiny): ${map.low_citation_chapters.join(', ')}`)
  L.push('')
  L.push('---')
  L.push('')
  L.push('| Ch | Title | Type | spec §§ | Grammar Concepts | Churchward | Shumway L# | Corpora | Inline cites | Flag |')
  L.push('|----|-------|------|---------|------------------|------------|-----------|---------|--------------|------|')
  for (const c of map.chapters) {
    const cw = c.churchward_chapters.length ? c.churchward_chapters.join(', ') : '—'
    const sw = c.shumway_lessons.length ? c.shumway_lessons.join(', ') : '—'
    const cn = c.grammar_concepts.length ? c.grammar_concepts.join(', ') : '—'
    const ss = c.grammar_spec_sections.length ? c.grammar_spec_sections.map(s => `§${s}`).join(', ') : '—'
    const co = c.derived_corpora.map(f => f.replace('.md', '')).join(', ')
    const inlineCw = c.inline_citations.churchward.map(x => `Cw${x}`)
    const inlineSw = c.inline_citations.shumway.map(x => `Sw${x}`)
    const inline = [...inlineCw, ...inlineSw].join(', ') || '—'
    L.push(`| ${c.chapter} | ${c.title} | ${c.type} | ${ss} | ${cn} | ${cw} | ${sw} | ${co} | ${inline} | ${c.flag || ''} |`)
  }
  L.push('')
  L.push('## Per-chapter routing notes')
  L.push('')
  for (const c of map.chapters) {
    if (c.notes) L.push(`- **Ch ${c.chapter} (${c.title}):** ${c.notes}`)
  }
  L.push('')
  return L.join('\n')
}

build().catch(err => { console.error(err); process.exit(1) })
