import { describe, it, expect } from 'vitest'
import dialsFile from './dials.json'
import {
  buildDials, dialsToJson, loadSources, RULES, VOCAB_TYPES, NO_CARD_ROLES, MAX_WRONG,
  bare, trailOf, hasAcute, foldKey, tableKey, vowelCount, shown, englishMarks, couldBeSubject,
} from './build-dials.mjs'
import { toCard, contentWords, LEFT_OUT_OF_GAME } from '../shared/deck.js'
import { clashes } from '../shared/fair.js'

// No Tongan is typed in this file: every word is read from the bank, the vocabulary or the tables.
const { bank, vocabulary, wordLists } = loadSources()
const sentences = dialsFile.sentences
const liveDials = sentences.flatMap(s => s.dials.filter(d => !d.fixed).map(d => ({ s, d })))
const wrongOf = d => d.options.filter(o => o !== d.right)

const tenseByKey = new Map(bank.tenseTable.map(r => [tableKey(r.word), r]))
const pronounByKey = new Map(bank.pronounTable.map(r => [tableKey(r.word), r]))
const afterOf = source => {
  const m = String(source).match(/,\s*after ([^)]*)\)/)
  return m ? m[1].split(/,| and /).map(x => tableKey(x.trim())).filter(Boolean) : null
}

// bank words per role (fold keys) and vocabulary rows per role
const bankRoleKeys = new Map()
for (const e of bank.sentences) e.words.forEach((w, i) => {
  const r = e.roles[i]
  if (!r) return
  if (!bankRoleKeys.has(r)) bankRoleKeys.set(r, new Set())
  bankRoleKeys.get(r).add(foldKey(w))
})
const vocabRoleKeys = new Map()
for (const [role, types] of Object.entries(VOCAB_TYPES)) {
  vocabRoleKeys.set(role, new Set(vocabulary.filter(v => types.includes(v.part_of_speech)).map(v => foldKey(v.tongan))))
}
const cardsByKey = new Map()
for (const v of vocabulary) {
  if (LEFT_OUT_OF_GAME.has(v.id) || /\(accent example\)/i.test(v.english ?? '')) continue
  const k = foldKey(v.tongan)
  if (!cardsByKey.has(k)) cardsByKey.set(k, [])
  cardsByKey.get(k).push(toCard(v))
}
const cardsOf = w => cardsByKey.get(foldKey(w)) ?? []
const anyClash = (a, b) => cardsOf(a).some(x => cardsOf(b).some(y => clashes(x, y) || clashes(y, x)))

describe('dials.json: shape and coverage', () => {
  it('has one entry for every bank sentence, in bank order, with the bank\'s words, roles and right words', () => {
    expect(bank.sentences.length).toBeGreaterThan(0)
    expect(sentences.map(s => s.id)).toEqual(bank.sentences.map(s => s.id))
    for (const b of bank.sentences) {
      const s = sentences.find(x => x.id === b.id)
      expect(s.lesson, b.id).toBe(b.lesson)
      expect(s.english, b.id).toBe(b.english)
      expect(s.words, b.id).toEqual(b.words)
      expect(s.dials.length, b.id).toBe(b.words.length)
      s.dials.forEach((d, i) => {
        expect(d.index, b.id).toBe(i)
        expect(d.right, `${b.id} #${i}`).toBe(b.words[i])
        expect(d.role, `${b.id} #${i}`).toBe(b.roles[i])
        expect(d.options.includes(d.right), `${b.id} #${i}`).toBe(true)
        expect(d.sources.length, `${b.id} #${i}`).toBe(d.options.length)
      })
    }
  })

  it('names every rule it enforces, and the rules are the builder\'s', () => {
    expect(dialsFile.rules).toEqual(RULES)
    for (const id of ['R1', 'R2a', 'R2b', 'R2c', 'R2d', 'R2e', 'R2f', 'R2g', 'R3', 'R4', 'R5']) expect(RULES.some(r => r.id === id && r.what.length > 20), id).toBe(true)
  })

  it('is what the builder makes now, and the builder is deterministic', () => {
    const a = dialsToJson(buildDials(loadSources()))
    const b = dialsToJson(buildDials(loadSources()))
    expect(a).toBe(b)
    expect(JSON.parse(a)).toEqual(dialsFile)
  })

  it('gives every live dial between two and four options, the right word exactly once', () => {
    expect(liveDials.length).toBeGreaterThan(0)
    for (const { s, d } of liveDials) {
      expect(d.options.length, `${s.id} #${d.index}`).toBeGreaterThanOrEqual(2)
      expect(d.options.length, `${s.id} #${d.index}`).toBeLessThanOrEqual(MAX_WRONG + 1)
      expect(d.options.filter(o => o === d.right).length, `${s.id} #${d.index}`).toBe(1)
    }
  })
})

describe('R1 same kind', () => {
  it('takes every wrong option from a word with that role in the bank, the tense or pronoun table, or the vocabulary type of that role', () => {
    for (const { s, d } of liveDials) {
      for (const o of wrongOf(d)) {
        const k = foldKey(o)
        const where = `${s.id} #${d.index} ${d.role} option ${o}`
        let ok = bankRoleKeys.get(d.role)?.has(k) ?? false
        if (d.role === 'tense marker') ok = tenseByKey.has(tableKey(o))
        else if (d.role === 'pronoun') ok = pronounByKey.has(tableKey(o))
        else if (!ok) ok = vocabRoleKeys.get(d.role)?.has(k) ?? false
        expect(ok, where).toBe(true)
      }
    }
  })
})

describe('R2 never a second right answer', () => {
  it('R2a: no other tense marker of the right word\'s tense, and one option per tense', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'tense marker')) {
      const right = tenseByKey.get(tableKey(d.right))
      expect(right, `${s.id} #${d.index}`).toBeTruthy()
      const tenses = wrongOf(d).map(o => tenseByKey.get(tableKey(o)).tense)
      expect(tenses.includes(right.tense), `${s.id} #${d.index}`).toBe(false)
      expect(new Set(tenses).size, `${s.id} #${d.index}`).toBe(tenses.length)
      n++
    }
    expect(n).toBeGreaterThan(100)
  })

  it('R2b: a subject pronoun option has another person than the English names, unless the English marks the number or inclusiveness', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun')) {
      const b = bank.sentences.find(x => x.id === s.id)
      const who = b.tags.who
      const rRow = pronounByKey.get(tableKey(d.right))
      const isSubject = Boolean(who) && who.kind === 'pronoun' && who.index === d.index
      const person = isSubject ? who.person : rRow.person
      const marks = isSubject ? englishMarks(s.english) : { numbers: null, inclusive: null }
      for (const o of wrongOf(d)) {
        const row = pronounByKey.get(tableKey(o))
        if (row.person !== person) continue
        // same person: only where a mark of the English rules it out, or R2c settles it (tested below)
        const sameFeatures = row.person === rRow.person && row.number === rRow.number && row.inclusive === rRow.inclusive
        const ruledOut = !couldBeSubject(row, person, marks)
        expect(ruledOut || sameFeatures, `${s.id} #${d.index} option ${o}`).toBe(true)
        if (ruledOut) {
          const marked = /one person|three or more|\(two\)|\btwo\b|group|exclusive|including you|inclusive/i.test(s.english)
          expect(marked, `${s.id} #${d.index} option ${o} has the right word's person with no mark in the English`).toBe(true)
        }
        n++
      }
    }
    expect(n).toBeGreaterThan(0)
  })

  it('R2b: "you" without a mark in the English excludes every other second-person pronoun', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun')) {
      const b = bank.sentences.find(x => x.id === s.id)
      const who = b.tags.who
      if (!who || who.kind !== 'pronoun' || who.index !== d.index || who.person !== 2) continue
      if (/one person|three or more|\(two\)|\btwo\b|group/i.test(s.english)) continue
      for (const o of wrongOf(d)) expect(pronounByKey.get(tableKey(o)).person, `${s.id} option ${o}`).not.toBe(2)
      n++
    }
    expect(n).toBeGreaterThan(10)
  })

  it('R2c: another form of the same pronoun is a wrong option only where the book lines settle it', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun')) {
      const rRow = pronounByKey.get(tableKey(d.right))
      const prev = d.index > 0 ? tableKey(s.words[d.index - 1]) : null
      for (const o of wrongOf(d)) {
        const row = pronounByKey.get(tableKey(o))
        const same = row.person === rRow.person && row.number === rRow.number && row.inclusive === rRow.inclusive
        if (!same) continue
        const ra = afterOf(rRow.source)
        const oa = afterOf(row.source)
        expect(Boolean(prev && ra && ra.includes(prev) && oa && !oa.includes(prev)), `${s.id} #${d.index} option ${o}`).toBe(true)
        n++
      }
    }
    expect(n).toBeGreaterThan(0)
  })

  it('R2d: no option clashes with the right word, and no two wrong options clash', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => !NO_CARD_ROLES.has(x.d.role))) {
      const wrong = wrongOf(d)
      for (const o of wrong) {
        expect(anyClash(d.right, o), `${s.id} #${d.index}: ${d.right} vs ${o}`).toBe(false)
        n++
      }
      for (let i = 0; i < wrong.length; i++) for (let j = i + 1; j < wrong.length; j++) expect(anyClash(wrong[i], wrong[j]), `${s.id} #${d.index}: ${wrong[i]} vs ${wrong[j]}`).toBe(false)
    }
    expect(n).toBeGreaterThan(500)
  })

  it('R2e: no option equals another after okinafy display and case-folding (accent-only variants count as equal)', () => {
    for (const { s, d } of liveDials) {
      const display = d.options.map(o => shown(bare(o)))
      expect(new Set(display).size, `${s.id} #${d.index}`).toBe(d.options.length)
      const folded = d.options.map(foldKey)
      expect(new Set(folded).size, `${s.id} #${d.index}`).toBe(d.options.length)
    }
  })

  it('R2f: no option\'s meaning shares a content word with the English prompt', () => {
    for (const { s, d } of liveDials.filter(x => !NO_CARD_ROLES.has(x.d.role))) {
      const eng = new Set(contentWords(s.english))
      for (const o of wrongOf(d)) for (const c of cardsOf(o)) {
        expect(c.words.some(w => eng.has(w)), `${s.id} #${d.index}: ${o} (${c.english}) against "${s.english}"`).toBe(false)
      }
    }
  })

  it('R2g: every live dial outside tense marker, pronoun and name has a vocabulary meaning for the right word and each option', () => {
    for (const { s, d } of liveDials.filter(x => !NO_CARD_ROLES.has(x.d.role))) {
      for (const o of d.options) expect(cardsOf(o).length, `${s.id} #${d.index} ${o}`).toBeGreaterThan(0)
    }
  })
})

describe('R3 no give-away by spelling', () => {
  it('a tense marker option shows the accented form before a one-syllable pronoun and the bare form elsewhere', () => {
    const accentedBase = new Set()
    for (const e of bank.sentences) e.words.forEach((w, i) => { if (e.roles[i] === 'tense marker' && hasAcute(w)) accentedBase.add(foldKey(w)) })
    expect(accentedBase.size).toBeGreaterThan(0)
    let withAccent = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'tense marker')) {
      const next = s.words[d.index + 1]
      const need = Boolean(next) && s.dials[d.index + 1].role === 'pronoun' && vowelCount(next) === 1
      expect(hasAcute(d.right), `${s.id} #${d.index}: the book's own word`).toBe(need)
      for (const o of wrongOf(d)) {
        if (need && accentedBase.has(foldKey(o))) { expect(hasAcute(o), `${s.id} #${d.index} option ${o}`).toBe(true); withAccent++ }
        if (!need) expect(hasAcute(o), `${s.id} #${d.index} option ${o}`).toBe(false)
      }
    }
    expect(withAccent).toBeGreaterThan(50)
  })

  it('on every dial the right word is never the only option carrying an accent mark when another option has an accented form in the bank', () => {
    const accentedKeys = new Set()
    for (const e of bank.sentences) e.words.forEach(w => { if (hasAcute(w)) accentedKeys.add(foldKey(w)) })
    let checked = 0
    for (const { s, d } of liveDials) {
      if (!hasAcute(d.right)) continue
      const wrong = wrongOf(d)
      const onlyRight = wrong.every(o => !hasAcute(o))
      if (onlyRight) expect(wrong.some(o => accentedKeys.has(foldKey(o))), `${s.id} #${d.index}`).toBe(false)
      checked++
    }
    expect(checked).toBeGreaterThan(50)
  })

  it('every option has the accent state of the right word, and the right word\'s end punctuation', () => {
    for (const { s, d } of liveDials) {
      for (const o of wrongOf(d)) {
        expect(hasAcute(o), `${s.id} #${d.index} option ${o}`).toBe(hasAcute(d.right))
        expect(trailOf(o), `${s.id} #${d.index} option ${o}`).toBe(trailOf(d.right))
      }
    }
  })
})

describe('R4 from the data only', () => {
  const allowed = new Set()
  for (const e of bank.sentences) for (const w of e.words) allowed.add(bare(w))
  for (const v of vocabulary) allowed.add(v.tongan)
  for (const r of [...bank.tenseTable, ...bank.pronounTable]) allowed.add(r.word)
  const leftOut = new Set([...wordLists.entries, ...vocabulary].filter(r => LEFT_OUT_OF_GAME.has(r.id)).map(r => foldKey(r.tongan)))

  it('takes every option string from the bank, the tables or the vocabulary (end punctuation aside)', () => {
    for (const { s, d } of liveDials) for (const o of d.options) expect(allowed.has(bare(o)), `${s.id} #${d.index} option ${o}`).toBe(true)
  })

  it('never shows a word in LEFT_OUT_OF_GAME', () => {
    expect(leftOut.size).toBeGreaterThan(0)
    for (const s of sentences) for (const d of s.dials) for (const o of d.options) {
      if (o === d.right) continue
      expect(leftOut.has(foldKey(o)), `${s.id} #${d.index} option ${o}`).toBe(false)
    }
  })
})

describe('R5 dials that cannot be fair', () => {
  it('fixes every word whose role is null, with the reason "no label in the book"', () => {
    const nulls = bank.sentences.flatMap(e => e.roles.map((r, i) => (r === null ? `${e.id}#${i}` : null)).filter(Boolean))
    expect(nulls.length).toBeGreaterThan(0)
    const fixedNull = sentences.flatMap(s => s.dials.filter(d => d.role === null).map(d => `${s.id}#${d.index}`))
    expect(fixedNull).toEqual(nulls)
    for (const s of sentences) for (const d of s.dials.filter(x => x.role === null)) {
      expect(d.fixed).toBe(true)
      expect(d.why).toBe('no label in the book')
      expect(d.options).toEqual([d.right])
    }
  })

  it('gives every other fixed dial a reason and only the right word, and every live dial at least one wrong option and no reason', () => {
    for (const s of sentences) for (const d of s.dials) {
      if (d.fixed) {
        expect(typeof d.why, `${s.id} #${d.index}`).toBe('string')
        expect(d.why.length, `${s.id} #${d.index}`).toBeGreaterThan(5)
        expect(d.options, `${s.id} #${d.index}`).toEqual([d.right])
      } else {
        expect(d.why, `${s.id} #${d.index}`).toBeNull()
        expect(wrongOf(d).length, `${s.id} #${d.index}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('keeps the dials a player can turn: most words are live, and Lesson 1 has no fixed dial', () => {
    const all = sentences.flatMap(s => s.dials)
    expect(all.filter(d => !d.fixed).length / all.length).toBeGreaterThan(0.6)
    for (const s of sentences.filter(x => x.lesson === 1)) for (const d of s.dials) expect(d.fixed, `${s.id} #${d.index}`).toBe(false)
  })
})
