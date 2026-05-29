/**
 * walkthrough.js — derive a student-facing "how this sentence was built"
 * breakdown from the grammar-graph step path the builder already holds.
 *
 * This is the data layer behind the ExplainPanel disclosure. It is a PURE
 * function: no React, no DOM, no I/O. Everything it needs is already bundled
 * (grammar-graph node labels) or passed in (steps, the translation object the
 * builder computed via translateWalkerState).
 *
 * Design contract — citations:
 *   The ONLY citation source is `step.word.min_chapter` (graph data). We render
 *   that as "LFT Ch. N". We deliberately do NOT synthesize §-headings, nor cite
 *   Churchward/Shumway/Grammar-Concepts. The prose specs have a known citation-
 *   accuracy problem and reproducing those references here would propagate it.
 *   If a step has no `min_chapter`, its citation is null (the UI shows a dash).
 *
 * What this mirrors from the six-step translation walkthrough: since the student
 * composed the Tongan directly, there is no English-idiom or parts-of-speech
 * step to surface. We render the equivalent of the spec's later steps only —
 * the word-by-word Tongan gloss (rows) and the assembled sentence (literal +
 * natural). Notes, when reachable, stand in for the spec's optional notes.
 */

import { getNode } from './graph-walker'
import { matchNotes } from './note-matcher'

/**
 * Node IDs whose words are purely structural (connectors / focus markers) and
 * carry no standalone English meaning. `buildLiteralTranslation` skips these in
 * the gloss; we keep them out of the word-by-word rows for the same reason.
 * Identified from grammar-graph.json: every word at these nodes has english
 * "(connector)" or "(focus marker)".
 */
const STRUCTURAL_NODE_IDS = new Set([
  'neg_connector',
  'neg_connector_ns',
  'imp_connector',
  'focus_marker',
])

/**
 * A step is structural (and therefore omitted from the rows) when its node is
 * one of the known structural nodes OR its rendered English is a bare marker.
 * We check both so future structural words are handled even if their node id
 * isn't in the set yet.
 */
function isStructuralStep(step) {
  if (STRUCTURAL_NODE_IDS.has(step.nodeId)) return true
  const english = step?.word?.english
  return english === '(connector)' || english === '(focus marker)'
}

/**
 * Build the citation string for a step. Source of truth: word.min_chapter only.
 * Returns "LFT Ch. N" or null when the chapter is absent/invalid.
 */
function citationFor(step) {
  const ch = step?.word?.min_chapter
  if (typeof ch !== 'number' || !Number.isFinite(ch)) return null
  return `LFT Ch. ${ch}`
}

/**
 * Human label for a single step, preferring the grammar-graph node `label`
 * (e.g. "Tense Marker", "Verb (transitive)") and falling back to a de-snaked
 * node id. Used both for the rows' implicit grouping and the slot template.
 */
function labelForStep(step) {
  const node = getNode(step.nodeId)
  if (node?.label) return node.label
  return step.nodeId.replace(/_/g, ' ')
}

/**
 * Frame name + category for the sentence type. Best-effort: we read the entry
 * point object the builder passes (its `label`/`category` come straight from
 * grammar-graph.json entry_points). When no entry point is available we leave
 * the name null rather than fabricate one.
 *
 * @param {object|null} entryPoint - the grammar-graph entry_point object
 */
function deriveFrameName(entryPoint) {
  if (!entryPoint) return null
  // Prefer the descriptive label ("Make a statement"); fall back to category.
  return entryPoint.label || entryPoint.category || null
}

/**
 * Build a slot template by joining the meaningful step labels in order, e.g.
 * "[Tense Marker] + [Pronoun] + [Verb] + [Object]". Structural connector/focus
 * steps are dropped so the template reads like the grammar frame, not the
 * surface string. Returns '' when there are no meaningful steps.
 */
function buildTemplate(steps) {
  const parts = steps
    .filter(s => !isStructuralStep(s))
    .map(s => `[${labelForStep(s)}]`)
  return parts.join(' + ')
}

/**
 * deriveWalkthrough — pure builder for the ExplainPanel.
 *
 * @param {Array} steps        flat step array: [{ nodeId, word: { tongan, english, min_chapter, ... } }, ...]
 * @param {object} translation the object returned by translate()/translateWalkerState():
 *                             { text, literal, method }
 * @param {object} [opts]
 * @param {object} [opts.entryPoint] grammar-graph entry_point object (for the frame name)
 * @param {number} [opts.chapter]    current chapter level, used to gate notes
 *
 * @returns {{
 *   frame: { name: string|null, template: string },
 *   rows: Array<{ tongan: string, english: string, label: string, citation: string|null }>,
 *   assembled: { text: string, literal: string },
 *   notes: Array,
 *   method: string
 * }}
 */
export function deriveWalkthrough(steps, translation, opts = {}) {
  const safeSteps = Array.isArray(steps) ? steps : []
  const { entryPoint = null, chapter = null } = opts

  const meaningfulSteps = safeSteps.filter(s => s && s.word && !isStructuralStep(s))

  const rows = meaningfulSteps.map(step => ({
    tongan: step.word.tongan ?? '',
    english: step.word.english ?? '',
    label: labelForStep(step),
    citation: citationFor(step),
  }))

  const text = translation?.text ?? ''
  const literal = translation?.literal ?? ''
  const method = translation?.method ?? 'none'

  // Notes are best-effort: matchNotes is a pure lookup over bundled
  // grammar-notes.json. Gate on chapter exactly like GrammarNotePanel does.
  // If chapter is unknown we pass a high ceiling so chapter-min filters still
  // pass for whatever the student built; matchNotes itself caps at 3.
  let notes = []
  try {
    notes = matchNotes(safeSteps, typeof chapter === 'number' ? chapter : 999) || []
  } catch {
    notes = []
  }

  return {
    frame: {
      name: deriveFrameName(entryPoint),
      template: buildTemplate(meaningfulSteps),
    },
    rows,
    assembled: { text, literal },
    notes,
    method,
  }
}
