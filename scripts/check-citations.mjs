#!/usr/bin/env node
/**
 * check-citations.mjs — citation-validation gate for the translation specs,
 * skills, and log.
 *
 * Run: `node scripts/check-citations.mjs` (from lea-faka-tonga-app/)
 *      or indirectly via `npm run check:style`, which invokes runCitationCheck().
 *
 * Goal: catch the entire class of "a citation was never checked against
 * reality" — broken or fabricated source pointers — so the walkthrough
 * specs, the `/translate` + `/reverse-translate` skills, Translation-Log.md,
 * AND all 52 book/Chapter-NN.md files (added in Phase P) can never ship a
 * citation that doesn't resolve on disk.
 *
 * What it scans (SCAN_FILES, below) and what it verifies per token:
 *
 *   1. NUMBERED FOLDER PATHS. A literal `NN-Word/` numbered-prefix path
 *      (e.g. `05-Spec/`, `03-Book/`, `01-Source-Materials/`) is an ERROR
 *      whenever no such directory exists on disk. The real dirs are
 *      `spec/`, `book/`, `source-materials/` (no numeric prefixes).
 *
 *   2. LFT Ch. N [§"heading"]. N must be 1..52 and book/Chapter-NN.md must
 *      exist. If a `§"heading text"` is attached, that heading text must
 *      actually appear as a markdown heading somewhere in that chapter
 *      (normalized: italics/apostrophes/case stripped). This catches
 *      wrong-chapter citations (e.g. `LFT Ch. 14 §"Ergative 'e"` fails
 *      because Ch.14 is "Greetings", with no such heading).
 *
 *   3. Grammar Concept X# / (X#). Must exist as a `### X#.` heading in
 *      spec/Grammar-Concepts-for-Students.md. The real scheme is A1–A9,
 *      B1–B15, C1–C5, D1–D4, E1–E7, F1–F11, G1–G7 (58 total). `G15`, any
 *      G>7, etc. FAIL. The literal range string `G1–G58` / `G1-G58` is
 *      flagged as a malformed range.
 *
 *   4. grammar-spec §N. N must be 1..50 and a `## N.` section must exist in
 *      spec/grammar-spec.md.
 *
 *   5. Churchward Ch. N. source-materials/Churchward/NN.md (zero-padded,
 *      01..36) must exist. Fabricated `§4a`-style subsections are NOT
 *      validated (their numbering format varies), but a citation whose
 *      chapter doesn't exist IS flagged.
 *
 *   6. Shumway Lesson N / Shumway L###. The lesson number must fall within
 *      one of the available lesson-range files in source-materials/Shumway/
 *      (e.g. shumway_L000-L030.md … shumway_L121-L130.md).
 *
 *   7. SYNTHESIS-SHEET § CITATIONS. `<Sheet-Name> §X` / `<Sheet-Name> §X.N`
 *      (e.g. `Negation-Paradigm §A.5`, `Function-Templates §L.2`). The sheet
 *      must be one of the source-materials/*.md synthesis sheets, and the
 *      cited § must exist as a `## §X —` / `### §X.N —` heading in it. Sheets
 *      that use no § scheme at all (Possessive-Class-Master, Vocabulary-Pool)
 *      cannot be resolved that way: those citations are reported as a
 *      separately-counted "unverifiable" note, never an error. If a sheet that
 *      IS declared to carry a § scheme harvests zero §-headings, that is a
 *      hard error (renamed or restructured) — the same reference-set
 *      integrity guard already used for the Entry Points table.
 *
 *   8. EALD: <word>. The headword must exist in the `tongan` field of some
 *      category in source-materials/EALD-Dictionary.json. Markdown italics and
 *      trailing punctuation are stripped, and matching is accent- and
 *      fakauʻa-insensitive (macrons folded, ʻ‘’' folded, lowercased). An
 *      italicised span is one headword (so `*fie maʻu*` looks up the two-word
 *      entry); a bare comma-run after `EALD:` is a list of headwords.
 *
 *   9. FRAME TAGS. A `**Frame:**` declaration line must start with a
 *      backticked tag, and that tag (also when mentioned as "the **`tag`**
 *      frame") must exist in the closed frame set: grammar-spec's
 *      "Entry Points Summary" table ∪ Function-Templates frame tags.
 *      Prose-only Frame lines are flagged too. Like §"heading" drift, a
 *      frame violation is a hard ERROR in the canonical specs/skills and a
 *      non-blocking WARNING in the historical log and book chapters.
 *
 * Tokens inside fenced code blocks are skipped: those fences hold only
 * illustrative slot templates ([tense_marker] + [pronoun] + …) and the
 * log's entry-format template, none of which carry real citations. The
 * citation-FORMAT exemplars (`Churchward Ch. 6 §4a`, `Grammar Concept G15`)
 * live in prose/tables, not fences, so they are still validated — and they
 * are themselves broken, so they SHOULD be flagged.
 *
 * Reporting: one line per violation, grouped by file, in the form
 *   file:line — <token> — <why> — <suggested real target if determinable>
 * Returns a nonzero error count so the caller can gate CI / pre-close.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')

const BOOK_DIR = path.join(REPO_ROOT, 'book')
const SPEC_DIR = path.join(REPO_ROOT, 'spec')
const CHURCHWARD_DIR = path.join(REPO_ROOT, 'source-materials', 'Churchward')
const SHUMWAY_DIR = path.join(REPO_ROOT, 'source-materials', 'Shumway')
const GRAMMAR_CONCEPTS = path.join(SPEC_DIR, 'Grammar-Concepts-for-Students.md')
const GRAMMAR_SPEC = path.join(SPEC_DIR, 'grammar-spec.md')
const SOURCE_MATERIALS_DIR = path.join(REPO_ROOT, 'source-materials')
const FUNCTION_TEMPLATES = path.join(SOURCE_MATERIALS_DIR, 'Function-Templates.md')
const EALD_DICTIONARY = path.join(SOURCE_MATERIALS_DIR, 'EALD-Dictionary.json')

// Synthesis sheets DECLARED to carry a `§X` / `§X.N` heading scheme. If one of
// these harvests zero §-headings (renamed, restructured, deleted), that is a
// hard error — otherwise every citation into it would fail, or pass, for the
// wrong reason. Same guard as `entryPointCount === 0` for frame tags.
// Sheets deliberately absent from this list (Vocabulary-Pool, the EALD dumps,
// Churchward-Paragraph-Index) use prose headings; citations into them are
// "unverifiable", not wrong. Possessive-Class-Master was given a § scheme on
// 2026-07-27 (CL-017) precisely so its Tier-1 citations become checkable.
const SHEETS_WITH_SECTION_SCHEME = [
  'Aspect-Tense-Matrix',
  'Discourse-Particles',
  'Equatives',
  'Function-Templates',
  'Idiom-Corpus',
  'Interrogative-Paradigm',
  'Negation-Paradigm',
  'Parallel-Corpus',
  'Possessive-Class-Master',
  'Verb-Collocation-Index',
]

// Files scanned for citation tokens. Repo-root-relative — extend freely.
const SCAN_FILES = [
  'spec/Translation-Walkthrough-Method.md',
  'spec/Reverse-Translation-Walkthrough-Method.md',
  '.claude/skills/translate/SKILL.md',
  '.claude/skills/reverse-translate/SKILL.md',
  'Translation-Log.md',
]

// All 52 book chapters are also scanned (Phase P) so any citation added to a
// chapter during the source-fidelity audit is validated on disk — a broken or
// fabricated `Churchward Ch. 99` / `Shumway L.999` in the published book is a
// hard error. Built once at runtime so a renumber never desyncs the list.
async function bookScanFiles() {
  const entries = await fs.readdir(BOOK_DIR).catch(() => [])
  return entries.filter(f => /^Chapter-\d{2}\.md$/.test(f)).sort().map(f => `book/${f}`)
}

const LFT_CHAPTER_MAX = 52
const GRAMMAR_SPEC_SECTION_MAX = 50
const CHURCHWARD_CHAPTER_MAX = 36

// The real Grammar-Concepts scheme: letter -> highest valid number.
const GRAMMAR_CONCEPT_RANGES = { A: 9, B: 15, C: 5, D: 4, E: 7, F: 11, G: 7 }

// ── normalization helpers ────────────────────────────────────────────────

// Strip markdown italics, normalize apostrophe variants, collapse case so a
// cited §-heading and the on-disk markdown heading compare equal when they
// mean the same thing. (Mirrors normalizeTitle in check-style.mjs.)
function normalizeHeading(s) {
  return s
    .replace(/\*+/g, '')
    .replace(/[ʻ‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Tongan-lexeme folding for EALD headword lookup and §-ID comparison. Built
// ON normalizeHeading (italics, apostrophe variants, whitespace, case) and
// adds only what a dictionary lookup needs on top: combining marks stripped,
// so a macron / definitive-accent difference (*ngāue* vs *ngaue*, *té* vs
// *te*) never masks a real headword. Deliberately NOT folded into
// normalizeHeading itself — that would loosen every existing §"heading"
// comparison.
function foldTongan(s) {
  return normalizeHeading(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC')
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// LFT §"heading" comparison, tolerant of cosmetic drift (CL-001, approved
// 2026-07-27). The log cites sections by meaning, not by transcription, and
// three differences defeated the old exact-equality test: quote style
// (§"Saying 'Not'…" vs `### Saying "Not"…`), separator style (the log uses
// em-dashes the book's house rule bans in headings), and abbreviation
// (§"*'osi*" vs `### *'osi*: already, finished`).
//
// Folding is scoped to THIS comparison, not to normalizeHeading — loosening
// the shared normalizer would loosen every other check with it.
//
// CAVEAT: the anchored-prefix rule below is a pass/fail test only. It is
// deliberately NOT used by --emit-index (which still resolves via exact
// normalizeHeading equality in resolveTarget), because an abbreviated citation
// can prefix more than one heading and would emit the wrong line number.
function foldForHeadingMatch(s) {
  return foldTongan(s.replace(/[“”"]/g, "'"))
    .replace(/\s*[:—–]\s*/g, ' | ')
    .replace(/\s+-\s+/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Headings that are NOT teaching content. The word-boundary substring rule is
// barred from matching these: without the restriction, `Ch. 22 §"*kuo*"` and
// `Ch. 16 §"Subject-first emphasis"` — both genuinely wrong citations — get
// silently green-lit by an Exercise heading that happens to contain the words.
const NON_CONTENT_HEADING = /^(?:exercises?\b|exercise \d|quick practice|answers?\b|words to learn)/

function headingMatchesCitation(rawHeading, citation) {
  const h = foldForHeadingMatch(rawHeading)
  const c = foldForHeadingMatch(citation)
  if (!c || !h) return false
  if (h === c) return true                                    // (a) equal
  if (h.split(' | ')[0] === c) return true                    // (b) pre-separator head
  if (h.startsWith(`${c} `)) return true                      // (c) anchored prefix
  if (NON_CONTENT_HEADING.test(h)) return false               // (d) content headings only
  return new RegExp(`(?:^|\\W)${escapeRe(c)}(?:\\W|$)`).test(h)
}

function lftHeadingResolves(headings, citation) {
  if (headings.has(normalizeHeading(citation))) return true
  for (const p of headings.values()) if (headingMatchesCitation(p.raw, citation)) return true
  return false
}

// EALD headword key. foldTongan (italics, apostrophe variants, macrons, case)
// plus the two asymmetries the R7 triage found: headwords are stored with
// their own trailing punctuation (`ʻOku ke fēfē hake?` — CL-004) and with
// spacing that citations don't always mirror (`fiemaʻu` vs `fie maʻu` —
// CL-005). Applied to BOTH sides of the lookup, so folding can never turn a
// miss into a false pass.
function ealdKey(s) {
  return foldTongan(s).replace(/[.,;:!?)\]]+$/, '').replace(/\s+/g, '')
}

// Name-shaped token: capitalized, single word. EALD carries 38 capitalized
// headwords (Mālō, Tulou!, ʻAositelelia), so this is only ever consulted AFTER
// a lookup miss — never as a reason to skip the lookup (CL-006).
function looksLikeProperNoun(word) {
  return /^[A-ZĀĒĪŌŪ]/.test(word) && !/\s/.test(word)
}

async function readFileOrNull(p) {
  return fs.readFile(p, 'utf8').catch(() => null)
}

async function exists(p) {
  return fs.access(p).then(() => true).catch(() => false)
}

// Collect normalized heading text from a markdown file. For the chapter
// title line (`# Lesson N: Title`) we index the bare "Title" too, so a
// §"Conjunctions" citation can match a chapter whose title is "Conjunctions".
//
// Returns a Map (normalized heading -> { line, raw, depth }) rather than a
// Set. `.has()` is identical on both, so every validator below behaves
// exactly as before; the extra payload is used only by --emit-index, which
// needs to point a resolved citation at a line on disk.
function collectHeadings(src) {
  const headings = new Map()
  const lines = src.split('\n')
  const add = (key, payload) => { if (!headings.has(key)) headings.set(key, payload) }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^(#{1,6})\s+(.*?)\s*$/)
    if (!m) continue
    const payload = { line: i + 1, raw: m[2], depth: m[1].length }
    add(normalizeHeading(m[2]), payload)
    const title = m[2].match(/^(?:Chapter|Lesson)\s+\d+:\s*(.+)$/)
    if (title) add(normalizeHeading(title[1]), payload)
  }
  return headings
}

// Split a scanned file into lines, marking which lines sit inside a fenced
// code block (``` … ```), which we skip.
function readableLines(src) {
  const out = []
  let inFence = false
  const lines = src.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) { inFence = !inFence; out.push({ n: i + 1, text: lines[i], skip: true }); continue }
    out.push({ n: i + 1, text: lines[i], skip: inFence })
  }
  return out
}

// ── on-disk reference indexes (built once) ───────────────────────────────

// The closed frame set, harvested from exactly two places: grammar-spec's
// "Entry Points Summary" section (every backticked ID in the leading column
// of any table row there, including the reconciled graph-frame table that
// follows it) ∪ the frame tags Function-Templates defines (its tables and its
// own `**Frame:**` lines).
//
// Exported so build-frame-index.mjs compiles the SAME set the lint enforces —
// one harvest implementation, never two. `provenance` records where each tag
// was found (file + line + the row text) for the frame index; the lint uses
// only `frameTags` and `entryPointCount`.
export async function harvestFrameTags(specSrcMaybe) {
  const specSrc = specSrcMaybe != null ? specSrcMaybe : ((await readFileOrNull(GRAMMAR_SPEC)) || '')
  const frameTags = new Set()
  const provenance = new Map()
  const noteSource = (tag, rec) => { if (!provenance.has(tag)) provenance.set(tag, rec) }
  const lineOf = (src, offset) => src.slice(0, offset).split('\n').length

  const epStart = specSrc.indexOf('## Entry Points Summary')
  if (epStart !== -1) {
    const rest = specSrc.slice(epStart)
    const end = rest.indexOf('\n## ', 1)
    const section = end === -1 ? rest : rest.slice(0, end)
    for (const m of section.matchAll(/^\|\s*`([^`\s]+)`\s*\|/gm)) {
      frameTags.add(m[1])
      noteSource(m[1], {
        origin: 'entry_points_summary',
        file: 'spec/grammar-spec.md',
        line: lineOf(specSrc, epStart + m.index),
        row: section.slice(m.index).split('\n')[0].trim(),
      })
    }
  }
  const entryPointCount = frameTags.size

  const ftSrc = (await readFileOrNull(FUNCTION_TEMPLATES)) || ''
  for (const m of ftSrc.matchAll(/\|\s*`([a-zʻ'’_āēīōū]+)`\s*\|/g)) {
    frameTags.add(m[1])
    noteSource(m[1], {
      origin: 'function_templates_table',
      file: 'source-materials/Function-Templates.md',
      line: lineOf(ftSrc, m.index),
      row: ftSrc.slice(m.index).split('\n')[0].trim(),
    })
  }
  for (const m of ftSrc.matchAll(/^\*\*Frame:\*\*\s*`([^`\s]+)`/gm)) {
    frameTags.add(m[1])
    noteSource(m[1], {
      origin: 'function_templates_frame_line',
      file: 'source-materials/Function-Templates.md',
      line: lineOf(ftSrc, m.index),
      row: ftSrc.slice(m.index).split('\n')[0].trim(),
    })
  }

  return { frameTags, entryPointCount, provenance }
}

async function buildReferenceData() {
  // LFT chapter headings, keyed by chapter number.
  const lftHeadings = new Map()
  for (let n = 1; n <= LFT_CHAPTER_MAX; n++) {
    const padded = String(n).padStart(2, '0')
    const src = await readFileOrNull(path.join(BOOK_DIR, `Chapter-${padded}.md`))
    if (src != null) lftHeadings.set(n, collectHeadings(src))
  }

  // Grammar-Concepts headings present on disk: e.g. "g7", "a9".
  const conceptSrc = (await readFileOrNull(GRAMMAR_CONCEPTS)) || ''
  const conceptIds = new Set()
  for (const m of conceptSrc.matchAll(/^###\s+([A-G]\d+)\./gm)) conceptIds.add(m[1].toUpperCase())

  // grammar-spec.md section numbers present on disk.
  const specSrc = (await readFileOrNull(GRAMMAR_SPEC)) || ''
  const specSections = new Set()
  for (const m of specSrc.matchAll(/^##\s+(\d+)\./gm)) specSections.add(parseInt(m[1], 10))

  // Churchward chapter files present on disk.
  const churchwardFiles = new Set()
  const cwEntries = await fs.readdir(CHURCHWARD_DIR).catch(() => [])
  for (const f of cwEntries) {
    const m = f.match(/^(\d{2})\.md$/)
    if (m) churchwardFiles.add(parseInt(m[1], 10))
  }

  // Shumway lesson ranges from filenames like shumway_L000-L030.md.
  const shumwayRanges = []
  const swEntries = await fs.readdir(SHUMWAY_DIR).catch(() => [])
  for (const f of swEntries) {
    const m = f.match(/L(\d+)-L(\d+)/)
    if (m) shumwayRanges.push([parseInt(m[1], 10), parseInt(m[2], 10)])
  }

  // Frame tags — the closed set for `**Frame:**` declarations: entry-point
  // IDs from grammar-spec's "Entry Points Summary" table, plus the frame tags
  // Function-Templates defines (in its tables and its own **Frame:** lines).
  const { frameTags, entryPointCount, provenance: frameSources } = await harvestFrameTags(specSrc)

  // Synthesis sheets: every source-materials/*.md, keyed by folded basename,
  // each carrying the §-IDs harvested from its own headings. A sheet with an
  // empty `sections` map has no § scheme (prose headings only).
  const sheets = new Map()
  const smEntries = (await fs.readdir(SOURCE_MATERIALS_DIR).catch(() => [])).filter(f => f.endsWith('.md'))
  for (const f of smEntries.sort()) {
    const name = f.slice(0, -3)
    const src = await readFileOrNull(path.join(SOURCE_MATERIALS_DIR, f))
    if (src == null) continue
    const sections = new Map()
    for (const m of src.matchAll(/^(#{1,6})\s+§\s*([A-Za-z][A-Za-z0-9.]*?)\.?(?=\s|$)/gm)) {
      const id = foldTongan(m[2])
      if (!sections.has(id)) sections.set(id, { line: src.slice(0, m.index).split('\n').length, raw: m[2], depth: m[1].length })
    }
    sheets.set(foldTongan(name), { name, rel: `source-materials/${f}`, sections })
  }

  // EALD headwords, folded, from every category's `tongan` field.
  const ealdWords = new Map()
  const ealdRaw = await readFileOrNull(EALD_DICTIONARY)
  let ealdParsed = ealdRaw != null
  if (ealdRaw != null) {
    try {
      const dict = JSON.parse(ealdRaw)
      for (const [cat, entries] of Object.entries(dict.categories || {})) {
        for (const e of entries || []) {
          if (!e || typeof e.tongan !== 'string') continue
          // A headword may carry slash alternants ("vakai/sio", CL-003) — index
          // every one of them, plus the whole string, so both forms resolve.
          const forms = e.tongan.includes('/') ? [e.tongan, ...e.tongan.split('/')] : [e.tongan]
          for (const form of forms) {
            const key = ealdKey(form)
            if (key && !ealdWords.has(key)) ealdWords.set(key, { tongan: e.tongan, english: e.english || '', category: cat })
          }
        }
      }
    } catch { ealdParsed = false }
  }

  return { lftHeadings, conceptIds, specSections, churchwardFiles, shumwayRanges, frameTags, entryPointCount, frameSources, sheets, ealdWords, ealdParsed }
}

// ── token validators ─────────────────────────────────────────────────────

function isConceptValid(id) {
  const m = id.match(/^([A-G])(\d+)$/)
  if (!m) return false
  const max = GRAMMAR_CONCEPT_RANGES[m[1]]
  const n = parseInt(m[2], 10)
  return max != null && n >= 1 && n <= max
}

function suggestConcept(letter) {
  const max = GRAMMAR_CONCEPT_RANGES[letter]
  return max != null ? `valid ${letter}-range is ${letter}1–${letter}${max}` : `no such concept letter "${letter}"`
}

function shumwayInRange(n, ranges) {
  return ranges.some(([lo, hi]) => n >= lo && n <= hi)
}

// Pull the headword(s) out of every `EALD: …` mention on a line.
//
// Three shapes occur in the corpus, so all three are handled:
//   EALD: *fakamolemole* "forgive…"   → one italicised headword
//   EALD: *fie maʻu* "want…"          → an italic span may be a two-word entry
//   EALD: ʻalu, vakai, fale, Viliami  → a bare comma-run is a list of headwords
// The run stops at the first item that isn't a bare Tongan-shaped word, so a
// gloss ("late, behind, tardy") or a parenthetical is never mistaken for one.
// The literal placeholder `EALD: <word>` in the format exemplars is skipped:
// `<` can't start a word, so the pattern simply doesn't match.
const EALD_LETTER = "A-Za-zĀĒĪŌŪāēīōūʻ‘’'"
const EALD_ITEM = new RegExp(`^\\*([^*\\n]+)\\*|^([${EALD_LETTER}][${EALD_LETTER}\\-]*)`)

// A comma after an EALD headword usually starts another headword — but it also
// starts the NEXT citation in a chained "…: EALD: mamaʻo, LFT Ch. 32" cell.
// These leading words mean the run has ended, not that the dictionary should
// contain a headword called "LFT".
const EALD_RUN_STOPPERS = new Set([
  'lft', 'churchward', 'shumway', 'eald', 'grammar', 'frame', 'ch', 'lesson',
  'grammar-spec', 'negation-paradigm', 'function-templates', 'equatives',
  'interrogative-paradigm', 'discourse-particles', 'aspect-tense-matrix',
  'idiom-corpus', 'verb-collocation-index', 'parallel-corpus',
  'possessive-class-master', 'vocabulary-pool',
])

function ealdCitedWords(text) {
  const out = []
  const anchor = /EALD:\s*/g
  let a
  while ((a = anchor.exec(text)) !== null) {
    let rest = text.slice(a.index + a[0].length)
    for (let first = true; ; first = false) {
      const it = rest.match(EALD_ITEM)
      if (!it) break
      const word = (it[1] != null ? it[1] : it[2]).replace(/[.,;:!?)]+$/, '').trim()
      if (!first && it[1] == null && EALD_RUN_STOPPERS.has(word.toLowerCase())) break
      if (word) out.push({ token: `EALD: ${word}`, word })
      rest = rest.slice(it[0].length)
      const sep = rest.match(/^\s*,\s*/)
      if (!sep) break
      rest = rest.slice(sep[0].length)
    }
  }
  return out
}

// Scan one line for every citation token and push violations.
//
// `emit` is optional and null on the lint path: when supplied (--emit-index)
// every token this function inspects is also reported to it, resolved or not,
// with the key that identifies its on-disk target. It never influences
// validation — no `push` call, no control flow, depends on it.
function checkLine(file, n, text, ref, push, emit = null) {
  const record = emit
    ? (token, kind, ok, key) => emit({ file, line: n, token, kind, ok, key })
    : () => {}
  // 1. Numbered folder paths: NN-Word/ that doesn't exist on disk.
  for (const m of text.matchAll(/\b(\d{2})-([A-Za-z][A-Za-z-]*)\//g)) {
    const token = m[0]
    const dirPath = path.join(REPO_ROOT, token)
    // Synchronous existence isn't available here; the real dirs never use a
    // numeric prefix, so any NN-Word/ is treated as a path that doesn't
    // resolve. (We confirm against the known real targets for the suggestion.)
    const suggest = REAL_DIR_FOR[token.toLowerCase()] || 'use the real un-prefixed directory name'
    push(file, { n, token, why: `numbered-prefix path "${token}" does not exist on disk`, suggest, dirPath })
    record(token, 'path', false, { type: 'path', path: token })
  }

  // 2. LFT Ch. N [§"heading"]
  for (const m of text.matchAll(/LFT Ch\.\s*(\d+)(?:\s*§"([^"]*)")?/g)) {
    const token = m[0]
    const chap = parseInt(m[1], 10)
    if (chap < 1 || chap > LFT_CHAPTER_MAX) {
      push(file, { n, token, why: `LFT chapter ${chap} out of range (1..${LFT_CHAPTER_MAX})`, suggest: 'cite an existing chapter' })
      record(token, 'lft', false, { type: 'lft', chapter: chap, heading: m[2] ?? null })
      continue
    }
    const headings = ref.lftHeadings.get(chap)
    if (!headings) {
      push(file, { n, token, why: `book/Chapter-${String(chap).padStart(2, '0')}.md not found`, suggest: 'cite an existing chapter' })
      record(token, 'lft', false, { type: 'lft', chapter: chap, heading: m[2] ?? null })
      continue
    }
    const heading = m[2]
    if (heading != null && heading.trim() !== '') {
      if (!lftHeadingResolves(headings, heading)) {
        push(file, { n, token, kind: 'heading', why: `Ch.${chap} has no heading matching §"${heading}"`, suggest: 'verify the section exists in that chapter (likely a wrong-chapter citation)' })
        record(token, 'lft', false, { type: 'lft', chapter: chap, heading })
        continue
      }
    }
    record(token, 'lft', true, { type: 'lft', chapter: chap, heading: heading && heading.trim() !== '' ? heading : null })
  }

  // 3. Grammar Concept X# / (X#) and the malformed range string.
  for (const m of text.matchAll(/G1\s*[–-]\s*G58/g)) {
    push(file, { n, token: m[0], why: 'malformed Grammar-Concepts range: scheme ends at G7, not G58', suggest: 'the suite is A1–A9, B1–B15, C1–C5, D1–D4, E1–E7, F1–F11, G1–G7 (58 total)' })
  }
  for (const m of text.matchAll(/Grammar Concept\s*\(?([A-G]\d+)\)?/g)) {
    const token = m[0]
    const id = m[1].toUpperCase()
    if (!isConceptValid(id)) {
      push(file, { n, token, why: `Grammar Concept ${id} is not a valid id`, suggest: suggestConcept(id[0]) })
      record(token, 'concept', false, { type: 'concept', id })
    } else if (!ref.conceptIds.has(id)) {
      push(file, { n, token, why: `Grammar Concept ${id} not found as a "### ${id}." heading`, suggest: 'check Grammar-Concepts-for-Students.md' })
      record(token, 'concept', false, { type: 'concept', id })
    } else {
      record(token, 'concept', true, { type: 'concept', id })
    }
  }

  // 4. grammar-spec §N  (also "grammar-spec.md §N")
  for (const m of text.matchAll(/grammar-spec(?:\.md)?\s*§\s*(\d+)/g)) {
    const token = m[0]
    const sec = parseInt(m[1], 10)
    if (sec < 1 || sec > GRAMMAR_SPEC_SECTION_MAX) {
      push(file, { n, token, why: `grammar-spec §${sec} out of range (1..${GRAMMAR_SPEC_SECTION_MAX})`, suggest: 'cite an existing section' })
      record(token, 'spec', false, { type: 'spec', section: sec })
    } else if (!ref.specSections.has(sec)) {
      push(file, { n, token, why: `grammar-spec has no "## ${sec}." section`, suggest: 'check grammar-spec.md' })
      record(token, 'spec', false, { type: 'spec', section: sec })
    } else {
      record(token, 'spec', true, { type: 'spec', section: sec })
    }
  }

  // 5. Churchward Ch. N  (subsection format not validated, only chapter)
  for (const m of text.matchAll(/Churchward Ch\.\s*(\d+)/g)) {
    const token = m[0]
    const chap = parseInt(m[1], 10)
    if (chap < 1 || chap > CHURCHWARD_CHAPTER_MAX || !ref.churchwardFiles.has(chap)) {
      push(file, { n, token, why: `Churchward Ch. ${chap} has no file source-materials/Churchward/${String(chap).padStart(2, '0')}.md`, suggest: `valid Churchward chapters are 1..${CHURCHWARD_CHAPTER_MAX}` })
      record(token, 'churchward', false, { type: 'churchward', chapter: chap })
    } else {
      record(token, 'churchward', true, { type: 'churchward', chapter: chap })
    }
  }

  // 6. Shumway Lesson N / Shumway L### / Shumway L.### (book uses the dotted form)
  for (const m of text.matchAll(/Shumway (?:Lesson|L)\.?\s*(\d+)/g)) {
    const token = m[0]
    const lesson = parseInt(m[1], 10)
    if (!shumwayInRange(lesson, ref.shumwayRanges)) {
      const hi = ref.shumwayRanges.reduce((a, [, h]) => Math.max(a, h), 0)
      push(file, { n, token, why: `Shumway Lesson ${lesson} is outside the available lesson files`, suggest: `available lessons are 0..${hi}` })
      record(token, 'shumway', false, { type: 'shumway', lesson })
    } else {
      record(token, 'shumway', true, { type: 'shumway', lesson })
    }
  }

  // 7. Synthesis-sheet § citations: `<Sheet-Name> §X` / `<Sheet-Name> §X.N`.
  //    The name pattern is deliberately loose (any TitleCase[-TitleCase…] word
  //    before a §); a name that isn't one of the source-materials sheets is
  //    simply not this token class and is skipped. Renamed or vanished sheets
  //    are caught by the SHEETS_WITH_SECTION_SCHEME integrity guard instead.
  for (const m of text.matchAll(/\b([A-Z][A-Za-z]*(?:-[A-Z][A-Za-z]*)*)(?:\.md)?\s*§\s*([A-Za-z](?:\.\d+)*)\b/g)) {
    const sheet = ref.sheets.get(foldTongan(m[1]))
    if (!sheet) continue
    const token = `${m[1]} §${m[2]}`
    const id = foldTongan(m[2])
    if (sheet.sections.size === 0) {
      push(file, { n, token, kind: 'sheet-noscheme', why: `${sheet.name} has no § heading scheme; citation unverifiable`, suggest: 'cite that sheet by heading text, or give it a § scheme' })
      record(token, 'sheet', false, { type: 'sheet', sheet: sheet.name, section: m[2] })
    } else if (!sheet.sections.has(id)) {
      const parent = id.includes('.') ? id.split('.')[0] : null
      const known = [...sheet.sections.values()].filter(sec => !sec.raw.includes('.')).map(sec => `§${sec.raw}`).join(', ')
      push(file, { n, token, kind: 'heading', why: `${sheet.name} has no "§${m[2]}" heading`, suggest: parent && sheet.sections.has(parent) ? `§${parent.toUpperCase()} exists — check the subsection number` : `top-level sections there are ${known || '(none)'}` })
      record(token, 'sheet', false, { type: 'sheet', sheet: sheet.name, section: m[2] })
    } else {
      record(token, 'sheet', true, { type: 'sheet', sheet: sheet.name, section: m[2] })
    }
  }

  // 8. `EALD: <word>` headword lookups.
  for (const { token, word } of ealdCitedWords(text)) {
    const key = ealdKey(word)
    if (!key) continue
    if (ref.ealdWords.has(key)) {
      record(token, 'eald', true, { type: 'eald', word: key })
    } else if (looksLikeProperNoun(word)) {
      // A name pointed at a dictionary that carries common words (CL-006).
      // Non-blocking note everywhere, never a violation.
      push(file, { n, token, kind: 'eald-propernoun', why: `"${word}" is name-shaped and is not an EALD headword; EALD carries common words, not personal/place names`, suggest: 'cite Vocabulary-Pool, Shumway or Churchward for names, or drop the source tag' })
      record(token, 'eald', false, { type: 'eald', word: key })
    } else {
      push(file, { n, token, kind: 'eald', why: `"${word}" is not a headword in source-materials/EALD-Dictionary.json`, suggest: 'check the spelling (macrons and fakauʻa are already folded), or cite the source that does have it' })
      record(token, 'eald', false, { type: 'eald', word: key })
    }
  }

  // 9. **Frame:** declarations — the tag must be backticked and in the closed
  //    frame set (Entry Points Summary ∪ Function-Templates tags).
  {
    const fm = text.match(/^[\s>*-]*\*\*Frame:\*\*\s*(.*)$/)
    if (fm) {
      const idm = fm[1].match(/^`([^`]+)`/)
      if (!idm) {
        push(file, { n, token: `**Frame:** ${fm[1].slice(0, 48)}`, kind: 'frame', why: 'Frame line does not start with a backticked frame tag', suggest: 'use a tag from grammar-spec "Entry Points Summary" or Function-Templates (e.g. `statement`, `transitive_statement`)' })
        record(`**Frame:** ${fm[1].slice(0, 48)}`, 'frame', false, { type: 'frame', tag: null })
      } else if (!ref.frameTags.has(idm[1])) {
        push(file, { n, token: `\`${idm[1]}\``, kind: 'frame', why: `frame tag "${idm[1]}" is not in grammar-spec's Entry Points Summary or Function-Templates`, suggest: 'pick a real tag (e.g. statement, transitive_statement, noun_subject, reported_speech_pehē)' })
        record(`\`${idm[1]}\``, 'frame', false, { type: 'frame', tag: idm[1] })
      } else {
        record(`\`${idm[1]}\``, 'frame', true, { type: 'frame', tag: idm[1] })
      }
    }
  }
  // 9b. "the **`tag`** frame" prose mentions (reverse-spec style).
  for (const m of text.matchAll(/\*\*`([^`]+)`\*\*\s+frame\b/g)) {
    if (!ref.frameTags.has(m[1])) {
      push(file, { n, token: `\`${m[1]}\``, kind: 'frame', why: `frame tag "${m[1]}" is not in grammar-spec's Entry Points Summary or Function-Templates`, suggest: 'pick a real tag from the closed frame set' })
      record(`\`${m[1]}\``, 'frame', false, { type: 'frame', tag: m[1] })
    } else {
      record(`\`${m[1]}\``, 'frame', true, { type: 'frame', tag: m[1] })
    }
  }
}

// Known real targets for the three numbered-prefix paths, for nicer hints.
const REAL_DIR_FOR = {
  '05-spec/': 'spec/',
  '03-book/': 'book/',
  '01-source-materials/': 'source-materials/',
}

// ── --emit-index: resolve every checked citation to what's on disk ────────
//
// The resolution/substance split (analysis R2): this index answers "does the
// citation resolve, and what is at the other end" cheaply, so a walkthrough
// does not re-open five source files to confirm a pointer exists. It does NOT
// answer "does the source actually establish the claim" — substance checks
// still open the source. `contentHash` is the hash of the resolved SECTION, so
// a stale index is detectable: rebuild and diff the hashes.

const INDEX_OUT = path.join(SPEC_DIR, 'Citation-Index.json')
const INDEX_REGEN = 'node scripts/check-citations.mjs --emit-index   (from lea-faka-tonga-app/)'

function sha12(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 12)
}

// The block of markdown a heading owns: from its line down to the next
// heading of the same or shallower depth (or EOF).
function sectionAt(lines, headingLine, depth) {
  const start = headingLine - 1
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+\S/)
    if (m && m[1].length <= depth) { end = i; break }
  }
  return lines.slice(start, end).join('\n')
}

function snippetOf(text, headingLine) {
  const body = text.split('\n').slice(1).map(l => l.trim()).filter(Boolean)
  const first = body.find(l => !/^[|>#-]/.test(l)) || body[0] || ''
  return { line: headingLine, snippet: first.length > 220 ? `${first.slice(0, 217)}…` : first }
}

// Cache of parsed markdown files, so resolving 900 citations reads each file once.
function makeFileCache() {
  const cache = new Map()
  return async (rel) => {
    if (cache.has(rel)) return cache.get(rel)
    const src = await readFileOrNull(path.join(REPO_ROOT, rel))
    const entry = src == null ? null : { src, lines: src.split('\n') }
    cache.set(rel, entry)
    return entry
  }
}

// Find a heading line by predicate; returns { line, depth, raw } or null.
function findHeading(lines, predicate) {
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.*?)\s*$/)
    if (m && predicate(m[2], m[1].length)) return { line: i + 1, depth: m[1].length, raw: m[2] }
  }
  return null
}

async function resolveTarget(key, getFile, ref) {
  const whole = (rel, f, heading) => ({
    file: rel,
    line: 1,
    heading,
    snippet: snippetOf(f.src, 1).snippet,
    contentHash: sha12(f.src),
    scope: 'file',
  })

  if (key.type === 'lft') {
    const rel = `book/Chapter-${String(key.chapter).padStart(2, '0')}.md`
    const f = await getFile(rel)
    if (!f) return null
    if (key.heading) {
      const want = normalizeHeading(key.heading)
      const h = findHeading(f.lines, (raw) => {
        if (normalizeHeading(raw) === want) return true
        const t = raw.match(/^(?:Chapter|Lesson)\s+\d+:\s*(.+)$/)
        return !!t && normalizeHeading(t[1]) === want
      })
      if (!h) return null
      const section = sectionAt(f.lines, h.line, h.depth)
      return { file: rel, line: h.line, heading: h.raw, snippet: snippetOf(section, h.line).snippet, contentHash: sha12(section), scope: 'section' }
    }
    const title = findHeading(f.lines, (_, d) => d === 1)
    return whole(rel, f, title ? title.raw : null)
  }

  if (key.type === 'concept') {
    const rel = 'spec/Grammar-Concepts-for-Students.md'
    const f = await getFile(rel)
    if (!f) return null
    const h = findHeading(f.lines, (raw, d) => d === 3 && raw.toUpperCase().startsWith(`${key.id}.`))
    if (!h) return null
    const section = sectionAt(f.lines, h.line, h.depth)
    return { file: rel, line: h.line, heading: h.raw, snippet: snippetOf(section, h.line).snippet, contentHash: sha12(section), scope: 'section' }
  }

  if (key.type === 'spec') {
    const rel = 'spec/grammar-spec.md'
    const f = await getFile(rel)
    if (!f) return null
    const h = findHeading(f.lines, (raw, d) => d === 2 && new RegExp(`^${key.section}\\.\\s`).test(raw))
    if (!h) return null
    const section = sectionAt(f.lines, h.line, h.depth)
    return { file: rel, line: h.line, heading: h.raw, snippet: snippetOf(section, h.line).snippet, contentHash: sha12(section), scope: 'section' }
  }

  if (key.type === 'churchward') {
    const rel = `source-materials/Churchward/${String(key.chapter).padStart(2, '0')}.md`
    const f = await getFile(rel)
    if (!f) return null
    const title = findHeading(f.lines, () => true)
    return whole(rel, f, title ? title.raw : null)
  }

  if (key.type === 'shumway') {
    const range = ref.shumwayRanges.find(([lo, hi]) => key.lesson >= lo && key.lesson <= hi)
    if (!range) return null
    const pad = (v) => String(v).padStart(3, '0')
    const rel = `source-materials/Shumway/shumway_L${pad(range[0])}-L${pad(range[1])}.md`
    const f = await getFile(rel)
    if (!f) return null
    const h = findHeading(f.lines, (raw) => new RegExp(`^(?:PRE-)?LESSON\\s+${key.lesson}\\b`, 'i').test(raw))
    if (!h) {
      const title = findHeading(f.lines, () => true)
      return whole(rel, f, title ? title.raw : null)
    }
    const section = sectionAt(f.lines, h.line, h.depth)
    return { file: rel, line: h.line, heading: h.raw, snippet: snippetOf(section, h.line).snippet, contentHash: sha12(section), scope: 'section' }
  }

  if (key.type === 'sheet') {
    const sheet = ref.sheets.get(foldTongan(key.sheet))
    if (!sheet) return null
    const sec = sheet.sections.get(foldTongan(key.section))
    if (!sec) return null
    const f = await getFile(sheet.rel)
    if (!f) return null
    const section = sectionAt(f.lines, sec.line, sec.depth)
    return { file: sheet.rel, line: sec.line, heading: `§${sec.raw}`, snippet: snippetOf(section, sec.line).snippet, contentHash: sha12(section), scope: 'section' }
  }

  if (key.type === 'eald') {
    const entry = ref.ealdWords.get(key.word)
    if (!entry) return null
    const row = `${entry.tongan} — ${entry.english}${entry.category ? ` (${entry.category})` : ''}`
    return { file: 'source-materials/EALD-Dictionary.json', line: 0, heading: entry.tongan, snippet: row, contentHash: sha12(row), scope: 'entry' }
  }

  if (key.type === 'frame') {
    const src = key.tag != null ? ref.frameSources.get(key.tag) : null
    if (!src) return null
    return { file: src.file, line: src.line, heading: src.origin, snippet: src.row, contentHash: sha12(src.row), scope: 'row' }
  }

  return null
}

async function emitCitationIndex(records, ref, scanFiles) {
  const getFile = makeFileCache()

  // Group by the citation token itself: one entry per distinct citation,
  // listing every place it is cited from.
  const byToken = new Map()
  for (const r of records) {
    const id = `${r.kind} ${r.token}`
    if (!byToken.has(id)) byToken.set(id, { citation: r.token, kind: r.kind, key: r.key, lintResolves: r.ok, citedFrom: [] })
    const e = byToken.get(id)
    e.citedFrom.push({ file: r.file, line: r.line })
    if (!r.ok) e.lintResolves = false
  }

  const citations = []
  for (const e of [...byToken.values()]) {
    const target = e.lintResolves ? await resolveTarget(e.key, getFile, ref) : null
    citations.push({
      citation: e.citation,
      kind: e.kind,
      resolves: e.lintResolves && target != null,
      target,
      citedFrom: e.citedFrom.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line),
    })
  }
  citations.sort((a, b) => a.kind.localeCompare(b.kind) || a.citation.localeCompare(b.citation))

  const byKind = {}
  for (const c of citations) {
    byKind[c.kind] = byKind[c.kind] || { distinct: 0, sites: 0, unresolved: 0 }
    byKind[c.kind].distinct += 1
    byKind[c.kind].sites += c.citedFrom.length
    if (!c.resolves) byKind[c.kind].unresolved += 1
  }

  const out = {
    _generated: {
      note: 'GENERATED FILE — do not edit by hand. Derived index of every citation the lint validates.',
      regen: INDEX_REGEN,
      what: 'Resolution layer only: "does this citation resolve, and what is at the other end". Substance ("does the source establish the claim") still requires opening the source — see reviews/translate-pipeline-analysis.md R2.',
      contentHash: 'sha256, first 12 hex, of the resolved section (or whole file where scope is "file"). Rebuild and diff to detect a source that moved under a citation.',
      scannedFiles: scanFiles.length,
    },
    summary: {
      distinctCitations: citations.length,
      citationSites: citations.reduce((a, c) => a + c.citedFrom.length, 0),
      unresolved: citations.filter(c => !c.resolves).length,
      byKind,
    },
    citations,
  }

  await fs.writeFile(INDEX_OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8')
  console.log(`\n── Citation index ──`)
  console.log(`  ✓ wrote ${path.relative(REPO_ROOT, INDEX_OUT)} — ${citations.length} distinct citation(s), ${out.summary.citationSites} site(s), ${out.summary.unresolved} unresolved`)
}

// ── source-materials/ internal graph — REPORT ONLY ───────────────────────
//
// The synthesis sheets cite each other, the book, the specs, Churchward,
// Shumway and the dictionary heavily (~2k edges). Those edges are worth
// seeing, but they were never part of the gate: this section runs the exact
// same resolvers over source-materials/*.md and prints counts plus a capped
// sample of what didn't resolve. It returns nothing, is never added to
// `errors`, and therefore cannot move any exit code — not this script's, and
// not `npm run check:style`'s, which reads only runCitationCheck()'s return.
// Escalating it later is a deliberate act: count these into `errors`.

const SM_REPORT_SAMPLE_CAP = 20

async function runSourceMaterialsReport(ref) {
  const files = (await fs.readdir(SOURCE_MATERIALS_DIR).catch(() => []))
    .filter(f => f.endsWith('.md')).sort().map(f => `source-materials/${f}`)

  const byKind = new Map()   // kind -> { total, unresolved, samples[] }
  const bump = (kind, ok, sample) => {
    if (!byKind.has(kind)) byKind.set(kind, { total: 0, unresolved: 0, samples: [] })
    const s = byKind.get(kind)
    s.total += 1
    if (!ok) {
      s.unresolved += 1
      if (s.samples.length < SM_REPORT_SAMPLE_CAP) s.samples.push(sample)
    }
  }

  const byFile = new Map()
  const push = (file, v) => {
    if (!byFile.has(file)) byFile.set(file, [])
    byFile.get(file).push(v)
  }

  const seen = []
  for (const rel of files) {
    const src = await readFileOrNull(path.join(REPO_ROOT, rel))
    if (src == null) continue
    for (const { n, text, skip } of readableLines(src)) {
      if (skip) continue
      checkLine(rel, n, text, ref, push, (r) => seen.push(r))
    }
  }

  // Same disk check the gate applies: an NN-Word/ path that really exists is
  // not a violation. Build the set of genuinely-unresolved (file,line,token).
  const realMisses = new Set()
  for (const [file, vs] of byFile) {
    for (const v of vs) {
      if (v.dirPath && await exists(v.dirPath)) continue
      realMisses.add(`${file}:${v.n}:${v.token}`)
    }
  }

  for (const r of seen) {
    const ok = r.ok && !realMisses.has(`${r.file}:${r.line}:${r.token}`)
    bump(r.kind, ok, `${r.file}:${r.line} — ${r.token}`)
  }

  const kinds = [...byKind.entries()].sort((a, b) => b[1].total - a[1].total)
  const totalEdges = kinds.reduce((a, [, s]) => a + s.total, 0)
  const totalUnres = kinds.reduce((a, [, s]) => a + s.unresolved, 0)

  console.log('\n── source-materials/ internal citation graph (REPORT ONLY — never affects the exit code) ──')
  console.log(`  ${files.length} file(s) scanned · ${totalEdges} edge(s) · ${totalUnres} unresolved`)
  if (totalEdges === 0) { console.log('  (no citation tokens found)'); return }
  console.log('\n  by edge type:')
  for (const [kind, s] of kinds) {
    console.log(`    ${kind.padEnd(12)} ${String(s.total).padStart(5)} edge(s)   ${String(s.unresolved).padStart(5)} unresolved`)
  }
  for (const [kind, s] of kinds) {
    if (s.unresolved === 0) continue
    console.log(`\n  unresolved — ${kind} (showing ${s.samples.length} of ${s.unresolved}):`)
    for (const line of s.samples) console.log(`    · ${line}`)
  }
  console.log('\n  (report only — nothing above is counted as an error or a warning)')
}

// ── orchestration ─────────────────────────────────────────────────────────

export async function runCitationCheck(scanFiles = null, opts = {}) {
  // Default scan = the translation specs/skills/log PLUS every book chapter.
  if (scanFiles == null) scanFiles = [...SCAN_FILES, ...(await bookScanFiles())]
  const ref = await buildReferenceData()

  // --emit-index only: collect every inspected token. Null on the lint path,
  // so checkLine's `record` is a no-op and nothing below changes.
  const indexRecords = opts.emitIndex ? [] : null
  const emit = indexRecords ? (r) => indexRecords.push(r) : null

  // Verify any NN-Word/ path against disk before flagging, so a future real
  // numbered directory wouldn't false-positive.
  const byFile = new Map()
  const push = (file, v) => {
    if (!byFile.has(file)) byFile.set(file, [])
    byFile.get(file).push(v)
  }

  // Fail loudly if the frame reference set vanished (spec restructure) —
  // otherwise frame-tag validation would silently pass everything.
  if (ref.entryPointCount === 0) {
    push('spec/grammar-spec.md', { n: 0, token: 'Entry Points Summary', why: 'no entry-point IDs harvested — the "## Entry Points Summary" table is missing or renamed, so frame-tag validation has no reference set', suggest: 'restore the table in spec/grammar-spec.md' })
  }

  // The same guard for the synthesis sheets: a sheet declared to carry a §
  // scheme that harvests zero §-headings has been renamed or restructured, and
  // every citation into it would otherwise fail (or pass) for the wrong reason.
  for (const name of SHEETS_WITH_SECTION_SCHEME) {
    const sheet = ref.sheets.get(foldTongan(name))
    if (!sheet) {
      push(`source-materials/${name}.md`, { n: 0, token: name, why: 'declared synthesis sheet is missing from source-materials/', suggest: 'restore the file, or drop it from SHEETS_WITH_SECTION_SCHEME in check-citations.mjs' })
    } else if (sheet.sections.size === 0) {
      push(sheet.rel, { n: 0, token: name, why: 'sheet is declared to use a § heading scheme but harvested zero "§X" headings — renamed or restructured', suggest: 'restore the § headings, or drop it from SHEETS_WITH_SECTION_SCHEME in check-citations.mjs' })
    }
  }

  // And for the dictionary: an unreadable or unparseable EALD-Dictionary.json
  // would make every `EALD: <word>` lookup fail identically.
  if (!ref.ealdParsed || ref.ealdWords.size === 0) {
    push('source-materials/EALD-Dictionary.json', { n: 0, token: 'EALD-Dictionary.json', why: 'no EALD headwords harvested — the dictionary is missing, unparseable, or has no categories, so `EALD: <word>` lookups have no reference set', suggest: 'restore source-materials/EALD-Dictionary.json' })
  }

  for (const rel of scanFiles) {
    const abs = path.join(REPO_ROOT, rel)
    const src = await readFileOrNull(abs)
    if (src == null) {
      push(rel, { n: 0, token: rel, why: 'scanned file not found', suggest: 'remove from SCAN_FILES or restore the file' })
      continue
    }
    for (const { n, text, skip } of readableLines(src)) {
      if (skip) continue
      checkLine(rel, n, text, ref, push, emit)
    }
  }

  // Drop NN-Word/ violations whose directory actually exists on disk.
  for (const [file, vs] of byFile) {
    const kept = []
    for (const v of vs) {
      if (v.dirPath && await exists(v.dirPath)) continue
      kept.push(v)
    }
    byFile.set(file, kept)
  }

  // Severity: a §"heading" mismatch — and likewise a frame-tag violation — in
  // the historical Translation-Log corpus (or a book chapter) is a WARNING;
  // every other token class, and any mismatch in the canonical specs/skills,
  // is a hard ERROR. This keeps the source-of-truth specs strict while
  // surfacing — without blocking — drift in the author-facing log.
  //
  // `eald` joins that lax set: an unresolvable headword in the historical log
  // or a book chapter is drift to triage, not a build-stopper. `sheet-noscheme`
  // is neither error nor warning — the sheet simply has no § scheme to check
  // against, so it is a separately-counted "unverifiable" note everywhere.
  const sev = (file, v) =>
    NOTE_KINDS.has(v.kind) ? 'note'
      : (LAX_KINDS.has(v.kind) && !STRICT_FILES.has(file)) ? 'warn'
        : 'error'

  let errors = 0
  let warnings = 0
  let notes = 0
  console.log('\n── Citation validation (hard) ──')
  // Union of the scanned files and any file a reference-set integrity guard
  // pushed to (those targets — grammar-spec, a synthesis sheet, the dictionary
  // — are reference sources, not scan files, so they must be printed too).
  const reportFiles = [...scanFiles, ...[...byFile.keys()].filter(f => !scanFiles.includes(f))]
  for (const rel of reportFiles) {
    const vs = (byFile.get(rel) || []).sort((a, b) => a.n - b.n)
    if (vs.length === 0) continue
    const errs = vs.filter(v => sev(rel, v) === 'error')
    const warns = vs.filter(v => sev(rel, v) === 'warn')
    const nts = vs.filter(v => sev(rel, v) === 'note')
    if (errs.length === 0 && warns.length === 0 && nts.length === 0) continue
    console.log(`\n  ${rel}`)
    for (const v of errs) {
      errors += 1
      const loc = v.n > 0 ? `${rel}:${v.n}` : rel
      console.log(`  ✗ ${loc} — ${v.token} — ${v.why}${v.suggest ? ` — → ${v.suggest}` : ''}`)
    }
    for (const v of warns) {
      warnings += 1
      const loc = v.n > 0 ? `${rel}:${v.n}` : rel
      console.log(`  ⚠ ${loc} — ${v.token} — ${v.why}${v.suggest ? ` — → ${v.suggest}` : ''}`)
    }
    for (const v of nts) {
      notes += 1
      const loc = v.n > 0 ? `${rel}:${v.n}` : rel
      console.log(`  ? ${loc} — ${v.token} — ${v.why}${v.suggest ? ` — → ${v.suggest}` : ''}`)
    }
  }
  const tail = `${warnings ? `${warnings} warning(s)` : ''}${warnings && notes ? ', ' : ''}${notes ? `${notes} note(s) (unverifiable sheet § / proper noun)` : ''}`
  if (errors === 0) {
    console.log(`  ✓ no hard citation violations across ${scanFiles.length} scanned file(s)${tail ? ` (${tail}: non-blocking)` : ''}`)
  } else {
    console.log(`\n  ${errors} hard citation violation(s)${tail ? `, ${tail}` : ''}`)
  }
  if (indexRecords) await emitCitationIndex(indexRecords, ref, scanFiles)
  if (opts.sourceMaterialsReport) await runSourceMaterialsReport(ref)
  return errors
}

// Canonical, source-of-truth files where a §"heading" mismatch is a hard
// error (these are the templates every walkthrough copies). The log is the
// historical corpus and is held to a warning for heading drift only.
const STRICT_FILES = new Set([
  'spec/Translation-Walkthrough-Method.md',
  'spec/Reverse-Translation-Walkthrough-Method.md',
  '.claude/skills/translate/SKILL.md',
  '.claude/skills/reverse-translate/SKILL.md',
])

// Violation kinds held to a warning outside STRICT_FILES: pointer drift in the
// historical log or the book, rather than a broken source-of-truth template.
const LAX_KINDS = new Set(['heading', 'frame', 'eald'])

// Neither error nor warning, anywhere: the check ran and returned "cannot be
// verified this way", which is information, not a defect. `sheet-noscheme` =
// the cited sheet has no § scheme to anchor against; `eald-propernoun` = a
// name looked up in a dictionary of common words (CL-006).
const NOTE_KINDS = new Set(['sheet-noscheme', 'eald-propernoun'])

// Allow running standalone: `node scripts/check-citations.mjs`
// With `--emit-index`, additionally write spec/Citation-Index.json. The flag
// is purely additive: validation, output, and exit code are unchanged.
// The source-materials/ graph report prints on a standalone run and can be
// suppressed with --no-sm-report. It is OFF when check-style.mjs imports
// runCitationCheck(), so the gate's output stays the signal it always was —
// and being report-only, it never touches either exit code regardless.
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2)
  const emitIndex = argv.includes('--emit-index')
  const sourceMaterialsReport = !argv.includes('--no-sm-report')
  runCitationCheck(null, { emitIndex, sourceMaterialsReport })
    .then(total => process.exit(total === 0 ? 0 : 1))
    .catch(err => { console.error(err); process.exit(2) })
}
