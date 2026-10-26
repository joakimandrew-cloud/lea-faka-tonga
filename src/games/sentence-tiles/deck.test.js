import { describe, it, expect } from 'vitest'
import exercises from '../../data/book-exercises.json'
import {
  SENTENCES, LESSON_COUNTS, LESSON_MENU, ALL_LESSONS_ID, LEFT_OUT_KEYS, lessonChoice,
  allItems, whyLeftOut, answerText, splitAnswer, tileKey, holdsLeftOut, MIN_WORDS, MAX_WORDS,
} from './deck.js'

// Every Tongan string here is read from book-exercises.json; none is typed.
const byId = new Map(allItems(exercises).map(({ item, chapter }) => [item.id, { item, chapter }]))

describe('Sentence Tiles deck', () => {
  it('keeps 333 of the 411 translate_to_tongan items', () => {
    expect(byId.size).toBe(411)
    expect(SENTENCES.length).toBe(333)
    const why = {}
    for (const { item } of byId.values()) {
      const w = whyLeftOut(item)
      if (w) why[w] = (why[w] ?? 0) + 1
    }
    expect(why).toEqual({ length: 53, 'not one Tongan span': 24, 'prompt note': 1 })
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
        expect(answer.includes(w), `${s.id}: ${w}`).toBe(true)
      }
      expect(`*${s.words.join(' ')}${s.end}*`).toBe(answer.trim().replace(/\s+/g, ' '))
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
