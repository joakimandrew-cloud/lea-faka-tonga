/**
 * Slot-based sentence builder engine for Lea Faka-Tonga.
 *
 * Adapter layer: converts slot selections into the step-array format
 * that translate.js and note-matcher.js expect, so both the old graph
 * engine and the new slot engine can coexist.
 */

import sentencePatterns from '../data/sentence-patterns.json'
import vocabularyBySlot from '../data/vocabulary-by-slot.json'
import grammarGraph from '../data/grammar-graph.json'
import { translate } from './translate.js'
import { matchNotes } from './note-matcher.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

function getPattern(patternId) {
  return sentencePatterns.patterns.find(p => p.id === patternId) || null
}

// ---------------------------------------------------------------------------
// Slot → Node-ID mapping (for the translate.js adapter)
// ---------------------------------------------------------------------------

// Default mapping: slotId → graph-walker nodeId
const DEFAULT_NODE = {
  tense_marker:       'tense_marker',
  subject:            'pronoun',
  verb:               'verb',
  modifier:           'modifier',
  object:             'object',
  time:               'time_word',
  preposition:        'preposition',
  place:              'prep_phrase',
  companion:          'companion',
  comitative:         'mo_fixed',
  question_word:      'question_word',
  polite_particle:    'polite_particle',
  postposed_pronoun:  'postposed_pronoun',
  suggestion_pronoun: 'suggestion_pronoun',
  demonstrative:      'demonstrative',
  imperative_marker:  'imperative_mou',
  prohibition_marker: 'prohibition_marker',
  negation:           'negation_word',
  neg_connector:      'neg_connector',
  negation_prefix:    'ko_neg_prefix',
  predicate_noun:     'predicate_noun',
  ko_particle:        'ko_e_fixed',
  ko_fixed:           'ko_e_ha_fixed',
  ko_question:        'ko_hai_fixed',
  noun:               'noun_ko',
  noun_subject:       'noun_subject_name',
  subject_phrase:     'focus_and_name',
  prep_pronoun:       'prep_pronoun',
}

// Pattern-specific overrides.
// Special values:
//   '_MERGE' — append this slot's Tongan value to the previous step
//   '_SKIP'  — omit from translation steps (still in the Tongan string)
const PATTERN_NODES = {
  s05: {
    tense_marker: 'tense_marker_loc',
    subject:      'pronoun_loc',
    preposition:  'preposition_i_fixed',
    place:        'place',
  },
  s08: { verb: 'command_verb' },
  s09: { imperative_marker: 'imperative_mou', verb: 'command_verb_plural' },
  s10: { prohibition_marker: 'prohibition_marker', subject: 'prohibition_pronoun', verb: 'prohibition_verb' },
  s12: {
    tense_marker:  'tense_marker_neg',
    negation:      'negation_word',
    neg_connector: 'neg_connector',
    subject:       'pronoun_neg',
  },
  s13: { negation_prefix: 'ko_neg_prefix', predicate_noun: 'predicate_noun', subject: 'subject_ko' },
  s15: { ko_question: 'ko_hai_fixed', tense_marker: 'tense_marker_kohai', verb: 'verb_kohai' },
  s16: { ko_fixed: 'ko_e_ha_fixed', question_word: '_MERGE', demonstrative: 'demonstrative' },
  s17: { ko_question: 'ko_fe_fixed', subject_phrase: 'focus_and_name' },
  s18: { ko_particle: 'ko_e_fixed', article: '_MERGE', noun: 'noun_ko', demonstrative: 'demonstrative' },
  s22: { tense_marker: 'tense_marker_ns', verb: 'verb_ns', focus_marker: '_SKIP', noun_subject: 'noun_subject_name' },
  s24: { tense_marker: 'tense_marker_exp', verb: 'verb_experiencer', prep_pronoun: 'prep_pronoun' },
}

function resolveNodeId(patternId, slotId) {
  const map = PATTERN_NODES[patternId]
  if (map && slotId in map) return map[slotId]
  return DEFAULT_NODE[slotId] || slotId
}

// ---------------------------------------------------------------------------
// Graph-compatible english labels (for literal translation parity)
//
// vocabulary-by-slot.json uses pedagogical labels ("past (before ku/ke)")
// while grammar-graph.json uses display labels ("past"). The literal
// translation is built by translate.js from step.word.english, so the
// adapter must normalise these to match the graph.
// ---------------------------------------------------------------------------

/**
 * Return the english label grammar-graph.json would use for a tense marker.
 * The main tense_marker node keeps "(has done)" / "(will do)"; other TM
 * nodes use bare labels.
 */
function graphTmEnglish(nodeId, tongan) {
  const key = normalize(tongan)
  if (key === "na'a" || key === "na'e") return 'past'
  if (key === "'oku") return 'present'
  if (key === 'kuo') return nodeId === 'tense_marker' ? 'perfect (has done)' : 'perfect'
  if (key === 'te')  return nodeId === 'tense_marker' ? 'future (will do)' : 'future'
  if (key === "'e")  return 'future'
  return null
}

/**
 * Return the english label grammar-graph.json would use for a pronoun.
 * pronoun_neg uses bare "I" for 1sg; other pronoun nodes annotate
 * with "(after <TM>)".
 */
const PRONOUN_GRAPH_ENGLISH = {
  'ku':  'I (after Na\u02BBa)',
  'ou':  'I (after \u02BBoku)',
  'u':   'I (after kuo/te)',
  'ke':  'you (singular)',
  'ne':  'he/she',
  'nau': 'they',
  'mau': 'we (exclusive)',
  'tau': 'we (inclusive)',
  'mou': 'you (plural)',
  'na':  'they two',
  'ma':  'we two (exclusive)',
  'ta':  'we two (inclusive)',
  'mo':  'you two',
}

function graphPronounEnglish(nodeId, tongan) {
  if (nodeId === 'pronoun_neg' && tongan === 'u') return 'I'
  return PRONOUN_GRAPH_ENGLISH[tongan] || null
}

// ---------------------------------------------------------------------------
// Pronoun helpers
// ---------------------------------------------------------------------------

function makePronounOption(shortForm, data, code) {
  return {
    tongan: shortForm,
    english: data.subject_english,
    subject_english: data.subject_english,
    person: data.person,
    number: data.number,
    long_form: data.long,
    min_chapter: data.min_chapter,
    pronoun_code: code,
  }
}

/**
 * Flatten the nested pronouns structure into a flat array of option objects.
 * When the pattern has pronoun_dependencies, all 1sg short forms are included
 * so the dependency filter can pick the correct one. Otherwise 'u' is used as
 * the default invariant form (e.g. negation always uses u for 1sg).
 */
function flattenPronouns(hasDependencies) {
  const pronouns = vocabularyBySlot.pronouns
  const result = []

  for (const [code, data] of Object.entries(pronouns)) {
    if (code === '1sg') {
      if (hasDependencies) {
        const seen = new Set()
        for (const form of Object.values(data.short_forms)) {
          if (!seen.has(form)) {
            seen.add(form)
            result.push(makePronounOption(form, data, code))
          }
        }
      } else {
        result.push(makePronounOption('u', data, code))
      }
    } else {
      result.push(makePronounOption(data.short, data, code))
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Preposition class-form synthesis + place-option enrichment
// ---------------------------------------------------------------------------
//
// grammar-graph.json is the single source of truth for prep class_forms (ki,
// kia, kiate, ki he ...) and place-word metadata (noun_class, animacy).
// vocabulary-by-slot.json only carries base forms + local-class places, so the
// practice UI must synthesise the missing variants at option-fetch time.

const PREP_GRAPH_WORDS = (grammarGraph.nodes.preposition?.words) || []
const PREP_PHRASE_GRAPH_WORDS = (grammarGraph.nodes.prep_phrase?.words) || []

// tongan → { noun_class, animacy, min_chapter, english }
const PREP_PHRASE_META = new Map(
  PREP_PHRASE_GRAPH_WORDS.map(w => [w.tongan, {
    noun_class: w.noun_class,
    animacy: w.animacy,
    min_chapter: w.min_chapter,
    english: w.english,
  }])
)

const CLASS_ORDER = ['local', 'personal', 'common', 'pronoun']

function normaliseClassForm(v) {
  if (typeof v === 'string') return { tongan: v, min_chapter: undefined }
  if (v && typeof v === 'object') return { tongan: v.tongan, min_chapter: v.min_chapter }
  return null
}

/**
 * For each base preposition in `baseOptions` that has `class_forms` metadata
 * in grammar-graph.json, emit one entry per class form (ki, kia, kiate,
 * ki he, ...). Entries without class_forms metadata (e.g. Ch 26 benefactive
 * `maʻa`, `moʻo`) pass through unchanged. Each synthesised entry carries
 * its noun_class so the place slot can pair to it, and a per-form min_chapter
 * so chapter gating surfaces only the forms the chapter teaches.
 */
function expandPrepositionOptions(baseOptions) {
  const graphByTongan = new Map(PREP_GRAPH_WORDS.map(w => [w.tongan, w]))
  const expanded = []
  for (const base of baseOptions) {
    const graphEntry = graphByTongan.get(base.tongan)
    if (!graphEntry || !graphEntry.class_forms) {
      expanded.push({ ...base })
      continue
    }
    for (const cls of CLASS_ORDER) {
      const cf = normaliseClassForm(graphEntry.class_forms[cls])
      if (!cf) continue
      expanded.push({
        tongan: cf.tongan,
        english: base.english,
        family: graphEntry.family,
        noun_class: cls,
        min_chapter: cf.min_chapter ?? base.min_chapter,
      })
    }
  }
  return expanded
}

/**
 * Resolve the effective preposition noun_class for smart-pairing. The
 * preposition may be user-filled (carries noun_class from expandPreposition-
 * Options) OR locked on the pattern (s05 locks `ʻi`, which has no attached
 * class — infer from the Tongan surface form via grammar-graph class_forms).
 * Returns a class key ('local'/'personal'/'common'/'pronoun') or null.
 */
function resolvePrepositionNounClass(pattern, filledSlots) {
  if (filledSlots.preposition?.noun_class) return filledSlots.preposition.noun_class
  const prepSlot = pattern.slots.find(s => s.id === 'preposition')
  const locked = prepSlot?.locked ? prepSlot.locked_value : null
  const tongan = locked?.tongan || filledSlots.preposition?.tongan
  if (!tongan) return null
  for (const base of PREP_GRAPH_WORDS) {
    if (!base.class_forms) continue
    for (const [cls, v] of Object.entries(base.class_forms)) {
      const cf = normaliseClassForm(v)
      if (cf && cf.tongan === tongan) return cls
    }
  }
  return null
}

/**
 * Place options for s05/s06 etc.: start from vocabulary-by-slot.locations
 * (local-class places + demonstratives), then merge in personal-name and
 * pronoun complements from grammar-graph.prep_phrase.words so practice for
 * `kia`/`kiate` etc. has something to pair with. Every returned entry is
 * tagged with noun_class + animacy.
 */
function buildPlaceOptions() {
  const merged = new Map()
  for (const loc of (vocabularyBySlot.locations || [])) {
    const meta = PREP_PHRASE_META.get(loc.tongan)
    merged.set(loc.tongan, {
      ...loc,
      noun_class: meta?.noun_class ?? 'local',
      animacy: meta?.animacy ?? 'thing',
    })
  }
  for (const w of PREP_PHRASE_GRAPH_WORDS) {
    if (merged.has(w.tongan)) continue
    if (w.noun_class === 'local') continue
    merged.set(w.tongan, {
      tongan: w.tongan,
      english: w.english,
      min_chapter: w.min_chapter,
      noun_class: w.noun_class,
      animacy: w.animacy,
    })
  }
  return Array.from(merged.values())
}

// ---------------------------------------------------------------------------
// Vocabulary lookup
// ---------------------------------------------------------------------------

function getVocabularyOptions(source, hasPronounDeps) {
  if (!source) return []

  if (typeof source === 'string') {
    if (source === 'pronouns') return flattenPronouns(hasPronounDeps)
    return vocabularyBySlot[source] || []
  }

  if (Array.isArray(source)) {
    return source.flatMap(key => vocabularyBySlot[key] || [])
  }

  return []
}

// ---------------------------------------------------------------------------
// Slot-condition evaluation
// ---------------------------------------------------------------------------

function evaluateSlotCondition(condition, filledSlots) {
  if (!condition) return true
  if (condition.type === 'verb_has_tag') {
    const verb = filledSlots.verb
    if (!verb || !verb.tags) return false
    return verb.tags.includes(condition.tag)
  }
  return true
}

// ===========================================================================
// EXPORTED API
// ===========================================================================

/**
 * 1. Get available (unfilled, user-selectable) slots for a pattern.
 *    Locked slots are excluded — they are auto-filled.
 *    Conditional slots are excluded when their condition is unmet.
 */
export function getAvailableSlots(patternId, filledSlots = {}) {
  const pattern = getPattern(patternId)
  if (!pattern) return []

  return pattern.slots.filter(slot => {
    if (slot.locked) return false
    if (slot.id in filledSlots) return false
    if (slot.condition && !evaluateSlotCondition(slot.condition, filledSlots)) return false
    return true
  })
}

/**
 * 2. Get vocabulary options for a specific slot, filtered by chapter and
 *    pronoun dependencies.
 */
export function getOptionsForSlot(patternId, slotId, filledSlots = {}, maxChapter = 53) {
  const pattern = getPattern(patternId)
  if (!pattern) return []

  const slot = pattern.slots.find(s => s.id === slotId)
  if (!slot) return []

  // Locked slots expose only the locked value
  if (slot.locked) return slot.locked_value ? [slot.locked_value] : []

  const hasDeps = !!pattern.pronoun_dependencies
  let options = getVocabularyOptions(slot.options_source, hasDeps)

  // Preposition slot: synthesise class-form variants (ki, kia, kiate, ki he, ...)
  // from grammar-graph so practice exposes every form the chapter teaches.
  if (slot.id === 'preposition' && slot.options_source === 'prepositions') {
    options = expandPrepositionOptions(options)
  }

  // Place slot: merge vocabulary-by-slot.locations with grammar-graph
  // prep_phrase.words so personal-name and pronoun complements become
  // selectable when the user has picked a matching preposition form.
  if (slot.id === 'place' && slot.options_source === 'locations') {
    options = buildPlaceOptions()
  }

  // Chapter gate
  options = options.filter(opt => !opt.min_chapter || opt.min_chapter <= maxChapter)

  // Smart pairing: when the pattern's preposition is set (user-filled OR
  // locked on the pattern), narrow the place slot to matching noun_class.
  // Only applies when the place options actually carry noun_class metadata
  // (i.e. they came from buildPlaceOptions). Patterns like s38 use
  // `existential_locations` which has no class tags — skip pairing there.
  if (slot.id === 'place' && options.some(o => o.noun_class)) {
    const wanted = resolvePrepositionNounClass(pattern, filledSlots)
    if (wanted) options = options.filter(opt => opt.noun_class === wanted)
  }

  // Pronoun dependency filtering
  if (slot.depends_on === 'tense_marker' && slot.type === 'pronoun' && pattern.pronoun_dependencies) {
    const tm = filledSlots.tense_marker
    if (tm) {
      const tmKey = normalize(tm.tongan)
      let validForms = null
      for (const [key, values] of Object.entries(pattern.pronoun_dependencies)) {
        if (normalize(key) === tmKey) {
          validForms = values
          break
        }
      }
      if (validForms) {
        options = options.filter(opt => validForms.includes(opt.tongan))
      }
    }
  }

  // Slot-level condition (e.g. object only when verb is transitive)
  if (slot.condition && !evaluateSlotCondition(slot.condition, filledSlots)) {
    return []
  }

  return options
}

/**
 * 3. Assemble a complete sentence from filled slots.
 *    Tongan: concatenate slot values in position order.
 *    English / literal: via translate.js adapter.
 *    Parts: per-slot breakdown for teaching display.
 */
export function assembleSentence(patternId, filledSlots, isQuestionOverride) {
  const pattern = getPattern(patternId)
  if (!pattern) return null

  const sortedSlots = [...pattern.slots].sort((a, b) => a.position - b.position)

  // Experiencer verb → preposition mapping (mahino → kiate, ngalo → ʻiate)
  const EXPERIENCER_PREPS = {
    'mahino': 'kiate',
    'ngalo': '\u02BBiate',
  }

  // Cleft pronoun insertion (Ch 36, s39): transitive cleft clauses insert
  // a resumptive pronoun between the TM and the verb, and accent naʻe → naʻá.
  // Intransitive clefts and object-less clauses leave the TM untouched.
  const cleftRules = pattern.assembly_rules?.cleft_pronoun_insertion
  let cleftPronoun = null
  if (cleftRules) {
    const verb = filledSlots.verb
    const object = filledSlots.object
    const subject = filledSlots.subject
    if (verb?.tags?.includes('transitive') && object && subject) {
      const s = normalize(subject.tongan)
      if (s === 'au') cleftPronoun = 'ku'
      else if (s === 'kinautolu' || s === 'e f\u0101nau') cleftPronoun = 'nau'
      else cleftPronoun = 'ne'
    }
  }

  // Tongan string + parts from ALL slots (including locked)
  const tonganParts = []
  const parts = []
  for (const slot of sortedSlots) {
    const value = slot.locked ? slot.locked_value : filledSlots[slot.id]
    if (!value) continue
    // For experiencer patterns, insert the verb-dependent preposition before prep_pronoun
    if (slot.id === 'prep_pronoun' && pattern.assembly_rules?.sentence_type === 'experiencer') {
      const verb = filledSlots.verb
      const prep = verb ? EXPERIENCER_PREPS[verb.tongan] : null
      if (prep) {
        tonganParts.push(prep + ' ' + value.tongan)
        parts.push({
          tongan: prep + ' ' + value.tongan,
          english: value.english || '',
          role: slot.label,
          slotId: slot.id,
        })
        continue
      }
    }
    // Cleft transitive: accent TM naʻe → naʻá, then inject resumptive pronoun.
    if (slot.id === 'tense_marker' && cleftPronoun) {
      const accented = normalize(value.tongan) === "na'e"
        ? value.tongan.slice(0, -1) + '\u00E1'
        : value.tongan
      tonganParts.push(accented)
      parts.push({
        tongan: accented,
        english: value.english || '',
        role: slot.label,
        slotId: slot.id,
      })
      tonganParts.push(cleftPronoun)
      parts.push({
        tongan: cleftPronoun,
        english: 'who (resumptive)',
        role: 'Resumptive Pronoun',
        slotId: 'cleft_pronoun',
      })
      continue
    }
    tonganParts.push(value.tongan)
    parts.push({
      tongan: value.tongan,
      english: value.english || '',
      role: slot.label,
      slotId: slot.id,
    })
  }
  const tongan = tonganParts.join(' ')

  // Translate via adapter
  const steps = slotsToSteps(patternId, filledSlots)
  const sentenceType = pattern.assembly_rules?.sentence_type
  // Cross-Cutting Rule 2: 2nd-person Tongan statements are inherently
  // interrogative in English ("Naʻa ke kai." = "Did you eat?", not
  // "You ate."). Detect 2nd-person subjects and set isQuestion so the
  // override table and compositional translator produce the correct form.
  const is2ndPerson = filledSlots.subject?.person === 2
  const heuristicIsQuestion = sentenceType === 'question' || sentenceType === 'ko_question' || is2ndPerson
  const isQuestion = isQuestionOverride !== undefined ? isQuestionOverride : heuristicIsQuestion
  const { text: english, literal, method } = translate(steps, isQuestion)

  return { tongan, english, literal, parts, method }
}

/**
 * 4. Validate that all required slots are filled.
 *    Conditional slots whose condition is unmet are not required.
 */
export function validateSentence(patternId, filledSlots) {
  const pattern = getPattern(patternId)
  if (!pattern) return { valid: false, missing: [] }

  const missing = []
  for (const slot of pattern.slots) {
    if (slot.locked) continue
    if (!slot.required) continue
    if (slot.id in filledSlots) continue
    if (slot.condition && !evaluateSlotCondition(slot.condition, filledSlots)) continue
    missing.push(slot.id)
  }

  return { valid: missing.length === 0, missing }
}

/**
 * 5. Filter sentence-patterns.json by communicative intent and chapter.
 */
export function getPatternsByCategory(category, subcategory = null, maxChapter = 53) {
  return sentencePatterns.patterns.filter(p => {
    if (p.category !== category) return false
    if (subcategory !== null && p.subcategory !== subcategory) return false
    if (p.min_chapter > maxChapter) return false
    return true
  })
}

/**
 * 6. Get matching grammar notes for the current sentence state.
 *    Adapter: converts filledSlots → steps, then delegates to note-matcher.
 */
export function getMatchingNotes(patternId, filledSlots, maxChapter = 53) {
  const steps = slotsToSteps(patternId, filledSlots)
  return matchNotes(steps, maxChapter)
}

/**
 * Adapter: convert filledSlots → step array for translate.js / note-matcher.js.
 *
 * Each slot is mapped to a graph-walker nodeId so the existing translation
 * engine recognises it. Compound slots (e.g. "Ko e" split across two pattern
 * slots) are merged back into a single step.
 */
export function slotsToSteps(patternId, filledSlots) {
  const pattern = getPattern(patternId)
  if (!pattern) return []

  const sortedSlots = [...pattern.slots].sort((a, b) => a.position - b.position)
  const steps = []

  for (const slot of sortedSlots) {
    const nodeId = resolveNodeId(patternId, slot.id)

    if (nodeId === '_SKIP') continue

    if (nodeId === '_MERGE') {
      if (steps.length > 0) {
        const value = slot.locked ? slot.locked_value : filledSlots[slot.id]
        if (value) steps[steps.length - 1].word.tongan += ' ' + value.tongan
      }
      continue
    }

    const value = slot.locked ? slot.locked_value : filledSlots[slot.id]
    if (!value) continue

    // Build word; normalise english to match grammar-graph.json labels
    // so that buildLiteralTranslation produces identical output.
    let english = value.english || ''
    if (nodeId && nodeId.startsWith('tense_marker')) {
      english = graphTmEnglish(nodeId, value.tongan) ?? english
    }
    if (nodeId === 'pronoun' || nodeId === 'pronoun_loc' || nodeId === 'pronoun_neg') {
      english = graphPronounEnglish(nodeId, value.tongan) ?? english
    }

    const word = { tongan: value.tongan, english }
    if (value.tags) word.tags = value.tags
    if (value.subject_english) word.subject = value.subject_english
    if (value.person !== undefined) word.person = value.person
    if (value.number) word.number = value.number

    steps.push({ nodeId, word })
  }

  return steps
}
