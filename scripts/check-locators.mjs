#!/usr/bin/env node
/**
 * check-locators.mjs — Phase P2 Check 1: paragraph/lesson/section locator resolver.
 *
 * check-citations.mjs validates that a cited Churchward CHAPTER or Shumway
 * LESSON FILE exists, but stops there ("subsection format not validated"). The
 * §3 verification table shows the single largest error bucket is finer than
 * that: a paragraph number that is actually a FILE LINE NUMBER (Ch.10 "par.207",
 * Ch.16 "par.56", Ch.30 "par.61", Ch.35 "line 168"), a wrong section label
 * (Ch.4 "Stress as Affected by Enclitics" for a paragraph that lives in "Double
 * Vowels"), or a Word-Studies number off by one (Two cited as Three).
 *
 * This resolver opens the real source files and verifies, for every locator:
 *   - Churchward `Ch.N` resolves to source-materials/Churchward/NN.md
 *   - any cited `par.M` / `pars.M-N` / `§M` resolves to a real `**M.**` paragraph
 *   - any cited `- Section Title` resolves (normalized) to a real `### heading`
 *   - Shumway `L###` resolves to a real `## LESSON N`
 *   - `Word Studies <One..Five>` resolves to a real `## Word Studies <name>`
 *
 * Scope: every `locator` in audits/source-fidelity/provenance-data.json whose
 * `work` is Churchward or Shumway (the report's own locators are the dirtiest —
 * §3 proves it), AND the same locator strings inside the §3 verdict rows.
 * Inline book citations are covered by check-citations.mjs at chapter granularity.
 *
 * Run: node lea-faka-tonga-app/scripts/check-locators.mjs
 * Exit: nonzero error count (paragraph/lesson/chapter not found). Section-title
 * mismatches are WARNINGS (titles get legitimately paraphrased/truncated).
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const CHURCHWARD_DIR = path.join(REPO_ROOT, 'source-materials', 'Churchward')
const SHUMWAY_DIR = path.join(REPO_ROOT, 'source-materials', 'Shumway')
const DATA = path.join(REPO_ROOT, 'audits', 'source-fidelity', 'provenance-data.json')

const norm = (s) => (s || '')
  .replace(/\*+/g, '')
  .replace(/[ʻ‘’`]/g, "'")
  .replace(/\s+/g, ' ')
  .replace(/[.,;:]+$/, '')
  .trim()
  .toLowerCase()

async function readOrNull(p) { return fs.readFile(p, 'utf8').catch(() => null) }

// ── Source indexes ────────────────────────────────────────────────────────

async function buildChurchwardIndex() {
  const idx = new Map() // chapter(int) -> { paras:Set<int>, headings:Set<string>, headingList:[] }
  const entries = await fs.readdir(CHURCHWARD_DIR).catch(() => [])
  for (const f of entries) {
    const m = f.match(/^(\d{2})\.md$/)
    if (!m) continue
    const ch = parseInt(m[1], 10)
    const src = await readOrNull(path.join(CHURCHWARD_DIR, f))
    if (src == null) continue
    const paras = new Set()
    const headings = new Set()
    const headingList = []
    for (const line of src.split('\n')) {
      const pm = line.match(/^\*\*(\d+)[a-z]?\.\*\*/) // **N.** or **Na.**
      if (pm) paras.add(parseInt(pm[1], 10))
      const hm = line.match(/^###\s+(.*?)\s*$/)
      if (hm) { const h = norm(hm[1]); headings.add(h); headingList.push(h) }
    }
    idx.set(ch, { paras, headings, headingList })
  }
  return idx
}

async function buildShumwayIndex() {
  const lessons = new Set()
  const wordStudies = new Set()
  const entries = await fs.readdir(SHUMWAY_DIR).catch(() => [])
  for (const f of entries) {
    const src = await readOrNull(path.join(SHUMWAY_DIR, f))
    if (src == null) continue
    for (const m of src.matchAll(/^#{1,6}\s*LESSON\s+(\d+)/gim)) lessons.add(parseInt(m[1], 10))
    for (const m of src.matchAll(/^#{1,6}\s*Word Studies\s+([A-Za-z]+)/gim)) wordStudies.add(m[1].toLowerCase())
  }
  return { lessons, wordStudies }
}

// ── Locator parsing ───────────────────────────────────────────────────────

// Pull all integers a locator presents AS PARAGRAPHS: `par.6`, `pars.1-2`,
// `pars 12-14`, `§12-17`, `§13(iii)`. Ranges expand to endpoints (we check both
// ends exist — an interior gap inside a real range is not a fidelity concern).
function parseParagraphs(loc) {
  const nums = new Set()
  const add = (a, b) => { nums.add(+a); if (b != null) nums.add(+b) }
  for (const m of loc.matchAll(/\bpars?\.?\s*(\d+)(?:\s*[-–]\s*(\d+))?/gi)) add(m[1], m[2])
  for (const m of loc.matchAll(/§\s*(\d+)(?:\s*[-–]\s*(\d+))?/g)) add(m[1], m[2])
  return [...nums]
}

// A locator can reference several chapters, each with its own paragraphs
// ("Ch.7 §12-15; Ch.27 §33-35; Ch.29 §29"). Split into per-chapter segments so
// §33-35 is checked against Ch.27, not mis-attributed to the first chapter.
function chapterSegments(loc) {
  const re = /Ch\.?\s*(\d+)/gi
  const marks = []
  let m
  while ((m = re.exec(loc))) marks.push({ ch: parseInt(m[1], 10), start: m.index })
  return marks.map((mk, i) => ({
    ch: mk.ch,
    text: loc.slice(mk.start, i + 1 < marks.length ? marks[i + 1].start : loc.length),
  }))
}

// Section title = text after the chapter token and a dash, up to the first
// paragraph/section marker or a "+". e.g. "Ch.19 - Preposed Forms and Postposed
// Forms (pars.1-2) + ..." -> "Preposed Forms and Postposed Forms".
function parseSection(seg) {
  const m = seg.match(/Ch\.?\s*\d+\s*[-–:]\s*(.+)$/i)
  if (!m) return null
  let sec = m[1].split(/\(|§|\+|\bpars?\.?\s*\d/i)[0]
  sec = sec.replace(/["'“”]/g, '').trim()
  return sec.length >= 3 ? sec : null
}

// Tolerant section match: exact, substring either way, or ≥60% word overlap —
// so legitimate paraphrase/truncation passes but a genuinely wrong section
// (Ch.4 "Stress as Affected by Enclitics" for content in "Double Vowels") fails.
function sectionMatches(cited, entry) {
  const n = norm(cited)
  if (entry.headings.has(n)) return true
  if (entry.headingList.some((h) => h.includes(n) || n.includes(h))) return true
  const words = n.split(' ').filter((w) => w.length > 2)
  if (!words.length) return true
  return entry.headingList.some((h) => {
    const hw = new Set(h.split(' '))
    return words.filter((w) => hw.has(w)).length / words.length >= 0.6
  })
}

function checkChurchwardLocator(loc, idx, push, where) {
  for (const seg of chapterSegments(loc)) {
    const entry = idx.get(seg.ch)
    if (!entry) {
      push({ sev: 'error', where, loc, why: `Churchward Ch.${seg.ch} has no file ${String(seg.ch).padStart(2, '0')}.md` })
      continue
    }
    for (const p of parseParagraphs(seg.text)) {
      if (!entry.paras.has(p)) {
        const maxp = Math.max(0, ...entry.paras)
        push({ sev: 'error', where, loc, why: `par.${p} not a real paragraph in Churchward Ch.${seg.ch} (has **1.**..**${maxp}.**) — likely a file-line number` })
      }
    }
    const sec = parseSection(seg.text)
    if (sec && !sectionMatches(sec, entry)) {
      push({ sev: 'warn', where, loc, why: `section "${sec}" not found as a ### heading in Churchward Ch.${seg.ch}` })
    }
  }
}

function checkShumwayLocator(loc, sw, push, where) {
  let touched = false
  for (const m of loc.matchAll(/\bL\.?\s*(\d{1,3})\b/g)) {
    touched = true
    const n = parseInt(m[1], 10)
    if (!sw.lessons.has(n)) push({ sev: 'error', where, loc, why: `Shumway L${n} is not a real "## LESSON ${n}"` })
  }
  const wm = loc.match(/Word Studies\s+([A-Za-z]+)/i)
  if (wm) {
    touched = true
    if (!sw.wordStudies.has(wm[1].toLowerCase())) {
      push({ sev: 'error', where, loc, why: `"Word Studies ${wm[1]}" is not a real bonus-content heading (have: ${[...sw.wordStudies].join(', ')})` })
    }
  }
  return touched
}

async function main() {
  const [cwIdx, swIdx, data] = await Promise.all([
    buildChurchwardIndex(),
    buildShumwayIndex(),
    fs.readFile(DATA, 'utf8').then(JSON.parse),
  ])

  const violations = []
  const push = (v) => violations.push(v)

  for (const x of data) {
    const ch = x.map.chapter
    for (const t of x.map.topics) {
      for (const s of (t.sources || [])) {
        const where = `Ch${ch} topic "${t.topic.slice(0, 40)}"`
        if (s.work === 'Churchward') checkChurchwardLocator(s.locator || '', cwIdx, push, where)
        else if (s.work === 'Shumway') checkShumwayLocator(s.locator || '', swIdx, push, where)
      }
    }
    for (const vd of (x.verify?.verdicts || [])) {
      const loc = vd.locator || ''
      const where = `Ch${ch} §3 ${vd.status}`
      const isEald = /EALD|Word-?List/i.test(loc) // EALD word-list line refs (L586) are not Shumway lessons
      if (/Ch\.?\s*\d/i.test(loc)) checkChurchwardLocator(loc, cwIdx, push, where)
      if (!isEald && /Shumway|Word Studies/i.test(loc)) checkShumwayLocator(loc, swIdx, push, where)
    }
  }

  // Dedup: a locator flagged on both its topic-source and its §3 verdict row is
  // one issue. Collapse by (loc, why); keep the first `where` seen.
  const seen = new Set()
  const deduped = violations.filter((v) => {
    const k = `${v.loc}||${v.why}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const errs = deduped.filter((v) => v.sev === 'error')
  const warns = deduped.filter((v) => v.sev === 'warn')

  console.log('\n── Locator resolution (Check 1) ──')
  if (errs.length === 0) console.log(`  ✓ no unresolved paragraph/lesson locators across provenance-data.json`)
  for (const v of errs) console.log(`  ✗ [${v.where}] ${v.loc}\n        → ${v.why}`)
  if (warns.length) {
    console.log(`\n  ${warns.length} section-title mismatch warning(s) (titles get paraphrased; human glance):`)
    for (const v of warns) console.log(`  ⚠ [${v.where}] ${v.loc}\n        → ${v.why}`)
  }
  console.log(`\n  ${errs.length} error(s), ${warns.length} warning(s).`)
  process.exit(errs.length === 0 ? 0 : 1)
}

main().catch((err) => { console.error(err); process.exit(2) })
