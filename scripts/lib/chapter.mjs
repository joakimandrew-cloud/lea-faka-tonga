/**
 * lib/chapter.mjs — shared book-chapter parsing for the Phase P2 fidelity checks.
 *
 * One robust parser the gloss / consistency / grammaticality / orthography /
 * vocab checks all build on, so the markdown-shape knowledge (where Tongan
 * lives, how Words-to-Learn tables and answer keys are laid out) is written once.
 *
 * Chapter conventions (confirmed against book/Chapter-29.md and the SFA history):
 *   - Tongan is single-asterisk italic: `*'eku tokoni*`  (NOT `**bold**`).
 *   - Example blocks:  `::: {.examples}` … `:::`  with lines `*Tongan*. English gloss`.
 *   - Inline examples in prose: `*Tongan* = gloss` or `*Tongan*. gloss`.
 *   - Words to Learn: `### Words to Learn`, then `**New grammar words**` and
 *     `**New vocabulary**` markdown tables `| *tongan* | type/function | english |`.
 *   - Answers: `### Answers`, `#### Exercise N`, then `1. *Tongan*. gloss (note)`.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
export const BOOK_DIR = path.join(REPO_ROOT, 'book')

export async function listChapterFiles() {
  const files = await fs.readdir(BOOK_DIR)
  return files.filter((f) => /^Chapter-\d{2}\.md$/.test(f)).sort()
}

export async function readChapter(file) {
  return fs.readFile(path.join(BOOK_DIR, file), 'utf8')
}

// ── Tongan orthography ─────────────────────────────────────────────────────

// Unify okina glyph variants to a single ASCII apostrophe.
export const normOkina = (s) => (s || '').replace(/[ʻ‘’`ʼ]/g, "'")

// Loose lemma key: drop macrons AND okina AND case — folds *māhina*/*mahina*
// and *'eku*/*eku* together. Use for "is this the same word" grouping.
export const foldLemma = (s) =>
  normOkina(s).normalize('NFD').replace(/[̀-̏]/g, '').replace(/'/g, '').toLowerCase().trim()

// Orthographic key: drop macrons + case but KEEP okina — distinguishes the
// grammatically-significant glottal (*'eku* ≠ *eku*) while folding accent drift.
export const orthoKey = (s) =>
  normOkina(s).normalize('NFD').replace(/[̀-̏]/g, (c) => (c === '́' ? c : '')).toLowerCase().trim()
// (keeps U+0301 acute = the definitive accent, drops macron U+0304 etc.)

// Every single-asterisk italic span in a line (skips `**bold**`).
export function italicSpans(text) {
  const out = []
  const re = /(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g
  let m
  while ((m = re.exec(text))) {
    const v = m[1].trim()
    if (v) out.push(v)
  }
  return out
}

// Strip a parenthetical/markdown tail from a gloss for comparison.
export const cleanGloss = (s) =>
  (s || '').replace(/<[^>]+>/g, '').replace(/\(.*?\)/g, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim()

const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'is', 'are', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'my', 'your', 'his', 'her', 'our', 'their', 'be', 'and', 'or', 'in', 'on', 'at', 'do', 'does', 'with', 'by', 'as', 'that', 'this'])
export const contentWords = (s) =>
  cleanGloss(s).toLowerCase().split(/[^a-z'ā-ūʻ]+/i).filter((w) => w.length > 2 && !STOP.has(w))

// ── Structural parse ───────────────────────────────────────────────────────

// Classify each line into a region so callers can scope their scan. Returns a
// parallel array `region[i]` for line i (0-based).
function regionize(lines) {
  const region = []
  let inFence = false, inExamples = false, inTable = false, section = 'body'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^```/.test(line)) { inFence = !inFence; region.push('fence'); continue }
    if (inFence) { region.push('fence'); continue }
    const h = line.match(/^#{1,6}\s+(.*)$/)
    if (h) {
      const t = h[1].toLowerCase()
      if (/words to learn/.test(t)) section = 'wtl'
      else if (/^answers/.test(t) || /\banswers\b/.test(t)) section = 'answers'
      else if (/^exercises?/.test(t) || /^exercise \d/.test(t)) section = 'exercises'
      else if (h[0].startsWith('#### ') && section === 'answers') { /* keep answers */ }
      else if (h[0].startsWith('### ')) section = /words to learn/.test(t) ? 'wtl' : (/answers/.test(t) ? 'answers' : (/exercises?/.test(t) ? 'exercises' : 'body'))
      region.push('heading')
      continue
    }
    if (/^:::\s*\{?\.?examples\}?/.test(line)) { inExamples = true; region.push('examples-open'); continue }
    if (/^:::/.test(line)) { inExamples = false; region.push('div'); continue }
    const isTableRow = /^\s*\|/.test(line)
    if (inExamples) region.push('examples')
    else if (isTableRow) region.push(section === 'wtl' ? 'wtl-table' : 'table')
    else region.push(section)
  }
  return region
}

// Pull a (tongan, gloss, sep) triple from a line like `1. *Tongan*. gloss`.
function exampleFromLine(line) {
  const m = line.match(/^\s*(?:[-*]\s*)?(?:\d+\.\s*)?\*([^*]+)\*\s*([.=:])?\s*(.*)$/)
  if (!m) return null
  const tongan = m[1].trim()
  if (!tongan) return null
  return { tongan, gloss: (m[3] || '').trim(), sep: m[2] || '' }
}

// Parse a Words-to-Learn table row `| *tongan* | col2 | english |`.
function wtlRow(line) {
  if (!/^\s*\|/.test(line)) return null
  const cells = line.split('|').map((c) => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length) // drop outer empties
  if (cells.length < 3) return null
  const tongan = (italicSpans(cells[0])[0] || cells[0]).trim()
  if (!tongan || /^-+$/.test(tongan) || /tongan/i.test(tongan)) return null // skip header/separator
  return { tongan, col2: cells[1], english: cells[2] }
}

export function parseChapter(src, file = '') {
  const lines = src.split('\n')
  const region = regionize(lines)
  const numberM = lines[0].match(/^#\s*Chapter\s+(\d+):\s*(.+)$/)
  const number = numberM ? parseInt(numberM[1], 10) : null
  const title = numberM ? numberM[2].trim() : ''

  const examples = [] // {line, region, tongan, gloss}  — full Tongan sentence/phrase + gloss
  const wtl = []       // {line, group:'grammar'|'vocab', tongan, col2, english}
  const tongan = []    // {line, region, span} — every italic Tongan span
  let wtlGroup = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], reg = region[i]
    if (reg === 'fence') continue

    // Track which Words-to-Learn sub-table we're in.
    if (/\*\*New grammar words\*\*/i.test(line)) wtlGroup = 'grammar'
    else if (/\*\*New vocabulary\*\*/i.test(line)) wtlGroup = 'vocab'

    for (const span of italicSpans(line)) tongan.push({ line: i + 1, region: reg, span })

    if (reg === 'wtl-table') {
      const r = wtlRow(line)
      if (r) wtl.push({ line: i + 1, group: wtlGroup || 'vocab', ...r })
      continue
    }

    if (reg === 'examples' || reg === 'answers' || reg === 'body') {
      // only treat as an example line if it leads with italic Tongan + a gloss
      if (/^\s*(?:[-*]\s*)?(?:\d+\.\s*)?\*/.test(line)) {
        const ex = exampleFromLine(line)
        // In body prose an italic word that starts a sentence ("*na'a* always
        // comes first…") is NOT a gloss line — only the definitional `*X* = …`
        // form is. Example/answer blocks carry real `*X*. gloss` pairs.
        if (ex && ex.gloss && !(reg === 'body' && ex.sep !== '=')) {
          examples.push({ line: i + 1, region: reg, tongan: ex.tongan, gloss: ex.gloss })
        }
      }
    }
  }

  return { file, number, title, examples, wtl, tongan, lines, region }
}

export async function parseAllChapters() {
  const files = await listChapterFiles()
  const out = []
  for (const f of files) out.push(parseChapter(await readChapter(f), f))
  return out
}
