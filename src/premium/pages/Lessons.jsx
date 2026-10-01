import { okinafy } from '@app/lib/okinafy.js'
import { useMemo, useRef, useState } from 'react'
import { useTitle } from '../lib/title.js'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion as Motion } from 'motion/react'
import chapters from '@app/data/chapters.json'
import { LESSON_TIERS, LESSON_GROUPS, filterLessons, lessonLevel, splitMixedTonganText } from '@app/lib/lesson-browser.js'
import { lessonColours, lessonTile } from '../lib/lesson-colour.js'
import T from '../components/T.jsx'
import { KupesiTile } from '../components/Kupesi.jsx'
import { MembershipEndOffer } from '../components/MembershipNotice.jsx'
import { AUDIO_MEMBERSHIP_NOTICE } from '../lib/membership-offer.js'
import { useProgress } from '../lib/progress.js'
import '../styles/lessons.css'

const LEVELS = [{ key: 'all', name: 'All' }, ...LESSON_TIERS.map(t => ({ key: t.key, name: t.name }))]
// Same tile, flip and shade as the lesson's square on the homepage map.
const COLOURS = lessonColours(chapters, lessonLevel)

function Mixed({ text, scope }) {
  return splitMixedTonganText(okinafy(text), scope).map((seg, i) =>
    seg.tongan ? <T key={i}>{seg.text}</T> : <span key={i}>{seg.text}</span>)
}

function ResumeCard() {
  const { done, last } = useProgress()
  // Resume the last lesson opened; once it is finished, offer the next one.
  const target = last ? (done.has(last) ? Math.min(52, last + 1) : last) : 1
  const lesson = chapters.find(c => c.chapter === target)
  const resuming = Boolean(last)
  const upNext = resuming && done.has(last) && target !== last
  return (
    <Motion.aside className="resume band grain" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .2, ease: [.16, 1, .3, 1] }}>
      <div className="resume-top">
        <span className="resume-k">{upNext ? 'Up next' : resuming ? 'Pick up where you left off' : 'Your first lesson'}</span>
        <span className="resume-n display">{String(lesson.chapter).padStart(2, '0')}</span>
      </div>
      <h2 className="resume-title display">{lesson.title}</h2>
      {lesson.teaching?.key_rules?.[0] && (
        <p className="resume-ex"><T>{lesson.teaching.key_rules[0].example_tongan}</T> <span>{lesson.teaching.key_rules[0].example_english}</span></p>
      )}
      <Link to={`/lessons/${lesson.chapter}`} className="btn btn-primary">
        {upNext ? `Start Lesson ${lesson.chapter}` : resuming ? `Continue Lesson ${lesson.chapter}` : "Start Lesson 1, it's free"} <span className="arr">→</span>
      </Link>
      <div className="resume-meter" aria-label={`${done.size} of 52 lessons complete`}>
        <div className="resume-bars">
          {chapters.map(c => <i key={c.chapter} className={done.has(c.chapter) ? 'on' : ''} />)}
        </div>
        <span>{done.size} of 52 complete</span>
      </div>
    </Motion.aside>
  )
}

function Row({ c, i, done }) {
  const ex = c.teaching?.key_rules?.[0]
  return (
    <Motion.li
      layout="position"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      viewport={{ once: true, margin: '-6% 0px' }}
      transition={{ duration: .6, delay: (i % 6) * .04, ease: [.16, 1, .3, 1] }}
    >
      <Link to={`/lessons/${c.chapter}`} className={`row ${done ? 'is-done' : ''}`}>
        <span className="row-tile" aria-hidden="true"><KupesiTile {...lessonTile(c.chapter)} framed style={{ color: COLOURS[c.chapter] }} /></span>
        <span className="row-n display">{String(c.chapter).padStart(2, '0')}</span>
        <span className="row-main">
          <span className="row-title">{c.title}</span>
          <span className="row-topics"><Mixed text={c.topics.slice(0, 2).join(' · ')} /></span>
        </span>
        {ex && (
          <span className="row-ex">
            <T className="row-ex-to">{ex.example_tongan}</T>
            <span className="row-ex-en"><Mixed text={ex.example_english} scope="gloss" /></span>
          </span>
        )}
        <span className="row-end" aria-hidden="true">
          {done ? <span className="row-check">✓</span> : <span className="row-arr">→</span>}
        </span>
      </Link>
    </Motion.li>
  )
}

export default function Lessons() {
  useTitle('All 52 lessons')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const inputRef = useRef(null)
  const { done } = useProgress()
  const results = useMemo(() => filterLessons(chapters, { query, level }), [query, level])

  const tiers = LESSON_TIERS
    .filter(t => level === 'all' || t.key === level)
    .map(t => ({
      ...t,
      groups: LESSON_GROUPS.filter(g => t.groupKeys.includes(g.key)).map(g => ({ ...g, lessons: results.filter(r => r.group === g.key) })).filter(g => g.lessons.length),
      total: chapters.filter(c => lessonLevel(c) === t.key),
    }))
    .filter(t => t.groups.length)

  return (
    <div className="lessons">
      <section className="lx-hero">
        <div className="wrap lx-hero-grid">
          <div>
            <Motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .05 }}>The full course · Beginner to advanced</Motion.p>
            <h1 className="lx-h1 display">
              {['52 lessons.', 'One clear path.'].map((l, i) => (
                <span className="lx-line" key={l}>
                  <Motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, delay: .08 + i * .08, ease: [.16, 1, .3, 1] }}>{l}</Motion.span>
                </span>
              ))}
            </h1>
            <Motion.p className="lx-lead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .8 }}>
              Every lesson has worked examples, exercises and a 10-question quiz. Start at the beginning or find the lesson you need.
            </Motion.p>
          </div>
          <ResumeCard />
        </div>
      </section>

      <div className="lx-bar">
        <div className="wrap lx-bar-in">
          <label className="lx-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <span className="visually-hidden">Search lessons</span>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search lessons" />
            {query && <button className="lx-clear" onClick={() => { setQuery(''); inputRef.current?.focus() }} aria-label="Clear search">×</button>}
          </label>
          <label className="lx-level-sel">
            <span className="visually-hidden">Level</span>
            <select value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l.key} value={l.key}>{l.key === 'all' ? 'All levels' : l.name}</option>)}
            </select>
          </label>
          <div className="seg" role="radiogroup" aria-label="Level">
            {LEVELS.map(l => (
              <button key={l.key} role="radio" aria-checked={level === l.key} className={`seg-b ${level === l.key ? 'is-on' : ''}`} onClick={() => setLevel(l.key)}>
                {level === l.key && <Motion.span layoutId="seg-pill" className="seg-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                <span className="seg-t">{l.name}</span>
              </button>
            ))}
          </div>
          <span className="lx-count" aria-live="polite">{results.length} {results.length === 1 ? 'lesson' : 'lessons'}</span>
        </div>
      </div>

      <div className="wrap lx-list">
        <AnimatePresence mode="popLayout">
          {tiers.length === 0 && (
            <Motion.div className="lx-empty" key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="lx-empty-t">No lesson matches “{query}”.</p>
              <p>Try a topic like <button onClick={() => setQuery('possessives')}>possessives</button> or a Tongan word like <button onClick={() => setQuery('ʻoku')} lang="to" className="to">ʻoku</button>.</p>
              <button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setLevel('all') }}>Show all 52 lessons</button>
            </Motion.div>
          )}
          {tiers.map(t => (
            <Motion.section key={t.key} className={`tier-block lvl-${t.key}`} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <header className="tier-head">
                <h2 className="display">{t.name}</h2>
                <p className="tier-blurb">{t.blurb}</p>
                <span className="tier-meta">Lessons {t.total[0].chapter} to {t.total[t.total.length - 1].chapter}</span>
              </header>
              {t.groups.map(g => (
                <div key={g.key} className="grp">
                  <div className="grp-head">
                    <h3><span>{g.name}</span> <em>{g.verbPhrase}</em></h3>
                    <p><Mixed text={g.lead} /></p>
                  </div>
                  <ol className="rows">
                    {g.lessons.map((c, i) => <Row key={c.chapter} c={c} i={i} done={done.has(c.chapter)} />)}
                  </ol>
                </div>
              ))}
            </Motion.section>
          ))}
        </AnimatePresence>
      </div>

      {/* After the whole course has been seen, the offer makes sense (Strategy change 8). */}
      <MembershipEndOffer
        id="lessons-membership-title"
        placement="end"
        title="All 52 lessons are open during the free preview."
        lead={AUDIO_MEMBERSHIP_NOTICE}
      />
    </div>
  )
}
