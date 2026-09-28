import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PREFIXES, SENTENCE_CYCLE } from '../data/home-sentence-cycle.js'

const chapter = number => fs.readFileSync(new URL(`../../../book/Chapter-0${number}.md`, import.meta.url), 'utf8')

test('the landing cycle preserves the course’s tense/pronoun spellings and taught main phrases', () => {
  const tenseLesson = chapter(2)
  const adjectiveLesson = chapter(3)
  for (const prefix of Object.values(PREFIXES).flat()) {
    assert.ok(tenseLesson.includes(prefix), `${prefix}: absent from Chapter 2`)
  }
  for (const { body } of SENTENCE_CYCLE) {
    assert.ok(`${tenseLesson}\n${adjectiveLesson}`.includes(body), `${body}: absent from Chapters 2 and 3`)
  }
  // The complete hungry paradigm is a verbatim course anchor, including the
  // change-of-state meaning of perfect tense with an adjective.
  const hungry = SENTENCE_CYCLE.find(example => example.person === 'I' && example.body === 'fiekaia')
  PREFIXES.I.forEach((prefix, tense) => {
    assert.ok(adjectiveLesson.includes(`${prefix} ${hungry.body}.`))
    assert.ok(adjectiveLesson.includes(hungry.english[tense]))
  })
})
