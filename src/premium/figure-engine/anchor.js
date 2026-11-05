// Where a figure sits in a section: the page (Lesson.jsx) and check:figures both read it from
// here, so the check passes exactly the anchors the page can place. `after.section` is the slug of
// the ### heading, or of a #### subsection inside it; with a subsection the block is looked for
// only between that heading and the next ####.

/** The index in `s.blocks` after which the figure sits, or -1 if this section does not hold it. */
export function anchorIndex(s, after) {
  if (s.id.startsWith(after.section)) return s.blocks.findIndex(after.block)
  const head = s.blocks.findIndex(b => b.type === 'h3' && typeof b.id === 'string' && b.id.startsWith(after.section))
  if (head < 0) return -1
  for (let i = head + 1; i < s.blocks.length; i += 1) {
    if (s.blocks[i].type === 'h3') return -1
    if (after.block(s.blocks[i], i)) return i
  }
  return -1
}
