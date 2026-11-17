import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SearchRow } from '../components/DictionaryBits.jsx'
import { DICTIONARY_GROUPS, browseDictionary, searchDictionaryDetailed } from '../lib/course-dictionary.js'
import { readSearchAddress, searchAddressHash } from '../lib/dictionary-address.js'
import { COURSE_ENTRIES as ENTRIES, DICTIONARY, SEARCH_ENTRIES } from '../lib/dictionary-data.js'
import { englishSlug, normaliseSense } from '../lib/dictionary-text.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /dictionary: the course word list, searchable in Tongan or English. Ported from
// the parked paid-access page (private/practice-access/app, commit daae4af) under
// the 2026-09-27 ruling "B reached through A": course list only, glosses as the
// list has them, no EALD or Churchward text.
//
// Word-list words (DECISIONS.md 2026-09-29) join the search only, after the
// course words and with their own label; browsing and the full list stay the
// course's own 649 words.
//
// Since plan 2026-11-18-dictionary-search-and-word-pages the search forgives
// typing (see course-dictionary.js), every result opens its own word page, and
// the search lives in the address so it can be linked and Back returns to it.
// It lives in the fragment (#q=faifekau, #letter=ng) and never in the query
// string: the analytics script sends the query string with every count, and a
// fragment is sent nowhere. See ../lib/dictionary-address.js.
const letterLabel = letter => letter === 'ng' ? 'Ng' : letter.toUpperCase()
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
const quoted = (words, joiner) => words.map(word => `“${word}”`).join(` ${joiner} `)

export default function Dictionary() {
  useTitle('Dictionary')
  const searchRef = useRef(null)
  const location = useLocation()
  const address = readSearchAddress(location.hash, DICTIONARY_GROUPS)
  const [query, setQuery] = useState(address.q)
  const [letter, setLetter] = useState(address.letter)
  // The router's location changes only when something navigates: Back,
  // Forward, a link, a fragment pasted or edited in the address bar. Then the
  // page follows the address. (The key alone is not enough: a fragment changed
  // in the address bar keeps the entry's key.) Its own writes below go straight
  // to the history entry and never pass through the router, so they cannot
  // feed back into the box while someone is typing.
  const arrival = `${location.key} ${location.hash}`
  const [followed, setFollowed] = useState(arrival)
  if (followed !== arrival) {
    setFollowed(arrival)
    setQuery(address.q)
    setLetter(address.letter)
  }

  // Shows a search or a letter and writes it into the fragment of the current
  // history entry. The path is written without any query string, so nothing
  // typed here is ever in location.search.
  const show = (nextQuery, nextLetter) => {
    setQuery(nextQuery)
    setLetter(nextLetter)
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${searchAddressHash(nextQuery, nextLetter)}`)
  }

  const deferredQuery = useDeferredValue(query)
  const typed = deferredQuery.trim()
  const searching = !letter && typed.length > 0
  const found = useMemo(() => searchDictionaryDetailed(SEARCH_ENTRIES, typed), [typed])
  const browsed = useMemo(() => letter ? browseDictionary(ENTRIES, letter) : ENTRIES, [letter])
  const matches = searching ? found.matches : browsed
  const partial = searching ? found.partial : []
  const suggestions = searching ? found.suggestions : []
  const fallback = searching ? found.fallback : null
  // Longer entries that hold every word typed ("malo lelei" for mālō e lelei):
  // offered first under their own heading, never as a match.
  const containing = searching ? found.containing : []
  const containingWords = searching ? found.containingWords : []
  const nothing = matches.length === 0 && partial.length === 0 && containing.length === 0
  const englishPage = searching && matches.length > 0 ? DICTIONARY.englishBySlug.get(englishSlug(normaliseSense(typed))) : null
  const clear = () => { show('', ''); requestAnimationFrame(() => searchRef.current?.focus()) }

  return (
    <div className="catalog-page dictionary-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Dictionary · The course word list</p>
          <h1 className="display">Look up<br />a word.</h1>
          <p>Search in Tongan or English, or browse by the first Tongan letter. You can type a word without its macrons or fakauʻa. Each word opens its own page, with its meaning, its part of speech and the lesson that teaches it.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <p className="dictionary-wordlists">Looking for everyday words the lessons do not teach, such as parts of the body? <Link to="/word-lists">See the word lists</Link>.</p>
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search the dictionary</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={event => show(event.target.value, '')}
              placeholder="Tongan or English word"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
            />
          </label>
        </div>
        <div className="dictionary-browse">
          <p id="dictionary-alphabet-label">Browse by letter</p>
          <div className="dictionary-alphabet" role="group" aria-labelledby="dictionary-alphabet-label" aria-describedby="dictionary-alphabet-help">
            <button type="button" aria-pressed={!letter} aria-controls="dictionary-results" onClick={() => show('', '')}>All</button>
            {DICTIONARY_GROUPS.map(initial => (
              <button key={initial} type="button" lang="to" aria-pressed={letter === initial} aria-controls="dictionary-results" onClick={() => show('', initial)}>{letterLabel(initial)}</button>
            ))}
          </div>
          <p id="dictionary-alphabet-help" className="dictionary-browse-help">Each vowel has a separate group for words beginning with ʻ (fakauʻa).</p>
        </div>
        <p className="catalog-count" role="status" aria-live="polite">
          {letter
            ? `${plural(matches.length, 'entry', 'entries')} under ${letterLabel(letter)}`
            : !searching
            ? `${matches.length} words`
            : containing.length
            ? `No entry is exactly “${typed}”. ${plural(containing.length, 'longer entry has', 'longer entries have')} ${quoted(containingWords, 'and')} in it, in that order.${fallback && matches.length
              ? ` ${plural(matches.length, 'entry has', 'entries have')} ${quoted(fallback.words, 'or')} alone.`
              : partial.length ? ` ${plural(partial.length, 'word begins', 'words begin')} with or ${partial.length === 1 ? 'contains' : 'contain'} what you typed.` : ''}`
            : fallback
            ? `No entry has all of “${typed}”. ${fallback.phrase
              ? `${plural(matches.length, 'entry matches', 'entries match')} “${fallback.phrase}”.`
              : `${plural(matches.length, 'entry has', 'entries have')} ${quoted(fallback.words, 'or')}.`}`
            : matches.length
            ? `${plural(matches.length, 'word matches', 'words match')}${partial.length ? `, and ${plural(partial.length, 'more begins', 'more begin')} with or ${partial.length === 1 ? 'contains' : 'contain'} “${typed}”` : ''}`
            : partial.length
            ? `No word is exactly “${typed}”. ${plural(partial.length, 'word begins', 'words begin')} with or ${partial.length === 1 ? 'contains' : 'contain'} it.`
            : suggestions.length
            ? `Nothing in the dictionary is spelled “${typed}”.`
            : 'No words match.'}
        </p>
        {englishPage && (
          <p className="dictionary-pointer">Every word with this meaning is on one page: <Link to={englishPage.path}>How to say {englishPage.headword} in Tongan</Link>.</p>
        )}
        <div id="dictionary-results">
          {nothing && suggestions.length > 0 ? (
            <section className="dictionary-group is-suggestions" aria-labelledby="dictionary-suggestions-title">
              <h2 id="dictionary-suggestions-title" className="dictionary-group-title">Did you mean</h2>
              <ul className="dictionary-list">{suggestions.map(entry => <SearchRow key={entry.id} entry={entry} />)}</ul>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>Clear search</button>
            </section>
          ) : nothing ? (
            <div className="catalog-empty">
              <h2>No words match.</h2>
              <p>{letter
                ? 'Choose another letter, or search in Tongan or English.'
                : 'Try another spelling, or search in English. The dictionary holds the words the course teaches and the words of the word lists.'}</p>
              <button type="button" className="btn btn-primary" onClick={clear}>{letter ? 'Show all words' : 'Clear search'}</button>
            </div>
          ) : (
            <>
              {containing.length > 0 && (
                <section className="dictionary-group is-containing" aria-labelledby="dictionary-containing-title">
                  <h2 id="dictionary-containing-title" className="dictionary-group-title">{containing.length === 1 ? 'A longer entry' : 'Longer entries'} with {quoted(containingWords, 'and')}</h2>
                  <ul className="dictionary-list">{containing.map(entry => <SearchRow key={entry.id} entry={entry} />)}</ul>
                </section>
              )}
              {matches.length > 0 && containing.length > 0 && (
                <section className="dictionary-group" aria-labelledby="dictionary-single-title">
                  <h2 id="dictionary-single-title" className="dictionary-group-title">Entries with {quoted(fallback ? fallback.words : containingWords, 'or')} alone</h2>
                  <ul className="dictionary-list">{matches.map(entry => <SearchRow key={entry.id} entry={entry} />)}</ul>
                </section>
              )}
              {matches.length > 0 && containing.length === 0 && <ul className="dictionary-list">{matches.map(entry => <SearchRow key={entry.id} entry={entry} />)}</ul>}
              {partial.length > 0 && (
                <section className="dictionary-group" aria-labelledby="dictionary-partial-title">
                  <h2 id="dictionary-partial-title" className="dictionary-group-title">Words that begin with or contain “{typed}”</h2>
                  <ul className="dictionary-list">{partial.map(entry => <SearchRow key={entry.id} entry={entry} />)}</ul>
                </section>
              )}
            </>
          )}
        </div>
        <p className="dictionary-note">Supplemental words are in the course word list but not tied to one lesson. Word-list words come from the <Link to="/word-lists">word lists</Link> and are not taught in the lessons.</p>
      </div>
    </div>
  )
}
