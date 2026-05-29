/**
 * tb-reachability.probe.test.js — empirical option-space probe for
 * /terminal-build. Runs under Vitest (Vite resolves the engine's JSON
 * imports). NOT a real test: bounded BFS over reachable builder states,
 * writes a JSON report + summary.
 *
 *   TB_CHAPTER=53 TB_PERSEED=6000 TB_DEPTH=16 TB_OUT=/tmp/tb-report.json \
 *     npx vitest run scripts/tb-reachability.probe.test.js
 *
 * Drives the engine the way TerminalBuilder.jsx does (getPickerData →
 * expandAddMoreGroup → confirm one item). To cover the WHOLE grammar fairly
 * (the Statement tree alone is combinatorially huge), it seeds a separate
 * bounded BFS from every first word. It segments states by phase so a forced
 * required-slot ("you must pick a pronoun now") is not confused with a
 * continuation menu ("what can I add next") — the latter is where the user's
 * "only limited parts of speech offered" complaint lives.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import {
  createMultiWalker, pickFirstWord, pickWord, pickExtension, pickTerminator,
  finishCurrentFrame, getRenderedSentence, getPickerData, getWalkerCount,
  getEntryPointCategory, getFirstWordOptions, PHASE,
} from '../src/engine/multi-walker.js'

const CHAPTER = Number(process.env.TB_CHAPTER || '53')
const PER_SEED = Number(process.env.TB_PERSEED || '6000')   // BFS state budget per first word
const MAX_DEPTH = Number(process.env.TB_DEPTH || '16')
const OUT = process.env.TB_OUT || '/tmp/tb-report.json'

function expandAddMoreGroup(groups) {
  const result = []
  for (const group of groups) {
    const hasExtensions = group.items.some(it => it.type === 'extension')
    if (!hasExtensions) { result.push(group); continue }
    const terminators = group.items.filter(it => it.type === 'terminator')
    const extensions = group.items.filter(it => it.type === 'extension')
    if (terminators.length > 0) result.push({ label: 'Finish', items: terminators })
    for (const ext of extensions) {
      const tabLabel = ext.display.replace(/^\+\s*/, '')
      result.push({ label: tabLabel, items: [{ type: 'extension', id: ext.id, display: ext.display }] })
    }
  }
  return result
}
const displayGroupsFor = (state) => expandAddMoreGroup(getPickerData(state).groups)

function confirm(state, item) {
  if (item.type === 'first_word') return pickFirstWord(state, item.item)
  if (item.type === 'word') return pickWord(state, item.word)
  if (item.type === 'extension') return pickExtension(state, item.id)
  if (item.type === 'terminator') return pickTerminator(state, item.id)
  if (item.type === 'finish_frame') return finishCurrentFrame(state)
  throw new Error('unknown item type ' + item.type)
}
function wordSig(w) {
  return JSON.stringify({ t: (w.tags || []).slice().sort(), cp: w.complement_prep || null,
    nc: w.noun_class || null, fam: w.family || null, subj: w.subject || null })
}
function expansionItems(groups) {
  const items = []; const seenWordSig = new Set()
  for (const g of groups) for (const it of g.items) {
    if (it.type === 'word') {
      const key = g.label + '|' + wordSig(it.word)
      if (seenWordSig.has(key)) continue
      seenWordSig.add(key); items.push({ group: g.label, item: it })
    } else items.push({ group: g.label, item: it })
  }
  return items
}
function stateKey(state, groups) {
  const path = getRenderedSentence(state).map(s => s.nodeId).join('>')
  const labels = groups.map(g => g.label).sort().join(',')
  return path + '||' + labels
}
const isContentGroup = (l) => l !== 'Finish' && l !== 'Done'
// Phases where the engine is asking the student to ADD something optional
// (a real menu), vs forcing a required slot.
const MENU_PHASES = new Set([PHASE.PICKING_EXTENSION_OR_FINISH, PHASE.MIXED])

const report = {
  meta: { chapter: CHAPTER, perSeed: PER_SEED, maxDepth: MAX_DEPTH },
  totals: { seeds: 0, statesVisited: 0, finished: 0, menuStates: 0, slotStates: 0,
    menuDeadEnds: 0, menuThin: 0, cappedSeeds: 0 },
  groupReach: {},            // group label -> #states where offered
  menuBreadthHist: {},       // #content groups in a MENU state -> count
  thinMenus: [],             // menu states with <=1 content POS (sampled)
  deepestByEntry: {},        // entryCat -> {depth, rendered}
  perEntry: {},              // entryCat -> {menuStates, thin, deadEnds, finished}
  firstWordCoverage: [],     // per seed: {word, cat, states, capped, maxDepth, finishedReached}
  notes: [],
}

function tallyState(state, depth, trail) {
  const groups = displayGroupsFor(state)
  const rendered = getRenderedSentence(state).map(s => s.renderedTongan).join(' ')
  const walkerCount = getWalkerCount(state)
  const content = groups.filter(g => isContentGroup(g.label))
  const hasFinish = groups.some(g => g.label === 'Finish')
  const entryCat = getEntryPointCategory(state) || '(start)'
  const isMenu = MENU_PHASES.has(state.phase)

  for (const g of groups) report.groupReach[g.label] = (report.groupReach[g.label] || 0) + 1

  const pe = report.perEntry[entryCat] || { menuStates: 0, thin: 0, deadEnds: 0, finished: 0 }
  report.perEntry[entryCat] = pe

  const de = report.deepestByEntry[entryCat]
  if (!de || depth > de.depth) report.deepestByEntry[entryCat] = { depth, rendered }

  if (isMenu) {
    report.totals.menuStates++; pe.menuStates++
    report.menuBreadthHist[content.length] = (report.menuBreadthHist[content.length] || 0) + 1
    if (content.length === 0 && hasFinish) {
      report.totals.menuDeadEnds++; pe.deadEnds++
    }
    if (content.length <= 1) {
      report.totals.menuThin++; pe.thin++
      // Balance the sample per entry category so rare entries (Exclamatory,
      // Ko, Questions) aren't crowded out by Commands/Statements.
      report._thinByEntry = report._thinByEntry || {}
      const bucket = (report._thinByEntry[entryCat] = report._thinByEntry[entryCat] || [])
      if (bucket.length < 60)
        bucket.push({ depth, entryCat, rendered, walkerCount,
          content: content.map(g => `${g.label}(${g.items.length})`), hasFinish, trail: trail.slice() })
    }
  } else {
    report.totals.slotStates++
  }
  return groups
}

// BFS from a single first-word pick, bounded by PER_SEED states.
function bfsSeed(firstWordItem) {
  const seedInfo = { word: firstWordItem.word.tongan, cat: firstWordItem.category || '?',
    states: 0, capped: false, maxDepth: 0, finishedReached: false }
  const seen = new Set()
  let start
  try { start = pickFirstWord(createMultiWalker(CHAPTER), firstWordItem) }
  catch { seedInfo.error = 'pickFirstWord threw'; report.firstWordCoverage.push(seedInfo); return }

  const queue = [{ state: start, depth: 1, trail: [`first:${firstWordItem.word.tongan}`] }]
  while (queue.length) {
    if (seedInfo.states >= PER_SEED) { seedInfo.capped = true; report.totals.cappedSeeds++; break }
    const { state, depth, trail } = queue.shift()
    if (state.phase === PHASE.FINISHED) { report.totals.finished++; seedInfo.finishedReached = true; continue }

    const groups = displayGroupsFor(state)
    const key = stateKey(state, groups)
    if (seen.has(key)) continue
    seen.add(key)
    seedInfo.states++; report.totals.statesVisited++
    seedInfo.maxDepth = Math.max(seedInfo.maxDepth, depth)

    tallyState(state, depth, trail)
    if (depth >= MAX_DEPTH) continue
    for (const { group, item } of expansionItems(groups)) {
      let next
      try { next = confirm(state, item) } catch { continue }
      if (!next) continue
      const label = item.type === 'word' ? item.word.tongan
        : item.type === 'first_word' ? item.item.word.tongan : item.display
      queue.push({ state: next, depth: depth + 1, trail: [...trail, `${group}:${label}`] })
    }
  }
  report.firstWordCoverage.push(seedInfo)
}

// Gated: this probe explores ~169k states (~65s) and is the regression oracle
// for the sentence-builder fix plan (plans/Terminal-Build-Analysis.md), NOT a
// unit test. Opt in with TB_PROBE=1 so it stays out of the normal `npm test`.
describe.skipIf(process.env.TB_PROBE !== '1')('terminal-build reachability probe (per-first-word BFS)', () => {
  it('explores the option space and writes a report', () => {
    const fw = getFirstWordOptions(createMultiWalker(CHAPTER))
    const seeds = []
    for (const g of fw.groups) for (const w of g.words) seeds.push(w)
    report.totals.seeds = seeds.length
    for (const s of seeds) bfsSeed(s)

    // flatten per-entry thin buckets into report.thinMenus
    report.thinMenus = Object.values(report._thinByEntry || {}).flat()
    delete report._thinByEntry
    const t = report.totals
    const lines = []
    lines.push(`\n=== /terminal-build reachability (ch ${CHAPTER}, perSeed=${PER_SEED}, depth<=${MAX_DEPTH}) ===`)
    lines.push(`seeds(first words)=${t.seeds}  states=${t.statesVisited}  finished=${t.finished}  cappedSeeds=${t.cappedSeeds}`)
    lines.push(`menuStates=${t.menuStates}  slotStates=${t.slotStates}  menuDeadEnds=${t.menuDeadEnds}  thinMenus(<=1 POS)=${t.menuThin}`)
    lines.push('\nmenu breadth histogram (#content POS offered in a menu → #states):')
    for (const k of Object.keys(report.menuBreadthHist).map(Number).sort((a, b) => a - b))
      lines.push(`  ${String(k).padStart(2)} POS: ${report.menuBreadthHist[k]}`)
    lines.push('\nper entry-point category:')
    for (const [k, v] of Object.entries(report.perEntry).sort((a, b) => b[1].menuStates - a[1].menuStates))
      lines.push(`  ${k.padEnd(14)} menuStates=${String(v.menuStates).padStart(6)} thin=${String(v.thin).padStart(5)} deadEnds=${String(v.deadEnds).padStart(4)}`)
    lines.push('\ngroup-label reachability (#states where this tab is offered):')
    for (const [k, v] of Object.entries(report.groupReach).sort((a, b) => b[1] - a[1]))
      lines.push(`  ${k.padEnd(22)} ${v}`)
    lines.push('\ndeepest sentence reached per entry category:')
    for (const [k, v] of Object.entries(report.deepestByEntry).sort((a, b) => b[1].depth - a[1].depth))
      lines.push(`  ${k.padEnd(14)} d${v.depth}: "> ${v.rendered}"`)
    console.error(lines.join('\n'))

    fs.writeFileSync(OUT, JSON.stringify(report, null, 2))
    console.error(`\nfull report → ${OUT}`)
    expect(t.statesVisited).toBeGreaterThan(0)
  }, 1200000)
})
