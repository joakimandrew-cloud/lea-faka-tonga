/**
 * The lesson page, /lessons/:n (plan 2026-11-05-lesson-page-simplify; the design is
 * reviews/lesson-simplify-2026-11-05/Direction.md, the "Quiet page with stepped practice").
 *
 * One scroll for the reading, one Contents button in place of the rail, the plan card,
 * the compass and both copies of the seven-step path, exercises one set at a time, and
 * moving word-tile figures inside the sections that need them. Each lesson's figures,
 * opening row and recall sentences are read from its own file in src/premium/figures
 * (NN.js), loaded with the lesson; a lesson with no file shows its reading with none.
 * Saved progress is unchanged: lft-premium-lesson-path-v1, exercise progress, quiz and
 * done state, and every section anchor, #exercises, #ex-N and #finish.
 *
 * The capture flags (?structure, ?band, ?look, ?still, ?solo, ?view, ?tile) and the
 * /__proto route exist only in a test build (see __TEST_BUILD__ in vite.config.js).
 */
import EntryMotif from '../components/EntryMotif.jsx'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import quizzes from '@app/data/quizzes.json'
import bookExercises from '@app/data/book-exercises.json'
import quickPractice from '@app/data/quick-practice.json'
import { lessonLevel } from '@app/lib/lesson-browser.js'
import { loadLesson } from '../lib/book.js'
import { markLessonDone, markLessonOpened, useProgress } from '../lib/progress.js'
import { Examples, Pairs, Table, Note, Para, List, WordCards, Md, RevealOff } from '../components/lesson/Blocks.jsx'
import { MembershipFinishLine } from '../components/MembershipNotice.jsx'
import { EmbeddedDrill, QuickPractice } from '../components/lesson/Practice.jsx'
import { PatternFigure, CombinatorFigure, IntonationFigure, StressFigure } from '../components/lesson/Figures1.jsx'
import { KupesiTile } from '../components/Kupesi.jsx'
import { lessonColours, lessonTile } from '../lib/lesson-colour.js'
import { readExerciseState } from '../lib/exercise-progress.js'
import { groupSections, learnModel, teachingSections } from '../lib/lesson-plan.js'
import { markPattern, markRead, markTried } from '../lib/lesson-path-store.js'
import { useLessonPath } from '../components/lesson/LessonPath.jsx'
import CourseStrip from '../components/lesson/CourseStrip.jsx'
import PromiseCheck from '../components/lesson/PromiseCheck.jsx'
import Contents from '../components/lesson/Contents.jsx'
import { SteppedExercises, SteppedQuick } from '../components/lesson/SteppedExercises.jsx'
import Figure, { StaticTile } from '../figure-engine/Figure.jsx'
import '../styles/lesson.css'
import '../styles/lesson-experience.css'
import '../styles/source-core.css'
import '../styles/lesson-course.css'
import '../styles/lesson-page.css'

const COLOURS = lessonColours(chapters, lessonLevel)

// One file per lesson: src/premium/figures/NN.js. Adding a lesson's file touches no shared file.
const FIGURE_FILES = import.meta.glob('../figures/[0-9][0-9].js')

// Capture tools, in a test build only. A production build drops this branch whole.
const TestVariant = __TEST_BUILD__ ? lazy(() => import('../test-tools/Variants.jsx')) : null

/** The lesson's figure file, or null when it has none yet. */
async function loadFigureFile(n) {
  const load = FIGURE_FILES[`../figures/${String(n).padStart(2, '0')}.js`]
  if (!load) return null
  const mod = await load()
  return { figures: mod.FIGURES || [], opening: mod.OPENING || null, recall: mod.RECALL || null }
}

/**
 * The recall cards read the lesson's own book sentences from its figure file. The rule text
 * stays as it is; the example strings in chapters.json and the paradigm never reach the page,
 * and a rule with no book sentence gets no card.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function withRecall(meta, recall) {
  const rules = meta?.teaching?.key_rules
  if (!rules) return meta
  return {
    ...meta,
    teaching: {
      ...meta.teaching,
      paradigm: undefined,
      key_rules: rules.map((rule, i) => {
        const { example_tongan: _to, example_english: _en, ...rest } = rule
        return recall?.[i] ? { ...rest, example_tongan: recall[i].to, example_english: recall[i].en } : rest
      }),
    },
  }
}

function wordCount(lesson) {
  const txt = JSON.stringify(lesson.blocks) + JSON.stringify(lesson.intro)
  return txt.split(/\s+/).length
}

/* Lesson 1's four figures, each wrapped so the lesson path can find it and
   count a press on any of its buttons as using the pattern. */
function Bespoke({ k, children }) {
  return (
    <div id={`fig-1-${k}`} data-figure="bespoke" onClickCapture={event => { if (event.target.closest?.('button')) markPattern(1) }}>
      {children}
    </div>
  )
}

/* Lesson 1 figures, placed after the block they illustrate. */
function figureAfter(n, sectionId, block, index, section) {
  if (n !== 1) return null
  const nth = (type) => section.blocks.filter((b, i) => b.type === type && i <= index).length
  if (sectionId === 'the-pattern' && block.type === 'examples' && nth('examples') === 1) return <Bespoke k={1}><PatternFigure /></Bespoke>
  if (sectionId === 'building-sentences' && block.type === 'table' && nth('table') === 2) {
    return <Bespoke k={2}><CombinatorFigure tables={section.blocks.filter(b => b.type === 'table')} /></Bespoke>
  }
  if (sectionId === 'asking-questions' && block.type === 'pairs' && nth('pairs') === 2) {
    const intonationPairs = section.blocks.filter(candidate => candidate.type === 'pairs').slice(0, 2).flatMap(candidate => candidate.pairs).map(pair => {
      const tone = pair.tongan.match(/\s([↗↘])(?:\s*=)?$/)
      return tone ? { ...pair, tongan: pair.tongan.slice(0, tone.index), english: `${tone[1]} ${pair.english}` } : pair
    })
    return <Bespoke k={3}><IntonationFigure pairs={intonationPairs} /></Bespoke>
  }
  if (sectionId.startsWith('pronunciation') && block.type === 'examples' && index === section.blocks.map(b => b.type).lastIndexOf('examples')) return <Bespoke k={4}><StressFigure /></Bespoke>
  return null
}

/* An anchor round each practice block so the lesson path can link to it and
   count a press on any of its buttons as tried. */
function Practised({ n, id, practiceKey, children }) {
  return (
    <div id={id} data-practice={practiceKey} onClickCapture={event => { if (event.target.closest?.('button')) markTried(n, practiceKey) }}>
      {children}
    </div>
  )
}

export function RenderBlock({ block, n }) {
  if (block.type === 'h3') return <h3 className="ls-h3" id={block.id}><Md text={block.text} /></h3>
  if (block.type === 'p') return <Para text={block.text} />
  if (block.type === 'examples') return <Examples pairs={block.pairs} />
  if (block.type === 'pairs') return <Pairs pairs={block.pairs} />
  if (block.type === 'table') return <Table head={block.head} body={block.body} />
  if (block.type === 'note') return <Note label={block.label} text={block.text} />
  if (block.type === 'list') return <List ordered={block.ordered} items={block.items} />
  if (block.type === 'quick-practice') return <Practised n={n} id={`practice-qp-${block.index}`} practiceKey={`qp:${block.index}`}><QuickPractice chapterNum={n} index={block.index} /></Practised>
  if (block.type === 'drill') return <Practised n={n} id={`practice-drill-${block.drillId}`} practiceKey={`drill:${block.drillId}`}><EmbeddedDrill chapterNum={n} drillId={block.drillId} /></Practised>
  if (block.type === 'hr') return <hr className="ls-rule" />
  return null
}

/** The Words to Learn section: the word table as flip-card groups. */
export function Section({ s, n }) {
  const vocabulary = /^words-to-learn/.test(s.id)
  const vocabGroups = []
  const groupedIndexes = new Set()
  if (vocabulary) {
    s.blocks.forEach((block, index) => {
      if (block.type !== 'table') return
      const labelIndex = index > 0 && s.blocks[index - 1].type === 'p' ? index - 1 : null
      vocabGroups.push({ label: labelIndex === null ? null : s.blocks[labelIndex].text, table: block })
      groupedIndexes.add(index)
      if (labelIndex !== null) groupedIndexes.add(labelIndex)
    })
  }
  const firstGroup = groupedIndexes.size ? Math.min(...groupedIndexes) : -1
  return s.blocks.map((b, i) => {
    if (vocabulary && groupedIndexes.has(i) && i !== firstGroup) return null
    const el = vocabulary && i === firstGroup
      ? <WordCards groups={vocabGroups} lesson={n} />
      : <RenderBlock block={b} n={n} />
    return <div key={i} className="blk">{el}{figureAfter(n, s.id, b, i, s)}</div>
  })
}

// eslint-disable-next-line react-refresh/only-export-components
export function firstUnfinishedExerciseHref(exercises, progress) {
  const unfinished = exercises.find(exercise => {
    const answered = Object.keys(progress[exercise.id]?.state || {}).length
    return answered < exercise.items.length
  })
  if (!unfinished) return null
  return unfinished.number == null ? '#exercises' : `#ex-${unfinished.number}`
}

// eslint-disable-next-line react-refresh/only-export-components
export function readLessonExerciseProgress(exercises, storage) {
  return Object.fromEntries(exercises.map(exercise => [exercise.id, readExerciseState(exercise, storage)]))
}

export function FinishActions({ n, next, hasQuiz, vocabCount, exStats, firstUnfinishedHref }) {
  const remaining = Math.max(0, exStats.total - exStats.answered)
  const continueExercises = remaining > 0 ? (firstUnfinishedHref || '#exercises') : null
  const quizIsPrimary = !continueExercises && !next && hasQuiz
  const cardsArePrimary = !continueExercises && !next && !hasQuiz && vocabCount > 0

  return (
    <div className="finish-next">
      {continueExercises && (
        <a href={continueExercises} className="nx nx-main">
          <span className="nx-k">Recommended · {remaining} {remaining === 1 ? 'item' : 'items'} left</span>
          <span className="nx-t display">Continue exercises</span>
          <span className="nx-arr">↓</span>
        </a>
      )}
      {next && (
        <Link to={`/lessons/${next.chapter}`} className={`nx ${continueExercises ? '' : 'nx-main'}`}>
          <span className="nx-k">{continueExercises ? 'Continue the course' : `Up next · Lesson ${next.chapter}`}</span>
          <span className={`nx-t ${continueExercises ? '' : 'display'}`}>{continueExercises ? `Lesson ${next.chapter} · ${next.title}` : next.title}</span>
          {!continueExercises && <EntryMotif className="nx-entry" index={next.chapter - 1} />}
        </Link>
      )}
      {hasQuiz && (
        <Link to={`/quizzes/${n}`} className={`nx ${quizIsPrimary ? 'nx-main' : ''}`}>
          <span className="nx-k">Check yourself</span>
          <span className={`nx-t ${quizIsPrimary ? 'display' : ''}`}>Lesson {n} quiz · 10 questions</span>
          {quizIsPrimary && <EntryMotif className="nx-entry" index={n - 1} />}
        </Link>
      )}
      {vocabCount > 0 && (
        <Link to={`/cards?lesson=${n}`} className={`nx ${cardsArePrimary ? 'nx-main' : ''}`}>
          <span className="nx-k">Keep the words</span>
          <span className={`nx-t ${cardsArePrimary ? 'display' : ''}`}>Flip cards for Lesson {n}</span>
          {cardsArePrimary && <EntryMotif className="nx-entry" index={n} />}
        </Link>
      )}
      {!continueExercises && !next && !hasQuiz && vocabCount === 0 && (
        <Link to="/lessons" className="nx nx-main">
          <span className="nx-k">Keep learning</span>
          <span className="nx-t display">All lessons</span>
          <EntryMotif className="nx-entry" index={0} />
        </Link>
      )}
    </div>
  )
}

/** The figures that sit after a block: each figure at its first matching block only. */
// eslint-disable-next-line react-refresh/only-export-components
export function figurePlaces(s, figures) {
  const out = new Map()
  for (const def of figures) {
    if (!s.id.startsWith(def.after.section)) continue
    const index = s.blocks.findIndex(def.after.block)
    if (index < 0) continue
    out.set(index, [...(out.get(index) || []), def])
  }
  return out
}

export function LessonBlocks({ s, n, figures, look }) {
  const places = useMemo(() => figurePlaces(s, figures), [s, figures])
  return s.blocks.map((block, i) => {
    let el
    if (block.type === 'quick-practice') {
      const ex = quickPractice[String(n)]?.[block.index]
      el = ex?.items?.length ? (
        <Practised n={n} id={`practice-qp-${block.index}`} practiceKey={`qp:${block.index}`}>
          <SteppedQuick ex={ex} />
        </Practised>
      ) : null
    } else {
      el = <RenderBlock block={block} n={n} />
    }
    const here = places.get(i) || []
    return (
      <div key={i} className="blk">
        {el}
        {figureAfter(n, s.id, block, i, s)}
        {here.map(def => (TestVariant && look === '2' && def.id === '15.1'
          ? <Suspense key={def.id} fallback={null}><TestVariant which="look2" /></Suspense>
          : <Figure key={def.id} def={def} />))}
      </div>
    )
  })
}

export function LessonSections({ sections, n, figures, exercises, onProgress, stored, look, from = 0, to }) {
  return sections.slice(from, to).map((s, offset) => (
    <section key={s.id} id={s.id} className={`ls-sec ${s.exercises ? 'is-ex' : ''}`}>
      <div className="ls-sec-head">
        <span className="ls-sec-n">{String(from + offset + 1).padStart(2, '0')}</span>
        <h2 className="ls-h2 display" tabIndex={-1}><Md text={s.title} /></h2>
      </div>
      {s.exercises
        ? <SteppedExercises exercises={exercises} onProgress={onProgress} stored={stored} />
        : /^words-to-learn/.test(s.id)
          ? <Section s={s} n={n} />
          : <LessonBlocks s={s} n={n} figures={figures} look={look} />}
    </section>
  ))
}

export function OpeningRow({ opening }) {
  if (!opening) return null
  return (
    <div className="pl-open" data-figure-still="">
      <div className="pl-open-row" role="img" aria-label={`${opening.say} ${opening.en}`}>
        {opening.row.map(face => <StaticTile key={face.text} face={face} />)}
      </div>
      <p className="pl-open-side">
        <span className="pl-open-en" data-en={opening.en}>{opening.en}</span>
        <span className="pl-open-cap">The shape this lesson teaches</span>
      </p>
    </div>
  )
}

export function Hero({ n, meta, lesson, mins, exercises, vocabCount, opening }) {
  const parts = [
    mins && `${mins} min read`,
    exercises.length > 0 && `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`,
    vocabCount > 0 && `${vocabCount} ${vocabCount === 1 ? 'new word' : 'new words'}`,
  ].filter(Boolean)
  return (
    <header className="ls-hero pl-hero">
      <div className="pl-col">
        <nav className="crumbs pl-crumbs" aria-label="Breadcrumb">
          <KupesiTile {...lessonTile(n, 0)} framed size={28} className="pl-crumb-tile" style={{ color: COLOURS[n] }} />
          <Link to="/lessons" className="pl-crumb-a">Lessons</Link>
          <span aria-hidden="true">/</span>
          <span>{`Lesson ${n} of 52`}</span>
        </nav>
        <h1 className="ls-h1 display">{meta.title}</h1>
        {lesson && lesson.intro.map((block, i) => (block.type === 'p'
          ? <p key={i} className="ls-intro"><Md text={block.text} /></p>
          : block.type === 'hr' ? null : <div key={i} className="ls-intro-block"><RenderBlock block={block} n={n} /></div>))}
        <OpeningRow opening={opening} />
        <p className="pl-length">{parts.join(', ')}</p>
      </div>
    </header>
  )
}

function Finish({ n, meta, next, exStats, vocabCount, firstUnfinishedHref, learn, path }) {
  const { done } = useProgress()
  const [celebrate, setCelebrate] = useState(false)
  const known = (path.known || []).filter(i => learn.items.some(item => item.i === i && item.to))
  const points = learn.items.filter(item => item.to).length
  const isDone = done.has(n)
  const hasQuiz = Boolean(quizzes[String(n)])
  const finish = () => { markLessonDone(n); setCelebrate(true) }
  return (
    <section className={`finish band grain ${isDone ? 'is-done' : ''}`} id="finish">
      <AnimatePresence mode="wait">
        {!isDone ? (
          <Motion.div key="ask" className="finish-ask" exit={{ opacity: 0, y: -10 }}>
            <p className="finish-k">End of Lesson {n}</p>
            <PromiseCheck n={n} learn={learn} known={path.known} />
            <h2 className="finish-h display">Ready to mark it done?</h2>
            {exStats.total > 0 && (
              <p className="finish-p">You have answered {exStats.answered} of {exStats.total} exercise items{exStats.answered < exStats.total ? '. You can finish now and come back to the rest.' : '.'}</p>
            )}
            <button type="button" className="btn btn-primary finish-b" onClick={finish}>Finish Lesson {n} <span className="arr">✓</span></button>
          </Motion.div>
        ) : (
          <Motion.div key="done" className="finish-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="finish-burst" aria-hidden="true">
              {[...Array(12)].map((_, i) => (
                <Motion.span
                  key={i}
                  initial={celebrate ? { scale: 0, rotate: 0, opacity: 0 } : false}
                  animate={{ scale: 1, rotate: (i % 2 ? 1 : -1) * 90, opacity: 1 }}
                  transition={{ delay: 0.05 * i, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  style={{ '--a': `${i * 30}deg` }}
                >
                  <KupesiTile {...lessonTile(n, i)} framed style={{ color: COLOURS[n] }} />
                </Motion.span>
              ))}
              <Motion.span className="finish-check" initial={celebrate ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.2 }}>✓</Motion.span>
            </div>
            <p className="finish-k">Lesson {n} complete</p>
            <h2 className="finish-h display">{meta.title}. Done.</h2>
            <p className="finish-p">
              {exStats.answered > 0 ? `You got ${exStats.right} of ${exStats.answered} right first time. ` : ''}
              That is {done.size} of 52 lessons.
            </p>
            <CourseStrip n={n} fill={celebrate} />
            {known.length > 0 && <p className="finish-p pc-done">{`You knew ${known.length} of ${points} points.`}</p>}
            <FinishActions n={n} next={next} hasQuiz={hasQuiz} vocabCount={vocabCount} exStats={exStats} firstUnfinishedHref={firstUnfinishedHref} />
            <MembershipFinishLine />
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** The flags that sit on <html> for this page only: the lesson bar appears once the hero has passed. */
function usePageFlags(band) {
  useEffect(() => {
    const root = document.documentElement
    if (band) root.dataset.band = 'line'
    const onScroll = () => {
      root.dataset.pastHero = window.scrollY > (window.__lessonHeroBottom ?? 600) ? 'true' : 'false'
      if (band) root.dataset.bandLine = window.scrollY > 40 ? 'on' : 'off'
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      delete root.dataset.band
      delete root.dataset.bandLine
      delete root.dataset.pastHero
    }
  }, [band])
}

export default function Lesson() {
  const { num } = useParams()
  const [params] = useSearchParams()
  const n = Number(num)
  const meta = chapters.find(c => c.chapter === n)
  useTitle(meta ? `Lesson ${n}: ${meta.title}` : 'Lesson not found')
  // Capture flags work in a test build only.
  const flag = name => (__TEST_BUILD__ ? params.get(name) : null)
  const structure = ['a', 'b', 'c'].includes(flag('structure')) ? flag('structure') : 'a'
  const solo = flag('solo')
  const view = flag('view')
  const look = flag('look')
  usePageFlags(flag('band') === 'line')

  const [loaded, setLoaded] = useState(null)
  const [active, setActive] = useState(null)
  const [exerciseProgress, setExerciseProgress] = useState({})
  const path = useLessonPath(n)
  const { done } = useProgress()
  const heroRef = useRef(null)

  useEffect(() => {
    let live = true
    Promise.all([loadLesson(n), loadFigureFile(n)]).then(([lesson, file]) => { if (live) setLoaded({ n, lesson, file }) })
    if (meta) markLessonOpened(n)
    return () => { live = false }
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentLesson = loaded?.n === n ? loaded.lesson : null
  const file = loaded?.n === n ? loaded.file : null
  const figures = useMemo(() => file?.figures || [], [file])
  const sections = useMemo(() => (currentLesson ? groupSections(currentLesson.blocks) : []), [currentLesson])
  const exercises = useMemo(() => bookExercises[String(n)] || [], [n])
  const stored = useMemo(() => readLessonExerciseProgress(bookExercises[String(n)] || []), [n])

  useEffect(() => {
    if (!sections.length) return undefined
    const els = [...sections.map(s => document.getElementById(s.id)), document.getElementById('finish')].filter(Boolean)
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-30% 0px -60% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  // Learn: the highest teaching section reached and the last one read, for the sheet and the resume button.
  useEffect(() => {
    if (!active || active === 'finish') return undefined
    const index = teachingSections(sections).findIndex(s => s.id === active)
    if (index < 0) return undefined
    const id = setTimeout(() => markRead(n, index, active), 500)
    return () => clearTimeout(id)
  }, [active, sections, n])

  useEffect(() => {
    const hero = heroRef.current?.querySelector('.ls-hero')
    if (!hero) return
    window.__lessonHeroBottom = hero.offsetTop + hero.offsetHeight - 80
  })

  const ex = useMemo(() => ({ ...stored, ...(exerciseProgress[n] || {}) }), [exerciseProgress, n, stored])
  const onProgress = (id, state, total) => setExerciseProgress(all => ({ ...all, [n]: { ...(all[n] || {}), [id]: { state, total } } }))
  const exStats = useMemo(() => {
    const total = exercises.reduce((a, e) => a + e.items.length, 0)
    const vals = Object.values(ex).flatMap(e => Object.values(e.state))
    return { total, answered: vals.length, right: vals.filter(Boolean).length }
  }, [ex, exercises])
  const firstUnfinishedHref = useMemo(() => firstUnfinishedExerciseHref(exercises, ex), [ex, exercises])
  const learn = useMemo(() => (meta && currentLesson ? learnModel({ n, meta: withRecall(meta, file?.recall), sections }) : null), [n, meta, sections, currentLesson, file])

  if (!meta) return <div className="wrap" style={{ padding: '160px 0' }}><h1 className="display">No Lesson {num}</h1><Link to="/lessons" className="link">All lessons</Link></div>
  if (TestVariant && solo) return <Suspense fallback={null}><TestVariant which="solo" figures={figures} id={solo} /></Suspense>
  if (TestVariant && view === 'tile-compare') return <Suspense fallback={null}><TestVariant which="tile-compare" /></Suspense>

  const prev = chapters.find(c => c.chapter === n - 1)
  const next = chapters.find(c => c.chapter === n + 1)
  const mins = currentLesson ? Math.max(3, Math.round(wordCount(currentLesson) / 200)) : null
  const vocabCount = currentLesson ? sections.filter(s => /^words-to-learn/.test(s.id)).flatMap(s => s.blocks.filter(b => b.type === 'table')).reduce((a, t) => a + t.body.length, 0) : 0
  const hasQuiz = Boolean(quizzes[String(n)])
  const tokens = __TEST_BUILD__ && params.get('tile') === 'v1' ? { '--tile-name': '#1f6b3a' } : undefined
  const common = { n, meta, lesson: currentLesson, mins, exercises, vocabCount }

  if (TestVariant && (structure === 'b' || structure === 'c')) {
    return (
      <RevealOff.Provider value>
        <article className={`lesson pl pl-${structure}`} style={tokens} ref={heroRef}>
          <Suspense fallback={null}>
            <TestVariant which={structure} {...common} sections={sections} figures={figures} opening={file?.opening || null} />
          </Suspense>
        </article>
      </RevealOff.Provider>
    )
  }

  return (
    <RevealOff.Provider value>
      <article className="lesson pl" style={tokens} ref={heroRef} data-done={done.has(n) ? 'true' : 'false'}>
        <Hero {...common} opening={file?.opening || null} />
        {currentLesson && learn && (
          <Contents n={n} sections={sections} active={active} learn={learn} path={path} exStats={exStats} hasQuiz={hasQuiz} prev={prev} next={next} />
        )}
        <div className="pl-col ls-body pl-body">
          {!currentLesson && <div className="ls-skel" aria-busy="true">{[...Array(6)].map((_, i) => <i key={i} />)}</div>}
          <LessonSections sections={sections} n={n} figures={figures} exercises={exercises} onProgress={onProgress} stored={stored} look={look} />
        </div>
        {currentLesson && learn && <Finish n={n} meta={meta} next={next} exStats={exStats} vocabCount={vocabCount} firstUnfinishedHref={firstUnfinishedHref} learn={learn} path={path} />}
      </article>
    </RevealOff.Provider>
  )
}
