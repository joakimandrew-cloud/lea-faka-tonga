import { okinafy } from '@app/lib/okinafy.js'
import { Link } from 'react-router-dom'
import { searchAddress } from '../lib/dictionary-address.js'

// Pieces shared by /dictionary, the word pages and the English pages
// (plan 2026-11-18-dictionary-search-and-word-pages). Every Tongan string and
// meaning shown is the data's own; the Tongan passes through okinafy.

// One search result: a row of the course list or of a word list, as
// buildDictionary() and buildWordListSearchEntries() make it. The word opens
// its own page; the lesson or word-list link stays.
export function SearchRow({ entry }) {
  return (
    <li className="dictionary-entry">
      <Link className="dictionary-tongan dictionary-word-link to" lang="to" to={entry.wordHref}>{okinafy(entry.tongan)}</Link>
      <span className="dictionary-english">{entry.english}</span>
      <span className="dictionary-meta">
        {entry.partOfSpeech && <span className="dictionary-pos">{entry.partOfSpeech}</span>}
        {entry.href
          ? <Link className={entry.wordList ? 'dictionary-lesson is-word-list' : 'dictionary-lesson'} to={entry.href}>{entry.label}</Link>
          : <span className="dictionary-lesson is-supplemental">{entry.label}</span>}
      </span>
    </li>
  )
}

// The same row for an entry of the page index (buildDictionaryIndex), used on
// the English pages.
export function EntryRow({ entry }) {
  return (
    <li className="dictionary-entry">
      <Link className="dictionary-tongan dictionary-word-link to" lang="to" to={entry.path}>{entry.display}</Link>
      <span className="dictionary-english">{entry.english}{entry.register ? ` (${entry.register})` : ''}</span>
      <span className="dictionary-meta">
        {entry.partOfSpeech && <span className="dictionary-pos">{entry.partOfSpeech}</span>}
        {entry.lesson && <Link className="dictionary-lesson" to={entry.lesson.href}>Lesson {entry.lesson.number}</Link>}
        {entry.wordList && <Link className="dictionary-lesson is-word-list" to={entry.wordList.href}>{entry.wordList.note}</Link>}
        {entry.supplemental && <span className="dictionary-lesson is-supplemental">Supplemental</span>}
      </span>
    </li>
  )
}

// A wrapping run of links to other word pages.
export function WordLinks({ words, label }) {
  return (
    <ul className="dictionary-word-links" aria-label={label}>
      {words.map(word => (
        <li key={word.path}><Link className="to" lang="to" to={word.path}>{word.display}</Link></li>
      ))}
    </ul>
  )
}

// The word before and after, and the way back to the search.
export function Neighbours({ previous, next, tongan = true }) {
  const name = item => tongan ? <span className="to" lang="to">{item.display}</span> : <span>{item.display}</span>
  return (
    <nav className="dictionary-neighbours" aria-label="More of the dictionary">
      {previous
        ? <Link className="dictionary-neighbour" to={previous.path}><small>Before</small>{name(previous)}</Link>
        : <span className="dictionary-neighbour is-empty" />}
      <Link className="btn btn-primary" to="/dictionary">Search the dictionary</Link>
      {next
        ? <Link className="dictionary-neighbour is-next" to={next.path}><small>After</small>{name(next)}</Link>
        : <span className="dictionary-neighbour is-empty" />}
    </nav>
  )
}

// An address under /dictionary that holds no entry.
export function DictionaryMissing({ typed }) {
  return (
    <div className="catalog-page dictionary-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow"><Link to="/dictionary">Dictionary</Link><span aria-hidden="true">·</span><span>No entry here</span></p>
          <h1 className="display">Not in the<br />dictionary.</h1>
          <p>This address does not match a word in the dictionary. Search for it in Tongan or English, with or without the macrons and the fakauʻa.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <Link className="btn btn-primary" to={typed ? searchAddress(typed.replace(/-/g, ' ')) : '/dictionary'}>Search the dictionary</Link>
      </div>
    </div>
  )
}
