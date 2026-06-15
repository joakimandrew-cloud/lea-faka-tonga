// ---------------------------------------------------------------------------
// build-interaction-decisions.mjs  (dev-only)
//
// Turns the Opus judge verdicts (audits/.interaction-verdicts.json) + the
// human adjudications below into the extractor's decision file
// scripts/exercise-interaction-decisions.json — the single source of truth for
// which Book Exercises become tap-an-option MCQ (and with what options).
//
// It SELF-VALIDATES: for every MCQ it matches each item's canonical answer to
// exactly one option. Any exercise with an unmatched item is auto-demoted to
// reveal and logged (the safety net). Re-run:
//   node scripts/build-interaction-decisions.mjs
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP = resolve(__dirname, '..')
const ROOT = resolve(APP, '..')
const verdicts = JSON.parse(readFileSync(resolve(ROOT, 'audits/.interaction-verdicts.json'), 'utf8')).verdicts
const book = JSON.parse(readFileSync(resolve(APP, 'src/data/book-exercises.json'), 'utf8'))

// ---- human adjudications over the judge verdicts (see review notes) --------
// Judge said mcq, we override to reveal (answers are produced, not picked):
const DEMOTE_TO_REVEAL = new Set(['ch18-ex5', 'ch50-ex1'])
// Per-item inline pick-lists "(*a* / *b* / *c*)" — options parsed PER ITEM from
// the prompt, NOT a union bank (the judge over-unioned these to 8-15 chips):
const INLINE = new Set(['ch36-ex5', 'ch42-ex3', 'ch51-ex3', 'ch52-ex3'])
// English-label classification banks (render plain, not italic Tongan):
const LABELS = new Set(['ch18-ex1', 'ch38-ex4', 'ch41-ex1', 'ch44-ex1', 'ch50-ex2', 'ch50-ex7', 'ch52-ex5', 'ch53-ex1'])
// Cleaned shared bank (judge bank had a capitalized near-dup "Kehe"):
const BANK_OVERRIDE = { 'ch30-ex6': ["'ilonga", 'kae kehe', 'kehe ke', 'faifai', 'kehe'] }

// ---- helpers --------------------------------------------------------------
function normCmp(s) {
  if (!s) return ''
  return String(s)
    .replace(/\*+/g, '')
    .replace(/[‘’ʻ'`]/g, "'")
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s".,?!]+|[\s".,?!]+$/g, '')
    .toLowerCase()
    .trim()
}
const leadingItalic = (s) => { const m = (s || '').match(/^\s*\*([^*]+)\*/); return m ? m[1] : null }
const stripGloss = (o) => o.replace(/\s*\([^)]*\)\s*$/, '')

// Display form for a shared-bank option.
function formatOption(t, isLabel) {
  t = String(t).replace(/\*/g, '').trim()
  if (isLabel) return t
  const g = t.match(/^(.+?)\s*(\([^)]*\))\s*$/)
  if (g) return '*' + g[1].trim() + '* ' + g[2]
  return '*' + t + '*'
}

const italicSpans = (s) => { const out = []; const re = /\*([^*]+)\*/g; let m; while ((m = re.exec(s || '')) !== null) out.push(m[1]); return out }
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Match an item's answer to exactly one option; return the option or null.
// Tongan banks: the answer marks its chosen form in italics (possibly mid-
// sentence, e.g. "Lele mai *na'á* ke tōmui") — match an italic span (or the
// clean accept[0]) exactly. Label banks: the label may sit before OR after the
// stimulus word ("*kupukupu*: plurality") — word-bounded substring anywhere;
// a slash-option ("plurality/repetition") matches on any of its parts. Ties
// break to the match nearest the start, then the longest.
function matchOption(item, options, isLabel) {
  const full = normCmp(item.answer)
  const cands = []
  if (isLabel) {
    for (const o of options) {
      for (const sub of normCmp(stripGloss(o)).split('/').map((s) => s.trim()).filter(Boolean)) {
        const idx = full.search(new RegExp('\\b' + escapeRe(sub) + '\\b'))
        if (idx >= 0) cands.push({ o, idx, len: sub.length })
      }
    }
  } else {
    const spans = italicSpans(item.answer).map(normCmp)
    const a0 = item.accept && item.accept[0]
    if (a0) spans.push(normCmp(leadingItalic(a0) || a0))
    for (const o of options) {
      const on = normCmp(stripGloss(o))
      if (on && spans.includes(on)) cands.push({ o, idx: 0, len: on.length })
    }
  }
  if (!cands.length) return null
  cands.sort((a, b) => (a.idx - b.idx) || (b.len - a.len))
  return cands[0].o
}

// Parse a per-item inline option list "(*a* / *b* / *c*)" from a prompt.
function inlineOptions(prompt) {
  const re = /\(([^()]*\/[^()]*)\)/g
  let m
  while ((m = re.exec(prompt)) !== null) {
    const inner = m[1]
    if (!/[A-Za-zʻ’'āēīōū]/.test(inner)) continue
    const toks = inner.split('/').map((s) => s.replace(/\*/g, '').trim()).filter(Boolean)
    if (toks.length >= 2 && toks.every((t) => t.split(/\s+/).length <= 3 && t.length <= 18)) {
      return toks.map((t) => '*' + t + '*')
    }
  }
  return null
}

// ---- build ----------------------------------------------------------------
const decisions = {}
const demoted = []
const report = []

for (const v of verdicts) {
  if (v.interaction !== 'mcq') continue
  if (DEMOTE_TO_REVEAL.has(v.id)) { demoted.push(v.id + ' (manual: produced/fuzzy)'); continue }
  const [, ch] = v.id.match(/ch(\d+)-/)
  const ex = book[ch].find((e) => e.id === v.id)

  if (INLINE.has(v.id)) {
    // Per-item inline lists are parsed by the EXTRACTOR from the fresh book
    // markdown (which always carries the "(a / b / c)" list) and it warns on any
    // miss. We do NOT re-parse from book-exercises.json here: the extractor
    // STRIPS that list from the stored prompt, so re-parsing the converted json
    // would spuriously fail and demote these. Keeps the pipeline idempotent.
    decisions[v.id] = { interaction: 'mcq', mode: 'inline' }
    report.push([v.id, 'mcq/inline', ex.items.length + ' items, per-item options'])
    continue
  }

  const isLabel = LABELS.has(v.id)
  const raw = BANK_OVERRIDE[v.id] || v.bank
  const options = raw.map((t) => formatOption(t, isLabel))
  const unmatched = ex.items.filter((it) => it.answer && !matchOption(it, options, isLabel)).map((it) => it.id)
  if (unmatched.length) { demoted.push(v.id + ' (unmatched: ' + unmatched.join(',') + ')'); continue }
  decisions[v.id] = { interaction: 'mcq', mode: 'shared', labels: isLabel, options }
  report.push([v.id, isLabel ? 'mcq/labels' : 'mcq/shared', '[' + options.length + '] ' + options.join(' · ')])
}

writeFileSync(resolve(APP, 'scripts/exercise-interaction-decisions.json'), JSON.stringify(decisions, null, 2) + '\n')

// --- refresh section C (final decisions) of the audit register -------------
const esc = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
const finalRows = verdicts.slice().sort((a, b) => {
  const ca = +a.id.match(/ch(\d+)-/)[1], cb = +b.id.match(/ch(\d+)-/)[1]
  return ca - cb || a.id.localeCompare(b.id)
}).map((v) => {
  const d = decisions[v.id]
  if (d) {
    const bank = d.mode === 'inline' ? '_(per-item inline)_' : d.options.map((o) => '`' + o + '`').join(' ')
    const adj = (BANK_OVERRIDE[v.id] || INLINE.has(v.id) || LABELS.has(v.id)) ? ' _(adjusted)_' : ''
    return `| ${v.id} | **mcq** | ${bank} | ${esc(v.note).slice(0, 130)}${adj} |`
  }
  const reason = DEMOTE_TO_REVEAL.has(v.id)
    ? 'owner-demoted (produced/fuzzy, not a faithful pick)'
    : (v.interaction === 'mcq' ? 'demoted on validation (answers map to no clean bank)' : (v.refuted ? 'refuted: ' + esc(v.refuteReason) : ''))
  const note = reason ? reason + ' · ' + esc(v.note).slice(0, 80) : esc(v.note).slice(0, 140)
  return `| ${v.id} | reveal | — | ${note} |`
})
const mcqN = Object.keys(decisions).length
const sectionC = [
  '## C. Final decisions (judge-verified + owner-adjudicated)',
  '',
  `**${mcqN} multiple-choice · ${124 - mcqN} tap-to-reveal** (of 124 in-scope). Opus judge pass (103 agents) then main-model review: per-item inline lists split out of union banks (ch36/42/51/52), English-label classification banks recovered (ch41/50/52/53), every bank self-validated so each item's answer maps to exactly one book-sourced option. Genuine demotions kept on reveal (ch18-ex5, ch33-ex4, ch48-ex5, ch50-ex1) plus the 3 adversarial saves (ch13-ex5, ch19-ex2, ch34-ex3).`,
  '',
  '| Exercise | Interaction | Option bank (book-sourced) | Note |',
  '|---|---|---|---|',
  ...finalRows,
  '',
].join('\n')
const regPath = resolve(ROOT, 'audits/Exercise-Interaction-Review.md')
const reg = readFileSync(regPath, 'utf8')
const cut = reg.indexOf('## C.')
writeFileSync(regPath, (cut >= 0 ? reg.slice(0, cut) : reg + '\n') + sectionC)
console.log('Updated audits/Exercise-Interaction-Review.md section C')

console.log('=== MCQ decisions (' + Object.keys(decisions).length + ') ===')
for (const [id, kind, detail] of report) console.log('  ' + id.padEnd(11) + kind.padEnd(12) + detail)
console.log('\n=== Demoted to reveal (' + demoted.length + ') ===')
for (const d of demoted) console.log('  ' + d)
console.log('\nWrote scripts/exercise-interaction-decisions.json')
