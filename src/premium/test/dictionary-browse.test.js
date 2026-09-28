import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DICTIONARY_GROUPS, dictionaryBrowseKey, browseDictionary, buildDictionary, searchDictionary } from '../lib/course-dictionary.js'

const vocabulary = JSON.parse(fs.readFileSync(new URL('../../data/book-vocabulary.json', import.meta.url), 'utf8'))
const entries = buildDictionary(vocabulary)

test('browsing distinguishes fakauʻa and Ng while accepting stored and keyboard spellings', () => {
  for (const mark of ["'", '‘', '’', 'ʼ', '`', 'ʻ']) assert.equal(dictionaryBrowseKey(`${mark}alu`), 'ʻa')
  assert.equal(dictionaryBrowseKey('-ʻaki'), 'ʻa', 'suffix notation does not hide the first letter')
  assert.equal(dictionaryBrowseKey('ā'), 'a')
  assert.equal(dictionaryBrowseKey('A\u0304'), 'a')
  assert.equal(dictionaryBrowseKey('ʻā'), 'ʻa')
  assert.equal(dictionaryBrowseKey('NGAAHI'), 'ng')
  assert.equal(dictionaryBrowseKey("na'a"), 'n')
  assert.deepEqual(browseDictionary(entries, "'A"), browseDictionary(entries, 'ʻa'))
  for (const vowel of ['a', 'e', 'i', 'o', 'u']) {
    assert.equal(DICTIONARY_GROUPS[DICTIONARY_GROUPS.indexOf(vowel) + 1], `ʻ${vowel}`)
    assert.ok(browseDictionary(entries, `ʻ${vowel}`).every(entry => dictionaryBrowseKey(entry.tongan) === `ʻ${vowel}`))
  }
})

test('the browse groups partition the real course list without losing or changing any entry', () => {
  const before = JSON.stringify(entries)
  const groups = DICTIONARY_GROUPS.map(letter => browseDictionary(entries, letter))
  assert.equal(DICTIONARY_GROUPS.length, 21)
  assert.equal(groups.flat().length, entries.length)
  assert.equal(new Set(groups.flat()).size, entries.length)
  assert.ok(groups.every(group => group.length > 0))
  assert.ok(browseDictionary(entries, 'n').every(entry => !entry.tonganKey.startsWith('ng')))
  assert.ok(browseDictionary(entries, 'a').every(entry => !entry.tonganKey.startsWith("'")))
  assert.equal(browseDictionary(entries, ''), entries)
  assert.equal(JSON.stringify(entries), before)
})

test('English search, accent-tolerant lookup and lesson links remain available', () => {
  assert.ok(searchDictionary(entries, 'sleep').some(entry => entry.tongan === 'mohe'))
  assert.deepEqual(searchDictionary(entries, "'alu"), searchDictionary(entries, 'ʻalu'))
  assert.ok(browseDictionary(entries, 'ng').some(entry => entry.href?.startsWith('/lessons/')))
})
