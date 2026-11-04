/**
 * /__proto/lesson/:n, the private prototype of a calmer lesson page
 * (reviews/lesson-simplify-2026-11-05/Direction.md). ?structure=a is the recommended
 * Quiet page with stepped practice, complete to the done state; b and c show their
 * first two screens. It reads the site's own lesson loader, Blocks, chrome and tokens,
 * and writes the same saved progress as the live page. Nothing here deploys.
 *
 * Capture flags: ?still=1 (no auto-play), ?solo=15.1 (one figure alone), ?look=2
 * (Figure 15.1 in type only), ?band=line (the band's own question), ?view=tile-compare.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import quizzes from '@app/data/quizzes.json'
import bookExercises from '@app/data/book-exercises.json'
import quickPractice from '@app/data/quick-practice.json'
import { lessonLevel } from '@app/lib/lesson-browser.js'
import { useTitle } from '../lib/title.js'
import { loadLesson } from '../lib/book.js'
import { markLessonDone, markLessonOpened, useProgress } from '../lib/progress.js'
import { Md, RevealOff } from '../components/lesson/Blocks.jsx'
import { KupesiTile } from '../components/Kupesi.jsx'
import { lessonColours, lessonTile } from '../lib/lesson-colour.js'
import { groupSections, learnModel, teachingSections } from '../lib/lesson-plan.js'
import { FIGURE_PLAN } from '../lib/figure-plan.js'
import { markRead, markTried } from '../lib/lesson-path-store.js'
import { useLessonPath } from '../components/lesson/LessonPath.jsx'
import CourseStrip from '../components/lesson/CourseStrip.jsx'
import PromiseCheck from '../components/lesson/PromiseCheck.jsx'
import { MembershipFinishLine } from '../components/MembershipNotice.jsx'
import { FinishActions, RenderBlock, Section, firstUnfinishedExerciseHref, readLessonExerciseProgress } from '../pages/Lesson.jsx'
import '../styles/lesson.css'
import '../styles/lesson-experience.css'
import '../styles/source-core.css'
import '../styles/lesson-course.css'
import './proto.css'
import Contents from './Contents.jsx'
import { SteppedExercises, SteppedQuick } from './SteppedSet.jsx'
import Figure, { StaticTile } from './figures/Figure.jsx'
import { FIGURES_15, F15_1, OPENING_15, RECALL_15 } from './figures/lesson15.js'
import { FIGURES_2, OPENING_2, RECALL_2 } from './figures/lesson2.js'
import { FIGURES_28, OPENING_28, RECALL_28 } from './figures/lesson28.js'
import { Look2Figure, StructureB, StructureC, TileCompare } from './Alternatives.jsx'

const COLOURS = lessonColours(chapters, lessonLevel)

const FIGURES = { 2: FIGURES_2, 15: FIGURES_15, 28: FIGURES_28 }
const OPENING = { 2: OPENING_2, 15: OPENING_15, 28: OPENING_28 }
const RECALL = { 2: RECALL_2, 15: RECALL_15, 28: RECALL_28 }

/** Recall cards read the lesson's own book sentences; the rule text stays as it is. */
function withRecall(meta, recall) {
  if (!meta?.teaching?.key_rules || !recall) return meta
  const key_rules = meta.teaching.key_rules.map((rule, i) => (recall[i]
    ? { ...rule, example_tongan: recall[i].to, example_english: recall[i].en }
    : rule))
  return { ...meta, teaching: { ...meta.teaching, key_rules } }
}

function wordCount(lesson) {
  return (JSON.stringify(lesson.blocks) + JSON.stringify(lesson.intro)).split(/\s+/).length
}

/** The figures that sit after a block: each figure at its first matching block only. */
function figurePlaces(s, figures) {
  const out = new Map()
  for (const def of figures) {
    if (!s.id.startsWith(def.after.section)) continue
    const index = s.blocks.findIndex(def.after.block)
    if (index < 0) continue
    out.set(index, [...(out.get(index) || []), def])
  }
  return out
}

function Practised({ n, id, practiceKey, children }) {
  return (
    <div id={id} data-practice={practiceKey} onClickCapture={event => { if (event.target.closest?.('button')) markTried(n, practiceKey) }}>
      {children}
    </div>
  )
}

export function ProtoBlocks({ s, n, figures, look }) {
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
        {here.map(def => (look === '2' && def.id === '15.1' ? <Look2Figure key={def.id} /> : <Figure key={def.id} def={def} />))}
      </div>
    )
  })
}

export function ProtoSections({ sections, n, figures, exercises, onProgress, stored, look, from = 0, to }) {
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
          : <ProtoBlocks s={s} n={n} figures={figures} look={look} />}
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

export function Hero({ n, meta, lesson, mins, exercises, vocabCount, figures }) {
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
        {figures && <OpeningRow opening={OPENING[n]} />}
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

/** The flags that sit on <html> for this page only. */
function usePageFlags(params) {
  useEffect(() => {
    const root = document.documentElement
    const band = params.get('band') === 'line'
    if (band) root.dataset.band = 'line'
    const onScroll = () => {
      root.dataset.pastHero = window.scrollY > (window.__protoHeroBottom ?? 600) ? 'true' : 'false'
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
  }, [params])
}

function Solo({ id, n }) {
  const def = (FIGURES[n] || []).find(item => item.id === id)
  useEffect(() => {
    document.documentElement.dataset.solo = 'true'
    return () => { delete document.documentElement.dataset.solo }
  }, [])
  if (!def) return <p>No figure {id}</p>
  return <div className="pl pl-solo"><Figure def={def} autoplay={false} /></div>
}

export default function ProtoLesson() {
  const { num } = useParams()
  const [params] = useSearchParams()
  const n = Number(num)
  const meta = chapters.find(c => c.chapter === n)
  useTitle(meta ? `Lesson ${n}: ${meta.title}` : 'Lesson not found')
  usePageFlags(params)
  const structure = ['a', 'b', 'c'].includes(params.get('structure')) ? params.get('structure') : 'a'
  const solo = params.get('solo')
  const view = params.get('view')
  const look = params.get('look')
  const tile = params.get('tile')

  const [lesson, setLesson] = useState(null)
  const [active, setActive] = useState(null)
  const [exerciseProgress, setExerciseProgress] = useState({})
  const path = useLessonPath(n)
  const { done } = useProgress()
  const heroRef = useRef(null)

  useEffect(() => {
    let live = true
    loadLesson(n).then(l => { if (live) setLesson(l) })
    if (meta) markLessonOpened(n)
    return () => { live = false }
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentLesson = lesson?.chapter === n ? lesson : null
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
    window.__protoHeroBottom = hero.offsetTop + hero.offsetHeight - 80
  })

  const ex = useMemo(() => ({ ...stored, ...(exerciseProgress[n] || {}) }), [exerciseProgress, n, stored])
  const onProgress = (id, state, total) => setExerciseProgress(all => ({ ...all, [n]: { ...(all[n] || {}), [id]: { state, total } } }))
  const exStats = useMemo(() => {
    const total = exercises.reduce((a, e) => a + e.items.length, 0)
    const vals = Object.values(ex).flatMap(e => Object.values(e.state))
    return { total, answered: vals.length, right: vals.filter(Boolean).length }
  }, [ex, exercises])
  const firstUnfinishedHref = useMemo(() => firstUnfinishedExerciseHref(exercises, ex), [ex, exercises])
  const learn = useMemo(() => (meta && currentLesson ? learnModel({ n, meta: withRecall(meta, RECALL[n]), sections, plan: FIGURE_PLAN }) : null), [n, meta, sections, currentLesson])

  if (!meta) return <div className="wrap" style={{ padding: '160px 0' }}><h1 className="display">No Lesson {num}</h1><Link to="/lessons" className="link">All lessons</Link></div>
  if (solo) return <Solo id={solo} n={n} />
  if (view === 'tile-compare') return <TileCompare />

  const prev = chapters.find(c => c.chapter === n - 1)
  const next = chapters.find(c => c.chapter === n + 1)
  const mins = currentLesson ? Math.max(3, Math.round(wordCount(currentLesson) / 200)) : null
  const vocabCount = currentLesson ? sections.filter(s => /^words-to-learn/.test(s.id)).flatMap(s => s.blocks.filter(b => b.type === 'table')).reduce((a, t) => a + t.body.length, 0) : 0
  const figures = FIGURES[n] || []
  const hasQuiz = Boolean(quizzes[String(n)])
  const tokens = tile === 'v1' ? { '--tile-name': '#1f6b3a' } : undefined

  const common = { n, meta, lesson: currentLesson, mins, exercises, vocabCount }

  if (structure === 'b') {
    return (
      <RevealOff.Provider value>
        <article className="lesson pl pl-b" style={tokens} ref={heroRef}>
          <StructureB {...common} sections={sections} figures={figures} />
        </article>
      </RevealOff.Provider>
    )
  }
  if (structure === 'c') {
    return (
      <RevealOff.Provider value>
        <article className="lesson pl pl-c" style={tokens} ref={heroRef}>
          <StructureC {...common} sections={sections} def={F15_1} opening={OPENING[n]} />
        </article>
      </RevealOff.Provider>
    )
  }

  return (
    <RevealOff.Provider value>
      <article className="lesson pl" style={tokens} ref={heroRef} data-done={done.has(n) ? 'true' : 'false'}>
        <Hero {...common} figures />
        {currentLesson && learn && (
          <Contents n={n} sections={sections} active={active} learn={learn} path={path} exStats={exStats} hasQuiz={hasQuiz} prev={prev} next={next} />
        )}
        <div className="pl-col ls-body pl-body">
          {!currentLesson && <div className="ls-skel" aria-busy="true">{[...Array(6)].map((_, i) => <i key={i} />)}</div>}
          <ProtoSections sections={sections} n={n} figures={figures} exercises={exercises} onProgress={onProgress} stored={stored} look={look} />
        </div>
        {currentLesson && learn && <Finish n={n} meta={meta} next={next} exStats={exStats} vocabCount={vocabCount} firstUnfinishedHref={firstUnfinishedHref} learn={learn} path={path} />}
      </article>
    </RevealOff.Provider>
  )
}

