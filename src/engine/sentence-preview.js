/**
 * sentence-preview — a live English preview for the in-progress sentence
 * builder. While the user is still building, the picker pages show this under
 * the Tongan line so they can see what they're assembling:
 *
 *   "Naʻa"            → "Past tense"
 *   "Naʻa ku"         → "Past tense, I"
 *   "Naʻa ku kai"     → "I ate"
 *   "Naʻa ku kai ʻa e ika" → "I ate the fish"
 *
 * Strategy: once the clause is complete enough for the real compositional
 * translator (engine/translate.js) to produce a sentence, THAT is the source
 * of truth — we just strip its trailing punctuation so it reads as an
 * in-progress fragment, and the preview always agrees with the finished
 * translation. Before the clause composes (e.g. a tense marker and pronoun
 * with no verb yet), we fall back to a lightweight per-step "running gloss"
 * that maps each confirmed word to a short English chunk. The translator's
 * many compose branches each assume a complete clause, so a separate gloss is
 * far less risky than retrofitting a "partial mode" into the translator.
 *
 * The preview reflects the FIRST surviving walker, the same one that drives
 * getRenderedSentence and the finished-screen translation, so the three never
 * disagree.
 */

import verbForms from '../data/verb-forms.json'
import { getFlatSteps } from './graph-walker'
import { translate } from './translate'

function normalize(s) {
  return (s || '').toLowerCase().replace(/[ʻ‘’`´]/g, "'")
}

// Case-insensitive, accent-normalized lookup into a verb-forms table.
function lookup(table, key) {
  const k = normalize(key)
  for (const [name, data] of Object.entries(table)) {
    if (normalize(name) === k) return data
  }
  return null
}

const TENSE_LABEL = {
  past: 'Past tense',
  present: 'Present tense',
  perfect: 'Perfect tense',
  future: 'Future tense',
}

const TENSE_NODE_PREFIX = 'tense_marker'
const PRONOUN_NODES = new Set([
  'pronoun', 'pronoun_loc', 'pronoun_neg', 'suggestion_pronoun', 'prohibition_pronoun',
])
const VERB_NODES = new Set([
  'verb', 'verb_tr', 'verb_ns', 'verb_cleft', 'verb_experiencer', 'verb_kohai',
  'command_verb', 'command_verb_plural', 'prohibition_verb',
])

function stripParens(s) {
  return (s || '').replace(/\s*\([^)]*\)/g, '').trim()
}
function stripTerminalPunct(s) {
  return (s || '').replace(/\s*[.?!]+$/, '')
}
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/**
 * Build the live English preview for a multi-walker state. Returns '' when
 * there's nothing meaningful to show yet (no walker, no steps, or only
 * structural words). Never throws — a preview must not break the builder.
 */
export function getLivePreview(mwState) {
  try {
    if (!mwState || !Array.isArray(mwState.walkers) || mwState.walkers.length === 0) {
      return ''
    }
    const walker = mwState.walkers[0].walkerState
    const steps = getFlatSteps(walker)
    if (!steps.length) return ''

    // Building is always rendered as a statement (no punctuation chosen yet);
    // the finished screen re-renders with the user's terminator choice.
    const t = translate(steps, false)
    if (t && (t.method === 'composed' || t.method === 'override') && t.text) {
      return stripTerminalPunct(t.text)
    }
    return runningGloss(steps)
  } catch {
    return ''
  }
}

function resolveTense(steps) {
  let tense = null
  for (const s of steps) {
    if (s.nodeId && s.nodeId.startsWith(TENSE_NODE_PREFIX)) {
      const tf = lookup(verbForms.tense_frames, s.word.tongan)
      if (tf) tense = tf.tense
    }
  }
  return tense
}

function conjugateAction(verb, tense) {
  switch (tense) {
    case 'past': return verb.past
    case 'perfect': return verb.past_participle
    default: return verb.base // present / future / unknown
  }
}

// Map a single step to a short English chunk, or null to skip it.
function chunkFor(step, steps, i, tense) {
  const { nodeId, word } = step
  if (!nodeId || !word) return null

  if (nodeId.startsWith(TENSE_NODE_PREFIX)) {
    return { text: TENSE_LABEL[tense] || 'tense' }
  }
  if (PRONOUN_NODES.has(nodeId)) {
    return { text: word.subject || stripParens(word.english) }
  }
  if (VERB_NODES.has(nodeId)) {
    const v = lookup(verbForms.verbs, word.tongan)
    if (v) {
      const text = v.type === 'adjective' ? v.base : conjugateAction(v, tense)
      return { text, isVerb: true }
    }
    return { text: stripParens(word.english), isVerb: true }
  }
  if (nodeId === 'preposed_modifier' || nodeId === 'modifier') {
    return { text: stripParens(word.english) }
  }
  if (nodeId === 'aspect_marker' || nodeId === 'aspect_marker_post' ||
      nodeId === 'aspect_marker_post_frequency') {
    return { text: stripParens(word.english).split('/')[0].trim() }
  }
  if (nodeId === 'negation_word' || nodeId === 'negation_word_imp') {
    return { text: 'not' }
  }
  if (nodeId === 'article') return null // folded into the following object
  if (nodeId === 'object') {
    let en = stripParens(word.english)
    const prev = steps[i - 1]
    if (prev && prev.nodeId === 'article') {
      const art = prev.word.article_type === 'indefinite' ? 'some' : 'the'
      en = `${art} ${en}`
    }
    return { text: en }
  }
  if (nodeId === 'time_word') return { text: stripParens(word.english) }
  if (nodeId === 'companion') return { text: `with ${stripParens(word.english)}` }

  // Structural words carry no English of their own.
  const en = word.english
  if (!en || en === '(connector)' || en === '(focus marker)') return null
  return { text: stripParens(en) }
}

function runningGloss(steps) {
  const tense = resolveTense(steps)
  const chunks = []
  let hasVerb = false
  for (let i = 0; i < steps.length; i++) {
    const c = chunkFor(steps[i], steps, i, tense)
    if (!c || !c.text) continue
    if (c.isVerb) hasVerb = true
    chunks.push(c.text)
  }
  if (!chunks.length) return ''
  // Before a verb lands the preview is a slot list ("Past tense, I"); once a
  // verb is present (but the full clause didn't compose) it reads as a
  // space-joined fragment ("Eat").
  const out = hasVerb ? chunks.join(' ') : chunks.join(', ')
  return cap(out)
}
