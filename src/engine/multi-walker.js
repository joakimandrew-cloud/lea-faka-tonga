/**
 * Multi-walker engine for the terminal-style sentence builder.
 *
 * Manages parallel walker states so the user can start building a sentence
 * from any valid first word — without picking an entry point first. When
 * a first word maps to multiple entry points (e.g. 'Oku can start a
 * statement, negation, existential, etc.), all matching walkers are
 * created and advanced in parallel. As the user picks words, walkers
 * that can't accept the choice are pruned until 1-2 survive.
 */

import grammarGraph from '../data/grammar-graph.json'
import {
  getFirstWords,
  createWalkerState,
  advanceInFrame,
  getCurrentFrameWords,
  getExtensionMenu,
  getWalkerStatus,
  takeExtension,
  finishFrame,
  finishSentence,
  getRenderedPath,
  setStepDefiniteness as walkerSetDefiniteness,
  currentFrame,
} from './graph-walker'

// ── Phases ──────────────────────────────────────────────────────────────

export const PHASE = {
  PICKING_FIRST_WORD: 'PICKING_FIRST_WORD',
  PICKING_CATEGORY: 'PICKING_CATEGORY',
  PICKING_WORD: 'PICKING_WORD',
  PICKING_EXTENSION_OR_FINISH: 'PICKING_EXTENSION_OR_FINISH',
  MIXED: 'MIXED',
  FINISHED: 'FINISHED',
}

// ── Helpers ─────────────────────────────────────────────────────────────

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

/** Get the grammar-graph node definition by id. */
function getNode(nodeId) {
  return grammarGraph.nodes[nodeId] || null
}

/**
 * Normalize a node label into a student-friendly part-of-speech category.
 * Collapses variants (e.g. "Verb (transitive)" → "Verb") so the UI
 * shows a manageable number of groups.
 */
const CATEGORY_NORMALIZE = {
  'Verb (transitive)': 'Verb',
  'Verb (cleft)': 'Verb',
  'Verb (experiencer)': 'Verb',
  'Verb (noun-subject)': 'Verb',
  'Negation word': 'Negation',
  'Negation word (impersonal)': 'Negation',
}

function normalizeCategory(label) {
  return CATEGORY_NORMALIZE[label] || label
}

// ── State creation ──────────────────────────────────────────────────────

/**
 * Create a fresh multi-walker state. No walkers yet — the user hasn't
 * picked a first word.
 */
export function createMultiWalker(chapter = 53) {
  return {
    chapter,
    walkers: [],
    phase: PHASE.PICKING_FIRST_WORD,
    activeCategory: null,
  }
}

// ── First-word options ──────────────────────────────────────────────────

/**
 * Return all possible first words, grouped by part-of-speech category.
 * Uses getFirstWords() from graph-walker.js but includes Commands
 * (unlike getFreeFirstWords) and excludes Subordinate.
 *
 * Returns { groups: [{ label, words: [firstWordItem] }] }
 * where each firstWordItem is { word, entryPoints, category }.
 */
export function getFirstWordOptions(state) {
  const all = getFirstWords(state.chapter)
    .filter(item => item.entryPoints.some(ep => ep.category !== 'Subordinate'))
    .map(item => ({
      ...item,
      entryPoints: item.entryPoints.filter(ep => ep.category !== 'Subordinate'),
    }))

  // Group by the start node's label
  const groupMap = {}
  for (const item of all) {
    // Use the first entry point's start node label as the category
    const startNodeId = item.entryPoints[0].startNodeId || item.entryPoints[0].start_node
    const node = getNode(startNodeId)
    const label = normalizeCategory(node ? node.label : 'Other')
    if (!groupMap[label]) groupMap[label] = []
    groupMap[label].push(item)
  }

  const groups = Object.entries(groupMap).map(([label, words]) => ({ label, words }))
  return { groups }
}

// ── First-word pick ─────────────────────────────────────────────────────

/**
 * User picked a first word. Creates walker states for every matching
 * entry point, advances each, prunes failures. Returns new state with
 * phase computed.
 */
export function pickFirstWord(state, firstWordItem) {
  const walkers = []

  for (const ep of firstWordItem.entryPoints) {
    try {
      const ws = createWalkerState(ep.id, state.chapter)
      const advanced = advanceInFrame(ws, firstWordItem.word)
      walkers.push({
        walkerState: advanced,
        entryPointId: ep.id,
        entryPointCategory: ep.category,
      })
    } catch {
      // Walker couldn't accept this word at this chapter — skip
    }
  }

  if (walkers.length === 0) {
    throw new Error(`No entry point could accept "${firstWordItem.word.tongan}"`)
  }

  return {
    ...state,
    walkers,
    phase: computePhase(walkers),
    activeCategory: null,
  }
}

// ── Phase computation ───────────────────────────────────────────────────

/**
 * Check if IN_PROGRESS walkers are in "branching mode" — the extension
 * menu has options but NO terminators. This means the user must pick
 * what comes next (verb, modifier, etc.) before they can finish. We
 * present this as a word/category choice, not as extensions.
 */
function isBranchingMode(walkersInProgress) {
  for (const w of walkersInProgress) {
    const menu = getExtensionMenu(w.walkerState)
    if (menu.terminators.length > 0) return false
  }
  return walkersInProgress.length > 0
}

function computePhase(walkers) {
  if (walkers.length === 0) return PHASE.FINISHED

  const selecting = walkers.filter(w => getWalkerStatus(w.walkerState) === 'SELECTING')
  const inProgress = walkers.filter(w => getWalkerStatus(w.walkerState) === 'IN_PROGRESS')

  if (selecting.length > 0 && inProgress.length > 0) {
    return PHASE.MIXED
  }

  if (selecting.length > 0) {
    const groups = groupWordsByCategory(selecting)
    return groups.length > 1 ? PHASE.PICKING_CATEGORY : PHASE.PICKING_WORD
  }

  if (inProgress.length > 0) {
    // When no terminators are available, this is a "branching" situation
    // (e.g., after pronoun: must pick verb/modifier/etc. before finishing).
    // Present as category/word picking, not as extensions.
    if (isBranchingMode(inProgress)) {
      const groups = groupBranchingExtensions(inProgress)
      return groups.length > 1 ? PHASE.PICKING_CATEGORY : PHASE.PICKING_WORD
    }
    return PHASE.PICKING_EXTENSION_OR_FINISH
  }

  return PHASE.FINISHED
}

// ── Word grouping ───────────────────────────────────────────────────────

function groupWordsByCategory(selectingWalkers) {
  const groupMap = {}

  for (const w of selectingWalkers) {
    const frame = currentFrame(w.walkerState)
    const nodeId = frame.currentNodeId
    const node = getNode(nodeId)
    const label = normalizeCategory(node ? node.label : 'Word')
    const words = getCurrentFrameWords(w.walkerState)

    if (!groupMap[label]) groupMap[label] = { label, wordMap: {} }

    for (const word of words) {
      const key = normalize(word.tongan)
      if (!groupMap[label].wordMap[key]) {
        groupMap[label].wordMap[key] = word
      }
    }
  }

  return Object.values(groupMap).map(g => ({
    label: g.label,
    words: Object.values(g.wordMap),
  }))
}

/**
 * Group branching extensions as word categories. When walkers are
 * IN_PROGRESS but have no terminators (branching mode), each extension
 * target is a node whose label serves as the category, and whose words
 * become the available picks.
 *
 * Returns groups similar to groupWordsByCategory, but built from
 * extension targets instead of currentNodeId.
 */
function groupBranchingExtensions(walkersInProgress) {
  const groupMap = {}

  for (const w of walkersInProgress) {
    const menu = getExtensionMenu(w.walkerState)
    for (const ext of menu.extensions) {
      const node = getNode(ext.node)
      if (!node) continue
      const label = normalizeCategory(node.label)
      if (!groupMap[label]) groupMap[label] = { label, extNodeId: ext.node, wordMap: {} }

      // Get words from this extension's target node
      const words = node.words || []
      const filtered = words.filter(word =>
        !word.min_chapter || word.min_chapter <= w.walkerState.chapter
      )
      for (const word of filtered) {
        const key = normalize(word.tongan)
        if (!groupMap[label].wordMap[key]) {
          groupMap[label].wordMap[key] = word
        }
      }
    }
  }

  return Object.values(groupMap).map(g => ({
    label: g.label,
    extNodeId: g.extNodeId,
    words: Object.values(g.wordMap),
  }))
}

// ── Get current options ─────────────────────────────────────────────────

/**
 * Return the options available at the current position.
 * Shape depends on the phase.
 */
export function getCurrentOptions(state) {
  const { phase, walkers } = state

  if (phase === PHASE.PICKING_FIRST_WORD) {
    return { type: 'first_words', ...getFirstWordOptions(state) }
  }

  if (phase === PHASE.PICKING_CATEGORY) {
    const selecting = walkers.filter(w => getWalkerStatus(w.walkerState) === 'SELECTING')
    const inProgress = walkers.filter(w => getWalkerStatus(w.walkerState) === 'IN_PROGRESS')

    // Use branching extensions if walkers are in branching mode
    const groups = (selecting.length > 0)
      ? groupWordsByCategory(selecting)
      : groupBranchingExtensions(inProgress)

    return {
      type: 'categories',
      categories: groups.map(g => ({ label: g.label, count: g.words.length })),
    }
  }

  if (phase === PHASE.PICKING_WORD) {
    const selecting = walkers.filter(w => getWalkerStatus(w.walkerState) === 'SELECTING')
    const inProgress = walkers.filter(w => getWalkerStatus(w.walkerState) === 'IN_PROGRESS')

    const groups = (selecting.length > 0)
      ? groupWordsByCategory(selecting)
      : groupBranchingExtensions(inProgress)

    // If activeCategory is set, filter to it; otherwise show the single group
    const target = state.activeCategory
      ? groups.find(g => g.label === state.activeCategory)
      : groups[0]
    return {
      type: 'words',
      words: target ? target.words : [],
      categoryLabel: target ? target.label : '',
      // Pass the extension node id for branching mode (used by pickWord)
      _branchingExtNodeId: target ? target.extNodeId : null,
    }
  }

  if (phase === PHASE.PICKING_EXTENSION_OR_FINISH) {
    return collectExtensionOptions(walkers)
  }

  if (phase === PHASE.MIXED) {
    const selecting = walkers.filter(w => getWalkerStatus(w.walkerState) === 'SELECTING')
    const inProgress = walkers.filter(w => getWalkerStatus(w.walkerState) === 'IN_PROGRESS')
    const groups = groupWordsByCategory(selecting)
    const extOptions = collectExtensionOptions(inProgress)
    return {
      type: 'mixed',
      wordGroups: groups,
      extensions: extOptions.extensions,
      terminators: extOptions.terminators,
      canFinishFrame: extOptions.canFinishFrame,
    }
  }

  return { type: 'finished' }
}

// ── Extension options ───────────────────────────────────────────────────

function collectExtensionOptions(walkersInProgress) {
  const extMap = {}
  const termMap = {}
  let canFinishFrame = false

  for (const w of walkersInProgress) {
    // Check if we're in a sub-frame that can be popped
    if (w.walkerState.frames.length > 1) {
      const frame = currentFrame(w.walkerState)
      if (frame.currentNodeId === null) {
        canFinishFrame = true
      }
    }

    const menu = getExtensionMenu(w.walkerState)
    for (const ext of menu.extensions) {
      if (!extMap[ext.node]) {
        const node = getNode(ext.node)
        extMap[ext.node] = {
          id: ext.node,
          label: ext.label || (node ? node.label : ext.node),
          contextHint: ext.context_hint || null,
        }
      }
    }
    for (const term of menu.terminators) {
      if (!termMap[term.node]) {
        // Determine punctuation from entry point category
        const isCommand = w.entryPointCategory === 'Commands'
        const isExclamatory = w.entryPointCategory === 'Exclamatory'
        let punct = '.'
        if (term.node === 'FINISH_QUESTION') punct = '?'
        else if (term.node === 'FINISH_EXCLAMATION' || isCommand || isExclamatory) punct = '!'
        termMap[term.node] = { id: term.node, punct }
      }
    }
  }

  return {
    type: 'extensions',
    extensions: Object.values(extMap),
    terminators: Object.values(termMap),
    canFinishFrame,
  }
}

// ── Category pick ───────────────────────────────────────────────────────

/**
 * User picked a part-of-speech category. Filters to words in that category.
 */
export function pickCategory(state, categoryLabel) {
  return {
    ...state,
    phase: PHASE.PICKING_WORD,
    activeCategory: categoryLabel,
  }
}

// ── Word pick ───────────────────────────────────────────────────────────

/**
 * User picked a word. Advance all surviving walkers, prune those that fail.
 *
 * Handles two cases:
 * 1. SELECTING walkers — advance directly with advanceInFrame
 * 2. IN_PROGRESS walkers in branching mode — take the extension first
 *    (which sets currentNodeId via branching transition), then advance
 */
export function pickWord(state, word) {
  const newWalkers = []

  for (const w of state.walkers) {
    const status = getWalkerStatus(w.walkerState)

    if (status === 'SELECTING') {
      try {
        const advanced = advanceInFrame(w.walkerState, word)
        newWalkers.push({ ...w, walkerState: advanced })
      } catch {
        // Walker can't accept this word — pruned
      }
    } else if (status === 'IN_PROGRESS') {
      // Branching mode: find which extension target node contains this word,
      // take that extension (branching transition), then advance.
      const menu = getExtensionMenu(w.walkerState)
      for (const ext of menu.extensions) {
        try {
          const branched = takeExtension(w.walkerState, ext.node)
          const advanced = advanceInFrame(branched, word)
          newWalkers.push({ ...w, walkerState: advanced })
          break // Only need one successful path per walker
        } catch {
          // This extension path doesn't work — try next
        }
      }
    }
  }

  if (newWalkers.length === 0) {
    throw new Error(`No walker could accept "${word.tongan}"`)
  }

  return {
    ...state,
    walkers: newWalkers,
    phase: computePhase(newWalkers),
    activeCategory: null,
  }
}

// ── Extension pick ──────────────────────────────────────────────────────

/**
 * User picked an extension from the continuation menu.
 * Takes the extension on all walkers that offer it, prunes the rest.
 */
export function pickExtension(state, extensionTargetId) {
  const newWalkers = []

  for (const w of state.walkers) {
    const status = getWalkerStatus(w.walkerState)
    if (status !== 'IN_PROGRESS') continue
    try {
      const extended = takeExtension(w.walkerState, extensionTargetId)
      newWalkers.push({ ...w, walkerState: extended })
    } catch {
      // Walker doesn't offer this extension — pruned
    }
  }

  if (newWalkers.length === 0) {
    throw new Error(`No walker offers extension "${extensionTargetId}"`)
  }

  return {
    ...state,
    walkers: newWalkers,
    phase: computePhase(newWalkers),
    activeCategory: null,
  }
}

// ── Finish frame ────────────────────────────────────────────────────────

/**
 * Pop the current sub-frame on all walkers that support it.
 */
export function finishCurrentFrame(state) {
  const newWalkers = []

  for (const w of state.walkers) {
    if (w.walkerState.frames.length > 1) {
      try {
        const popped = finishFrame(w.walkerState)
        newWalkers.push({ ...w, walkerState: popped })
      } catch {
        // Can't pop — pruned
      }
    }
  }

  if (newWalkers.length === 0) {
    throw new Error('No walker has a sub-frame to finish')
  }

  return {
    ...state,
    walkers: newWalkers,
    phase: computePhase(newWalkers),
    activeCategory: null,
  }
}

// ── Terminator pick (finish sentence) ───────────────────────────────────

/**
 * User chose to finish with . or ? (or !).
 * Finishes using the first walker that supports the chosen terminator.
 */
export function pickTerminator(state, terminatorId) {
  for (const w of state.walkers) {
    const status = getWalkerStatus(w.walkerState)
    if (status !== 'IN_PROGRESS') continue

    // Collapse any sub-frames first
    let ws = w.walkerState
    while (ws.frames.length > 1) {
      try {
        ws = finishFrame(ws)
      } catch {
        break
      }
    }
    if (ws.frames.length !== 1) continue

    try {
      const finished = finishSentence(ws, terminatorId)
      return {
        ...state,
        walkers: [{ ...w, walkerState: finished }],
        phase: PHASE.FINISHED,
        activeCategory: null,
      }
    } catch {
      // This walker can't finish with this terminator — try next
    }
  }

  throw new Error(`No walker can finish with terminator "${terminatorId}"`)
}

// ── Rendered sentence ───────────────────────────────────────────────────

/**
 * Get the rendered Tongan sentence from the first surviving walker.
 * Returns an array of { nodeId, word, renderedTongan } steps.
 */
export function getRenderedSentence(state) {
  if (state.walkers.length === 0) return []
  return getRenderedPath(state.walkers[0].walkerState)
}

/**
 * Get the finished walker state (for translation).
 */
export function getFinishedWalker(state) {
  if (state.phase !== PHASE.FINISHED) return null
  if (state.walkers.length === 0) return null
  return state.walkers[0].walkerState
}

/**
 * Get the entry point category of the first surviving walker.
 * Used for punctuation display (Commands → !, others → .)
 */
export function getEntryPointCategory(state) {
  if (state.walkers.length === 0) return null
  return state.walkers[0].entryPointCategory
}

// ── Definiteness ────────────────────────────────────────────────────────

/**
 * Set definiteness on a step across all walkers.
 */
export function setDefiniteness(state, flatStepIndex, level) {
  const newWalkers = state.walkers.map(w => {
    try {
      return { ...w, walkerState: walkerSetDefiniteness(w.walkerState, flatStepIndex, level) }
    } catch {
      return w
    }
  })

  return { ...state, walkers: newWalkers }
}

// ── Reset ───────────────────────────────────────────────────────────────

export function resetMultiWalker(chapter = 53) {
  return createMultiWalker(chapter)
}

// ── Debug: walker count ─────────────────────────────────────────────────

export function getWalkerCount(state) {
  return state.walkers.length
}

// ── Unified picker data ─────────────────────────────────────────────────

/**
 * Return ALL pickable options in a single unified structure for the
 * inline picker. Groups contain words AND special actions (extensions,
 * terminators) presented as virtual "words" so the picker can treat
 * everything uniformly.
 *
 * Returns: { groups: [{ label, items: [{ type, ...data }] }] }
 *
 * Item types:
 *   { type: 'first_word', item: firstWordItem }
 *   { type: 'word', word: wordObj }
 *   { type: 'extension', id, label }
 *   { type: 'terminator', id, punct }
 *   { type: 'finish_frame' }
 */
/**
 * Map a list of word objects into picker items. Sorts adjectival words
 * (tags includes 'adjective') after non-adjectival words and annotates
 * their hint with "· adj", so students can tell action verbs from
 * stative/adjectival verbs inside the shared Verb category without us
 * having to split the grammatical class (Tongan adjectives syntactically
 * fill the verb slot — see grammar-notes.json "adjective_as_verb").
 * Non-verb groups have no adjective-tagged words, so the sort is a no-op
 * and the annotation never renders.
 */
// Mid-sentence display: data stores tense markers and other typically
// sentence-initial words capitalized (Naʻe, ʻOku, Kuo) because that's their
// usual appearance. When the picker offers one of these as a mid-sentence
// choice (e.g. `tense_marker_neg` after a `ka` clause connector), the
// display should match how the word will actually render — lowercase.
// Proper names (noun_class = personal / local) stay capitalized in any
// position. lowercaseInitial skips the fakauʻa prefix so ʻOku → ʻoku.
function midSentenceDisplay(w) {
  if (w.noun_class === 'personal' || w.noun_class === 'local') return w.tongan
  if (!w.tongan) return w.tongan
  for (let i = 0; i < w.tongan.length; i++) {
    const c = w.tongan[i]
    if (c !== c.toLowerCase()) {
      return w.tongan.slice(0, i) + c.toLowerCase() + w.tongan.slice(i + 1)
    }
    if (c >= 'a' && c <= 'z') return w.tongan
  }
  return w.tongan
}

function wordsToPickerItems(words) {
  const isAdj = (w) => Array.isArray(w.tags) && w.tags.includes('adjective')
  const sorted = [...words].sort((a, b) => (isAdj(a) ? 1 : 0) - (isAdj(b) ? 1 : 0))
  return sorted.map(w => ({
    type: 'word',
    word: w,
    display: midSentenceDisplay(w),
    hint: isAdj(w) ? `${w.english} \u00b7 adj` : w.english,
  }))
}

export function getPickerData(state) {
  const opts = getCurrentOptions(state)
  const groups = []

  if (opts.type === 'first_words') {
    for (const g of opts.groups) {
      groups.push({
        label: g.label,
        items: g.words.map(item => ({
          type: 'first_word',
          item,
          display: item.word.tongan,
          hint: item.word.english,
        })),
      })
    }
    return { groups }
  }

  if (opts.type === 'categories' || opts.type === 'words') {
    // Resolve all categories into their words
    const { walkers } = state
    const selecting = walkers.filter(w => getWalkerStatus(w.walkerState) === 'SELECTING')
    const inProgress = walkers.filter(w => getWalkerStatus(w.walkerState) === 'IN_PROGRESS')
    const allGroups = (selecting.length > 0)
      ? groupWordsByCategory(selecting)
      : groupBranchingExtensions(inProgress)

    for (const g of allGroups) {
      groups.push({
        label: g.label,
        items: wordsToPickerItems(g.words),
      })
    }
    return { groups }
  }

  // Build terminator items once — reused when merging Finish into the
  // continuation group below. Hint reads as "finish — statement" etc.
  // so the item is unambiguous when it sits above extensions/words in
  // the picker list.
  const terminatorItems = opts.terminators
    ? opts.terminators.map(t => ({
        type: 'terminator',
        id: t.id,
        display: t.punct,
        hint: t.punct === '.' ? 'finish \u2014 statement'
          : t.punct === '?' ? 'finish \u2014 question'
            : 'finish \u2014 exclamation',
      }))
    : []

  if (opts.type === 'extensions') {
    // When Finish is available alongside extensions/frame-pop choices, it
    // goes at the top of the SAME group as those choices — not as its own
    // group. That way the user sees `.`, `?`, `+ verb`, `+ adverb`, etc.
    // all in one up/down-scrollable list. Arrow-right to a separate Finish
    // group would force the user past the other word choices, which was
    // the reported UX problem.
    const extensionItems = opts.extensions.map(ext => ({
      type: 'extension',
      id: ext.id,
      display: '+ ' + ext.label,
      hint: ext.contextHint || '',
    }))

    const primaryItems = [...terminatorItems, ...extensionItems]
    if (primaryItems.length > 0) {
      groups.push({
        // Label reflects what the group offers: "Finish" when terminators
        // are the only choices, otherwise "Add more" (which still accepts
        // terminators at the top of its list).
        label: extensionItems.length === 0 ? 'Finish' : 'Add more',
        items: primaryItems,
      })
    }

    // Done (finish_frame) stays a separate group, and only appears when
    // there are no terminators — pickTerminator auto-pops sub-frames, so
    // Done would be redundant when Finish is available.
    if (opts.canFinishFrame && terminatorItems.length === 0) {
      groups.push({
        label: 'Done',
        items: [{ type: 'finish_frame', display: 'done with this part', hint: '' }],
      })
    }
    return { groups }
  }

  if (opts.type === 'mixed') {
    // MIXED phase = some walkers still SELECTING for a required slot, others
    // already IN_PROGRESS at a branching/extension menu. Example: after
    // "Naʻa ku", the `statement` walker is IN_PROGRESS at `pronoun` (6
    // branching extensions) while the `location_state` walker is SELECTING
    // for `preposition_i_fixed` (one word: `ʻi`).
    //
    // Same merge-not-separate rule as `extensions`: when Finish is offered
    // it goes at the top of the continuation group (extensions, or if
    // there are no extensions, the first word group) so the user doesn't
    // have to arrow past Finish to reach the other options.
    const extensionItems = opts.extensions.map(ext => ({
      type: 'extension',
      id: ext.id,
      display: '+ ' + ext.label,
      hint: ext.contextHint || '',
    }))

    const wordGroupsMapped = opts.wordGroups.map(g => ({
      label: g.label,
      items: wordsToPickerItems(g.words),
    }))

    if (extensionItems.length > 0) {
      groups.push({
        label: 'Add more',
        items: [...terminatorItems, ...extensionItems],
      })
      for (const g of wordGroupsMapped) groups.push(g)
    } else if (terminatorItems.length > 0 && wordGroupsMapped.length > 0) {
      // No extensions but other word groups exist — prepend terminators
      // to the first word group so Finish isn't a stand-alone group the
      // user has to arrow past.
      const [first, ...rest] = wordGroupsMapped
      groups.push({ label: first.label, items: [...terminatorItems, ...first.items] })
      for (const g of rest) groups.push(g)
    } else if (terminatorItems.length > 0) {
      // Terminators are the only option — stand-alone group is fine here
      // because there are no other word choices to reach.
      groups.push({ label: 'Finish', items: terminatorItems })
    } else {
      for (const g of wordGroupsMapped) groups.push(g)
    }

    if (opts.canFinishFrame && terminatorItems.length === 0) {
      groups.push({
        label: 'Done',
        items: [{ type: 'finish_frame', display: 'done with this part', hint: '' }],
      })
    }
    return { groups }
  }

  return { groups: [] }
}
