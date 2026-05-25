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
 *   2. CHAPTER CONTIGUITY (hard fail). Verifies Chapter-01..NN.md exist
 *      with no gaps or extras, and that src/data/chapters.json has the
 *      same count and titles match the `# Chapter N: Title` headings in
 *      each markdown file.
 *
 *   3. CROSS-REFERENCE RESOLUTION (hard fail). Scans book/ for
 *      `Chapter NN` references; verifies each cited number resolves to
 *      an existing chapter. Catches dangling refs after a renumber.
 *
 *   4. FOCUS-MARKER 'a e (warning only). Scans :::examples blocks for
 *      `<verb> e <lowercase>` patterns where `'a` may have been dropped.
 *      Reports as warnings; false positives are expected (cleft sentences
 *      and semi-definite drills legitimately drop `'a`).
 *
 * Exits 0 on clean run (warnings OK), 1 on any hard-check failure.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

  console.log("\n── Focus-marker 'a e (warning) ──")
  const aeWarn = await checkAEPattern(chapterFiles)
  if (aeWarn.length === 0) {
    console.log(`  ✓ no suspicious bare-e patterns in example blocks`)
  } else {
    console.log(`  ${aeWarn.length} pattern(s) worth a human glance (false positives expected for clefts/semi-definite drills):`)
    for (const w of aeWarn) console.log(`  ⚠ ${w.file}:${w.line}  "${w.hit}"  → ${w.ctx}`)
  }

  console.log('')
  process.exit(exitCode)
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
