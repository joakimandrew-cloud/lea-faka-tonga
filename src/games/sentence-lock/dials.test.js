import fs from 'node:fs'
import { describe, it, expect } from 'vitest'
import dialsFile from './dials.json'
import possessivesFile from './possessives.json'
import equivalentsFile from './equivalents.json'
import {
  buildDials, dialsToJson, loadSources, RULES, VOCAB_TYPES, NO_CARD_ROLES, MAX_WRONG,
  bare, trailOf, hasAcute, foldKey, tableKey, vowelCount, shown, englishMarks, couldBeSubject,
  lookupKey, stateEnglish, clauseEnglish, accentTesterFor, DROPPED_OPTIONS, progressiveEnglish, directionCue, isGeneralOne, aSomeEnglish, rawWords,
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
const cardsOf = w => cardsByKey.get(lookupKey(foldKey(w))) ?? []
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
        expect(cardsOf(o).length, `${s.id} #${d.index} ${o}`).toBeGreaterThan(0)
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
    for (const p of [...equivalentsFile.sameMeaning.flatMap(x => [x.a, x.b]), equivalentsFile.aSome.a, equivalentsFile.aSome.b]) {
      expect(vocabulary.find(v => v.id === p.source)?.tongan, p.source).toBe(p.word)
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
    expect(possessivesFile.rows.length).toBe(14)
    expect(new Set(possessivesFile.rows.map(r => r.class))).toEqual(new Set(['e', 'ho']))
    const chapter = `${ROOT}/book/Chapter-17.md`
    if (fs.existsSync(chapter)) {
      const text = fs.readFileSync(chapter, 'utf8').split('\n').slice(36, 80).join('\n')
      for (const r of possessivesFile.rows) expect(text.includes(`*${r.word}*`), r.word).toBe(true)
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
        expect(row.class, `${s.id} option ${o}`).toBe(right.class)
        expect(row.person, `${s.id} option ${o}`).not.toBe(right.person)
      }
    }
    expect(dialAt('ch17-ex4-1', 2).fixed).toBe(false)
  })

  it('leaves a possessive the tables lack fixed, with that reason', () => {
    const fixedPoss = sentences.flatMap(s => s.dials.filter(d => d.role === 'possessive' && d.fixed))
    expect(fixedPoss.length).toBeGreaterThan(5)
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
