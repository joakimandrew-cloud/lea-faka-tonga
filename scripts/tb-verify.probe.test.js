/**
 * tb-verify.probe.test.js — acceptance gate for the P0 sentence-builder fixes.
 *
 * REJECT cases: bounded BFS over the real engine; a nonsense string must be
 * UNREACHABLE (BFS exhausts without producing it).
 * ACCEPT cases: a directed greedy build must still succeed for good grammar.
 *
 * Runs in the normal suite (bounded; explicit 30s timeout on the BFS cases).
 */
import { describe, it, expect } from 'vitest'
import grammarGraph from '../src/data/grammar-graph.json'
import {
  createMultiWalker, pickFirstWord, pickWord, pickExtension, pickTerminator,
  finishCurrentFrame, getRenderedSentence, getPickerData, getFirstWordOptions, PHASE,
} from '../src/engine/multi-walker.js'
import {
  createWalkerState, advanceInFrame, takeExtension, finishFrame,
  getRenderedPath, getExtensionMenu, getCurrentFrameWords,
} from '../src/engine/graph-walker.js'

// Build "Naʻa ku ʻalu" at the deterministic walker level (no picker nav).
function naaKuAlu() {
  // chapter 999 = free mode (all words/edges unlocked); the de-dup and cap
  // logic under test is chapter-independent. Mirrors the proven sequence in
  // graph-walker.test.js.
  let s = createWalkerState('statement', 999)
  s = advanceInFrame(s, { tongan: 'Naʻa' })
  s = advanceInFrame(s, { tongan: 'ku' })
  s = takeExtension(s, 'verb')
  s = advanceInFrame(s, { tongan: 'ʻalu' })
  return s
}
// Chain a companion from the CURRENT anchor (verb for the first, the companion
// node for each subsequent one). No finishFrame between companions — the chain
// lives at the companion anchor; collapsing happens at render time.
function addCompanion(s, name) {
  s = takeExtension(s, 'mo_fixed')
  s = advanceInFrame(s, { tongan: 'mo' })
  s = advanceInFrame(s, { tongan: name })
  return s
}
const render = (s) => getRenderedPath(s).map(p => p.renderedTongan).join(' ')

function expand(groups) {
  const out = []
  for (const g of groups) {
    const ext = g.items.filter(i => i.type === 'extension')
    const term = g.items.filter(i => i.type === 'terminator')
    if (!ext.length) { out.push(g); continue }
    if (term.length) out.push({ label: 'Finish', items: term })
    for (const e of ext) out.push({ label: e.display.replace(/^\+\s*/, ''), items: [{ type: 'extension', id: e.id, display: e.display }] })
  }
  return out
}
function confirm(s, it) {
  if (it.type === 'first_word') return pickFirstWord(s, it.item)
  if (it.type === 'word') return pickWord(s, it.word)
  if (it.type === 'extension') return pickExtension(s, it.id)
  if (it.type === 'terminator') return pickTerminator(s, it.id)
  if (it.type === 'finish_frame') return finishCurrentFrame(s)
}
const rend = (s) => getRenderedSentence(s).map(x => x.renderedTongan).join(' ')
const pathIds = (s) => getRenderedSentence(s).map(x => x.nodeId).join('>')
function firstWord(tongan) {
  const fw = getFirstWordOptions(createMultiWalker(53))
  for (const g of fw.groups) for (const w of g.words) if (w.word.tongan === tongan) return w
  return null
}

// Bounded BFS: true if any reachable rendered string CONTAINS `needle`.
function reachable(firstTongan, needle, { depth = 11, max = 30000 } = {}) {
  const fwi = firstWord(firstTongan)
  if (!fwi) return false
  let start; try { start = pickFirstWord(createMultiWalker(53), fwi) } catch { return false }
  const seen = new Set()
  const queue = [{ s: start, d: 1 }]
  let n = 0
  while (queue.length) {
    if (n++ > max) break
    const { s, d } = queue.shift()
    if (rend(s).includes(needle)) return true
    if (s.phase === PHASE.FINISHED || d >= depth) continue
    const groups = expand(getPickerData(s).groups)
    const key = pathIds(s) + '|' + groups.map(g => g.label).sort().join(',')
    if (seen.has(key)) continue
    seen.add(key)
    const seenWord = new Set()
    for (const g of groups) for (const it of g.items) {
      if (it.type === 'word') { const k = g.label + '|' + it.word.tongan; if (seenWord.has(k)) continue; seenWord.add(k) }
      let next; try { next = confirm(s, it) } catch { continue }
      if (next) queue.push({ s: next, d: d + 1 })
    }
  }
  return false
}

// Directed greedy build: pick, in order, an item that advances toward each
// wanted token (matching a word or an extension display). Returns the rendered
// string, or null if it got stuck. Tries extensions (to open a slot) then words.
function build(firstTongan, wants) {
  const fwi = firstWord(firstTongan)
  if (!fwi) return null
  let s; try { s = pickFirstWord(createMultiWalker(53), fwi) } catch { return null }
  for (const want of wants) {
    let moved = false
    for (let hop = 0; hop < 6 && !moved; hop++) {
      const groups = expand(getPickerData(s).groups)
      const w = want.toLowerCase()
      let pick = null
      // 1) exact word match
      for (const g of groups) for (const it of g.items)
        if (it.type === 'word' && it.word.tongan.toLowerCase() === w) { pick = it; break }
      // 2) extension whose tab/label hints at the want
      if (!pick) for (const g of groups) for (const it of g.items)
        if (it.type === 'extension' && (g.label.toLowerCase().includes(w) || it.display.toLowerCase().includes(w))) { pick = it; break }
      // 3) advance: prefer an extension that opens a slot, else the first word
      //    (lets us pass through required slots like the pronoun before kai)
      if (!pick) for (const g of groups) for (const it of g.items)
        if (it.type === 'extension') { pick = it; break }
      if (!pick) for (const g of groups) for (const it of g.items)
        if (it.type === 'word') { pick = it; break }
      if (!pick) return rend(s)
      let next; try { next = confirm(s, pick) } catch { return rend(s) }
      s = next
      if (rend(s).toLowerCase().includes(w)) moved = true
    }
  }
  return rend(s)
}

describe('P0 fixes — nonsense blocklist is unreachable', () => {
  it('B1: no triple modifier on the negation path', () => {
    expect(reachable('Naʻe', 'lelei lelei lelei', { depth: 8, max: 6000 })).toBe(false)
  }, 30000)
  it('B1: no triple modifier on the statement path', () => {
    expect(reachable('ʻOku', 'lelei lelei lelei', { depth: 8, max: 6000 })).toBe(false)
  }, 30000)
  it('B2: companion name cannot repeat (mo Sione mo Sione)', () => {
    expect(reachable('ʻOku', 'mo Sione mo Sione', { depth: 9, max: 8000 })).toBe(false)
  }, 30000)
  it('B3: same locative cannot repeat (ʻapi ʻi ʻapi)', () => {
    expect(reachable('Kai', 'ʻapi ʻi ʻapi')).toBe(false)
  }, 30000)
  it('B4 (command case): no postposed pronoun after a locative in a command', () => {
    expect(reachable('Kai', 'ʻapi au')).toBe(false)
  }, 30000)
  it('B5: command particle order — koe muʻa is blocked', () => {
    expect(reachable('Kai', 'koe muʻa')).toBe(false)
  }, 30000)
})

describe('P0 fixes — good constructions still build', () => {
  it('distinct companions still chain (mo Sione mo Mele)', () => {
    let s = addCompanion(naaKuAlu(), 'Sione')
    s = addCompanion(s, 'Mele')
    expect(render(s)).toContain('mo Sione mo Mele')
  })
  it('B2 de-dup: the same companion name is not offered twice', () => {
    let s = addCompanion(naaKuAlu(), 'Sione')
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    const names = getCurrentFrameWords(s).map(w => w.tongan)
    expect(names).toContain('Mele')      // a different name is still offered
    expect(names).not.toContain('Sione') // the used name is filtered out
  })
  it('B2 cap: companion chain stops after 4', () => {
    let s = naaKuAlu()
    for (const n of ['Sione', 'Mele', 'Pita', 'Ana']) s = addCompanion(s, n)
    const extIds = getExtensionMenu(s).extensions.map(e => e.node)
    expect(extIds).not.toContain('mo_fixed') // 5th companion blocked
  })
  it('two modifiers still allowed (lelei lelei)', () => {
    expect(reachable('Naʻe', 'lelei lelei', { depth: 10, max: 15000 })).toBe(true)
  }, 30000)
  it('command + please + you still builds (muʻa koe)', () => {
    // Deterministic build (the greedy build() helper picks the LAST extension
    // when no label/word matches, so it became order-fragile once P1-A3 added
    // clause connectors after emphatic_pronoun on command_verb.next). The
    // grammar still supports Kai muʻa koe; this walks it explicitly.
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    s = takeExtension(s, 'polite_particle')
    s = advanceInFrame(s, { tongan: 'muʻa' })
    s = takeExtension(s, 'emphatic_pronoun')
    s = advanceInFrame(s, { tongan: 'koe' })
    expect(render(s)).toContain('muʻa koe')
  })
})

describe('P1-A3 — second clauses reach commands / noun-subject / prohibition', () => {
  // Deterministic graph-walker builds for the four book-attested sentences the
  // tracker requires reachable. Direct construction (not BFS) so the assertion
  // is independent of menu ordering and BFS depth limits.
  it('command + pea + bare verb builds (Mohe pea ngāue)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Mohe' })
    s = takeExtension(s, 'clause_connector_pea_serial')  // command-only bare-verb pea
    s = advanceInFrame(s, { tongan: 'pea' })
    s = advanceInFrame(s, { tongan: 'ngāue' })           // clause_connector_pea_serial.next = [verb required]
    expect(render(s)).toContain('Mohe pea ngāue')
  })
  it('statement pea does NOT drop the pronoun (no bare-verb second clause)', () => {
    // Regression guard for the verifier finding: clause_connector_pea (shared by
    // statements / noun-subject) must offer only the full + tense-drop-pronoun
    // paths, never a bare verb (Ch 24:138-160 keeps the pronoun: peá u mohe).
    const targets = (grammarGraph.nodes.clause_connector_pea.next || []).map(e => e.node)
    expect(targets).toEqual(['tense_marker', 'pronoun'])
  })
  it('command + serial ʻo + bare verb builds (Haʻu ʻo kai)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Haʻu' })
    s = takeExtension(s, 'clause_connector_o')
    s = advanceInFrame(s, { tongan: 'ʻo' })
    s = advanceInFrame(s, { tongan: 'kai' })   // clause_connector_o.next = [verb required]
    expect(render(s)).toContain('Haʻu ʻo kai')
  })
  it('command + serial ʻo + bare verb builds (ʻAlu ʻo ako)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'ʻAlu' })
    s = takeExtension(s, 'clause_connector_o')
    s = advanceInFrame(s, { tongan: 'ʻo' })
    s = advanceInFrame(s, { tongan: 'ako' })
    expect(render(s)).toContain('ʻAlu ʻo ako')
  })
  it('noun-subject + kae + second noun-subject clause builds (Naʻe ʻalu ʻa Sione kae nofo ʻa Mele)', () => {
    let s = createWalkerState('noun_subject', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' })
    s = takeExtension(s, 'clause_connector_kae')
    s = advanceInFrame(s, { tongan: 'kae' })
    s = advanceInFrame(s, { tongan: 'nofo' })  // clause_connector_kae.next = [verb_ns required]
    s = takeExtension(s, 'focus_marker')
    s = advanceInFrame(s, { tongan: 'ʻa' })
    s = advanceInFrame(s, { tongan: 'Mele' })
    expect(render(s)).toContain('Naʻe ʻalu ʻa Sione kae nofo ʻa Mele')
  })
  it('prohibition + he + weather reason clause builds (ʻOua te ke ʻalu he ʻoku ʻuha)', () => {
    let s = createWalkerState('prohibition', 999)
    s = advanceInFrame(s, { tongan: 'ʻOua te' })
    s = advanceInFrame(s, { tongan: 'ke' })
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'clause_connector_he')
    s = advanceInFrame(s, { tongan: 'he' })
    s = takeExtension(s, 'tense_marker_weather')
    s = advanceInFrame(s, { tongan: 'ʻoku' })
    s = advanceInFrame(s, { tongan: 'ʻuha' })
    expect(render(s)).toContain('ʻOua te ke ʻalu he ʻoku ʻuha')
  })
})

describe('P1-A1 — the experiencer clause extends past the experiencer pronoun', () => {
  // Before P1-A1, `ʻOku mahino kiate au` dead-ended (prep_pronoun.next was
  // FINISH-only). Now prep_pronoun is the experiencer clause's completion node
  // and offers a time word + clause connectors.
  it('experiencer + time word builds (ʻOku mahino kiate au he ʻaho ni)', () => {
    let s = createWalkerState('experiencer', 53)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'mahino' })
    s = advanceInFrame(s, { tongan: 'kiate au' })
    s = takeExtension(s, 'time_word')
    // present ʻOku gates the time word to ʻaho ni only (time_word.valid_combinations)
    expect(getCurrentFrameWords(s).map(w => w.tongan)).toEqual(['ʻaho ni'])
    s = advanceInFrame(s, { tongan: 'ʻaho ni' })
    // book Ch 4:89 — ʻaho ni as a time expression takes the article `he`
    expect(render(s)).toBe('ʻOku mahino kiate au he ʻaho ni')
  })

  it('past experiencer takes a bare adverb time word (Naʻe ngalo ʻiate au ʻaneafi)', () => {
    let s = createWalkerState('experiencer', 53)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ngalo' })
    s = advanceInFrame(s, { tongan: 'ʻiate au' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    expect(render(s)).toBe('Naʻe ngalo ʻiate au ʻaneafi') // adverbs take no `he`
  })

  it('experiencer offers clause connectors; ka opens a second clause', () => {
    let s = createWalkerState('experiencer', 53)
    s = advanceInFrame(s, { tongan: 'ʻOku' })
    s = advanceInFrame(s, { tongan: 'mahino' })
    s = advanceInFrame(s, { tongan: 'kiate au' })
    const extIds = getExtensionMenu(s).extensions.map(e => e.node)
    expect(extIds).toContain('time_word')
    expect(extIds).toContain('clause_connector_ka') // A1 cites `ka ʻoku ʻikai mahino…`
    // purpose subordinators are intentionally NOT offered on a stative clause
    expect(extIds).not.toContain('subordinator_ke_purpose')
    s = takeExtension(s, 'clause_connector_ka')
    s = advanceInFrame(s, { tongan: 'ka' })
    expect(render(s)).toContain('ʻOku mahino kiate au ka')
    expect(getExtensionMenu(s).requiredNodeId).toBe('tense_marker_neg') // fresh negation clause
  })
})

describe('P1-A1 — `he ʻaho ni` render rule applies on every path (book Ch 4:89)', () => {
  it('statement path renders he ʻaho ni', () => {
    let s = createWalkerState('statement', 53)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaho ni' })
    expect(render(s)).toBe('Naʻa ku ʻalu he ʻaho ni')
  })
  it('a bare adverb time word is unaffected (Naʻa ku ʻalu ʻaneafi)', () => {
    let s = createWalkerState('statement', 53)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    expect(render(s)).toBe('Naʻa ku ʻalu ʻaneafi')
  })
})

describe('P1-A2 — count predicates extend with the enclitic pē + a time word (spec §26)', () => {
  // Before P1-A2, `ʻOku nau toko tolu` was a FINISH-only branching-mode dead
  // end (personal_count.next listed only the two terminators). Now the count
  // predicate is a completion node offering the enclitic `pē` (count_enclitic_pe)
  // and a trailing time word; both resolve at the personal_count anchor via
  // extensionsTaken so neither can repeat.
  function count(tense, pronoun, word) {
    let s = createWalkerState('statement', 53)
    s = advanceInFrame(s, { tongan: tense })
    s = advanceInFrame(s, { tongan: pronoun })
    s = takeExtension(s, 'personal_count')
    s = advanceInFrame(s, { tongan: word })
    return s
  }
  const extIds = (s) => getExtensionMenu(s).extensions.map(e => e.node)

  it('the personal count is no longer a dead end — it offers pē + a time word (and nothing else)', () => {
    const ids = extIds(count('ʻOku', 'nau', 'toko tolu'))
    expect(ids).toContain('count_enclitic_pe')
    expect(ids).toContain('time_word')
    // adversarial guard: a manner modifier must NOT be reachable off a count
    // (no `ʻOku nau toko tolu lahi` = "three a-lot"). count_enclitic_pe is a
    // dedicated single-word `pē` node, NOT the general `modifier` node.
    expect(ids).not.toContain('modifier')
  })

  it('enclitic pē builds (ʻOku nau toko ono pē — spec §26 ʻOku toko ono pē)', () => {
    let s = count('ʻOku', 'nau', 'toko ono')
    s = takeExtension(s, 'count_enclitic_pe')
    s = advanceInFrame(s, { tongan: 'pē' })
    expect(render(s)).toBe('ʻOku nau toko ono pē')
    // pē is recorded → it cannot repeat (no `pē pē`); a time word is still on offer
    expect(extIds(s)).not.toContain('count_enclitic_pe')
    expect(extIds(s)).toContain('time_word')
  })

  it('count + time word builds; present ʻOku gates the time word to he ʻaho ni (ʻOku nau toko tolu he ʻaho ni)', () => {
    let s = count('ʻOku', 'nau', 'toko tolu')
    s = takeExtension(s, 'time_word')
    expect(getCurrentFrameWords(s).map(w => w.tongan)).toEqual(['ʻaho ni']) // ʻOku → ʻaho ni only
    s = advanceInFrame(s, { tongan: 'ʻaho ni' })
    expect(render(s)).toBe('ʻOku nau toko tolu he ʻaho ni') // `he` added per Ch 4:89
    // time word recorded → cannot repeat; pē is still on offer
    expect(extIds(s)).not.toContain('time_word')
    expect(extIds(s)).toContain('count_enclitic_pe')
  })

  it('pē then a time word both attach, in the canonical order (ʻOku nau toko ono pē he ʻaho ni)', () => {
    let s = count('ʻOku', 'nau', 'toko ono')
    s = takeExtension(s, 'count_enclitic_pe')
    s = advanceInFrame(s, { tongan: 'pē' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaho ni' })
    expect(render(s)).toBe('ʻOku nau toko ono pē he ʻaho ni')
    // both consumed → only Finish remains (no double pē, no double time word)
    expect(extIds(s)).toEqual([])
  })

  // ADJUDICATION (P1-A2 verification): the reverse pick order is also reachable,
  // `ʻOku nau toko ono he ʻaho ni pē` (time word, then pē). This is INTENTIONALLY
  // allowed: `pē` is a freely-attaching postposed limiter (Churchward 27.25a — it
  // "eliminates other suggestions or possibilities", with no host restriction), so
  // sentence-final `pē` reading "... only today" is grammatical, not §B nonsense.
  // Suppressing only this order would require a `not_already_visited_node` guard on
  // the pē edge, which disables the extensionsTaken same-node dedup and re-enables
  // `pē pē` — so it is left reachable. Logged here so it reads as a decision.

  it('a past count takes a bare adverb time word, no he (Naʻa nau toko ua ʻaneafi)', () => {
    let s = count('Naʻa', 'nau', 'toko ua')
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    expect(render(s)).toBe('Naʻa nau toko ua ʻaneafi')
  })

  it('numeral (ʻe + cardinal) is left FINISH-only on purpose — its menu is NOT narrowed; pē + time arrive via the object auto-pop', () => {
    // Wiring native pē/time edges onto numeral.next would give numeral its own
    // non-terminator extensions, suppressing the object auto-pop and shrinking
    // the menu (the §A over-restriction). So numeral.next stays FINISH-only and
    // its continuations come from the object anchor the walker pops back to.
    const finishOnly = (grammarGraph.nodes.numeral.next || [])
      .every(e => ['FINISH_STATEMENT', 'FINISH_QUESTION'].includes(e.node))
    expect(finishOnly).toBe(true)
    let s = createWalkerState('statement', 53)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb'); s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object'); s = advanceInFrame(s, { tongan: 'mā' })
    s = takeExtension(s, 'numeral'); s = advanceInFrame(s, { tongan: 'ʻe ono' })
    const ids = extIds(s)
    expect(ids).toContain('time_word')   // menu not narrowed
    expect(ids).toContain('preposition')
    expect(ids).toContain('modifier')    // modifier word list carries pē
    s = takeExtension(s, 'modifier'); s = advanceInFrame(s, { tongan: 'pē' })
    expect(render(s)).toBe('Naʻa ku kai mā ʻe ono pē')
  })
})

// KNOWN-REMAINING (tracked as P1 in plans/Terminal-Build-Fix-Tracker.md):
// statement-path "...complement au" (e.g. ʻOku ... ki kolo au / mo Sione au)
// still leaks because postposed_pronoun is offered from the verb anchor and the
// renderer orders by insertion. Full fix needs a placement gate + rewriting the
// "Rule 1 coexistence" tests in graph-walker.test.js (lines ~492-577).
