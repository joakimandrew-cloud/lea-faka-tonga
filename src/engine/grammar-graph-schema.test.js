/**
 * grammar-graph.json schema conformance tests.
 *
 * Operationalizes the `grammar-graph schema validation` row in
 * spec/Phase-2-Engine-Plan.md — the second half of the 2C.1 entry-gate pair.
 * Docs.4 catches spec-graph drift; this file catches data-shape drift:
 * missing required fields, typos, unknown enums, unresolved references.
 *
 * Two blocks:
 *   1. Live data conformance — the shipped grammar-graph.json must validate
 *      cleanly. Any new field added to the schema must either be optional or
 *      tagged on every applicable word before landing.
 *   2. Targeted fault injection — small mutations of the real data must each
 *      produce the expected error message. This is the regression guard that
 *      proves the validator would actually catch drift, rather than rubber-
 *      stamping whatever shape is currently shipped.
 */
import { describe, it, expect } from 'vitest'
import {
  validateGrammarGraph,
  NOUN_CLASSES,
  CONDITION_TYPES,
  CATEGORIES,
} from './grammar-graph-schema.js'
import grammarGraph from '../data/grammar-graph.json'

// Deep clone so mutation tests don't leak into each other or into the live
// import that other tests share.
const clone = (x) => JSON.parse(JSON.stringify(x))

describe('grammar-graph schema — live data conformance', () => {
  const errors = validateGrammarGraph(grammarGraph)

  it('validates with zero errors', () => {
    // When this fails, the first ~10 errors tell you where drift was
    // introduced. Run `vitest run grammar-graph-schema` locally to iterate.
    if (errors.length > 0) {
      console.error('grammar-graph schema errors:\n' + errors.slice(0, 20).join('\n'))
    }
    expect(errors).toEqual([])
  })

  it('has a meta block', () => {
    expect(grammarGraph.meta).toBeDefined()
    expect(typeof grammarGraph.meta.version).toBe('string')
    expect(typeof grammarGraph.meta.description).toBe('string')
  })

  it('has at least the Ch 1–15 + Ch 30 slice entry points', () => {
    const ids = new Set(grammarGraph.entry_points.map((ep) => ep.id))
    for (const required of [
      'statement',
      'location_state',
      'experiencer',
      'suggestion',
      'command',
      'command_plural',
      'prohibition',
      'negation',
      'negation_impersonal',
      'ko_identification',
      'ko_negation',
      'ko_question_what',
      'ko_question_who',
      'ko_question_where',
      'noun_subject',
      'purpose_bare_verb',
    ]) {
      expect(ids.has(required), `entry_point ${required} must be present`).toBe(true)
    }
  })

  it('every entry_point.start_node resolves to a real node', () => {
    const nodeIds = new Set(Object.keys(grammarGraph.nodes))
    for (const ep of grammarGraph.entry_points) {
      expect(nodeIds.has(ep.start_node), `${ep.id}.start_node → ${ep.start_node}`).toBe(true)
    }
  })

  it('every edge.node resolves to a real node or a FINISH terminator', () => {
    const nodeIds = new Set(Object.keys(grammarGraph.nodes))
    const FINISH = new Set(['FINISH_STATEMENT', 'FINISH_QUESTION', 'FINISH_EXCLAMATION'])
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const edge of node.next || []) {
        const ok = nodeIds.has(edge.node) || FINISH.has(edge.node)
        expect(ok, `${nodeId}.next → ${edge.node}`).toBe(true)
      }
    }
  })

  it('every edge.child_entry_point resolves to a real entry_point', () => {
    const entryPointIds = new Set(grammarGraph.entry_points.map((ep) => ep.id))
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const edge of node.next || []) {
        if (!edge.child_entry_point) continue
        expect(
          entryPointIds.has(edge.child_entry_point),
          `${nodeId}.next.child_entry_point → ${edge.child_entry_point}`,
        ).toBe(true)
      }
    }
  })

  it('every word.complement_prep uses a known family', () => {
    const FAMILIES = new Set(['ki-family', 'i-family', 'mei-family'])
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.complement_prep === undefined) continue
        expect(FAMILIES.has(w.complement_prep), `${nodeId} ${w.tongan}`).toBe(true)
      }
    }
  })

  it('every noun_class uses the known 4-value enum', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.noun_class === undefined) continue
        expect(NOUN_CLASSES.has(w.noun_class), `${nodeId} ${w.tongan}`).toBe(true)
      }
    }
  })
})

describe('grammar-graph schema — targeted fault injection', () => {
  it('flags an unknown top-level key', () => {
    const d = clone(grammarGraph)
    d.bogus_section = {}
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown top-level key: bogus_section'))).toBe(true)
  })

  it('flags an entry_point missing required field', () => {
    const d = clone(grammarGraph)
    delete d.entry_points[0].start_node
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('start_node') && e.includes('missing'))).toBe(true)
  })

  it('flags a duplicate entry_point id', () => {
    const d = clone(grammarGraph)
    d.entry_points.push({ ...d.entry_points[0] })
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('duplicate entry_point id'))).toBe(true)
  })

  it('flags an unknown entry_point category', () => {
    const d = clone(grammarGraph)
    d.entry_points[0].category = 'SomethingNew'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown category'))).toBe(true)
  })

  it('flags an unknown allowed_terminator', () => {
    const d = clone(grammarGraph)
    d.entry_points[0].allowed_terminators = ['FINISH_SOMETHING_ELSE']
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown terminator'))).toBe(true)
  })

  it('flags a start_node that points at a non-existent node', () => {
    const d = clone(grammarGraph)
    d.entry_points[0].start_node = 'definitely_not_a_node'
    const errors = validateGrammarGraph(d)
    expect(
      errors.some((e) => e.includes('start_node') && e.includes('definitely_not_a_node')),
    ).toBe(true)
  })

  it('flags an edge.node that points at a non-existent node', () => {
    const d = clone(grammarGraph)
    d.nodes.verb.next[0].node = 'ghost_node'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown node: ghost_node'))).toBe(true)
  })

  it('allows FINISH_STATEMENT / FINISH_QUESTION as edge.node targets (baseline)', () => {
    // Sanity: the real data already uses these; if the validator rejected
    // them, the live-data test would fail. This test exists to make the
    // "edge.node ghost_node" test above meaningful by proving FINISH nodes
    // aren't themselves the thing being caught.
    const errors = validateGrammarGraph(grammarGraph)
    const finishErrors = errors.filter(
      (e) => e.includes('FINISH_STATEMENT') || e.includes('FINISH_QUESTION'),
    )
    expect(finishErrors).toEqual([])
  })

  it('flags an unknown word field (typo guard)', () => {
    const d = clone(grammarGraph)
    d.nodes.verb.words[0].nounc_lass = 'common' // typo of noun_class
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('nounc_lass') && e.includes('unknown field'))).toBe(true)
  })

  it('flags an unknown noun_class value', () => {
    const d = clone(grammarGraph)
    d.nodes.prep_phrase.words[0].noun_class = 'celestial'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown noun_class'))).toBe(true)
  })

  it('flags an unknown complement_prep family', () => {
    const d = clone(grammarGraph)
    const verb = d.nodes.verb.words.find((w) => w.complement_prep)
    verb.complement_prep = 'something-family'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown complement_prep'))).toBe(true)
  })

  it('flags an unknown condition type', () => {
    const d = clone(grammarGraph)
    const nodeWithCondition = Object.values(d.nodes).find((n) =>
      (n.next || []).some((e) => e.condition),
    )
    const edge = nodeWithCondition.next.find((e) => e.condition)
    edge.condition.type = 'fictitious_cap'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown condition type'))).toBe(true)
  })

  it('flags a child_entry_point that does not resolve', () => {
    const d = clone(grammarGraph)
    const edge = d.nodes.verb.next.find((e) => e.child_entry_point)
    expect(edge, 'fixture assumption: verb node has a child_entry_point edge').toBeDefined()
    edge.child_entry_point = 'ghost_entry'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('ghost_entry'))).toBe(true)
  })

  it('flags a word missing min_chapter', () => {
    const d = clone(grammarGraph)
    delete d.nodes.verb.words[0].min_chapter
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('min_chapter') && e.includes('missing'))).toBe(true)
  })

  it('flags a non-integer min_chapter', () => {
    const d = clone(grammarGraph)
    d.nodes.verb.words[0].min_chapter = 'one'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('min_chapter') && e.includes('positive integer'))).toBe(true)
  })

  it('accepts additive Phase 2B fields (animacy, possessive_class) as optional', () => {
    const d = clone(grammarGraph)
    d.nodes.verb.words[0].animacy = 'thing'
    d.nodes.prep_phrase.words[0].possessive_class = 'ho_class'
    const errors = validateGrammarGraph(d)
    expect(errors).toEqual([])
  })

  it('still rejects an unknown animacy value', () => {
    const d = clone(grammarGraph)
    d.nodes.verb.words[0].animacy = 'mineral'
    const errors = validateGrammarGraph(d)
    expect(errors.some((e) => e.includes('unknown animacy'))).toBe(true)
  })
})

describe('grammar-graph schema — Phase 2B tag coverage', () => {
  // Positive assertions that prove 2B.2 (animacy), 2B.3 (possessive_class),
  // and 2B.5 (complement_prep) tagging sub-batches actually landed their
  // tags on the live data. The schema validator treats these as optional;
  // these tests promote them to required-where-expected so regressions show.

  // Collect every noun-bearing word entry (has `noun_class`) across every
  // node, paired with its owning nodeId for readable failure messages.
  const allNouns = []
  for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
    for (const w of node.words || []) {
      if (w.noun_class) allNouns.push({ nodeId, w })
    }
  }

  // --- 2B.2: animacy ------------------------------------------------------

  it('2B.2 — every noun_class-bearing word has an animacy tag', () => {
    const missing = allNouns.filter(({ w }) => w.animacy === undefined)
    if (missing.length) {
      console.error(
        'untagged nouns:\n' +
          missing.map(({ nodeId, w }) => `  ${nodeId} :: ${w.tongan} (${w.english})`).join('\n'),
      )
    }
    expect(missing).toEqual([])
  })

  it('2B.2 — every personal-class word has animacy: person', () => {
    const wrong = allNouns.filter(
      ({ w }) => w.noun_class === 'personal' && w.animacy !== 'person',
    )
    expect(wrong).toEqual([])
  })

  it('2B.2 — every pronoun-class word has animacy: person', () => {
    // All current pronoun entries refer to people (au/koe/ia/kimautolu/...).
    const wrong = allNouns.filter(
      ({ w }) => w.noun_class === 'pronoun' && w.animacy !== 'person',
    )
    expect(wrong).toEqual([])
  })

  it('2B.2 — food-animal nouns (moa, ika, pulu) are tagged animal', () => {
    // Spot-check the three animal-derived food words from the `object` node.
    // These are the only nouns in Ch 1–15 scope that should be `animacy: animal`.
    // (Pre-composed `ha ika` / `ha moa` / `e ika` entries were removed when
    // articles became their own category — the bare nouns carry `animacy` and
    // the article step is animacy-agnostic.)
    const animalEntries = grammarGraph.nodes.object.words.filter(
      (w) => ['moa', 'ika', 'pulu'].includes(w.tongan),
    )
    expect(animalEntries.length).toBe(3)
    for (const w of animalEntries) {
      expect(w.animacy, `${w.tongan}/${w.english}`).toBe('animal')
    }
  })

  // --- 2B.3: possessive_class ---------------------------------------------

  it('2B.3 — every noun_class-bearing word has a possessive_class tag', () => {
    const missing = allNouns.filter(({ w }) => w.possessive_class === undefined)
    if (missing.length) {
      console.error(
        'untagged nouns:\n' +
          missing.map(({ nodeId, w }) => `  ${nodeId} :: ${w.tongan} (${w.english})`).join('\n'),
      )
    }
    expect(missing).toEqual([])
  })

  it('2B.3 — every noun in prep_phrase has possessive_class', () => {
    // The spec calls out prep_phrase specifically as the node where the 2A.6
    // possessive paradigm selector will read `possessive_class` off head nouns.
    for (const w of grammarGraph.nodes.prep_phrase.words) {
      expect(w.possessive_class, `prep_phrase :: ${w.tongan}`).toBeDefined()
    }
  })

  it('2B.3 — spec-table nouns land on their documented class (§22)', () => {
    // Pinned from the §22 possessive-class table on grammar-spec.md:
    //   ho_class: fale, vaka, kofu, fonua, tatā, tokoua, nima
    //   e_class:  hele, tohi, kato, sea, faiako, moa, talo, kava, vai, pa'anga
    //   mixed:    fala, niu
    // Only words that currently exist in grammar-graph.json (Ch 1–15 + Ch 30
    // slice) are pinned; extending the graph will add rows here.
    const expected = {
      'fale|house': 'ho_class',
      'vaka|boat': 'ho_class',
      'tohi|book': 'e_class',
      'hele|knife': 'e_class',
      'kato|basket': 'e_class',
      'fala|mat': 'mixed',
      'moa|chicken': 'e_class',
      'ika|fish': 'e_class',
      'talo|taro': 'e_class',
    }
    const found = {}
    for (const { w } of allNouns) {
      const key = `${w.tongan}|${w.english}`
      if (key in expected) found[key] = w.possessive_class
    }
    expect(found).toEqual(expected)
  })

  // --- 2B.5: complement_prep ----------------------------------------------

  it('2B.5 — every verb_experiencer word has complement_prep', () => {
    // mahino (ki-family) and ngalo (i-family) — spec §20 Rule 3 table.
    for (const w of grammarGraph.nodes.verb_experiencer.words) {
      expect(w.complement_prep, `verb_experiencer :: ${w.tongan}`).toBeDefined()
    }
    const byTongan = Object.fromEntries(
      grammarGraph.nodes.verb_experiencer.words.map((w) => [w.tongan, w.complement_prep]),
    )
    expect(byTongan.mahino).toBe('ki-family')
    expect(byTongan.ngalo).toBe('i-family')
  })

  it('2B.5 — `lea` carries complement_prep: ki-family in every verb node it appears in', () => {
    // Spec §20 Rule 3 table: lea (speak) → ki-family. Must be consistent
    // across every verb node so the walker never offers the wrong preposition
    // family, regardless of entry point.
    const nodesContainingLea = []
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.tongan === 'lea' || w.tongan === 'Lea') nodesContainingLea.push({ nodeId, w })
      }
    }
    expect(nodesContainingLea.length).toBeGreaterThanOrEqual(5)
    for (const { nodeId, w } of nodesContainingLea) {
      expect(w.complement_prep, `${nodeId} :: lea`).toBe('ki-family')
    }
  })

  it('2B.5 — `tokoni` carries complement_prep: ki-family wherever it appears', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.tongan !== 'tokoni') continue
        expect(w.complement_prep, `${nodeId} :: tokoni`).toBe('ki-family')
      }
    }
  })

  it('2B.5 — `ʻita` carries complement_prep: i-family wherever it appears', () => {
    for (const [nodeId, node] of Object.entries(grammarGraph.nodes)) {
      for (const w of node.words || []) {
        if (w.tongan !== 'ʻita') continue
        expect(w.complement_prep, `${nodeId} :: ʻita`).toBe('i-family')
      }
    }
  })
})

describe('grammar-graph schema — exported enum sanity', () => {
  // These make refactors to the enum sets visible as test diffs. Flip a row
  // here only in the same commit that flips the corresponding data.
  it('CATEGORIES contains the current 8 categories', () => {
    expect(CATEGORIES.size).toBe(8)
  })

  it('CONDITION_TYPES contains the 6 current condition types', () => {
    expect(CONDITION_TYPES.size).toBe(6)
    expect(CONDITION_TYPES.has('no_complement_yet')).toBe(true) // P1-B4
  })

  it('NOUN_CLASSES is the fixed 4-value enum', () => {
    expect(NOUN_CLASSES.size).toBe(4)
  })
})
