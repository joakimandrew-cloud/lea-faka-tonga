import grammarGraph from '../data/grammar-graph.json'
import verbForms from '../data/verb-forms.json'

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

/**
 * Get available entry points for a given chapter level.
 */
export function getEntryPoints(chapter) {
  return grammarGraph.entry_points.filter(ep => ep.min_chapter <= chapter)
}

/**
 * Get a node definition from the grammar graph.
 */
export function getNode(nodeId) {
  return grammarGraph.nodes[nodeId] || null
}

/**
 * Get the available words for a node, filtered by chapter and constraints.
 * @param {string} nodeId - The node to get words for
 * @param {number} chapter - Current chapter level
 * @param {Array} steps - The sentence built so far [{nodeId, word}, ...]
 */
export function getAvailableWords(nodeId, chapter, steps) {
  const node = grammarGraph.nodes[nodeId]
  if (!node) return []

  let words = node.words.filter(w => w.min_chapter <= chapter)

  // Apply constraints (dependency filtering)
  if (node.constraints) {
    const { depends_on, valid_combinations } = node.constraints
    // depends_on can be a string or array of node IDs
    const depIds = Array.isArray(depends_on) ? depends_on : [depends_on]
    const depStep = steps.find(s => depIds.includes(s.nodeId))
    if (depStep && valid_combinations) {
      const depKey = normalize(depStep.word.tongan)
      for (const [key, validValues] of Object.entries(valid_combinations)) {
        if (normalize(key) === depKey) {
          words = words.filter(w => validValues.includes(w.tongan))
          break
        }
      }
    }
  }

  // Phase 2A.3: word_filter applies Rule 3 complement_prep restriction.
  // When a verb earlier in the sentence declares `complement_prep: "ki-family"`
  // (or similar), the preposition node only exposes words from that family.
  // This is what makes it impossible to construct ungrammatical pairings
  // like `lea ki Sione` — the walker never offers `ki` after a verb that
  // requires `ki-family`, so the user's only legal choice is the ki/kia/
  // ki he/kiate form that matches the noun class at render time.
  if (node.word_filter && node.word_filter.type === 'requires_complement_prep') {
    const verbStep = findHeadVerbStep(steps)
    const requiredFamily = verbStep && verbStep.word && verbStep.word.complement_prep
    // Phase 2E.6: only apply complement_prep filter on the FIRST preposition
    // visit. Subsequent visits (dual preposition, Ch 46) are locative
    // additions that aren't constrained by the verb's complement requirement.
    const alreadyHasPrep = steps.some(s => s.nodeId === 'preposition')
    if (requiredFamily && !alreadyHasPrep) {
      words = words.filter(w => w.family === requiredFamily)
    }
  }

  // B2: de-dup at the same node. Drops any word already chosen at THIS node id
  // earlier in the sentence, so a companion chain can't repeat a name
  // (`mo Sione mo Sione`). Distinct companions (`mo Sione mo Mele`) are fine.
  if (node.word_filter && node.word_filter.type === 'no_repeat_at_node') {
    const used = new Set(
      steps.filter(s => s.nodeId === nodeId && s.word).map(s => normalize(s.word.tongan))
    )
    words = words.filter(w => !used.has(normalize(w.tongan)))
  }

  // B3: in a dual-preposition phrase, forbid repeating the SAME (preposition,
  // complement) pair — `ʻi ʻapi ʻi ʻapi` is empty repetition. A different
  // complement under the same prep (`ʻi he fale … ʻi Lonitoni`) or the same
  // complement under a different prep (`mei he potu ki he potu`) stay legal.
  if (node.word_filter && node.word_filter.type === 'no_duplicate_prep_complement') {
    // Build prior (prepWord → complementWord) pairs and find the preposition
    // governing the slot now being filled (the most recent `preposition` step).
    let lastPrep = null
    const priorPairs = new Set()
    let currentPrep = null
    for (const s of steps) {
      if (s.nodeId === 'preposition' && s.word) { lastPrep = normalize(s.word.tongan); currentPrep = lastPrep }
      else if (s.nodeId === nodeId && s.word && lastPrep != null) {
        priorPairs.add(lastPrep + '|' + normalize(s.word.tongan))
        lastPrep = null // pair consumed; the next prep opens a new pair
      }
    }
    if (currentPrep != null) {
      words = words.filter(w => !priorPairs.has(currentPrep + '|' + normalize(w.tongan)))
    }
  }

  return words
}

/**
 * Find the most recent verb step (main verb of the current clause). Used by
 * the Phase 2A.3 complement_prep filter and by the prep_phrase renderer to
 * resolve which preposition family applies.
 *
 * The Ch 1–15 grammar has multiple verb node ids (verb, verb_ns, verb_kohai,
 * command_verb, prohibition_verb, verb_experiencer, verb_weather). For 2A.3
 * we only need the main `verb` id — the other paths don't take prep_phrase
 * extensions with noun-class auto-rendering yet. This list grows as
 * subsequent sub-batches extend more paths.
 */
const VERB_NODE_IDS = ['verb', 'verb_tr', 'verb_cleft', 'verb_ns', 'verb_experiencer', 'verb_kohai']

function findHeadVerbStep(steps) {
  // Phase 2C.1 full: the walker now has several verb-bearing nodes. All of
  // them should participate in complement_prep filtering and verb_has_tag
  // gating. verb_tr (§16) and verb_cleft (§19) are the 2C.1 additions; the
  // 2A.5 slice established that findHeadVerbStep returns the MOST RECENT
  // verb so sub-clauses pick up their own clause's verb instead of the main
  // clause's verb.
  for (let i = steps.length - 1; i >= 0; i--) {
    if (VERB_NODE_IDS.includes(steps[i].nodeId)) return steps[i]
  }
  return null
}

// Clause connector edges — the set of extension targets that start a new
// clause. They share two properties: their `child_entry_point` initiates a
// fresh statement-like sub-walk, and they semantically attach to the CLAUSE
// root's main verb (not to whatever sub-phrase the user happens to be in).
// `getExtensionMenu` surfaces these from any descendant frame once the
// clause has a verb, and `takeExtension` auto-pops to the clause root
// before pushing the new clause frame so the connectors' parent position
// matches the grammar.
const CLAUSE_CONNECTOR_NODES = new Set([
  'clause_connector_he',
  'clause_connector_ka',
  'clause_connector_kae',
  'clause_connector_pea',
  'clause_connector_pea_serial',
  'clause_connector_o',
  'subordinator_kapau',
  'subordinator_lolotonga',
  'subordinator_ke_purpose',
  'subordinator_koeuhi_ke',
])

// P1-A3: clause-completion nodes that are NOT verbs but carry the
// clause-connector edges for their construction. A command clause completes
// at `command_verb`, a noun-subject clause at `noun_subject_name`, and a
// prohibition at `prohibition_verb` — none of which are VERB_NODE_IDS, so
// getClauseConnectorEdges reads connectors from these completion nodes too
// (not just the clause's main verb).
// P1-A1: the experiencer clause (`ʻOku mahino kiate au`) completes at
// `prep_pronoun` — its experiencer pronoun is the required final slot — so
// the connectors hang there (verb_experiencer is a VERB_NODE_ID but carries
// no connector edges; the real completion node is prep_pronoun).
const CLAUSE_COMPLETION_NODE_IDS = new Set([
  'command_verb',
  'command_verb_plural',
  'noun_subject_name',
  'prohibition_verb',
  'prep_pronoun',
])

// Walk the stack top-down to find the current clause's root frame. A new
// clause starts whenever a frame was pushed via a clause connector edge
// (parentExtension is in CLAUSE_CONNECTOR_NODES). Anything above that frame
// belongs to the NEW clause; anything below belongs to the outer clause.
// The walker's root frame (index 0) is always a clause root.
function findClauseRootFrame(state) {
  for (let i = state.frames.length - 1; i >= 1; i--) {
    if (CLAUSE_CONNECTOR_NODES.has(state.frames[i].parentExtension)) {
      return { frame: state.frames[i], depth: i }
    }
  }
  return { frame: state.frames[0], depth: 0 }
}

// Compute the connector edges that attach to a given clause root's
// completion node (its main verb, or a command/noun-subject/prohibition
// completion node), filtered by chapter/conditions and hiding anything
// already in extensionsTaken. Returns [] if the clause root has no such
// source node yet (i.e. hasn't reached a verb / completion node).
function getClauseConnectorEdges(state) {
  const { frame: clauseRoot } = findClauseRootFrame(state)
  // The connectors that close a clause live on its completion node. For
  // statements / negation / noun-subject-via-verb / transitive / cleft that
  // node is the main verb (VERB_NODE_IDS). For commands, noun-subject, and
  // prohibitions (P1-A3) the connectors sit on a dedicated completion node
  // (command_verb / noun_subject_name / prohibition_verb) that is NOT a verb.
  // Collect from every such source node present in the clause root's path so
  // the connectors surface from any descendant sub-frame, keyed off the
  // clause root exactly as the verb-only version did.
  const sourceNodeIds = []
  for (const step of clauseRoot.path) {
    if (
      (VERB_NODE_IDS.includes(step.nodeId) || CLAUSE_COMPLETION_NODE_IDS.has(step.nodeId)) &&
      !sourceNodeIds.includes(step.nodeId)
    ) {
      sourceNodeIds.push(step.nodeId)
    }
  }
  if (sourceNodeIds.length === 0) return []

  const flatSteps = getFlatSteps(state)
  const seen = new Set()
  const out = []
  for (const nodeId of sourceNodeIds) {
    const node = grammarGraph.nodes[nodeId]
    if (!node || !node.next) continue
    for (const edge of node.next) {
      if (!CLAUSE_CONNECTOR_NODES.has(edge.node)) continue
      if (seen.has(edge.node)) continue
      if (edge.min_chapter > state.chapter) continue
      if (!evaluateCondition(edge.condition, flatSteps)) continue
      if (clauseRoot.extensionsTaken.includes(edge.node)) continue
      seen.add(edge.node)
      out.push(edge)
    }
  }
  return out
}

// ============================================================================
// P1-A4 — adjuncts_hub surfacing (behind meta.useAdjunctHub)
// ============================================================================
//
// The single `adjuncts_hub` reference node (grammar-graph.json) holds the
// verified union of the optional post-verbal adjunct targets. Nodes flagged
// `route_to_hub: true` surface those edges in their extension menu via
// getHubExtensions — widening the §A "single-option tail" menus on sparse
// verb / clause-completion nodes (command_verb, verb_kohai, prohibition_verb,
// noun_subject_name, the post-verbal adjunct phrases, etc.) without re-authoring
// each edge per node. This is the menu-layer half of the recommended direction
// (plans/Terminal-Build-Analysis.md §3/§4 A4); the structural "stop anchoring on
// the last node" rewrite (§P2) is deferred.
//
// Four targets are PLACEMENT-BOUND — they are grammatical only beside a specific
// host (the emphatic pronoun must abut the verb phrase; ʻe+cardinal counts an
// object noun; the possessor and attributive adjective attach to a noun
// complement). For those, the hub surfaces an edge ONLY where the anchor already
// lists it natively, so the hub adds ZERO new reachability for them — it cannot
// reintroduce the §B placement leaks (`Kai ʻi ʻapi au`, a count with no noun,
// etc.). The remaining seven (modifier, time_word, preposition, mo_fixed,
// benefactive ×2, aspect_marker_post_frequency) surface freely, each gated by its
// own copied condition (the modifier cap and the prep / companion visit caps come
// across verbatim, so the §B repetition leaks stay closed too).
const HUB_NODE_ID = 'adjuncts_hub'
const HUB_PLACEMENT_BOUND_TARGETS = new Set([
  'postposed_pronoun',
  'numeral',
  'possessor_preposition',
  'attributive_adjective',
])

// Compute the adjuncts_hub edges visible at the current frame's anchor, when
// that anchor node is flagged route_to_hub and the clause is already completable
// there. Filtered by chapter + edge condition + clause-scoped extensionsTaken +
// per-target placement licensing. Returns [] when the flag is off, the anchor
// isn't routed, or the anchor isn't a completion point.
function getHubExtensions(state) {
  if (!grammarGraph.meta || !grammarGraph.meta.useAdjunctHub) return []
  const frame = currentFrame(state)
  const tail = frame.extensionMenuAnchor
  if (!tail) return []
  const anchorNode = grammarGraph.nodes[tail]
  if (!anchorNode || !anchorNode.route_to_hub) return []
  const hub = grammarGraph.nodes[HUB_NODE_ID]
  if (!hub || !Array.isArray(hub.next)) return []

  const flatSteps = getFlatSteps(state)

  // Only surface adjuncts where the clause can already FINISH. This keeps the
  // hub out of branching / required-slot states (e.g. verb_ns before its
  // subject), where an "optional" adjunct would wrongly substitute for the
  // forced continuation.
  const anchorEdges = getAvailableEdges(tail, state.chapter, flatSteps)
  if (!anchorEdges.some(isTerminatorEdge)) return []

  // De-dup against everything already taken in the CURRENT clause's frame chain
  // (clause root outward), matching getClauseConnectorEdges' clause scoping. An
  // edge with its own repetition rule (count / visit caps) is exempt — its
  // condition decides when it disappears.
  const { depth: clauseDepth } = findClauseRootFrame(state)
  const takenInClause = new Set()
  for (let i = clauseDepth; i < state.frames.length; i++) {
    for (const t of state.frames[i].extensionsTaken) takenInClause.add(t)
  }

  // Targets the anchor already lists natively — used to license the
  // placement-bound targets to hosts that already carry them.
  const nativeTargets = new Set(anchorEdges.map(e => e.node))

  const out = []
  const seen = new Set()
  for (const edge of hub.next) {
    if (seen.has(edge.node)) continue
    if (edge.min_chapter > state.chapter) continue
    if (!evaluateCondition(edge.condition, flatSteps)) continue
    if (!hasOwnRepetitionRule(edge) && takenInClause.has(edge.node)) continue
    if (HUB_PLACEMENT_BOUND_TARGETS.has(edge.node) && !nativeTargets.has(edge.node)) continue
    seen.add(edge.node)
    out.push(edge)
  }
  return out
}

/**
 * Get available next edges from a node, filtered by chapter and conditions.
 * @param {string} nodeId - The current node
 * @param {number} chapter - Current chapter level
 * @param {Array} steps - The sentence built so far [{nodeId, word}, ...]
 */
export function getAvailableEdges(nodeId, chapter, steps) {
  const node = grammarGraph.nodes[nodeId]
  if (!node) return []

  return node.next
    .filter(edge => edge.min_chapter <= chapter)
    .filter(edge => evaluateCondition(edge.condition, steps))
}

/**
 * Legacy: check whether the sentence has reached a completable state.
 * True if any terminator edge (FINISH_STATEMENT / FINISH_QUESTION) is available.
 *
 * Phase 2A.2 renamed FINISH → FINISH_STATEMENT / FINISH_QUESTION; this helper
 * still exists so the linear-steps DynamicBuilder UI keeps compiling, but
 * new code should use {@link getAvailableTerminators} on a walker state.
 */
export function canFinish(nodeId, chapter, steps) {
  const edges = getAvailableEdges(nodeId, chapter, steps)
  return edges.some(e => isTerminatorEdge(e))
}

/**
 * Check if a specific edge is required (i.e., must be taken before FINISH is available).
 */
export function hasRequiredEdge(nodeId, chapter, steps) {
  const edges = getAvailableEdges(nodeId, chapter, steps)
  return edges.some(e => e.required)
}

/**
 * Get only the non-terminator edges (for the branching panel buttons).
 */
export function getBranchingOptions(nodeId, chapter, steps) {
  return getAvailableEdges(nodeId, chapter, steps).filter(e => !isTerminatorEdge(e))
}

/**
 * Get all entry points regardless of chapter (for free-build mode).
 */
export function getAllEntryPoints() {
  return grammarGraph.entry_points
}

/**
 * Build a first-word index for the word-first free build mode.
 * Groups all possible first words across all entry points, deduplicating
 * shared words and tracking which entry points each word can start.
 * Each entry point stores its own start_node so the correct nodeId is used.
 * @param {number} chapter - Max chapter level (999 for free mode)
 * @returns {Array} [{word, entryPoints: [{...ep, startNodeId}], category}]
 */
export function getFirstWords(chapter) {
  const index = {}
  const entryPoints = chapter === 999
    ? grammarGraph.entry_points
    : grammarGraph.entry_points.filter(ep => ep.min_chapter <= chapter)

  for (const ep of entryPoints) {
    const node = grammarGraph.nodes[ep.start_node]
    if (!node) continue
    const words = chapter === 999
      ? node.words
      : node.words.filter(w => w.min_chapter <= chapter)

    for (const word of words) {
      const key = normalize(word.tongan)
      if (!index[key]) {
        index[key] = { word, entryPoints: [], category: ep.category }
      }
      // Store the entry point with its specific startNodeId
      if (!index[key].entryPoints.some(e => e.id === ep.id)) {
        index[key].entryPoints.push({ ...ep, startNodeId: ep.start_node })
      }
    }
  }

  return Object.values(index)
}

/**
 * Curated first-word index for the open / free-build entry surface.
 * Identical to {@link getFirstWords} but excludes imperative/hortative
 * entry points (Commands category) — those are surfaced through the
 * dedicated guided wizards rather than the open-build first-word picker.
 *
 * Items whose only remaining entry point would be a Commands flow are
 * dropped entirely so they don't appear with empty entryPoints arrays.
 *
 * @param {number} chapter - Max chapter level (999 for free mode)
 * @returns {Array} [{word, entryPoints: [{...ep, startNodeId}], category}]
 */
export function getFreeFirstWords(chapter) {
  return getFirstWords(chapter)
    .map(item => ({
      ...item,
      entryPoints: item.entryPoints.filter(
        ep => ep.category !== 'Commands' && ep.category !== 'Subordinate'
      ),
    }))
    .filter(item => item.entryPoints.length > 0)
}

/**
 * Get road preview examples for a given first word (normalized key).
 * @param {string} tongan - The Tongan word to look up
 * @returns {Array} [{path, english, leads_to}]
 */
export function getRoadPreviews(tongan) {
  if (!grammarGraph.road_previews) return []
  const key = normalize(tongan)
  return grammarGraph.road_previews[key] || []
}

/**
 * Build candidate paths for a first word that maps to multiple entry points.
 * Each candidate tracks its own entry point, accumulated steps, and current node.
 * @param {object} firstWordItem - From getFirstWords(): { word, entryPoints }
 * @param {number} chapter - Max chapter level (999 for free mode)
 * @returns {Array} [{entryPoint, currentNodeId, steps, phase}]
 */
export function buildCandidates(firstWordItem, chapter) {
  const candidates = []
  for (const ep of firstWordItem.entryPoints) {
    const startNode = ep.startNodeId || ep.start_node
    const steps = [{ nodeId: startNode, word: firstWordItem.word }]
    const { nodeId, phase } = computeNextFromEdges(startNode, chapter, steps)
    candidates.push({ entryPoint: ep, currentNodeId: nodeId, steps, phase })
  }
  return candidates
}

/**
 * Get merged available words across all candidate paths.
 * Deduplicates by normalized Tongan text, tracking which candidates each word belongs to.
 * @param {Array} candidates - From buildCandidates or advanceCandidates
 * @param {number} chapter
 * @returns {{words: Array, isResolved: boolean, resolvedCandidate: object|null}}
 */
export function getUnifiedNextWords(candidates, chapter) {
  const selectingCandidates = candidates.filter(c => c.phase === 'selecting' && c.currentNodeId)
  if (selectingCandidates.length === 0) {
    return { words: [], isResolved: candidates.length <= 1, resolvedCandidate: candidates[0] || null }
  }
  if (candidates.length === 1) {
    const c = candidates[0]
    const words = c.currentNodeId ? getAvailableWords(c.currentNodeId, chapter, c.steps) : []
    const node = c.currentNodeId ? getNode(c.currentNodeId) : null
    return {
      words: words.map(w => ({ ...w, _candidateIndices: [0] })),
      nodeLabel: node?.label || null,
      nodeDescription: node?.description || null,
      isResolved: true,
      resolvedCandidate: c
    }
  }

  const merged = {}
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    if (!c.currentNodeId || c.phase !== 'selecting') continue
    const words = getAvailableWords(c.currentNodeId, chapter, c.steps)
    for (const w of words) {
      const key = normalize(w.tongan)
      if (!merged[key]) {
        merged[key] = { ...w, _candidateIndices: [] }
      }
      if (!merged[key]._candidateIndices.includes(i)) {
        merged[key]._candidateIndices.push(i)
      }
    }
  }

  return { words: Object.values(merged), nodeLabel: null, nodeDescription: null, isResolved: false, resolvedCandidate: null }
}

/**
 * Advance candidates by filtering out those where the selected word isn't valid,
 * then pushing the step and computing the next state for each survivor.
 * @param {Array} candidates
 * @param {object} selectedWord - The word object the user selected
 * @param {number} chapter
 * @returns {Array} Updated candidates (may be fewer than input)
 */
export function advanceCandidates(candidates, selectedWord, chapter) {
  const selectedKey = normalize(selectedWord.tongan)
  const surviving = []

  for (const c of candidates) {
    if (!c.currentNodeId || c.phase !== 'selecting') continue
    const words = getAvailableWords(c.currentNodeId, chapter, c.steps)
    const match = words.find(w => normalize(w.tongan) === selectedKey)
    if (!match) continue

    const newSteps = [...c.steps, { nodeId: c.currentNodeId, word: match }]
    const { nodeId, phase } = computeNextFromEdges(c.currentNodeId, chapter, newSteps)
    surviving.push({ ...c, steps: newSteps, currentNodeId: nodeId, phase })
  }

  return surviving
}

/**
 * Determine sentence completeness at a given node.
 * @returns {'incomplete'|'completable'|'terminal'}
 */
export function getSentenceCompleteness(nodeId, chapter, steps) {
  const edges = getAvailableEdges(nodeId, chapter, steps)
  const hasFinish = edges.some(e => isTerminatorEdge(e))
  const nonFinish = edges.filter(e => !isTerminatorEdge(e))
  const hasRequired = nonFinish.some(e => e.required)

  if (!hasFinish || hasRequired) return 'incomplete'
  if (nonFinish.length === 0) return 'terminal'
  return 'completable'
}

/**
 * Resolve template variables in an edge's context_hint string.
 * Supported: {subject}, {verb_base}, {verb_past}, {tense}
 * @param {string} template - The context_hint template
 * @param {Array} steps - Current sentence steps
 * @returns {string|null} Resolved hint, or null if no template
 */
export function resolveContextHint(template, steps) {
  if (!template) return null

  const pronounStep = steps.find(s => s.word && s.word.subject)
  const subject = pronounStep ? pronounStep.word.subject : ''

  const verbNodeIds = ['verb', 'verb_ns', 'command_verb', 'command_verb_plural',
    'prohibition_verb', 'verb_kohai', 'verb_experiencer', 'verb_weather']
  const verbStep = steps.find(s => verbNodeIds.includes(s.nodeId))

  let verbBase = '', verbPast = ''
  if (verbStep) {
    const verbKey = normalize(verbStep.word.tongan)
    const form = Object.entries(verbForms.verbs).find(
      ([k]) => normalize(k) === verbKey
    )
    if (form) {
      verbBase = form[1].base
      verbPast = form[1].past
    } else {
      verbBase = verbStep.word.english
      verbPast = verbStep.word.english
    }
  }

  const tenseStep = steps.find(s => s.nodeId && s.nodeId.startsWith('tense_marker'))
  const tense = tenseStep ? tenseStep.word.english : ''

  return template
    .replace(/\{subject\}/g, subject)
    .replace(/\{verb_base\}/g, verbBase)
    .replace(/\{verb_past\}/g, verbPast)
    .replace(/\{tense\}/g, tense)
}

/**
 * Compute next nodeId and phase from edges (shared logic for candidate advancement).
 */
function computeNextFromEdges(nodeId, chapter, steps) {
  const edges = getAvailableEdges(nodeId, chapter, steps)
  const nonFinish = edges.filter(e => !isTerminatorEdge(e))
  const required = nonFinish.filter(e => e.required)

  if (required.length === 1) {
    return { nodeId: required[0].node, phase: 'selecting' }
  } else if (nonFinish.length === 0 && edges.some(e => isTerminatorEdge(e))) {
    return { nodeId: null, phase: 'punctuation' }
  }
  return { nodeId: null, phase: 'branching' }
}

/**
 * Evaluate a condition object against the current sentence state.
 */
function evaluateCondition(condition, steps) {
  if (!condition) return true

  if (condition.type === 'verb_has_tag') {
    // Phase 2A.5 slice: scan backwards for the MOST RECENT verb step,
    // not the first one in the flat steps. In multi-clause sentences the
    // main verb is earlier than the current clause's verb (e.g. `ʻalu`
    // in the main clause vs. `fakatau` in a `ke` purpose sub-walk), and
    // the per-clause extension menu needs to reflect the current clause's
    // verb tags — so `object` (gated by verb_has_tag: transitive) appears
    // after `fakatau` even though `ʻalu` (intransitive) was the first
    // verb in the sentence. Matches the existing findHeadVerbStep
    // semantics used by Rule 3 complement_prep filtering.
    const verbStep = findHeadVerbStep(steps)
    if (!verbStep || !verbStep.word.tags) return false
    return verbStep.word.tags.includes(condition.tag)
  }

  if (condition.type === 'not_already_used') {
    const targetWord = normalize(condition.word)
    return !steps.some(s =>
      s.word && normalize(s.word.tongan) === targetWord
    )
  }

  if (condition.type === 'modifier_count_max') {
    // Count BOTH modifier node variants. The statement path loops on
    // `modifier`; the noun-subject / negation path loops on `modifier_ns`.
    // The old code counted only `'modifier'`, so the `modifier_ns` self-loop
    // (which reuses this same condition type) was never capped — letting
    // `Naʻe ʻikai ke kai lelei lelei lelei …` repeat without bound. Both
    // variants share one cap; they never co-occur in a single clause, so a
    // sentence-global count is correct here.
    const count = steps.filter(s => s.nodeId === 'modifier' || s.nodeId === 'modifier_ns').length
    return count < condition.max
  }

  if (condition.type === 'not_already_visited_node') {
    return !steps.some(s => s.nodeId === condition.node)
  }

  // Phase 2E.6: generalized node-visit counter — allows up to `max` visits
  // of the named node. Used on prep_phrase.next → preposition to allow dual
  // preposition phrases (Ch 46: "kia houʻeiki ʻi he falé").
  if (condition.type === 'node_visit_count_max') {
    const count = steps.filter(s => s.nodeId === condition.node).length
    return count < condition.max
  }

  // Phase 2A.3: true if the most recent prep_phrase / noun-bearing step has
  // the specified noun_class. Used to gate edges that depend on the class of
  // the noun the user just picked (e.g. "offer definitive accent only on
  // common nouns" in 2A.4, once that sub-batch lands).
  if (condition.type === 'noun_class_is') {
    for (let i = steps.length - 1; i >= 0; i--) {
      const w = steps[i].word
      if (w && w.noun_class) return w.noun_class === condition.class
    }
    return false
  }

  // Phase 2A.3: true if the main verb step declares the specified
  // complement_prep family. Used to gate edges that only apply after
  // verbs with a prepositional complement (e.g. "offer a prep_phrase
  // extension right after lea/sio/fanongo").
  if (condition.type === 'requires_complement_prep') {
    const verbStep = findHeadVerbStep(steps)
    if (!verbStep || !verbStep.word) return false
    return verbStep.word.complement_prep === condition.family
  }

  // Phase 2A.5 slice: cap the number of coordinated clauses in the
  // sentence. "Clauses" in this sense are main / contrast clauses joined
  // by §17 clause_connector_* edges (ka, kae). Subordinators like
  // `ke` purpose are dependent clauses and deliberately NOT counted —
  // they don't trip this cap. Used on the `ka` edge to enforce the spec's
  // Ch 24 constraint `clause_count_max: 2`. The root clause counts as 1,
  // so `clause_count_max: 2` permits exactly one coordinated second
  // clause. For the current slice this is also enforced by the
  // per-frame `extensionsTaken` hiding (once `ka` is taken it's hidden
  // from its own parent's menu regardless of this cap), so the cap is
  // effectively future-proofing for when `kae` joins the data — the two
  // connectors will share the count.
  if (condition.type === 'clause_count_max') {
    // Phase 2C.1 full: extend the coordination cap to include the §17 pea
    // connector and the §18 subordinators (kapau, lolotonga). Every edge
    // tagged `clause_count_max` participates in the same sentence-wide cap
    // so the walker can't stack more clauses than the spec allows (Ch 24
    // introduces the 2-clause cap; later chapters may raise it).
    const count = 1 + steps.filter(s =>
      s.nodeId === 'clause_connector_ka' ||
      s.nodeId === 'clause_connector_kae' ||
      s.nodeId === 'clause_connector_pea' ||
      s.nodeId === 'clause_connector_pea_serial' ||
      s.nodeId === 'clause_connector_o' ||
      s.nodeId === 'subordinator_kapau' ||
      s.nodeId === 'subordinator_lolotonga'
    ).length
    return count < condition.max
  }

  return true
}

// ============================================================================
// Phase 2A.1 — Stack-based walker (extension menu return)
// ============================================================================
//
// Cross-Cutting Rule 1: Extensions do not consume each other.
//
// The walker maintains a STACK of frames. A frame is a single linear sub-walk
// (e.g. the main clause, or a prep_phrase sub-walk, or a time_word sub-walk).
// When the user takes an extension, the walker pushes a new frame for the
// extension's sub-graph; that frame walks to its own IN_PROGRESS state; the
// caller invokes finishFrame() to pop and splice the sub-walk's path back
// into the parent frame, returning the user to the parent's extension menu
// so additional extensions can be added.
//
// This new API lives ALONGSIDE the legacy linear-steps API
// (getAvailableWords / getAvailableEdges / canFinish / buildCandidates /
// advanceCandidates / getFirstWords / getFreeFirstWords) which the
// UnifiedFirstWordPicker and the guided wizards still use. See
// spec/Phase-2-Engine-Plan.md §2A.1 risk #1 for the rationale: a parallel
// surface keeps Ch 1–15 first-word flows working unchanged while the open
// builder consumes the new stack walker.
//
// State shape (NEW — distinct from the legacy linear `steps` array):
//
//   walkerState = {
//     chapter:    999,             // chapter level (999 == free mode)
//     finished:   false,           // true once finishWalker has been called
//     terminator: null,            // the chosen FINISH-style edge (2A.2)
//     translation: {},             // translator-side flags (populated by 2A.2+)
//     frames: [                    // stack of frames (top = innermost sub-walk)
//       {
//         entryPoint:          'statement',
//         startNodeId:         'tense_marker',
//         currentNodeId:       'pronoun' | null,    // null when frame is IN_PROGRESS
//         extensionMenuAnchor: 'verb'   | null,     // node whose `next` defines the menu
//         extensionsTaken:     ['preposition'],     // extension targets already taken from this frame
//         parentExtension:     'preposition' | null,// the extension that pushed this frame (null on root)
//         path: [
//           { nodeId: 'tense_marker', word: { tongan: 'Naʻa', ... } },
//           { nodeId: 'pronoun',      word: { tongan: 'ku',    ... } },
//           { nodeId: 'verb',         word: { tongan: 'ʻalu',  ... } },
//         ],
//       },
//     ],
//   }
//
// Status semantics: walkerStatus(state) returns one of
//   'SELECTING'   — the current frame's currentNodeId is non-null; the user
//                   must pick a word for that required slot before anything else.
//   'IN_PROGRESS' — the current frame's required slot is filled and the
//                   extension menu is visible (extensions + terminators).
//   'FINISHED'    — finishWalker has been called; no further mutation allowed.
//
// All mutation functions return a NEW state object (frames and frame objects
// are reconstructed) so React consumers can rely on reference equality for
// re-renders.

/**
 * Initialize a new stack-based walker state for an entry point.
 *
 * @param {string} entryPointId - Entry point id (e.g. 'statement', 'negation')
 * @param {number} chapter - Chapter level (use 999 for free mode)
 * @returns {object} A fresh walker state with one frame on the stack
 */
export function createWalkerState(entryPointId, chapter) {
  const ep = grammarGraph.entry_points.find(e => e.id === entryPointId)
  if (!ep) {
    throw new Error(`Unknown entry point: "${entryPointId}"`)
  }
  return {
    chapter,
    finished: false,
    terminator: null,
    translation: {},
    frames: [
      makeFrame({
        entryPoint: entryPointId,
        startNodeId: ep.start_node,
        currentNodeId: ep.start_node,
        parentExtension: null,
      }),
    ],
  }
}

function makeFrame({ entryPoint, startNodeId, currentNodeId, parentExtension }) {
  return {
    entryPoint,
    startNodeId,
    currentNodeId,
    extensionMenuAnchor: null,
    extensionsTaken: [],
    parentExtension,
    path: [],
  }
}

/**
 * Return the top frame on the walker stack (the innermost sub-walk in flight).
 */
export function currentFrame(state) {
  return state.frames[state.frames.length - 1]
}

/**
 * Flatten every frame's path into a single linear `steps` array, ordered from
 * the root frame outward. Used to evaluate the legacy condition functions
 * (verb_has_tag, modifier_count_max, not_already_visited_node) against the
 * walker's full history regardless of frame nesting.
 */
export function getFlatSteps(state) {
  const out = []
  for (const frame of state.frames) {
    for (const step of frame.path) out.push(step)
  }
  return out
}

/**
 * Walker status: 'SELECTING' | 'IN_PROGRESS' | 'FINISHED'.
 */
export function getWalkerStatus(state) {
  if (state.finished) return 'FINISHED'
  const frame = currentFrame(state)
  return frame.currentNodeId !== null ? 'SELECTING' : 'IN_PROGRESS'
}

/**
 * Get the available words for the current frame's required slot.
 * Returns [] if the frame is not in SELECTING.
 */
export function getCurrentFrameWords(state) {
  if (state.finished) return []
  const frame = currentFrame(state)
  if (!frame.currentNodeId) return []
  return getAvailableWords(frame.currentNodeId, state.chapter, getFlatSteps(state))
}

/**
 * Pick a word for the current frame's required slot. Returns a NEW state.
 *
 * Throws if the walker is finished, the frame has no pending required slot,
 * or the supplied word isn't among the available words for that slot.
 *
 * After advancing, the frame's `extensionMenuAnchor` is set to the node that
 * was just filled (its `next` edges define the next extension menu), and the
 * frame's `currentNodeId` is recomputed from the just-filled node's required
 * `next` edges:
 *   - exactly one required edge → currentNodeId = that target (still SELECTING)
 *   - zero required edges       → currentNodeId = null (frame moves to IN_PROGRESS)
 */
export function advanceInFrame(state, word) {
  if (state.finished) {
    throw new Error('Walker is finished; cannot advance')
  }
  const frame = currentFrame(state)
  if (!frame.currentNodeId) {
    throw new Error('No required slot pending in current frame')
  }

  const flatSteps = getFlatSteps(state)
  const available = getAvailableWords(frame.currentNodeId, state.chapter, flatSteps)
  const match = available.find(w => normalize(w.tongan) === normalize(word.tongan))
  if (!match) {
    throw new Error(
      `Word "${word.tongan}" is not available at node "${frame.currentNodeId}"`
    )
  }

  const justFilled = frame.currentNodeId
  const newPath = [...frame.path, { nodeId: justFilled, word: match }]

  // Recompute the next required slot from the just-filled node's edges,
  // using the post-step flat view so any depends_on conditions resolve
  // against the freshly added step.
  const postFlat = [...flatSteps, { nodeId: justFilled, word: match }]
  const edges = getAvailableEdges(justFilled, state.chapter, postFlat)
  const required = edges.filter(e => e.required)
  const nonFinishEdges = edges.filter(e => !isTerminatorEdge(e))
  const hasFinish = edges.some(e => isTerminatorEdge(e))
  let nextRequired = null
  if (required.length === 1) {
    // Explicit required edge — auto-advance.
    nextRequired = required[0].node
  } else if (!hasFinish && nonFinishEdges.length === 1) {
    // Forced linear continuation: there's exactly one way forward and no
    // option to FINISH yet. Treat as required even if the data didn't mark
    // it that way. This handles the Ch 1 pronoun→verb case where
    // preposed_modifier is still locked and verb is the only legal next step.
    nextRequired = nonFinishEdges[0].node
  }
  // Multi-required edges are not represented in the Ch 1–15 grammar. If two
  // or more required edges ever appear at the same node the walker will
  // fall through to IN_PROGRESS and the user will get stuck — flag and
  // extend here when the data actually requires it.

  const updatedFrame = {
    ...frame,
    path: newPath,
    extensionMenuAnchor: justFilled,
    currentNodeId: nextRequired,
  }
  let newState = replaceTopFrame(state, updatedFrame)

  // Auto-pop terminal sub-frames.
  //
  // After filling a required slot the frame may land on an anchor whose
  // `next` edges are exclusively FINISH terminators — `time_word` is the
  // canonical example (grammar-graph.json:277 lists only FINISH_STATEMENT
  // and FINISH_QUESTION). Historically the user ended up stranded in that
  // frame with only a "Done with this part" button and a "." / "?" pair,
  // which looked like "the sentence has to end here" when what they
  // actually wanted was to keep building at a higher level (add a location,
  // a companion, a `pea`/`ka` clause, etc.).
  //
  // Cross-cutting Rule 1's INTENT is that an extension sub-walk, once
  // complete, returns the user to the parent's extension menu. Requiring a
  // manual "Done with this part" click for single-step leaf nodes like
  // `time_word` fights that intent. So: after every advance, if the top
  // sub-frame has no remaining non-terminator extensions, pop it. The loop
  // continues if the newly-exposed frame is ALSO exhausted (e.g., popping
  // past a `modifier` whose only visible extension was the just-propagated
  // `time_word`), stopping at the first ancestor that still has something
  // to offer or at the root frame (which can't be popped — use
  // `finishWalker` instead).
  while (newState.frames.length > 1) {
    const top = currentFrame(newState)
    if (top.currentNodeId !== null) break // still SELECTING — can't pop
    // Only count this frame's NATIVE extensions when deciding whether to
    // auto-pop. getExtensionMenu now also surfaces clause connectors from
    // the clause root's verb — but those are "passed through" from above,
    // not reasons to keep this sub-frame open. If the frame's own anchor
    // offers nothing beyond FINISH, we still want to pop.
    if (getNativeExtensions(newState).length > 0) break
    newState = finishFrame(newState)
  }
  return newState
}

// Return only the extensions that come from the current frame's own anchor
// (ignoring clause connectors surfaced from the clause root's verb). Used
// by advanceInFrame's auto-pop to decide whether a sub-frame is genuinely
// terminal — a frame whose only extensions are passed-through connectors
// should still auto-pop so the connectors resolve at the clause root where
// they semantically belong.
function getNativeExtensions(state) {
  if (state.finished) return []
  const frame = currentFrame(state)
  if (frame.currentNodeId !== null) return []
  const tail = frame.extensionMenuAnchor
  if (!tail) return []
  const flatSteps = getFlatSteps(state)
  const edges = getAvailableEdges(tail, state.chapter, flatSteps)
  const out = []
  for (const edge of edges) {
    if (isTerminatorEdge(edge)) continue
    if (edge.required) continue
    if (frame.extensionsTaken.includes(edge.node) && !hasOwnRepetitionRule(edge)) continue
    out.push(edge)
  }
  return out
}

function replaceTopFrame(state, newFrame) {
  return {
    ...state,
    frames: [...state.frames.slice(0, -1), newFrame],
  }
}

/**
 * Compute the extension menu visible at the current frame's tail.
 *
 * Returns:
 *   {
 *     extensions:     [edge, ...],   // non-terminator, non-required edges
 *     terminators:    [edge, ...],   // FINISH_STATEMENT / FINISH_QUESTION
 *                                    // (filtered by the current frame's entry
 *                                    //  point's `allowed_terminators` per Rule 2)
 *     requiredNodeId: nodeId | null, // non-null when the frame is in SELECTING;
 *                                    // callers should not show the menu in that case
 *   }
 *
 * Filtering rules:
 *   - Edges are first run through getAvailableEdges (chapter + condition filter).
 *   - Extensions whose target is in the current frame's `extensionsTaken` are
 *     hidden, UNLESS the edge has its own repetition rule
 *     (modifier_count_max or not_already_visited_node) — in which case the
 *     condition itself decides when the edge disappears.
 *   - Required edges and terminator edges are split into their own buckets.
 *   - Terminator edges (FINISH_STATEMENT / FINISH_QUESTION) are further
 *     filtered by the current frame's entry point's `allowed_terminators` so
 *     that, e.g., the suggestion entry point only ever exposes FINISH_STATEMENT
 *     even though the shared `verb` node lists both terminators in the data.
 */
export function getExtensionMenu(state) {
  if (state.finished) {
    return { extensions: [], terminators: [], requiredNodeId: null }
  }
  const frame = currentFrame(state)
  if (frame.currentNodeId !== null) {
    return { extensions: [], terminators: [], requiredNodeId: frame.currentNodeId }
  }

  const tail = frame.extensionMenuAnchor
  if (!tail) {
    // The frame has no anchor yet — it was just created and no word has been
    // picked. There's nothing to extend from; the caller should be in SELECTING.
    return { extensions: [], terminators: [], requiredNodeId: null }
  }

  const flatSteps = getFlatSteps(state)
  const edges = getAvailableEdges(tail, state.chapter, flatSteps)
  const allowed = getAllowedTerminators(frame.entryPoint)

  const terminators = []
  const extensions = []
  for (const edge of edges) {
    if (isTerminatorEdge(edge)) {
      if (allowed.includes(edge.node)) terminators.push(edge)
      continue
    }
    if (edge.required) continue // shouldn't happen when frame is IN_PROGRESS

    if (frame.extensionsTaken.includes(edge.node) && !hasOwnRepetitionRule(edge)) {
      continue
    }
    extensions.push(edge)
  }

  // Surface clause connectors from the current clause's root verb, so the
  // user can start a new clause (pea, ka, kapau, ke purpose, etc.) from ANY
  // sub-frame once the main clause has reached its verb — not just by
  // manually popping back to the verb's own menu. The connectors are
  // filtered against the clause root's extensionsTaken inside the helper
  // so repeats are still blocked. If the current frame's anchor already
  // lists an edge to the same target, we don't duplicate it.
  const connectorEdges = getClauseConnectorEdges(state)
  for (const edge of connectorEdges) {
    if (!extensions.some(e => e.node === edge.node)) {
      extensions.push(edge)
    }
  }

  // P1-A4: surface the adjuncts_hub edges when the current anchor is flagged
  // route_to_hub (behind meta.useAdjunctHub). Additive and de-duped against the
  // anchor's native extensions — the hub never removes an edge, so existing
  // menu assertions that key on native edges are unaffected.
  const hubEdges = getHubExtensions(state)
  for (const edge of hubEdges) {
    if (!extensions.some(e => e.node === edge.node)) {
      extensions.push(edge)
    }
  }

  return { extensions, terminators, requiredNodeId: null }
}

function isTerminatorEdge(edge) {
  return (
    edge.node === 'FINISH_STATEMENT' ||
    edge.node === 'FINISH_QUESTION' ||
    edge.node === 'FINISH_EXCLAMATION'
  )
}

function lowercaseInitial(s) {
  if (!s || s.length === 0) return s
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== s[i].toLowerCase()) {
      return s.slice(0, i) + s[i].toLowerCase() + s.slice(i + 1)
    }
    if (s[i] >= 'a' && s[i] <= 'z') return s
  }
  return s
}

/**
 * Look up the `allowed_terminators` array for an entry point id.
 * Defaults to both terminators when the entry point isn't found or doesn't
 * declare an allowlist (defensive fallback for older data files).
 */
function getAllowedTerminators(entryPointId) {
  const ep = grammarGraph.entry_points.find(e => e.id === entryPointId)
  if (ep && Array.isArray(ep.allowed_terminators)) {
    return ep.allowed_terminators
  }
  return ['FINISH_STATEMENT', 'FINISH_QUESTION']
}

/**
 * Phase 2A.2: return the array of terminator ids currently available in the
 * walker's extension menu, e.g. `['FINISH_STATEMENT', 'FINISH_QUESTION']` or
 * `['FINISH_STATEMENT']` for an imperative entry point.
 *
 * Replaces the legacy `canFinish(nodeId, chapter, steps)` predicate for the
 * stack-based walker. Callers can use the array length / contents to drive
 * UI: an empty array means the sentence is not yet completable; a one-element
 * array means there is no statement-vs-question choice; a two-element array
 * means the user must pick punctuation.
 */
export function getAvailableTerminators(state) {
  return getExtensionMenu(state).terminators.map(t => t.node)
}

/**
 * An edge "has its own repetition rule" if its condition handles count or
 * visit constraints internally. Such edges are NOT subject to the per-frame
 * extensionsTaken hiding — the condition itself decides when they should
 * disappear (e.g. modifier_count_max returns false once the cap is hit).
 */
function hasOwnRepetitionRule(edge) {
  if (!edge.condition) return false
  return (
    edge.condition.type === 'modifier_count_max' ||
    edge.condition.type === 'not_already_visited_node' ||
    edge.condition.type === 'node_visit_count_max'
  )
}

/**
 * Take an option from the current frame's menu. Returns a NEW state.
 *
 * Three behaviors, decided from the data shape (no schema changes needed):
 *
 *   1. Self-loop (target === the frame's extensionMenuAnchor)
 *      → no new frame; the frame re-enters SELECTING at the same node so
 *        another word can be picked. The edge's own count condition
 *        (e.g. modifier_count_max) eventually blocks further self-loops.
 *
 *   2. Branching transition — the anchor's edges contain NO terminator
 *      (no FINISH / FINISH_STATEMENT / FINISH_QUESTION). This is a node
 *      whose menu options are alternative continuations of the same linear
 *      sub-walk (e.g. pronoun → preposed_modifier vs verb at Ch 999).
 *      → no new frame; the current frame's currentNodeId is set to the
 *        chosen target so the user can pick a word for it next.
 *      → the chosen branch is NOT recorded in extensionsTaken — branches
 *        consume the linear path, they don't add optional decoration.
 *
 *   3. Extending push — the anchor's edges contain at least one terminator
 *      (the sentence is already grammatically completable here). This is
 *      the canonical "take an extension" path: a new frame is pushed for
 *      the target's sub-walk, and the parent frame's `extensionsTaken` is
 *      updated to record the extension (unless the edge has its own
 *      repetition rule).
 *
 * Throws if the walker is finished, the frame has a pending required slot,
 * or the requested target isn't in the current menu.
 */
export function takeExtension(state, extensionTargetId) {
  if (state.finished) {
    throw new Error('Walker is finished; cannot take extension')
  }
  let frame = currentFrame(state)
  if (frame.currentNodeId !== null) {
    throw new Error('Cannot take extension while a required slot is pending')
  }

  const menu = getExtensionMenu(state)
  const ext = menu.extensions.find(e => e.node === extensionTargetId)
  if (!ext) {
    throw new Error(
      `Extension "${extensionTargetId}" is not available in the current menu`
    )
  }

  // Clause connector routing: if the target is a clause connector (pea, ka,
  // kapau, ke purpose, etc.), the new sub-clause should attach to the
  // CLAUSE ROOT's verb — not to whatever sub-phrase the user happens to be
  // in. getExtensionMenu surfaces connectors from the clause root so users
  // can click them without manually popping; here we pop back to that root
  // before the push, so the parent position is linguistically correct and
  // the parent's extensionsTaken records the connector (not the modifier/
  // object/prep_phrase frame the user was in when they clicked it).
  if (CLAUSE_CONNECTOR_NODES.has(extensionTargetId)) {
    const { depth: clauseRootDepth } = findClauseRootFrame(state)
    while (state.frames.length - 1 > clauseRootDepth) {
      state = finishFrame(state)
    }
    frame = currentFrame(state)
  }

  const tail = frame.extensionMenuAnchor
  const isSelfLoop = extensionTargetId === tail

  if (isSelfLoop) {
    // Re-enter SELECTING at the same node. The condition on the self-loop
    // edge (e.g. modifier_count_max) is what governs when this stops.
    const updatedFrame = { ...frame, currentNodeId: extensionTargetId }
    return replaceTopFrame(state, updatedFrame)
  }

  // Branching mode: the anchor has no FINISH option, meaning the menu
  // items are alternative continuations of the linear path rather than
  // optional sub-walks. Inline-transition the current frame.
  const flatSteps = getFlatSteps(state)
  const anchorEdges = getAvailableEdges(tail, state.chapter, flatSteps)
  const isExtendingMode = anchorEdges.some(e => isTerminatorEdge(e))
  if (!isExtendingMode) {
    const updatedFrame = { ...frame, currentNodeId: extensionTargetId }
    return replaceTopFrame(state, updatedFrame)
  }

  // Extending mode: push a sub-frame for the target's sub-walk and record
  // the extension on the parent (unless its edge has its own repetition rule).
  let parentFrame = frame
  if (!hasOwnRepetitionRule(ext)) {
    parentFrame = {
      ...frame,
      extensionsTaken: [...frame.extensionsTaken, extensionTargetId],
    }
  }

  // Phase 2A.5 slice: when an extension edge declares `child_entry_point`,
  // the child frame walks with that entry point's metadata — specifically
  // its `allowed_terminators` — instead of inheriting the parent's. This
  // lets `clause_connector_ka` push a frame whose entryPoint is `negation`
  // (forcing the sub-walk to look like a negation clause), and
  // `subordinator_ke_purpose` push a frame whose entryPoint is
  // `purpose_bare_verb` (allowed_terminators: [] — the sub-clause can only
  // exit via finishFrame, never via FINISH_STATEMENT / FINISH_QUESTION).
  // When the edge has no `child_entry_point` (the common case), the child
  // inherits the parent's entry point unchanged, matching pre-2A.5 behavior.
  const childEntryPointId = ext.child_entry_point || frame.entryPoint
  const childFrame = makeFrame({
    entryPoint: childEntryPointId,
    startNodeId: extensionTargetId,
    currentNodeId: extensionTargetId,
    parentExtension: extensionTargetId,
  })

  return {
    ...state,
    frames: [...state.frames.slice(0, -1), parentFrame, childFrame],
  }
}

/**
 * Pop the current sub-frame and splice its path into the parent frame.
 * Returns a NEW state. The user is returned to the parent's extension menu.
 *
 * Throws if the walker is finished, there are no sub-frames to pop
 * (use finishWalker for the root frame), or the current frame still has a
 * pending required slot.
 */
export function finishFrame(state) {
  if (state.finished) {
    throw new Error('Walker is finished; cannot finish frame')
  }
  if (state.frames.length === 0) {
    throw new Error('No frames on the walker stack')
  }
  if (state.frames.length === 1) {
    // Idempotent at root: callers that want to explicitly "wrap up" the
    // current sub-walk can call finishFrame without first checking depth.
    // The advanceInFrame auto-pop may already have collapsed terminal
    // sub-frames back to the root, in which case this call is a no-op —
    // preferable to throwing, because the calling code's intent ("I'm done
    // with the sub-walk") is already satisfied. Use `finishWalker` to
    // actually terminate the sentence.
    return state
  }
  const frame = currentFrame(state)
  if (frame.currentNodeId !== null) {
    throw new Error('Cannot finish frame: required slot still pending')
  }

  const popped = frame
  const parent = state.frames[state.frames.length - 2]
  // Merge the child's `extensionsTaken` into the parent's. Without this,
  // an extension taken deep inside a sub-walk (e.g., `time_word` picked
  // inside a `modifier` frame) would be unknown to the root frame — popping
  // all the way back would re-offer `time_word` and let the user add a
  // second one. Merging preserves the "no repeats" guarantee across the
  // full stack regardless of where the pick happened.
  const mergedExtensionsTaken = [
    ...parent.extensionsTaken,
    ...popped.extensionsTaken.filter(e => !parent.extensionsTaken.includes(e)),
  ]
  // Also record the just-popped child's own parentExtension so the parent
  // knows that extension has been taken. `takeExtension` already added the
  // immediate child's target to `parent.extensionsTaken`, but grandchild
  // targets arrived via the child's list — that's what the merge above
  // covers.
  const mergedParent = {
    ...parent,
    path: [...parent.path, ...popped.path],
    extensionsTaken: mergedExtensionsTaken,
    // Parent's extensionMenuAnchor is preserved — we return to its menu.
  }

  return {
    ...state,
    frames: [...state.frames.slice(0, -2), mergedParent],
  }
}

/**
 * Finish the entire walker. Returns a NEW state with `finished: true`,
 * `terminator` set to the chosen edge target, and `translation.isQuestion`
 * set to true iff the chosen terminator is `FINISH_QUESTION`.
 *
 * Phase 2A.2: accepts `'FINISH_STATEMENT'` or `'FINISH_QUESTION'`. The
 * `state.translation.isQuestion` flag is consumed by `engine/translate.js`
 * so the existing `buildQuestion` family inverts the English auxiliary.
 * Per Cross-Cutting Rule 2 the Tongan word order does not change — only
 * the punctuation and the English rendering do.
 *
 * Throws if any sub-frames remain, the root frame has a pending required
 * slot, or the requested terminator isn't in the current menu.
 */
export function finishWalker(state, terminatorId = 'FINISH_STATEMENT') {
  if (state.finished) {
    throw new Error('Walker already finished')
  }
  if (state.frames.length !== 1) {
    throw new Error('Cannot finish walker: collapse all sub-frames first')
  }
  const frame = currentFrame(state)
  if (frame.currentNodeId !== null) {
    throw new Error('Cannot finish walker: required slot still pending')
  }

  if (terminatorId !== 'FINISH_STATEMENT' && terminatorId !== 'FINISH_QUESTION' && terminatorId !== 'FINISH_EXCLAMATION') {
    throw new Error(`Unknown terminator id: "${terminatorId}"`)
  }

  const menu = getExtensionMenu(state)
  if (!menu.terminators.some(t => t.node === terminatorId)) {
    throw new Error(`Terminator "${terminatorId}" not available in current menu`)
  }

  return {
    ...state,
    finished: true,
    terminator: terminatorId,
    translation: {
      ...state.translation,
      isQuestion: terminatorId === 'FINISH_QUESTION',
    },
  }
}

/**
 * Phase 2A.2 alias for {@link finishWalker} that reads more naturally at the
 * call site: `finishSentence(state, 'FINISH_QUESTION')`. Identical behavior;
 * exists so the spec's API name is available verbatim.
 */
export function finishSentence(state, terminatorId) {
  return finishWalker(state, terminatorId)
}

// ============================================================================
// Phase 2A.3 — Noun class auto-rendering (Cross-Cutting Rule 3)
// ============================================================================
//
// Rule 3: a preposition's surface form is determined by the noun class of its
// complement. ki + local → ki, ki + personal → kia, ki + common → ki he,
// ki + pronoun → kiate. The user never picks the surface form — the walker
// renders it automatically by reading `class_forms` off the preposition word
// and the complement's `noun_class`.
//
// The data shape in grammar-graph.json:
//
//   "preposition": {
//     "words": [
//       { "tongan": "ki", "family": "ki-family",
//         "class_forms": { "local": "ki", "personal": "kia",
//                          "common": "ki he", "pronoun": "kiate" } },
//       ...
//     ],
//     "word_filter": { "type": "requires_complement_prep" }
//   }
//
// The filter makes it impossible to pick `ki` (ki-family) after a verb
// tagged `complement_prep: "i-family"` (e.g. `ʻofa`). The render step then
// substitutes the correct class form on top of the already-valid base.
//
// Rendering is applied at READ time, not at selection time: the walker's
// `path` still stores the user's literal picks (`{ nodeId: 'preposition',
// word: { tongan: 'ki', ... } }`), and `getRenderedPath(state)` returns a
// parallel array where each step carries an extra `renderedTongan` string
// — the actual form that should appear in the Tongan output. This keeps the
// canonical path immutable and lets the UI still highlight "the user picked
// ki" while the rendered sentence shows `kia`.

/**
 * Resolve the surface form of a preposition given its base word and the
 * following complement noun. Returns the base `tongan` unchanged when:
 *   - the preposition has no `class_forms` table (old data or non-Rule-3
 *     preposition), OR
 *   - the complement noun has no `noun_class` tag (unclassified data), OR
 *   - the complement's `noun_class` is not covered by the table.
 *
 * Callers should treat the return value as the string to render in place of
 * `prepWord.tongan`. The function does NOT mutate `prepWord`.
 */
export function renderPrepPhrase(prepWord, complementWord) {
  if (!prepWord || !prepWord.class_forms) {
    return prepWord ? prepWord.tongan : ''
  }
  if (!complementWord || !complementWord.noun_class) {
    return prepWord.tongan
  }
  // class_forms entries are either a plain string (legacy shape) or a
  // `{ tongan, min_chapter }` object (chapter-gated shape introduced with
  // the schema update). Accept both so this helper doesn't have to care
  // which shape a given preposition uses.
  const raw = prepWord.class_forms[complementWord.noun_class]
  const form = typeof raw === 'string' ? raw : (raw && raw.tongan)
  return form || prepWord.tongan
}

// ============================================================================
// Phase 2A.4 — Definitive accent rendering (spec §23)
// ============================================================================
//
// Tongan has three definiteness levels (spec §23):
//
//   indefinite    `ha + word`                 "a" / "some" / "any"
//   semi_definite `e/he + word` (no accent)   "a particular" / "a certain"
//   definite      `e/he + word` + accent shift to final vowel of the phrase
//
// 2A.4 implements the third level: when the user marks a common-noun step as
// `definite`, the walker renders the noun's `definitive_accent_form` (tagged
// by 2B.4) in place of the base `tongan`. Semi-definite and indefinite both
// render the base form in this slice — semi-definite is already correct for
// `ki he fale`-style phrases; indefinite article-shifting (`ki ha fale`) is
// deferred to a follow-up slice.
//
// State shape: definiteness lives on the STEP, not on walker state. A step
// in a frame's `path` gains an optional `definiteness` field:
//
//   { nodeId: 'prep_phrase', word: { tongan: 'fale', ... }, definiteness: 'definite' }
//
// This keeps the walker's per-step history self-describing and avoids a
// parallel side-map that could drift from the canonical path. `getRenderedPath`
// reads `step.definiteness` when deciding which form to use.
//
// `setStepDefiniteness(state, flatStepIndex, level)` is the public mutator.
// It finds the step at `flatStepIndex`, reconstructs its containing frame
// with an updated step object, and returns a new state. Throws on invalid
// level, missing step, or a `definite` request against a word without a
// `definitive_accent_form` (only common nouns have one — see 2B.4).
//
// Multi-word phrase accent placement (spec §46's "group-end rule", e.g.
// `e fale ako fo'oú`) is DEFERRED to a polish pass. The current slice only
// handles the single-noun case. This matches the Ch 1–15 data surface
// (prep_phrase common nouns are always single words) and will be extended
// when 2C.4 lands attributive-adjective data.

/**
 * Resolve the rendered Tongan surface form of a common noun given a
 * definiteness level. Returns:
 *
 *   - the noun's `definitive_accent_form` when level is `'definite'` and
 *     the field exists on the word;
 *   - the base `word.tongan` otherwise (semi-definite, indefinite, no level
 *     set, or the word lacks a `definitive_accent_form`).
 *
 * This helper is deliberately permissive — it silently falls back to the
 * base form rather than throwing — so callers can invoke it on every step
 * regardless of whether the word is a common noun. The caller-side guard
 * lives in `setStepDefiniteness`, which refuses to mark non-common nouns
 * definite in the first place.
 *
 * Does NOT mutate `word`.
 */
export function renderNoun(word, _definiteness) {
  // User preference: the builder renders sentences WITHOUT the definitive
  // accent. Accents are a pronunciation aid, not a structural signal —
  // keeping them out of the surface form keeps the focus on word order and
  // morphology. The `definitive_accent_form` field remains on word entries
  // as reference data (and for future opt-in tools) but no render path
  // substitutes it. The `definiteness` argument is retained for API
  // compatibility with callers that still pass it; it's ignored.
  if (!word) return ''
  return word.tongan
}

/**
 * Mark the step at `flatStepIndex` with a definiteness level. Returns a NEW
 * state; the original is untouched. `level` is one of:
 *
 *   'indefinite' | 'semi_definite' | 'definite' | null
 *
 * Passing `null` clears any previously-set definiteness on that step.
 *
 * Throws when:
 *   - the walker is finished;
 *   - `flatStepIndex` is out of range;
 *   - `level` is not one of the four allowed values;
 *   - `level === 'definite'` but the target step's word is not a common
 *     noun (personal names, local place names, and pronouns don't take
 *     the definitive accent — offering it would be meaningless and the
 *     renderer would have nothing to substitute).
 *
 * The flat step index is the index into `getFlatSteps(state)`, counted
 * across all frames in root-first order. Callers that want to mark "the
 * most-recently-picked common noun" can walk `getFlatSteps` backwards and
 * pass the index of the first match.
 */
export function setStepDefiniteness(state, flatStepIndex, level) {
  if (state.finished) {
    throw new Error('Walker is finished; cannot set definiteness')
  }
  if (level !== null && level !== 'indefinite' && level !== 'semi_definite' && level !== 'definite') {
    throw new Error(`Invalid definiteness level: "${level}"`)
  }

  // Locate the target step by walking frame paths in order.
  let remaining = flatStepIndex
  let targetFrameIdx = -1
  let targetInFrameIdx = -1
  for (let f = 0; f < state.frames.length; f++) {
    const frame = state.frames[f]
    if (remaining < frame.path.length) {
      targetFrameIdx = f
      targetInFrameIdx = remaining
      break
    }
    remaining -= frame.path.length
  }
  if (targetFrameIdx === -1) {
    throw new Error(`Step index ${flatStepIndex} is out of range`)
  }

  const targetStep = state.frames[targetFrameIdx].path[targetInFrameIdx]
  if (level === 'definite' && targetStep.word.noun_class !== 'common') {
    throw new Error(
      `Cannot mark step ${flatStepIndex} as definite: word "${targetStep.word.tongan}" is not a common noun`
    )
  }

  const updatedStep = level === null
    ? (() => { const { definiteness: _drop, ...rest } = targetStep; return rest })()
    : { ...targetStep, definiteness: level }

  const updatedFrame = {
    ...state.frames[targetFrameIdx],
    path: [
      ...state.frames[targetFrameIdx].path.slice(0, targetInFrameIdx),
      updatedStep,
      ...state.frames[targetFrameIdx].path.slice(targetInFrameIdx + 1),
    ],
  }

  return {
    ...state,
    frames: [
      ...state.frames.slice(0, targetFrameIdx),
      updatedFrame,
      ...state.frames.slice(targetFrameIdx + 1),
    ],
  }
}

/**
 * Return the flat step sequence with Rule-3 class-aware substitutions
 * already applied. Each entry has the shape:
 *
 *   { nodeId, word, renderedTongan }
 *
 * where `renderedTongan` is the final surface form to render in the Tongan
 * output. For most steps this is just `word.tongan`; for a `preposition`
 * step immediately followed by a `prep_phrase` step it's the class form
 * looked up from the preposition's `class_forms` table.
 *
 * This is what UI code and translators should read when building the
 * Tongan output. The walker's canonical `path` is left untouched so the
 * "user's literal picks" history stays intact for reconstruction and
 * telemetry.
 */
export function getRenderedPath(state) {
  const flat = getFlatSteps(state)
  // Phase 2A.4: seed each step's renderedTongan with the definiteness-aware
  // form. For common nouns marked `definite` this substitutes
  // `definitive_accent_form`; for everything else it returns `word.tongan`
  // unchanged. This runs before Rule 3 prep rendering and before the
  // lowercase-after-connector pass so later passes can operate on the
  // accent-adjusted form.
  const out = flat.map(s => ({ ...s, renderedTongan: renderNoun(s.word, s.definiteness) }))
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].nodeId === 'preposition' && out[i + 1].nodeId === 'prep_phrase') {
      out[i].renderedTongan = renderPrepPhrase(out[i].word, out[i + 1].word)
    }
  }
  // Book Ch 4:89 ("Where Time Words Go"): the time expression `ʻaho ni`
  // ("this day" = today) takes the article `he` before it when it appears
  // inside a sentence — `he ʻahó ni`, attested `ʻOku lāʻā he ʻaho ni`
  // (Ch 15:272). The other time words (`ʻaneafi`, `ʻanepō`, …) are adverbs
  // and take no article. Applied to the `time_word` node so every path
  // (statement, experiencer, …) renders the book-correct form. `ʻaho ni` is
  // only ever a post-verbal adjunct, never clause-initial, so this never
  // interacts with the lowercase-after-connector pass below.
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'time_word' && normalize(out[i].word.tongan) === normalize('ʻaho ni')) {
      out[i].renderedTongan = `he ${out[i].renderedTongan}`
    }
  }
  // Phase 2A.6 slice: Possessive pronoun auto-selection (spec §22). Each
  // possessive_pronoun word entry stores both paradigm forms under
  // `possessive_forms: { e_class, ho_class }`. The user picks a
  // person/number slot (e.g. `ʻeku` for 1sg); render time reads the
  // immediately-following `possessive_head_noun` step's `possessive_class`
  // and substitutes the matching form. The user's literal pick is preserved
  // in `path` for telemetry. Head-noun class determines the form — the
  // pronoun identity is class-agnostic. "mixed" is deferred; in this slice
  // every head noun is tagged e_class or ho_class.
  for (let i = 0; i < out.length - 1; i++) {
    if (out[i].nodeId === 'possessive_pronoun' && out[i + 1].nodeId === 'possessive_head_noun') {
      const pronounWord = out[i].word
      const klass = out[i + 1].word && out[i + 1].word.possessive_class
      if (pronounWord.possessive_forms && klass && pronounWord.possessive_forms[klass]) {
        out[i].renderedTongan = pronounWord.possessive_forms[klass]
      }
    }
  }
  // Phase 2C.5b: "have" construction possessive form-selection (spec §36).
  // The have_construction routes have_head → possessive_pronoun →
  // possessive_head_noun without a child frame. Two signals trigger
  // indefinite-form substitution: (1) the `negated` tag on the have_head
  // entry (negatives always use indefinite forms), (2) the walker's
  // terminator is FINISH_QUESTION on an affirmative have_head (questions
  // about having something also use indefinite possessives per §36).
  // Affirmative + FINISH_STATEMENT leaves the 2A.6 definite form intact.
  for (let i = 0; i < out.length - 2; i++) {
    if (
      out[i].nodeId === 'have_head' &&
      out[i + 1].nodeId === 'possessive_pronoun' &&
      out[i + 2].nodeId === 'possessive_head_noun'
    ) {
      const tags = out[i].word && out[i].word.tags
      const isNegated = tags && tags.includes('negated')
      const isQuestion = state.terminator === 'FINISH_QUESTION'
      if (isNegated || isQuestion) {
        const pronounWord = out[i + 1].word
        const klass = out[i + 2].word && out[i + 2].word.possessive_class
        if (pronounWord.indefinite_forms && klass && pronounWord.indefinite_forms[klass]) {
          out[i + 1].renderedTongan = pronounWord.indefinite_forms[klass]
        }
      }
    }
  }
  // Phase 2A.6 follow-up: preposition-plus-possessive article rule
  // (spec §22 + §36). Triggers on a `preposition_possessive → possessive_pronoun
  // → possessive_head_noun` triple (the `prep_with_possessive` sub-walk).
  //
  //   ho-class head → base preposition form: `ki hoku fale` (article dropped)
  //   e-class head  → preposition + ` he`:   `ki he ʻeku tohi`
  //
  // The base forms stored on `preposition_possessive` words are the bare
  // prepositions (`ki`, `ʻi`, `mei`) with no `class_forms` table, so the
  // ho-class case is already correct after the pass-1 renderNoun seed. The
  // e-class case reinstates the article by appending ` he` to the
  // preposition's renderedTongan. Spec §36 notes `he ʻeku` and `heʻeku`
  // are interchangeable in writing; we use the spaced form.
  //
  // Runs after the possessive_pronoun paradigm substitution above so this
  // pass reads the already-substituted pronoun form (e.g. `hoku` vs `ʻeku`)
  // when deciding anything downstream; it only mutates the preposition here.
  for (let i = 0; i < out.length - 2; i++) {
    if (
      out[i].nodeId === 'preposition_possessive' &&
      out[i + 1].nodeId === 'possessive_pronoun' &&
      out[i + 2].nodeId === 'possessive_head_noun'
    ) {
      const headClass = out[i + 2].word && out[i + 2].word.possessive_class
      if (headClass === 'e_class') {
        out[i].renderedTongan = `${out[i].renderedTongan} he`
      }
    }
  }
  // Absolutive marker + definite article for the transitive (§16 Ch 19)
  // and cleft (§19 Ch 36) absolutive-object nodes. Entries are stored bare
  // and at render time the surface form is:
  //   - personal name → `ʻa <name>`        (e.g. `ʻa Sione`)
  //   - common noun   → `ʻa e <noun>`      (e.g. `ʻa e ika`)
  // The definitive accent is NOT applied — per user preference the builder
  // renders bare forms everywhere. The absolutive marker `ʻa` and the
  // article `e` are still required to enforce the "always write ʻa e" rule.
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'object_phrase' || out[i].nodeId === 'object_phrase_cleft') {
      const w = out[i].word
      if (w.noun_class === 'common') {
        out[i].renderedTongan = `ʻa e ${w.tongan}`
      } else {
        out[i].renderedTongan = `ʻa ${w.tongan}`
      }
    }
  }
  // Ergative marker + definite article for agent_phrase (spec §16
  // transitive, Ch 19). Mirror of object_phrase but with `ʻe` / `ʻe he`:
  //   - personal name → `ʻe <name>`        (e.g. `ʻe Sione`)
  //   - common noun   → `ʻe he <noun>`     (e.g. `ʻe he tamasiʻi`)
  // The article after `ʻe` is `he`, not `e` — phonological rule. No accent
  // applied (user preference).
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'agent_phrase') {
      const w = out[i].word
      if (w.noun_class === 'common') {
        out[i].renderedTongan = `ʻe he ${w.tongan}`
      } else {
        out[i].renderedTongan = `ʻe ${w.tongan}`
      }
    }
  }
  // Definite article for cleft subject_phrase common nouns (§19 Ch 36).
  // Cleft sentences front the subject with `Ko`, so there's no focus/
  // absolutive marker — just the article `e` for common-noun subjects
  // (personal names and pronouns pass through unchanged). No accent.
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'subject_phrase' && out[i].word.noun_class === 'common') {
      out[i].renderedTongan = `e ${out[i].word.tongan}`
    }
  }
  // Definite-article surface for noun_subject_name common nouns (spec §14).
  // The node stores bare nouns (`tamasiʻi`, `fefine`, `tangata`, `faiako`) so
  // articles stay consistent with the object-node refactor (articles are their
  // own category, never fused into the noun). But in the noun-subject flow the
  // definite article `e` is OBLIGATORY — the user's memory policy "always
  // write ʻa e; never drop ʻa before definite article e in proximative
  // position" makes this a hard rule. Personal names (`Sione`, `Mele`, ...)
  // never take the article. Render-time check: common noun → prepend `e `.
  //
  // The focus_marker step (one step earlier in the flat steps) already
  // contributes `ʻa`, so the final surface is `ʻa e tamasiʻi` for the user's
  // canonical noun-subject example.
  for (let i = 0; i < out.length; i++) {
    if (
      out[i].nodeId === 'noun_subject_name' &&
      out[i].word.noun_class === 'common'
    ) {
      out[i].renderedTongan = `e ${out[i].renderedTongan}`
    }
  }
  // Phase 2A.6 follow-up 2: ʻa/ʻo + name possessive (spec §22). A single
  // word entry on `possessor_preposition` stores both forms under
  // `possessive_forms: { e_class: "ʻa", ho_class: "ʻo" }`. The head noun
  // lives in the parent frame (the last prep_phrase step before the
  // possessive_phrase_name child frame was pushed), not inside the sub-walk
  // itself, so we walk backwards from the preposition step to find the
  // nearest preceding step whose word carries a `possessive_class` and
  // substitute the matching form. Robust to future attachment points and
  // to other extensions sitting between the head noun and the sub-walk.
  // Permissive fallthrough: keep the user's literal pick if no class found.
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'possessor_preposition') {
      const prepWord = out[i].word
      if (!prepWord.possessive_forms) continue
      for (let j = i - 1; j >= 0; j--) {
        const klass = out[j].word && out[j].word.possessive_class
        if (klass && prepWord.possessive_forms[klass]) {
          out[i].renderedTongan = prepWord.possessive_forms[klass]
          break
        }
      }
    }
  }
  // Phase 2F.1: benefactive preposition auto-selection (spec §25). Same
  // backward-walk pattern as possessor_preposition (§22). Walk backward from
  // the benefactive_preposition_ma step to find the nearest preceding step
  // whose word carries `possessive_class` and substitute maʻa (e_class) or
  // moʻo (ho_class).
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'benefactive_preposition_ma') {
      const prepWord = out[i].word
      if (!prepWord.possessive_forms) continue
      for (let j = i - 1; j >= 0; j--) {
        const klass = out[j].word && out[j].word.possessive_class
        if (klass && prepWord.possessive_forms[klass]) {
          out[i].renderedTongan = prepWord.possessive_forms[klass]
          break
        }
      }
    }
  }
  // Phase 2F.1: benefactive fused pronoun auto-selection (spec §25). Same
  // backward-walk pattern. Each fused entry stores both paradigm forms under
  // possessive_forms (e.g. maʻaku/moʻoku). Walk backward to find the nearest
  // possessive_class and substitute the matching form.
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'benefactive_pronoun_fused') {
      const fusedWord = out[i].word
      if (!fusedWord.possessive_forms) continue
      for (let j = i - 1; j >= 0; j--) {
        const klass = out[j].word && out[j].word.possessive_class
        if (klass && fusedWord.possessive_forms[klass]) {
          out[i].renderedTongan = fusedWord.possessive_forms[klass]
          break
        }
      }
    }
  }
  // Phase 2C.5d: whose-question form-selection (spec §37). The
  // whose_question_form word entry stores both paradigm forms under
  // `possessive_forms: { e_class: "ʻa hai", ho_class: "ʻo hai" }`. Walk
  // backward from the whose_question_form step to find the nearest preceding
  // step whose word carries a `possessive_class` and substitute the matching
  // form. Same backward-walk pattern as possessor_preposition (§22) and
  // benefactive_preposition_ma (§25). Permissive fallthrough: keep the
  // default ʻa hai form if no class found or class is "mixed".
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'whose_question_form') {
      const qWord = out[i].word
      if (!qWord.possessive_forms) continue
      for (let j = i - 1; j >= 0; j--) {
        const klass = out[j].word && out[j].word.possessive_class
        if (klass && qWord.possessive_forms[klass]) {
          out[i].renderedTongan = qWord.possessive_forms[klass]
          break
        }
      }
    }
  }
  // Phase 2C.5e: pronominal adjective construction (spec §37). When the
  // possessive sub-walk has a pronominal_adjective step after
  // possessive_head_noun, two transformations apply:
  //   1. [REMOVED per user preference for no accents] Spec §37 says the
  //      head noun renders with its definitive_accent_form; we skip that
  //      substitution. The head noun stays in its bare form.
  //   2. The pronominal_adjective placeholder renders as the matching
  //      postposed possessive short form. The pass backward-walks to find
  //      the possessive_pronoun step (reads person + number), reads the
  //      head noun's possessive_class, then looks up the matching entry
  //      in postposed_possessive.words and uses its short_form (singular)
  //      or tongan (dual/plural — no short_form on those entries).
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'pronominal_adjective') {
      // 1. [skipped — no accent substitution on head noun]
      // 2. Auto-select matching short form from postposed_possessive paradigm
      let person = null, number = null
      for (let j = i - 1; j >= 0; j--) {
        if (out[j].nodeId === 'possessive_pronoun') {
          person = out[j].word && out[j].word.person
          number = out[j].word && out[j].word.number
          break
        }
      }
      if (person !== null && number !== null) {
        // Find the head noun to read possessive_class
        let klass = null
        for (let j = i - 1; j >= 0; j--) {
          if (out[j].nodeId === 'possessive_head_noun') {
            klass = out[j].word && out[j].word.possessive_class
            break
          }
        }
        if (klass) {
          const ppNode = grammarGraph.nodes.postposed_possessive
          if (ppNode) {
            const match = ppNode.words.find(w =>
              w.person === person &&
              w.number === number &&
              w.possessive_class === klass
            )
            if (match) {
              out[i] = { ...out[i], renderedTongan: match.short_form || match.tongan }
            }
          }
        }
      }
    }
  }
  // Phase 2A.5 slice: lowercase the first letter of the word immediately
  // following any clause-connector or subordinator step. The data stores
  // tense markers and connectors capitalized because they normally appear
  // sentence-initial (e.g. `Naʻe` in the `tense_marker_neg` node), but
  // mid-sentence after `ka` / `ke` they should render lowercase: `ka naʻe`,
  // not `ka Naʻe`. Contained to the first character so prefixed diacritics
  // like the fakauʻa (ʻ) remain intact.
  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1]
    if (
      prev.nodeId === 'clause_connector_ka' ||
      prev.nodeId === 'clause_connector_kae' ||
      prev.nodeId === 'clause_connector_pea' ||
      prev.nodeId === 'clause_connector_pea_serial' ||
      prev.nodeId === 'clause_connector_o' ||
      prev.nodeId === 'clause_connector_he' ||
      prev.nodeId === 'subordinator_ke_purpose' ||
      prev.nodeId === 'subordinator_koeuhi_ke' ||
      prev.nodeId === 'subordinator_kapau' ||
      prev.nodeId === 'subordinator_lolotonga'
    ) {
      const s = out[i].renderedTongan
      if (s && s.length > 0) {
        out[i] = { ...out[i], renderedTongan: s[0].toLowerCase() + s.slice(1) }
      }
    }
  }
  // Phase 2C.4e-2: lowercase the relative clause tense marker. The sub-walk's
  // tense marker appears mid-sentence after a demonstrative in a ko phrase,
  // so its stored capitalized form (ʻOku, Naʻa) needs lowercasing. Uses
  // lowercaseInitial to handle the fakauʻa prefix: ʻOku → ʻoku (the first
  // alphabetic character is at index 1, not 0).
  for (let i = 0; i < out.length; i++) {
    if (out[i].nodeId === 'relative_clause_tense') {
      out[i] = { ...out[i], renderedTongan: lowercaseInitial(out[i].renderedTongan) }
    }
  }
  // Phase 2C.4e-3: preposition-aware back-reference form-selection for
  // relative clauses. Scans the sub-walk for a preposition step after
  // relative_clause_tense, reads its family, and renders the matching
  // form: i-family → bare ai (preposition + prep_phrase suppressed),
  // ki-family → ki ai, mei-family → mei ai. No preposition → bare ai.
  const relClauseIdx = out.findIndex(s => s.nodeId === 'relative_clause_tense')
  if (relClauseIdx >= 0) {
    let backRef = 'ai'
    for (let i = relClauseIdx + 1; i < out.length; i++) {
      if (out[i].nodeId === 'preposition') {
        const family = out[i].word && out[i].word.family
        if (family === 'ki-family') backRef = 'ki ai'
        else if (family === 'mei-family') backRef = 'mei ai'
        out[i] = { ...out[i], renderedTongan: '' }
        if (i + 1 < out.length && out[i + 1].nodeId === 'prep_phrase') {
          out[i + 1] = { ...out[i + 1], renderedTongan: '' }
        }
        break
      }
    }
    out.push({ nodeId: '_ai_backref', word: { tongan: 'ai', english: 'back-reference' }, renderedTongan: backRef })
  }
  return out.filter(s => s.renderedTongan !== '')
}

/**
 * Build the final Tongan sentence string from a walker state, honoring
 * Rule 3 class-aware preposition rendering. Joins the rendered tokens with
 * spaces; does NOT add terminating punctuation (the caller decides whether
 * to append `.`, `?`, or `!` based on the terminator choice).
 */
export function renderTongan(state) {
  return getRenderedPath(state)
    .map(s => s.renderedTongan)
    .join(' ')
}
