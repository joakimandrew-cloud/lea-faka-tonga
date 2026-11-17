import { Link, useParams } from 'react-router-dom'
import { dictionaryPageMeta, STATIC_META } from '@app/seo/meta.js'
import { DictionaryMissing, Neighbours, WordLinks } from '../components/DictionaryBits.jsx'
import { DICTIONARY } from '../lib/dictionary-data.js'
import { usePageMeta } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /dictionary/<slug>: one page per plain spelling (plan 2026-11-18-dictionary-
// search-and-word-pages). Rows that are typed the same share the page, each
// shown separately with its own marks, meaning, part of speech and lesson.
//
// Rules that bind (DECISIONS.md 2026-09-27 and 2026-09-29): every Tongan string
// and every meaning is the data's own. The sentences are lines printed in the
// lesson that teaches the row, with the English printed beside them; nothing
// is written for this page. A word-list word keeps its label and links to its
// section of /word-lists. An added word (DECISIONS.md 2026-11-18) shows its
// label, links to no lesson and has no sentences.

// The printed sentence with the row's word picked out.
function Sentence({ pair }) {
  const [start, end] = pair.at
  return (
    <span className="dictionary-pair-to to" lang="to">
      {pair.display.slice(0, start)}<b>{pair.display.slice(start, end)}</b>{pair.display.slice(end)}
    </span>
  )
}

function Entry({ entry, heading }) {
  return (
    <article className="dictionary-word-entry" aria-label={heading ? undefined : entry.display}>
      {heading && <h2 className="dictionary-word-heading to" lang="to">{entry.display}</h2>}
      {heading && <p className="dictionary-word-meaning">{entry.english}</p>}
      <dl className="dictionary-facts">
        {entry.partOfSpeech && <div><dt>Part of speech</dt><dd>{entry.partOfSpeech}</dd></div>}
        {entry.register && <div><dt>Label</dt><dd>{entry.register}</dd></div>}
        {entry.lesson && (
          <div><dt>Taught in</dt><dd><Link to={entry.lesson.href}>{entry.lesson.label}</Link></dd></div>
        )}
        {entry.supplemental && (
          <div><dt>Found in</dt><dd>Supplemental: in the course word list, not tied to one lesson.</dd></div>
        )}
        {entry.wordList && (
          <div><dt>Found in</dt><dd><Link to={entry.wordList.href}>{entry.wordList.note}</Link></dd></div>
        )}
        {entry.added && <div><dt>Label</dt><dd>{entry.added.note}</dd></div>}
        {entry.alsoInWordLists.length > 0 && (
          <div><dt>Word list</dt><dd>{entry.alsoInWordLists.map((list, index) => <span key={list.id}>{index > 0 && ', '}<Link to={list.href}>{list.label}</Link></span>)}</dd></div>
        )}
        {entry.alsoTyped && <div><dt>Also typed</dt><dd>{entry.alsoTyped}</dd></div>}
        {entry.englishPages.length > 0 && (
          <div><dt>English to Tongan</dt><dd>{entry.englishPages.map((page, index) => <span key={page.path}>{index > 0 && ', '}<Link to={page.path}>{page.headword}</Link></span>)}</dd></div>
        )}
      </dl>
      {entry.examples.length > 0 && (
        <section className="dictionary-examples" aria-label={`Sentences from ${entry.lesson.label}`}>
          <h3 className="catalog-kicker">From {entry.lesson.label}</h3>
          <ul>
            {entry.examples.map(pair => (
              <li key={pair.line} className="dictionary-pair">
                <Sentence pair={pair} />
                <span className="dictionary-pair-en">{pair.englishDisplay}</span>
              </li>
            ))}
          </ul>
          <p className="dictionary-examples-note">Printed in the lesson. <Link to={entry.lesson.href}>Open {entry.lesson.label}</Link></p>
        </section>
      )}
    </article>
  )
}

const MISSING_META = { title: 'Not in the dictionary | Tongan Dictionary', description: STATIC_META['/dictionary'].description }

export default function DictionaryWord() {
  const { slug } = useParams()
  const page = DICTIONARY.pageBySlug.get(slug)
  usePageMeta(page ? dictionaryPageMeta(page) : MISSING_META)
  if (!page) return <DictionaryMissing typed={slug} />
  const several = page.entries.length > 1
  const onlyWordList = page.entries.every(entry => entry.kind === 'word-list')
  const onlyAdded = page.entries.every(entry => entry.kind === 'added')

  return (
    <div className="catalog-page dictionary-catalog dictionary-word-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow"><Link to="/dictionary">Dictionary</Link><span aria-hidden="true">·</span><span>{onlyWordList ? 'Word list word' : onlyAdded ? 'Added word' : 'Tongan word'}</span></p>
          <h1 className="display dictionary-word-title">
            {page.words.map((word, index) => (
              <span key={word}>{index > 0 && <span className="dictionary-word-sep" aria-hidden="true"> · </span>}<span className="to" lang="to">{word}</span></span>
            ))}
          </h1>
          {several
            ? <p>{page.entries.length} entries are typed “{page.typed}”. Each is shown with its own marks, meaning and lesson.</p>
            : <p className="dictionary-word-lead">{page.entries[0].english}</p>}
        </div>
      </header>
      <div className="wrap catalog-body">
        {page.entries.map(entry => <Entry key={entry.id} entry={entry} heading={several} />)}
        {page.sameLesson.map(group => (
          <section key={group.lesson.number} className="catalog-group dictionary-related" aria-labelledby={`same-lesson-${group.lesson.number}`}>
            <header>
              <div>
                <p className="catalog-kicker">Taught in the same lesson</p>
                <h2 id={`same-lesson-${group.lesson.number}`}>{group.lesson.label}</h2>
                <p>The other words this lesson teaches. <Link to={group.lesson.href}>Open Lesson {group.lesson.number}</Link></p>
              </div>
            </header>
            <WordLinks words={group.words} label={`Other words of ${group.lesson.label}`} />
          </section>
        ))}
        {page.sameWordList.map(group => (
          <section key={group.themeId} className="catalog-group dictionary-related" aria-labelledby={`same-list-${group.themeId}`}>
            <header>
              <div>
                <p className="catalog-kicker">In the same word list</p>
                <h2 id={`same-list-${group.themeId}`}>{group.label}</h2>
                <p>The other words of this word list. <Link to={group.href}>Open the word list</Link></p>
              </div>
            </header>
            <WordLinks words={group.words} label={`Other words of the word list ${group.label}`} />
          </section>
        ))}
        <Neighbours previous={page.previous} next={page.next} />
      </div>
    </div>
  )
}
