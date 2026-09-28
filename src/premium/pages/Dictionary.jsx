import { okinafy } from '@app/lib/okinafy.js'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import vocabulary from '@app/data/book-vocabulary.json'
import { DICTIONARY_GROUPS, browseDictionary, buildDictionary, searchDictionary } from '../lib/course-dictionary.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /dictionary: the course word list, searchable in Tongan or English. Ported from
// the parked paid-access page (private/practice-access/app, commit daae4af) under
// the 2026-09-27 ruling "B reached through A": course list only, glosses as the
// list has them, no EALD or Churchward text.
const ENTRIES = buildDictionary(vocabulary)
const letterLabel = letter => letter === 'ng' ? 'Ng' : letter.toUpperCase()

export default function Dictionary() {
  useTitle('Dictionary')
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('')
  const deferredQuery = useDeferredValue(query)
  const results = useMemo(() => letter ? browseDictionary(ENTRIES, letter) : searchDictionary(ENTRIES, deferredQuery), [deferredQuery, letter])
  const searching = !letter && deferredQuery.trim().length > 0
  const chooseLetter = next => { setLetter(next); setQuery('') }

  return (
    <div className="catalog-page dictionary-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Dictionary · The course word list</p>
          <h1 className="display">Look up<br />a word.</h1>
          <p>Search in Tongan or English, or browse by the first Tongan letter. Each word shows its meaning, its part of speech and the lesson that teaches it.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <div className="catalog-tools">
          <label className="catalog-search">
            <span>Search the dictionary</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={event => { setQuery(event.target.value); setLetter('') }}
              placeholder="Tongan or English word"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
        </div>
        <div className="dictionary-browse">
          <p id="dictionary-alphabet-label">Browse by letter</p>
          <div className="dictionary-alphabet" role="group" aria-labelledby="dictionary-alphabet-label" aria-describedby="dictionary-alphabet-help">
            <button type="button" aria-pressed={!letter} aria-controls="dictionary-results" onClick={() => chooseLetter('')}>All</button>
            {DICTIONARY_GROUPS.map(initial => (
              <button key={initial} type="button" lang="to" aria-pressed={letter === initial} aria-controls="dictionary-results" onClick={() => chooseLetter(initial)}>{letterLabel(initial)}</button>
            ))}
          </div>
          <p id="dictionary-alphabet-help" className="dictionary-browse-help">Each vowel has a separate group for words beginning with ʻ (fakauʻa).</p>
        </div>
        <p className="catalog-count" role="status" aria-live="polite">
          {letter
            ? `${results.length} ${results.length === 1 ? 'entry' : 'entries'} under ${letterLabel(letter)}`
            : searching
            ? `${results.length} ${results.length === 1 ? 'word matches' : 'words match'}`
            : `${results.length} words`}
        </p>
        <div id="dictionary-results">
        {results.length === 0 ? (
          <div className="catalog-empty">
            <h2>No words match.</h2>
            <p>{letter ? 'Choose another letter, or search in Tongan or English.' : 'Try another spelling, or search in English.'}</p>
            <button type="button" className="btn btn-primary" onClick={() => { chooseLetter(''); requestAnimationFrame(() => searchRef.current?.focus()) }}>{letter ? 'Show all words' : 'Clear search'}</button>
          </div>
        ) : (
          <ul className="dictionary-list">
            {results.map(entry => (
              <li key={entry.id} className="dictionary-entry">
                <span className="dictionary-tongan to" lang="to">{okinafy(entry.tongan)}</span>
                <span className="dictionary-english">{entry.english}</span>
                <span className="dictionary-meta">
                  {entry.partOfSpeech && <span className="dictionary-pos">{entry.partOfSpeech}</span>}
                  {entry.href
                    ? <Link className="dictionary-lesson" to={entry.href}>{entry.label}</Link>
                    : <span className="dictionary-lesson is-supplemental">{entry.label}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
        </div>
        <p className="dictionary-note">Supplemental words are in the course word list but not tied to one lesson.</p>
      </div>
    </div>
  )
}
