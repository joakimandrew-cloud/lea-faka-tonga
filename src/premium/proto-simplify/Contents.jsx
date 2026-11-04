/**
 * The one navigation device while reading: a Contents button (left margin on a
 * wide screen, a 48 px lesson bar on a narrow one) and the sheet it opens. The
 * sheet takes everything the rail, the plan card and the compass used to hold,
 * in the same dialog and focus handling as MobileCompass.jsx.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import quickPractice from '@app/data/quick-practice.json'
import { drillRegistry } from '@app/drills/registry.js'
import { Md } from '../components/lesson/Blocks.jsx'
import { Mixed } from '../components/lesson/FigureEngine.jsx'
import { compassState } from '../components/lesson/MobileCompass.jsx'
import { practiceBlocks } from '../lib/lesson-plan.js'

const nn = number => String(number).padStart(2, '0')
const SITE = [
  ['/lessons', 'Lessons'], ['/drills', 'Drills'], ['/games', 'Games'], ['/quizzes', 'Quizzes'],
  ['/cards', 'Flip cards'], ['/dictionary', 'Dictionary'], ['/topics', 'Reference'], ['/support', 'Membership'],
]

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function focusTarget(id) {
  const node = document.getElementById(id)
  if (!node) return
  const heading = node.querySelector('.ls-h2') || node
  heading.focus?.({ preventScroll: true })
  node.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' })
}

function keepFocus(event) {
  event.stopPropagation()
  if (event.key !== 'Tab') return
  const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])')]
    .filter(node => node.getClientRects().length > 0)
  if (!controls.length) return
  const first = controls[0]
  const last = controls.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function practiceName(n, row) {
  if (row.kind === 'drill') return drillRegistry[row.drillId]?.meta?.title || ''
  return quickPractice[String(n)]?.[row.qpIndex]?.topic || ''
}

function Mark({ state }) {
  return <span className={`ps-mark is-${state}`} aria-hidden="true" />
}

export function ContentsSheet({ dialogRef, n, sections, active, learn, path, exStats, hasQuiz, prev, next, onClose }) {
  const resumeIndex = path.at ? sections.findIndex(section => section.id === path.at) : -1
  const resume = resumeIndex > 0 && !sections[resumeIndex].exercises ? sections[resumeIndex] : null
  const read = Number.isInteger(path.read) ? path.read : -1
  const practice = practiceBlocks(sections)
  const teaching = sections.filter(section => !section.exercises && !/^words-to-learn/.test(section.id))
  const words = sections.find(section => /^words-to-learn/.test(section.id))
  const go = id => onClose({ type: 'target', id })

  return (
    <dialog
      ref={dialogRef}
      className="ps-sheet"
      aria-labelledby="ps-sheet-t"
      onKeyDown={keepFocus}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      onClose={() => onClose(undefined, true)}
    >
      <div className="ps-in">
        <header className="ps-head">
          <strong id="ps-sheet-t">In this lesson</strong>
          <button type="button" className="ps-close" aria-label="Close contents" onClick={() => onClose()}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2 14 14 M14 2 2 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" /></svg>
          </button>
        </header>

        {resume && (
          <button type="button" className="btn btn-primary ps-resume" onClick={() => go(resume.id)}>
            <span className="ps-resume-k">Pick up where you left off</span>
            <span className="ps-resume-t">{nn(resumeIndex + 1)} <Md text={resume.title} /></span>
          </button>
        )}

        {learn.items.length > 0 && (
          <section className="ps-group">
            <h3 className="ps-h">What you will learn</h3>
            <ol className="ps-rules">
              {learn.items.map(item => (
                <li key={item.i}>
                  {item.section ? (
                    <button type="button" className="ps-rule" onClick={() => go(item.section.sectionId)}>
                      <span className="ps-rule-t"><Mixed text={item.text} /></span>
                      <span className="ps-rule-l">{`See it in section ${nn(item.section.sectionNumber)}`}</span>
                    </button>
                  ) : <span className="ps-rule"><span className="ps-rule-t"><Mixed text={item.text} /></span></span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="ps-group">
          <h3 className="ps-h">Sections</h3>
          <ol className="ps-list">
            {teaching.map(section => {
              const index = sections.indexOf(section)
              const state = active === section.id ? 'on' : index <= read ? 'read' : 'todo'
              const here = practice.filter(row => row.sectionId === section.id)
              return (
                <li key={section.id}>
                  <button type="button" className={`ps-row ${state === 'on' ? 'is-on' : ''}`} aria-current={state === 'on' ? 'location' : undefined} onClick={() => go(section.id)}>
                    <Mark state={state} />
                    <span className="ps-n">{nn(index + 1)}</span>
                    <span className="ps-t"><Md text={section.title} /></span>
                  </button>
                  {here.map(row => (
                    <button key={row.key} type="button" className="ps-row ps-sub" onClick={() => go(row.anchor)}>
                      <span className="ps-sub-k">Practice</span>
                      <span className="ps-t"><Md text={practiceName(n, row)} /></span>
                    </button>
                  ))}
                </li>
              )
            })}
          </ol>
        </section>

        <section className="ps-group">
          <ul className="ps-list">
            {words && (
              <li>
                <button type="button" className={`ps-row ${active === words.id ? 'is-on' : ''}`} onClick={() => go(words.id)}>
                  <Mark state={active === words.id ? 'on' : 'todo'} />
                  <span className="ps-n">{nn(sections.indexOf(words) + 1)}</span>
                  <span className="ps-t">Words</span>
                </button>
              </li>
            )}
            <li>
              <button type="button" className={`ps-row ${active === 'exercises' ? 'is-on' : ''}`} onClick={() => go('exercises')}>
                <Mark state={active === 'exercises' ? 'on' : exStats.answered >= exStats.total && exStats.total > 0 ? 'read' : 'todo'} />
                <span className="ps-n">{nn(sections.findIndex(section => section.exercises) + 1)}</span>
                <span className="ps-t">Exercises</span>
                <span className="ps-c">{`${exStats.answered} of ${exStats.total} done`}</span>
              </button>
            </li>
            {hasQuiz && (
              <li>
                <Link className="ps-row" to={`/quizzes/${n}`}>
                  <Mark state="todo" />
                  <span className="ps-n" />
                  <span className="ps-t">Quiz</span>
                  <span className="ps-c">Opens its own page</span>
                </Link>
              </li>
            )}
            <li>
              <button type="button" className={`ps-row ${active === 'finish' ? 'is-on' : ''}`} onClick={() => go('finish')}>
                <Mark state={active === 'finish' ? 'on' : 'todo'} />
                <span className="ps-n" />
                <span className="ps-t">Finish</span>
              </button>
            </li>
          </ul>
        </section>

        <nav className="ps-group ps-foot" aria-label="Other lessons">
          {prev && (
            <Link className="ps-row ps-lesson" to={`/lessons/${prev.chapter}`}>
              <span className="ps-sub-k">Previous lesson</span>
              <span className="ps-t">{prev.title}</span>
            </Link>
          )}
          {next && (
            <Link className="ps-row ps-lesson" to={`/lessons/${next.chapter}`}>
              <span className="ps-sub-k">Next lesson</span>
              <span className="ps-t">{next.title}</span>
            </Link>
          )}
          <Link className="ps-row ps-plain" to="/lessons">All lessons</Link>
          <details className="ps-site">
            <summary className="ps-row ps-plain">Site menu</summary>
            <ul className="ps-site-list">
              {SITE.map(([to, label]) => <li key={to}><Link className="ps-row ps-plain is-sub" to={to}>{label}</Link></li>)}
            </ul>
          </details>
        </nav>
      </div>
    </dialog>
  )
}

/** The Contents button in its two forms, and the sheet. */
export default function Contents({ n, sections, active, learn, path, exStats, hasQuiz, prev, next }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)
  const barOpenerRef = useRef(null)
  const afterRef = useRef(null)
  const [open, setOpen] = useState(false)
  const state = compassState(sections, active)
  const k = active === 'finish' ? sections.length : Math.max(0, state.index ?? 0) + 1

  const openSheet = from => {
    afterRef.current = { type: 'opener', from }
    dialogRef.current?.showModal()
    setOpen(true)
  }
  const onClose = (after, fromEvent = false) => {
    if (after) afterRef.current = after
    if (!fromEvent) { dialogRef.current?.close(); return }
    setOpen(false)
    const action = afterRef.current
    requestAnimationFrame(() => {
      if (action?.type === 'target') focusTarget(action.id)
      else if (action?.from === 'bar') barOpenerRef.current?.focus()
      else openerRef.current?.focus()
    })
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    return () => { document.documentElement.style.overflow = '' }
  }, [open])

  const title = active === 'finish' ? 'End of lesson' : state.title

  return (
    <>
      <button ref={openerRef} type="button" className="pl-contents" aria-haspopup="dialog" aria-expanded={open} aria-label={`Open lesson contents, section ${k} of ${sections.length}`} onClick={() => openSheet('margin')}>
        <span className="pl-contents-t">Contents</span>
        <span className="pl-contents-c">{`${k} of ${sections.length}`}</span>
      </button>
      <div className="pl-bar">
        <span className="pl-bar-c">{`${k} of ${sections.length}`}</span>
        <span className="pl-bar-t"><Md text={title} /></span>
        <button ref={barOpenerRef} type="button" className="pl-bar-b" aria-haspopup="dialog" aria-expanded={open} aria-label="Open lesson contents" onClick={() => openSheet('bar')}>
          <span>Contents</span>
        </button>
      </div>
      <ContentsSheet dialogRef={dialogRef} n={n} sections={sections} active={active} learn={learn} path={path} exStats={exStats} hasQuiz={hasQuiz} prev={prev} next={next} onClose={onClose} />
    </>
  )
}
