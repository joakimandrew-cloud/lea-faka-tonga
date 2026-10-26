import { describe, it, expect } from 'vitest'
import exercises from '../../data/book-exercises.json'
import {
  SENTENCES, LESSON_COUNTS, LESSON_MENU, ALL_LESSONS_ID, LEFT_OUT_KEYS, lessonChoice,
  allItems, whyLeftOut, answerText, splitAnswer, tileKey, holdsLeftOut, MIN_WORDS, MAX_WORDS,
  isStale, capitalFirst, sentenceText, buildSentences,
} from './deck.js'
import staleItems from './stale-items.json'
import secondOrders from './second-orders.json'
import { isNextWord } from './rounds.js'

// Every Tongan string here is read from book-exercises.json; none is typed.
const byId = new Map(allItems(exercises).map(({ item, chapter }) => [item.id, { item, chapter }]))

describe('Sentence Tiles deck', () => {
  it('keeps 270 of the 411 translate_to_tongan items', () => {
    expect(byId.size).toBe(411)
    expect(SENTENCES.length).toBe(270)
    const why = {}
    for (const { item } of byId.values()) {
      const w = whyLeftOut(item)
      if (w) why[w] = (why[w] ?? 0) + 1
    }
    expect(why).toEqual({ length: 53, 'not one Tongan span': 24, 'prompt note': 1, stale: 61 })
  })

  it('leaves the 61 stale items out today, and lets one back in when its text changes', () => {
    const ids = Object.keys(staleItems.items)
    expect(ids.length).toBe(61)
    const kept = new Set(SENTENCES.map(s => s.id))
    for (const id of ids) {
      expect(byId.has(id), id).toBe(true)
      expect(isStale(byId.get(id).item), id).toBe(true)
      expect(whyLeftOut(byId.get(id).item), id).toBe('stale')
      expect(kept.has(id), id).toBe(false)
    }
    // After a data re-sync the text differs: the item is let back in.
    const changed = (id, over) => ({ ...byId.get(id).item, ...over })
    const id = ids.find(i => byId.get(i).item.answer.trim().split(/\s+/).length >= MIN_WORDS + 1) ?? ids[0]
    const src = byId.get(id).item
    expect(isStale(changed(id, { prompt: `${src.prompt} (revised)` }))).toBe(false)
    expect(isStale(changed(id, { answer: src.answer.replace(/\*$/, ' alpha*') }))).toBe(false)
    const data = { 1: [{ type: 'translate_to_tongan', items: [{ id, prompt: `${src.prompt} (revised)`, answer: src.answer }] }] }
    const back = buildSentences(data)
    expect(back.map(s => s.id)).toEqual([id])
  })

  it('keeps only the first copy of a repeated answer', () => {
    const first = new Map()
    for (const s of SENTENCES) {
      const k = s.answer.replace(/[.?!]+$/, '').trim().toLowerCase()
      expect(first.has(k), `${s.id} repeats ${first.get(k)}`).toBe(false)
      first.set(k, s.id)
    }
    const dup = id => ({ id, prompt: 'A prompt.', answer: '*alpha beta gamma.*' })
    const data = { 1: [{ type: 'translate_to_tongan', items: [dup('one')] }], 2: [{ type: 'translate_to_tongan', items: [dup('two')] }] }
    expect(buildSentences(data).map(s => s.id)).toEqual(['one'])
    // the three repeated pairs the judge named: the earlier lesson stays
    const kept = new Set(SENTENCES.map(s => s.id))
    expect(kept.has('ch13-ex2-2')).toBe(false)
    expect(kept.has('ch15-ex6-2')).toBe(false)
    expect(kept.has('ch41-ex3-1')).toBe(false)
  })

  it('lower-cases the first tile, keeps names, and puts the capital back in the answer line', () => {
    for (const s of SENTENCES) {
      const printed = byId.get(s.id).item.answer.replace(/\*/g, '').trim().split(/\s+/)[0]
      expect(s.words[0]).toBe(printed.toLowerCase())
      expect(s.capital).toBe(printed !== printed.toLowerCase())
      expect(s.capital ? capitalFirst(s.words[0]) : s.words[0]).toBe(printed)
      expect(sentenceText(s)).toBe(byId.get(s.id).item.answer.replace(/\*/g, '').trim().replace(/\s+/g, ' '))
    }
    expect(capitalFirst("'abc")).toBe("'Abc")
    expect(capitalFirst('abc')).toBe('Abc')
    expect(splitAnswer('Alpha Beta Gamma?').words).toEqual(['alpha', 'Beta', 'Gamma'])
  })

  it('accepts the second order the judge named for each of seven items, and only those', () => {
    const want = ['ch19-ex4-1', 'ch19-ex4-4', 'ch19-ex4-5', 'ch48-ex3-4', 'ch34-ex2-3', 'ch33-ex2-4', 'ch42-ex2-4']
    expect(Object.keys(secondOrders.orders).sort()).toEqual([...want].sort())
    const more = SENTENCES.filter(s => s.orders.length > 1).map(s => s.id).sort()
    expect(more).toEqual([...want].sort())
    for (const id of want) {
      const s = SENTENCES.find(x => x.id === id)
      expect(s, `${id} is in the deck`).toBeTruthy()
      expect(s.orders.length).toBe(2)
      expect([...s.orders[1]].sort()).toEqual([...s.words].sort())
      // the book's order and the second order are both right at every step
      for (const o of s.orders) {
        for (let n = 0; n < o.length; n++) expect(isNextWord(s, o.slice(0, n), o[n]), `${id} ${n}`).toBe(true)
      }
      // a tile that fits neither order is wrong
      expect(isNextWord(s, [], 'zzz')).toBe(false)
    }
    const at = id => SENTENCES.find(x => x.id === id).orders[1]
    const w = id => SENTENCES.find(x => x.id === id).words
    // Ch 19: the doer and the thing acted on swap (the object's group first)
    for (const id of ['ch19-ex4-1', 'ch19-ex4-4', 'ch48-ex3-4']) {
      expect(at(id).slice(0, 2)).toEqual(w(id).slice(0, 2))
      expect(at(id)[2]).toBe(w(id)[4])
      expect(at(id)[5]).toBe(w(id)[2])
    }
    expect(at('ch19-ex4-5')[2]).toBe(w('ch19-ex4-5')[5])
    // Ch 34: tokua after the verb; Ch 33: the instrument after the object phrase; Ch 20: the adjective after the noun
    expect(at('ch34-ex2-3')[2]).toBe(w('ch34-ex2-3')[0])
    expect(at('ch33-ex2-4')[3]).toBe(w('ch33-ex2-4')[1])
    expect(at('ch42-ex2-4')[2]).toBe(w('ch42-ex2-4')[3])
    expect(at('ch42-ex2-4')[3]).toBe(w('ch42-ex2-4')[2])
    // An item with one order refuses a different first tile
    const plain = SENTENCES.find(x => x.orders.length === 1)
    expect(isNextWord(plain, [], plain.words[1] === plain.words[0] ? 'zzz' : plain.words[1])).toBe(false)
  })

  it('keeps the prompt, id and lesson exactly as the book has them', () => {
    for (const s of SENTENCES) {
      const src = byId.get(s.id)
      expect(src, s.id).toBeTruthy()
      expect(s.prompt).toBe(src.item.prompt)
      expect(s.chapter).toBe(src.chapter)
      expect(s.id.startsWith(`ch${s.chapter}-`)).toBe(true)
    }
  })

  it('makes every tile a piece of its own answer, and the tiles plus the end mark give the answer back', () => {
    for (const s of SENTENCES) {
      const answer = byId.get(s.id).item.answer
      expect(s.words.length).toBeGreaterThanOrEqual(MIN_WORDS)
      expect(s.words.length).toBeLessThanOrEqual(MAX_WORDS)
      for (const w of s.words) {
        expect(w.length).toBeGreaterThan(0)
        expect(answer.toLowerCase().includes(w.toLowerCase()), `${s.id}: ${w}`).toBe(true)
      }
      expect(`*${s.words.join(' ')}${s.end}*`.toLowerCase()).toBe(answer.trim().replace(/\s+/g, ' ').toLowerCase())
      expect(/^[.?!]*$/.test(s.end)).toBe(true)
      expect(/[.?!]$/.test(s.words[s.words.length - 1])).toBe(false)
    }
  })

  it('holds no slash, "or", brackets or second sentence', () => {
    for (const s of SENTENCES) {
      expect(s.answer).not.toMatch(/[/()[\]]/)
      expect(` ${s.answer} `).not.toMatch(/\sor\s/i)
      expect(s.answer).not.toMatch(/[.?!]\s+\S/)
    }
  })

  it('holds no word the games leave out', () => {
    expect(LEFT_OUT_KEYS.size).toBe(3)
    for (const s of SENTENCES) {
      expect(holdsLeftOut(s.words)).toBe(false)
      for (const w of s.words) expect(LEFT_OUT_KEYS.has(tileKey(w))).toBe(false)
    }
    // The test itself: a sentence made of a left-out word is caught.
    const left = [...LEFT_OUT_KEYS][0]
    expect(holdsLeftOut(['alpha', `${left},`, 'beta'])).toBe(true)
  })

  it('applies the rules to made-up items (English placeholders, not Tongan)', () => {
    const item = (answer, extra = {}) => ({ id: 'x', prompt: 'A prompt.', answer, ...extra })
    expect(whyLeftOut(item('*alpha beta gamma.*'))).toBe(null)
    expect(whyLeftOut(item('*alpha beta/gamma delta.*'))).toBe('slash')
    expect(whyLeftOut(item('*alpha or beta gamma.*'))).toBe('or')
    expect(whyLeftOut(item('*alpha (beta) gamma.*'))).toBe('brackets')
    expect(whyLeftOut(item('*alpha beta. Gamma delta.*'))).toBe('more than one sentence')
    expect(whyLeftOut(item('*alpha beta.*'))).toBe('length')
    expect(whyLeftOut(item('*a b c d e f g h i.*'))).toBe('length')
    expect(whyLeftOut(item('*alpha beta gamma.* (or *delta beta gamma.*)'))).toBe('not one Tongan span')
    expect(whyLeftOut(item('*alpha beta gamma.*', { accept: ['*alpha beta gamma*'] }))).toBe(null)
    expect(whyLeftOut(item('*alpha beta gamma.*', { accept: ['*alpha beta gamma.*', '*delta beta gamma.*'] }))).toBe('second answer')
    expect(whyLeftOut(item('*alpha beta gamma.*', { prompt: 'A prompt. > *Preview:* a note.' }))).toBe('prompt note')
    expect(answerText(' *alpha beta* ')).toBe('alpha beta')
    expect(splitAnswer('alpha beta gamma?')).toEqual({ words: ['alpha', 'beta', 'gamma'], end: '?' })
    expect(splitAnswer('alpha, beta gamma')).toEqual({ words: ['alpha,', 'beta', 'gamma'], end: '' })
  })

  it('offers All lessons and Up to Lesson N for every lesson with a sentence', () => {
    const lessons = LESSON_COUNTS.map(([n]) => n)
    expect(lessons.length).toBe(52)
    for (const [, c] of LESSON_COUNTS) expect(c).toBeGreaterThan(0)
    expect(LESSON_MENU[0].id).toBe(ALL_LESSONS_ID)
    expect(LESSON_MENU[0].count).toBe(SENTENCES.length)
    const last = lessons[lessons.length - 1]
    const upTo = LESSON_MENU.slice(1)
    expect(upTo.map(c => c.upTo)).toEqual(lessons.filter(n => n !== last))
    for (const c of upTo) {
      expect(c.label).toBe(`Up to Lesson ${c.upTo}`)
      expect(c.label).not.toMatch(/chapter/i)
      const want = LESSON_COUNTS.filter(([n]) => n <= c.upTo).reduce((a, [, k]) => a + k, 0)
      expect(c.count).toBe(want)
      expect(c.cards.every(s => s.chapter <= c.upTo)).toBe(true)
    }
    expect(lessonChoice('upto:999').id).toBe(ALL_LESSONS_ID)
    expect(lessonChoice('upto:3').upTo).toBe(3)
  })
})
