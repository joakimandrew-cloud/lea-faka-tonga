/**
 * remark-merge-vocab — fold each chapter's two "new words" tables into one.
 *
 * The book source gives every chapter a "### Words to Learn" section with two
 * separate vocab-list tables:
 *
 *   **New grammar words** (memorize how these work):
 *   | Tongan | Function | English |   ← grammar/function words
 *
 *   **New vocabulary** (memorize these meanings):
 *   | Tongan | Type | English |       ← content vocabulary
 *
 * The owner wants ONE table per chapter (kickoff 2026-06-16, website-only — the
 * book/ source is NOT touched). This mdast transform, run after remark-gfm so
 * the tables are parsed:
 *
 *   1. appends the second table's body rows into the first (grammar first, then
 *      vocabulary — source order), so the per-row Function/Type value still
 *      distinguishes each word;
 *   2. standardizes the middle header to "Type" (general enough for both
 *      "demonstrative enclitic" and "noun"; downstream rehype-table-labels
 *      accepts "type" or "function" as the vocab-list signature either way);
 *   3. drops the "New grammar words" / "New vocabulary" label paragraphs, since
 *      the split they introduced is gone.
 *
 * Single-table chapters (no second table to merge) still get their lone label
 * stripped and header standardized, so all 53 chapters present the same clean
 * "Words to Learn → one table" shape. The merged table flows through
 * rehype-table-labels → VocabPracticeBlock as a single Table/Cards deck over the
 * whole chapter's new words.
 */

import { toString } from 'mdast-util-to-string'

const cellText = (cell) => toString(cell).trim()

function headerCells(table) {
  const row = table.children?.[0]
  return row ? (row.children || []) : []
}

/** A "Words to Learn" vocab table: exactly Tongan | Type|Function | English. */
function isVocabList(node) {
  if (!node || node.type !== 'table') return false
  const cells = headerCells(node)
  if (cells.length !== 3) return false
  const lc = cells.map((c) => cellText(c).toLowerCase())
  return lc[0] === 'tongan' && (lc[1] === 'type' || lc[1] === 'function') && lc[2] === 'english'
}

/** The "New grammar words …" / "New vocabulary …" label that precedes a table. */
function isLabelPara(node) {
  return (
    node &&
    node.type === 'paragraph' &&
    /^New (grammar words|vocabulary)\b/i.test(toString(node).trim())
  )
}

/** Force a vocab table's middle column header to "Type". */
function setMiddleHeaderToType(table) {
  const cells = headerCells(table)
  if (cells[1]) cells[1].children = [{ type: 'text', value: 'Type' }]
}

export default function remarkMergeVocab() {
  return (tree) => {
    const nodes = tree.children || []
    const remove = new Set()

    for (let i = 0; i < nodes.length; i++) {
      // Drop a label paragraph when it introduces a vocab table (possibly past
      // further label paragraphs) — covers the label before the grammar table,
      // the one between the two tables, and lone labels in single-table chapters.
      if (isLabelPara(nodes[i])) {
        let j = i + 1
        while (j < nodes.length && isLabelPara(nodes[j])) j++
        if (j < nodes.length && isVocabList(nodes[j])) remove.add(i)
        continue
      }

      // First vocab table of a run: standardize its header, then swallow any
      // following sibling vocab tables that are separated only by label paras.
      if (isVocabList(nodes[i]) && !remove.has(i)) {
        const first = nodes[i]
        setMiddleHeaderToType(first)
        let j = i + 1
        while (j < nodes.length) {
          if (isLabelPara(nodes[j])) { j++; continue }
          if (isVocabList(nodes[j])) {
            const bodyRows = nodes[j].children.slice(1) // skip the header row
            first.children.push(...bodyRows)
            remove.add(j)
            j++
            continue
          }
          break // any other content ends the run
        }
      }
    }

    if (remove.size) {
      tree.children = nodes.filter((_, idx) => !remove.has(idx))
    }
  }
}
