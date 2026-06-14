import overrides from '../data/translation-overrides.json'
import verbForms from '../data/verb-forms.json'

function normalize(s) {
  return s.toLowerCase().replace(/[\u02BB\u2018\u2019\u0060\u00B4]/g, "'")
}

/**
 * Phase 2A.4: render the English for a `preposition` + `prep_phrase` pair
 * with the right article. Previously the three call sites below built
 * `${prepStep.word.english} ${placeStep.word.english}` directly, which
 * produced ungrammatical "to house" for common nouns. This helper:
 *
 *   - common noun + definiteness 'definite' → "to the house"
 *   - common noun + anything else            → "to a house"
 *   - local/personal/pronoun complements     → "to town" / "to Sione" / "to me"
 *     (unchanged — these don't take articles in this sense)
 *
 * When `placeStep.word.english` already starts with an article ("the ", "a ",
 * or "an "), we assume the data has baked it in and emit the english verbatim
 * so we don't end up with "to the the house". This is defensive against
 * future common-noun entries that pre-compose articles.
 */
function renderPrepPhraseEnglish(prepStep, placeStep) {
  const prepEnglish = prepStep.word.english
  const placeEnglish = placeStep.word.english
  const cls = placeStep.word.noun_class
  if (cls !== 'common') {
    return `${prepEnglish} ${placeEnglish}`
  }
  if (/^(the|a|an)\s/i.test(placeEnglish)) {
    return `${prepEnglish} ${placeEnglish}`
  }
  const article = placeStep.definiteness === 'definite' ? 'the' : 'a'
  return `${prepEnglish} ${article} ${placeEnglish}`
}

/**
 * Phase 2F.1: find benefactive phrase in steps and return English rendering.
 * Case 1: benefactive_preposition_ma + possessor_name → "for [name]"
 * Case 2: benefactive_pronoun_fused → "for me", "for you (sg)" → "for you"
 */
function findBenefactiveEnglish(steps) {
  const benefPrepStep = steps.find(s => s.nodeId === 'benefactive_preposition_ma')
  const possNameStep = steps.find(s => s.nodeId === 'possessor_name')
  if (benefPrepStep && possNameStep) {
    return `for ${possNameStep.word.english}`
  }
  const fusedStep = steps.find(s => s.nodeId === 'benefactive_pronoun_fused')
  if (fusedStep) {
    return fusedStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
  }
  return null
}

/**
 * Phase 2F.1: insert benefactive phrase ("for X") into sentence if present.
 */
function insertBenefactivePhrase(sentence, steps) {
  const benefactive = findBenefactiveEnglish(steps)
  if (benefactive) {
    sentence = insertObject(sentence, benefactive)
  }
  return sentence
}

/**
 * Phase 2E.6: render a preposition phrase with a named possessor.
 * "ki fale ʻa Sione" → "to/toward Sione's house"
 * The possessor's name replaces the article (the/a) in the English rendering.
 */
function renderNamedPossessivePrepPhrase(prepStep, placeStep, nameStep) {
  const prepEnglish = prepStep.word.english
  const placeEnglish = placeStep.word.english
  const nameEnglish = nameStep.word.english
  return `${prepEnglish} ${nameEnglish}'s ${placeEnglish}`
}

/**
 * Phase 2E.6: find a possessor_name step that follows a prep_phrase step.
 * Returns the possessor_name step if present, null otherwise.
 */
function findPossessorNameAfterPrepPhrase(steps) {
  return steps.find(s => s.nodeId === 'possessor_name') || null
}

/**
 * Phase 2E.6: render a preposition phrase, auto-detecting named possessor.
 * If possessor_name is in the steps, renders as "to Sione's house";
 * otherwise falls back to the standard article-based rendering.
 */
function renderPrepPhraseWithPossessor(prepStep, placeStep, steps) {
  const possNameStep = findPossessorNameAfterPrepPhrase(steps)
  if (possNameStep) {
    return renderNamedPossessivePrepPhrase(prepStep, placeStep, possNameStep)
  }
  return renderPrepPhraseEnglish(prepStep, placeStep)
}

/**
 * Phase 2E.6: find all preposition + prep_phrase pairs in the steps array.
 * Returns [{prep, place}, ...] in order of appearance. Supports dual
 * preposition phrases (Ch 46: "kia houʻeiki ʻi he falé").
 */
function findAllPrepPhrasePairs(steps) {
  const pairs = []
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].nodeId === 'preposition') {
      // The prep_phrase should follow the preposition (possibly with intervening steps
      // from sub-walks that got spliced in, but in practice it's the next step)
      for (let j = i + 1; j < steps.length; j++) {
        if (steps[j].nodeId === 'prep_phrase') {
          pairs.push({ prep: steps[i], place: steps[j] })
          break
        }
        // Stop if we hit another preposition (means this one's pair is missing)
        if (steps[j].nodeId === 'preposition') break
      }
    }
  }
  return pairs
}

/**
 * Phase 2E.6: insert all preposition phrases into a sentence, with named-
 * possessor awareness. Handles both single and dual preposition cases.
 */
function insertAllPrepPhrases(sentence, steps) {
  const pairs = findAllPrepPhrasePairs(steps)
  for (const pair of pairs) {
    sentence = insertObject(sentence, renderPrepPhraseWithPossessor(pair.prep, pair.place, steps))
  }
  return sentence
}

/**
 * Translate a sentence built from grammar graph steps.
 * Returns { text, literal, method } where:
 *   text = natural English translation
 *   literal = word-order-preserving literal translation
 *   method = 'override', 'composed', or 'gloss'
 * @param {Array} steps - [{nodeId, word: {tongan, english, tags, ...}}, ...]
 * @param {boolean} isQuestion - whether the user marked this as a question
 */
export function translate(steps, isQuestion = false) {
  return translateInner(steps, isQuestion)
}

/**
 * Phase 2A.2 wrapper: translate directly from a stack walker state. Reads
 * `state.translation.isQuestion` (set by `finishWalker` / `finishSentence`)
 * and flattens every frame's path into the linear `steps` array that the
 * existing compositional engine consumes. Use this from any consumer of the
 * new stack-based walker so the FINISH_STATEMENT vs FINISH_QUESTION choice
 * propagates into the English rendering.
 */
export function translateWalkerState(state) {
  const steps = []
  for (const frame of state.frames) {
    for (const step of frame.path) steps.push(step)
  }
  const isQuestion = !!(state.translation && state.translation.isQuestion)
  return translateInner(steps, isQuestion)
}

function translateInner(steps, isQuestion) {
  if (steps.length === 0) return { text: '', literal: '', method: 'none' }

  // Always build the literal (Tongan word-order) translation
  const literal = buildLiteralTranslation(steps)

  // Layer 1: Override table lookup. Phase 2A.2 — overrides are pre-computed
  // English strings; the same Tongan key can be either a statement or a
  // question (Cross-Cutting Rule 2: only the punctuation differs in Tongan).
  // Honor the user's terminator choice: only use the override if its trailing
  // punctuation matches the requested form. Otherwise fall through to the
  // compositional translator, which renders both forms correctly.
  const overrideKey = steps.map(s => s.word.tongan).join('|')
  if (overrides[overrideKey]) {
    const override = overrides[overrideKey]
    const overrideIsQuestion = /\?\s*$/.test(override)
    if (overrideIsQuestion === !!isQuestion) {
      return { text: override, literal, method: 'override' }
    }
    // Mismatch — let composition produce the matching form below.
  }

  // Layer 2: Compositional translation
  const composed = composeTranslation(steps, isQuestion)
  if (composed) {
    return { text: composed, literal, method: 'composed' }
  }

  // Layer 3: Word-by-word gloss (fallback for text too)
  const gloss = steps
    .map(s => `${s.word.tongan} (${s.word.english})`)
    .join('  ')
  return { text: gloss, literal, method: 'gloss' }
}

/**
 * Build a literal translation that preserves Tongan word order.
 * Shows the English meaning of each word in the order it appears.
 */
function buildLiteralTranslation(steps) {
  const parts = []
  for (const step of steps) {
    const nodeId = step.nodeId
    const english = step.word.english

    // Skip connector/structural words that have no English meaning
    if (english === '(connector)' || english === '(focus marker)') continue

    // Clean up parenthetical notes for cleaner display
    const clean = english
      .replace(/\s*\(after [^)]+\)/g, '')  // remove "(after na'a)" etc.
      .replace(/\s*\(emphatic\)/g, '')
      .replace(/\s*\(near [^)]+\)/g, '')
      .replace(/\s*\(over there\)/g, '')

    parts.push(clean)
  }
  return parts.join(' · ')
}

/**
 * Build a Tongan sentence string from steps (for display).
 */
export function buildTonganSentence(steps) {
  return steps
    .map(s => s.word.tongan)
    .join(' ')
}

/**
 * Compositional translation engine.
 * Detects sentence type from step node IDs and delegates to the appropriate handler.
 */
function composeTranslation(steps, isQuestion = false) {
  if (steps.length === 0) return null

  const nodeIds = steps.map(s => s.nodeId)

  // Phase 2E.4: multi-clause sentences are now composed. Each clause is
  // translated independently and joined with the appropriate English
  // conjunction. Purpose clauses (ke, koeʻuhi ke) get infinitive "to [verb]"
  // rendering; full sub-clauses (pea, ka, kae, kapau, lolotonga, he) get
  // composed through the same dispatch. Falls back to gloss for the whole
  // sentence only if the main clause can't compose.
  const MULTI_CLAUSE_IDS = [
    'clause_connector_ka', 'clause_connector_kae', 'clause_connector_pea',
    'subordinator_ke_purpose', 'subordinator_koeuhi_ke',
    'subordinator_kapau', 'subordinator_lolotonga',
    'clause_connector_he'
  ]
  if (nodeIds.some(id => MULTI_CLAUSE_IDS.includes(id))) {
    return composeMultiClauseTranslation(steps, isQuestion)
  }

  // Transitive sentences (§16): tense_marker_tr + verb_tr + object_phrase + agent_phrase
  if (nodeIds.includes('tense_marker_tr') && nodeIds.includes('verb_tr')) {
    return composeTransitiveTranslation(steps, isQuestion)
  }

  // Cleft constructions (§19): ko_emphatic + subject_phrase + tense_marker_cleft + verb_cleft
  if (nodeIds.includes('ko_emphatic') && nodeIds.includes('verb_cleft')) {
    return composeCleftTranslation(steps, isQuestion)
  }

  // Have construction (must come before possessive bail-out since it uses possessive nodes)
  if (nodeIds.includes('have_head')) {
    return composeHaveTranslation(steps, isQuestion)
  }

  // Existential sentences (§32): existential_head + existential_noun
  if (nodeIds.includes('existential_head')) {
    return composeExistentialTranslation(steps, isQuestion)
  }

  // Phase 2F.1: possessor_name is now composed in both possessive and
  // benefactive contexts. Bail only when possessor_name appears without
  // EITHER possessor_preposition (§22 possessive) OR benefactive_preposition_ma
  // (§25 benefactive) — a genuinely unknown context.
  if (
    nodeIds.includes('possessor_name') &&
    !nodeIds.includes('possessor_preposition') &&
    !nodeIds.includes('benefactive_preposition_ma')
  ) {
    return null
  }

  // Obligation/permission sentences (§28/§34): totonu_phrase, pau_phrase, tuku_ke_phrase, ofa_ke_phrase
  if (nodeIds.includes('totonu_phrase') || nodeIds.includes('pau_phrase') ||
      nodeIds.includes('tuku_ke_phrase') || nodeIds.includes('ofa_ke_phrase')) {
    return composeObligationTranslation(steps, isQuestion)
  }

  // Command sentences (command_verb or prohibition_verb or command_verb_plural)
  if (nodeIds.includes('command_verb') || nodeIds.includes('prohibition_verb') || nodeIds.includes('command_verb_plural')) {
    return composeCommandTranslation(steps)
  }

  // Ko equational sentences (§21, Ch 16): Ko e + predicate noun + subject
  if (nodeIds.includes('ko_e_equational')) {
    return composeKoEquationalTranslation(steps, isQuestion)
  }

  // Ko sentences
  if (nodeIds.includes('ko_e_fixed') || nodeIds.includes('ko_neg_prefix') || nodeIds.includes('ko_e_ha_fixed') || nodeIds.includes('ko_hai_fixed') || nodeIds.includes('ko_fe_fixed')) {
    return composeKoTranslation(steps, isQuestion)
  }

  // Suggestion
  if (nodeIds.includes('suggestion_pronoun')) {
    return composeSuggestionTranslation(steps)
  }

  // Negation (verbal or impersonal)
  if (nodeIds.includes('negation_word') || nodeIds.includes('negation_word_imp')) {
    return composeNegationTranslation(steps, isQuestion)
  }

  // Noun subject
  if (nodeIds.includes('verb_ns')) {
    return composeNounSubjectTranslation(steps, isQuestion)
  }

  // Experiencer
  if (nodeIds.includes('verb_experiencer')) {
    return composeExperiencerTranslation(steps, isQuestion)
  }

  // Location state (no verb)
  if (nodeIds.includes('preposition_i_fixed') && !nodeIds.includes('verb')) {
    return composeLocationTranslation(steps, isQuestion)
  }

  // Predicative possessive
  if (nodeIds.includes('predicative_possessive_head')) {
    return composePredicativePossessiveTranslation(steps, isQuestion)
  }

  // Exclamatory (ko…ka and meʻa patterns — baked English)
  if (nodeIds.includes('exclamatory_ko_ka_head') || nodeIds.includes('exclamatory_me_a_head')) {
    return composeExclamatoryTranslation(steps)
  }

  // Phase 2F.3: Auxiliary verb composition (fie_aux = want to; lava_o_aux = can/be able to)
  if (nodeIds.includes('fie_aux') || nodeIds.includes('lava_o_aux')) {
    return composeAuxiliaryTranslation(steps, isQuestion)
  }

  // Phase 2F.3: Personal count composition (personal_count — toko + numeral, no verb)
  if (nodeIds.includes('personal_count')) {
    return composePersonalCountTranslation(steps, isQuestion)
  }

  // Standard statement (fallthrough)
  const tmStep = steps.find(s => s.nodeId === 'tense_marker' || s.nodeId === 'tense_marker_loc')
  const pronStep = steps.find(s => s.nodeId === 'pronoun' || s.nodeId === 'pronoun_loc')
  const verbStep = steps.find(s => s.nodeId === 'verb')

  if (!tmStep || !pronStep || !verbStep) return null

  // Resolve tense
  const tmKey = normalize(tmStep.word.tongan)
  const tenseFrame = findTenseFrame(tmKey)
  if (!tenseFrame) return null

  // Resolve pronoun
  const pronKey = normalize(pronStep.word.tongan)
  const pronData = findPronounData(pronKey)
  if (!pronData) return null

  // Resolve verb
  const verbKey = normalize(verbStep.word.tongan)
  const verb = findVerbForms(verbKey)
  if (!verb) return null

  // isQuestion is now passed explicitly from the punctuation choice

  // Resolve modifiers if present
  const modSteps = steps.filter(s => s.nodeId === 'modifier')
  const isAdj = verb.type === 'adjective'
  const modPhrases = modSteps.map(ms => {
    const modKey = normalize(ms.word.tongan)
    const modData = findModifierData(modKey)
    return modData
      ? (isAdj ? modData.adjective_english : modData.english)
      : ms.word.english
  })

  // For adjectives, build the full adjective phrase with modifiers pre-inserted
  // e.g., "very happy" instead of inserting "very" after "happy"
  let verbPhrase
  if (isAdj && modPhrases.length > 0) {
    verbPhrase = modPhrases.join(' ') + ' ' + verb.base
  } else {
    verbPhrase = conjugate(verb, tenseFrame.tense, pronData, isQuestion)
  }

  // Phase 2F.4: comparative / superlative — override verbPhrase for adjective verbs
  // (comparative_ange = "more X"; superlative_taha = "the most X" / "X-est")
  if (isAdj) {
    const compAngStep = steps.find(s => s.nodeId === 'comparative_ange')
    const supTahaStep = steps.find(s => s.nodeId === 'superlative_taha')
    if (compAngStep || supTahaStep) {
      const cs = makeComparativeSuperlative(verb.base)
      verbPhrase = compAngStep ? cs.comparative : cs.superlative
    }
  }

  // Check for preposed modifier (fa'a = often)
  const preModStep = steps.find(s => s.nodeId === 'preposed_modifier')
  const preModEnglish = preModStep ? preModStep.word.english : null

  // Build the core sentence
  let subject = pronData.subject
  subject = subject.charAt(0).toUpperCase() + subject.slice(1)

  let sentence

  if (isQuestion) {
    sentence = buildQuestion(subject, verbPhrase, tenseFrame.tense, verb)
  } else {
    sentence = buildStatement(subject, verbPhrase, tenseFrame.tense, verb)
  }

  // Insert preposed modifier (e.g., "often") after subject
  if (preModEnglish) {
    sentence = insertAfterSubject(sentence, preModEnglish)
  }

  // Phase 2F.2: preposed aspect marker (kei=still, ʻosi=already, etc.)
  const aspectStep = steps.find(s => s.nodeId === 'aspect_marker')
  if (aspectStep) {
    sentence = insertAfterSubject(sentence, aspectStep.word.english)
  }

  // Add travel compound if present (by plane, by bus, etc.)
  const travelStep = steps.find(s => s.nodeId === 'travel_compound')
  if (travelStep) {
    sentence = insertObject(sentence, `by ${travelStep.word.english.replace('by ', '')}`)
  }

  // Add object if present
  const objStep = steps.find(s => s.nodeId === 'object')
  if (objStep) {
    sentence = insertObject(sentence, resolveObjectEnglish(steps, objStep))
  }

  // Phase 2E.5: possessive phrase as direct object ("my book", "your fish")
  // Fires when possessive_pronoun + possessive_head_noun are in the steps
  // without a preposition_possessive (that's the prepositional case below).
  const possPronStep = steps.find(s => s.nodeId === 'possessive_pronoun')
  const possNounStep = steps.find(s => s.nodeId === 'possessive_head_noun')
  const prepPossStep = steps.find(s => s.nodeId === 'preposition_possessive')
  if (possPronStep && possNounStep && !prepPossStep) {
    sentence = insertObject(sentence, composePossessiveEnglish(possPronStep, possNounStep))
  }

  // Add action verb modifiers (adjective modifiers already in verbPhrase)
  if (!isAdj && modPhrases.length > 0) {
    sentence = insertModifiers(sentence, modPhrases)
  }

  // Add preposition + place(s) if present (dual-prep + named-possessor aware)
  sentence = insertAllPrepPhrases(sentence, steps)

  // Phase 2E.5: prepositional possessive ("to my house", "in/at my book")
  // Fires when preposition_possessive + possessive_pronoun + possessive_head_noun
  // are all present (the prep_with_possessive sub-walk).
  if (prepPossStep && possPronStep && possNounStep) {
    const prepEnglish = prepPossStep.word.english
    const possPhrase = composePossessiveEnglish(possPronStep, possNounStep)
    sentence = insertObject(sentence, `${prepEnglish} ${possPhrase}`)
  }

  // Add companion(s) if present
  const companionSteps = steps.filter(s => s.nodeId === 'companion')
  if (companionSteps.length > 0) {
    const names = companionSteps.map(s => s.word.english)
    if (names.length === 1) {
      sentence = insertObject(sentence, `with ${names[0]}`)
    } else {
      const last = names.pop()
      sentence = insertObject(sentence, `with ${names.join(', ')} and ${last}`)
    }
  }

  // Add question word if present — restructure to natural English question
  const qStep = steps.find(s => s.nodeId === 'question_word')
  if (qStep) {
    sentence = restructureWithQuestionWord(sentence, qStep.word.english, tenseFrame.tense, subject, isQuestion)
  }

  // Add postposed pronoun (emphasis) if present
  const emphStep = steps.find(s => s.nodeId === 'postposed_pronoun')
  if (emphStep) {
    // Emphasis doesn't change the English meaning significantly, but we can note it
    // by adding "myself", "yourself", etc. as a subtle indicator
  }

  // Add time word if present
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) {
    sentence = insertObject(sentence, timeStep.word.english)
  }

  // Phase 2F.2: postposed aspect markers (leva=immediately, ai pē=as always)
  const aspectPostStep = steps.find(s => s.nodeId === 'aspect_marker_post')
  if (aspectPostStep) {
    sentence = insertObject(sentence, aspectPostStep.word.english.split('/')[0].trim())
  }
  const aspectPostFreqStep = steps.find(s => s.nodeId === 'aspect_marker_post_frequency')
  if (aspectPostFreqStep) {
    sentence = insertObject(sentence, aspectPostFreqStep.word.english.split('/')[0].trim())
  }

  // Phase 2F.3: directional particle (mai=toward me, atu=toward you, hake=upward, etc.)
  const directionalStep = steps.find(s => s.nodeId === 'directional')
  if (directionalStep) {
    const dirEnglish = directionalStep.word.english.replace(/\s*\(.*\)/g, '').trim()
    sentence = insertObject(sentence, dirEnglish)
  }

  // Phase 2F.3: count of times (tuʻo taha=once, tuʻo ua=twice, etc.)
  const tuoStep = steps.find(s => s.nodeId === 'tuo_numeral')
  if (tuoStep) {
    sentence = insertObject(sentence, tuoStep.word.english)
  }

  // Phase 2F.1: benefactive phrase ("for Sione" / "for me")
  sentence = insertBenefactivePhrase(sentence, steps)

  return sentence
}

/**
 * Phase 2F.4: derive English comparative and superlative forms from an adjective base.
 * Rules applied in order:
 *   1. Consonant + -y ending (happy, angry, thirsty, …) → stem + -ier / the stem + -iest
 *   2. Monosyllabic (one vowel group: sick, weak, poor)  → base + -er  / the base + -est
 *   3. Multi-syllable, no -y (tired)                     → more base   / the most base
 * Returns { comparative, superlative }.
 */
function makeComparativeSuperlative(base) {
  if (/[bcdfghjklmnpqrstvwxz]y$/.test(base)) {
    const stem = base.slice(0, -1)
    return { comparative: stem + 'ier', superlative: 'the ' + stem + 'iest' }
  }
  const vowelGroups = (base.match(/[aeiou]+/gi) || []).length
  if (vowelGroups <= 1) {
    return { comparative: base + 'er', superlative: 'the ' + base + 'est' }
  }
  return { comparative: 'more ' + base, superlative: 'the most ' + base }
}

function conjugate(verb, tense, pronData, isQuestion) {
  if (verb.type === 'adjective') {
    return verb.base // "happy", "tired", etc.
  }

  switch (tense) {
    case 'past':
      return verb.past
    case 'present':
      if (pronData.person === 3 && pronData.number === 'singular') {
        return verb.third_sg
      }
      return verb.base
    case 'perfect':
      return verb.past_participle
    case 'future':
      return verb.base
    default:
      return verb.base
  }
}

function buildStatement(subject, verbPhrase, tense, verb) {
  if (verb.type === 'adjective') {
    switch (tense) {
      case 'past':
        // "I/He/She was", but plural and 2nd-person subjects take "were"
        return `${subject} ${subject === 'I' || subject === 'He/she' ? 'was' : 'were'} ${verbPhrase}.`
      case 'present':
        if (subject === 'He/she') return `${subject} is ${verbPhrase}.`
        return `${subject} ${subject === 'I' ? 'am' : 'are'} ${verbPhrase}.`
      case 'perfect':
        if (subject === 'He/she') return `${subject} has been ${verbPhrase}.`
        return `${subject} have been ${verbPhrase}.`
      case 'future':
        return `${subject} will be ${verbPhrase}.`
    }
  }

  switch (tense) {
    case 'past':
      return `${subject} ${verbPhrase}.`
    case 'present':
      return `${subject} ${verbPhrase}.`
    case 'perfect':
      if (subject === 'He/she') return `${subject} has ${verbPhrase}.`
      return `${subject} have ${verbPhrase}.`
    case 'future':
      return `${subject} will ${verbPhrase}.`
    default:
      return `${subject} ${verbPhrase}.`
  }
}

function buildQuestion(subject, verbPhrase, tense, verb) {
  if (verb.type === 'adjective') {
    switch (tense) {
      case 'past':
        return `Were ${subject.toLowerCase()} ${verbPhrase}?`
      case 'present':
        return `Are ${subject.toLowerCase()} ${verbPhrase}?`
      case 'perfect':
        return `Have ${subject.toLowerCase()} been ${verbPhrase}?`
      case 'future':
        return `Will ${subject.toLowerCase()} be ${verbPhrase}?`
    }
  }

  switch (tense) {
    case 'past':
      return `Did ${subject.toLowerCase()} ${verb.base}?`
    case 'present':
      return `Do ${subject.toLowerCase()} ${verb.base}?`
    case 'perfect':
      return `Have ${subject.toLowerCase()} ${verb.past_participle}?`
    case 'future':
      return `Will ${subject.toLowerCase()} ${verb.base}?`
    default:
      return `${subject} ${verbPhrase}?`
  }
}

function insertObject(sentence, objEnglish) {
  // Insert object before the period/question mark
  const punctuation = sentence.slice(-1)
  const base = sentence.slice(0, -1)
  return `${base} ${objEnglish}${punctuation}`
}

function insertModifiers(sentence, modPhrases) {
  const punctuation = sentence.slice(-1)
  const base = sentence.slice(0, -1)
  return `${base} ${modPhrases.join(' ')}${punctuation}`
}

function restructureWithQuestionWord(sentence, qWordEnglish, tense, subject, wasAlreadyQuestion) {
  // Map question word English labels to natural English question starters
  const qWordMap = {
    'where (at)': 'Where',
    'where (to)': 'Where',
    'where (from)': 'Where',
    'when (past)': 'When',
    'when (future)': 'When',
    'how': 'How'
  }
  const qWord = qWordMap[qWordEnglish] || capitalize(qWordEnglish.replace(/\s*\(.*\)/, ''))

  // Strip existing punctuation from sentence
  const base = sentence.replace(/[.?!]$/, '')

  // Build the restructured question
  // Remove the subject from the base to rebuild as: QWord + did/do/will + subject + verb...
  const subjectLower = subject.toLowerCase()

  // For sentences already in question form ("Did you eat?"), extract the verb phrase
  if (wasAlreadyQuestion) {
    // "Did you come by plane" -> "When did you come by plane?"
    return `${qWord} ${base.charAt(0).toLowerCase()}${base.slice(1)}?`
  }

  // For statements ("I ate"), restructure to question form
  switch (tense) {
    case 'past':
      return `${qWord} did ${subjectLower} ${base.replace(new RegExp(`^${capitalize(subjectLower)}\\s+`, 'i'), '').replace(/\b(ate|went|came|sang|spoke|stayed|worked|helped|wanted|slept|drank|ran|saw|listened|read|wrote|jumped|studied|traveled)\b/, (m) => {
        const irregulars = { ate:'eat', went:'go', came:'come', sang:'sing', spoke:'speak', stayed:'stay', worked:'work', helped:'help', wanted:'want', slept:'sleep', drank:'drink', ran:'run', saw:'see', listened:'listen', read:'read', wrote:'write', jumped:'jump', studied:'study', traveled:'travel' }
        return irregulars[m] || m
      })}?`
    case 'present':
      return `${qWord} do ${subjectLower} ${base.replace(new RegExp(`^${capitalize(subjectLower)}\\s+`, 'i'), '')}?`
    case 'future': {
      const withoutSubjectWill = base.replace(new RegExp(`^${capitalize(subjectLower)}\\s+will\\s+`, 'i'), '')
      return `${qWord} will ${subjectLower} ${withoutSubjectWill}?`
    }
    case 'perfect': {
      const withoutSubjectHave = base.replace(new RegExp(`^${capitalize(subjectLower)}\\s+(have|has)\\s+`, 'i'), '')
      const aux = subjectLower === 'he/she' ? 'has' : 'have'
      return `${qWord} ${aux} ${subjectLower} ${withoutSubjectHave}?`
    }
    default:
      return `${qWord} ${base.charAt(0).toLowerCase()}${base.slice(1)}?`
  }
}

function insertAfterSubject(sentence, word) {
  // Insert "often" etc. after the first word (subject) in the sentence
  // Handle questions: "Did you eat?" -> "Did you often eat?"
  // Handle statements: "I ate." -> "I often ate."
  const spaceIdx = sentence.indexOf(' ')
  if (spaceIdx === -1) return sentence
  const first = sentence.slice(0, spaceIdx)
  const rest = sentence.slice(spaceIdx + 1)
  // For questions starting with Did/Do/Will/Have/Are/Were, insert after second word
  if (/^(Did|Do|Will|Have|Are|Were|Where|What)$/i.test(first)) {
    const secondSpace = rest.indexOf(' ')
    if (secondSpace === -1) return sentence
    const second = rest.slice(0, secondSpace)
    const remainder = rest.slice(secondSpace + 1)
    return `${first} ${second} ${word} ${remainder}`
  }
  return `${first} ${word} ${rest}`
}

// Lookup helpers that normalize keys for comparison

function findTenseFrame(normalizedKey) {
  for (const [key, data] of Object.entries(verbForms.tense_frames)) {
    if (normalize(key) === normalizedKey) return data
  }
  return null
}

function findPronounData(normalizedKey) {
  for (const [key, data] of Object.entries(verbForms.pronouns)) {
    if (normalize(key) === normalizedKey) return data
  }
  return null
}

function findVerbForms(normalizedKey) {
  for (const [key, data] of Object.entries(verbForms.verbs)) {
    if (normalize(key) === normalizedKey) return data
  }
  return null
}

function findModifierData(normalizedKey) {
  for (const [key, data] of Object.entries(verbForms.modifiers)) {
    if (normalize(key) === normalizedKey) return data
  }
  return null
}

function findObjectData(normalizedKey) {
  for (const [key, data] of Object.entries(verbForms.objects)) {
    if (normalize(key) === normalizedKey) return data
  }
  return null
}

// Look up the object's English, then prepend "some" / "the" when an article
// step is adjacent to the object in the flat steps. The refactored article
// node (`ha` / `e`) is a separate required pre-step of the `object` node, so
// its step always lands at index (objStepIdx - 1). Before the refactor these
// were fused in the `object` node as pre-composed entries like `ha ika` with
// english "some fish"; this helper reassembles that English string from the
// two separate steps without re-fusing the data.
function resolveObjectEnglish(steps, objStep) {
  const objData = findObjectData(normalize(objStep.word.tongan))
  let objEnglish = objData ? objData.english : objStep.word.english
  const objIdx = steps.indexOf(objStep)
  if (objIdx > 0 && steps[objIdx - 1].nodeId === 'article') {
    const article = steps[objIdx - 1]
    const articleEn = article.word.article_type === 'indefinite' ? 'some' : 'the'
    objEnglish = `${articleEn} ${objEnglish}`
  }
  return objEnglish
}

// --- New sentence type handlers ---

function composeCommandTranslation(steps) {
  const nodeIds = steps.map(s => s.nodeId)

  // Prohibition: 'Oua te + pronoun + verb
  if (nodeIds.includes('prohibition_marker')) {
    const pronStep = steps.find(s => s.nodeId === 'prohibition_pronoun')
    const verbStep = steps.find(s => s.nodeId === 'prohibition_verb')
    if (!verbStep) return null
    const verb = findVerbForms(normalize(verbStep.word.tongan)) || { base: verbStep.word.english }
    const who = pronStep?.word.english === 'you (all)' ? ', all of you' : ''
    const polite = steps.find(s => s.nodeId === 'polite_particle') ? ' please' : ''
    return `Don't ${verb.base}${who}${polite}!`
  }

  // Plural command: Mou + verb
  if (nodeIds.includes('imperative_mou')) {
    const verbStep = steps.find(s => s.nodeId === 'command_verb_plural')
    if (!verbStep) return null
    const verb = findVerbForms(normalize(verbStep.word.tongan)) || { base: verbStep.word.english }
    const polite = steps.find(s => s.nodeId === 'polite_particle') ? ' please' : ''
    return `${capitalize(verb.base)}${polite}, all of you!`
  }

  // Singular command: verb (+ mu'a / + koe)
  const verbStep = steps.find(s => s.nodeId === 'command_verb')
  if (!verbStep) return null
  const verb = findVerbForms(normalize(verbStep.word.tongan)) || { base: verbStep.word.english }
  const polite = steps.find(s => s.nodeId === 'polite_particle')
  const emphatic = steps.find(s => s.nodeId === 'emphatic_pronoun')
  if (polite) return `Please ${verb.base}!`
  if (emphatic) return `${capitalize(verb.base)} — you!`
  return `${capitalize(verb.base)}!`
}

/**
 * Phase 2F.1: Compose ko equational sentences (§21, Ch 16).
 * "Ko e faiako au" → "I am a teacher."
 * "Ko e taʻahine fiefia ʻa Mele" → "Mele is a happy girl."
 */
function composeKoEquationalTranslation(steps, isQuestion) {
  const nounStep = steps.find(s => s.nodeId === 'equational_noun')
  const subjStep = steps.find(s => s.nodeId === 'equational_subject')
  if (!nounStep || !subjStep) return null

  const noun = nounStep.word.english

  // Optional adjective (modifier_eq)
  const adjStep = steps.find(s => s.nodeId === 'modifier_eq')
  const adjEnglish = adjStep ? adjStep.word.english : null

  // Optional diminutives
  const dimPreStep = steps.find(s => s.nodeId === 'ki_i_diminutive')
  const dimPostStep = steps.find(s => s.nodeId === 'si_isi_i_postposed')

  // Build the predicate noun phrase: "a [small] [happy] teacher [small]"
  let nounPhrase = noun
  if (adjEnglish) nounPhrase = `${adjEnglish} ${nounPhrase}`
  if (dimPreStep && dimPostStep) {
    nounPhrase = `very small ${nounPhrase}`
  } else if (dimPreStep) {
    nounPhrase = `small ${nounPhrase}`
  } else if (dimPostStep) {
    nounPhrase = `small ${nounPhrase}`
  }

  // Determine subject and copula verb
  const subjEnglish = subjStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
  const nounClass = subjStep.word.noun_class
  const person = subjStep.word.person
  const number = subjStep.word.number

  let subject, verb
  if (nounClass === 'pronoun') {
    subject = capitalize(subjEnglish)
    if (person === 1 && number === 'singular') verb = 'am'
    else if (person === 3 && number === 'singular') verb = 'is'
    else verb = 'are'
  } else {
    // Proper name — always 3sg
    subject = subjEnglish
    verb = 'is'
  }

  if (isQuestion) {
    return `${capitalize(verb)} ${subject.toLowerCase()} a ${nounPhrase}?`
  }
  return `${subject} ${verb} a ${nounPhrase}.`
}

function composeKoTranslation(steps, isQuestion) {
  const nodeIds = steps.map(s => s.nodeId)

  // Ko e hā — What is that?
  if (nodeIds.includes('ko_e_ha_fixed')) {
    const demo = steps.find(s => s.nodeId === 'demonstrative')
    if (!demo) return null
    return `What is ${demo.word.english.replace(/\s*\(.*\)/, '')}?`
  }

  // Ko hai — Who?
  if (nodeIds.includes('ko_hai_fixed')) {
    const tmStep = steps.find(s => s.nodeId === 'tense_marker_kohai')
    const verbStep = steps.find(s => s.nodeId === 'verb_kohai')
    if (!tmStep || !verbStep) return null
    const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
    const verb = findVerbForms(normalize(verbStep.word.tongan)) || { base: verbStep.word.english }
    if (!tenseFrame) return null
    switch (tenseFrame.tense) {
      case 'present': return `Who is ${verb.gerund || verb.base + 'ing'}?`
      case 'past': return `Who ${verb.past || verb.base}?`
      case 'future': return `Who will ${verb.base}?`
      default: return `Who ${verb.base}?`
    }
  }

  // Ko fē — Where is?
  if (nodeIds.includes('ko_fe_fixed')) {
    const nameStep = steps.find(s => s.nodeId === 'focus_and_name')
    if (!nameStep) return null
    return `Where is ${nameStep.word.english}?`
  }

  // Ko negation — 'Oku 'ikai ko e + noun + subject
  if (nodeIds.includes('ko_neg_prefix')) {
    const nounStep = steps.find(s => s.nodeId === 'predicate_noun')
    const subjectStep = steps.find(s => s.nodeId === 'subject_ko')
    if (!nounStep || !subjectStep) return null
    const subject = subjectStep.word.english
    const article = subject === 'he/she' ? '' : subject
    return `${capitalize(article || 'He/She')} is not a ${nounStep.word.english}.`
  }

  // Ko identification — Ko e + noun + demonstrative (+ optional relative clause)
  if (nodeIds.includes('ko_e_fixed')) {
    const nounStep = steps.find(s => s.nodeId === 'noun_ko')
    const demoStep = steps.find(s => s.nodeId === 'demonstrative')
    if (!nounStep || !demoStep) return null
    const demoWord = demoStep.word.english.replace(/\s*\(.*\)/, '')

    // Phase 2F.1: relative clause composition
    if (nodeIds.includes('relative_clause_tense')) {
      const relClause = composeRelativeClause(steps)
      if (relClause) {
        return `${capitalize(demoWord)} is the ${nounStep.word.english} ${relClause}.`
      }
    }

    return `${capitalize(demoWord)} is a ${nounStep.word.english}.`
  }

  return null
}

function composeSuggestionTranslation(steps) {
  const pronStep = steps.find(s => s.nodeId === 'suggestion_pronoun')
  const verbStep = steps.find(s => s.nodeId === 'verb')
  if (!pronStep || !verbStep) return null
  const verb = findVerbForms(normalize(verbStep.word.tongan)) || { base: verbStep.word.english }
  return `Let's ${verb.base}!`
}

function composeNegationTranslation(steps, isQuestion = false) {
  const nodeIds = steps.map(s => s.nodeId)

  // Impersonal negation
  if (nodeIds.includes('negation_word_imp')) {
    const tmStep = steps.find(s => s.nodeId === 'tense_marker_neg_imp')
    const verbStep = steps.find(s => s.nodeId === 'verb_weather')
    if (!tmStep || !verbStep) return null
    const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
    if (!tenseFrame) return null
    const verbEnglish = verbStep.word.english
    const timeStep = steps.find(s => s.nodeId === 'time_word')
    const timePart = timeStep ? ' ' + timeStep.word.english : ''
    if (isQuestion) {
      switch (tenseFrame.tense) {
        case 'present': return `Is it not ${verbEnglish}${timePart}?`
        case 'past': return `Was it not ${verbEnglish}${timePart}?`
        case 'future': return `Will it not be ${verbEnglish}${timePart}?`
        default: return `Is it not ${verbEnglish}${timePart}?`
      }
    }
    switch (tenseFrame.tense) {
      case 'present': return `It is not ${verbEnglish}${timePart}.`
      case 'past': return `It was not ${verbEnglish}${timePart}.`
      case 'future': return `It will not be ${verbEnglish}${timePart}.`
      default: return `It is not ${verbEnglish}${timePart}.`
    }
  }

  // Noun subject negation ('ikai ke + verb + 'a + name)
  if (nodeIds.includes('neg_connector_ns')) {
    const tmStep = steps.find(s => s.nodeId === 'tense_marker_neg')
    const verbStep = steps.find(s => s.nodeId === 'verb_ns')
    const nameStep = steps.find(s => s.nodeId === 'noun_subject_name')
    if (!tmStep || !verbStep || !nameStep) return null

    const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
    const verb = findVerbForms(normalize(verbStep.word.tongan))
    if (!tenseFrame || !verb) return null

    // noun_subject_name stores common nouns bare ("boy"/"woman") and personal
    // names as-is ("Sione"). Render: common nouns get "The <noun>" to mirror
    // the Tongan "e <noun>" surface; personal names use the Tongan form
    // (capitalized) since English proper names match the Tongan spelling.
    const nameEnglish = nameStep.word.english
    const name = nameStep.word.noun_class === 'common'
      ? `The ${nameEnglish}`
      : nameStep.word.tongan
    const isAdj = verb.type === 'adjective'

    // Modifiers before subject
    const modSteps = steps.filter(s => s.nodeId === 'modifier_ns')
    const modPhrases = modSteps.map(ms => {
      const d = findModifierData(normalize(ms.word.tongan))
      return d ? (isAdj ? d.adjective_english : d.english) : ms.word.english
    })

    const nameLower = nameStep.word.noun_class === 'common'
      ? `the ${nameStep.word.english}`
      : name

    let sentence
    if (isAdj) {
      const adj = modPhrases.length > 0 ? modPhrases.join(' ') + ' ' + verb.base : verb.base
      if (isQuestion) {
        switch (tenseFrame.tense) {
          case 'present': sentence = `Is ${nameLower} not ${adj}?`; break
          case 'past': sentence = `Was ${nameLower} not ${adj}?`; break
          case 'future': sentence = `Will ${nameLower} not be ${adj}?`; break
          default: sentence = `Is ${nameLower} not ${adj}?`
        }
      } else {
        switch (tenseFrame.tense) {
          case 'present': sentence = `${name} is not ${adj}.`; break
          case 'past': sentence = `${name} was not ${adj}.`; break
          case 'future': sentence = `${name} will not be ${adj}.`; break
          default: sentence = `${name} is not ${adj}.`
        }
      }
    } else if (isQuestion) {
      switch (tenseFrame.tense) {
        case 'present': sentence = `Does ${nameLower} not ${verb.base}?`; break
        case 'past': sentence = `Did ${nameLower} not ${verb.base}?`; break
        case 'future': sentence = `Will ${nameLower} not ${verb.base}?`; break
        default: sentence = `Does ${nameLower} not ${verb.base}?`
      }
      if (modPhrases.length > 0) {
        sentence = insertModifiers(sentence, modPhrases)
      }
    } else {
      switch (tenseFrame.tense) {
        case 'present': sentence = `${name} does not ${verb.base}.`; break
        case 'past': sentence = `${name} did not ${verb.base}.`; break
        case 'future': sentence = `${name} will not ${verb.base}.`; break
        default: sentence = `${name} does not ${verb.base}.`
      }
      if (!isAdj && modPhrases.length > 0) {
        sentence = insertModifiers(sentence, modPhrases)
      }
    }

    sentence = insertAllPrepPhrases(sentence, steps)
    const companionSteps = steps.filter(s => s.nodeId === 'companion')
    if (companionSteps.length > 0) {
      const names = companionSteps.map(s => s.word.english)
      sentence = insertObject(sentence, `with ${names.join(' and ')}`)
    }
    const timeStep = steps.find(s => s.nodeId === 'time_word')
    if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

    // Phase 2F.1: benefactive phrase
    sentence = insertBenefactivePhrase(sentence, steps)

    return sentence
  }

  // Verbal negation (pronoun: 'ikai te + pronoun + verb)
  const tmStep = steps.find(s => s.nodeId === 'tense_marker_neg')
  const pronStep = steps.find(s => s.nodeId === 'pronoun_neg')
  const verbStep = steps.find(s => s.nodeId === 'verb')
  if (!tmStep || !pronStep || !verbStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  const pronData = findPronounData(normalize(pronStep.word.tongan))
  const verb = findVerbForms(normalize(verbStep.word.tongan))
  if (!tenseFrame || !pronData || !verb) return null

  let subject = capitalize(pronData.subject)
  const isAdj = verb.type === 'adjective'

  // Phase 2F.4: comparative/superlative for adjective negation
  // (verb.next includes comparative_ange and superlative_taha so these can appear here)
  const compAngNegStep = steps.find(s => s.nodeId === 'comparative_ange')
  const supTahaNegStep = steps.find(s => s.nodeId === 'superlative_taha')
  const negAdjPhrase = (isAdj && (compAngNegStep || supTahaNegStep))
    ? makeComparativeSuperlative(verb.base)[compAngNegStep ? 'comparative' : 'superlative']
    : verb.base

  const subjLower = subject.toLowerCase()

  let sentence
  if (isAdj) {
    if (isQuestion) {
      switch (tenseFrame.tense) {
        case 'present':
          sentence = subject === 'I' ? `Am ${subjLower} not ${negAdjPhrase}?` :
                     subject === 'He/she' ? `Is ${subjLower} not ${negAdjPhrase}?` :
                     `Are ${subjLower} not ${negAdjPhrase}?`
          break
        case 'past':
          sentence = (subject === 'I' || subject === 'He/she')
            ? `Was ${subjLower} not ${negAdjPhrase}?`
            : `Were ${subjLower} not ${negAdjPhrase}?`
          break
        case 'future': sentence = `Will ${subjLower} not be ${negAdjPhrase}?`; break
        default: sentence = `Is ${subjLower} not ${negAdjPhrase}?`
      }
    } else {
      switch (tenseFrame.tense) {
        case 'present':
          sentence = subject === 'I' ? `${subject} am not ${negAdjPhrase}.` :
                     subject === 'He/she' ? `${subject} is not ${negAdjPhrase}.` :
                     `${subject} are not ${negAdjPhrase}.`
          break
        case 'past': sentence = `${subject} was not ${negAdjPhrase}.`; break
        case 'future': sentence = `${subject} will not be ${negAdjPhrase}.`; break
        default: sentence = `${subject} is not ${negAdjPhrase}.`
      }
    }
  } else if (isQuestion && !nodeIds.includes('question_word')) {
    // A trailing question_word node triggers the dedicated qWord restructure
    // block below, which expects statement-form input ("X do not Y.") and
    // produces its own question form ("Where do x not Y?"). Skip the plain
    // yes/no question form here so we don't double-transform.
    const doAux = subject === 'He/she' ? 'Does' : 'Do'
    switch (tenseFrame.tense) {
      case 'present': sentence = `${doAux} ${subjLower} not ${verb.base}?`; break
      case 'past': sentence = `Did ${subjLower} not ${verb.base}?`; break
      case 'future': sentence = `Will ${subjLower} not ${verb.base}?`; break
      default: sentence = `${doAux} ${subjLower} not ${verb.base}?`
    }
  } else {
    switch (tenseFrame.tense) {
      case 'present': sentence = `${subject} do not ${verb.base}.`; break
      case 'past': sentence = `${subject} did not ${verb.base}.`; break
      case 'future': sentence = `${subject} will not ${verb.base}.`; break
      default: sentence = `${subject} do not ${verb.base}.`
    }
  }

  // Add modifiers/objects/time
  const modSteps = steps.filter(s => s.nodeId === 'modifier')
  if (modSteps.length > 0) {
    const modPhrases = modSteps.map(ms => {
      const d = findModifierData(normalize(ms.word.tongan))
      return d ? (isAdj ? d.adjective_english : d.english) : ms.word.english
    })
    sentence = insertModifiers(sentence, modPhrases)
  }
  const objStep = steps.find(s => s.nodeId === 'object')
  if (objStep) {
    sentence = insertObject(sentence, resolveObjectEnglish(steps, objStep))
  }
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  // Phase 2F.3: aspect marker in negation (kei=still, ʻosi=already, etc.)
  const aspectNegStep = steps.find(s => s.nodeId === 'aspect_marker')
  if (aspectNegStep) {
    sentence = insertAfterSubject(sentence, aspectNegStep.word.english)
  }

  // Phase 2F.5: preposed modifier (faʻa = often) in negation
  // In negation "I do not go.", "often" goes after "not": "I do not often go."
  const preModNegStep = steps.find(s => s.nodeId === 'preposed_modifier')
  if (preModNegStep) {
    sentence = sentence.replace(/\bnot\b/, `not ${preModNegStep.word.english}`)
  }

  // Phase 2F.1: benefactive phrase
  sentence = insertBenefactivePhrase(sentence, steps)

  // Phase 2F.4: question word in verbal negation ("Where do I not go?")
  // verb.next includes question_word so it can appear after the verb in negation sentences.
  // Adjective-negation question-word ("Where am I not happy?") is deferred.
  const qWordNegStep = steps.find(s => s.nodeId === 'question_word')
  if (qWordNegStep && !isAdj) {
    const qWordMap = {
      'where (at)': 'Where', 'where (to)': 'Where', 'where (from)': 'Where',
      'when (past)': 'When', 'when (future)': 'When', 'how': 'How'
    }
    const qWord = qWordMap[qWordNegStep.word.english] || capitalize(qWordNegStep.word.english.replace(/\s*\(.*\)/, ''))
    const subLow = subject.toLowerCase()
    const baseSentence = sentence.replace(/\.$/, '')
    const verbAndRest = baseSentence.replace(new RegExp(`^${subject}\\s+\\w+\\s+not\\s+`, 'i'), '')
    switch (tenseFrame.tense) {
      case 'present': sentence = `${qWord} do ${subLow} not ${verbAndRest}?`; break
      case 'past': sentence = `${qWord} did ${subLow} not ${verbAndRest}?`; break
      case 'future': sentence = `${qWord} will ${subLow} not ${verbAndRest}?`; break
      default: sentence = `${qWord} do ${subLow} not ${verbAndRest}?`
    }
  }

  return sentence
}

function composeNounSubjectTranslation(steps, isQuestion = false) {
  // Find TM — could come from regular noun_subject or negation path
  const tmStep = steps.find(s => s.nodeId === 'tense_marker_ns' || s.nodeId === 'tense_marker_neg')
  const verbStep = steps.find(s => s.nodeId === 'verb_ns')
  const nameStep = steps.find(s => s.nodeId === 'noun_subject_name')
  if (!tmStep || !verbStep || !nameStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  const verb = findVerbForms(normalize(verbStep.word.tongan))
  if (!tenseFrame || !verb) return null

  // Subject: proper name OR common noun with definite article. After the
  // noun_subject refactor, common nouns are stored bare ("boy") and the
  // article `e` is added at render time on the Tongan side; here we mirror
  // that by prepending "The " for common nouns, keeping personal names as-is.
  const nameEnglish = nameStep.word.english
  const name = nameStep.word.noun_class === 'common'
    ? `The ${nameEnglish}`
    : nameStep.word.tongan
  const isAdj = verb.type === 'adjective'

  // Modifiers before subject (modifier_ns)
  const modSteps = steps.filter(s => s.nodeId === 'modifier_ns')
  const modPhrases = modSteps.map(ms => {
    const d = findModifierData(normalize(ms.word.tongan))
    return d ? (isAdj ? d.adjective_english : d.english) : ms.word.english
  })

  let verbPhrase
  if (isAdj && modPhrases.length > 0) {
    verbPhrase = modPhrases.join(' ') + ' ' + verb.base
  } else {
    verbPhrase = null // will use conjugation below
  }

  // Phase 2F.5: comparative/superlative for noun-subject adjectives
  if (isAdj) {
    const compAngNsStep = steps.find(s => s.nodeId === 'comparative_ange')
    const supTahaNsStep = steps.find(s => s.nodeId === 'superlative_taha')
    if (compAngNsStep || supTahaNsStep) {
      const cs = makeComparativeSuperlative(verb.base)
      verbPhrase = compAngNsStep ? cs.comparative : cs.superlative
    }
  }

  // Noun-subject sentences lower-case the subject when it follows an
  // auxiliary (does/did/will/has/is/was) in a question — "Does the boy …?"
  // not "Does The boy …?". Personal names keep their original case.
  const nameLower = nameStep.word.noun_class === 'common'
    ? `the ${nameStep.word.english}`
    : name

  let sentence
  if (isAdj) {
    const adj = verbPhrase || verb.base
    if (isQuestion) {
      switch (tenseFrame.tense) {
        case 'present': sentence = `Is ${nameLower} ${adj}?`; break
        case 'past': sentence = `Was ${nameLower} ${adj}?`; break
        case 'perfect': sentence = `Has ${nameLower} been ${adj}?`; break
        case 'future': sentence = `Will ${nameLower} be ${adj}?`; break
        default: sentence = `Is ${nameLower} ${adj}?`
      }
    } else {
      switch (tenseFrame.tense) {
        case 'present': sentence = `${name} is ${adj}.`; break
        case 'past': sentence = `${name} was ${adj}.`; break
        case 'perfect': sentence = `${name} has been ${adj}.`; break
        case 'future': sentence = `${name} will be ${adj}.`; break
        default: sentence = `${name} is ${adj}.`
      }
    }
  } else if (isQuestion) {
    switch (tenseFrame.tense) {
      case 'past': sentence = `Did ${nameLower} ${verb.base}?`; break
      case 'perfect': sentence = `Has ${nameLower} ${verb.past_participle}?`; break
      case 'future': sentence = `Will ${nameLower} ${verb.base}?`; break
      default: sentence = `Does ${nameLower} ${verb.base}?`
    }
    if (modPhrases.length > 0) {
      sentence = insertModifiers(sentence, modPhrases)
    }
  } else {
    const verbForm = tenseFrame.tense === 'past' ? verb.past :
                     tenseFrame.tense === 'perfect' ? `has ${verb.past_participle}` :
                     tenseFrame.tense === 'future' ? `will ${verb.base}` :
                     (verb.third_sg || verb.base)
    sentence = `${name} ${verbForm}.`
    if (!isAdj && modPhrases.length > 0) {
      sentence = insertModifiers(sentence, modPhrases)
    }
  }

  // Extensions after noun subject
  sentence = insertAllPrepPhrases(sentence, steps)
  const companionSteps = steps.filter(s => s.nodeId === 'companion')
  if (companionSteps.length > 0) {
    const names = companionSteps.map(s => s.word.english)
    if (names.length === 1) {
      sentence = insertObject(sentence, `with ${names[0]}`)
    } else {
      const last = names.pop()
      sentence = insertObject(sentence, `with ${names.join(', ')} and ${last}`)
    }
  }
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  // Phase 2F.5: directional particle (post-subject position)
  const directionalNsStep = steps.find(s => s.nodeId === 'directional')
  if (directionalNsStep) {
    const dirEnglish = directionalNsStep.word.english.replace(/\s*\(.*\)/g, '').trim()
    sentence = insertObject(sentence, dirEnglish)
  }

  // Phase 2F.5: count of times (tuʻo taha=once, tuʻo ua=twice, etc.)
  const tuoNsStep = steps.find(s => s.nodeId === 'tuo_numeral')
  if (tuoNsStep) {
    sentence = insertObject(sentence, tuoNsStep.word.english)
  }

  // Phase 2F.1: benefactive phrase
  sentence = insertBenefactivePhrase(sentence, steps)

  return sentence
}

function composeExperiencerTranslation(steps, isQuestion = false) {
  const verbStep = steps.find(s => s.nodeId === 'verb_experiencer')
  const prepStep = steps.find(s => s.nodeId === 'prep_pronoun')
  if (!verbStep || !prepStep) return null

  const verbKey = normalize(verbStep.word.tongan)
  const prepKey = normalize(prepStep.word.tongan)

  // Map to natural English
  const personMap = {
    'kiate au': 'I', 'kiate koe': 'you', 'kiate ia': 'he/she',
    "'iate au": 'I', "'iate koe": 'you', "'iate ia": 'he/she'
  }
  const person = personMap[prepKey] || prepStep.word.english
  const is3sg = person === 'he/she'

  // Subject-aux inversion in questions lowercases the subject pronoun
  // ("Do i understand?") — matches the existing convention used by
  // buildQuestion for statement→question inversion elsewhere in translate.js.
  const personLower = person.toLowerCase()

  if (verbKey === 'mahino') {
    if (isQuestion) {
      return `${is3sg ? 'Does' : 'Do'} ${personLower} understand?`
    }
    return `${capitalize(person)} understand${is3sg ? 's' : ''}.`
  }
  if (verbKey === 'ngalo') {
    const tmStep = steps.find(s => s.nodeId === 'tense_marker_exp')
    const tenseFrame = tmStep ? findTenseFrame(normalize(tmStep.word.tongan)) : null
    if (isQuestion) {
      if (tenseFrame?.tense === 'past') return `Did ${personLower} forget?`
      return `${is3sg ? 'Does' : 'Do'} ${personLower} forget?`
    }
    if (tenseFrame?.tense === 'past') return `${capitalize(person)} forgot.`
    return `${capitalize(person)} forget${is3sg ? 's' : ''}.`
  }
  return null
}

function composeLocationTranslation(steps, isQuestion = false) {
  const tmStep = steps.find(s => s.nodeId === 'tense_marker_loc')
  const pronStep = steps.find(s => s.nodeId === 'pronoun_loc')
  const placeStep = steps.find(s => s.nodeId === 'place')
  if (!tmStep || !pronStep || !placeStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  const pronData = findPronounData(normalize(pronStep.word.tongan))
  if (!tenseFrame || !pronData) return null

  let subject = capitalize(pronData.subject)
  const place = placeStep.word.english

  // "Where is X?" already phrased as a question — adding FINISH_QUESTION on
  // top is redundant; return as-is regardless of isQuestion.
  if (place === 'where?') {
    switch (tenseFrame.tense) {
      case 'present': return `Where ${subject === 'I' ? 'am' : subject === 'He/she' ? 'is' : 'are'} ${subject.toLowerCase()}?`
      case 'past': return `Where ${subject === 'I' || subject === 'He/she' ? 'was' : 'were'} ${subject.toLowerCase()}?`
      case 'future': return `Where will ${subject.toLowerCase()} be?`
      default: return `Where is ${subject.toLowerCase()}?`
    }
  }

  let verb
  switch (tenseFrame.tense) {
    case 'present': verb = subject === 'I' ? 'am' : subject === 'He/she' ? 'is' : 'are'; break
    case 'past': verb = subject === 'I' || subject === 'He/she' ? 'was' : 'were'; break
    case 'perfect': verb = subject === 'He/she' ? 'has been' : 'have been'; break
    case 'future': verb = 'will be'; break
    default: verb = 'is'
  }

  let sentence
  if (isQuestion) {
    // Yes/no location question: "Am I at the house?" / "Was he/she at the
    // market?". Subject-aux inversion — take the auxiliary (am/is/are/was/
    // were/has been/have been/will be) that was selected for the statement
    // and front it. For multi-word auxes (perfect, future) only the first
    // token fronts: "Has he/she been at ...?", "Will I be at ...?".
    const tokens = verb.split(' ')
    const head = tokens.shift()
    const tail = tokens.length ? tokens.join(' ') + ' ' : ''
    sentence = `${capitalize(head)} ${subject.toLowerCase()} ${tail}at ${place}?`
  } else {
    sentence = `${subject} ${verb} at ${place}.`
  }

  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  return sentence
}

/**
 * Phase 2E.5: compose a possessive phrase as English "my X", "your X", etc.
 * Strips parenthetical notes from the pronoun's English label (e.g.
 * "your (one person)" → "your") and joins with the head noun's English.
 */
function composePossessiveEnglish(pronStep, nounStep) {
  const possessive = pronStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
  const noun = nounStep.word.english
  return `${possessive} ${noun}`
}

/**
 * Phase 2F.2: map subject pronouns to objective case for "Let [obj] [verb]".
 */
function subjectToObjective(subject) {
  const map = {
    'I': 'me', 'he/she': 'him/her', 'they': 'them',
    'we': 'us', 'we all': 'us all',
    // Duals read as standard objective English ("Let the two of them go"),
    // not the dialectal "them two" — keeps the dual number explicit. This
    // objective path only goes live with the Ch 38 optative (s43).
    'we two': 'the two of us', 'they two': 'the two of them',
    'you two': 'the two of you'
  }
  return map[subject] || subject.toLowerCase()
}

function possessiveSubject(person, number) {
  if (person === 1 && number === 'singular') return 'I'
  if (person === 2 && number === 'singular') return 'You'
  if (person === 3 && number === 'singular') return 'He/she'
  if (person === 1 && number === 'dual') return 'We two'
  if (person === 2 && number === 'dual') return 'You two'
  if (person === 3 && number === 'dual') return 'They two'
  if (person === 1 && number === 'plural') return 'We'
  if (person === 2 && number === 'plural') return 'You'
  if (person === 3 && number === 'plural') return 'They'
  return 'I'
}

function composeHaveTranslation(steps, isQuestion) {
  const haveStep = steps.find(s => s.nodeId === 'have_head')
  const pronStep = steps.find(s => s.nodeId === 'possessive_pronoun')
  const nounStep = steps.find(s => s.nodeId === 'possessive_head_noun')
  if (!haveStep || !pronStep || !nounStep) return null

  const tags = haveStep.word.tags || []
  const isNegated = tags.includes('negated')
  const tense = tags.find(t => ['present', 'past', 'perfect', 'future'].includes(t)) || 'present'
  const subject = possessiveSubject(pronStep.word.person, pronStep.word.number)
  const is3sg = pronStep.word.person === 3 && pronStep.word.number === 'singular'
  const noun = nounStep.word.english

  if (isQuestion) {
    switch (tense) {
      case 'present':
        return isNegated
          ? `${is3sg ? "Doesn't" : "Don't"} ${subject.toLowerCase()} have a ${noun}?`
          : `${is3sg ? 'Does' : 'Do'} ${subject.toLowerCase()} have a ${noun}?`
      case 'past':
        return isNegated
          ? `Didn't ${subject.toLowerCase()} have a ${noun}?`
          : `Did ${subject.toLowerCase()} have a ${noun}?`
      case 'future':
        return isNegated
          ? `Won't ${subject.toLowerCase()} have a ${noun}?`
          : `Will ${subject.toLowerCase()} have a ${noun}?`
      case 'perfect':
        return isNegated
          ? `${is3sg ? "Hasn't" : "Haven't"} ${subject.toLowerCase()} had a ${noun}?`
          : `${is3sg ? 'Has' : 'Have'} ${subject.toLowerCase()} had a ${noun}?`
      default:
        return `${is3sg ? 'Does' : 'Do'} ${subject.toLowerCase()} have a ${noun}?`
    }
  }

  switch (tense) {
    case 'present':
      return isNegated
        ? `${subject} do${is3sg ? 'es' : ''} not have a ${noun}.`
        : `${subject} ${is3sg ? 'has' : 'have'} a ${noun}.`
    case 'past':
      return isNegated
        ? `${subject} did not have a ${noun}.`
        : `${subject} had a ${noun}.`
    case 'future':
      return isNegated
        ? `${subject} will not have a ${noun}.`
        : `${subject} will have a ${noun}.`
    case 'perfect':
      return isNegated
        ? `${subject} ${is3sg ? 'has' : 'have'} not had a ${noun}.`
        : `${subject} ${is3sg ? 'has' : 'have'} had a ${noun}.`
    default:
      return `${subject} ${is3sg ? 'has' : 'have'} a ${noun}.`
  }
}

function composePredicativePossessiveTranslation(steps, isQuestion) {
  const possStep = steps.find(s => s.nodeId === 'postposed_possessive')
  const subjStep = steps.find(s => s.nodeId === 'predicative_poss_subject')
  if (!possStep || !subjStep) return null

  const possEnglish = possStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
  const subjEnglish = subjStep.word.english

  if (isQuestion) {
    return `Is ${subjEnglish} ${possEnglish}?`
  }
  return `${capitalize(subjEnglish)} is ${possEnglish}.`
}

function composeTransitiveTranslation(steps, isQuestion) {
  const tmStep = steps.find(s => s.nodeId === 'tense_marker_tr')
  const verbStep = steps.find(s => s.nodeId === 'verb_tr')
  const objStep = steps.find(s => s.nodeId === 'object_phrase')
  const agentStep = steps.find(s => s.nodeId === 'agent_phrase')
  if (!tmStep || !verbStep || !objStep || !agentStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  if (!tenseFrame) return null

  const verb = findVerbForms(normalize(verbStep.word.tongan))
  const verbBase = verb ? verb.base : verbStep.word.english.split(',')[0].trim()

  // Agent + object entries are stored bare after the transitive refactor:
  // common nouns have `english: "boy"` / "fish" / etc. (no "the " prefix).
  // Mirror the Tongan `ʻe he tamasiʻí` / `ʻa e iká` surface by prepending
  // "the" for common nouns and leaving personal names alone.
  const agentEn = agentStep.word.noun_class === 'common'
    ? `the ${agentStep.word.english}`
    : agentStep.word.english
  const objectEn = objStep.word.noun_class === 'common'
    ? `the ${objStep.word.english}`
    : objStep.word.english

  const subject = capitalize(agentEn)
  const object = objectEn

  // For questions, proper nouns keep capitalization; common nouns go lowercase
  const qSubject = agentStep.word.noun_class === 'personal' ? subject : subject.toLowerCase()

  let sentence
  if (isQuestion) {
    switch (tenseFrame.tense) {
      case 'past':
        sentence = `Did ${qSubject} ${verbBase} ${object}?`; break
      case 'present':
        sentence = `Does ${qSubject} ${verbBase} ${object}?`; break
      case 'perfect':
        sentence = `Has ${qSubject} ${verb ? verb.past_participle : verbBase + 'ed'} ${object}?`; break
      case 'future':
        sentence = `Will ${qSubject} ${verbBase} ${object}?`; break
      default:
        sentence = `Does ${qSubject} ${verbBase} ${object}?`
    }
  } else {
    switch (tenseFrame.tense) {
      case 'past':
        sentence = `${subject} ${verb ? verb.past : verbBase + 'ed'} ${object}.`; break
      case 'present':
        sentence = `${subject} ${verb ? verb.third_sg : verbBase + 's'} ${object}.`; break
      case 'perfect':
        sentence = `${subject} has ${verb ? verb.past_participle : verbBase + 'ed'} ${object}.`; break
      case 'future':
        sentence = `${subject} will ${verbBase} ${object}.`; break
      default:
        sentence = `${subject} ${verb ? verb.third_sg : verbBase + 's'} ${object}.`
    }
  }

  // Extensions: preposition+prep_phrase(s), time_word, companion
  sentence = insertAllPrepPhrases(sentence, steps)
  const companionSteps = steps.filter(s => s.nodeId === 'companion')
  if (companionSteps.length > 0) {
    const names = companionSteps.map(s => s.word.english)
    sentence = insertObject(sentence, `with ${names.join(' and ')}`)
  }
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  // Phase 2F.5: directional particle after agent
  const directionalTrStep = steps.find(s => s.nodeId === 'directional')
  if (directionalTrStep) {
    const dirEnglish = directionalTrStep.word.english.replace(/\s*\(.*\)/g, '').trim()
    sentence = insertObject(sentence, dirEnglish)
  }

  // Phase 2F.5: count of times after agent
  const tuoTrStep = steps.find(s => s.nodeId === 'tuo_numeral')
  if (tuoTrStep) {
    sentence = insertObject(sentence, tuoTrStep.word.english)
  }

  // Phase 2F.1: benefactive phrase
  sentence = insertBenefactivePhrase(sentence, steps)

  return sentence
}

function composeCleftTranslation(steps, isQuestion) {
  const subjStep = steps.find(s => s.nodeId === 'subject_phrase')
  const tmStep = steps.find(s => s.nodeId === 'tense_marker_cleft')
  const verbStep = steps.find(s => s.nodeId === 'verb_cleft')
  const objStep = steps.find(s => s.nodeId === 'object_phrase_cleft')
  if (!subjStep || !tmStep || !verbStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  if (!tenseFrame) return null

  const verb = findVerbForms(normalize(verbStep.word.tongan))
  const verbBase = verb ? verb.base : verbStep.word.english.split(',')[0].trim()

  // Subject: clean parenthetical notes like "(emphatic)" from pronouns, and
  // prepend "the" for common nouns (which are now stored bare after the
  // subject_phrase refactor — e.g. `fānau`/"children" instead of the old
  // `e fānau`/"the children" pre-composed entry).
  const rawEnglish = subjStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
  const subject = subjStep.word.noun_class === 'common'
    ? `the ${rawEnglish}`
    : rawEnglish

  // Person/number from subject_phrase for verb agreement
  const is3sg = subjStep.word.person === 3 && subjStep.word.number === 'singular'

  // "It is/was" — past uses "was", everything else uses "is"
  const itVerb = tenseFrame.tense === 'past' ? 'was' : 'is'

  // Build relative clause with proper verb agreement
  let relClause
  switch (tenseFrame.tense) {
    case 'past':
      relClause = `who ${verb ? verb.past : verbBase + 'ed'}`; break
    case 'present':
      relClause = is3sg
        ? `who ${verb ? verb.third_sg : verbBase + 's'}`
        : `who ${verbBase}`; break
    case 'perfect':
      relClause = is3sg
        ? `who has ${verb ? verb.past_participle : verbBase + 'ed'}`
        : `who have ${verb ? verb.past_participle : verbBase + 'ed'}`; break
    case 'future':
      relClause = `who will ${verbBase}`; break
    default:
      relClause = is3sg
        ? `who ${verb ? verb.third_sg : verbBase + 's'}`
        : `who ${verbBase}`
  }

  // Cleft object is stored bare after the refactor — prepend "the" for
  // common nouns just like composeTransitiveTranslation does. Personal
  // names (Sione, Mele) pass through unchanged.
  const objEnglish = objStep
    ? (objStep.word.noun_class === 'common'
        ? `the ${objStep.word.english}`
        : objStep.word.english)
    : ''
  const objPart = objStep ? ` ${objEnglish}` : ''

  let sentence
  if (isQuestion) {
    sentence = `${capitalize(itVerb)} it ${subject} ${relClause}${objPart}?`
  } else {
    sentence = `It ${itVerb} ${subject} ${relClause}${objPart}.`
  }

  // Extensions: preposition+prep_phrase(s), time_word
  sentence = insertAllPrepPhrases(sentence, steps)
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  // Phase 2F.1: benefactive phrase
  sentence = insertBenefactivePhrase(sentence, steps)

  return sentence
}

/**
 * Phase 2E.4: Compose multi-clause sentences.
 * Splits steps at clause connectors / subordinators, composes each segment
 * independently, and joins with the appropriate English conjunction.
 *
 * Purpose-style connectors (ke, koeʻuhi ke) produce infinitive "to [verb]".
 * Full-clause connectors (pea, ka, kae, kapau, lolotonga, he) compose the
 * sub-clause through the same composeTranslation dispatch.
 *
 * Returns null if the main clause can't compose (falls back to gloss).
 */
function composeMultiClauseTranslation(steps, isQuestion) {
  const CONNECTOR_IDS = [
    'clause_connector_ka', 'clause_connector_kae', 'clause_connector_pea',
    'subordinator_ke_purpose', 'subordinator_koeuhi_ke',
    'subordinator_kapau', 'subordinator_lolotonga',
    'clause_connector_he'
  ]

  const PURPOSE_CONNECTORS = new Set([
    'subordinator_ke_purpose', 'subordinator_koeuhi_ke'
  ])

  // Connector → { join: "English join text", purpose: bool }
  const CONNECTOR_CONFIG = {
    'clause_connector_ka':      { join: ', but ' },
    'clause_connector_kae':     { join: ', but ' },
    'clause_connector_pea':     { join: ' and ' },
    'subordinator_ke_purpose':  { join: ' to ' },
    'subordinator_koeuhi_ke':   { join: ' in order to ' },
    'subordinator_kapau':       { join: ' if ' },
    'subordinator_lolotonga':   { join: ' while ' },
    'clause_connector_he':      { join: ' because ' }
  }

  // Find indices of all connector steps
  const connectorIndices = []
  for (let i = 0; i < steps.length; i++) {
    if (CONNECTOR_IDS.includes(steps[i].nodeId)) {
      connectorIndices.push(i)
    }
  }
  if (connectorIndices.length === 0) return null

  // Main clause: everything before the first connector
  const mainSteps = steps.slice(0, connectorIndices[0])
  const mainClause = composeTranslation(mainSteps, false)
  if (!mainClause) return null

  let result = mainClause.replace(/[.?!]\s*$/, '')

  for (let i = 0; i < connectorIndices.length; i++) {
    const connectorStep = steps[connectorIndices[i]]
    const connectorId = connectorStep.nodeId
    const config = CONNECTOR_CONFIG[connectorId]

    const subStart = connectorIndices[i] + 1
    const subEnd = i + 1 < connectorIndices.length ? connectorIndices[i + 1] : steps.length
    let subSteps = steps.slice(subStart, subEnd)

    // Phase 2E.6: pea tense-drop shortcut — when the sub-clause after pea
    // has no tense_marker (the user took the pronoun path directly), infer
    // tense from the main clause by prepending the main clause's tense_marker
    // step so the standard compositional handler can conjugate correctly.
    if (connectorId === 'clause_connector_pea') {
      const hasTM = subSteps.some(s =>
        s.nodeId === 'tense_marker' || s.nodeId === 'tense_marker_loc'
      )
      if (!hasTM && subSteps.length > 0) {
        const mainTmStep = mainSteps.find(s =>
          s.nodeId === 'tense_marker' || s.nodeId === 'tense_marker_loc'
        )
        if (mainTmStep) {
          subSteps = [mainTmStep, ...subSteps]
        }
      }
    }

    if (PURPOSE_CONNECTORS.has(connectorId)) {
      // Purpose clause: "to [verb] [object] [extensions]"
      result += config.join + composePurposeClause(subSteps)
    } else {
      // Full clause: compose normally
      const subClause = composeTranslation(subSteps, false)
      if (subClause) {
        const stripped = subClause.replace(/[.?!]\s*$/, '')
        // Lowercase first char unless it's the pronoun "I"
        const lowered = /^I\b/.test(stripped) ? stripped : stripped.charAt(0).toLowerCase() + stripped.slice(1)
        result += config.join + lowered
      } else {
        // Fallback: word-list gloss for this sub-clause only
        const glossParts = subSteps
          .filter(s => s.word.english && s.word.english !== '(connector)' && s.word.english !== '(focus marker)')
          .map(s => s.word.english)
          .join(' ')
        result += config.join + glossParts
      }
    }
  }

  result += isQuestion ? '?' : '.'
  return result
}

/**
 * Compose a purpose sub-clause (bare verb + optional extensions).
 * Returns "verb [object] [prep phrase] [time]" without tense or subject.
 */
function composePurposeClause(subSteps) {
  const verbStep = subSteps.find(s => s.nodeId === 'verb' || s.nodeId === 'verb_tr')
  if (!verbStep) {
    return subSteps.map(s => s.word.english).join(' ')
  }
  const verb = findVerbForms(normalize(verbStep.word.tongan))
  const verbBase = verb ? verb.base : verbStep.word.english.split(',')[0].trim()

  const parts = [verbBase]

  const objStep = subSteps.find(s => s.nodeId === 'object')
  if (objStep) {
    parts.push(resolveObjectEnglish(subSteps, objStep))
  }

  const prepStep = subSteps.find(s => s.nodeId === 'preposition')
  const placeStep = subSteps.find(s => s.nodeId === 'prep_phrase')
  if (prepStep && placeStep) {
    parts.push(renderPrepPhraseEnglish(prepStep, placeStep))
  }

  const timeStep = subSteps.find(s => s.nodeId === 'time_word')
  if (timeStep) {
    parts.push(timeStep.word.english)
  }

  return parts.join(' ')
}

/**
 * Phase 2F.1: Compose the English relative clause from steps containing
 * relative_clause_tense. Returns a string like "he/she went to" or null.
 * The relative clause modifies the head noun in a ko identification sentence.
 */
function composeRelativeClause(steps) {
  const relTenseStep = steps.find(s => s.nodeId === 'relative_clause_tense')
  if (!relTenseStep) return null

  const tmKey = normalize(relTenseStep.word.tongan)
  const tenseFrame = findTenseFrame(tmKey)
  if (!tenseFrame) return null

  // Find pronoun and verb AFTER the relative_clause_tense step
  const relStartIdx = steps.indexOf(relTenseStep)
  const relSteps = steps.slice(relStartIdx)

  const pronStep = relSteps.find(s => s.nodeId === 'pronoun')
  if (!pronStep) return null
  const pronData = findPronounData(normalize(pronStep.word.tongan))
  if (!pronData) return null

  const verbStep = relSteps.find(s => s.nodeId === 'verb')
  if (!verbStep) return null
  const verb = findVerbForms(normalize(verbStep.word.tongan))
  if (!verb) return null

  const subject = pronData.subject
  const verbPhrase = conjugate(verb, tenseFrame.tense, pronData, false)

  // Determine trailing preposition from any preposition inside the rel clause
  const prepStep = relSteps.find(s => s.nodeId === 'preposition')
  let endingPrep = ''
  if (prepStep) {
    const family = prepStep.word.family
    if (family === 'i-family') endingPrep = ' in'
    else if (family === 'ki-family') endingPrep = ' to'
    else if (family === 'mei-family') endingPrep = ' from'
  }

  return `${subject} ${verbPhrase}${endingPrep}`
}

function composeExclamatoryTranslation(steps) {
  const head = steps.find(s =>
    s.nodeId === 'exclamatory_ko_ka_head' ||
    s.nodeId === 'exclamatory_me_a_head'
  )
  if (!head) return null
  return head.word.english
}

/**
 * Phase 2F.3: Compose auxiliary verb sentences (§27, Ch 21).
 * fie_aux: "ʻOku ou fie ako" → "I want to study."
 * lava_o_aux: "ʻOku ou lava ʻo ʻalu" → "I can go."
 * Handles all four tenses; question form via isQuestion.
 */
function composeAuxiliaryTranslation(steps, isQuestion) {
  const tmStep = steps.find(s => s.nodeId === 'tense_marker')
  const pronStep = steps.find(s => s.nodeId === 'pronoun')
  const verbStep = steps.find(s => s.nodeId === 'verb')
  const auxStep = steps.find(s => s.nodeId === 'fie_aux' || s.nodeId === 'lava_o_aux')
  if (!tmStep || !pronStep || !verbStep || !auxStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  if (!tenseFrame) return null
  const pronData = findPronounData(normalize(pronStep.word.tongan))
  if (!pronData) return null
  const verb = findVerbForms(normalize(verbStep.word.tongan))
  if (!verb) return null

  const subject = capitalize(pronData.subject)
  const verbBase = verb.base
  const is3sg = pronData.person === 3 && pronData.number === 'singular'
  const isLava = auxStep.nodeId === 'lava_o_aux'

  let sentence
  if (isLava) {
    // lava ʻo: can/be able to
    if (isQuestion) {
      switch (tenseFrame.tense) {
        case 'present': sentence = `Can ${subject.toLowerCase()} ${verbBase}?`; break
        case 'past': sentence = `Could ${subject.toLowerCase()} ${verbBase}?`; break
        case 'perfect': sentence = is3sg
          ? `Has ${subject.toLowerCase()} been able to ${verbBase}?`
          : `Have ${subject.toLowerCase()} been able to ${verbBase}?`; break
        case 'future': sentence = `Will ${subject.toLowerCase()} be able to ${verbBase}?`; break
        default: sentence = `Can ${subject.toLowerCase()} ${verbBase}?`
      }
    } else {
      switch (tenseFrame.tense) {
        case 'present': sentence = `${subject} can ${verbBase}.`; break
        case 'past': sentence = `${subject} could ${verbBase}.`; break
        case 'perfect': sentence = is3sg
          ? `${subject} has been able to ${verbBase}.`
          : `${subject} have been able to ${verbBase}.`; break
        case 'future': sentence = `${subject} will be able to ${verbBase}.`; break
        default: sentence = `${subject} can ${verbBase}.`
      }
    }
  } else {
    // fie: want to
    if (isQuestion) {
      switch (tenseFrame.tense) {
        case 'present': sentence = is3sg
          ? `Does ${subject.toLowerCase()} want to ${verbBase}?`
          : `Do ${subject.toLowerCase()} want to ${verbBase}?`; break
        case 'past': sentence = `Did ${subject.toLowerCase()} want to ${verbBase}?`; break
        case 'perfect': sentence = is3sg
          ? `Has ${subject.toLowerCase()} wanted to ${verbBase}?`
          : `Have ${subject.toLowerCase()} wanted to ${verbBase}?`; break
        case 'future': sentence = `Will ${subject.toLowerCase()} want to ${verbBase}?`; break
        default: sentence = `Do ${subject.toLowerCase()} want to ${verbBase}?`
      }
    } else {
      switch (tenseFrame.tense) {
        case 'present': sentence = is3sg
          ? `${subject} wants to ${verbBase}.`
          : `${subject} want to ${verbBase}.`; break
        case 'past': sentence = `${subject} wanted to ${verbBase}.`; break
        case 'perfect': sentence = is3sg
          ? `${subject} has wanted to ${verbBase}.`
          : `${subject} have wanted to ${verbBase}.`; break
        case 'future': sentence = `${subject} will want to ${verbBase}.`; break
        default: sentence = `${subject} want to ${verbBase}.`
      }
    }
  }

  return sentence
}

/**
 * Phase 2F.3: Compose personal count sentences (§26, Ch 20).
 * "ʻOku nau toko tolu" → "They are three (people)."
 * Uses copula verb (am/is/are/was/were) with tense awareness.
 */
function composePersonalCountTranslation(steps, isQuestion) {
  const tmStep = steps.find(s => s.nodeId === 'tense_marker')
  const pronStep = steps.find(s => s.nodeId === 'pronoun')
  const countStep = steps.find(s => s.nodeId === 'personal_count')
  if (!tmStep || !pronStep || !countStep) return null

  const tenseFrame = findTenseFrame(normalize(tmStep.word.tongan))
  if (!tenseFrame) return null
  const pronData = findPronounData(normalize(pronStep.word.tongan))
  if (!pronData) return null

  const subject = capitalize(pronData.subject)
  const count = countStep.word.english
  const is1sg = pronData.person === 1 && pronData.number === 'singular'
  const is3sg = pronData.person === 3 && pronData.number === 'singular'

  if (isQuestion) {
    switch (tenseFrame.tense) {
      case 'present':
        return `${is1sg ? 'Am' : is3sg ? 'Is' : 'Are'} ${subject.toLowerCase()} ${count}?`
      case 'past':
        return `${is1sg || is3sg ? 'Was' : 'Were'} ${subject.toLowerCase()} ${count}?`
      case 'perfect':
        return `${is3sg ? 'Has' : 'Have'} ${subject.toLowerCase()} been ${count}?`
      case 'future':
        return `Will ${subject.toLowerCase()} be ${count}?`
      default:
        return `Are ${subject.toLowerCase()} ${count}?`
    }
  }

  switch (tenseFrame.tense) {
    case 'present':
      return `${subject} ${is1sg ? 'am' : is3sg ? 'is' : 'are'} ${count}.`
    case 'past':
      return `${subject} ${is1sg || is3sg ? 'was' : 'were'} ${count}.`
    case 'perfect':
      return `${subject} ${is3sg ? 'has been' : 'have been'} ${count}.`
    case 'future':
      return `${subject} will be ${count}.`
    default:
      return `${subject} are ${count}.`
  }
}

/**
 * Phase 2F.2: Compose existential sentences (§32, Ch 31).
 * "ʻOku ʻi ai ha tangata" → "There is a man."
 * "Naʻe ʻikai ke ʻi ai ha meʻakai" → "There was no food."
 * Supports tense awareness (present/past/perfect/future), negation,
 * optional attributive adjective, preposition+prep_phrase, and time_word.
 */
function composeExistentialTranslation(steps, isQuestion) {
  const headStep = steps.find(s => s.nodeId === 'existential_head')
  const nounStep = steps.find(s => s.nodeId === 'existential_noun')
  if (!headStep || !nounStep) return null

  const tags = headStep.word.tags || []
  const isNegated = tags.includes('negated')
  const tense = tags.find(t => ['present', 'past', 'perfect', 'future'].includes(t)) || 'present'
  const noun = nounStep.word.english

  // Attributive adjective (postposed in Tongan → preposed in English)
  const adjStep = steps.find(s => s.nodeId === 'attributive_adjective')
  const adjEnglish = adjStep ? adjStep.word.english.split(',')[0].trim() : null
  const nounPhrase = adjEnglish ? `${adjEnglish} ${noun}` : noun

  let sentence
  if (isQuestion) {
    if (isNegated) {
      switch (tense) {
        case 'present': sentence = `Is there no ${nounPhrase}?`; break
        case 'past': sentence = `Was there no ${nounPhrase}?`; break
        case 'perfect': sentence = `Has there been no ${nounPhrase}?`; break
        case 'future': sentence = `Will there be no ${nounPhrase}?`; break
        default: sentence = `Is there no ${nounPhrase}?`
      }
    } else {
      switch (tense) {
        case 'present': sentence = `Is there a ${nounPhrase}?`; break
        case 'past': sentence = `Was there a ${nounPhrase}?`; break
        case 'perfect': sentence = `Has there been a ${nounPhrase}?`; break
        case 'future': sentence = `Will there be a ${nounPhrase}?`; break
        default: sentence = `Is there a ${nounPhrase}?`
      }
    }
  } else {
    if (isNegated) {
      switch (tense) {
        case 'present': sentence = `There is no ${nounPhrase}.`; break
        case 'past': sentence = `There was no ${nounPhrase}.`; break
        case 'perfect': sentence = `There has been no ${nounPhrase}.`; break
        case 'future': sentence = `There will be no ${nounPhrase}.`; break
        default: sentence = `There is no ${nounPhrase}.`
      }
    } else {
      switch (tense) {
        case 'present': sentence = `There is a ${nounPhrase}.`; break
        case 'past': sentence = `There was a ${nounPhrase}.`; break
        case 'perfect': sentence = `There has been a ${nounPhrase}.`; break
        case 'future': sentence = `There will be a ${nounPhrase}.`; break
        default: sentence = `There is a ${nounPhrase}.`
      }
    }
  }

  // Extensions: preposition+prep_phrase, companion, time_word
  sentence = insertAllPrepPhrases(sentence, steps)
  const companionSteps = steps.filter(s => s.nodeId === 'companion')
  if (companionSteps.length > 0) {
    const names = companionSteps.map(s => s.word.english)
    sentence = insertObject(sentence, `with ${names.join(' and ')}`)
  }
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  return sentence
}

/**
 * Phase 2F.2: Compose obligation/permission/optative sentences (§28/§34).
 * Handles four construction heads:
 *   totonu_phrase → "should [verb]" / "should have [past participle]"
 *   pau_phrase → "must [verb]"
 *   tuku_ke_phrase → "Let [subject] [verb]"
 *   ofa_ke_phrase → "May [subject] [verb]"
 * Optional obligation_pronoun provides the subject; verb is required.
 */
function composeObligationTranslation(steps, isQuestion) {
  const headStep = steps.find(s =>
    s.nodeId === 'totonu_phrase' || s.nodeId === 'pau_phrase' ||
    s.nodeId === 'tuku_ke_phrase' || s.nodeId === 'ofa_ke_phrase'
  )
  if (!headStep) return null

  const pronStep = steps.find(s => s.nodeId === 'obligation_pronoun')
  const verbStep = steps.find(s => s.nodeId === 'verb')
  if (!verbStep) return null

  const verb = findVerbForms(normalize(verbStep.word.tongan))
  const verbBase = verb ? verb.base : verbStep.word.english.split(',')[0].trim()
  const isAdj = verb && verb.type === 'adjective'

  // Subject for "should/must": a pronoun (obligation_pronoun, ke u -> "I"), or a
  // focus noun-subject (noun_subject_name, ʻa Sione -> "Sione"); "One" for the
  // subjectless frame ("ʻOku totonu ke ʻalu" = "one should go").
  const nounSubjStep = steps.find(s => s.nodeId === 'noun_subject_name')
  const cleanSubject = (st) =>
    capitalize((st.word.subject || st.word.english.replace(/\s*\([^)]*\)/g, '')).trim())
  const headSubject = pronStep ? cleanSubject(pronStep)
    : nounSubjStep ? cleanSubject(nounSubjStep)
    : 'One'

  let sentence

  if (headStep.nodeId === 'totonu_phrase') {
    const isPast = normalize(headStep.word.tongan).includes("na'e")
    const subject = headSubject

    if (isPast) {
      const pp = verb ? verb.past_participle : verbBase + 'ed'
      if (isAdj) {
        sentence = isQuestion
          ? `Should ${subject.toLowerCase()} have been ${verbBase}?`
          : `${subject} should have been ${verbBase}.`
      } else {
        sentence = isQuestion
          ? `Should ${subject.toLowerCase()} have ${pp}?`
          : `${subject} should have ${pp}.`
      }
    } else {
      if (isAdj) {
        sentence = isQuestion
          ? `Should ${subject.toLowerCase()} be ${verbBase}?`
          : `${subject} should be ${verbBase}.`
      } else {
        sentence = isQuestion
          ? `Should ${subject.toLowerCase()} ${verbBase}?`
          : `${subject} should ${verbBase}.`
      }
    }
  } else if (headStep.nodeId === 'pau_phrase') {
    const subject = headSubject
    if (isAdj) {
      sentence = isQuestion
        ? `Must ${subject.toLowerCase()} be ${verbBase}?`
        : `${subject} must be ${verbBase}.`
    } else {
      sentence = isQuestion
        ? `Must ${subject.toLowerCase()} ${verbBase}?`
        : `${subject} must ${verbBase}.`
    }
  } else if (headStep.nodeId === 'tuku_ke_phrase') {
    // "Let" takes objective case: "Let me study", not "Let I study". Second
    // person singular reads as a reflexive ("Let yourself stay" — the Ch 38
    // book gloss). A focus noun-subject (ʻa Sione) renders as the bare name
    // (proper names don't inflect for case).
    if (pronStep) {
      const subj = pronStep.word.subject || pronStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
      const objForm = (pronStep.word.person === 2 && pronStep.word.number === 'singular')
        ? 'yourself'
        : subjectToObjective(subj)
      sentence = isAdj
        ? `Let ${objForm} be ${verbBase}.`
        : `Let ${objForm} ${verbBase}.`
    } else if (nounSubjStep) {
      const name = cleanSubject(nounSubjStep)
      sentence = isAdj ? `Let ${name} be ${verbBase}.` : `Let ${name} ${verbBase}.`
    } else {
      sentence = isAdj ? `Let be ${verbBase}.` : `Let ${verbBase}.`
    }
  } else if (headStep.nodeId === 'ofa_ke_phrase') {
    if (pronStep) {
      const subject = pronStep.word.subject || pronStep.word.english.replace(/\s*\([^)]*\)/g, '').trim()
      // Lowercase mid-sentence, but never the first-person pronoun "I".
      const subjForm = subject === 'I' ? 'I' : subject.toLowerCase()
      sentence = isAdj
        ? `May ${subjForm} be ${verbBase}.`
        : `May ${subjForm} ${verbBase}.`
    } else if (nounSubjStep) {
      const name = cleanSubject(nounSubjStep)
      sentence = isAdj ? `May ${name} be ${verbBase}.` : `May ${name} ${verbBase}.`
    } else {
      sentence = isAdj ? `May be ${verbBase}.` : `May ${verbBase}.`
    }
  }

  if (!sentence) return null

  // Extensions: object, preposition+prep_phrase, time_word
  const objStep = steps.find(s => s.nodeId === 'object')
  if (objStep) {
    sentence = insertObject(sentence, resolveObjectEnglish(steps, objStep))
  }
  sentence = insertAllPrepPhrases(sentence, steps)
  const timeStep = steps.find(s => s.nodeId === 'time_word')
  if (timeStep) sentence = insertObject(sentence, timeStep.word.english)

  return sentence
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
