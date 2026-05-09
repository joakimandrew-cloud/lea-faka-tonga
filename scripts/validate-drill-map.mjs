#!/usr/bin/env node
/**
 * validate-drill-map.mjs — author-time sanity check for src/data/drill-map.json.
 *
 * Run: `node scripts/validate-drill-map.mjs` (from lea-faka-tonga-app/)
 *
 * Two passes:
 *
 *   1. SLUG VALIDATION. For every entry in drill-map.json, parse the
 *      target chapter's H3 headings and confirm the `after` slug matches
 *      one of them. Reports any miss with the chapter's actual slugs so
 *      you can copy-paste the right value.
 *
 *   2. GRAMMAR-OVERSHOOT HEURISTIC. Scans each Core file's source for
 *      late-introduced grammar markers and flags any that appear in a
 *      drill anchored before that grammar exists. This is a heuristic,
 *      not a proof — it scans plain string occurrences in the source. A
 *      false positive on a comment is acceptable; a false negative on a
 *      real bug is what we want to avoid.
 *
 *      Markers and their introduction chapters live in GRAMMAR_GATES
 *      below. Add to the table as more drills come online.
 *
 * Exits 0 on clean run, 1 if any errors found.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')
const BOOK_DIR = path.join(REPO_ROOT, 'book')
const DRILL_MAP_PATH = path.join(APP_ROOT, 'src/data/drill-map.json')
const REGISTRY_PATH = path.join(APP_ROOT, 'src/drills/registry.js')
const DRILLS_DIR = path.join(APP_ROOT, 'src/drills')

// Mirror src/lib/remark-drill-anchors.js → slugify().
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02BB'`]/g, '')
    .replace(/[\/.:,;\u2014\u2013]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Strip Pandoc-style markdown markers from heading text so the slug
// matches what the runtime sees.
function cleanHeadingText(line) {
  return line
    .replace(/^###\s+/, '')
    .replace(/\*+/g, '')        // italics/bold markers
    .trim()
}

// Late-introduced markers. Each entry: marker → minChapter where it's
// formally taught. If a Core's source contains the marker AND that Core
// is anchored at chapter < minChapter, that's a grammar-overshoot suspect.
//
// The marker is a substring search on the raw drill source, including
// the EXAMPLES/PROMPTS arrays. Comments inside the file count too — keep
// the markers specific enough that prose comments don't trigger false
// positives. Strings here use the same Tongan apostrophe (ʻ, U+02BB) the
// drill source uses.
const GRAMMAR_GATES = [
  { marker: 'Naʻe ',     minChapter: 9,  desc: 'Naʻe (past TM before non-pronoun) — Ch 9 (negation) and Ch 15 (noun subjects)' },
  { marker: 'ʻE ʻikai',  minChapter: 9,  desc: 'ʻE ʻikai (future negation) — Ch 9' },
  { marker: 'ʻikai te',  minChapter: 9,  desc: 'ʻikai te (negation with pronoun) — Ch 9' },
  { marker: 'ʻikai ke',  minChapter: 9,  desc: 'ʻikai ke (negation no pronoun) — Ch 9' },
  { marker: 'Ko e ',     minChapter: 12, desc: 'Ko e + noun (equational opener) — Ch 12' },
  { marker: 'ʻa Sione',  minChapter: 15, desc: 'ʻa + name (noun-subject construction) — Ch 15' },
  { marker: 'ʻa Mele',   minChapter: 15, desc: 'ʻa + name (noun-subject construction) — Ch 15' },
  { marker: 'ʻa Lupe',   minChapter: 15, desc: 'ʻa + name (noun-subject construction) — Ch 15' },
  { marker: 'ʻa Tēvita', minChapter: 15, desc: 'ʻa + name (noun-subject construction) — Ch 15' },
  { marker: 'ʻa Pita',   minChapter: 15, desc: 'ʻa + name (noun-subject construction) — Ch 15' },
  { marker: 'ʻa e ',     minChapter: 8,  desc: 'ʻa e (focus + definite article) — Ch 8 (deeper Ch 19)' },
  { marker: 'ngaahi',    minChapter: 25, desc: 'ngaahi (general plural) — Ch 25' },
  { marker: 'kau ',      minChapter: 25, desc: 'kau (people plural) — Ch 25 (false-positive risk on kau ki / kaungā)' },
  { marker: 'haʻaku',    minChapter: 29, desc: 'haʻaku (indefinite possessive) — Ch 29' },
  { marker: 'ʻi ai ha ', minChapter: 31, desc: 'ʻi ai ha + noun (existential) — Ch 31 (trailing space avoids matching haʻaku)' },
  { marker: 'kapau',     minChapter: 30, desc: 'kapau (if) — Ch 30' },
  { marker: 'ka ne',     minChapter: 47, desc: 'ka ne (counterfactual) — Ch 47' },
  { marker: 'fakalelei', minChapter: 32, desc: 'faka- causative — Ch 32' },
  { marker: 'sai\u02BBia', minChapter: 21, desc: 'saiʻia (auxiliary "like") — Ch 21' },
  { marker: 'totonu ke', minChapter: 23, desc: 'totonu ke (should/obligation) — Ch 23' },
]

// ── Helpers ────────────────────────────────────────────────────────────

async function readJSON(p) {
  return JSON.parse(await fs.readFile(p, 'utf8'))
}

async function loadChapterSlugs(chapterNum) {
  const padded = String(chapterNum).padStart(2, '0')
  const file = path.join(BOOK_DIR, `Chapter-${padded}.md`)
  const md = await fs.readFile(file, 'utf8').catch(() => null)
  if (!md) return null
  const slugs = []
  for (const line of md.split('\n')) {
    if (!line.startsWith('### ')) continue
    const text = cleanHeadingText(line)
    if (!text) continue
    slugs.push({ heading: text, slug: slugify(text) })
  }
  return slugs
}

async function loadRegistryDrillIds() {
  const src = await fs.readFile(REGISTRY_PATH, 'utf8')
  const ids = []
  // Match `'drill-id': {` style keys
  for (const match of src.matchAll(/^\s*'([^']+)':\s*\{/gm)) {
    ids.push(match[1])
  }
  return new Set(ids)
}

async function loadDrillSourceById(drillId) {
  // Convert drill-id (kebab-case) → CoreName + 'Core.jsx' isn't always
  // straightforward (e.g. faka-pattern-sorter → FakaSorterCore). Easier
  // to just glob *Core.jsx and search for the drillId in registry.js.
  // For grammar scanning we read every Core file; the per-drill mapping
  // is done by parsing the registry source.
  return null  // not used directly; see scanCores()
}

// Replace JS/JSX comments with whitespace of equal length so subsequent
// substring positions stay byte-stable. Comments routinely contain Tongan
// markers ("// Ch 9: Negation (ʻikai te + pronoun)") that would otherwise
// trigger spurious grammar-overshoot warnings.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length))
    .replace(/\/\/[^\n]*/g, m => ' '.repeat(m.length))
}

// Returns { stripped, allows: [marker, ...] } per Core. The allows list
// comes from `VALIDATOR_ALLOW: <marker>` directives in (un-stripped)
// comments. Use these sparingly — only when the chapter's own prose
// introduces a marker informally before its formal chapter.
async function scanCores() {
  const files = (await fs.readdir(DRILLS_DIR)).filter(f => f.endsWith('Core.jsx'))
  const cores = {}
  for (const f of files) {
    const raw = await fs.readFile(path.join(DRILLS_DIR, f), 'utf8')
    const allows = []
    for (const m of raw.matchAll(/VALIDATOR_ALLOW:\s*([^\n*]+?)(?=\s*(?:\*\/|\n|$))/g)) {
      allows.push(m[1].trim())
    }
    cores[f.replace('.jsx', '')] = { stripped: stripComments(raw), allows }
  }
  return cores
}

// Read registry to map drillId → Core component name (e.g.
// 'preposition-selector' → 'PrepositionSelectorCore').
async function loadDrillToCoreMap() {
  const src = await fs.readFile(REGISTRY_PATH, 'utf8')
  const map = {}
  // Lines look like:  Core: PrepositionSelectorCore,
  // We need to associate each drillId with its Core. The registry is a
  // single object; parse by walking entry blocks.
  const entryRegex = /'([^']+)':\s*\{[^}]*Core:\s*(\w+Core)/gm
  for (const match of src.matchAll(entryRegex)) {
    map[match[1]] = match[2]
  }
  return map
}

// ── Pass 1: slug validation ────────────────────────────────────────────

async function validateSlugs(drillMap) {
  const errors = []
  for (const [chapterStr, anchors] of Object.entries(drillMap)) {
    if (chapterStr.startsWith('$')) continue
    const chapterNum = parseInt(chapterStr, 10)
    if (!Number.isFinite(chapterNum)) continue

    const slugs = await loadChapterSlugs(chapterNum)
    if (!slugs) {
      errors.push({ chapter: chapterNum, kind: 'missing-chapter', msg: `Chapter file book/Chapter-${String(chapterNum).padStart(2,'0')}.md not found` })
      continue
    }
    const validSlugs = new Set(slugs.map(s => s.slug))
    for (const a of anchors) {
      if (!validSlugs.has(a.after)) {
        errors.push({
          chapter: chapterNum,
          kind: 'slug-miss',
          msg: `Drill "${a.drillId}" anchored after "${a.after}" — no matching H3 in Ch ${chapterNum}`,
          available: slugs.map(s => `  ${s.slug}  ← "${s.heading}"`),
        })
      }
    }
  }
  return errors
}

// ── Pass 2: grammar-overshoot heuristic ────────────────────────────────

async function validateGrammar(drillMap, drillToCore, coreSources) {
  const warnings = []
  for (const [chapterStr, anchors] of Object.entries(drillMap)) {
    if (chapterStr.startsWith('$')) continue
    const chapterNum = parseInt(chapterStr, 10)
    if (!Number.isFinite(chapterNum)) continue

    for (const a of anchors) {
      const coreName = drillToCore[a.drillId]
      if (!coreName) continue
      const entry = coreSources[coreName]
      if (!entry) continue
      const { stripped: src, allows } = entry

      for (const gate of GRAMMAR_GATES) {
        if (chapterNum >= gate.minChapter) continue
        if (!src.includes(gate.marker)) continue
        // Author-declared exceptions: a Core can include
        // `// VALIDATOR_ALLOW: <marker>` to silence a known intentional case
        // (e.g. Ch 7 prose introduces Naʻe via the impersonal verb ngalo).
        if (allows.some(x => x === gate.marker.trim())) continue
        if (markerIsRuntimeFiltered(src, gate.marker, gate.minChapter)) continue

        warnings.push({
          chapter: chapterNum,
          drillId: a.drillId,
          coreName,
          gate: gate.marker,
          desc: gate.desc,
        })
      }
    }
  }
  return warnings
}

// Heuristic: walk each occurrence of `marker` in src; find each
// enclosing `{ ... }` block in turn (innermost outward) and check whether
// any of them contains a sibling `minChapter: N` with N >= gateMinChapter.
// If EVERY occurrence is runtime-filtered, suppress the warning.
function markerIsRuntimeFiltered(src, marker, gateMinChapter) {
  let pos = 0
  let anyUnfiltered = false
  while (true) {
    const i = src.indexOf(marker, pos)
    if (i === -1) break
    pos = i + marker.length
    if (!isOccurrenceFiltered(src, i, gateMinChapter)) {
      anyUnfiltered = true
    }
  }
  return !anyUnfiltered
}

// Walk outward from position i through nested {} blocks, returning true
// if any enclosing block declares minChapter >= gateMinChapter at its
// own depth (i.e. a sibling property of the marker, not buried in another
// nested block).
function isOccurrenceFiltered(src, i, gateMinChapter) {
  let scanFrom = i
  while (scanFrom >= 0) {
    let depth = 0
    let openBrace = -1
    for (let j = scanFrom; j >= 0; j--) {
      if (src[j] === '}') depth++
      else if (src[j] === '{') {
        if (depth === 0) { openBrace = j; break }
        depth--
      }
    }
    if (openBrace === -1) return false
    let depth2 = 1
    let closeBrace = -1
    for (let j = openBrace + 1; j < src.length; j++) {
      if (src[j] === '{') depth2++
      else if (src[j] === '}') {
        depth2--
        if (depth2 === 0) { closeBrace = j; break }
      }
    }
    if (closeBrace === -1) return false
    const block = src.slice(openBrace, closeBrace + 1)
    // Scan THIS block at top level (not inside its nested {}) for minChapter.
    if (topLevelHasMinChapter(block, gateMinChapter)) return true
    scanFrom = openBrace - 1
  }
  return false
}

function topLevelHasMinChapter(block, gateMinChapter) {
  // Walk the block; track brace depth; only consider minChapter at depth 1
  // (immediate properties of this object, not children).
  let depth = 0
  for (let i = 0; i < block.length; i++) {
    const ch = block[i]
    if (ch === '{') depth++
    else if (ch === '}') depth--
    if (depth === 1) {
      if (block.startsWith('minChapter', i)) {
        const tail = block.slice(i + 'minChapter'.length).match(/^\s*:\s*(\d+)/)
        if (tail && parseInt(tail[1], 10) >= gateMinChapter) return true
      }
    }
  }
  return false
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const drillMap = await readJSON(DRILL_MAP_PATH)
  const registryIds = await loadRegistryDrillIds()
  const drillToCore = await loadDrillToCoreMap()
  const coreSources = await scanCores()

  let exitCode = 0

  // Verify all drill ids in drill-map exist in registry
  console.log('\n── Drill ID coverage ──')
  for (const [chapterStr, anchors] of Object.entries(drillMap)) {
    if (chapterStr.startsWith('$')) continue
    for (const a of anchors) {
      if (!registryIds.has(a.drillId)) {
        console.log(`  ✗ Ch ${chapterStr}: drill "${a.drillId}" not in registry`)
        exitCode = 1
      }
    }
  }
  if (exitCode === 0) console.log('  ✓ all drill ids in drill-map are registered')

  // Pass 1
  console.log('\n── Slug validation ──')
  const slugErrors = await validateSlugs(drillMap)
  if (slugErrors.length === 0) {
    console.log('  ✓ every anchor matches a real H3')
  } else {
    exitCode = 1
    for (const e of slugErrors) {
      console.log(`  ✗ Ch ${e.chapter}: ${e.msg}`)
      if (e.available) {
        console.log('    Available H3 slugs in this chapter:')
        e.available.forEach(s => console.log('    ' + s))
      }
    }
  }

  // Pass 2
  console.log('\n── Grammar-overshoot heuristic ──')
  const warnings = await validateGrammar(drillMap, drillToCore, coreSources)
  if (warnings.length === 0) {
    console.log('  ✓ no late-grammar markers found in early-chapter drills (or all are runtime-filtered)')
  } else {
    for (const w of warnings) {
      console.log(`  ⚠ Ch ${w.chapter} → ${w.drillId} (${w.coreName})`)
      console.log(`    contains marker "${w.gate}"`)
      console.log(`    expected only at Ch ≥ ${w.desc.match(/Ch (\d+)/)?.[1] || '?'} — ${w.desc}`)
      console.log('    if this content is gated at runtime, tag the entry with minChapter ≥ ' + w.desc.match(/Ch (\d+)/)?.[1] + ' to silence this warning')
    }
    // Heuristic warnings don't fail the build by default
  }

  console.log('')
  process.exit(exitCode)
}

main().catch(err => {
  console.error(err)
  process.exit(2)
})
