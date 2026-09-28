import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { SENTENCE_PATHS } from '../data/home-sentence-steps.js'

// Check against canonical lessons, not a second copy of the demo strings.
const normalize = text => text.normalize('NFC').replace(/[ʻʼ]/g, "'")
const lesson = num => normalize(fs.readFileSync(new URL(`../../../book/Chapter-${String(num).padStart(2, '0')}.md`, import.meta.url), 'utf8'))

test('every new complete sentence and its English meaning come from its named course lesson', () => {
  for (const path of SENTENCE_PATHS.filter(item => item.source)) {
    const book = lesson(path.source.lesson)
    const end = path.steps.at(-1)
    const sentence = normalize(end.parts.map(part => part.word).join(' ') + '.')
    assert.ok(book.includes(sentence), `${path.id}: complete Tongan sentence missing from Lesson ${path.source.lesson}`)
    assert.ok(book.includes(end.english), `${path.id}: English missing from Lesson ${path.source.lesson}`)
  }
})

test('new intermediate builds only reveal phrases from their complete source example', () => {
  for (const path of SENTENCE_PATHS.filter(item => item.source)) {
    const end = normalize(path.steps.at(-1).parts.map(part => part.word).join(' ')).replace(/,/g, '')
    for (const step of path.steps) {
      const sentence = normalize(step.parts.map(part => part.word).join(' ')).replace(/,/g, '')
      assert.ok(end.startsWith(sentence), `${path.id}: unsupported intermediate phrase`)
      for (const part of step.parts) {
        // Concept links can introduce a construction before the quoted example.
        assert.ok(lesson(part.lesson).includes(normalize(part.referenceWord || part.word).replace(/,$/, '')), `${path.id}: ${part.word} absent from linked Lesson ${part.lesson}`)
      }
    }
  }
})
