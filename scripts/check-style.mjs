#!/usr/bin/env node
/**
 * check-style.mjs — author-time style/structural sanity check for book/.
 *
 * Run: `node scripts/check-style.mjs` (from lea-faka-tonga-app/)
 *      or `npm run check:style`
 *
 * Four checks:
 *
 *   1. EM-DASH (hard fail). Scans book/Chapter-*.md for U+2014. Em-dashes
 *      are banned from book/ per the zero-tolerance policy. Replace with
 *      comma, colon, semicolon, parens, or sentence split.
 *
 *   1b. APP-CONTENT EM-DASH (hard fail). Extends the same ban to what the app
 *      renders: quiz/chart/chapter/pattern/graph data + drill & builder copy.
 *      Catches —, the — escape, and &mdash;. JSX is comment-stripped so
 *      JSDoc em-dashes don't trip it; marketing pages (Offer/Landing/Keepers)
 *      are excluded pending an owner ruling; components are warning-only (they
 *      carry a legit /[–—]/ dash-detection regex). (2026-06-15)
 *
 *   2. CHAPTER CONTIGUITY (hard fail). Verifies Chapter-01..NN.md exist
 *      with no gaps or extras, and that src/data/chapters.json has the
 *      same count and titles match the `# Chapter N: Title` headings in
 *      each markdown file.
 *
 *   3. CROSS-REFERENCE RESOLUTION (hard fail). Scans book/ for
 *      `Chapter NN` references; verifies each cited number resolves to
 *      an existing chapter. Catches dangling refs after a renumber.
 *
 *   N. PROSE STYLE (warning only). Scans running prose (skips ::: divs, code
 *      fences, table rows, Author Verification) for the non-em-dash style
 *      prohibitions a rewrite might reintroduce: en-dash-as-prose-connector,
 *      "Let's", hedge openers, filler transitions, prose exclamation marks.
 *
 *   4. FOCUS-MARKER 'a e (warning only). Scans :::examples blocks for
 *      `<verb> e <lowercase>` patterns where `'a` may have been dropped.
 *      Reports as warnings; false positives are expected (cleft sentences
 *      and semi-definite drills legitimately drop `'a`).
 *
 *   5. CITATION VALIDATION (hard fail). Delegated to check-citations.mjs —
 *      verifies every citation token in the translation specs, skills, and
 *      Translation-Log.md resolves to a real chapter/section/source on disk.
 *
 * Exits 0 on clean run (warnings OK), 1 on any hard-check failure.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runCitationCheck } from './check-citations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const BOOK_DIR = path.join(REPO_ROOT, 'book')
const CHAPTERS_JSON = path.join(APP_ROOT, 'src/data/chapters.json')
const EXPECTED_CHAPTER_COUNT = 53

const EM_DASH = '—'

const A_E_PRECEDERS = ['kai', 'inu', 'lau', 'tā', 'tanu', 'tatala', 'fai', 'ako', 'nofo', 'lele', 'foki']

async function readChapterFiles() {
  const files = await fs.readdir(BOOK_DIR)
  return files.filter(f => /^Chapter-\d{2}\.md$/.test(f)).sort()
}

async function readJSON(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'))
}

// Strip markdown formatting and normalize apostrophe variants so the
// chapters.json display titles (plain) and the markdown headings
// (italicized, sometimes ASCII apostrophe) compare equal when the
// semantic title matches.
function normalizeTitle(s) {
  return s
    .replace(/\*+/g, '')
    .replace(/[ʻ‘’]/g, "'")
    .trim()
}

async function checkEmDashes(chapterFiles) {
  const hits = []
  for (const f of chapterFiles) {
    const src = await fs.readFile(path.join(BOOK_DIR, f), 'utf8')
    const lines = src.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(EM_DASH)) {
        hits.push({ file: f, line: i + 1, ctx: lines[i].trim().slice(0, 100) })
      }
    }
  }
  return hits
}

async function checkContiguity(chapterFiles, chapters) {
  const errors = []
  const expectedNumbers = Array.from({ length: EXPECTED_CHAPTER_COUNT }, (_, i) => i + 1)
  const foundNumbers = new Set()
  for (const f of chapterFiles) {
    const m = f.match(/^Chapter-(\d{2})\.md$/)
    if (m) foundNumbers.add(parseInt(m[1], 10))
  }
  for (const n of expectedNumbers) {
    if (!foundNumbers.has(n)) {
      errors.push({ kind: 'missing-file', msg: `book/Chapter-${String(n).padStart(2, '0')}.md not found` })
    }
  }
  for (const n of foundNumbers) {
    if (!expectedNumbers.includes(n)) {
      errors.push({ kind: 'extra-file', msg: `book/Chapter-${String(n).padStart(2, '0')}.md exists but not expected (out of 1..${EXPECTED_CHAPTER_COUNT})` })
    }
  }

  if (chapters.length !== EXPECTED_CHAPTER_COUNT) {
    errors.push({ kind: 'chapters-json-count', msg: `chapters.json has ${chapters.length} entries, expected ${EXPECTED_CHAPTER_COUNT}` })
  }

  for (const entry of chapters) {
    const padded = String(entry.chapter).padStart(2, '0')
    const file = path.join(BOOK_DIR, `Chapter-${padded}.md`)
    const src = await fs.readFile(file, 'utf8').catch(() => null)
    if (!src) {
      errors.push({ kind: 'json-orphan', msg: `chapters.json entry ${entry.chapter} ("${entry.title}") has no matching Chapter-${padded}.md` })
      continue
    }
    const firstLine = src.split('\n', 1)[0]
    const m = firstLine.match(/^# Chapter (\d+): (.+)$/)
    if (!m) {
      errors.push({ kind: 'json-heading-bad', msg: `Chapter-${padded}.md first line is not "# Chapter N: Title": ${firstLine.slice(0, 80)}` })
      continue
    }
    if (parseInt(m[1], 10) !== entry.chapter) {
      errors.push({ kind: 'json-number-mismatch', msg: `chapters.json says ${entry.chapter} but Chapter-${padded}.md heading says "Chapter ${m[1]}"` })
    }
    if (normalizeTitle(m[2]) !== normalizeTitle(entry.title)) {
      errors.push({ kind: 'json-title-mismatch', msg: `Ch ${entry.chapter}: chapters.json title "${entry.title}" != heading title "${m[2]}"` })
    }
  }

  return errors
}

async function checkCrossReferences(chapterFiles, validNumbers) {
  const errors = []
  const refRe = /Chapter\s+(\d+)\b/g
  for (const f of chapterFiles) {
    const src = await fs.readFile(path.join(BOOK_DIR, f), 'utf8')
    const lines = src.split('\n')
    let inCodeBlock = false
    for (let i = 0; i < lines.length; i++) {
      if (/^```/.test(lines[i])) { inCodeBlock = !inCodeBlock; continue }
      if (inCodeBlock) continue
      for (const m of lines[i].matchAll(refRe)) {
        const n = parseInt(m[1], 10)
        if (!validNumbers.has(n)) {
          errors.push({ file: f, line: i + 1, ref: m[0], ctx: lines[i].trim().slice(0, 100) })
        }
      }
    }
  }
  return errors
}

// Warning-only prose-style scan (Phase P). Catches the silent-reintroduction
// style risks that have ZERO legitimate use in this book, so the baseline is
// clean (0) and any future warning is a real regression signal: en-dash used
// as a prose connector, hedge openers, and filler transitions. Scoped to
// running prose — skips ::: divs (examples/tables), code fences, markdown
// table rows, numbered exercise/list items, and the Author Verification
// section. Reports as warnings only (never fails the build).
//
// Deliberately NOT mechanically checked here: "Let's" and exclamation marks.
// This is a command-teaching textbook — `Tau kai!` glosses as "Let's eat!" and
// command exercises legitimately read "Run!", so a mechanical flag is pure
// noise. Authorial "Let's"/exclamation in explanatory prose is caught by
// review-agents/01-style-enforcement.md (judgment-based) at close-out. The
// U+2014 em-dash hard fail (checkEmDashes) remains the absolute gate.
//
// The legitimate en-dashes already in book/ (vowel protraction `la––hi`,
// table-cell placeholders `| – |`, ranges `§1–4`, `a–f`) do not have the
// space-en-dash-space shape this flags, so they do not trip it.
const PROSE_PATTERNS = [
  { name: 'en-dash-as-prose', re: /\S\s–\s\S/ },
  { name: 'hedge', re: /\b(It'?s worth noting|It is worth noting|Interestingly,|It'?s important to note|It is important to note|Keep in mind that)\b/i },
  { name: 'filler', re: /\b(Now that we'?ve covered|Now that we have covered|With that in mind|Having established|Moving on to)\b/i },
]

async function checkProseStyle(chapterFiles) {
  const warnings = []
  for (const f of chapterFiles) {
    const src = await fs.readFile(path.join(BOOK_DIR, f), 'utf8')
    const lines = src.split('\n')
    let inDiv = false, inFence = false, inAuthorVerif = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^```/.test(line)) { inFence = !inFence; continue }
      if (inFence) continue
      if (/^:::/.test(line)) { inDiv = !/^:::\s*$/.test(line); continue }
      if (/^#{1,6}\s.*Author Verification/i.test(line)) { inAuthorVerif = true; continue }
      if (inAuthorVerif || inDiv) continue
      if (/^\s*\|/.test(line)) continue            // markdown table row
      if (/^\s*\d+\.\s/.test(line)) continue        // numbered exercise/list item
      for (const p of PROSE_PATTERNS) {
        if (p.re.test(line)) warnings.push({ file: f, line: i + 1, hit: p.name, ctx: line.trim().slice(0, 100) })
      }
    }
  }
  return warnings
}

async function checkAEPattern(chapterFiles) {
  const warnings = []
  const pat = new RegExp(`\\b(${A_E_PRECEDERS.join('|')})\\s+e\\s+[a-z]`, 'g')
  for (const f of chapterFiles) {
    const src = await fs.readFile(path.join(BOOK_DIR, f), 'utf8')
    const lines = src.split('\n')
    let inExamples = false
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^:::\s*\{?\.?examples\}?/.test(line)) { inExamples = true; continue }
      if (/^:::\s*$/.test(line)) { inExamples = false; continue }
      if (!inExamples) continue
      for (const m of line.matchAll(pat)) {
        warnings.push({ file: f, line: i + 1, hit: m[0], ctx: line.trim().slice(0, 100) })
      }
    }
  }
  return warnings
}

// ── App-content em-dash guard (2026-06-15) ────────────────────────────────
// The book em-dash hard-fail (checkEmDashes) only covers book/Chapter-*.md.
// This extends the zero-tolerance rule to what the APP renders, which is where
// em-dashes had silently regressed (quizzes, charts, drill/builder copy). Three
// representations are caught: literal — (U+2014), the — escape, and the
// &mdash; HTML entity. JSON data files are checked raw (pure content). JSX is
// comment-stripped first so JSDoc em-dashes (not rendered) don't trip it.
// Marketing pages (Offer/Landing/Keepers) are excluded pending an owner ruling
// on rewriting outward-facing sales copy. Components are warning-only because
// they legitimately contain a dash-detection regex (/[–—]/ in BookExercises).
const APP_DATA_FILES = ['quizzes.json', 'sentence-patterns.json', 'chapters.json', 'grammar-graph.json', 'book-exercises.json']
const APP_MARKETING_EXCLUDE = new Set(['Offer.jsx', 'Landing.jsx', 'Keepers.jsx'])

function stripJsComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
}

function emDashHits(text) {
  const hits = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.includes(EM_DASH) || l.includes('&mdash;') || l.includes('\\u2014')) {
      hits.push({ line: i + 1, ctx: l.trim().slice(0, 90) })
    }
  }
  return hits
}

async function listJsxFiles(dir) {
  const out = []
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.name.endsWith('.jsx')) out.push(p)
    }
  }
  await walk(dir)
  return out.sort()
}

async function checkAppEmDashes() {
  const hard = [], warn = []
  for (const f of APP_DATA_FILES) {
    const t = await fs.readFile(path.join(APP_ROOT, 'src/data', f), 'utf8').catch(() => null)
    if (t) for (const h of emDashHits(t)) hard.push({ file: `src/data/${f}`, ...h })
  }
  for (const dir of ['src/drills', 'src/pages']) {
    for (const p of await listJsxFiles(path.join(APP_ROOT, dir))) {
      if (APP_MARKETING_EXCLUDE.has(path.basename(p))) continue
      const t = stripJsComments(await fs.readFile(p, 'utf8'))
      for (const h of emDashHits(t)) hard.push({ file: path.relative(APP_ROOT, p), ...h })
    }
  }
  for (const p of await listJsxFiles(path.join(APP_ROOT, 'src/components'))) {
    const t = stripJsComments(await fs.readFile(p, 'utf8'))
    for (const h of emDashHits(t)) warn.push({ file: path.relative(APP_ROOT, p), ...h })
  }
  return { hard, warn }
}

async function main() {
  const chapterFiles = await readChapterFiles()
  const chapters = await readJSON(CHAPTERS_JSON)
  const validNumbers = new Set(chapters.map(c => c.chapter))

  let exitCode = 0

  console.log('\n── Em-dash check (hard) ──')
  const dashHits = await checkEmDashes(chapterFiles)
  if (dashHits.length === 0) {
    console.log(`  ✓ no em-dashes (U+2014) in book/ (${chapterFiles.length} files scanned)`)
  } else {
    exitCode = 1
    for (const h of dashHits) {
      console.log(`  ✗ ${h.file}:${h.line}  ${h.ctx}`)
    }
    console.log(`  ${dashHits.length} em-dash(es) found — replace with comma, colon, semicolon, parens, or split sentence`)
  }

  console.log('\n── Chapter contiguity (hard) ──')
  const cgErrors = await checkContiguity(chapterFiles, chapters)
  if (cgErrors.length === 0) {
    console.log(`  ✓ ${EXPECTED_CHAPTER_COUNT} chapters contiguous; chapters.json titles match file headings`)
  } else {
    exitCode = 1
    for (const e of cgErrors) console.log(`  ✗ [${e.kind}] ${e.msg}`)
  }

  console.log('\n── Cross-reference resolution (hard) ──')
  const refErrors = await checkCrossReferences(chapterFiles, validNumbers)
  if (refErrors.length === 0) {
    console.log(`  ✓ every "Chapter N" reference resolves to an existing chapter`)
  } else {
    exitCode = 1
    for (const e of refErrors) console.log(`  ✗ ${e.file}:${e.line}  ${e.ref} (no such chapter)  → ${e.ctx}`)
  }

  console.log('\n── Prose style (warning) ──')
  const proseWarn = await checkProseStyle(chapterFiles)
  if (proseWarn.length === 0) {
    console.log('  ✓ no en-dash-as-prose / hedge / filler patterns')
  } else {
    console.log(`  ${proseWarn.length} prose-style pattern(s) worth a human glance (false positives expected):`)
    for (const w of proseWarn) console.log(`  ⚠ ${w.file}:${w.line}  [${w.hit}]  → ${w.ctx}`)
  }

  console.log("\n── Focus-marker 'a e (warning) ──")
  const aeWarn = await checkAEPattern(chapterFiles)
  if (aeWarn.length === 0) {
    console.log(`  ✓ no suspicious bare-e patterns in example blocks`)
  } else {
    console.log(`  ${aeWarn.length} pattern(s) worth a human glance (false positives expected for clefts/semi-definite drills):`)
    for (const w of aeWarn) console.log(`  ⚠ ${w.file}:${w.line}  "${w.hit}"  → ${w.ctx}`)
  }

  console.log('\n── App-content em-dash check (hard) ──')
  const { hard: appDash, warn: appDashWarn } = await checkAppEmDashes()
  if (appDash.length === 0) {
    console.log('  ✓ no em-dashes (U+2014 / &mdash;) in app content (data files, drills, non-marketing pages)')
  } else {
    exitCode = 1
    for (const h of appDash) console.log(`  ✗ ${h.file}:${h.line}  ${h.ctx}`)
    console.log(`  ${appDash.length} app-content em-dash(es) — replace per house style (comma/colon/semicolon/parens/split; en-dash for placeholders)`)
  }
  if (appDashWarn.length) {
    console.log(`  ⚠ ${appDashWarn.length} em-dash(es) in components (warning — incl. the BookExercises /[–—]/ detection regex, which is logic, not prose):`)
    for (const w of appDashWarn) console.log(`  ⚠ ${w.file}:${w.line}  ${w.ctx}`)
  }

  const citationViolations = await runCitationCheck()
  if (citationViolations > 0) exitCode = 1

  console.log('')
  process.exit(exitCode)
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
