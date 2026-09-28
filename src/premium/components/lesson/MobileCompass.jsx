import { useEffect, useMemo, useRef, useState } from 'react'
import { Md } from './Blocks.jsx'

// eslint-disable-next-line react-refresh/only-export-components
export function compassState(sections, active) {
  const total = sections.length
  if (active === 'finish') {
    return { mode: 'finish', index: null, eyebrow: 'End of lesson', title: 'End of lesson' }
  }
  const index = sections.findIndex(section => section.id === active)
  if (index >= 0) {
    return { mode: 'section', index, eyebrow: `${index + 1} of ${total}`, title: sections[index].title }
  }
  if (total > 0) {
    return { mode: 'fallback', index: 0, eyebrow: `${total} sections`, title: sections[0].title }
  }
  return { mode: 'empty', index: null, eyebrow: 'Lesson sections', title: 'In this lesson' }
}

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function focusSection(id, scroll = true) {
  const section = document.getElementById(id)
  const heading = section?.querySelector('.ls-h2')
  if (!heading) return
  heading.focus({ preventScroll: true })
  if (scroll) heading.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
}

function keepDialogFocus(event) {
  event.stopPropagation()
  if (event.key !== 'Tab') return
  const controls = [...event.currentTarget.querySelectorAll(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )]
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

export default function MobileCompass({ lessonNumber, sections, active }) {
  const openerRef = useRef(null)
  const dialogRef = useRef(null)
  const afterCloseRef = useRef({ type: 'opener' })
  const [open, setOpen] = useState(false)
  const current = useMemo(() => compassState(sections, active), [sections, active])

  const openDialog = () => {
    afterCloseRef.current = { type: 'opener' }
    dialogRef.current?.showModal()
    setOpen(true)
  }

  const closeDialog = (afterClose = { type: 'opener' }) => {
    afterCloseRef.current = afterClose
    dialogRef.current?.close()
  }

  const chooseSection = section => {
    const url = new URL(window.location.href)
    url.hash = section.id
    window.history.replaceState(window.history.state, '', url)
    closeDialog({ type: 'section', id: section.id, scroll: true })
  }

  const handleClosed = () => {
    setOpen(false)
    const action = afterCloseRef.current
    window.requestAnimationFrame(() => {
      if (action.type === 'section') focusSection(action.id, action.scroll)
      else if (action.type === 'opener') openerRef.current?.focus()
    })
  }

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1081px)')
    const closeOnDesktop = event => {
      if (!event.matches || !dialogRef.current?.open) return
      const fallback = sections.find(section => section.id === active) || sections[0]
      afterCloseRef.current = fallback
        ? { type: 'section', id: fallback.id, scroll: false }
        : { type: 'none' }
      dialogRef.current.close()
    }
    query.addEventListener('change', closeOnDesktop)
    return () => query.removeEventListener('change', closeOnDesktop)
  }, [active, sections])

  return (
    <nav className="mobile-compass" aria-label="Lesson section">
      <div className="mobile-compass-main">
        <span className="mobile-compass-copy">
          <span className="mobile-compass-k">Lesson {lessonNumber} · {current.eyebrow}</span>
          <span className="mobile-compass-t"><Md text={current.title} /></span>
        </span>
        <button
          ref={openerRef}
          className="mobile-compass-open"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openDialog}
        >
          Sections
        </button>
      </div>
      {sections.length > 0 && (
        <span className="mobile-compass-segs" aria-hidden="true" style={{ '--compass-count': sections.length }}>
          {sections.map((section, index) => (
            <i
              key={section.id}
              className={current.mode === 'finish' || (current.index !== null && index < current.index)
                ? 'is-past'
                : index === current.index ? 'is-active' : ''}
            />
          ))}
        </span>
      )}
      <dialog
        ref={dialogRef}
        className="mobile-compass-dialog"
        aria-labelledby="mobile-compass-title"
        onKeyDown={keepDialogFocus}
        onCancel={() => { afterCloseRef.current = { type: 'opener' } }}
        onClose={handleClosed}
        onClick={event => {
          if (event.target === event.currentTarget) closeDialog()
        }}
      >
        <div className="mobile-compass-sheet">
          <div className="mobile-compass-head">
            <strong id="mobile-compass-title">In this lesson</strong>
            <button type="button" className="mobile-compass-close" aria-label="Close sections" onClick={() => closeDialog()}>×</button>
          </div>
          <ol className="mobile-compass-list">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  className={active === section.id ? 'is-active' : ''}
                  aria-current={active === section.id ? 'location' : undefined}
                  onClick={() => chooseSection(section)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span><Md text={section.title} /></span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </nav>
  )
}
