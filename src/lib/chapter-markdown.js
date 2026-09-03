/**
 * The book's chapter markdown, and the trims the reader applies to it.
 *
 * Lifted out of components/BookChapterContent.jsx on 2026-09-03 (UX-06) so the
 * lesson page can ask for a chapter's section list without importing a
 * component module. The strips live here too, because a section list read from
 * anything other than the exact text the reader renders would drift.
 */

import { okinafy } from './okinafy'
import { slugify } from './remark-drill-anchors'

// Bulk-load every chapter markdown file at build time. Vite inlines each
// file's contents as a string, so no runtime fetch is needed.
const chapterFiles = import.meta.glob('../../book/Chapter-*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export const chapterMarkdown = {}
for (const [path, content] of Object.entries(chapterFiles)) {
  const match = path.match(/Chapter-(\d+)\.md$/)
  if (match) {
    chapterMarkdown[parseInt(match[1], 10)] = content
  }
}

// The lesson page's own header already prints the number and the title, and
// the breadcrumb repeats it, so the title in the markdown is a third copy
// (UX-05). This has always meant to remove it; the pattern was written when the
// heading was `## Chapter N:` and stopped matching when the book relabelled its
// unit `# Lesson N:` on 2026-06-22, which is how a second H1 came back above
// the fold. Both spellings are handled now, and only the first one in a file.
export function stripLeadingTitle(md) {
  if (!md) return md
  return md.replace(/^#{1,2}[ \t]+(?:Chapter|Lesson)[ \t]+\d+:.*?\n+/m, '')
}

// Pandoc fenced divs (`::: {.examples}`) aren't understood by remark-directive
// out of the box — it expects `:::examples`. Rewrite the opener so the rest of
// the pipeline can treat this as a container directive; the PDF/EPUB toolchain
// continues to read the source form verbatim.
export function normalizeExamplesFence(md) {
  if (!md) return md
  return md.replace(/^:::\s*\{\.examples\}\s*$/gm, ':::examples')
}

// The ### Exercises / ### Answers tail is rendered interactively by
// <BookExercises> in ChapterPractice, so strip it from the static markdown here
// to avoid a double render. (The mid-chapter Quick Practice blocks are removed
// separately by remark-quick-practice, which replaces each with an interactive
// <QuickPractice> anchor.) The optional dashes group consumes the `---`
// separator that precedes the heading so no dangling <hr> is left behind.
export function stripExercisesSection(md) {
  if (!md) return md
  return md.replace(/\n+(?:-{3,}[^\n]*\n+)?###[ \t]+Exercises[\s\S]*$/, '\n')
}

/**
 * The chapter's own section headings, in reading order, with the ids
 * remark-heading-ids puts on them. UX-06: this is what the lesson's "On this
 * page" row is built from.
 *
 * The book's chapters have no H2 at all: the H1 is the lesson title and every
 * section under it is an H3 (an H4 is a sub-point inside a section), so an H3
 * is a lesson's top-level section and that is what is listed. Read from the
 * same stripped markdown the renderer sees, so the exercises tail and the
 * answers that follow it are already gone.
 */
export function chapterSections(chapterNum) {
  const md = chapterMarkdown[chapterNum]
  if (!md) return []
  const body = stripExercisesSection(stripLeadingTitle(md))
  const sections = []
  const seen = new Set()
  let inFence = false
  for (const line of body.split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const m = line.match(/^###[ \t]+(.+?)\s*$/)
    if (!m) continue
    // Drop the markdown emphasis and code marks so the label reads as words,
    // and normalize the fakauʻa the way every other Tongan surface does.
    const label = okinafy(m[1].replace(/[*_`]/g, '').trim())
    let id = slugify(m[1].replace(/[*_`]/g, ''))
    if (!id) continue
    if (seen.has(id)) {
      let n = 2
      while (seen.has(`${id}-${n}`)) n += 1
      id = `${id}-${n}`
    }
    seen.add(id)
    sections.push({ id, label })
  }
  return sections
}
