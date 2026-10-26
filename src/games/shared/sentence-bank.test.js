import { describe, it, expect } from 'vitest'
import roleData from '../sentence-tiles/roles.json'
import { SENTENCES } from '../sentence-tiles/deck.js'
import bankFile from './sentence-bank.json'
import { SENTENCE_BANK, BANK_LESSONS, byLesson, lessonsWith, tenseWordsIn } from './sentence-bank.js'
import { buildBank, TENSE_TABLE, PRONOUN_TABLE, RULES, wordKey } from './build-sentence-bank.mjs'
import * as shared from './index.js'

// Every Tongan word here is read from the deck or the book's tables; none is typed.
const TENSES = new Set(['past', 'present', 'future', 'perfect'])

describe('the shared sentence bank', () => {
  it('has one entry for every sentence the deck keeps, in the deck order, and is never empty', () => {
    expect(SENTENCES.length).toBeGreaterThan(0)
    expect(SENTENCE_BANK.map(e => e.id)).toEqual(SENTENCES.map(s => s.id))
    for (const s of SENTENCES) {
      const e = SENTENCE_BANK.find(x => x.id === s.id)
      expect(e.lesson, s.id).toBe(s.chapter)
      expect(e.english, s.id).toBe(s.prompt)
    }
  })

  it('holds no word outside the deck and the roles exactly as roles.json has them', () => {
    for (const s of SENTENCES) {
      const e = SENTENCE_BANK.find(x => x.id === s.id)
      expect(e.words, s.id).toEqual(s.words)
      expect(e.roles, s.id).toEqual(roleData.items[s.id])
    }
  })

  it('puts every tag word at the index it names, and the index in range', () => {
    for (const e of SENTENCE_BANK) {
      for (const tag of [e.tags.tense, e.tags.negation, e.tags.who]) {
        if (!tag) continue
        expect(Number.isInteger(tag.index), e.id).toBe(true)
        expect(tag.index, e.id).toBeGreaterThanOrEqual(0)
        expect(tag.index, e.id).toBeLessThan(e.words.length)
        expect(tag.word, e.id).toBe(e.words[tag.index])
      }
    }
  })

  it('takes each tag word only from a position roles.json labels with that role', () => {
    for (const e of SENTENCE_BANK) {
      const { tense, negation, who } = e.tags
      if (tense) expect(e.roles[tense.index], e.id).toBe('tense marker')
      if (negation) expect(e.roles[negation.index], e.id).toBe('negative')
      if (who) expect(e.roles[who.index], e.id).toBe(who.kind)
      // every position labelled tense marker or negative is accounted for: tagged, or the entry says why not
      const tm = e.roles.filter(r => r === 'tense marker').length
      if (tm && !tense) expect(e.notes.length, e.id).toBeGreaterThan(0)
      if (e.roles.includes('negative')) expect(negation, e.id).toBeTruthy()
      if (!tm) expect(tense, e.id).toBeNull()
      if (!e.roles.includes('negative')) expect(negation, e.id).toBeNull()
    }
  })

  it('maps a tense word and a pronoun only through the book tables, and a noun subject gets no person or number', () => {
    for (const e of SENTENCE_BANK) {
      const { tense, who } = e.tags
      if (tense) {
        const row = TENSE_TABLE.find(r => r.word === wordKey(tense.word))
        expect(row, `${e.id} tense word ${tense.word}`).toBeTruthy()
        expect(tense.tense).toBe(row.tense)
        expect(TENSES.has(tense.tense)).toBe(true)
      }
      if (who && who.kind === 'pronoun') {
        const row = PRONOUN_TABLE.find(r => r.word === wordKey(who.word))
        expect(row, `${e.id} pronoun ${who.word}`).toBeTruthy()
        expect([who.person, who.number, who.inclusive]).toEqual([row.person, row.number, row.inclusive])
      }
      if (who && who.kind !== 'pronoun') expect([who.person, who.number, who.inclusive]).toEqual([null, null, null])
    }
    for (const r of [...TENSE_TABLE, ...PRONOUN_TABLE, ...RULES]) expect(r.source, r.word ?? r.id).toMatch(/Lesson \d+/)
  })

  it('uses every mapping row at least once, or reports the row as unused (and the report is true)', () => {
    const usedTense = new Set()
    const usedPronoun = new Set()
    for (const e of SENTENCE_BANK) {
      if (e.tags.tense) usedTense.add(wordKey(e.tags.tense.word))
      for (const t of e.roles.map((r, i) => (r === 'tense marker' ? wordKey(e.words[i]) : null))) if (t && e.tags.tense) usedTense.add(t)
      if (e.tags.who?.kind === 'pronoun') usedPronoun.add(wordKey(e.tags.who.word))
    }
    const unusedTense = TENSE_TABLE.map(r => r.word).filter(w => !usedTense.has(w))
    const unusedPronoun = PRONOUN_TABLE.map(r => r.word).filter(w => !usedPronoun.has(w))
    expect(bankFile.unusedTenseRows).toEqual(unusedTense)
    expect(bankFile.unusedPronounRows).toEqual(unusedPronoun)
    expect(bankFile.tenseTable).toEqual(TENSE_TABLE)
    expect(bankFile.pronounTable).toEqual(PRONOUN_TABLE)
  })

  it('is exactly what the builder makes from the deck and roles.json today (nothing stale, nothing hand-edited)', () => {
    const fresh = buildBank(SENTENCES.map(s => ({ id: s.id, chapter: s.chapter, prompt: s.prompt, words: [...s.words] })), roleData.items)
    expect(JSON.parse(JSON.stringify(fresh.entries))).toEqual(SENTENCE_BANK)
    expect(JSON.stringify(bankFile)).not.toMatch(/—/)
  })

  it('serves the lessons in order, with the three helpers and the shared index export', () => {
    expect(BANK_LESSONS).toEqual([...new Set(SENTENCES.map(s => s.chapter))].sort((a, b) => a - b))
    expect(byLesson(BANK_LESSONS[0]).length).toBeGreaterThan(0)
    expect(byLesson(BANK_LESSONS[0]).every(e => e.lesson === BANK_LESSONS[0])).toBe(true)
    expect(byLesson(0)).toEqual([])
    for (const tag of ['tense', 'negation', 'who']) {
      const lessons = lessonsWith(tag)
      expect(lessons.length, tag).toBeGreaterThan(0)
      expect([...lessons].sort((a, b) => a - b)).toEqual(lessons)
      for (const n of lessons) expect(byLesson(n).some(e => e.tags[tag])).toBe(true)
    }
    expect(tenseWordsIn(BANK_LESSONS[0]).length).toBeGreaterThan(0)
    expect(shared.SENTENCE_BANK).toBe(SENTENCE_BANK)
    expect(shared.byLesson).toBe(byLesson)
  })
})
