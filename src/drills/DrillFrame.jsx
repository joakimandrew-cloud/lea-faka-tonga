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

import { Link } from 'react-router-dom'

export default function DrillFrame({
  mode = 'full',
  backTo,
  eyebrow,
  title,
  blurb,
  aside,
  children,
}) {
  if (mode === 'compact') {
    return <div className="drill-frame-compact">{children}</div>
  }

  return (
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
  )
}
