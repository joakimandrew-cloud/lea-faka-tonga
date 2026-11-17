import { Link, useParams } from 'react-router-dom'
import { dictionaryPageMeta, STATIC_META } from '@app/seo/meta.js'
import { DictionaryMissing, EntryRow, Neighbours } from '../components/DictionaryBits.jsx'
import { DICTIONARY } from '../lib/dictionary-data.js'
import { usePageMeta } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /dictionary/english/<slug>: "How to say <word> in Tongan" (plan 2026-11-18-
// dictionary-search-and-word-pages). The English words come only from the
// meanings in the data (deriveEnglishHeadwords in ../lib/dictionary-pages.js);
// each page lists every Tongan word whose meaning has that sense, with the
// meaning in full as the data has it.

const MISSING_META = { title: 'Not in the dictionary | Tongan Dictionary', description: STATIC_META['/dictionary'].description }

export default function DictionaryEnglish() {
  const { slug } = useParams()
  const page = DICTIONARY.englishBySlug.get(slug)
  usePageMeta(page ? dictionaryPageMeta(page) : MISSING_META)
  if (!page) return <DictionaryMissing typed={slug} />
  const at = DICTIONARY.english.indexOf(page)
  const before = DICTIONARY.english[at - 1]
  const after = DICTIONARY.english[at + 1]
  const count = page.entries.length

  return (
    <div className="catalog-page dictionary-catalog dictionary-english-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow"><Link to="/dictionary">Dictionary</Link><span aria-hidden="true">·</span><span>English to Tongan</span></p>
          <h1 className="display dictionary-english-title">How to say <span>{page.headword}</span> in Tongan</h1>
          <p>{count === 1
            ? `One word in the dictionary has “${page.headword}” in its meaning.`
            : `${count} words in the dictionary have “${page.headword}” in their meaning. Each meaning is shown in full, so you can pick the word that fits.`}</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <ul className="dictionary-list">
          {page.entries.map(entry => <EntryRow key={entry.id} entry={entry} />)}
        </ul>
        <p className="dictionary-note">Open a word for its own page: its part of speech, the lesson that teaches it and sentences from that lesson. Supplemental words are in the course word list but not tied to one lesson.</p>
        <Neighbours
          tongan={false}
          previous={before ? { display: before.headword, path: before.path } : null}
          next={after ? { display: after.headword, path: after.path } : null}
        />
      </div>
    </div>
  )
}
