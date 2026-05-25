/**
 * rehype-table-labels — copies each table column's header text onto every
 * body cell as a `data-label` property.
 *
 * This powers the mobile "stack into cards" table layout (Option A). On narrow
 * screens, BookChapterContent's CSS hides the <thead> and turns each row into a
 * card; each <td> shows its column label via `td::before { content: attr(data-label) }`.
 * Doing the label-copy here (on the hast tree, before render) means the cell's
 * rich inline content — e.g. the font-tongan italics — is preserved untouched;
 * we only add an attribute.
 *
 * It then decides, per table, whether the table is narrow enough to keep as a
 * real table on mobile or wide enough that it should stack into cards:
 *
 *   - "compact" (fits): left as a normal <table>; CSS just shrinks font/padding
 *     a little on mobile. No class added.
 *   - "stack" (would squish): tagged `ch-stack`; CSS hides the <thead> and turns
 *     each row into a labeled card.
 *
 * The decision is a content heuristic (column count + per-column text length),
 * since the markdown is static — no runtime measurement / layout flash. The
 * thresholds below are deliberately conservative: when in doubt, stack rather
 * than risk a squished table. Compact tables also keep overflow-x:auto as a
 * safety net, so a borderline case scrolls slightly instead of breaking.
 *
 * Within a stacked table, vocab rows fold tighter (Option 1): when a table has a
 * "Type" column and a row's Type value is a short part-of-speech word, the row is
 * tagged `vocab-card` and the Type cell `vocab-type` so CSS renders the type as a
 * small tag beside the headword. Long "function" descriptions stay normal rows.
 *
 * No-ops on tables without a header row.
 */

import { visit } from 'unist-util-visit'

// Short part-of-speech values that are safe to fold into a tag on mobile.
const PART_OF_SPEECH = new Set([
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
  'particle', 'conjunction', 'interjection', 'numeral', 'number',
  'article', 'determiner', 'phrase', 'exclamation',
])

// Fit heuristic thresholds (in characters). A table stays a compact real table
// on mobile only if it clears ALL of these; otherwise it stacks into cards.
const FIT = {
  maxCols: 3,      // 4+ columns never fit a phone comfortably
  maxColLen: 22,   // any single cell longer than this (e.g. an example sentence) → stack
  maxTotalLen: 34, // sum of per-column maxima — the whole row's rough width budget
}

function addClass(node, className) {
  node.properties = node.properties || {}
  const existing = node.properties.className
  if (Array.isArray(existing)) existing.push(className)
  else if (typeof existing === 'string') node.properties.className = [existing, className]
  else node.properties.className = [className]
}

// Flatten a hast element's text content (recursively) into a plain string.
function textOf(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value
  if (node.children) return node.children.map(textOf).join('')
  return ''
}

function rowCells(rowNode) {
  return (rowNode.children || []).filter(
    (c) => c.type === 'element' && (c.tagName === 'th' || c.tagName === 'td')
  )
}

function firstRow(sectionNode) {
  return (sectionNode.children || []).find(
    (c) => c.type === 'element' && c.tagName === 'tr'
  )
}

function sectionChild(tableNode, tagName) {
  return (tableNode.children || []).find(
    (c) => c.type === 'element' && c.tagName === tagName
  )
}

const clone = (x) => JSON.parse(JSON.stringify(x))
const el = (tagName, properties, children = []) => ({
  type: 'element', tagName, properties, children,
})

/**
 * Option A — example-aware fold. For a table whose core columns fit but whose
 * Example column forces a stack, keep it a real table and move the example into
 * a hidden detail row revealed by a CSS-only checkbox toggle on mobile. Desktop
 * is unchanged: the toggle and detail rows are display:none until the mobile
 * media query, and the example still shows in its original column.
 */
function applyExampleAware(table, tbody, bodyRows, exIdx, colCount) {
  addClass(table, 'ch-ex')
  const container = tbody || table
  const detailFor = new Map()

  for (const row of bodyRows) {
    const cells = rowCells(row)
    const exCell = cells[exIdx]
    if (!exCell) continue

    const exContent = exCell.children || []

    // Rebuild the example cell: a mobile-only "ex." toggle + the inline example
    // (shown on desktop, hidden on mobile via .ex-text).
    const toggle = el('label', { className: ['ex-toggle'] }, [
      el('input', { type: 'checkbox' }),
      { type: 'text', value: 'ex.' },
    ])
    const inline = el('span', { className: ['ex-text'] }, exContent)
    exCell.children = [toggle, inline]
    addClass(exCell, 'ex-cell')

    // The detail row carries a clone of the example, full width.
    detailFor.set(
      row,
      el('tr', { className: ['ex-detail'] }, [
        el('td', { colSpan: colCount, className: ['ex-detail-cell'] }, [
          el('div', { className: ['inner'] }, [
            el('div', { className: ['ex-pad'] }, clone(exContent)),
          ]),
        ]),
      ])
    )
  }

  // Splice each detail row in immediately after its core row.
  const out = []
  for (const child of container.children) {
    out.push(child)
    if (detailFor.has(child)) out.push(detailFor.get(child))
  }
  container.children = out
}

export default function rehypeTableLabels() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'table') return

      const thead = sectionChild(node, 'thead')
      const headerRow = thead ? firstRow(thead) : null
      if (!headerRow) return

      const labels = rowCells(headerRow).map((c) => textOf(c).trim())
      if (!labels.length) return

      // Index of a "Type" column, if any — drives the vocab-card fold.
      const typeIdx = labels.findIndex((l) => l.toLowerCase() === 'type')

      const tbody = sectionChild(node, 'tbody')
      const bodyRows = (tbody?.children || node.children || []).filter(
        (c) => c.type === 'element' && c.tagName === 'tr'
      )

      // Per-column max text length, across header + body. Drives the fit check.
      const colMax = labels.map((l) => l.length)

      for (const row of bodyRows) {
        const cells = rowCells(row)
        cells.forEach((cell, i) => {
          const label = labels[i]
          if (label) {
            cell.properties = cell.properties || {}
            cell.properties['data-label'] = label
          }
          const len = textOf(cell).trim().length
          if (len > (colMax[i] ?? 0)) colMax[i] = len
        })
      }

      // Fit decision: does the table stay a compact real table, or stack?
      const totalLen = colMax.reduce((a, b) => a + b, 0)
      const stack =
        labels.length > FIT.maxCols ||
        colMax.some((l) => l > FIT.maxColLen) ||
        totalLen > FIT.maxTotalLen

      if (!stack) return // compact: leave the table untouched

      // Option A: if an Example column is the only thing forcing the stack
      // (the core columns fit on their own), keep the table and fold the
      // example into a tap-to-reveal detail row instead of stacking.
      const exIdx = labels.findIndex((l) => /^examples?$/i.test(l))
      const hasTranslationCol = labels.some((l) => /^translations?$/i.test(l))
      // Skip the fold when a Translation column is present: the example and its
      // translation belong together, so let the table stack as a whole.
      if (exIdx !== -1 && !hasTranslationCol) {
        const coreMax = colMax.filter((_, i) => i !== exIdx)
        const coreFits =
          coreMax.length <= FIT.maxCols &&
          coreMax.every((l) => l <= FIT.maxColLen) &&
          coreMax.reduce((a, b) => a + b, 0) <= FIT.maxTotalLen
        if (coreFits) {
          applyExampleAware(node, tbody, bodyRows, exIdx, labels.length)
          return
        }
      }

      addClass(node, 'ch-stack')

      // Inside a stacked table, fold short part-of-speech vocab rows (Option 1).
      if (typeIdx !== -1) {
        for (const row of bodyRows) {
          const cells = rowCells(row)
          if (!cells[typeIdx]) continue
          const typeVal = textOf(cells[typeIdx]).trim().toLowerCase()
          if (PART_OF_SPEECH.has(typeVal)) {
            addClass(row, 'vocab-card')
            addClass(cells[typeIdx], 'vocab-type')
          }
        }
      }
    })
  }
}
