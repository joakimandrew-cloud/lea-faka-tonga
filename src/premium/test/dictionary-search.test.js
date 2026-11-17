import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildDictionary, searchDictionary, searchDictionaryDetailed, SUGGESTION_MIN_LETTERS } from '../lib/course-dictionary.js'
import { compactKey, plainKey, withinOneLetter } from '../lib/dictionary-text.js'
import { buildWordListSearchEntries } from '../lib/word-lists.js'

// The dictionary search forgives how people type (plan 2026-11-18-dictionary-
// search-and-word-pages). Every case names real rows of the data.

const vocabulary = JSON.parse(fs.readFileSync(new URL('../../data/book-vocabulary.json', import.meta.url), 'utf8'))
const wordLists = JSON.parse(fs.readFileSync(new URL('../data/word-lists.json', import.meta.url), 'utf8'))
const entries = [...buildDictionary(vocabulary), ...buildWordListSearchEntries(wordLists)]
const first = query => searchDictionary(entries, query)[0]
const ids = list => list.map(entry => entry.id)

test('a word typed plain finds its row first', () => {
  // book-v0326 faifekau "minister" and book-v0295 fakapikopiko "lazy": two of the
  // words people searched for in November 2026.
  assert.equal(first('faifekau').id, 'book-v0326')
  assert.equal(first('fakapikopiko').id, 'book-v0295')
  assert.equal(first('FAIFEKAU').id, 'book-v0326')
  assert.equal(first('  faifekau ').id, 'book-v0326')
})

test('a marked word typed without macrons or fakauʻa is an exact match', () => {
  // book-v0003 ʻulu "head": typing ulu puts it first, as a match and not a partial.
  const ulu = searchDictionaryDetailed(entries, 'ulu')
  assert.equal(ulu.matches[0].id, 'book-v0003')
  assert.equal(ulu.matches[0].tongan, "'ulu")
  for (const typed of ["'ulu", 'ʻulu', '‘ulu', 'Ulu']) assert.equal(first(typed).id, 'book-v0003', `${typed} finds ʻulu`)
  // book-v0025 mālō e lelei, book-v0510 tēpile, book-v0090 ʻaneafi: macrons and fakauʻa left off.
  assert.equal(first('malo e lelei').id, 'book-v0025')
  assert.equal(first('tepile').id, 'book-v0510')
  assert.equal(first('aneafi').tongan, "'aneafi")
  // Typed with its marks, the marked word comes before its plain twin; typed plain, the plain word does.
  assert.deepEqual(searchDictionary(entries, 'pulū').slice(0, 2).map(entry => entry.tongan), ['pulū', 'pulu'])
  assert.deepEqual(searchDictionary(entries, 'pulu').slice(0, 2).map(entry => entry.tongan), ['pulu', 'pulū'])
  // A hyphen or a space more or less: book-v0397 faka-Tonga, book-v0460 loto lahi.
  assert.equal(first('fakatonga').id, 'book-v0397')
  assert.equal(first('lotolahi').id, 'book-v0460')
  assert.equal(plainKey("faka-Tonga"), 'fakatonga')
  assert.equal(compactKey("loto lahi"), 'lotolahi')
})

test('English matches whole words before look-alikes, and ignores a leading "to"', () => {
  // book-v0132 tahi "sea, ocean" has the word; book-v0255 kumi "search for" only begins with the letters.
  const sea = searchDictionaryDetailed(entries, 'sea')
  assert.ok(ids(sea.matches).includes('book-v0132'), 'tahi is a match for sea')
  assert.ok(ids(sea.partial).includes('book-v0255'), 'kumi (search for) is only a partial')
  assert.equal(ids(sea.matches).includes('book-v0255'), false)
  const flat = ids(searchDictionary(entries, 'sea'))
  assert.ok(flat.indexOf('book-v0132') < flat.indexOf('book-v0255'), 'the whole word ranks above the look-alike')
  // book-v0058 kai "eat": "to eat" and "eat" are the same search.
  assert.equal(first('to eat').id, 'book-v0058')
  assert.deepEqual(ids(searchDictionary(entries, 'to eat')), ids(searchDictionary(entries, 'eat')))
  // book-v0407 fakamamafaʻi "to make heavy, to emphasize": the "to" of the meaning is ignored too.
  assert.equal(first('make heavy').id, 'book-v0407')
  assert.equal(first('emphasize').id, 'book-v0407')
  // A sense that is the whole query comes before a meaning that only has the word in it:
  // book-v0126 fale "house, building" before book-v0145 fale mohe "dormitory" is not at issue,
  // but book-v0061 mohe "sleep" comes before book-v0602 moʻumohea "oversleep, sleep too long".
  const sleep = ids(searchDictionary(entries, 'sleep'))
  assert.ok(sleep.indexOf('book-v0061') >= 0 && sleep.indexOf('book-v0061') < sleep.indexOf('book-v0602'))
  // A bracketed note is not the meaning: "plural" finds nothing by way of "(plural of ʻalu)".
  assert.equal(searchDictionaryDetailed(entries, 'plural').matches.length, 0)
  // One word, another ending: book-v0126 fale "house, building" for "houses".
  assert.equal(first('houses').id, 'book-v0126')
})

test('"hit" presents no row whose meaning only contains those letters', () => {
  // The data has such rows (book-v0453 hinehina "white"), so the case can fail.
  const lookalikes = entries.filter(entry => /hit/i.test(entry.english))
  assert.ok(lookalikes.some(entry => entry.id === 'book-v0453'))
  assert.equal(entries.some(entry => /\bhit\b/i.test(entry.english)), false, 'no row has "hit" as a whole word')
  const hit = searchDictionaryDetailed(entries, 'hit')
  assert.deepEqual(hit.matches, [])
  for (const entry of [...hit.matches, ...hit.partial, ...hit.suggestions]) {
    assert.equal(lookalikes.includes(entry), false, `${entry.tongan} (${entry.english}) is not offered for "hit"`)
  }
  assert.equal(searchDictionary(entries, 'hit').some(entry => lookalikes.includes(entry)), false)
  assert.equal(searchDictionary(entries, 'how to say hit in tongan').length, 0)
})

test('several English words that match nothing as a phrase fall back to their content words', () => {
  // book-v0133 tangutu "sit down".
  assert.equal(first('sit down').id, 'book-v0133')
  const asked = searchDictionaryDetailed(entries, 'sit down in tongan')
  assert.deepEqual(asked.fallback, { words: ['sit', 'down'], phrase: 'sit down' })
  assert.equal(asked.matches[0].id, 'book-v0133')
  // book-v0474 fai mo ke "hurry up and".
  const hurry = searchDictionaryDetailed(entries, 'how to say hurry up in tongan')
  assert.equal(hurry.matches[0].id, 'book-v0474')
  assert.deepEqual(hurry.fallback, { words: ['hurry', 'up'], phrase: 'hurry up' })
  // Content words one by one, the entry with more of them first:
  // book-v0447 ʻuliʻuli "black" and book-v0254 kulī "dog".
  const both = searchDictionaryDetailed(entries, 'black dog')
  assert.deepEqual(both.fallback, { words: ['black', 'dog'], phrase: '' })
  assert.deepEqual(ids(both.matches).sort(), ['book-v0254', 'book-v0447'])
  assert.equal(searchDictionaryDetailed(entries, 'sit down').fallback, null, 'a phrase that matches is not a fallback')
})

test('a one-letter miss of a long word is offered as a near spelling, never matched silently', () => {
  const miss = searchDictionaryDetailed(entries, 'fakapikopika')
  assert.deepEqual(miss.matches, [])
  assert.deepEqual(miss.partial, [])
  assert.deepEqual(ids(miss.suggestions), ['book-v0295'])
  assert.deepEqual(searchDictionary(entries, 'fakapikopika'), [], 'the flat result list never carries a near spelling')
  // Two neighbouring letters swapped, one missing, one extra: book-v0326 faifekau.
  for (const typed of ['faifekua', 'faifeku', 'faifeekau']) assert.deepEqual(ids(searchDictionaryDetailed(entries, typed).suggestions), ['book-v0326'], typed)
  // A found word gets no suggestions; a short query gets none; an English-looking one gets none.
  assert.deepEqual(searchDictionaryDetailed(entries, 'faifekau').suggestions, [])
  assert.equal(SUGGESTION_MIN_LETTERS, 5)
  assert.deepEqual(searchDictionaryDetailed(entries, 'ulx').suggestions, [])
  assert.deepEqual(searchDictionaryDetailed(entries, 'qwerty').suggestions, [])
  // Words the dictionary does not hold stay unfound: nothing is invented for them.
  for (const typed of ['fakahela', 'kasele', 'leimatua', 'fefeka']) {
    const none = searchDictionaryDetailed(entries, typed)
    assert.deepEqual([none.matches.length, none.partial.length], [0, 0], `${typed} is not in the dictionary`)
  }
  assert.equal(withinOneLetter('faifekau', 'faifekau'), true)
  assert.equal(withinOneLetter('faifekau', 'faifekua'), true)
  assert.equal(withinOneLetter('faifekau', 'faifakua'), false)
  assert.equal(withinOneLetter('faifekau', 'faifek'), false)
})

test('results keep their labels and links, and each opens its word page', () => {
  for (const entry of entries) assert.match(entry.wordHref, /^\/dictionary\/[a-z0-9-]+$/, `${entry.id} links to a word page`)
  assert.equal(first('faifekau').href, '/lessons/25', 'the lesson link stays')
  assert.equal(first('faifekau').wordHref, '/dictionary/faifekau')
  // wl-body-058 tui "knee", a word-list word, keeps its label and its section link.
  const tui = searchDictionary(entries, 'knee').find(entry => entry.id === 'wl-body-058')
  assert.equal(tui.label, 'Word list: Parts of body, not taught in the lessons')
  assert.equal(tui.href, '/word-lists#parts-of-body')
  assert.equal(tui.wordHref, '/dictionary/tui')
  assert.equal(searchDictionary(entries, ''), entries, 'no query shows the list as it is')
  assert.equal(searchDictionaryDetailed(entries, '   ').matches, entries)
})
