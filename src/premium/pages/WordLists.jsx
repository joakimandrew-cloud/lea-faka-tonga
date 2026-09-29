import { okinafy } from '@app/lib/okinafy.js'
import { Link } from 'react-router-dom'
import vocabulary from '@app/data/book-vocabulary.json'
import wordListData from '../data/word-lists.json'
import { KupesiTile } from '../components/Kupesi.jsx'
import { buildWordLists } from '../lib/word-lists.js'
import { useTitle } from '../lib/title.js'
import '../styles/catalog.css'
import '../styles/dictionary.css'

// /word-lists: everyday words the lessons do not teach, one section per theme
// (DECISIONS.md 2026-09-29). Rows the course already teaches keep the course's
// spelling and gloss and link to their lesson. Glosses are our own words; no
// EALD or Churchward text is shown.
const THEMES = buildWordLists(wordListData, vocabulary)
const MOTIFS = ['nest', 'leaf', 'lens', 'pinwheel']
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export default function WordLists() {
  useTitle('Word lists')
  const total = THEMES.reduce((sum, theme) => sum + theme.rows.length, 0)

  return (
    <div className="catalog-page dictionary-catalog word-lists-catalog">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Word lists · Beyond the lessons</p>
          <h1 className="display">Words by<br />theme.</h1>
          <p>Everyday words the lessons do not teach, grouped by theme. Each word is checked against Shumway's <em>Intensive Course in Tongan</em> and Churchward's <em>Tongan Dictionary</em>, and its meaning is written in our own words. Words the course already teaches are included and point to their lesson.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <nav className="word-list-index" aria-label="Themes">
          <p className="catalog-count">{plural(THEMES.length, 'theme', 'themes')} · {plural(total, 'word', 'words')}</p>
          <ul>
            {THEMES.map(theme => <li key={theme.id}><a href={`#${theme.id}`}>{theme.label}</a></li>)}
            <li><Link to="/dictionary">Search the dictionary</Link></li>
          </ul>
        </nav>
        {THEMES.map((theme, index) => {
          const taught = theme.rows.filter(row => row.taught).length
          return (
            <section key={theme.id} id={theme.id} className="catalog-group word-list-group" aria-labelledby={`${theme.id}-title`}>
              <header>
                <div>
                  <p className="catalog-kicker">Theme {index + 1}</p>
                  <h2 id={`${theme.id}-title`}>{theme.label}</h2>
                  <p>{plural(theme.rows.length - taught, 'word', 'words')} the lessons do not teach, and {plural(taught, 'word', 'words')} they do, from Shumway's word list.</p>
                </div>
                <KupesiTile kind={MOTIFS[index % MOTIFS.length]} framed size={48} className="word-list-tile" />
              </header>
              <ul className="dictionary-list">
                {theme.rows.map(row => (
                  <li key={row.id} id={row.id} className="dictionary-entry">
                    <span className="dictionary-tongan to" lang="to">{okinafy(row.tongan)}</span>
                    <span className="dictionary-english">
                      {row.english}
                      {row.otherSense && (
                        <span className="word-list-other">
                          In {row.otherSense.href ? <Link to={row.otherSense.href}>{row.otherSense.label}</Link> : row.otherSense.label} it means “{row.otherSense.english}”.
                        </span>
                      )}
                    </span>
                    <span className="dictionary-meta">
                      {row.register && <span className="dictionary-pos">{row.register}</span>}
                      {row.taught && (row.taught.href
                        ? <Link className="dictionary-lesson" to={row.taught.href}>Taught in {row.taught.label}</Link>
                        : <span className="dictionary-lesson is-supplemental">In the course word list</span>)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        <p className="dictionary-note">Labels: <strong>polite</strong> marks the courteous word for a part of the body; <strong>noble word</strong> marks a word used of chiefs.</p>
      </div>
    </div>
  )
}
