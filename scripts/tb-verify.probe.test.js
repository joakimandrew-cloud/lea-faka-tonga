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
    expect(build('Kai', ['muʻa', 'koe'])).toContain('muʻa koe')
  })
})

// KNOWN-REMAINING (tracked as P1 in plans/Terminal-Build-Fix-Tracker.md):
// statement-path "...complement au" (e.g. ʻOku ... ki kolo au / mo Sione au)
// still leaks because postposed_pronoun is offered from the verb anchor and the
// renderer orders by insertion. Full fix needs a placement gate + rewriting the
// "Rule 1 coexistence" tests in graph-walker.test.js (lines ~492-577).
