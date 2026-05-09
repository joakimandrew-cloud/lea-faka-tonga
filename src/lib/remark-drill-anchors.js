/**
 * remark-drill-anchors — inserts synthetic drill anchor nodes into a
 * parsed chapter, based on src/data/drill-map.json.
 *
 * For each entry in drill-map.json[chapterNum], the plugin finds the H3
 * whose slug matches `entry.after` and inserts a custom node immediately
 * before the next H3 (or at the end of the document). The custom node
 * uses hName "chapter-drill-anchor" so BookChapterContent can render it
 * via the components map without colliding with regular div elements.
 *
 * Drill placement lives in JSON, not in the chapter markdown — this
 * keeps the canonical book content untouched (a hard project constraint).
 */

import { visit } from 'unist-util-visit'
import drillMap from '../data/drill-map.json'

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02BB'`]/g, '')
    // Treat slashes, dots, em-/en-dashes, colons, and similar punctuation as
    // word breaks so "E/He" → "e-he" not "ehe". Apostrophes are still stripped
    // (handled above) so "ʻalu" → "alu" not "-alu-".
    .replace(/[\/.:,;\u2014\u2013]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getHeadingText(node) {
  let text = ''
  visit(node, 'text', (t) => { text += t.value })
  return text
}

export default function remarkDrillAnchors({ chapterNum } = {}) {
  return (tree) => {
    const entries = drillMap[String(chapterNum)]
    if (!entries || entries.length === 0) return

    const h3Indices = []
    tree.children.forEach((node, i) => {
      if (node.type === 'heading' && node.depth === 3) {
        h3Indices.push({ index: i, slug: slugify(getHeadingText(node)) })
      }
    })

    const insertions = []
    for (const entry of entries) {
      const matchIdx = h3Indices.findIndex(h => h.slug === entry.after)
      if (matchIdx === -1) {
        // eslint-disable-next-line no-console
        console.warn(
          `[remark-drill-anchors] chapter ${chapterNum}: no H3 matched anchor "${entry.after}" for drill "${entry.drillId}"`
        )
        continue
      }
      const nextH3 = h3Indices[matchIdx + 1]
      const insertAt = nextH3 ? nextH3.index : tree.children.length
      insertions.push({ insertAt, drillId: entry.drillId })
    }

    insertions.sort((a, b) => b.insertAt - a.insertAt)
    for (const { insertAt, drillId } of insertions) {
      tree.children.splice(insertAt, 0, {
        type: 'paragraph',
        data: {
          hName: 'chapter-drill-anchor',
          hProperties: { 'data-drill-id': drillId },
        },
        children: [],
      })
    }
  }
}
