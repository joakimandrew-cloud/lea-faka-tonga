/**
 * The other two page structures, built to their first two screens with one real
 * figure in place, and the looks shown alone: Figure 15.1 in type only, and the
 * name tile's two colours. Direction.md part 3 and part 4.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Md } from '../components/lesson/Blocks.jsx'
import { KupesiTile } from '../components/Kupesi.jsx'
import { lessonTile } from '../lib/lesson-colour.js'
import { teachingSections } from '../lib/lesson-plan.js'
import { RenderBlock } from '../pages/Lesson.jsx'
import Figure, { Label, StaticTile } from '../figure-engine/Figure.jsx'
import { rowTimeline } from '../figure-engine/row.js'
import { Hero } from '../pages/Lesson.jsx'
import '../styles/lesson-page.css'

function BlocksWithFigure({ section, n, figures }) {
  return section.blocks.map((block, i) => {
    const here = figures.filter(def => section.id.startsWith(def.after.section) && section.blocks.findIndex(def.after.block) === i)
    return (
      <div key={i} className="blk">
        <RenderBlock block={block} n={n} />
        {here.map(def => <Figure key={def.id} def={def} />)}
      </div>
    )
  })
}

// Test builds only (plan 2026-11-05-lesson-page-simplify): the ruled-out structures and looks, kept for capture.

/** B, One point at a time: the lesson paged into points. A Start screen, then a point with Next and Back. */
export function StructureB({ n, meta, lesson, mins, exercises, vocabCount, sections, figures }) {
  const points = teachingSections(sections)
  const [at, setAt] = useState(() => (new URLSearchParams(window.location.search).get('point') ? Number(new URLSearchParams(window.location.search).get('point')) : -1))
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [at])
  if (!lesson) return null
  const dots = (
    <ol className="pb-dots" aria-label={`Point ${Math.max(at + 1, 0)} of ${points.length}`}>
      {points.map((point, i) => <li key={point.id} className={i === at ? 'is-on' : i < at ? 'is-past' : ''} />)}
    </ol>
  )
  if (at < 0) {
    return (
      <div className="pb-start">
        <Hero n={n} meta={meta} lesson={lesson} mins={mins} exercises={exercises} vocabCount={vocabCount} />
        <div className="pl-col pb-start-foot">
          {dots}
          <button type="button" className="btn btn-primary pb-go" onClick={() => setAt(0)}>Start</button>
        </div>
      </div>
    )
  }
  const point = points[at]
  return (
    <div className="pb-point">
      <div className="pl-col ls-body pl-body">
        <section className="ls-sec" id={point.id}>
          <div className="ls-sec-head">
            <span className="ls-sec-n">{String(sections.indexOf(point) + 1).padStart(2, '0')}</span>
            <h2 className="ls-h2 display" tabIndex={-1}><Md text={point.title} /></h2>
          </div>
          <BlocksWithFigure section={point} n={n} figures={figures} />
        </section>
      </div>
      <div className="pb-foot">
        {dots}
        <div className="pb-foot-b">
          <button type="button" className="fx-b" onClick={() => setAt(Math.max(-1, at - 1))}>Back</button>
          <button type="button" className="btn btn-primary pb-next" onClick={() => setAt(Math.min(points.length - 1, at + 1))}>Next</button>
        </div>
      </div>
    </div>
  )
}

/** C, The stage: a figure held on screen, changing as the matching text scrolls past. */
export function StructureC({ n, meta, lesson, mins, exercises, vocabCount, sections, def, opening }) {
  const first = sections[0]
  const textRef = useRef(null)
  const [t, setT] = useState(0)
  const timeline = rowTimeline(def.scenes[0])
  useEffect(() => {
    const onScroll = () => {
      const box = textRef.current?.getBoundingClientRect()
      if (!box) return
      const line = window.innerHeight * 0.55
      const progress = Math.min(1, Math.max(0, (line - box.top) / Math.max(1, box.height - 120)))
      setT(progress * timeline.duration)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [timeline.duration])
  if (!lesson || !first) return null
  return (
    <>
      <Hero n={n} meta={meta} lesson={lesson} mins={mins} exercises={exercises} vocabCount={vocabCount} opening={opening} />
      <div className="sc-grid">
        <div className="sc-text ls-body" ref={textRef}>
          <section className="ls-sec" id={first.id}>
            <div className="ls-sec-head">
              <span className="ls-sec-n">01</span>
              <h2 className="ls-h2 display" tabIndex={-1}><Md text={first.title} /></h2>
            </div>
            {first.blocks.map((block, i) => <div key={i} className="blk"><RenderBlock block={block} n={n} /></div>)}
          </section>
        </div>
        <aside className="sc-stage" aria-label="Pinned figure">
          <Figure def={def} external={t} autoplay={false} compact />
        </aside>
      </div>
    </>
  )
}

/** Figure 15.1's rest state in Look 2: serif Tongan on hairlines, numbered change marks. */
export function Look2Figure() {
  const words = [
    { w: 'Naʻe', role: 'tense', mark: 3 },
    { w: 'hiva', role: 'verb' },
    { w: 'ʻa', role: 'focus', mark: 2 },
    { w: 'Sione', role: 'noun', mark: 1 },
  ]
  return (
    <figure className="fl2" data-figure="15.1">
      <figcaption className="fx-head">
        <span className="fx-k">Figure 15.1</span>
        <span className="fx-t">One name, three changes</span>
      </figcaption>
      <p className="ft-before fl2-before">
        <span className="ft-before-k">Before</span>
        <span className="fx-to" lang="to" data-tongan="Naʻá ne hiva.">Naʻá ne hiva.</span>
        <span className="ft-before-en">He sang.</span>
      </p>
      <div className="fl2-row">
        {words.map(item => (
          <span key={item.w} className="fl2-cell">
            <span className="fl2-word" lang="to" data-tongan={item.w}>{item.w}{item.mark && <sup className="fl2-mark">{item.mark}</sup>}</span>
            <span className="ft-label fl2-label"><Label role={item.role} /></span>
          </span>
        ))}
      </div>
      <p className="ft-en fl2-en">Sione sang.</p>
    </figure>
  )
}

/** One still: the row with v1's green name tile beside the row with --tile-name. */
export function TileCompare() {
  const row = [
    { text: 'Naʻe', role: 'tense' },
    { text: 'hiva', role: 'verb' },
    { text: 'ʻa', role: 'focus' },
    { text: 'Sione', role: 'noun' },
  ]
  return (
    <div className="pl pl-compare">
      <div className="pl-compare-in">
        {[['#1f6b3a', 'v1 green, #1f6b3a'], ['#0f5c63', 'Proposed --tile-name, #0f5c63']].map(([colour, caption]) => (
          <section key={colour} className="fx pl-compare-col" style={{ '--tile-name': colour }}>
            <p className="fx-k">{caption}</p>
            <div className="pl-open-row">{row.map(face => <StaticTile key={face.text} face={face} />)}</div>
            <p className="pl-compare-sample"><span className="pl-compare-right">A right answer in the drills</span></p>
          </section>
        ))}
      </div>
      <p className="pl-compare-note"><KupesiTile {...lessonTile(15, 0)} framed size={20} /> <Link to="/__proto/lesson/15">Back to the lesson</Link></p>
    </div>
  )
}
