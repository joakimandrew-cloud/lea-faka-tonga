import grammarGraph from '../data/grammar-graph.json'

// Maps entry point IDs to their tense marker and pronoun node IDs
const ENTRY_POINT_NODES = {
  statement:            { tenseNode: 'tense_marker',         pronounNode: 'pronoun' },
  location_state:       { tenseNode: 'tense_marker_loc',     pronounNode: 'pronoun_loc' },
  experiencer:          { tenseNode: 'tense_marker_exp',     pronounNode: null },  // uses prepositional pronoun
  negation:             { tenseNode: 'tense_marker_neg',     pronounNode: 'pronoun_neg' },
  negation_impersonal:  { tenseNode: 'tense_marker_neg_imp', pronounNode: null },  // impersonal, no pronoun
  noun_subject:         { tenseNode: 'tense_marker_ns',      pronounNode: null },  // uses proper name
  ko_question_who:      { tenseNode: 'tense_marker_kohai',   pronounNode: null },
}

// For negation, the fixed intermediary nodes between TM and pronoun
const NEGATION_FIXED_NODES = {
  negation:            ['negation_word', 'neg_connector'],      // 'ikai + te
  negation_impersonal: ['negation_word_imp', 'imp_connector'],  // 'ikai + ke
}

/**
 * Resolve a tense marker word from the grammar graph.
 * @param {'past'|'present'|'perfect'|'future'} tense - English tense name
 * @param {string} entryPointId - grammar graph entry point ID
 * @returns {{ tongan: string, english: string, nodeId: string, word: object } | null}
 */
export function resolveTenseMarker(tense, entryPointId) {
  const config = ENTRY_POINT_NODES[entryPointId]
  if (!config) return null

  const nodeId = config.tenseNode
  const node = grammarGraph.nodes[nodeId]
  if (!node) return null

  // Map English tense to the Tongan word's english label
  const tenseMap = {
    past:    'past',
    present: 'present',
    perfect: 'perfect',
    future:  'future',
  }
  // Some nodes store parenthetical labels — map each tense to its alternate form
  const altLabels = {
    perfect: 'perfect (has done)',
    future:  'future (will do)',
  }

  const englishLabel = tenseMap[tense]
  if (!englishLabel) return null

  const altLabel = altLabels[tense]
  const word = node.words.find(w =>
    w.english === englishLabel || (altLabel && w.english === altLabel)
  )
  if (!word) return null

  return { tongan: word.tongan, english: word.english, nodeId, word }
}

// Canonical pronoun identity: person + number + inclusive → which Tongan word
// This handles the fact that 1st person has 3 forms (ku/ou/u) depending on tense,
// while other persons have stable forms.
const PRONOUN_IDENTITY = [
  { person: 1, number: 'singular', inclusive: false, candidates: ['ku', 'ou', 'u'] },
  { person: 2, number: 'singular', inclusive: false, candidates: ['ke'] },
  { person: 3, number: 'singular', inclusive: false, candidates: ['ne'] },
  { person: 1, number: 'plural',   inclusive: false, candidates: ['mau'] },
  { person: 1, number: 'plural',   inclusive: true,  candidates: ['tau'] },
  { person: 2, number: 'plural',   inclusive: false, candidates: ['mou'] },
  { person: 3, number: 'plural',   inclusive: false, candidates: ['nau'] },
  { person: 1, number: 'dual',     inclusive: false, candidates: ['ma'] },
  { person: 1, number: 'dual',     inclusive: true,  candidates: ['ta'] },
  { person: 2, number: 'dual',     inclusive: false, candidates: ['mo'] },
  { person: 3, number: 'dual',     inclusive: false, candidates: ['na'] },
]

/**
 * Resolve a pronoun word from the grammar graph based on semantic parameters.
 * @param {string} tenseMarkerTongan - the Tongan tense marker word (e.g., "Naʻa")
 * @param {number} person - 1, 2, or 3
 * @param {'singular'|'dual'|'plural'} number
 * @param {boolean} inclusive - only relevant for person=1
 * @param {string} pronounNodeId - which pronoun node to use (e.g., 'pronoun', 'pronoun_loc', 'pronoun_neg')
 * @returns {{ tongan: string, english: string, nodeId: string, word: object } | null}
 */
export function resolvePronoun(tenseMarkerTongan, person, number, inclusive, pronounNodeId) {
  const node = grammarGraph.nodes[pronounNodeId]
  if (!node) return null

  // Find valid pronouns for this tense marker
  const constraints = node.constraints
  if (!constraints?.valid_combinations) {
    // No constraints — just find by person/number
    return findPronounByIdentity(node, pronounNodeId, person, number, inclusive)
  }

  // Normalize tense marker for lookup (lowercase, handle special chars)
  const tmLower = tenseMarkerTongan.toLowerCase()
  const validPronouns = constraints.valid_combinations[tmLower]
  if (!validPronouns) return null

  // Find the pronoun identity that matches person/number/inclusive
  const identity = PRONOUN_IDENTITY.find(p =>
    p.person === person && p.number === number && p.inclusive === inclusive
  )
  if (!identity) return null

  // Find the specific Tongan word that is both in the identity candidates AND in valid_combinations
  for (const candidate of identity.candidates) {
    if (validPronouns.includes(candidate)) {
      const word = node.words.find(w => w.tongan === candidate)
      if (word) {
        return { tongan: word.tongan, english: word.english, nodeId: pronounNodeId, word }
      }
    }
  }

  return null
}

function findPronounByIdentity(node, nodeId, person, number, inclusive) {
  const identity = PRONOUN_IDENTITY.find(p =>
    p.person === person && p.number === number && p.inclusive === inclusive
  )
  if (!identity) return null

  for (const candidate of identity.candidates) {
    const word = node.words.find(w => w.tongan === candidate)
    if (word) {
      return { tongan: word.tongan, english: word.english, nodeId, word }
    }
  }
  return null
}

/**
 * Build the full set of pre-seeded steps for a guided flow.
 * Includes the tense marker, any fixed intermediary nodes, and the pronoun.
 *
 * @param {string} entryPointId
 * @param {'past'|'present'|'perfect'|'future'} tense
 * @param {number|null} person - null for impersonal/no-pronoun flows
 * @param {'singular'|'dual'|'plural'|null} number
 * @param {boolean} inclusive
 * @returns {{ steps: Array<{nodeId: string, word: object}>, resumeNodeId: string } | null}
 */
export function buildPreSeededSteps(entryPointId, tense, person, number, inclusive) {
  const config = ENTRY_POINT_NODES[entryPointId]
  if (!config) return null

  const steps = []

  // 1. Tense marker
  const tm = resolveTenseMarker(tense, entryPointId)
  if (!tm) return null
  steps.push({ nodeId: tm.nodeId, word: tm.word })

  // 2. For negation flows: add fixed intermediary nodes ('ikai, te/ke)
  const fixedNodes = NEGATION_FIXED_NODES[entryPointId]
  if (fixedNodes) {
    if (entryPointId === 'negation' && person === null) {
      // Name negation: only pre-seed 'ikai, let branching handle te/ke choice
      const negWord = grammarGraph.nodes[fixedNodes[0]]
      if (negWord?.words.length === 1) {
        steps.push({ nodeId: fixedNodes[0], word: negWord.words[0] })
      }
    } else {
      // Standard pronoun negation or impersonal: add all fixed nodes
      for (const fixedNodeId of fixedNodes) {
        const fixedNode = grammarGraph.nodes[fixedNodeId]
        if (fixedNode?.words.length === 1) {
          steps.push({ nodeId: fixedNodeId, word: fixedNode.words[0] })
        }
      }
    }
  }

  // 3. Pronoun (if this entry point uses one)
  if (config.pronounNode && person !== null) {
    const pronoun = resolvePronoun(tm.word.tongan, person, number, inclusive, config.pronounNode)
    if (!pronoun) return null
    steps.push({ nodeId: pronoun.nodeId, word: pronoun.word })
  }

  // 4. Figure out what node to resume at
  const lastStep = steps[steps.length - 1]
  const lastNode = grammarGraph.nodes[lastStep.nodeId]
  // Find the next node after the last pre-seeded step
  let resumeNodeId = null
  if (lastNode?.next) {
    // Take the first required edge, or the first non-terminator edge.
    // (Phase 2A.2 split FINISH into FINISH_STATEMENT / FINISH_QUESTION; both
    // are terminators and should be skipped here.)
    const required = lastNode.next.find(
      e => e.required && e.node !== 'FINISH_STATEMENT' && e.node !== 'FINISH_QUESTION'
    )
    if (required) {
      resumeNodeId = required.node
    }
    // If no required edge, DynamicBuilder will enter branching phase (which is correct)
  }

  return { steps, resumeNodeId }
}

/**
 * Get the entry point configuration for a given ID.
 */
export function getEntryPointConfig(entryPointId) {
  return ENTRY_POINT_NODES[entryPointId] || null
}

/**
 * Get available tenses for a given entry point.
 * Returns array of { tense, label, description } for the wizard to display.
 */
export function getAvailableTenses(entryPointId) {
  const config = ENTRY_POINT_NODES[entryPointId]
  if (!config) return []

  const node = grammarGraph.nodes[config.tenseNode]
  if (!node) return []

  const tenseLabels = {
    'past':              { label: 'In the past', description: 'Something that already happened' },
    'present':           { label: 'Right now, or regularly', description: 'Something happening now or that you do habitually' },
    'perfect (has done)': { label: 'Already completed', description: 'Something that has been done — a change of state' },
    'perfect':           { label: 'Already completed', description: 'Something that has been done — a change of state' },
    'future':            { label: 'In the future', description: 'Something that will happen' },
  }

  return node.words.map(w => {
    const info = tenseLabels[w.english] || { label: w.english, description: '' }
    return {
      tense: w.english.replace(' (has done)', ''),
      label: info.label,
      description: info.description,
      tongan: w.tongan,
    }
  })
}
