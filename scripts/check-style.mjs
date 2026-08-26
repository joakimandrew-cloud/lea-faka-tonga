#!/usr/bin/env node
/**
 * check-style.mjs — author-time style/structural sanity check for book/.
 *
 * Run: `node scripts/check-style.mjs` (from lea-faka-tonga-app/)
 *      or `npm run check:style`
 *
 * Four checks:
 *
 *   1. EM-DASH (hard fail). Scans all reader-facing book/ markdown for U+2014 —
 *      the 52 chapters plus the front/back matter (Introduction, pronunciation,
 *      charts, glossary). Em-dashes are banned from book/ per the zero-tolerance
 *      policy. Replace with comma, colon, semicolon, parens, or sentence split.
 *
 *   1b. APP-CONTENT EM-DASH (hard fail). Extends the same ban to what the app
 *      renders. Walks every .js/.jsx/.json under src/data, src/seo, src/drills,
 *      src/pages and src/components. Catches —, the — escape, and &mdash;.
 *      JSX is comment-stripped so JSDoc em-dashes don't trip it; components are
 *      warning-only (they carry a legit /[–—]/ dash-detection regex).
 *      (2026-06-15; scope widened from a five-filename allowlist 2026-08-26)
 *
 *   1c. APP-COPY A4 BELITTLING (hard fail). "small/little/tiny word(s)" on the
 *      same surfaces, per reviews/Book-Complaint-Types-Review-2026-07.md. The
 *      pattern and its citation exemption match scripts/check-video-copy.mjs,
 *      which already guarded the video surfaces. (2026-08-26)
 *
 *   2. CHAPTER CONTIGUITY (hard fail). Verifies Chapter-01..NN.md exist
 *      with no gaps or extras, and that src/data/chapters.json has the
 *      same count and titles match the `# Lesson N: Title` headings in
 *      each markdown file.
 *
 *   3. CROSS-REFERENCE RESOLUTION (hard fail). Scans book/ for
 *      `Lesson NN` references; verifies each cited number resolves to
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
 *   6. TRANSLATE-PACK ANTI-DRIFT (hard fail). Delegated to
 *      build-translate-pack.mjs --verify — confirms the committed
 *      src/data/translate-pack.json + translate-allowset.json still match the
 *      sources they were compiled from. A changed RULE source (method spec,
 *      frame index, possessive/negation sheets, DECISIONS, accent canon,
 *      grammar-spec, Ch 8) fails the build until the pack is rebuilt; an
 *      additive change (a new Translation-Log entry) prints as non-blocking.
 *      (2026-07-27)
 *
 * Exits 0 on clean run (warnings OK), 1 on any hard-check failure.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { runCitationCheck } from './check-citations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const BOOK_DIR = path.join(REPO_ROOT, 'book')
const CHAPTERS_JSON = path.join(APP_ROOT, 'src/data/chapters.json')
const EXPECTED_CHAPTER_COUNT = 52

const EM_DASH = '—'

const A_E_PRECEDERS = ['kai', 'inu', 'lau', 'tā', 'tanu', 'tatala', 'fai', 'ako', 'nofo', 'lele', 'foki']

async function readChapterFiles() {
  const files = await fs.readdir(BOOK_DIR)
  return files.filter(f => /^Chapter-\d{2}\.md$/.test(f)).sort()
}

// Every reader-facing markdown file in book/: the 52 chapters plus the
// front/back matter (Introduction, pronunciation guide, charts, glossary).
// The em-dash hard-fail scans this wider set so the appendices — which are
// not Chapter-NN.md and were previously unguarded — can't regress. (2026-07-03)
async function readBookProseFiles() {
  const files = await fs.readdir(BOOK_DIR)
  return files.filter(f => /^(Chapter-\d{2}|Introduction|appendix-.+)\.md$/.test(f)).sort()
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
    const m = firstLine.match(/^# (?:Chapter|Lesson) (\d+): (.+)$/)
    if (!m) {
      errors.push({ kind: 'json-heading-bad', msg: `Chapter-${padded}.md first line is not "# Lesson N: Title": ${firstLine.slice(0, 80)}` })
      continue
    }
    if (parseInt(m[1], 10) !== entry.chapter) {
      errors.push({ kind: 'json-number-mismatch', msg: `chapters.json says ${entry.chapter} but Chapter-${padded}.md heading says "Lesson ${m[1]}"` })
    }
    if (normalizeTitle(m[2]) !== normalizeTitle(entry.title)) {
      errors.push({ kind: 'json-title-mismatch', msg: `Ch ${entry.chapter}: chapters.json title "${entry.title}" != heading title "${m[2]}"` })
    }
  }

  return errors
}

async function checkCrossReferences(chapterFiles, validNumbers) {
  const errors = []
  const refRe = /(?:Chapter|Lesson)\s+(\d+)\b/g
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
// Marketing pages (Offer/Landing/Keepers) are linted too as of the de-AI-tells
// pass (2026-06-16): their sales copy was de-em-dashed, so the prior exclusion is
// gone and they hard-fail like every other page. Components are warning-only because
// they legitimately contain a dash-detection regex (/[–—]/ in BookExercises).
// Surfaces walked: every .js, .jsx and .json the app renders copy from. This
// replaced a hardcoded five-filename allowlist on 2026-08-26, which was the
// reason 34 em-dashes sat unseen in src/data/drills-catalog.js (its blurbs
// render live on the drills menu) while the check printed a green tick.
const APP_COPY_DIRS = ['src/data', 'src/seo', 'src/drills', 'src/pages', 'src/components']
const APP_COPY_EXTS = ['.js', '.jsx', '.json']

// Warning-only for the em-dash rule (NOT for A4): components legitimately carry
// a dash-detection regex, /[–—]/ in BookExercises, which is logic, not prose.
const EM_DASH_WARN_DIRS = ['src/components/']

// Out of scope: dev tests, and the two compiled engine artifacts. The translate
// pack and allowset are harvested verbatim from the method spec and grammar
// sources, so their dashes belong to those sources; drift in them is caught by
// the translate-pack anti-drift check below, not by a copy rule.
const APP_COPY_EXCLUDE = [
  /\.test\.[jt]sx?$/,
  /^src\/data\/translate-(pack|allowset)\.json$/,
]

// A JSON key beginning with an underscore is the file's own dev metadata
// (`_note`, `_comment`): never rendered, so it is engine metadata, not copy.
const JSON_META_LINE = /^\s*"_[A-Za-z0-9]*"\s*:/

// A4 belittling, from reviews/Book-Complaint-Types-Review-2026-07.md. Same
// pattern and same citation exemption as scripts/check-video-copy.mjs, which
// guards the video surfaces; this brings the app surfaces under the rule too.
const BELITTLE = /\b(small|little|tiny)\s+words?\b/i
// A line that merely CITES the rule (an attestation header, the checklist name)
// is not a use of it.
const CITES_RULE = /Book-Complaint-Types-Review|writing rules applied|no "small word"/i

// Blank out comments while preserving line and column positions, so a reported
// file:line still points at the real line. (Blanking used to delete the newlines
// inside block comments, which shifted every line number after one.)
function stripJsComments(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))
}

const EM_DASH_RE = /—|&mdash;|\\u2014/g

function emDashHits(text, { skipJsonMeta = false } = {}) {
  const hits = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (skipJsonMeta && JSON_META_LINE.test(l)) continue
    const n = (l.match(EM_DASH_RE) || []).length
    if (n > 0) hits.push({ line: i + 1, count: n, ctx: l.trim().slice(0, 90) })
  }
  return hits
}

function belittleHits(text, { skipJsonMeta = false } = {}) {
  const hits = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (skipJsonMeta && JSON_META_LINE.test(l)) continue
    if (CITES_RULE.test(l)) continue
    const m = l.match(BELITTLE)
    if (m) hits.push({ line: i + 1, hit: m[0], ctx: l.trim().slice(0, 90) })
  }
  return hits
}

// Every copy file under a surface directory, as APP_ROOT-relative posix paths.
async function listCopyFiles(dir) {
  const out = []
  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) { await walk(p); continue }
      if (!APP_COPY_EXTS.includes(path.extname(e.name))) continue
      const rel = path.relative(APP_ROOT, p).split(path.sep).join('/')
      if (APP_COPY_EXCLUDE.some(re => re.test(rel))) continue
      out.push(rel)
    }
  }
  await walk(dir)
  return out.sort()
}

async function checkAppCopy() {
  const dash = { hard: [], warn: [] }
  const a4 = []
  let scanned = 0
  // index.html is the shell served on every route, so its comments reach the
  // wire even though nothing renders them. Three em dashes lived there through
  // the 2026-08-26 sweep precisely because the walk below only covers src/.
  const extra = ['index.html']
  for (const dir of [...APP_COPY_DIRS, null]) {
    const rels = dir === null ? extra : await listCopyFiles(path.join(APP_ROOT, dir))
    for (const rel of rels) {
      const raw = await fs.readFile(path.join(APP_ROOT, rel), 'utf8')
      scanned++
      const isJson = rel.endsWith('.json')
      // JSX is comment-stripped: its JSDoc is never rendered, and stripping it
      // is what keeps ~200 doc-comment dashes out of the report. .js and .json
      // are read whole, so a data file's header prose is held to the same rule.
      const dashText = rel.endsWith('.jsx') ? stripJsComments(raw) : raw
      const bucket = EM_DASH_WARN_DIRS.some(d => rel.startsWith(d)) ? dash.warn : dash.hard
      for (const h of emDashHits(dashText, { skipJsonMeta: isJson })) bucket.push({ file: rel, ...h })
      // A4 is checked on the raw text: a belittling gloss in a code comment is
      // still the wrong way to describe the thing, and CITES_RULE covers the
      // one legitimate case, a comment quoting the rule itself.
      for (const h of belittleHits(raw, { skipJsonMeta: isJson })) a4.push({ file: rel, ...h })
    }
  }
  return { dash, a4, scanned }
}

// ── Translate-pack anti-drift (2026-07-27) ────────────────────────────────
// src/data/translate-pack.json + translate-allowset.json are compiled from the
// method spec, frame index, possessive/negation sheets, DECISIONS, the accent
// canon and Translation-Log (reviews/translate-pipeline-analysis.md Q5). They
// are committed artifacts — the Pages workflow never runs extraction — so a
// source edit would otherwise leave the fast translation path quoting rules the
// vault no longer holds.
//
// The check re-runs the builder in --verify mode rather than reimplementing the
// harvest: one harvest implementation, never two (the harvestFrameTags pattern).
// It exits 1 when a RULE source's harvested slice changed; an additive change
// (a new Translation-Log entry, a vocabulary refresh) prints as non-blocking.
async function checkTranslatePack() {
  const script = path.join(APP_ROOT, 'scripts', 'build-translate-pack.mjs')
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [script, '--verify'], { cwd: APP_ROOT })
    let out = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('close', (code) => resolve({ code: code ?? 1, out: out.trimEnd() }))
    child.on('error', (err) => resolve({ code: 1, out: `  ✗ could not run build-translate-pack.mjs --verify: ${err.message}` }))
  })
}

async function main() {
  const chapterFiles = await readChapterFiles()
  const chapters = await readJSON(CHAPTERS_JSON)
  const validNumbers = new Set(chapters.map(c => c.chapter))

  let exitCode = 0

  console.log('\n── Em-dash check (hard) ──')
  const proseFiles = await readBookProseFiles()
  const dashHits = await checkEmDashes(proseFiles)
  if (dashHits.length === 0) {
    console.log(`  ✓ no em-dashes (U+2014) in book/ (${proseFiles.length} files scanned)`)
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

  const { dash: appDashResult, a4: appA4, scanned: appScanned } = await checkAppCopy()
  const appDash = appDashResult.hard, appDashWarn = appDashResult.warn
  const dashTotal = appDash.reduce((n, h) => n + h.count, 0)
  const dashWarnTotal = appDashWarn.reduce((n, h) => n + h.count, 0)

  console.log(`\n── App-content em-dash check (hard) ── ${appScanned} copy file(s) scanned: ${APP_COPY_DIRS.join(', ')} (.js/.jsx/.json) plus index.html`)
  if (appDash.length === 0) {
    console.log('  ✓ no em-dashes (U+2014 / &mdash;) in app copy')
  } else {
    exitCode = 1
    for (const h of appDash) console.log(`  ✗ ${h.file}:${h.line}  (${h.count})  ${h.ctx}`)
    const byFile = new Map()
    for (const h of appDash) byFile.set(h.file, (byFile.get(h.file) || 0) + h.count)
    const top = [...byFile].sort((a, b) => b[1] - a[1]).map(([f, n]) => `${f} (${n})`).join(', ')
    console.log(`  FAIL [em-dash] ${dashTotal} em-dash(es) across ${appDash.length} line(s) in ${byFile.size} file(s): ${top}`)
    console.log(`  Fix: comma, colon, semicolon, parens, or split the sentence; en-dash stays for placeholders.`)
  }
  if (appDashWarn.length) {
    console.log(`  ⚠ ${dashWarnTotal} em-dash(es) in components (warning only, incl. the BookExercises /[–—]/ detection regex, which is logic, not prose):`)
    for (const w of appDashWarn) console.log(`  ⚠ ${w.file}:${w.line}  ${w.ctx}`)
  }

  console.log('\n── App-copy A4 belittling check (hard) ──')
  if (appA4.length === 0) {
    console.log('  ✓ no "small/little/tiny word(s)" in app copy')
  } else {
    exitCode = 1
    for (const h of appA4) console.log(`  ✗ ${h.file}:${h.line}  "${h.hit}"  ${h.ctx}`)
    const files = [...new Set(appA4.map(h => h.file))]
    console.log(`  FAIL [A4 belittling] ${appA4.length} hit(s) in ${files.length} file(s): ${files.join(', ')}`)
    console.log(`  Rule: reviews/Book-Complaint-Types-Review-2026-07.md A4. Name the thing (a tense marker, an article, a particle) instead of calling it small.`)
  }

  console.log('\n── Translate-pack anti-drift (hard) ──')
  const packCheck = await checkTranslatePack()
  console.log(packCheck.out)
  if (packCheck.code !== 0) exitCode = 1

  const citationViolations = await runCitationCheck()
  if (citationViolations > 0) exitCode = 1

  console.log('')
  process.exit(exitCode)
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
