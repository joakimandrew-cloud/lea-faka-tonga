/**
 * Regression guard for the Sentence Lab quality fix (audits/Sentence-Lab-
 * Quality-Findings.md): the slot engine must not generate semantically
 * incompatible verb→object pairs ("write the chicken") or the off-colour
 * comitative ("I slept with Sione"). These assertions reproduce the original
 * defects and lock in the verb→object / verb→companion selectional table.
 */
import { describe, it, expect } from 'vitest'
import vocab from '../data/vocabulary-by-slot.json'
import { getOptionsForSlot, assembleSentence } from '../engine/slot-engine'
import { pickPattern, seedFill } from './lab-engine'
import { newRound } from './graded-lab'

const SEL = vocab.selectional
const objKey = (en) => (en || '').toLowerCase().replace(/^(the|a|an|some)\s+/, '').trim()
const verbOpt = (patternId, tongan, ch = 19) =>
  getOptionsForSlot(patternId, 'verb', {}, ch).find((v) => v.tongan === tongan)

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('Sentence Lab — verb→object selectional restrictions', () => {
  it('write (tohi) offers only "book", never the chicken or a person', () => {
    const objs = getOptionsForSlot('s23', 'object', { verb: verbOpt('s23', 'tohi') }, 19).map((o) => objKey(o.english))
    expect(objs).toEqual(['book'])
  })

  it('eat (kai) offers only foods (no book, no clothes)', () => {
    const objs = new Set(getOptionsForSlot('s23', 'object', { verb: verbOpt('s23', 'kai') }, 19).map((o) => objKey(o.english)))
    expect(objs.size).toBeGreaterThan(0)
    for (const o of objs) expect(SEL.object_by_verb.kai).toContain(o)
    expect(objs.has('book')).toBe(false)
    expect(objs.has('clothes')).toBe(false)
  })

  it('a person-taking verb (tokoni) offers only people', () => {
    const objs = getOptionsForSlot('s23', 'object', { verb: verbOpt('s23', 'tokoni') }, 19).map((o) => objKey(o.english))
    expect(objs.length).toBeGreaterThan(0)
    for (const o of objs) expect(['mele', 'seini', 'kepu', 'siale']).toContain(o)
  })

  it('NO transitive verb yields an out-of-table object, across every object pattern', () => {
    for (const patternId of ['s03', 's04', 's23', 's39']) {
      for (const verb of getOptionsForSlot(patternId, 'verb', {}, 53)) {
        const allowed = SEL.object_by_verb[verb.tongan]
        if (!allowed) continue // intransitive verbs in mixed pools are not constrained here
        const objs = getOptionsForSlot(patternId, 'object', { verb }, 53).map((o) => objKey(o.english))
        for (const o of objs) expect(allowed, `${patternId} ${verb.tongan}→${o}`).toContain(o)
      }
    }
  })

  it('completeness: every transitive-pool verb has a selectional entry', () => {
    const tv = new Set([...vocab.verbs_transitive, ...vocab.verbs_transitive_full].map((w) => w.tongan))
    for (const v of tv) expect(SEL.object_by_verb[v], `missing entry: ${v}`).toBeDefined()
  })

  it('every english key in the table exists in the object pools (no typos)', () => {
    const poolKeys = new Set([...vocab.objects, ...vocab.transitive_objects].map((o) => objKey(o.english)))
    for (const [verb, list] of Object.entries(SEL.object_by_verb)) {
      for (const k of list) expect(poolKeys.has(k), `${verb}→${k} not in pool`).toBe(true)
    }
  })
})

describe('Sentence Lab — off-colour comitative killed', () => {
  it('mohe + the blocklisted verbs are not offered in the s07 companion pattern', () => {
    const verbs = getOptionsForSlot('s07', 'verb', {}, 19).map((v) => v.tongan)
    for (const b of SEL.companion_verb_blocklist) expect(verbs).not.toContain(b)
    expect(verbs.length).toBeGreaterThan(0) // pattern still buildable with wholesome verbs
  })

  it('the Ch 19 explore seed is wholesome (never "slept with")', () => {
    const p = pickPattern(19)
    const a = assembleSentence(p.id, seedFill(p.id, 19))
    expect(a.english.toLowerCase()).not.toMatch(/sle(pt|ep) with/)
  })

  it('300 graded rounds (ch 19) produce no "slept with" and no out-of-table pair', () => {
    const rng = mulberry32(1234)
    let offColour = 0, nonsense = 0
    for (let i = 0; i < 300; i++) {
      const r = newRound(19, rng)
      if (!r) continue
      if (/sle(pt|ep) with [A-Z]/.test(r.targetEnglish)) offColour++
      const v = r.targetFill.verb?.tongan
      const allowed = v && SEL.object_by_verb[v]
      if (allowed && r.targetFill.object && !allowed.includes(objKey(r.targetFill.object.english))) nonsense++
    }
    expect(offColour).toBe(0)
    expect(nonsense).toBe(0)
  })
})
