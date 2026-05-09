import { visit } from 'unist-util-visit'

const EMDASH = '\u2014'

export default function remarkExamples() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'containerDirective' && node.name === 'examples') {
        transformExamplesContainer(node)
        return
      }
      if (node.type === 'tableCell') {
        transformTableCell(node)
      }
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
    newChildren.push(splitParagraphOnEmDash(child))
  }
  node.children = newChildren
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

  let emphCount = 0
  let emphIdx = -1
  let firstMeaningfulIdx = -1
  for (let i = 0; i < kids.length; i++) {
    const k = kids[i]
    if (k.type === 'emphasis') {
      emphCount += 1
      if (emphIdx === -1) emphIdx = i
    }
    if (firstMeaningfulIdx === -1 && !isBlankText(k)) {
      firstMeaningfulIdx = i
    }
  }
  if (emphCount !== 1) return
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
