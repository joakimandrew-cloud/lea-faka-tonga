/**
 * The lesson path (reviews/lesson-course-2026-10-24/Direction.md, "The lesson
 * path"): seven steps that fill from what this browser saves. Densities: the
 * desktop rail, the phone plan card, and the finish band's pills.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import quickPractice from '@app/data/quick-practice.json'
import { drillRegistry } from '@app/drills/registry.js'
import { Md } from './Blocks.jsx'
import { Mixed } from './FigureEngine.jsx'
import { LESSON_PATH_EVENT, readPath } from '../../lib/lesson-path-store.js'
import { loadDeck, lessonDeckKey } from '../../lib/card-progress.js'
import { plainInline } from '../../lib/lesson-content.js'

/** The saved path of lesson n, read after mount so the prerendered page shows every step as not started. */
// eslint-disable-next-line react-refresh/only-export-components
export function useLessonPath(n) {
  const [path, setPath] = useState({})
  useEffect(() => {
    const on = () => setPath(readPath(n))
    const id = setTimeout(on, 0)
    window.addEventListener(LESSON_PATH_EVENT, on)
    window.addEventListener('storage', on)
    return () => { clearTimeout(id); window.removeEventListener(LESSON_PATH_EVENT, on); window.removeEventListener('storage', on) }
  }, [n])
  return path
}

/** The lesson's flip-card deck as saved, read after mount and on every card save. */
// eslint-disable-next-line react-refresh/only-export-components
export function useLessonDeck(n, cards) {
  const [deck, setDeck] = useState(null)
  useEffect(() => {
    const on = () => setDeck(cards.length ? loadDeck(lessonDeckKey(n), cards) : null)
    const id = setTimeout(on, 0)
    window.addEventListener('lft-premium-cards', on)
    window.addEventListener('storage', on)
    return () => { clearTimeout(id); window.removeEventListener('lft-premium-cards', on); window.removeEventListener('storage', on) }
  }, [n, cards])
  return deck
}

const STATE_WORD = { todo: 'Not started', part: 'In progress', done: 'Done' }
const nn = number => String(number).padStart(2, '0')

function Mark({ state }) {
  return (
    <span className={`path-mark is-${state}`}>
      {state === 'done' && <span aria-hidden="true">{'\u2713'}</span>}
      <span className="visually-hidden">{STATE_WORD[state]}</span>
    </span>
  )
}

function StepLink({ step, className, children }) {
  const attrs = {
    className, 'data-step': step.key, 'data-state': step.state,
    ...(step.next ? { 'data-next': '' } : {}),
  }
  return step.route
    ? <Link to={step.href} {...attrs}>{children}</Link>
    : <a href={step.href} {...attrs}>{children}</a>
}

function practiceTitle(n, row) {
  if (row.kind === 'drill') {
    const title = drillRegistry[row.drillId]?.meta?.title
    return { node: title || null, plain: title || '' }
  }
  const topic = quickPractice[String(n)]?.[row.qpIndex]?.topic
  return { node: topic ? <Md text={topic} /> : null, plain: topic ? plainInline(topic) : '' }
}

function PracticeRows({ n, rows }) {
  return (
    <ol className="path-sub">
      {rows.map(row => {
        const kind = row.kind === 'drill' ? 'Interactive practice' : 'Quick practice'
        const title = practiceTitle(n, row)
        return (
          <li key={row.key}>
            <a
              href={`#${row.anchor}`} className={`path-sub-a ${row.tried ? 'is-tried' : ''}`} data-practice-row={row.key}
              aria-label={`${kind}: ${title.plain}, section ${nn(row.sectionNumber)}${row.tried ? ', tried' : ''}`}
            >
              <span className="path-sub-dot" aria-hidden="true" />
              <span className="path-sub-t" aria-hidden="true">
                <span className="path-sub-k">{kind}</span>
                {title.node && <span className="path-sub-n">{title.node}</span>}
              </span>
              <span className="path-sub-s" aria-hidden="true">{`Section ${nn(row.sectionNumber)}`}{row.tried ? ' \u2713' : ''}</span>
            </a>
          </li>
        )
      })}
    </ol>
  )
}

function Detail({ step }) {
  return (
    <span className="path-d">
      {step.detail}
      {step.caption && <> {'\u00b7'} <Mixed text={step.caption} /></>}
    </span>
  )
}

function Right({ step }) {
  if (step.next) return <span className="rail-c path-next">Next</span>
  if (step.state === 'part' && step.count) return <span className="rail-c">{step.count.x}/{step.count.of}</span>
  return null
}

function PrevNext({ prev, next, className = '' }) {
  if (!prev && !next) return null
  return (
    <div className={`rail-nav ${className}`}>
      {prev && <Link to={`/lessons/${prev.chapter}`} className="rail-pn"><span>{`\u2190 Lesson ${prev.chapter}`}</span><em>{prev.title}</em></Link>}
      {next && <Link to={`/lessons/${next.chapter}`} className="rail-pn is-next"><span>{`Lesson ${next.chapter} \u2192`}</span><em>{next.title}</em></Link>}
    </div>
  )
}

export default function LessonPath({ n, model, sections = [], density, prev, next, activeStep, activeSection }) {
  const { steps, total, doneCount } = model
  const count = `${doneCount} of ${total} steps`

  if (density === 'finish') {
    return (
      <nav className="path-finish" aria-label="Lesson path" data-lesson-path="finish">
        <p className="finish-p path-finish-p">{`${doneCount} of ${total} steps done in this lesson.`}</p>
        <ol className="path-pills">
          {steps.map(step => (
            <li key={step.key}>
              <StepLink step={step} className={`path-pill is-${step.state}`}>
                {step.state === 'done' && <span aria-hidden="true">{'\u2713 '}</span>}
                {step.label}
                <span className="visually-hidden">{`, ${STATE_WORD[step.state]}`}</span>
              </StepLink>
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  const activeIndex = sections.findIndex(section => section.id === activeSection)
  const list = (
    <ol className="path-list">
      {steps.map(step => (
        <li key={step.key} className="path-li">
          <StepLink step={step} className={`path-a is-${step.state} ${step.next ? 'is-next' : ''} ${activeStep === step.key ? 'is-on' : ''}`}>
            <Mark state={step.state} />
            <span className="path-t">
              <span className="path-l">{step.label}</span>
              <Detail step={step} />
            </span>
            <Right step={step} />
          </StepLink>
          {density === 'rail' && step.key === 'learn' && (
            <ol className="path-sub">
              {step.sections.map(item => {
                const section = sections.find(candidate => candidate.id === item.id)
                const index = sections.findIndex(candidate => candidate.id === item.id)
                return (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className={`rail-a path-sec ${activeSection === item.id ? 'is-on' : ''} ${activeIndex > index ? 'is-past' : ''}`}>
                      <span className="rail-dot" />
                      <span className="rail-t"><Md text={section?.title || ''} /></span>
                    </a>
                  </li>
                )
              })}
            </ol>
          )}
          {step.key === 'practise' && <PracticeRows n={n} rows={step.rows} />}
        </li>
      ))}
    </ol>
  )

  if (density === 'rail') {
    return (
      <nav className="rail path-rail" aria-label="Lesson path" data-lesson-path="rail">
        <p className="rail-k path-k">Lesson path <span className="path-count">{count}</span></p>
        {list}
        <PrevNext prev={prev} next={next} />
      </nav>
    )
  }

  return (
    <nav className="path-plan" aria-label="Lesson path" data-lesson-path="plan">
      <div className="path-plan-head">
        <p className="xs-t path-plan-t">Your path through this lesson</p>
        <p className="path-count">{count}</p>
      </div>
      {list}
      <PrevNext prev={prev} next={next} className="path-foot" />
    </nav>
  )
}
