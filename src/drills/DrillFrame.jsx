/**
 * DrillFrame — the one shared shell every drill renders inside, so the same
 * Core looks identical whether it's reached on its bespoke page, at the
 * generic /drill/:id route, or embedded inline in a chapter.
 *
 *   mode='full'    : standalone-route mode. DrillFrame owns the page chrome —
 *                    the 720px column, an optional "← back" link, the eyebrow
 *                    (Ch N · Level), title, blurb, the Core, and an optional
 *                    lesson aside. Call sites pass content, not layout.
 *   mode='compact' : in-chapter embedded mode. ChapterDrillAnchor's expandable
 *                    strip already supplies the eyebrow/title/blurb, so the
 *                    frame is a quiet passthrough here.
 *
 * Header chrome reuses the shared .pcs-* classes (index.css) that the bulk of
 * the drill pages already used — adopting them everywhere kills the five
 * duplicate header namespaces (tense-swap-, fwq-, skf-, clu-, afl-).
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DrillEndLinks } from './drill-end-links'

export default function DrillFrame({
  mode = 'full',
  backTo,
  lessonNum,
  eyebrow,
  title,
  blurb,
  aside,
  children,
}) {
  // The two exits every drill's end card offers (UX-09, 2026-09-03). Provided
  // here rather than passed down through every Core, and provided only in full
  // mode: in a chapter the drill is one step inside the lesson, so its end card
  // stays where it is instead of offering a way out of the page.
  const endLinks = useMemo(() => ({ backTo, lessonNum }), [backTo, lessonNum])

  if (mode === 'compact') {
    return <div className="drill-frame-compact">{children}</div>
  }

  return (
    <DrillEndLinks.Provider value={endLinks}>
      <div className="pcs-page">
        <header className="pcs-header">
          {backTo && (
            <Link to={backTo} className="x-frame-back">
              {'←'} All drills
            </Link>
          )}
          {eyebrow && <div className="pcs-eyebrow">{eyebrow}</div>}
          {title && <h1 className="pcs-title">{title}</h1>}
          {blurb && <p className="pcs-sub">{blurb}</p>}
        </header>

        {children}

        {aside && <aside className="pcs-lesson">{aside}</aside>}
      </div>
    </DrillEndLinks.Provider>
  )
}
