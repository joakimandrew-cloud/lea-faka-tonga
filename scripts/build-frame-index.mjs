#!/usr/bin/env node
/**
 * build-frame-index.mjs — compile the frame index the `/translate` skill loads
 * at start.
 *
 * Run: `node scripts/build-frame-index.mjs` (from lea-faka-tonga-app/)
 * Emits: spec/Frame-Index.md
 *
 * Why it exists (reviews/translate-pipeline-analysis.md R2): the deep
 * translation path re-derives the same three facts about a frame every run —
 * which grammar-spec section defines it, what its slot order is, and the two
 * marker choices that are easy to get wrong (te vs ke, naʻa vs naʻe). Those
 * facts are already on disk; deriving them per-sentence is a measured tax.
 * This compiles them once, deterministically, from the reconciled sources.
 *
 * Inputs (ALL read-only — nothing here edits a source):
 *   spec/grammar-spec.md                      the frame set + section bodies
 *   source-materials/Function-Templates.md    speech-act frame tags
 *   source-materials/Negation-Paradigm.md     the te-vs-ke rule (§A.6, §J.1)
 *   src/data/grammar-graph.json               the live engine's real slot chains
 *
 * The frame set is NOT re-implemented here. It is harvested by
 * `harvestFrameTags()`, imported from check-citations.mjs, so the index covers
 * exactly the tag set the lint enforces — Entry Points Summary ∪
 * Function-Templates. If the two ever drifted, half the point would be lost.
 *
 * Resolution is best-effort but honest: every field records HOW it was
 * resolved (`specSource`, `templateSource`), and an unresolved field is
 * emitted as "—" rather than guessed. Deterministic: same inputs, same bytes.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { harvestFrameTags } from './check-citations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(APP_ROOT, '..')

const GRAMMAR_SPEC = path.join(REPO_ROOT, 'spec', 'grammar-spec.md')
const FUNCTION_TEMPLATES = path.join(REPO_ROOT, 'source-materials', 'Function-Templates.md')
const NEGATION_PARADIGM = path.join(REPO_ROOT, 'source-materials', 'Negation-Paradigm.md')
const GRAMMAR_GRAPH = path.join(APP_ROOT, 'src', 'data', 'grammar-graph.json')
const OUT = path.join(REPO_ROOT, 'spec', 'Frame-Index.md')

const REGEN = 'node scripts/build-frame-index.mjs   (from lea-faka-tonga-app/)'

const read = (p) => fs.readFile(p, 'utf8')

// ── grammar-spec structure ────────────────────────────────────────────────

// Every `## N. Heading` section, with its line span and body.
function parseSpecSections(lines) {
  const heads = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(\d+)\.\s*(.+?)\s*$/)
    if (m) heads.push({ number: parseInt(m[1], 10), heading: m[2], start: i })
  }
  return heads.map((h, i) => ({
    ...h,
    end: i + 1 < heads.length ? heads[i + 1].start : lines.length,
    body: lines.slice(h.start, i + 1 < heads.length ? heads[i + 1].start : lines.length).join('\n'),
  }))
}

// The line span of the "Entry Points Summary" block, so tag mentions inside
// the summary tables don't count as evidence that a section defines the tag.
function entryPointsSpan(lines) {
  const start = lines.findIndex(l => l.startsWith('## Entry Points Summary'))
  if (start === -1) return [-1, -1]
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+\d+\.\s/.test(lines[i])) { end = i; break }
  }
  return [start, end]
}

// ── spec-section resolution, in precedence order ──────────────────────────

// (a) The spec's own `(Sec. N)` / `(Sec. N–M)` annotations, e.g.
//     | `command`, `command_plural`, `prohibition`, `suggestion` (Sec. 3–6) |
//     A range is zipped across the row's tags in order (unknown tags skipped,
//     so a row naming a retired tag still lines up).
function sectionAnnotations(specSrc, frameTags) {
  const map = new Map()
  for (const m of specSrc.matchAll(/^\|\s*((?:`[^`]+`(?:,\s*)?\s*)+)\(Sec\.\s*(\d+)(?:\s*[–-]\s*(\d+))?[^)]*\)/gm)) {
    const tags = [...m[1].matchAll(/`([^`]+)`/g)].map(x => x[1]).filter(t => frameTags.has(t))
    const lo = parseInt(m[2], 10)
    const hi = m[3] ? parseInt(m[3], 10) : lo
    if (tags.length === 0) continue
    if (tags.length === 1) { if (!map.has(tags[0])) map.set(tags[0], lo); continue }
    if (hi - lo + 1 === tags.length) {
      tags.forEach((t, i) => { if (!map.has(t)) map.set(t, lo + i) })
    }
  }
  return map
}

// (b) The reconciled graph-frame table's `Spec §` column (added 2026-07-27):
//     | `have_construction` | ... | §36 |
function reconciledSectionColumn(specSrc, frameTags) {
  const map = new Map()
  for (const m of specSrc.matchAll(/^\|\s*`([^`\s]+)`\s*\|.*\|\s*§\s*(\d+)[^|]*\|\s*$/gm)) {
    if (frameTags.has(m[1]) && !map.has(m[1])) map.set(m[1], parseInt(m[2], 10))
  }
  return map
}

// (c) The section that documents the frame's start node as a `#### \`node\``
//     heading — the strongest structural signal for a graph-backed frame.
//     Only trusted when exactly one section documents that node: shared start
//     nodes (`ko_e_fixed` serves `ko_identification` and `time_telling`) would
//     otherwise send one of them to the other's section.
function sectionByStartNode(sections, startNode) {
  if (!startNode) return null
  const hits = sections.filter(s => new RegExp(`^####\\s+\`${startNode}\``, 'm').test(s.body))
  return hits.length === 1 ? hits[0].number : null
}

// (c2) The summary table's Category against section headings — `cleft_*` is
//      categorised "Cleft" and §19 is "Cleft and Emphatic Word Order". Only
//      used when exactly one section heading carries the category word, and
//      the category is a real word (not "Statements", which matches nothing
//      useful, or a word that half the spec uses).
function sectionByCategory(sections, category) {
  if (!category) return null
  const word = category.split(/\s+/)[0].replace(/[^A-Za-z]/g, '')
  if (word.length < 4) return null
  const re = new RegExp(`\\b${word}`, 'i')
  const hits = sections.filter(s => re.test(s.heading))
  return hits.length === 1 ? hits[0].number : null
}

// (d) Last resort: the section with the most literal `tag` mentions, outside
//     the Entry Points Summary block — and only when one section clearly
//     leads. A tie means the tag is merely cross-referenced in several places,
//     which is not evidence that any of them defines it.
function sectionByMentions(sections, tag, epSpan) {
  const counts = []
  for (const s of sections) {
    if (s.start >= epSpan[0] && s.end <= epSpan[1]) continue
    const count = (s.body.match(new RegExp('`' + tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '`', 'g')) || []).length
    if (count > 0) counts.push({ number: s.number, count })
  }
  if (counts.length === 0) return null
  counts.sort((a, b) => b.count - a.count || a.number - b.number)
  if (counts.length > 1 && counts[0].count === counts[1].count) return null
  return counts[0].number
}

// ── slot templates ────────────────────────────────────────────────────────

// (1) Graph-derived — the engine's real chain, and authoritative wherever it
//     exists. Walking the "spine" means: take the `required` edge; failing
//     that, if the node offers no FINISH terminator the sentence cannot end
//     here, so its next step is obligatory — take the first edge. Once a node
//     offers a FINISH, the mandatory chain is over and everything else is an
//     optional extension.
const isFinish = (id) => typeof id === 'string' && id.startsWith('FINISH')

function graphTemplate(graph, entry) {
  const nodes = graph.nodes
  const chain = []
  const optional = new Set()
  let cur = entry.start_node
  const seen = new Set()
  while (cur && nodes[cur] && !seen.has(cur) && chain.length < 10) {
    seen.add(cur)
    chain.push(cur)
    const next = (nodes[cur].next || []).filter(e => e.node)
    const required = next.find(e => e.required)
    const canFinish = next.some(e => isFinish(e.node))
    const step = required || (canFinish ? null : next.find(e => !isFinish(e.node)))
    for (const e of next) if (e.node !== step?.node && !isFinish(e.node)) optional.add(e.node)
    cur = step ? step.node : null
  }
  if (chain.length === 0) return null
  return {
    template: chain.map(c => `[${c}]`).join(' + '),
    optional: [...optional].filter(o => !chain.includes(o)),
    terminators: entry.allowed_terminators || [],
  }
}

// (2) Spec-diagram-derived — the main chain line of a section's `### Graph`
//     fence, for frames the graph doesn't build.
function specDiagramTemplate(section) {
  const m = section.body.match(/###\s+Graph\s*\n+```\n([\s\S]*?)\n```/)
  if (!m) return null
  for (const line of m[1].split('\n')) {
    if (!/[→─]/.test(line)) continue
    if (/^\s/.test(line)) continue // indented continuation, not the main chain
    const steps = line
      .split(/──+→|→/)
      .map(s => s.replace(/[│┌└├┬┤─\s]+/g, ' ').trim())
      .filter(Boolean)
    if (steps.length >= 2) return { template: steps.map(s => `[${s}]`).join(' + '), optional: [], terminators: [] }
  }
  return null
}

// (3) Spec-prose fence — later sections drop the `### Graph` diagram and give
//     the pattern as a short fenced line, e.g. `ka + verb + (subject), ...`.
//     A section can host several frames (§42 hosts two, §50 three), so a fence
//     is only claimed when it opens with the frame's own start-node lexeme, or
//     when the frame is the sole occupant of the section. Otherwise the field
//     stays empty — a wrong template is worse than none.
function specProseTemplate(section, startNode, sectionFrameCount) {
  const fences = [...section.body.matchAll(/```\n([^\n`]{3,120})\n```/g)].map(m => m[1].trim())
  const candidates = fences.filter(f => f.includes('+') && !/[→─]/.test(f))
  if (candidates.length === 0) return null
  const lexeme = (startNode || '').replace(/_/g, ' ')
  const own = lexeme && candidates.find(f => new RegExp(`^${lexeme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(f))
  if (own) return { template: own, optional: [], terminators: [], confidence: 'lexeme match' }
  if (sectionFrameCount === 1) return { template: candidates[0], optional: [], terminators: [], confidence: 'sole frame in section' }
  return null
}

// A Function-Templates "Tongan template:" bullet is a template followed by
// commentary ("… — the standard check-in. Interrogative-Paradigm §C.1 …").
// Keep the template, drop the essay: cut at the first em-dash gloss, bracketed
// source note, or sentence end.
function tidyTemplate(raw) {
  let s = raw.trim()
  s = s.replace(/\s*\[[^\]]*\]\s*$/, '')
  const cut = s.search(/\s+—\s+|\s+\(literally\b/)
  if (cut > 0) s = s.slice(0, cut)
  const stop = s.match(/\.\*?(?=\s+[A-Z*])/)
  if (stop && stop.index > 0) s = s.slice(0, stop.index + stop[0].length)
  s = s.trim()
  return s.length > 120 ? `${s.slice(0, 117)}…` : s
}

// (4) Function-Templates — for speech-act tags that live only there.
function functionTemplateBlocks(ftSrc) {
  const blocks = new Map() // tag -> { sections:Set, template:string|null }
  const lines = ftSrc.split('\n')
  let currentHeading = null
  let currentTemplate = null
  for (const line of lines) {
    const h = line.match(/^###\s+(§[A-Z]\.\d+)\s+—\s+(.*)$/)
    if (h) { currentHeading = h[1]; currentTemplate = null; continue }
    const t = line.match(/^-\s+\*\*Tongan template:\*\*\s+(.*)$/)
    if (t && currentTemplate == null) currentTemplate = tidyTemplate(t[1])
    const f = line.match(/^-?\s*\*\*Frame:\*\*\s*`([^`]+)`/)
    if (f && currentHeading) {
      if (!blocks.has(f[1])) blocks.set(f[1], { sections: new Set(), template: null })
      const b = blocks.get(f[1])
      b.sections.add(currentHeading)
      if (!b.template && currentTemplate) b.template = currentTemplate
    }
  }
  // §N's frame-tag summary table also maps prompts to tags + FT sections.
  for (const m of ftSrc.matchAll(/^\|[^|]*\|([^|]*)\|\s*(§[A-Z]\.[\d–\-.§A-Z]*)\s*\|/gm)) {
    for (const t of [...m[1].matchAll(/`([^`]+)`/g)].map(x => x[1])) {
      if (!blocks.has(t)) blocks.set(t, { sections: new Set(), template: null })
      blocks.get(t).sections.add(m[2].trim())
    }
  }
  return blocks
}

// ── disambiguators ────────────────────────────────────────────────────────
//
// The two marker choices the deep path keeps re-deriving. The RULE TEXT is
// curated (it is a linguistic fact with a citation, not something to infer);
// the ATTACHMENT is computed, so a frame added later picks up the note
// automatically.

const DISAMBIGUATORS = [
  {
    id: 'te-vs-ke',
    title: '*te* vs *ke* after *ʻikai*',
    rule: [
      '*ʻikai **te*** before a **preposed pronoun** (*u, ke, ne, nau, mau, tau, mou, na, ma, ta, mo*).',
      '*ʻikai **ke*** before a **bare verb** (weather / impersonal / noun-subject) and before the fixed *ʻi ai* of the existential.',
      'Test: if the positive sentence has a pronoun in that slot, use *te*; if it has none, use *ke*.',
    ],
    cite: 'Negation-Paradigm §A.6 (memory `feedback_drill_negation_te_ke`)',
  },
  {
    id: 'naa-vs-nae',
    title: '*naʻa* vs *naʻe* (and *te* vs *ʻe*)',
    rule: [
      '*Naʻa* pairs with **all** preposed pronouns (*Naʻá ku, Naʻá ke, Naʻá ne, Naʻa nau*…); future *te* likewise.',
      '*Naʻe* only where the next word is **not** a pronoun — negation (*naʻe ʻikai*), noun subjects, existentials; future *ʻe* likewise.',
      '*ʻOku* and *kuo* never alternate.',
    ],
    cite: 'Negation-Paradigm §J.1; grammar-spec §1 `tense_marker`; LFT Ch. 2 (memory `feedback_naa_nae_grammar`)',
  },
]

// Frames named in Negation-Paradigm §A.6's Frame column — parsed, not typed.
function teKeFramesFromParadigm(negSrc) {
  const start = negSrc.indexOf('### §A.6')
  if (start === -1) return new Set()
  const end = negSrc.indexOf('\n## ', start)
  const block = end === -1 ? negSrc.slice(start) : negSrc.slice(start, end)
  return new Set([...block.matchAll(/`([a-z_]+)`/g)].map(m => m[1]))
}

// A frame gets a marker note when the marker is a real choice inside it: the
// trigger node sits at the head of its own chain (start node or one step in),
// not merely somewhere in the graph's transitive closure — everything is
// reachable from everything there.
function markerTriggers(graph) {
  const nodes = graph.nodes
  const norm = (s) => (s || '').replace(/[ʻ‘’]/g, "'").toLowerCase()
  const tmNodes = new Set()
  const negNodes = new Set()
  for (const [id, node] of Object.entries(nodes)) {
    const words = (node.words || []).map(w => norm(w.tongan))
    if (words.some(w => w === "na'a" || w === "na'e")) tmNodes.add(id)
    if (words.some(w => w.includes("'ikai"))) negNodes.add(id)
  }
  return { tmNodes, negNodes }
}

// The frame's own mandatory chain (the same spine graphTemplate walks). A
// marker note belongs to a frame when the choice sits on that spine — the
// cleft frame reaches its tense marker three steps in, and naʻa/naʻe is very
// much its problem; a `command` never touches one.
function spineNodes(graph, entry) {
  const tpl = graphTemplate(graph, entry)
  if (!tpl) return new Set()
  return new Set(tpl.template.split(' + ').map(s => s.replace(/^\[|\]$/g, '')))
}

// ── assembly ──────────────────────────────────────────────────────────────

async function main() {
  const specSrc = await read(GRAMMAR_SPEC)
  const ftSrc = await read(FUNCTION_TEMPLATES)
  const negSrc = await read(NEGATION_PARADIGM)
  const graph = JSON.parse(await read(GRAMMAR_GRAPH))

  const { frameTags, entryPointCount } = await harvestFrameTags(specSrc)
  if (frameTags.size === 0) {
    console.error('✗ harvested 0 frame tags — grammar-spec "Entry Points Summary" is missing or renamed. Refusing to write an empty index.')
    process.exit(1)
  }

  const specLines = specSrc.split('\n')
  const sections = parseSpecSections(specLines)
  const sectionByNumber = new Map(sections.map(s => [s.number, s]))
  const epSpan = entryPointsSpan(specLines)

  const annotations = sectionAnnotations(specSrc, frameTags)
  const reconciled = reconciledSectionColumn(specSrc, frameTags)
  const ftBlocks = functionTemplateBlocks(ftSrc)
  const entries = new Map(graph.entry_points.map(e => [e.id, e]))

  // Summary-table metadata (label / category / min chapter) for every row.
  const rowMeta = new Map()
  for (const m of specSrc.matchAll(/^\|\s*`([^`\s]+)`\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*`?([^|`]*)`?\s*\|\s*(\d+)\s*\|/gm)) {
    if (!rowMeta.has(m[1])) rowMeta.set(m[1], { label: m[2].trim(), category: m[3].trim(), startNode: m[4].trim(), minChapter: parseInt(m[5], 10) })
  }

  const { tmNodes, negNodes } = markerTriggers(graph)
  const teKeFrames = teKeFramesFromParadigm(negSrc)

  const sortedTags = [...frameTags].sort((a, b) => a.localeCompare(b))

  // Pass 1 — resolve each tag's grammar-spec section. Precedence: the spec's
  // own "(Sec. N)" annotation, the reconciled table's "Spec §" column, the
  // section documenting the frame's start node, then mention count.
  const resolved = new Map()
  for (const tag of sortedTags) {
    const entry = entries.get(tag) || null
    const meta = rowMeta.get(tag) || null
    const startNode = entry?.start_node || meta?.startNode || null
    let specSection = null
    let specSource = null
    let specStrength = null
    if (annotations.has(tag)) { specSection = annotations.get(tag); specSource = 'spec "(Sec. N)" annotation'; specStrength = 'strong' }
    if (specSection == null && reconciled.has(tag)) { specSection = reconciled.get(tag); specSource = 'reconciled table "Spec §" column'; specStrength = 'strong' }
    if (specSection == null) {
      const byCat = sectionByCategory(sections, meta?.category || entry?.category)
      if (byCat != null) { specSection = byCat; specSource = `category "${meta?.category || entry?.category}" names the section` }
    }
    // Mentions-by-name outrank the start-node heading: a node can be defined
    // in a section that isn't the frame's home (`ko_e_fixed` is defined under
    // §21 but `time_telling` is taught in §26), whereas the section that names
    // the tag most is the one documenting it.
    if (specSection == null) {
      const byMention = sectionByMentions(sections, tag, epSpan)
      if (byMention != null) { specSection = byMention; specSource = 'section naming the tag most' }
    }
    if (specSection == null) {
      const byNode = sectionByStartNode(sections, startNode)
      if (byNode != null) { specSection = byNode; specSource = `start node \`${startNode}\` documented there` }
    }
    resolved.set(tag, { entry, meta, startNode, specSection, specSource, specStrength: specStrength || 'weak' })
  }

  // How many frames each section hosts — a prose fence in a shared section
  // can't be attributed without a lexeme match.
  const sectionFrameCount = new Map()
  for (const { specSection } of resolved.values()) {
    if (specSection != null) sectionFrameCount.set(specSection, (sectionFrameCount.get(specSection) || 0) + 1)
  }

  // Pass 2 — templates and disambiguators.
  const rows = sortedTags.map(tag => {
    const { entry, meta, startNode, specSection, specSource, specStrength } = resolved.get(tag)
    const section = specSection != null ? sectionByNumber.get(specSection) : null

    // Slot template — precedence: live graph, spec diagram, spec prose fence,
    // Function-Templates.
    let tpl = null
    let templateSource = null
    if (entry) { tpl = graphTemplate(graph, entry); if (tpl) templateSource = 'grammar-graph.json (live engine chain)' }
    // A section's structure may only be claimed by a frame that really lives
    // there: one resolved by the spec's own annotation / reconciled column, or
    // the section's sole occupant. A frame placed there by the weaker
    // category/mention tiers gets a §-pointer but no borrowed template.
    const mayClaimSection = section && (specStrength === 'strong' || sectionFrameCount.get(specSection) === 1)
    if (!tpl && mayClaimSection) { tpl = specDiagramTemplate(section); if (tpl) templateSource = `grammar-spec §${specSection} Graph diagram` }
    // A pattern block that opens with the frame's own lexeme identifies itself,
    // so it is accepted even in a section the frame only points at.
    if (!tpl && section) {
      const prose = specProseTemplate(section, startNode, sectionFrameCount.get(specSection))
      if (prose && (prose.confidence === 'lexeme match' || mayClaimSection)) {
        tpl = prose
        templateSource = `grammar-spec §${specSection} pattern block — ${prose.confidence}`
      }
    }
    if (!tpl && ftBlocks.get(tag)?.template) {
      tpl = { template: ftBlocks.get(tag).template, optional: [], terminators: [] }
      templateSource = 'Function-Templates "Tongan template"'
    }

    // Disambiguators.
    const spine = entry ? spineNodes(graph, entry) : new Set()
    const notes = []
    if (teKeFrames.has(tag) || [...spine].some(n => negNodes.has(n))) notes.push('te-vs-ke')
    if ([...spine].some(n => tmNodes.has(n))) notes.push('naa-vs-nae')

    const ftSections = ftBlocks.get(tag) ? [...ftBlocks.get(tag).sections].sort() : []

    return {
      tag,
      label: meta?.label || entry?.label || null,
      category: meta?.category || entry?.category || null,
      minChapter: meta?.minChapter ?? entry?.min_chapter ?? null,
      startNode,
      inGraph: !!entry,
      specSection,
      specHeading: section ? section.heading : null,
      specSource,
      template: tpl?.template || null,
      templateSource,
      optional: tpl?.optional || [],
      terminators: tpl?.terminators || [],
      ftSections,
      notes,
    }
  })

  await fs.writeFile(OUT, render(rows, { entryPointCount, total: frameTags.size }), 'utf8')

  const unresolvedSpec = rows.filter(r => r.specSection == null).length
  const unresolvedTpl = rows.filter(r => r.template == null).length
  console.log(`Wrote ${path.relative(REPO_ROOT, OUT)} — ${rows.length} frame tag(s) (${entryPointCount} entry points + ${rows.length - entryPointCount} Function-Templates tags)`)
  console.log(`  ${rows.length - unresolvedSpec}/${rows.length} resolved to a grammar-spec §; ${rows.length - unresolvedTpl}/${rows.length} have a slot template`)
}

// ── rendering ─────────────────────────────────────────────────────────────

function render(rows, stats) {
  const out = []
  out.push('# Frame Index')
  out.push('')
  out.push(`> **Generated file — do not edit.** Rebuild with \`${REGEN}\``)
  out.push('> One block per legal frame tag: where grammar-spec defines it, its slot template, and the')
  out.push('> marker disambiguators that apply. The tag set is harvested by `harvestFrameTags()` in')
  out.push('> `check-citations.mjs` — grammar-spec "Entry Points Summary" ∪ Function-Templates — so it is')
  out.push('> exactly the closed set `npm run check:style` enforces on `**Frame:**` lines.')
  out.push('>')
  out.push('> Loaded at `/translate` start so the walkthrough does not re-derive §-numbers, slot order, and')
  out.push('> the *te*/*ke* and *naʻa*/*naʻe* rules per sentence (analysis R2). It is a **pointer** layer:')
  out.push('> it says where the rule lives, not what the rule proves. Step 4 citations still open the source.')
  out.push('')
  out.push(`**${stats.total} frame tags** — ${stats.entryPointCount} from the Entry Points Summary (incl. the 2026-07-27 reconciled graph frames), ${stats.total - stats.entryPointCount} Function-Templates speech-act tags.`)
  out.push('')

  out.push('## Marker disambiguators')
  out.push('')
  for (const d of DISAMBIGUATORS) {
    out.push(`### ${d.title} — \`${d.id}\``)
    out.push('')
    for (const line of d.rule) out.push(`- ${line}`)
    out.push('')
    out.push(`Source: ${d.cite}`)
    out.push('')
    const applies = rows.filter(r => r.notes.includes(d.id)).map(r => `\`${r.tag}\``)
    out.push(`Applies to ${applies.length} frame(s): ${applies.length ? applies.join(', ') : '—'}`)
    out.push('')
  }

  out.push('## Quick table')
  out.push('')
  out.push('| Frame tag | grammar-spec § | Slot template | Notes |')
  out.push('|---|---|---|---|')
  for (const r of rows) {
    const sec = r.specSection != null ? `§${r.specSection}` : '—'
    const tpl = r.template ? `\`${r.template.replace(/\|/g, '\\|')}\`` : '—'
    const notes = r.notes.length ? r.notes.map(n => `\`${n}\``).join(', ') : '—'
    out.push(`| \`${r.tag}\` | ${sec} | ${tpl} | ${notes} |`)
  }
  out.push('')

  out.push('## Frames')
  out.push('')
  for (const r of rows) {
    out.push(`### \`${r.tag}\``)
    out.push('')
    if (r.label) out.push(`- **Does:** ${r.label}${r.category ? ` · *${r.category}*` : ''}${r.minChapter != null ? ` · from Lesson ${r.minChapter}` : ''}`)
    out.push(`- **grammar-spec:** ${r.specSection != null ? `§${r.specSection} — ${r.specHeading}` : '— (no section resolved)'}${r.specSource ? `  <sub>via ${r.specSource}</sub>` : ''}`)
    out.push(`- **Slot template:** ${r.template ? `\`${r.template}\`` : '— (not resolvable from the sources)'}${r.templateSource ? `  <sub>via ${r.templateSource}</sub>` : ''}`)
    if (r.optional.length) {
      const shown = r.optional.slice(0, 10).map(o => `\`${o}\``).join(', ')
      const more = r.optional.length > 10 ? ` … +${r.optional.length - 10} more` : ''
      out.push(`- **Optional extensions:** ${shown}${more}`)
    }
    if (r.terminators.length) out.push(`- **Terminators:** ${r.terminators.map(t => `\`${t}\``).join(', ')}`)
    if (r.ftSections.length) out.push(`- **Function-Templates:** ${r.ftSections.join(', ')}`)
    out.push(`- **In the live engine graph:** ${r.inGraph ? `yes (start node \`${r.startNode}\`)` : 'no — spec/Function-Templates only'}`)
    if (r.notes.length) {
      for (const id of r.notes) {
        const d = DISAMBIGUATORS.find(x => x.id === id)
        out.push(`- **Disambiguator — ${d.title}:** ${d.rule[0]} ${d.rule[1]} (${d.cite})`)
      }
    }
    out.push('')
  }

  return `${out.join('\n')}\n`
}

main().catch(err => { console.error(err); process.exit(1) })
