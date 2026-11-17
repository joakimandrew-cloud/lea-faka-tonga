import test from 'node:test'
import assert from 'node:assert/strict'
import { metaForPath } from '../../seo/meta.js'

const chapters = { 20: { title: 'Numbers and Time' }, 21: { title: 'Some Title' } }

test('/greetings and /alphabet carry the search titles', () => {
  assert.equal(metaForPath('/greetings', { chapters }).title, 'Hello in Tongan: Mālō e lelei, Its Meaning and the Reply | Learn Tongan')
  assert.equal(metaForPath('/alphabet', { chapters }).title, 'Tongan Alphabet: The 17 Letters and How Each One Sounds | Learn Tongan Free')
})

test('Lesson 20 has its override title, other lessons keep the pattern', () => {
  assert.equal(metaForPath('/lessons/20', { chapters }).title, 'Tongan Numbers 1 to 10, Counting and Telling Time | Lesson 20')
  assert.equal(metaForPath('/lessons/21', { chapters }).title, 'Lesson 21: Some Title | Learn Tongan')
})

test('each game page has its own title', () => {
  const home = metaForPath('/', { chapters }).title
  const want = {
    '/games/word-balloons': 'Word Balloons: A Tongan Vocabulary Game',
    '/games/sentence-tiles': 'Sentence Tiles: Put Tongan Sentences in Order',
    '/games/sentence-lock': 'Sentence Lock: Build Tongan Sentences Word by Word',
  }
  for (const [path, start] of Object.entries(want)) {
    const t = metaForPath(path, { chapters }).title
    assert.ok(t.startsWith(start), `${path}: ${t}`)
    assert.notEqual(t, home)
  }
})
