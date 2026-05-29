/**
 * tb-repro.probe.test.js — reproduce specific build paths step-by-step to see
 * exactly which node/edge re-offers a repeatable option. Greedy walker: at each
 * state, prefer an item whose label matches a wanted token; else stop.
 */
import { describe, it, expect } from 'vitest'
import {
  createMultiWalker, pickFirstWord, pickWord, pickExtension, pickTerminator,
  finishCurrentFrame, getRenderedSentence, getPickerData, getWalkerCount,
  getEntryPointCategory, getFirstWordOptions, PHASE,
} from '../src/engine/multi-walker.js'

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
const path = (s) => getRenderedSentence(s).map(x => x.nodeId).join(' > ')

// Try to repeatedly add a token `tok` as many times as possible from a start.
function maxRepeat(startState, tok, limit = 20) {
  let s = startState, n = 0
  const log = []
  for (let i = 0; i < limit; i++) {
    const groups = expand(getPickerData(s).groups)
    // find an item (word or extension) whose display/word matches tok
    let chosen = null
    for (const g of groups) for (const it of g.items) {
      const lab = it.type === 'word' ? it.word.tongan : it.display
      if (lab && lab.toLowerCase().includes(tok.toLowerCase())) { chosen = { g, it }; break }
      // also allow taking the extension that leads to the token
    }
    if (!chosen) {
      // maybe need to take an extension first (e.g. + with someone, + modifier)
      break
    }
    let next
    try { next = confirm(s, chosen.it) } catch { break }
    s = next; n++
    log.push(`${chosen.g.label} :: now "> ${rend(s)}"`)
  }
  return { n, final: rend(s), log }
}

// Gated: reproduces specific over-permission bugs for the analysis in
// plans/Terminal-Build-Analysis.md. Opt in with TB_PROBE=1.
describe.skipIf(process.env.TB_PROBE !== '1')('tb repro', () => {
  it('modifier lelei repetition', () => {
    // Build "Naʻe fiefia" then hammer lelei
    const fw = getFirstWordOptions(createMultiWalker(53))
    let naeItem = null
    for (const g of fw.groups) for (const w of g.words) if (w.word.tongan === 'Naʻe') naeItem = w
    expect(naeItem).toBeTruthy()
    let s = pickFirstWord(createMultiWalker(53), naeItem)
    // pick a pronoun, then a stative verb fiefia. Greedy: pick first available word for required slots.
    // Walk: tense->pronoun(required). pick 'ne' or first.
    function pickWanted(state, wants) {
      const groups = expand(getPickerData(state).groups)
      for (const want of wants) for (const g of groups) for (const it of g.items) {
        const lab = it.type === 'word' ? it.word.tongan : it.display
        if (lab && lab.toLowerCase() === want.toLowerCase()) return confirm(state, it)
      }
      // fallback: first word item
      for (const g of groups) for (const it of g.items) if (it.type === 'word') return confirm(state, it)
      return state
    }
    s = pickWanted(s, ['ne', 'ku'])           // pronoun
    s = pickWanted(s, ['fiefia'])             // stative verb
    console.error('\n[modifier] base: "> ' + rend(s) + '"  path: ' + path(s))
    const r = maxRepeat(s, 'lelei', 15)
    console.error('[modifier] lelei added ' + r.n + ' times → "> ' + r.final + '"')
    console.error('[modifier] path: ' + path(/* recompute */ s))
    r.log.forEach(l => console.error('   ' + l))
    expect(r.n).toBeGreaterThanOrEqual(0)
  })

  it('companion mo Sione repetition', () => {
    const fw = getFirstWordOptions(createMultiWalker(53))
    let oku = null
    for (const g of fw.groups) for (const w of g.words) if (w.word.tongan === 'ʻOku') oku = w
    let s = pickFirstWord(createMultiWalker(53), oku)
    function pickWanted(state, wants) {
      const groups = expand(getPickerData(state).groups)
      for (const want of wants) for (const g of groups) for (const it of g.items) {
        const lab = it.type === 'word' ? it.word.tongan : it.display
        if (lab && lab.toLowerCase() === want.toLowerCase()) return confirm(state, it)
      }
      for (const g of groups) for (const it of g.items) if (it.type === 'word') return confirm(state, it)
      return state
    }
    s = pickWanted(s, ['ku', 'ne'])  // pronoun
    s = pickWanted(s, ['kai', 'ʻalu'])  // verb
    console.error('\n[companion] base: "> ' + rend(s) + '"')
    // now repeatedly: take "+ with" extension then pick Sione
    let n = 0
    for (let i = 0; i < 12; i++) {
      let groups = expand(getPickerData(s).groups)
      // find a + with / companion extension
      let withItem = null
      for (const g of groups) for (const it of g.items)
        if (it.type === 'extension' && /with/i.test(it.display)) withItem = it
      if (withItem) { try { s = confirm(s, withItem) } catch { break } }
      // now pick Sione (or first word) in companion slot
      groups = expand(getPickerData(s).groups)
      let picked = null
      for (const g of groups) for (const it of g.items)
        if (it.type === 'word' && /sione|mele|ia/i.test(it.word.tongan)) { picked = it; break }
      if (!picked) for (const g of groups) for (const it of g.items) if (it.type === 'word') { picked = it; break }
      if (!picked) break
      try { s = confirm(s, picked) } catch { break }
      n++
      console.error('   companion #' + n + ': "> ' + rend(s) + '"  path: ' + path(s))
    }
    console.error('[companion] total companions added: ' + n)
    expect(n).toBeGreaterThanOrEqual(0)
  })

  it('modifier_ns uncapped repetition (noun-subject path)', () => {
    // Find a first word that opens the noun_subject entry and build until we
    // reach a verb_ns, then hammer a modifier and count how many stick.
    const fw = getFirstWordOptions(createMultiWalker(53))
    const seeds = []
    for (const g of fw.groups) for (const w of g.words) seeds.push(w)
    // Greedy DFS to find a state on the noun-subject path with a repeatable modifier.
    function tryBuild(item) {
      let s
      try { s = pickFirstWord(createMultiWalker(53), item) } catch { return }
      for (let step = 0; step < 6; step++) {
        if (s.phase === PHASE.FINISHED) return
        const groups = expand(getPickerData(s).groups)
        // prefer required word slots; pick first word
        let picked = null
        for (const g of groups) for (const it of g.items) if (it.type === 'word') { picked = it; break }
        if (!picked) {
          // take "+ verb or adjective" style extension if present
          for (const g of groups) for (const it of g.items) if (it.type === 'extension' && /verb|adject/i.test(it.display)) { picked = it; break }
        }
        if (!picked) break
        try { s = confirm(s, picked) } catch { break }
        if (path(s).includes('verb_ns')) {
          const r = maxRepeat(s, 'lelei', 12)
          if (r.n >= 1) { console.error(`\n[modifier_ns] via "${item.word.tongan}" base "> ${rend(s)}" → lelei ×${r.n}: "> ${r.final}"  path: ${path(/*after*/ s)}`); return r.n }
        }
      }
    }
    let worst = 0
    for (const item of seeds) { const n = tryBuild(item); if (n) worst = Math.max(worst, n) }
    console.error('[modifier_ns] worst repetition observed: ' + worst)
    expect(worst).toBeGreaterThanOrEqual(0)
  })

  it('dead ends: experiencer / predicative possessive / toko', () => {
    function build(firstTongan, wants) {
      const fw = getFirstWordOptions(createMultiWalker(53))
      let item = null
      for (const g of fw.groups) for (const w of g.words) if (w.word.tongan === firstTongan) item = w
      if (!item) { console.error('  (no first word ' + firstTongan + ')'); return }
      let s = pickFirstWord(createMultiWalker(53), item)
      for (const want of wants) {
        const groups = expand(getPickerData(s).groups)
        let picked = null
        for (const g of groups) for (const it of g.items) {
          const lab = it.type === 'word' ? it.word.tongan : it.display
          if (lab && lab.toLowerCase().includes(want.toLowerCase())) { picked = it; break }
        }
        if (!picked) { console.error('  could not find "' + want + '" after "> ' + rend(s) + '"'); break }
        try { s = confirm(s, picked) } catch (e) { console.error('  pick threw: ' + e.message); break }
      }
      const groups = expand(getPickerData(s).groups)
      console.error('  "> ' + rend(s) + '"  phase=' + s.phase + '  walkers=' + getWalkerCount(s)
        + '  groups=[' + groups.map(g => g.label + '(' + g.items.length + ')').join(', ') + ']')
    }
    console.error('\n[deadend probes]')
    build('ʻOku', ['mahino', 'kiate'])           // experiencer "it is clear to..."
    build('ʻOku', ['ʻaʻaku'])                    // predicative possessive "is mine"
    build('Naʻa', ['ku', 'toko', 'taha'])        // toko counting
    expect(true).toBe(true)
  })
})
