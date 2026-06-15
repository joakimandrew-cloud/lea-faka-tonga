/**
 * Tests for graph-walker's Free Build first-word exposure.
 *
 * Regression guard: `noun_subject`, `negation`, `negation_impersonal`, and
 * `experiencer` were previously hidden from Free Build so the user could only
 * build tense-marker + pronoun sentences. They should now be reachable so
 * Free Build can produce shapes like "ʻOku ʻita e tamasiʻi", "ʻOku ʻikai te u
 * fiekaia", "Naʻe ʻuha", and "Naʻe mahino kiate au".
 */
import { describe, it, expect } from 'vitest'
import {
  getFreeFirstWords,
  buildCandidates,
  advanceCandidates,
  createWalkerState,
  advanceInFrame,
  takeExtension,
  finishFrame,
  finishWalker,
  finishSentence,
  getExtensionMenu,
  getAvailableTerminators,
  getWalkerStatus,
  getFlatSteps,
  currentFrame,
  getCurrentFrameWords,
  getAvailableWords,
  renderPrepPhrase,
  renderNoun,
  setStepDefiniteness,
  getRenderedPath,
  renderTongan,
} from './graph-walker.js'
import { translate, translateWalkerState } from './translate.js'
import grammarGraph from '../data/grammar-graph.json'

describe('getFreeFirstWords', () => {
  const items = getFreeFirstWords(999)

  // Collect the set of entry point ids represented somewhere in the index.
  const epIds = new Set()
  for (const item of items) {
    for (const ep of item.entryPoints) epIds.add(ep.id)
  }

  it('exposes the negation entry point', () => {
    expect(epIds.has('negation')).toBe(true)
  })

  it('exposes the negation_impersonal entry point (weather verbs)', () => {
    expect(epIds.has('negation_impersonal')).toBe(true)
  })

  it('exposes the noun_subject entry point', () => {
    expect(epIds.has('noun_subject')).toBe(true)
  })

  it('exposes the experiencer entry point', () => {
    expect(epIds.has('experiencer')).toBe(true)
  })

  it('still hides imperative/hortative flows from the first-word picker', () => {
    expect(epIds.has('command')).toBe(false)
    expect(epIds.has('command_plural')).toBe(false)
    expect(epIds.has('suggestion')).toBe(false)
    expect(epIds.has('prohibition')).toBe(false)
  })

  it("merges multiple entry points under 'ʻOku'", () => {
    const oku = items.find(i => i.word.tongan === 'ʻOku')
    expect(oku).toBeDefined()
    const ids = new Set(oku.entryPoints.map(ep => ep.id))
    expect(ids.has('statement')).toBe(true)
    expect(ids.has('negation')).toBe(true)
    expect(ids.has('noun_subject')).toBe(true)
    expect(ids.has('experiencer')).toBe(true)
  })

  it("exposes 'Naʻe' as a first word (only reachable via non-statement flows)", () => {
    const nae = items.find(i => i.word.tongan === 'Naʻe')
    expect(nae).toBeDefined()
  })
})

describe('buildCandidates + advanceCandidates with new exposures', () => {
  it("advancing 'ʻOku' → 'ʻikai' keeps the negation candidate alive", () => {
    const items = getFreeFirstWords(999)
    const oku = items.find(i => i.word.tongan === 'ʻOku')
    const candidates = buildCandidates(oku, 999)
    // Each survived candidate's tense_marker variant should have advanced
    // automatically through its single required edge.
    const ikaiWord = { tongan: 'ʻikai' }
    const after = advanceCandidates(candidates, ikaiWord, 999)
    const surviving = new Set(after.map(c => c.entryPoint.id))
    expect(surviving.has('negation')).toBe(true)
  })
})

// ============================================================================
// Phase 2A.1 — Stack-based walker (extension menu return)
// ============================================================================
//
// These tests verify Cross-Cutting Rule 1 (Extensions do not consume each
// other) and the four scenarios called out in spec/Phase-2-Engine-Plan.md
// §2A.1 "Test cases to add". They drive the new stack walker API:
// createWalkerState / advanceInFrame / takeExtension / finishFrame /
// finishWalker / getExtensionMenu.

describe('stack walker — createWalkerState', () => {
  it('initializes a single root frame at the entry point start node', () => {
    const s = createWalkerState('statement', 999)
    expect(s.finished).toBe(false)
    expect(s.terminator).toBeNull()
    expect(s.frames).toHaveLength(1)
    const f = currentFrame(s)
    expect(f.entryPoint).toBe('statement')
    expect(f.startNodeId).toBe('tense_marker')
    expect(f.currentNodeId).toBe('tense_marker')
    expect(f.path).toEqual([])
    expect(f.extensionMenuAnchor).toBeNull()
    expect(f.extensionsTaken).toEqual([])
    expect(getWalkerStatus(s)).toBe('SELECTING')
  })

  it('throws on an unknown entry point', () => {
    expect(() => createWalkerState('not_a_real_entry_point', 999))
      .toThrow(/Unknown entry point/)
  })
})

describe('stack walker — advanceInFrame', () => {
  it("walks tense → pronoun → (branch) → verb and lands in IN_PROGRESS at 'verb'", () => {
    // The Ch 1–15 grammar's pronoun node is a branching node at chapter 999:
    // its `next` is [preposed_modifier (Ch 3+), verb (Ch 1+)] with neither
    // marked `required: true` and no FINISH option. The walker therefore
    // enters IN_PROGRESS after the pronoun is picked, and the user must
    // explicitly take the 'verb' branch via takeExtension. takeExtension
    // detects the no-FINISH (branching) shape and inline-transitions the
    // current frame instead of pushing a sub-frame.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(currentFrame(s).currentNodeId).toBe('pronoun')
    expect(currentFrame(s).extensionMenuAnchor).toBe('tense_marker')

    s = advanceInFrame(s, { tongan: 'ku' })
    // pronoun is branching at Ch 999 — frame is IN_PROGRESS with branch menu
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(currentFrame(s).currentNodeId).toBeNull()
    expect(currentFrame(s).extensionMenuAnchor).toBe('pronoun')

    // Inline branch transition — no new frame, no extensionsTaken update
    s = takeExtension(s, 'verb')
    expect(s.frames).toHaveLength(1)
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(currentFrame(s).currentNodeId).toBe('verb')
    expect(currentFrame(s).extensionsTaken).toEqual([])

    s = advanceInFrame(s, { tongan: 'kai' })
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(currentFrame(s).currentNodeId).toBeNull()
    expect(currentFrame(s).extensionMenuAnchor).toBe('verb')

    // Path captured each step in order
    expect(currentFrame(s).path.map(p => p.word.tongan))
      .toEqual(['Naʻa', 'ku', 'kai'])
  })

  it("rejects a word that isn't available at the current required slot", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    // 'ou' is the post-ʻOku pronoun form; it's not valid after Naʻa.
    expect(() => advanceInFrame(s, { tongan: 'ou' }))
      .toThrow(/not available/)
  })

  it('throws when called on a frame that is in IN_PROGRESS', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    // After 'ku' the pronoun frame is IN_PROGRESS (branching) with no
    // pending required slot — advanceInFrame should refuse.
    expect(() => advanceInFrame(s, { tongan: 'lelei' }))
      .toThrow(/No required slot pending/)
  })

  it('returns a NEW state object (immutability for React)', () => {
    const s0 = createWalkerState('statement', 999)
    const s1 = advanceInFrame(s0, { tongan: 'Naʻa' })
    expect(s1).not.toBe(s0)
    expect(s1.frames).not.toBe(s0.frames)
    expect(currentFrame(s1)).not.toBe(currentFrame(s0))
    // Original state untouched
    expect(currentFrame(s0).path).toEqual([])
    expect(currentFrame(s0).currentNodeId).toBe('tense_marker')
  })
})

describe('stack walker — Test 1: extension menu return (prep_phrase + time_word)', () => {
  // Spec §2A.1: "A statement walk where the user adds prep_phrase, returns
  // to the menu, adds time_word, returns, then FINISHes. Verify both
  // extensions appear in the final sentence. (Fixes bug 1 for Ch 1–15.)"
  //
  // Phase 2A.3 renamed `noun_phrase` → `prep_phrase` and added class-aware
  // auto-rendering of the preposition (Rule 3). The structural test still
  // drives the stack walker: the user takes one extension, finishes it,
  // takes another, and both end up in the final flat steps.

  it('takes preposition then time_word and FINISHes with both in the path', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb') // pronoun → verb branch (inline)
    s = advanceInFrame(s, { tongan: 'ʻalu' }) // motion verb, Ch 1
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')

    // Take the preposition extension — pushes a new frame
    s = takeExtension(s, 'preposition')
    expect(s.frames).toHaveLength(2)
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(currentFrame(s).currentNodeId).toBe('preposition')

    s = advanceInFrame(s, { tongan: 'ʻi' }) // 'in/at'
    expect(currentFrame(s).currentNodeId).toBe('prep_phrase')
    s = advanceInFrame(s, { tongan: 'kolo' }) // 'town'
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(currentFrame(s).extensionMenuAnchor).toBe('prep_phrase')

    // Finish the prep frame — pop and splice into the parent
    s = finishFrame(s)
    expect(s.frames).toHaveLength(1)
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    // Parent's extensionsTaken records 'preposition'
    expect(currentFrame(s).extensionsTaken).toContain('preposition')
    // Parent menu's anchor is still 'verb' — we've returned to the verb's menu
    expect(currentFrame(s).extensionMenuAnchor).toBe('verb')

    // Verb menu still offers other extensions (time_word among them)
    let menu = getExtensionMenu(s)
    const verbMenuIds = menu.extensions.map(e => e.node)
    expect(verbMenuIds).toContain('time_word')
    // The taken preposition is hidden
    expect(verbMenuIds).not.toContain('preposition')
    // Statement and question terminators are both offered
    const terminatorIds = menu.terminators.map(t => t.node)
    expect(terminatorIds).toContain('FINISH_STATEMENT')
    expect(terminatorIds).toContain('FINISH_QUESTION')

    // Take time_word — pushes a frame
    s = takeExtension(s, 'time_word')
    expect(s.frames).toHaveLength(2)
    s = advanceInFrame(s, { tongan: 'ʻaneafi' }) // 'yesterday' — past, valid for Naʻa
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    s = finishFrame(s)
    expect(s.frames).toHaveLength(1)

    // Both extensions are now recorded on the parent
    expect(currentFrame(s).extensionsTaken).toEqual(
      expect.arrayContaining(['preposition', 'time_word'])
    )

    // Finish the walker as a statement
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(getWalkerStatus(s)).toBe('FINISHED')
    expect(s.terminator).toBe('FINISH_STATEMENT')

    // Final flat steps contain BOTH extensions, in spliced order
    const flat = getFlatSteps(s)
    const tongansByNode = Object.fromEntries(flat.map(p => [p.nodeId, p.word.tongan]))
    expect(tongansByNode.tense_marker).toBe('Naʻa')
    expect(tongansByNode.pronoun).toBe('ku')
    expect(tongansByNode.verb).toBe('ʻalu')
    expect(tongansByNode.preposition).toBe('ʻi')
    expect(tongansByNode.prep_phrase).toBe('kolo')
    expect(tongansByNode.time_word).toBe('ʻaneafi')
    // The relative order: prep group comes before time_word (both spliced
    // in the order they were finished), and all sit after the verb.
    const order = flat.map(p => p.nodeId)
    expect(order.indexOf('verb')).toBeLessThan(order.indexOf('preposition'))
    expect(order.indexOf('prep_phrase')).toBeLessThan(order.indexOf('time_word'))
  })
})

describe('stack walker — Test 2: untaken extensions remain available', () => {
  // Spec §2A.1: "An extension menu with two extensions → take one → after
  // it completes, verify the other is still available."

  it('keeps untaken siblings in the menu after finishing one', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' }) // transitive verb

    const menuBefore = getExtensionMenu(s)
    const idsBefore = menuBefore.extensions.map(e => e.node)
    // The verb's extension menu should expose at least these two extensions
    // (chapter 999 unlocks all)
    expect(idsBefore).toEqual(expect.arrayContaining(['object', 'time_word', 'modifier']))

    // Take time_word and finish its sub-frame
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)

    const menuAfter = getExtensionMenu(s)
    const idsAfter = menuAfter.extensions.map(e => e.node)
    // time_word is gone (taken)
    expect(idsAfter).not.toContain('time_word')
    // The other extensions are still available
    expect(idsAfter).toContain('object')
    expect(idsAfter).toContain('modifier')
  })
})

describe('stack walker — Test 3: modifier self-loop respects count cap', () => {
  // Spec §2A.1: "Self-loop test: the modifier self-loop (max 2) still works
  // — after picking one modifier, the menu still shows modifier as an option
  // until the count hits the cap."

  it("allows a second modifier via self-loop, then hides it after the cap (max=2)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })

    // Step into a modifier sub-frame
    s = takeExtension(s, 'modifier')
    expect(s.frames).toHaveLength(2)
    s = advanceInFrame(s, { tongan: 'lelei' }) // 'well/truly'
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(currentFrame(s).extensionMenuAnchor).toBe('modifier')

    // After 1 modifier, the self-loop is still in the menu
    let menu = getExtensionMenu(s)
    let ids = menu.extensions.map(e => e.node)
    expect(ids).toContain('modifier')

    // Take the self-loop — does NOT push a new frame
    s = takeExtension(s, 'modifier')
    expect(s.frames).toHaveLength(2)
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(currentFrame(s).currentNodeId).toBe('modifier')

    s = advanceInFrame(s, { tongan: 'lahi' }) // 'a lot/very'
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')

    // Now the modifier count is 2 — the self-loop is blocked by modifier_count_max
    menu = getExtensionMenu(s)
    ids = menu.extensions.map(e => e.node)
    expect(ids).not.toContain('modifier')

    // Frame still has both terminators (and other extensions are still in scope)
    const tids = menu.terminators.map(t => t.node)
    expect(tids).toContain('FINISH_STATEMENT')
    expect(tids).toContain('FINISH_QUESTION')

    // The two modifier steps live in the modifier sub-frame's path
    expect(currentFrame(s).path.map(p => p.nodeId)).toEqual(['modifier', 'modifier'])
    expect(currentFrame(s).path.map(p => p.word.tongan)).toEqual(['lelei', 'lahi'])
  })
})

describe('stack walker — Test 4: nested sub-walks (foundation for multi-clause)', () => {
  // Spec §2A.1: "Nested extension test: a sub-walk inside a sub-walk.
  // (This is the foundation for §17 multi-clause support in 2A.5.)"

  it('supports a sub-walk inside a sub-walk and splices both back to the root', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    expect(s.frames).toHaveLength(1)

    // First-level sub-walk: object. `object` has non-finish extensions in
    // its own menu (modifier, time_word, preposition, ...) so it stays
    // open after the required slot is filled.
    s = takeExtension(s, 'object')
    expect(s.frames).toHaveLength(2)
    s = advanceInFrame(s, { tongan: 'ika' }) // 'fish' — valid for kai
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(currentFrame(s).extensionMenuAnchor).toBe('object')

    // Second-level sub-walk: take time_word from inside the object frame.
    // `time_word` is terminal (grammar-graph.json:277 — next has only
    // FINISH_STATEMENT / FINISH_QUESTION), so after the required slot is
    // filled with ʻaneafi, advanceInFrame's auto-pop collapses the
    // time_word sub-frame back into object in one step — the user never
    // has to click "Done with this part" for single-step terminal leaves.
    s = takeExtension(s, 'time_word')
    expect(s.frames).toHaveLength(3)
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(currentFrame(s).parentExtension).toBe('time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    // Auto-pop has already fired: we're back in the object frame.
    expect(s.frames).toHaveLength(2)
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(currentFrame(s).extensionMenuAnchor).toBe('object')
    // The object frame now contains both its own step AND the spliced time_word step
    const objectFramePath = currentFrame(s).path.map(p => p.nodeId)
    expect(objectFramePath).toEqual(['object', 'time_word'])
    // The object frame recorded 'time_word' in its extensionsTaken (both the
    // explicit takeExtension at the object level AND the auto-pop merge add
    // it; the merge dedupes).
    expect(currentFrame(s).extensionsTaken).toContain('time_word')

    // Pop the object frame back into the root
    s = finishFrame(s)
    expect(s.frames).toHaveLength(1)
    expect(currentFrame(s).extensionsTaken).toContain('object')
    // Propagated from the object frame during pop — root now knows time_word
    // was consumed somewhere deep in the walk, so it won't be re-offered.
    expect(currentFrame(s).extensionsTaken).toContain('time_word')

    // Root path now contains the entire nested chain in spliced order
    const rootPath = currentFrame(s).path.map(p => p.nodeId)
    expect(rootPath).toEqual([
      'tense_marker',
      'pronoun',
      'verb',
      'object',
      'time_word',
    ])

    // FINISH the walker as a statement
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(getWalkerStatus(s)).toBe('FINISHED')

    // getFlatSteps reflects the same root path
    const flatTongan = getFlatSteps(s).map(p => p.word.tongan)
    expect(flatTongan).toEqual(['Naʻa', 'ku', 'kai', 'ika', 'ʻaneafi'])
  })

  it('finishFrame at the root frame is a no-op (idempotent with auto-pop)', () => {
    // Callers that don't track depth can always call finishFrame after a
    // pick without worrying about whether the walker already auto-popped
    // to the root. The call returns the state unchanged rather than
    // throwing — use finishWalker to actually terminate the sentence.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    expect(s.frames).toHaveLength(1)
    const before = s
    s = finishFrame(s)
    expect(s).toBe(before)
    expect(s.frames).toHaveLength(1)
  })

  it('cannot finishWalker while a sub-frame still has a required slot pending', () => {
    // Auto-pop only collapses IN_PROGRESS frames that have no non-finish
    // extensions — it leaves SELECTING frames untouched (the user hasn't
    // filled the required slot yet). This case: after takeExtension('preposition')
    // the preposition frame is SELECTING for `ki`/`ʻi`/`mei`, so finishWalker
    // must refuse to terminate.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'preposition')
    expect(s.frames).toHaveLength(2)
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(() => finishWalker(s, 'FINISH_STATEMENT'))
      .toThrow(/collapse all sub-frames/)
  })

  it('cannot finishWalker while a required slot is pending', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    // Still SELECTING for pronoun
    expect(() => finishWalker(s, 'FINISH_STATEMENT'))
      .toThrow(/required slot still pending/)
  })
})

describe('stack walker — user-reported symptoms (regression guards)', () => {
  // These two tests lock in the behaviors the user reported as bugs so any
  // future regression surfaces immediately. The symptoms:
  //   (a) "options disappear" — after picking one extension, other extensions
  //       stop being offered. Rule 1 says every untaken extension stays in
  //       the menu until the user FINISHes.
  //   (b) "wrong-position postposed pronouns" — postposed pronouns were
  //       offered before a verb had been picked. Per spec §40 / the data in
  //       grammar-graph.json, postposed_pronoun is only ever reachable from
  //       verb-downstream nodes (verb, modifier, object) — never from
  //       tense_marker or pronoun. P1-B4 additionally gates it (no_complement_yet)
  //       so it is offered only while it still abuts the verb phrase (no
  //       object / locative / companion / time complement has intervened).

  it('symptom (a): the open content extensions (location, time, companion) coexist after a sibling is taken; the emphatic pronoun is placement-gated (P1-B4)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' }) // intransitive motion verb

    // Baseline at the verb anchor (no complement yet): the three open content
    // extensions AND the emphatic pronoun are all available. The emphatic
    // pronoun is offered here because it still abuts the verb phrase.
    const ids = () => getExtensionMenu(s).extensions.map(e => e.node)
    expect(ids()).toEqual(
      expect.arrayContaining(['preposition', 'time_word', 'mo_fixed', 'postposed_pronoun'])
    )

    // Add a location (preposition → prep_phrase). The other OPEN content
    // extensions survive (Rule 1) — but the emphatic pronoun is now gated off:
    // once a complement intervenes, `… au` would render in the wrong slot
    // (`… ki kolo au`), so postposed_pronoun is no longer offered (P1-B4).
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    expect(ids()).not.toContain('preposition')
    expect(ids()).toEqual(
      expect.arrayContaining(['time_word', 'mo_fixed'])
    )
    expect(ids()).not.toContain('postposed_pronoun') // P1-B4: gated by the locative
    // The gate is real: trying to take it now throws.
    expect(() => takeExtension(s, 'postposed_pronoun'))
      .toThrow(/not available in the current menu/)

    // Add a companion (mo + Sione). time_word still survives; the emphatic
    // pronoun stays gated.
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    expect(ids()).not.toContain('mo_fixed')
    expect(ids()).toEqual(
      expect.arrayContaining(['time_word'])
    )
    expect(ids()).not.toContain('postposed_pronoun')

    // Add time_word last (it's terminal — no more extensions from inside).
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)

    // Finish as statement. All four pieces present in the final flat steps.
    s = finishWalker(s, 'FINISH_STATEMENT')
    const nodeIds = getFlatSteps(s).map(p => p.nodeId)
    expect(nodeIds).toEqual([
      'tense_marker',
      'pronoun',
      'verb',
      'preposition',
      'prep_phrase',
      'mo_fixed',
      'companion',
      'time_word',
    ])
    const tongan = getRenderedPath(s).map(p => p.renderedTongan).join(' ')
    expect(tongan).toBe('Naʻa ku ʻalu ki kolo mo Sione ʻaneafi')
  })

  it('symptom (a), reversed order: open content extensions coexist when time/companion taken first; emphatic pronoun stays gated (P1-B4)', () => {
    // Same sentence shape, different user pick order — locks in that the
    // order of extension selection doesn't prune the OPEN content siblings,
    // and that the emphatic pronoun gate is order-independent (any complement
    // closes it).
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })

    const ids = () => getExtensionMenu(s).extensions.map(e => e.node)

    // Add companion first. location + time survive; the emphatic pronoun is
    // gated off (the companion is a complement → `mo Sione au` would leak).
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    expect(ids()).toEqual(
      expect.arrayContaining(['preposition', 'time_word'])
    )
    expect(ids()).not.toContain('postposed_pronoun') // P1-B4: gated by the companion

    // Add location second.
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    expect(ids()).toEqual(
      expect.arrayContaining(['time_word'])
    )
    expect(ids()).not.toContain('preposition')
    expect(ids()).not.toContain('mo_fixed')
    expect(ids()).not.toContain('postposed_pronoun')
  })

  it('symptom (b): postposed_pronoun is NOT offered before a verb has been picked', () => {
    let s = createWalkerState('statement', 999)
    // After tense_marker alone, frame is still SELECTING for pronoun —
    // there is no extension menu, and postposed_pronoun cannot be taken.
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    expect(getWalkerStatus(s)).toBe('SELECTING')
    expect(() => takeExtension(s, 'postposed_pronoun'))
      .toThrow(/required slot is pending|not available/)

    // After pronoun at Ch 999, the walker is in branching mode on the
    // pronoun node — pronoun.next exposes preposed_modifier, aspect_marker,
    // fie_aux, lava_o_aux, verb, personal_count. postposed_pronoun is NOT
    // among them. The IN_PROGRESS menu's extensions at this anchor likewise
    // never include postposed_pronoun.
    s = advanceInFrame(s, { tongan: 'ku' })
    const afterPronounIds = getExtensionMenu(s).extensions.map(e => e.node)
    expect(afterPronounIds).not.toContain('postposed_pronoun')
    expect(() => takeExtension(s, 'postposed_pronoun'))
      .toThrow(/not available in the current menu/)

    // After picking the verb, postposed_pronoun IS offered (Ch 5+).
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    const afterVerbIds = getExtensionMenu(s).extensions.map(e => e.node)
    expect(afterVerbIds).toContain('postposed_pronoun')
  })

  it('user follow-up: after Naʻa ku kai mā lahi ʻaneafi, user can still add extensions (auto-pop terminal time_word)', () => {
    // The user reported: "it's working better now... here is where it is
    // currently getting stuck (Naʻa ku kai mā lahi ʻaneafi) = (I ate a lot
    // of bread last night), I should be able to keep building". The root
    // cause was that picking a time_word pushed a sub-frame whose only
    // next edges were FINISH terminators, so the UI showed only "Done with
    // this part" and "." / "?" — the user couldn't add anything else
    // without understanding that "Done" pops the frame. advanceInFrame
    // now auto-pops terminal sub-frames, so after ʻaneafi the walker
    // returns to the first ancestor with extensions available (the
    // modifier frame here) and the user keeps building.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object')
    s = advanceInFrame(s, { tongan: 'mā' })
    s = takeExtension(s, 'modifier')
    s = advanceInFrame(s, { tongan: 'lahi' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })

    // After the advance, auto-pop collapses time_word (terminal) back to
    // the modifier frame. frames count drops from 4 to 3.
    expect(s.frames).toHaveLength(3)
    expect(currentFrame(s).extensionMenuAnchor).toBe('modifier')

    // The user is NOT stuck — they can add more to the sentence.
    const menu = getExtensionMenu(s)
    const extIds = menu.extensions.map(e => e.node)
    // Modifier frame offers: another modifier (self-loop), location,
    // companion. time_word is hidden (propagated to this frame's
    // extensionsTaken during the pop). The emphatic pronoun is NOT offered:
    // an object (mā) and a time word (ʻaneafi) have intervened, so P1-B4's
    // no_complement_yet gate has closed the emphatic slot (`… au` after the
    // object/time would render in the wrong place).
    expect(extIds).toContain('preposition')
    expect(extIds).toContain('mo_fixed')
    expect(extIds).not.toContain('postposed_pronoun') // P1-B4: gated by object + time
    expect(extIds).not.toContain('time_word')

    // FINISH terminators remain available — the user isn't forced to
    // keep building either.
    const terminatorIds = menu.terminators.map(t => t.node)
    expect(terminatorIds).toContain('FINISH_STATEMENT')
    expect(terminatorIds).toContain('FINISH_QUESTION')
  })

  it('clause connectors surface in sub-frame extension menus once the clause has a verb', () => {
    // The user asked for connectors to be available from any frame once
    // the clause has reached its verb, not just by manually popping back
    // to the verb's own menu. getExtensionMenu surfaces clause-connector
    // edges from the clause root's verb in every descendant frame's menu.
    let s = createWalkerState('statement', 26) // Ch 26 unlocks pea/ka/ke/he/koeʻuhi ke
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object')
    s = advanceInFrame(s, { tongan: 'mā' })

    // We're now in the object sub-frame. Its anchor is `object`, whose
    // `next` does NOT natively list pea/ka/ke/he. Before the connector
    // surfacing fix, those were only reachable by clicking "Done" to pop
    // back to the verb frame.
    expect(currentFrame(s).extensionMenuAnchor).toBe('object')
    const menu = getExtensionMenu(s)
    const extIds = menu.extensions.map(e => e.node)
    expect(extIds).toEqual(expect.arrayContaining([
      'clause_connector_pea',
      'clause_connector_ka',
      'clause_connector_he',
      'subordinator_ke_purpose',
      'subordinator_koeuhi_ke',
    ]))
  })

  it('takeExtension on a connector from a sub-frame auto-pops to the clause root before pushing', () => {
    // Semantically, pea/ka attach to the CLAUSE's verb — not to whatever
    // sub-phrase the user was in when they clicked the button. takeExtension
    // detects clause connectors and pops the stack down to the clause root
    // before creating the new sub-clause frame.
    let s = createWalkerState('statement', 26)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object')
    s = advanceInFrame(s, { tongan: 'mā' })
    // object sub-frame is on the stack. We're 2 frames deep.
    expect(s.frames).toHaveLength(2)

    // Take pea from the sub-frame.
    s = takeExtension(s, 'clause_connector_pea')

    // Expected: (1) the object frame was popped and spliced into root,
    // (2) the root frame's extensionsTaken records 'clause_connector_pea',
    // (3) a new pea sub-clause frame is pushed on top.
    expect(s.frames).toHaveLength(2)
    const rootFrame = s.frames[0]
    expect(rootFrame.extensionsTaken).toContain('object')
    expect(rootFrame.extensionsTaken).toContain('clause_connector_pea')
    // The new top frame is the pea sub-clause, with entryPoint from the
    // edge's child_entry_point.
    const peaFrame = currentFrame(s)
    expect(peaFrame.entryPoint).toBe('pea_second_clause')
    expect(peaFrame.parentExtension).toBe('clause_connector_pea')
  })

  it('articles are their own extension category — separate from the bare-noun object extension', () => {
    // The user asked for articles (ha, e) to be pickable on their own rather
    // than fused into pre-composed entries like "ha ika" / "e mā". After the
    // refactor, verb.next has TWO transitive-gated extensions:
    //   - `object` (bare, no article) — goes straight to bare nouns
    //   - `article` → `object` (ha/e, then noun) — article as its own step
    // This test locks in both the structure (separate extensions) and the
    // picker-surfacing (both groups appear in the extension menu after verb).
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' }) // transitive

    const menu = getExtensionMenu(s)
    const extIds = menu.extensions.map(e => e.node)
    expect(extIds).toContain('object')
    expect(extIds).toContain('article')

    // Taking the article path puts the user in SELECTING for the article
    // word. The article node only contains `ha` and `e` — bare nouns are
    // elsewhere, so they're not offered at this step.
    s = takeExtension(s, 'article')
    expect(getWalkerStatus(s)).toBe('SELECTING')
    const articleWords = getCurrentFrameWords(s).map(w => w.tongan)
    expect(articleWords.sort()).toEqual(['e', 'ha'])

    // After ha, the required next is `object` — bare nouns only.
    s = advanceInFrame(s, { tongan: 'ha' })
    expect(getWalkerStatus(s)).toBe('SELECTING')
    const nounWords = getCurrentFrameWords(s).map(w => w.tongan)
    expect(nounWords).toContain('ika')
    expect(nounWords).toContain('mā')
    expect(nounWords).not.toContain('ha ika') // pre-composed entries removed
    expect(nounWords).not.toContain('e mā')

    // Complete the sentence: "Naʻa ku kai ha ika."
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s) // object has extensions, so no auto-pop
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku kai ha ika')
    // English composition: "some" (from article_type:indefinite) + "fish"
    expect(translateWalkerState(s).text).toBe('I ate some fish.')
  })

  it('expanded object vocabulary: user sentence "ke fiemaʻu ha mālohi" (to want some strength)', () => {
    // The user originally wanted to build a purpose clause ending in "ha
    // mālohi" (some strength), but mālohi existed only as a modifier. The
    // expansion added 11 bare nouns to the object node (abstract: mālohi,
    // fiefia, ʻofa; concrete: fale, tohi, vaka, paʻanga, hele, kato, kofu,
    // tatā) with matching valid_combinations on maʻu/fiemaʻu/sio/fakatau
    // so the user's target sentence walks end-to-end. fiemaʻu (want/need,
    // Ch 3) is the verb here — the book doesn't introduce standalone maʻu
    // until Ch 41 (Chapter-41.md:183).
    let s = createWalkerState('statement', 26)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'preposed_modifier')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    s = advanceInFrame(s, { tongan: 'mohe' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = takeExtension(s, 'subordinator_ke_purpose')
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'mālohi' })
    s = finishFrame(s) // object has extensions, doesn't auto-pop
    s = finishFrame(s) // ke purpose sub-clause has allowed_terminators:[]
    s = finishWalker(s, 'FINISH_STATEMENT')

    expect(renderTongan(s)).toBe('Naʻa ku faʻa mohe ʻaneafi ʻi ʻapi ke fiemaʻu ha mālohi')
    expect(translateWalkerState(s).text).toContain('strength')
  })

  it('expanded object vocabulary: each new bare noun is valid for fiemaʻu (want/need)', () => {
    // `fiemaʻu` is the most permissive transitive verb available at Ch 3 —
    // you can want/need concrete OR abstract things. Locks in that every
    // new object entry is reachable through the article path after fiemaʻu.
    // (Previously this test used `maʻu`, but book Ch 41 is the earliest
    // attested use of standalone maʻu; fiemaʻu shares maʻu's full valid
    // combinations list at Ch 3, so it's the right permissive stand-in.)
    const NEW_NOUNS = [
      'mālohi', 'fiefia', 'ʻofa', 'fale', 'tohi',
      'vaka', 'paʻanga', 'hele', 'kato', 'kofu', 'tatā',
    ]
    for (const noun of NEW_NOUNS) {
      let s = createWalkerState('statement', 17)
      s = advanceInFrame(s, { tongan: 'Naʻa' })
      s = advanceInFrame(s, { tongan: 'ku' })
      s = takeExtension(s, 'verb')
      s = advanceInFrame(s, { tongan: 'fiemaʻu' })
      s = takeExtension(s, 'article')
      s = advanceInFrame(s, { tongan: 'ha' })
      // The noun must be available at this chapter for this verb. The
      // advanceInFrame throws if not — the test fails with a clear message.
      expect(
        () => advanceInFrame(s, { tongan: noun }),
        `"${noun}" should be valid after "fiemaʻu" + "ha"`
      ).not.toThrow()
    }
  })

  it("noun-subject 'a e rule: common-noun subject always renders as 'a e <noun>", () => {
    // User policy (memory): "always write 'a e; never drop 'a before definite
    // article e in proximative position." Noun-subject sentences (spec §14)
    // put a common noun after an intransitive verb, and the surface form
    // must always be `ʻa e <noun>` — the focus_marker node contributes `ʻa`
    // and the render pass prepends `e` to common-noun entries in
    // noun_subject_name (which are now stored bare).
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'tamasiʻi' }) // bare — no "e " prefix stored
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Surface form: `ʻa e tamasiʻi` — the e is added at render time, and ʻa
    // comes from the focus_marker step right before it.
    expect(renderTongan(s)).toBe('Naʻe ʻalu ʻa e tamasiʻi ki kolo')
    expect(translateWalkerState(s).text).toBe('The boy went to/toward town.')
  })

  it('noun-subject personal name: "a Sione" has no article (no "e")', () => {
    // Personal names are noun_class "personal" and skip the render-time
    // article prepend. Focus marker still attaches: `ʻa Sione`.
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻe ʻalu ʻa Sione ki kolo')
    // Negative check: no stray "e" between ʻa and Sione.
    expect(renderTongan(s)).not.toContain('ʻa e Sione')
  })

  it('noun_subject_name common-noun entries are stored bare (articles factored out)', () => {
    // Data guard: the four common-noun entries must be the bare noun,
    // NOT the pre-composed "e X" form. Render-time logic (getRenderedPath)
    // is responsible for the `e` prepend — if the data stored `e X` again,
    // rendering would emit `e e X` (double article).
    const words = grammarGraph.nodes.noun_subject_name.words
    const expected = ['tamasiʻi', 'fefine', 'tangata', 'faiako']
    for (const t of expected) {
      const entry = words.find(w => w.tongan === t)
      expect(entry, `"${t}" should exist bare in noun_subject_name`).toBeDefined()
      expect(entry.noun_class).toBe('common')
    }
    // And no entry should still have the "e " prefix on a common noun.
    for (const w of words) {
      if (w.noun_class !== 'common') continue
      expect(w.tongan, `common-noun entry "${w.tongan}" should not start with "e "`)
        .not.toMatch(/^e /)
    }
  })

  it("transitive 'a e rule: object_phrase + agent_phrase auto-render markers + articles", () => {
    // After the transitive refactor, object_phrase and agent_phrase entries
    // are stored bare. Render-time re-applies the absolutive marker `ʻa`
    // (object), ergative marker `ʻe` (agent), definite article `e` (object
    // common noun) / `he` (agent common noun, phonologically required after
    // `ʻe`), and the final-vowel definitive accent — enforcing the user's
    // "always write 'a e" policy structurally.
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' }) // bare — no "ʻa e" in data
    s = advanceInFrame(s, { tongan: 'Sione' }) // bare — no "ʻe" in data
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻe kai ʻa e ika ʻe Sione')
    expect(translateWalkerState(s).text).toBe('Sione ate the fish.')
  })

  it('transitive with common-noun agent: ʻOku inu ʻa e vai ʻe he tamasiʻi', () => {
    // Common-noun agent → `ʻe he <noun+accent>`. Locks in the `he` article
    // (NOT `e`) after the ergative marker ʻe — a phonological rule.
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'inu' })
    s = advanceInFrame(s, { tongan: 'vai' })
    s = advanceInFrame(s, { tongan: 'tamasiʻi' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku inu ʻa e vai ʻe he tamasiʻi')
    expect(translateWalkerState(s).text).toBe('The boy drinks the water.')
  })

  it('cleft common-noun subject: Ko + e + noun (render prepends article)', () => {
    // Cleft uses `Ko` (not the focus marker) as its preposed particle.
    // Common-noun cleft subjects still need the definite article `e` — the
    // render pass prepends it for subject_phrase common nouns the same way
    // it does for noun_subject_name.
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'tangata' }) // bare
    s = advanceInFrame(s, { tongan: 'naʻe' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toContain('Ko e tangat') // allow accent variant
    expect(translateWalkerState(s).text).toBe('It was the man who sang.')
  })

  it('data guard: object_phrase, agent_phrase, subject_phrase entries are stored bare', () => {
    // No pre-composed `ʻa e X`, `ʻe he X`, `ʻe <name>`, or `e X` entries
    // should remain in the data — all markers and articles must come from
    // the render-time pass. If this regresses, focus-marker + article would
    // double up (e.g., rendering `ʻa ʻa e ika`).
    const nodesToCheck = [
      { id: 'object_phrase', label: 'absolutive object' },
      { id: 'object_phrase_cleft', label: 'cleft absolutive object' },
      { id: 'agent_phrase', label: 'ergative agent' },
    ]
    for (const { id, label } of nodesToCheck) {
      const node = grammarGraph.nodes[id]
      expect(node, `${id} must exist`).toBeDefined()
      for (const w of node.words) {
        expect(w.tongan, `${label} "${w.tongan}" should not start with "ʻa"`).not.toMatch(/^ʻa /)
        expect(w.tongan, `${label} "${w.tongan}" should not start with "ʻe"`).not.toMatch(/^ʻe /)
      }
    }
    // subject_phrase: no entry should still carry the "e " prefix.
    for (const w of grammarGraph.nodes.subject_phrase.words) {
      if (w.noun_class !== 'common') continue
      expect(w.tongan, `subject_phrase "${w.tongan}" should not start with "e "`).not.toMatch(/^e /)
    }
  })

  it('connectors are NOT offered before the clause reaches a verb', () => {
    // The surfacing only fires once the clause root's path has a verb
    // step. Before the verb is picked there's nothing for the connector
    // to semantically attach to.
    let s = createWalkerState('statement', 26)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    // At pronoun's IN_PROGRESS state, no verb step in the path yet.
    const menu = getExtensionMenu(s)
    const extIds = menu.extensions.map(e => e.node)
    expect(extIds).not.toContain('clause_connector_pea')
    expect(extIds).not.toContain('clause_connector_ka')
    expect(extIds).not.toContain('subordinator_ke_purpose')
  })

  it('symptom (b), data guardrail: no pre-verb node lists postposed_pronoun as a next target', () => {
    // Structural assertion against grammar-graph.json: the only source nodes
    // that expose postposed_pronoun as a `next` target must be verb-downstream.
    // Any pre-verb node (tense_marker, pronoun, preposed_modifier, aux slots,
    // aspect_marker, or the noun-subject pre-verb slots) pointing at
    // postposed_pronoun would be a data bug.
    const preVerbNodes = [
      'tense_marker',
      'tense_marker_loc',
      'tense_marker_neg',
      'tense_marker_neg_imp',
      'tense_marker_ns',
      'tense_marker_neg_ns',
      'tense_marker_exp',
      'pronoun',
      'pronoun_loc',
      'preposed_modifier',
      'aspect_marker',
      'fie_aux',
      'lava_o_aux',
    ]
    for (const nodeId of preVerbNodes) {
      const node = grammarGraph.nodes[nodeId]
      if (!node) continue // node may not exist in all data slices
      const nextIds = (node.next || []).map(e => e.node)
      expect(nextIds, `pre-verb node "${nodeId}" should not point to postposed_pronoun`)
        .not.toContain('postposed_pronoun')
    }
  })
})

describe('stack walker — getCurrentFrameWords helper', () => {
  it('returns the available words for the current required slot', () => {
    const s = createWalkerState('statement', 999)
    const words = getCurrentFrameWords(s)
    // The tense_marker node has 4 base words (Naʻa, ʻOku, Kuo, Te)
    const tongans = words.map(w => w.tongan)
    expect(tongans).toEqual(expect.arrayContaining(['Naʻa', 'ʻOku', 'Kuo', 'Te']))
  })

  it('returns an empty list when the frame is in IN_PROGRESS', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    expect(getCurrentFrameWords(s)).toEqual([])
  })

  it('reflects depends_on filtering for the current frame', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    // Pronoun list is filtered by tense_marker — 'ou' (post-ʻOku form) should be excluded
    const tongans = getCurrentFrameWords(s).map(w => w.tongan)
    expect(tongans).toContain('ku')
    expect(tongans).not.toContain('ou')
  })
})

// ============================================================================
// Phase 2A.2 — FINISH split: FINISH_STATEMENT and FINISH_QUESTION
// ============================================================================
//
// Cross-Cutting Rule 2: every entry point declares which terminators it can
// finish with. The walker exposes them via getAvailableTerminators / the
// extension menu, and finishWalker(state, terminator) records the choice in
// state.translation.isQuestion so engine/translate.js can render the English
// inversion via its existing buildQuestion family. The Tongan word order does
// NOT change between statement and question forms — only the punctuation and
// the English translation do.

describe('2A.2 — FINISH split: statement vs question', () => {
  // Helper: walk Naʻa + ke + kai through to the IN_PROGRESS state at `verb`
  // (post-`kai`) so the frame is sitting at its extension menu with both
  // terminators offered.
  function walkNaakeKai() {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ke' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    return s
  }

  it('offers both terminators on a statement entry point at the verb anchor', () => {
    const s = walkNaakeKai()
    const ids = getAvailableTerminators(s)
    expect(ids).toContain('FINISH_STATEMENT')
    expect(ids).toContain('FINISH_QUESTION')
  })

  it("Naʻa ke kai + FINISH_STATEMENT → 'You ate.'", () => {
    let s = walkNaakeKai()
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.terminator).toBe('FINISH_STATEMENT')
    expect(s.translation.isQuestion).toBe(false)
    const out = translateWalkerState(s)
    expect(out.text).toBe('You ate.')
  })

  it("Naʻa ke kai + FINISH_QUESTION → 'Did you eat?'", () => {
    let s = walkNaakeKai()
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(s.terminator).toBe('FINISH_QUESTION')
    expect(s.translation.isQuestion).toBe(true)
    const out = translateWalkerState(s)
    expect(out.text).toBe('Did you eat?')
  })

  it('finishSentence is an alias for finishWalker that sets isQuestion', () => {
    let s = walkNaakeKai()
    s = finishSentence(s, 'FINISH_QUESTION')
    expect(s.terminator).toBe('FINISH_QUESTION')
    expect(s.translation.isQuestion).toBe(true)
  })

  it('rejects an unknown terminator id', () => {
    const s = walkNaakeKai()
    expect(() => finishWalker(s, 'FINISH'))
      .toThrow(/Unknown terminator/)
  })

  it('rejects a terminator that the entry point disallows', () => {
    // Build a command — its allowed_terminators is ['FINISH_STATEMENT'] only.
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    // Only FINISH_STATEMENT is offered for commands, even though FINISH_QUESTION
    // is a valid terminator id elsewhere.
    expect(() => finishWalker(s, 'FINISH_QUESTION'))
      .toThrow(/not available in current menu/)
  })

  it('command Kai! offers only FINISH_STATEMENT', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    const ids = getAvailableTerminators(s)
    expect(ids).toEqual(['FINISH_STATEMENT'])
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.translation.isQuestion).toBe(false)
    // The translator renders commands with `!` already.
    const out = translateWalkerState(s)
    expect(out.text).toBe('Eat!')
  })

  it('suggestion (Tau kai) offers only FINISH_STATEMENT, even via the shared verb node', () => {
    // Suggestion's path passes through the shared `verb` node, which lists
    // both terminators in the data. The walker must filter them down to the
    // entry point's allowed_terminators (['FINISH_STATEMENT']).
    let s = createWalkerState('suggestion', 999)
    s = advanceInFrame(s, { tongan: 'Tau' })
    s = advanceInFrame(s, { tongan: 'kai' })
    const ids = getAvailableTerminators(s)
    expect(ids).toEqual(['FINISH_STATEMENT'])
  })

  it('ko_question_what (Ko e hā ʻeni) offers only FINISH_QUESTION', () => {
    let s = createWalkerState('ko_question_what', 999)
    s = advanceInFrame(s, { tongan: 'Ko e hā' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    const ids = getAvailableTerminators(s)
    expect(ids).toEqual(['FINISH_QUESTION'])
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(s.translation.isQuestion).toBe(true)
    expect(translateWalkerState(s).text).toBe('What is this?')
  })

  it('ko_identification (Ko e tohi ʻeni) offers both terminators', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    const ids = getAvailableTerminators(s)
    expect(ids).toContain('FINISH_STATEMENT')
    expect(ids).toContain('FINISH_QUESTION')
  })
})

// ============================================================================
// Phase 2A.3 — Noun class auto-rendering (Cross-Cutting Rule 3)
// ============================================================================
//
// Rule 3: the preposition surface form is determined by the noun class of
// its complement. ki + local → ki, ki + personal → kia, ki + common → ki he,
// ki + pronoun → kiate. The walker never offers an ungrammatical pairing
// like `ki Sione` — `lea` has `complement_prep: "ki-family"` which forces
// the preposition to the ki-family, and `Sione` has `noun_class: "personal"`
// which renders the `ki` word as `kia`. The user's literal path still has
// `ki`; only the rendered Tongan string shows `kia`.

describe('2A.3 — renderPrepPhrase pure function', () => {
  const ki = {
    tongan: 'ki',
    family: 'ki-family',
    class_forms: { local: 'ki', personal: 'kia', common: 'ki he', pronoun: 'kiate' },
  }
  const iPrep = {
    tongan: 'ʻi',
    family: 'i-family',
    class_forms: { local: 'ʻi', personal: 'ʻia', common: 'ʻi he', pronoun: 'ʻiate' },
  }

  it('renders ki + local as ki', () => {
    expect(renderPrepPhrase(ki, { tongan: 'kolo', noun_class: 'local' })).toBe('ki')
  })
  it('renders ki + personal as kia', () => {
    expect(renderPrepPhrase(ki, { tongan: 'Sione', noun_class: 'personal' })).toBe('kia')
  })
  it('renders ki + common as ki he', () => {
    expect(renderPrepPhrase(ki, { tongan: 'fale', noun_class: 'common' })).toBe('ki he')
  })
  it('renders ki + pronoun as kiate', () => {
    expect(renderPrepPhrase(ki, { tongan: 'au', noun_class: 'pronoun' })).toBe('kiate')
  })
  it("renders 'i + pronoun as 'iate", () => {
    expect(renderPrepPhrase(iPrep, { tongan: 'au', noun_class: 'pronoun' })).toBe('ʻiate')
  })

  it('falls back to the base form when the complement has no noun_class', () => {
    expect(renderPrepPhrase(ki, { tongan: 'foo' })).toBe('ki')
  })
  it('falls back to the base form when the preposition has no class_forms', () => {
    expect(renderPrepPhrase({ tongan: 'mo' }, { tongan: 'Sione', noun_class: 'personal' }))
      .toBe('mo')
  })
})

describe('2A.3 — walker prep_phrase integration', () => {
  // Helper: walk Naʻa + ku + verb through to the IN_PROGRESS state after the
  // verb word has been picked. The caller then takes the `preposition`
  // extension and walks its sub-frame.
  function walkNaKuVerb(verbTongan) {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: verbTongan })
    return s
  }

  it("ʻalu + ki + kolo renders as 'Naʻa ku ʻalu ki kolo'", () => {
    let s = walkNaKuVerb('ʻalu')
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')

    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki kolo')

    // The canonical path still stores the user's literal picks
    const flat = getFlatSteps(s)
    const prepStep = flat.find(p => p.nodeId === 'preposition')
    expect(prepStep.word.tongan).toBe('ki')

    // The rendered path carries the class-aware surface form on the prep step
    const rendered = getRenderedPath(s)
    const renderedPrep = rendered.find(p => p.nodeId === 'preposition')
    expect(renderedPrep.renderedTongan).toBe('ki') // ki + local → ki
  })

  it("lea + ki + Sione renders as '... lea kia Sione' (ki + personal → kia)", () => {
    let s = walkNaKuVerb('lea')
    s = takeExtension(s, 'preposition')
    // Because `lea` has complement_prep: "ki-family", the preposition node
    // only offers ki — not ʻi or mei. This is the negative guarantee that
    // `lea ʻi Sione` / `lea mei Sione` can never be built.
    const prepWords = getAvailableWords('preposition', 999, getFlatSteps(s))
    expect(prepWords.map(w => w.tongan)).toEqual(['ki'])

    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')

    // The rendered Tongan flips `ki` to `kia` because Sione is personal.
    expect(renderTongan(s)).toBe('Naʻa ku lea kia Sione')

    // Canonical path is untouched — the user's literal pick stays as `ki`.
    const flat = getFlatSteps(s)
    expect(flat.find(p => p.nodeId === 'preposition').word.tongan).toBe('ki')
  })

  it("ʻalu + ki + fale renders as '... ʻalu ki he fale' (ki + common → ki he)", () => {
    let s = walkNaKuVerb('ʻalu')
    s = takeExtension(s, 'preposition')
    // ʻalu has no complement_prep — all three bases remain in the menu.
    const prepWords = getAvailableWords('preposition', 999, getFlatSteps(s))
    expect(prepWords.map(w => w.tongan)).toEqual(expect.arrayContaining(['ʻi', 'ki', 'mei']))

    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')

    // Definitive accent (falé) is 2A.4 territory — for 2A.3 we only check
    // that the preposition rendered as `ki he` (common-class form).
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki he fale')
  })

  it("ʻofa + ʻi + au renders as '... ʻofa ʻiate au' (ʻi + pronoun → ʻiate)", () => {
    let s = walkNaKuVerb('ʻofa')
    s = takeExtension(s, 'preposition')
    // ʻofa has complement_prep: "i-family" — preposition restricted to ʻi.
    const prepWords = getAvailableWords('preposition', 999, getFlatSteps(s))
    expect(prepWords.map(w => w.tongan)).toEqual(['ʻi'])

    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'au' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')

    expect(renderTongan(s)).toBe('Naʻa ku ʻofa ʻiate au')
  })

  // Phase 2 session audit 2026-04-11 — discovered that `ʻita` (be angry at)
  // was missing its complement_prep tag, meaning the walker would allow
  // users to build the ungrammatical `Naʻa ku ʻita ki Sione` because the
  // preposition node had no restriction to ʻi-family. Fix: added
  // complement_prep: "i-family" to the ʻita entry in grammar-graph.json.
  // This test is the regression guard.
  it("ʻita + ʻi + Sione renders as '... ʻita ʻia Sione' (ʻi + personal → ʻia)", () => {
    let s = walkNaKuVerb('ʻita')
    s = takeExtension(s, 'preposition')
    // After the 2026-04-11 fix, ʻita has complement_prep: "i-family".
    // The preposition node must now restrict to ʻi only — never ki or mei.
    const prepWords = getAvailableWords('preposition', 999, getFlatSteps(s))
    expect(prepWords.map(w => w.tongan)).toEqual(['ʻi'])

    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')

    // Rule 3 substitution: ʻi + personal → ʻia.
    expect(renderTongan(s)).toBe('Naʻa ku ʻita ʻia Sione')
    // Canonical path preserves the user's literal pick.
    const flat = getFlatSteps(s)
    expect(flat.find(p => p.nodeId === 'preposition').word.tongan).toBe('ʻi')
  })

  it("negative test: ki + Sione is impossible to construct after 'ʻita'", () => {
    // Regression guard for the audit finding: pre-fix, the walker allowed
    // the ungrammatical `ʻita ki Sione`. Post-fix, `ki` must be absent from
    // the preposition menu after ʻita.
    let s = walkNaKuVerb('ʻita')
    s = takeExtension(s, 'preposition')
    expect(() => advanceInFrame(s, { tongan: 'ki' }))
      .toThrow(/not available/)
    expect(() => advanceInFrame(s, { tongan: 'mei' }))
      .toThrow(/not available/)
  })

  it("negative test: ki + Sione is impossible to construct after 'lea'", () => {
    // `lea` restricts preposition to ki-family, so `ʻi` and `mei` are gone.
    // The walker also NEVER lets the user pick `ki` and then have the surface
    // form stay as `ki Sione` — the render step always rewrites to `kia`.
    let s = walkNaKuVerb('lea')
    s = takeExtension(s, 'preposition')
    expect(() => advanceInFrame(s, { tongan: 'ʻi' }))
      .toThrow(/not available/)
    expect(() => advanceInFrame(s, { tongan: 'mei' }))
      .toThrow(/not available/)

    // Even if we force ki + Sione through the legal path, the rendered
    // Tongan comes out as `kia Sione`, never `ki Sione`.
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toContain('kia Sione')
    expect(renderTongan(s)).not.toContain('ki Sione')
  })

  it("negative test: ki + au is impossible to construct after 'ʻofa'", () => {
    let s = walkNaKuVerb('ʻofa')
    s = takeExtension(s, 'preposition')
    // ʻofa forces i-family, so `ki` is not in the menu at all.
    expect(() => advanceInFrame(s, { tongan: 'ki' }))
      .toThrow(/not available/)
  })
})

// ============================================================================
// Phase 2A.5 — Ch 30 target sentence integration (slice)
// ============================================================================
//
// First integration test for the walker's multi-clause + cross-entry-point
// sub-frame mechanics. This is the "permanent regression guard" mandated by
// spec/Phase-2-Engine-Plan.md §2A.5 slice proposal — any future change
// to the walker, grammar-graph.json, or renderTongan that breaks the full
// Ch 30 target path fails this test.
//
// Asserts Tongan rendering verbatim. English translation is intentionally
// a word-by-word gloss for this slice (per the deviation notes in the slice
// proposal); a proper composeMultiClauseTranslation is a follow-up batch.

describe('2A.5 — Ch 30 target sentence walks end-to-end', () => {
  const TARGET =
    'Naʻa ku ʻalu ki kolo mo Sione ʻaneafi ke fakatau ha ika ka naʻe ʻikai te nau fiemaʻu ha ika'

  it('builds the full Ch 30 target sentence through the stack walker', () => {
    let s = createWalkerState('statement', 999)

    // ── Main clause: Naʻa ku ʻalu ──────────────────────────────────────
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb') // pronoun → verb branch (inline)
    s = advanceInFrame(s, { tongan: 'ʻalu' })

    // ki kolo
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)

    // mo Sione
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)

    // ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)

    // ── Purpose sub-clause: ke fakatau ha ika ──────────────────────────
    // Cross-entry-point child frame: child's entryPoint is
    // 'purpose_bare_verb' (declared by the verb.next edge's
    // `child_entry_point`), NOT 'statement' inherited from the parent.
    // allowed_terminators: [] blocks FINISH from the sub-walk — the only
    // way to exit is finishFrame (the "Done with this extension" button).
    s = takeExtension(s, 'subordinator_ke_purpose')
    expect(currentFrame(s).entryPoint).toBe('purpose_bare_verb')
    expect(getAvailableTerminators(s)).toEqual([]) // no FINISH inside a ke sub-walk
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'fakatau' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s) // pop the article sub-sub-frame back into the ke frame
    s = finishFrame(s) // pop the ke-purpose sub-frame back to root
    expect(currentFrame(s).entryPoint).toBe('statement') // back in the main clause

    // ── Contrast clause: ka naʻe ʻikai te nau fiemaʻu ha ika ──────────
    // Another cross-entry-point child frame: entryPoint = 'negation'
    // (declared by the verb.next edge's `child_entry_point`). The
    // clause_connector_ka node's required next is tense_marker_neg, so
    // after picking `ka` the walker automatically advances to the
    // negation tense marker slot.
    s = takeExtension(s, 'clause_connector_ka')
    expect(currentFrame(s).entryPoint).toBe('negation')
    s = advanceInFrame(s, { tongan: 'ka' })
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    // After `ʻikai`, `negation_word.next` has two non-required branches
    // (`neg_connector` → pronoun negation path, `neg_connector_ns` → noun-
    // subject negation path). The walker enters IN_PROGRESS and the caller
    // must explicitly pick which branch via takeExtension. For the target
    // sentence we want the pronoun path (`te u/ke/nau/...`).
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'nau' })
    // pronoun_neg now has aspect_marker + verb as sibling options (2F.3)
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s) // pop the article sub-sub-frame back into the negation frame
    s = finishFrame(s) // pop the negation sub-frame back to root

    // ── Finish ─────────────────────────────────────────────────────────
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(getWalkerStatus(s)).toBe('FINISHED')

    // Tongan rendering verbatim. `renderTongan` applies:
    //   - Rule 3: ki + kolo (local) → `ki` (no change)
    //   - Lowercase-after-connector: `Naʻe` → `naʻe` (after `ka`)
    // The result matches the Ch 30 target from spec §18 / §25 / the plan.
    expect(renderTongan(s)).toBe(TARGET)
  })
})

// ============================================================================
// Phase 2A.4 — Definitive accent rendering
// ============================================================================
//
// Spec §23: the definite form of a common noun shifts stress to the final
// vowel of the noun (group). Each common noun in grammar-graph.json carries a
// `definitive_accent_form` field (e.g. fale → falé, mā → maá) added by 2B.4.
// The walker's `setStepDefiniteness` marks a step as `definite`, and
// `getRenderedPath` substitutes the accent form at render time.
//
// Out-of-scope for this slice (deferred to follow-up sub-batches):
//   - indefinite article rendering (`ki ha fale`) — class_forms common form
//     stays as `ki he`, so indefinite renders as the semi-definite fallback
//   - multi-word noun phrase accent (`e fale ako fo'oú`) — needs attributive
//     adjective data from 2C.4
//   - cleft / relative-clause / opening-phrase accent — spec §46, deferred
//   - category_use: true article drop in English — flag tagged but unused
//   - UI picker in OpenBuilderSlot.jsx — tests drive setStepDefiniteness
//     programmatically; the UI exposure is a follow-up slice
//
// Regression guard: the existing `ki he fale` test at the 2A.3 describe
// block asserts the semi-definite default (no accent shift) so any future
// change that accidentally promotes every common noun to definite will fail.

describe('2A.4 — renderNoun helper', () => {
  it('returns base tongan when definiteness is undefined', () => {
    const fale = { tongan: 'fale', noun_class: 'common', definitive_accent_form: 'falé' }
    expect(renderNoun(fale, undefined)).toBe('fale')
  })

  it('returns base tongan when definiteness is semi_definite', () => {
    const fale = { tongan: 'fale', noun_class: 'common', definitive_accent_form: 'falé' }
    expect(renderNoun(fale, 'semi_definite')).toBe('fale')
  })

  it('returns base tongan even when definiteness is definite (accents suppressed)', () => {
    // Per user preference, the builder renders bare forms regardless of the
    // step's definiteness flag — the definitive accent is a pronunciation
    // aid and the focus is sentence construction, not phonetics. The
    // definitive_accent_form field remains on word entries as reference
    // data but no render path substitutes it.
    const fale = { tongan: 'fale', noun_class: 'common', definitive_accent_form: 'falé' }
    expect(renderNoun(fale, 'definite')).toBe('fale')
  })

  it('falls back to base tongan when the word lacks definitive_accent_form (e.g. personal name)', () => {
    const sione = { tongan: 'Sione', noun_class: 'personal' }
    expect(renderNoun(sione, 'definite')).toBe('Sione')
  })

  it('falls back to base tongan when called with a falsy word', () => {
    expect(renderNoun(null, 'definite')).toBe('')
    expect(renderNoun(undefined, undefined)).toBe('')
  })
})

describe('2A.4 — setStepDefiniteness + definite accent integration', () => {
  // Helper: walk Naʻa ku ʻalu + preposition + prep_phrase(fale) and finish.
  // The common-noun complement is positioned for the definite marker.
  function walkFaleSentence() {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    return s // still mid-frame (prep_phrase is in the current frame)
  }

  it("baseline (no definiteness set) renders 'Naʻa ku ʻalu ki he fale'", () => {
    // Regression guard: 2A.4 must not change the semi-definite default.
    let s = walkFaleSentence()
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki he fale')
  })

  it("prep_phrase common noun with definite marker renders 'Naʻa ku ʻalu ki he fale'", () => {
    let s = walkFaleSentence()
    // The fale step is the last step in the current (prep_phrase) sub-frame.
    // At this point the flat steps are: Naʻa, ku, ʻalu, ki, fale — index 4.
    const flat = getFlatSteps(s)
    const faleIdx = flat.findIndex(p => p.nodeId === 'prep_phrase' && p.word.tongan === 'fale')
    expect(faleIdx).toBe(4)
    s = setStepDefiniteness(s, faleIdx, 'definite')
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Preposition still rendered as `ki he` (common class_forms), noun
    // rendered with its definitive_accent_form: `falé`.
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki he fale')
  })

  it('long-vowel: object mā renders bare regardless of definiteness (accents suppressed)', () => {
    // Per user preference the builder never renders the definitive accent.
    // The `definitive_accent_form` (e.g. "maá") and `double_vowel_origin`
    // fields remain on word entries as reference data, but the render path
    // ignores them and always returns word.tongan.
    const ma = {
      tongan: 'mā',
      noun_class: 'common',
      definitive_accent_form: 'maá',
      double_vowel_origin: 'long_split',
    }
    expect(renderNoun(ma, 'definite')).toBe('mā')
    expect(renderNoun(ma, undefined)).toBe('mā')
  })

  it("setStepDefiniteness throws when marking a personal name definite", () => {
    // The walker should refuse to mark Sione as definite because personal
    // names have no definitive_accent_form to render. This is the guard
    // that keeps the UI from offering a meaningless option.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    const sioneIdx = getFlatSteps(s).findIndex(p => p.word.tongan === 'Sione')
    expect(() => setStepDefiniteness(s, sioneIdx, 'definite'))
      .toThrow(/not a common noun/)
  })

  it('setStepDefiniteness throws on an out-of-range index', () => {
    const s = createWalkerState('statement', 999)
    expect(() => setStepDefiniteness(s, 99, 'definite'))
      .toThrow(/out of range/)
  })

  it('setStepDefiniteness throws on an invalid level value', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    expect(() => setStepDefiniteness(s, 0, 'very_definite'))
      .toThrow(/Invalid definiteness level/)
  })

  it("article path renders correctly: Naʻa ku kai e talo (definite article + noun)", () => {
    // Replaces the previous "pre-composed object entries" regression guard.
    // After the article refactor, the user walks article → object as two
    // steps. The definite article `e` + the bare noun `talo` should produce
    // "e talo" in the rendered sentence. Definitive-accent upgrade (e talo
    // → e talō) remains a separate opt-in via setStepDefiniteness.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'e' })
    s = advanceInFrame(s, { tongan: 'talo' })
    // The object sub-frame has non-finish extensions (modifier, time_word,
    // preposition, ...), so auto-pop doesn't fire. Collapse it explicitly
    // before terminating.
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku kai e talo')
  })
})

// ============================================================================
// Docs.1 — Curriculum-closed scope soundness (positive + negative)
// ============================================================================
//
// These tests operationalize the "curriculum-closed constructive grammar"
// claim from spec/grammar-spec.md §"Scope, Sources, and Closure" (added in
// sub-batch Docs.1). They are the regression counterpart to the spec's scope
// declaration: positive tests prove that canonical textbook patterns walk
// cleanly end-to-end; negative tests prove that patterns the textbook does
// NOT teach are unreachable through the walker by construction.
//
// The motivating case for the negative suite is the user's own example
// sentence from the 2026-04-11 scope-confirmation conversation:
//   "Naʻa ku ʻita ʻaupito ʻia Tēvita ʻanepō ʻi kolo ʻaneafi"
// which has (a) two time modifiers (ʻanepō + ʻaneafi) and (b) a time word
// wedged mid-sentence before a prep phrase. Both are textbook violations
// (spec §1 line 375 and §28 line 3713 — time_word is a single terminal slot
// at the end of canonical slot order). See the deferred-review register in
// the spec's "Scope, Sources, and Closure" section for the textbook context
// on the two-time-modifier question — the answer is "textbook silent;
// time_word is terminal; engine blocks by construction."
//
// These tests pin the CURRENT behavior. If a future curriculum expansion
// changes the answer (e.g., Churchward turns out to explicitly sanction two
// time phrases in one clause), both the spec's deferred-review register and
// the negative tests below will need to move in lockstep.

describe('Docs.1 — curriculum-closed positive: canonical textbook patterns walk', () => {
  it("simplest statement end-to-end: Naʻa ku kai → 'I ate.'", () => {
    // Pins the Naʻa → ku branch translation end-to-end. The existing 2A.2
    // tests cover Naʻa + ke + kai (2sg) for the FINISH split; this is the
    // 1sg companion case and locks in the English rendering of `ku`.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(getWalkerStatus(s)).toBe('FINISHED')
    expect(renderTongan(s)).toBe('Naʻa ku kai')
    expect(translateWalkerState(s).text).toBe('I ate.')
  })

  it("statement + single modifier: Naʻa ku fiefia ʻaupito", () => {
    // Single-modifier walk ending in the always-last modifier ʻaupito.
    // Covers the modifier sub-frame finishFrame pop when only one step
    // is inside the sub-frame.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = takeExtension(s, 'modifier')
    s = advanceInFrame(s, { tongan: 'ʻaupito' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiefia ʻaupito')
  })

  it("statement + prep + time (two extensions in sequence): Naʻa ku ʻalu ki kolo ʻaneafi", () => {
    // Rule 1 canonical path — the verb's extension menu is used twice in
    // sequence. After finishFrame'ing the preposition sub-frame, time_word
    // remains available in the verb's menu (because Rule 1 returns to the
    // anchor's menu with the other extensions still visible). Covers the
    // core false-negative guard: a sentence with a location AND a time
    // word must be constructible without one of them hiding the other.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki kolo ʻaneafi')
  })

  it("canonical version of the user's motivating example: Naʻa ku ʻita ʻaupito ʻia Tēvita ʻaneafi", () => {
    // The textbook-sanctioned version of the user's original sentence
    // "Naʻa ku ʻita ʻaupito ʻia Tēvita ʻanepō ʻi kolo ʻaneafi":
    //   - one time word instead of two (ʻanepō + ʻaneafi → just ʻaneafi)
    //   - no separate `ʻi kolo` location — `ʻia Tēvita` is already the
    //     single preposition extension on this verb, taken for the
    //     complement of ʻita. A second `ʻi kolo` would require a second
    //     preposition which the walker blocks by default (extension taken)
    //   - the canonical slot order matches spec §1: modifier before
    //     preposition before time_word, all from the verb's extension menu
    //
    // This path exercises: (1) Rule 3 ki/kia auto-rendering via ʻita's
    // complement_prep: "i-family" + Tēvita's noun_class: "personal" →
    // surface form "ʻia Tēvita" at render time, (2) the always-last
    // ʻaupito modifier in a single-modifier context, (3) sequential
    // extension picks from the verb's menu (modifier → preposition →
    // time_word), and (4) the terminal time_word node as the tail.
    //
    // Closure on the 2026-04-11 scope conversation: this test proves the
    // user CAN build the core of their target sentence in a textbook-
    // faithful shape. The negative suite below covers why the ORIGINAL
    // (with two time words and a mid-sentence time phrase) can't walk.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻita' })
    s = takeExtension(s, 'modifier')
    s = advanceInFrame(s, { tongan: 'ʻaupito' })
    s = finishFrame(s)
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'Tēvita' })
    s = finishFrame(s)
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻita ʻaupito ʻia Tēvita ʻaneafi')
  })
})

describe('Docs.1 — curriculum-closed negative: textbook violations are unreachable', () => {
  // Helper: walk Naʻa → ku → verb(ʻalu) → takeExtension(time_word) →
  // advance(ʻaneafi). Leaves the walker IN_PROGRESS inside the time_word
  // sub-frame after the single time word has been picked. From this state
  // the user should have EXACTLY the two FINISH terminators available and
  // no further extensions — time_word is terminal by construction.
  function walkToFirstTimeWord() {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    return s
  }

  it("THE MOTIVATING CASE: after ʻaneafi, auto-pop returns to verb frame — no second time word", () => {
    // `time_word`'s `next` has only FINISH terminators (grammar-graph.json:277),
    // which used to strand the user in a sub-frame whose only options were
    // "Done with this part" / "." / "?". advanceInFrame now auto-pops that
    // terminal sub-frame back to the parent, and finishFrame propagates the
    // child's extensionsTaken into the parent — so the "no second time word"
    // rule is preserved via the propagated tag rather than the structural
    // sub-frame trap.
    const s = walkToFirstTimeWord()
    expect(getWalkerStatus(s)).toBe('IN_PROGRESS')
    expect(s.frames).toHaveLength(1)
    expect(currentFrame(s).extensionMenuAnchor).toBe('verb')
    const menu = getExtensionMenu(s)
    // time_word is hidden in the verb menu because the auto-pop merged it
    // into root.extensionsTaken. The second-time-word case remains blocked.
    const extIds = menu.extensions.map(e => e.node)
    expect(extIds).not.toContain('time_word')
    // Other extensions remain available — the user can keep building with
    // location, companion, connectors, etc. This is the intended UX win:
    // the user isn't forced to FINISH just because the terminal `time_word`
    // was picked. Canonical slot-order (time last) is a pedagogical target
    // the book teaches, not a hard engine rule.
    expect(extIds.length).toBeGreaterThan(0)
    const terminatorIds = menu.terminators.map(t => t.node)
    expect(terminatorIds).toContain('FINISH_STATEMENT')
    expect(terminatorIds).toContain('FINISH_QUESTION')
  })

  it("takeExtension(time_word) throws after the first time word is picked (no second time word)", () => {
    // Direct attempt to add a second time word. After the auto-pop + merge,
    // the root frame's extensionsTaken contains 'time_word', so the edge is
    // hidden from the extension menu and takeExtension rejects the request.
    // This is the exact negative counterpart to the user's two-time-modifier
    // sentence.
    const s = walkToFirstTimeWord()
    expect(() => takeExtension(s, 'time_word'))
      .toThrow(/not available in the current menu/)
  })

  // NOTE: the previous test "takeExtension(preposition) throws inside the
  // time_word sub-frame" was removed in the auto-pop refactor. It enforced
  // spec §28 canonical slot order (prep_phrase cannot follow time_word) by
  // exploiting the structural sub-frame trap — when the auto-pop collapsed
  // the terminal sub-frame so users could keep building, that structural
  // enforcement went with it. Canonical slot order is now a pedagogical
  // target the book teaches, not a hard engine rule; users CAN construct
  // "Naʻa ku ʻalu ʻaneafi ki kolo" which is non-canonical but understandable.
  // If strict slot-order needs to come back later, the right mechanism is
  // explicit edge conditions in grammar-graph.json, not stranding the user
  // in a leaf sub-frame.

  it("past time word ʻaneafi is not offered after future tense marker Te", () => {
    // time_word.constraints.depends_on filters the word list to match the
    // tense marker's past/future category (grammar-graph.json:215-225). Te
    // is future, so ʻapongipongi, ʻapō, ʻanai, and ʻaho ni are valid — but
    // NOT ʻaneafi, ʻanepō, or ʻanenai. The walker's depends_on filter in
    // getAvailableWords applies this as a hard gate at the word-picker
    // level before any slot-order considerations apply.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'time_word')
    const avail = getCurrentFrameWords(s).map(w => w.tongan)
    expect(avail).toContain('ʻapongipongi')
    expect(avail).toContain('ʻaho ni')
    expect(avail).not.toContain('ʻaneafi')
    expect(avail).not.toContain('ʻanepō')
    // Explicit advance to ʻaneafi throws.
    expect(() => advanceInFrame(s, { tongan: 'ʻaneafi' }))
      .toThrow(/not available/)
  })

  it("future time word ʻapongipongi is not offered after past tense marker Naʻa", () => {
    // Symmetric to the Te test: Naʻa is past, so ʻaneafi / ʻanepō /
    // ʻanenai / ʻaho ni are valid — but NOT the future ʻapongipongi /
    // ʻapō / ʻanai. Locks in the other direction of the depends_on
    // table so a future refactor can't accidentally collapse past and
    // future time words into a shared list.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'time_word')
    const avail = getCurrentFrameWords(s).map(w => w.tongan)
    expect(avail).toContain('ʻaneafi')
    expect(avail).toContain('ʻaho ni')
    expect(avail).not.toContain('ʻapongipongi')
    expect(avail).not.toContain('ʻapō')
    expect(() => advanceInFrame(s, { tongan: 'ʻapongipongi' }))
      .toThrow(/not available/)
  })
})

// ============================================================================
// Docs.4 — Spec-graph conformance: entry points, extensions, slot-order rules
// ============================================================================
//
// These tests operationalize the "Extension Cardinality & Slot Order Catalog"
// appendix in spec/grammar-spec.md (lines 9583–9650, added in Docs.3). The
// appendix is the expected-rows specification; this describe block is its
// executable counterpart, asserting that grammar-graph.json actually matches
// the catalog row-by-row and that spec-only / engine-deferred entries are
// correctly absent from the data.
//
// Three blocks:
//   1. Entry points (Rule 2 matrix, spec lines 151–164)
//   2. Extension catalog (Docs.3 main table, spec lines 9607–9621)
//   3. Slot-order rules (Docs.3 slot-order section, spec lines 9623–9637)
//
// The Docs.3 appendix says the catalog is frozen as of 2026-04-11 (end of the
// Docs.2 session) and must grow row-by-row as 2C.1+ extends grammar-graph.json
// from ~1175 toward ~15000 lines. Docs.4 is the guardrail that will catch
// drift during that expansion — every new entry point, node, or edge added to
// the data must be mirrored in a catalog row here (or tagged engine-deferred
// with a reason) before the row can claim to be spec-conformant.

const FINISH_NODE_IDS = ['FINISH_STATEMENT', 'FINISH_QUESTION', 'FINISH_EXCLAMATION']

describe('Docs.4 — spec-graph conformance: entry points (Rule 2 matrix)', () => {
  // One row per entry point declared in the Rule 2 terminator matrix
  // (grammar-spec.md lines 151–164). Three status values:
  //   - 'present' — must exist in grammar-graph.json with matching
  //     allowed_terminators
  //   - 'engine_deferred' — declared in the spec matrix but pending Phase 2C.1
  //     full; must be correctly absent from the data
  //   - 'spec_artifact' — declared in the spec matrix but identified as a spec
  //     artifact in the 2026-04-11 targeted audit (see Finding 5, Phase-2-
  //     Engine-Plan.md); must be correctly absent from the data
  const MATRIX_ENTRY_POINTS = [
    { id: 'statement', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§1' },
    { id: 'location_state', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§2' },
    { id: 'experiencer', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§15' },
    { id: 'negation', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§7–8' },
    { id: 'negation_impersonal', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§7–8' },
    { id: 'noun_subject', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§14' },
    { id: 'transitive_statement', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§16' },
    { id: 'ko_identification', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§9' },
    { id: 'cleft_emphatic', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§19' },
    { id: 'command', allowed: ['FINISH_STATEMENT'], status: 'present', section: '§3' },
    { id: 'command_plural', allowed: ['FINISH_STATEMENT'], status: 'present', section: '§4' },
    { id: 'prohibition', allowed: ['FINISH_STATEMENT'], status: 'present', section: '§6' },
    { id: 'suggestion', allowed: ['FINISH_STATEMENT'], status: 'present', section: '§5' },
    { id: 'verbal_question', allowed: ['FINISH_QUESTION'], status: 'spec_artifact', section: '§11', reason: 'Finding 5 (Phase-2-Engine-Plan 2026-04-11 audit): Tongan has no separate verbal_question entry point; yes/no questions are statement + FINISH_QUESTION. Spec matrix artifact, no data entry needed.' },
    { id: 'ko_question_what', allowed: ['FINISH_QUESTION'], status: 'present', section: '§11' },
    { id: 'ko_question_who', allowed: ['FINISH_QUESTION'], status: 'present', section: '§12' },
    { id: 'ko_question_where', allowed: ['FINISH_QUESTION'], status: 'present', section: '§13' },
    { id: 'ko_negation', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§10' },
    { id: 'ko_equational', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§21 (Ch 16, 2C.2)' },
    { id: 'obligation_should', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§28 Entry point 1 (Ch 23, 2C.3c)' },
    { id: 'obligation_must',   allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§28 Entry point 2 (Ch 23, 2C.3c)' },
    { id: 'existential',       allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§32 (Ch 31, 2C.4b)' },
    { id: 'have_construction',  allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§36 (Ch 29, 2C.5b)' },
    { id: 'permission_tuku_ke', allowed: ['FINISH_STATEMENT'], status: 'present', section: '§34 Entry point 1 (Ch 38, 2C.4d)' },
    { id: 'optative_ofa_ke',    allowed: ['FINISH_STATEMENT'], status: 'present', section: '§34 Entry point 2 (Ch 38, 2C.4d)' },
    { id: 'predicative_possessive', allowed: ['FINISH_STATEMENT', 'FINISH_QUESTION'], status: 'present', section: '§37 (Ch 37, 2C.5d)' },
    { id: 'exclamatory_ko_ka', allowed: ['FINISH_EXCLAMATION'], status: 'present', section: '§50 (Ch 52, 2C.7d)' },
    { id: 'exclamatory_me_a', allowed: ['FINISH_STATEMENT'], status: 'present', section: '§50 (Ch 52, 2C.7e)' },
  ]

  // Entry points internal to the engine that are NOT surfaced in the Rule 2
  // matrix — these are child frames pushed by cross-entry-point extensions.
  // Added during the 2A.5 / 2C.1 slice (Ch 30 target), spec §25.
  const INTERNAL_ENTRY_POINTS = [
    { id: 'purpose_bare_verb', allowed: [], section: '§25 (Ch 30 slice)', note: 'Internal child frame for subordinator_ke_purpose; not surfaced in Open Build category chooser' },
    { id: 'possessive_phrase', allowed: [], section: '§22 (2A.6 slice)', note: 'Internal child frame for the possessive_pronoun extension; sub-walk is possessive_pronoun → possessive_head_noun; never surfaced in Open Build category chooser' },
    { id: 'prep_with_possessive', allowed: [], section: '§22 + §36 (2A.6 follow-up)', note: 'Internal child frame for the preposition_possessive extension; sub-walk is preposition_possessive → possessive_pronoun → possessive_head_noun; render pass applies the §36 he reappearance rule' },
    { id: 'possessive_phrase_name', allowed: [], section: '§22 (2A.6 follow-up 2)', note: 'Internal child frame for the possessor_preposition extension on prep_phrase.next; sub-walk is possessor_preposition → possessor_name; render pass walks backwards to the nearest preceding step carrying possessive_class and substitutes ʻa / ʻo' },
    { id: 'pea_second_clause', allowed: [], section: '§17 (Ch 24, 2C.1 full)', note: 'Internal child frame for the clause_connector_pea extension on verb.next; sub-walk is clause_connector_pea → tense_marker → pronoun → verb; parallel to the 2A.5 clause_connector_ka / negation pattern but routes to a full-statement sub-walk' },
    { id: 'conditional_clause', allowed: [], section: '§18 (Ch 30, 2C.1 full)', note: 'Internal child frame for the subordinator_kapau extension on verb.next; full-statement dependent clause' },
    { id: 'temporal_clause', allowed: [], section: '§18 (Ch 30, 2C.1 full)', note: 'Internal child frame for the subordinator_lolotonga extension on verb.next; same shape as conditional_clause' },
    { id: 'reason_clause_he', allowed: [], section: '§25 (Ch 26, 2C.2)', note: 'Internal child frame for the clause_connector_he extension on verb.next / object.next / agent_phrase.next; sub-walk is clause_connector_he → tense_marker → pronoun → verb (full statement-shaped reason clause)' },
    { id: 'reason_clause_koeuhi_ke', allowed: [], section: '§25 (Ch 26, 2C.2)', note: 'Internal child frame for the subordinator_koeuhi_ke extension on verb.next; same bare-purpose-verb shape as purpose_bare_verb but with the emphatic koeʻuhi ke form' },
    { id: 'benefactive_name', allowed: [], section: '§25 (Ch 26, 2C.2)', note: 'Internal child frame for the benefactive_preposition_ma extension on verb.next / object.next / agent_phrase.next; sub-walk is benefactive_preposition_ma → possessor_name; render pass walks backwards to find the nearest preceding step carrying possessive_class and substitutes maʻa / moʻo' },
    { id: 'benefactive_pronoun', allowed: [], section: '§25 (Ch 26, 2C.2)', note: 'Internal child frame for the benefactive_pronoun_fused extension; sub-walk picks one fused form (maʻaku/moʻoku etc.); each entry stores both paradigm forms in possessive_forms, walker selects at render time' },
    { id: 'relative_clause', allowed: [], section: '§35 (Ch 39, 2C.4e-2 + 2C.4e-3)', note: 'Internal child frame for the relative clause extension on demonstrative.next; sub-walk is relative_clause_tense → pronoun → verb (+ extensions); render pass detects preposition family inside sub-walk and renders ai / ki ai / mei ai' },
    { id: 'serial_clause', allowed: [], section: '§17/§22 (Ch 24, P1-A3)', note: 'Internal child frame for the clause_connector_o serial linker on command_verb.next; sub-walk is clause_connector_o → verb (bare second verb). Book: Haʻu ʻo kai, ʻAlu ʻo ako' },
    { id: 'contrast_clause_kae', allowed: [], section: '§17 (Ch 24, P1-A3)', note: 'Internal child frame for the clause_connector_kae connector on noun_subject_name.next; sub-walk is clause_connector_kae → verb_ns → focus_marker → noun_subject_name (tense-dropped noun-subject clause). Book: Naʻe ʻalu ʻa Sione kae nofo ʻa Mele' },
  ]

  const dataById = Object.fromEntries(grammarGraph.entry_points.map(ep => [ep.id, ep]))

  MATRIX_ENTRY_POINTS.filter(r => r.status === 'present').forEach(row => {
    it(`entry point "${row.id}" (${row.section}) exists with allowed_terminators = [${row.allowed.join(', ')}]`, () => {
      const ep = dataById[row.id]
      expect(ep, `spec matrix declares "${row.id}" present, but it is missing from grammar-graph.json entry_points`).toBeDefined()
      expect(ep.allowed_terminators).toEqual(row.allowed)
    })
  })

  MATRIX_ENTRY_POINTS.filter(r => r.status === 'engine_deferred').forEach(row => {
    it(`entry point "${row.id}" (${row.section}) is engine-deferred: ${row.reason}`, () => {
      expect(dataById[row.id], `"${row.id}" is tagged engine-deferred in the Docs.4 catalog but has appeared in grammar-graph.json — either remove the data row or update the catalog status to "present"`).toBeUndefined()
    })
  })

  MATRIX_ENTRY_POINTS.filter(r => r.status === 'spec_artifact').forEach(row => {
    it(`entry point "${row.id}" (${row.section}) is a spec artifact: ${row.reason.slice(0, 90)}…`, () => {
      expect(dataById[row.id], `"${row.id}" is tagged spec-artifact; if a real entry point with this id is genuinely needed, update the Docs.4 catalog and Finding 5 before adding the data row`).toBeUndefined()
    })
  })

  INTERNAL_ENTRY_POINTS.forEach(row => {
    it(`internal entry point "${row.id}" (${row.section}) exists with allowed_terminators = [${row.allowed.join(', ')}]`, () => {
      const ep = dataById[row.id]
      expect(ep, `internal entry point "${row.id}" missing from grammar-graph.json`).toBeDefined()
      expect(ep.allowed_terminators).toEqual(row.allowed)
    })
  })

  it('no stray entry points: every id in grammar-graph.json is accounted for in the Docs.4 catalog', () => {
    const cataloged = new Set([
      ...MATRIX_ENTRY_POINTS.map(r => r.id),
      ...INTERNAL_ENTRY_POINTS.map(r => r.id),
    ])
    const dataIds = grammarGraph.entry_points.map(ep => ep.id)
    const stray = dataIds.filter(id => !cataloged.has(id))
    expect(
      stray,
      `grammar-graph.json declares entry points not in the Docs.4 catalog: ${JSON.stringify(stray)}. Add a catalog row (status: "present" or "internal") before merging the data change.`,
    ).toEqual([])
  })
})

describe('Docs.4 — spec-graph conformance: extension catalog (Docs.3 main table)', () => {
  // One row per extension in the Docs.3 main table (spec lines 9607–9621).
  //
  // Fields:
  //   name             — node id in grammar-graph.json
  //   primary_parent   — the bolded first name in the catalog "Reachable from"
  //                      column; the assertion that "edge parent → name exists"
  //                      is run against this parent only. Catalog lists more
  //                      parents for documentation but those are not asserted
  //                      individually to avoid coupling the test to every
  //                      re-entry edge the walker happens to expose.
  //   enforcement      — tagged union describing the cardinality mechanism per
  //                      the Docs.3 "Cardinality primitives" table:
  //                      - { kind: 'terminal' }: node.next is all FINISH_*
  //                      - { kind: 'semi_terminal', extra_allowed: [...] }:
  //                        node.next is FINISH_* + the declared extras
  //                      - { kind: 'self_loop_count_max', type, max }:
  //                        node.next contains a self-edge with the condition
  //                      - { kind: 'attach_edge_count_max', type, max }:
  //                        the primary_parent → name edge carries the condition
  //                      - { kind: 'required_next', target }: node.next has
  //                        exactly one edge with required: true to target
  //                      - { kind: 'default_taken' }: no structural assertion;
  //                        cardinality is enforced by getExtensionMenu's
  //                        extensionsTaken behavior (behavioral, not data)
  //   gate (optional)  — { type: 'verb_has_tag', tag } — asserted on the
  //                      primary_parent → name edge's condition
  //   spec_section     — documentation only
  //
  // The catalog row order mirrors Docs.3 main table for traceability.
  const EXTENSIONS = [
    {
      name: 'travel_compound',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      gate: { type: 'verb_has_tag', tag: 'motion' },
      spec_section: '§1',
    },
    {
      name: 'modifier',
      primary_parent: 'verb',
      enforcement: { kind: 'self_loop_count_max', type: 'modifier_count_max', max: 2 },
      spec_section: '§1, §14',
    },
    {
      name: 'object',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      gate: { type: 'verb_has_tag', tag: 'transitive' },
      spec_section: '§1, §3',
    },
    {
      name: 'time_word',
      primary_parent: 'verb',
      enforcement: { kind: 'terminal' },
      spec_section: '§1',
    },
    {
      name: 'preposition',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      spec_section: '§1, §2, §7, §14',
    },
    {
      name: 'question_word',
      primary_parent: 'verb',
      enforcement: { kind: 'terminal' },
      spec_section: '§1, §11',
    },
    {
      name: 'mo_fixed',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      spec_section: '§1 (Ch 10)',
    },
    {
      name: 'postposed_pronoun',
      primary_parent: 'verb',
      enforcement: { kind: 'semi_terminal', extra_allowed: ['time_word'] },
      spec_section: '§1',
    },
    {
      name: 'subordinator_ke_purpose',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      child_entry_point: 'purpose_bare_verb',
      spec_section: '§25 (Ch 26)',
    },
    {
      name: 'clause_connector_ka',
      primary_parent: 'verb',
      enforcement: { kind: 'attach_edge_count_max', type: 'clause_count_max', max: 2 },
      child_entry_point: 'negation',
      spec_section: '§17 (Ch 24)',
    },
    {
      name: 'possessive_pronoun',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      gate: { type: 'verb_has_tag', tag: 'transitive' },
      child_entry_point: 'possessive_phrase',
      spec_section: '§22 (Ch 17) — 2A.6 slice',
    },
    {
      name: 'preposition_possessive',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      child_entry_point: 'prep_with_possessive',
      spec_section: '§22 + §36 (Ch 17) — 2A.6 follow-up (article-drop / he-reappearance rule)',
    },
    {
      name: 'possessor_preposition',
      primary_parent: 'prep_phrase',
      enforcement: { kind: 'default_taken' },
      child_entry_point: 'possessive_phrase_name',
      spec_section: '§22 (Ch 17) — 2A.6 follow-up 2 (ʻa / ʻo + name)',
    },
    {
      name: 'preposed_modifier',
      primary_parent: 'pronoun',
      enforcement: { kind: 'required_next', target: 'verb' },
      spec_section: '§1',
    },
    {
      name: 'modifier_ns',
      primary_parent: 'verb_ns',
      enforcement: { kind: 'self_loop_count_max', type: 'modifier_count_max', max: 2 },
      spec_section: '§14',
    },
    {
      name: 'polite_particle',
      primary_parent: 'command_verb',
      enforcement: { kind: 'terminal' },
      spec_section: '§3, §4, §6',
    },
    {
      name: 'emphatic_pronoun',
      primary_parent: 'command_verb',
      enforcement: { kind: 'terminal' },
      spec_section: '§3',
    },
    {
      name: 'numeral',
      primary_parent: 'object',
      enforcement: { kind: 'terminal' },
      spec_section: '§26 (Ch 20) — 2C.3a (ʻe + cardinal numeral, compound entries)',
    },
    {
      name: 'personal_count',
      primary_parent: 'pronoun',
      enforcement: { kind: 'semi_terminal', extra_allowed: ['count_enclitic_pe', 'time_word'] },
      spec_section: '§26 (Ch 20) — 2C.3a (toko + cardinal numeral, compound entries); P1-A2 adds the enclitic pē + a trailing time word so the count predicate is no longer a branching-mode dead-end',
    },
    {
      name: 'count_enclitic_pe',
      primary_parent: 'personal_count',
      enforcement: { kind: 'terminal' },
      spec_section: '§26 (Ch 20) — P1-A2 (enclitic pē = only/just closing a personal-count predicate, ʻOku nau toko ono pē; terminal so pē + time word resolve at the personal_count anchor)',
    },
    {
      name: 'fie_aux',
      primary_parent: 'pronoun',
      enforcement: { kind: 'required_next', target: 'verb' },
      spec_section: '§27 Node 1 (Ch 21) — 2C.3b (fie = want to, simple pre-verb auxiliary, same shape as preposed_modifier)',
    },
    {
      name: 'lava_o_aux',
      primary_parent: 'pronoun',
      enforcement: { kind: 'required_next', target: 'verb' },
      spec_section: '§27 Node 2 (Ch 21) — 2C.3b (lava ʻo = be able to, compound word with the ʻo conjunction baked into the tongan field)',
    },
    {
      name: 'directional',
      primary_parent: 'verb',
      enforcement: { kind: 'default_taken' },
      spec_section: '§30 (Ch 28) — 2C.3e (post-verb directional particle slot; pick-time slot-order enforcement deferred)',
    },
    {
      name: 'comparative_ange',
      primary_parent: 'verb',
      enforcement: { kind: 'semi_terminal', extra_allowed: ['preposition', 'focus_marker'] },
      gate: { type: 'verb_has_tag', tag: 'adjective' },
      spec_section: '§31 (Ch 27) — 2C.4a (comparative ange after adjective; next = FINISH + optional preposition for the ʻi-than phrase + focus_marker for noun-subject path)',
    },
    {
      name: 'superlative_taha',
      primary_parent: 'verb',
      enforcement: { kind: 'semi_terminal', extra_allowed: ['focus_marker'] },
      gate: { type: 'verb_has_tag', tag: 'adjective' },
      spec_section: '§31 (Ch 27) — 2C.4a (superlative taha after adjective; next = FINISH + focus_marker for noun-subject path)',
    },
    {
      name: 'attributive_adjective',
      primary_parent: 'prep_phrase',
      enforcement: { kind: 'semi_terminal', extra_allowed: ['time_word'] },
      spec_section: '§33 (Ch 35) — 2C.4c (postposed attributive adjective slot on prep_phrase; next = FINISH + time_word)',
    },
    {
      name: 'attributive_adjective',
      primary_parent: 'existential_noun',
      enforcement: { kind: 'semi_terminal', extra_allowed: ['time_word'] },
      spec_section: '§33 (Ch 35) — 2C.4c (postposed attributive adjective slot on existential_noun; covers ʻOku ʻi ai ha vaka lahi)',
    },
    {
      name: 'relative_clause_tense',
      primary_parent: 'demonstrative',
      enforcement: { kind: 'default_taken' },
      child_entry_point: 'relative_clause',
      spec_section: '§35 (Ch 39) — 2C.4e-2 + 2C.4e-3 (relative clause extension on demonstrative; sub-walk is tense→pronoun→verb; render pass detects preposition family and renders ai / ki ai / mei ai)',
    },
    {
      name: 'pronominal_adjective',
      primary_parent: 'possessive_head_noun',
      enforcement: { kind: 'terminal' },
      spec_section: '§37 (Ch 37) — 2C.5e (pronominal adjective: preposed + postposed short form for emphasis; render pass auto-selects matching short form from postposed_possessive paradigm + applies definitive accent to head noun)',
    },
  ]

  function edgeFromParent(parentId, targetId) {
    const parent = grammarGraph.nodes[parentId]
    if (!parent || !parent.next) return null
    return parent.next.find(e => e.node === targetId) || null
  }

  EXTENSIONS.forEach(ext => {
    describe(`extension "${ext.name}" (${ext.spec_section})`, () => {
      it('node exists in grammar-graph.json', () => {
        expect(
          grammarGraph.nodes[ext.name],
          `Docs.4 catalog row "${ext.name}" points at a node that does not exist in grammar-graph.json.nodes`,
        ).toBeDefined()
      })

      it(`reachable from primary parent "${ext.primary_parent}"`, () => {
        const edge = edgeFromParent(ext.primary_parent, ext.name)
        expect(
          edge,
          `expected ${ext.primary_parent}.next to contain an edge → "${ext.name}" per Docs.3 catalog`,
        ).not.toBeNull()
      })

      if (ext.enforcement.kind === 'terminal') {
        it('enforcement: terminal — node.next contains only FINISH terminators', () => {
          const node = grammarGraph.nodes[ext.name]
          expect(node.next.length).toBeGreaterThan(0)
          const nonFinish = node.next.filter(e => !FINISH_NODE_IDS.includes(e.node))
          expect(
            nonFinish,
            `Docs.4 declares "${ext.name}" as terminal-node enforcement but its next contains non-FINISH edges: ${JSON.stringify(nonFinish.map(e => e.node))}. Terminal nodes must have FINISH-only next arrays per Docs.3 primitives table.`,
          ).toEqual([])
        })
      }

      if (ext.enforcement.kind === 'semi_terminal') {
        it(`enforcement: semi-terminal — node.next is FINISH + [${ext.enforcement.extra_allowed.join(', ')}] exactly`, () => {
          const node = grammarGraph.nodes[ext.name]
          const allowed = new Set([...FINISH_NODE_IDS, ...ext.enforcement.extra_allowed])
          const targets = node.next.map(e => e.node)
          const unexpected = targets.filter(t => !allowed.has(t))
          expect(
            unexpected,
            `"${ext.name}" semi-terminal catalog declares allowed next = ${[...allowed].join(', ')}; data has extras: ${JSON.stringify(unexpected)}`,
          ).toEqual([])
          for (const mustHave of ext.enforcement.extra_allowed) {
            expect(
              targets,
              `"${ext.name}" semi-terminal catalog declares "${mustHave}" as a non-FINISH next target but the data does not include it`,
            ).toContain(mustHave)
          }
        })
      }

      if (ext.enforcement.kind === 'self_loop_count_max') {
        it(`enforcement: self-loop with ${ext.enforcement.type}: ${ext.enforcement.max}`, () => {
          const node = grammarGraph.nodes[ext.name]
          const selfEdge = node.next.find(e => e.node === ext.name)
          expect(
            selfEdge,
            `"${ext.name}" self_loop_count_max catalog declares a self-edge but none exists in grammar-graph.json`,
          ).toBeDefined()
          // A condition may be a single object or an AND-composed array (P1-B4
          // follow-up #1 gates the modifier / modifier_ns self-loops with
          // no_emphatic_yet alongside their modifier_count_max cap). Find the
          // count condition either way.
          const selfCond = (Array.isArray(selfEdge.condition) ? selfEdge.condition : [selfEdge.condition])
            .find(c => c && c.type === ext.enforcement.type)
          expect(selfCond, `"${ext.name}" self-loop missing a ${ext.enforcement.type} condition`).toBeDefined()
          expect(selfCond.max).toBe(ext.enforcement.max)
        })
      }

      if (ext.enforcement.kind === 'attach_edge_count_max') {
        it(`enforcement: attach-edge with ${ext.enforcement.type}: ${ext.enforcement.max} on ${ext.primary_parent}→${ext.name}`, () => {
          const edge = edgeFromParent(ext.primary_parent, ext.name)
          expect(edge).not.toBeNull()
          expect(edge.condition?.type).toBe(ext.enforcement.type)
          expect(edge.condition?.max).toBe(ext.enforcement.max)
        })
      }

      if (ext.enforcement.kind === 'required_next') {
        it(`enforcement: required_next — ${ext.name}.next has exactly one required edge → "${ext.enforcement.target}"`, () => {
          const node = grammarGraph.nodes[ext.name]
          const requiredEdges = (node.next || []).filter(e => e.required === true)
          expect(
            requiredEdges.length,
            `"${ext.name}" required_next catalog expects exactly one required edge; data has ${requiredEdges.length}`,
          ).toBe(1)
          expect(requiredEdges[0].node).toBe(ext.enforcement.target)
        })
      }

      if (ext.enforcement.kind === 'default_taken') {
        it('enforcement: default_taken (behavioral — no structural assertion; see getExtensionMenu)', () => {
          // Default-taken cardinality is enforced by graph-walker.js
          // getExtensionMenu reading currentFrame.extensionsTaken. The
          // structural data has no marker for it. This test is a catalog
          // placeholder so the row shows up as green in the Docs.4 suite
          // and so a grep for `default_taken` finds all the rows that rely
          // on the walker's menu-filter behavior — the choke point called
          // out in the Docs.3 "Notes on data-vs-default enforcement" section.
          // If a future refactor changes getExtensionMenu's cardinality
          // semantics, the walker tests (not this conformance test) will
          // catch it; this assertion just verifies the node is reachable.
          const edge = edgeFromParent(ext.primary_parent, ext.name)
          expect(edge).not.toBeNull()
        })
      }

      if (ext.gate) {
        it(`gate: ${ext.primary_parent}→${ext.name} edge has condition ${ext.gate.type}:${ext.gate.tag}`, () => {
          const edge = edgeFromParent(ext.primary_parent, ext.name)
          expect(edge).not.toBeNull()
          // The gate may be AND-composed in an array (P1-B4 follow-up #1 adds
          // no_emphatic_yet to the comparative_ange / superlative_taha edges
          // alongside their verb_has_tag adjective gate). Find the gate either way.
          const gateCond = (Array.isArray(edge.condition) ? edge.condition : [edge.condition])
            .find(c => c && c.type === ext.gate.type)
          expect(gateCond, `"${ext.primary_parent}→${ext.name}" missing a ${ext.gate.type} gate condition`).toBeDefined()
          expect(gateCond.tag).toBe(ext.gate.tag)
        })
      }

      if (ext.child_entry_point) {
        it(`cross-entry-point: ${ext.primary_parent}→${ext.name} edge declares child_entry_point = "${ext.child_entry_point}"`, () => {
          const edge = edgeFromParent(ext.primary_parent, ext.name)
          expect(edge).not.toBeNull()
          expect(edge.child_entry_point).toBe(ext.child_entry_point)
        })
      }
    })
  })
})

describe('Docs.4 — spec-graph conformance: slot-order rules (Docs.3 slot-order section)', () => {
  // Rules from grammar-spec.md lines 9623–9637. Rules 1–3 are currently
  // enforceable; Rules 4–5 are spec-only / engine-deferred and land with
  // 2C.1 full; Rule 6 is partially enforceable at the data-declaration
  // level (child_entry_point fields).

  it('Rule 1 (terminal slots end the sentence): time_word / question_word / polite_particle / emphatic_pronoun have FINISH-only next', () => {
    const terminals = ['time_word', 'question_word', 'polite_particle', 'emphatic_pronoun']
    for (const nodeId of terminals) {
      const node = grammarGraph.nodes[nodeId]
      expect(node, `terminal slot "${nodeId}" missing from grammar-graph.json`).toBeDefined()
      const nonFinish = node.next.filter(e => !FINISH_NODE_IDS.includes(e.node))
      expect(
        nonFinish,
        `Rule 1 violation: "${nodeId}" has non-FINISH next edges ${JSON.stringify(nonFinish.map(e => e.node))}`,
      ).toEqual([])
    }
  })

  it('Rule 2 (ʻaupito always-last modifier): ʻaupito word entry in modifier node carries position_rule = "always_last_modifier"', () => {
    // Docs.3 Slot Order Rule 2 documents this as NOT YET enforced at pick
    // time (the renderer reorders at display time instead). The data
    // marker position_rule lives on the word entry. This conformance test
    // locks the marker in place so a future pick-time guard slice has
    // something to flip on.
    const modifierNode = grammarGraph.nodes.modifier
    expect(modifierNode).toBeDefined()
    const aupito = (modifierNode.words || []).find(w => w.tongan === 'ʻaupito')
    expect(aupito, 'ʻaupito word entry missing from modifier node').toBeDefined()
    expect(aupito.position_rule).toBe('always_last_modifier')
  })

  it('Rule 3 (semi-terminal postposed_pronoun): next is exactly FINISH_STATEMENT + FINISH_QUESTION + time_word', () => {
    const node = grammarGraph.nodes.postposed_pronoun
    expect(node).toBeDefined()
    const targets = node.next.map(e => e.node).sort()
    expect(targets).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT', 'time_word'])
  })

  it('Rule 4 (§16 transitive linear chain): transitive_statement present, object_phrase and agent_phrase both defined; swap action still deferred', () => {
    // 2C.1 full lands the §16 transitive linear chain: tense_marker_tr →
    // verb_tr → object_phrase → agent_phrase → FINISH + extensions. The
    // spec's optional swap action (flexible word order after both slots
    // are filled) is still deferred — spec §16 calls it out as a
    // sub-pattern and the current walker offers a single linear order.
    const ep = grammarGraph.entry_points.find(ep => ep.id === 'transitive_statement')
    expect(ep).toBeDefined()
    expect(grammarGraph.nodes.object_phrase).toBeDefined()
    expect(grammarGraph.nodes.agent_phrase).toBeDefined()
    // object_phrase's sole required next is agent_phrase (linear chain).
    const objRequired = (grammarGraph.nodes.object_phrase.next || []).filter(e => e.required === true)
    expect(objRequired.length).toBe(1)
    expect(objRequired[0].node).toBe('agent_phrase')
  })

  it('Rule 5 (§30 directional slot immediately after verb): directional node present and wired on verb.next; pick-time slot-order enforcement still engine-deferred', () => {
    // Flipped from placeholder by 2C.3e (2026-04-12). The directional
    // node now exists with the 6 words from spec §30 line 3660 (mai /
    // atu / ange / hake / hifo / holo) and verb.next has an edge to
    // it. The spec §30 line 3713 slot-order rule ("TM + (pronoun) +
    // verb + directional + (object) + (prep_phrase) + (time_word)")
    // specifies that directional precedes object / prep_phrase /
    // time_word. That ordering is NOT enforced at pick time — the
    // walker's extensionsTaken mechanism treats post-verb extensions
    // as unordered siblings, so a user could pick `object` before
    // `directional` and produce a wrong-order sentence. Rule 5
    // pick-time enforcement is a separate walker-behavior slice and
    // remains engine-deferred; the directional node's description
    // field documents this deferral. (Earlier placeholder mis-cited
    // the section as §28 — it is §30, confirmed when 2C.3c's
    // obligation slice landed.)
    const directional = grammarGraph.nodes.directional
    expect(directional, 'directional node must exist after 2C.3e').toBeDefined()
    const verbNext = (grammarGraph.nodes.verb?.next || []).map(e => e.node)
    expect(verbNext).toContain('directional')
    // Spec §30 line 3660 lists 6 directionals; all must be present
    // as words on the directional node.
    const tongans = (directional.words || []).map(w => w.tongan).sort()
    expect(tongans).toEqual(['ange', 'atu', 'hake', 'hifo', 'holo', 'mai'])
  })

  it('Rule 6 (cross-entry-point child frames): subordinator_ke_purpose and clause_connector_ka edges carry child_entry_point', () => {
    const verbEdges = grammarGraph.nodes.verb?.next || []
    const keEdge = verbEdges.find(e => e.node === 'subordinator_ke_purpose')
    const kaEdge = verbEdges.find(e => e.node === 'clause_connector_ka')
    expect(keEdge, 'verb.next missing subordinator_ke_purpose edge').toBeDefined()
    expect(kaEdge, 'verb.next missing clause_connector_ka edge').toBeDefined()
    expect(keEdge.child_entry_point).toBe('purpose_bare_verb')
    expect(kaEdge.child_entry_point).toBeDefined()
    // clause_count_max: 2 on the ka edge is asserted in the extension
    // catalog above; this test's job is just to confirm the child-frame
    // declaration shape matches the spec §2A.5 slice.
  })
})

// ============================================================================
// Phase 2A.6 — Possessive paradigm auto-selection (slice)
// ============================================================================
//
// Spec §22: Tongan has two complete possessive pronoun paradigms — the
// ʻe-class (`ʻeku / hoʻo / ʻene / ʻetau / ...`) and the ho-class (`hoku /
// ho / hono / hotau / ...`). The head noun's `possessive_class` determines
// which paradigm the walker renders. The user never picks "e-class or
// ho-class" — they pick a person/number slot (e.g. "my 1sg") and the noun,
// and rendering substitutes the matching form.
//
// Shipped in this slice (§22 core only):
//   - possessive_phrase entry point (internal, allowed_terminators: [])
//   - possessive_pronoun node (11 person/number entries with possessive_forms)
//   - possessive_head_noun node (12 common nouns tagged e_class or ho_class)
//   - verb.next → possessive_pronoun edge (transitive gate, child frame)
//   - getRenderedPath substitution pass for adjacent possessive_pronoun +
//     possessive_head_noun step pairs
//
// Deliberately deferred (documented in Phase-2-Engine-Plan.md slice notes):
//   - article-drop rule (`ki hoku fale` / `ki heʻeku tohi`) — the possessive
//     phrase currently attaches directly to the verb, parallel to `object`,
//     not nested inside a preposition. A follow-up slice will add the
//     preposition-plus-possessive interaction.
//   - possessive prepositions (`ʻa` / `ʻo` + name) — §22's other half
//   - mixed-class prompting (`fala` / `tamai` / `fa'ē`) — every head noun
//     in this slice is tagged e_class or ho_class only
//   - benefactive `maʻa`/`moʻo` (§25), indefinite `haʻaku` (§36), postposed
//     `ʻaʻaku` (§40), emotional `siʻeku` (§50) — 2A.6 full
//   - English composition — translate.js short-circuits to gloss, same
//     rationale as the 2A.5 clause-connector short-circuit

describe('2A.6 — possessive paradigm auto-selection (§22 slice)', () => {
  it('ho-class noun (fale) renders with hoku: Naʻa ku fiemaʻu hoku fale', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    // Cross-entry-point child frame: allowed_terminators is [], so the
    // only way to exit the sub-walk is finishFrame.
    expect(currentFrame(s).entryPoint).toBe('possessive_phrase')
    expect(getAvailableTerminators(s)).toEqual([])
    // User picks person/number — the Tongan identity is the ʻe-class form
    // (`ʻeku`) regardless of which paradigm will be rendered. Render time
    // reads the head noun's class and substitutes `hoku` for ho-class.
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiemaʻu hoku fale')
  })

  it('e-class noun (tohi) renders with ʻeku: Naʻa ku fiemaʻu ʻeku tohi', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiemaʻu ʻeku tohi')
  })

  it('e-class noun (ngāue) with 3sg possessor: ʻene ngāue', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ne fiemaʻu ʻene ngāue')
  })

  it('ho-class noun (vaka) with 3sg possessor renders as hono vaka', () => {
    // Cross-paradigm sanity: user picks `ʻene` (the ʻe-class 1sg-form
    // identity) but vaka is ho_class, so the walker renders `hono` instead.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ne fiemaʻu hono vaka')
  })

  it('possessive extension is gated on verb_has_tag: transitive', () => {
    // Intransitive verb `ʻalu` (go) — no `transitive` tag. The possessive
    // extension should be filtered out of the extension menu.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'possessive_pronoun')).toBeUndefined()
  })

  it('possessive_phrase sub-walk has no FINISH terminators available', () => {
    // Verifies allowed_terminators: [] on the internal entry point — the
    // only way to exit the sub-walk is finishFrame.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    // In the sub-walk after both picks, no terminators are available;
    // finishFrame is the only exit.
    expect(getAvailableTerminators(s)).toEqual([])
    // Back in the parent frame after finishFrame, terminators are available.
    s = finishFrame(s)
    expect(getAvailableTerminators(s).sort()).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT'])
  })

  it('extension is hidden after being taken (default extensionsTaken behavior)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'possessive_pronoun')).toBeUndefined()
  })

  it('all 11 possessive pronoun entries carry both paradigm forms', () => {
    // Data guard: every entry in possessive_pronoun.words must declare
    // possessive_forms with both e_class and ho_class strings. A typo or
    // missing field would silently disable the slice's render substitution.
    const node = grammarGraph.nodes.possessive_pronoun
    expect(node).toBeDefined()
    expect(node.words.length).toBe(11)
    for (const w of node.words) {
      expect(w.possessive_forms, `${w.tongan} missing possessive_forms`).toBeDefined()
      expect(w.possessive_forms.e_class, `${w.tongan} missing e_class form`).toBeTruthy()
      expect(w.possessive_forms.ho_class, `${w.tongan} missing ho_class form`).toBeTruthy()
      expect(w.person, `${w.tongan} missing person`).toBeDefined()
      expect(w.number, `${w.tongan} missing number`).toBeDefined()
    }
  })

  it('every possessive_head_noun entry carries possessive_class (no mixed in slice)', () => {
    const node = grammarGraph.nodes.possessive_head_noun
    expect(node).toBeDefined()
    expect(node.words.length).toBeGreaterThan(0)
    for (const w of node.words) {
      expect(['e_class', 'ho_class'], `${w.tongan} has unexpected possessive_class`).toContain(w.possessive_class)
    }
  })

  it('renderNoun helper is not applied to possessive pronouns (no definitive_accent_form shift)', () => {
    // Regression guard — a future change that accidentally routes
    // possessive_pronoun steps through setStepDefiniteness would throw at
    // mark time (possessive pronouns have no definitive_accent_form) but
    // would also be a sign of sloppy step classification. This test just
    // documents that the slice leaves definiteness handling untouched.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    // The possessive_pronoun step has no definiteness field. It should
    // render as the base pronoun form selected by the render pass, not
    // as an accent form.
    const rendered = getRenderedPath(s)
    const pronounStep = rendered.find(r => r.nodeId === 'possessive_pronoun')
    expect(pronounStep).toBeDefined()
    expect(pronounStep.renderedTongan).toBe('hoku') // fale is ho_class
    expect(pronounStep.definiteness).toBeUndefined()
  })
})

// ============================================================================
// Phase 2A.6 follow-up — preposition-plus-possessive interaction
// ============================================================================
//
// Spec §22 + §36 "he reappearance rule":
//   - ki / ʻi / mei + ho-class possessive → base preposition, `he` dropped
//     (`ki hoku fale`, `ʻi hoku loki`, `mei homau ʻapi`)
//   - ki / ʻi / mei + e-class possessive  → preposition + `he` reinstated
//     (`ki he ʻeku tohi`, `mei he ʻene ngāue`)
//
// Architecture: a new internal entry point `prep_with_possessive` is pushed
// as a child frame from `verb.next → preposition_possessive`. The child
// sub-walks preposition_possessive → possessive_pronoun → possessive_head_noun
// → finishFrame. A dedicated render pass in getRenderedPath handles the
// article flip; the possessive_pronoun paradigm substitution from the 2A.6
// core slice still runs (so `hoku` / `ʻeku` flip correctly based on the
// head noun's class).

describe('2A.6 follow-up — preposition-plus-possessive (§22 + §36)', () => {
  it('ho-class head (fale) drops article: Naʻa ku ʻalu ki hoku fale', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    // Cross-entry-point child frame: allowed_terminators: [] forces finishFrame.
    expect(currentFrame(s).entryPoint).toBe('prep_with_possessive')
    expect(getAvailableTerminators(s)).toEqual([])
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki hoku fale')
  })

  it('e-class head (tohi) reinstates article: Naʻa ku ʻalu ki he ʻeku tohi', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki he ʻeku tohi')
  })

  it('ʻi + ho-class (vaka) with 3sg possessor: ʻi hono vaka (cross-paradigm)', () => {
    // User picks `ʻene` (ʻe-class identity for 3sg); vaka is ho_class, so
    // the possessive paradigm substitution flips it to `hono`, and the
    // article-flip pass leaves `ʻi` bare.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ne ʻalu ʻi hono vaka')
  })

  it('mei + e-class (ngāue) with 3sg possessor: mei he ʻene ngāue', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'mei' })
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ne ʻalu mei he ʻene ngāue')
  })

  it('SFA-045 exception: 2sg hoʻo connects directly — ki hoʻo tohi (no he)', () => {
    // Phase P (source-fidelity audit): the second-person e-class possessives
    // hoʻo / hoʻomo / hoʻomou take NO reinstated article after ki / ʻi / mei —
    // Shumway L76 note 1; Churchward 16.213(g) `ki hoʻo faitoʻó`. Every other
    // e-class form keeps `he` (the tests above).
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'hoʻo' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki hoʻo tohi')
  })

  it('SFA-045 exception: 2pl hoʻomou connects directly — mei hoʻomou ngāue (no he)', () => {
    // The book Ch 29 example pair is `ki hoʻo tohi`, `mei hoʻomou ngāue`.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'mei' })
    s = advanceInFrame(s, { tongan: 'hoʻomou' })
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu mei hoʻomou ngāue')
  })

  it('SFA-045 exception: 2du hoʻomo connects directly; ho-class 2nd person unaffected (ki ho fale)', () => {
    // 2du e-class head: direct connection.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'hoʻomo' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki hoʻomo tohi')
    // ho-class head with a 2nd-person possessor never had `he` anyway: the
    // paradigm substitution flips hoʻo → ho and the article stays dropped.
    let t = createWalkerState('statement', 999)
    t = advanceInFrame(t, { tongan: 'Naʻa' })
    t = advanceInFrame(t, { tongan: 'ku' })
    t = takeExtension(t, 'verb')
    t = advanceInFrame(t, { tongan: 'ʻalu' })
    t = takeExtension(t, 'preposition_possessive')
    t = advanceInFrame(t, { tongan: 'ki' })
    t = advanceInFrame(t, { tongan: 'hoʻo' })
    t = advanceInFrame(t, { tongan: 'fale' })
    t = finishFrame(t)
    t = finishWalker(t, 'FINISH_STATEMENT')
    expect(renderTongan(t)).toBe('Naʻa ku ʻalu ki ho fale')
  })

  it('preposition_possessive extension is NOT gated on transitive (intransitive verbs can take locative possessive)', () => {
    // Spec example `Naʻá ke sio ki hoku tokoua?` uses an intransitive-ish
    // verb; the locative possessive should be available regardless of
    // transitivity (unlike the core 2A.6 possessive_pronoun object extension).
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' }) // intransitive
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'preposition_possessive')).toBeDefined()
  })

  it('prep_with_possessive sub-walk has no FINISH terminators available', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    // In the sub-walk after all three picks, no terminators are available;
    // finishFrame is the only exit.
    expect(getAvailableTerminators(s)).toEqual([])
    // After finishFrame, the parent frame at anchor=verb regains terminators.
    s = finishFrame(s)
    expect(getAvailableTerminators(s).sort()).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT'])
  })

  it('extension is hidden after being taken (default extensionsTaken behavior)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'preposition_possessive')).toBeUndefined()
  })

  it('core 2A.6 verb.next possessive extension still renders correctly (no regression)', () => {
    // The follow-up adds a second render pass that reads the three-step
    // triple. This test guards against the possessive_pronoun + head_noun
    // pair from the 2A.6 core slice being mis-read by the new pass when
    // there is no preceding preposition_possessive step.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiemaʻu hoku fale')
  })

  it('preposition_possessive node carries 3 words (ki, ʻi, mei) with family tags', () => {
    // Data guard: the node must provide the three spec §22/§36 prepositions
    // each tagged with `family` so requires_complement_prep filtering works
    // when the verb carries a `complement_prep` tag.
    const node = grammarGraph.nodes.preposition_possessive
    expect(node).toBeDefined()
    expect(node.words.length).toBe(3)
    const tongans = node.words.map(w => w.tongan).sort()
    expect(tongans).toEqual(['ki', 'mei', 'ʻi'])
    for (const w of node.words) {
      expect(w.family, `${w.tongan} missing family tag`).toBeTruthy()
    }
  })
})

// ============================================================================
// Phase 2A.6 follow-up 2 — ʻa / ʻo + name possessive (§22)
// ============================================================================
//
// Spec §22 "Possessive prepositional phrase":
//   - `ʻa` for e-class head nouns
//   - `ʻo` for ho-class head nouns
//   - followed by a proper name
//   - auto-selected by the HEAD noun's possessive_class, not the name's
//
// Examples (spec §22 lines 2158–2165):
//   Ko e paʻanga ʻa Sione.  — Sione's money (paʻanga = e_class)
//   Ko e fale ʻo Sione.     — Sione's house (fale = ho_class)
//   Ko e vaka ʻo Tēvita.    — Tēvita's boat (vaka = ho_class)
//
// Architecture: a new internal entry point `possessive_phrase_name` is
// pushed as a child frame from `prep_phrase.next → possessor_preposition`.
// The choice of prep_phrase as the attachment point is deliberate — its
// word inventory already contains both e-class (`tohi`) and ho-class
// (`fale`, `vaka`) common nouns, so the cross-paradigm render flip is
// exercisable from the existing data. The child sub-walks
// possessor_preposition → possessor_name → finishFrame. A dedicated render
// pass in getRenderedPath walks backwards from the preposition step to
// find the nearest preceding step carrying `possessive_class` (the head
// noun in the parent frame) and substitutes ʻa / ʻo accordingly.

describe('2A.6 follow-up 2 — ʻa / ʻo + name possessive (§22)', () => {
  // Frame nesting for these tests: verb.next → preposition pushes a
  // preposition sub-frame, and prep_phrase.next → possessor_preposition
  // pushes a second (inner) sub-frame for the possessive_phrase_name
  // child entry point. Collapsing back to the root frame therefore needs
  // TWO finishFrame calls: one to pop the possessive_phrase_name sub-walk,
  // one to pop the preposition sub-walk. (The 2A.6 core slice needed only
  // one because it attached directly to verb.next; the 2A.6 follow-up
  // attached preposition_possessive directly to verb.next for the same
  // reason. This slice chose prep_phrase.next deliberately — the head noun
  // inventory in prep_phrase gives both e_class and ho_class from the
  // existing data — at the cost of an extra frame level.)
  it('ho-class head (fale) renders with ʻo: Naʻa ku ʻalu ki he fale ʻo Sione', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = takeExtension(s, 'possessor_preposition')
    // Cross-entry-point child frame: allowed_terminators: [] forces finishFrame.
    expect(currentFrame(s).entryPoint).toBe('possessive_phrase_name')
    expect(getAvailableTerminators(s)).toEqual([])
    // The single word entry's Tongan identity is the e-class form (`ʻa`).
    // Render time reads the head noun's class and flips to `ʻo` for ho-class.
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s) // pop possessive_phrase_name
    s = finishFrame(s) // pop preposition sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki he fale ʻo Sione')
  })

  it('e-class head (tohi) renders with ʻa: Naʻa ku sio ki he tohi ʻa Mele', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'sio' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku sio ki he tohi ʻa Mele')
  })

  it('ho-class head (vaka) with a different name: ʻi he vaka ʻo Tēvita', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Tēvita' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku nofo ʻi he vaka ʻo Tēvita')
  })

  it('local-class head (kolo) renders with ʻo (spec treats locals as ho_class)', () => {
    // kolo (town) is tagged ho_class in the data — consistent with spec §22's
    // "things that shelter you / define you" bucket for places. The render
    // pass finds the local prep_phrase step and substitutes ʻo.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki kolo ʻo Sione')
  })

  it('possessive_phrase_name sub-walk auto-pops on Sione — user lands in prep_phrase parent', () => {
    // The possessive_phrase_name entry point declares allowed_terminators:[]
    // so its sub-walk has no terminators. Its tail node `possessor_name`
    // also has `next: []`. Advancing into Sione therefore leaves the frame
    // IN_PROGRESS with neither extensions nor terminators — the auto-pop
    // sees an empty extension set and collapses the frame back to the
    // parent preposition sub-frame, which IS allowed to terminate via
    // prep_phrase.next. The user never has to click "Done with this part".
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    // Auto-pop collapsed the possessive_phrase_name sub-walk — we're now
    // in the preposition sub-frame at prep_phrase (which has FINISH edges).
    expect(currentFrame(s).extensionMenuAnchor).toBe('prep_phrase')
    expect(getAvailableTerminators(s).sort()).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT'])
  })

  it('possessor_preposition extension is hidden after being taken (default_taken)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s) // back in the preposition sub-frame (prep_phrase anchor)
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'possessor_preposition')).toBeUndefined()
  })

  it('possessor_preposition is NOT gated — available after any prep_phrase pick', () => {
    // Unlike the core 2A.6 possessive_pronoun extension (transitive-gated),
    // this one sits on prep_phrase.next with no condition, so it's offered
    // after any locative pick regardless of the verb's transitivity.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' }) // intransitive
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'possessor_preposition')).toBeDefined()
  })

  it('2A.6 core (possessive_pronoun) and 2A.6 follow-up (preposition_possessive) still render correctly', () => {
    // Regression guard: the new render pass scans every step for
    // possessor_preposition nodes. Other extension branches must be
    // unaffected.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiemaʻu hoku fale')
  })

  it('possessor_preposition node stores a single word with both paradigm forms', () => {
    const node = grammarGraph.nodes.possessor_preposition
    expect(node).toBeDefined()
    expect(node.words.length).toBe(1)
    const w = node.words[0]
    expect(w.tongan).toBe('ʻa')
    expect(w.possessive_forms).toBeDefined()
    expect(w.possessive_forms.e_class).toBe('ʻa')
    expect(w.possessive_forms.ho_class).toBe('ʻo')
  })

  it('possessor_name node entries are all personal-class persons with min_chapter 17', () => {
    const node = grammarGraph.nodes.possessor_name
    expect(node).toBeDefined()
    expect(node.words.length).toBeGreaterThan(0)
    for (const w of node.words) {
      expect(w.noun_class, `${w.tongan} wrong noun_class`).toBe('personal')
      expect(w.animacy, `${w.tongan} wrong animacy`).toBe('person')
      expect(w.min_chapter, `${w.tongan} wrong min_chapter`).toBe(17)
    }
  })
})

// ============================================================================
// Phase 2C.1 full — §§16-20 expansion (transitive, conjunctions, conditionals,
// cleft, noun classes)
// ============================================================================
//
// This expansion lands the five new chapter-group entry points and nodes:
//
//   §16 (Ch 19): transitive_statement — tense_marker_tr → verb_tr →
//     object_phrase → agent_phrase → FINISH + extensions. Both object_phrase
//     and agent_phrase bake the ʻa / ʻe marker into each entry so the walker
//     renders the correct form directly without a new render pass.
//
//   §17 (Ch 24): clause_connector_pea — a pea-second-clause extension off
//     verb.next, parallel to the 2A.5 clause_connector_ka / negation pattern
//     but routing to a fresh full-statement sub-walk (pea_second_clause
//     internal entry point).
//
//   §18 (Ch 30): subordinator_kapau and subordinator_lolotonga — conditional
//     ("if") and temporal ("while") subordinators, each pushing its own
//     internal entry point with allowed_terminators: [] so the UI must
//     finishFrame to exit.
//
//   §19 (Ch 36): cleft_emphatic — ko_emphatic → subject_phrase →
//     tense_marker_cleft → pronoun_relative (auto-agreed via depends_on) →
//     verb_cleft → FINISH + extensions (including object_phrase_cleft when
//     the verb is transitive-tagged).
//
//   §20 (Ch 46): data-only — houʻeiki (quasi-personal), ʻuta / ngoue /
//     toafa (quasi-local) added to prep_phrase so Rule 3 auto-renders the
//     right preposition form on top of existing data.
//
// Deliberately deferred:
//   - §16 sub-patterns: passive (drop agent), pronoun-object (drop ʻa),
//     emphatic reflexive, flexible-order swap action
//   - §17 tm_drop_second_clause shortcut (peá u ...) and ʻo-imperative
//   - §18 subordinator-first entry points (kapau-first), kaeʻoua ke / kuo,
//     neongo with verbal-noun construction, ʻilonga / faifai / kehe ke
//   - §19 cleft sub-patterns: emphatic equational (ko X ko e Y), "that's
//     why" (ko e meʻa ia ... ai), unexpressed relative-clause object,
//     cleft tense-marker accent rule
//   - §20 laʻi classifier, alternate local/common noun forms, verbal-noun
//     derivation as a noun class
//
// English composition for all five constructions falls through to the
// gloss path via a translate.js short-circuit — same rationale as 2A.5 /
// 2A.6. The Tongan rendering is the contract; English follows later.

describe('2C.1 full — §16 transitive statement (Ch 19)', () => {
  it('Naʻe kai ʻe Sione ʻa e ika: simple transitive sentence', () => {
    let s = createWalkerState('transitive_statement', 999)
    expect(currentFrame(s).entryPoint).toBe('transitive_statement')

    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishWalker(s, 'FINISH_STATEMENT')

    expect(getWalkerStatus(s)).toBe('FINISHED')
    expect(renderTongan(s)).toBe('Naʻe kai ʻa e ika ʻe Sione')
  })

  it('Naʻe kai ʻe Sione ʻa e ika ʻi ʻapi ʻaneafi: with location and time extensions', () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    // Location extension: ʻi ʻapi
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishFrame(s)
    // Time extension: ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')

    expect(renderTongan(s)).toBe('Naʻe kai ʻa e ika ʻe Sione ʻi ʻapi ʻaneafi')
  })

  it('verb_tr → object_phrase is a required linear chain (not an optional extension)', () => {
    // After tense_marker_tr and verb_tr, the walker must auto-advance into
    // object_phrase as the next SELECTING slot, not expose it as a branch
    // or an extension. This is what makes the transitive construction
    // distinct from the standard statement (where object is optional).
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    expect(currentFrame(s).currentNodeId).toBe('object_phrase')
    expect(getWalkerStatus(s)).toBe('SELECTING')
  })

  it('agent_phrase is required after object_phrase (linear chain, no passive in this slice)', () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    expect(currentFrame(s).currentNodeId).toBe('agent_phrase')
  })

  it('FINISH is not available until both object and agent are filled', () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    // Still SELECTING — no extension menu, no terminators
    expect(getAvailableTerminators(s)).toEqual([])
    s = advanceInFrame(s, { tongan: 'ika' })
    expect(getAvailableTerminators(s)).toEqual([])
    s = advanceInFrame(s, { tongan: 'Sione' })
    // Now both FINISH terminators are available
    expect(getAvailableTerminators(s).sort()).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT'])
  })

  it('every verb_tr word is tagged transitive', () => {
    const node = grammarGraph.nodes.verb_tr
    expect(node).toBeDefined()
    expect(node.words.length).toBeGreaterThan(0)
    for (const w of node.words) {
      expect(w.tags, `${w.tongan} missing tags`).toBeDefined()
      expect(w.tags, `${w.tongan} missing transitive tag`).toContain('transitive')
    }
  })
})

describe('2C.1 full — §17 pea multi-clause (Ch 24)', () => {
  it('Naʻa ku kai pea naʻa ku inu: two-clause sequential', () => {
    let s = createWalkerState('statement', 999)
    // Main clause: Naʻa ku kai
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // pea sub-walk
    s = takeExtension(s, 'clause_connector_pea')
    expect(currentFrame(s).entryPoint).toBe('pea_second_clause')
    expect(getAvailableTerminators(s)).toEqual([]) // no FINISH inside a pea sub-walk
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'tense_marker') // choose full-form path (2E.6: branching after pea)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    s = finishFrame(s) // pop pea sub-frame back to root
    expect(currentFrame(s).entryPoint).toBe('statement')
    s = finishWalker(s, 'FINISH_STATEMENT')
    // The lowercase-after-connector rule drops the second clause's Naʻa to
    // naʻa, matching the 2A.5 ka-clause convention.
    expect(renderTongan(s)).toBe('Naʻa ku kai pea naʻa ku inu')
  })

  it('clause_count_max: 2 — pea is hidden once a ka clause is already taken', () => {
    // Build a sentence that already has a ka-clause, then verify pea is
    // no longer offered (both edges share the same clause_count_max: 2 cap).
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'clause_connector_ka')
    s = advanceInFrame(s, { tongan: 'ka' })
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    // pronoun_neg now has aspect_marker + verb as sibling options (2F.3)
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    // Still inside the negation sub-frame — the extension menu here comes
    // from the negation clause's verb anchor.
    const menu = getExtensionMenu(s)
    // pea would be a THIRD clause (root + ka + pea) — cap says no.
    expect(menu.extensions.find(e => e.node === 'clause_connector_pea')).toBeUndefined()
  })

  it('clause_connector_pea edge on verb.next carries clause_count_max: 2 and child_entry_point: pea_second_clause', () => {
    const edge = (grammarGraph.nodes.verb.next || []).find(e => e.node === 'clause_connector_pea')
    expect(edge).toBeDefined()
    expect(edge.condition?.type).toBe('clause_count_max')
    expect(edge.condition?.max).toBe(2)
    expect(edge.child_entry_point).toBe('pea_second_clause')
  })

  it('Naʻa ku kai he naʻa ku fiekaia: reason clause lowercases tense marker after he', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'clause_connector_he')
    expect(currentFrame(s).entryPoint).toBe('reason_clause_he')
    s = advanceInFrame(s, { tongan: 'he' })
    // clause_connector_he.next now branches into three tense_marker targets
    // (pronoun-subject, noun-subject, negation) so the reason clause can
    // take any statement shape — not just pronoun-subject. The user picks
    // the branch via the merged 'Tense Marker' category in multi-walker;
    // the stack walker test explicitly calls takeExtension to pick one.
    s = takeExtension(s, 'tense_marker')
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiekaia' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku kai he naʻa ku fiekaia')
  })

  it('clause_connector_he branches: Naʻe + verb_ns → noun-subject reason clause', () => {
    // Regression guard for Issues 2 & 3: after `he`, the user should be able
    // to pick a noun-subject tense marker (Naʻe) and continue with a verb_ns
    // → noun_subject_name shape. Previously `clause_connector_he.next`
    // forced `tense_marker` (pronoun-subject only), so this shape was
    // unreachable.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'clause_connector_he')
    s = advanceInFrame(s, { tongan: 'he' })
    s = takeExtension(s, 'tense_marker_ns')
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'fiekaia' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Reason clause rendered lowercase (naʻe) via the lowercase allowlist.
    expect(renderTongan(s)).toBe('Naʻa ku kai he naʻe fiekaia ʻa Sione')
  })

  it('clause_connector_he.next offers all three tense-marker branches', () => {
    const edges = (grammarGraph.nodes.clause_connector_he.next || []).map(e => e.node)
    expect(edges).toContain('tense_marker')
    expect(edges).toContain('tense_marker_ns')
    expect(edges).toContain('tense_marker_neg')
  })
})

describe('2C.1 full — §18 kapau / lolotonga subordinators (Ch 30)', () => {
  it('Naʻa ku kai kapau naʻa ku fiekaia: conditional subordinator', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'subordinator_kapau')
    expect(currentFrame(s).entryPoint).toBe('conditional_clause')
    expect(getAvailableTerminators(s)).toEqual([])
    s = advanceInFrame(s, { tongan: 'kapau' })
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiekaia' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku kai kapau naʻa ku fiekaia')
  })

  it('Naʻa ku mohe lolotonga naʻa ku fiekaia: temporal subordinator', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'mohe' })
    s = takeExtension(s, 'subordinator_lolotonga')
    expect(currentFrame(s).entryPoint).toBe('temporal_clause')
    s = advanceInFrame(s, { tongan: 'lolotonga' })
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiekaia' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku mohe lolotonga naʻa ku fiekaia')
  })

  it('subordinator_kapau and subordinator_lolotonga share the clause_count_max: 2 cap with ka / pea / ke', () => {
    // Already has pea; kapau and lolotonga should be hidden because the
    // 2-clause cap is reached (root + pea second clause).
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'tense_marker') // choose full-form path (2E.6)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'subordinator_kapau')).toBeUndefined()
    expect(menu.extensions.find(e => e.node === 'subordinator_lolotonga')).toBeUndefined()
  })
})

describe('2C.1 full — §19 cleft emphatic (Ch 36)', () => {
  it('Ko Sione naʻe kai ʻa e ika: cleft with transitive verb and definite object', () => {
    let s = createWalkerState('cleft_emphatic', 999)
    expect(currentFrame(s).entryPoint).toBe('cleft_emphatic')
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    // pronoun_relative is constrained by subject_phrase: Sione → ne only
    expect(getCurrentFrameWords(s).map(w => w.tongan)).toEqual(['ne'])
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object_phrase_cleft')
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko Sione naʻe ne kai ʻa e ika')
  })

  it('Ko Pita ʻoku ne ngāue: cleft with intransitive verb (no object offered)', () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'Pita' })
    s = advanceInFrame(s, { tongan: 'ʻoku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'ngāue' }) // intransitive
    // object_phrase_cleft is gated on verb_has_tag: transitive, so the
    // extension menu should not offer it.
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'object_phrase_cleft')).toBeUndefined()
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko Pita ʻoku ne ngāue')
  })

  it('Ko au naʻe ku hiva: 1sg cleft with relative pronoun ku', () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'au' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    // au → ku (1sg relative)
    expect(getCurrentFrameWords(s).map(w => w.tongan)).toEqual(['ku'])
    s = advanceInFrame(s, { tongan: 'ku' })
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko au naʻe ku hiva')
  })

  it('Ko kinautolu naʻe nau hiva: 3pl cleft with relative pronoun nau', () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'kinautolu' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    expect(getCurrentFrameWords(s).map(w => w.tongan)).toEqual(['nau'])
    s = advanceInFrame(s, { tongan: 'nau' })
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko kinautolu naʻe nau hiva')
  })

  it('pronoun_relative is filtered to exactly one form by the subject_phrase depends_on constraint', () => {
    const node = grammarGraph.nodes.pronoun_relative
    expect(node).toBeDefined()
    expect(node.constraints?.depends_on).toBe('subject_phrase')
    const vc = node.constraints.valid_combinations
    expect(vc.Sione).toEqual(['ne'])
    expect(vc.au).toEqual(['ku'])
    expect(vc.koe).toEqual(['ke'])
    expect(vc.kinautolu).toEqual(['nau'])
    // fānau is a plural common noun, so relative is nau. The article `e` is
    // no longer pre-fused into the entry — the key is bare after the refactor.
    expect(vc['fānau']).toEqual(['nau'])
  })
})

describe('2C.1 full — §20 noun classes (Ch 46)', () => {
  it('Naʻa ku lea kia houʻeiki: quasi-personal noun houʻeiki takes the personal-class preposition form kia', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'lea' }) // complement_prep: ki-family
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'houʻeiki' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Rule 3: ki + personal noun houʻeiki → kia houʻeiki
    expect(renderTongan(s)).toBe('Naʻa ku lea kia houʻeiki')
  })

  it('Naʻa ku ʻalu ki ʻuta: quasi-local noun ʻuta takes the local-class preposition form (bare ki)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'ʻuta' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu ki ʻuta')
  })

  it('Naʻa ku ngāue ʻi ngoue: ngoue (garden) is quasi-local (bare ʻi)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ngoue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ngāue ʻi ngoue')
  })

  it('houʻeiki is tagged as noun_class: personal in prep_phrase words', () => {
    const node = grammarGraph.nodes.prep_phrase
    const houeiki = (node.words || []).find(w => w.tongan === 'houʻeiki')
    expect(houeiki, 'houʻeiki missing from prep_phrase').toBeDefined()
    expect(houeiki.noun_class).toBe('personal')
    expect(houeiki.min_chapter).toBe(46)
  })

  it('ʻuta, ngoue, and toafa are tagged as noun_class: local in prep_phrase words', () => {
    const node = grammarGraph.nodes.prep_phrase
    for (const tongan of ['ʻuta', 'ngoue', 'toafa']) {
      const w = (node.words || []).find(w => w.tongan === tongan)
      expect(w, `${tongan} missing from prep_phrase`).toBeDefined()
      expect(w.noun_class, `${tongan} wrong noun_class`).toBe('local')
      expect(w.min_chapter, `${tongan} wrong min_chapter`).toBe(46)
    }
  })
})

// ============================================================================
// Phase 2C.3a — §26 Numbers: numeral + personal_count nodes
// ============================================================================
//
// Spec §26 introduces the cardinal number system (taha through hongofulu),
// the numeric particle ʻe that attaches a count to a non-personal noun, and
// the toko counter that replaces ʻe when counting people. This slice lands
// the minimum usable shape — two new terminal extension nodes with compound
// word entries (each word bakes the ʻe or toko particle into the tongan
// field). No walker / schema changes; compound-form encoding is the 2C.2
// convention reused verbatim.
//
// Shipped:
//   - numeral node: 10 ʻe + cardinal entries (ʻe taha … ʻe hongofulu);
//     attached to object.next; terminal (next is FINISH only)
//   - personal_count node: 10 toko + cardinal entries; attached to
//     pronoun.next as an alternative to the verb path; terminal
//   - Docs.4 catalog gains two EXTENSIONS rows (both terminal enforcement)
//
// Deferred (spec §26, documented in grammar-graph.json node descriptions):
//   - compound_numeral (mā-joined forms: hongofulu mā taha = eleven)
//   - definitive-accent rendering on the final numeral (ʻa e kato ʻe onó)
//   - animacy-driven ʻe-vs-toko auto-selection (the current slice keeps the
//     two nodes as explicit sibling paths instead of one node with a render
//     pass reading the head noun's animacy field)
//   - ordinal ko hono + numeral pattern
//   - time_telling entry point (Ko e tolú eni)
//   - me_a_e_fiha short-form entry point
//   - fīha interrogative, tokolahi / tokosiʻi quantifiers
//   - (noun) + ʻe + toko + numeral transitive-object form
//     (Ko e tamaiki ʻe toko tolu)
//   - subject-less ʻOku toko ono pē (would require tense_marker.next →
//     personal_count, bypassing the pronoun)
describe('2C.3a — §26 numeral + personal_count', () => {
  it('Naʻa ku kai ika ʻe ono (numeral on object.next — six fish)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // verb has FINISH in its next → object extension pushes a sub-frame.
    s = takeExtension(s, 'object')
    s = advanceInFrame(s, { tongan: 'ika' })
    // object has FINISH in its next → numeral extension pushes another
    // sub-frame. Frames after this: [root, object, numeral].
    s = takeExtension(s, 'numeral')
    s = advanceInFrame(s, { tongan: 'ʻe ono' })
    s = finishFrame(s) // pop numeral → back into object frame
    s = finishFrame(s) // pop object → back into root frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku kai ika ʻe ono')
  })

  it('ʻOku nau toko tolu (personal_count on pronoun.next — they are three people)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'nau' })
    s = takeExtension(s, 'personal_count')
    s = advanceInFrame(s, { tongan: 'toko tolu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku nau toko tolu')
  })

  it('numeral node has 10 ʻe-prefixed cardinal entries (taha through hongofulu)', () => {
    const node = grammarGraph.nodes.numeral
    expect(node).toBeDefined()
    const tongans = (node.words || []).map(w => w.tongan)
    expect(tongans).toEqual([
      'ʻe taha', 'ʻe ua', 'ʻe tolu', 'ʻe fā', 'ʻe nima',
      'ʻe ono', 'ʻe fitu', 'ʻe valu', 'ʻe hiva', 'ʻe hongofulu',
    ])
    for (const w of node.words) {
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(20)
      expect(w.tags, `${w.tongan} tags`).toContain('numeral')
    }
  })

  it('personal_count node has 10 toko-prefixed cardinal entries', () => {
    const node = grammarGraph.nodes.personal_count
    expect(node).toBeDefined()
    const tongans = (node.words || []).map(w => w.tongan)
    expect(tongans).toEqual([
      'toko taha', 'toko ua', 'toko tolu', 'toko fā', 'toko nima',
      'toko ono', 'toko fitu', 'toko valu', 'toko hiva', 'toko hongofulu',
    ])
    for (const w of node.words) {
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(20)
      expect(w.tags, `${w.tongan} tags`).toContain('numeral')
      expect(w.tags, `${w.tongan} tags`).toContain('personal_count')
    }
  })

  it('numeral is reachable from object.next (terminal extension, Ch 20)', () => {
    const objectNode = grammarGraph.nodes.object
    const edge = (objectNode.next || []).find(e => e.node === 'numeral')
    expect(edge, 'object.next missing numeral edge').toBeDefined()
    expect(edge.min_chapter).toBe(20)
    expect(edge.condition).toBeUndefined()
    expect(edge.child_entry_point).toBeUndefined()
  })

  it('personal_count is reachable from pronoun.next as a sibling of verb (Ch 20)', () => {
    const pronounNode = grammarGraph.nodes.pronoun
    const edge = (pronounNode.next || []).find(e => e.node === 'personal_count')
    expect(edge, 'pronoun.next missing personal_count edge').toBeDefined()
    expect(edge.min_chapter).toBe(20)
    expect(edge.condition).toBeUndefined()
    expect(edge.child_entry_point).toBeUndefined()
    // Siblings to confirm: the verb edge must still exist so the normal
    // transitive / intransitive path is not blocked.
    expect((pronounNode.next || []).find(e => e.node === 'verb')).toBeDefined()
  })
})

// ============================================================================
// Phase 2C.3b — §27 Auxiliary verbs: fie_aux + lava_o_aux
// ============================================================================
//
// Spec §27 introduces three pre-verb constructions grouped as "auxiliaries":
// fie (want to), lava ʻo (be able to), and saiʻia (like — structurally a
// stative verb with a prepositional complement, not a true auxiliary). This
// slice lands the first two as minimal required_next nodes mirroring the
// shape of preposed_modifier (faʻa → verb); both attach to pronoun.next as
// siblings.
//
// Spec §27's cross-cutting note on aspect/auxiliary slot ordering says the
// two can co-occur as `aspect + auxiliary + verb` (e.g., ʻOku ʻikai te u kei
// fie ʻalu = 'I no longer want to go'), but the current slice exposes both
// as exclusive pronoun.next siblings, so the user can pick one per sentence.
// Wiring aspect → aux → verb (or exposing aux on aspect_marker.next) is a
// later slice; the deferred co-occurrence is documented on each node.
//
// Shipped:
//   - fie_aux node: single word `fie`, required_next → verb
//   - lava_o_aux node: single word `lava ʻo` (compound with the ʻo
//     conjunction baked in, same encoding trick as 2C.3a numeral),
//     required_next → verb
//   - pronoun.next gains two new edges (fie_aux, lava_o_aux)
//   - Docs.4 catalog gains 2 EXTENSIONS rows (both required_next enforcement)
//
// Deferred (spec §27, documented in grammar-graph.json node descriptions):
//   - saiʻia as a stative verb with i-family complement (would add a word
//     entry to the verb node with complement_prep: "i-family")
//   - fie + uncomplimentary adjective sub-pattern (fie poto / fie lahi /
//     fie lelei); needs a fie_uncomplimentary flag on adjective entries
//     and a translator hook for the insulting gloss
//   - lava + noun-subject construction (Naʻe lava ʻa Siale ʻo hiva lelei /
//     ʻE lava ʻe Pita ʻo fakatau ʻa e meʻakai) — flips to verb-first order
//     with the subject marker (ʻa or ʻe) determined by the second verb's
//     transitivity
//   - lava + negation (ʻOku ʻikai te u lava ʻo ʻalu)
//   - aspect + auxiliary co-occurrence (ʻOku ʻikai te u kei fie ʻalu)
describe('2C.3b — §27 auxiliary verbs (fie, lava ʻo)', () => {
  it('ʻOku ou fie ako (fie_aux on pronoun.next — I want to study)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'fie_aux')
    s = advanceInFrame(s, { tongan: 'fie' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ou fie ako')
  })

  it('ʻOku ou lava ʻo ʻalu (lava_o_aux on pronoun.next — I can go)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'lava_o_aux')
    s = advanceInFrame(s, { tongan: 'lava ʻo' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ou lava ʻo ʻalu')
  })

  it('fie_aux node has exactly one word (fie) and one required next edge to verb', () => {
    const node = grammarGraph.nodes.fie_aux
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    expect(node.words[0].tongan).toBe('fie')
    expect(node.words[0].min_chapter).toBe(21)
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('verb')
    expect(node.next[0].required).toBe(true)
  })

  it('lava_o_aux node has exactly one compound word (lava ʻo) and one required next edge to verb', () => {
    const node = grammarGraph.nodes.lava_o_aux
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    expect(node.words[0].tongan).toBe('lava ʻo')
    expect(node.words[0].min_chapter).toBe(21)
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('verb')
    expect(node.next[0].required).toBe(true)
  })

  it('both auxiliaries are reachable from pronoun.next as siblings of verb, aspect_marker, preposed_modifier', () => {
    const pronounEdges = grammarGraph.nodes.pronoun.next.map(e => e.node)
    expect(pronounEdges).toContain('fie_aux')
    expect(pronounEdges).toContain('lava_o_aux')
    // Siblings that must remain intact
    expect(pronounEdges).toContain('verb')
    expect(pronounEdges).toContain('aspect_marker')
    expect(pronounEdges).toContain('preposed_modifier')
    expect(pronounEdges).toContain('personal_count')
  })
})

// ============================================================================
// Phase 2C.3c — §28 Obligation: totonu ke / kuo pau ke entry points
// ============================================================================
//
// Spec §28 introduces two obligation constructions: `ʻoku totonu ke` (should /
// ought to) and `kuo pau ke` (must / it is certain that). Both are specific
// applications of the ke subordinator from §25 (Ch 26), exposed here as their
// own entry points so the user can reach them directly. This slice lands the
// two linear-chain entry points and the shared pronoun node.
//
// Shipped:
//   - obligation_should entry point → totonu_phrase → obligation_pronoun → verb
//     (totonu_phrase has 2 compound-word entries: ʻOku totonu ke, Naʻe totonu ke)
//   - obligation_must entry point → pau_phrase → obligation_pronoun → verb
//     (pau_phrase has 1 compound-word entry: Kuo pau ke)
//   - obligation_pronoun node: 7 ke-subordinator pronoun forms
//     (u / ke / ne / nau / mau / tau / ta)
//   - Docs.4 MATRIX_ENTRY_POINTS gains 2 'present' rows
//
// Deferred (spec §28, documented in grammar-graph.json node descriptions):
//   - totonu + ʻikai plain negation (ʻOku ʻikai totonu ke ke mohe)
//   - totonu + ʻoua naʻa emphatic negation
//   - noun-subject pattern (ʻOku totonu ke ngāue lahi ʻa Mele) — flips to
//     verb-first order with the §14/§16 noun-subject marker
//   - probability-sense rendering (translator flavor, no structural change)
//   - impersonal weather subjects (Kuo pau ke vela he ʻaho ni)
//   - the extra dual/plural pronoun forms (ma, mo, mou) not listed in spec §28
describe('2C.3c — §28 obligation (totonu ke / kuo pau ke)', () => {
  it('ʻOku totonu ke u ako (obligation_should + 1sg pronoun u — I should study)', () => {
    let s = createWalkerState('obligation_should', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku totonu ke' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku totonu ke u ako')
  })

  it('Kuo pau ke ke ngāue (obligation_must + 2sg ke — you must work)', () => {
    let s = createWalkerState('obligation_must', 999)
    s = advanceInFrame(s, { tongan: 'Kuo pau ke' })
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Kuo pau ke ke ngāue')
  })

  it('Naʻe totonu ke ne ako (past totonu — he should have studied)', () => {
    let s = createWalkerState('obligation_should', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe totonu ke' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻe totonu ke ne ako')
  })

  it('totonu_phrase has 2 compound entries (present + past) and required_next to obligation_pronoun', () => {
    const node = grammarGraph.nodes.totonu_phrase
    expect(node).toBeDefined()
    expect(node.words.map(w => w.tongan)).toEqual(['ʻOku totonu ke', 'Naʻe totonu ke'])
    for (const w of node.words) {
      expect(w.min_chapter).toBe(23)
      expect(w.tags).toContain('obligation_head')
    }
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('obligation_pronoun')
    expect(node.next[0].required).toBe(true)
  })

  it('pau_phrase has 1 compound entry and required_next to obligation_pronoun', () => {
    const node = grammarGraph.nodes.pau_phrase
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    expect(node.words[0].tongan).toBe('Kuo pau ke')
    expect(node.words[0].min_chapter).toBe(23)
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('obligation_pronoun')
    expect(node.next[0].required).toBe(true)
  })

  it('obligation_pronoun has the 8 ke-subordinator forms (mou added in 2C.4d) and required_next to verb', () => {
    const node = grammarGraph.nodes.obligation_pronoun
    expect(node).toBeDefined()
    expect(node.words.map(w => w.tongan)).toEqual(['u', 'ke', 'ne', 'nau', 'mau', 'tau', 'mou', 'ta'])
    for (const w of node.words) {
      // 7 original forms land with min_chapter 23 (2C.3c slice); mou was added
      // in 2C.4d to support spec §34 `ʻOfa pē ke mou fiefia` so its min_chapter
      // is 38 (the chapter that motivated adding it).
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(w.tongan === 'mou' ? 38 : 23)
      expect(w.person).toBeDefined()
      expect(w.number).toBeDefined()
    }
    expect(node.constraints).toBeUndefined()
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('verb')
    expect(node.next[0].required).toBe(true)
  })

  it('obligation_should and obligation_must entry points are registered (Statements, min_chapter 23)', () => {
    const byId = Object.fromEntries(grammarGraph.entry_points.map(ep => [ep.id, ep]))
    for (const id of ['obligation_should', 'obligation_must']) {
      const ep = byId[id]
      expect(ep, `entry point ${id} missing`).toBeDefined()
      expect(ep.category).toBe('Statements')
      expect(ep.min_chapter).toBe(23)
      expect(ep.allowed_terminators).toEqual(['FINISH_STATEMENT', 'FINISH_QUESTION'])
    }
    expect(byId['obligation_should'].start_node).toBe('totonu_phrase')
    expect(byId['obligation_must'].start_node).toBe('pau_phrase')
  })
})

// ============================================================================
// Phase 2C.3d — §29 Plural markers + irregular plural_form tagging pass
// ============================================================================
//
// Spec §29 introduces the pre-noun plural_marker slot (five markers:
// ngaahi / kau / fanga / ʻū / ongo) plus irregular plural_form fields on
// nouns, verbs, and adjectives. This slice is data-additive only:
//
// Shipped:
//   - plural_marker reference node (5 words, not yet wired as an
//     extension — wiring requires splitting article from noun in every
//     existing noun-bearing word list, which is a separate slice)
//   - verb.ʻalu -> plural_form "ō"
//   - verb.haʻu -> plural_form "ō mai"
//   - verb.nofo -> plural_form "nonofo" (semantic shift: "live together")
//   - equational_noun.tamasiʻi -> plural_form "tamaiki"
//   - equational_noun.fefine -> plural_form "fafine"
//   - modifier_eq.lahi -> plural_form "lalahi" (size sense, disambiguates
//     from the quantifier sense "many")
//
// Deferred (spec §29, documented on the plural_marker node):
//   - Wiring plural_marker as an extension (blocked on the article+noun
//     split refactor)
//   - Walker auto-substitution of plural_form (that's 2A.7 — this slice
//     only TAGS the field, it doesn't activate substitution at render
//     time)
//   - kotoa postposed quantifier (ʻa e fale kotoa = all the houses)
//   - ambiguous_animacy flag for hiva / ako / lotu / ngāue
//   - The fafine dual / plural courtesy split
//   - tokoto → tākoto, 'eiki → houʻeiki, tokoto → tākoto, siʻi → iiki,
//     lōloa → loloa (tag when the base words land in the graph)
describe('2C.3d — §29 plural marker + plural_form tagging', () => {
  it('plural_marker node has all 5 markers (ngaahi, kau, fanga, ʻū, ongo) with correct tags', () => {
    const node = grammarGraph.nodes.plural_marker
    expect(node).toBeDefined()
    expect(node.words.map(w => w.tongan)).toEqual(['ngaahi', 'kau', 'fanga', 'ʻū', 'ongo'])
    for (const w of node.words) {
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(25)
      expect(w.tags, `${w.tongan} tags`).toContain('plural_marker')
    }
    const byTongan = Object.fromEntries(node.words.map(w => [w.tongan, w]))
    expect(byTongan['ngaahi'].tags).toContain('default_for_thing')
    expect(byTongan['kau'].tags).toContain('default_for_person')
    expect(byTongan['fanga'].tags).toContain('default_for_animal')
    expect(byTongan['fanga'].tags).toContain('forced_by_kiʻi')
    expect(byTongan['ʻū'].tags).toContain('alternate_for_thing')
    expect(byTongan['ongo'].tags).toContain('dual')
  })

  it('plural_marker is deliberately not wired as an extension yet (empty next, no incoming edges)', () => {
    const node = grammarGraph.nodes.plural_marker
    expect(node.next).toEqual([])
    // Verify no other node has an edge → plural_marker (wire-up is deferred)
    for (const [nodeId, n] of Object.entries(grammarGraph.nodes)) {
      const edge = (n.next || []).find(e => e.node === 'plural_marker')
      expect(edge, `${nodeId}.next should not yet point to plural_marker (wire-up is deferred)`).toBeUndefined()
    }
  })

  it('verb.ʻalu is tagged with plural_form "ō" and verb.haʻu with "ō mai"', () => {
    const verbWords = grammarGraph.nodes.verb.words
    const alu = verbWords.find(w => w.tongan === 'ʻalu')
    const hau = verbWords.find(w => w.tongan === 'haʻu')
    expect(alu).toBeDefined()
    expect(hau).toBeDefined()
    expect(alu.plural_form).toBe('ō')
    expect(hau.plural_form).toBe('ō mai')
  })

  it('verb.nofo is tagged with plural_form "nonofo" (spec §29 semantic shift: live together)', () => {
    const nofo = grammarGraph.nodes.verb.words.find(w => w.tongan === 'nofo')
    expect(nofo).toBeDefined()
    expect(nofo.plural_form).toBe('nonofo')
  })

  it('equational_noun.tamasiʻi → tamaiki and fefine → fafine (irregular noun plurals)', () => {
    const words = grammarGraph.nodes.equational_noun.words
    const tamasii = words.find(w => w.tongan === 'tamasiʻi')
    const fefine = words.find(w => w.tongan === 'fefine')
    expect(tamasii).toBeDefined()
    expect(fefine).toBeDefined()
    expect(tamasii.plural_form).toBe('tamaiki')
    expect(fefine.plural_form).toBe('fafine')
  })

  it('modifier_eq.lahi (size sense "big") is tagged with plural_form "lalahi" (disambiguates from quantifier "many")', () => {
    const lahi = grammarGraph.nodes.modifier_eq.words.find(w => w.tongan === 'lahi')
    expect(lahi).toBeDefined()
    expect(lahi.english).toBe('big') // guard: if this flips to "a lot" the plural_form must be re-evaluated
    expect(lahi.plural_form).toBe('lalahi')
  })
})

// ============================================================================
// Phase 2C.3e — §30 Directional particle slot
// ============================================================================
//
// Spec §30 introduces a post-verb directional slot with 6 words in two
// groups: person-oriented (mai / atu / ange) and physical (hake / hifo /
// holo). This slice lands the data wiring and flips the Docs.4 Rule 5
// placeholder test above from "directional node absent" to "directional
// node present + wired on verb.next".
//
// Shipped:
//   - directional node: 6 words (mai, atu, ange, hake, hifo, holo)
//   - verb.next gains an edge → directional (positioned before the object
//     edge to visually honor the spec §30 line 3713 slot-order rule)
//   - directional.next includes FINISH × 2 + object + time_word +
//     preposition so spec examples like `Naʻá ku ʻave mai ʻa e vala mei
//     he falé` (verb + directional + object + prep_phrase) walk
//     end-to-end
//   - Docs.4 EXTENSIONS catalog gains 1 row (default_taken)
//   - Docs.4 Rule 5 placeholder flipped
//
// Deferred (spec §30, documented on the directional node):
//   - pick-time slot-order enforcement ("directional must come before
//     object / prep_phrase / time_word") — walker behavior change
//   - verb_excludes_directionals array field for haʻu exception —
//     would require a new optional field in the schema allowlist
//   - ange homonymy disambiguation (ange = directional after an action
//     verb vs. comparative "more" after an adjective; Ch 27 / §31)
//   - emphatic command form with definitive accent on the directional
//     (ʻAlu hifó!) — Ch 44 / §46 phrasal accent system
describe('2C.3e — §30 directional particles', () => {
  it('Naʻa ku ʻalu hifo (verb + directional, terminal)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // verb has FINISH in its next → directional extension pushes a
    // sub-frame (same frame-push mechanism used for object, numeral,
    // etc. — see 2C.3a numeral test)
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hifo' })
    s = finishFrame(s) // pop directional → back into root frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku ʻalu hifo')
  })

  it('Naʻa ku lele mai (different verb + directional — ran toward speaker)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'lele' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'mai' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku lele mai')
  })

  it('Phase P close-out: directional slot is hidden after haʻu (haʻu takes NO directional)', () => {
    // Corrected spec §30 (SFA-024/042/043 family): haʻu never combines with a
    // directional particle — Churchward 27.4(v); Shumway L31 "one never says
    // haʻu mai". The walker would previously have offered the slot and let the
    // builder produce *haʻu mai. Gated by the `no_directional` tag on haʻu plus
    // the `verb_lacks_tag` condition on every edge into `directional`.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'haʻu' })
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'directional')).toBeUndefined()
  })

  it('Phase P close-out: directional slot still offered after ʻalu (control for the haʻu gate)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'directional')).toBeDefined()
  })

  it('directional node has all 6 spec §30 words with correct group tags', () => {
    const node = grammarGraph.nodes.directional
    expect(node).toBeDefined()
    const tongans = node.words.map(w => w.tongan)
    expect(tongans).toEqual(['mai', 'atu', 'ange', 'hake', 'hifo', 'holo'])
    const byTongan = Object.fromEntries(node.words.map(w => [w.tongan, w]))
    for (const person of ['mai', 'atu', 'ange']) {
      expect(byTongan[person].tags, `${person} tags`).toContain('directional')
      expect(byTongan[person].tags, `${person} tags`).toContain('person_oriented')
      expect(byTongan[person].min_chapter).toBe(28)
    }
    for (const physical of ['hake', 'hifo', 'holo']) {
      expect(byTongan[physical].tags, `${physical} tags`).toContain('directional')
      expect(byTongan[physical].tags, `${physical} tags`).toContain('physical')
      expect(byTongan[physical].min_chapter).toBe(28)
    }
  })

  it('directional.next allows FINISH + object + time_word + preposition (post-directional continuations)', () => {
    const node = grammarGraph.nodes.directional
    const targets = node.next.map(e => e.node)
    expect(targets).toContain('FINISH_STATEMENT')
    expect(targets).toContain('FINISH_QUESTION')
    expect(targets).toContain('object')
    expect(targets).toContain('time_word')
    expect(targets).toContain('preposition')
    // The object edge must still carry the transitive gate per Rule 4.
    const objectEdge = node.next.find(e => e.node === 'object')
    expect(objectEdge.condition).toEqual({ type: 'verb_has_tag', tag: 'transitive' })
  })

  it('verb.next has the directional edge (Rule 5 wire confirmed)', () => {
    const verbEdges = grammarGraph.nodes.verb.next.map(e => e.node)
    expect(verbEdges).toContain('directional')
  })
})

// ============================================================================
// Phase 2C.4a — §31 Comparison and Degree (Ch 27)
// ============================================================================
//
// Spec §31 adds the post-adjective comparative (`adj + ange`) and superlative
// (`adj + taha`) slots. Both are data-additive sibling extensions on verb.next,
// gated on `verb_has_tag: adjective` so they only show up after a stative /
// adjective verb. `comparative_ange.next` allows FINISH × 2 plus an optional
// `preposition` continuation for the standard 'than X' ʻi-phrase (reuses the
// existing preposition → prep_phrase chain with noun-class auto-rendering per
// Rule 3). `superlative_taha.next` is terminal — spec §31 line 3843 documents
// that the superlative does not take a 'than' phrase.
//
// Shipped:
//   - comparative_ange node: single word `ange`, next = FINISH + preposition
//   - superlative_taha node: single word `taha`, next = FINISH only
//   - verb.next gains two new edges with verb_has_tag:adjective gate
//   - Docs.4 catalog gains 2 EXTENSIONS rows (semi_terminal + terminal)
//
// Deferred (documented in node descriptions):
//   - comparison modifiers (kiʻi / fuʻu / toe wrapping the adjective)
//   - requires_lahi_in_comparative boolean (ʻita → ʻita lahi ange)
//   - tatau mo / fai kehekehe mo same/different constructions
//   - meimei / mei / matuʻaki preposed intensifiers
//   - hangē comparison clauses
//   - ʻangeʻange / laka ʻi surpass verbs (translator word-order swap)
//   - huanoa / lahi pē / tautefito ki discourse connectors
//   - ange homonymy pick-time disambiguation between §30 directional and
//     §31 comparative (both offered after an adjective because directional
//     is currently ungated — the user picks)
describe('2C.4a — §31 comparative + superlative (ange / taha)', () => {
  it('ʻOku ou helaʻia ange (comparative after adjective — I am more tired)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'helaʻia' })
    s = takeExtension(s, 'comparative_ange')
    s = advanceInFrame(s, { tongan: 'ange' })
    s = finishFrame(s) // pop comparative_ange → root frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ou helaʻia ange')
  })

  it('ʻOku ou helaʻia taha (superlative after adjective — I am the most tired)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'helaʻia' })
    s = takeExtension(s, 'superlative_taha')
    s = advanceInFrame(s, { tongan: 'taha' })
    s = finishFrame(s) // pop superlative_taha → root frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ou helaʻia taha')
  })

  it('comparative_ange node has the single word `ange` tagged comparative', () => {
    const node = grammarGraph.nodes.comparative_ange
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    const [word] = node.words
    expect(word.tongan).toBe('ange')
    expect(word.min_chapter).toBe(27)
    expect(word.tags).toContain('comparative')
  })

  it('superlative_taha node has the single word `taha` tagged superlative', () => {
    const node = grammarGraph.nodes.superlative_taha
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    const [word] = node.words
    expect(word.tongan).toBe('taha')
    expect(word.min_chapter).toBe(27)
    expect(word.tags).toContain('superlative')
  })

  it('comparative_ange.next allows FINISH + preposition + focus_marker (for the ʻi-than phrase or noun-subject path)', () => {
    const targets = grammarGraph.nodes.comparative_ange.next.map(e => e.node).sort()
    expect(targets).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT', 'focus_marker', 'preposition'])
  })

  it('superlative_taha.next allows FINISH + focus_marker (for noun-subject path)', () => {
    const targets = grammarGraph.nodes.superlative_taha.next.map(e => e.node).sort()
    expect(targets).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT', 'focus_marker'])
  })

  it('verb.next exposes both new edges with the adjective gate', () => {
    const verbEdges = grammarGraph.nodes.verb.next
    const compEdge = verbEdges.find(e => e.node === 'comparative_ange')
    const superEdge = verbEdges.find(e => e.node === 'superlative_taha')
    expect(compEdge, 'verb.next missing comparative_ange edge').toBeDefined()
    expect(superEdge, 'verb.next missing superlative_taha edge').toBeDefined()
    // P1-B4 follow-up #1: comparative/superlative now AND-compose the adjective
    // gate with the no_emphatic_yet VP-internal-order gate (array condition), so
    // `lelei ange au`/`lelei taha au` build but `… au ange`/`… au taha` do not.
    expect(compEdge.condition).toEqual([{ type: 'verb_has_tag', tag: 'adjective' }, { type: 'no_emphatic_yet' }])
    expect(superEdge.condition).toEqual([{ type: 'verb_has_tag', tag: 'adjective' }, { type: 'no_emphatic_yet' }])
    expect(compEdge.min_chapter).toBe(27)
    expect(superEdge.min_chapter).toBe(27)
  })
})

// ============================================================================
// Phase 2C.4b — §32 Existential Expressions (Ch 31)
// ============================================================================
//
// Spec §32 introduces a new `existential` entry point for "there is / there
// isn't" constructions. The shape is:
//
//   ʻoku + ʻi ai + ha + noun + (ʻi + location)?
//
// Negated:
//
//   ʻoku + ʻikai ke + ʻi ai + ha + noun + (ʻi + location)?
//
// Spec §32 fixes the indefinite `ha` (the speaker is asking whether something
// exists, not pointing to a specific one), documents that the past TM is
// `naʻe` (not `naʻa`) and the future is `ʻe` (not `te`) because the next word
// is the verb-like `ʻi ai`, and requires `ʻikai ke` (not `ʻikai te`) in the
// negation for the same reason (same rule §14 noun-subject uses).
//
// Shipped:
//   - existential entry point (category: Statements, min_chapter: 31,
//     allowed_terminators: [FINISH_STATEMENT, FINISH_QUESTION])
//   - existential_head node: 8 compound word entries (4 affirmative tense
//     variants + 4 negated variants) with TM + ʻi ai + ha baked in
//     (or TM + ʻikai ke + ʻi ai + ha for the negated forms). Same
//     compound-form trick 2C.3a / 2C.3b / 2C.3c use elsewhere.
//   - existential_noun node: 6 common nouns from spec §32 examples
//     (tangata, fefine, taha, vaka, kātoanga, meʻakai), tagged noun_class:
//     common + animacy + possessive_class so the 2B invariants hold.
//     next = FINISH × 2 + preposition + time_word so the location
//     continuation walks through the existing preposition → prep_phrase
//     chain with Rule 3 noun-class auto-rendering.
//   - Docs.4 MATRIX_ENTRY_POINTS catalog gains 1 row for `existential`
//     (status: present, section: §32).
//
// No walker / schema / translator changes — new entry point + nodes
// reuse existing fields (tongan, english, min_chapter, tags, noun_class,
// animacy, possessive_class, required), no new condition types, the 2B
// tagging fields are already in the schema allowlist.
//
// Deferred (documented on each node's description field):
//   - `ʻIo, ʻoku ʻi ai` short-form affirmative answer (drops the noun
//     completely — needs a FINISH-after-head shape)
//   - `foʻi` classifier preposed on the noun (`ha foʻi niu` = a single
//     coconut) — needs takes_fo_i_classifier flag + preposed slot
//   - `ka ʻi ai` = whenever there is conditional (spec §32 awareness,
//     resolves in §44 Ch 47)
//   - existential + relative clause (`ʻOku ʻi ai ha tangata ʻokú ne
//     ngāue heni`) — needs §35 relative_clause_extension
//   - `existential_compatible` filter on the main noun lists (reuse
//     vs hand-pick)
//   - `ʻaki` instrumental back-reference (spec §32 awareness, belongs
//     to §38 Ch 33)
describe('2C.4b — §32 existential expressions (ʻoku ʻi ai ha)', () => {
  it('ʻOku ʻi ai ha tangata (present affirmative — there is a man)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'tangata' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai ha tangata')
  })

  it('Naʻe ʻi ai ha vaka (past affirmative — there was a boat)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻe ʻi ai ha vaka')
  })

  it('ʻE ʻi ai ha kātoanga (future affirmative — there will be a celebration)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻE ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'kātoanga' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻE ʻi ai ha kātoanga')
  })

  it('ʻOku ʻikai ke ʻi ai ha taha (present negated — there is no one)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻikai ke ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'taha' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai ke ʻi ai ha taha')
  })

  it('ʻOku ʻi ai ha tangata ʻi heni (with location — there is a man here)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'tangata' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'heni' })
    s = finishFrame(s) // pop preposition/prep_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai ha tangata ʻi heni')
  })

  it('existential_head has all 8 compound entries with affirmative / negated tags', () => {
    const node = grammarGraph.nodes.existential_head
    expect(node).toBeDefined()
    const tongans = node.words.map(w => w.tongan)
    expect(tongans).toEqual([
      'ʻOku ʻi ai ha', 'Naʻe ʻi ai ha', 'Kuo ʻi ai ha', 'ʻE ʻi ai ha',
      'ʻOku ʻikai ke ʻi ai ha', 'Naʻe ʻikai ke ʻi ai ha',
      'Kuo ʻikai ke ʻi ai ha', 'ʻE ʻikai ke ʻi ai ha',
    ])
    for (const w of node.words) {
      expect(w.tags, `${w.tongan} tags`).toContain('existential_head')
      expect(w.min_chapter).toBe(31)
    }
    // First 4 are affirmative, next 4 are negated
    for (const w of node.words.slice(0, 4)) {
      expect(w.tags, `${w.tongan} should be affirmative`).toContain('affirmative')
    }
    for (const w of node.words.slice(4)) {
      expect(w.tags, `${w.tongan} should be negated`).toContain('negated')
    }
  })

  it('existential_head.next is a single required_next to existential_noun', () => {
    const node = grammarGraph.nodes.existential_head
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('existential_noun')
    expect(node.next[0].required).toBe(true)
  })

  it('existential_noun common nouns all have noun_class + animacy + possessive_class tagged', () => {
    const node = grammarGraph.nodes.existential_noun
    expect(node).toBeDefined()
    // Core six from the original §32 slice still present; broader vocab
    // (professions, family, animals, vehicles) was added to give student
    // expressions like "Is there a doctor?" / "Is there a dog?" somewhere
    // to land. The invariants below (field presence + valid enum values)
    // still hold across the full list.
    const tongans = node.words.map(w => w.tongan)
    for (const required of ['fefine', 'kātoanga', 'meʻakai', 'taha', 'tangata', 'vaka']) {
      expect(tongans, `core §32 noun missing: ${required}`).toContain(required)
    }
    for (const w of node.words) {
      expect(w.noun_class, `${w.tongan} noun_class`).toBe('common')
      expect(['person', 'thing', 'animal'], `${w.tongan} animacy`).toContain(w.animacy)
      expect(['e_class', 'ho_class'], `${w.tongan} possessive_class`).toContain(w.possessive_class)
    }
  })

  it('existential_noun.next allows FINISH + preposition + time_word + attributive_adjective + ke/koeʻuhi ke purpose clauses', () => {
    const targets = grammarGraph.nodes.existential_noun.next.map(e => e.node).sort()
    expect(targets).toEqual([
      'FINISH_QUESTION', 'FINISH_STATEMENT', 'attributive_adjective', 'preposition',
      'subordinator_ke_purpose', 'subordinator_koeuhi_ke', 'time_word',
    ].sort())
  })

  it('existential entry point is registered with min_chapter 31 and Statement terminators', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'existential')
    expect(ep, 'existential entry point missing from grammar-graph.json').toBeDefined()
    expect(ep.category).toBe('Statements')
    expect(ep.min_chapter).toBe(31)
    expect(ep.start_node).toBe('existential_head')
    expect(ep.allowed_terminators).toEqual(['FINISH_STATEMENT', 'FINISH_QUESTION'])
  })
})

// ============================================================================
// Phase 2C.4c — §33 Adjectives and Compound Adjectives (Ch 35)
// ============================================================================
//
// Spec §33 formalizes the postposed attributive adjective slot that earlier
// sections (§21 Equational, §29 Plural, §31 Comparison) have been using
// informally. The Tongan position is AFTER the noun:
//
//   (article) + noun + adjective
//
// e.g. `ha meʻa lahi` = a big thing, `ha fale foʻou` = a new house,
//      `ha tangata mālohi` = a strong man, `ha tohi foʻou` = a new book
//
// — opposite of English word order. Spec §33 also covers the preposed
// closed-list adjectives (`fuʻu`, `kiʻi`, `ʻuluaki`, `muʻaki`, `toe`), double
// adjectives for emphasis, the `fuʻu` three-way homonymy, colors, three
// compound-adjective patterns, and the `loto` emotional-state compounds. All
// of those are DELIBERATELY deferred in this slice — the minimum shipping bar
// is the postposed attributive slot on a noun-bearing node.
//
// Shipped:
//   - attributive_adjective node: 7 common postposed adjectives (lahi, siʻi,
//     foʻou, kovi, lelei, masiva, mālohi) each tagged `adjective` + `postposed`.
//     Semi-terminal: next = FINISH × 2 + time_word, so the time-word
//     continuation chain still works.
//   - prep_phrase.next → attributive_adjective extension edge: covers
//     `ʻOku ou ʻi ha fale foʻou` = I am in a new house, picked via the
//     preposition → prep_phrase sub-walk.
//   - existential_noun.next → attributive_adjective extension edge: covers
//     `ʻOku ʻi ai ha vaka lahi` = there is a big boat, picked from the 2C.4b
//     existential chain.
//   - Docs.4 catalog gains 2 EXTENSIONS rows (one per parent), both
//     semi_terminal with extra_allowed: ['time_word']
//
// No walker / schema / translator changes — new node reuses existing fields
// (tongan, english, min_chapter, tags), no new condition types, no new entry
// points. Tag-based identification (`tags: [adjective, postposed]`) is
// preferred over a new `adjective_position` boolean field per the §33 schema-
// additions note, since the current slice only needs to identify postposed
// adjectives and the preposed closed-list is deferred.
//
// Deferred (documented on the node's description field):
//   - preposed closed-list adjectives (fuʻu / kiʻi / ʻuluaki / muʻaki / toe)
//     — different slot, needs a pre-noun adjective slot on every noun-bearing
//     node (spec §33 line 4287)
//   - double adjectives (preposed + postposed for emphasis, `ha fuʻu meʻa lahi`
//     = a great big thing, spec §33 line 4339) — blocked on the preposed slot
//   - fuʻu three-way homonymy: preposed adjective / size intensifier / tree
//     classifier (spec §33 line 4358)
//   - color words as both noun and postposed adjective + the definitive-accent
//     interaction in definite noun phrases (spec §33 line 4385)
//   - compound adjectives — three patterns (noun+adj, verb+noun, verb+adverb)
//     — needs compound_adjective + parts schema fields (spec §33 line 4420)
//   - loto compounds for emotional states (loto lelei / loto mamahi / loto
//     toʻa / loto lahi / loto ʻofa / loto kovi / loto foʻi) — need a
//     loto_compound flag and live in BOTH postposed and verb slots (spec §33
//     line 4479)
//   - adjective ordering when multiple postposed adjectives stack (spec §33
//     line 4506 — adjective_order_priority field)
//   - attachment to other noun-bearing nodes beyond prep_phrase and
//     existential_noun (object, equational_noun, possessive_head_noun,
//     object_phrase_cleft, companion, etc.)
//   - takes_fuʻu_classifier boolean flag for plant nouns (parallel to 2C.4b's
//     takes_foʻi_classifier awareness item)
//   - irregular plural adjective forms (`lalahi` for `lahi`, `iiki` for `siʻi`)
//     — 2C.3d tagged these on modifier_eq but attributive_adjective entries
//     do NOT carry plural_form yet (added when plural_marker wires up)
describe('2C.4c — §33 attributive adjective slot (postposed)', () => {
  it('ʻOku ʻi ai ha vaka lahi (existential + postposed adjective — there is a big boat)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = takeExtension(s, 'attributive_adjective')
    s = advanceInFrame(s, { tongan: 'lahi' })
    s = finishFrame(s) // pop attributive_adjective
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai ha vaka lahi')
  })

  it('Naʻe ʻi ai ha tangata mālohi (existential + postposed mālohi — there was a strong man)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'tangata' })
    s = takeExtension(s, 'attributive_adjective')
    s = advanceInFrame(s, { tongan: 'mālohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻe ʻi ai ha tangata mālohi')
  })

  it('ʻE ʻi ai ha kātoanga lelei (future existential + lelei — there will be a good celebration)', () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻE ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'kātoanga' })
    s = takeExtension(s, 'attributive_adjective')
    s = advanceInFrame(s, { tongan: 'lelei' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻE ʻi ai ha kātoanga lelei')
  })

  it('attributive_adjective node has 7 common postposed adjectives tagged [adjective, postposed]', () => {
    const node = grammarGraph.nodes.attributive_adjective
    expect(node).toBeDefined()
    const tongans = node.words.map(w => w.tongan).sort()
    expect(tongans).toEqual(['foʻou', 'kovi', 'lahi', 'lelei', 'masiva', 'mālohi', 'siʻi'])
    for (const w of node.words) {
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(35)
      expect(w.tags, `${w.tongan} tags should include 'adjective'`).toContain('adjective')
      expect(w.tags, `${w.tongan} tags should include 'postposed'`).toContain('postposed')
    }
  })

  it('attributive_adjective.next is semi-terminal — FINISH × 2 + time_word only', () => {
    const targets = grammarGraph.nodes.attributive_adjective.next.map(e => e.node).sort()
    expect(targets).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT', 'time_word'])
  })

  it('prep_phrase.next exposes attributive_adjective with no condition (every noun-bearing parent offers it unconditionally)', () => {
    const edge = grammarGraph.nodes.prep_phrase.next.find(e => e.node === 'attributive_adjective')
    expect(edge, 'prep_phrase.next missing attributive_adjective edge').toBeDefined()
    expect(edge.min_chapter).toBe(35)
    expect(edge.condition).toBeUndefined()
    expect(edge.child_entry_point).toBeUndefined()
  })

  it('existential_noun.next exposes attributive_adjective with no condition (stretch target — 2C.4b chain)', () => {
    const edge = grammarGraph.nodes.existential_noun.next.find(e => e.node === 'attributive_adjective')
    expect(edge, 'existential_noun.next missing attributive_adjective edge').toBeDefined()
    expect(edge.min_chapter).toBe(35)
    expect(edge.condition).toBeUndefined()
    expect(edge.child_entry_point).toBeUndefined()
  })

  it('attributive_adjective is NOT attached to verb.next (postposed slot is strictly on noun-bearing nodes, not the verb slot — deferred for §33 stative-verb overlap)', () => {
    const verbEdges = grammarGraph.nodes.verb.next.map(e => e.node)
    expect(verbEdges).not.toContain('attributive_adjective')
  })

  it('preposed closed-list adjectives (fuʻu / kiʻi / ʻuluaki / muʻaki / toe) are NOT in attributive_adjective words — they live in a deferred preposed slot per spec §33 line 4287', () => {
    const tongans = grammarGraph.nodes.attributive_adjective.words.map(w => w.tongan)
    for (const preposed of ['fuʻu', 'kiʻi', 'ʻuluaki', 'muʻaki', 'toe']) {
      expect(
        tongans,
        `${preposed} is a preposed closed-list adjective (spec §33 line 4287) and must not appear in the postposed attributive_adjective node — this guard fires if a future slice accidentally mixes the two slots`,
      ).not.toContain(preposed)
    }
  })
})

// ============================================================================
// Phase 2C.4d — §34 Warnings, Hopes, Permissions, and Uncertainty (Ch 38)
// ============================================================================
//
// Spec §34 is a grab-bag of small `ke`-subordinator constructions. The common
// thread is a fixed-phrase head followed by `ke + (pronoun?) + verb`, reusing
// the 2C.3c obligation_pronoun paradigm. The minimum 2C.4d shipping bar picks
// the two cleanest: `tuku ke` permission ("let / allow") and `ʻofa ke` /
// `ʻofa pē ke` optative ("may / I hope that"). Both are new user-facing entry
// points; everything else in §34 (warnings `naʻa` / `telia naʻa`, uncertainty
// `mahalo pē ke`, urge `fai mo ke`, postposed adverbs `nai` / `ʻapē` / `koā`,
// respect `telia` without `naʻa`, the three-way `naʻa` disambiguation, the
// `ʻofa pē` + indicative TM sub-pattern, the formal `tauange ke`) is punted to
// 2C.4d-2 or a later slice.
//
// Shipped:
//   - permission_tuku_ke entry point → tuku_ke_phrase → (obligation_pronoun?) → verb
//     (tuku_ke_phrase has 1 compound entry: `Tuku ke`; both paradigm paths are
//     non-required so the pronoun slot is structurally OPTIONAL, unlike
//     obligation_should / obligation_must where the pronoun is required)
//   - optative_ofa_ke entry point → ofa_ke_phrase → (obligation_pronoun?) → verb
//     (ofa_ke_phrase has 2 compound entries: `ʻOfa ke` plain and `ʻOfa pē ke`
//     with the warmer `pē` intensifier baked in)
//   - obligation_pronoun node gains `mou` (2pl) to close the 2C.3c deferral —
//     required by spec §34 `ʻOfa pē ke mou fiefia` = may you all be happy;
//     min_chapter 38 on the new word marks it as the 2C.4d slice addition.
//   - Docs.4 MATRIX_ENTRY_POINTS gains 2 'present' rows
//
// Reused (no changes to these):
//   - obligation_pronoun.next = required_next to verb
//   - verb.next chain (FINISH × 2 + directional + object + time_word + …)
//
// No walker / schema / translator changes — new entry_points + nodes reuse
// existing fields (tongan / english / min_chapter / tags), no new condition
// types, no new schema fields. Tag-based identification (`tags:
// [permission_head]` / `[optative_head]`) is preferred over a new
// `entry_point_family` enum per the §34 schema-additions note.
//
// Deferred (spec §34, documented on the node description fields and in the
// permission_tuku_ke / optative_ofa_ke entry point descriptions):
//   - Warning `naʻa` / `telia naʻa` — spec §34 shape is "command + naʻa +
//     clause", a clause-final connector, not a fixed head; awaits a new
//     sub-walk shape and the three-way `naʻa` disambiguation
//     (TM vs warning vs uncertainty by syntactic position)
//   - Uncertainty `naʻa kuo …` / `mahalo pē ke` — clause-initial `naʻa` and
//     the optional `pē` in `mahalo pē ke` are separate structural shapes
//   - Urging speed `fai mo ke + verb` and the inclusive `fai mo tau ō`
//     variant — new entry point with a three-way ke/tau/mou paradigm selection
//   - Postposed uncertainty adverbs `nai` / `ʻapē` / `koā` — spec §34 new
//     `clause_final_adverb` slot on every verb-bearing entry point, plus the
//     `forbidden_after_interrogative` flag on `ʻapē`
//   - Respect `telia` (without `naʻa`) — a new preposition taking `ʻa` / `ʻo`
//     + name, opposite role from the warning `telia naʻa` compound
//   - `ʻofa pē` + indicative tense marker sub-pattern (`ʻOfa pē ʻoku ʻikai
//     puke`, `ʻOfa pē kuo nau aʻu ki ai`, `ʻOfa pē té ne foki leleí mai`) —
//     different head shape (points at tense_marker not at the ke paradigm),
//     needs its own `ofa_pe_indicative` entry point
//   - Formal hortative variant `tauange ke` — same shape as optative_ofa_ke
//     but awaits a `register: formal` schema field
//   - Awareness item `tokaange pē` positive-prediction adverb
//   - Post-verb name-subject slot (`Tuku ke ʻalu ʻa e fefiné`, `ʻOfa ke moʻui
//     lelei ʻa e fonuá ni`) — same §14/§16 verb-first noun-subject deferral
//     that obligation_should / obligation_must carry
//   - Negative permission composition `ʻOua te mou tuku ke lele noaʻia ʻa e
//     fanga puaká` — needs an entry-point-inside-entry-point composition
//     mechanism between §6 prohibition and §34 permission
describe('2C.4d — §34 permission tuku ke + optative ʻofa ke', () => {
  // Walker mechanics note: tuku_ke_phrase and ofa_ke_phrase each have TWO
  // non-required next edges (obligation_pronoun + verb) and no FINISH edge,
  // so after advanceInFrame(head) the frame drops into IN_PROGRESS and the
  // user picks the branch via the extension menu. takeExtension in this
  // shape is in "branching mode" (no FINISH on the anchor), which
  // inline-transitions the current frame to the picked target rather than
  // pushing a sub-frame — same mechanism the obligation_pronoun.next linear
  // chain relies on post-takeExtension. This is why we use takeExtension to
  // step from the fixed head to the next node, not advanceInFrame.
  it('Tuku ke u ako (permission + 1sg pronoun u — let me study)', () => {
    let s = createWalkerState('permission_tuku_ke', 999)
    s = advanceInFrame(s, { tongan: 'Tuku ke' })
    s = takeExtension(s, 'obligation_pronoun')
    s = advanceInFrame(s, { tongan: 'u' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Tuku ke u ako')
  })

  it('Tuku ke ke nofo (permission + 2sg pronoun ke — let you stay, doubled ke ke shape)', () => {
    let s = createWalkerState('permission_tuku_ke', 999)
    s = advanceInFrame(s, { tongan: 'Tuku ke' })
    s = takeExtension(s, 'obligation_pronoun')
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'nofo' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Tuku ke ke nofo')
  })

  it('Tuku ke ʻalu (permission, pronoun-less path — let [someone] go)', () => {
    let s = createWalkerState('permission_tuku_ke', 999)
    s = advanceInFrame(s, { tongan: 'Tuku ke' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Tuku ke ʻalu')
  })

  it('ʻOfa ke u fiefia (optative plain + 1sg — may I be happy)', () => {
    let s = createWalkerState('optative_ofa_ke', 999)
    s = advanceInFrame(s, { tongan: 'ʻOfa ke' })
    s = takeExtension(s, 'obligation_pronoun')
    s = advanceInFrame(s, { tongan: 'u' })
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOfa ke u fiefia')
  })

  it('ʻOfa pē ke mou fiefia (optative warmer + 2pl mou — may you all be happy)', () => {
    let s = createWalkerState('optative_ofa_ke', 999)
    s = advanceInFrame(s, { tongan: 'ʻOfa pē ke' })
    s = takeExtension(s, 'obligation_pronoun')
    s = advanceInFrame(s, { tongan: 'mou' })
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOfa pē ke mou fiefia')
  })

  it('ʻOfa ke hiva (optative pronoun-less path — may [someone] sing)', () => {
    let s = createWalkerState('optative_ofa_ke', 999)
    s = advanceInFrame(s, { tongan: 'ʻOfa ke' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOfa ke hiva')
  })

  it('tuku_ke_phrase has 1 compound entry and two non-required next edges (obligation_pronoun + verb)', () => {
    const node = grammarGraph.nodes.tuku_ke_phrase
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    expect(node.words[0].tongan).toBe('Tuku ke')
    expect(node.words[0].min_chapter).toBe(38)
    expect(node.words[0].tags).toContain('permission_head')
    const targets = node.next.map(e => e.node).sort()
    expect(targets).toEqual(['obligation_pronoun', 'verb'])
    // Neither path is required — the pronoun slot is OPTIONAL, unlike
    // obligation_should / obligation_must where obligation_pronoun is required.
    for (const edge of node.next) {
      expect(edge.required, `${edge.node} must NOT be required`).toBeUndefined()
      expect(edge.condition).toBeUndefined()
      expect(edge.child_entry_point).toBeUndefined()
    }
  })

  it('ofa_ke_phrase has 2 compound entries (ʻOfa ke plain + ʻOfa pē ke warmer) and two non-required next edges', () => {
    const node = grammarGraph.nodes.ofa_ke_phrase
    expect(node).toBeDefined()
    expect(node.words.map(w => w.tongan)).toEqual(['ʻOfa ke', 'ʻOfa pē ke'])
    for (const w of node.words) {
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(38)
      expect(w.tags, `${w.tongan} tags should include 'optative_head'`).toContain('optative_head')
    }
    const targets = node.next.map(e => e.node).sort()
    expect(targets).toEqual(['obligation_pronoun', 'verb'])
    for (const edge of node.next) {
      expect(edge.required, `${edge.node} must NOT be required`).toBeUndefined()
      expect(edge.condition).toBeUndefined()
      expect(edge.child_entry_point).toBeUndefined()
    }
  })

  it('obligation_pronoun.mou is the 2C.4d addition (person 2, number plural, min_chapter 38)', () => {
    const mou = grammarGraph.nodes.obligation_pronoun.words.find(w => w.tongan === 'mou')
    expect(mou, 'mou must exist in obligation_pronoun after 2C.4d — spec §34 ʻOfa pē ke mou fiefia requires it').toBeDefined()
    expect(mou.person).toBe(2)
    expect(mou.number).toBe('plural')
    expect(mou.min_chapter).toBe(38)
  })

  it('permission_tuku_ke and optative_ofa_ke entry points are registered with spec §34 metadata', () => {
    const byId = Object.fromEntries(grammarGraph.entry_points.map(ep => [ep.id, ep]))
    const tuku = byId['permission_tuku_ke']
    expect(tuku, 'permission_tuku_ke missing').toBeDefined()
    expect(tuku.category).toBe('Commands')
    expect(tuku.min_chapter).toBe(38)
    expect(tuku.start_node).toBe('tuku_ke_phrase')
    expect(tuku.allowed_terminators).toEqual(['FINISH_STATEMENT'])

    const ofa = byId['optative_ofa_ke']
    expect(ofa, 'optative_ofa_ke missing').toBeDefined()
    expect(ofa.category).toBe('Statements')
    expect(ofa.min_chapter).toBe(38)
    expect(ofa.start_node).toBe('ofa_ke_phrase')
    expect(ofa.allowed_terminators).toEqual(['FINISH_STATEMENT'])
  })

  it('deferred §34 constructions have no nodes yet: warning_naa, uncertainty_naa, fai_mo_ke, telia_naa, telia_respect, ofa_pe_indicative, tauange_ke, nai/ʻapē/koā postposed adverbs', () => {
    // Guard: if a future slice adds any of these nodes, this test fires so the
    // 2C.4d deferral list can be pruned and the Docs.4 catalog updated.
    const nodeIds = new Set(Object.keys(grammarGraph.nodes))
    for (const deferred of [
      'warning_naa',
      'uncertainty_naa',
      'telia_naa',
      'telia_respect',
      'fai_mo_ke_phrase',
      'ofa_pe_indicative_head',
      'tauange_ke_phrase',
      'clause_final_adverb',
    ]) {
      expect(
        nodeIds.has(deferred),
        `${deferred} is documented as deferred in the 2C.4d slice; if it has been added, update the 2C.4d deferral list in grammar-graph.json and this guard`,
      ).toBe(false)
    }
  })
})

// Phase 2C.4e — §35 Full Demonstrative Grid + Emphatic Discourse Particles (Ch 39)
// ============================================================================
//
// Spec §35 has three distinct constructions: (1) the full 4×4 demonstrative
// grid (enclitic, pronoun, prep_object, manner × 1st_near_me, 2nd_near_you,
// pointing, 3rd_mentioned — 12 populated cells, 4 structurally empty), (2) two
// emphatic discourse expressions: naʻa mo (even) and kaeʻumaʻa (and also),
// (3) ai as a relative-clause connector with ki ai / mei ai back-reference
// form-selection. This slice ships pieces 1 and 2 only; piece 3 is deferred
// to 2C.4e-2.
//
// Shipped:
//   - demonstrative_grid reference node: all 12 forms from the 4×4 grid with
//     tags for function (enclitic/pronoun/prep_object/manner) and person
//     (1st_near_me/2nd_near_you/pointing/3rd_mentioned). Reference data only,
//     not wired as an extension. Follows the 2C.3d plural_marker precedent.
//   - emphatic_discourse reference node: naʻa mo (bare, before personal nouns
//     / pronouns), naʻa mo e (with article, before common nouns), kaeʻumaʻa
//     (and also / not to mention). Reference data only, not wired.
//   - ia added to existing demonstrative node (min_chapter 39) — completes
//     the pronoun row of the 4×4 grid. Earlier chapters only had ʻeni/ʻena/ē;
//     Ch 39 formalizes ia as the "mentioned (3rd)" demonstrative pronoun.
//   - No new entry points, no new schema fields, no walker changes.
//
// Deferred (spec §35, documented on the node description fields):
//   - relative_clause_extension with ai/ki ai/mei ai (2C.4e-2 — needs
//     recursive sub-walk with preposition back-reference pick-time rendering)
//   - koʻeni + day-of-week temporal specifier (needs day_of_week flag)
//   - eni as adverbial "now" (distinct from pronoun demonstrative)
//   - enclitic accent-shift render pass (ni/na trigger accent on preceding
//     noun — data is present but render logic is deferred)
//   - manner demonstrative pehē / verb pehē disambiguation (same spelling,
//     different POS — needs §39 verb pehē to land first)
//   - wiring demonstrative_grid as extension edges on noun-bearing nodes
//     (same article/noun split refactor that plural_marker wiring needs)
//   - wiring naʻa mo / kaeʻumaʻa as clause-initial/coordinator extensions
describe('2C.4e — §35 full demonstrative grid + emphatic discourse', () => {

  it('demonstrative_grid node exists with 12 words and next = []', () => {
    const node = grammarGraph.nodes.demonstrative_grid
    expect(node, 'demonstrative_grid must exist per spec §35 4×4 grid').toBeDefined()
    expect(node.words).toHaveLength(12)
    expect(node.next).toEqual([])
  })

  it('demonstrative_grid has all 4 function rows tagged correctly', () => {
    const words = grammarGraph.nodes.demonstrative_grid.words
    const functions = new Set(words.flatMap(w => w.tags.filter(t => ['enclitic', 'pronoun', 'prep_object', 'manner'].includes(t))))
    expect([...functions].sort()).toEqual(['enclitic', 'manner', 'prep_object', 'pronoun'])
  })

  it('demonstrative_grid has all 4 person columns tagged correctly', () => {
    const words = grammarGraph.nodes.demonstrative_grid.words
    const persons = new Set(words.flatMap(w => w.tags.filter(t => ['1st_near_me', '2nd_near_you', 'pointing', '3rd_mentioned'].includes(t))))
    expect([...persons].sort()).toEqual(['1st_near_me', '2nd_near_you', '3rd_mentioned', 'pointing'])
  })

  it('demonstrative_grid enclitics are ni (1st) and na (2nd) at min_chapter 6', () => {
    const words = grammarGraph.nodes.demonstrative_grid.words
    const enclitics = words.filter(w => w.tags.includes('enclitic'))
    expect(enclitics).toHaveLength(2)
    expect(enclitics.map(w => w.tongan).sort()).toEqual(['na', 'ni'])
    for (const e of enclitics) {
      expect(e.min_chapter).toBe(6)
    }
  })

  it('demonstrative_grid pronouns are ʻeni, ʻena, ē, ia', () => {
    const words = grammarGraph.nodes.demonstrative_grid.words
    const pronouns = words.filter(w => w.tags.includes('pronoun'))
    expect(pronouns).toHaveLength(4)
    expect(pronouns.map(w => w.tongan).sort()).toEqual(['ia', 'ē', 'ʻena', 'ʻeni'])
  })

  it('demonstrative_grid manner forms are peheni, pehena, pehē at min_chapter 39', () => {
    const words = grammarGraph.nodes.demonstrative_grid.words
    const manner = words.filter(w => w.tags.includes('manner'))
    expect(manner).toHaveLength(3)
    expect(new Set(manner.map(w => w.tongan))).toEqual(new Set(['peheni', 'pehena', 'pehē']))
    for (const m of manner) {
      expect(m.min_chapter).toBe(39)
    }
  })

  it('demonstrative node now includes ia (min_chapter 39) alongside ʻeni/ʻena/ē', () => {
    const words = grammarGraph.nodes.demonstrative.words
    const ia = words.find(w => w.tongan === 'ia')
    expect(ia, 'ia must be on the demonstrative node to complete the pronoun row per spec §35').toBeDefined()
    expect(ia.min_chapter).toBe(39)
    expect(ia.english).toBe('that (mentioned)')
  })

  it('emphatic_discourse node exists with 3 words (naʻa mo, naʻa mo e, kaeʻumaʻa) and next = []', () => {
    const node = grammarGraph.nodes.emphatic_discourse
    expect(node, 'emphatic_discourse must exist per spec §35 naʻa mo + kaeʻumaʻa').toBeDefined()
    expect(node.words).toHaveLength(3)
    expect(node.next).toEqual([])
    const tongans = node.words.map(w => w.tongan).sort()
    expect(tongans).toEqual(['kaeʻumaʻa', 'naʻa mo', 'naʻa mo e'])
  })

  it('emphatic_discourse words are all min_chapter 39', () => {
    for (const w of grammarGraph.nodes.emphatic_discourse.words) {
      expect(w.min_chapter).toBe(39)
    }
  })

  it('deferred §35 constructions have no nodes yet: day_name, adverbial_eni', () => {
    const nodeIds = new Set(Object.keys(grammarGraph.nodes))
    for (const deferred of [
      'day_name',
      'adverbial_eni',
    ]) {
      expect(
        nodeIds.has(deferred),
        `${deferred} is documented as deferred in the 2C.4e slice; if it has been added, update the 2C.4e deferral list and this guard`,
      ).toBe(false)
    }
  })
})

// Phase 2C.4e-2 — §35 Relative Clauses with `ai` (Ch 39)
// ============================================================================
//
// Piece 3 of spec §35: the relative-clause connector `ai` with back-reference
// form-selection. This slice ships bare `ai` only; `ki ai` / `mei ai` are
// deferred to 2C.4e-3 (preposition tracking).
//
// Shipped:
//   - relative_clause_tense node: 4 tense markers at min_chapter 39, routes to
//     the shared pronoun node via required edge
//   - relative_clause internal entry point: allowed_terminators = [] (exit via
//     finishFrame only, same pattern as purpose_bare_verb / conditional_clause)
//   - Extension edge on demonstrative.next: child_entry_point = relative_clause
//   - pronoun.constraints.depends_on updated to ["tense_marker",
//     "relative_clause_tense"] so pronoun filtering works in the sub-walk
//   - Render pass: lowercase relative_clause_tense (mid-sentence after
//     demonstrative) + auto-append bare `ai` when a relative_clause_tense
//     step exists in the flat path
//   - Docs.4 catalog: 1 INTERNAL_ENTRY_POINTS row + 1 EXTENSIONS row
//
// Deferred:
//   - ki ai / mei ai form-selection (2C.4e-3 — needs preposition tracking)
//   - Relative clause phrasal accent (ʻokú ne, naʻá ku)
//   - Transitive-object relative clause (§19 pattern with def. accent on verb)
//   - Nesting restriction (prevent subordinate clauses inside relative clause)
//   - koʻeni + day-of-week, eni as adverbial "now" (from 2C.4e deferral list)
describe('2C.4e-2 — §35 relative clauses with ai', () => {

  it('Ko e tohi ʻeni ʻoku ne ngāue ai (relative clause with bare ai, present tense)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko e tohi ʻeni ʻoku ne ngāue ai')
  })

  it('Ko e vaka ia naʻa ku nofo ai (relative clause with bare ai, past tense + ia demonstrative)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = advanceInFrame(s, { tongan: 'ia' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko e vaka ia naʻa ku nofo ai')
  })

  it('Ko e hā ʻeni ʻoku ne ngāue ai (ko_question_what + relative clause — what is this he works in?)', () => {
    let s = createWalkerState('ko_question_what', 999)
    s = advanceInFrame(s, { tongan: 'Ko e hā' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('Ko e hā ʻeni ʻoku ne ngāue ai')
  })

  it('relative_clause_tense node has 4 words, all min_chapter 39, routes to pronoun (required)', () => {
    const node = grammarGraph.nodes.relative_clause_tense
    expect(node, 'relative_clause_tense must exist').toBeDefined()
    expect(node.words).toHaveLength(4)
    for (const w of node.words) {
      expect(w.min_chapter).toBe(39)
    }
    expect(node.words.map(w => w.tongan).sort()).toEqual(['Kuo', 'Naʻa', 'Te', 'ʻOku'])
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('pronoun')
    expect(node.next[0].required).toBe(true)
  })

  it('demonstrative.next includes relative_clause_tense with child_entry_point at min_chapter 39', () => {
    const edge = grammarGraph.nodes.demonstrative.next.find(e => e.node === 'relative_clause_tense')
    expect(edge, 'demonstrative.next must include relative_clause_tense').toBeDefined()
    expect(edge.min_chapter).toBe(39)
    expect(edge.child_entry_point).toBe('relative_clause')
  })

  it('pronoun constraints accept relative_clause_tense as a dependency source', () => {
    const depends = grammarGraph.nodes.pronoun.constraints.depends_on
    const depIds = Array.isArray(depends) ? depends : [depends]
    expect(depIds).toContain('relative_clause_tense')
    expect(depIds).toContain('tense_marker')
  })

  it('pronoun ku is available after relative_clause_tense Naʻa (constraint fires across sub-walk)', () => {
    const words = getAvailableWords('pronoun', 999, [
      { nodeId: 'relative_clause_tense', word: { tongan: 'Naʻa' } },
    ])
    const tongans = words.map(w => w.tongan)
    expect(tongans).toContain('ku')
    expect(tongans).not.toContain('ou')
    expect(tongans).not.toContain('u')
  })

  it('render pass lowercases relative_clause_tense mid-sentence', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const rendered = getRenderedPath(s)
    const tenseStep = rendered.find(s => s.nodeId === 'relative_clause_tense')
    expect(tenseStep.renderedTongan).toBe('ʻoku')
    const aiStep = rendered.find(s => s.nodeId === '_ai_backref')
    expect(aiStep, 'render pass must auto-append ai step').toBeDefined()
    expect(aiStep.renderedTongan).toBe('ai')
  })

  it('relative_clause entry point is registered with allowed_terminators = [] and category Subordinate', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'relative_clause')
    expect(ep, 'relative_clause entry point missing').toBeDefined()
    expect(ep.allowed_terminators).toEqual([])
    expect(ep.category).toBe('Subordinate')
    expect(ep.start_node).toBe('relative_clause_tense')
    expect(ep.min_chapter).toBe(39)
  })

  it('ko_identification path at chapter < 39 does NOT offer relative clause extension', () => {
    let s = createWalkerState('ko_identification', 12)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    const menu = getExtensionMenu(s)
    const hasRelClause = menu.extensions.some(e => e.node === 'relative_clause_tense')
    expect(hasRelClause, 'relative clause extension should not appear before chapter 39').toBe(false)
  })
})

// Phase 2C.4e-3 — §35 ki ai / mei ai back-reference form-selection (Ch 39)
// ============================================================================
//
// Upgrades the 2C.4e-2 bare `ai` auto-append to preposition-aware
// form-selection. When the user takes a preposition extension inside the
// relative clause sub-walk, the render pass reads the preposition's family
// and renders the matching back-reference:
//   - i-family → bare ai (preposition + prep_phrase suppressed)
//   - ki-family → ki ai (preposition + prep_phrase suppressed, ki ai appended)
//   - mei-family → mei ai (preposition + prep_phrase suppressed, mei ai appended)
//   - no preposition → bare ai (unchanged from 2C.4e-2)
//
// Deferred:
//   - UX: skipping prep_phrase pick inside relative clause (user currently
//     picks a dummy noun that the render pass suppresses)
//   - Relative clause phrasal accent (ʻokú ne, naʻá ku)
//   - Transitive-object relative clause (§19 pattern with def. accent on verb)
//   - Nesting restriction (prevent subordinate clauses inside relative clause)
describe('2C.4e-3 — §35 ki ai / mei ai back-reference form-selection', () => {

  it('Ko e tohi ia naʻa ku lea ki ai (ki-family preposition → ki ai)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ia' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'lea' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko e tohi ia naʻa ku lea ki ai')
    const rendered = getRenderedPath(s)
    const aiStep = rendered.find(st => st.nodeId === '_ai_backref')
    expect(aiStep.renderedTongan).toBe('ki ai')
  })

  it('Ko e vaka ia naʻa ku haʻu mei ai (mei-family preposition → mei ai)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = advanceInFrame(s, { tongan: 'ia' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'haʻu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'mei' })
    s = advanceInFrame(s, { tongan: 'Tonga' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko e vaka ia naʻa ku haʻu mei ai')
    const rendered = getRenderedPath(s)
    const aiStep = rendered.find(st => st.nodeId === '_ai_backref')
    expect(aiStep.renderedTongan).toBe('mei ai')
  })

  it('Ko e tohi ʻeni ʻoku ne ngāue ai (i-family preposition → bare ai, preposition suppressed)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Ko e tohi ʻeni ʻoku ne ngāue ai')
    const rendered = getRenderedPath(s)
    const aiStep = rendered.find(st => st.nodeId === '_ai_backref')
    expect(aiStep.renderedTongan).toBe('ai')
    expect(rendered.find(st => st.nodeId === 'preposition'), 'i-family preposition must be suppressed').toBeUndefined()
    expect(rendered.find(st => st.nodeId === 'prep_phrase'), 'prep_phrase must be suppressed').toBeUndefined()
  })
})

// Phase 2C.5a — §36 The Possessive System in Full (Ch 29)
//
// Spec §36 consolidates and deepens the possessive system from §22 with three
// contributions: (1) the doer/receiver principle underlying e-class/ho-class,
// (2) 14 indefinite possessive forms for the "have" construction, (3) the
// preposition + e-class article rule (already shipped in 2A.6 follow-up).
//
// This slice adds the indefinite forms data (`indefinite_forms` field) to the
// 7 singular/plural possessive_pronoun entries and updates node descriptions
// to document the doer/receiver principle. The "have" construction wiring,
// plant_type field, family_term_class_override, and dual indefinite forms are
// deferred to follow-up slices.
describe('2C.5a — §36 possessive system in full: indefinite forms (Ch 29)', () => {
  it('all 7 singular/plural possessive_pronoun entries carry indefinite_forms with both classes', () => {
    const node = grammarGraph.nodes.possessive_pronoun
    const sgPl = node.words.filter(w => w.number === 'singular' || w.number === 'plural')
    expect(sgPl.length).toBe(7)
    for (const w of sgPl) {
      expect(w.indefinite_forms, `${w.tongan} missing indefinite_forms`).toBeDefined()
      expect(w.indefinite_forms.e_class, `${w.tongan} missing e_class indefinite`).toBeTruthy()
      expect(w.indefinite_forms.ho_class, `${w.tongan} missing ho_class indefinite`).toBeTruthy()
    }
  })

  it('4 dual possessive_pronoun entries do NOT carry indefinite_forms (not attested in §36)', () => {
    const node = grammarGraph.nodes.possessive_pronoun
    const duals = node.words.filter(w => w.number === 'dual')
    expect(duals.length).toBe(4)
    for (const w of duals) {
      expect(w.indefinite_forms, `${w.tongan} should not have indefinite_forms`).toBeUndefined()
    }
  })

  it('e-class indefinite forms match §36 table (haʻa- prefix pattern)', () => {
    const node = grammarGraph.nodes.possessive_pronoun
    const expected = {
      1: { singular: 'haʻaku', plural_incl: 'haʻatau', plural_excl: 'haʻamau' },
      2: { singular: 'haʻo', plural: 'haʻamou' },
      3: { singular: 'haʻane', plural: 'haʻanau' },
    }
    const w1sg = node.words.find(w => w.person === 1 && w.number === 'singular')
    expect(w1sg.indefinite_forms.e_class).toBe('haʻaku')
    const w2sg = node.words.find(w => w.person === 2 && w.number === 'singular')
    expect(w2sg.indefinite_forms.e_class).toBe('haʻo')
    const w3sg = node.words.find(w => w.person === 3 && w.number === 'singular')
    expect(w3sg.indefinite_forms.e_class).toBe('haʻane')
    const w2pl = node.words.find(w => w.person === 2 && w.number === 'plural')
    expect(w2pl.indefinite_forms.e_class).toBe('haʻamou')
    const w3pl = node.words.find(w => w.person === 3 && w.number === 'plural')
    expect(w3pl.indefinite_forms.e_class).toBe('haʻanau')
  })

  it('ho-class indefinite forms match §36 table (ha- prefix pattern, no glottal stop)', () => {
    const node = grammarGraph.nodes.possessive_pronoun
    const w1sg = node.words.find(w => w.person === 1 && w.number === 'singular')
    expect(w1sg.indefinite_forms.ho_class).toBe('haku')
    const w2sg = node.words.find(w => w.person === 2 && w.number === 'singular')
    expect(w2sg.indefinite_forms.ho_class).toBe('hao')
    const w3sg = node.words.find(w => w.person === 3 && w.number === 'singular')
    expect(w3sg.indefinite_forms.ho_class).toBe('hano')
    const w1pl_incl = node.words.find(w => w.person === 1 && w.number === 'plural' && w.tongan === 'ʻetau')
    expect(w1pl_incl.indefinite_forms.ho_class).toBe('hatau')
    const w1pl_excl = node.words.find(w => w.person === 1 && w.number === 'plural' && w.tongan === 'ʻemau')
    expect(w1pl_excl.indefinite_forms.ho_class).toBe('hamau')
    const w2pl = node.words.find(w => w.person === 2 && w.number === 'plural')
    expect(w2pl.indefinite_forms.ho_class).toBe('hamou')
    const w3pl = node.words.find(w => w.person === 3 && w.number === 'plural')
    expect(w3pl.indefinite_forms.ho_class).toBe('hanau')
  })

  it('possessive_pronoun description documents doer/receiver principle and indefinite forms', () => {
    const desc = grammarGraph.nodes.possessive_pronoun.description
    expect(desc).toContain('doer/receiver')
    expect(desc).toContain('indefinite_forms')
    expect(desc).toContain('§36')
  })

  it('possessive_head_noun description documents doer/receiver principle and deferrals', () => {
    const desc = grammarGraph.nodes.possessive_head_noun.description
    expect(desc).toContain('doer/receiver')
    expect(desc).toContain('plant_type')
    expect(desc).toContain('family_term_class_override')
  })

  it('schema validates indefinite_forms field (same shape as possessive_forms)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const indef = errors.filter(e => e.includes('indefinite_forms'))
    expect(indef, 'schema should accept well-formed indefinite_forms').toEqual([])
  })

  it('existing 2A.6 possessive paradigm rendering is unaffected (no regression)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiemaʻu hoku fale')
  })
})

// Phase 2C.5b — §36 "Have" Construction + §37 Postposed Possessives (Ch 29 + Ch 37)
// ============================================================================
//
// Spec §36 documents that Tongan has no verb "to have." Instead, the
// existential `ʻi ai` combines with possessive pronouns:
//   question:    ʻOku ʻi ai + indefinite_possessive + noun + ?
//   negative:    ʻOku ʻikai + indefinite_possessive + noun + .
//   affirmative: ʻOku ʻi ai + definite_possessive + noun + .
//
// Shipped:
//   - have_construction entry point (category: Statements, min_chapter: 29,
//     allowed_terminators: [FINISH_STATEMENT, FINISH_QUESTION])
//   - have_head node: 12 compound word entries (4 tenses × 3 polarities:
//     affirmative/question/negated). Affirmative and question share the same
//     `ʻi ai` head text; negated uses `ʻikai` without `ʻi ai`.
//   - have_head.next: required edge to possessive_pronoun (reuses shared §22 node)
//   - possessive_head_noun.next gains FINISH_STATEMENT + FINISH_QUESTION edges
//     (safe in child frames — blocked by allowed_terminators: [])
//   - Render pass in getRenderedPath: detects have_head → possessive_pronoun →
//     possessive_head_noun triple; reads polarity tag from have_head; overrides
//     with indefinite_forms for question/negated (affirmative uses default 2A.6
//     definite forms).
//   - Docs.4 catalog gains 1 MATRIX_ENTRY_POINTS row for have_construction
//
// Deferred:
//   - numeral extensions after possessed noun (ʻeku hele ʻe ua)
//   - location continuation (ʻi heni)
//   - postposed possessives §37 (ʻaʻaku/ʻoʻoku paradigm)
//   - predicative possessive entry point (ʻOku ʻaʻaku eni)
//   - whose-question forms (ʻa hai? / ʻo hai?)
//   - pronominal adjective construction
//   - pē taha modifier
describe('2C.5b — §36 "have" construction (ʻoku ʻi ai + possessive, Ch 29)', () => {
  // --- Walker happy paths ---

  it('ʻOku ʻi ai haʻo kato? (present question, e-class — do you have a basket?)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'hoʻo' })
    s = advanceInFrame(s, { tongan: 'kato' })
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai haʻo kato')
  })

  it('ʻOku ʻikai haʻaku hele (present negative, e-class — I don\'t have a knife)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻikai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'hele' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai haʻaku hele')
  })

  it('ʻOku ʻi ai ʻeku hele (present affirmative, e-class — I have a knife)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'hele' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai ʻeku hele')
  })

  it('ʻOku ʻi ai hao fale? (present question, ho-class — do you have a house?)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'hoʻo' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai hao fale')
  })

  it('ʻOku ʻikai haku fale (present negative, ho-class — I don\'t have a house)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻikai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai haku fale')
  })

  it('ʻOku ʻi ai hoku fale (present affirmative, ho-class — I have a house)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻi ai hoku fale')
  })

  it('Naʻe ʻi ai haʻane tohi? (past question, e-class — did he have a book?)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe ʻi ai' })
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('Naʻe ʻi ai haʻane tohi')
  })

  it('ʻOku ʻikai haʻanau paʻanga (present negative, e-class plural — they don\'t have money)', () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻikai' })
    s = advanceInFrame(s, { tongan: 'ʻenau' })
    s = advanceInFrame(s, { tongan: 'paʻanga' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai haʻanau paʻanga')
  })

  // --- Structural assertions ---

  it('have_head has 8 entries: 4 affirmative + 4 negated, all tagged have_head', () => {
    const node = grammarGraph.nodes.have_head
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(8)
    for (const w of node.words) {
      expect(w.tags, `${w.tongan} (${w.english}) missing have_head tag`).toContain('have_head')
      expect(w.min_chapter).toBe(29)
    }
    const affirmative = node.words.filter(w => w.tags.includes('affirmative'))
    const negated = node.words.filter(w => w.tags.includes('negated'))
    expect(affirmative).toHaveLength(4)
    expect(negated).toHaveLength(4)
  })

  it('have_head.next is a single required edge to possessive_pronoun', () => {
    const node = grammarGraph.nodes.have_head
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('possessive_pronoun')
    expect(node.next[0].required).toBe(true)
  })

  it('negated entries use ʻikai (no ʻi ai), affirmative entries use ʻi ai', () => {
    const node = grammarGraph.nodes.have_head
    for (const w of node.words) {
      if (w.tags.includes('negated')) {
        expect(w.tongan, `negated ${w.english}`).toContain('ʻikai')
        expect(w.tongan, `negated ${w.english}`).not.toContain('ʻi ai')
      } else {
        expect(w.tongan, `${w.english}`).toContain('ʻi ai')
      }
    }
  })

  it('possessive_head_noun.next includes FINISH edges + pronominal_adjective extension (needed for have_construction flow)', () => {
    const targets = grammarGraph.nodes.possessive_head_noun.next.map(e => e.node).sort()
    expect(targets).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT', 'pronominal_adjective'])
  })

  it('have_construction entry point is registered with min_chapter 29 and Statement+Question terminators', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'have_construction')
    expect(ep, 'have_construction entry point missing').toBeDefined()
    expect(ep.category).toBe('Statements')
    expect(ep.min_chapter).toBe(29)
    expect(ep.start_node).toBe('have_head')
    expect(ep.allowed_terminators).toEqual(['FINISH_STATEMENT', 'FINISH_QUESTION'])
  })

  it('existing possessive_phrase child frame is unaffected (FINISH edges blocked by allowed_terminators: [])', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻa ku fiemaʻu hoku fale')
  })

  it('§37 constructions shipped in 2C.5c + 2C.5d + 2C.5e: postposed_possessive, predicative_possessive, whose_question, pronominal_adjective', () => {
    expect(grammarGraph.nodes.postposed_possessive, 'postposed_possessive shipped in 2C.5c').toBeDefined()
    expect(grammarGraph.nodes.predicative_possessive_head, 'predicative_possessive_head shipped in 2C.5d').toBeDefined()
    expect(grammarGraph.nodes.whose_question_form, 'whose_question_form shipped in 2C.5d').toBeDefined()
    expect(grammarGraph.nodes.pronominal_adjective, 'pronominal_adjective shipped in 2C.5e').toBeDefined()
  })
})

// Phase 2C.5c — §37 Postposed Possessives (Ch 37)
// ============================================================================
//
// Spec §37 extends the possessive system with postposed pronouns that follow
// the noun for emphasis. Two complete paradigm series: ʻe-class (ʻaʻaku,
// ʻaʻau, ʻaʻana + dual/plural) and ho-class (ʻoʻoku, ʻoʻou, ʻoʻona +
// dual/plural). Singular forms have short variants (ʻaku/ʻau/ʻana,
// ʻoku/ʻou/ʻona) stored in a short_form field. Class selection follows the
// same doer/receiver principle as preposed possessives (§22/§36).
//
// Shipped:
//   - postposed_possessive reference node: 22 word entries (11 e-class + 11
//     ho-class), each tagged with possessive_class + person + number. Six
//     singular entries carry short_form. Node is reference-only (next: []),
//     not yet wired as an extension edge.
//   - schema: short_form added to WORD_ALLOWED
//
// No walker changes — pure data + schema enrichment. No new entry points.
//
// Deferred (documented on the node description field):
//   - predicative possessive entry point (ʻOku ʻaʻaku eni — 2C.5d)
//   - whose-question forms ʻa hai? / ʻo hai? (2C.5d)
//   - pronominal adjective construction (preposed + postposed for emphasis)
//   - ʻoku short-form / ʻoku tense-marker disambiguation
//   - wiring postposed_possessive as extension edges on noun-bearing nodes
describe('2C.5c — §37 postposed possessives (ʻaʻaku/ʻoʻoku paradigm, Ch 37)', () => {
  it('postposed_possessive node has 22 words (11 e-class + 11 ho-class)', () => {
    const node = grammarGraph.nodes.postposed_possessive
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(22)
    const eClass = node.words.filter(w => w.possessive_class === 'e_class')
    const hoClass = node.words.filter(w => w.possessive_class === 'ho_class')
    expect(eClass).toHaveLength(11)
    expect(hoClass).toHaveLength(11)
  })

  it('e-class singular forms match §37 table with short_form', () => {
    const node = grammarGraph.nodes.postposed_possessive
    const eClassSg = node.words.filter(w => w.possessive_class === 'e_class' && w.number === 'singular')
    expect(eClassSg).toHaveLength(3)
    const byPerson = Object.fromEntries(eClassSg.map(w => [w.person, w]))
    expect(byPerson[1].tongan).toBe('ʻaʻaku')
    expect(byPerson[1].short_form).toBe('ʻaku')
    expect(byPerson[2].tongan).toBe('ʻaʻau')
    expect(byPerson[2].short_form).toBe('ʻau')
    expect(byPerson[3].tongan).toBe('ʻaʻana')
    expect(byPerson[3].short_form).toBe('ʻana')
  })

  it('ho-class singular forms match §37 table with short_form', () => {
    const node = grammarGraph.nodes.postposed_possessive
    const hoClassSg = node.words.filter(w => w.possessive_class === 'ho_class' && w.number === 'singular')
    expect(hoClassSg).toHaveLength(3)
    const byPerson = Object.fromEntries(hoClassSg.map(w => [w.person, w]))
    expect(byPerson[1].tongan).toBe('ʻoʻoku')
    expect(byPerson[1].short_form).toBe('ʻoku')
    expect(byPerson[2].tongan).toBe('ʻoʻou')
    expect(byPerson[2].short_form).toBe('ʻou')
    expect(byPerson[3].tongan).toBe('ʻoʻona')
    expect(byPerson[3].short_form).toBe('ʻona')
  })

  it('e-class dual forms match §37 table (4 forms, no short_form)', () => {
    const node = grammarGraph.nodes.postposed_possessive
    const duals = node.words.filter(w => w.possessive_class === 'e_class' && w.number === 'dual')
    expect(duals).toHaveLength(4)
    const tongans = duals.map(w => w.tongan).sort()
    expect(tongans).toEqual(['ʻamaua', 'ʻamoua', 'ʻanaua', 'ʻataua'])
    for (const w of duals) {
      expect(w.short_form, `${w.tongan} should not have short_form`).toBeUndefined()
    }
  })

  it('e-class plural forms match §37 table (4 forms, no short_form)', () => {
    const node = grammarGraph.nodes.postposed_possessive
    const plurals = node.words.filter(w => w.possessive_class === 'e_class' && w.number === 'plural')
    expect(plurals).toHaveLength(4)
    const tongans = plurals.map(w => w.tongan).sort()
    expect(tongans).toEqual(['ʻamautolu', 'ʻamoutolu', 'ʻanautolu', 'ʻatautolu'])
    for (const w of plurals) {
      expect(w.short_form, `${w.tongan} should not have short_form`).toBeUndefined()
    }
  })

  it('ho-class dual forms match §37 table (4 forms, no short_form)', () => {
    const node = grammarGraph.nodes.postposed_possessive
    const duals = node.words.filter(w => w.possessive_class === 'ho_class' && w.number === 'dual')
    expect(duals).toHaveLength(4)
    const tongans = duals.map(w => w.tongan).sort()
    expect(tongans).toEqual(['ʻomaua', 'ʻomoua', 'ʻonaua', 'ʻotaua'])
    for (const w of duals) {
      expect(w.short_form, `${w.tongan} should not have short_form`).toBeUndefined()
    }
  })

  it('ho-class plural forms match §37 table (4 forms, no short_form)', () => {
    const node = grammarGraph.nodes.postposed_possessive
    const plurals = node.words.filter(w => w.possessive_class === 'ho_class' && w.number === 'plural')
    expect(plurals).toHaveLength(4)
    const tongans = plurals.map(w => w.tongan).sort()
    expect(tongans).toEqual(['ʻomautolu', 'ʻomoutolu', 'ʻonautolu', 'ʻotautolu'])
    for (const w of plurals) {
      expect(w.short_form, `${w.tongan} should not have short_form`).toBeUndefined()
    }
  })

  it('all 22 entries carry possessive_class + person + number fields and min_chapter 37', () => {
    const node = grammarGraph.nodes.postposed_possessive
    for (const w of node.words) {
      expect(w.possessive_class, `${w.tongan} missing possessive_class`).toMatch(/^(e_class|ho_class)$/)
      expect(w.person, `${w.tongan} missing person`).toBeGreaterThanOrEqual(1)
      expect(w.person, `${w.tongan} person out of range`).toBeLessThanOrEqual(3)
      expect(w.number, `${w.tongan} missing number`).toMatch(/^(singular|dual|plural)$/)
      expect(w.min_chapter, `${w.tongan} min_chapter`).toBe(37)
      expect(w.tags, `${w.tongan} missing tags`).toContain('postposed_possessive')
    }
  })

  it('next routes to predicative_poss_subject (wired in 2C.5d)', () => {
    const next = grammarGraph.nodes.postposed_possessive.next
    expect(next).toHaveLength(1)
    expect(next[0].node).toBe('predicative_poss_subject')
    expect(next[0].required).toBe(true)
  })

  it('schema validates short_form field on postposed_possessive entries', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const shortFormErrors = errors.filter(e => e.includes('short_form'))
    expect(shortFormErrors, 'schema should accept well-formed short_form').toEqual([])
  })

  it('2C.5d + 2C.5e shipped predicative_possessive + whose_question + pronominal_adjective', () => {
    const nodeIds = new Set(Object.keys(grammarGraph.nodes))
    expect(nodeIds.has('predicative_possessive_head'), 'predicative_possessive_head shipped in 2C.5d').toBe(true)
    expect(nodeIds.has('predicative_poss_subject'), 'predicative_poss_subject shipped in 2C.5d').toBe(true)
    expect(nodeIds.has('whose_question_form'), 'whose_question_form shipped in 2C.5d').toBe(true)
    expect(nodeIds.has('pronominal_adjective'), 'pronominal_adjective shipped in 2C.5e').toBe(true)
    const epIds = new Set(grammarGraph.entry_points.map(ep => ep.id))
    expect(epIds.has('predicative_possessive'), 'predicative_possessive EP shipped in 2C.5d').toBe(true)
  })
})

// Phase 2C.5d — §37 Predicative Possessive + Whose-Question (Ch 37)
// ============================================================================
//
// Spec §37 predicative possessive: the postposed possessive functions as the
// sentence's predicate after a tense marker. Structure:
//   ʻOku + postposed_possessive + (eni | ʻa e + noun)
// Examples: ʻOku ʻaʻaku eni (this is mine, e-class),
//           ʻOku ʻoʻoku ʻa e falé (the house is mine, ho-class).
//
// Whose-question: ʻa hai? / ʻo hai? extension on demonstrative.next in the
// ko_identification flow. Auto-selected by the head noun's possessive_class
// via a backward-walk render pass.
//
// Shipped:
//   - predicative_possessive entry point + predicative_possessive_head node
//   - postposed_possessive.next wired to predicative_poss_subject
//   - predicative_poss_subject node: 2 demonstratives + 4 ʻa e + noun entries
//   - whose_question_form node on demonstrative.next: 1 word with
//     possessive_forms for auto-selection
//   - render pass: whose_question_form backward-walk form-selection
//   - Docs.4 catalog: 1 new MATRIX_ENTRY_POINTS row
//
// Deferred:
//   - other tense markers for predicative possessive (naʻe, kuo, ʻe)
//   - negated predicative (ʻoku ʻikai ʻaʻaku eni)
//   - pronominal adjective construction (2C.5e)
//   - ʻoku short-form / ʻoku tense-marker disambiguation
//   - mixed-class whose-question prompt
//   - wiring postposed_possessive as extension edges on noun-bearing nodes
describe('2C.5d — §37 predicative possessive + whose-question (Ch 37)', () => {

  // --- Structural assertions ---

  it('predicative_possessive entry point exists with FINISH_STATEMENT + FINISH_QUESTION', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'predicative_possessive')
    expect(ep).toBeDefined()
    expect(ep.start_node).toBe('predicative_possessive_head')
    expect(ep.min_chapter).toBe(37)
    expect(ep.category).toBe('Statements')
    expect(ep.allowed_terminators).toEqual(['FINISH_STATEMENT', 'FINISH_QUESTION'])
  })

  it('predicative_possessive_head has 1 word (ʻOku) and routes to postposed_possessive', () => {
    const node = grammarGraph.nodes.predicative_possessive_head
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    expect(node.words[0].tongan).toBe('ʻOku')
    expect(node.words[0].min_chapter).toBe(37)
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('postposed_possessive')
    expect(node.next[0].required).toBe(true)
  })

  it('predicative_poss_subject has 2 demonstratives + 4 noun phrases', () => {
    const node = grammarGraph.nodes.predicative_poss_subject
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(6)
    const demos = node.words.filter(w => w.tags && w.tags.includes('demonstrative'))
    const nouns = node.words.filter(w => w.tags && w.tags.includes('noun_phrase'))
    expect(demos).toHaveLength(2)
    expect(nouns).toHaveLength(4)
    // ʻa e + noun entries have possessive_class for validation
    for (const n of nouns) {
      expect(n.possessive_class, `${n.tongan} missing possessive_class`).toBeDefined()
      expect(n.animacy, `${n.tongan} missing animacy`).toBe('thing')
    }
  })

  it('predicative_poss_subject.next has FINISH_STATEMENT + FINISH_QUESTION', () => {
    const node = grammarGraph.nodes.predicative_poss_subject
    const finishNodes = node.next.map(e => e.node)
    expect(finishNodes).toContain('FINISH_STATEMENT')
    expect(finishNodes).toContain('FINISH_QUESTION')
  })

  it('whose_question_form has 1 word with possessive_forms for auto-selection', () => {
    const node = grammarGraph.nodes.whose_question_form
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    const w = node.words[0]
    expect(w.tongan).toBe('ʻa hai')
    expect(w.possessive_forms).toEqual({ e_class: 'ʻa hai', ho_class: 'ʻo hai' })
    expect(w.min_chapter).toBe(37)
  })

  it('whose_question_form.next has only FINISH_QUESTION', () => {
    const node = grammarGraph.nodes.whose_question_form
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('FINISH_QUESTION')
  })

  it('demonstrative.next includes whose_question_form edge at min_chapter 37', () => {
    const node = grammarGraph.nodes.demonstrative
    const edge = node.next.find(e => e.node === 'whose_question_form')
    expect(edge, 'whose_question_form edge missing from demonstrative.next').toBeDefined()
    expect(edge.min_chapter).toBe(37)
  })

  // --- Walker happy paths: predicative possessive ---

  it('ʻOku ʻaʻaku eni (this is mine, e-class)', () => {
    let s = createWalkerState('predicative_possessive', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻaʻaku' })
    s = advanceInFrame(s, { tongan: 'eni' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻaʻaku eni')
  })

  it('ʻOku ʻoʻoku ʻa e falé (the house is mine, ho-class)', () => {
    let s = createWalkerState('predicative_possessive', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻoʻoku' })
    s = advanceInFrame(s, { tongan: 'ʻa e falé' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻoʻoku ʻa e falé')
  })

  it('ʻOku ʻaʻana ʻa e kató (the basket is his, e-class 3sg)', () => {
    let s = createWalkerState('predicative_possessive', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻaʻana' })
    s = advanceInFrame(s, { tongan: 'ʻa e kató' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻaʻana ʻa e kató')
  })

  it('ʻOku ʻoʻona eni (this is his, ho-class 3sg)', () => {
    let s = createWalkerState('predicative_possessive', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻoʻona' })
    s = advanceInFrame(s, { tongan: 'eni' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻoʻona eni')
  })

  // --- Walker happy paths: whose-question ---

  it('Ko e kato ʻeni ʻa hai? (whose basket, e-class auto-selected)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'kato' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'whose_question_form')
    s = advanceInFrame(s, { tongan: 'ʻa hai' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('Ko e kato ʻeni ʻa hai')
  })

  it('Ko e vaka ʻeni ʻo hai? (whose boat, ho-class auto-selected)', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'whose_question_form')
    s = advanceInFrame(s, { tongan: 'ʻa hai' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    // vaka is ho_class in data → render pass substitutes ʻo hai
    expect(renderTongan(s)).toBe('Ko e vaka ʻeni ʻo hai')
  })

  it('render pass: whose_question_form backward-walk picks e-class from kato', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'kato' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'whose_question_form')
    s = advanceInFrame(s, { tongan: 'ʻa hai' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const rendered = getRenderedPath(s)
    const whoseStep = rendered.find(st => st.nodeId === 'whose_question_form')
    expect(whoseStep.renderedTongan).toBe('ʻa hai')
  })

  it('render pass: whose_question_form backward-walk picks ho-class from vaka', () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'whose_question_form')
    s = advanceInFrame(s, { tongan: 'ʻa hai' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const rendered = getRenderedPath(s)
    const whoseStep = rendered.find(st => st.nodeId === 'whose_question_form')
    expect(whoseStep.renderedTongan).toBe('ʻo hai')
  })

  it('whose_question_form extension not available at chapter < 37', () => {
    let s = createWalkerState('ko_identification', 12)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    const menu = getExtensionMenu(s)
    const hasWhose = menu.extensions.some(e => e.node === 'whose_question_form')
    expect(hasWhose, 'whose_question_form should NOT be offered at Ch 12').toBe(false)
  })

  // --- Schema validation ---

  it('schema validates all new 2C.5d nodes', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const relevant = errors.filter(e =>
      e.includes('predicative_possessive') ||
      e.includes('whose_question') ||
      e.includes('predicative_poss')
    )
    expect(relevant, 'schema should accept all 2C.5d nodes').toEqual([])
  })
})

// Phase 2C.5e — §37 Pronominal Adjective Construction (Ch 37)
// ============================================================================
//
// Spec §37 pronominal adjective: preposed possessive + noun + postposed
// possessive short form for emphatic ownership. The combination doubles the
// possessive marking to stress exactly who the owner is.
//   Pattern: [preposed_possessive] + [noun + definitive_accent] + [short_form]
//   Examples: ʻEku paʻanga ʻaku (MY money), Hono fale ʻona (HIS house),
//             Hoʻo tohi ʻau (YOUR book), ʻEne hele ʻana (HIS knife).
//
// Shipped:
//   - pronominal_adjective node: 1 word entry (placeholder, auto-selected by
//     render pass). Extension edge on possessive_head_noun.next at min_chapter 37.
//   - render pass: (1) applies definitive_accent_form to head noun when
//     pronominal_adjective follows; (2) auto-selects matching short form from
//     postposed_possessive paradigm data based on the preposed possessive's
//     person/number and the head noun's possessive_class
//   - definitive_accent_form added to 7 possessive_head_noun words (hele → helé,
//     kato → kató, ngāue → ngāué, paʻanga → paʻangá, kofu → kofú,
//     tokoua → tokouá, fonua → fonuá)
//   - Docs.4 catalog: 1 EXTENSIONS row (terminal enforcement)
//
// Deferred:
//   - dual/plural emphasis forms use the long postposed form (no short_form
//     on those entries) — render pass falls back to tongan field
//   - person/number agreement validation between preposed and postposed
//   - ʻoku short-form / ʻoku tense-marker disambiguation entries
//   - mixed-class handling
//   - tatā definitive_accent_form (macron + acute accent combination)
describe('2C.5e — §37 pronominal adjective construction (Ch 37)', () => {

  // --- Structural assertions ---

  it('pronominal_adjective node exists with 1 word entry', () => {
    const node = grammarGraph.nodes.pronominal_adjective
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(1)
    expect(node.words[0].tongan).toBe('ʻaku')
    expect(node.words[0].min_chapter).toBe(37)
    expect(node.words[0].tags).toContain('pronominal_adjective')
  })

  it('pronominal_adjective.next has FINISH_STATEMENT + FINISH_QUESTION', () => {
    const node = grammarGraph.nodes.pronominal_adjective
    const targets = node.next.map(e => e.node).sort()
    expect(targets).toEqual(['FINISH_QUESTION', 'FINISH_STATEMENT'])
  })

  it('possessive_head_noun.next includes pronominal_adjective edge at min_chapter 37', () => {
    const node = grammarGraph.nodes.possessive_head_noun
    const edge = node.next.find(e => e.node === 'pronominal_adjective')
    expect(edge, 'pronominal_adjective edge missing from possessive_head_noun.next').toBeDefined()
    expect(edge.min_chapter).toBe(37)
  })

  it('all possessive_head_noun words (except tatā) carry definitive_accent_form', () => {
    const node = grammarGraph.nodes.possessive_head_noun
    for (const w of node.words) {
      if (w.tongan === 'tatā') continue // deferred: macron + acute combination
      expect(w.definitive_accent_form, `${w.tongan} missing definitive_accent_form`).toBeDefined()
    }
  })

  it('definitive_accent_form spot-checks match §37 examples', () => {
    const node = grammarGraph.nodes.possessive_head_noun
    const byTongan = Object.fromEntries(node.words.map(w => [w.tongan, w]))
    expect(byTongan['hele'].definitive_accent_form).toBe('helé')
    expect(byTongan['paʻanga'].definitive_accent_form).toBe('paʻangá')
    expect(byTongan['tohi'].definitive_accent_form).toBe('tohí')
    expect(byTongan['fale'].definitive_accent_form).toBe('falé')
    expect(byTongan['kofu'].definitive_accent_form).toBe('kofú')
  })

  // --- Walker happy paths ---

  it('ʻEku paʻanga ʻaku (MY money, 1sg e-class)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'paʻanga' })
    s = takeExtension(s, 'pronominal_adjective')
    s = advanceInFrame(s, { tongan: 'ʻaku' })
    s = finishFrame(s) // pop pronominal_adjective sub-frame
    s = finishFrame(s) // pop possessive_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    // The render pass should: (1) select ʻeku (e-class for money),
    // (2) apply definitive accent paʻangá, (3) auto-select ʻaku (1sg e-class)
    const rendered = getRenderedPath(s)
    const headNounStep = rendered.find(st => st.nodeId === 'possessive_head_noun')
    expect(headNounStep.renderedTongan).toBe('paʻanga')
    const adjStep = rendered.find(st => st.nodeId === 'pronominal_adjective')
    expect(adjStep.renderedTongan).toBe('ʻaku')
  })

  it('Hono fale ʻona (HIS house, 3sg ho-class)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = takeExtension(s, 'pronominal_adjective')
    s = advanceInFrame(s, { tongan: 'ʻaku' })
    s = finishFrame(s) // pop pronominal_adjective sub-frame
    s = finishFrame(s) // pop possessive_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    // ʻene → hono (ho-class), fale → falé, pronominal adj → ʻona (3sg ho-class)
    const rendered = getRenderedPath(s)
    const pronounStep = rendered.find(st => st.nodeId === 'possessive_pronoun')
    expect(pronounStep.renderedTongan).toBe('hono')
    const headNounStep = rendered.find(st => st.nodeId === 'possessive_head_noun')
    expect(headNounStep.renderedTongan).toBe('fale')
    const adjStep = rendered.find(st => st.nodeId === 'pronominal_adjective')
    expect(adjStep.renderedTongan).toBe('ʻona')
  })

  it('Hoʻo tohi ʻau (YOUR book, 2sg e-class)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ke' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'hoʻo' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = takeExtension(s, 'pronominal_adjective')
    s = advanceInFrame(s, { tongan: 'ʻaku' })
    s = finishFrame(s) // pop pronominal_adjective sub-frame
    s = finishFrame(s) // pop possessive_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    // hoʻo → hoʻo (e-class for book), tohi → tohí, pronominal adj → ʻau (2sg e-class)
    const rendered = getRenderedPath(s)
    const pronounStep = rendered.find(st => st.nodeId === 'possessive_pronoun')
    expect(pronounStep.renderedTongan).toBe('hoʻo')
    const headNounStep = rendered.find(st => st.nodeId === 'possessive_head_noun')
    expect(headNounStep.renderedTongan).toBe('tohi')
    const adjStep = rendered.find(st => st.nodeId === 'pronominal_adjective')
    expect(adjStep.renderedTongan).toBe('ʻau')
  })

  it('ʻEne hele ʻana (HIS knife, 3sg e-class)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'hele' })
    s = takeExtension(s, 'pronominal_adjective')
    s = advanceInFrame(s, { tongan: 'ʻaku' })
    s = finishFrame(s) // pop pronominal_adjective sub-frame
    s = finishFrame(s) // pop possessive_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    // ʻene → ʻene (e-class for knife), hele → helé, pronominal adj → ʻana (3sg e-class)
    const rendered = getRenderedPath(s)
    const pronounStep = rendered.find(st => st.nodeId === 'possessive_pronoun')
    expect(pronounStep.renderedTongan).toBe('ʻene')
    const headNounStep = rendered.find(st => st.nodeId === 'possessive_head_noun')
    expect(headNounStep.renderedTongan).toBe('hele')
    const adjStep = rendered.find(st => st.nodeId === 'pronominal_adjective')
    expect(adjStep.renderedTongan).toBe('ʻana')
  })

  // --- Render pass tests ---

  it('render pass: definitive accent auto-applied to head noun before pronominal adjective', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'kato' })
    s = takeExtension(s, 'pronominal_adjective')
    s = advanceInFrame(s, { tongan: 'ʻaku' })
    s = finishFrame(s) // pop pronominal_adjective sub-frame
    s = finishFrame(s) // pop possessive_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    const rendered = getRenderedPath(s)
    const headNounStep = rendered.find(st => st.nodeId === 'possessive_head_noun')
    expect(headNounStep.renderedTongan).toBe('kato')
  })

  it('render pass: ho-class auto-selection for house + 1sg → ʻoku', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = takeExtension(s, 'pronominal_adjective')
    s = advanceInFrame(s, { tongan: 'ʻaku' })
    s = finishFrame(s) // pop pronominal_adjective sub-frame
    s = finishFrame(s) // pop possessive_phrase sub-frame
    s = finishWalker(s, 'FINISH_STATEMENT')
    const rendered = getRenderedPath(s)
    // ʻeku → hoku (ho-class for house)
    const pronounStep = rendered.find(st => st.nodeId === 'possessive_pronoun')
    expect(pronounStep.renderedTongan).toBe('hoku')
    // pronominal adj → ʻoku (1sg ho-class short form)
    const adjStep = rendered.find(st => st.nodeId === 'pronominal_adjective')
    expect(adjStep.renderedTongan).toBe('ʻoku')
  })

  // --- Extension menu / chapter gate ---

  it('pronominal_adjective extension not available at chapter < 37', () => {
    let s = createWalkerState('statement', 30)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    const menu = getExtensionMenu(s)
    const hasPronAdj = menu.extensions.some(e => e.node === 'pronominal_adjective')
    expect(hasPronAdj, 'pronominal_adjective should NOT be offered at Ch 30').toBe(false)
  })

  it('pronominal_adjective extension IS available at chapter >= 37', () => {
    let s = createWalkerState('statement', 37)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    const menu = getExtensionMenu(s)
    const hasPronAdj = menu.extensions.some(e => e.node === 'pronominal_adjective')
    expect(hasPronAdj, 'pronominal_adjective should be offered at Ch 37').toBe(true)
  })

  // --- Schema validation ---

  it('schema validates pronominal_adjective node', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const relevant = errors.filter(e => e.includes('pronominal_adjective'))
    expect(relevant, 'schema should accept pronominal_adjective node').toEqual([])
  })

  // --- Existing possessive sub-walk unaffected ---

  it('existing possessive sub-walk without pronominal adjective still works (ʻeku tohi)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Should render normally without definitive accent (no pronominal adjective taken)
    const rendered = getRenderedPath(s)
    const headNounStep = rendered.find(st => st.nodeId === 'possessive_head_noun')
    expect(headNounStep.renderedTongan).toBe('tohi')
  })
})

// Phase 2C.5f — faka- prefix data + schema (Ch 32)
// ============================================================================
//
// Spec §37 faka- prefix: derivational morphology stored as a flat `faka_form`
// field on base word entries, NOT a new walker node. The prefix attaches to
// nouns, adjectives, and verbs to derive new words: manner/likeness (faka-Tonga),
// causative transitive (fakamohe), causative reflexive (fakataha), temporal
// adverb (fakaʻaho), and narrowing (faka-e-).
//
// Shipped:
//   - Schema: FAKA_FORM_FUNCTIONS enum; faka_form shape validation in
//     validateWords (required: tongan, english, function, min_chapter;
//     optional: tags). Rejects unknown fields, bad function values, non-integer
//     min_chapter, non-string tags.
//   - Data: faka_form added to 6 existing word entries across 3 nodes:
//     verb (mohe → fakamohe, foki → fakafoki, ako → fakaako),
//     modifier (lelei → fakalelei, mālohi → fakamālohi),
//     prep_phrase (Tonga → faka-Tonga) × 2 instances.
//   - No new nodes, entry points, or walker changes — pure data + schema.
//
// Deferred:
//   - Full faka- inventory across all verbs/nouns/adjectives
//   - causative_reflexive entries (base words taha, mamaʻo not in graph)
//   - temporal_adverb entries (base words ʻaho, uike, māhina, taʻu not in graph)
//   - faka-e- narrowing variant (separate faka_e_form field, §37 Ch 32)
//   - faka- + reduplication interaction (Ch 50, §45)
//   - Walker-level render pass / substitution mechanism
//   - faka_form_hyphenated auto-derivation from noun_class
//   - time_period flag on time-period nouns
describe('2C.5f — faka- prefix data + schema (Ch 32)', () => {

  // --- Data guards ---

  const FAKA_ENRICHED = [
    { nodeId: 'verb', tongan: 'mohe', fakaForm: 'fakamohe', fn: 'causative_transitive' },
    { nodeId: 'verb', tongan: 'foki', fakaForm: 'fakafoki', fn: 'causative_transitive' },
    { nodeId: 'verb', tongan: 'ako', fakaForm: 'fakaako', fn: 'manner' },
    { nodeId: 'modifier', tongan: 'lelei', fakaForm: 'fakalelei', fn: 'causative_transitive' },
    { nodeId: 'modifier', tongan: 'mālohi', fakaForm: 'fakamālohi', fn: 'causative_transitive' },
    { nodeId: 'prep_phrase', tongan: 'Tonga', fakaForm: 'faka-Tonga', fn: 'manner' },
  ]

  it('all 6 enriched entries carry well-formed faka_form', () => {
    for (const { nodeId, tongan, fakaForm, fn } of FAKA_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.faka_form, `${nodeId}.${tongan} missing faka_form`).toBeDefined()
      expect(w.faka_form.tongan).toBe(fakaForm)
      expect(typeof w.faka_form.english).toBe('string')
      expect(w.faka_form.function).toBe(fn)
      expect(w.faka_form.min_chapter).toBe(32)
    }
  })

  it('faka_form function distribution covers causative_transitive + manner', () => {
    const functions = FAKA_ENRICHED.map(e => e.fn)
    expect(functions.filter(f => f === 'causative_transitive').length).toBeGreaterThanOrEqual(2)
    expect(functions.filter(f => f === 'manner').length).toBeGreaterThanOrEqual(2)
  })

  it('faka_form.min_chapter is always 32 (Ch 32 introduces faka-)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.faka_form) {
          expect(w.faka_form.min_chapter, `${nodeId}.${w.tongan} faka_form.min_chapter`).toBe(32)
        }
      }
    }
  })

  it('faka_form.tags (when present) is an array of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.faka_form?.tags) {
          expect(Array.isArray(w.faka_form.tags), `${nodeId}.${w.tongan} faka_form.tags`).toBe(true)
          for (const t of w.faka_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (faka_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const fakaErrors = errors.filter(e => e.includes('faka_form'))
    expect(fakaErrors, 'faka_form validation errors').toEqual([])
  })

  it('schema rejects faka_form missing required function field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].faka_form = {
      tongan: 'fakatest', english: 'test', min_chapter: 32,
      // function intentionally missing
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('faka_form') && e.includes('function') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects faka_form with unknown function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].faka_form = {
      tongan: 'fakatest', english: 'test', function: 'invented_function', min_chapter: 32,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('faka_form') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects faka_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].faka_form = {
      tongan: 'fakatest', english: 'test', function: 'manner', min_chapter: 'thirty-two',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('faka_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects faka_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].faka_form = {
      tongan: 'fakatest', english: 'test', function: 'manner', min_chapter: 32,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('faka_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects faka_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].faka_form = 'fakamohe'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('faka_form') && e.includes('must be an object'))).toBe(true)
  })
})

// ============================================================================
// 2C.5g — taʻe- prefix data + schema (Ch 43)
// ============================================================================
//
// Spec §42 (Ch 43): taʻe- is a productive negation prefix that creates
// negative or "without" forms — parallel to English "un-," "in-," or "without."
// Three contexts: (1) before nouns → "without" (ta'e su = without shoes),
// (2) before verbs/adjectives → "un-, not" (ta'e mahino = unclear),
// (3) before te + pronoun + verb → "without doing."
//
// Uses the same sibling-field pattern as faka_form (2C.5f): ta_e_form on base
// word entries, not new walker nodes.
//
// Shipped:
//   - Schema: TA_E_FORM_FUNCTIONS enum (negation, without, un_negation);
//     ta_e_form shape validation in validateWords (required: tongan, english,
//     function, min_chapter; optional: tags). Rejects unknown fields, bad
//     function values, non-integer min_chapter, non-string tags.
//   - Data: ta_e_form added to 6 existing word entries across 4 nodes:
//     verb (fiefia → taʻe fiefia, ʻofa → taʻe ʻofa),
//     verb_experiencer (mahino → taʻe mahino),
//     modifier (lelei → taʻe lelei, mālohi → taʻe mālohi),
//     attributive_adjective (lelei → taʻe lelei).
//   - No new nodes, entry points, or walker changes — pure data + schema.
//
// Deferred:
//   - Full taʻe- inventory across all adjectives/verbs/nouns
//   - "without" function entries (nouns: su, totongi not in graph)
//   - "un_negation" function refinement (using "negation" for all current entries)
//   - taʻe te + pronoun clause extension (ta_e_te_clause)
//   - Double-negative emphatic positive (ʻikai + taʻe-) detection
//   - talaʻehai / koloto / neʻineʻi / mole ke mamaʻo idiom entries
//   - Walker-level render pass / substitution mechanism
describe('2C.5g — taʻe- prefix data + schema (Ch 43)', () => {

  // --- Data guards ---

  const TA_E_ENRICHED = [
    { nodeId: 'verb', tongan: 'fiefia', taEForm: 'taʻe fiefia', fn: 'negation' },
    { nodeId: 'verb', tongan: 'ʻofa', taEForm: 'taʻe ʻofa', fn: 'negation' },
    { nodeId: 'verb_experiencer', tongan: 'mahino', taEForm: 'taʻe mahino', fn: 'negation' },
    { nodeId: 'modifier', tongan: 'lelei', taEForm: 'taʻe lelei', fn: 'negation' },
    { nodeId: 'modifier', tongan: 'mālohi', taEForm: 'taʻe mālohi', fn: 'negation' },
    { nodeId: 'attributive_adjective', tongan: 'lelei', taEForm: 'taʻe lelei', fn: 'negation' },
  ]

  it('all 6 enriched entries carry well-formed ta_e_form', () => {
    for (const { nodeId, tongan, taEForm, fn } of TA_E_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.ta_e_form, `${nodeId}.${tongan} missing ta_e_form`).toBeDefined()
      expect(w.ta_e_form.tongan).toBe(taEForm)
      expect(typeof w.ta_e_form.english).toBe('string')
      expect(w.ta_e_form.function).toBe(fn)
      expect(w.ta_e_form.min_chapter).toBe(43)
    }
  })

  it('ta_e_form function distribution — all current entries use negation', () => {
    const functions = TA_E_ENRICHED.map(e => e.fn)
    expect(functions.every(f => f === 'negation')).toBe(true)
    expect(functions.length).toBeGreaterThanOrEqual(6)
  })

  it('ta_e_form.min_chapter is always 43 (Ch 43 introduces taʻe-)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ta_e_form) {
          expect(w.ta_e_form.min_chapter, `${nodeId}.${w.tongan} ta_e_form.min_chapter`).toBe(43)
        }
      }
    }
  })

  it('ta_e_form.tags (when present) is an array of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ta_e_form?.tags) {
          expect(Array.isArray(w.ta_e_form.tags), `${nodeId}.${w.tongan} ta_e_form.tags`).toBe(true)
          for (const t of w.ta_e_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (ta_e_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const taEErrors = errors.filter(e => e.includes('ta_e_form'))
    expect(taEErrors, 'ta_e_form validation errors').toEqual([])
  })

  it('schema rejects ta_e_form missing required function field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ta_e_form = {
      tongan: 'taʻe test', english: 'test', min_chapter: 43,
      // function intentionally missing
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ta_e_form') && e.includes('function') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects ta_e_form with unknown function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ta_e_form = {
      tongan: 'taʻe test', english: 'test', function: 'invented_function', min_chapter: 43,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ta_e_form') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects ta_e_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ta_e_form = {
      tongan: 'taʻe test', english: 'test', function: 'negation', min_chapter: 'forty-three',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ta_e_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects ta_e_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ta_e_form = {
      tongan: 'taʻe test', english: 'test', function: 'negation', min_chapter: 43,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ta_e_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ta_e_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ta_e_form = 'taʻe fiefia'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ta_e_form') && e.includes('must be an object'))).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 2C.5h — Reduplication data + schema (Ch 50)
// ────────────────────────────────────────────────────────────────────────────

describe('2C.5h — reduplication data + schema (Ch 50)', () => {
  const REDUP_ENRICHED = [
    { nodeId: 'verb', tongan: 'sio', redupTongan: 'siosio', type: 'complete', effect: 'plurality' },
    { nodeId: 'verb', tongan: 'fanongo', redupTongan: 'fanongōnongo', type: 'partial_middle', effect: 'meaning_shift' },
    { nodeId: 'verb', tongan: 'langa', redupTongan: 'lalanga', type: 'partial_early', effect: 'meaning_shift' },
    { nodeId: 'modifier', tongan: 'lahi', redupTongan: 'lahilahi', type: 'complete', effect: 'moderation' },
    { nodeId: 'attributive_adjective', tongan: 'foʻou', redupTongan: 'foʻofoʻou', type: 'partial_early', effect: 'moderation' },
    { nodeId: 'attributive_adjective', tongan: 'lahi', redupTongan: 'lahilahi', type: 'complete', effect: 'moderation' },
  ]

  it('all 6 enriched entries carry well-formed reduplication', () => {
    for (const { nodeId, tongan, redupTongan, type, effect } of REDUP_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.reduplication, `${nodeId}.${tongan} missing reduplication`).toBeDefined()
      expect(w.reduplication.tongan).toBe(redupTongan)
      expect(typeof w.reduplication.english).toBe('string')
      expect(w.reduplication.type).toBe(type)
      expect(w.reduplication.effect).toBe(effect)
      expect(w.reduplication.min_chapter).toBe(50)
    }
  })

  it('reduplication type distribution — all three current types represented', () => {
    const types = new Set(REDUP_ENRICHED.map(e => e.type))
    expect(types.has('complete')).toBe(true)
    expect(types.has('partial_early')).toBe(true)
    expect(types.has('partial_middle')).toBe(true)
  })

  it('reduplication effect distribution — plurality, moderation, and meaning_shift represented', () => {
    const effects = new Set(REDUP_ENRICHED.map(e => e.effect))
    expect(effects.has('plurality')).toBe(true)
    expect(effects.has('moderation')).toBe(true)
    expect(effects.has('meaning_shift')).toBe(true)
  })

  it('reduplication.min_chapter is always 50 (Ch 50 introduces reduplication)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.reduplication) {
          expect(w.reduplication.min_chapter, `${nodeId}.${w.tongan} reduplication.min_chapter`).toBe(50)
        }
      }
    }
  })

  it('reduplication.tags (when present) is an array of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.reduplication?.tags) {
          expect(Array.isArray(w.reduplication.tags), `${nodeId}.${w.tongan} reduplication.tags`).toBe(true)
          for (const t of w.reduplication.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (reduplication entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const redupErrors = errors.filter(e => e.includes('reduplication'))
    expect(redupErrors, 'reduplication validation errors').toEqual([])
  })

  it('schema rejects reduplication missing required type field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = {
      tongan: 'test', english: 'test', effect: 'plurality', min_chapter: 50,
      // type intentionally missing
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('type') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects reduplication with unknown type value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = {
      tongan: 'test', english: 'test', type: 'invented_type', effect: 'plurality', min_chapter: 50,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('unknown type'))).toBe(true)
  })

  it('schema rejects reduplication missing required effect field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = {
      tongan: 'test', english: 'test', type: 'complete', min_chapter: 50,
      // effect intentionally missing
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('effect') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects reduplication with unknown effect value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = {
      tongan: 'test', english: 'test', type: 'complete', effect: 'invented_effect', min_chapter: 50,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('unknown effect'))).toBe(true)
  })

  it('schema rejects reduplication with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = {
      tongan: 'test', english: 'test', type: 'complete', effect: 'plurality', min_chapter: 'fifty',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects reduplication with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = {
      tongan: 'test', english: 'test', type: 'complete', effect: 'plurality', min_chapter: 50,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects reduplication that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].reduplication = 'siosio'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('reduplication') && e.includes('must be an object'))).toBe(true)
  })
})

// ───────────────��────────────────────────────────────────────────────────────
// 2C.5i — Instrumental ʻaki + suffix -ʻi data + schema (Ch 33)
// ────────────────────────────────────────────────────────────────────────────

describe('2C.5i — instrumental ʻaki + suffix -ʻi data + schema (Ch 33)', () => {
  const TRANSITIVE_I_ENRICHED = [
    { nodeId: 'verb', tongan: 'tokoni', suffixTongan: 'tokoniʻi', fn: 'transitive' },
    { nodeId: 'verb', tongan: 'kole', suffixTongan: 'koleʻi', fn: 'transitive' },
    { nodeId: 'verb', tongan: 'langa', suffixTongan: 'langaʻi', fn: 'transitive' },
    { nodeId: 'verb', tongan: 'ako', suffixTongan: 'akoʻi', fn: 'transitive' },
  ]

  const AKI_SUFFIX_ENRICHED = [
    { nodeId: 'verb', tongan: 'ngāue', suffixTongan: 'ngāueʻaki', fn: 'use_as' },
  ]

  it('all 4 transitive_i_form entries carry well-formed suffix data', () => {
    for (const { nodeId, tongan, suffixTongan, fn } of TRANSITIVE_I_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.transitive_i_form, `${nodeId}.${tongan} missing transitive_i_form`).toBeDefined()
      expect(w.transitive_i_form.tongan).toBe(suffixTongan)
      expect(typeof w.transitive_i_form.english).toBe('string')
      expect(w.transitive_i_form.function).toBe(fn)
      expect(w.transitive_i_form.min_chapter).toBe(33)
    }
  })

  it('aki_suffix_form entry carries well-formed suffix data', () => {
    for (const { nodeId, tongan, suffixTongan, fn } of AKI_SUFFIX_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.aki_suffix_form, `${nodeId}.${tongan} missing aki_suffix_form`).toBeDefined()
      expect(w.aki_suffix_form.tongan).toBe(suffixTongan)
      expect(typeof w.aki_suffix_form.english).toBe('string')
      expect(w.aki_suffix_form.function).toBe(fn)
      expect(w.aki_suffix_form.min_chapter).toBe(33)
    }
  })

  it('transitive_i_form function distribution — all entries use transitive function', () => {
    const fns = new Set(TRANSITIVE_I_ENRICHED.map(e => e.fn))
    expect(fns.has('transitive')).toBe(true)
  })

  it('all suffix min_chapter values are 33 (Ch 33 introduces instrumental ʻaki / suffix -ʻi)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.transitive_i_form) {
          expect(w.transitive_i_form.min_chapter, `${nodeId}.${w.tongan} transitive_i_form.min_chapter`).toBe(33)
        }
        if (w.aki_suffix_form) {
          expect(w.aki_suffix_form.min_chapter, `${nodeId}.${w.tongan} aki_suffix_form.min_chapter`).toBe(33)
        }
      }
    }
  })

  it('suffix tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.transitive_i_form?.tags) {
          expect(Array.isArray(w.transitive_i_form.tags), `${nodeId}.${w.tongan} transitive_i_form.tags`).toBe(true)
          for (const t of w.transitive_i_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
        if (w.aki_suffix_form?.tags) {
          expect(Array.isArray(w.aki_suffix_form.tags), `${nodeId}.${w.tongan} aki_suffix_form.tags`).toBe(true)
          for (const t of w.aki_suffix_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (suffix entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('transitive_i_form') || e.includes('aki_suffix_form') || e.includes('executive_i_form'))
    expect(suffixErrors, 'suffix validation errors').toEqual([])
  })

  it('schema rejects transitive_i_form missing required function field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_i_form = {
      tongan: 'test', english: 'test', min_chapter: 33,
      // function intentionally missing
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_i_form') && e.includes('function') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects transitive_i_form with unknown function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_i_form = {
      tongan: 'test', english: 'test', function: 'invented_fn', min_chapter: 33,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_i_form') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects transitive_i_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_i_form = {
      tongan: 'test', english: 'test', function: 'transitive', min_chapter: 'thirty-three',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_i_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects transitive_i_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_i_form = {
      tongan: 'test', english: 'test', function: 'transitive', min_chapter: 33,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_i_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects transitive_i_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_i_form = 'tokoniʻi'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_i_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects aki_suffix_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].aki_suffix_form = 'ngāueʻaki'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('aki_suffix_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects aki_suffix_form with unknown function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].aki_suffix_form = {
      tongan: 'test', english: 'test', function: 'invented_fn', min_chapter: 33,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('aki_suffix_form') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects executive_i_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].executive_i_form = 'tāpuniʻi'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('executive_i_form') && e.includes('must be an object'))).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// 2C.5j — Productive suffixes -ʻanga + -nga data + schema (Ch 48)
// ────────────────────────────────────────────────────────────────────────────

describe('2C.5j — productive suffixes -ʻanga + -nga data + schema (Ch 48)', () => {
  const ANGA_FORM_ENRICHED = [
    { nodeId: 'verb', tongan: 'kai', suffixTongan: 'kaiʻanga', fn: 'place' },
    { nodeId: 'verb', tongan: 'mohe', suffixTongan: 'moheʻanga', fn: 'place' },
    { nodeId: 'verb', tongan: 'nofo', suffixTongan: 'nofoʻanga', fn: 'place' },
    { nodeId: 'verb', tongan: 'ngāue', suffixTongan: 'ngāueʻanga', fn: 'place' },
    { nodeId: 'verb', tongan: 'ako', suffixTongan: 'akoʻanga', fn: 'place' },
    { nodeId: 'verb', tongan: 'fiefia', suffixTongan: 'fiefiaʻanga', fn: 'source' },
  ]

  const NGA_FORM_ENRICHED = [
    { nodeId: 'verb', tongan: 'mohe', suffixTongan: 'mohenga', fn: 'thing' },
    { nodeId: 'verb', tongan: 'ako', suffixTongan: 'ākonga', fn: 'thing' },
  ]

  it('all 6 anga_form entries carry well-formed suffix data', () => {
    for (const { nodeId, tongan, suffixTongan, fn } of ANGA_FORM_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.anga_form, `${nodeId}.${tongan} missing anga_form`).toBeDefined()
      expect(w.anga_form.tongan).toBe(suffixTongan)
      expect(typeof w.anga_form.english).toBe('string')
      expect(w.anga_form.function).toBe(fn)
      expect(w.anga_form.min_chapter).toBe(48)
    }
  })

  it('both nga_form entries carry well-formed suffix data', () => {
    for (const { nodeId, tongan, suffixTongan, fn } of NGA_FORM_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.nga_form, `${nodeId}.${tongan} missing nga_form`).toBeDefined()
      expect(w.nga_form.tongan).toBe(suffixTongan)
      expect(typeof w.nga_form.english).toBe('string')
      expect(w.nga_form.function).toBe(fn)
      expect(w.nga_form.min_chapter).toBe(48)
    }
  })

  it('anga_form function distribution — 5 place + 1 source', () => {
    const fns = ANGA_FORM_ENRICHED.map(e => e.fn)
    expect(fns.filter(f => f === 'place').length).toBe(5)
    expect(fns.filter(f => f === 'source').length).toBe(1)
  })

  it('all anga_form min_chapter values are 48 (Ch 48 introduces productive suffixes)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.anga_form) {
          expect(w.anga_form.min_chapter, `${nodeId}.${w.tongan} anga_form.min_chapter`).toBe(48)
        }
      }
    }
  })

  it('all nga_form min_chapter values are 48 (Ch 48 introduces productive suffixes)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.nga_form) {
          expect(w.nga_form.min_chapter, `${nodeId}.${w.tongan} nga_form.min_chapter`).toBe(48)
        }
      }
    }
  })

  it('suffix tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.anga_form?.tags) {
          expect(Array.isArray(w.anga_form.tags), `${nodeId}.${w.tongan} anga_form.tags`).toBe(true)
          for (const t of w.anga_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
        if (w.nga_form?.tags) {
          expect(Array.isArray(w.nga_form.tags), `${nodeId}.${w.tongan} nga_form.tags`).toBe(true)
          for (const t of w.nga_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (anga_form + nga_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('anga_form') || e.includes('nga_form'))
    expect(suffixErrors, 'suffix validation errors').toEqual([])
  })

  it('schema rejects anga_form missing required function field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].anga_form = {
      tongan: 'test', english: 'test', min_chapter: 48,
      // function intentionally missing
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('anga_form') && e.includes('function') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects anga_form with unknown function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].anga_form = {
      tongan: 'test', english: 'test', function: 'invented_fn', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('anga_form') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects anga_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].anga_form = {
      tongan: 'test', english: 'test', function: 'place', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('anga_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects anga_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].anga_form = {
      tongan: 'test', english: 'test', function: 'place', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('anga_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects anga_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].anga_form = 'nofoʻanga'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('anga_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects nga_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].nga_form = 'mohenga'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('nga_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects nga_form with unknown function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].nga_form = {
      tongan: 'test', english: 'test', function: 'invented_fn', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('nga_form') && e.includes('unknown function'))).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────

describe('2C.5k — transitive durational -a suffix data + schema (Ch 48)', () => {
  const TRANSITIVE_A_ENRICHED = [
    { nodeId: 'verb', tongan: 'kai', suffixTongan: 'kaia' },
    { nodeId: 'verb', tongan: 'inu', suffixTongan: 'inua' },
    { nodeId: 'verb', tongan: 'mohe', suffixTongan: 'mohea' },
    { nodeId: 'verb', tongan: 'folau', suffixTongan: 'folaua' },
  ]

  it('all 4 transitive_a_form entries carry well-formed suffix data', () => {
    for (const { nodeId, tongan, suffixTongan } of TRANSITIVE_A_ENRICHED) {
      const node = grammarGraph.nodes[nodeId]
      const w = node.words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.transitive_a_form, `${nodeId}.${tongan} missing transitive_a_form`).toBeDefined()
      expect(w.transitive_a_form.tongan).toBe(suffixTongan)
      expect(typeof w.transitive_a_form.english).toBe('string')
      expect(w.transitive_a_form.min_chapter).toBe(48)
    }
  })

  it('all transitive_a_form min_chapter values are 48 (Ch 48 introduces productive suffixes)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.transitive_a_form) {
          expect(w.transitive_a_form.min_chapter, `${nodeId}.${w.tongan} transitive_a_form.min_chapter`).toBe(48)
        }
      }
    }
  })

  it('all transitive_a_form entries carry durational tags', () => {
    for (const { nodeId, tongan } of TRANSITIVE_A_ENRICHED) {
      const w = grammarGraph.nodes[nodeId].words.find(w => w.tongan === tongan)
      expect(w.transitive_a_form.tags, `${nodeId}.${tongan} tags`).toBeDefined()
      expect(w.transitive_a_form.tags).toContain('durational')
      expect(w.transitive_a_form.tags).toContain('transitive')
    }
  })

  it('suffix tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.transitive_a_form?.tags) {
          expect(Array.isArray(w.transitive_a_form.tags), `${nodeId}.${w.tongan} transitive_a_form.tags`).toBe(true)
          for (const t of w.transitive_a_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (transitive_a_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('transitive_a_form'))
    expect(suffixErrors, 'suffix validation errors').toEqual([])
  })

  it('schema rejects transitive_a_form missing required tongan field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_a_form = {
      english: 'test', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_a_form') && e.includes('tongan') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects transitive_a_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_a_form = {
      tongan: 'test', english: 'test', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_a_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects transitive_a_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_a_form = {
      tongan: 'test', english: 'test', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_a_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects transitive_a_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].transitive_a_form = 'folaua'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('transitive_a_form') && e.includes('must be an object'))).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// 2C.5l — stative suffix forms data + schema (Ch 48, §47)
// ──────────────────────────────────────────────────────────────────────────────
describe('2C.5l — stative suffix forms (§47 Ch 48)', () => {
  const STATIVE_SUFFIX_ENRICHED = [
    { nodeId: 'object', tongan: 'vai',  suffixTongan: 'vaia',  suffixType: 'a' },
    { nodeId: 'object', tongan: 'pulu', suffixTongan: 'pulua', suffixType: 'a' },
    { nodeId: 'object', tongan: 'talo', suffixTongan: 'taloa', suffixType: 'a' },
  ]

  // --- Data guards ---

  it('each enriched word has a stative_suffix_form with correct tongan value', () => {
    for (const { nodeId, tongan, suffixTongan } of STATIVE_SUFFIX_ENRICHED) {
      const w = grammarGraph.nodes[nodeId].words.find(w => w.tongan === tongan)
      expect(w, `${nodeId}.${tongan} not found`).toBeDefined()
      expect(w.stative_suffix_form, `${nodeId}.${tongan} missing stative_suffix_form`).toBeDefined()
      expect(w.stative_suffix_form.tongan).toBe(suffixTongan)
      expect(typeof w.stative_suffix_form.english).toBe('string')
      expect(w.stative_suffix_form.min_chapter).toBe(48)
    }
  })

  it('each enriched word carries the correct suffix_type', () => {
    for (const { nodeId, tongan, suffixType } of STATIVE_SUFFIX_ENRICHED) {
      const w = grammarGraph.nodes[nodeId].words.find(w => w.tongan === tongan)
      expect(w.stative_suffix_form.suffix_type, `${nodeId}.${tongan} suffix_type`).toBe(suffixType)
    }
  })

  it('all stative_suffix_form min_chapter values are 48 (Ch 48 introduces productive suffixes)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.stative_suffix_form) {
          expect(w.stative_suffix_form.min_chapter, `${nodeId}.${w.tongan} stative_suffix_form.min_chapter`).toBe(48)
        }
      }
    }
  })

  it('suffix_type values belong to the valid enum (a, fia, hia, ia, ina)', () => {
    const VALID = new Set(['a', 'fia', 'hia', 'ia', 'ina'])
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.stative_suffix_form?.suffix_type) {
          expect(VALID.has(w.stative_suffix_form.suffix_type), `${nodeId}.${w.tongan} suffix_type ${w.stative_suffix_form.suffix_type}`).toBe(true)
        }
      }
    }
  })

  it('suffix tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.stative_suffix_form?.tags) {
          expect(Array.isArray(w.stative_suffix_form.tags), `${nodeId}.${w.tongan} stative_suffix_form.tags`).toBe(true)
          for (const t of w.stative_suffix_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  // --- Schema validation ---

  it('schema validation passes with live data (stative_suffix_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('stative_suffix_form'))
    expect(suffixErrors, 'suffix validation errors').toEqual([])
  })

  it('schema rejects stative_suffix_form missing required tongan field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].stative_suffix_form = {
      english: 'test', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('stative_suffix_form') && e.includes('tongan') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects stative_suffix_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].stative_suffix_form = {
      tongan: 'test', english: 'test', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('stative_suffix_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects stative_suffix_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].stative_suffix_form = {
      tongan: 'test', english: 'test', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('stative_suffix_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects stative_suffix_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].stative_suffix_form = 'vaia'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('stative_suffix_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects stative_suffix_form with invalid suffix_type', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].stative_suffix_form = {
      tongan: 'test', english: 'test', min_chapter: 48,
      suffix_type: 'bogus',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('stative_suffix_form') && e.includes('suffix_type') && e.includes('unknown'))).toBe(true)
  })
})

describe('2C.5m — -ʻia suffix forms (§47 Ch 48)', () => {
  const IA_SUFFIX_ENRICHED = [
    { nodeId: 'verb',     tongan: 'fiefia',  suffixTongan: 'fiefiaʻia',  fn: 'regarding_as' },
    { nodeId: 'modifier', tongan: 'lelei',   suffixTongan: 'leleiʻia',   fn: 'regarding_as' },
    { nodeId: 'modifier', tongan: 'mālohi',  suffixTongan: 'mālohiʻia',  fn: 'regarding_as' },
  ]

  // --- Data guards ---

  it('each enriched word has an ia_suffix_form with correct tongan value', () => {
    for (const { nodeId, tongan, suffixTongan } of IA_SUFFIX_ENRICHED) {
      const word = grammarGraph.nodes[nodeId].words.find(w => w.tongan === tongan)
      expect(word, `${nodeId}.${tongan} must exist`).toBeDefined()
      expect(word.ia_suffix_form, `${nodeId}.${tongan} must have ia_suffix_form`).toBeDefined()
      expect(word.ia_suffix_form.tongan, `${nodeId}.${tongan} ia_suffix_form.tongan`).toBe(suffixTongan)
    }
  })

  it('all ia_suffix_form.min_chapter values are 48', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ia_suffix_form) {
          expect(w.ia_suffix_form.min_chapter, `${nodeId}.${w.tongan} ia_suffix_form.min_chapter`).toBe(48)
        }
      }
    }
  })

  it('function values belong to the valid enum (possessing, regarding_as, emphasizing)', () => {
    const VALID = new Set(['possessing', 'regarding_as', 'emphasizing'])
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ia_suffix_form?.function) {
          expect(VALID.has(w.ia_suffix_form.function), `${nodeId}.${w.tongan} function ${w.ia_suffix_form.function}`).toBe(true)
        }
      }
    }
  })

  it('suffix tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ia_suffix_form?.tags) {
          expect(Array.isArray(w.ia_suffix_form.tags), `${nodeId}.${w.tongan} ia_suffix_form.tags`).toBe(true)
          for (const t of w.ia_suffix_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  it('at least 3 words carry ia_suffix_form across the graph', () => {
    let count = 0
    for (const node of Object.values(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ia_suffix_form) count++
      }
    }
    expect(count).toBeGreaterThanOrEqual(3)
  })

  // --- Schema validation ---

  it('schema validation passes with live data (ia_suffix_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('ia_suffix_form'))
    expect(suffixErrors, 'suffix validation errors').toEqual([])
  })

  it('schema rejects ia_suffix_form missing required tongan field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.modifier.words[0].ia_suffix_form = {
      english: 'test', function: 'possessing', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ia_suffix_form') && e.includes('tongan') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects ia_suffix_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.modifier.words[0].ia_suffix_form = {
      tongan: 'test', english: 'test', function: 'possessing', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ia_suffix_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects ia_suffix_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.modifier.words[0].ia_suffix_form = {
      tongan: 'test', english: 'test', function: 'possessing', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ia_suffix_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ia_suffix_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.modifier.words[0].ia_suffix_form = 'leleiʻia'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ia_suffix_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects ia_suffix_form with invalid function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.modifier.words[0].ia_suffix_form = {
      tongan: 'test', english: 'test', function: 'bogus', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ia_suffix_form') && e.includes('function') && e.includes('unknown'))).toBe(true)
  })
})

// ─── 2C.5n: -ngataʻa/-ngofua difficulty suffixes data + schema (Ch 48) ──────

describe('2C.5n — ngata_a_form / ngofua_form (difficulty suffixes)', () => {
  // --- Data guards: ngata_a_form ---

  it('all ngata_a_form entries have required fields (tongan, english, min_chapter)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ngata_a_form) {
          expect(typeof w.ngata_a_form.tongan, `${nodeId}.${w.tongan} ngata_a_form.tongan`).toBe('string')
          expect(typeof w.ngata_a_form.english, `${nodeId}.${w.tongan} ngata_a_form.english`).toBe('string')
          expect(Number.isInteger(w.ngata_a_form.min_chapter) && w.ngata_a_form.min_chapter > 0,
            `${nodeId}.${w.tongan} ngata_a_form.min_chapter`).toBe(true)
        }
      }
    }
  })

  it('ngata_a_form tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ngata_a_form?.tags) {
          expect(Array.isArray(w.ngata_a_form.tags), `${nodeId}.${w.tongan} ngata_a_form.tags`).toBe(true)
          for (const t of w.ngata_a_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  it('at least 2 words carry ngata_a_form across the graph', () => {
    let count = 0
    for (const node of Object.values(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ngata_a_form) count++
      }
    }
    expect(count).toBeGreaterThanOrEqual(2)
  })

  // --- Data guards: ngofua_form ---

  it('all ngofua_form entries have required fields (tongan, english, min_chapter)', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ngofua_form) {
          expect(typeof w.ngofua_form.tongan, `${nodeId}.${w.tongan} ngofua_form.tongan`).toBe('string')
          expect(typeof w.ngofua_form.english, `${nodeId}.${w.tongan} ngofua_form.english`).toBe('string')
          expect(Number.isInteger(w.ngofua_form.min_chapter) && w.ngofua_form.min_chapter > 0,
            `${nodeId}.${w.tongan} ngofua_form.min_chapter`).toBe(true)
        }
      }
    }
  })

  it('ngofua_form tags (when present) are arrays of strings', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ngofua_form?.tags) {
          expect(Array.isArray(w.ngofua_form.tags), `${nodeId}.${w.tongan} ngofua_form.tags`).toBe(true)
          for (const t of w.ngofua_form.tags) {
            expect(typeof t).toBe('string')
          }
        }
      }
    }
  })

  it('at least 2 words carry ngofua_form across the graph', () => {
    let count = 0
    for (const node of Object.values(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.ngofua_form) count++
      }
    }
    expect(count).toBeGreaterThanOrEqual(2)
  })

  // --- Schema validation ---

  it('schema validation passes with live data (ngata_a_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('ngata_a_form'))
    expect(suffixErrors, 'ngata_a_form validation errors').toEqual([])
  })

  it('schema validation passes with live data (ngofua_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('ngofua_form'))
    expect(suffixErrors, 'ngofua_form validation errors').toEqual([])
  })

  it('schema rejects ngata_a_form missing required tongan field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngata_a_form = {
      english: 'test', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngata_a_form') && e.includes('tongan') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects ngata_a_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngata_a_form = {
      tongan: 'test', english: 'test', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngata_a_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects ngata_a_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngata_a_form = {
      tongan: 'test', english: 'test', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngata_a_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ngata_a_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngata_a_form = 'alungataʻa'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngata_a_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects ngofua_form missing required tongan field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngofua_form = {
      english: 'test', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngofua_form') && e.includes('tongan') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects ngofua_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngofua_form = {
      tongan: 'test', english: 'test', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngofua_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects ngofua_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngofua_form = {
      tongan: 'test', english: 'test', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngofua_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ngofua_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ngofua_form = 'itangofua'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ngofua_form') && e.includes('must be an object'))).toBe(true)
  })

  // --- Schema validation: compound_i_form (2C.5o) ---

  it('schema validation passes with live data (compound_i_form entries accepted)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const suffixErrors = errors.filter(e => e.includes('compound_i_form'))
    expect(suffixErrors, 'compound_i_form validation errors').toEqual([])
  })

  it('schema accepts well-formed compound_i_form with all fields', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', second_noun: 'hele',
      tongan: 'mataʻi hele', english: 'knife-blade',
      min_chapter: 48, idiomatic: false, tags: ['compound'],
    }
    const errors = validateGrammarGraph(d)
    const suffixErrors = errors.filter(e => e.includes('compound_i_form'))
    expect(suffixErrors, 'well-formed compound_i_form should produce no errors').toEqual([])
  })

  it('schema accepts minimal compound_i_form (required fields only)', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', second_noun: 'hele',
      tongan: 'mataʻi hele', english: 'knife-blade',
      min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    const suffixErrors = errors.filter(e => e.includes('compound_i_form'))
    expect(suffixErrors, 'minimal compound_i_form should produce no errors').toEqual([])
  })

  it('schema rejects compound_i_form missing required first_noun field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      second_noun: 'hele', tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('first_noun') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects compound_i_form missing required second_noun field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('second_noun') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects compound_i_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', second_noun: 'hele',
      tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 'forty-eight',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects compound_i_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', second_noun: 'hele',
      tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 48,
      bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects compound_i_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = 'mataʻi hele'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects compound_i_form with non-boolean idiomatic', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', second_noun: 'hele',
      tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 48,
      idiomatic: 'yes',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('idiomatic') && e.includes('must be a boolean'))).toBe(true)
  })

  it('schema rejects compound_i_form with non-string first_noun', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 42, second_noun: 'hele',
      tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('first_noun') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects compound_i_form with non-string second_noun', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].compound_i_form = {
      first_noun: 'mata', second_noun: 99,
      tongan: 'mataʻi hele', english: 'knife-blade', min_chapter: 48,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('compound_i_form') && e.includes('second_noun') && e.includes('must be a string'))).toBe(true)
  })

  // ── 2C.5p — fe_aki_form reciprocal/reciprocative schema (§48 Ch 49) ──

  // Data guard tests: verify enriched entries exist with correct fields
  it('verb ʻofa has fe_aki_form feʻofaʻaki (reciprocal)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'ʻofa')
    expect(w.fe_aki_form).toBeDefined()
    expect(w.fe_aki_form.tongan).toBe('feʻofaʻaki')
    expect(w.fe_aki_form.english).toBe('love one another')
    expect(w.fe_aki_form.function).toBe('reciprocal')
    expect(w.fe_aki_form.requires_plural_or_dual_subject).toBe(true)
    expect(w.fe_aki_form.min_chapter).toBe(49)
  })

  it('verb tokoni has fe_aki_form fetokoniʻaki (reciprocal)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'tokoni')
    expect(w.fe_aki_form).toBeDefined()
    expect(w.fe_aki_form.tongan).toBe('fetokoniʻaki')
    expect(w.fe_aki_form.function).toBe('reciprocal')
    expect(w.fe_aki_form.requires_plural_or_dual_subject).toBe(true)
    expect(w.fe_aki_form.min_chapter).toBe(49)
  })

  it('verb lea has fe_aki_form feleaʻaki (reciprocal)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'lea')
    expect(w.fe_aki_form).toBeDefined()
    expect(w.fe_aki_form.tongan).toBe('feleaʻaki')
    expect(w.fe_aki_form.function).toBe('reciprocal')
    expect(w.fe_aki_form.requires_plural_or_dual_subject).toBe(true)
    expect(w.fe_aki_form.min_chapter).toBe(49)
  })

  it('verb ʻalu has fe_aki_form feʻaluʻaki (reciprocative)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'ʻalu')
    expect(w.fe_aki_form).toBeDefined()
    expect(w.fe_aki_form.tongan).toBe('feʻaluʻaki')
    expect(w.fe_aki_form.english).toBe('go back and forth')
    expect(w.fe_aki_form.function).toBe('reciprocative')
    expect(w.fe_aki_form.requires_plural_or_dual_subject).toBe(true)
    expect(w.fe_aki_form.min_chapter).toBe(49)
  })

  it('verb ʻita has fe_aki_form feʻitaʻaki (reciprocal)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'ʻita')
    expect(w.fe_aki_form).toBeDefined()
    expect(w.fe_aki_form.tongan).toBe('feʻitaʻaki')
    expect(w.fe_aki_form.function).toBe('reciprocal')
    expect(w.fe_aki_form.requires_plural_or_dual_subject).toBe(true)
    expect(w.fe_aki_form.min_chapter).toBe(49)
  })

  it('verb folau has fe_aki_form fefolauʻaki (reciprocative)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'folau')
    expect(w.fe_aki_form).toBeDefined()
    expect(w.fe_aki_form.tongan).toBe('fefolauʻaki')
    expect(w.fe_aki_form.english).toBe('travel back and forth')
    expect(w.fe_aki_form.function).toBe('reciprocative')
    expect(w.fe_aki_form.requires_plural_or_dual_subject).toBe(true)
    expect(w.fe_aki_form.min_chapter).toBe(49)
  })

  // Schema acceptance: well-formed fe_aki_form passes validation
  it('schema accepts well-formed fe_aki_form with all fields', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 'feʻofaʻaki', english: 'love one another', function: 'reciprocal',
      requires_plural_or_dual_subject: true, min_chapter: 49, tags: ['reciprocal'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('fe_aki_form'))).toEqual([])
  })

  // Schema rejection tests
  it('schema rejects fe_aki_form missing required function field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 'feʻofaʻaki', english: 'love one another', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('function') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects fe_aki_form with bad function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 'feʻofaʻaki', english: 'love one another', function: 'causative',
      min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('function') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects fe_aki_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 'feʻofaʻaki', english: 'love one another', function: 'reciprocal',
      min_chapter: 'forty-nine',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects fe_aki_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 'feʻofaʻaki', english: 'love one another', function: 'reciprocal',
      min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects fe_aki_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = 'feʻofaʻaki'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects fe_aki_form with non-boolean requires_plural_or_dual_subject', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 'feʻofaʻaki', english: 'love one another', function: 'reciprocal',
      min_chapter: 49, requires_plural_or_dual_subject: 'yes',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('requires_plural_or_dual_subject') && e.includes('must be a boolean'))).toBe(true)
  })

  it('schema rejects fe_aki_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_aki_form = {
      tongan: 42, english: 'love one another', function: 'reciprocal',
      min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_aki_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })
})

// ── 2C.5q — fe_form communal/reciprocal fe- schema (Ch 49) ──────────────────

describe('2C.5q — fe_form communal/reciprocal fe- schema (Ch 49)', () => {
  // Data guards
  it('verb lele has fe_form felelei (communal)', () => {
    const w = grammarGraph.nodes.verb.words.find(w => w.tongan === 'lele')
    expect(w.fe_form).toBeDefined()
    expect(w.fe_form.tongan).toBe('felelei')
    expect(w.fe_form.english).toBe('run together (plural)')
    expect(w.fe_form.function).toBe('communal')
    expect(w.fe_form.suffix).toBe('-i')
    expect(w.fe_form.requires_plural_subject).toBe(true)
    expect(w.fe_form.min_chapter).toBe(49)
  })

  it('verb_tr kumi has fe_form fekumi (communal)', () => {
    const w = grammarGraph.nodes.verb_tr.words.find(w => w.tongan === 'kumi')
    expect(w.fe_form).toBeDefined()
    expect(w.fe_form.tongan).toBe('fekumi')
    expect(w.fe_form.english).toBe('search together')
    expect(w.fe_form.function).toBe('communal')
    expect(w.fe_form.requires_plural_subject).toBe(true)
    expect(w.fe_form.min_chapter).toBe(49)
  })

  // Schema acceptance: well-formed fe_form passes validation
  it('schema accepts well-formed fe_form with all fields', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together (plural)', function: 'communal',
      suffix: '-i', requires_plural_subject: true, min_chapter: 49, tags: ['communal'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('fe_form'))).toEqual([])
  })

  // Schema rejection tests
  it('schema rejects fe_form missing required function field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('function') && e.includes('missing'))).toBe(true)
  })

  it('schema rejects fe_form with bad function value', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together', function: 'causative',
      min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('function') && e.includes('unknown function'))).toBe(true)
  })

  it('schema rejects fe_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together', function: 'communal',
      min_chapter: 'forty-nine',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('schema rejects fe_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together', function: 'communal',
      min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects fe_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = 'felelei'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects fe_form with non-string suffix', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together', function: 'communal',
      min_chapter: 49, suffix: 42,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('suffix') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects fe_form with non-boolean requires_plural_subject', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 'felelei', english: 'run together', function: 'communal',
      min_chapter: 49, requires_plural_subject: 'yes',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('requires_plural_subject') && e.includes('must be a boolean'))).toBe(true)
  })

  it('schema rejects fe_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].fe_form = {
      tongan: 42, english: 'run together', function: 'communal',
      min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('fe_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2C.5r — ma_potential_form: potential prefix schema (Ch 49)
// ---------------------------------------------------------------------------

describe('2C.5r – ma_potential_form potential prefix schema (Ch 49)', () => {
  // ---- data guards ----

  it('verb_tr fai carries ma_potential_form → mafai', () => {
    const fai = grammarGraph.nodes.verb_tr.words.find(w => w.tongan === 'fai')
    expect(fai).toBeDefined()
    expect(fai.ma_potential_form).toBeDefined()
    expect(fai.ma_potential_form.tongan).toBe('mafai')
    expect(fai.ma_potential_form.english).toBe('able to manage, able to do')
    expect(fai.ma_potential_form.min_chapter).toBe(49)
  })

  it('verb_cleft fai carries ma_potential_form → mafai', () => {
    const fai = grammarGraph.nodes.verb_cleft.words.find(w => w.tongan === 'fai')
    expect(fai).toBeDefined()
    expect(fai.ma_potential_form).toBeDefined()
    expect(fai.ma_potential_form.tongan).toBe('mafai')
    expect(fai.ma_potential_form.english).toBe('able to manage, able to do')
    expect(fai.ma_potential_form.min_chapter).toBe(49)
  })

  // ---- schema acceptance ----

  it('schema accepts well-formed ma_potential_form', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 'malele', english: 'able to run', min_chapter: 49, tags: ['rare'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('ma_potential_form'))).toEqual([])
  })

  // ---- schema rejection ----

  it('schema rejects ma_potential_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 'malele', english: 'able to run', min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ma_potential_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = 'mafai'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects ma_potential_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 42, english: 'able to run', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ma_potential_form with non-string english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 'malele', english: 42, min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('english') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ma_potential_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 'malele', english: 'able to run', min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  it('schema rejects ma_potential_form with non-array tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 'malele', english: 'able to run', min_chapter: 49, tags: 'rare',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('tags') && e.includes('must be an array'))).toBe(true)
  })

  it('schema rejects ma_potential_form with non-string tag element', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_potential_form = {
      tongan: 'malele', english: 'able to run', min_chapter: 49, tags: [42],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_potential_form') && e.includes('tags[0]') && e.includes('must be a string'))).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // 2C.5s — ma_resultative_form schema (§48 Ch 49)
  // ---------------------------------------------------------------------------

  it('schema accepts well-formed ma_resultative_form with plain ma- prefix', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'mahae', english: 'to be torn', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('ma_resultative_form'))).toEqual([])
  })

  it('schema accepts well-formed ma_resultative_form with variant_prefix and tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'movete', english: 'to come to pieces', min_chapter: 49,
      variant_prefix: 'mo-', tags: ['resultative'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('ma_resultative_form'))).toEqual([])
  })

  it('schema rejects ma_resultative_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'mahae', english: 'to be torn', min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ma_resultative_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = 'mahae'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects ma_resultative_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 42, english: 'to be torn', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ma_resultative_form with non-string english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'mahae', english: 42, min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('english') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ma_resultative_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'mahae', english: 'to be torn', min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  it('schema rejects ma_resultative_form with non-string variant_prefix', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'movete', english: 'to come to pieces', min_chapter: 49,
      variant_prefix: 42,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('variant_prefix') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ma_resultative_form with non-array tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'mahae', english: 'to be torn', min_chapter: 49, tags: 'rare',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('tags') && e.includes('must be an array'))).toBe(true)
  })

  it('schema rejects ma_resultative_form with non-string tag element', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ma_resultative_form = {
      tongan: 'mahae', english: 'to be torn', min_chapter: 49, tags: [42],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ma_resultative_form') && e.includes('tags[0]') && e.includes('must be a string'))).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // 2C.5t — mo_u_form continuation/overdoing prefix schema (Ch 49)
  // ---------------------------------------------------------------------------

  // Data guards: mo_u_form enrichment on mohe, nofo, sio
  it('data guard: mohe in verb node carries mo_u_form moʻumohea', () => {
    const verbWords = grammarGraph.nodes.verb.words
    const mohe = verbWords.find(w => w.tongan === 'mohe')
    expect(mohe).toBeDefined()
    expect(mohe.mo_u_form).toBeDefined()
    expect(mohe.mo_u_form.tongan).toBe('moʻumohea')
    expect(mohe.mo_u_form.english).toBe('to oversleep')
    expect(mohe.mo_u_form.min_chapter).toBe(49)
  })

  it('data guard: nofo in verb node carries mo_u_form moʻunofoa', () => {
    const verbWords = grammarGraph.nodes.verb.words
    const nofo = verbWords.find(w => w.tongan === 'nofo')
    expect(nofo).toBeDefined()
    expect(nofo.mo_u_form).toBeDefined()
    expect(nofo.mo_u_form.tongan).toBe('moʻunofoa')
    expect(nofo.mo_u_form.english).toBe('to overstay')
    expect(nofo.mo_u_form.min_chapter).toBe(49)
  })

  it('data guard: sio in verb node carries mo_u_form moʻusioa', () => {
    const verbWords = grammarGraph.nodes.verb.words
    const sio = verbWords.find(w => w.tongan === 'sio')
    expect(sio).toBeDefined()
    expect(sio.mo_u_form).toBeDefined()
    expect(sio.mo_u_form.tongan).toBe('moʻusioa')
    expect(sio.mo_u_form.english).toBe('to stay too long watching')
    expect(sio.mo_u_form.min_chapter).toBe(49)
  })

  // Schema acceptance tests
  it('schema accepts mo_u_form with required fields only', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 'to oversleep', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('mo_u_form'))).toEqual([])
  })

  it('schema accepts mo_u_form with tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 'to oversleep', min_chapter: 49,
      tags: ['continuation'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('mo_u_form'))).toEqual([])
  })

  // Schema rejection tests
  it('schema rejects mo_u_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 'to oversleep', min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects mo_u_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = 'moʻumohea'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects mo_u_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 42, english: 'to oversleep', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects mo_u_form with non-string english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 42, min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('english') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects mo_u_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 'to oversleep', min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  it('schema rejects mo_u_form with non-array tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 'to oversleep', min_chapter: 49, tags: 'rare',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('tags') && e.includes('must be an array'))).toBe(true)
  })

  it('schema rejects mo_u_form with non-string tag element', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].mo_u_form = {
      tongan: 'moʻumohea', english: 'to oversleep', min_chapter: 49, tags: [42],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('mo_u_form') && e.includes('tags[0]') && e.includes('must be a string'))).toBe(true)
  })

  // ── 2C.5u — kaunga_form fellow/together prefix schema (Ch 49) ──────────

  it('data guard: ngāue in verb node carries kaunga_form kaungāngāue', () => {
    const verbWords = grammarGraph.nodes.verb.words
    const ngaue = verbWords.find(w => w.tongan === 'ngāue')
    expect(ngaue).toBeDefined()
    expect(ngaue.kaunga_form).toBeDefined()
    expect(ngaue.kaunga_form.tongan).toBe('kaungāngāue')
    expect(ngaue.kaunga_form.english).toBe('to work together, fellow-worker(s)')
    expect(ngaue.kaunga_form.min_chapter).toBe(49)
  })

  it('data guard: ako in verb node carries kaunga_form kaungā ako', () => {
    const verbWords = grammarGraph.nodes.verb.words
    const ako = verbWords.find(w => w.tongan === 'ako')
    expect(ako).toBeDefined()
    expect(ako.kaunga_form).toBeDefined()
    expect(ako.kaunga_form.tongan).toBe('kaungā ako')
    expect(ako.kaunga_form.english).toBe('fellow student(s)')
    expect(ako.kaunga_form.min_chapter).toBe(49)
  })

  it('data guard: ʻapi in prep_phrase node carries kaunga_form kaungā ʻapi', () => {
    const prepWords = grammarGraph.nodes.prep_phrase.words
    const api = prepWords.find(w => w.tongan === 'ʻapi')
    expect(api).toBeDefined()
    expect(api.kaunga_form).toBeDefined()
    expect(api.kaunga_form.tongan).toBe('kaungā ʻapi')
    expect(api.kaunga_form.english).toBe('neighbour(s)')
    expect(api.kaunga_form.min_chapter).toBe(49)
  })

  it('schema accepts kaunga_form with required fields only', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 'to work together, fellow-worker(s)', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('kaunga_form'))).toHaveLength(0)
  })

  it('schema accepts kaunga_form with tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 'to work together, fellow-worker(s)', min_chapter: 49, tags: ['noun_use'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('kaunga_form'))).toHaveLength(0)
  })

  it('schema rejects kaunga_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 'to work together, fellow-worker(s)', min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects kaunga_form that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = 'kaungāngāue'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects kaunga_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 42, english: 'to work together', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects kaunga_form with non-string english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 42, min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('english') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects kaunga_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 'to work together', min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  it('schema rejects kaunga_form with non-array tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 'to work together', min_chapter: 49, tags: 'rare',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('tags') && e.includes('must be an array'))).toBe(true)
  })

  it('schema rejects kaunga_form with non-string tag element', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].kaunga_form = {
      tongan: 'kaungāngāue', english: 'to work together', min_chapter: 49, tags: [42],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('kaunga_form') && e.includes('tags[0]') && e.includes('must be a string'))).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // 2C.5v — ke_ma_emphatic_pair thoroughness paired expression (§48 Ch 49)
  // ---------------------------------------------------------------------------

  it('data guard: ako carries ke_ma_emphatic_pair ako ke maako', () => {
    const verb = grammarGraph.nodes.verb
    const ako = verb.words.find(w => w.tongan === 'ako')
    expect(ako).toBeDefined()
    expect(ako.ke_ma_emphatic_pair).toBeDefined()
    expect(ako.ke_ma_emphatic_pair.tongan).toBe('ako ke maako')
    expect(ako.ke_ma_emphatic_pair.english).toBe('to learn thoroughly')
    expect(ako.ke_ma_emphatic_pair.min_chapter).toBe(49)
  })

  it('schema accepts ke_ma_emphatic_pair with required fields only', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 'to learn thoroughly', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('ke_ma_emphatic_pair'))).toHaveLength(0)
  })

  it('schema accepts ke_ma_emphatic_pair with tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 'to learn thoroughly', min_chapter: 49, tags: ['thoroughness'],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.filter(e => e.includes('ke_ma_emphatic_pair'))).toHaveLength(0)
  })

  it('schema rejects ke_ma_emphatic_pair with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 'to learn thoroughly', min_chapter: 49, bogus_field: true,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('bogus_field') && e.includes('unknown field'))).toBe(true)
  })

  it('schema rejects ke_ma_emphatic_pair that is not an object', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = 'ako ke maako'
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('must be an object'))).toBe(true)
  })

  it('schema rejects ke_ma_emphatic_pair with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 42, english: 'to learn thoroughly', min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ke_ma_emphatic_pair with non-string english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 42, min_chapter: 49,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('english') && e.includes('must be a string'))).toBe(true)
  })

  it('schema rejects ke_ma_emphatic_pair with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 'to learn thoroughly', min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  it('schema rejects ke_ma_emphatic_pair with non-array tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 'to learn thoroughly', min_chapter: 49, tags: 'rare',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('tags') && e.includes('must be an array'))).toBe(true)
  })

  it('schema rejects ke_ma_emphatic_pair with non-string tag element', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.verb.words[0].ke_ma_emphatic_pair = {
      tongan: 'ako ke maako', english: 'to learn thoroughly', min_chapter: 49, tags: [42],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('ke_ma_emphatic_pair') && e.includes('tags[0]') && e.includes('must be a string'))).toBe(true)
  })

  // ── 2C.7b — emotional_form on article entries (§50 Ch 52) ──────
  //
  // The pre-composed `ha X` / `e X` entries previously lived on the `object`
  // node with their own `emotional_form` sub-objects. When articles became
  // their own category (a separate `article` node with `ha` / `e` as two
  // standalone words, wired in as an extension of `verb`), the emotional
  // substitution moved with them — `ha` carries `si'a`, `e` carries `si'i`,
  // and rendering concatenates <article.emotional_form.tongan> + <noun>
  // instead of looking up a pre-composed string. These tests verify the
  // emotional_form data lives on the article node now.

  it('2C.7b: indefinite article "ha" has emotional_form → "si\'a"', () => {
    const entry = grammarGraph.nodes.article.words.find(w => w.tongan === 'ha')
    expect(entry).toBeDefined()
    expect(entry.article_type).toBe('indefinite')
    expect(entry.emotional_form).toBeDefined()
    expect(entry.emotional_form.tongan).toBe("si'a")
    expect(entry.emotional_form.english).toContain('pity')
    expect(entry.emotional_form.min_chapter).toBe(52)
  })

  it('2C.7b: definite article "e" has emotional_form → "si\'i"', () => {
    const entry = grammarGraph.nodes.article.words.find(w => w.tongan === 'e')
    expect(entry).toBeDefined()
    expect(entry.article_type).toBe('definite')
    expect(entry.emotional_form).toBeDefined()
    expect(entry.emotional_form.tongan).toBe("si'i")
    expect(entry.emotional_form.english).toContain('pity')
    expect(entry.emotional_form.min_chapter).toBe(52)
  })

  // Data guards: noun_subject_name common noun entries (bare, with
  // render-time `e` prepended) carry emotional_form with si'i. Entries are
  // stored bare — "tamasiʻi" not "e tamasiʻi" — so articles stay factored
  // out the same way they do in the object node. The emotional_form.tongan
  // preserves the surface string (`si'i tamasiʻi`) because emotional
  // substitution replaces the whole `e + noun` chunk, not just the article.
  it('2C.7b: noun_subject_name "tamasiʻi" (bare) has emotional_form with si\'i', () => {
    const entry = grammarGraph.nodes.noun_subject_name.words.find(w => w.tongan === 'tamasiʻi')
    expect(entry).toBeDefined()
    expect(entry.emotional_form).toBeDefined()
    expect(entry.emotional_form.tongan).toBe("si'i tamasiʻi")
    expect(entry.emotional_form.min_chapter).toBe(52)
  })

  // Data guards: subject_phrase definite entries have emotional_form
  it('2C.7b: subject_phrase "fānau" (bare) has emotional_form with si\'i', () => {
    // After the subject_phrase article refactor, common-noun entries are
    // stored bare (the "e " prefix is applied at render time). The emotional
    // form preserves the full surface string ("si'i fānau") because Ch 52's
    // emotional substitution replaces the whole "e + noun" chunk.
    const entry = grammarGraph.nodes.subject_phrase.words.find(w => w.tongan === 'fānau')
    expect(entry).toBeDefined()
    expect(entry.emotional_form).toBeDefined()
    expect(entry.emotional_form.tongan).toBe("si'i fānau")
    expect(entry.emotional_form.min_chapter).toBe(52)
  })

  // Coverage: both article node entries have well-formed emotional_form.
  // (Previously ~8 pre-composed entries needed parallel fields; now two
  // standalone article words carry the whole paradigm via render-time
  // substitution on the following noun step.)
  it('2C.7b: every article node word has emotional_form with matching article_type', () => {
    const words = grammarGraph.nodes.article.words
    expect(words.length).toBe(2)
    for (const entry of words) {
      expect(entry.article_type).toMatch(/^(indefinite|definite)$/)
      expect(entry.emotional_form).toBeDefined()
      expect(entry.emotional_form.tongan).toMatch(
        entry.article_type === 'indefinite' ? /^si'a$/ : /^si'i$/
      )
      expect(entry.emotional_form.min_chapter).toBe(52)
    }
  })

  // Schema acceptance: emotional_form passes validation on live data
  it('2C.7b: schema accepts emotional_form on live grammar-graph data', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const emotionalErrors = errors.filter(e => e.includes('emotional_form'))
    expect(emotionalErrors).toEqual([])
  })

  // Schema acceptance: well-formed emotional_form passes
  it('2C.7b: schema accepts well-formed emotional_form with tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 'some taro (with pity)', min_chapter: 52, tags: ['emotional'],
    }
    const errors = validateGrammarGraph(d)
    const emotionalErrors = errors.filter(e => e.includes('emotional_form'))
    expect(emotionalErrors).toEqual([])
  })

  // Schema rejection: missing required field tongan
  it('2C.7b: schema rejects emotional_form missing tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      english: 'some taro (with pity)', min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('tongan') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: missing required field english
  it('2C.7b: schema rejects emotional_form missing english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('english') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: missing required field min_chapter
  it('2C.7b: schema rejects emotional_form missing min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 'some taro (with pity)',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('min_chapter') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: non-string tongan
  it('2C.7b: schema rejects emotional_form with non-string tongan', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: 42, english: 'some taro (with pity)', min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('tongan') && e.includes('must be a string'))).toBe(true)
  })

  // Schema rejection: non-string english
  it('2C.7b: schema rejects emotional_form with non-string english', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 42, min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('english') && e.includes('must be a string'))).toBe(true)
  })

  // Schema rejection: non-integer min_chapter
  it('2C.7b: schema rejects emotional_form with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 'some taro (with pity)', min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  // Schema rejection: unknown field
  it('2C.7b: schema rejects emotional_form with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 'some taro (with pity)', min_chapter: 52, emotion: 'pity',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('emotion') && e.includes('unknown field'))).toBe(true)
  })

  // Schema rejection: non-array tags
  it('2C.7b: schema rejects emotional_form with non-array tags', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 'some taro (with pity)', min_chapter: 52, tags: 'emotional',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('tags') && e.includes('must be an array'))).toBe(true)
  })

  // Schema rejection: non-string tag element
  it('2C.7b: schema rejects emotional_form with non-string tag element', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.object.words[0].emotional_form = {
      tongan: "si'a talo", english: 'some taro (with pity)', min_chapter: 52, tags: [42],
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_form') && e.includes('tags[0]') && e.includes('must be a string'))).toBe(true)
  })

  // ── 2C.7c — emotional_possessive_forms + emotional_indefinite_forms on possessive_pronoun entries (§50 Ch 52) ──────

  // Data guards: 1sg entry has emotional_possessive_forms with correct e_class/ho_class
  it('2C.7c: 1sg possessive entry has emotional_possessive_forms si\'eku / si\'oku', () => {
    const entry = grammarGraph.nodes.possessive_pronoun.words.find(w => w.tongan === 'ʻeku')
    expect(entry).toBeDefined()
    expect(entry.emotional_possessive_forms).toBeDefined()
    expect(entry.emotional_possessive_forms.e_class).toBe("si'eku")
    expect(entry.emotional_possessive_forms.ho_class).toBe("si'oku")
    expect(entry.emotional_possessive_forms.min_chapter).toBe(52)
  })

  // Data guards: 3sg entry has different e_class/ho_class emotional forms
  it('2C.7c: 3sg possessive entry has emotional_possessive_forms si\'ene / si\'ono', () => {
    const entry = grammarGraph.nodes.possessive_pronoun.words.find(w => w.tongan === 'ʻene')
    expect(entry).toBeDefined()
    expect(entry.emotional_possessive_forms).toBeDefined()
    expect(entry.emotional_possessive_forms.e_class).toBe("si'ene")
    expect(entry.emotional_possessive_forms.ho_class).toBe("si'ono")
    expect(entry.emotional_possessive_forms.min_chapter).toBe(52)
  })

  // Data guards: 2sg entry has identical e_class/ho_class emotional forms
  it('2C.7c: 2sg possessive entry has identical emotional_possessive_forms si\'o / si\'o', () => {
    const entry = grammarGraph.nodes.possessive_pronoun.words.find(w => w.tongan === 'hoʻo')
    expect(entry).toBeDefined()
    expect(entry.emotional_possessive_forms).toBeDefined()
    expect(entry.emotional_possessive_forms.e_class).toBe("si'o")
    expect(entry.emotional_possessive_forms.ho_class).toBe("si'o")
  })

  // Data guards: 1du entry has emotional_possessive_forms but NO emotional_indefinite_forms
  it('2C.7c: 1du inclusive entry has emotional_possessive_forms but no emotional_indefinite_forms', () => {
    const entry = grammarGraph.nodes.possessive_pronoun.words.find(w => w.tongan === 'ʻeta')
    expect(entry).toBeDefined()
    expect(entry.emotional_possessive_forms).toBeDefined()
    expect(entry.emotional_possessive_forms.e_class).toBe("si'eta")
    expect(entry.emotional_possessive_forms.ho_class).toBe("si'ota")
    expect(entry.emotional_indefinite_forms).toBeUndefined()
  })

  // Data guards: 1sg entry has emotional_indefinite_forms with identical e_class/ho_class
  it('2C.7c: 1sg possessive entry has emotional_indefinite_forms si\'aku / si\'aku (same)', () => {
    const entry = grammarGraph.nodes.possessive_pronoun.words.find(w => w.tongan === 'ʻeku')
    expect(entry).toBeDefined()
    expect(entry.emotional_indefinite_forms).toBeDefined()
    expect(entry.emotional_indefinite_forms.e_class).toBe("si'aku")
    expect(entry.emotional_indefinite_forms.ho_class).toBe("si'aku")
    expect(entry.emotional_indefinite_forms.min_chapter).toBe(52)
  })

  // Data guards: 3sg entry has different emotional_indefinite_forms e_class/ho_class
  it('2C.7c: 3sg possessive entry has emotional_indefinite_forms si\'ane / si\'ano', () => {
    const entry = grammarGraph.nodes.possessive_pronoun.words.find(w => w.tongan === 'ʻene')
    expect(entry).toBeDefined()
    expect(entry.emotional_indefinite_forms).toBeDefined()
    expect(entry.emotional_indefinite_forms.e_class).toBe("si'ane")
    expect(entry.emotional_indefinite_forms.ho_class).toBe("si'ano")
  })

  // Coverage: all 11 possessive_pronoun entries have emotional_possessive_forms
  it('2C.7c: all 11 possessive_pronoun entries have emotional_possessive_forms', () => {
    const words = grammarGraph.nodes.possessive_pronoun.words
    expect(words.length).toBe(11)
    words.forEach(entry => {
      expect(entry.emotional_possessive_forms).toBeDefined()
      expect(typeof entry.emotional_possessive_forms.e_class).toBe('string')
      expect(typeof entry.emotional_possessive_forms.ho_class).toBe('string')
      expect(entry.emotional_possessive_forms.min_chapter).toBe(52)
    })
  })

  // Coverage: all 7 singular/plural entries have emotional_indefinite_forms; 4 duals do not
  it('2C.7c: 7 singular/plural entries have emotional_indefinite_forms; 4 duals do not', () => {
    const words = grammarGraph.nodes.possessive_pronoun.words
    const withIndefinite = words.filter(w => w.indefinite_forms !== undefined)
    const withoutIndefinite = words.filter(w => w.indefinite_forms === undefined)
    expect(withIndefinite.length).toBe(7)
    expect(withoutIndefinite.length).toBe(4)
    withIndefinite.forEach(entry => {
      expect(entry.emotional_indefinite_forms).toBeDefined()
      expect(typeof entry.emotional_indefinite_forms.e_class).toBe('string')
      expect(typeof entry.emotional_indefinite_forms.ho_class).toBe('string')
      expect(entry.emotional_indefinite_forms.min_chapter).toBe(52)
    })
    withoutIndefinite.forEach(entry => {
      expect(entry.emotional_indefinite_forms).toBeUndefined()
    })
  })

  // Coverage: all emotional possessive forms start with si'
  it('2C.7c: all emotional possessive forms start with si\'', () => {
    grammarGraph.nodes.possessive_pronoun.words.forEach(entry => {
      expect(entry.emotional_possessive_forms.e_class).toMatch(/^si'/)
      expect(entry.emotional_possessive_forms.ho_class).toMatch(/^si'/)
    })
  })

  // Schema acceptance: emotional_possessive_forms passes validation on live data
  it('2C.7c: schema accepts emotional_possessive_forms on live grammar-graph data', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const epfErrors = errors.filter(e => e.includes('emotional_possessive_forms'))
    expect(epfErrors).toEqual([])
  })

  // Schema acceptance: emotional_indefinite_forms passes validation on live data
  it('2C.7c: schema accepts emotional_indefinite_forms on live grammar-graph data', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const eifErrors = errors.filter(e => e.includes('emotional_indefinite_forms'))
    expect(eifErrors).toEqual([])
  })

  // Schema rejection: emotional_possessive_forms missing e_class
  it('2C.7c: schema rejects emotional_possessive_forms missing e_class', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      ho_class: "si'oku", min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('e_class') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: emotional_possessive_forms missing ho_class
  it('2C.7c: schema rejects emotional_possessive_forms missing ho_class', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      e_class: "si'eku", min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('ho_class') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: emotional_possessive_forms missing min_chapter
  it('2C.7c: schema rejects emotional_possessive_forms missing min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      e_class: "si'eku", ho_class: "si'oku",
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('min_chapter') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: emotional_possessive_forms non-string e_class
  it('2C.7c: schema rejects emotional_possessive_forms with non-string e_class', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      e_class: 42, ho_class: "si'oku", min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('e_class') && e.includes('must be a string'))).toBe(true)
  })

  // Schema rejection: emotional_possessive_forms non-string ho_class
  it('2C.7c: schema rejects emotional_possessive_forms with non-string ho_class', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      e_class: "si'eku", ho_class: 42, min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('ho_class') && e.includes('must be a string'))).toBe(true)
  })

  // Schema rejection: emotional_possessive_forms non-integer min_chapter
  it('2C.7c: schema rejects emotional_possessive_forms with non-integer min_chapter', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      e_class: "si'eku", ho_class: "si'oku", min_chapter: 'late',
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('min_chapter') && e.includes('must be a positive integer'))).toBe(true)
  })

  // Schema rejection: emotional_possessive_forms unknown field
  it('2C.7c: schema rejects emotional_possessive_forms with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_possessive_forms = {
      e_class: "si'eku", ho_class: "si'oku", min_chapter: 52, tongan: "si'eku",
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_possessive_forms') && e.includes('tongan') && e.includes('unknown field'))).toBe(true)
  })

  // Schema rejection: emotional_indefinite_forms missing e_class
  it('2C.7c: schema rejects emotional_indefinite_forms missing e_class', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_indefinite_forms = {
      ho_class: "si'aku", min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_indefinite_forms') && e.includes('e_class') && e.includes('missing required'))).toBe(true)
  })

  // Schema rejection: emotional_indefinite_forms non-string ho_class
  it('2C.7c: schema rejects emotional_indefinite_forms with non-string ho_class', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_indefinite_forms = {
      e_class: "si'aku", ho_class: 42, min_chapter: 52,
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_indefinite_forms') && e.includes('ho_class') && e.includes('must be a string'))).toBe(true)
  })

  // Schema rejection: emotional_indefinite_forms unknown field
  it('2C.7c: schema rejects emotional_indefinite_forms with unknown field', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const d = JSON.parse(JSON.stringify(grammarGraph))
    d.nodes.possessive_pronoun.words[0].emotional_indefinite_forms = {
      e_class: "si'aku", ho_class: "si'aku", min_chapter: 52, english: "my poor",
    }
    const errors = validateGrammarGraph(d)
    expect(errors.some(e => e.includes('emotional_indefinite_forms') && e.includes('english') && e.includes('unknown field'))).toBe(true)
  })

  // ── 2C.7d — exclamatory_ko_ka entry point (§50 Ch 52) ──────

  it('2C.7d: exclamatory_ko_ka entry point exists with FINISH_EXCLAMATION terminator', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'exclamatory_ko_ka')
    expect(ep).toBeDefined()
    expect(ep.allowed_terminators).toEqual(['FINISH_EXCLAMATION'])
    expect(ep.category).toBe('Exclamatory')
    expect(ep.min_chapter).toBe(52)
    expect(ep.start_node).toBe('exclamatory_ko_ka_head')
  })

  it('2C.7d: exclamatory_ko_ka_head node exists with 5 word entries', () => {
    const node = grammarGraph.nodes.exclamatory_ko_ka_head
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(5)
  })

  it('2C.7d: exclamatory_ko_ka_head contains "Ko e tangi ka ko ha tangi"', () => {
    const node = grammarGraph.nodes.exclamatory_ko_ka_head
    const entry = node.words.find(w => w.tongan === 'Ko e tangi ka ko ha tangi')
    expect(entry).toBeDefined()
    expect(entry.english).toBe('What a tremendous cry!')
    expect(entry.min_chapter).toBe(52)
  })

  it('2C.7d: exclamatory_ko_ka_head contains "Ko e ʻofa ka ko ha ʻofa"', () => {
    const node = grammarGraph.nodes.exclamatory_ko_ka_head
    const entry = node.words.find(w => w.tongan === 'Ko e ʻofa ka ko ha ʻofa')
    expect(entry).toBeDefined()
    expect(entry.english).toBe('What a wonderful love!')
    expect(entry.min_chapter).toBe(52)
  })

  it('2C.7d: exclamatory_ko_ka_head contains all 5 spec §50 examples', () => {
    const node = grammarGraph.nodes.exclamatory_ko_ka_head
    const expected = [
      'Ko e tangi ka ko ha tangi',
      'Ko e ʻofa ka ko ha ʻofa',
      'Ko e momoko ka ko ha momoko',
      'Ko e māfana ka ko ha māfana',
      'Ko e afā ka ko ha afā',
    ]
    expected.forEach(t => {
      expect(node.words.find(w => w.tongan === t), `missing: ${t}`).toBeDefined()
    })
  })

  it('2C.7d: all exclamatory_ko_ka_head entries follow the doubled ko e/ko ha pattern', () => {
    const node = grammarGraph.nodes.exclamatory_ko_ka_head
    node.words.forEach(w => {
      expect(w.tongan).toMatch(/^Ko e .+ ka ko ha .+$/)
      // The noun in the first half must match the noun in the second half
      const match = w.tongan.match(/^Ko e (.+) ka ko ha (.+)$/)
      expect(match).not.toBeNull()
      expect(match[1]).toBe(match[2])
    })
  })

  it('2C.7d: exclamatory_ko_ka_head next routes to FINISH_EXCLAMATION', () => {
    const node = grammarGraph.nodes.exclamatory_ko_ka_head
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('FINISH_EXCLAMATION')
    expect(node.next[0].min_chapter).toBe(52)
  })

  it('2C.7d: FINISH_EXCLAMATION is recognized by schema validator', () => {
    const { FINISH_NODES } = require('./grammar-graph-schema.js')
    expect(FINISH_NODES.has('FINISH_EXCLAMATION')).toBe(true)
  })

  it('2C.7d: Exclamatory category is recognized by schema validator', () => {
    const { CATEGORIES } = require('./grammar-graph-schema.js')
    expect(CATEGORIES.has('Exclamatory')).toBe(true)
  })

  it('2C.7d: schema accepts exclamatory_ko_ka on live grammar-graph data', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const relevant = errors.filter(e => e.includes('exclamatory'))
    expect(relevant).toEqual([])
  })

  // ── 2C.7e — exclamatory_me_a entry point (§50 Ch 52) ──────

  it('2C.7e: exclamatory_me_a entry point exists with FINISH_STATEMENT terminator', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'exclamatory_me_a')
    expect(ep).toBeDefined()
    expect(ep.allowed_terminators).toEqual(['FINISH_STATEMENT'])
    expect(ep.category).toBe('Exclamatory')
    expect(ep.min_chapter).toBe(52)
    expect(ep.start_node).toBe('exclamatory_me_a_head')
  })

  it('2C.7e: exclamatory_me_a_head node exists with 6 word entries', () => {
    const node = grammarGraph.nodes.exclamatory_me_a_head
    expect(node).toBeDefined()
    expect(node.words).toHaveLength(6)
  })

  it('2C.7e: exclamatory_me_a_head contains "Meʻa fakaʻofoʻofa ko e hihilifaki kalauni"', () => {
    const node = grammarGraph.nodes.exclamatory_me_a_head
    const entry = node.words.find(w => w.tongan === 'Meʻa fakaʻofoʻofa ko e hihilifaki kalauni')
    expect(entry).toBeDefined()
    expect(entry.english).toBe('The coronation was a beautiful thing.')
    expect(entry.min_chapter).toBe(52)
  })

  it('2C.7e: exclamatory_me_a_head contains "Meʻa mālie ko e hiva"', () => {
    const node = grammarGraph.nodes.exclamatory_me_a_head
    const entry = node.words.find(w => w.tongan === 'Meʻa mālie ko e hiva')
    expect(entry).toBeDefined()
    expect(entry.english).toBe('The song was a wonderful thing.')
    expect(entry.min_chapter).toBe(52)
  })

  it('2C.7e: exclamatory_me_a_head contains all 6 spec §50 examples', () => {
    const node = grammarGraph.nodes.exclamatory_me_a_head
    const expected = [
      'Meʻa fakaʻofoʻofa ko e hihilifaki kalauni',
      'Meʻa mālie ko e hiva',
      'Meʻa fakaʻofoʻofa ko e ngāue',
      'Meʻa lelei ko e ako',
      'Meʻa mālie ko e vaʻinga',
      'Meʻa fakaʻofoʻofa ko e fakataha',
    ]
    expected.forEach(t => {
      expect(node.words.find(w => w.tongan === t), `missing: ${t}`).toBeDefined()
    })
  })

  it('2C.7e: all exclamatory_me_a_head entries follow the Meʻa + modifier + ko e + noun pattern', () => {
    const node = grammarGraph.nodes.exclamatory_me_a_head
    node.words.forEach(w => {
      expect(w.tongan).toMatch(/^Meʻa .+ ko e .+$/)
    })
  })

  it('2C.7e: exclamatory_me_a_head next routes to FINISH_STATEMENT', () => {
    const node = grammarGraph.nodes.exclamatory_me_a_head
    expect(node.next).toHaveLength(1)
    expect(node.next[0].node).toBe('FINISH_STATEMENT')
    expect(node.next[0].min_chapter).toBe(52)
  })

  it('2C.7e: exclamatory_me_a uses FINISH_STATEMENT (periods) not FINISH_EXCLAMATION', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'exclamatory_me_a')
    expect(ep.allowed_terminators).toContain('FINISH_STATEMENT')
    expect(ep.allowed_terminators).not.toContain('FINISH_EXCLAMATION')
  })

  it('2C.7e: exclamatory_me_a reuses existing Exclamatory category', () => {
    const ep = grammarGraph.entry_points.find(e => e.id === 'exclamatory_me_a')
    const { CATEGORIES } = require('./grammar-graph-schema.js')
    expect(CATEGORIES.has(ep.category)).toBe(true)
  })

  it('2C.7e: schema accepts exclamatory_me_a on live grammar-graph data', () => {
    const { validateGrammarGraph } = require('./grammar-graph-schema.js')
    const errors = validateGrammarGraph(grammarGraph)
    const relevant = errors.filter(e => e.includes('exclamatory_me_a'))
    expect(relevant).toEqual([])
  })
})

// ===========================================================================
// 2E.1: End-to-end integration tests — walk newer entry points through the
// full walker pipeline (createWalkerState → advanceInFrame → finishWalker →
// renderTongan / translateWalkerState).
// ===========================================================================

describe('2E.1 integration: exclamatory_ko_ka full walk', () => {
  it('walks Ko e tangi ka ko ha tangi → finishes with FINISH_EXCLAMATION', () => {
    let s = createWalkerState('exclamatory_ko_ka', 999)
    const words = getCurrentFrameWords(s)
    expect(words.length).toBe(5)
    const tangi = words.find(w => w.tongan === 'Ko e tangi ka ko ha tangi')
    expect(tangi).toBeDefined()
    s = advanceInFrame(s, tangi)
    // After selecting the compound word, the walker should reach FINISH_EXCLAMATION
    const terminators = getAvailableTerminators(s)
    expect(terminators).toContain('FINISH_EXCLAMATION')
    s = finishWalker(s, 'FINISH_EXCLAMATION')
    expect(s.finished).toBe(true)
    expect(s.terminator).toBe('FINISH_EXCLAMATION')
    const tongan = renderTongan(s)
    expect(tongan).toBe('Ko e tangi ka ko ha tangi')
  })
})

describe('2E.1 integration: exclamatory_me_a full walk', () => {
  it('walks Meʻa fakaʻofoʻofa ko e hihilifaki kalauni → finishes with FINISH_STATEMENT', () => {
    let s = createWalkerState('exclamatory_me_a', 999)
    const words = getCurrentFrameWords(s)
    expect(words.length).toBe(6)
    const hihilifaki = words.find(w => w.tongan.includes('hihilifaki'))
    expect(hihilifaki).toBeDefined()
    s = advanceInFrame(s, hihilifaki)
    const terminators = getAvailableTerminators(s)
    expect(terminators).toContain('FINISH_STATEMENT')
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('Meʻa fakaʻofoʻofa ko e hihilifaki kalauni')
  })
})

describe('2E.1 integration: predicative_possessive full walk', () => {
  it('walks ʻOku ʻaʻaku eni → finishes with FINISH_STATEMENT', () => {
    let s = createWalkerState('predicative_possessive', 999)
    // Step 1: tense marker ʻOku
    const words1 = getCurrentFrameWords(s)
    const oku = words1.find(w => w.tongan === 'ʻOku')
    expect(oku).toBeDefined()
    s = advanceInFrame(s, oku)
    // Step 2: postposed possessive ʻaʻaku
    const words2 = getCurrentFrameWords(s)
    const aaku = words2.find(w => w.tongan === 'ʻaʻaku')
    expect(aaku).toBeDefined()
    s = advanceInFrame(s, aaku)
    // Step 3: subject eni
    const words3 = getCurrentFrameWords(s)
    const eni = words3.find(w => w.tongan === 'eni')
    expect(eni).toBeDefined()
    s = advanceInFrame(s, eni)
    // Finish
    const terminators = getAvailableTerminators(s)
    expect(terminators).toContain('FINISH_STATEMENT')
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('ʻOku ʻaʻaku eni')
  })
})

describe('2E.1 integration: have_construction full walk', () => {
  it('walks ʻOku ʻi ai ʻeku tohi → finishes with FINISH_STATEMENT', () => {
    let s = createWalkerState('have_construction', 999)
    // Step 1: have_head
    const words1 = getCurrentFrameWords(s)
    const have = words1.find(w => w.tongan === 'ʻOku ʻi ai')
    expect(have).toBeDefined()
    s = advanceInFrame(s, have)
    // Step 2: possessive pronoun ʻeku (1sg)
    const words2 = getCurrentFrameWords(s)
    const eku = words2.find(w => w.tongan === 'ʻeku')
    expect(eku).toBeDefined()
    s = advanceInFrame(s, eku)
    // Step 3: possessive head noun tohi (book)
    const words3 = getCurrentFrameWords(s)
    const tohi = words3.find(w => w.tongan === 'tohi')
    expect(tohi).toBeDefined()
    s = advanceInFrame(s, tohi)
    // Finish
    const terminators = getAvailableTerminators(s)
    expect(terminators).toContain('FINISH_STATEMENT')
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('ʻOku ʻi ai ʻeku tohi')
  })
})

describe('2E.1 integration: future tense through walker', () => {
  it('walks Te u kai → correct Tongan and English', () => {
    let s = createWalkerState('statement', 999)
    // Step 1: tense marker Te (future)
    s = advanceInFrame(s, { tongan: 'Te' })
    // Step 2: pronoun u (1sg future)
    s = advanceInFrame(s, { tongan: 'u' })
    // Step 3: after pronoun the walker enters branching; take verb extension
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // Finish
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('Te u kai')
    const out = translateWalkerState(s)
    expect(out.text).toMatch(/will eat/i)
  })
})

// ===========================================================================
// 2E.2: Worked-example integration tests — composition expansion. Walk
// sentences end-to-end AND verify English translation output (method =
// 'composed'). Covers have_construction, predicative_possessive, and
// exclamatory entry points.
// ===========================================================================

describe('2E.2 integration: have_construction present affirmative + English', () => {
  it("walks ʻOku ʻi ai ʻeku tohi → 'I have a book.'", () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('ʻOku ʻi ai ʻeku tohi')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I have a book.')
  })
})

describe('2E.2 integration: have_construction present negated + English', () => {
  it("walks ʻOku ʻikai + ʻeku + tohi → 'I do not have a book.'", () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻikai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I do not have a book.')
  })
})

describe('2E.2 integration: have_construction 3sg + English', () => {
  it("walks ʻOku ʻi ai ʻene tohi → 'He/she has a book.'", () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she has a book.')
  })
})

describe('2E.2 integration: have_construction as question + English', () => {
  it("walks ʻOku ʻi ai ʻeku tohi → question form", () => {
    let s = createWalkerState('have_construction', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toMatch(/do i have a book\?/i)
  })
})

describe('2E.2 integration: predicative_possessive statement + English', () => {
  it("walks ʻOku ʻaʻaku eni → 'This is mine.'", () => {
    let s = createWalkerState('predicative_possessive', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻaʻaku' })
    s = advanceInFrame(s, { tongan: 'eni' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const tongan = renderTongan(s)
    expect(tongan).toBe('ʻOku ʻaʻaku eni')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('This is mine.')
  })
})

describe('2E.2 integration: predicative_possessive question + English', () => {
  it("walks ʻOku ʻaʻaku eni → 'Is this mine?'", () => {
    let s = createWalkerState('predicative_possessive', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻaʻaku' })
    s = advanceInFrame(s, { tongan: 'eni' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Is this mine?')
  })
})

describe('2E.2 integration: exclamatory_ko_ka composed English', () => {
  it("walks Ko e tangi ka ko ha tangi → 'What a tremendous cry!'", () => {
    let s = createWalkerState('exclamatory_ko_ka', 999)
    const words = getCurrentFrameWords(s)
    const tangi = words.find(w => w.tongan === 'Ko e tangi ka ko ha tangi')
    expect(tangi).toBeDefined()
    s = advanceInFrame(s, tangi)
    s = finishWalker(s, 'FINISH_EXCLAMATION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('What a tremendous cry!')
  })
})

describe('2E.2 integration: exclamatory_me_a composed English', () => {
  it("walks Meʻa fakaʻofoʻofa ko e hihilifaki kalauni → composed English", () => {
    let s = createWalkerState('exclamatory_me_a', 999)
    const words = getCurrentFrameWords(s)
    const hihilifaki = words.find(w => w.tongan.includes('hihilifaki'))
    expect(hihilifaki).toBeDefined()
    s = advanceInFrame(s, hihilifaki)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('The coronation was a beautiful thing.')
  })
})

describe('2E.2 integration: FINISH_EXCLAMATION punctuation behavior', () => {
  it('sets correct terminator state; renderTongan omits trailing punctuation', () => {
    let s = createWalkerState('exclamatory_ko_ka', 999)
    const words = getCurrentFrameWords(s)
    s = advanceInFrame(s, words[0])
    s = finishWalker(s, 'FINISH_EXCLAMATION')
    expect(s.terminator).toBe('FINISH_EXCLAMATION')
    expect(s.translation.isQuestion).toBe(false)
    // renderTongan does NOT add punctuation (caller's responsibility per spec)
    const tongan = renderTongan(s)
    expect(tongan).not.toMatch(/[.?!]$/)
  })
})

// ===========================================================================
// 2E.3: Worked-example integration tests — transitive and cleft composition.
// Walk sentences end-to-end AND verify English translation output (method =
// 'composed'). Covers transitive_statement and cleft_emphatic entry points.
// ===========================================================================

describe('2E.3 integration: transitive past affirmative + English', () => {
  it("walks Naʻe kai ʻa e ika ʻe Sione → 'Sione ate the fish.'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('Naʻe kai ʻa e ika ʻe Sione')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione ate the fish.')
  })
})

describe('2E.3 integration: transitive present + common noun agent', () => {
  it("walks ʻOku inu ʻa e vai ʻe he tamasiʻi → 'The boy drinks the water.'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'inu' })
    s = advanceInFrame(s, { tongan: 'vai' })
    s = advanceInFrame(s, { tongan: 'tamasiʻi' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('The boy drinks the water.')
  })
})

describe('2E.3 integration: transitive future + English', () => {
  it("walks ʻE lau ʻa e tohi ʻe Mele → 'Mele will read the book.'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻE' })
    s = advanceInFrame(s, { tongan: 'lau' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Mele will read the book.')
  })
})

describe('2E.3 integration: transitive perfect + English', () => {
  it("walks Kuo tohi ʻa e tohi ʻe Pita → 'Pita has written the book.'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Kuo' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'Pita' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Pita has written the book.')
  })
})

describe('2E.3 integration: transitive question form + English', () => {
  it("walks Naʻe kai ʻa e ika ʻe Sione? → 'Did Sione eat the fish?'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Did Sione eat the fish?')
  })
})

describe('2E.3 integration: transitive question + common noun agent', () => {
  it("walks ʻOku kai ʻa e mā ʻe he fefine? → 'Does the woman eat the bread?'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'mā' })
    s = advanceInFrame(s, { tongan: 'fefine' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Does the woman eat the bread?')
  })
})

describe('2E.3 integration: cleft past + transitive with object', () => {
  it("walks Ko Sione naʻe ne kai ʻa e ika → 'It was Sione who ate the fish.'", () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'kai' })
    // object_phrase_cleft is an optional extension — take it, fill, finish sub-frame
    s = takeExtension(s, 'object_phrase_cleft')
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(s.finished).toBe(true)
    const tongan = renderTongan(s)
    expect(tongan).toBe('Ko Sione naʻe ne kai ʻa e ika')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('It was Sione who ate the fish.')
  })
})

describe('2E.3 integration: cleft present + intransitive (1sg pronoun)', () => {
  it("walks Ko au ʻoku ku hiva → 'It is I who sing.'", () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'au' })
    s = advanceInFrame(s, { tongan: 'ʻoku' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('It is I who sing.')
  })
})

describe('2E.3 integration: cleft past + common noun subject + intransitive', () => {
  it("walks Ko e tangata naʻe ne hiva → 'It was the man who sang.'", () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'tangata' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'hiva' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('It was the man who sang.')
  })
})

describe('2E.3 integration: cleft question form', () => {
  it("walks Ko Sione naʻe ne kai ʻa e ika? → 'Was it Sione who ate the fish?'", () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object_phrase_cleft')
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Was it Sione who ate the fish?')
  })
})

// ============================================================================
// Phase 2E.4 — Multi-clause composition + verb-forms gap-fill
// ============================================================================

describe('2E.4 integration: multi-clause pea composition', () => {
  it("walks Naʻa ku kai pea naʻa ku inu → 'I ate and I drank.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // pea sub-walk (full form: tense_marker path)
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'tense_marker') // choose full-form path (2E.6)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I ate and I drank.')
  })
})

describe('2E.4 integration: multi-clause ka contrast (negation sub-clause)', () => {
  it("walks Naʻa ku kai ka naʻe ʻikai te u inu → composed with 'but'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // ka contrast sub-walk (negation entry point)
    s = takeExtension(s, 'clause_connector_ka')
    s = advanceInFrame(s, { tongan: 'ka' })
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    // pronoun_neg now has aspect_marker + verb as sibling options (2F.3)
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I ate, but I did not drink.')
  })
})

describe('2E.4 integration: Ch 30 target sentence composed English', () => {
  it("walks the full Ch 30 sentence and produces composed English", () => {
    let s = createWalkerState('statement', 999)
    // Main clause: Naʻa ku ʻalu
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // ki kolo
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    // mo Sione
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    // ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    // ke fakatau ha ika
    s = takeExtension(s, 'subordinator_ke_purpose')
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'fakatau' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishFrame(s)
    // ka naʻe ʻikai te nau fiemaʻu ha ika
    s = takeExtension(s, 'clause_connector_ka')
    s = advanceInFrame(s, { tongan: 'ka' })
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'nau' })
    // pronoun_neg now has aspect_marker + verb as sibling options (2F.3)
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiemaʻu' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishFrame(s)
    // Finish
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went to/toward town with Sione yesterday to buy some fish, but they did not want some fish.')
  })
})

describe('2E.4 integration: kapau conditional composition', () => {
  it("walks Naʻa ku kai kapau naʻa ku fiekaia → 'I ate if I was hungry.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // kapau sub-walk
    s = takeExtension(s, 'subordinator_kapau')
    s = advanceInFrame(s, { tongan: 'kapau' })
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiekaia' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I ate if I was hungry.')
  })
})

describe('2E.4 integration: transitive with gap-filled verb (ʻave)', () => {
  it("walks Naʻe ʻave ʻa e ika ʻe Sione → 'Sione took the fish.'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻave' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione took the fish.')
  })
})

describe('2E.4 integration: transitive with gap-filled verb (fai)', () => {
  it("walks ʻOku fai ʻa e ngāue ʻe Sione → 'Sione does the work.'", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'fai' })
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione does the work.')
  })
})

describe('2E.4 integration: lolotonga temporal composition', () => {
  it("walks Naʻa ku mohe lolotonga naʻa ku fiekaia → 'I slept while I was hungry.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'mohe' })
    // lolotonga sub-walk
    s = takeExtension(s, 'subordinator_lolotonga')
    s = advanceInFrame(s, { tongan: 'lolotonga' })
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiekaia' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I slept while I was hungry.')
  })
})

// ============================================================================
// Phase 2E.5 — Remaining worked examples + possessive standalone
// ============================================================================

describe('2E.5 integration: Ch 10 worked example — standard statement with prep + companion + time', () => {
  it("walks Naʻa ku ʻalu ki kolo mo Sione ʻaneafi → composed English", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // ki kolo
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    // mo Sione
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    // ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went to/toward town with Sione yesterday.')
  })
})

describe('2E.5 integration: Ch 19 worked example — transitive with location + time', () => {
  it("walks Naʻe kai ʻa e ika ʻe Sione ʻi ʻapi ʻaneafi → composed English", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    // ʻi ʻapi
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishFrame(s)
    // ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione ate the fish in/at home yesterday.')
  })
})

describe('2E.5 integration: Ch 24 worked example — multi-clause with pea', () => {
  it("walks Naʻa ku ʻalu ki kolo mo Sione ʻaneafi pea Naʻa ku fakatau ha ika → composed English", () => {
    let s = createWalkerState('statement', 999)
    // Main clause: Naʻa ku ʻalu ki kolo mo Sione ʻaneafi
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s)
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    // pea second clause: Naʻa ku fakatau ha ika (full form)
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'tense_marker') // choose full-form path (2E.6)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fakatau' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went to/toward town with Sione yesterday and I bought some fish.')
  })
})

describe('2E.5 integration: Ch 36 worked example — cleft with object + location + time', () => {
  it("walks Ko Sione naʻe ne kai ʻa e ika ʻi ʻapi ʻaneafi → composed English", () => {
    let s = createWalkerState('cleft_emphatic', 999)
    s = advanceInFrame(s, { tongan: 'Ko' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = advanceInFrame(s, { tongan: 'naʻe' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'kai' })
    // object
    s = takeExtension(s, 'object_phrase_cleft')
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    // ʻi ʻapi
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishFrame(s)
    // ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('It was Sione who ate the fish in/at home yesterday.')
  })
})

describe('2E.5 integration: Ch 46 worked example — noun classes (kia for personal)', () => {
  it("walks Naʻa ku lea kia houʻeiki ʻaneafi → composed English with noun class rendering", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'lea' })
    // ki houʻeiki (personal class → renders as kia)
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'houʻeiki' })
    s = finishFrame(s)
    // ʻaneafi
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Verify Tongan rendering (noun class)
    expect(renderTongan(s)).toBe('Naʻa ku lea kia houʻeiki ʻaneafi')
    // Verify composed English
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I spoke to/toward chiefs (collective) yesterday.')
  })
})

describe('2E.5 integration: possessive direct object composition', () => {
  it("walks Naʻa ku fakatau ʻeku tohi → 'I bought my book.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fakatau' })
    // possessive object: ʻeku tohi
    s = takeExtension(s, 'possessive_pronoun')
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I bought my book.')
  })
})

describe('2E.5 integration: prepositional possessive composition', () => {
  it("walks Naʻa ku ʻalu ki hoku fale → 'I went to/toward my house.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // prepositional possessive: ki hoku fale
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'ʻeku' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went to/toward my house.')
  })

  it("walks Naʻa ne nofo ʻi hono fale → 'He/she stayed in/at his/her house.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    // prepositional possessive: ʻi hono fale
    s = takeExtension(s, 'preposition_possessive')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻene' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she stayed in/at his/her/its house.')
  })
})

describe('2E.5 integration: multi-clause question form', () => {
  it("multi-clause with FINISH_QUESTION applies question mark to the full sentence", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // pea sub-walk (full form)
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'tense_marker') // choose full-form path (2E.6)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    // isQuestion flag applies to the full multi-clause sentence
    expect(out.text).toBe('I ate and I drank?')
  })
})

// ============================================================================
// Phase 2E.6 — Composition polish (tense-drop, named-possessor, dual preposition)
// ============================================================================

describe('2E.6 integration: pea tense-drop shortcut', () => {
  it("walks Naʻa ku kai pea ku inu (tense-drop) → 'I ate and I drank.'", () => {
    let s = createWalkerState('statement', 999)
    // Main clause: Naʻa ku kai
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    // pea sub-walk (tense-drop: pronoun path, bypassing tense_marker)
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'pronoun') // tense-drop path — skip tense_marker
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'inu' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Tense inferred from main clause (Naʻa = past)
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I ate and I drank.')
  })

  it("walks Naʻa ku ʻalu pea ku fakatau ha ika (tense-drop with object) → composed English", () => {
    let s = createWalkerState('statement', 999)
    // Main clause: Naʻa ku ʻalu
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // pea tense-drop sub-clause: ku fakatau ha ika
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'pronoun') // tense-drop path
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fakatau' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = finishFrame(s)
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went and I bought some fish.')
  })

  it('clause_connector_pea.next offers both tense_marker and pronoun paths', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'clause_connector_pea')
    s = advanceInFrame(s, { tongan: 'pea' })
    // After picking pea, both paths should be available in the extension menu
    const menu = getExtensionMenu(s)
    const targets = menu.extensions.map(e => e.node)
    expect(targets).toContain('tense_marker')
    expect(targets).toContain('pronoun')
  })
})

describe('2E.6 integration: named-possessor composition', () => {
  it("walks Naʻa ku ʻalu ki fale ʻa Sione → 'I went to/toward Sione's house.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // ki fale (preposition + prep_phrase)
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'fale' })
    // ʻa Sione (possessor_preposition + possessor_name)
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s) // finish possessive_phrase_name sub-walk
    s = finishFrame(s) // finish prep sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Verify Tongan rendering (possessor_preposition selects ʻa for e-class noun)
    expect(renderTongan(s)).toContain('fale')
    expect(renderTongan(s)).toContain('Sione')
    // Verify composed English
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe("I went to/toward Sione's house.")
  })

  it("walks Naʻa ne nofo ʻi fale ʻo Mele → 'He/she stayed in/at Mele's house.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    // ʻi fale (preposition + prep_phrase)
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'fale' })
    // ʻo Mele (possessor_preposition + possessor_name) — ho-class noun "fale" → ʻo
    s = takeExtension(s, 'possessor_preposition')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    s = finishFrame(s) // finish possessive_phrase_name sub-walk
    s = finishFrame(s) // finish prep sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe("He/she stayed in/at Mele's house.")
  })
})

describe('2E.6 integration: dual preposition support', () => {
  it("walks Naʻa ku lea ki kolo ʻi ʻapi → composed English with two prep phrases", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'lea' })
    // First prep phrase: ki kolo
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    // Second prep phrase: ʻi ʻapi (from prep_phrase.next, now node_visit_count_max: 2)
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    // After two preps, the edge should be hidden (count >= max)
    const menu = getExtensionMenu(s)
    expect(menu.extensions.find(e => e.node === 'preposition')).toBeUndefined()
    s = finishFrame(s) // finish second prep sub-walk
    s = finishFrame(s) // finish first prep sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    // Verify Tongan rendering
    expect(renderTongan(s)).toBe('Naʻa ku lea ki kolo ʻi ʻapi')
    // Verify composed English with both prep phrases
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I spoke to/toward town in/at home.')
  })

  it('prep_phrase.next allows a second preposition via node_visit_count_max: 2', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // First prep: ki kolo
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    // After first prep, the "Add another location" edge should still be available
    const menu = getExtensionMenu(s)
    const prepEdge = menu.extensions.find(e => e.node === 'preposition')
    expect(prepEdge).toBeDefined()
    expect(prepEdge.condition.type).toBe('node_visit_count_max')
    expect(prepEdge.condition.max).toBe(2)
  })
})

// ============================================================================
// Phase 2F.1 — Composition audit + remaining gloss-to-composed conversions
// ============================================================================

describe('2F.1 integration: benefactive preposition + name composition', () => {
  it("walks Naʻa ku ʻalu maʻa Sione → 'I went for Sione.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // benefactive_preposition_ma sub-walk: maʻa + Sione
    s = takeExtension(s, 'benefactive_preposition_ma')
    s = advanceInFrame(s, { tongan: 'maʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s) // finish benefactive sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went for Sione.')
  })

  it("Tongan rendering keeps maʻa for e-class noun (moa) + composed English", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fakatau' })
    s = takeExtension(s, 'article')
    s = advanceInFrame(s, { tongan: 'ha' })
    s = advanceInFrame(s, { tongan: 'moa' })
    // benefactive extension from object.next: maʻa + Sione
    s = takeExtension(s, 'benefactive_preposition_ma')
    s = advanceInFrame(s, { tongan: 'maʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s) // finish benefactive sub-walk
    s = finishFrame(s) // finish object sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    // moa is e_class so benefactive stays as maʻa
    expect(renderTongan(s)).toContain('maʻa')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I bought some chicken for Sione.')
  })
})

describe('2F.1 integration: benefactive fused pronoun composition', () => {
  it("walks Naʻa ku ʻalu maʻaku → 'I went for me.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // benefactive_pronoun_fused sub-walk
    s = takeExtension(s, 'benefactive_pronoun_fused')
    s = advanceInFrame(s, { tongan: 'maʻaku' })
    s = finishFrame(s) // finish benefactive sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went for me.')
  })

  it("walks ʻOku ne ngāue maʻana → 'He/she works for him/her.'", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = takeExtension(s, 'benefactive_pronoun_fused')
    s = advanceInFrame(s, { tongan: 'maʻana' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she works for him/her.')
  })
})

describe('2F.1 integration: ko equational composition', () => {
  it("walks Ko e faiako au → 'I am a teacher.'", () => {
    let s = createWalkerState('ko_equational', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'faiako' })
    // Phase 2F.2: equational_subject is now non-required (branching mode)
    s = takeExtension(s, 'equational_subject')
    s = advanceInFrame(s, { tongan: 'au' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I am a teacher.')
  })

  it("walks Ko e taʻahine fiefia ʻa Mele → 'Mele is a happy girl.' (modifier_eq path)", () => {
    // Phase 2F.2: modifier_eq is now reachable from the walker — equational_subject
    // no longer auto-advances, so the user can pick modifier_eq first
    let s = createWalkerState('ko_equational', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'taʻahine' })
    s = takeExtension(s, 'modifier_eq')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    // modifier_eq has required → equational_subject, auto-advances
    s = advanceInFrame(s, { tongan: 'ʻa Mele' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Mele is a happy girl.')
  })

  it("walks Ko e faiako ia → question: 'Is he/she a teacher?'", () => {
    let s = createWalkerState('ko_equational', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'faiako' })
    s = takeExtension(s, 'equational_subject')
    s = advanceInFrame(s, { tongan: 'ia' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Is he/she a teacher?')
  })
})

describe('2F.1 integration: relative clause composition', () => {
  it("walks Ko e tohi ʻeni ʻoku ne ngāue ai → 'This is the book he/she works.'", () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'tohi' })
    s = advanceInFrame(s, { tongan: 'ʻeni' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('This is the book he/she works.')
  })

  it("walks Ko e vaka ia naʻa ku nofo ʻi ai → 'That is the boat I stayed in.'", () => {
    let s = createWalkerState('ko_identification', 999)
    s = advanceInFrame(s, { tongan: 'Ko e' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = advanceInFrame(s, { tongan: 'ia' })
    s = takeExtension(s, 'relative_clause_tense')
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    // Add preposition (ʻi = at/in) to trigger "in" ending
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishFrame(s) // finish prep sub-walk
    s = finishFrame(s) // finish rel clause sub-walk
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('That is the boat I stayed in.')
  })
})

describe('2F.1 integration: benefactive rendering passes (Tongan paradigm selection)', () => {
  it("benefactive_preposition_ma backward walk selects moʻo for ho-class noun", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    // nofo has no object, but fale (ho_class) on preposition
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'fale' })
    s = finishFrame(s) // finish prep sub-walk
    // Now benefactive: maʻa → should render as moʻo (fale = ho_class)
    s = takeExtension(s, 'benefactive_preposition_ma')
    s = advanceInFrame(s, { tongan: 'maʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const tongan = renderTongan(s)
    expect(tongan).toContain('moʻo')
    expect(tongan).not.toContain('maʻa')
  })
})

// ====================================================================
// Phase 2F.2 integration tests: composition coverage expansion
// ====================================================================

describe('2F.2 integration: existential composition', () => {
  it("ʻOku ʻi ai ha tangata → 'There is a man.' (present affirmative)", () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'tangata' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('There is a man.')
  })

  it("Naʻe ʻi ai ha fefine → 'There was a woman.' (past affirmative)", () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'fefine' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('There was a woman.')
  })

  it("ʻOku ʻikai ke ʻi ai ha meʻakai → 'There is no food.' (present negated)", () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻikai ke ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'meʻakai' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('There is no food.')
  })

  it("ʻE ʻi ai ha kātoanga → 'There will be a celebration.' (future affirmative)", () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻE ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'kātoanga' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('There will be a celebration.')
  })

  it("ʻOku ʻi ai ha vaka lahi → 'There is a big boat.' (with attributive adjective)", () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'vaka' })
    s = takeExtension(s, 'attributive_adjective')
    s = advanceInFrame(s, { tongan: 'lahi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('There is a big boat.')
  })

  it("existential question form: 'Is there a man?'", () => {
    let s = createWalkerState('existential', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku ʻi ai ha' })
    s = advanceInFrame(s, { tongan: 'tangata' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Is there a man?')
  })
})

describe('2F.2 integration: obligation composition (totonu ke / kuo pau ke)', () => {
  it("ʻOku totonu ke u ako → 'I should study.' (present should)", () => {
    let s = createWalkerState('obligation_should', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku totonu ke' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I should study.')
  })

  it("Naʻe totonu ke ne ako → 'He/she should have studied.' (past should have)", () => {
    let s = createWalkerState('obligation_should', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe totonu ke' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she should have studied.')
  })

  it("Kuo pau ke ke ngāue → 'You must work.' (must)", () => {
    let s = createWalkerState('obligation_must', 999)
    s = advanceInFrame(s, { tongan: 'Kuo pau ke' })
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ngāue' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('You must work.')
  })
})

describe('2F.2 integration: permission/optative composition (tuku ke / ʻofa ke)', () => {
  it("Tuku ke u ako → 'Let me study.' (permission with pronoun)", () => {
    let s = createWalkerState('permission_tuku_ke', 999)
    s = advanceInFrame(s, { tongan: 'Tuku ke' })
    // tuku_ke_phrase has non-required edges — use takeExtension to pick branch
    s = takeExtension(s, 'obligation_pronoun')
    s = advanceInFrame(s, { tongan: 'u' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Let me study.')
  })

  it("ʻOfa pē ke mou fiefia → 'May you all be happy.' (optative with adjective verb)", () => {
    let s = createWalkerState('optative_ofa_ke', 999)
    s = advanceInFrame(s, { tongan: 'ʻOfa pē ke' })
    // ofa_ke_phrase has non-required edges — use takeExtension to pick branch
    s = takeExtension(s, 'obligation_pronoun')
    s = advanceInFrame(s, { tongan: 'mou' })
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('May you all be happy.')
  })
})

describe('2F.2 integration: aspect marker composition', () => {
  it("ʻOku ou kei ʻalu → 'I still go.' (preposed kei = still)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'aspect_marker')
    s = advanceInFrame(s, { tongan: 'kei' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I still go.')
  })

  it("ʻOku ne ʻosi kai → 'He/she already eats.' (preposed ʻosi = already)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'aspect_marker')
    s = advanceInFrame(s, { tongan: 'ʻosi' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she already eats.')
  })

  it("Naʻa ku ʻalu leva → 'I went immediately.' (postposed leva)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // verb has FINISH edges → extending mode → sub-frame pushed
    s = takeExtension(s, 'aspect_marker_post')
    s = advanceInFrame(s, { tongan: 'leva' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went immediately.')
  })
})

// ===========================================================================
// 2F.3 integration: auxiliary verb composition (fie_aux / lava_o_aux)
// ===========================================================================

describe('2F.3 integration: fie_aux composition (want to)', () => {
  it("ʻOku ou fie ako → 'I want to study.' (present, 1sg)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'fie_aux')
    s = advanceInFrame(s, { tongan: 'fie' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I want to study.')
  })

  it("ʻOku ne fie ako → 'He/she wants to study.' (present, 3sg wants agreement)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'fie_aux')
    s = advanceInFrame(s, { tongan: 'fie' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she wants to study.')
  })

  it("Naʻa ku fie ʻalu → 'I wanted to go.' (past fie_aux)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'fie_aux')
    s = advanceInFrame(s, { tongan: 'fie' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I wanted to go.')
  })
})

describe('2F.3 integration: lava_o_aux composition (can / be able to)', () => {
  it("ʻOku ou lava ʻo ʻalu → 'I can go.' (present, 1sg)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'lava_o_aux')
    s = advanceInFrame(s, { tongan: 'lava ʻo' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I can go.')
  })

  it("Naʻa ku lava ʻo ʻalu → 'I could go.' (past lava_o_aux)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'lava_o_aux')
    s = advanceInFrame(s, { tongan: 'lava ʻo' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I could go.')
  })

  it("Te u lava ʻo ako → 'I will be able to study.' (future lava_o_aux)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'lava_o_aux')
    s = advanceInFrame(s, { tongan: 'lava ʻo' })
    s = advanceInFrame(s, { tongan: 'ako' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I will be able to study.')
  })
})

// ===========================================================================
// 2F.3 integration: personal count composition
// ===========================================================================

describe('2F.3 integration: personal_count composition', () => {
  it("ʻOku nau toko tolu → 'They are three (people).' (present plural)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'nau' })
    s = takeExtension(s, 'personal_count')
    s = advanceInFrame(s, { tongan: 'toko tolu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('They are three (people).')
  })

  it("Naʻa nau toko ua → 'They were two (people).' (past plural)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'nau' })
    s = takeExtension(s, 'personal_count')
    s = advanceInFrame(s, { tongan: 'toko ua' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('They were two (people).')
  })
})

// ===========================================================================
// 2F.3 integration: directional particle composition
// ===========================================================================

describe('2F.3 integration: directional particle composition', () => {
  it("Naʻa ku ʻalu mai → 'I went toward me.' (directional mai = toward me)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'mai' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I went toward me.')
  })

  it("ʻOku ou ʻalu hake → 'I go upward.' (directional hake = upward)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hake' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I go upward.')
  })
})

// ===========================================================================
// 2F.3 integration: tuo_numeral (count of times) composition
// ===========================================================================

describe('2F.3 integration: tuo_numeral composition', () => {
  it("ʻOku ou ʻalu tuʻo ua → 'I go twice.' (tuo_numeral = twice)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'tuo_numeral')
    s = advanceInFrame(s, { tongan: 'tuʻo ua' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I go twice.')
  })

  it("Naʻa ku ako tuʻo taha → 'I studied once.' (tuo_numeral = once, past)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ako' })
    s = takeExtension(s, 'tuo_numeral')
    s = advanceInFrame(s, { tongan: 'tuʻo taha' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I studied once.')
  })
})

// ===========================================================================
// 2F.3 integration: aspect marker in negation handler
// ===========================================================================

describe('2F.3 integration: aspect marker in negation', () => {
  it("ʻOku ʻikai te u kei ʻalu → 'I still do not go.' (negation + aspect_marker kei=still)", () => {
    // pronoun_neg.next now exposes aspect_marker as a sibling of verb (2F.3).
    // Without required:true on verb, the walker enters branching mode after
    // pronoun_neg and the user picks either aspect_marker or verb.
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'aspect_marker')
    s = advanceInFrame(s, { tongan: 'kei' })
    // aspect_marker.next has required verb
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai te u kei ʻalu')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I still do not go.')
  })
})

// ===========================================================================
// 2F.4 integration: comparative/superlative composition (§31, Ch 27)
// ===========================================================================
//
// comparative_ange and superlative_taha attach to verb.next when the verb
// has tag "adjective". The translation engine derives English comparative/
// superlative forms via makeComparativeSuperlative() — consonant+y rule
// (happy → happier/happiest), monosyllabic rule (sick → sicker/sickest),
// and multi-syllable fallback (tired → more tired/the most tired).

describe('2F.4 integration: comparative composition — standard statement', () => {
  it("ʻOku ou fiefia ange → 'I am happier.' (comparative present, -y adj)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = takeExtension(s, 'comparative_ange')
    s = advanceInFrame(s, { tongan: 'ange' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ou fiefia ange')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I am happier.')
  })

  it("ʻOku ou fiefia taha → 'I am the happiest.' (superlative present, -y adj)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = takeExtension(s, 'superlative_taha')
    s = advanceInFrame(s, { tongan: 'taha' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ou fiefia taha')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I am the happiest.')
  })

  it("Naʻa ku ʻita ange → 'I was angrier.' (comparative past, -y adj)", () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻita' })
    s = takeExtension(s, 'comparative_ange')
    s = advanceInFrame(s, { tongan: 'ange' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I was angrier.')
  })

  it("ʻOku ne puke taha → 'He/she is the sickest.' (superlative, monosyllabic adj)", () => {
    // puke = sick (1 vowel group) → sicker/the sickest
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'puke' })
    s = takeExtension(s, 'superlative_taha')
    s = advanceInFrame(s, { tongan: 'taha' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she is the sickest.')
  })
})

// ===========================================================================
// 2F.4 integration: comparative/superlative in negation handler
// ===========================================================================

describe('2F.4 integration: comparative in negation', () => {
  it("ʻOku ʻikai te u fiefia ange → 'I am not happier.' (negation + comparative)", () => {
    // verb.next includes comparative_ange so it is reachable from the negation
    // path (pronoun_neg → [branching] verb → [extending] comparative_ange).
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = takeExtension(s, 'comparative_ange')
    s = advanceInFrame(s, { tongan: 'ange' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai te u fiefia ange')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I am not happier.')
  })

  it("ʻOku ʻikai te ne puke taha → 'He/she is not the sickest.' (negation + superlative)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'puke' })
    s = takeExtension(s, 'superlative_taha')
    s = advanceInFrame(s, { tongan: 'taha' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('He/she is not the sickest.')
  })
})

// ===========================================================================
// 2F.4 integration: question word in verbal negation handler
// ===========================================================================

describe('2F.4 integration: question word in negation', () => {
  it("ʻOku ʻikai te u ʻalu ʻi fē? → 'Where do i not go?' (negation + where question)", () => {
    // question_word is on verb.next (extending mode), so it is reachable from
    // the negation path.  The handler extracts the predicate after "do not"
    // and prepends the question word.
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'question_word')
    s = advanceInFrame(s, { tongan: 'ʻi fē' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('ʻOku ʻikai te u ʻalu ʻi fē')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Where do i not go?')
  })

  it("Naʻe ʻikai te u ʻalu ʻi fē? → 'Where did i not go?' (negation + past + where)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'question_word')
    s = advanceInFrame(s, { tongan: 'ʻanefē' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('When did i not go?')
  })
})

// ===========================================================================
// 2F.5 integration: preposed modifier (fa'a) in negation handler
// ===========================================================================
//
// pronoun_neg.next now includes preposed_modifier as a sibling of
// aspect_marker and verb. In branching mode (no FINISH on pronoun_neg.next),
// takeExtension inlines preposed_modifier; its next has verb as required,
// so the verb advance follows directly. The negation handler inserts "often"
// after the subject via insertAfterSubject.

describe('2F.5 integration: preposed modifier in negation', () => {
  it("ʻOku ʻikai te u faʻa ʻalu → 'I do not often go.' (negation + fa'a present)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    // pronoun_neg.next is branching (no FINISH) → inline transition
    s = takeExtension(s, 'preposed_modifier')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    // preposed_modifier.next has verb as required → auto-advance
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // verb.next has FINISH → extending mode; finish directly
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai te u faʻa ʻalu')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I do not often go.')
  })

  it("Naʻe ʻikai te u faʻa kai → 'I did not often eat.' (negation + fa'a past)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'preposed_modifier')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('I did not often eat.')
  })

  it("pronoun_neg.next includes preposed_modifier edge", () => {
    const negPronEdges = grammarGraph.nodes.pronoun_neg.next.map(e => e.node)
    expect(negPronEdges).toContain('preposed_modifier')
  })
})

// ===========================================================================
// 2F.5 integration: noun-subject directional (post-subject position)
// ===========================================================================
//
// noun_subject_name.next now includes directional and tuo_numeral.
// After verb_ns, the walker enters branching mode (no FINISH on verb_ns.next);
// takeExtension('focus_marker') inlines. After noun_subject_name, the walker
// enters extending mode (FINISH on noun_subject_name.next); takeExtension
// pushes a sub-frame for directional/tuo_numeral.

describe('2F.5 integration: noun-subject directional', () => {
  it("ʻOku ʻalu ʻa Sione hifo → 'Sione goes downward.' (noun-subject + directional)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    // verb_ns.next is branching (no FINISH) → inline focus_marker
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    // focus_marker.next has noun_subject_name as required
    s = advanceInFrame(s, { tongan: 'Sione' })
    // noun_subject_name.next has FINISH → extending mode
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hifo' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻalu ʻa Sione hifo')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione goes downward.')
  })

  it("Naʻe ʻalu ʻa Mele hake → 'Mele went upward.' (noun-subject + directional past)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hake' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Mele went upward.')
  })
})

// ===========================================================================
// 2F.5 integration: noun-subject tuo_numeral
// ===========================================================================

describe('2F.5 integration: noun-subject tuo_numeral', () => {
  it("ʻOku ʻalu ʻa Sione tuʻo ua → 'Sione goes twice.' (noun-subject + count)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'tuo_numeral')
    s = advanceInFrame(s, { tongan: 'tuʻo ua' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione goes twice.')
  })
})

// ===========================================================================
// 2F.5 integration: noun-subject comparative/superlative
// ===========================================================================
//
// verb_ns.next now includes comparative_ange and superlative_taha (with
// adjective gate). verb_ns adjective entries now carry tags: ["adjective"]
// and findHeadVerbStep includes verb_ns so the gate evaluates correctly.
// comparative_ange.next and superlative_taha.next include focus_marker so
// the chain verb_ns → comparative_ange → focus_marker → noun_subject_name
// works end-to-end.

describe('2F.5 integration: noun-subject comparative/superlative', () => {
  it("ʻOku fiefia ange ʻa Sione → 'Sione is happier.' (noun-subject comparative)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    // verb_ns.next is branching → inline comparative_ange
    s = takeExtension(s, 'comparative_ange')
    s = advanceInFrame(s, { tongan: 'ange' })
    // comparative_ange.next has FINISH → extending mode; push focus_marker
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku fiefia ange ʻa Sione')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione is happier.')
  })

  it("ʻOku puke taha ʻa Mele → 'Mele is the sickest.' (noun-subject superlative)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'puke' })
    s = takeExtension(s, 'superlative_taha')
    s = advanceInFrame(s, { tongan: 'taha' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku puke taha ʻa Mele')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Mele is the sickest.')
  })

  it("verb_ns.next includes comparative_ange and superlative_taha with adjective gate", () => {
    const verbNsEdges = grammarGraph.nodes.verb_ns.next
    const compEdge = verbNsEdges.find(e => e.node === 'comparative_ange')
    const superEdge = verbNsEdges.find(e => e.node === 'superlative_taha')
    expect(compEdge).toBeDefined()
    expect(superEdge).toBeDefined()
    // P1-B4 follow-up #1: array condition AND-composing the adjective gate with
    // no_emphatic_yet (a no-op on the noun-subject path, which has no emphatic).
    expect(compEdge.condition).toEqual([{ type: 'verb_has_tag', tag: 'adjective' }, { type: 'no_emphatic_yet' }])
    expect(superEdge.condition).toEqual([{ type: 'verb_has_tag', tag: 'adjective' }, { type: 'no_emphatic_yet' }])
  })
})

// ===========================================================================
// 2F.6 integration: preposed modifier faʻa in the noun-subject path
// ===========================================================================
//
// faʻa (= often) attaches at tense_marker_ns.next, which is now a branching
// menu (verb_ns | preposed_modifier_ns), mirroring preposed_modifier on the
// pronoun path. preposed_modifier_ns.next requires verb_ns, so a verb is still
// forced. composeNounSubjectTranslation inserts "often" before the verb, or
// after a leading auxiliary (will/has) so future/perfect read naturally.

describe('2F.6 integration: noun-subject preposed faʻa', () => {
  it("ʻOku faʻa ʻalu ʻa Sione → 'Sione often goes.' (present)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    // tense_marker_ns.next is now a menu → take the faʻa branch
    s = takeExtension(s, 'preposed_modifier_ns')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    // preposed_modifier_ns.next has verb_ns required → auto-advance
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku faʻa ʻalu ʻa Sione')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione often goes.')
  })

  it("Naʻe faʻa ʻalu ʻa Sione → 'Sione often went.' (past)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = takeExtension(s, 'preposed_modifier_ns')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione often went.')
  })

  it("ʻE faʻa ʻalu ʻa Sione → 'Sione will often go.' (future — 'often' after the auxiliary)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻE' })
    s = takeExtension(s, 'preposed_modifier_ns')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione will often go.')
  })

  it("ʻOku faʻa ʻalu ʻa e tamasiʻi → 'The boy often goes.' (common-noun subject, 'a e rule)", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'preposed_modifier_ns')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'tamasiʻi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku faʻa ʻalu ʻa e tamasiʻi')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('The boy often goes.')
  })

  it('tense_marker_ns.next branches to verb_ns + preposed_modifier_ns; preposed_modifier_ns requires verb_ns', () => {
    const tmNs = grammarGraph.nodes.tense_marker_ns
    const edges = tmNs.next.map(e => e.node)
    expect(edges).toContain('verb_ns')
    expect(edges).toContain('preposed_modifier_ns')
    // Neither edge is forced → branching menu, so faʻa is actually reachable.
    expect(tmNs.next.every(e => !e.required)).toBe(true)
    const pmNs = grammarGraph.nodes.preposed_modifier_ns
    expect(pmNs).toBeDefined()
    expect(pmNs.words.map(w => w.tongan)).toEqual(['faʻa'])
    expect(pmNs.next.find(e => e.node === 'verb_ns').required).toBe(true)
  })
})

// ===========================================================================
// 2F.6 integration: directional + count-of-times in noun-subject negation
// ===========================================================================
//
// The noun-subject negation path (negation_word → neg_connector_ns → verb_ns →
// focus_marker → noun_subject_name) reaches the same noun_subject_name.next
// extensions as the plain noun-subject path, so directional + tuo_numeral are
// already walkable here. 2F.6 teaches composeNegationTranslation's
// neg_connector_ns branch to render them, for parity with the plain path.

describe('2F.6 integration: noun-subject negation directional / count', () => {
  it("ʻOku ʻikai ke ʻalu ʻa Sione hifo → 'Sione does not go downward.' (NS negation + directional)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector_ns')  // ke + verb + name (noun-subject negation)
    s = advanceInFrame(s, { tongan: 'ke' })
    // neg_connector_ns.next has verb_ns required → auto-advance
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hifo' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('ʻOku ʻikai ke ʻalu ʻa Sione hifo')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione does not go downward.')
  })

  it("Naʻe ʻikai ke ʻalu ʻa Mele hake → 'Mele did not go upward.' (NS negation + directional past)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector_ns')
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hake' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Mele did not go upward.')
  })

  it("ʻOku ʻikai ke ʻalu ʻa Sione tuʻo ua → 'Sione does not go twice.' (NS negation + count)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector_ns')
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'tuo_numeral')
    s = advanceInFrame(s, { tongan: 'tuʻo ua' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione does not go twice.')
  })
})

// ===========================================================================
// 2F.6 integration: adjective + question word in negation
// ===========================================================================
//
// question_word is on verb.next, so it is reachable after an adjective-typed
// verb in the negation path. 2F.4 handled the verb case but gated out
// adjectives; 2F.6 prepends the question word to the already-built yes/no
// adjective question ("Am i not happy?" → "Where am i not happy?"). Subject
// stays lower-case, matching the 2F.4 verb-negation convention.

describe('2F.6 integration: adjective + question word in negation', () => {
  it("ʻOku ʻikai te u fiefia ʻi fē? → 'Where am i not happy?' (1sg present)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })  // adjective-typed verb
    s = takeExtension(s, 'question_word')
    s = advanceInFrame(s, { tongan: 'ʻi fē' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(renderTongan(s)).toBe('ʻOku ʻikai te u fiefia ʻi fē')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Where am i not happy?')
  })

  it("Naʻe ʻikai te u fiefia ʻi fē? → 'Where was i not happy?' (1sg past)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = takeExtension(s, 'question_word')
    s = advanceInFrame(s, { tongan: 'ʻi fē' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Where was i not happy?')
  })

  it("ʻOku ʻikai te ne fiefia ʻi fē? → 'Where is he/she not happy?' (3sg present)", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'ne' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'fiefia' })
    s = takeExtension(s, 'question_word')
    s = advanceInFrame(s, { tongan: 'ʻi fē' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Where is he/she not happy?')
  })
})

// ===========================================================================
// 2F.6 (d): composition gloss audit — touched frames stay 'composed'
// ===========================================================================
//
// Representative ch-999 walks across the frames 2F.6 touched, including the
// untested-but-now-walkable combinations (faʻa + adjective; common-noun
// noun-subject negation + directional). Each asserts method === 'composed'
// (never the gloss fallback). Together with the 11 integration tests above,
// this is the 2F.6 composition audit: no gloss fallbacks remain on these paths.

describe('2F.6 (d): composition gloss audit', () => {
  it("faʻa + adjective noun-subject: ʻOku faʻa puke ʻa Sione → 'Sione is often sick.'", () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'preposed_modifier_ns')
    s = advanceInFrame(s, { tongan: 'faʻa' })
    // preposed_modifier_ns.next has verb_ns required → auto-advance
    s = advanceInFrame(s, { tongan: 'puke' })  // adjective
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione is often sick.')
  })

  it("common-noun NS negation + directional: ʻOku ʻikai ke ʻalu ʻa e tamasiʻi hifo → 'The boy does not go downward.'", () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector_ns')
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'tamasiʻi' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'hifo' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('The boy does not go downward.')
  })
})

// ===========================================================================
// 2F.5 integration: transitive directional/tuo_numeral
// ===========================================================================
//
// agent_phrase.next now includes directional and tuo_numeral.
// composeTransitiveTranslation inserts directional/count after agent.

describe('2F.5 integration: transitive directional', () => {
  it("Naʻe kai ʻa e ika ʻe Sione ange → 'Sione ate the fish toward him / her / them.' (transitive + directional)", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'directional')
    s = advanceInFrame(s, { tongan: 'ange' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    expect(renderTongan(s)).toBe('Naʻe kai ʻa e ika ʻe Sione ange')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione ate the fish toward him / her / them.')
  })
})

describe('2F.5 integration: transitive tuo_numeral', () => {
  it("Naʻe kai ʻa e ika ʻe Sione tuʻo ua → 'Sione ate the fish twice.' (transitive + count)", () => {
    let s = createWalkerState('transitive_statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'kai' })
    s = advanceInFrame(s, { tongan: 'ika' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'tuo_numeral')
    s = advanceInFrame(s, { tongan: 'tuʻo ua' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_STATEMENT')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Sione ate the fish twice.')
  })

  it("agent_phrase.next includes directional and tuo_numeral edges", () => {
    const agentEdges = grammarGraph.nodes.agent_phrase.next.map(e => e.node)
    expect(agentEdges).toContain('directional')
    expect(agentEdges).toContain('tuo_numeral')
  })
})

describe('FINISH_QUESTION threading through remaining composers', () => {
  // Regression guard for a user-reported gap: FINISH_QUESTION was honored
  // for transitive / cleft / have / existential / obligation / Ko / etc. but
  // was silently dropped for four paths whose composers never received the
  // `isQuestion` flag — noun-subject, negation, experiencer, and location.
  // The user's report: `ʻOku mohe ʻa e tamasiʻi ?` rendered "The boy sleeps."
  // Each test below builds a sentence in one of those four shapes, finishes
  // with FINISH_QUESTION, and asserts the English form is a question.

  it('noun-subject + FINISH_QUESTION → "Does the boy sleep?"', () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'mohe' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'tamasiʻi' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    expect(s.translation.isQuestion).toBe(true)
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Does the boy sleep?')
  })

  it('noun-subject past + FINISH_QUESTION → "Did Sione go?"', () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = takeExtension(s, 'verb_ns')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = finishFrame(s)
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.text).toBe('Did Sione go?')
  })

  it('verbal negation + FINISH_QUESTION → "Do i not eat?"', () => {
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Do i not eat?')
  })

  it('impersonal negation + FINISH_QUESTION → "Is it not rain?"', () => {
    // The composer uses verbStep.word.english verbatim ("rain") rather than
    // the present-participle form ("raining") — this preserves the existing
    // statement behavior ("It is not rain.") from before threading isQuestion.
    // A participle transform would be an independent English-rendering fix.
    let s = createWalkerState('negation_impersonal', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ʻuha' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.text).toBe('Is it not rain?')
  })

  it('experiencer + FINISH_QUESTION → "Do i understand?"', () => {
    let s = createWalkerState('experiencer', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'mahino' })
    s = advanceInFrame(s, { tongan: 'kiate au' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.text).toBe('Do i understand?')
  })

  it('location + FINISH_QUESTION → "Am i at home?"', () => {
    let s = createWalkerState('location_state', 999)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'ou' })
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishWalker(s, 'FINISH_QUESTION')
    const out = translateWalkerState(s)
    expect(out.method).toBe('composed')
    expect(out.text).toBe('Am i at home?')
  })
})
