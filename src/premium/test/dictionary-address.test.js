import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { DICTIONARY_GROUPS } from '../lib/course-dictionary.js'
import { readSearchAddress, searchAddress, searchAddressHash } from '../lib/dictionary-address.js'

// The dictionary's search lives in the fragment of the address and never in
// the query string (plan 2026-11-18-dictionary-search-and-word-pages). The
// site's analytics script sends location.search with every count; nothing a
// visitor types may be in it. The flows in a real browser (type, open a
// result, Back, reload) are recorded by counts.mjs in the plan's scratch
// folder; these tests hold the parts a unit test can see.

const source = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8')
const code = file => source(file).split('\n').filter(line => !/^\s*(?:\/\/|\*|\/\*|\{\/\*)/.test(line)).join('\n')

test('a search and a letter are written to the fragment, and read back as typed', () => {
  assert.equal(searchAddressHash('faifekau'), '#q=faifekau')
  assert.equal(searchAddressHash('', 'ng'), '#letter=ng')
  assert.equal(searchAddressHash('', ''), '')
  assert.equal(searchAddressHash('   ', ''), '', 'a box holding only spaces is no search')
  assert.equal(searchAddressHash('ulu', 'ng'), '#q=ulu', 'a search outranks a letter')
  assert.equal(searchAddress('malo lelei'), '/dictionary#q=malo+lelei')
  // Queries as people type them, real rows and the marks of real rows among them.
  for (const typed of ['faifekau', 'malo lelei', 'mālō e lelei', "'ulu", 'ʻulu', 'sit down in tongan', 'to eat', 'a&b=c#d?e', '100% + more', ' ulu ']) {
    const hash = searchAddressHash(typed)
    assert.match(hash, /^#q=[^#?&\s]*$/, `${typed} is one fragment value`)
    assert.deepEqual(readSearchAddress(hash, DICTIONARY_GROUPS), { q: typed, letter: '' }, `${typed} comes back as typed`)
  }
  for (const letter of DICTIONARY_GROUPS) {
    assert.deepEqual(readSearchAddress(searchAddressHash('', letter), DICTIONARY_GROUPS), { q: '', letter })
  }
})

test('an address with no search in its fragment opens the plain dictionary', () => {
  const none = { q: '', letter: '' }
  assert.deepEqual(readSearchAddress('', DICTIONARY_GROUPS), none)
  assert.deepEqual(readSearchAddress('#', DICTIONARY_GROUPS), none)
  assert.deepEqual(readSearchAddress('#parts-of-body', DICTIONARY_GROUPS), none, 'an ordinary in-page anchor is not a search')
  assert.deepEqual(readSearchAddress('#letter=x', DICTIONARY_GROUPS), none, 'an unknown letter is ignored')
  assert.deepEqual(readSearchAddress('#other=1', DICTIONARY_GROUPS), none)
  assert.deepEqual(readSearchAddress('#q=ulu&letter=ng', DICTIONARY_GROUPS), { q: 'ulu', letter: '' })
  // The page hands this helper the fragment and nothing else, so an old-style
  // ?q= address, whose fragment is empty, opens the plain dictionary: the
  // query string is never read and never rewritten.
})

test('no dictionary page reads or writes the query string', () => {
  for (const file of ['../pages/Dictionary.jsx', '../pages/DictionaryWord.jsx', '../pages/DictionaryEnglish.jsx', '../components/DictionaryBits.jsx', '../lib/dictionary-address.js', '../lib/dictionary-data.js']) {
    const text = code(file)
    assert.ok(text.length > 200, `${file} was read`)
    assert.doesNotMatch(text, /useSearchParams|location\.search|[`'"][^`'"\n]*\?(?:q|letter)=/, `${file} keeps the search out of the query string`)
  }
  const page = code('../pages/Dictionary.jsx')
  // The one place the address is written: the current path, no query string, then the fragment.
  const writes = page.match(/history\.(?:replaceState|pushState)\([^\n]*\)/g) || []
  assert.equal(writes.length, 1)
  assert.equal(writes[0], 'history.replaceState(window.history.state, \'\', `${window.location.pathname}${searchAddressHash(nextQuery, nextLetter)}`)')
  assert.doesNotMatch(page, /\bnavigate\(|setSearchParams/)
  // The check bites: the earlier form of the page would have failed it.
  assert.match('const [params, setParams] = useSearchParams()', /useSearchParams|location\.search/)
  assert.match('to={`/dictionary?q=${typed}`}', /[`'"][^`'"\n]*\?(?:q|letter)=/)
})

test('page counts are fired in three places and are given no search text; the one event is the failed search', () => {
  // 1. The script tag: count.js counts the first load by itself, from
  //    location.pathname + location.search (or the canonical link) and q: location.search.
  const shell = source('../../../index.html')
  const tag = shell.match(/<script[^>]*data-goatcounter[^>]*>/s)?.[0] || ''
  assert.match(tag, /data-goatcounter="https:\/\/leafakatonga\.goatcounter\.com\/count"/)
  assert.match(tag, /src="https:\/\/gc\.zgo\.at\/count\.js"/)
  assert.doesNotMatch(tag, /data-goatcounter-settings/, 'no setting changes what the script sends')
  // 2. Route changes: RouteChrome, with the path alone, only when the path changes.
  const chrome = code('../../components/RouteChrome.jsx')
  const calls = chrome.match(/goatcounter[^\n]*/g) || []
  assert.deepEqual(calls, ['goatcounter?.count?.({ path: location.pathname })'])
  assert.match(chrome, /\}, \[location\.pathname\]\)/, 'a change of fragment or query string alone fires no count')
  // 3. The partner redirect at /r/:slug, which counts its own click and is no dictionary route.
  // 4. The one event: a dictionary search that settled and found nothing at all
  //    (DECISIONS.md 2026-11-18, point 5), sent from dictionary-failed-search.js
  //    with a fixed event name, a filtered text and a fixed title. Its rules are
  //    tested in dictionary-failed-search.test.js.
  // Nothing else in the app's source calls the counter.
  const callers = fs.readdirSync(new URL('../..', import.meta.url), { recursive: true })
    .filter(name => /\.(?:jsx?|mjs)$/.test(name) && !/(?:^|\/)test(?:-tools)?\/|\.test\.js$/.test(name))
    .filter(name => /goatcounter/i.test(code(`../../${name}`)))
    .sort()
  assert.deepEqual(callers, ['components/RouteChrome.jsx', 'pages/PartnerRedirect.jsx', 'premium/lib/dictionary-failed-search.js'])
  const event = code('../lib/dictionary-failed-search.js')
  assert.deepEqual(event.match(/counter\.count\([^\n]*\)/g), ['counter.count(event)'], 'one call, with the event failedSearchEvent() built')
  assert.match(event, /return text \? \{ path: `\$\{FAILED_SEARCH_EVENT\}\/\$\{text\}`, title: FAILED_SEARCH_TITLE, event: true \} : null/)
  // The page hands the counter nothing itself: it calls countFailedSearch and no more.
  assert.doesNotMatch(code('../pages/Dictionary.jsx'), /goatcounter/i)
})
