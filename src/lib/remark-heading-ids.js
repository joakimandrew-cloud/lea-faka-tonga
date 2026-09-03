/**
 * remark-heading-ids — puts an id on every section heading in a chapter.
 *
 * Added 2026-09-03 for UX-06: a lesson runs to 20,382px at 390 wide with no
 * way to jump inside it. The "On this page" row in ChapterPractice links to
 * these ids. Nothing about the book changes: the id is attached to the parsed
 * node at render time, exactly as remark-drill-anchors attaches its anchors.
 *
 * The slugger is remark-drill-anchors' own, so a section's id and the anchor
 * name in drill-map.json are always the same string.
 */

import { visit } from 'unist-util-visit'
import { slugify } from './remark-drill-anchors'

function headingText(node) {
  let text = ''
  visit(node, 'text', (t) => { text += t.value })
  return text
}

export default function remarkHeadingIds() {
  return (tree) => {
    const seen = new Set()
    visit(tree, 'heading', (node) => {
      if (node.depth !== 3) return
      let slug = slugify(headingText(node))
      if (!slug) return
      // Two sections with the same words in one lesson would otherwise share
      // an id and the second would be unreachable.
      if (seen.has(slug)) {
        let n = 2
        while (seen.has(`${slug}-${n}`)) n += 1
        slug = `${slug}-${n}`
      }
      seen.add(slug)
      node.data = node.data || {}
      node.data.hProperties = { ...(node.data.hProperties || {}), id: slug }
    })
  }
}
