import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { buildDictionary, searchDictionaryDetailed } from '../lib/course-dictionary.js'
import { buildAdditionSearchEntries, withEnglishKeys } from '../lib/dictionary-additions.js'
import {
  FAILED_SEARCH_EVENT, FAILED_SEARCH_MAX_LENGTH, FAILED_SEARCH_MIN_LENGTH, FAILED_SEARCH_NOTICE, FAILED_SEARCH_SETTLE_MS, FAILED_SEARCH_TITLE,
  countFailedSearch, failedSearchEvent, failedSearchText, foundNothing,
} from '../lib/dictionary-failed-search.js'
import { buildWordListSearchEntries } from '../lib/word-lists.js'

// Counting searches that find nothing (DECISIONS.md 2026-11-18, point 5): one
// GoatCounter event per failed search text, only when the text passes the
// filter, never when the search found anything, never when counting is off.
// What the real script then sends is recorded in a browser by counts.mjs in the
// plan's scratch folder; these tests hold the rules.

const json = file => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'))
const source = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8')
const code = file => source(file).split('\n').filter(line => !/^\s*(?:\/\/|\*|\/\*|\{\/\*)/.test(line)).join('\n')
const entries = withEnglishKeys([
  ...buildDictionary(json('../../data/book-vocabulary.json')),
  ...buildWordListSearchEntries(json('../data/word-lists.json')),
  ...buildAdditionSearchEntries(json('../data/dictionary-additions.json')),
], json('../data/dictionary-english-keys.json'))
const search = typed => searchDictionaryDetailed(entries, typed.trim())

// A window as the page has it: the counter, the address, the browser's store.
function fakeWindow({ counter = true, search: query = '', skipgc = null, filter = () => false } = {}) {
  const sent = []
  return {
    sent,
    goatcounter: counter ? { count: vars => sent.push(vars), filter } : undefined,
    location: { search: query, pathname: '/dictionary', hash: '' },
    localStorage: { getItem: key => (key === 'skipgc' ? skipgc : null) },
  }
}

test('the filter: 2 to 40 characters of letters, marks, spaces, hyphens and apostrophes, no digit and no @', () => {
  assert.deepEqual([FAILED_SEARCH_MIN_LENGTH, FAILED_SEARCH_MAX_LENGTH], [2, 40])
  // Sent as typed, lowercased and trimmed, the spaces inside made single.
  assert.equal(failedSearchText('leimatua'), 'leimatua')
  assert.equal(failedSearchText('  Leimatua  '), 'leimatua')
  assert.equal(failedSearchText('KASELE'), 'kasele')
  assert.equal(failedSearchText('mohe   fisi'), 'mohe fisi')
  assert.equal(failedSearchText('kāsele'), 'kāsele', 'a macron stays')
  assert.equal(failedSearchText('kāsele'), 'kāsele', 'a macron typed as a combining mark is the same text')
  assert.equal(failedSearchText('faka-leimatua'), 'faka-leimatua')
  for (const mark of ["'", '‘', '’', 'ʼ', '`', 'ʻ']) assert.equal(failedSearchText(`tu${mark}akoi`), `tu${mark}akoi`, `the mark ${mark} is allowed`)
  assert.equal(failedSearchText('café olé'), 'café olé', 'an accented letter is a letter')
  // Length, counted in characters.
  assert.equal(failedSearchText('ab'), 'ab')
  assert.equal(failedSearchText('a'), '')
  assert.equal(failedSearchText(' a '), '')
  assert.equal(failedSearchText(''), '')
  assert.equal(failedSearchText(null), '')
  assert.equal(failedSearchText('a'.repeat(40)), 'a'.repeat(40))
  assert.equal(failedSearchText('a'.repeat(41)), '')
  assert.equal(failedSearchText('ā'.repeat(40)), 'ā'.repeat(40), 'a marked letter counts as one character')
  assert.equal(failedSearchText('leimatua '.repeat(6)), '', 'a pasted sentence is too long')
  // A digit or an @ sign anywhere: nothing.
  for (const typed of ['leimatua2', '2 leimatua', 'call 8727019', 'room ٣', 'half ½', 'a@b', 'name@example.com', '@leimatua']) assert.equal(failedSearchText(typed), '', typed)
  // Anything that is not a letter, a mark, a space, a hyphen or an apostrophe: nothing.
  for (const typed of ['what?', 'a.b', 'a/b', 'a,b', 'x=y', 'a+b', 'a_b', '50%', 'a:b', 'tab\\there', '<b>', 'a&b', 'smile 🙂', 'a"b', '(note)', 'a;b', 'a!']) assert.equal(failedSearchText(typed), '', typed)
  // Marks alone are not a word.
  for (const typed of ['--', "''", 'ʻʻ', '- -', "'-"]) assert.equal(failedSearchText(typed), '', typed)
})

test('an event is made only for a search that found nothing at all', () => {
  // leimatua and kasele were searched for and are in no lesson and no list: nothing is found.
  const none = search('leimatua')
  assert.equal(foundNothing(none), true)
  assert.deepEqual(failedSearchEvent('leimatua', none), { path: 'dictionary-search-none/leimatua', title: 'Dictionary search that found nothing', event: true })
  assert.deepEqual(failedSearchEvent('  Leimatua ', search('  Leimatua ')), { path: `${FAILED_SEARCH_EVENT}/leimatua`, title: FAILED_SEARCH_TITLE, event: true })
  // A match (book-v0326 faifekau), a partial (words that begin with "faif"), a longer
  // entry (book-v0025 for "malo lelei"), content words ("black dog"), a near spelling
  // (book-v0295 for "fakapikopika"): each found something, so no event.
  for (const typed of ['faifekau', 'faif', 'malo lelei', 'black dog', 'fakapikopika', 'hi', 'bye', 'fakahela', 'fefeka', 'sit down in tongan']) {
    const found = search(typed)
    assert.equal(foundNothing(found), false, `${typed} found something`)
    assert.equal(failedSearchEvent(typed, found), null, typed)
  }
  assert.ok(search('faif').matches.length === 0 && search('faif').partial.length > 0, 'a partial alone is something found')
  assert.ok(search('fakapikopika').suggestions.length > 0, 'a near spelling alone is something found')
  assert.ok(search('malo lelei').containing.length > 0)
  // Found nothing, but the text does not pass the filter: no event.
  for (const typed of ['leimatua2', '@leimatua', 'leimatua '.repeat(6), 'x', 'what is leimatua?']) {
    assert.equal(foundNothing(search(typed)), true, `${typed} finds nothing`)
    assert.equal(failedSearchEvent(typed, search(typed)), null, typed)
  }
  // An empty box is no search.
  assert.equal(foundNothing(search('')), false)
  assert.equal(foundNothing(null), false)
})

test('the event is sent once per text, and never when counting is absent, off or the address has a query string', () => {
  const win = fakeWindow()
  const sent = new Set()
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win, sent }), true)
  assert.deepEqual(win.sent, [{ path: 'dictionary-search-none/leimatua', title: FAILED_SEARCH_TITLE, event: true }])
  assert.deepEqual(Object.keys(win.sent[0]).sort(), ['event', 'path', 'title'], 'nothing else is handed to the counter')
  // The same text again, however it is typed: nothing more.
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win, sent }), false)
  assert.equal(countFailedSearch(' LEIMATUA ', search(' LEIMATUA '), { win, sent }), false)
  assert.equal(win.sent.length, 1)
  // Another text is another event.
  assert.equal(countFailedSearch('kasele', search('kasele'), { win, sent }), true)
  assert.deepEqual(win.sent.map(vars => vars.path), ['dictionary-search-none/leimatua', 'dictionary-search-none/kasele'])
  // A search that found something, and a text the filter refuses: nothing.
  assert.equal(countFailedSearch('faifekau', search('faifekau'), { win, sent }), false)
  assert.equal(countFailedSearch('leimatua2', search('leimatua2'), { win, sent }), false)
  assert.equal(win.sent.length, 2)

  // No counter on the page (the script blocked or not loaded): nothing, and no error.
  const bare = fakeWindow({ counter: false })
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: bare, sent: new Set() }), false)
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: undefined, sent: new Set() }), false)
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: { goatcounter: {} }, sent: new Set() }), false, 'a counter without count() is no counter')
  // The visitor switched counting off (the script's own switch stores skipgc = t).
  const off = fakeWindow({ skipgc: 't' })
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: off, sent: new Set() }), false)
  assert.deepEqual(off.sent, [])
  // The script's own filter refuses (a preview, a frame, a local address).
  const refused = fakeWindow({ filter: () => 'localhost' })
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: refused, sent: new Set() }), false)
  assert.deepEqual(refused.sent, [])
  // A store that throws (private mode) sends nothing rather than failing the page.
  const broken = fakeWindow()
  broken.localStorage = { getItem: () => { throw new Error('denied') } }
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: broken, sent: new Set() }), false)
  // A hand-made address with a query string: the script would send it with the event, so no event.
  const queried = fakeWindow({ search: '?q=oldstyle' })
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: queried, sent: new Set() }), false)
  assert.deepEqual(queried.sent, [])
  // A text that could not be sent is not marked as sent: it goes once counting is possible.
  const later = new Set()
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: off, sent: later }), false)
  assert.equal(countFailedSearch('leimatua', search('leimatua'), { win: fakeWindow(), sent: later }), true)
})

test('the page settles a search after a second and a half, on blur and on Enter, and says what is counted', () => {
  assert.equal(FAILED_SEARCH_SETTLE_MS, 1500)
  const page = code('../pages/Dictionary.jsx')
  assert.match(page, /window\.setTimeout\(\(\) => countFailedSearch\(query, searchDictionaryDetailed\(SEARCH_ENTRIES, query\.trim\(\)\)\), FAILED_SEARCH_SETTLE_MS\)/)
  assert.match(page, /return \(\) => window\.clearTimeout\(timer\)/, 'typing again starts the wait over')
  assert.match(page, /onBlur=\{\(\) => settle\(query\)\}/)
  assert.match(page, /onKeyDown=\{event => \{ if \(event\.key === 'Enter'\) settle\(query\) \}\}/)
  assert.match(page, /if \(letter \|\| !query\.trim\(\)\) return undefined/, 'a letter of the browse is no search')
  assert.equal((page.match(/countFailedSearch\(/g) || []).length, 2, 'the timer and settle(), nowhere else')
  // The sentence under the search box, as site copy: one sentence, no dash.
  assert.match(page, /<p id="dictionary-search-note" className="dictionary-search-note">\{FAILED_SEARCH_NOTICE\}<\/p>/)
  assert.equal(FAILED_SEARCH_NOTICE, 'When a search finds nothing, what you typed is counted, with no name and no cookie, so that missing words can be added.')
  assert.doesNotMatch(FAILED_SEARCH_NOTICE, /—| - /)
  // The one file that hands typed text to the counter reads the query string only to refuse.
  const lib = code('../lib/dictionary-failed-search.js')
  assert.deepEqual(lib.match(/[^\n]*location[^\n]*/g).map(line => line.trim()), ['if (win.location && win.location.search) return false'])
  assert.doesNotMatch(lib, /document\.|referrer|navigator/, 'it reads nothing else about the visitor')
})
