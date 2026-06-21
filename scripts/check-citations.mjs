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
 *   7. FRAME TAGS. A `**Frame:**` declaration line must start with a
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
const FUNCTION_TEMPLATES = path.join(REPO_ROOT, 'source-materials', 'Function-Templates.md')

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

async function readFileOrNull(p) {
  return fs.readFile(p, 'utf8').catch(() => null)
}

async function exists(p) {
  return fs.access(p).then(() => true).catch(() => false)
}

// Collect normalized heading text from a markdown file. For the chapter
// title line (`# Lesson N: Title`) we index the bare "Title" too, so a
// §"Conjunctions" citation can match a chapter whose title is "Conjunctions".
function collectHeadings(src) {
  const headings = new Set()
  for (const line of src.split('\n')) {
    const m = line.match(/^#{1,6}\s+(.*?)\s*$/)
    if (!m) continue
    headings.add(normalizeHeading(m[1]))
    const title = m[1].match(/^(?:Chapter|Lesson)\s+\d+:\s*(.+)$/)
    if (title) headings.add(normalizeHeading(title[1]))
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
  const frameTags = new Set()
  const epStart = specSrc.indexOf('## Entry Points Summary')
  if (epStart !== -1) {
    const rest = specSrc.slice(epStart)
    const end = rest.indexOf('\n## ', 1)
    const section = end === -1 ? rest : rest.slice(0, end)
    for (const m of section.matchAll(/^\|\s*`([^`\s]+)`\s*\|/gm)) frameTags.add(m[1])
  }
  const entryPointCount = frameTags.size
  const ftSrc = (await readFileOrNull(FUNCTION_TEMPLATES)) || ''
  for (const m of ftSrc.matchAll(/\|\s*`([a-zʻ'’_āēīōū]+)`\s*\|/g)) frameTags.add(m[1])
  for (const m of ftSrc.matchAll(/^\*\*Frame:\*\*\s*`([^`\s]+)`/gm)) frameTags.add(m[1])

  return { lftHeadings, conceptIds, specSections, churchwardFiles, shumwayRanges, frameTags, entryPointCount }
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

// Scan one line for every citation token and push violations.
function checkLine(file, n, text, ref, push) {
  // 1. Numbered folder paths: NN-Word/ that doesn't exist on disk.
  for (const m of text.matchAll(/\b(\d{2})-([A-Za-z][A-Za-z-]*)\//g)) {
    const token = m[0]
    const dirPath = path.join(REPO_ROOT, token)
    // Synchronous existence isn't available here; the real dirs never use a
    // numeric prefix, so any NN-Word/ is treated as a path that doesn't
    // resolve. (We confirm against the known real targets for the suggestion.)
    const suggest = REAL_DIR_FOR[token.toLowerCase()] || 'use the real un-prefixed directory name'
    push(file, { n, token, why: `numbered-prefix path "${token}" does not exist on disk`, suggest, dirPath })
  }

  // 2. LFT Ch. N [§"heading"]
  for (const m of text.matchAll(/LFT Ch\.\s*(\d+)(?:\s*§"([^"]*)")?/g)) {
    const token = m[0]
    const chap = parseInt(m[1], 10)
    if (chap < 1 || chap > LFT_CHAPTER_MAX) {
      push(file, { n, token, why: `LFT chapter ${chap} out of range (1..${LFT_CHAPTER_MAX})`, suggest: 'cite an existing chapter' })
      continue
    }
    const headings = ref.lftHeadings.get(chap)
    if (!headings) {
      push(file, { n, token, why: `book/Chapter-${String(chap).padStart(2, '0')}.md not found`, suggest: 'cite an existing chapter' })
      continue
    }
    const heading = m[2]
    if (heading != null && heading.trim() !== '') {
      if (!headings.has(normalizeHeading(heading))) {
        push(file, { n, token, kind: 'heading', why: `Ch.${chap} has no heading matching §"${heading}"`, suggest: 'verify the section exists in that chapter (likely a wrong-chapter citation)' })
      }
    }
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
    } else if (!ref.conceptIds.has(id)) {
      push(file, { n, token, why: `Grammar Concept ${id} not found as a "### ${id}." heading`, suggest: 'check Grammar-Concepts-for-Students.md' })
    }
  }

  // 4. grammar-spec §N  (also "grammar-spec.md §N")
  for (const m of text.matchAll(/grammar-spec(?:\.md)?\s*§\s*(\d+)/g)) {
    const token = m[0]
    const sec = parseInt(m[1], 10)
    if (sec < 1 || sec > GRAMMAR_SPEC_SECTION_MAX) {
      push(file, { n, token, why: `grammar-spec §${sec} out of range (1..${GRAMMAR_SPEC_SECTION_MAX})`, suggest: 'cite an existing section' })
    } else if (!ref.specSections.has(sec)) {
      push(file, { n, token, why: `grammar-spec has no "## ${sec}." section`, suggest: 'check grammar-spec.md' })
    }
  }

  // 5. Churchward Ch. N  (subsection format not validated, only chapter)
  for (const m of text.matchAll(/Churchward Ch\.\s*(\d+)/g)) {
    const token = m[0]
    const chap = parseInt(m[1], 10)
    if (chap < 1 || chap > CHURCHWARD_CHAPTER_MAX || !ref.churchwardFiles.has(chap)) {
      push(file, { n, token, why: `Churchward Ch. ${chap} has no file source-materials/Churchward/${String(chap).padStart(2, '0')}.md`, suggest: `valid Churchward chapters are 1..${CHURCHWARD_CHAPTER_MAX}` })
    }
  }

  // 6. Shumway Lesson N / Shumway L### / Shumway L.### (book uses the dotted form)
  for (const m of text.matchAll(/Shumway (?:Lesson|L)\.?\s*(\d+)/g)) {
    const token = m[0]
    const lesson = parseInt(m[1], 10)
    if (!shumwayInRange(lesson, ref.shumwayRanges)) {
      const hi = ref.shumwayRanges.reduce((a, [, h]) => Math.max(a, h), 0)
      push(file, { n, token, why: `Shumway Lesson ${lesson} is outside the available lesson files`, suggest: `available lessons are 0..${hi}` })
    }
  }

  // 7. **Frame:** declarations — the tag must be backticked and in the closed
  //    frame set (Entry Points Summary ∪ Function-Templates tags).
  {
    const fm = text.match(/^[\s>*-]*\*\*Frame:\*\*\s*(.*)$/)
    if (fm) {
      const idm = fm[1].match(/^`([^`]+)`/)
      if (!idm) {
        push(file, { n, token: `**Frame:** ${fm[1].slice(0, 48)}`, kind: 'frame', why: 'Frame line does not start with a backticked frame tag', suggest: 'use a tag from grammar-spec "Entry Points Summary" or Function-Templates (e.g. `statement`, `transitive_statement`)' })
      } else if (!ref.frameTags.has(idm[1])) {
        push(file, { n, token: `\`${idm[1]}\``, kind: 'frame', why: `frame tag "${idm[1]}" is not in grammar-spec's Entry Points Summary or Function-Templates`, suggest: 'pick a real tag (e.g. statement, transitive_statement, noun_subject, reported_speech_pehē)' })
      }
    }
  }
  // 7b. "the **`tag`** frame" prose mentions (reverse-spec style).
  for (const m of text.matchAll(/\*\*`([^`]+)`\*\*\s+frame\b/g)) {
    if (!ref.frameTags.has(m[1])) {
      push(file, { n, token: `\`${m[1]}\``, kind: 'frame', why: `frame tag "${m[1]}" is not in grammar-spec's Entry Points Summary or Function-Templates`, suggest: 'pick a real tag from the closed frame set' })
    }
  }
}

// Known real targets for the three numbered-prefix paths, for nicer hints.
const REAL_DIR_FOR = {
  '05-spec/': 'spec/',
  '03-book/': 'book/',
  '01-source-materials/': 'source-materials/',
}

// ── orchestration ─────────────────────────────────────────────────────────

export async function runCitationCheck(scanFiles = null) {
  // Default scan = the translation specs/skills/log PLUS every book chapter.
  if (scanFiles == null) scanFiles = [...SCAN_FILES, ...(await bookScanFiles())]
  const ref = await buildReferenceData()

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

  for (const rel of scanFiles) {
    const abs = path.join(REPO_ROOT, rel)
    const src = await readFileOrNull(abs)
    if (src == null) {
      push(rel, { n: 0, token: rel, why: 'scanned file not found', suggest: 'remove from SCAN_FILES or restore the file' })
      continue
    }
    for (const { n, text, skip } of readableLines(src)) {
      if (skip) continue
      checkLine(rel, n, text, ref, push)
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
  const sev = (file, v) =>
    ((v.kind === 'heading' || v.kind === 'frame') && !STRICT_FILES.has(file)) ? 'warn' : 'error'

  let errors = 0
  let warnings = 0
  console.log('\n── Citation validation (hard) ──')
  for (const rel of scanFiles) {
    const vs = (byFile.get(rel) || []).sort((a, b) => a.n - b.n)
    if (vs.length === 0) continue
    const errs = vs.filter(v => sev(rel, v) === 'error')
    const warns = vs.filter(v => sev(rel, v) === 'warn')
    if (errs.length === 0 && warns.length === 0) continue
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
  }
  if (errors === 0) {
    console.log(`  ✓ no hard citation violations across ${scanFiles.length} scanned file(s)${warnings ? ` (${warnings} warning(s): log heading/frame drift, non-blocking)` : ''}`)
  } else {
    console.log(`\n  ${errors} hard citation violation(s)${warnings ? `, ${warnings} warning(s)` : ''}`)
  }
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

// Allow running standalone: `node scripts/check-citations.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  runCitationCheck()
    .then(total => process.exit(total === 0 ? 0 : 1))
    .catch(err => { console.error(err); process.exit(2) })
}
