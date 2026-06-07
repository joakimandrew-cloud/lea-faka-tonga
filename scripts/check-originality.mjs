#!/usr/bin/env node
/**
 * check-originality.mjs — Phase P (Source-Fidelity Audit) Stage 0 tool.
 *
 * Run: `node scripts/check-originality.mjs` (from lea-faka-tonga-app/)
 *      or `npm run check:originality`
 *      `node scripts/check-originality.mjs 50` to scope to one chapter.
 *
 * Measures closeness-to-source of the book's example sentences — the detection
 * input to the citation-balance decision procedure (lifted-uncited vs earned-
 * quote vs original). It does NOT make the earned-quote judgment; it surfaces
 * candidates for the auditor/human to judge.
 *
 * Two signals, both read-only:
 *
 *   1. CORPUS EXACT-MATCH. source-materials/Parallel-Corpus.md is an aligned
 *      book↔source index (321 `**TO:** *Tongan*` / `**Source:**` entries). A
 *      book example whose normalized form exactly matches a corpus entry tagged
 *      Source = Churchward/Shumway is source-traceable (likely lifted). Matches
 *      tagged LFT are the book's own sentences (the corpus mined them FROM the
 *      book) and are not flagged.
 *
 *   2. RAW-CHURCHWARD SUBSTRING. For each chapter, the routed Churchward
 *      chapters (from audits/Source-Fidelity-Map.json) are read and normalized;
 *      any book example of >=4 words that appears verbatim (normalized) inside
 *      a routed Churchward chapter is flagged. This catches lifting the corpus
 *      misses (the corpus excludes ceremonial/royal material, e.g. the Ch 50
 *      vowel-protraction shouts, which live in Churchward Ch. 32/35).
 *
 * Per chapter it reports the flagged spans + a verbatim_ratio (corpus-traceable
 * examples / total examples) against the ~20% originality ceiling. Normalization
 * strips combining diacritics (macrons/acutes), italics, okina variants, dashes,
 * and punctuation so accent drift doesn't hide a match.
 *
 * Warning-only / report-only: prints findings and exits 0 (it is a research
 * aid, not a gate). Reads book/, Parallel-Corpus.md, Churchward/, and the map.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const BOOK_DIR = path.join(REPO_ROOT, 'book')
const CHURCHWARD_DIR = path.join(REPO_ROOT, 'source-materials', 'Churchward')
const PARALLEL_CORPUS = path.join(REPO_ROOT, 'source-materials', 'Parallel-Corpus.md')
const SOURCE_MAP = path.join(REPO_ROOT, 'audits', 'Source-Fidelity-Map.json')

const VERBATIM_CEILING = 0.20
const MIN_RAW_MATCH_WORDS = 4

// Normalize Tongan for robust matching: drop diacritics, italics, punctuation.
function norm(s) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\*+/g, '')
    .replace(/[ʻ‘’`´]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/[.,!?;:"“”()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function wordCount(s) { return s ? s.split(' ').filter(Boolean).length : 0 }

// ── parse Parallel-Corpus: normalized Tongan -> source category ────────────
async function parseCorpus() {
  const src = await fs.readFile(PARALLEL_CORPUS, 'utf8')
  const lines = src.split('\n')
  const map = new Map() // normTongan -> Set(category)
  let pendingTongan = null
  for (const line of lines) {
    const to = line.match(/^\*\*TO:\*\*\s*(.+)$/)
    if (to) { pendingTongan = norm(to[1]); continue }
    const so = line.match(/^\*\*Source:\*\*\s*(.+)$/)
    if (so && pendingTongan) {
      let cat = 'other'
      if (/Churchward/.test(so[1])) cat = 'Churchward'
      else if (/Shumway/.test(so[1])) cat = 'Shumway'
      else if (/LFT/.test(so[1])) cat = 'LFT'
      if (!map.has(pendingTongan)) map.set(pendingTongan, new Set())
      map.get(pendingTongan).add(cat)
      pendingTongan = null
    }
  }
  return map
}

// ── extract a chapter's example sentences from :::examples blocks ──────────
async function chapterExamples(n) {
  const padded = String(n).padStart(2, '0')
  const src = await fs.readFile(path.join(BOOK_DIR, `Chapter-${padded}.md`), 'utf8').catch(() => null)
  if (src == null) return []
  const lines = src.split('\n')
  const out = []
  let inEx = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^:::\s*\{?\.?examples\}?/.test(line)) { inEx = true; continue }
    if (/^:::\s*$/.test(line)) { inEx = false; continue }
    if (!inEx) continue
    const m = line.match(/^\s*\*([^*]+)\*/) // leading italic span = the Tongan
    if (m) out.push({ line: i + 1, tongan: m[1], n: norm(m[1]) })
  }
  return out
}

// ── normalized text of routed Churchward chapters, cached ──────────────────
const churchwardCache = new Map()
async function churchwardNormText(chap) {
  if (churchwardCache.has(chap)) return churchwardCache.get(chap)
  const padded = String(chap).padStart(2, '0')
  const src = await fs.readFile(path.join(CHURCHWARD_DIR, `${padded}.md`), 'utf8').catch(() => '')
  const t = norm(src)
  churchwardCache.set(chap, t)
  return t
}

async function main() {
  const onlyCh = process.argv[2] ? parseInt(process.argv[2], 10) : null
  const corpus = await parseCorpus()
  const map = JSON.parse(await fs.readFile(SOURCE_MAP, 'utf8').catch(() => 'null'))
  if (!map) { console.error('Source-Fidelity-Map.json not found — run build:source-map first.'); process.exit(1) }
  const routing = new Map(map.chapters.map(c => [c.chapter, c.churchward_chapters]))

  console.log('\n── Originality / closeness-to-source (report only) ──')
  console.log(`  corpus: ${corpus.size} normalized Tongan entries | verbatim ceiling: ${Math.round(VERBATIM_CEILING * 100)}%\n`)

  let grandFlagged = 0
  const overCeiling = []
  for (const c of map.chapters) {
    if (onlyCh && c.chapter !== onlyCh) continue
    const examples = await chapterExamples(c.chapter)
    if (examples.length === 0) continue

    const cwChapters = routing.get(c.chapter) || []
    const cwTexts = await Promise.all(cwChapters.map(churchwardNormText))

    const flags = []
    let traceable = 0
    for (const ex of examples) {
      const cats = corpus.get(ex.n)
      const corpusHit = cats && (cats.has('Churchward') || cats.has('Shumway'))
      let rawHit = null
      if (wordCount(ex.n) >= MIN_RAW_MATCH_WORDS) {
        for (let k = 0; k < cwChapters.length; k++) {
          if (cwTexts[k].includes(ex.n)) { rawHit = cwChapters[k]; break }
        }
      }
      if (corpusHit || rawHit) {
        traceable++
        const via = [corpusHit ? `corpus(${[...cats].filter(x => x !== 'LFT').join('/')})` : null, rawHit ? `Churchward Ch.${rawHit}` : null].filter(Boolean).join(', ')
        flags.push({ line: ex.line, tongan: ex.tongan.trim(), via })
      }
    }

    const ratio = traceable / examples.length
    if (flags.length === 0 && ratio === 0) continue
    grandFlagged += flags.length
    const ratioStr = `${traceable}/${examples.length} = ${(ratio * 100).toFixed(0)}%`
    const over = ratio > VERBATIM_CEILING
    if (over) overCeiling.push(c.chapter)
    console.log(`  Ch ${String(c.chapter).padStart(2)} (${c.title}) — verbatim ratio ${ratioStr}${over ? '  ⚠ OVER CEILING' : ''}`)
    for (const f of flags) console.log(`     L${f.line}: *${f.tongan}*  ← ${f.via}`)
  }

  console.log(`\n  ${grandFlagged} source-traceable example(s) flagged.`)
  if (overCeiling.length) console.log(`  Chapters over the ${Math.round(VERBATIM_CEILING * 100)}% ceiling: ${overCeiling.join(', ')}`)
  console.log('  Note: ceremonial/royal material is out of corpus scope; the raw-Churchward pass (routed chapters) is the backstop for those.\n')
}

main().catch(err => { console.error(err); process.exit(1) })
