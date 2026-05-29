/**
 * grammar-graph.json structural schema + validator.
 *
 * The companion to Phase-2-Engine-Plan.md's `grammar-graph schema validation`
 * row — the second half of the 2C.1 entry-gate pair (Docs.4 was the first).
 *
 * Design goals:
 *   1. Additive. Every Phase 2B tag (animacy, possessive_class, faka_form, …)
 *      is an *optional* field up front, so each 2B sub-batch lights it up just
 *      by tagging words. No schema bump needed.
 *   2. Strict about what it does recognize. Unknown fields on any object type
 *      are a hard error — typos in field names ("nounc_lass", "defintive_")
 *      fail fast instead of silently disabling a walker rule.
 *   3. Cross-graph aware. Validates not just shape but referential integrity:
 *      every edge.node resolves, every child_entry_point resolves, every
 *      start_node resolves, every allowed_terminator is known.
 *   4. No runtime dependency. Hand-rolled so no ajv / json-schema package is
 *      pulled in. The declaration style below is still JSON-schema-shaped so
 *      it's easy to migrate later if a library becomes worth the weight.
 *
 * Consumers:
 *   - grammar-graph-schema.test.js — runs `validateGrammarGraph` and asserts
 *     zero errors, plus targeted scenario tests for each failure mode.
 *   - Future 2C.1 full edits — run the test after every bulk JSON change.
 */

// ----------------------------------------------------------------------------
// Terminal identifiers that aren't "real" nodes but are referenced by edges.
// ----------------------------------------------------------------------------

export const FINISH_NODES = new Set(['FINISH_STATEMENT', 'FINISH_QUESTION', 'FINISH_EXCLAMATION'])

// ----------------------------------------------------------------------------
// Enumerations (closed sets — extend only when a spec/walker change lands)
// ----------------------------------------------------------------------------

export const NOUN_CLASSES = new Set(['local', 'personal', 'common', 'pronoun'])
export const COMPLEMENT_PREP_FAMILIES = new Set(['ki-family', 'i-family', 'mei-family'])
export const PREP_FAMILIES = new Set(['ki-family', 'i-family', 'mei-family'])
export const DOUBLE_VOWEL_ORIGINS = new Set(['long_split', 'compound'])
export const NUMBERS = new Set(['singular', 'dual', 'plural'])
export const PERSONS = new Set([1, 2, 3])
export const POSITION_RULES = new Set(['always_last_modifier'])
export const CATEGORIES = new Set([
  'Statements',
  'Commands',
  'Negation',
  'Ko Sentences',
  'Questions',
  'Noun Subjects',
  'Subordinate',
  'Exclamatory',
])
export const CONDITION_TYPES = new Set([
  'modifier_count_max',
  'verb_has_tag',
  'not_already_visited_node',
  'clause_count_max',
  'node_visit_count_max',
  // P1-B4: gate the emphatic postposed pronoun so it is offered only while it
  // still abuts the verb phrase (no object / locative / companion / time
  // complement has intervened). Carries no extra fields beyond `type`.
  'no_complement_yet',
])

// Phase 2B tags — all currently optional. Each 2B sub-batch populates one.
export const ANIMACY_VALUES = new Set(['person', 'animal', 'thing'])
export const POSSESSIVE_CLASSES = new Set(['e_class', 'ho_class', 'mixed'])
export const FAKA_FORM_FUNCTIONS = new Set([
  'manner', 'causative_transitive', 'causative_reflexive', 'temporal_adverb', 'narrowing',
])
export const TA_E_FORM_FUNCTIONS = new Set([
  'negation', 'without', 'un_negation',
])
export const REDUPLICATION_TYPES = new Set([
  'complete', 'partial_early', 'partial_middle', 'partial_late',
])
export const REDUPLICATION_EFFECTS = new Set([
  'plurality', 'intensification', 'moderation', 'meaning_shift', 'pos_change', 'faka_compound',
])
export const TRANSITIVE_I_FUNCTIONS = new Set([
  'transitive', 'connotative',
])
export const AKI_SUFFIX_FUNCTIONS = new Set([
  'use_as',
])
export const EXECUTIVE_I_FUNCTIONS = new Set([
  'completion',
])
export const ANGA_FORM_FUNCTIONS = new Set([
  'place', 'source', 'means',
])
export const NGA_FORM_FUNCTIONS = new Set([
  'thing',
])
export const STATIVE_SUFFIX_TYPES = new Set([
  'a', 'fia', 'hia', 'ia', 'ina',
])
export const IA_SUFFIX_FUNCTIONS = new Set([
  'possessing', 'regarding_as', 'emphasizing',
])
export const FE_AKI_FORM_FUNCTIONS = new Set([
  'reciprocal', 'reciprocative',
])
export const FE_FORM_FUNCTIONS = new Set([
  'communal', 'reciprocal', 'idiomatic',
])

// ----------------------------------------------------------------------------
// Allowed-field lists per object shape (closed — unknown keys are errors).
// ----------------------------------------------------------------------------

const META_REQUIRED = ['version', 'description']
// P1-A4: `useAdjunctHub` is an optional boolean feature flag that activates the
// adjuncts_hub surfacing in graph-walker.getHubExtensions. Optional so older
// data files (and a revert) validate with the key absent.
const META_ALLOWED = new Set([...META_REQUIRED, 'useAdjunctHub'])

const ENTRY_POINT_REQUIRED = [
  'id',
  'label',
  'category',
  'description',
  'start_node',
  'min_chapter',
  'allowed_terminators',
]
const ENTRY_POINT_ALLOWED = new Set(ENTRY_POINT_REQUIRED)

const NODE_REQUIRED = ['label', 'description', 'words', 'next']
// P1-A4: `route_to_hub` is an optional boolean marking a node whose extension
// menu should additionally surface the adjuncts_hub edges (see
// graph-walker.getHubExtensions). Optional/closed: unknown sibling keys still
// hard-error.
const NODE_ALLOWED = new Set([...NODE_REQUIRED, 'constraints', 'word_filter', 'route_to_hub'])

const EDGE_REQUIRED = ['node', 'label', 'min_chapter']
const EDGE_ALLOWED = new Set([
  ...EDGE_REQUIRED,
  'required',
  'condition',
  'context_hint',
  'child_entry_point',
])

const CONDITION_REQUIRED = ['type']
const CONDITION_ALLOWED = new Set([...CONDITION_REQUIRED, 'max', 'tag', 'node'])

const CONSTRAINTS_ALLOWED = new Set(['depends_on', 'valid_combinations'])
const WORD_FILTER_ALLOWED = new Set(['type'])

const WORD_REQUIRED = ['tongan', 'english', 'min_chapter']
const WORD_ALLOWED = new Set([
  ...WORD_REQUIRED,
  // Already-in-use fields (Ch 1–15 + Ch 30 slice)
  'tags',
  'noun_class',
  'definitive_accent_form',
  'double_vowel_origin',
  'complement_prep',
  'family',
  'class_forms',
  'possessive_forms', // 2A.6 slice: {e_class, ho_class} paradigm forms on possessive_pronoun entries
  'indefinite_forms', // 2C.5a slice: {e_class, ho_class} indefinite possessive forms (§36 Ch 29)
  'subject',
  'person',
  'number',
  'form_note',
  'position_rule',
  // Phase 2B tagging fields (all optional; each 2B sub-batch lights one up)
  'animacy', // 2B.2
  'possessive_class', // 2B.3
  'plural_form', // 2B.6
  'plural_definitive_accent_form', // 2B.6
  'alternate_class', // Finding 2 (quasi-local nouns)
  'category_use', // §23 category-use flag
  'short_form', // 2C.5c slice: short postposed possessive form (§37 Ch 37)
  // 2B.7 morphology derivations (§37, §38, §42, §45, §47, §48)
  'faka_form',
  'faka_e_form',
  'ta_e_form',
  'reduplication',
  'transitive_i_form',
  'executive_i_form',
  'aki_suffix_form',
  'anga_form',
  'nga_form',
  'transitive_a_form',
  'stative_suffix_form',
  'ia_suffix_form',
  'compound_i_form',
  'ngata_a_form',
  'ngofua_form',
  'fe_aki_form',
  'fe_form',
  'ma_potential_form',
  'ma_resultative_form',
  'mo_u_form',
  'kaunga_form',
  'ke_ma_emphatic_pair',
  'emotional_form',
  'emotional_possessive_forms', // 2C.7c slice: {e_class, ho_class, min_chapter} emotional definite possessive forms (§50 Ch 52)
  'emotional_indefinite_forms', // 2C.7c slice: {e_class, ho_class, min_chapter} emotional indefinite possessive forms (§50 Ch 52)
  'article_type', // Article node: 'indefinite' (ha) / 'definite' (e) — classifies the article word for render-time emotional substitution
])

const CLASS_FORMS_ALLOWED = new Set(['local', 'personal', 'common', 'pronoun'])
const POSSESSIVE_FORMS_ALLOWED = new Set(['e_class', 'ho_class'])

const FAKA_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const FAKA_FORM_ALLOWED = new Set([...FAKA_FORM_REQUIRED, 'tags'])

const TA_E_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const TA_E_FORM_ALLOWED = new Set([...TA_E_FORM_REQUIRED, 'tags'])

const REDUPLICATION_REQUIRED = ['tongan', 'english', 'type', 'effect', 'min_chapter']
const REDUPLICATION_ALLOWED = new Set([...REDUPLICATION_REQUIRED, 'tags'])

const TRANSITIVE_I_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const TRANSITIVE_I_FORM_ALLOWED = new Set([...TRANSITIVE_I_FORM_REQUIRED, 'tags'])

const AKI_SUFFIX_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const AKI_SUFFIX_FORM_ALLOWED = new Set([...AKI_SUFFIX_FORM_REQUIRED, 'tags'])

const EXECUTIVE_I_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const EXECUTIVE_I_FORM_ALLOWED = new Set([...EXECUTIVE_I_FORM_REQUIRED, 'tags'])

const ANGA_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const ANGA_FORM_ALLOWED = new Set([...ANGA_FORM_REQUIRED, 'tags'])

const NGA_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const NGA_FORM_ALLOWED = new Set([...NGA_FORM_REQUIRED, 'tags'])

const TRANSITIVE_A_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const TRANSITIVE_A_FORM_ALLOWED = new Set([...TRANSITIVE_A_FORM_REQUIRED, 'tags'])

const STATIVE_SUFFIX_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const STATIVE_SUFFIX_FORM_ALLOWED = new Set([...STATIVE_SUFFIX_FORM_REQUIRED, 'tags', 'suffix_type'])

const IA_SUFFIX_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const IA_SUFFIX_FORM_ALLOWED = new Set([...IA_SUFFIX_FORM_REQUIRED, 'tags'])

const COMPOUND_I_FORM_REQUIRED = ['first_noun', 'second_noun', 'tongan', 'english', 'min_chapter']
const COMPOUND_I_FORM_ALLOWED = new Set([...COMPOUND_I_FORM_REQUIRED, 'idiomatic', 'tags'])

const NGATA_A_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const NGATA_A_FORM_ALLOWED = new Set([...NGATA_A_FORM_REQUIRED, 'tags'])

const NGOFUA_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const NGOFUA_FORM_ALLOWED = new Set([...NGOFUA_FORM_REQUIRED, 'tags'])

const FE_AKI_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const FE_AKI_FORM_ALLOWED = new Set([...FE_AKI_FORM_REQUIRED, 'requires_plural_or_dual_subject', 'tags'])

const FE_FORM_REQUIRED = ['tongan', 'english', 'function', 'min_chapter']
const FE_FORM_ALLOWED = new Set([...FE_FORM_REQUIRED, 'suffix', 'requires_plural_subject', 'tags'])

const MA_POTENTIAL_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const MA_POTENTIAL_FORM_ALLOWED = new Set([...MA_POTENTIAL_FORM_REQUIRED, 'tags'])

const MA_RESULTATIVE_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const MA_RESULTATIVE_FORM_ALLOWED = new Set([...MA_RESULTATIVE_FORM_REQUIRED, 'variant_prefix', 'tags'])

const MO_U_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const MO_U_FORM_ALLOWED = new Set([...MO_U_FORM_REQUIRED, 'tags'])

const KAUNGA_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const KAUNGA_FORM_ALLOWED = new Set([...KAUNGA_FORM_REQUIRED, 'tags'])

const KE_MA_EMPHATIC_PAIR_REQUIRED = ['tongan', 'english', 'min_chapter']
const KE_MA_EMPHATIC_PAIR_ALLOWED = new Set([...KE_MA_EMPHATIC_PAIR_REQUIRED, 'tags'])

const EMOTIONAL_FORM_REQUIRED = ['tongan', 'english', 'min_chapter']
const EMOTIONAL_FORM_ALLOWED = new Set([...EMOTIONAL_FORM_REQUIRED, 'tags'])

const EMOTIONAL_POSSESSIVE_FORMS_REQUIRED = ['e_class', 'ho_class', 'min_chapter']
const EMOTIONAL_POSSESSIVE_FORMS_ALLOWED = new Set(EMOTIONAL_POSSESSIVE_FORMS_REQUIRED)

const EMOTIONAL_INDEFINITE_FORMS_REQUIRED = ['e_class', 'ho_class', 'min_chapter']
const EMOTIONAL_INDEFINITE_FORMS_ALLOWED = new Set(EMOTIONAL_INDEFINITE_FORMS_REQUIRED)

const ROAD_PREVIEW_REQUIRED = ['path', 'english', 'leads_to']
const ROAD_PREVIEW_ALLOWED = new Set(ROAD_PREVIEW_REQUIRED)

// ----------------------------------------------------------------------------
// Top-level validator
// ----------------------------------------------------------------------------

/**
 * Validate a grammar-graph.json document.
 * @param {object} data — parsed grammar-graph.json
 * @returns {string[]} — list of human-readable error messages, empty on success
 */
export function validateGrammarGraph(data) {
  const errors = []
  const add = (path, msg) => errors.push(`${path}: ${msg}`)

  if (!isPlainObject(data)) {
    add('$', 'grammar-graph must be a JSON object')
    return errors
  }

  // Required top-level keys
  const ALLOWED_TOP = new Set(['meta', 'entry_points', 'nodes', 'road_previews'])
  for (const key of Object.keys(data)) {
    if (!ALLOWED_TOP.has(key)) add('$', `unknown top-level key: ${key}`)
  }
  if (!data.meta) add('$.meta', 'missing')
  if (!data.entry_points) add('$.entry_points', 'missing')
  if (!data.nodes) add('$.nodes', 'missing')

  // ── meta ────────────────────────────────────────────────────────────────
  if (data.meta) {
    validateFields('$.meta', data.meta, META_REQUIRED, META_ALLOWED, add)
    if (data.meta.version !== undefined && typeof data.meta.version !== 'string') {
      add('$.meta.version', 'must be a string')
    }
    if (data.meta.description !== undefined && typeof data.meta.description !== 'string') {
      add('$.meta.description', 'must be a string')
    }
    if (data.meta.useAdjunctHub !== undefined && typeof data.meta.useAdjunctHub !== 'boolean') {
      add('$.meta.useAdjunctHub', 'must be a boolean')
    }
  }

  // ── entry_points ────────────────────────────────────────────────────────
  const entryPointIds = new Set()
  if (!Array.isArray(data.entry_points)) {
    if (data.entry_points !== undefined) add('$.entry_points', 'must be an array')
  } else {
    data.entry_points.forEach((ep, i) => {
      const path = `$.entry_points[${i}]`
      if (!isPlainObject(ep)) {
        add(path, 'must be an object')
        return
      }
      validateFields(path, ep, ENTRY_POINT_REQUIRED, ENTRY_POINT_ALLOWED, add)
      if (typeof ep.id === 'string') {
        if (entryPointIds.has(ep.id)) add(`${path}.id`, `duplicate entry_point id: ${ep.id}`)
        entryPointIds.add(ep.id)
      } else if (ep.id !== undefined) {
        add(`${path}.id`, 'must be a string')
      }
      if (ep.label !== undefined && typeof ep.label !== 'string')
        add(`${path}.label`, 'must be a string')
      if (ep.description !== undefined && typeof ep.description !== 'string')
        add(`${path}.description`, 'must be a string')
      if (ep.category !== undefined) {
        if (typeof ep.category !== 'string') add(`${path}.category`, 'must be a string')
        else if (!CATEGORIES.has(ep.category))
          add(`${path}.category`, `unknown category: ${ep.category}`)
      }
      if (ep.start_node !== undefined && typeof ep.start_node !== 'string')
        add(`${path}.start_node`, 'must be a string')
      if (ep.min_chapter !== undefined && !isPositiveInteger(ep.min_chapter))
        add(`${path}.min_chapter`, 'must be a positive integer')
      if (ep.allowed_terminators !== undefined) {
        if (!Array.isArray(ep.allowed_terminators)) {
          add(`${path}.allowed_terminators`, 'must be an array')
        } else {
          ep.allowed_terminators.forEach((t, j) => {
            if (!FINISH_NODES.has(t))
              add(`${path}.allowed_terminators[${j}]`, `unknown terminator: ${t}`)
          })
        }
      }
    })
  }

  // ── nodes ───────────────────────────────────────────────────────────────
  const nodeIds = new Set()
  if (!isPlainObject(data.nodes)) {
    if (data.nodes !== undefined) add('$.nodes', 'must be an object')
  } else {
    for (const [nodeId, node] of Object.entries(data.nodes)) {
      nodeIds.add(nodeId)
      const path = `$.nodes.${nodeId}`
      if (!isPlainObject(node)) {
        add(path, 'must be an object')
        continue
      }
      validateFields(path, node, NODE_REQUIRED, NODE_ALLOWED, add)
      if (node.label !== undefined && typeof node.label !== 'string')
        add(`${path}.label`, 'must be a string')
      if (node.description !== undefined && typeof node.description !== 'string')
        add(`${path}.description`, 'must be a string')
      if (node.route_to_hub !== undefined && typeof node.route_to_hub !== 'boolean')
        add(`${path}.route_to_hub`, 'must be a boolean')
      if (node.words !== undefined) validateWords(`${path}.words`, node.words, add)
      if (node.next !== undefined) validateEdges(`${path}.next`, node.next, add)
      if (node.constraints !== undefined) validateConstraints(`${path}.constraints`, node.constraints, add)
      if (node.word_filter !== undefined) {
        if (!isPlainObject(node.word_filter)) {
          add(`${path}.word_filter`, 'must be an object')
        } else {
          for (const key of Object.keys(node.word_filter)) {
            if (!WORD_FILTER_ALLOWED.has(key))
              add(`${path}.word_filter.${key}`, 'unknown key')
          }
          if (typeof node.word_filter.type !== 'string')
            add(`${path}.word_filter.type`, 'must be a string')
        }
      }
    }
  }

  // ── road_previews (optional) ────────────────────────────────────────────
  if (data.road_previews !== undefined) {
    if (!isPlainObject(data.road_previews)) {
      add('$.road_previews', 'must be an object')
    } else {
      for (const [key, previews] of Object.entries(data.road_previews)) {
        const path = `$.road_previews.${key}`
        if (!Array.isArray(previews)) {
          add(path, 'must be an array')
          continue
        }
        previews.forEach((p, i) => {
          const ppath = `${path}[${i}]`
          if (!isPlainObject(p)) {
            add(ppath, 'must be an object')
            return
          }
          validateFields(ppath, p, ROAD_PREVIEW_REQUIRED, ROAD_PREVIEW_ALLOWED, add)
          if (p.path !== undefined && !Array.isArray(p.path))
            add(`${ppath}.path`, 'must be an array of strings')
          else if (Array.isArray(p.path)) {
            p.path.forEach((s, j) => {
              if (typeof s !== 'string') add(`${ppath}.path[${j}]`, 'must be a string')
            })
          }
          if (p.english !== undefined && typeof p.english !== 'string')
            add(`${ppath}.english`, 'must be a string')
          if (p.leads_to !== undefined) {
            if (typeof p.leads_to !== 'string') add(`${ppath}.leads_to`, 'must be a string')
            else if (entryPointIds.size && !entryPointIds.has(p.leads_to))
              add(`${ppath}.leads_to`, `unknown entry_point: ${p.leads_to}`)
          }
        })
      }
    }
  }

  // ── cross-graph referential checks ──────────────────────────────────────
  if (Array.isArray(data.entry_points) && isPlainObject(data.nodes)) {
    data.entry_points.forEach((ep, i) => {
      const path = `$.entry_points[${i}]`
      if (typeof ep.start_node === 'string' && !nodeIds.has(ep.start_node))
        add(`${path}.start_node`, `unknown node: ${ep.start_node}`)
    })
  }
  if (isPlainObject(data.nodes)) {
    for (const [nodeId, node] of Object.entries(data.nodes)) {
      if (!Array.isArray(node?.next)) continue
      node.next.forEach((edge, i) => {
        const path = `$.nodes.${nodeId}.next[${i}]`
        if (typeof edge?.node === 'string') {
          if (!nodeIds.has(edge.node) && !FINISH_NODES.has(edge.node))
            add(`${path}.node`, `unknown node: ${edge.node}`)
        }
        if (typeof edge?.child_entry_point === 'string') {
          if (entryPointIds.size && !entryPointIds.has(edge.child_entry_point))
            add(`${path}.child_entry_point`, `unknown entry_point: ${edge.child_entry_point}`)
        }
      })
    }
  }

  return errors
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function validateWords(path, words, add) {
  if (!Array.isArray(words)) {
    add(path, 'must be an array')
    return
  }
  words.forEach((w, i) => {
    const wpath = `${path}[${i}]`
    if (!isPlainObject(w)) {
      add(wpath, 'must be an object')
      return
    }
    validateFields(wpath, w, WORD_REQUIRED, WORD_ALLOWED, add)
    if (w.tongan !== undefined && typeof w.tongan !== 'string')
      add(`${wpath}.tongan`, 'must be a string')
    if (w.english !== undefined && typeof w.english !== 'string')
      add(`${wpath}.english`, 'must be a string')
    if (w.min_chapter !== undefined && !isPositiveInteger(w.min_chapter))
      add(`${wpath}.min_chapter`, 'must be a positive integer')
    if (w.tags !== undefined) {
      if (!Array.isArray(w.tags)) add(`${wpath}.tags`, 'must be an array of strings')
      else
        w.tags.forEach((t, j) => {
          if (typeof t !== 'string') add(`${wpath}.tags[${j}]`, 'must be a string')
        })
    }
    if (w.noun_class !== undefined && !NOUN_CLASSES.has(w.noun_class))
      add(`${wpath}.noun_class`, `unknown noun_class: ${w.noun_class}`)
    if (w.complement_prep !== undefined && !COMPLEMENT_PREP_FAMILIES.has(w.complement_prep))
      add(`${wpath}.complement_prep`, `unknown complement_prep: ${w.complement_prep}`)
    if (w.family !== undefined && !PREP_FAMILIES.has(w.family))
      add(`${wpath}.family`, `unknown family: ${w.family}`)
    if (w.double_vowel_origin !== undefined && !DOUBLE_VOWEL_ORIGINS.has(w.double_vowel_origin))
      add(`${wpath}.double_vowel_origin`, `unknown double_vowel_origin: ${w.double_vowel_origin}`)
    if (w.definitive_accent_form !== undefined && typeof w.definitive_accent_form !== 'string')
      add(`${wpath}.definitive_accent_form`, 'must be a string')
    if (w.class_forms !== undefined) {
      if (!isPlainObject(w.class_forms)) add(`${wpath}.class_forms`, 'must be an object')
      else {
        for (const [k, v] of Object.entries(w.class_forms)) {
          if (!CLASS_FORMS_ALLOWED.has(k)) add(`${wpath}.class_forms.${k}`, 'unknown noun class')
          if (typeof v === 'string') continue
          if (isPlainObject(v)) {
            if (typeof v.tongan !== 'string') add(`${wpath}.class_forms.${k}.tongan`, 'must be a string')
            if (v.min_chapter !== undefined && typeof v.min_chapter !== 'number')
              add(`${wpath}.class_forms.${k}.min_chapter`, 'must be a number')
          } else {
            add(`${wpath}.class_forms.${k}`, 'must be a string or {tongan, min_chapter} object')
          }
        }
      }
    }
    if (w.possessive_forms !== undefined) {
      if (!isPlainObject(w.possessive_forms)) add(`${wpath}.possessive_forms`, 'must be an object')
      else {
        for (const [k, v] of Object.entries(w.possessive_forms)) {
          if (!POSSESSIVE_FORMS_ALLOWED.has(k)) add(`${wpath}.possessive_forms.${k}`, 'unknown possessive class')
          if (typeof v !== 'string') add(`${wpath}.possessive_forms.${k}`, 'must be a string')
        }
      }
    }
    if (w.indefinite_forms !== undefined) {
      if (!isPlainObject(w.indefinite_forms)) add(`${wpath}.indefinite_forms`, 'must be an object')
      else {
        for (const [k, v] of Object.entries(w.indefinite_forms)) {
          if (!POSSESSIVE_FORMS_ALLOWED.has(k)) add(`${wpath}.indefinite_forms.${k}`, 'unknown possessive class')
          if (typeof v !== 'string') add(`${wpath}.indefinite_forms.${k}`, 'must be a string')
        }
      }
    }
    if (w.person !== undefined && !PERSONS.has(w.person))
      add(`${wpath}.person`, `must be 1, 2, or 3`)
    if (w.number !== undefined && !NUMBERS.has(w.number))
      add(`${wpath}.number`, `unknown number: ${w.number}`)
    if (w.position_rule !== undefined && !POSITION_RULES.has(w.position_rule))
      add(`${wpath}.position_rule`, `unknown position_rule: ${w.position_rule}`)
    if (w.subject !== undefined && typeof w.subject !== 'string')
      add(`${wpath}.subject`, 'must be a string')
    if (w.form_note !== undefined && typeof w.form_note !== 'string')
      add(`${wpath}.form_note`, 'must be a string')
    // Phase 2B additive fields — only type-checked when present.
    if (w.animacy !== undefined && !ANIMACY_VALUES.has(w.animacy))
      add(`${wpath}.animacy`, `unknown animacy: ${w.animacy}`)
    if (w.possessive_class !== undefined && !POSSESSIVE_CLASSES.has(w.possessive_class))
      add(`${wpath}.possessive_class`, `unknown possessive_class: ${w.possessive_class}`)
    if (w.faka_form !== undefined) {
      if (!isPlainObject(w.faka_form)) add(`${wpath}.faka_form`, 'must be an object')
      else {
        validateFields(`${wpath}.faka_form`, w.faka_form, FAKA_FORM_REQUIRED, FAKA_FORM_ALLOWED, add)
        if (w.faka_form.tongan !== undefined && typeof w.faka_form.tongan !== 'string')
          add(`${wpath}.faka_form.tongan`, 'must be a string')
        if (w.faka_form.english !== undefined && typeof w.faka_form.english !== 'string')
          add(`${wpath}.faka_form.english`, 'must be a string')
        if (w.faka_form.function !== undefined && !FAKA_FORM_FUNCTIONS.has(w.faka_form.function))
          add(`${wpath}.faka_form.function`, `unknown function: ${w.faka_form.function}`)
        if (w.faka_form.min_chapter !== undefined && !isPositiveInteger(w.faka_form.min_chapter))
          add(`${wpath}.faka_form.min_chapter`, 'must be a positive integer')
        if (w.faka_form.tags !== undefined) {
          if (!Array.isArray(w.faka_form.tags)) add(`${wpath}.faka_form.tags`, 'must be an array of strings')
          else w.faka_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.faka_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ta_e_form !== undefined) {
      if (!isPlainObject(w.ta_e_form)) add(`${wpath}.ta_e_form`, 'must be an object')
      else {
        validateFields(`${wpath}.ta_e_form`, w.ta_e_form, TA_E_FORM_REQUIRED, TA_E_FORM_ALLOWED, add)
        if (w.ta_e_form.tongan !== undefined && typeof w.ta_e_form.tongan !== 'string')
          add(`${wpath}.ta_e_form.tongan`, 'must be a string')
        if (w.ta_e_form.english !== undefined && typeof w.ta_e_form.english !== 'string')
          add(`${wpath}.ta_e_form.english`, 'must be a string')
        if (w.ta_e_form.function !== undefined && !TA_E_FORM_FUNCTIONS.has(w.ta_e_form.function))
          add(`${wpath}.ta_e_form.function`, `unknown function: ${w.ta_e_form.function}`)
        if (w.ta_e_form.min_chapter !== undefined && !isPositiveInteger(w.ta_e_form.min_chapter))
          add(`${wpath}.ta_e_form.min_chapter`, 'must be a positive integer')
        if (w.ta_e_form.tags !== undefined) {
          if (!Array.isArray(w.ta_e_form.tags)) add(`${wpath}.ta_e_form.tags`, 'must be an array of strings')
          else w.ta_e_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ta_e_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.reduplication !== undefined) {
      if (!isPlainObject(w.reduplication)) add(`${wpath}.reduplication`, 'must be an object')
      else {
        validateFields(`${wpath}.reduplication`, w.reduplication, REDUPLICATION_REQUIRED, REDUPLICATION_ALLOWED, add)
        if (w.reduplication.tongan !== undefined && typeof w.reduplication.tongan !== 'string')
          add(`${wpath}.reduplication.tongan`, 'must be a string')
        if (w.reduplication.english !== undefined && typeof w.reduplication.english !== 'string')
          add(`${wpath}.reduplication.english`, 'must be a string')
        if (w.reduplication.type !== undefined && !REDUPLICATION_TYPES.has(w.reduplication.type))
          add(`${wpath}.reduplication.type`, `unknown type: ${w.reduplication.type}`)
        if (w.reduplication.effect !== undefined && !REDUPLICATION_EFFECTS.has(w.reduplication.effect))
          add(`${wpath}.reduplication.effect`, `unknown effect: ${w.reduplication.effect}`)
        if (w.reduplication.min_chapter !== undefined && !isPositiveInteger(w.reduplication.min_chapter))
          add(`${wpath}.reduplication.min_chapter`, 'must be a positive integer')
        if (w.reduplication.tags !== undefined) {
          if (!Array.isArray(w.reduplication.tags)) add(`${wpath}.reduplication.tags`, 'must be an array of strings')
          else w.reduplication.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.reduplication.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.transitive_i_form !== undefined) {
      if (!isPlainObject(w.transitive_i_form)) add(`${wpath}.transitive_i_form`, 'must be an object')
      else {
        validateFields(`${wpath}.transitive_i_form`, w.transitive_i_form, TRANSITIVE_I_FORM_REQUIRED, TRANSITIVE_I_FORM_ALLOWED, add)
        if (w.transitive_i_form.tongan !== undefined && typeof w.transitive_i_form.tongan !== 'string')
          add(`${wpath}.transitive_i_form.tongan`, 'must be a string')
        if (w.transitive_i_form.english !== undefined && typeof w.transitive_i_form.english !== 'string')
          add(`${wpath}.transitive_i_form.english`, 'must be a string')
        if (w.transitive_i_form.function !== undefined && !TRANSITIVE_I_FUNCTIONS.has(w.transitive_i_form.function))
          add(`${wpath}.transitive_i_form.function`, `unknown function: ${w.transitive_i_form.function}`)
        if (w.transitive_i_form.min_chapter !== undefined && !isPositiveInteger(w.transitive_i_form.min_chapter))
          add(`${wpath}.transitive_i_form.min_chapter`, 'must be a positive integer')
        if (w.transitive_i_form.tags !== undefined) {
          if (!Array.isArray(w.transitive_i_form.tags)) add(`${wpath}.transitive_i_form.tags`, 'must be an array of strings')
          else w.transitive_i_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.transitive_i_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.aki_suffix_form !== undefined) {
      if (!isPlainObject(w.aki_suffix_form)) add(`${wpath}.aki_suffix_form`, 'must be an object')
      else {
        validateFields(`${wpath}.aki_suffix_form`, w.aki_suffix_form, AKI_SUFFIX_FORM_REQUIRED, AKI_SUFFIX_FORM_ALLOWED, add)
        if (w.aki_suffix_form.tongan !== undefined && typeof w.aki_suffix_form.tongan !== 'string')
          add(`${wpath}.aki_suffix_form.tongan`, 'must be a string')
        if (w.aki_suffix_form.english !== undefined && typeof w.aki_suffix_form.english !== 'string')
          add(`${wpath}.aki_suffix_form.english`, 'must be a string')
        if (w.aki_suffix_form.function !== undefined && !AKI_SUFFIX_FUNCTIONS.has(w.aki_suffix_form.function))
          add(`${wpath}.aki_suffix_form.function`, `unknown function: ${w.aki_suffix_form.function}`)
        if (w.aki_suffix_form.min_chapter !== undefined && !isPositiveInteger(w.aki_suffix_form.min_chapter))
          add(`${wpath}.aki_suffix_form.min_chapter`, 'must be a positive integer')
        if (w.aki_suffix_form.tags !== undefined) {
          if (!Array.isArray(w.aki_suffix_form.tags)) add(`${wpath}.aki_suffix_form.tags`, 'must be an array of strings')
          else w.aki_suffix_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.aki_suffix_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.executive_i_form !== undefined) {
      if (!isPlainObject(w.executive_i_form)) add(`${wpath}.executive_i_form`, 'must be an object')
      else {
        validateFields(`${wpath}.executive_i_form`, w.executive_i_form, EXECUTIVE_I_FORM_REQUIRED, EXECUTIVE_I_FORM_ALLOWED, add)
        if (w.executive_i_form.tongan !== undefined && typeof w.executive_i_form.tongan !== 'string')
          add(`${wpath}.executive_i_form.tongan`, 'must be a string')
        if (w.executive_i_form.english !== undefined && typeof w.executive_i_form.english !== 'string')
          add(`${wpath}.executive_i_form.english`, 'must be a string')
        if (w.executive_i_form.function !== undefined && !EXECUTIVE_I_FUNCTIONS.has(w.executive_i_form.function))
          add(`${wpath}.executive_i_form.function`, `unknown function: ${w.executive_i_form.function}`)
        if (w.executive_i_form.min_chapter !== undefined && !isPositiveInteger(w.executive_i_form.min_chapter))
          add(`${wpath}.executive_i_form.min_chapter`, 'must be a positive integer')
        if (w.executive_i_form.tags !== undefined) {
          if (!Array.isArray(w.executive_i_form.tags)) add(`${wpath}.executive_i_form.tags`, 'must be an array of strings')
          else w.executive_i_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.executive_i_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.anga_form !== undefined) {
      if (!isPlainObject(w.anga_form)) add(`${wpath}.anga_form`, 'must be an object')
      else {
        validateFields(`${wpath}.anga_form`, w.anga_form, ANGA_FORM_REQUIRED, ANGA_FORM_ALLOWED, add)
        if (w.anga_form.tongan !== undefined && typeof w.anga_form.tongan !== 'string')
          add(`${wpath}.anga_form.tongan`, 'must be a string')
        if (w.anga_form.english !== undefined && typeof w.anga_form.english !== 'string')
          add(`${wpath}.anga_form.english`, 'must be a string')
        if (w.anga_form.function !== undefined && !ANGA_FORM_FUNCTIONS.has(w.anga_form.function))
          add(`${wpath}.anga_form.function`, `unknown function: ${w.anga_form.function}`)
        if (w.anga_form.min_chapter !== undefined && !isPositiveInteger(w.anga_form.min_chapter))
          add(`${wpath}.anga_form.min_chapter`, 'must be a positive integer')
        if (w.anga_form.tags !== undefined) {
          if (!Array.isArray(w.anga_form.tags)) add(`${wpath}.anga_form.tags`, 'must be an array of strings')
          else w.anga_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.anga_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.nga_form !== undefined) {
      if (!isPlainObject(w.nga_form)) add(`${wpath}.nga_form`, 'must be an object')
      else {
        validateFields(`${wpath}.nga_form`, w.nga_form, NGA_FORM_REQUIRED, NGA_FORM_ALLOWED, add)
        if (w.nga_form.tongan !== undefined && typeof w.nga_form.tongan !== 'string')
          add(`${wpath}.nga_form.tongan`, 'must be a string')
        if (w.nga_form.english !== undefined && typeof w.nga_form.english !== 'string')
          add(`${wpath}.nga_form.english`, 'must be a string')
        if (w.nga_form.function !== undefined && !NGA_FORM_FUNCTIONS.has(w.nga_form.function))
          add(`${wpath}.nga_form.function`, `unknown function: ${w.nga_form.function}`)
        if (w.nga_form.min_chapter !== undefined && !isPositiveInteger(w.nga_form.min_chapter))
          add(`${wpath}.nga_form.min_chapter`, 'must be a positive integer')
        if (w.nga_form.tags !== undefined) {
          if (!Array.isArray(w.nga_form.tags)) add(`${wpath}.nga_form.tags`, 'must be an array of strings')
          else w.nga_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.nga_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.transitive_a_form !== undefined) {
      if (!isPlainObject(w.transitive_a_form)) add(`${wpath}.transitive_a_form`, 'must be an object')
      else {
        validateFields(`${wpath}.transitive_a_form`, w.transitive_a_form, TRANSITIVE_A_FORM_REQUIRED, TRANSITIVE_A_FORM_ALLOWED, add)
        if (w.transitive_a_form.tongan !== undefined && typeof w.transitive_a_form.tongan !== 'string')
          add(`${wpath}.transitive_a_form.tongan`, 'must be a string')
        if (w.transitive_a_form.english !== undefined && typeof w.transitive_a_form.english !== 'string')
          add(`${wpath}.transitive_a_form.english`, 'must be a string')
        if (w.transitive_a_form.min_chapter !== undefined && !isPositiveInteger(w.transitive_a_form.min_chapter))
          add(`${wpath}.transitive_a_form.min_chapter`, 'must be a positive integer')
        if (w.transitive_a_form.tags !== undefined) {
          if (!Array.isArray(w.transitive_a_form.tags)) add(`${wpath}.transitive_a_form.tags`, 'must be an array of strings')
          else w.transitive_a_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.transitive_a_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.stative_suffix_form !== undefined) {
      if (!isPlainObject(w.stative_suffix_form)) add(`${wpath}.stative_suffix_form`, 'must be an object')
      else {
        validateFields(`${wpath}.stative_suffix_form`, w.stative_suffix_form, STATIVE_SUFFIX_FORM_REQUIRED, STATIVE_SUFFIX_FORM_ALLOWED, add)
        if (w.stative_suffix_form.tongan !== undefined && typeof w.stative_suffix_form.tongan !== 'string')
          add(`${wpath}.stative_suffix_form.tongan`, 'must be a string')
        if (w.stative_suffix_form.english !== undefined && typeof w.stative_suffix_form.english !== 'string')
          add(`${wpath}.stative_suffix_form.english`, 'must be a string')
        if (w.stative_suffix_form.suffix_type !== undefined && !STATIVE_SUFFIX_TYPES.has(w.stative_suffix_form.suffix_type))
          add(`${wpath}.stative_suffix_form.suffix_type`, `unknown suffix_type: ${w.stative_suffix_form.suffix_type}`)
        if (w.stative_suffix_form.min_chapter !== undefined && !isPositiveInteger(w.stative_suffix_form.min_chapter))
          add(`${wpath}.stative_suffix_form.min_chapter`, 'must be a positive integer')
        if (w.stative_suffix_form.tags !== undefined) {
          if (!Array.isArray(w.stative_suffix_form.tags)) add(`${wpath}.stative_suffix_form.tags`, 'must be an array of strings')
          else w.stative_suffix_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.stative_suffix_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ia_suffix_form !== undefined) {
      if (!isPlainObject(w.ia_suffix_form)) add(`${wpath}.ia_suffix_form`, 'must be an object')
      else {
        validateFields(`${wpath}.ia_suffix_form`, w.ia_suffix_form, IA_SUFFIX_FORM_REQUIRED, IA_SUFFIX_FORM_ALLOWED, add)
        if (w.ia_suffix_form.tongan !== undefined && typeof w.ia_suffix_form.tongan !== 'string')
          add(`${wpath}.ia_suffix_form.tongan`, 'must be a string')
        if (w.ia_suffix_form.english !== undefined && typeof w.ia_suffix_form.english !== 'string')
          add(`${wpath}.ia_suffix_form.english`, 'must be a string')
        if (w.ia_suffix_form.function !== undefined && !IA_SUFFIX_FUNCTIONS.has(w.ia_suffix_form.function))
          add(`${wpath}.ia_suffix_form.function`, `unknown function: ${w.ia_suffix_form.function}`)
        if (w.ia_suffix_form.min_chapter !== undefined && !isPositiveInteger(w.ia_suffix_form.min_chapter))
          add(`${wpath}.ia_suffix_form.min_chapter`, 'must be a positive integer')
        if (w.ia_suffix_form.tags !== undefined) {
          if (!Array.isArray(w.ia_suffix_form.tags)) add(`${wpath}.ia_suffix_form.tags`, 'must be an array of strings')
          else w.ia_suffix_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ia_suffix_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.compound_i_form !== undefined) {
      if (!isPlainObject(w.compound_i_form)) add(`${wpath}.compound_i_form`, 'must be an object')
      else {
        validateFields(`${wpath}.compound_i_form`, w.compound_i_form, COMPOUND_I_FORM_REQUIRED, COMPOUND_I_FORM_ALLOWED, add)
        if (w.compound_i_form.first_noun !== undefined && typeof w.compound_i_form.first_noun !== 'string')
          add(`${wpath}.compound_i_form.first_noun`, 'must be a string')
        if (w.compound_i_form.second_noun !== undefined && typeof w.compound_i_form.second_noun !== 'string')
          add(`${wpath}.compound_i_form.second_noun`, 'must be a string')
        if (w.compound_i_form.tongan !== undefined && typeof w.compound_i_form.tongan !== 'string')
          add(`${wpath}.compound_i_form.tongan`, 'must be a string')
        if (w.compound_i_form.english !== undefined && typeof w.compound_i_form.english !== 'string')
          add(`${wpath}.compound_i_form.english`, 'must be a string')
        if (w.compound_i_form.min_chapter !== undefined && !isPositiveInteger(w.compound_i_form.min_chapter))
          add(`${wpath}.compound_i_form.min_chapter`, 'must be a positive integer')
        if (w.compound_i_form.idiomatic !== undefined && typeof w.compound_i_form.idiomatic !== 'boolean')
          add(`${wpath}.compound_i_form.idiomatic`, 'must be a boolean')
        if (w.compound_i_form.tags !== undefined) {
          if (!Array.isArray(w.compound_i_form.tags)) add(`${wpath}.compound_i_form.tags`, 'must be an array of strings')
          else w.compound_i_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.compound_i_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ngata_a_form !== undefined) {
      if (!isPlainObject(w.ngata_a_form)) add(`${wpath}.ngata_a_form`, 'must be an object')
      else {
        validateFields(`${wpath}.ngata_a_form`, w.ngata_a_form, NGATA_A_FORM_REQUIRED, NGATA_A_FORM_ALLOWED, add)
        if (w.ngata_a_form.tongan !== undefined && typeof w.ngata_a_form.tongan !== 'string')
          add(`${wpath}.ngata_a_form.tongan`, 'must be a string')
        if (w.ngata_a_form.english !== undefined && typeof w.ngata_a_form.english !== 'string')
          add(`${wpath}.ngata_a_form.english`, 'must be a string')
        if (w.ngata_a_form.min_chapter !== undefined && !isPositiveInteger(w.ngata_a_form.min_chapter))
          add(`${wpath}.ngata_a_form.min_chapter`, 'must be a positive integer')
        if (w.ngata_a_form.tags !== undefined) {
          if (!Array.isArray(w.ngata_a_form.tags)) add(`${wpath}.ngata_a_form.tags`, 'must be an array of strings')
          else w.ngata_a_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ngata_a_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ngofua_form !== undefined) {
      if (!isPlainObject(w.ngofua_form)) add(`${wpath}.ngofua_form`, 'must be an object')
      else {
        validateFields(`${wpath}.ngofua_form`, w.ngofua_form, NGOFUA_FORM_REQUIRED, NGOFUA_FORM_ALLOWED, add)
        if (w.ngofua_form.tongan !== undefined && typeof w.ngofua_form.tongan !== 'string')
          add(`${wpath}.ngofua_form.tongan`, 'must be a string')
        if (w.ngofua_form.english !== undefined && typeof w.ngofua_form.english !== 'string')
          add(`${wpath}.ngofua_form.english`, 'must be a string')
        if (w.ngofua_form.min_chapter !== undefined && !isPositiveInteger(w.ngofua_form.min_chapter))
          add(`${wpath}.ngofua_form.min_chapter`, 'must be a positive integer')
        if (w.ngofua_form.tags !== undefined) {
          if (!Array.isArray(w.ngofua_form.tags)) add(`${wpath}.ngofua_form.tags`, 'must be an array of strings')
          else w.ngofua_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ngofua_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.fe_aki_form !== undefined) {
      if (!isPlainObject(w.fe_aki_form)) add(`${wpath}.fe_aki_form`, 'must be an object')
      else {
        validateFields(`${wpath}.fe_aki_form`, w.fe_aki_form, FE_AKI_FORM_REQUIRED, FE_AKI_FORM_ALLOWED, add)
        if (w.fe_aki_form.tongan !== undefined && typeof w.fe_aki_form.tongan !== 'string')
          add(`${wpath}.fe_aki_form.tongan`, 'must be a string')
        if (w.fe_aki_form.english !== undefined && typeof w.fe_aki_form.english !== 'string')
          add(`${wpath}.fe_aki_form.english`, 'must be a string')
        if (w.fe_aki_form.function !== undefined && !FE_AKI_FORM_FUNCTIONS.has(w.fe_aki_form.function))
          add(`${wpath}.fe_aki_form.function`, `unknown function: ${w.fe_aki_form.function}`)
        if (w.fe_aki_form.min_chapter !== undefined && !isPositiveInteger(w.fe_aki_form.min_chapter))
          add(`${wpath}.fe_aki_form.min_chapter`, 'must be a positive integer')
        if (w.fe_aki_form.requires_plural_or_dual_subject !== undefined && typeof w.fe_aki_form.requires_plural_or_dual_subject !== 'boolean')
          add(`${wpath}.fe_aki_form.requires_plural_or_dual_subject`, 'must be a boolean')
        if (w.fe_aki_form.tags !== undefined) {
          if (!Array.isArray(w.fe_aki_form.tags)) add(`${wpath}.fe_aki_form.tags`, 'must be an array of strings')
          else w.fe_aki_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.fe_aki_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.fe_form !== undefined) {
      if (!isPlainObject(w.fe_form)) add(`${wpath}.fe_form`, 'must be an object')
      else {
        validateFields(`${wpath}.fe_form`, w.fe_form, FE_FORM_REQUIRED, FE_FORM_ALLOWED, add)
        if (w.fe_form.tongan !== undefined && typeof w.fe_form.tongan !== 'string')
          add(`${wpath}.fe_form.tongan`, 'must be a string')
        if (w.fe_form.english !== undefined && typeof w.fe_form.english !== 'string')
          add(`${wpath}.fe_form.english`, 'must be a string')
        if (w.fe_form.function !== undefined && !FE_FORM_FUNCTIONS.has(w.fe_form.function))
          add(`${wpath}.fe_form.function`, `unknown function: ${w.fe_form.function}`)
        if (w.fe_form.min_chapter !== undefined && !isPositiveInteger(w.fe_form.min_chapter))
          add(`${wpath}.fe_form.min_chapter`, 'must be a positive integer')
        if (w.fe_form.suffix !== undefined && typeof w.fe_form.suffix !== 'string')
          add(`${wpath}.fe_form.suffix`, 'must be a string')
        if (w.fe_form.requires_plural_subject !== undefined && typeof w.fe_form.requires_plural_subject !== 'boolean')
          add(`${wpath}.fe_form.requires_plural_subject`, 'must be a boolean')
        if (w.fe_form.tags !== undefined) {
          if (!Array.isArray(w.fe_form.tags)) add(`${wpath}.fe_form.tags`, 'must be an array of strings')
          else w.fe_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.fe_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ma_potential_form !== undefined) {
      if (!isPlainObject(w.ma_potential_form)) add(`${wpath}.ma_potential_form`, 'must be an object')
      else {
        validateFields(`${wpath}.ma_potential_form`, w.ma_potential_form, MA_POTENTIAL_FORM_REQUIRED, MA_POTENTIAL_FORM_ALLOWED, add)
        if (w.ma_potential_form.tongan !== undefined && typeof w.ma_potential_form.tongan !== 'string')
          add(`${wpath}.ma_potential_form.tongan`, 'must be a string')
        if (w.ma_potential_form.english !== undefined && typeof w.ma_potential_form.english !== 'string')
          add(`${wpath}.ma_potential_form.english`, 'must be a string')
        if (w.ma_potential_form.min_chapter !== undefined && !isPositiveInteger(w.ma_potential_form.min_chapter))
          add(`${wpath}.ma_potential_form.min_chapter`, 'must be a positive integer')
        if (w.ma_potential_form.tags !== undefined) {
          if (!Array.isArray(w.ma_potential_form.tags)) add(`${wpath}.ma_potential_form.tags`, 'must be an array of strings')
          else w.ma_potential_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ma_potential_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ma_resultative_form !== undefined) {
      if (!isPlainObject(w.ma_resultative_form)) add(`${wpath}.ma_resultative_form`, 'must be an object')
      else {
        validateFields(`${wpath}.ma_resultative_form`, w.ma_resultative_form, MA_RESULTATIVE_FORM_REQUIRED, MA_RESULTATIVE_FORM_ALLOWED, add)
        if (w.ma_resultative_form.tongan !== undefined && typeof w.ma_resultative_form.tongan !== 'string')
          add(`${wpath}.ma_resultative_form.tongan`, 'must be a string')
        if (w.ma_resultative_form.english !== undefined && typeof w.ma_resultative_form.english !== 'string')
          add(`${wpath}.ma_resultative_form.english`, 'must be a string')
        if (w.ma_resultative_form.min_chapter !== undefined && !isPositiveInteger(w.ma_resultative_form.min_chapter))
          add(`${wpath}.ma_resultative_form.min_chapter`, 'must be a positive integer')
        if (w.ma_resultative_form.variant_prefix !== undefined && typeof w.ma_resultative_form.variant_prefix !== 'string')
          add(`${wpath}.ma_resultative_form.variant_prefix`, 'must be a string')
        if (w.ma_resultative_form.tags !== undefined) {
          if (!Array.isArray(w.ma_resultative_form.tags)) add(`${wpath}.ma_resultative_form.tags`, 'must be an array of strings')
          else w.ma_resultative_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ma_resultative_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.mo_u_form !== undefined) {
      if (!isPlainObject(w.mo_u_form)) add(`${wpath}.mo_u_form`, 'must be an object')
      else {
        validateFields(`${wpath}.mo_u_form`, w.mo_u_form, MO_U_FORM_REQUIRED, MO_U_FORM_ALLOWED, add)
        if (w.mo_u_form.tongan !== undefined && typeof w.mo_u_form.tongan !== 'string')
          add(`${wpath}.mo_u_form.tongan`, 'must be a string')
        if (w.mo_u_form.english !== undefined && typeof w.mo_u_form.english !== 'string')
          add(`${wpath}.mo_u_form.english`, 'must be a string')
        if (w.mo_u_form.min_chapter !== undefined && !isPositiveInteger(w.mo_u_form.min_chapter))
          add(`${wpath}.mo_u_form.min_chapter`, 'must be a positive integer')
        if (w.mo_u_form.tags !== undefined) {
          if (!Array.isArray(w.mo_u_form.tags)) add(`${wpath}.mo_u_form.tags`, 'must be an array of strings')
          else w.mo_u_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.mo_u_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.kaunga_form !== undefined) {
      if (!isPlainObject(w.kaunga_form)) add(`${wpath}.kaunga_form`, 'must be an object')
      else {
        validateFields(`${wpath}.kaunga_form`, w.kaunga_form, KAUNGA_FORM_REQUIRED, KAUNGA_FORM_ALLOWED, add)
        if (w.kaunga_form.tongan !== undefined && typeof w.kaunga_form.tongan !== 'string')
          add(`${wpath}.kaunga_form.tongan`, 'must be a string')
        if (w.kaunga_form.english !== undefined && typeof w.kaunga_form.english !== 'string')
          add(`${wpath}.kaunga_form.english`, 'must be a string')
        if (w.kaunga_form.min_chapter !== undefined && !isPositiveInteger(w.kaunga_form.min_chapter))
          add(`${wpath}.kaunga_form.min_chapter`, 'must be a positive integer')
        if (w.kaunga_form.tags !== undefined) {
          if (!Array.isArray(w.kaunga_form.tags)) add(`${wpath}.kaunga_form.tags`, 'must be an array of strings')
          else w.kaunga_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.kaunga_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.ke_ma_emphatic_pair !== undefined) {
      if (!isPlainObject(w.ke_ma_emphatic_pair)) add(`${wpath}.ke_ma_emphatic_pair`, 'must be an object')
      else {
        validateFields(`${wpath}.ke_ma_emphatic_pair`, w.ke_ma_emphatic_pair, KE_MA_EMPHATIC_PAIR_REQUIRED, KE_MA_EMPHATIC_PAIR_ALLOWED, add)
        if (w.ke_ma_emphatic_pair.tongan !== undefined && typeof w.ke_ma_emphatic_pair.tongan !== 'string')
          add(`${wpath}.ke_ma_emphatic_pair.tongan`, 'must be a string')
        if (w.ke_ma_emphatic_pair.english !== undefined && typeof w.ke_ma_emphatic_pair.english !== 'string')
          add(`${wpath}.ke_ma_emphatic_pair.english`, 'must be a string')
        if (w.ke_ma_emphatic_pair.min_chapter !== undefined && !isPositiveInteger(w.ke_ma_emphatic_pair.min_chapter))
          add(`${wpath}.ke_ma_emphatic_pair.min_chapter`, 'must be a positive integer')
        if (w.ke_ma_emphatic_pair.tags !== undefined) {
          if (!Array.isArray(w.ke_ma_emphatic_pair.tags)) add(`${wpath}.ke_ma_emphatic_pair.tags`, 'must be an array of strings')
          else w.ke_ma_emphatic_pair.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.ke_ma_emphatic_pair.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.emotional_form !== undefined) {
      if (!isPlainObject(w.emotional_form)) add(`${wpath}.emotional_form`, 'must be an object')
      else {
        validateFields(`${wpath}.emotional_form`, w.emotional_form, EMOTIONAL_FORM_REQUIRED, EMOTIONAL_FORM_ALLOWED, add)
        if (w.emotional_form.tongan !== undefined && typeof w.emotional_form.tongan !== 'string')
          add(`${wpath}.emotional_form.tongan`, 'must be a string')
        if (w.emotional_form.english !== undefined && typeof w.emotional_form.english !== 'string')
          add(`${wpath}.emotional_form.english`, 'must be a string')
        if (w.emotional_form.min_chapter !== undefined && !isPositiveInteger(w.emotional_form.min_chapter))
          add(`${wpath}.emotional_form.min_chapter`, 'must be a positive integer')
        if (w.emotional_form.tags !== undefined) {
          if (!Array.isArray(w.emotional_form.tags)) add(`${wpath}.emotional_form.tags`, 'must be an array of strings')
          else w.emotional_form.tags.forEach((t, j) => {
            if (typeof t !== 'string') add(`${wpath}.emotional_form.tags[${j}]`, 'must be a string')
          })
        }
      }
    }
    if (w.emotional_possessive_forms !== undefined) {
      if (!isPlainObject(w.emotional_possessive_forms)) add(`${wpath}.emotional_possessive_forms`, 'must be an object')
      else {
        validateFields(`${wpath}.emotional_possessive_forms`, w.emotional_possessive_forms, EMOTIONAL_POSSESSIVE_FORMS_REQUIRED, EMOTIONAL_POSSESSIVE_FORMS_ALLOWED, add)
        if (w.emotional_possessive_forms.e_class !== undefined && typeof w.emotional_possessive_forms.e_class !== 'string')
          add(`${wpath}.emotional_possessive_forms.e_class`, 'must be a string')
        if (w.emotional_possessive_forms.ho_class !== undefined && typeof w.emotional_possessive_forms.ho_class !== 'string')
          add(`${wpath}.emotional_possessive_forms.ho_class`, 'must be a string')
        if (w.emotional_possessive_forms.min_chapter !== undefined && !isPositiveInteger(w.emotional_possessive_forms.min_chapter))
          add(`${wpath}.emotional_possessive_forms.min_chapter`, 'must be a positive integer')
      }
    }
    if (w.emotional_indefinite_forms !== undefined) {
      if (!isPlainObject(w.emotional_indefinite_forms)) add(`${wpath}.emotional_indefinite_forms`, 'must be an object')
      else {
        validateFields(`${wpath}.emotional_indefinite_forms`, w.emotional_indefinite_forms, EMOTIONAL_INDEFINITE_FORMS_REQUIRED, EMOTIONAL_INDEFINITE_FORMS_ALLOWED, add)
        if (w.emotional_indefinite_forms.e_class !== undefined && typeof w.emotional_indefinite_forms.e_class !== 'string')
          add(`${wpath}.emotional_indefinite_forms.e_class`, 'must be a string')
        if (w.emotional_indefinite_forms.ho_class !== undefined && typeof w.emotional_indefinite_forms.ho_class !== 'string')
          add(`${wpath}.emotional_indefinite_forms.ho_class`, 'must be a string')
        if (w.emotional_indefinite_forms.min_chapter !== undefined && !isPositiveInteger(w.emotional_indefinite_forms.min_chapter))
          add(`${wpath}.emotional_indefinite_forms.min_chapter`, 'must be a positive integer')
      }
    }
  })
}

function validateEdges(path, edges, add) {
  if (!Array.isArray(edges)) {
    add(path, 'must be an array')
    return
  }
  edges.forEach((e, i) => {
    const epath = `${path}[${i}]`
    if (!isPlainObject(e)) {
      add(epath, 'must be an object')
      return
    }
    validateFields(epath, e, EDGE_REQUIRED, EDGE_ALLOWED, add)
    if (e.node !== undefined && typeof e.node !== 'string')
      add(`${epath}.node`, 'must be a string')
    if (e.label !== undefined && typeof e.label !== 'string')
      add(`${epath}.label`, 'must be a string')
    if (e.min_chapter !== undefined && !isPositiveInteger(e.min_chapter))
      add(`${epath}.min_chapter`, 'must be a positive integer')
    if (e.required !== undefined && typeof e.required !== 'boolean')
      add(`${epath}.required`, 'must be a boolean')
    if (e.context_hint !== undefined && typeof e.context_hint !== 'string')
      add(`${epath}.context_hint`, 'must be a string')
    if (e.child_entry_point !== undefined && typeof e.child_entry_point !== 'string')
      add(`${epath}.child_entry_point`, 'must be a string')
    if (e.condition !== undefined) validateCondition(`${epath}.condition`, e.condition, add)
  })
}

function validateCondition(path, cond, add) {
  if (!isPlainObject(cond)) {
    add(path, 'must be an object')
    return
  }
  validateFields(path, cond, CONDITION_REQUIRED, CONDITION_ALLOWED, add)
  if (cond.type !== undefined) {
    if (typeof cond.type !== 'string') add(`${path}.type`, 'must be a string')
    else if (!CONDITION_TYPES.has(cond.type))
      add(`${path}.type`, `unknown condition type: ${cond.type}`)
  }
  if (cond.max !== undefined && !isPositiveInteger(cond.max))
    add(`${path}.max`, 'must be a positive integer')
  if (cond.tag !== undefined && typeof cond.tag !== 'string')
    add(`${path}.tag`, 'must be a string')
  if (cond.node !== undefined && typeof cond.node !== 'string')
    add(`${path}.node`, 'must be a string')
}

function validateConstraints(path, constraints, add) {
  if (!isPlainObject(constraints)) {
    add(path, 'must be an object')
    return
  }
  for (const key of Object.keys(constraints)) {
    if (!CONSTRAINTS_ALLOWED.has(key)) add(`${path}.${key}`, 'unknown constraint key')
  }
  if (constraints.depends_on !== undefined) {
    const d = constraints.depends_on
    if (typeof d !== 'string' && !Array.isArray(d))
      add(`${path}.depends_on`, 'must be a string or array of strings')
    else if (Array.isArray(d))
      d.forEach((x, i) => {
        if (typeof x !== 'string') add(`${path}.depends_on[${i}]`, 'must be a string')
      })
  }
  if (constraints.valid_combinations !== undefined) {
    const vc = constraints.valid_combinations
    if (!isPlainObject(vc)) {
      add(`${path}.valid_combinations`, 'must be an object')
    } else {
      for (const [k, v] of Object.entries(vc)) {
        if (!Array.isArray(v)) {
          add(`${path}.valid_combinations.${k}`, 'must be an array of strings')
          continue
        }
        v.forEach((s, i) => {
          if (typeof s !== 'string')
            add(`${path}.valid_combinations.${k}[${i}]`, 'must be a string')
        })
      }
    }
  }
}

function validateFields(path, obj, required, allowed, add) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) add(`${path}.${key}`, 'unknown field')
  }
  for (const key of required) {
    if (obj[key] === undefined) add(`${path}.${key}`, 'missing required field')
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function isPositiveInteger(v) {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1
}
