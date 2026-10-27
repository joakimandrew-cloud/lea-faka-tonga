import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import dialsFile from './dials.json'
import possessivesFile from './possessives.json'
import equivalentsFile from './equivalents.json'
import tablesFile from './book-tables.json'
import {
  buildDials, dialsToJson, loadSources, RULES, VOCAB_TYPES, NO_CARD_ROLES, MAX_WRONG,
  bare, trailOf, hasAcute, foldKey, tableKey, vowelCount, shown, englishMarks, couldBeSubject,
  lookupKey, stateEnglish, clauseEnglish, accentTesterFor, DROPPED_OPTIONS, progressiveEnglish, directionCue, isGeneralOne, aSomeEnglish, rawWords, tongueState,
} from './build-dials.mjs'
import { toCard, contentWords, LEFT_OUT_OF_GAME } from '../shared/deck.js'
import { clashes } from '../shared/fair.js'

// No Tongan is typed in this file: every word is read from the bank, the vocabulary or the tables.
const { bank, vocabulary, wordLists } = loadSources()
const ROOT = process.env.LFT_ROOT || '/Users/andrewjoakim/Desktop/Lea-Faka-Tonga'
const sentences = dialsFile.sentences
const liveDials = sentences.flatMap(s => s.dials.filter(d => !d.fixed).map(d => ({ s, d })))
const hasAccent = accentTesterFor(bank, vocabulary)
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
  const k = lookupKey(foldKey(v.tongan))
  if (!cardsByKey.has(k)) cardsByKey.set(k, [])
  cardsByKey.get(k).push(toCard(v))
}
// Meanings the book's Lesson 22 tables give a word the vocabulary has none for (book-tables.json), for the role they were read for.
const tableMeaningRole = new Map()
for (const m of tablesFile.meanings) {
  const k = lookupKey(foldKey(m.word))
  if (cardsByKey.has(k)) continue
  cardsByKey.set(k, [toCard({ id: `local ${m.source}`, tongan: m.word, english: m.meaning, part_of_speech: '' })])
  tableMeaningRole.set(k, m.role)
}
const cardsOf = (w, role = null) => {
  const k = lookupKey(foldKey(w))
  if (role !== null && tableMeaningRole.has(k) && tableMeaningRole.get(k) !== role) return []
  return cardsByKey.get(k) ?? []
}
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
    for (const id of ['R1', 'R2a', 'R2b', 'R2c', 'R2d', 'R2e', 'R2f', 'R2g', 'R2h', 'R2i', 'R2j', 'R3', 'R4', 'R5']) expect(RULES.some(r => r.id === id && r.what.length > 20), id).toBe(true)
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
        else if (d.role === 'possessive') ok = possessivesFile.rows.some(r => foldKey(r.word) === k)
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
      // "is/are/am" + a state: the present and perfect markers count as one tense
      const group = t => (stateEnglish(s.english) && (t === 'present' || t === 'perfect') ? 'present' : t)
      const tenses = wrongOf(d).map(o => group(tenseByKey.get(tableKey(o)).tense))
      expect(tenses.includes(group(right.tense)), `${s.id} #${d.index}`).toBe(false)
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

  it('R2g: every live dial outside tense marker, pronoun, name and possessive has a vocabulary meaning for each option (and the right word, except a preposition)', () => {
    for (const { s, d } of liveDials.filter(x => !NO_CARD_ROLES.has(x.d.role))) {
      for (const o of d.options) {
        if (o === d.right && d.role === 'preposition') continue
        expect(cardsOf(o, d.role).length, `${s.id} #${d.index} ${o}`).toBeGreaterThan(0)
      }
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
        expect(hasAccent(o, d.role), `${s.id} #${d.index} option ${o}`).toBe(hasAccent(d.right, d.role))
        expect(trailOf(o), `${s.id} #${d.index} option ${o}`).toBe(trailOf(d.right))
      }
    }
  })
})

describe('R4 from the data only', () => {
  const allowed = new Set()
  for (const e of bank.sentences) for (const w of e.words) allowed.add(bare(w))
  for (const v of vocabulary) allowed.add(v.tongan)
  for (const r of [...bank.tenseTable, ...bank.pronounTable, ...possessivesFile.rows]) allowed.add(r.word)
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

// ---------------------------------------------------------------- the judge's Lesson 1 findings
// (reviews/sentence-lock-2026-10-27/Judge-Dials-L1.md). Each test fails on the builder as it was before the fix.
// Rows are named by sentence id and the 0-based index of the word; no Tongan is typed.

const dialAt = (id, index) => sentences.find(s => s.id === id).dials[index]
const sentenceOf = id => sentences.find(s => s.id === id)
const bankOf = id => bank.sentences.find(s => s.id === id)
const tenseOf = o => tenseByKey.get(tableKey(o)).tense
const sameKey = (a, b) => foldKey(a) === foldKey(b)
const equivalentPair = (a, b) => equivalentsFile.sameMeaning.some(p => (sameKey(p.a.word, a) && sameKey(p.b.word, b)) || (sameKey(p.a.word, b) && sameKey(p.b.word, a)))

describe('finding 1: the accent on the word to its left does not give the pronoun away', () => {
  const rows = ['ch2-ex2-6', 'ch3-ex2-7', 'ch4-ex2-6', 'ch18-ex4-1', 'ch21-ex2-4', 'ch29-ex5-5', 'ch32-ex3-2', 'ch48-ex3-3']
  it('offers only pronouns with the right word\'s number of vowels on the eight rows the judge named', () => {
    for (const id of rows) {
      const d = dialAt(id, 1)
      expect(d.role, id).toBe('pronoun')
      expect(d.fixed, id).toBe(false)
      for (const o of d.options) expect(vowelCount(o), `${id} option ${o}`).toBe(vowelCount(d.right))
    }
  })

  it('on every pronoun dial after a stress-sensitive word, the right word is not the only option of its syllable count', () => {
    const stress = new Set()
    for (const e of bank.sentences) e.words.forEach((w, i) => { if (i > 0 && e.roles[i] === 'pronoun' && vowelCount(w) === 1 && hasAcute(e.words[i - 1])) stress.add(foldKey(e.words[i - 1])) })
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun' && x.d.index > 0)) {
      if (!stress.has(foldKey(s.words[d.index - 1]))) continue
      n++
      const sameCount = d.options.filter(o => vowelCount(o) === vowelCount(d.right))
      expect(sameCount.length, `${s.id} #${d.index}`).toBe(d.options.length)
    }
    expect(n).toBeGreaterThan(100)
  })

  it('no longer offers a two-syllable pronoun beside a one-syllable right word in Lesson 1', () => {
    for (const id of ['ch1-ex2-2', 'ch1-ex2-4', 'ch1-ex2-5']) for (const o of dialAt(id, 1).options) expect(vowelCount(o), id).toBe(1)
  })
})

describe('finding 2: is/are/am with a state counts present and perfect as one tense', () => {
  it('ch38-ex2-4: with the right marker perfect, no present marker is offered (and the other way round)', () => {
    const d = dialAt('ch38-ex2-4', 1)
    expect(d.role).toBe('tense marker')
    expect(wrongOf(d).map(tenseOf)).not.toContain('present')
    expect(wrongOf(d).map(tenseOf)).not.toContain('perfect')
  })

  it('ch15-ex6-4, ch35-ex2-3, ch52-ex2-4: no perfect marker beside the right present one', () => {
    for (const id of ['ch15-ex6-4', 'ch35-ex2-3', 'ch52-ex2-4']) {
      const d = sentenceOf(id).dials.find(x => x.role === 'tense marker')
      expect(stateEnglish(sentenceOf(id).english), id).toBe(true)
      expect(wrongOf(d).map(tenseOf), id).not.toContain('perfect')
    }
  })

  it('on every state sentence, a present or perfect right marker has no wrong marker of either', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'tense marker' && stateEnglish(x.s.english))) {
      const t = tenseOf(d.right)
      if (t !== 'present' && t !== 'perfect') continue
      n++
      for (const o of wrongOf(d)) expect(['present', 'perfect'].includes(tenseOf(o)), `${s.id} #${d.index} option ${o}`).toBe(false)
    }
    expect(n).toBeGreaterThan(20)
  })
})

describe('finding 3: is/are/am + -ing with no future cue keeps the future markers off the dial', () => {
  it('ch13-ex2-1: no future marker beside the right present one', () => {
    const d = sentenceOf('ch13-ex2-1').dials.find(x => x.role === 'tense marker')
    expect(progressiveEnglish(sentenceOf('ch13-ex2-1').english)).toBe(true)
    expect(wrongOf(d).map(tenseOf)).not.toContain('future')
  })

  it('on every such sentence with a non-future right marker, no future marker is offered', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'tense marker' && progressiveEnglish(x.s.english))) {
      if (tenseOf(d.right) === 'future') continue
      n++
      expect(wrongOf(d).map(tenseOf), `${s.id} #${d.index}`).not.toContain('future')
    }
    expect(n).toBeGreaterThan(5)
  })

  it('the cue test: a future cue switches the rule off', () => {
    expect(progressiveEnglish('Who is coming?')).toBe(true)
    expect(progressiveEnglish('She is coming tomorrow.')).toBe(false)
    expect(progressiveEnglish('She is going to come.')).toBe(false)
    expect(stateEnglish('Siale is tired.')).toBe(true)
    expect(stateEnglish('Who is coming?')).toBe(false)
  })
})

describe('finding 4: the general "one" pronoun is never a wrong option for an "I" or "you" subject', () => {
  it('ch26-ex4-5 ("You should study.") and ch1-ex2-4 offer no general "one" pronoun', () => {
    for (const [id, index] of [['ch26-ex4-5', 3], ['ch1-ex2-4', 1]]) {
      const d = dialAt(id, index)
      for (const o of wrongOf(d)) expect(isGeneralOne(pronounByKey.get(tableKey(o))), `${id} option ${o}`).toBe(false)
    }
  })

  it('no live pronoun dial whose subject is "I" or "you" has it as a wrong option', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun')) {
      const who = bankOf(s.id).tags.who
      if (!who || who.kind !== 'pronoun' || who.index !== d.index || (who.person !== 1 && who.person !== 2)) continue
      n++
      for (const o of wrongOf(d)) expect(isGeneralOne(pronounByKey.get(tableKey(o))), `${s.id} option ${o}`).toBe(false)
    }
    expect(n).toBeGreaterThan(50)
    expect(bank.pronounTable.filter(isGeneralOne).length).toBe(1)
  })
})

describe('finding 5: words the book uses for the same English meaning are not wrong for each other', () => {
  it('keeps the pairs in a local file whose words are the vocabulary\'s own', () => {
    expect(equivalentsFile.sameMeaning.length).toBeGreaterThanOrEqual(2)
    for (const p of [...equivalentsFile.sameMeaning.flatMap(x => [x.a, x.b]), equivalentsFile.aSome.a, equivalentsFile.aSome.b, equivalentsFile.oneWay.never, ...equivalentsFile.oneWay.whenRightIs]) {
      // a word is the vocabulary's own (by id) or a table meaning of book-tables.json (by source)
      const word = vocabulary.find(v => v.id === p.source)?.tongan ?? tablesFile.meanings.find(m => m.source === p.source)?.word
      expect(word, p.source).toBe(p.word)
    }
  })

  it('ch4-ex2-5 and ch3-ex2-2: the paired word is not offered', () => {
    for (const [id, index] of [['ch4-ex2-5', 3], ['ch3-ex2-2', 3]]) {
      const d = dialAt(id, index)
      expect(d.fixed, id).toBe(false)
      for (const o of wrongOf(d)) expect(equivalentPair(d.right, o), `${id} option ${o}`).toBe(false)
    }
  })

  it('no live dial has a pair of the list on it, wrong beside right or wrong beside wrong', () => {
    for (const { s, d } of liveDials) {
      for (let i = 0; i < d.options.length; i++) for (let j = i + 1; j < d.options.length; j++) expect(equivalentPair(d.options[i], d.options[j]), `${s.id} #${d.index}`).toBe(false)
    }
  })
})

describe('finding 6: "a" and "some" take either article when the noun carries no accent', () => {
  const pair = (a, b) => sameKey(equivalentsFile.aSome.a.word, a) && sameKey(equivalentsFile.aSome.b.word, b) || sameKey(equivalentsFile.aSome.a.word, b) && sameKey(equivalentsFile.aSome.b.word, a)
  it('ch41-ex3-6 and ch25-ex5-8: the other article of the pair is not offered', () => {
    for (const id of ['ch41-ex3-6', 'ch25-ex5-8']) {
      const d = dialAt(id, 0)
      expect(d.role, id).toBe('article')
      for (const o of wrongOf(d)) expect(pair(d.right, o), `${id} option ${o}`).toBe(false)
    }
  })

  it('on every article dial with "a/an/some" in the English and an unaccented noun, the pair never meets', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'article')) {
      if (!aSomeEnglish(s.english)) continue
      if (s.words.some((w, j) => j > d.index && s.dials[j].role === 'noun' && hasAcute(w))) continue
      n++
      for (const o of wrongOf(d)) expect(pair(d.right, o), `${s.id} #${d.index} option ${o}`).toBe(false)
    }
    expect(n).toBeGreaterThan(5)
  })
})

describe('finding 7: a direction word is a dial only where the English marks the direction', () => {
  it('ch11-ex2-4 ("When will they return?") fixes its direction word', () => {
    const d = sentenceOf('ch11-ex2-4').dials.find(x => x.role === 'directional particle')
    expect(d.fixed).toBe(true)
    expect(d.options).toEqual([d.right])
  })

  it('every live direction dial has a direction cue in its English, and the cue test reads the cues', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'directional particle')) { n++; expect(directionCue(s.english), s.id).toBe(true) }
    expect(n).toBeGreaterThan(3)
    expect(directionCue('When will they return?')).toBe(false)
    expect(directionCue('They have come.')).toBe(true)
  })
})

describe('finding 8: more words get dials', () => {
  it('matches a word to its vocabulary entry without acute accents or macrons', () => {
    expect(lookupKey(foldKey('x̄'))).toBe('x')
    for (const [id, index] of [['ch40-ex2-5', 3], ['ch14-ex2-9', 3], ['ch42-ex2-6', 3]]) {
      const d = dialAt(id, index)
      expect(d.fixed, `${id} #${index}`).toBe(false)
      expect(cardsOf(d.right).length, id).toBeGreaterThan(0)
    }
  })

  it('keeps the five dials only an invented accented form could fill fixed', () => {
    for (const [id, index] of [['ch24-ex2-3', 3], ['ch24-ex2-7', 3], ['ch30-ex2-4', 5], ['ch36-ex3-3', 6], ['ch20-ex4-2', 2]]) expect(dialAt(id, index).fixed, `${id} #${index}`).toBe(true)
  })

  it('reads the possessive tables of Lesson 17 from the book', () => {
    const plain = possessivesFile.rows.filter(r => r.kind === 'plain')
    expect(plain.length).toBe(14)
    expect(new Set(plain.map(r => r.class))).toEqual(new Set(['e', 'ho']))
    const chapter = `${ROOT}/book/Chapter-17.md`
    if (fs.existsSync(chapter)) {
      const text = fs.readFileSync(chapter, 'utf8').split('\n').slice(36, 80).join('\n')
      for (const r of plain) expect(text.includes(`*${r.word}*`), r.word).toBe(true)
    }
  })

  it('makes a possessive in the tables a dial whose options are other persons of the same class', () => {
    const live = liveDials.filter(x => x.d.role === 'possessive')
    expect(live.length).toBeGreaterThan(10)
    const rowOf = w => possessivesFile.rows.find(r => foldKey(r.word) === foldKey(w))
    for (const { s, d } of live) {
      const right = rowOf(d.right)
      expect(right, `${s.id} #${d.index}`).toBeTruthy()
      for (const o of wrongOf(d)) {
        const row = rowOf(o)
        expect(row, `${s.id} option ${o}`).toBeTruthy()
        expect(row.kind, `${s.id} option ${o}`).toBe(right.kind)
        expect(row.class, `${s.id} option ${o}`).toBe(right.class)
        expect(row.person, `${s.id} option ${o}`).not.toBe(right.person)
      }
    }
    expect(dialAt('ch17-ex4-1', 2).fixed).toBe(false)
  })

  it('leaves a possessive the tables lack fixed, with that reason', () => {
    const fixedPoss = sentences.flatMap(s => s.dials.filter(d => d.role === 'possessive' && d.fixed))
    expect(fixedPoss.length).toBeGreaterThan(0)
    for (const d of fixedPoss) expect(possessivesFile.rows.some(r => foldKey(r.word) === foldKey(d.right)), d.right).toBe(false)
  })

  it('makes the "with" preposition a dial, guarded by the English including its small words', () => {
    const noMeaning = sentences.flatMap(s => s.dials.filter(d => d.role === 'preposition' && cardsOf(d.right).length === 0).map(d => ({ s, d })))
    expect(noMeaning.length).toBeGreaterThanOrEqual(7)
    for (const { s, d } of noMeaning) {
      if (d.fixed) continue
      const eng = new Set(rawWords(s.english))
      for (const o of wrongOf(d)) for (const c of cardsOf(o)) expect(rawWords(c.english).some(w => eng.has(w)), `${s.id} option ${o} (${c.english})`).toBe(false)
    }
    expect(noMeaning.filter(x => !x.d.fixed).length).toBeGreaterThanOrEqual(7)
  })
})

describe('second look: findings 2, 4 and 8', () => {
  it('finding 2: the state test reads the clause of the dial, so "She is running, for she is late." is judged on "she is late"', () => {
    const b = bankOf('ch26-ex4-7')
    expect(clauseEnglish(b.english, b.words, b.roles, 4)).not.toMatch(/running/)
    expect(clauseEnglish(b.english, b.words, b.roles, 0)).toMatch(/running/)
    expect(stateEnglish(clauseEnglish(b.english, b.words, b.roles, 4))).toBe(true)
    expect(stateEnglish(clauseEnglish(b.english, b.words, b.roles, 0))).toBe(false)
    const d = dialAt('ch26-ex4-7', 4)
    expect(d.fixed).toBe(false)
    expect(tenseByKey.get(tableKey(d.right)).tense).toBe('present')
    for (const o of wrongOf(d)) expect(tenseByKey.get(tableKey(o)).tense, o).not.toBe('perfect')
  })

  it('finding 2: a sentence whose clause counts disagree falls back to the whole English', () => {
    expect(clauseEnglish('Siale is tired and sleeping.', ['a', 'b'], [null, null], 1)).toBe('Siale is tired and sleeping.')
  })

  it('finding 4: the general "one" pronoun is keyed on the right pronoun\'s person (ch26-ex4-4, ch30-ex2-1, ch34-ex2-7)', () => {
    for (const [id, index] of [['ch26-ex4-4', 2], ['ch30-ex2-1', 2], ['ch34-ex2-7', 4]]) {
      const d = dialAt(id, index)
      expect(d.fixed, id).toBe(false)
      for (const o of wrongOf(d)) expect(isGeneralOne(pronounByKey.get(tableKey(o))), `${id} option ${o}`).toBe(false)
    }
  })

  it('finding 4: no live pronoun dial whose right word is a first or second person pronoun has the general "one" as a wrong option', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun')) {
      const row = pronounByKey.get(tableKey(d.right))
      if (!row || isGeneralOne(row) || (row.person !== 1 && row.person !== 2)) continue
      n++
      for (const o of wrongOf(d)) expect(isGeneralOne(pronounByKey.get(tableKey(o))), `${s.id} option ${o}`).toBe(false)
    }
    expect(n).toBeGreaterThan(80)
  })

  it('finding 8a: the question word of ch6-ex2-7 is not offered on ch42-ex2-6 #4, and the drop is read from the bank', () => {
    const entry = DROPPED_OPTIONS['ch42-ex2-6#3']
    expect(entry.length).toBe(1)
    const dropped = foldKey(bankOf(entry[0].sentence).words[entry[0].word])
    expect(bankOf(entry[0].sentence).roles[entry[0].word]).toBe('question word')
    const d = dialAt('ch42-ex2-6', 3)
    expect(d.fixed).toBe(false)
    expect(d.options.length).toBeGreaterThan(1)
    for (const o of d.options) expect(foldKey(o), o).not.toBe(dropped)
  })

  it('finding 8b: a word-final macron the book treats as the definitive accent counts as accented (ch40-ex2-5 #4)', () => {
    const d = dialAt('ch40-ex2-5', 3)
    expect(hasAcute(d.right)).toBe(false)
    expect(hasAccent(d.right, 'noun')).toBe(true)
    if (d.fixed) return // a fixed dial is also acceptable: no invented form
    for (const o of wrongOf(d)) expect(hasAccent(o, 'noun'), o).toBe(true)
  })

  it('finding 8b: a lexical final macron with no bare twin of the same role is not an accent', () => {
    const lexical = bank.sentences.flatMap(e => e.words.map((w, i) => [e.roles[i], w]))
      .find(([role, w]) => role === 'noun' && /[aeiou]\u0304$/.test(foldKey(w).normalize('NFD')) && !hasAccent(w, role))
    expect(lexical).toBeTruthy()
  })
})

// ---------------------------------------------------------------- Lessons 2-52 findings (Step 8)
// (reviews/sentence-lock-2026-10-27/Judge-Dials-All.md, "The merged fix list for Step 8"). Each test fails on dials.json as it
// was before this step. Rows are named by sentence id and the 0-based index of the word; no Tongan is typed.

const tenseDial = id => sentenceOf(id).dials.find(d => d.role === 'tense marker')
const keysOfForms = list => new Set(list.map(w => tableKey(w)))
const beforePronoun = keysOfForms(tablesFile.tenseForms.beforePronoun)
const elsewhere = keysOfForms(tablesFile.tenseForms.elsewhere)
const tenseKinds = d => wrongOf(d).map(o => tenseByKey.get(tableKey(o)).tense)

describe('item 1: ē is never a wrong option where the right word is ʻeni or ʻena', () => {
  const never = foldKey(equivalentsFile.oneWay.never.word)
  const rights = new Set(equivalentsFile.oneWay.whenRightIs.map(x => foldKey(x.word)))
  it('reads the rule from the vocabulary by id (ē against ʻeni and ʻena)', () => {
    expect(rights.size).toBe(2)
    expect(vocabulary.find(v => v.id === equivalentsFile.oneWay.never.source).part_of_speech).toBe('demonstrative')
    for (const x of equivalentsFile.oneWay.whenRightIs) expect(vocabulary.find(v => v.id === x.source).part_of_speech).toBe('demonstrative')
  })
  it('ch12-ex2-1, ch12-ex2-4 and ch16-ex2-7 no longer offer it, and keep a fair wrong option', () => {
    for (const [id, index] of [['ch12-ex2-1', 3], ['ch12-ex2-4', 5], ['ch16-ex2-7', 4]]) {
      const d = dialAt(id, index)
      expect(d.role, id).toBe('demonstrative')
      expect(rights.has(foldKey(d.right)), id).toBe(true)
      expect(d.fixed, id).toBe(false)
      expect(d.options.some(o => foldKey(o) === never), id).toBe(false)
    }
  })
  it('on every live dial, ē is not a wrong option beside a right ʻeni or ʻena, and it stays a fair wrong option the other way', () => {
    let n = 0
    let reverse = 0
    for (const { s, d } of liveDials) {
      if (rights.has(foldKey(d.right))) { n++; expect(wrongOf(d).some(o => foldKey(o) === never), `${s.id} #${d.index}`).toBe(false) }
      if (foldKey(d.right) === never && wrongOf(d).some(o => rights.has(foldKey(o)))) reverse++
    }
    expect(n).toBeGreaterThanOrEqual(3)
    expect(reverse).toBeGreaterThan(0)
  })
})

describe('item 2: a tense marker option takes the form the book prints in that slot', () => {
  it('reads the forms from Lesson 15 line 77: two stand before a pronoun, two everywhere else', () => {
    expect(tablesFile.tenseForms.beforePronoun.length).toBe(2)
    expect(tablesFile.tenseForms.elsewhere.length).toBe(2)
    for (const w of [...tablesFile.tenseForms.beforePronoun, ...tablesFile.tenseForms.elsewhere]) expect(tenseByKey.has(tableKey(w)), w).toBe(true)
  })
  it('ch31-ex2-1 and ch35-ex6-2 (no pronoun follows) no longer offer a before-pronoun form', () => {
    for (const id of ['ch31-ex2-1', 'ch35-ex6-2']) {
      const d = tenseDial(id)
      expect(sentenceOf(id).dials[d.index + 1].role, id).not.toBe('pronoun')
      for (const o of wrongOf(d)) expect(beforePronoun.has(tableKey(o)), `${id} option ${o}`).toBe(false)
    }
  })
  it('ch29-ex5-5, ch32-ex3-2 and ch32-ex3-3 (a pronoun follows) no longer offer an everywhere-else form', () => {
    for (const id of ['ch29-ex5-5', 'ch32-ex3-2', 'ch32-ex3-3']) {
      const d = tenseDial(id)
      expect(sentenceOf(id).dials[d.index + 1].role, id).toBe('pronoun')
      for (const o of wrongOf(d)) expect(elsewhere.has(tableKey(o)), `${id} option ${o}`).toBe(false)
    }
  })
  it('on every live tense dial the wrong options use the form of their slot, and the two forms of one tense never meet', () => {
    let before = 0
    let other = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'tense marker')) {
      const nextIsPronoun = s.dials[d.index + 1]?.role === 'pronoun'
      for (const o of wrongOf(d)) {
        const k = tableKey(o)
        if (beforePronoun.has(k)) { expect(nextIsPronoun, `${s.id} #${d.index} option ${o}`).toBe(true); before++ }
        if (elsewhere.has(k)) { expect(nextIsPronoun, `${s.id} #${d.index} option ${o}`).toBe(false); other++ }
      }
      const kinds = tenseKinds(d)
      expect(new Set(kinds).size, `${s.id} #${d.index}`).toBe(kinds.length)
    }
    expect(before).toBeGreaterThan(30)
    expect(other).toBeGreaterThan(100)
  })
})

describe('item 3: R2a reads the Tongan side of a state', () => {
  const rows = [['ch7-ex5-5', 0], ['ch29-ex3-2', 0], ['ch29-ex3-3', 0], ['ch29-ex3-5', 0], ['ch29-ex5-4', 0], ['ch34-ex2-5', 2], ['ch23-ex2-2', 0], ['ch23-ex2-6', 0],
    ['ch23-ex2-1', 0], ['ch23-ex2-3', 0], ['ch23-ex2-4', 0], ['ch23-ex2-5', 0], ['ch26-ex4-5', 0]]
  const meaningsOf = w => cardsOf(w).map(c => c.english)
  const state = id => {
    const b = bankOf(id)
    const i = b.roles.indexOf('tense marker')
    return tongueState(b.words, b.roles, i, tablesFile.stateWords, meaningsOf)
  }
  it('reads the state words from the vocabulary by id', () => {
    for (const x of [...tablesFile.stateWords.skip, ...tablesFile.stateWords.state]) expect(x.word.length, x.source).toBeGreaterThan(0)
    expect(tablesFile.stateWords.pair.words.length).toBe(2)
    expect(vocabulary.find(v => v.id === tablesFile.stateWords.pair.source).tongan.split(' ')).toEqual(tablesFile.stateWords.pair.words)
  })
  it('names a tense marker followed by the existential pair, totonu, pau or a "be ..." word a state, also after the negative and ke', () => {
    for (const [id] of rows) expect(state(id), id).toBe(true)
    expect(stateEnglish(sentenceOf('ch29-ex3-2').english)).toBe(false)
    expect(state('ch1-ex2-1')).toBe(false)
  })
  it('the nine named rows (and their kin) offer no present or perfect marker beside the right one', () => {
    for (const [id, index] of rows) {
      const d = dialAt(id, index)
      expect(d.role, id).toBe('tense marker')
      expect(['present', 'perfect'], id).toContain(tenseByKey.get(tableKey(d.right)).tense)
      expect(tenseKinds(d), id).not.toContain('present')
      expect(tenseKinds(d), id).not.toContain('perfect')
    }
  })
  it('holds for every tense dial with a present or perfect right marker and a Tongan state', () => {
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'tense marker')) {
      const t = tenseByKey.get(tableKey(d.right)).tense
      if (t !== 'present' && t !== 'perfect') continue
      const b = bankOf(s.id)
      if (!tongueState(b.words, b.roles, d.index, tablesFile.stateWords, meaningsOf)) continue
      n++
      expect(tenseKinds(d).some(k => k === 'present' || k === 'perfect'), `${s.id} #${d.index}`).toBe(false)
    }
    expect(n).toBeGreaterThan(15)
  })
})

describe('item 4: ch9-ex6-2 #1 offers no present marker', () => {
  it('drops it through DROPPED_OPTIONS, copied from the bank', () => {
    const entry = DROPPED_OPTIONS['ch9-ex6-2#0']
    expect(entry.length).toBe(1)
    const word = bankOf(entry[0].sentence).words[entry[0].word]
    expect(bankOf(entry[0].sentence).roles[entry[0].word]).toBe('tense marker')
    expect(tenseByKey.get(tableKey(word)).tense).toBe('present')
    const d = dialAt('ch9-ex6-2', 0)
    expect(d.fixed).toBe(false)
    expect(d.options.length).toBeGreaterThan(1)
    expect(tenseKinds(d)).not.toContain('present')
    for (const o of d.options) expect(foldKey(o)).not.toBe(foldKey(word))
  })
})

describe('item 5: English with a number and no "the" keeps ha and e off each other', () => {
  it('reads "Five children." as a/some English and "the five children" as not', () => {
    expect(aSomeEnglish('Five children.')).toBe(true)
    expect(aSomeEnglish('The five children.')).toBe(false)
    expect(aSomeEnglish('Where are the books?')).toBe(false)
    expect(aSomeEnglish('Bring a basket.')).toBe(true)
  })
  it('ch20-ex5-1 #2 does not offer the other article of the pair', () => {
    const d = dialAt('ch20-ex5-1', 1)
    expect(d.role).toBe('article')
    expect(d.fixed).toBe(false)
    for (const o of wrongOf(d)) {
      const pair = (a, b) => sameKey(equivalentsFile.aSome.a.word, a) && sameKey(equivalentsFile.aSome.b.word, b) || sameKey(equivalentsFile.aSome.a.word, b) && sameKey(equivalentsFile.aSome.b.word, a)
      expect(pair(d.right, o), o).toBe(false)
    }
  })
  it('on every article dial with a number and no "the" before an unaccented noun, the pair never meets', () => {
    const NUMBER = /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|hundred)\b/i
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'article')) {
      if (!NUMBER.test(s.english) || /\bthe\b/i.test(s.english) || /\b(a|an|some)\b/i.test(s.english)) continue
      if (s.words.some((w, j) => j > d.index && s.dials[j].role === 'noun' && hasAcute(w))) continue
      n++
      for (const o of wrongOf(d)) {
        const pair = sameKey(equivalentsFile.aSome.a.word, d.right) && sameKey(equivalentsFile.aSome.b.word, o) || sameKey(equivalentsFile.aSome.a.word, o) && sameKey(equivalentsFile.aSome.b.word, d.right)
        expect(pair, `${s.id} #${d.index} option ${o}`).toBe(false)
      }
    }
    expect(n).toBeGreaterThan(0)
  })
})

describe('item 6: the verb for "finished" and the one for "arrive, manage" are not wrong for each other', () => {
  it('ch47-ex3-5 #3 does not offer the paired verb, and the pair is in equivalents.json by vocabulary id', () => {
    const d = dialAt('ch47-ex3-5', 2)
    expect(d.role).toBe('verb')
    expect(d.fixed).toBe(false)
    const pairs = equivalentsFile.sameMeaning.filter(p => sameKey(p.a.word, d.right) || sameKey(p.b.word, d.right))
    expect(pairs.length).toBeGreaterThan(0)
    for (const p of pairs) {
      const other = sameKey(p.a.word, d.right) ? p.b.word : p.a.word
      expect(d.options.some(o => sameKey(o, other)), other).toBe(false)
    }
    expect(pairs.some(p => vocabulary.find(v => v.id === p.a.source)?.part_of_speech === 'verb' && vocabulary.find(v => v.id === p.b.source)?.part_of_speech === 'verb')).toBe(true)
  })
})

describe('item 7: placed words that can become fair dials', () => {
  const rowOf = w => possessivesFile.rows.find(r => foldKey(r.word) === foldKey(w))
  const kindRows = kind => possessivesFile.rows.filter(r => r.kind === kind)

  it('reads the five possessive tables from the book, by kind', () => {
    expect(kindRows('plain').length).toBe(14)
    expect(kindRows('indefinite').length).toBe(14)
    expect(kindRows('postposed').length).toBe(22)
    expect(kindRows('postposed-short').length).toBe(6)
    expect(kindRows('emotional').length).toBe(10)
    expect(new Set(possessivesFile.rows.map(r => foldKey(r.word))).size).toBe(possessivesFile.rows.length)
  })

  it('the file is what the committed book gives now', async () => {
    const { allPossessives } = await import('./local-data.mjs')
    let rows = null
    try { rows = allPossessives() } catch { return } // no git checkout of the book here
    expect(rows).toEqual(possessivesFile.rows)
  })

  it('emotional possessives: the pity words are not in the meaning, and the two without a class are left out', () => {
    for (const r of kindRows('emotional')) expect(r.meaning, r.word).not.toMatch(/poor|dear/i)
    expect(kindRows('emotional').every(r => r.class === 'e' || r.class === 'ho')).toBe(true)
    expect(kindRows('emotional').some(r => r.source.endsWith('line 181') || r.source.endsWith('line 188'))).toBe(false)
  })

  it('ch52-ex2-4 #3 and ch52-ex2-5 #3 are live, with options of their own kind, class and another person; the one not in the table stays fixed', () => {
    for (const [id, index] of [['ch52-ex2-4', 2], ['ch52-ex2-5', 2]]) {
      const d = dialAt(id, index)
      expect(d.role, id).toBe('possessive')
      expect(d.fixed, id).toBe(false)
      const right = rowOf(d.right)
      expect(right.kind, id).toBe('emotional')
      for (const o of wrongOf(d)) { const r = rowOf(o); expect([r.kind, r.class], o).toEqual([right.kind, right.class]); expect(r.person, o).not.toBe(right.person) }
    }
    expect(dialAt('ch52-ex2-3', 2).fixed).toBe(true)
  })

  it('the nine indefinite and postposed possessives named by the judge are live', () => {
    for (const [id, index] of [['ch29-ex3-2', 5], ['ch29-ex3-3', 3], ['ch29-ex3-5', 5], ['ch29-ex5-4', 5], ['ch39-ex5-4', 1], ['ch37-ex2-3', 1], ['ch37-ex2-4', 2], ['ch37-ex2-6', 4], ['ch37-ex2-8', 4]]) {
      const d = dialAt(id, index)
      expect(d.role, id).toBe('possessive')
      expect(d.fixed, `${id} #${index}`).toBe(false)
      const right = rowOf(d.right)
      expect(['indefinite', 'postposed', 'postposed-short'], id).toContain(right.kind)
      for (const o of wrongOf(d)) {
        const r = rowOf(o)
        expect(r.kind, `${id} option ${o}`).toBe(right.kind)
        expect(r.class, `${id} option ${o}`).toBe(right.class)
        expect(r.person, `${id} option ${o}`).not.toBe(right.person)
      }
    }
  })

  it('the long and short forms of one person are one word, and a dual is the same person as its plural', () => {
    const short = kindRows('postposed-short')
    for (const r of short) {
      const long = kindRows('postposed').find(x => x.number === 'singular' && x.class === r.class && x.person === r.person)
      expect(long, r.word).toBeTruthy()
      expect(long.word.slice(2), r.word).toBe(r.word)
    }
    // ch37-ex2-8 #5: the right word is first person plural exclusive; its dual twin is never offered
    const d = dialAt('ch37-ex2-8', 4)
    const right = rowOf(d.right)
    expect([right.person, right.number, right.inclusive]).toEqual([1, 'plural', false])
    for (const o of wrongOf(d)) expect(rowOf(o).person).not.toBe(1)
    // the short-form dial offers short forms only
    const sd = dialAt('ch37-ex2-4', 2)
    expect(rowOf(sd.right).kind).toBe('postposed-short')
    for (const o of sd.options) expect(rowOf(o).kind).toBe('postposed-short')
  })

  it('kinautolu is a third person plural row of the pronoun table, with no dual option', () => {
    expect(tablesFile.pronouns.length).toBe(1)
    const row = bank.pronounTable.find(r => tableKey(r.word) === tableKey(tablesFile.pronouns[0].word))
    expect([row.person, row.number, row.inclusive]).toEqual([3, 'plural', null])
    const d = dialAt('ch19-ex4-3', 3)
    expect(d.role).toBe('pronoun')
    for (const o of wrongOf(d)) { const r = pronounByKey.get(tableKey(o)); expect(r.person, o).not.toBe(3); expect(r.number, o).not.toBe('dual') }
  })

  it('a postposed pronoun dial never offers a clitic pronoun, so ch19-ex4-3 #3 stays fixed (Step 8 second look)', () => {
    const word = tablesFile.pronouns[0].word
    const clitics = new Set(bank.pronounTable.map(r => tableKey(r.word)))
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun' && tableKey(x.d.right) === tableKey(word))) {
      for (const o of wrongOf(d)) expect(clitics.has(tableKey(o)), `${s.id} #${d.index} offers ${o}`).toBe(false)
    }
    expect(dialAt('ch19-ex4-3', 3).fixed).toBe(true)
  })

  it('it is offered only in a slot after a verb or a preposition, never in a subject slot', () => {
    const word = tablesFile.pronouns[0].word
    let n = 0
    for (const { s, d } of liveDials.filter(x => x.d.role === 'pronoun')) {
      if (!d.options.some(o => tableKey(o) === tableKey(word)) || tableKey(d.right) === tableKey(word)) continue
      n++
      expect(['verb', 'preposition'], `${s.id} #${d.index}`).toContain(s.dials[d.index - 1]?.role)
    }
    expect(n).toBeGreaterThanOrEqual(0)
  })

  it('the table meanings (aspect markers and the noun of Lesson 22 line 55) make their dials live, for their own role only', () => {
    expect(tablesFile.meanings.length).toBeGreaterThanOrEqual(8)
    for (const [id, index] of [['ch22-ex2-3', 2], ['ch22-ex2-4', 1], ['ch24-ex2-3', 5], ['ch22-ex2-7', 1], ['ch22-ex2-5', 5]]) {
      const d = dialAt(id, index)
      expect(d.fixed, `${id} #${index}`).toBe(false)
      expect(d.options.length, `${id} #${index}`).toBeGreaterThanOrEqual(2)
    }
    // the same spelling in another role gets no meaning: the conjunction and the verb of those spellings stay fixed or unoffered
    const aspectWords = new Set(tablesFile.meanings.filter(m => m.role === 'aspect marker').map(m => foldKey(m.word)))
    const nounWords = new Set(tablesFile.meanings.filter(m => m.role === 'noun').map(m => foldKey(m.word)))
    for (const { s, d } of liveDials) {
      for (const o of d.options) {
        const k = foldKey(o)
        if (cardsOf(o).length && tableMeaningRole.has(lookupKey(k))) expect(tableMeaningRole.get(lookupKey(k)) === d.role, `${s.id} #${d.index} option ${o}`).toBe(true)
        if (aspectWords.has(k) && !vocabulary.some(v => foldKey(v.tongan) === k)) expect(d.role, `${s.id} #${d.index} option ${o}`).toBe('aspect marker')
        if (nounWords.has(k) && !vocabulary.some(v => foldKey(v.tongan) === k)) expect(d.role, `${s.id} #${d.index} option ${o}`).toBe('noun')
      }
    }
  })

  it('the aspect markers glossed "still" and "currently" are not wrong for each other', () => {
    const d = dialAt('ch22-ex2-3', 2)
    const pair = equivalentsFile.sameMeaning.find(p => sameKey(p.a.word, d.right) || sameKey(p.b.word, d.right))
    expect(pair).toBeTruthy()
    const other = sameKey(pair.a.word, d.right) ? pair.b.word : pair.a.word
    expect(d.options.some(o => sameKey(o, other))).toBe(false)
  })

  it('the rules in dials.json name the new tables', () => {
    expect(dialsFile.rules.find(r => r.id === 'R2j').what).toMatch(/Lesson 29/)
    expect(dialsFile.rules.find(r => r.id === 'R2j').what).toMatch(/Lesson 52/)
    expect(dialsFile.rules.find(r => r.id === 'R2a').what).toMatch(/Tongan/)
    expect(dialsFile.rules.find(r => r.id === 'R3').what).toMatch(/Ch 15:77/)
  })
})
