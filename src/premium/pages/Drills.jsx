import EntryMotif from '../components/EntryMotif.jsx'
import { Link } from 'react-router-dom'
import T from '../components/T.jsx'
import { GROUPS, LEVELS, premiumRouteFor } from '../lib/source-routes.js'
import { useTitle } from '../lib/title.js'
import { GAMES } from '@app/games/registry.js'
import '../styles/catalog.css'

// The drills page holds only drills that practise the language as a whole
// (Andrew's ruling, DECISIONS.md 2026-11-26). Practice for one lesson lives
// inside that lesson, so this page has no "in the lessons" rows and no
// "More practice" list. With 18 drills and 3 games there is no search or
// level filter: the four groups, the jump bar and the start-here steps do
// that job.
//
// Games come from the registry (src/games/registry.js); a game is not a
// one-pattern drill, so it stays out of the drill count. Each card's sample is
// built from the game's own deck, so no Tongan is typed here.
const GAME_SAMPLES = GAMES.map(game => game.sample())
const gameByRoute = route => GAMES.find(game => game.route === route)

// Page copy per group, written to the student. The group's name and drills
// come from src/data/drills-catalog.js.
const GROUP_COPY = {
  start: {
    what: 'The opening of a Tongan sentence: the pronoun, the tense marker, and the first word that tells you what kind of sentence is coming.',
    when: 'Use these whenever starting a sentence still takes you a moment.',
  },
  nouns: {
    what: 'The small words that travel with a noun: at, to or from; "a" or "the"; plurals; which kind of "my"; who did it; and where the accent falls.',
    when: 'Use these when you catch yourself guessing at one of them.',
  },
  sentences: {
    what: 'Questions, joining words, and whole sentences to build, read and correct.',
    when: 'Use these once you have a few lessons behind you, to check that the pieces work together.',
  },
  words: {
    name: 'Words and games',
    what: 'Vocabulary and quick games.',
    when: 'Use these on any day, at any lesson.',
  },
}

const SENTENCE_TILES = gameByRoute('/games/sentence-tiles')
const WORD_BALLOONS = gameByRoute('/games/word-balloons')

const START_STEPS = [
  SENTENCE_TILES && { to: SENTENCE_TILES.route, name: SENTENCE_TILES.title, when: 'From Lesson 1', why: 'Put the words of a sentence from the book in order. It starts at Lesson 1 and moves on with you.' },
  { to: premiumRouteFor('pronoun-paradigm'), name: 'Name the pronoun', when: 'After Lesson 2', why: 'Every sentence needs a pronoun or a name, so this is the first drill worth repeating.' },
  WORD_BALLOONS && { to: WORD_BALLOONS.route, name: WORD_BALLOONS.title, when: 'Any day', why: 'A quick game for the words you are learning.' },
  { name: 'Then one drill per lesson', when: 'As you go', why: 'Each card below shows the lesson that teaches its pattern. When you finish that lesson, the drill is ready for you.' },
].filter(Boolean)

const byLesson = (a, b) => a.ch - b.ch

function GameCard({ game, sample }) {
  return (
    <Link className="catalog-card" to={game.route}>
      <span className="catalog-card-top">
        <span>Game</span>
        <span>{game.words} {game.unit ?? 'words'}</span>
      </span>
      <span className="catalog-sample" aria-hidden="true">
        <span>{sample.q}</span>
        <T>{sample.ton}</T>
      </span>
      <strong>{game.title}</strong>
      <span className="catalog-card-copy">{game.blurb}</span>
      <span className="catalog-card-action">{game.action} <EntryMotif size={20} /></span>
    </Link>
  )
}

function DrillCard({ drill }) {
  const anyLesson = drill.ch <= 1
  return (
    <Link className="catalog-card" to={premiumRouteFor(drill.id)}>
      <span className="catalog-card-top">
        <span>{anyLesson ? 'Any lesson' : `After Lesson ${drill.ch}`}</span>
        <span>{LEVELS[drill.level]}</span>
      </span>
      <span className="catalog-sample" aria-hidden="true">
        <span>{drill.sample.q}</span>
        <T>{drill.sample.ton}</T>
      </span>
      <strong>{drill.title}</strong>
      <span className="catalog-card-copy">{drill.blurb}</span>
      <span className="catalog-card-action">{drill.action} <EntryMotif size={20} index={drill.ch - 1} /></span>
    </Link>
  )
}

function DrillGroup({ group, number, count }) {
  const copy = GROUP_COPY[group.key] ?? { what: group.note, when: '' }
  const drills = [...group.drills].sort(byLesson)
  const games = group.key === 'words' ? GAMES : []
  const tally = [
    drills.length && `${drills.length} ${drills.length === 1 ? 'drill' : 'drills'}`,
    games.length && `${games.length} ${games.length === 1 ? 'game' : 'games'}`,
  ].filter(Boolean).join(' · ')
  return (
    <section className="catalog-group" id={`drills-${group.key}`} aria-labelledby={`drill-group-${group.key}`}>
      <header>
        <div>
          <p className="catalog-kicker">Group {number} of {count} · {tally}</p>
          <h2 id={`drill-group-${group.key}`}>{copy.name ?? group.name}</h2>
          <p className="catalog-group-what">{copy.what}</p>
          {copy.when && <p className="catalog-group-when">{copy.when}</p>}
        </div>
      </header>
      <div className="catalog-grid">
        {drills.map(drill => <DrillCard key={drill.id} drill={drill} />)}
        {games.map(game => <GameCard key={game.key} game={game} sample={GAME_SAMPLES[GAMES.indexOf(game)]} />)}
      </div>
    </section>
  )
}

export default function Drills() {
  useTitle('Practice drills')
  const total = GROUPS.reduce((sum, group) => sum + group.drills.length, 0)

  return (
    <div className="catalog-page">
      <header className="catalog-hero band grain">
        <div className="wrap">
          <p className="eyebrow">Drills · Practice at your pace</p>
          <h1 className="display">Practice one<br />pattern.</h1>
          <p><T>Ngāue Fakaʻilo.</T> Each drill is a short set of questions on one pattern you will use in Tongan sentences on any subject. Every card names the lesson that teaches it. Practice that belongs to a single lesson stays inside that lesson.</p>
        </div>
      </header>
      <div className="wrap catalog-body">
        <section className="catalog-start" aria-labelledby="drills-start">
          <p className="catalog-kicker">New here?</p>
          <h2 id="drills-start">Start here</h2>
          <ol>
            {START_STEPS.map(step => (
              <li key={step.name}>
                <span className="catalog-start-when">{step.when}</span>
                {step.to
                  ? <Link to={step.to}><strong>{step.name}</strong></Link>
                  : <strong>{step.name}</strong>}
                <span className="catalog-start-why">{step.why}</span>
              </li>
            ))}
          </ol>
        </section>

        <nav className="catalog-jump" aria-label="Drill groups">
          <span>{total} drills and {GAMES.length} games in {GROUPS.length} groups</span>
          <div>
            {GROUPS.map(group => <a key={group.key} href={`#drills-${group.key}`}>{GROUP_COPY[group.key]?.name ?? group.name}</a>)}
          </div>
        </nav>

        {GROUPS.map((group, index) => (
          <DrillGroup key={group.key} group={group} number={index + 1} count={GROUPS.length} />
        ))}
      </div>
    </div>
  )
}
