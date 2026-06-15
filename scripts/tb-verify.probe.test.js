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
  finishCurrentFrame, getRenderedSentence, getPickerData, getFirstWordOptions,
  getCurrentOptions, PHASE,
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
  it('two modifiers still allowed on the negation path, capped at 2 (lelei lelei)', () => {
    // Deterministic build (was a bounded `reachable` BFS; P1-A4's adjunct hub
    // widened every menu, so the bushy tree no longer surfaces this exact string
    // within a 15k-state budget — same fragility that made the `muʻa koe` test
    // deterministic). Walks the negation path explicitly so the assertion is
    // independent of menu breadth. The `lelei lelei lelei` (×3) cap guard above
    // still uses the BFS and stays green.
    let s = createWalkerState('negation', 999)
    s = advanceInFrame(s, { tongan: 'Naʻe' })
    s = advanceInFrame(s, { tongan: 'ʻikai' })
    s = takeExtension(s, 'neg_connector')
    s = advanceInFrame(s, { tongan: 'te' })
    s = advanceInFrame(s, { tongan: 'u' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'modifier')
    s = advanceInFrame(s, { tongan: 'lelei' })
    s = takeExtension(s, 'modifier')
    s = advanceInFrame(s, { tongan: 'lelei' })
    expect(render(s)).toContain('lelei lelei')
    // The modifier cap fires at 2 (modifier_count_max counts modifier + modifier_ns).
    expect(getExtensionMenu(s).extensions.map(e => e.node)).not.toContain('modifier')
  })
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
    s = takeExtension(s, 'verb_ns')  // tense_marker_ns.next is now a menu (verb_ns | preposed_modifier_ns)
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

describe('P1-B4 — emphatic postposed pronoun is gated to the verb phrase', () => {
  // The statement-path leaks `… ki kolo au` / `… mo Sione au` used to slip
  // through: postposed_pronoun was offered from the verb anchor with no
  // condition, so after returning from a locative / companion sub-walk the
  // user could still append `au`, which the insertion-ordered renderer placed
  // AFTER the complement (Ch 5: the emphatic pronoun must abut the verb phrase,
  // before complements — Shumway L9 `Te u nofo au ʻi ʻapi`). P1-B4 gates the
  // edge with `no_complement_yet`.
  //
  // These are DETERMINISTIC builds, not BFS `reachable` rejects: post-P1-A4 the
  // adjunct hub widened every menu, so the bounded BFS (depth<=11, max=30k)
  // exhausts its budget long before reaching the depth-8 `… complement au`
  // states — a BFS reject would pass vacuously whether or not the leak exists.
  // The graph-walker unit tests (symptom (a)/(a)-reversed) assert the same gate
  // from the other direction. Empirically confirmed pre-fix: the menu DID offer
  // postposed_pronoun after a locative/companion; it no longer does.

  it('locative closes the emphatic slot — no `… ki kolo au` (Naʻa ku ʻalu ki kolo)', () => {
    let s = naaKuAlu()
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ki' })
    s = advanceInFrame(s, { tongan: 'kolo' })
    s = finishFrame(s) // back to the verb anchor
    const ext = getExtensionMenu(s).extensions.map(e => e.node)
    expect(ext).toContain('time_word')          // open content extensions survive
    expect(ext).toContain('mo_fixed')
    expect(ext).not.toContain('postposed_pronoun')
    expect(() => takeExtension(s, 'postposed_pronoun'))
      .toThrow(/not available in the current menu/)
  })

  it('companion closes the emphatic slot — no `… mo Sione au` (Naʻa ku ʻalu mo Sione)', () => {
    let s = addCompanion(naaKuAlu(), 'Sione')
    s = finishFrame(s) // back to the verb anchor
    const ext = getExtensionMenu(s).extensions.map(e => e.node)
    expect(ext).not.toContain('postposed_pronoun')
    expect(() => takeExtension(s, 'postposed_pronoun'))
      .toThrow(/not available in the current menu/)
  })

  it('a bare object closes the emphatic slot — the suspect bare-pronoun edge off `object` is retired (Naʻa ku kai mā)', () => {
    // Transitive emphasis uses the distinct `ʻe + pronoun` agent construction
    // after the object (`Te u fai ia ʻe au`), never a bare postposed pronoun.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'object')
    s = advanceInFrame(s, { tongan: 'mā' })
    const ext = getExtensionMenu(s).extensions.map(e => e.node)
    expect(ext).not.toContain('postposed_pronoun')
  })

  it('verb + au still builds (Naʻa ku ʻalu au)', () => {
    let s = naaKuAlu()
    expect(getExtensionMenu(s).extensions.map(e => e.node)).toContain('postposed_pronoun')
    s = takeExtension(s, 'postposed_pronoun')
    s = advanceInFrame(s, { tongan: 'au' })
    expect(render(s)).toBe('Naʻa ku ʻalu au')
  })

  it('verb + au + time word still builds, in the canonical order (Naʻa ku ʻalu au ʻaneafi — cf. Ch 5 `Naʻa mau hiva kimautolu ʻanepō`)', () => {
    let s = naaKuAlu()
    s = takeExtension(s, 'postposed_pronoun')
    s = advanceInFrame(s, { tongan: 'au' })
    s = takeExtension(s, 'time_word') // postposed_pronoun.next offers a trailing time word
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    expect(render(s)).toBe('Naʻa ku ʻalu au ʻaneafi')
  })

  it('a manner modifier does NOT close the emphatic slot — `kai lelei au` still builds (the verb phrase includes manner)', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'kai' })
    s = takeExtension(s, 'modifier')
    s = advanceInFrame(s, { tongan: 'lelei' })
    expect(getExtensionMenu(s).extensions.map(e => e.node)).toContain('postposed_pronoun')
    s = takeExtension(s, 'postposed_pronoun')
    s = advanceInFrame(s, { tongan: 'au' })
    expect(render(s)).toBe('Naʻa ku kai lelei au')
  })

  // The command path uses a SEPARATE emphatic node `emphatic_pronoun` (koe),
  // distinct from the statement `postposed_pronoun` (au). P1-B4 gates that edge
  // with the same `no_complement_yet` condition so the addressee-emphatic also
  // abuts the verb (Ch 5: `ʻAlu koe!`, `Nofo koe!`). Surfaced by the adversarial
  // review — the time_word / benefactive auto-pop back to the command_verb anchor
  // used to re-offer `koe` after a complement (`Kai ʻapongipongi koe`).

  it('command emphatic is gated too — a time word closes the slot (no `Kai ʻapongipongi koe`)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻapongipongi' }) // auto-pops back to command_verb
    const ext = getExtensionMenu(s).extensions.map(e => e.node)
    expect(ext).not.toContain('emphatic_pronoun')
    expect(() => takeExtension(s, 'emphatic_pronoun'))
      .toThrow(/not available in the current menu/)
  })

  it('command emphatic is gated too — a beneficiary closes the slot (no `Kai maʻa Sione koe`)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    s = takeExtension(s, 'benefactive_preposition_ma')
    s = advanceInFrame(s, { tongan: 'maʻa' })
    s = advanceInFrame(s, { tongan: 'Sione' }) // auto-pops back to command_verb
    expect(getExtensionMenu(s).extensions.map(e => e.node)).not.toContain('emphatic_pronoun')
  })

  it('command + emphatic still builds adjacent to the verb (Kai koe), and a time word may follow it (Kai koe ʻapongipongi)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    expect(getExtensionMenu(s).extensions.map(e => e.node)).toContain('emphatic_pronoun')
    s = takeExtension(s, 'emphatic_pronoun')
    s = advanceInFrame(s, { tongan: 'koe' }) // emphatic_pronoun.next = FINISH only → auto-pops
    expect(render(s)).toBe('Kai koe')
    s = takeExtension(s, 'time_word')
    s = advanceInFrame(s, { tongan: 'ʻapongipongi' })
    expect(render(s)).toBe('Kai koe ʻapongipongi') // emphatic precedes the time word — correct order
  })

  it('command + please + you (Kai muʻa koe) is unaffected — the polite particle is not a complement', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    s = takeExtension(s, 'polite_particle')
    s = advanceInFrame(s, { tongan: 'muʻa' }) // auto-pops back to command_verb
    expect(getExtensionMenu(s).extensions.map(e => e.node)).toContain('emphatic_pronoun')
    s = takeExtension(s, 'emphatic_pronoun')
    s = advanceInFrame(s, { tongan: 'koe' })
    expect(render(s)).toBe('Kai muʻa koe')
  })

  // NOTE (documented, not tested here): the gate scans the whole flat step
  // history, so an emphatic in a coordinated 2nd clause is suppressed once the
  // FIRST clause has a complement. This is an accepted trade-off matching the
  // existing sentence-global conditions (modifier_count_max / clause_count_max);
  // see the code comment in graph-walker.js and the tracker follow-ups. Not
  // pinned with a test — the tense-drop second-clause walk is too coupled to the
  // pea-clause internals to assert robustly here.
})

// ===========================================================================
// P2-3 / P2-4 structural locks (added 2026-05-30)
//
// P2-3 pins the multi-walker per-walker validation fix; P2-4 pins the
// intentional terminal-idiom tagging. Both use only the public multi-walker
// API + grammar-graph JSON + the local firstWord() helper above, so they stay
// valid as the menu data evolves.
// ===========================================================================

// The five linguistically-correct single-pick completions (Terminal-Build-
// Analysis A5/A6). Each is a genuine terminal idiom: tagged terminal_idiom:true
// and its next[] contains ONLY FINISH_* terminators.
const TERMINAL_IDIOM_NODE_IDS = [
  'subject_ko',
  'equational_subject',
  'predicative_poss_subject',
  'exclamatory_ko_ka_head',
  'exclamatory_me_a_head',
]

describe('P2-4 — A5/A6 nodes are intentional terminal idioms', () => {
  for (const nodeId of TERMINAL_IDIOM_NODE_IDS) {
    it(nodeId + ' is tagged terminal_idiom:true', () => {
      const node = grammarGraph.nodes[nodeId]
      expect(node).toBeTruthy()
      expect(node.terminal_idiom).toBe(true)
    })

    it(nodeId + '.next contains ONLY FINISH_* terminators (no content extension)', () => {
      const node = grammarGraph.nodes[nodeId]
      const targets = (node.next || []).map(e =>
        typeof e === 'string' ? e : (e.node || e.to || e.target)
      )
      // Non-empty (still FINISHable) and every edge a terminator — a genuine
      // one-pick completion, not a node that dead-ends or leaks a continuation.
      expect(targets.length).toBeGreaterThan(0)
      for (const t of targets) {
        expect(String(t).startsWith('FINISH_')).toBe(true)
      }
    })
  }

  it('terminal_idiom nodes are NOT route_to_hub (hub routing skips them)', () => {
    // Hub must never widen a terminal idiom: none carry route_to_hub, and
    // getHubExtensions bails early on terminal_idiom anchors, so even with
    // meta.useAdjunctHub on the idiom stays a single-pick completion.
    expect(grammarGraph.meta && grammarGraph.meta.useAdjunctHub).toBe(true)
    for (const nodeId of TERMINAL_IDIOM_NODE_IDS) {
      const node = grammarGraph.nodes[nodeId]
      expect(node.route_to_hub === true).toBe(false)
    }
  })

  it('an exclamatory idiom stays terminal at runtime: completable menu has NO content extension', () => {
    // Build through the multi-walker and confirm that once the exclamatory idiom
    // is completable its menu offers only a finish — never a hub adjunct — even
    // though meta.useAdjunctHub is on. Drives the real getHubExtensions
    // terminal_idiom guard at runtime, not just in data.
    const exH = grammarGraph.nodes['exclamatory_ko_ka_head']
    const firstTongan = (exH.words && exH.words[0] && exH.words[0].tongan) || null
    const fwi = firstTongan ? firstWord(firstTongan) : null
    if (!fwi) return // head word isn't a standalone first word; data locks above suffice
    let state
    try {
      state = pickFirstWord(createMultiWalker(53), fwi)
    } catch {
      return
    }
    let guard = 0
    while (guard++ < 12) {
      const picker = getPickerData(state)
      if (!picker.groups.length) break
      const hasFinish = picker.groups.some(g =>
        g.items.some(it => it.type === 'terminator')
      )
      if (hasFinish) {
        // Decisive check: once completable, a terminal idiom offers zero
        // content extensions ('+ ...' items).
        const contentExtensions = picker.groups.flatMap(g =>
          g.items.filter(it => it.type === 'extension')
        )
        expect(contentExtensions.length).toBe(0)
        return
      }
      const firstWordItem = picker.groups[0].items.find(it => it.type === 'word')
      if (!firstWordItem) break
      try {
        state = pickWord(state, firstWordItem.word)
      } catch {
        break
      }
    }
  })
})

describe('P2-3 — multi-walker per-walker validation (no dead union options)', () => {
  it('after a multi-walker first word (ʻOku), every offered extension/terminator is takeable by some surviving walker', () => {
    // ʻOku spawns multiple entry-point walkers (statement / negation /
    // existential / ...). Before P2-3, collectExtensionOptions UNIONed every
    // walker's getExtensionMenu, so an option offered by one walker but
    // un-takeable by the walker the user is on could surface — and picking it
    // would throw. After the fix the menu only lists options at least one
    // surviving walker truly accepts (re-validated via takeExtension), so
    // picking any of them must succeed without throwing.
    const fwi = firstWord('ʻOku')
    expect(fwi).toBeTruthy()
    let state = pickFirstWord(createMultiWalker(53), fwi)
    expect(state.walkers.length).toBeGreaterThan(0)

    // Drive to a continuation menu: pick a pronoun, then a verb (mirrors UI).
    const p1 = getPickerData(state)
    const pron = p1.groups.flatMap(g => g.items).find(it => it.type === 'word')
    if (pron) state = pickWord(state, pron.word)
    const p2 = getPickerData(state)
    const verb = p2.groups.flatMap(g => g.items).find(it => it.type === 'word')
    if (verb) {
      try { state = pickWord(state, verb.word) } catch { /* surviving walkers remain */ }
    }

    // Every surfaced extension must be pickable and leave >=1 surviving walker
    // (the P2-3 invariant: no no-surviving-walker dead option is ever offered).
    const opts = getCurrentOptions(state)
    for (const id of (opts.extensions || []).map(e => e.id)) {
      const after = pickExtension(state, id)
      expect(after.walkers.length).toBeGreaterThan(0)
    }
    // Every surfaced terminator must be finishable by some walker.
    for (const id of (opts.terminators || []).map(t => t.id)) {
      const finished = pickTerminator(state, id)
      expect(finished.walkers.length).toBe(1)
    }
  })

  it('ʻOku statement still reaches a real continuation (per-walker validation does not over-prune)', () => {
    // Guard the other direction: the per-walker check must NOT strip a valid
    // option. A canonical ʻOku + pronoun + verb must remain buildable, i.e. the
    // picker still offers at least one group with items (words, extensions, or a
    // finish). Asserting on getPickerData (the UI source of truth) rather than
    // getCurrentOptions keeps the check robust across phases — after the verb
    // the walkers may be in a branching word menu, an extension menu, or mixed,
    // all of which are legitimate live continuations. The bug we guard against
    // is the engine pruning the menu to EMPTY (a dead build).
    const fwi = firstWord('ʻOku')
    expect(fwi).toBeTruthy()
    let state = pickFirstWord(createMultiWalker(53), fwi)
    const p1 = getPickerData(state)
    const pron = p1.groups.flatMap(g => g.items).find(it => it.type === 'word')
    expect(pron).toBeTruthy()
    state = pickWord(state, pron.word)
    const p2 = getPickerData(state)
    const verb = p2.groups.flatMap(g => g.items).find(it => it.type === 'word')
    expect(verb).toBeTruthy()
    state = pickWord(state, verb.word)
    // The menu must remain non-empty — at least one group with at least one item.
    const picker = getPickerData(state)
    const totalItems = picker.groups.reduce((n, g) => n + g.items.length, 0)
    expect(totalItems).toBeGreaterThan(0)
  })
})

// ===========================================================================
// P2-2 — one coherent adjunct-repetition model (role tags + seenContentKeys)
// (added 2026-05-30)
//
// deriveAdjunctRoles is the single pure view over getFlatSteps. getAvailableWords
// reads it for content de-dup (replacing the no_repeat_at_node /
// no_duplicate_prep_complement word_filters, now removed from grammar-graph.json);
// validateOption reads it for the per-clause role budgets (manner <=2, locative
// <=2, companion <=4). Emphatic "one per clause" stays on extensionsTaken (a
// frame-stack property the flat-steps view can't reproduce). The locative budget
// also makes the Ch 46 dual-preposition cap of 2 hold at EVERY anchor — the old
// node_visit_count_max:2 only gated the prep_phrase re-entry edge, leaking a 3rd
// preposition via a different anchor.
// ===========================================================================
describe('P2-2 — role-budget + seenContentKeys model', () => {
  it('content de-dup (companion): a used name is filtered from the next mo X slot', () => {
    let s = addCompanion(naaKuAlu(), 'Sione')
    s = takeExtension(s, 'mo_fixed')
    s = advanceInFrame(s, { tongan: 'mo' })
    const names = getCurrentFrameWords(s).map(w => w.tongan)
    expect(names).toContain('Mele')      // a distinct companion is still offered
    expect(names).not.toContain('Sione') // the used name is de-duped (no `mo Sione mo Sione`)
  })

  it('content de-dup (locative): the SAME (preposition, complement) pair cannot repeat; a different complement can', () => {
    let s = naaKuAlu()
    s = takeExtension(s, 'preposition')
    s = advanceInFrame(s, { tongan: 'ʻi' })
    s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = takeExtension(s, 'preposition') // dual-prep re-entry (Ch 46)
    s = advanceInFrame(s, { tongan: 'ʻi' })
    const places = getCurrentFrameWords(s).map(w => w.tongan)
    expect(places).not.toContain('ʻapi') // ʻi ʻapi already used → no `ʻi ʻapi ʻi ʻapi`
    expect(places).toContain('kolo')     // ʻi kolo is a new pair → still offered
  })

  it('manner budget: at most 2 modifiers in a clause (the role budget mirrors modifier_count_max)', () => {
    let s = naaKuAlu()
    s = takeExtension(s, 'modifier'); s = advanceInFrame(s, { tongan: 'lelei' })
    s = takeExtension(s, 'modifier'); s = advanceInFrame(s, { tongan: 'lahi' })
    expect(getExtensionMenu(s).extensions.map(e => e.node)).not.toContain('modifier')
  })

  it('locative budget: the Ch 46 cap of 2 holds at EVERY anchor — no 3rd preposition, two-prep phrase preserved', () => {
    let s = naaKuAlu()
    s = takeExtension(s, 'preposition'); s = advanceInFrame(s, { tongan: 'ki' }); s = advanceInFrame(s, { tongan: 'kolo' })
    s = takeExtension(s, 'preposition'); s = advanceInFrame(s, { tongan: 'ʻi' }); s = advanceInFrame(s, { tongan: 'ʻapi' })
    s = finishFrame(s) // back toward the verb anchor
    // Before P2-2 a 3rd preposition leaked in here (node_visit_count_max:2 only
    // gated the prep_phrase re-entry edge, not the verb/modifier/object anchors).
    expect(getExtensionMenu(s).extensions.map(e => e.node)).not.toContain('preposition')
    // ...but the legitimate two-preposition dual phrase still builds.
    expect(render(s)).toContain('ki kolo')
    expect(render(s)).toContain('ʻi ʻapi')
  })

  it('companion budget: the chain still stops after 4 (role budget mirrors node_visit_count_max:4)', () => {
    let s = naaKuAlu()
    for (const n of ['Sione', 'Mele', 'Pita', 'Ana']) s = addCompanion(s, n)
    expect(getExtensionMenu(s).extensions.map(e => e.node)).not.toContain('mo_fixed')
  })

  it('budgets are clause-scoped: a coordinated second clause opens its own fresh modifier', () => {
    // Regression guard for clause-scoping: clause 1 maxing its modifiers must not
    // starve clause 2 (a sentence-global budget would). Build `Naʻa ku ʻalu lelei
    // lahi pea u nofo ...` and confirm clause 2's verb still offers a modifier.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' }); s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb'); s = advanceInFrame(s, { tongan: 'ʻalu' })
    s = takeExtension(s, 'modifier'); s = advanceInFrame(s, { tongan: 'lelei' })
    s = takeExtension(s, 'modifier'); s = advanceInFrame(s, { tongan: 'lahi' }) // clause 1 maxed at 2
    s = takeExtension(s, 'clause_connector_pea'); s = advanceInFrame(s, { tongan: 'pea' })
    s = takeExtension(s, 'pronoun'); s = advanceInFrame(s, { tongan: 'ku' })      // pea ku
    s = takeExtension(s, 'verb'); s = advanceInFrame(s, { tongan: 'nofo' })       // ... nofo
    // clause 2's verb anchor must still offer a modifier (manner budget reset per clause)
    expect(getExtensionMenu(s).extensions.map(e => e.node)).toContain('modifier')
    s = takeExtension(s, 'modifier'); s = advanceInFrame(s, { tongan: 'lelei' })
    expect(render(s)).toContain('nofo lelei')
  })
})

// ===========================================================================
// P1-B4 follow-up #1 — VP-internal adjunct ordering after the emphatic
// (added 2026-05-30)
//
// The emphatic postposed pronoun is the LAST element of the verb phrase
// (book/Chapter-05.md:198 "the postposed pronoun appears right after the verb or
// verb phrase"; grammar-spec §24a "ʻOku ʻalu au ai pe — NOT attested;
// ungrammatical"). Once it is placed, a verb-phrase-internal adjunct (manner
// modifier, directional, post-verbal aspect, comparative ange, superlative taha)
// must NOT be re-offered after it — those belong before the emphatic
// (`nofo lelei au`, never `nofo au lelei`). A time word and the clause connectors
// MAY still follow it. Enforced by the `no_emphatic_yet` edge condition gating
// the VP-internal adjunct edges (and array-composed with the existing
// modifier_count_max / verb_has_tag gates where present). All five elements were
// confirmed gating_safe=true (high confidence) by a 5-element adversarial
// book/Churchward/Shumway/spec verification.
// ===========================================================================
describe('P1-B4 follow-up #1 — VP-internal adjuncts cannot follow the emphatic pronoun', () => {
  const extIds = (s) => getExtensionMenu(s).extensions.map(e => e.node)

  it('statement: a manner modifier is NOT re-offered after the emphatic — `nofo au lelei` is unreachable', () => {
    // Naʻa ku nofo au — at the emphatic (lingering, route_to_hub) anchor the hub
    // used to offer `modifier` (the `nofo au lelei` leak); no_emphatic_yet gates it.
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    s = takeExtension(s, 'postposed_pronoun')
    s = advanceInFrame(s, { tongan: 'au' })
    expect(extIds(s)).not.toContain('modifier')
    expect(() => takeExtension(s, 'modifier')).toThrow(/not available in the current menu/)
    // finishing back to the verb anchor must not re-offer the manner modifier either
    const back = finishFrame(s)
    expect(extIds(back)).not.toContain('modifier')
  })

  it('statement: a manner modifier still PRECEDES the emphatic — `nofo lelei au` builds', () => {
    let s = createWalkerState('statement', 999)
    s = advanceInFrame(s, { tongan: 'Naʻa' })
    s = advanceInFrame(s, { tongan: 'ku' })
    s = takeExtension(s, 'verb')
    s = advanceInFrame(s, { tongan: 'nofo' })
    s = takeExtension(s, 'modifier')          // no emphatic yet → manner offered
    s = advanceInFrame(s, { tongan: 'lelei' })
    expect(extIds(s)).toContain('postposed_pronoun')
    s = takeExtension(s, 'postposed_pronoun')
    s = advanceInFrame(s, { tongan: 'au' })
    expect(render(s)).toBe('Naʻa ku nofo lelei au')
  })

  it('statement: a time word MAY still follow the emphatic — `Naʻa ku ʻalu au ʻaneafi` builds (NOT gated)', () => {
    let s = naaKuAlu()
    s = takeExtension(s, 'postposed_pronoun')
    s = advanceInFrame(s, { tongan: 'au' })
    s = takeExtension(s, 'time_word')         // time_word carries no no_emphatic_yet gate
    s = advanceInFrame(s, { tongan: 'ʻaneafi' })
    expect(render(s)).toBe('Naʻa ku ʻalu au ʻaneafi')
  })

  it('command: a manner modifier is available BEFORE the emphatic but NOT after it (no `Kai koe lelei`)', () => {
    // The command emphatic is `koe` (emphatic_pronoun) — the analog of the
    // statement `au` in the prompt's `Kai lelei au`. The manner modifier comes
    // via the route_to_hub command_verb anchor; gated off once `koe` is placed.
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    expect(extIds(s)).toContain('modifier')        // manner available pre-emphatic
    s = takeExtension(s, 'emphatic_pronoun')
    s = advanceInFrame(s, { tongan: 'koe' })       // emphatic_pronoun.next = FINISH → auto-pops to command_verb
    expect(extIds(s)).not.toContain('modifier')    // gated after the emphatic
    expect(() => takeExtension(s, 'modifier')).toThrow(/not available in the current menu/)
  })

  it('command: a manner modifier still PRECEDES the emphatic — `Kai lelei koe` builds (the prompt’s `Kai lelei au`)', () => {
    let s = createWalkerState('command', 999)
    s = advanceInFrame(s, { tongan: 'Kai' })
    s = takeExtension(s, 'modifier')               // via the route_to_hub command_verb anchor
    s = advanceInFrame(s, { tongan: 'lelei' })
    s = finishFrame(s)                             // back to command_verb for the addressee emphatic
    expect(extIds(s)).toContain('emphatic_pronoun')
    s = takeExtension(s, 'emphatic_pronoun')
    s = advanceInFrame(s, { tongan: 'koe' })
    expect(render(s)).toBe('Kai lelei koe')
  })

  it('data lock: the VP-internal adjunct edges carry the no_emphatic_yet gate; time_word does not', () => {
    const gated = (cond) => Array.isArray(cond)
      ? cond.some(c => c && c.type === 'no_emphatic_yet')
      : !!(cond && cond.type === 'no_emphatic_yet')
    const findEdge = (nodeId, target) =>
      (grammarGraph.nodes[nodeId].next || []).find(e => e.node === target)
    // verb.next: manner modifier + directional + post-verbal aspect + comparative/superlative
    for (const target of ['modifier', 'directional', 'aspect_marker_post', 'aspect_marker_post_frequency', 'comparative_ange', 'superlative_taha']) {
      expect(gated(findEdge('verb', target).condition), `verb.next ${target} must be no_emphatic_yet-gated`).toBe(true)
    }
    // the manner modifier self-loop keeps its cap AND gains the gate (array condition)
    expect(gated(findEdge('modifier', 'modifier').condition), 'modifier self-loop').toBe(true)
    // the adjuncts hub: manner modifier + aspect frequency
    for (const target of ['modifier', 'aspect_marker_post_frequency']) {
      expect(gated(findEdge('adjuncts_hub', target).condition), `adjuncts_hub ${target} must be no_emphatic_yet-gated`).toBe(true)
    }
    // a time word is NOT gated — it may legitimately follow the emphatic
    expect(gated(findEdge('verb', 'time_word').condition), 'verb.next time_word stays ungated').toBe(false)
  })
})
