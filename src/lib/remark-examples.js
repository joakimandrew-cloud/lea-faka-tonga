import { visit, SKIP } from 'unist-util-visit'

const EMDASH = '\u2014'

export default function remarkExamples() {
  return (tree) => {
    // Pass 1: handle :::examples containers and table cells. After this,
    // their inner paragraphs have data.hName set, which is the marker the
    // standalone-paragraph pass uses to skip them.
    visit(tree, (node) => {
      if (node.type === 'containerDirective' && node.name === 'examples') {
        transformExamplesContainer(node)
        return
      }
      if (node.type === 'tableCell') {
        transformTableCell(node)
      }
    })
    // Pass 2: catch top-level paragraphs that are translation pairs in their
    // own right. A paragraph may also contain adjacent lines separated only
    // by a newline (no blank line) — split those into separate paragraphs
    // first so each one can be detected as a pair.
    visit(tree, (node, index, parent) => {
      if (node.type !== 'paragraph') return
      if (node.data?.hName) return
      if (parent?.type === 'tableCell') return
      if (!parent || typeof index !== 'number') return

      const subParagraphs = splitParagraphOnNewlines(node)
      const transformed = subParagraphs.map((sub) => {
        const split = splitParagraphOnLeadingItalic(sub)
        return split || sub
      })
      const anyTransformed = transformed.some((p) => p.data?.hName)
      if (!anyTransformed && subParagraphs.length === 1) return

      parent.children.splice(index, 1, ...transformed)
      return [SKIP, index + transformed.length]
    })
  }
}

function transformExamplesContainer(node) {
  node.data = node.data || {}
  node.data.hName = 'div'
  node.data.hProperties = { className: ['example-block'] }

  const newChildren = []
  for (const child of node.children) {
    if (child.type !== 'paragraph') {
      newChildren.push(child)
      continue
    }
    // A paragraph may contain multiple "logical lines" separated by newline
    // characters inside its text nodes (when the source has adjacent lines
    // with no blank line between). Split it on those newlines first so each
    // logical line gets its own pair detection.
    const subParagraphs = splitParagraphOnNewlines(child)
    for (const sub of subParagraphs) {
      newChildren.push(splitExampleParagraph(sub))
    }
  }
  node.children = newChildren
}

// Walk paragraph children, splitting any text node that contains `\n` and
// breaking the paragraph at those split points. Returns an array of new
// paragraph nodes (one per logical line). If there are no newlines, returns
// [paragraph] unchanged.
function splitParagraphOnNewlines(paragraph) {
  const kids = paragraph.children || []
  let hasNewline = false
  for (const k of kids) {
    if (k.type === 'text' && k.value.includes('\n')) {
      hasNewline = true
      break
    }
  }
  if (!hasNewline) return [paragraph]

  const groups = [[]]
  for (const k of kids) {
    if (k.type !== 'text' || !k.value.includes('\n')) {
      groups[groups.length - 1].push(k)
      continue
    }
    const parts = k.value.split('\n')
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].length > 0) {
        groups[groups.length - 1].push({ ...k, value: parts[i] })
      }
      if (i < parts.length - 1) groups.push([])
    }
  }
  return groups
    .filter((g) => g.length > 0)
    .map((children) => ({ ...paragraph, children }))
}

// Try the em-dash split first (legacy form `*Tongan.* — English`); on failure
// try the compact form `*Tongan.* English` where the trailing English starts
// with a capital letter or open paren. Falls back to wrapping the whole
// paragraph as Tongan.
function splitExampleParagraph(paragraph) {
  const emDashSplit = splitParagraphOnEmDash(paragraph)
  if (paragraphWasSplit(emDashSplit)) return emDashSplit
  const compactSplit = splitParagraphOnLeadingItalic(paragraph)
  if (compactSplit) return compactSplit
  return emDashSplit
}

function paragraphWasSplit(node) {
  return (
    node?.data?.hProperties?.className?.[0] === 'example-pair' &&
    node.children?.length === 2
  )
}

// Shape we rewrite:
//   [optional whitespace]  <emphasis>Tongan</emphasis>  <trailing English>
// Where the first non-whitespace char of the trailing portion is one of:
//   U+2014 em-dash, an ASCII uppercase letter, or "("
// When that shape matches, the trailing portion is wrapped in
// <span class="cell-english"> so CSS can mute it. Any other shape passes
// through unchanged (multi-italic cells, italic-only cells, cells with no
// italic, italic mid-sentence, etc.).
function transformTableCell(node) {
  const kids = node.children || []
  if (kids.length === 0) return

  // Look for a leading emphasis (the Tongan). Subsequent emphases in the
  // English portion (inline citations) are fine — they don't disqualify the
  // cell from being treated as a Tongan + English pair.
  let emphIdx = -1
  let firstMeaningfulIdx = -1
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    if (k.type === 'emphasis' && emphIdx === -1) emphIdx = i
    if (firstMeaningfulIdx === -1 && !isBlankText(k)) {
      firstMeaningfulIdx = i
    }
    if (emphIdx !== -1 && firstMeaningfulIdx !== -1) break
  }
  if (emphIdx === -1) return
  if (firstMeaningfulIdx !== emphIdx) return

  const tail = kids.slice(emphIdx + 1)
  const stripped = stripLeadingWhitespaceInlines(tail)
  if (stripped.length === 0) return

  const firstText = firstTextStart(stripped)
  if (firstText === null) return

  const kind = classifyTrailing(firstText)
  if (!kind) return

  const mutedSpan = {
    type: 'emphasis',
    data: {
      hName: 'span',
      hProperties: { className: ['cell-english'] },
    },
    children: stripped,
  }

  node.children = [
    ...kids.slice(0, emphIdx + 1),
    { type: 'text', value: ' ' },
    mutedSpan,
  ]
}

function isBlankText(n) {
  return n.type === 'text' && /^\s*$/.test(n.value)
}

function stripLeadingWhitespaceInlines(nodes) {
  const out = [...nodes]
  while (out.length > 0) {
    const first = out[0]
    if (first.type === 'text') {
      const trimmed = first.value.replace(/^\s+/, '')
      if (trimmed === '') {
        out.shift()
        continue
      }
      if (trimmed !== first.value) {
        out[0] = { ...first, value: trimmed }
      }
      break
    }
    break
  }
  return out
}

function firstTextStart(nodes) {
  if (nodes.length === 0) return null
  const first = nodes[0]
  if (first.type !== 'text') return null
  if (first.value.length === 0) return null
  return first.value
}

function classifyTrailing(text) {
  if (text.startsWith(EMDASH)) return 'emdash'
  const ch = text.charAt(0)
  if (ch >= 'A' && ch <= 'Z') return 'capital'
  if (ch === '(') return 'paren'
  return null
}

function parenIsAnnotation(text) {
  if (!text.startsWith('(')) return false
  const second = text.charAt(1)
  if (!second) return false
  return !(second >= 'A' && second <= 'Z')
}

function splitParagraphOnEmDash(paragraph) {
  const kids = paragraph.children || []
  let splitIdx = -1

  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    if (k.type === 'text' && k.value === EMDASH) {
      splitIdx = i
      break
    }
    if (k.type === 'text' && k.value.includes(EMDASH)) {
      splitIdx = i
      break
    }
  }

  if (splitIdx === -1) {
    return wrap([paragraph.children], ['example-tongan'])
  }

  const splitNode = kids[splitIdx]
  let tongan, english

  if (splitNode.value === EMDASH) {
    tongan = kids.slice(0, splitIdx)
    english = kids.slice(splitIdx + 1)
  } else {
    const [before, after] = splitNode.value.split(EMDASH, 2)
    tongan = kids.slice(0, splitIdx)
    if (before && before.trim() !== '') {
      tongan = tongan.concat([{ type: 'text', value: before }])
    }
    english = []
    if (after && after.trim() !== '') {
      english.push({ type: 'text', value: after })
    }
    english = english.concat(kids.slice(splitIdx + 1))
  }

  tongan = trimEdges(tongan)
  english = trimEdges(english)

  return {
    type: 'paragraph',
    data: {
      hName: 'div',
      hProperties: { className: ['example-pair'] },
    },
    children: [
      {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['example-tongan'] },
        },
        children: tongan,
      },
      {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['example-english'] },
        },
        children: english,
      },
    ],
  }
}

// Split a paragraph whose first meaningful inline is an italic Tongan span
// and whose trailing text reads as English (capital letter, open paren, or
// opening quote). An optional intonation arrow (↗ ↘) between the Tongan and
// the English is kept on the Tongan side. Returns a wrapped `.example-pair`
// node, or null if the paragraph doesn't match this shape.
function splitParagraphOnLeadingItalic(paragraph) {
  const kids = paragraph.children || []
  if (kids.length === 0) return null

  // Find the leading emphasis (the Tongan). Inline emphases later in the
  // paragraph (citations in the English explanation) are fine.
  let emphIdx = -1
  let firstMeaningfulIdx = -1
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    if (k.type === 'emphasis' && emphIdx === -1) emphIdx = i
    if (firstMeaningfulIdx === -1 && !isBlankText(k)) {
      firstMeaningfulIdx = i
    }
    if (emphIdx !== -1 && firstMeaningfulIdx !== -1) break
  }
  if (emphIdx === -1) return null
  if (firstMeaningfulIdx !== emphIdx) return null

  const tongan = [kids[emphIdx]]
  let tail = kids.slice(emphIdx + 1)
  tail = stripLeadingWhitespaceInlines(tail)
  if (tail.length === 0) return null

  // Pull a leading intonation arrow (and optional `=` connector) onto the
  // Tongan side so it stays visually anchored to the Tongan sentence.
  const arrowResult = consumeLeadingArrow(tail)
  if (arrowResult) {
    tongan.push({ type: 'text', value: ' ' })
    tongan.push(...arrowResult.arrow)
    tail = arrowResult.tail
  }
  if (tail.length === 0) return null

  const firstText = firstTextStart(tail)
  if (firstText === null) return null
  const kind = classifyTrailing(firstText)
  if (kind !== 'capital' && kind !== 'paren') return null
  // For paragraph-level splits (outside table cells), a parenthetical with
  // lowercase content is a pronunciation hint or grammatical aside rather
  // than a translation — e.g. "(stress: na-'a-ku kai)". Leave inline.
  if (kind === 'paren' && parenIsAnnotation(firstText)) return null

  return {
    type: 'paragraph',
    data: {
      hName: 'div',
      hProperties: { className: ['example-pair'] },
    },
    children: [
      {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['example-tongan'] },
        },
        children: tongan,
      },
      {
        type: 'paragraph',
        data: {
          hName: 'div',
          hProperties: { className: ['example-english'] },
        },
        children: tail,
      },
    ],
  }
}

const ARROW_CHARS = new Set(['↗', '↘'])

// If the next non-whitespace text starts with an intonation arrow (↗ ↘),
// peel it off (along with any `=` connector that follows) and return both
// the arrow inlines and the remaining tail. Returns null if there's no
// arrow.
function consumeLeadingArrow(tail) {
  if (tail.length === 0) return null
  const first = tail[0]
  if (first.type !== 'text') return null
  const match = first.value.match(/^([↗↘])\s*(=\s*)?(.*)$/s)
  if (!match) return null
  const [, arrowChar, , rest] = match
  if (!ARROW_CHARS.has(arrowChar)) return null
  const arrow = [{ type: 'text', value: arrowChar }]
  const newTail = []
  if (rest && rest.length > 0) {
    newTail.push({ ...first, value: rest })
  }
  newTail.push(...tail.slice(1))
  return { arrow, tail: stripLeadingWhitespaceInlines(newTail) }
}

function trimEdges(nodes) {
  const out = [...nodes]
  while (out.length > 0 && out[0].type === 'text' && out[0].value.trimStart() !== out[0].value) {
    out[0] = { ...out[0], value: out[0].value.trimStart() }
    if (out[0].value === '') out.shift()
    else break
  }
  while (
    out.length > 0 &&
    out[out.length - 1].type === 'text' &&
    out[out.length - 1].value.trimEnd() !== out[out.length - 1].value
  ) {
    const last = out[out.length - 1]
    const trimmed = last.value.trimEnd()
    if (trimmed === '') out.pop()
    else {
      out[out.length - 1] = { ...last, value: trimmed }
      break
    }
  }
  return out
}

function wrap(childGroups, classes) {
  return {
    type: 'paragraph',
    data: {
      hName: 'div',
      hProperties: { className: ['example-pair'] },
    },
    children: childGroups.map((kids, i) => ({
      type: 'paragraph',
      data: {
        hName: 'div',
        hProperties: { className: [classes[i] || 'example-tongan'] },
      },
      children: kids,
    })),
  }
}
