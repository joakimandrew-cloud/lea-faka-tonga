/**
 * remark-quick-practice — replaces each mid-chapter "Quick Practice" block in
 * a parsed chapter with a single interactive anchor node.
 *
 * The block (heading + intro + numbered items + the "**Answers:**" line, plus
 * the trailing `---` rule) is removed from the static markdown so its answers
 * no longer render in plain view; in its place goes a custom node with hName
 * "quick-practice" carrying the chapter number and the block's document-order
 * index. <BookChapterContent> routes that node to <QuickPractice>, which looks
 * the parsed block up in src/data/quick-practice.json (built by
 * scripts/extract-quick-practice.mjs) and renders it with the shared
 * tap-to-reveal / tap-an-option / tap-to-match widgets.
 *
 * Block detection is by heading text alone (any H3 whose text starts with
 * "Quick Practice"), so it works whether or not the block carries an A/B/C
 * letter. The ordinal is assigned in document order, matching the array order
 * the extractor writes — no slug alignment needed.
 *
 * Runs LAST in the remark pipeline so remark-drill-anchors still sees the
 * original H3 headings when it places drills.
 */

function getHeadingText(node) {
  let text = ''
  const walk = (n) => {
    if (n.type === 'text') text += n.value
    if (n.children) n.children.forEach(walk)
  }
  if (node.children) node.children.forEach(walk)
  return text
}

export default function remarkQuickPractice({ chapterNum } = {}) {
  return (tree) => {
    const children = tree.children
    if (!children || !children.length) return

    // Collect the node ranges to replace, in document order.
    const ranges = []
    let ordinal = 0
    for (let i = 0; i < children.length; i++) {
      const node = children[i]
      if (node.type !== 'heading' || node.depth !== 3) continue
      if (!/^\s*Quick Practice\b/i.test(getHeadingText(node))) continue

      // The block runs to the next heading or thematic break. A trailing `---`
      // (thematicBreak terminator) is consumed so the card isn't left with a
      // dangling rule beneath it; a heading terminator is left in place.
      let term = children.length
      for (let j = i + 1; j < children.length; j++) {
        if (children[j].type === 'heading' || children[j].type === 'thematicBreak') {
          term = j
          break
        }
      }
      const removeEnd =
        term < children.length && children[term].type === 'thematicBreak' ? term + 1 : term

      ranges.push({ start: i, removeEnd, ordinal })
      ordinal++
      i = removeEnd - 1 // skip past this block's nodes
    }

    // Splice back-to-front so earlier indices stay valid.
    for (let r = ranges.length - 1; r >= 0; r--) {
      const { start, removeEnd, ordinal } = ranges[r]
      const anchor = {
        type: 'paragraph',
        data: {
          hName: 'quick-practice',
          hProperties: {
            'data-chapter': String(chapterNum),
            'data-qp-index': String(ordinal),
          },
        },
        children: [],
      }
      children.splice(start, removeEnd - start, anchor)
    }
  }
}
