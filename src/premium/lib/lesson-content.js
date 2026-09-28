import { unified } from 'unified'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkDirective)
// Recognise the inherited book delimiter; this character is not UI copy.
const SOURCE_EM_DASH = '\u2014'

function textOf(node) {
  if (!node) return ''
  if (typeof node.value === 'string') return node.value
  return (node.children || []).map(textOf).join('')
}

function inlineMarkdown(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value
  if (node.type === 'emphasis') return `*${node.children.map(inlineMarkdown).join('')}*`
  if (node.type === 'strong') return `**${node.children.map(inlineMarkdown).join('')}**`
  if (node.type === 'delete') return `~~${node.children.map(inlineMarkdown).join('')}~~`
  if (node.type === 'inlineCode') return `\`${node.value}\``
  if (node.type === 'link') return `[${node.children.map(inlineMarkdown).join('')}](${node.url})`
  // remark-directive reads the minute portion of bare times such as 8:15 as
  // a text directive. Reconstruct the literal source text for display.
  if (node.type === 'textDirective') return `:${node.name}${(node.children || []).map(inlineMarkdown).join('')}`
  if (node.type === 'break') return '\n'
  if (node.type === 'html') return node.value
  return (node.children || []).map(inlineMarkdown).join('')
}

function childrenMarkdown(node) {
  return (node.children || []).map(inlineMarkdown).join('')
}

function isBlankText(node) {
  return node.type === 'text' && /^\s*$/.test(node.value)
}

// Match production remark-examples: only soft newlines inside text nodes split
// a Markdown paragraph. Hard breaks remain inline content.
function splitParagraphOnNewlines(paragraph) {
  const children = paragraph.children || []
  if (!children.some(child => child.type === 'text' && child.value.includes('\n'))) return [paragraph]

  const groups = [[]]
  for (const child of children) {
    if (child.type !== 'text' || !child.value.includes('\n')) {
      groups.at(-1).push(child)
      continue
    }
    const parts = child.value.split('\n')
    parts.forEach((part, index) => {
      if (part) groups.at(-1).push({ ...child, value: part })
      if (index < parts.length - 1) groups.push([])
    })
  }
  return groups.filter(group => group.length).map(children => ({ ...paragraph, children }))
}

function stripLeadingWhitespace(nodes) {
  const out = [...nodes]
  while (out.length) {
    const first = out[0]
    if (first.type !== 'text') break
    const trimmed = first.value.replace(/^\s+/, '')
    if (!trimmed) {
      out.shift()
      continue
    }
    if (trimmed !== first.value) out[0] = { ...first, value: trimmed }
    break
  }
  return out
}

function trimEdges(nodes) {
  const out = stripLeadingWhitespace(nodes)
  while (out.length && out.at(-1).type === 'text') {
    const trimmed = out.at(-1).value.trimEnd()
    if (!trimmed) out.pop()
    else {
      if (trimmed !== out.at(-1).value) out[out.length - 1] = { ...out.at(-1), value: trimmed }
      break
    }
  }
  return out
}

const nodesMarkdown = nodes => nodes.map(inlineMarkdown).join('')
const firstTextStart = nodes => nodes[0]?.type === 'text' && nodes[0].value ? nodes[0].value : null

function classifyTrailing(text) {
  if (text.startsWith(SOURCE_EM_DASH)) return 'emdash'
  if (/^[A-Z]/.test(text)) return 'capital'
  if (text.startsWith('(')) return 'paren'
  return null
}

function parenIsAnnotation(text) {
  return text.startsWith('(') && text[1] && !/[A-Z]/.test(text[1])
}

function consumeLeadingArrow(nodes) {
  const first = nodes[0]
  if (first?.type !== 'text') return null
  const match = first.value.match(/^([↗↘])\s*(=\s*)?(.*)$/s)
  if (!match) return null
  const tail = []
  if (match[3]) tail.push({ ...first, value: match[3] })
  tail.push(...nodes.slice(1))
  return { arrow: `${match[1]}${match[2] ? ' =' : ''}`, tail: stripLeadingWhitespace(tail) }
}

// Production only recognises a standalone compact pair when the first
// meaningful inline is emphasis and the translation begins with a capital or
// a non-annotation parenthesis. An intonation arrow stays with the Tongan.
function compactPair(paragraph) {
  const children = paragraph.children || []
  const firstMeaningful = children.findIndex(child => !isBlankText(child))
  if (firstMeaningful < 0 || children[firstMeaningful].type !== 'emphasis') return null

  const emphasis = children[firstMeaningful]
  let tail = stripLeadingWhitespace(children.slice(firstMeaningful + 1))
  if (!tail.length) return null
  let arrow = ''
  const consumed = consumeLeadingArrow(tail)
  if (consumed) {
    arrow = ` ${consumed.arrow}`
    tail = consumed.tail
  }
  if (!tail.length) return null

  const firstText = firstTextStart(tail)
  if (firstText === null) return null
  const kind = classifyTrailing(firstText)
  if (kind !== 'capital' && kind !== 'paren') return null
  if (kind === 'paren' && parenIsAnnotation(firstText)) return null

  return {
    tongan: `${plainInline(nodesMarkdown(emphasis.children || []))}${arrow}`,
    english: nodesMarkdown(tail).trim(),
  }
}

function emDashPair(paragraph) {
  const children = paragraph.children || []
  const splitIndex = children.findIndex(child => child.type === 'text' && child.value.includes(SOURCE_EM_DASH))
  if (splitIndex < 0) return null

  const splitNode = children[splitIndex]
  const dashIndex = splitNode.value.indexOf(SOURCE_EM_DASH)
  const before = splitNode.value.slice(0, dashIndex)
  const after = splitNode.value.slice(dashIndex + 1)
  const tongan = [...children.slice(0, splitIndex)]
  const english = []
  if (before.trim()) tongan.push({ ...splitNode, value: before })
  if (after.trim()) english.push({ ...splitNode, value: after })
  english.push(...children.slice(splitIndex + 1))

  return {
    tongan: plainInline(nodesMarkdown(trimEdges(tongan))),
    english: nodesMarkdown(trimEdges(english)),
  }
}

function paragraphBlocks(node) {
  return splitParagraphOnNewlines(node).map(line => {
    const pair = compactPair(line)
    return pair
      ? { type: 'pairs', pairs: [pair] }
      : { type: 'p', text: childrenMarkdown(line).trim() }
  })
}

function examplePair(line) {
  const pair = emDashPair(line) || compactPair(line)
  if (pair) return pair
  return { tongan: null, english: '', line: childrenMarkdown(line).trim() }
}

function listItems(node) {
  return node.children.map(item => {
    const own = item.children.filter(child => child.type !== 'list')
    const nested = item.children.filter(child => child.type === 'list')
    return {
      text: own.map(child => childrenMarkdown(child)).join(' ').trim(),
      children: nested.map(list => ({ ordered: Boolean(list.ordered), items: listItems(list) })),
    }
  })
}

function nodeBlock(node) {
  if (node.type === 'paragraph') return paragraphBlocks(node)
  if (node.type === 'thematicBreak') return { type: 'hr' }
  if (node.type === 'containerDirective' && node.name === 'examples') {
    return {
      type: 'examples',
      pairs: node.children
        .filter(child => child.type === 'paragraph')
        .flatMap(splitParagraphOnNewlines)
        .map(examplePair),
    }
  }
  if (node.type === 'table') {
    const rows = node.children.map(row => row.children.map(cell => childrenMarkdown(cell).trim()))
    return { type: 'table', head: rows[0] || [], body: rows.slice(1) }
  }
  if (node.type === 'blockquote') {
    const raw = node.children.map(child => childrenMarkdown(child)).join(' ').trim()
    const match = raw.match(/^\*{1,2}([^*]+?):\*{1,2}\s*([\s\S]*)$/)
    return { type: 'note', label: match ? match[1] : null, text: match ? match[2] : raw }
  }
  if (node.type === 'list') return { type: 'list', ordered: Boolean(node.ordered), items: listItems(node) }
  return null
}

function normalizeExamples(md) {
  return md.replace(/^:::\s*\{\.examples\}\s*$/gm, ':::examples')
}

export function parseLessonContent(md, {
  chapter = null,
  quickPractices = [],
  drillAnchors = [],
  slugify,
} = {}) {
  if (typeof slugify !== 'function') throw new TypeError('parseLessonContent requires the production slugify function')
  const tree = parser.parse(normalizeExamples(md.replace(/\r/g, '')))
  const nodes = tree.children
  const titleNode = nodes.find(node => node.type === 'heading' && node.depth === 1)
  const title = titleNode ? textOf(titleNode).replace(/^Lesson \d+:\s*/, '').trim() : ''
  const blocks = []
  const intro = []
  let started = false
  let quickIndex = 0
  let activeHeadingSlug = null

  const appendDrills = () => {
    if (!activeHeadingSlug) return
    for (const entry of drillAnchors.filter(anchor => anchor.after === activeHeadingSlug)) {
      blocks.push({ type: 'drill', drillId: entry.drillId, chapterNum: chapter, after: entry.after })
    }
  }

  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node.type === 'heading' && node.depth === 1) continue
    if (node.type === 'heading' && node.depth === 3 && /^(Exercises|Answers)$/i.test(textOf(node).trim())) {
      appendDrills()
      blocks.push({ type: 'exercises-slot' })
      break
    }
    if (node.type === 'heading' && node.depth === 3) {
      appendDrills()
      const headingText = childrenMarkdown(node).trim()
      activeHeadingSlug = slugify(textOf(node))
      if (/^Quick Practice\b/i.test(textOf(node).trim())) {
        blocks.push({ type: 'quick-practice', index: quickIndex, chapterNum: chapter, id: activeHeadingSlug })
        quickIndex += 1
        while (index + 1 < nodes.length && nodes[index + 1].type !== 'heading' && nodes[index + 1].type !== 'thematicBreak') index += 1
        if (nodes[index + 1]?.type === 'thematicBreak') index += 1
        continue
      }
      blocks.push({ type: 'h2', text: headingText, id: activeHeadingSlug })
      started = true
      continue
    }
    if (node.type === 'heading' && node.depth === 4) {
      const headingText = childrenMarkdown(node).trim()
      blocks.push({ type: 'h3', text: headingText, id: slugify(textOf(node)) })
      continue
    }
    const parsed = nodeBlock(node)
    if (!parsed) continue
    const output = Array.isArray(parsed) ? parsed : [parsed]
    if (started) blocks.push(...output)
    else intro.push(...output)
  }

  if (!blocks.some(block => block.type === 'exercises-slot')) {
    appendDrills()
    blocks.push({ type: 'exercises-slot' })
  }

  if (quickIndex !== quickPractices.length) {
    throw new Error(`Lesson ${chapter}: found ${quickIndex} Quick Practice ranges but data contains ${quickPractices.length}`)
  }
  const placed = blocks.filter(block => block.type === 'drill')
  if (placed.length !== drillAnchors.length) {
    const missing = drillAnchors.filter(anchor => !placed.some(block => block.drillId === anchor.drillId && block.after === anchor.after))
    throw new Error(`Lesson ${chapter}: unresolved drill anchors ${missing.map(anchor => `${anchor.drillId}@${anchor.after}`).join(', ')}`)
  }

  return { chapter, title, intro, blocks, quickPracticeCount: quickIndex, drillCount: placed.length }
}

export function plainInline(text) {
  return String(text ?? '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/?span(?:\s+[^>]*)?>/gi, '')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[*_~`\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inlineToken(node) {
  const children = (node.children || []).flatMap(inlineToken)
  if (node.type === 'text') return [{ t: 'text', v: node.value }]
  if (node.type === 'strong') return [{ t: 'bold', children }]
  if (node.type === 'emphasis') return [{ t: 'em', children }]
  if (node.type === 'delete') return [{ t: 'del', children }]
  if (node.type === 'inlineCode') return [{ t: 'code', v: node.value }]
  if (node.type === 'link') return [{ t: 'link', href: node.url, children }]
  if (node.type === 'break') return [{ t: 'text', v: '\n' }]
  if (node.type === 'textDirective') return [{ t: 'text', v: `:${node.name}${children.map(token => token.v || '').join('')}` }]
  if (node.type === 'html') return [{ t: 'text', v: node.value }]
  return children
}

export function parseInlineTokens(text) {
  // Sentinels keep leading +, -, >, and # characters in inline content from
  // being interpreted as block Markdown. Remove them after parsing.
  const prefix = 'INLINESTART '
  const suffix = ' INLINEEND'
  const tree = parser.parse(`${prefix}${String(text ?? '')}${suffix}`)
  const tokens = tree.children.flatMap(inlineToken)
  const textTokens = []
  const collect = token => {
    if (typeof token.v === 'string') textTokens.push(token)
    ;(token.children || []).forEach(collect)
  }
  tokens.forEach(collect)
  if (textTokens.length) {
    textTokens[0].v = textTokens[0].v.slice(prefix.length)
    const last = textTokens.at(-1)
    last.v = last.v.slice(0, -suffix.length)
  }
  return tokens
}
