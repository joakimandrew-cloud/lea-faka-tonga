#!/usr/bin/env node
// Build audits/grammar-gates.json — a "marker → minChapter" table for the
// forward-grammar pass. Two sources:
//
//  1. Chapter-Inventory.md Part 1: per-chapter tables, with each chapter's
//     "Core Structure Added" cell containing one or more ***triple-bolded***
//     grammar markers (e.g. ***'ikai te***, ***ngaahi***).
//
//  2. lea-faka-tonga-app/scripts/validate-drill-map.mjs already ships a
//     manually-curated GRAMMAR_GATES table with carefully-chosen substring
//     markers that are robust against false positives. We parse that file
//     too so its entries become part of the index — the existing markers
//     are gold-standard and should always win when a marker collides.
//
//  3. An optional audits/grammar-gates.overrides.json for project-specific
//     additions and corrections. Overrides apply last.
//
// Output schema:
//   {
//     summary: { ... },
//     gates: [
//       { marker, minChapter, desc, source: 'inventory-part1' | 'validate-drill-map' | 'override' }
//     ]
//   }
//
// Run: node lea-faka-tonga-app/scripts/build-grammar-gates.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..', '..')
const INVENTORY = path.join(REPO_ROOT, 'Chapter-Inventory.md')
const VALIDATE_DRILL_MAP = path.join(__dirname, 'validate-drill-map.mjs')
const VOCAB_INDEX = path.join(REPO_ROOT, 'audits', 'vocab-index.json')
const OVERRIDES = path.join(REPO_ROOT, 'audits', 'grammar-gates.overrides.json')
const OUT = path.join(REPO_ROOT, 'audits', 'grammar-gates.json')

// Mirror build-vocab-index.mjs::normalizeTongan — needed for the vocab
// cross-check in clampToVocabFloor.
function normalizeTongan(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻʼ'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── 1. Parse inventory tables (Part 1) ────────────────────────────────────
//
// Part 1 has three subsection tables (Basic / Intermediate / Advanced),
// each with rows of the form:
//   | 9 | Negation | TEACH | Negative ***'ikai te*** + pron + V; ***'e 'ikai*** ... |

function extractInventoryMarkers(md) {
  const gates = []
  const rowRe = /^\|\s*(\d+)\s*\|[^|]+\|[^|]+\|\s*(.+?)\s*\|\s*$/gm
  let m
  while ((m = rowRe.exec(md)) !== null) {
    const ch = parseInt(m[1], 10)
    if (!Number.isFinite(ch) || ch < 1 || ch > 53) continue
    const cell = m[2]
    // Triple-bolded markers: ***marker***. Greedy until next ***.
    const markerRe = /\*\*\*([^*]+?)\*\*\*/g
    let mm
    while ((mm = markerRe.exec(cell)) !== null) {
      const raw = mm[1].trim()
      // Strip leading/trailing punctuation for cleaner substring match later.
      const marker = raw.replace(/^[+,;:.\s]+|[+,;:.\s]+$/g, '')
      if (!marker) continue
      gates.push({
        marker,
        minChapter: ch,
        desc: `Inventory Ch ${ch}: ${truncate(cell, 80)}`,
        source: 'inventory-part1',
      })
    }
  }
  return gates
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ── 2. Parse validate-drill-map.mjs's GRAMMAR_GATES table ──────────────────
//
// We're not importing — that file is part of the app's runtime build. We
// parse its source so this index stays in lockstep without coupling.

function extractValidateDrillMapGates(src) {
  const gates = []
  const tableMatch = src.match(/const\s+GRAMMAR_GATES\s*=\s*\[([\s\S]*?)\n\]/)
  if (!tableMatch) return gates
  const body = tableMatch[1]
  const entryRe = /\{\s*marker:\s*'([^']+)'\s*,\s*minChapter:\s*(\d+)\s*,\s*desc:\s*'([^']+)'\s*\}/g
  let m
  while ((m = entryRe.exec(body)) !== null) {
    gates.push({
      marker: m[1],
      minChapter: parseInt(m[2], 10),
      desc: m[3],
      source: 'validate-drill-map',
    })
  }
  return gates
}

// ── 3. Merge ──────────────────────────────────────────────────────────────
//
// Strategy:
//   - validate-drill-map entries are gold (manually curated, false-positive-tested)
//   - inventory-part1 entries fill in coverage for markers not in validate-drill-map
//   - overrides file applies last — can correct or add anything
//
// On collision (same marker text), the LATER source wins on minChapter and
// desc, but we record all sources in `seenIn` for traceability. Order:
// inventory → validate-drill-map → overrides.

// Take the LOWEST minChapter when the same marker appears in multiple
// sources. The inventory frequently bolds polysemous markers at their late
// senses (e.g. "te" at Ch 51 as the impersonal pronoun, even though the
// future-tense "te" is taught at Ch 2). Using the late chapter would
// false-positive every Ch 2+ exercise that contains "te". The lowest-min
// rule is conservative — once a marker appears anywhere it's "available."
function mergeGates(inventoryGates, validatorGates, overrideGates) {
  const merged = new Map()
  function add(g) {
    const cur = merged.get(g.marker)
    if (!cur) {
      merged.set(g.marker, { ...g, seenIn: [g.source] })
      return
    }
    if (!cur.seenIn.includes(g.source)) cur.seenIn.push(g.source)
    if (g.minChapter < cur.minChapter) {
      cur.minChapter = g.minChapter
      cur.desc = g.desc
      cur.source = g.source
    }
  }
  inventoryGates.forEach(add)
  validatorGates.forEach(add)
  overrideGates.forEach(add)
  return [...merged.values()]
}

// A marker that's also a real vocabulary entry has its true min chapter
// determined by the vocab master, not by the inventory bolding. Clamp the
// gate's min to the vocab floor so polysemous-particle markers (te, ke, he,
// ka) don't keep flagging their early uses.
function clampToVocabFloor(gates, vocab) {
  if (!vocab) return gates
  return gates.map(g => {
    const norm = normalizeTongan(g.marker)
    const v = vocab.byNormalized?.[norm]
    if (!v) return g
    if (v.minChapter >= g.minChapter) return g
    return {
      ...g,
      minChapter: v.minChapter,
      vocabClampedFrom: g.minChapter,
      vocabFloorReason: `${g.marker} is in vocab master at Ch ${v.minChapter} (form: ${v.canonicalForm})`,
    }
  })
}

// ── Main ──────────────────────────────────────────────────────────────────

function main() {
  const inventoryMd = fs.readFileSync(INVENTORY, 'utf8')
  const inventoryGates = extractInventoryMarkers(inventoryMd)

  let validatorGates = []
  if (fs.existsSync(VALIDATE_DRILL_MAP)) {
    const src = fs.readFileSync(VALIDATE_DRILL_MAP, 'utf8')
    validatorGates = extractValidateDrillMapGates(src)
  }

  let overrideGates = []
  if (fs.existsSync(OVERRIDES)) {
    const o = JSON.parse(fs.readFileSync(OVERRIDES, 'utf8'))
    overrideGates = (o.gates || []).map(g => ({ ...g, source: 'override' }))
  }

  let vocab = null
  if (fs.existsSync(VOCAB_INDEX)) vocab = JSON.parse(fs.readFileSync(VOCAB_INDEX, 'utf8'))

  let merged = mergeGates(inventoryGates, validatorGates, overrideGates)
  merged = clampToVocabFloor(merged, vocab)
  merged.sort((a, b) =>
    a.minChapter !== b.minChapter ? a.minChapter - b.minChapter : a.marker.localeCompare(b.marker)
  )

  const byChapter = {}
  for (const g of merged) byChapter[g.minChapter] = (byChapter[g.minChapter] || 0) + 1
  const clamped = merged.filter(g => g.vocabClampedFrom).length

  const out = {
    summary: {
      generatedAt: new Date().toISOString(),
      sources: {
        inventory: inventoryGates.length,
        validateDrillMap: validatorGates.length,
        overrides: overrideGates.length,
      },
      totalGates: merged.length,
      vocabClampedCount: clamped,
      byChapter,
    },
    gates: merged,
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')

  console.log(`Wrote ${path.relative(REPO_ROOT, OUT)}`)
  console.log('Summary:', out.summary)
}

main()
