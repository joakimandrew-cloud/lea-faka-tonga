import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildDictionary, searchDictionary, searchDictionaryDetailed, SUGGESTION_MIN_LETTERS } from '../lib/course-dictionary.js'
import { compactKey, plainKey, withinOneLetter } from '../lib/dictionary-text.js'
import { ADDED_WORD_LABEL, buildAdditionSearchEntries, withEnglishKeys } from '../lib/dictionary-additions.js'
import { buildWordListSearchEntries } from '../lib/word-lists.js'

// The dictionary search forgives how people type (plan 2026-11-18-dictionary-
// search-and-word-pages). Every case names real rows of the data.

const vocabulary = JSON.parse(fs.readFileSync(new URL('../../data/book-vocabulary.json', import.meta.url), 'utf8'))
const wordLists = JSON.parse(fs.readFileSync(new URL('../data/word-lists.json', import.meta.url), 'utf8'))
const additions = JSON.parse(fs.readFileSync(new URL('../data/dictionary-additions.json', import.meta.url), 'utf8'))
const englishKeys = JSON.parse(fs.readFileSync(new URL('../data/dictionary-english-keys.json', import.meta.url), 'utf8'))
// The list the site searches (dictionary-data.js): course words, word-list
// words, added words, with the English search words attached.
const plainEntries = [...buildDictionary(vocabulary), ...buildWordListSearchEntries(wordLists), ...buildAdditionSearchEntries(additions)]
const entries = withEnglishKeys(plainEntries, englishKeys)
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
  // book-v0025 mālō e lelei, book-v0510 tēpile, book-v0091 ʻaneafi: macrons and fakauʻa left off.
  assert.equal(first('malo e lelei').id, 'book-v0025')
  assert.equal(first('tepile').id, 'book-v0510')
  assert.equal(first('aneafi').id, 'book-v0091')
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
  // book-v0407 fakamamafa "to make heavy, to emphasize": the "to" of the meaning is ignored too.
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
  // (fakahela and fefeka were unfound too until they were added on 2026-11-18; see below.)
  for (const typed of ['kasele', 'leimatua']) {
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

test('a several-word query that is a longer entry with a word left out is offered that entry first', () => {
  // book-v0025 mālō e lelei "hello, greetings". "malo lelei" was the most-searched
  // thing the site did not answer; book-v0078 lelei and book-v0217 mālō still follow.
  const hello = searchDictionaryDetailed(entries, 'malo lelei')
  assert.deepEqual(ids(hello.containing), ['book-v0025'])
  assert.deepEqual(hello.containingWords, ['malo', 'lelei'])
  assert.deepEqual(ids(hello.matches), ['book-v0078', 'book-v0217'], 'the single-word rows still follow')
  assert.equal(ids(hello.matches).includes('book-v0025'), false, 'the longer entry is offered, not presented as a match')
  assert.deepEqual(hello.fallback, { words: ['malo', 'lelei'], phrase: '' })
  assert.deepEqual(hello.suggestions, [])
  assert.deepEqual(ids(searchDictionary(entries, 'malo lelei')), ['book-v0025', 'book-v0078', 'book-v0217'], 'offered first in the flat list')
  // The words a question wraps around it are dropped; marks and capitals do not matter.
  for (const typed of ['malo lelei meaning', 'malo lelei translation', 'malo lelei pronunciation', 'malo lelei in english', 'mālō lelei', 'Malo Lelei']) {
    const asked = searchDictionaryDetailed(entries, typed)
    assert.deepEqual(ids(asked.containing), ['book-v0025'], typed)
    assert.deepEqual(asked.containingWords, ['malo', 'lelei'], typed)
    assert.deepEqual(ids(asked.matches), ['book-v0078', 'book-v0217'], typed)
  }
  // book-v0537 mole ke mamaʻo "far from it, not at all" for "mole mamao"; book-v0411 mamaʻo follows.
  const far = searchDictionaryDetailed(entries, 'mole mamao')
  assert.deepEqual(ids(far.containing), ['book-v0537'])
  assert.deepEqual(ids(far.matches), ['book-v0411'])
  assert.equal(first('mole mamao').id, 'book-v0537')
  // Words that are not all in one entry: unchanged. book-v0126 fale, book-v0545 falé, book-v0217 mālō.
  const apart = searchDictionaryDetailed(entries, 'malo fale')
  assert.deepEqual(apart.containing, [])
  assert.deepEqual(apart.containingWords, [])
  assert.deepEqual(ids(apart.matches), ['book-v0126', 'book-v0545', 'book-v0217'])
  assert.deepEqual(apart.fallback, { words: ['malo', 'fale'], phrase: '' })
  // The same words in another order are not that entry.
  assert.deepEqual(searchDictionaryDetailed(entries, 'lelei malo').containing, [])
  // No spelling is guessed: "malo lei lei" stays as it was, the one row for "malo".
  const split = searchDictionaryDetailed(entries, 'malo lei lei')
  assert.deepEqual([ids(split.containing), ids(split.matches), split.suggestions], [[], ['book-v0217'], []])
  // Typed in full the entry is a match, and a match is never also offered as a longer entry.
  const whole = searchDictionaryDetailed(entries, 'malo e lelei')
  assert.deepEqual([whole.matches[0].id, whole.containing.length], ['book-v0025', 0])
  // One word finds mālō and mālō e lelei as matches, as before.
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'malo').matches), ['book-v0217', 'book-v0025'])
  // Content words that are an entry as a phrase (book-v0432 ko ia) are answered by it alone.
  const therefore = searchDictionaryDetailed(entries, 'ko ia meaning')
  assert.deepEqual([ids(therefore.matches), therefore.containing.length, therefore.fallback.phrase], [['book-v0432'], 0, 'ko ia'])
})

test('the added words are found, with their label and no lesson link', () => {
  // add-0001 fakahela and add-0002 fefeka (DECISIONS.md 2026-11-18): searched for, in no lesson.
  const fakahela = searchDictionaryDetailed(entries, 'fakahela')
  assert.deepEqual(ids(fakahela.matches), ['add-0001'])
  assert.deepEqual([fakahela.matches[0].label, fakahela.matches[0].href, fakahela.matches[0].wordHref, fakahela.matches[0].lesson], [ADDED_WORD_LABEL, null, '/dictionary/fakahela', null])
  assert.equal(first('fefeka').id, 'add-0002')
  assert.equal(first('FEFEKA').id, 'add-0002')
  assert.equal(first('fefeka in tongan').id, 'add-0002', 'as it was searched')
  // By meaning: "stiff" and "tiring" find them; for "hard" the course word comes first.
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'stiff').matches), ['add-0002'])
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'tiring').matches), ['add-0001'])
  const hard = ids(searchDictionaryDetailed(entries, 'hard').matches)
  assert.ok(hard.includes('add-0002') && hard.indexOf('book-v0079') < hard.indexOf('add-0002'), 'book-v0079 mālohi stays ahead of the added word')
  // The bracketed note of a meaning is not searched: "physically" finds nothing at all.
  const bracket = searchDictionaryDetailed(entries, 'physically')
  assert.deepEqual([bracket.matches.length, bracket.partial.length, bracket.containing.length, bracket.suggestions.length], [0, 0, 0, 0])
  assert.equal(ids(searchDictionary(entries, 'physical')).includes('add-0002'), false)
  assert.deepEqual(searchDictionaryDetailed(entries, 'hard physically').fallback, { words: ['hard'], phrase: '' }, 'beside a word that is found, the bracket\'s word still finds nothing')
  // One letter off, a near spelling is offered: never matched silently.
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'fakahele').suggestions), ['add-0001'])
})

test('an English search word finds its row as a whole-word match, and the row shows its own meaning', () => {
  // "hi" and "greeting" for book-v0025 mālō e lelei "hello, greetings".
  for (const typed of ['hi', 'Hi', 'hi in tongan', 'how to say hi in tongan', 'how do you say hi in tongan']) {
    const found = searchDictionaryDetailed(entries, typed)
    assert.deepEqual(ids(found.matches), ['book-v0025'], typed)
    assert.equal(found.matches[0].english, 'hello, greetings', 'the displayed meaning is the data\'s own')
    assert.equal(found.matches[0].href, null, 'book-v0025 is a supplemental row, as before')
  }
  // Words that only begin with the letters are still partials, below the match.
  const hi = searchDictionaryDetailed(entries, 'hi')
  assert.ok(hi.partial.length > 0)
  assert.equal(ids(hi.partial).includes('book-v0025'), false)
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'greeting').matches), ['book-v0025'])
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'greetings').matches), ['book-v0025'], 'the meaning\'s own word still matches')
  // "bye" for book-v0002 ʻalu ā "goodbye (to person leaving)" and book-v0035 nofo ā "goodbye (to person staying)".
  const bye = searchDictionaryDetailed(entries, 'bye')
  assert.deepEqual(ids(bye.matches), ['book-v0002', 'book-v0035'])
  assert.deepEqual(bye.matches.map(entry => entry.english), ['goodbye (to person leaving)', 'goodbye (to person staying)'])
  assert.deepEqual(ids(searchDictionaryDetailed(entries, 'goodbye').matches), ['book-v0002', 'book-v0035'])
  // Without the ties these searches find nothing: the case can fail.
  for (const typed of ['hi in tongan', 'bye']) assert.deepEqual(searchDictionaryDetailed(plainEntries, typed).matches, [], typed)
  // Attaching the words copies the rows it touches and changes nothing a row displays.
  const untouched = plainEntries.find(entry => entry.id === 'book-v0025')
  assert.equal(untouched.searchWords, undefined)
  const tiedRow = entries.find(entry => entry.id === 'book-v0025')
  assert.deepEqual(tiedRow.searchWords, ['hi', 'greeting'])
  assert.deepEqual({ ...tiedRow, searchWords: undefined }, { ...untouched, searchWords: undefined })
  assert.equal(entries.filter(entry => entry.searchWords).length, 3)
})
