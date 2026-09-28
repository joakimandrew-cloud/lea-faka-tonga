import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import vocabulary from '@app/data/book-vocabulary.json'
import { loadLesson } from '../lib/book.js'
import {
  advanceDeck,
  filterGlobalCards,
  globalCards,
  globalDeckKey,
  lessonCards,
  lessonDeckKey,
  listDeckKey,
  restartDeck,
  shuffleDeck,
  useDeckProgress,
} from '../lib/card-progress.js'
import { deckForLists, lists as VOCAB_LISTS, otherMeanings } from '@app/lib/vocab-decks.js'
import Card from '../components/practice/PracticeCard.jsx'
import '../styles/cards.css'

const ALL_GLOBAL_CARDS = globalCards(vocabulary)
const CATEGORIES = [...new Set(vocabulary.map(item => item.category))].sort()
const TIER_LABELS = { essential: 'Essential', useful: 'Useful', all: 'All' }

// Same Tongan word, another card in the course (hiva: nine, and sing).
function meaningOf(card) {
  const others = otherMeanings(card)
  return others.length ? { count: others.length + 1, also: others.map(other => other.english) } : undefined
}

function wordsOf(lesson, number) {
  if (!lesson) return []
  const tables = []
  let inWords = false
  for (const block of lesson.blocks) {
    if (block.type === 'h2') inWords = /^words-to-learn/.test(block.id)
    else if (inWords && block.type === 'table') tables.push(block)
  }
  return lessonCards(tables, number)
}


function Deck({ deckKey, words, mode, lessonNumber, meaningFor }) {
  const [state, setState] = useDeckProgress(deckKey, words)
  const [flipped, setFlipped] = useState(false)
  const [exitDirection, setExitDirection] = useState(0)
  const byId = useMemo(() => new Map(words.map(word => [word.id, word])), [words])
  const queue = state.order.slice(state.position).map(id => byId.get(id)).filter(Boolean)
  const currentId = state.order[state.position]
  const progress = state.order.length ? state.position / state.order.length * 100 : 0

  const swipe = useCallback((pile) => {
    if (!currentId) return
    setExitDirection(pile === 'known' ? 1 : -1)
    setState(previous => advanceDeck(previous, pile))
    setFlipped(false)
  }, [currentId, setState])

  useEffect(() => {
    const onKey = event => {
      if (!currentId || state.finished) return
      const interactive = event.target instanceof Element
        ? event.target.closest('a, button, input, select, textarea, summary, [role="button"]')
        : null
      if (interactive || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === 'ArrowLeft') swipe('again')
      else if (event.key === 'ArrowRight') swipe('known')
      else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        setFlipped(value => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentId, state.finished, swipe])

  if (!words.length) {
    return (
      <div className="deck-empty" role="status">
        <strong>No words in this deck.</strong>
        <span>Choose another category or tier.</span>
      </div>
    )
  }

  return (
    <>
      <div className="cards-progress" aria-hidden="true"><Motion.i animate={{ width: `${progress}%` }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} /></div>
      <div className="cards-main">
        <div className="pile pile-again"><span className="pile-n display">{state.again.length}</span><span className="pile-l">Again</span></div>
        <div className="deck">
          <AnimatePresence custom={exitDirection}>
            {!state.finished && queue.slice(0, 3).map((card, index) => (
              <Card
                key={card.id}
                word={card}
                depth={index}
                flipped={index === 0 && flipped}
                onFlip={() => setFlipped(value => !value)}
                onSwipe={swipe}
                front={state.direction}
                meaning={meaningFor?.(card)}
              />
            ))}
          </AnimatePresence>
          {state.finished && (
            <Motion.div className="deck-done" initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}>
              <p className="deck-done-k">Deck finished</p>
              <p className="deck-done-h display">{state.known.length} of {state.order.length}<br />known</p>
              <div className="deck-done-a">
                {state.again.length > 0 && <button className="btn btn-primary" onClick={() => setState(previous => restartDeck(previous, words, previous.again))}>Practise {state.again.length} again <span className="arr">↻</span></button>}
                <button className="btn btn-ghost" onClick={() => setState(previous => restartDeck(previous, words))}>Restart this deck</button>
                {mode === 'lesson' && lessonNumber < 52 && <Link className="btn btn-ghost" to={`/cards?lesson=${lessonNumber + 1}`}>Lesson {lessonNumber + 1} words</Link>}
              </div>
            </Motion.div>
          )}
        </div>
        <div className="pile pile-known"><span className="pile-n display">{state.known.length}</span><span className="pile-l">Got it</span></div>
      </div>
      {!state.finished && (
        <div className="cards-actions">
          <button className="ca again" onClick={() => swipe('again')}><span aria-hidden="true">←</span> Again</button>
          <button className="ca flip" onClick={() => setFlipped(value => !value)}>Turn <kbd className="kbd-only">Space</kbd></button>
          <button className="ca known" onClick={() => swipe('known')}>Got it <span aria-hidden="true">→</span></button>
        </div>
      )}
      <div className="cards-deck-tools">
        <button type="button" aria-pressed={state.direction === 'en'} onClick={() => { setFlipped(false); setState(previous => ({ ...previous, direction: previous.direction === 'to' ? 'en' : 'to' })) }}>
          {state.direction === 'to' ? 'Tongan → English' : 'English → Tongan'}
        </button>
        <button type="button" onClick={() => { setFlipped(false); setState(previous => shuffleDeck(previous, words)) }}>⇄ Shuffle and restart</button>
      </div>
      <p className="cards-foot"><span className="touch-only">Swipe a card left or right. </span><span className="kbd-only">Drag a card, or use the arrow keys. </span>{mode === 'lesson' && <Link to={`/lessons/${lessonNumber}`} className="link">Back to Lesson {lessonNumber}</Link>}</p>
    </>
  )
}

function LessonDeck({ lessonNumber }) {
  const [lesson, setLesson] = useState(null)
  useEffect(() => {
    let active = true
    loadLesson(lessonNumber).then(value => { if (active) setLesson(value) })
    return () => { active = false }
  }, [lessonNumber])
  const words = useMemo(() => wordsOf(lesson, lessonNumber), [lesson, lessonNumber])
  if (!lesson) return <div className="cards-loading" aria-busy="true">Loading lesson words…</div>
  return <Deck key={lessonDeckKey(lessonNumber)} deckKey={lessonDeckKey(lessonNumber)} words={words} mode="lesson" lessonNumber={lessonNumber} />
}

export default function Cards() {
  const [params, setParams] = useSearchParams()
  const lessonParam = params.get('lesson')
  const mode = lessonParam ? 'lesson' : 'global'
  const lessonNumber = Math.min(52, Math.max(1, Number(lessonParam) || 1))
  const [tier, setTier] = useState('essential')
  const [category, setCategory] = useState('all')
  // Themed lists, in the order chosen. While any is on, the deck is those lists
  // in their natural order and tier and category step aside, unchanged, so
  // All words brings them straight back.
  const [chosenLists, setChosenLists] = useState([])
  const listsOn = chosenLists.length > 0
  const filtered = useMemo(() => filterGlobalCards(ALL_GLOBAL_CARDS, tier, category), [tier, category])
  const listWords = useMemo(() => globalCards(deckForLists(chosenLists)), [chosenLists])
  const globalWords = listsOn ? listWords : filtered
  const globalKey = listsOn ? listDeckKey(chosenLists) : globalDeckKey(tier, category)
  const toggleList = id => setChosenLists(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  const lesson = chapters.find(chapter => chapter.chapter === lessonNumber)
  useTitle(mode === 'global' ? 'Vocabulary flip cards' : `Flip cards: Lesson ${lessonNumber}`)

  return (
    <div className="cards">
      <div className="cards-in">
        <header className="cards-head">
          <div>
            <p className="eyebrow">Flip cards · {mode === 'global' ? `${vocabulary.length} book words` : 'Lesson deck'}</p>
            <h1 className="cards-h1 display">{mode === 'global' ? <>Build a useful<br />Tongan vocabulary.</> : `Words from Lesson ${lessonNumber}`}</h1>
            <p className="cards-sub">{mode === 'global' ? 'Choose a useful slice of the course, then work through it in either direction.' : `${lesson?.title} · words from the lesson reading`}</p>
          </div>
          <div className="cards-mode" role="tablist" aria-label="Card collection">
            <button type="button" role="tab" aria-selected={mode === 'global'} onClick={() => setParams({})}>Book vocabulary</button>
            <button type="button" role="tab" aria-selected={mode === 'lesson'} onClick={() => setParams({ lesson: String(lessonNumber) })}>Lesson words</button>
          </div>
        </header>

        {mode === 'global' ? (
          <>
            <div className={`cards-controls global-controls${listsOn ? ' is-set-aside' : ''}`}>
              <div className="cards-dir" role="group" aria-label="Vocabulary tier">
                {Object.entries(TIER_LABELS).map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={tier === value} className={tier === value ? 'is-on' : ''} disabled={listsOn} onClick={() => setTier(value)}>{label}</button>
                ))}
              </div>
              <label className="cards-select">
                <span>Category</span>
                <select value={category} disabled={listsOn} onChange={event => setCategory(event.target.value)}>
                  <option value="all">All categories</option>
                  {CATEGORIES.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </label>
              <span className="cards-filter-count" role="status">{globalWords.length} cards</span>
            </div>
            <div className="cards-lists" role="group" aria-labelledby="cards-lists-label">
              <span className="cards-lists-label" id="cards-lists-label">Lists</span>
              <div className="cards-lists-chips">
                <button type="button" aria-pressed={!listsOn} onClick={() => setChosenLists([])}>All words</button>
                {VOCAB_LISTS.map(list => (
                  <button key={list.id} type="button" aria-pressed={chosenLists.includes(list.id)} onClick={() => toggleList(list.id)}>{list.label}</button>
                ))}
              </div>
              {listsOn && <p className="cards-lists-note">Lists show every word, so the tier and category are set aside. Choose All words to go back to them.</p>}
            </div>
            <Deck key={globalKey} deckKey={globalKey} words={globalWords} mode="global" meaningFor={meaningOf} />
          </>
        ) : (
          <>
            <div className="cards-controls">
              <label className="cards-select">
                <span>Lesson</span>
                <select value={lessonNumber} onChange={event => setParams({ lesson: event.target.value })}>
                  {chapters.map(chapter => <option key={chapter.chapter} value={chapter.chapter}>Lesson {chapter.chapter}: {chapter.title}</option>)}
                </select>
              </label>
            </div>
            <LessonDeck key={lessonNumber} lessonNumber={lessonNumber} />
          </>
        )}
      </div>
    </div>
  )
}
