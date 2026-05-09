import grammarNotes from '../data/grammar-notes.json'

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

/**
 * Find all matching grammar notes for the current sentence state.
 * @param {Array} steps - [{nodeId, word: {tongan, english, tags, ...}}, ...]
 * @param {number} chapter - Current chapter level
 * @returns {Array} Matching notes sorted by relevance
 */
export function matchNotes(steps, chapter) {
  if (steps.length === 0) return []

  return grammarNotes.notes
    .filter(note => {
      if (note.min_chapter && note.min_chapter > chapter) return false
      return evaluateTrigger(note.trigger, steps)
    })
    .slice(0, 3) // Show at most 3 notes
}

/**
 * Evaluate a trigger condition against the current sentence state.
 */
function evaluateTrigger(trigger, steps) {
  if (!trigger) return false

  // Check all conditions — they all must pass (implicit AND)
  for (const [key, value] of Object.entries(trigger)) {
    if (!checkCondition(key, value, steps)) return false
  }

  return true
}

function checkCondition(key, value, steps) {
  switch (key) {
    // "has_node": "modifier" — checks if a node type exists in steps
    case 'has_node': {
      if (typeof value === 'string') {
        return steps.some(s => s.nodeId === value)
      }
      // "has_node": { "tense_marker": "'Oku" } — checks specific node+value
      if (typeof value === 'object') {
        return Object.entries(value).every(([nodeId, expected]) => {
          const step = steps.find(s => s.nodeId === nodeId)
          return step && normalize(step.word.tongan) === normalize(expected)
        })
      }
      return false
    }

    // "has_node_value": { "tense_marker": "'Oku" } — checks specific value
    case 'has_node_value': {
      return Object.entries(value).every(([nodeId, expected]) => {
        const step = steps.find(s => s.nodeId === nodeId)
        return step && normalize(step.word.tongan) === normalize(expected)
      })
    }

    // "any_node_value": { "tense_marker": ["Na'a", "Na'e"] } — checks if value is in list
    case 'any_node_value': {
      return Object.entries(value).every(([nodeId, expectedList]) => {
        const step = steps.find(s => s.nodeId === nodeId)
        if (!step) return false
        return expectedList.some(exp => normalize(exp) === normalize(step.word.tongan))
      })
    }

    // "verb_has_tag": "action" — checks if the selected verb has a specific tag
    case 'verb_has_tag': {
      const verbStep = steps.find(s => s.nodeId === 'verb')
      if (!verbStep || !verbStep.word.tags) return false
      return verbStep.word.tags.includes(value)
    }

    // "object_has_tag": "bare_noun" — checks if the selected object has a specific tag
    case 'object_has_tag': {
      const objStep = steps.find(s => s.nodeId === 'object')
      if (!objStep || !objStep.word.tags) return false
      return objStep.word.tags.includes(value)
    }

    // "sentence_length": 1 — checks number of steps
    case 'sentence_length': {
      return steps.length === value
    }

    // "min_chapter" is handled in the filter before evaluateTrigger
    case 'min_chapter':
      return true

    default:
      return true
  }
}
